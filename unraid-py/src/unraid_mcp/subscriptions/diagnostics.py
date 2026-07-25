"""Subscription system troubleshooting and monitoring.

This module provides the diagnostic handlers behind the consolidated `unraid`
tool's `subscriptions` action — WebSocket connection testing, subscription
system monitoring, and detailed status reporting for development and debugging.

The handlers are exposed via :func:`_handle_subscriptions`, which the `unraid`
tool routes ``action="subscriptions"`` to (subactions ``diagnose`` and
``test_query``).
"""

import asyncio
import json
from datetime import UTC, datetime
from typing import Any

from graphql import (
    FieldNode,
    GraphQLError,
    OperationDefinitionNode,
    OperationType,
    parse,
)

from ..config import settings as _settings
from ..config.logging import logger
from ..core.exceptions import ToolError
from ..core.utils import safe_display_url
from .manager import subscription_manager
from .protocol import (
    _WS_FIRST_FRAME_TIMEOUT,
    _WS_OPEN_TIMEOUT,
    _WS_PING_TIMEOUT,
    _WS_PROBE_PING_INTERVAL,
    ProtocolError,
    graphql_ws_session,
)
from .resources import ensure_subscriptions_started, get_last_startup_error
from .utils import (
    analyze_subscription_status,
    build_ws_ssl_context,
    build_ws_url,
)


# Schema field names that appear as the top-level selection of allowed subscriptions.
# These are the actual field names used in queries (e.g. "cpu", "logFile"), NOT the
# operation-level names (e.g. "logFileSubscription"). The validator below enforces
# this allowlist against the *parsed* GraphQL AST — see _validate_subscription_query.
_ALLOWED_SUBSCRIPTION_FIELDS = frozenset(
    {
        "containerStats",
        "cpu",
        "dockerContainerStats",
        "systemMetricsCpu",
        "systemMetricsCpuTelemetry",
        "memory",
        "systemMetricsMemory",
        "array",
        "arraySubscription",
        "parityHistorySubscription",
        "network",
        "docker",
        "systemMetricsTemperature",
        "systemMetricsNetwork",
        "vm",
        "displaySubscription",
        "notificationsOverview",
        "ownerSubscription",
        "serversSubscription",
        "upsUpdates",
        "notificationsWarningsAndAlerts",
        "pluginInstallUpdates",
    }
)

# Env flag (debug only): when truthy, test_query echoes the upstream's raw first
# frame back to the caller. Off by default so the probe never becomes an exfil
# channel for whatever the upstream returns (SEC-M1).
_RAW_PROBE_ENV = "UNRAID_MCP_ENABLE_RAW_SUBSCRIPTION_PROBE"

# Cap the caller-supplied query before parsing. graphql-core's parse() is
# synchronous and roughly linear in input size (~seconds per MB), so an
# unbounded query would stall the event loop (CWE-400). 4096 chars is generous
# for any real single-field subscription.
_MAX_SUBSCRIPTION_QUERY_CHARS = 4096


def _raw_subscription_probe_enabled() -> bool:
    """Whether test_query may echo the raw upstream frame (debug only)."""
    return _settings.UNRAID_MCP_ENABLE_RAW_SUBSCRIPTION_PROBE


def _validate_subscription_query(query: str) -> str:
    """Validate that a subscription query is safe to execute.

    This is the **only** place the server accepts a caller-authored GraphQL
    document, so validation is done on the parsed AST rather than a regex
    (a regex allowlist is bypassable via multi-field, alias, and argument
    smuggling — SEC-H1). The document must:

    * be within the length cap (so an oversized query can't stall the event loop);
    * parse as valid GraphQL;
    * contain exactly one definition, which must be a single ``subscription``
      operation (no extra/orphan fragment definitions, no query/mutation);
    * select exactly one top-level field, whose **real** name (alias resolved)
      is in :data:`_ALLOWED_SUBSCRIPTION_FIELDS`.

    Returns:
        The validated top-level field name (e.g. "cpu").

    Raises:
        ToolError: If the query fails validation.
    """
    if len(query) > _MAX_SUBSCRIPTION_QUERY_CHARS:
        raise ToolError(
            f"Query rejected: exceeds the maximum length "
            f"({_MAX_SUBSCRIPTION_QUERY_CHARS} characters)."
        )

    try:
        document = parse(query)
    except GraphQLError as exc:
        raise ToolError("Query rejected: not a valid GraphQL document.") from exc

    # Exactly one definition — rejects orphan/extra fragment definitions that would
    # otherwise ride along to the upstream WS unused (the validator's intent is one
    # subscription selecting one field, with no fragments).
    if len(document.definitions) != 1:
        raise ToolError("Query rejected: must contain exactly one subscription operation.")

    operations = [d for d in document.definitions if isinstance(d, OperationDefinitionNode)]
    if len(operations) != 1:
        raise ToolError("Query rejected: must contain exactly one subscription operation.")

    operation = operations[0]
    if operation.operation is not OperationType.SUBSCRIPTION:
        raise ToolError("Query rejected: must be a subscription, not a mutation or query.")

    selections = operation.selection_set.selections
    if len(selections) != 1:
        # Reject multi-field selections outright — the probe tests a single field,
        # and allowing more is exactly the multi-field smuggling vector (SEC-H1).
        raise ToolError(
            "Query rejected: a subscription test must select exactly one top-level field."
        )

    selection = selections[0]
    if not isinstance(selection, FieldNode):
        # Fragment spreads / inline fragments at the top level could smuggle a
        # disallowed field past a name check — only a plain field is permitted.
        raise ToolError(
            "Query rejected: the top-level selection must be a plain field (no fragments)."
        )

    field_name = selection.name.value  # real field name — ignores any alias
    if field_name not in _ALLOWED_SUBSCRIPTION_FIELDS:
        raise ToolError(
            f"Subscription field '{field_name}' is not allowed. "
            f"Allowed fields: {sorted(_ALLOWED_SUBSCRIPTION_FIELDS)}"
        )

    return field_name


async def test_subscription_query(subscription_query: str) -> dict[str, Any]:
    """Test a GraphQL subscription query directly to debug schema issues.

    Use this to find working subscription field names and structure.
    Only schema fields in _ALLOWED_SUBSCRIPTION_FIELDS are permitted.

    Args:
        subscription_query: The GraphQL subscription query to test

    Returns:
        Dict containing test results and response data
    """
    field_name = _validate_subscription_query(subscription_query)

    try:
        logger.info(f"[TEST_SUBSCRIPTION] Testing validated subscription field '{field_name}'")

        try:
            ws_url = build_ws_url()
        except ValueError as e:
            logger.error("[TEST_SUBSCRIPTION] Invalid WebSocket URL configuration: %s", e)
            raise ToolError("Subscription test failed: invalid WebSocket URL configuration.") from e

        ssl_context = build_ws_ssl_context(ws_url)

        # Shared handshake: connect -> connection_init -> connection_ack -> subscribe.
        # ack_timeout=None gives the ack recv() no deadline; the probe uses the slower
        # _WS_PROBE_PING_INTERVAL keepalive cadence (vs the manager's _WS_PING_INTERVAL).
        try:
            async with graphql_ws_session(
                ws_url,
                subscription_query,
                sub_id="test",
                ssl_context=ssl_context,
                open_timeout=_WS_OPEN_TIMEOUT,
                ack_timeout=None,
                ping_interval=_WS_PROBE_PING_INTERVAL,
                ping_timeout=_WS_PING_TIMEOUT,
            ) as session:
                # Wait for the first frame with a timeout. By default the raw frame is
                # withheld (SEC-M1, see below) — only its receipt is reported; set the
                # UNRAID_MCP_ENABLE_RAW_SUBSCRIPTION_PROBE flag to echo the upstream payload.
                try:
                    response = await asyncio.wait_for(
                        session.ws.recv(), timeout=_WS_FIRST_FRAME_TIMEOUT
                    )
                    result = json.loads(response)

                    # Do NOT log or return the raw upstream frame by default — it can
                    # carry sensitive data, and test_query is the one caller-controlled
                    # GraphQL surface (SEC-M1). Echo it only when explicitly enabled.
                    logger.info(
                        "[TEST_SUBSCRIPTION] First frame received for field '%s'", field_name
                    )
                    payload: dict[str, Any] = {
                        "success": True,
                        "first_frame_received": True,
                        "validated_field": field_name,
                        "query_tested": subscription_query,
                        "note": "Connection succeeded and a first frame was received.",
                    }
                    if _raw_subscription_probe_enabled():
                        payload["response"] = result
                    else:
                        payload["response"] = (
                            f"<withheld> set {_RAW_PROBE_ENV}=true to include the raw "
                            "upstream frame (debug only)."
                        )
                    return payload

                except TimeoutError:
                    return {
                        "success": True,
                        "first_frame_received": False,
                        "validated_field": field_name,
                        "response": "No immediate response (subscriptions may only send data on changes)",
                        "query_tested": subscription_query,
                        "note": "Connection successful, subscription may be waiting for events",
                    }
        except ProtocolError as e:
            logger.error("[TEST_SUBSCRIPTION] Connection not acknowledged: %s", e)
            raise ToolError(
                "Subscription test failed: WebSocket connection was not acknowledged."
            ) from e

    except ToolError:
        raise
    except Exception as e:
        logger.error("[TEST_SUBSCRIPTION] Error: %s", e, exc_info=True)
        raise ToolError(
            "Subscription test failed: an unexpected error occurred. Check server logs for details."
        ) from e


async def diagnose_subscriptions() -> dict[str, Any]:
    """Comprehensive diagnostics for the subscription system.

    Shows detailed status, connection states, errors, and troubleshooting info.

    Returns:
        Dict containing comprehensive subscription system diagnostics
    """
    # Ensure subscriptions are started before diagnosing
    await ensure_subscriptions_started()

    try:
        logger.info("[DIAGNOSTIC] Running subscription diagnostics...")

        # Get comprehensive status
        status = await subscription_manager.get_subscription_status()

        # Aggregate counts/config via the manager's locked accessor — never
        # reach into its internal state (active_subscriptions / resource_data /
        # subscription_configs / connection_states) directly (arch-L1).
        summary = await subscription_manager.get_summary()

        # Analyze connection issues and error counts via shared helper.
        # Gates connection_issues on current failure state (Bug 5 fix).
        error_count, connection_issues = analyze_subscription_status(status)

        # Calculate WebSocket URL — apply safe_display_url to avoid leaking
        # credentials (user:pass@host) or the raw API key embedded in the URL.
        ws_url_display: str | None = None
        if _settings.UNRAID_API_URL:
            try:
                ws_url_display = safe_display_url(build_ws_url())
            except ValueError:
                ws_url_display = None

        # Add environment info with explicit typing
        diagnostic_info: dict[str, Any] = {
            "timestamp": datetime.now(UTC).isoformat(),
            "environment": {
                "auto_start_enabled": summary["auto_start_enabled"],
                "max_reconnect_attempts": summary["max_reconnect_attempts"],
                "unraid_api_url": safe_display_url(_settings.UNRAID_API_URL),
                "api_key_configured": bool(_settings.UNRAID_API_KEY),
                "websocket_url": ws_url_display,
                "startup_error": get_last_startup_error(),
            },
            "subscriptions": status,
            "summary": {
                "total_configured": summary["total_configured"],
                "auto_start_count": summary["auto_start_count"],
                "active_count": summary["active_count"],
                "with_data": summary["with_data"],
                "in_error_state": error_count,
                "connection_issues": connection_issues,
            },
        }

        # Add troubleshooting recommendations
        recommendations: list[str] = []

        if not diagnostic_info["environment"]["api_key_configured"]:
            recommendations.append(
                "CRITICAL: No API key configured. Set UNRAID_API_KEY environment variable."
            )

        if diagnostic_info["environment"]["startup_error"] is not None:
            recommendations.append(
                "Subscription autostart failed at startup "
                f"({diagnostic_info['environment']['startup_error']}). Live data may be "
                "unavailable; check server logs for the root cause."
            )

        if diagnostic_info["summary"]["in_error_state"] > 0:
            recommendations.append(
                "Some subscriptions are in error state. Check 'connection_issues' for details."
            )

        if diagnostic_info["summary"]["with_data"] == 0:
            recommendations.append(
                "No subscriptions have received data yet. Check WebSocket connectivity and authentication."
            )

        if (
            diagnostic_info["summary"]["active_count"]
            < diagnostic_info["summary"]["auto_start_count"]
        ):
            recommendations.append(
                "Not all auto-start subscriptions are active. Check server startup logs."
            )

        diagnostic_info["troubleshooting"] = {
            "recommendations": recommendations,
            "log_commands": [
                "Check server logs for [WEBSOCKET:*], [AUTH:*], [SUBSCRIPTION:*] prefixed messages",
                "Look for connection timeout or authentication errors",
                "Verify Unraid API URL is accessible and supports GraphQL subscriptions",
            ],
            "next_steps": [
                "If authentication fails: Verify API key has correct permissions",
                "If connection fails: Check network connectivity to Unraid server",
                "If no data received: Enable DEBUG logging to see detailed protocol messages",
            ],
        }

        logger.info(
            f"[DIAGNOSTIC] Completed. Active: {diagnostic_info['summary']['active_count']}, With data: {diagnostic_info['summary']['with_data']}, Errors: {diagnostic_info['summary']['in_error_state']}"
        )
        return diagnostic_info

    except Exception as e:
        logger.error("[DIAGNOSTIC] Failed to generate diagnostics: %s", e, exc_info=True)
        raise ToolError(
            "Failed to generate diagnostics: an unexpected error occurred. Check server logs for details."
        ) from e


# Subactions exposed via the `unraid` tool's `subscriptions` action.
_SUBSCRIPTIONS_SUBACTIONS: set[str] = {"diagnose", "test_query"}


async def _handle_subscriptions(subaction: str, subscription_query: str | None) -> dict[str, Any]:
    """Route `action="subscriptions"` subactions to their handlers.

    Subactions:
        diagnose    — full diagnostic dump of the WebSocket subscription system.
        test_query  — probe a raw GraphQL subscription (requires subscription_query).
    """
    from ..core.utils import validate_subaction

    validate_subaction(subaction, _SUBSCRIPTIONS_SUBACTIONS, "subscriptions")

    if subaction == "diagnose":
        return await diagnose_subscriptions()

    # test_query
    if not subscription_query:
        raise ToolError(
            "subscription_query is required for subscriptions/test_query. "
            'Example: unraid(action="subscriptions", subaction="test_query", '
            'subscription_query="subscription { cpu { used idle system } }")'
        )
    return await test_subscription_query(subscription_query)
