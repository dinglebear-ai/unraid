"""Tests for health subactions of the consolidated unraid tool."""

from collections.abc import Generator
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from conftest import make_tool_fn

from unraid_mcp.core.exceptions import ToolError
from unraid_mcp.core.utils import safe_display_url


@pytest.fixture
def _mock_graphql() -> Generator[AsyncMock, None, None]:
    with patch("unraid_mcp.core.client.make_graphql_request", new_callable=AsyncMock) as mock:
        yield mock


def _make_tool():
    return make_tool_fn("unraid_mcp.tools.unraid", "register_unraid_tool", "unraid")


class TestHealthValidation:
    async def test_invalid_subaction(self, _mock_graphql: AsyncMock) -> None:
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="Invalid subaction"):
            await tool_fn(action="health", subaction="invalid")


class TestHealthActions:
    async def test_test_connection(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {"online": True}
        tool_fn = _make_tool()
        result = await tool_fn(action="health", subaction="test_connection")
        assert result["status"] == "connected"
        assert result["online"] is True
        assert "latency_ms" in result

    async def test_check_healthy(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {
            "info": {
                "time": "2026-02-08T12:00:00Z",
                "versions": {"unraid": "7.2.0"},
                "os": {"uptime": 86400},
            },
            "array": {"state": "STARTED"},
            "notifications": {"overview": {"unread": {"alert": 0, "warning": 0, "total": 3}}},
            "docker": {"containers": [{"id": "c1", "state": "RUNNING", "status": "Up 2 days"}]},
        }
        tool_fn = _make_tool()
        result = await tool_fn(action="health", subaction="check")
        assert result["status"] == "healthy"
        assert "api_latency_ms" in result

    async def test_check_does_not_expose_machine_id(self, _mock_graphql: AsyncMock) -> None:
        """health/check must not surface machineId (CWE-200 hardware fingerprint).

        Even if the upstream API were to return machineId, the health summary must
        not echo it into unraid_system.
        """
        _mock_graphql.return_value = {
            "info": {
                "machineId": "should-not-leak",
                "time": "2026-02-08T12:00:00Z",
                "versions": {"unraid": "7.2.0"},
                "os": {"uptime": 86400},
            },
            "array": {"state": "STARTED"},
            "notifications": {"overview": {"unread": {"alert": 0, "warning": 0, "total": 0}}},
            "docker": {"containers": []},
        }
        tool_fn = _make_tool()
        result = await tool_fn(action="health", subaction="check")
        assert "machine_id" not in result.get("unraid_system", {})
        # And the query the handler issues must not even ask for it.
        sent_query = _mock_graphql.call_args.args[0]
        assert "machineId" not in sent_query

    async def test_check_docker_counts_uppercase_states(self, _mock_graphql: AsyncMock) -> None:
        """ContainerState enum is UPPERCASE — running/stopped counts must use case-insensitive match."""
        _mock_graphql.return_value = {
            "info": {
                "versions": {"core": {"unraid": "7.0"}},
                "os": {"uptime": 1},
            },
            "array": {"state": "STARTED"},
            "notifications": {"overview": {"unread": {"alert": 0, "warning": 0, "total": 0}}},
            "docker": {
                "containers": [
                    {"id": "c1", "state": "RUNNING"},
                    {"id": "c2", "state": "RUNNING"},
                    {"id": "c3", "state": "EXITED"},
                ]
            },
        }
        tool_fn = _make_tool()
        result = await tool_fn(action="health", subaction="check")
        svc = result["docker_services"]
        assert svc["total"] == 3
        assert svc["running"] == 2
        assert svc["stopped"] == 1

    async def test_check_warning_on_alerts(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {
            "info": {"versions": {"unraid": "7.2"}, "os": {"uptime": 100}},
            "array": {"state": "STARTED"},
            "notifications": {"overview": {"unread": {"alert": 3, "warning": 0, "total": 3}}},
            "docker": {"containers": []},
        }
        tool_fn = _make_tool()
        result = await tool_fn(action="health", subaction="check")
        assert result["status"] == "warning"
        assert any("alert" in i for i in result.get("issues", []))

    async def test_check_no_data(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {}
        tool_fn = _make_tool()
        result = await tool_fn(action="health", subaction="check")
        assert result["status"] == "unhealthy"

    async def test_check_api_error_connection(self, _mock_graphql: AsyncMock) -> None:
        """httpx connection errors return {status: unhealthy} — they are expected failure modes."""
        import httpx

        _mock_graphql.side_effect = httpx.ConnectError("Connection refused")
        tool_fn = _make_tool()
        result = await tool_fn(action="health", subaction="check")
        assert result["status"] == "unhealthy"
        assert "Connection refused" in result["error"]

    async def test_check_api_error_wrapped_tool_error(self, _mock_graphql: AsyncMock) -> None:
        """ToolError wrapping an httpx network error returns {status: unhealthy}.

        make_graphql_request raises ToolError (not raw httpx) for network failures.
        _comprehensive_health_check must inspect e.__cause__ to detect this.
        Dependency: make_graphql_request uses 'raise ToolError(...) from original_exc'.
        """
        import httpx

        from unraid_mcp.core.exceptions import ToolError as _ToolError

        cause = httpx.ConnectError("Connection refused")
        wrapped = _ToolError("API request failed")
        wrapped.__cause__ = cause
        _mock_graphql.side_effect = wrapped
        tool_fn = _make_tool()
        result = await tool_fn(action="health", subaction="check")
        assert result["status"] == "unhealthy"
        assert "Connection refused" in result["error"]

    async def test_check_api_error_logic_bug_propagates(self, _mock_graphql: AsyncMock) -> None:
        """Non-connection exceptions (logic bugs, import errors) must propagate to tool_error_handler."""
        _mock_graphql.side_effect = AttributeError("'NoneType' object has no attribute 'get'")
        tool_fn = _make_tool()
        with pytest.raises(ToolError):
            await tool_fn(action="health", subaction="check")

    async def test_check_severity_never_downgrades(self, _mock_graphql: AsyncMock) -> None:
        """Degraded from missing info should not be overwritten by warning from alerts."""
        _mock_graphql.return_value = {
            "info": {},
            "array": {"state": "STARTED"},
            "notifications": {"overview": {"unread": {"alert": 5, "warning": 0, "total": 5}}},
            "docker": {"containers": []},
        }
        tool_fn = _make_tool()
        result = await tool_fn(action="health", subaction="check")
        # Missing info escalates to "degraded"; alerts only escalate to "warning"
        # Severity should stay at "degraded" (not downgrade to "warning")
        assert result["status"] == "degraded"

    async def test_diagnose_success(self, _mock_graphql: AsyncMock) -> None:
        """Diagnose returns subscription status."""
        tool_fn = _make_tool()
        mock_status = {"cpu": {"connection_state": "connected"}}
        mock_manager = MagicMock()
        mock_manager.get_subscription_status = AsyncMock(return_value=mock_status)
        mock_manager.auto_start_enabled = True
        mock_manager.max_reconnect_attempts = 3
        mock_manager.subscription_configs = {}
        mock_manager.active_subscriptions = {}
        mock_manager.resource_data = {}

        mock_error = MagicMock()
        mock_error.get_error_stats.return_value = {}

        with (
            patch("unraid_mcp.subscriptions.manager.subscription_manager", mock_manager),
            patch("unraid_mcp.subscriptions.resources.ensure_subscriptions_started", AsyncMock()),
            patch(
                "unraid_mcp.subscriptions.utils.analyze_subscription_status",
                return_value=(0, []),
            ),
            patch("unraid_mcp.server._error_middleware", mock_error),
        ):
            result = await tool_fn(action="health", subaction="diagnose")
        assert "subscriptions" in result
        assert "summary" in result
        assert "cache" in result  # still present, now a static note dict
        assert "errors" in result

    async def test_diagnose_wraps_exception(self, _mock_graphql: AsyncMock) -> None:
        """When subscription manager raises, tool wraps in ToolError."""
        tool_fn = _make_tool()
        mock_manager = MagicMock()
        mock_manager.get_subscription_status = AsyncMock(side_effect=RuntimeError("broken"))

        with (
            patch("unraid_mcp.subscriptions.manager.subscription_manager", mock_manager),
            patch("unraid_mcp.subscriptions.resources.ensure_subscriptions_started", AsyncMock()),
            patch(
                "unraid_mcp.subscriptions.utils.analyze_subscription_status",
                return_value=(0, []),
            ),
            pytest.raises(ToolError, match="Internal error executing health/diagnose"),
        ):
            await tool_fn(action="health", subaction="diagnose")


# ---------------------------------------------------------------------------
# _safe_display_url — URL redaction helper
# ---------------------------------------------------------------------------


class TestSafeDisplayUrl:
    """Verify that safe_display_url strips credentials/path and preserves scheme+host+port."""

    def test_none_returns_none(self) -> None:
        assert safe_display_url(None) is None

    def test_empty_string_returns_none(self) -> None:
        assert safe_display_url("") is None

    def test_simple_url_scheme_and_host(self) -> None:
        assert safe_display_url("https://unraid.local/graphql") == "https://unraid.local"

    def test_preserves_port(self) -> None:
        assert safe_display_url("https://10.1.0.2:31337/api/graphql") == "https://10.1.0.2:31337"

    def test_strips_path(self) -> None:
        result = safe_display_url("http://unraid.local/some/deep/path?query=1")
        assert result is not None
        assert "path" not in result
        assert "query" not in result

    def test_strips_credentials(self) -> None:
        result = safe_display_url("https://user:password@unraid.local/graphql")
        assert result is not None
        assert "user" not in result
        assert "password" not in result
        assert result == "https://unraid.local"

    def test_strips_query_params(self) -> None:
        result = safe_display_url("http://host.local?token=abc&key=xyz")
        assert result is not None
        assert "token" not in result
        assert "abc" not in result

    def test_http_scheme_preserved(self) -> None:
        result = safe_display_url("http://10.0.0.1:8080/api")
        assert result == "http://10.0.0.1:8080"

    def test_tailscale_url(self) -> None:
        result = safe_display_url("https://100.118.209.1:31337/graphql")
        assert result == "https://100.118.209.1:31337"

    def test_malformed_ipv6_url_returns_unparseable(self) -> None:
        """Malformed IPv6 brackets in netloc cause urlparse.hostname to raise ValueError."""
        result = safe_display_url("https://[invalid")
        assert result == "<unparseable>"


@pytest.mark.asyncio
async def test_health_setup_not_configured_returns_manual_instructions(tmp_path) -> None:
    """setup returns plugin + manual .env instructions when no creds and no file exist."""
    missing_env = tmp_path / "absent" / ".env"  # guaranteed not to exist

    tool_fn = _make_tool()
    with (
        patch("unraid_mcp.config.settings.UNRAID_API_URL", None),
        patch("unraid_mcp.config.settings.UNRAID_API_KEY", None),
        patch("unraid_mcp.config.settings.CREDENTIALS_ENV_PATH", missing_env),
    ):
        result = await tool_fn(action="health", subaction="setup", ctx=MagicMock())

    assert "not configured" in result.lower()
    assert str(missing_env) in result
    assert "UNRAID_API_URL=" in result
    assert "UNRAID_API_KEY=" in result


@pytest.mark.asyncio
async def test_health_setup_file_exists_but_not_loaded(tmp_path) -> None:
    """setup distinguishes a present-but-unloaded .env (e.g. just written) from missing config."""
    env_file = tmp_path / ".env"
    env_file.write_text("UNRAID_API_URL=https://x\nUNRAID_API_KEY=y\n")

    tool_fn = _make_tool()
    with (
        # is_configured() is False (globals captured at startup), but the file is on disk.
        patch("unraid_mcp.config.settings.UNRAID_API_URL", None),
        patch("unraid_mcp.config.settings.UNRAID_API_KEY", None),
        patch("unraid_mcp.config.settings.CREDENTIALS_ENV_PATH", env_file),
    ):
        result = await tool_fn(action="health", subaction="setup", ctx=MagicMock())

    assert "not loaded" in result.lower()
    assert "restart" in result.lower()
    assert str(env_file) in result


@pytest.mark.asyncio
async def test_health_setup_configured_and_working_reports_status() -> None:
    """setup reports configured + working status without any prompting."""
    tool_fn = _make_tool()
    with (
        patch("unraid_mcp.config.settings.UNRAID_API_URL", "https://my-unraid.example.com:31337"),
        patch("unraid_mcp.config.settings.UNRAID_API_KEY", "key123"),
        patch(
            "unraid_mcp.core.client.make_graphql_request",
            new=AsyncMock(return_value={"online": True}),
        ),
    ):
        result = await tool_fn(action="health", subaction="setup", ctx=MagicMock())

    assert "configured" in result.lower()
    assert "succeeded" in result.lower()
    assert "restart" in result.lower()


@pytest.mark.asyncio
async def test_health_setup_configured_but_connection_fails_reports_failure() -> None:
    """setup reports configured-but-failing status without prompting."""
    tool_fn = _make_tool()
    with (
        patch("unraid_mcp.config.settings.UNRAID_API_URL", "https://my-unraid.example.com:31337"),
        patch("unraid_mcp.config.settings.UNRAID_API_KEY", "key123"),
        patch(
            "unraid_mcp.core.client.make_graphql_request",
            new=AsyncMock(side_effect=Exception("connection refused")),
        ),
    ):
        result = await tool_fn(action="health", subaction="setup", ctx=MagicMock())

    assert "configured" in result.lower()
    assert "connection test failed" in result.lower()


@pytest.mark.asyncio
async def test_health_setup_never_calls_elicit() -> None:
    """setup must not invoke ctx.elicit for any configuration state."""
    tool_fn = _make_tool()
    mock_ctx = MagicMock()
    mock_ctx.elicit = AsyncMock()
    with (
        patch("unraid_mcp.config.settings.UNRAID_API_URL", None),
        patch("unraid_mcp.config.settings.UNRAID_API_KEY", None),
    ):
        await tool_fn(action="health", subaction="setup", ctx=mock_ctx)

    mock_ctx.elicit.assert_not_called()
