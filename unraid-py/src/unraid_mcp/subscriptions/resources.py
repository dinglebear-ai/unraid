"""MCP resources that expose subscription data.

This module defines MCP resources that bridge between the subscription manager
and the MCP protocol, providing fallback queries when subscription data is unavailable.
"""

import asyncio
import json
from collections.abc import Callable, Coroutine
from typing import Any, Final

import anyio
from fastmcp import FastMCP

from ..config import settings as _settings
from ..config.logging import logger
from .manager import subscription_manager
from .queries import SNAPSHOT_ACTIONS
from .snapshot import subscribe_once


# Global flag to track subscription startup
_subscriptions_started = False
# Most recent autostart failure (repr), or None if the last attempt succeeded.
# Surfaced via get_last_startup_error() so a failed startup is observable instead
# of silently swallowed (C1).
_last_startup_error: str | None = None
_startup_lock: Final[asyncio.Lock] = asyncio.Lock()

_terminal_states = frozenset({"failed", "auth_failed", "max_retries_exceeded"})


def _snapshot_metadata(snapshot: Any) -> dict[str, Any]:
    """Stable cache-state metadata included with resource payloads."""
    return {
        "state": snapshot.connection_state,
        "active": snapshot.active,
        "fresh": snapshot.fresh,
        "stale": snapshot.stale,
        "age_seconds": snapshot.age_seconds,
    }


def get_last_startup_error() -> str | None:
    """Return the most recent autostart failure (repr), or None if it succeeded."""
    return _last_startup_error


async def ensure_subscriptions_started() -> None:
    """Ensure subscriptions are started, called from async context.

    Autostart is attempted at most once on success. On failure the
    ``_subscriptions_started`` flag is latched **only if at least one subscription
    loop was actually spawned**: those loops handle their own reconnection/backoff,
    so re-running the full fan-out on every call (the backend-down case) would only
    stampede WebSocket connects (PERF-H1). If autostart fails *before* spawning any
    loop (a config/programming error, never a transient outage — the pre-spawn path
    is pure in-memory), the flag is left unset so a later call can retry rather than
    bricking the live resources until a restart. Either way the failure is recorded
    in ``_last_startup_error`` and surfaced via diagnose / the live resources rather
    than swallowed (C1).
    """
    global _subscriptions_started, _last_startup_error

    # Fast-path: skip lock if already started
    if _subscriptions_started:
        return

    # Slow-path: acquire lock for initialization (double-checked locking)
    async with _startup_lock:
        if _subscriptions_started:
            return

        logger.info("[STARTUP] First async operation detected, starting subscriptions...")
        try:
            await autostart_subscriptions()
        except asyncio.CancelledError:
            # Shutdown in progress — do NOT latch; let cancellation propagate so a
            # later (post-restart) call can retry.
            raise
        except Exception as e:
            _last_startup_error = repr(e)
            # Latch only if loops were spawned (they self-heal via reconnect). If none
            # were spawned, leave the flag unset so a later call retries instead of
            # permanently surfacing the error for the process lifetime.
            spawned = await subscription_manager.has_active_subscriptions()
            _subscriptions_started = spawned
            logger.error(
                "[STARTUP] Failed to start subscriptions (loops spawned=%s): %s",
                spawned,
                e,
                exc_info=True,
            )
        else:
            _last_startup_error = None
            _subscriptions_started = True
            logger.info("[STARTUP] Subscriptions started successfully")


async def autostart_subscriptions() -> None:
    """Auto-start all subscriptions marked for auto-start in SubscriptionManager."""
    logger.info("[AUTOSTART] Initiating subscription auto-start process...")

    try:
        # Use the SubscriptionManager auto-start method
        await subscription_manager.auto_start_all_subscriptions()
        logger.info("[AUTOSTART] Auto-start process completed successfully")
    except Exception as e:
        logger.error(f"[AUTOSTART] Failed during auto-start process: {e}", exc_info=True)
        raise  # Propagate so ensure_subscriptions_started doesn't mark as started

    # Optional log file subscription
    log_path = _settings.UNRAID_AUTOSTART_LOG_PATH
    if log_path is None:
        # Default to syslog if available
        default_path = "/var/log/syslog"
        if await anyio.Path(default_path).exists():
            log_path = default_path
            logger.info(f"[AUTOSTART] Using default log path: {default_path}")

    if log_path:
        try:
            logger.info(f"[AUTOSTART] Starting log file subscription for: {log_path}")
            query = subscription_manager.get_subscription_query("logFileSubscription")
            if query:
                await subscription_manager.start_subscription(
                    "logFileSubscription", query, {"path": log_path}
                )
                logger.info(f"[AUTOSTART] Log file subscription started for: {log_path}")
            else:
                logger.error("[AUTOSTART] logFileSubscription config not found")
        except Exception as e:
            logger.error(f"[AUTOSTART] Failed to start log file subscription: {e}", exc_info=True)
    else:
        logger.info("[AUTOSTART] No log file path configured for auto-start")


def _apply_startup_error(base: dict[str, Any], subject: str) -> dict[str, Any]:
    """Overlay the autostart failure onto a fallback/placeholder payload, if any.

    Returns ``base`` unchanged when autostart succeeded. ``subject`` is the leading
    clause of the surfaced message (e.g. "Subscription autostart failed" or
    "Subscription 'cpu' unavailable: autostart failed").
    """
    if _last_startup_error is None:
        return base
    return {
        **base,
        "status": "error",
        "startup_error": _last_startup_error,
        "message": f"{subject} ({_last_startup_error}). Check server logs.",
    }


def register_subscription_resources(mcp: FastMCP) -> None:
    """Register all subscription resources with the FastMCP instance.

    Args:
        mcp: FastMCP instance to register resources with
    """

    @mcp.resource("unraid://logs/stream")
    async def logs_stream_resource() -> str:
        """Real-time log stream data from subscription."""
        await ensure_subscriptions_started()
        snapshot = await subscription_manager.get_resource_snapshot("logFileSubscription")
        if snapshot.data is not None:
            return json.dumps(
                {
                    **snapshot.data,
                    "_fetched_at": snapshot.fetched_at,
                    "_subscription": _snapshot_metadata(snapshot),
                },
                indent=2,
            )
        fallback: dict[str, Any] = {
            "status": "No subscription data yet",
            "message": "Subscriptions auto-start on server boot. If this persists, check server logs for WebSocket/auth issues.",
        }
        return json.dumps(_apply_startup_error(fallback, "Subscription autostart failed"), indent=2)

    def _make_resource_fn(action: str) -> Callable[[], Coroutine[Any, Any, str]]:
        async def _live_resource() -> str:
            await ensure_subscriptions_started()
            snapshot = await subscription_manager.get_resource_snapshot(action)
            if snapshot.data is not None:
                return json.dumps(
                    {
                        **snapshot.data,
                        "_fetched_at": snapshot.fetched_at,
                        "_subscription": _snapshot_metadata(snapshot),
                    },
                    indent=2,
                )
            # Surface permanent errors only when the connection is in a terminal failure
            # state — if the subscription has since reconnected, ignore the stale error.
            # Use the public get_error_state() accessor so we never touch private
            # lock attributes from outside the manager.
            if snapshot.last_error and snapshot.connection_state in _terminal_states:
                return json.dumps(
                    {
                        "status": "error",
                        "message": f"Subscription '{action}' failed: {snapshot.last_error}",
                    }
                )
            # When auto-start is disabled, or an action is deliberately excluded
            # from auto-start, fall back to a one-shot fetch so the resource returns
            # real data or a real upstream error instead of a perpetual
            # "connecting" placeholder.
            query_info = SNAPSHOT_ACTIONS[action]
            use_on_demand = (
                not subscription_manager.auto_start_enabled
                or not subscription_manager.is_auto_start_subscription(action)
                or snapshot.stale
            )
            if use_on_demand:
                try:
                    fallback_data = await subscribe_once(query_info)
                    return json.dumps(fallback_data, indent=2)
                except Exception as e:
                    logger.warning("[RESOURCE] On-demand fallback for '%s' failed: %s", action, e)
                    return json.dumps(
                        {
                            "status": "error",
                            "message": f"Subscription '{action}' on-demand fetch failed: {e}",
                        },
                        indent=2,
                    )
            # Autostart failure is surfaced here instead of a perpetual "connecting"
            # placeholder that would hide the dead feature (C1).
            placeholder: dict[str, Any] = {
                "status": "connecting",
                "message": f"Subscription '{action}' is starting. Retry in a moment.",
            }
            return json.dumps(
                _apply_startup_error(
                    placeholder, f"Subscription '{action}' unavailable: autostart failed"
                ),
                indent=2,
            )

        _live_resource.__name__ = f"{action}_resource"
        _live_resource.__doc__ = (
            f"Real-time {action.replace('_', ' ')} data via WebSocket subscription."
        )
        return _live_resource

    for _action in SNAPSHOT_ACTIONS:
        mcp.resource(f"unraid://live/{_action}")(_make_resource_fn(_action))

    logger.info("Subscription resources registered successfully")
