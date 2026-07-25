"""Tests for subscription manager cache and lifecycle behavior.

_cap_log_content is a pure utility that prevents unbounded memory growth from
log subscription data. It must: return a NEW dict (not mutate), recursively
cap nested 'content' fields, and only truncate when both byte limit and line
limit are exceeded.
"""

import asyncio
from datetime import UTC, datetime, timedelta
from unittest.mock import patch

import pytest

from unraid_mcp.core.types import SubscriptionData
from unraid_mcp.subscriptions.manager import SubscriptionManager, _cap_log_content


class TestCapLogContentImmutability:
    """The function must return a new dict — never mutate the input."""

    def test_returns_new_dict(self) -> None:
        data = {"key": "value"}
        result = _cap_log_content(data)
        assert result is not data

    def test_input_not_mutated_on_passthrough(self) -> None:
        data = {"content": "short text", "other": "value"}
        original_content = data["content"]
        _cap_log_content(data)
        assert data["content"] == original_content

    def test_input_not_mutated_on_truncation(self) -> None:
        # Use small limits so the truncation path is exercised
        large_content = "\n".join(f"line {i}" for i in range(200))
        data = {"content": large_content}
        with (
            patch("unraid_mcp.subscriptions.manager._MAX_RESOURCE_DATA_BYTES", 10),
            patch("unraid_mcp.subscriptions.manager._MAX_RESOURCE_DATA_LINES", 50),
        ):
            _cap_log_content(data)
        # Original data must be unchanged
        assert data["content"] == large_content


class TestCapLogContentSmallData:
    """Content below the byte limit must be returned unchanged."""

    def test_small_content_unchanged(self) -> None:
        data = {"content": "just a few lines\nof log data\n"}
        result = _cap_log_content(data)
        assert result["content"] == data["content"]

    def test_non_content_keys_passed_through(self) -> None:
        data = {"name": "cpu_subscription", "timestamp": "2026-02-18T00:00:00Z"}
        result = _cap_log_content(data)
        assert result == data

    def test_integer_value_passed_through(self) -> None:
        data = {"count": 42, "active": True}
        result = _cap_log_content(data)
        assert result == data


class TestCapLogContentTruncation:
    """Content exceeding both byte AND line limits must be truncated to the last N lines."""

    def test_oversized_content_truncated_and_byte_capped(self) -> None:
        # 200 lines, tiny byte limit: must keep recent content within byte cap.
        lines = [f"line {i}" for i in range(200)]
        data = {"content": "\n".join(lines)}
        with (
            patch("unraid_mcp.subscriptions.manager._MAX_RESOURCE_DATA_BYTES", 10),
            patch("unraid_mcp.subscriptions.manager._MAX_RESOURCE_DATA_LINES", 50),
        ):
            result = _cap_log_content(data)
        result_lines = result["content"].splitlines()
        assert len(result["content"].encode("utf-8", errors="replace")) <= 10
        # Must keep the most recent line suffix.
        assert result_lines[-1] == "line 199"

    def test_content_with_fewer_lines_than_limit_still_honors_byte_cap(self) -> None:
        """If byte limit is exceeded, output must still be capped even with few lines."""
        # 30 lines, byte limit 10, line limit 50 -> must cap bytes regardless of line count
        lines = [f"line {i}" for i in range(30)]
        data = {"content": "\n".join(lines)}
        with (
            patch("unraid_mcp.subscriptions.manager._MAX_RESOURCE_DATA_BYTES", 10),
            patch("unraid_mcp.subscriptions.manager._MAX_RESOURCE_DATA_LINES", 50),
        ):
            result = _cap_log_content(data)
        assert len(result["content"].encode("utf-8", errors="replace")) <= 10

    def test_non_content_keys_preserved_alongside_truncated_content(self) -> None:
        lines = [f"line {i}" for i in range(200)]
        data = {"content": "\n".join(lines), "path": "/var/log/syslog", "total_lines": 200}
        with (
            patch("unraid_mcp.subscriptions.manager._MAX_RESOURCE_DATA_BYTES", 10),
            patch("unraid_mcp.subscriptions.manager._MAX_RESOURCE_DATA_LINES", 50),
        ):
            result = _cap_log_content(data)
        assert result["path"] == "/var/log/syslog"
        assert result["total_lines"] == 200
        assert len(result["content"].encode("utf-8", errors="replace")) <= 10


class TestCapLogContentNested:
    """Nested 'content' fields inside sub-dicts must also be capped recursively."""

    def test_nested_content_field_capped(self) -> None:
        lines = [f"line {i}" for i in range(200)]
        data = {"logFile": {"content": "\n".join(lines), "path": "/var/log/syslog"}}
        with (
            patch("unraid_mcp.subscriptions.manager._MAX_RESOURCE_DATA_BYTES", 10),
            patch("unraid_mcp.subscriptions.manager._MAX_RESOURCE_DATA_LINES", 50),
        ):
            result = _cap_log_content(data)
        assert len(result["logFile"]["content"].encode("utf-8", errors="replace")) <= 10
        assert result["logFile"]["path"] == "/var/log/syslog"

    def test_deeply_nested_content_capped(self) -> None:
        lines = [f"line {i}" for i in range(200)]
        data = {"outer": {"inner": {"content": "\n".join(lines)}}}
        with (
            patch("unraid_mcp.subscriptions.manager._MAX_RESOURCE_DATA_BYTES", 10),
            patch("unraid_mcp.subscriptions.manager._MAX_RESOURCE_DATA_LINES", 50),
        ):
            result = _cap_log_content(data)
        assert len(result["outer"]["inner"]["content"].encode("utf-8", errors="replace")) <= 10

    def test_nested_non_content_keys_unaffected(self) -> None:
        data = {"metrics": {"cpu": 42.5, "memory": 8192}}
        result = _cap_log_content(data)
        assert result == data


class TestCapLogContentSingleMassiveLine:
    """A single line larger than the byte cap must be hard-capped at byte level."""

    def test_single_massive_line_hard_caps_bytes(self) -> None:
        # One line, no newlines, larger than the byte cap.
        # The while-loop can't reduce it (len(lines) == 1), so the
        # last-resort byte-slice path at manager.py:65-69 must fire.
        huge_content = "x" * 200
        data = {"content": huge_content}
        with (
            patch("unraid_mcp.subscriptions.manager._MAX_RESOURCE_DATA_BYTES", 10),
            patch("unraid_mcp.subscriptions.manager._MAX_RESOURCE_DATA_LINES", 5_000),
        ):
            result = _cap_log_content(data)
        assert len(result["content"].encode("utf-8", errors="replace")) <= 10

    def test_single_massive_line_input_not_mutated(self) -> None:
        huge_content = "x" * 200
        data = {"content": huge_content}
        with (
            patch("unraid_mcp.subscriptions.manager._MAX_RESOURCE_DATA_BYTES", 10),
            patch("unraid_mcp.subscriptions.manager._MAX_RESOURCE_DATA_LINES", 5_000),
        ):
            _cap_log_content(data)
        assert data["content"] == huge_content


class TestGetSummary:
    """get_summary() must report aggregate counts/states from seeded state.

    The accessor is the public, locked replacement for diagnostics.py reaching
    into the manager's internal state directly (arch-L1).
    """

    async def test_summary_reflects_seeded_state(self) -> None:
        mgr = SubscriptionManager()
        # One subscription with a live (fake) task -> counts as active.
        mgr.active_subscriptions["cpu"] = object()  # type: ignore[assignment]
        mgr.connection_states["cpu"] = "subscribed"
        # A second subscription that has cached data but no task.
        mgr.connection_states["memory"] = "connected"
        mgr.resource_data["memory"] = SubscriptionData(
            data={"systemMetricsMemory": {"percentTotal": 33.0}},
            last_updated=datetime.now(UTC),
        )

        summary = await mgr.get_summary()

        # Counts derived under the appropriate locks.
        assert summary["active_count"] == 1
        assert summary["with_data"] == 1
        assert summary["total_configured"] == len(mgr.subscription_configs)
        assert summary["auto_start_count"] == sum(
            1 for c in mgr.subscription_configs.values() if c.get("auto_start")
        )

        # Per-name connection states are surfaced as a plain snapshot dict.
        assert summary["connection_states"]["cpu"] == "subscribed"
        assert summary["connection_states"]["memory"] == "connected"

        # Config values are echoed through.
        assert summary["auto_start_enabled"] == mgr.auto_start_enabled
        assert summary["max_reconnect_attempts"] == mgr.max_reconnect_attempts

    async def test_summary_empty_manager_has_zero_counts(self) -> None:
        mgr = SubscriptionManager()
        summary = await mgr.get_summary()
        assert summary["active_count"] == 0
        assert summary["with_data"] == 0
        assert summary["connection_states"] == {}
        # total_configured is non-zero because configs are built in __init__.
        assert summary["total_configured"] == len(mgr.subscription_configs)


class TestSubscriptionDataGeneration:
    async def test_valid_data_recovers_transient_error_state(self) -> None:
        mgr = SubscriptionManager()
        mgr.connection_states["cpu"] = "error"
        mgr.last_error["cpu"] = "transient subscription error"

        await mgr._store_subscription_data(
            "cpu",
            {"systemMetricsCpu": {"percentTotal": 42.0}},
            generation=mgr.states["cpu"].generation,
        )

        assert mgr.connection_states["cpu"] == "subscribed"
        assert mgr.states["cpu"].last_error is None
        assert mgr.resource_data["cpu"].data["systemMetricsCpu"]["percentTotal"] == 42.0

    async def test_superseded_generation_still_cannot_replace_cache(self) -> None:
        mgr = SubscriptionManager()
        mgr.connection_states["cpu"] = "subscribed"
        mgr.states["cpu"].generation = 2

        await mgr._store_subscription_data(
            "cpu",
            {"systemMetricsCpu": {"percentTotal": 99.0}},
            generation=1,
        )

        assert "cpu" not in mgr.resource_data


class TestStateAwareResourceSnapshot:
    async def test_terminal_state_never_returns_cached_payload(self) -> None:
        mgr = SubscriptionManager()
        mgr.connection_states["cpu"] = "auth_failed"
        mgr.last_error["cpu"] = "bad token"
        mgr.resource_data["cpu"] = SubscriptionData(
            data={"systemMetricsCpu": {"percentTotal": 99.0}},
            last_updated=datetime.now(UTC),
        )

        snapshot = await mgr.get_resource_snapshot("cpu")

        assert snapshot.data is None
        assert snapshot.fresh is False
        assert snapshot.connection_state == "auth_failed"
        assert snapshot.last_error == "bad token"

    async def test_subscribed_active_state_returns_fresh_payload(self) -> None:
        mgr = SubscriptionManager()
        task = asyncio.create_task(asyncio.sleep(10))
        try:
            mgr.active_subscriptions["cpu"] = task
            mgr.connection_states["cpu"] = "subscribed"
            mgr.resource_data["cpu"] = SubscriptionData(
                data={"systemMetricsCpu": {"percentTotal": 42.0}},
                last_updated=datetime.now(UTC),
            )

            snapshot = await mgr.get_resource_snapshot("cpu")

            assert snapshot.data == {"systemMetricsCpu": {"percentTotal": 42.0}}
            assert snapshot.fresh is True
            assert snapshot.fetched_at is not None
            assert snapshot.stale is False
            assert snapshot.age_seconds is not None
        finally:
            task.cancel()
            with pytest.raises(asyncio.CancelledError):
                await task

    async def test_active_cache_older_than_max_age_is_stale(self) -> None:
        mgr = SubscriptionManager()
        task = asyncio.create_task(asyncio.sleep(10))
        try:
            mgr.active_subscriptions["cpu"] = task
            mgr.connection_states["cpu"] = "subscribed"
            mgr.resource_data["cpu"] = SubscriptionData(
                data={"systemMetricsCpu": {"percentTotal": 42.0}},
                last_updated=datetime.now(UTC)
                - timedelta(
                    seconds=mgr.runtime_settings.unraid_subscription_cache_max_age_seconds + 1
                ),
            )

            snapshot = await mgr.get_resource_snapshot("cpu")

            assert snapshot.data is None
            assert snapshot.fresh is False
            assert snapshot.stale is True
            assert snapshot.age_seconds is not None
            assert (
                snapshot.age_seconds
                > mgr.runtime_settings.unraid_subscription_cache_max_age_seconds
            )
        finally:
            task.cancel()
            with pytest.raises(asyncio.CancelledError):
                await task

    async def test_stop_invalidates_cached_payload(self) -> None:
        mgr = SubscriptionManager()
        task = asyncio.create_task(asyncio.sleep(10))
        mgr.active_subscriptions["cpu"] = task
        mgr.connection_states["cpu"] = "subscribed"
        mgr.resource_data["cpu"] = SubscriptionData(
            data={"systemMetricsCpu": {"percentTotal": 42.0}},
            last_updated=datetime.now(UTC),
        )

        await mgr.stop_subscription("cpu")

        assert "cpu" not in mgr.resource_data
        snapshot = await mgr.get_resource_snapshot("cpu")
        assert snapshot.connection_state == "stopped"
        assert snapshot.data is None


class TestLifecycleGenerationSafety:
    async def test_old_stop_completion_cannot_overwrite_replacement(self) -> None:
        mgr = SubscriptionManager()
        cancellation_seen = asyncio.Event()
        release_old = asyncio.Event()
        calls = 0

        async def controlled_loop(*_args, **_kwargs) -> None:
            nonlocal calls
            calls += 1
            if calls == 1:
                try:
                    await asyncio.Event().wait()
                except asyncio.CancelledError:
                    cancellation_seen.set()
                    await release_old.wait()
                    return
            await asyncio.Event().wait()

        with patch.object(mgr, "_subscription_loop", new=controlled_loop):
            await mgr.start_subscription("cpu", "subscription { cpu { usage } }")
            old_task = mgr.active_subscriptions["cpu"]
            stopping = asyncio.create_task(mgr.stop_subscription("cpu"))
            await cancellation_seen.wait()

            await mgr.start_subscription("cpu", "subscription { cpu { usage } }")
            replacement = mgr.active_subscriptions["cpu"]
            assert replacement is not old_task

            release_old.set()
            await stopping

            assert mgr.active_subscriptions["cpu"] is replacement
            assert mgr.connection_states["cpu"] == "active"

            replacement.cancel()
            with pytest.raises(asyncio.CancelledError):
                await replacement
