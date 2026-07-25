"""Tests for user subactions of the consolidated unraid tool.

NOTE: Unraid GraphQL API only supports the me() query.
User management operations (list, add, delete, cloud, remote_access, origins) are NOT available in the API.
"""

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


class TestUsersValidation:
    """Test validation for invalid subactions."""

    async def test_invalid_subaction_rejected(self, _mock_graphql: AsyncMock) -> None:
        """Test that non-existent subactions are rejected with clear error."""
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="Invalid subaction"):
            await tool_fn(action="user", subaction="list")

        with pytest.raises(ToolError, match="Invalid subaction"):
            await tool_fn(action="user", subaction="add")

        with pytest.raises(ToolError, match="Invalid subaction"):
            await tool_fn(action="user", subaction="delete")

        with pytest.raises(ToolError, match="Invalid subaction"):
            await tool_fn(action="user", subaction="cloud")


class TestUsersActions:
    """Test the single supported subaction: me."""

    async def test_me(self, _mock_graphql: AsyncMock) -> None:
        """Test querying current authenticated user."""
        _mock_graphql.return_value = {
            "me": {"id": "u:1", "name": "root", "description": "", "roles": ["ADMIN"]}
        }
        tool_fn = _make_tool()
        result = await tool_fn(action="user", subaction="me")
        assert result["name"] == "root"
        assert result["roles"] == ["ADMIN"]
        _mock_graphql.assert_called_once()


class TestUsersNoneHandling:
    """Verify subactions raise ToolError (not silently return {}) when API returns None."""

    async def test_me_returns_none(self, _mock_graphql: AsyncMock) -> None:
        """Test that me raises ToolError when API returns None for user data."""
        _mock_graphql.return_value = {"me": None}
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="No user data returned"):
            await tool_fn(action="user", subaction="me")

    async def test_me_returns_empty_dict(self, _mock_graphql: AsyncMock) -> None:
        """Test that me raises ToolError when API returns an empty dict for user data."""
        _mock_graphql.return_value = {"me": {}}
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="No user data returned"):
            await tool_fn(action="user", subaction="me")
