"""Health domain implementation for the consolidated Unraid MCP tool."""

import datetime
import time
from collections.abc import Callable
from typing import Any

import httpx
from fastmcp import Context

from ..config.logging import logger
from ..core import client as _client
from ..core.exceptions import CredentialsNotConfiguredError, ToolError, tool_error_handler
from ..core.utils import safe_get, validate_subaction
from ._system import _SYSTEM_QUERIES


# Import system online query to avoid duplication — used by setup and test_connection


# ===========================================================================
# HEALTH
# ===========================================================================

_HEALTH_SUBACTIONS: set[str] = {"check", "test_connection", "diagnose", "setup"}
_HEALTH_QUERIES: dict[str, str] = {
    "comprehensive_health": (
        "query ComprehensiveHealthCheck {"
        # machineId intentionally omitted — it's a stable hardware fingerprint
        # (CWE-200) and the health summary doesn't need it.
        " info { time versions { core { unraid } } os { uptime } }"
        " array { state }"
        " notifications { overview { unread { alert warning total } } }"
        " docker { containers { id state status } }"
        " }"
    ),
}
_SEVERITY = {"healthy": 0, "warning": 1, "degraded": 2, "unhealthy": 3}
# Reverse mapping computed once at module load — _SEVERITY is a constant.
_STATUS_FROM_SEVERITY: dict[int, str] = {v: k for k, v in _SEVERITY.items()}


async def _comprehensive_health_check() -> dict[str, Any]:
    from ..config.settings import (
        UNRAID_API_URL,
        UNRAID_MCP_HOST,
        UNRAID_MCP_PORT,
        UNRAID_MCP_TRANSPORT,
        VERSION,
    )
    from ..core.utils import safe_display_url

    start_time = time.time()
    health_severity = 0
    issues: list[str] = []

    def _escalate(level: str) -> None:
        nonlocal health_severity
        health_severity = max(health_severity, _SEVERITY.get(level, 0))

    try:
        data = await _client.make_graphql_request(_HEALTH_QUERIES["comprehensive_health"])
        api_latency = round((time.time() - start_time) * 1000, 2)

        health_info: dict[str, Any] = {
            "status": "healthy",
            "timestamp": datetime.datetime.now(datetime.UTC).isoformat(),
            "api_latency_ms": api_latency,
            "server": {
                "name": "Unraid MCP Server",
                "version": VERSION,
                "transport": UNRAID_MCP_TRANSPORT,
                "host": UNRAID_MCP_HOST,
                "port": UNRAID_MCP_PORT,
            },
        }

        if not data:
            health_info["status"] = "unhealthy"
            health_info["issues"] = ["No response from Unraid API"]
            return health_info

        info = data.get("info") or {}
        if info:
            health_info["unraid_system"] = {
                "status": "connected",
                "url": safe_display_url(UNRAID_API_URL),
                # machine_id deliberately not surfaced — see CWE-200 note on the query.
                "version": safe_get(info, "versions", "core", "unraid"),
                "uptime": safe_get(info, "os", "uptime"),
            }
        else:
            _escalate("degraded")
            issues.append("Unable to retrieve system info")

        array_info = data.get("array") or {}
        if array_info:
            state = array_info.get("state", "unknown")
            health_info["array_status"] = {
                "state": state,
                "healthy": state in ("STARTED", "STOPPED"),
            }
            if state not in ("STARTED", "STOPPED"):
                _escalate("warning")
                issues.append(f"Array in unexpected state: {state}")
        else:
            _escalate("warning")
            issues.append("Unable to retrieve array status")

        notifications = data.get("notifications") or {}
        if notifications and notifications.get("overview"):
            unread = notifications["overview"].get("unread") or {}
            alerts = unread.get("alert", 0)
            health_info["notifications"] = {
                "unread_total": unread.get("total", 0),
                "unread_alerts": alerts,
                "unread_warnings": unread.get("warning", 0),
            }
            if alerts > 0:
                _escalate("warning")
                issues.append(f"{alerts} unread alert(s)")

        docker = data.get("docker") or {}
        if docker and docker.get("containers"):
            containers = docker["containers"]
            health_info["docker_services"] = {
                "total": len(containers),
                "running": len(
                    [c for c in containers if (c.get("state") or "").upper() == "RUNNING"]
                ),
                "stopped": len(
                    [c for c in containers if (c.get("state") or "").upper() == "EXITED"]
                ),
            }

        if api_latency > 10000:
            _escalate("degraded")
            issues.append(f"Very high API latency: {api_latency}ms")
        elif api_latency > 5000:
            _escalate("warning")
            issues.append(f"High API latency: {api_latency}ms")

        health_info["status"] = _STATUS_FROM_SEVERITY.get(health_severity, "healthy")
        if issues:
            health_info["issues"] = issues
        health_info["performance"] = {
            "api_response_time_ms": api_latency,
            "check_duration_ms": round((time.time() - start_time) * 1000, 2),
        }
        return health_info

    except CredentialsNotConfiguredError:
        raise  # Let tool_error_handler convert to setup instructions
    except (httpx.ConnectError, httpx.TimeoutException, httpx.NetworkError) as e:
        logger.error(f"Health check failed: {e}", exc_info=True)
        return {
            "status": "unhealthy",
            "timestamp": datetime.datetime.now(datetime.UTC).isoformat(),
            "error": str(e),
        }
    except _client.ToolError as e:
        # make_graphql_request wraps httpx network errors in ToolError; catch them
        # here so health/check returns {"status": "unhealthy"} on real outages
        # rather than propagating an unhandled ToolError to the caller.
        cause = e.__cause__
        if isinstance(cause, (httpx.ConnectError, httpx.TimeoutException, httpx.NetworkError)):
            logger.error(f"Health check failed (wrapped): {cause}", exc_info=True)
            return {
                "status": "unhealthy",
                "timestamp": datetime.datetime.now(datetime.UTC).isoformat(),
                "error": str(cause),
            }
        raise


async def _handle_health(
    subaction: str,
    ctx: Context | None,
    *,
    error_stats_provider: Callable[[], dict[str, Any]] | None = None,
) -> dict[str, Any] | str:
    """Handle health operations with diagnostics supplied by app composition."""
    del ctx
    validate_subaction(subaction, _HEALTH_SUBACTIONS, "health")

    from ..config.settings import CREDENTIALS_ENV_PATH, UNRAID_API_URL, is_configured
    from ..core.utils import safe_display_url

    if subaction == "setup":
        if is_configured():
            try:
                await _client.make_graphql_request(_SYSTEM_QUERIES["online"])
                status = "and the connection test succeeded"
            except Exception as exc:
                logger.debug(
                    "health/setup connection probe failed: %s: %s",
                    type(exc).__name__,
                    exc,
                )
                status = (
                    f"but the connection test failed ({type(exc).__name__}) — "
                    "this may be a transient outage or a misconfiguration"
                )
            return (
                f"✅ Credentials are configured ({status}).\n"
                f"URL: `{safe_display_url(UNRAID_API_URL)}`\n"
                f"File: `{CREDENTIALS_ENV_PATH}`\n\n"
                "To change them, update the plugin's userConfig form "
                "(Unraid GraphQL API URL / Unraid API Key) or edit that file, "
                "then restart the server."
            )
        if CREDENTIALS_ENV_PATH.exists():
            return (
                f"⚠️ A credentials file exists (`{CREDENTIALS_ENV_PATH}`) but is not loaded "
                "in this session — credentials are read once at startup.\n\n"
                "Restart the server (or your MCP client), then run "
                '`unraid(action="health", subaction="test_connection")` to verify. '
                "If it still fails, check that the file contains non-empty "
                "`UNRAID_API_URL` and `UNRAID_API_KEY` values."
            )
        return (
            "⚠️ Credentials are not configured.\n\n"
            "**Claude Code plugin:** set *Unraid GraphQL API URL* and *Unraid API Key* "
            "in the plugin's configuration form — they are applied automatically on the "
            "next session and persisted to disk.\n\n"
            f"**Manual / Docker:** create `{CREDENTIALS_ENV_PATH}` with:\n"
            "```\nUNRAID_API_URL=https://your-unraid-server:port\n"
            "UNRAID_API_KEY=your-api-key\n```\n\n"
            "Then restart the server and run "
            '`unraid(action="health", subaction="test_connection")` to verify.'
        )

    with tool_error_handler("health", subaction, logger):
        logger.info("Executing unraid action=health subaction=%s", subaction)
        if subaction == "test_connection":
            start = time.time()
            data = await _client.make_graphql_request(_SYSTEM_QUERIES["online"])
            latency = round((time.time() - start) * 1000, 2)
            return {"status": "connected", "online": data.get("online"), "latency_ms": latency}
        if subaction == "check":
            return await _comprehensive_health_check()
        if subaction == "diagnose":
            from ..subscriptions.manager import subscription_manager
            from ..subscriptions.resources import ensure_subscriptions_started
            from ..subscriptions.utils import analyze_subscription_status

            await ensure_subscriptions_started()
            status = await subscription_manager.get_subscription_status()
            error_count, connection_issues = analyze_subscription_status(status)
            return {
                "timestamp": datetime.datetime.now(datetime.UTC).isoformat(),
                "environment": {
                    "auto_start_enabled": subscription_manager.auto_start_enabled,
                    "max_reconnect_attempts": subscription_manager.max_reconnect_attempts,
                    "api_url_configured": bool(UNRAID_API_URL),
                },
                "subscriptions": status,
                "summary": {
                    "total_configured": len(subscription_manager.subscription_configs),
                    "active_count": len(subscription_manager.active_subscriptions),
                    "with_data": len(subscription_manager.resource_data),
                    "in_error_state": error_count,
                    "connection_issues": connection_issues,
                },
                "cache": {"note": "caching disabled — tool mixes reads and mutations"},
                "errors": error_stats_provider() if error_stats_provider is not None else {},
            }
        raise ToolError(f"Unhandled health subaction '{subaction}' — this is a bug")
