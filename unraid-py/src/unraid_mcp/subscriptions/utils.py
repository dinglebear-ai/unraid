"""Shared utilities for the subscription system."""

import ssl as _ssl
from typing import Any

from ..config import settings as _settings


def build_ws_url() -> str:
    """Build a WebSocket URL from the configured UNRAID_API_URL setting.

    Converts http(s) scheme to ws(s) and ensures /graphql path suffix.

    Returns:
        The WebSocket URL string (e.g. "wss://10.1.0.2:31337/graphql").

    Raises:
        ValueError: If UNRAID_API_URL is not configured or has an unrecognised scheme.
    """
    if not _settings.UNRAID_API_URL:
        raise ValueError("UNRAID_API_URL is not configured")

    if _settings.UNRAID_API_URL.startswith("https://"):
        ws_url = "wss://" + _settings.UNRAID_API_URL[len("https://") :]
    elif _settings.UNRAID_API_URL.startswith("http://"):
        ws_url = "ws://" + _settings.UNRAID_API_URL[len("http://") :]
    elif _settings.UNRAID_API_URL.startswith(("ws://", "wss://")):
        ws_url = _settings.UNRAID_API_URL  # Already a WebSocket URL
    else:
        raise ValueError(
            f"UNRAID_API_URL must start with http://, https://, ws://, or wss://. "
            f"Got: {_settings.UNRAID_API_URL[:20]}..."
        )

    if not ws_url.endswith("/graphql"):
        ws_url = ws_url.rstrip("/") + "/graphql"

    return ws_url


def build_ws_ssl_context(ws_url: str) -> _ssl.SSLContext | None:
    """Build an SSL context for WebSocket connections when using wss://.

    Args:
        ws_url: The WebSocket URL to connect to.

    Returns:
        An SSLContext configured per UNRAID_VERIFY_SSL, or None for non-TLS URLs.
    """
    if not ws_url.startswith("wss://"):
        return None
    if isinstance(_settings.UNRAID_VERIFY_SSL, str):
        return _ssl.create_default_context(cafile=_settings.UNRAID_VERIFY_SSL)
    if _settings.UNRAID_VERIFY_SSL:
        return _ssl.create_default_context()
    # Explicitly disable verification (equivalent to verify=False)
    ctx = _ssl.SSLContext(_ssl.PROTOCOL_TLS_CLIENT)
    ctx.check_hostname = False
    ctx.verify_mode = _ssl.CERT_NONE
    return ctx


def build_connection_init() -> dict[str, Any]:
    """Build the graphql-ws connection_init message.

    Omits the payload key entirely when no API key is configured —
    sending {"x-api-key": None} and omitting the key differ for some servers.
    """
    msg: dict[str, Any] = {"type": "connection_init"}
    if _settings.UNRAID_API_KEY:
        msg["payload"] = {"x-api-key": _settings.UNRAID_API_KEY}
    return msg


def analyze_subscription_status(
    status: dict[str, Any],
) -> tuple[int, list[dict[str, Any]]]:
    """Analyze subscription status dict, returning error count and connection issues.

    Public helper (#19): the tools layer consumes this across the package boundary,
    so it carries no leading underscore.

    Only reports connection_issues for subscriptions that are currently in a
    failure state (not recovered ones that happen to have a stale last_error).

    Args:
        status: Dict of subscription name -> status info from get_subscription_status().

    Returns:
        Tuple of (error_count, connection_issues_list).
    """
    _error_states = frozenset(
        {"error", "auth_failed", "timeout", "max_retries_exceeded", "invalid_uri"}
    )
    error_count = 0
    connection_issues: list[dict[str, Any]] = []

    for sub_name, sub_status in status.items():
        runtime = sub_status.get("runtime", {})
        conn_state = runtime.get("connection_state", "unknown")
        if conn_state in _error_states:
            error_count += 1
        # Gate on current failure state so recovered subscriptions are not reported
        if runtime.get("last_error") and conn_state in _error_states:
            connection_issues.append(
                {
                    "subscription": sub_name,
                    "state": conn_state,
                    "error": runtime["last_error"],
                }
            )

    return error_count, connection_issues
