"""Tests for the consolidated `unraid` tool's `help` and `subscriptions` actions.

These actions replaced the former standalone `unraid_help`, `diagnose_subscriptions`,
and `test_subscription_query` tools. They lock in the post-consolidation contract:
routing, the `subscription_query` requirement, and subaction validation.
"""

import json
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from conftest import make_tool_fn

from unraid_mcp.core.exceptions import ToolError
from unraid_mcp.core.types import SubscriptionData
from unraid_mcp.tools.unraid import _HELP_TEXT


def _make_tool():
    return make_tool_fn("unraid_mcp.tools.unraid", "register_unraid_tool", "unraid")


class TestHelpAction:
    async def test_help_returns_markdown_reference(self) -> None:
        tool_fn = _make_tool()
        # `help` takes no subaction — the default empty subaction must be accepted.
        result = await tool_fn(action="help")
        assert result == _HELP_TEXT

    async def test_help_doc_mentions_new_actions(self) -> None:
        tool_fn = _make_tool()
        result = await tool_fn(action="help")
        assert isinstance(result, str)
        assert "# Unraid MCP Server" in result
        # The folded actions must be documented in the reference.
        assert "subscriptions" in result
        assert "test_query" in result

    async def test_help_rejects_subaction(self) -> None:
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="help does not accept a subaction"):
            await tool_fn(action="help", subaction="anything")


class TestSubscriptionsAction:
    async def test_diagnose_routes_to_handler(self) -> None:
        tool_fn = _make_tool()
        sentinel = {"ok": True, "subscriptions": {}}
        with patch(
            "unraid_mcp.subscriptions.diagnostics.diagnose_subscriptions",
            new_callable=AsyncMock,
            return_value=sentinel,
        ) as mock_diag:
            result = await tool_fn(action="subscriptions", subaction="diagnose")
        assert result is sentinel
        mock_diag.assert_awaited_once_with()

    async def test_test_query_routes_with_query(self) -> None:
        tool_fn = _make_tool()
        query = "subscription { cpu { used idle system } }"
        sentinel = {"success": True}
        with patch(
            "unraid_mcp.subscriptions.diagnostics.test_subscription_query",
            new_callable=AsyncMock,
            return_value=sentinel,
        ) as mock_test:
            result = await tool_fn(
                action="subscriptions",
                subaction="test_query",
                subscription_query=query,
            )
        assert result is sentinel
        mock_test.assert_awaited_once_with(query)

    async def test_test_query_requires_subscription_query(self) -> None:
        tool_fn = _make_tool()
        # Guard fires before any WebSocket work, so no patching is needed.
        with pytest.raises(ToolError, match="subscription_query is required"):
            await tool_fn(action="subscriptions", subaction="test_query")

    async def test_invalid_subaction_rejected(self) -> None:
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="Invalid subaction"):
            await tool_fn(action="subscriptions", subaction="bogus")


# ---------------------------------------------------------------------------
# Direct diagnostics-handler tests (T-M1)
#
# The tests above only assert that the router dispatches to the handlers.
# These call diagnose_subscriptions() and test_subscription_query() directly
# with a seeded manager state to lock in the rendered payload contract and
# the allowlist-validation behaviour.
# ---------------------------------------------------------------------------


def _seeded_manager() -> "object":
    """Build a fresh SubscriptionManager seeded with a known error/data state."""
    from unraid_mcp.subscriptions.manager import SubscriptionManager

    mgr = SubscriptionManager()
    # Seed a subscription that is currently in a failure state with an error.
    mgr.connection_states["cpu"] = "auth_failed"
    mgr.last_error["cpu"] = "Authentication error: invalid api key"
    mgr.reconnect_attempts["cpu"] = 4
    # Seed a healthy subscription that has received data.
    mgr.connection_states["memory"] = "subscribed"
    mgr.resource_data["memory"] = SubscriptionData(
        data={"systemMetricsMemory": {"percentTotal": 33.0}},
        last_updated=datetime.now(UTC),
    )
    return mgr


class TestDiagnoseSubscriptionsHandler:
    async def test_diagnose_reports_connection_state_and_error(self) -> None:
        from unraid_mcp.subscriptions import diagnostics

        mgr = _seeded_manager()
        with (
            patch.object(diagnostics, "subscription_manager", mgr),
            patch.object(diagnostics, "ensure_subscriptions_started", new_callable=AsyncMock),
            patch.object(diagnostics._settings, "UNRAID_API_URL", "https://unraid.local"),
            patch.object(diagnostics._settings, "UNRAID_API_KEY", "a-key"),
        ):
            result = await diagnostics.diagnose_subscriptions()

        # Per-subscription connection state is surfaced.
        cpu_runtime = result["subscriptions"]["cpu"]["runtime"]
        assert cpu_runtime["connection_state"] == "auth_failed"
        assert cpu_runtime["last_error"] == "Authentication error: invalid api key"
        assert cpu_runtime["reconnect_attempts"] == 4

        # Summary counts reflect the seeded error + data state.
        summary = result["summary"]
        assert summary["in_error_state"] >= 1
        assert summary["with_data"] >= 1

        # The failing subscription is enumerated under connection_issues.
        issues = {i["subscription"]: i for i in summary["connection_issues"]}
        assert "cpu" in issues
        assert issues["cpu"]["state"] == "auth_failed"
        assert "invalid api key" in issues["cpu"]["error"]

        # Environment block echoes api-key presence and the websocket URL.
        assert result["environment"]["api_key_configured"] is True
        assert result["environment"]["websocket_url"] is not None

    async def test_diagnose_recommends_setting_api_key_when_missing(self) -> None:
        from unraid_mcp.subscriptions import diagnostics

        mgr = _seeded_manager()
        with (
            patch.object(diagnostics, "subscription_manager", mgr),
            patch.object(diagnostics, "ensure_subscriptions_started", new_callable=AsyncMock),
            patch.object(diagnostics._settings, "UNRAID_API_URL", "https://unraid.local"),
            patch.object(diagnostics._settings, "UNRAID_API_KEY", ""),
        ):
            result = await diagnostics.diagnose_subscriptions()

        assert result["environment"]["api_key_configured"] is False
        recs = " ".join(result["troubleshooting"]["recommendations"])
        assert "No API key configured" in recs


class TestTestSubscriptionQueryHandler:
    async def test_disallowed_field_rejected_before_any_network(self) -> None:
        from unraid_mcp.subscriptions.diagnostics import test_subscription_query

        # 'flash' is not in the allowlist; validation must reject it end-to-end
        # without ever opening a WebSocket.
        with (
            patch("unraid_mcp.subscriptions.protocol.websockets.connect") as mock_connect,
            pytest.raises(ToolError, match="is not allowed"),
        ):
            await test_subscription_query("subscription { flash { guid } }")
        mock_connect.assert_not_called()

    async def test_mutation_keyword_rejected(self) -> None:
        from unraid_mcp.subscriptions.diagnostics import test_subscription_query

        with pytest.raises(ToolError, match="not a mutation or query"):
            await test_subscription_query("mutation { startArray { id } }")

    @staticmethod
    def _mock_ws() -> MagicMock:
        ack = json.dumps({"type": "connection_ack"})
        data_resp = json.dumps(
            {"id": "test", "type": "next", "payload": {"data": {"cpu": {"used": 12}}}}
        )
        ws = MagicMock()
        ws.subprotocol = "graphql-transport-ws"
        ws.send = AsyncMock()
        # First recv() -> ack, second recv() -> data response.
        ws.recv = AsyncMock(side_effect=[ack, data_resp])
        return ws

    async def test_allowlisted_field_accepted_end_to_end(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """An allowlisted field passes validation and runs the WebSocket probe.

        With the raw-probe flag enabled, the upstream frame is echoed back.
        """
        from unraid_mcp.subscriptions.diagnostics import test_subscription_query

        monkeypatch.setattr(
            "unraid_mcp.subscriptions.diagnostics._settings.UNRAID_MCP_ENABLE_RAW_SUBSCRIPTION_PROBE",
            True,
        )
        ws = self._mock_ws()

        with (
            patch(
                "unraid_mcp.subscriptions.diagnostics.build_ws_url",
                return_value="ws://localhost:2999/graphql",
            ),
            patch(
                "unraid_mcp.subscriptions.diagnostics.build_ws_ssl_context",
                return_value=None,
            ),
            patch("unraid_mcp.subscriptions.protocol.websockets.connect") as mock_connect,
        ):
            mock_connect.return_value.__aenter__ = AsyncMock(return_value=ws)
            mock_connect.return_value.__aexit__ = AsyncMock(return_value=False)

            result = await test_subscription_query("subscription { cpu { used idle system } }")

        assert result["success"] is True
        assert result["validated_field"] == "cpu"
        assert result["query_tested"] == "subscription { cpu { used idle system } }"
        # Flag enabled -> raw upstream frame is included.
        assert result["response"]["payload"]["data"]["cpu"]["used"] == 12

    async def test_raw_frame_withheld_by_default(self, monkeypatch: pytest.MonkeyPatch) -> None:
        """SEC-M1: by default the probe must NOT echo the raw upstream frame."""
        from unraid_mcp.subscriptions.diagnostics import test_subscription_query

        monkeypatch.setattr(
            "unraid_mcp.subscriptions.diagnostics._settings.UNRAID_MCP_ENABLE_RAW_SUBSCRIPTION_PROBE",
            False,
        )
        ws = self._mock_ws()

        with (
            patch(
                "unraid_mcp.subscriptions.diagnostics.build_ws_url",
                return_value="ws://localhost:2999/graphql",
            ),
            patch(
                "unraid_mcp.subscriptions.diagnostics.build_ws_ssl_context",
                return_value=None,
            ),
            patch("unraid_mcp.subscriptions.protocol.websockets.connect") as mock_connect,
        ):
            mock_connect.return_value.__aenter__ = AsyncMock(return_value=ws)
            mock_connect.return_value.__aexit__ = AsyncMock(return_value=False)

            result = await test_subscription_query("subscription { cpu { used idle system } }")

        assert result["success"] is True
        assert result["first_frame_received"] is True
        assert result["validated_field"] == "cpu"
        # No raw frame leaked — response is a withheld-placeholder string, not the dict.
        assert isinstance(result["response"], str)
        assert "withheld" in result["response"].lower()
