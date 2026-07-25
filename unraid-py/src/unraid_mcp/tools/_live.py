"""Live (subscriptions) domain handler for the Unraid MCP tool.

Covers: cpu, memory, cpu_telemetry, array_state, parity_progress, ups_status,
notifications_overview, notifications_warnings, notification_feed, log_tail, owner,
server_status, docker_container_stats, temperature, network_metrics, display,
plugin_install_updates (17 subactions).
"""

from typing import Any

from ..config.logging import logger
from ..config.settings import (
    UNRAID_MCP_MAX_RESPONSE_BYTES,
    UNRAID_SUBSCRIPTION_COLLECT_MAX_BYTES,
    UNRAID_SUBSCRIPTION_COLLECT_MAX_EVENTS,
    UNRAID_SUBSCRIPTION_COLLECT_MAX_SECONDS,
    UNRAID_SUBSCRIPTION_TIMEOUT_MAX_SECONDS,
)
from ..core.exceptions import ToolError, tool_error_handler
from ..core.pagination import cap_list
from ._disk import _ALLOWED_LOG_PREFIXES, _validate_path


# ===========================================================================
# LIVE (subscriptions)
# ===========================================================================

# Byte budget for the collected-event lists (log_tail / notification_feed).
# Each event can be large (multi-KB log ``content``), so bounding item *count*
# alone (cap_list's primary cap) is not enough — a few huge events can still trip
# the response-size backstop, which discards the ENTIRE response. We derive a
# conservative ceiling from the response cap (half of it) so the surrounding
# wrapper fields (success/subaction/path/page/...) plus JSON escaping comfortably
# fit under the hard cap with margin to spare.
_LIVE_EVENT_BYTE_BUDGET: int = max(1, UNRAID_MCP_MAX_RESPONSE_BYTES // 2)


def _cache_metadata(snapshot: Any) -> dict[str, Any]:
    return {
        "fetched_at": snapshot.fetched_at,
        "age_seconds": snapshot.age_seconds,
        "state": snapshot.connection_state,
        "fresh": snapshot.fresh,
        "stale": snapshot.stale,
    }


def _preserve_collection_truncation(
    events: list[dict[str, Any]], page: dict[str, Any]
) -> dict[str, Any]:
    """Merge the collector's pre-pagination cap into truthful page metadata."""
    reason = getattr(events, "truncation_reason", None)
    if reason is None:
        return page
    minimum_total = len(events) + 1  # the collector observed the dropped event
    return {
        **page,
        "total": max(page["total"], minimum_total),
        "truncated": True,
        "total_is_lower_bound": True,
        "runtime_truncation_reason": reason,
    }


def _cap_network_metrics(
    data: dict[str, Any], limit: int | None
) -> tuple[dict[str, Any], dict[str, Any]]:
    """Cap the per-interface list in a ``systemMetricsNetwork`` snapshot payload.

    ``systemMetricsNetwork`` moved from a single object to one entry per network
    interface upstream — cap it the same way every other list subaction is
    capped (``cap_list``) so a heavily virtualized/VLAN-heavy host can't return
    an unbounded interface list through the live snapshot path.
    """
    network = data.get("systemMetricsNetwork")
    if not isinstance(network, list):
        return data, {"returned": 0, "total": 0, "truncated": False}
    capped, meta = cap_list(network, limit)
    return {**data, "systemMetricsNetwork": capped}, meta


def _filter_log_event(event: dict[str, Any], level: str, context: int) -> dict[str, Any]:
    """Apply severity/context filtering to a single log_tail event's content.

    Each event is shaped ``{"logFile": {"content": "...", ...}}``. The ``content``
    field is a newline-joined block of log lines. Returns a shallow-copied event
    with the filtered content, a ``matchedLines`` count (lines that actually
    matched the severity filter) and a ``returnedLines`` count (real log lines
    returned including context, excluding ``"---"`` separators). Events lacking a
    string ``content`` are returned unchanged.
    """
    from ..core.utils import count_log_matches, filter_log_lines

    log_file = event.get("logFile")
    if not isinstance(log_file, dict):
        return event
    if "matchedLines" in log_file and "returnedLines" in log_file:
        return event
    content = log_file.get("content")
    if not isinstance(content, str):
        return event

    lines = content.split("\n")
    filtered = filter_log_lines(lines, level=level, context=context)
    new_log_file = {
        **log_file,
        "content": "\n".join(filtered),
        "matchedLines": count_log_matches(lines, level=level),
        "returnedLines": sum(1 for line in filtered if line != "---"),
    }
    return {**event, "logFile": new_log_file}


async def _handle_live(
    subaction: str,
    path: str | None,
    collect_for: float,
    timeout: float,  # noqa: ASYNC109
    level: str | None = None,
    context: int = 2,
    limit: int | None = None,
    operation_id: str | None = None,
) -> dict[str, Any]:
    # IMPORTANT: Every key in COLLECT_ACTIONS must have an explicit handler in _handle_live below.
    # Adding to COLLECT_ACTIONS without updating this function causes a ToolError at runtime.
    from ..core.utils import validate_subaction
    from ..subscriptions.manager import subscription_manager
    from ..subscriptions.queries import COLLECT_ACTIONS, EVENT_DRIVEN_ACTIONS, SNAPSHOT_ACTIONS
    from ..subscriptions.snapshot import subscribe_collect, subscribe_once

    all_live = set(SNAPSHOT_ACTIONS) | set(COLLECT_ACTIONS)
    validate_subaction(subaction, all_live, "live")

    if not 0 < timeout <= UNRAID_SUBSCRIPTION_TIMEOUT_MAX_SECONDS:
        raise ToolError(
            "timeout must be greater than 0 and no more than "
            f"{UNRAID_SUBSCRIPTION_TIMEOUT_MAX_SECONDS:g} seconds"
        )

    if subaction in COLLECT_ACTIONS and not (
        0 < collect_for <= UNRAID_SUBSCRIPTION_COLLECT_MAX_SECONDS
    ):
        raise ToolError(
            "collect_for must be greater than 0 and no more than "
            f"{UNRAID_SUBSCRIPTION_COLLECT_MAX_SECONDS:g} seconds"
        )

    collection_max_events = (
        min(limit, UNRAID_SUBSCRIPTION_COLLECT_MAX_EVENTS)
        if limit is not None and limit > 0
        else UNRAID_SUBSCRIPTION_COLLECT_MAX_EVENTS
    )
    collection_max_bytes = min(UNRAID_SUBSCRIPTION_COLLECT_MAX_BYTES, _LIVE_EVENT_BYTE_BUDGET)

    if subaction == "log_tail":
        if not path:
            raise ToolError("path is required for live/log_tail")
        path = _validate_path(path, _ALLOWED_LOG_PREFIXES, "path")

    with tool_error_handler("live", subaction, logger):
        logger.info(f"Executing unraid action=live subaction={subaction} timeout={timeout}")

        if subaction in SNAPSHOT_ACTIONS:
            # Warm-cache fast path: when the persistent SubscriptionManager is
            # auto-starting subscriptions, a long-lived WebSocket for this snapshot
            # subaction is already holding fresh data. The snapshot subaction name
            # is identical to the manager's subscription name (both come from
            # SNAPSHOT_ACTIONS keys — see manager.subscription_configs), so we can
            # serve the cached resource data directly and skip the full per-call WS
            # handshake. Falls through to the live path below when the cache is cold
            # (None) or auto-start is disabled.
            if subscription_manager.auto_start_enabled:
                snapshot = await subscription_manager.get_resource_snapshot(subaction)
                if snapshot.data is not None:
                    cached = snapshot.data
                    logger.debug(
                        "live/%s served from warm subscription cache (skipped fresh WS)",
                        subaction,
                    )
                    if subaction == "network_metrics":
                        capped_data, page = _cap_network_metrics(cached, limit)
                        return {
                            "success": True,
                            "subaction": subaction,
                            "source": "cache",
                            "data": capped_data,
                            "cache": _cache_metadata(snapshot),
                            "page": page,
                        }
                    return {
                        "success": True,
                        "subaction": subaction,
                        "source": "cache",
                        "data": cached,
                        "cache": _cache_metadata(snapshot),
                    }

            if subaction in EVENT_DRIVEN_ACTIONS:
                try:
                    data = await subscribe_once(SNAPSHOT_ACTIONS[subaction], timeout=timeout)
                except ToolError as e:
                    if "timed out" in str(e):
                        return {
                            "success": True,
                            "subaction": subaction,
                            "status": "no_recent_events",
                            "message": f"No events received in {timeout:.0f}s — this subscription only emits on state changes",
                        }
                    raise
            else:
                data = await subscribe_once(SNAPSHOT_ACTIONS[subaction], timeout=timeout)
            if subaction == "network_metrics":
                capped_data, page = _cap_network_metrics(data, limit)
                return {
                    "success": True,
                    "subaction": subaction,
                    "source": "live",
                    "data": capped_data,
                    "page": page,
                }
            return {"success": True, "subaction": subaction, "source": "live", "data": data}

        if subaction == "log_tail":
            collected_events = await subscribe_collect(
                COLLECT_ACTIONS["log_tail"],
                variables={"path": path},
                collect_for=collect_for,
                timeout=timeout,
                max_events=collection_max_events,
                max_bytes=collection_max_bytes,
                transform=(
                    (lambda event: _filter_log_event(event, level, context))
                    if level is not None
                    else None
                ),
            )
            events: list[dict[str, Any]] = collected_events
            if level is not None:
                # Defensive/idempotent fallback for alternate collectors and
                # tests; the production collector applies this before retention.
                events = [_filter_log_event(e, level, context) for e in events]
            # Hard-cap the number of collected events so a noisy log over the
            # window can't flood the agent's context. The byte budget additionally
            # stops a few multi-KB log events from tripping the response backstop.
            capped, meta = cap_list(events, limit, byte_budget=_LIVE_EVENT_BYTE_BUDGET)
            meta = _preserve_collection_truncation(collected_events, meta)
            return {
                "success": True,
                "subaction": subaction,
                "path": path,
                "collect_for": collect_for,
                "filter": {"level": level, "context": context} if level is not None else None,
                "event_count": len(capped),
                "events": capped,
                "page": meta,
            }

        if subaction in ("notification_feed", "plugin_install_updates"):
            # pluginInstallUpdates(operationId: ID!) requires the operation id;
            # notification_feed takes no variables.
            variables: dict[str, Any] | None = None
            if subaction == "plugin_install_updates":
                if not operation_id:
                    raise ToolError("operation_id is required for live/plugin_install_updates")
                variables = {"operationId": operation_id}
            events = await subscribe_collect(
                COLLECT_ACTIONS[subaction],
                variables=variables,
                collect_for=collect_for,
                timeout=timeout,
                max_events=collection_max_events,
                max_bytes=collection_max_bytes,
            )
            # Hard-cap the number of collected events (see log_tail above), plus
            # the byte budget so large events can't nuke the whole response.
            capped, meta = cap_list(events, limit, byte_budget=_LIVE_EVENT_BYTE_BUDGET)
            meta = _preserve_collection_truncation(events, meta)
            return {
                "success": True,
                "subaction": subaction,
                "collect_for": collect_for,
                "event_count": len(capped),
                "events": capped,
                "page": meta,
            }

        raise ToolError(f"Unhandled live subaction '{subaction}' — this is a bug")
