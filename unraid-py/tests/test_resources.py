"""Tests for MCP subscription resources."""

import json
from typing import ClassVar
from unittest.mock import AsyncMock, patch

import pytest
from fastmcp import FastMCP

from unraid_mcp.subscriptions.queries import SNAPSHOT_ACTIONS
from unraid_mcp.subscriptions.resources import register_subscription_resources
from unraid_mcp.subscriptions.state import ResourceSnapshot


def _snapshot(
    data=None,
    fetched_at=None,
    *,
    state="",
    error=None,
    active=False,
    fresh=False,
    age_seconds=None,
    stale=False,
):
    return ResourceSnapshot(data, fetched_at, state, error, active, fresh, age_seconds, stale)


def _make_resources():
    """Register resources on a test FastMCP instance and return it."""
    test_mcp = FastMCP("test")
    register_subscription_resources(test_mcp)
    return test_mcp


def _get_resource(mcp: FastMCP, uri: str):
    """Look up a registered resource by URI.

    Accesses FastMCP provider internals. If this breaks after a FastMCP upgrade,
    check whether a public resource-lookup API has been added upstream.
    """
    key = f"resource:{uri}@"
    return mcp.providers[0]._components[key]


@pytest.fixture
def _mock_ensure_started():
    with patch(
        "unraid_mcp.subscriptions.resources.ensure_subscriptions_started",
        new_callable=AsyncMock,
    ) as mock:
        yield mock


class TestLiveResourcesUseManagerCache:
    """All live resources must read from the persistent SubscriptionManager cache."""

    @pytest.mark.parametrize("action", list(SNAPSHOT_ACTIONS.keys()))
    @pytest.mark.usefixtures("_mock_ensure_started")
    async def test_resource_returns_cached_data(self, action: str) -> None:
        cached = {"systemMetricsCpu": {"percentTotal": 12.5}}
        ts = "2026-04-04T12:00:00+00:00"
        with patch("unraid_mcp.subscriptions.resources.subscription_manager") as mock_mgr:
            mock_mgr.get_resource_snapshot = AsyncMock(
                return_value=_snapshot(
                    cached,
                    ts,
                    state="subscribed",
                    active=True,
                    fresh=True,
                    age_seconds=1.25,
                )
            )
            mcp = _make_resources()
            resource = _get_resource(mcp, f"unraid://live/{action}")
            result = await resource.fn()
        parsed = json.loads(result)
        assert parsed["_fetched_at"] == ts
        assert parsed["systemMetricsCpu"] == cached["systemMetricsCpu"]
        assert parsed["_subscription"] == {
            "state": "subscribed",
            "active": True,
            "fresh": True,
            "stale": False,
            "age_seconds": 1.25,
        }

    @pytest.mark.parametrize("action", list(SNAPSHOT_ACTIONS.keys()))
    @pytest.mark.usefixtures("_mock_ensure_started")
    async def test_resource_returns_connecting_when_no_cache_and_no_error(
        self, action: str
    ) -> None:
        with patch("unraid_mcp.subscriptions.resources.subscription_manager") as mock_mgr:
            mock_mgr.get_resource_snapshot = AsyncMock(return_value=_snapshot())
            mock_mgr.auto_start_enabled = True
            mcp = _make_resources()
            resource = _get_resource(mcp, f"unraid://live/{action}")
            result = await resource.fn()
        parsed = json.loads(result)
        assert parsed["status"] == "connecting"

    @pytest.mark.parametrize("action", list(SNAPSHOT_ACTIONS.keys()))
    @pytest.mark.usefixtures("_mock_ensure_started")
    async def test_resource_returns_error_status_on_permanent_failure(self, action: str) -> None:
        with patch("unraid_mcp.subscriptions.resources.subscription_manager") as mock_mgr:
            mock_mgr.get_resource_snapshot = AsyncMock(
                return_value=_snapshot(state="auth_failed", error="WebSocket auth failed")
            )
            mock_mgr.auto_start_enabled = True
            mcp = _make_resources()
            resource = _get_resource(mcp, f"unraid://live/{action}")
            result = await resource.fn()
        parsed = json.loads(result)
        assert parsed["status"] == "error"
        assert "auth failed" in parsed["message"]

    @pytest.mark.usefixtures("_mock_ensure_started")
    async def test_non_autostart_resource_uses_on_demand_fetch(self) -> None:
        fallback_data = {"systemMetricsNetwork": [{"id": "metrics:eth0", "name": "eth0"}]}
        with (
            patch("unraid_mcp.subscriptions.resources.subscription_manager") as mock_mgr,
            patch(
                "unraid_mcp.subscriptions.resources.subscribe_once",
                new=AsyncMock(return_value=fallback_data),
            ) as mock_once,
        ):
            mock_mgr.get_resource_snapshot = AsyncMock(return_value=_snapshot())
            mock_mgr.auto_start_enabled = True
            mock_mgr.is_auto_start_subscription.return_value = False
            mcp = _make_resources()
            resource = _get_resource(mcp, "unraid://live/network_metrics")
            result = await resource.fn()
        assert json.loads(result) == fallback_data
        mock_once.assert_awaited_once_with(SNAPSHOT_ACTIONS["network_metrics"])

    @pytest.mark.usefixtures("_mock_ensure_started")
    async def test_non_autostart_resource_surfaces_on_demand_failure(self) -> None:
        with (
            patch("unraid_mcp.subscriptions.resources.subscription_manager") as mock_mgr,
            patch(
                "unraid_mcp.subscriptions.resources.subscribe_once",
                new=AsyncMock(side_effect=Exception("Cannot query field systemMetricsNetwork")),
            ),
        ):
            mock_mgr.get_resource_snapshot = AsyncMock(return_value=_snapshot())
            mock_mgr.auto_start_enabled = True
            mock_mgr.is_auto_start_subscription.return_value = False
            mcp = _make_resources()
            resource = _get_resource(mcp, "unraid://live/network_metrics")
            result = await resource.fn()
        parsed = json.loads(result)
        assert parsed["status"] == "error"
        assert "Cannot query field systemMetricsNetwork" in parsed["message"]


class TestSnapshotSubscriptionsRegistered:
    """All SNAPSHOT_ACTIONS must be registered in the SubscriptionManager."""

    OPTIONAL_AUTO_START_DISABLED: ClassVar[frozenset[str]] = frozenset({"network_metrics"})

    def test_all_snapshot_actions_in_configs(self) -> None:
        from unraid_mcp.subscriptions.manager import subscription_manager

        for action in SNAPSHOT_ACTIONS:
            assert action in subscription_manager.subscription_configs, (
                f"'{action}' not registered in subscription_configs"
            )

    def test_snapshot_actions_autostart_except_optional_new_schema_actions(self) -> None:
        from unraid_mcp.subscriptions.manager import subscription_manager

        for action in SNAPSHOT_ACTIONS:
            config = subscription_manager.subscription_configs[action]
            expected = action not in self.OPTIONAL_AUTO_START_DISABLED
            assert config.get("auto_start") is expected, (
                f"'{action}' auto_start should be {expected} in subscription_configs"
            )


class TestLogsStreamResource:
    @pytest.mark.usefixtures("_mock_ensure_started")
    async def test_logs_stream_no_data(self) -> None:
        with patch("unraid_mcp.subscriptions.resources.subscription_manager") as mock_mgr:
            mock_mgr.get_resource_snapshot = AsyncMock(return_value=_snapshot())
            mcp = _make_resources()
            resource = _get_resource(mcp, "unraid://logs/stream")
            result = await resource.fn()
            parsed = json.loads(result)
            assert "status" in parsed

    @pytest.mark.usefixtures("_mock_ensure_started")
    async def test_logs_stream_returns_data_with_empty_dict(self) -> None:
        """Empty dict cache hit must return data with _fetched_at timestamp."""
        ts = "2026-04-04T12:00:00+00:00"
        with patch("unraid_mcp.subscriptions.resources.subscription_manager") as mock_mgr:
            mock_mgr.get_resource_snapshot = AsyncMock(
                return_value=_snapshot({}, ts, state="subscribed", active=True, fresh=True)
            )
            mcp = _make_resources()
            resource = _get_resource(mcp, "unraid://logs/stream")
            result = await resource.fn()
            parsed = json.loads(result)
            assert parsed["_fetched_at"] == ts


class TestAutoStartDisabledFallback:
    """When auto_start is disabled, resources fall back to on-demand subscribe_once."""

    @pytest.mark.parametrize("action", list(SNAPSHOT_ACTIONS.keys()))
    @pytest.mark.usefixtures("_mock_ensure_started")
    async def test_fallback_returns_subscribe_once_data(self, action: str) -> None:
        fallback_data = {"systemMetricsCpu": {"percentTotal": 42.0}}
        with (
            patch("unraid_mcp.subscriptions.resources.subscription_manager") as mock_mgr,
            patch(
                "unraid_mcp.subscriptions.resources.subscribe_once",
                new=AsyncMock(return_value=fallback_data),
            ),
        ):
            mock_mgr.get_resource_snapshot = AsyncMock(return_value=_snapshot())
            mock_mgr.auto_start_enabled = False
            mcp = _make_resources()
            resource = _get_resource(mcp, f"unraid://live/{action}")
            result = await resource.fn()
        assert json.loads(result) == fallback_data

    @pytest.mark.parametrize("action", list(SNAPSHOT_ACTIONS.keys()))
    @pytest.mark.usefixtures("_mock_ensure_started")
    async def test_fallback_failure_returns_error(self, action: str) -> None:
        """When on-demand fallback itself fails, surface the actual error."""
        with (
            patch("unraid_mcp.subscriptions.resources.subscription_manager") as mock_mgr,
            patch(
                "unraid_mcp.subscriptions.resources.subscribe_once",
                new=AsyncMock(side_effect=Exception("WebSocket failed")),
            ),
        ):
            mock_mgr.get_resource_snapshot = AsyncMock(return_value=_snapshot())
            mock_mgr.auto_start_enabled = False
            mcp = _make_resources()
            resource = _get_resource(mcp, f"unraid://live/{action}")
            result = await resource.fn()
        parsed = json.loads(result)
        assert parsed["status"] == "error"
        assert "WebSocket failed" in parsed["message"]


class TestEnsureSubscriptionsStarted:
    """C1 / PERF-H1: a failed autostart must latch (no stampede) and surface the
    error, instead of being silently swallowed and re-attempted on every call."""

    @pytest.fixture
    def _reset_startup_state(self):
        import unraid_mcp.subscriptions.resources as res

        res._subscriptions_started = False
        res._last_startup_error = None
        try:
            yield res
        finally:
            res._subscriptions_started = False
            res._last_startup_error = None

    async def test_failed_autostart_without_spawned_loops_retries(
        self, _reset_startup_state
    ) -> None:
        """No loops spawned (config/programming error) -> do NOT latch, retry every call."""
        res = _reset_startup_state
        mock = AsyncMock(side_effect=RuntimeError("ws backend down"))
        # No subscription loops were actually spawned.
        with (
            patch.object(res, "autostart_subscriptions", mock),
            patch.object(res.subscription_manager, "active_subscriptions", {}),
        ):
            await res.ensure_subscriptions_started()
            await res.ensure_subscriptions_started()
            await res.ensure_subscriptions_started()
        # Flag left unset -> autostart retried on every call (no permanent brick).
        assert mock.call_count == 3
        assert res._subscriptions_started is False
        # Error still recorded and observable instead of swallowed (C1).
        err = res.get_last_startup_error()
        assert err is not None and "ws backend down" in err

    async def test_failed_autostart_with_spawned_loops_latches(self, _reset_startup_state) -> None:
        """At least one loop spawned (self-healing) -> latch, no per-call stampede (PERF-H1)."""
        res = _reset_startup_state
        mock = AsyncMock(side_effect=RuntimeError("ws backend down"))
        # A subscription loop was spawned before the failure -> active_subscriptions non-empty.
        with (
            patch.object(res, "autostart_subscriptions", mock),
            patch.object(
                res.subscription_manager, "active_subscriptions", {"systemMetricsCpu": object()}
            ),
        ):
            await res.ensure_subscriptions_started()
            await res.ensure_subscriptions_started()
            await res.ensure_subscriptions_started()
        # Latched after the first attempt — spawned loops self-heal via reconnect.
        assert mock.call_count == 1
        assert res._subscriptions_started is True
        # Error recorded and observable instead of swallowed (C1).
        err = res.get_last_startup_error()
        assert err is not None and "ws backend down" in err

    async def test_successful_autostart_clears_error(self, _reset_startup_state) -> None:
        res = _reset_startup_state
        mock = AsyncMock()
        with patch.object(res, "autostart_subscriptions", mock):
            await res.ensure_subscriptions_started()
            await res.ensure_subscriptions_started()
        assert mock.call_count == 1
        assert res.get_last_startup_error() is None

    async def test_cancellation_does_not_latch(self, _reset_startup_state) -> None:
        import asyncio

        res = _reset_startup_state
        mock = AsyncMock(side_effect=asyncio.CancelledError())
        with (
            patch.object(res, "autostart_subscriptions", mock),
            pytest.raises(asyncio.CancelledError),
        ):
            await res.ensure_subscriptions_started()
        # Shutdown path: flag NOT latched so a later call can retry.
        assert res._subscriptions_started is False
