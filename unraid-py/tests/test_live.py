# tests/test_live.py
"""Tests for live subactions of the consolidated unraid tool."""

from __future__ import annotations

import asyncio
from unittest.mock import patch

import pytest
from conftest import make_tool_fn


def _make_tool():
    return make_tool_fn("unraid_mcp.tools.unraid", "register_unraid_tool", "unraid")


@pytest.fixture
def _mock_subscribe_once():
    with patch("unraid_mcp.subscriptions.snapshot.subscribe_once") as m:
        yield m


@pytest.fixture
def _mock_subscribe_collect():
    with patch("unraid_mcp.subscriptions.snapshot.subscribe_collect") as m:
        yield m


@pytest.fixture
def _cold_cache():
    """Force the snapshot warm-cache path off so live/* falls back to a fresh WS.

    The module-level subscription_manager singleton may have auto-start enabled
    (default) and could even hold warm data from another test; this fixture
    guarantees the live (fresh-WS) path is exercised by disabling auto-start and
    clearing any cached resource data, restoring both afterward.
    """
    from unraid_mcp.subscriptions.manager import subscription_manager

    saved_enabled = subscription_manager.auto_start_enabled
    saved_data = dict(subscription_manager.resource_data)
    saved_tasks = dict(subscription_manager.active_subscriptions)
    saved_states = dict(subscription_manager.connection_states)
    saved_errors = dict(subscription_manager.last_error)
    subscription_manager.auto_start_enabled = False
    subscription_manager.resource_data.clear()
    subscription_manager.active_subscriptions.clear()
    subscription_manager.connection_states.clear()
    subscription_manager.last_error.clear()
    try:
        yield subscription_manager
    finally:
        subscription_manager.auto_start_enabled = saved_enabled
        subscription_manager.resource_data.clear()
        subscription_manager.resource_data.update(saved_data)
        subscription_manager.active_subscriptions.clear()
        subscription_manager.active_subscriptions.update(saved_tasks)
        subscription_manager.connection_states.clear()
        subscription_manager.connection_states.update(saved_states)
        subscription_manager.last_error.clear()
        subscription_manager.last_error.update(saved_errors)


@pytest.fixture
def _warm_cache():
    """Provide a manager with auto-start enabled and a clean resource_data dict.

    Tests seed ``subscription_manager.resource_data[<subaction>]`` with a
    SubscriptionData entry to simulate warm persistent-subscription data, then
    assert the live/* tool serves it without opening a fresh WebSocket. Original
    state is restored afterward.
    """
    from unraid_mcp.subscriptions.manager import subscription_manager

    saved_enabled = subscription_manager.auto_start_enabled
    saved_data = dict(subscription_manager.resource_data)
    saved_tasks = dict(subscription_manager.active_subscriptions)
    saved_states = dict(subscription_manager.connection_states)
    saved_errors = dict(subscription_manager.last_error)
    subscription_manager.auto_start_enabled = True
    subscription_manager.resource_data.clear()
    subscription_manager.active_subscriptions.clear()
    subscription_manager.connection_states.clear()
    subscription_manager.last_error.clear()
    try:
        yield subscription_manager
    finally:
        subscription_manager.auto_start_enabled = saved_enabled
        subscription_manager.resource_data.clear()
        subscription_manager.resource_data.update(saved_data)
        subscription_manager.active_subscriptions.clear()
        subscription_manager.active_subscriptions.update(saved_tasks)
        subscription_manager.connection_states.clear()
        subscription_manager.connection_states.update(saved_states)
        subscription_manager.last_error.clear()
        subscription_manager.last_error.update(saved_errors)


def _seed_warm(manager, subaction: str, data: dict) -> None:
    """Seed the manager's warm resource cache for *subaction*."""
    from datetime import UTC, datetime

    from unraid_mcp.core.types import SubscriptionData

    manager.resource_data[subaction] = SubscriptionData(data=data, last_updated=datetime.now(UTC))
    manager.active_subscriptions[subaction] = asyncio.current_task()
    manager.connection_states[subaction] = "subscribed"


@pytest.mark.asyncio
async def test_cpu_returns_snapshot(_mock_subscribe_once, _cold_cache):
    _mock_subscribe_once.return_value = {"systemMetricsCpu": {"percentTotal": 23.5, "cpus": []}}
    result = await _make_tool()(action="live", subaction="cpu")
    assert result["success"] is True
    assert result["data"]["systemMetricsCpu"]["percentTotal"] == 23.5


@pytest.mark.asyncio
async def test_memory_returns_snapshot(_mock_subscribe_once, _cold_cache):
    _mock_subscribe_once.return_value = {
        "systemMetricsMemory": {"total": 32000000000, "used": 10000000000, "percentTotal": 31.2}
    }
    result = await _make_tool()(action="live", subaction="memory")
    assert result["success"] is True
    assert result["source"] == "live"


@pytest.mark.asyncio
async def test_log_tail_requires_path(_mock_subscribe_collect):
    _mock_subscribe_collect.return_value = []
    from unraid_mcp.core.exceptions import ToolError

    with pytest.raises(ToolError, match="path"):
        await _make_tool()(action="live", subaction="log_tail")


@pytest.mark.asyncio
async def test_log_tail_with_path(_mock_subscribe_collect):
    _mock_subscribe_collect.return_value = [
        {"logFile": {"path": "/var/log/syslog", "content": "line1\nline2", "totalLines": 2}}
    ]
    result = await _make_tool()(
        action="live", subaction="log_tail", path="/var/log/syslog", collect_for=1.0
    )
    assert result["success"] is True
    assert result["event_count"] == 1


@pytest.mark.asyncio
async def test_notification_feed_collects_events(_mock_subscribe_collect):
    _mock_subscribe_collect.return_value = [
        {"notificationAdded": {"id": "1", "title": "Alert"}},
        {"notificationAdded": {"id": "2", "title": "Info"}},
    ]
    result = await _make_tool()(action="live", subaction="notification_feed", collect_for=2.0)
    assert result["event_count"] == 2
    assert _mock_subscribe_collect.call_args.kwargs["max_events"] > 0
    assert _mock_subscribe_collect.call_args.kwargs["max_bytes"] > 0


@pytest.mark.asyncio
async def test_collect_window_rejects_duration_above_runtime_cap(_mock_subscribe_collect):
    from unraid_mcp.config.settings import UNRAID_SUBSCRIPTION_COLLECT_MAX_SECONDS
    from unraid_mcp.core.exceptions import ToolError

    with pytest.raises(ToolError, match="collect_for"):
        await _make_tool()(
            action="live",
            subaction="notification_feed",
            collect_for=UNRAID_SUBSCRIPTION_COLLECT_MAX_SECONDS + 1,
        )
    _mock_subscribe_collect.assert_not_called()


@pytest.mark.asyncio
async def test_live_rejects_timeout_above_runtime_cap(_mock_subscribe_collect):
    from unraid_mcp.config.settings import UNRAID_SUBSCRIPTION_TIMEOUT_MAX_SECONDS
    from unraid_mcp.core.exceptions import ToolError

    with pytest.raises(ToolError, match="timeout"):
        await _make_tool()(
            action="live",
            subaction="notification_feed",
            timeout=UNRAID_SUBSCRIPTION_TIMEOUT_MAX_SECONDS + 1,
        )
    _mock_subscribe_collect.assert_not_called()


@pytest.mark.asyncio
async def test_log_tail_caps_events_default(_mock_subscribe_collect):
    # Tool param default is 20 — a noisy log window must not flood context.
    _mock_subscribe_collect.return_value = [
        {"logFile": {"path": "/var/log/syslog", "content": f"line{i}"}} for i in range(60)
    ]
    result = await _make_tool()(
        action="live", subaction="log_tail", path="/var/log/syslog", collect_for=1.0
    )
    assert result["event_count"] == 20
    assert len(result["events"]) == 20
    assert result["page"]["truncated"] is True
    assert result["page"]["total"] == 60


@pytest.mark.asyncio
async def test_log_tail_limit_zero_returns_all(_mock_subscribe_collect):
    _mock_subscribe_collect.return_value = [
        {"logFile": {"path": "/var/log/syslog", "content": f"line{i}"}} for i in range(60)
    ]
    result = await _make_tool()(
        action="live", subaction="log_tail", path="/var/log/syslog", collect_for=1.0, limit=0
    )
    assert result["event_count"] == 60
    assert result["page"]["truncated"] is False


@pytest.mark.asyncio
async def test_notification_feed_caps_events_default(_mock_subscribe_collect):
    _mock_subscribe_collect.return_value = [
        {"notificationAdded": {"id": str(i)}} for i in range(60)
    ]
    result = await _make_tool()(action="live", subaction="notification_feed", collect_for=2.0)
    assert result["event_count"] == 20
    assert len(result["events"]) == 20
    assert result["page"]["truncated"] is True


@pytest.mark.asyncio
async def test_notification_feed_limit_narrows(_mock_subscribe_collect):
    _mock_subscribe_collect.return_value = [
        {"notificationAdded": {"id": str(i)}} for i in range(60)
    ]
    result = await _make_tool()(
        action="live", subaction="notification_feed", collect_for=2.0, limit=5
    )
    assert result["event_count"] == 5


@pytest.mark.asyncio
async def test_notification_feed_limit_zero_returns_all(_mock_subscribe_collect):
    _mock_subscribe_collect.return_value = [
        {"notificationAdded": {"id": str(i)}} for i in range(60)
    ]
    result = await _make_tool()(
        action="live", subaction="notification_feed", collect_for=2.0, limit=0
    )
    assert result["event_count"] == 60
    assert result["page"]["truncated"] is False


@pytest.mark.asyncio
async def test_notification_feed_preserves_runtime_truncation(_mock_subscribe_collect):
    from unraid_mcp.subscriptions.snapshot import CollectedEvents

    _mock_subscribe_collect.return_value = CollectedEvents(
        [
            {"notificationAdded": {"id": "1"}},
            {"notificationAdded": {"id": "2"}},
        ],
        truncation_reason="max_events",
    )

    result = await _make_tool()(
        action="live", subaction="notification_feed", collect_for=2.0, limit=0
    )

    assert result["page"] == {
        "returned": 2,
        "total": 3,
        "truncated": True,
        "total_is_lower_bound": True,
        "runtime_truncation_reason": "max_events",
    }


@pytest.mark.asyncio
async def test_invalid_subaction_raises():
    from unraid_mcp.core.exceptions import ToolError

    with pytest.raises(ToolError, match="Invalid subaction"):
        await _make_tool()(action="live", subaction="nonexistent")


@pytest.mark.asyncio
async def test_snapshot_propagates_tool_error(_mock_subscribe_once, _cold_cache):
    """Non-event-driven (streaming) actions still propagate timeout as ToolError."""
    from unraid_mcp.core.exceptions import ToolError

    _mock_subscribe_once.side_effect = ToolError("Subscription timed out after 10s")
    with pytest.raises(ToolError, match="timed out"):
        await _make_tool()(action="live", subaction="cpu")


@pytest.mark.asyncio
async def test_event_driven_timeout_returns_no_recent_events(_mock_subscribe_once, _cold_cache):
    """Event-driven subscriptions return a graceful no_recent_events response on timeout."""
    from unraid_mcp.core.exceptions import ToolError

    _mock_subscribe_once.side_effect = ToolError("Subscription timed out after 10s")
    result = await _make_tool()(action="live", subaction="notifications_overview")
    assert result["success"] is True
    assert result["status"] == "no_recent_events"
    assert "No events received" in result["message"]


@pytest.mark.asyncio
async def test_event_driven_non_timeout_error_propagates(_mock_subscribe_once, _cold_cache):
    """Non-timeout ToolErrors from event-driven subscriptions still propagate."""
    from unraid_mcp.core.exceptions import ToolError

    _mock_subscribe_once.side_effect = ToolError("Subscription auth failed")
    with pytest.raises(ToolError, match="auth failed"):
        await _make_tool()(action="live", subaction="owner")


@pytest.mark.asyncio
async def test_log_tail_rejects_invalid_path(_mock_subscribe_collect):
    from unraid_mcp.core.exceptions import ToolError

    with pytest.raises(ToolError, match="must start with"):
        await _make_tool()(action="live", subaction="log_tail", path="/etc/shadow")


@pytest.mark.asyncio
async def test_snapshot_wraps_bare_exception(_mock_subscribe_once, _cold_cache):
    """Bare exceptions from subscribe_once are wrapped in ToolError by tool_error_handler."""
    from unraid_mcp.core.exceptions import ToolError

    _mock_subscribe_once.side_effect = RuntimeError("WebSocket connection refused")
    with pytest.raises(ToolError):
        await _make_tool()(action="live", subaction="cpu")


def test_collect_actions_all_handled():
    """Every COLLECT_ACTIONS key must have an explicit handler in _handle_live.

    If this test fails, a new key was added to COLLECT_ACTIONS in
    subscriptions/queries.py without adding a corresponding if-branch in
    tools/_live.py — which would cause a ToolError('this is a bug') at runtime.
    Fix: add an if-branch in _handle_live for the new key.
    """
    import inspect

    from unraid_mcp.subscriptions.queries import COLLECT_ACTIONS
    from unraid_mcp.tools._live import _handle_live

    source = inspect.getsource(_handle_live)
    unhandled = {key for key in COLLECT_ACTIONS if f'"{key}"' not in source}
    assert not unhandled, (
        f"COLLECT_ACTIONS keys without handlers in _handle_live: {unhandled}. "
        "Add an if-branch in src/unraid_mcp/tools/_live.py."
    )


@pytest.mark.asyncio
async def test_log_tail_level_filters_events(_mock_subscribe_collect):
    _mock_subscribe_collect.return_value = [
        {
            "logFile": {
                "path": "/var/log/syslog",
                "content": "a info\nb [ERROR] boom\nc info\nd info",
                "totalLines": 4,
            }
        }
    ]
    result = await _make_tool()(
        action="live",
        subaction="log_tail",
        path="/var/log/syslog",
        collect_for=1.0,
        level="error",
        context=1,
    )
    assert result["filter"] == {"level": "error", "context": 1}
    log_file = result["events"][0]["logFile"]
    # match at idx1, context 1 → idx 0..2
    assert log_file["content"] == "a info\nb [ERROR] boom\nc info"
    # only the single [ERROR] line actually matched the severity filter (#48)
    assert log_file["matchedLines"] == 1
    # 3 real lines returned (match + 2 context), no "---" separator
    assert log_file["returnedLines"] == 3
    transform = _mock_subscribe_collect.call_args.kwargs["transform"]
    assert transform is not None
    transformed = transform(_mock_subscribe_collect.return_value[0])
    assert transformed["logFile"]["content"] == "a info\nb [ERROR] boom\nc info"
    assert log_file["matchedLines"] < log_file["returnedLines"]
    # original fields preserved
    assert log_file["path"] == "/var/log/syslog"


@pytest.mark.asyncio
async def test_filtered_log_tail_preserves_runtime_truncation(_mock_subscribe_collect):
    from unraid_mcp.subscriptions.snapshot import CollectedEvents

    _mock_subscribe_collect.return_value = CollectedEvents(
        [{"logFile": {"content": "[ERROR] boom"}}],
        truncation_reason="max_bytes",
    )

    result = await _make_tool()(
        action="live",
        subaction="log_tail",
        path="/var/log/syslog",
        level="error",
        context=0,
    )

    assert result["page"]["truncated"] is True
    assert result["page"]["total"] == 2
    assert result["page"]["total_is_lower_bound"] is True
    assert result["page"]["runtime_truncation_reason"] == "max_bytes"


@pytest.mark.asyncio
async def test_log_tail_no_level_unchanged(_mock_subscribe_collect):
    _mock_subscribe_collect.return_value = [
        {"logFile": {"path": "/var/log/syslog", "content": "a info\nb [ERROR] boom"}}
    ]
    result = await _make_tool()(
        action="live", subaction="log_tail", path="/var/log/syslog", collect_for=1.0
    )
    assert result["filter"] is None
    assert result["events"][0]["logFile"]["content"] == "a info\nb [ERROR] boom"


# ---------------------------------------------------------------------------
# New subscriptions: display, notifications_warnings, plugin_install_updates
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_display_returns_snapshot(_mock_subscribe_once, _cold_cache):
    _mock_subscribe_once.return_value = {
        "displaySubscription": {"theme": "white", "locale": "en_US"}
    }
    result = await _make_tool()(action="live", subaction="display")
    assert result["success"] is True
    assert result["data"]["displaySubscription"]["theme"] == "white"


@pytest.mark.asyncio
async def test_notifications_warnings_returns_snapshot(_mock_subscribe_once, _cold_cache):
    _mock_subscribe_once.return_value = {
        "notificationsWarningsAndAlerts": [{"id": "n1", "importance": "ALERT"}]
    }
    result = await _make_tool()(action="live", subaction="notifications_warnings")
    assert result["success"] is True
    assert result["data"]["notificationsWarningsAndAlerts"][0]["importance"] == "ALERT"


@pytest.mark.asyncio
async def test_network_metrics_returns_snapshot(_mock_subscribe_once, _cold_cache):
    _mock_subscribe_once.return_value = {
        "systemMetricsNetwork": [
            {
                "id": "metrics:eth0",
                "name": "eth0",
                "bytesReceived": 1024,
                "bytesSent": 2048,
            }
        ]
    }
    result = await _make_tool()(action="live", subaction="network_metrics")
    assert result["success"] is True
    assert result["data"]["systemMetricsNetwork"][0]["name"] == "eth0"
    assert result["page"] == {"returned": 1, "total": 1, "truncated": False}
    query = _mock_subscribe_once.call_args.args[0]
    assert "systemMetricsNetwork" in query


@pytest.mark.asyncio
async def test_network_metrics_snapshot_is_capped(_mock_subscribe_once, _cold_cache):
    _mock_subscribe_once.return_value = {
        "systemMetricsNetwork": [
            {"id": f"metrics:eth{idx}", "name": f"eth{idx}"} for idx in range(3)
        ]
    }
    result = await _make_tool()(action="live", subaction="network_metrics", limit=2)
    assert result["success"] is True
    assert [iface["name"] for iface in result["data"]["systemMetricsNetwork"]] == [
        "eth0",
        "eth1",
    ]
    assert result["page"]["returned"] == 2
    assert result["page"]["total"] == 3
    assert result["page"]["truncated"] is True


@pytest.mark.asyncio
async def test_plugin_install_updates_requires_operation_id(_mock_subscribe_collect):
    from unraid_mcp.core.exceptions import ToolError

    _mock_subscribe_collect.return_value = []
    with pytest.raises(ToolError, match="operation_id is required"):
        await _make_tool()(action="live", subaction="plugin_install_updates")


@pytest.mark.asyncio
async def test_plugin_install_updates_passes_operation_id(_mock_subscribe_collect):
    _mock_subscribe_collect.return_value = [
        {"pluginInstallUpdates": {"operationId": "op1", "status": "RUNNING"}}
    ]
    result = await _make_tool()(
        action="live",
        subaction="plugin_install_updates",
        operation_id="op1",
        collect_for=1.0,
    )
    assert result["success"] is True
    assert result["events"][0]["pluginInstallUpdates"]["operationId"] == "op1"
    # operationId must be forwarded as a subscription variable
    assert _mock_subscribe_collect.call_args.kwargs["variables"] == {"operationId": "op1"}


@pytest.mark.asyncio
async def test_snapshot_actions_all_handled(_cold_cache):
    """Every SNAPSHOT_ACTIONS key must route through _handle_live without error.

    Guards against adding a subscription key but forgetting the handler branch.
    """
    from unittest.mock import patch

    from unraid_mcp.subscriptions.queries import SNAPSHOT_ACTIONS

    with patch("unraid_mcp.subscriptions.snapshot.subscribe_once") as once:
        once.return_value = {"ok": True}
        for action in SNAPSHOT_ACTIONS:
            result = await _make_tool()(action="live", subaction=action, timeout=1.0)
            assert result["subaction"] == action
            assert result["source"] == "live"


# ---------------------------------------------------------------------------
# Warm persistent-subscription cache fast path (P-H1 / T-H2)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_snapshot_served_from_warm_cache(_warm_cache, _mock_subscribe_once):
    """When warm persistent data exists + auto-start on, live/cpu reads cache.

    The fresh-WS function (subscribe_once) MUST NOT be called — that is the whole
    point of the fix: avoid a full WS handshake when the persistent manager
    already holds fresh data.
    """
    _seed_warm(_warm_cache, "cpu", {"systemMetricsCpu": {"percentTotal": 42.0, "cpus": []}})
    # If the live path were taken it would return this very different value.
    _mock_subscribe_once.return_value = {"systemMetricsCpu": {"percentTotal": -1, "cpus": []}}

    result = await _make_tool()(action="live", subaction="cpu")

    assert result["success"] is True
    assert result["source"] == "cache"
    assert result["data"]["systemMetricsCpu"]["percentTotal"] == 42.0
    _mock_subscribe_once.assert_not_called()


@pytest.mark.asyncio
async def test_event_driven_snapshot_served_from_warm_cache(_warm_cache, _mock_subscribe_once):
    """Event-driven snapshots (e.g. display) are also served from warm cache."""
    _seed_warm(_warm_cache, "display", {"displaySubscription": {"theme": "black"}})
    _mock_subscribe_once.return_value = {"displaySubscription": {"theme": "white"}}

    result = await _make_tool()(action="live", subaction="display")

    assert result["source"] == "cache"
    assert result["data"]["displaySubscription"]["theme"] == "black"
    _mock_subscribe_once.assert_not_called()


@pytest.mark.asyncio
async def test_network_metrics_warm_cache_is_capped(_warm_cache, _mock_subscribe_once):
    """The warm-cache network_metrics path caps the interface list too."""
    _seed_warm(
        _warm_cache,
        "network_metrics",
        {
            "systemMetricsNetwork": [
                {"id": f"metrics:eth{idx}", "name": f"eth{idx}"} for idx in range(3)
            ]
        },
    )

    result = await _make_tool()(action="live", subaction="network_metrics", limit=2)

    assert result["source"] == "cache"
    assert [iface["name"] for iface in result["data"]["systemMetricsNetwork"]] == [
        "eth0",
        "eth1",
    ]
    assert result["page"]["returned"] == 2
    assert result["page"]["total"] == 3
    assert result["page"]["truncated"] is True
    _mock_subscribe_once.assert_not_called()


@pytest.mark.asyncio
async def test_cold_cache_falls_back_to_fresh_ws(_warm_cache, _mock_subscribe_once):
    """Auto-start on but no warm data → fall back to fresh WS (subscribe_once)."""
    # _warm_cache enables auto-start and clears resource_data; do NOT seed it.
    _mock_subscribe_once.return_value = {"systemMetricsCpu": {"percentTotal": 7.0, "cpus": []}}

    result = await _make_tool()(action="live", subaction="cpu")

    assert result["source"] == "live"
    assert result["data"]["systemMetricsCpu"]["percentTotal"] == 7.0
    _mock_subscribe_once.assert_called_once()


@pytest.mark.asyncio
async def test_terminal_subscription_never_serves_stale_warm_cache(
    _warm_cache, _mock_subscribe_once
):
    """A cached payload from a failed persistent loop is not treated as fresh."""
    _seed_warm(_warm_cache, "cpu", {"systemMetricsCpu": {"percentTotal": 99.0, "cpus": []}})
    _warm_cache.connection_states["cpu"] = "auth_failed"
    _warm_cache.last_error["cpu"] = "bad token"
    _mock_subscribe_once.return_value = {"systemMetricsCpu": {"percentTotal": 4.0, "cpus": []}}

    result = await _make_tool()(action="live", subaction="cpu")

    assert result["source"] == "live"
    assert result["data"]["systemMetricsCpu"]["percentTotal"] == 4.0
    _mock_subscribe_once.assert_called_once()


@pytest.mark.asyncio
async def test_expired_subscription_cache_falls_back_to_fresh_ws(_warm_cache, _mock_subscribe_once):
    from datetime import UTC, datetime, timedelta

    from unraid_mcp.config.settings import UNRAID_SUBSCRIPTION_CACHE_MAX_AGE_SECONDS
    from unraid_mcp.core.types import SubscriptionData

    _seed_warm(_warm_cache, "cpu", {"systemMetricsCpu": {"percentTotal": 99.0, "cpus": []}})
    _warm_cache.resource_data["cpu"] = SubscriptionData(
        data={"systemMetricsCpu": {"percentTotal": 99.0, "cpus": []}},
        last_updated=datetime.now(UTC)
        - timedelta(seconds=UNRAID_SUBSCRIPTION_CACHE_MAX_AGE_SECONDS + 1),
    )
    _mock_subscribe_once.return_value = {"systemMetricsCpu": {"percentTotal": 5.0, "cpus": []}}

    result = await _make_tool()(action="live", subaction="cpu")

    assert result["source"] == "live"
    assert result["data"]["systemMetricsCpu"]["percentTotal"] == 5.0


@pytest.mark.asyncio
async def test_auto_start_disabled_ignores_warm_cache(_cold_cache, _mock_subscribe_once):
    """Auto-start disabled → never read warm cache, always use fresh WS.

    Even with seeded resource_data, a disabled manager must not short-circuit to
    the cache (the persistent subscriptions aren't being maintained).
    """
    _seed_warm(_cold_cache, "cpu", {"systemMetricsCpu": {"percentTotal": 99.0, "cpus": []}})
    _mock_subscribe_once.return_value = {"systemMetricsCpu": {"percentTotal": 3.0, "cpus": []}}

    result = await _make_tool()(action="live", subaction="cpu")

    assert result["source"] == "live"
    assert result["data"]["systemMetricsCpu"]["percentTotal"] == 3.0
    _mock_subscribe_once.assert_called_once()
