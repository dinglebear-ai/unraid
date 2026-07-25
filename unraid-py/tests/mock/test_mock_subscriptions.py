"""Live (WebSocket) subscription round trips against the mock GraphQL server.

The mock serves `graphql-transport-ws` subscriptions on the same /graphql port,
emitting a few schema-valid mock events per field. These exercise the REAL Python
WebSocket subscription client through `_handle_live` — no patching of
subscribe_once/subscribe_collect.

Skips automatically unless `npm --prefix tests/mock install` has been run.
"""

from __future__ import annotations

import pytest

from unraid_mcp.tools._live import _handle_live


pytestmark = pytest.mark.mockserver


async def test_snapshot_subscription_roundtrip(mock_graphql_env: str) -> None:
    # live/cpu is a snapshot action -> subscribe_once returns the first WS event.
    result = await _handle_live("cpu", None, 5.0, 8.0)
    assert result["success"] is True
    assert "systemMetricsCpu" in result["data"]


async def test_event_driven_snapshot_roundtrip(mock_graphql_env: str) -> None:
    # live/display is event-driven; the mock emits, so it returns data (not the
    # "no_recent_events" placeholder).
    result = await _handle_live("display", None, 5.0, 8.0)
    assert result["success"] is True
    assert "displaySubscription" in result["data"]


async def test_collect_subscription_roundtrip(mock_graphql_env: str) -> None:
    # live/notification_feed is a collect action -> accumulates ticked events.
    result = await _handle_live("notification_feed", None, 1.0, 8.0)
    assert result["success"] is True
    assert result["event_count"] >= 1
    assert "notificationAdded" in result["events"][0]


async def test_plugin_install_updates_requires_operation_id(mock_graphql_env: str) -> None:
    from unraid_mcp.core.exceptions import ToolError

    with pytest.raises(ToolError, match="operation_id is required"):
        await _handle_live("plugin_install_updates", None, 1.0, 8.0)


async def test_plugin_install_updates_roundtrip(mock_graphql_env: str) -> None:
    result = await _handle_live("plugin_install_updates", None, 1.0, 8.0, operation_id="op-1")
    assert result["success"] is True
    assert result["event_count"] >= 1
    assert "pluginInstallUpdates" in result["events"][0]
