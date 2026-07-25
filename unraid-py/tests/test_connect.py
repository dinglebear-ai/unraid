"""Tests for the connect (Unraid Connect / remote access) subactions."""

from collections.abc import Generator
from unittest.mock import AsyncMock, patch

import pytest
from conftest import make_tool_fn

from unraid_mcp.core.exceptions import ToolError


@pytest.fixture
def _mock_graphql() -> Generator[AsyncMock, None, None]:
    with patch("unraid_mcp.core.client.make_graphql_request", new_callable=AsyncMock) as mock:
        yield mock


def _make_tool():
    return make_tool_fn("unraid_mcp.tools.unraid", "register_unraid_tool", "unraid")


class TestConnectQueries:
    async def test_remote_access(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {
            "remoteAccess": {"accessType": "ALWAYS", "forwardType": "UPNP", "port": 1234}
        }
        result = await _make_tool()(action="connect", subaction="remote_access")
        assert result["remoteAccess"]["port"] == 1234

    async def test_cloud(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {"cloud": {"error": None, "cloud": {"status": "ok"}}}
        result = await _make_tool()(action="connect", subaction="cloud")
        assert result["cloud"]["cloud"]["status"] == "ok"


class TestConnectMutations:
    async def test_update_api_settings_requires_input(self, _mock_graphql: AsyncMock) -> None:
        # update_api_settings is destructive — gated before the input check.
        with pytest.raises(ToolError, match="confirm=True"):
            await _make_tool()(action="connect", subaction="update_api_settings")
        with pytest.raises(ToolError, match="connect_input is required"):
            await _make_tool()(action="connect", subaction="update_api_settings", confirm=True)

    async def test_update_api_settings_passes_input(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {"updateApiSettings": {"accessType": "DYNAMIC"}}
        result = await _make_tool()(
            action="connect",
            subaction="update_api_settings",
            connect_input={"accessType": "DYNAMIC", "port": 8443},
            confirm=True,
        )
        assert result["success"] is True
        sent_vars = _mock_graphql.call_args.args[1]
        assert sent_vars == {"input": {"accessType": "DYNAMIC", "port": 8443}}

    async def test_sign_in_requires_input(self, _mock_graphql: AsyncMock) -> None:
        # sign_in is destructive (registers with the cloud) — gated before input check.
        with pytest.raises(ToolError, match="confirm=True"):
            await _make_tool()(action="connect", subaction="sign_in")
        with pytest.raises(ToolError, match="connect_input is required"):
            await _make_tool()(action="connect", subaction="sign_in", confirm=True)

    async def test_sign_out_is_destructive(self, _mock_graphql: AsyncMock) -> None:
        with pytest.raises(ToolError, match="confirm=True"):
            await _make_tool()(action="connect", subaction="sign_out")

    async def test_sign_out_with_confirm(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {"connectSignOut": True}
        result = await _make_tool()(action="connect", subaction="sign_out", confirm=True)
        assert result["success"] is True

    async def test_setup_remote_access_is_destructive(self, _mock_graphql: AsyncMock) -> None:
        with pytest.raises(ToolError, match="confirm=True"):
            await _make_tool()(
                action="connect",
                subaction="setup_remote_access",
                connect_input={"accessType": "DISABLED"},
            )

    async def test_setup_remote_access_with_confirm(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {"setupRemoteAccess": True}
        result = await _make_tool()(
            action="connect",
            subaction="setup_remote_access",
            connect_input={"accessType": "DISABLED"},
            confirm=True,
        )
        assert result["result"] is True

    async def test_invalid_subaction(self, _mock_graphql: AsyncMock) -> None:
        with pytest.raises(ToolError, match="Invalid subaction"):
            await _make_tool()(action="connect", subaction="nope")


class TestConnectSuccessDerivation:
    async def test_sign_in_success(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {"connectSignIn": True}
        result = await _make_tool()(
            action="connect", subaction="sign_in", connect_input={"apiKey": "k"}, confirm=True
        )
        assert result["success"] is True
        assert result["result"] is True

    async def test_sign_in_false_is_not_success(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {"connectSignIn": False}
        result = await _make_tool()(
            action="connect", subaction="sign_in", connect_input={"apiKey": "bad"}, confirm=True
        )
        assert result["success"] is False

    async def test_enable_dynamic_remote_access_success(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {"enableDynamicRemoteAccess": True}
        result = await _make_tool()(
            action="connect",
            subaction="enable_dynamic_remote_access",
            connect_input={"url": {"type": "WAN"}, "enabled": True},
            confirm=True,
        )
        assert result["success"] is True

    async def test_setup_remote_access_false_is_not_success(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {"setupRemoteAccess": False}
        result = await _make_tool()(
            action="connect",
            subaction="setup_remote_access",
            connect_input={"accessType": "DISABLED"},
            confirm=True,
        )
        assert result["success"] is False
