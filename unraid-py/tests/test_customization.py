# tests/test_customization.py
"""Tests for customization subactions of the consolidated unraid tool."""

from __future__ import annotations

from typing import Any
from unittest.mock import AsyncMock, patch

import pytest
from conftest import make_tool_fn


@pytest.fixture
def _mock_graphql():
    with patch("unraid_mcp.core.client.make_graphql_request", new_callable=AsyncMock) as m:
        yield m


def _make_tool() -> Any:
    return make_tool_fn("unraid_mcp.tools.unraid", "register_unraid_tool", "unraid")


@pytest.mark.asyncio
async def test_theme_subaction_removed(_mock_graphql):
    # The upstream `customization { theme partnerInfo }` shape was removed in
    # unraid-api 4.35; the `theme` subaction no longer exists. Theme info is now
    # served by `public_theme` and `system/display`.
    from unraid_mcp.core.exceptions import ToolError

    with pytest.raises(ToolError, match="theme"):
        await _make_tool()(action="customization", subaction="theme")


@pytest.mark.asyncio
async def test_public_theme(_mock_graphql):
    _mock_graphql.return_value = {"publicTheme": {"name": "black"}}
    result = await _make_tool()(action="customization", subaction="public_theme")
    assert result["publicTheme"]["name"] == "black"


@pytest.mark.asyncio
async def test_is_initial_setup(_mock_graphql):
    # `isInitialSetup` was renamed to `isFreshInstall` upstream; the subaction
    # name is unchanged but the response surfaces the new field.
    _mock_graphql.return_value = {"isFreshInstall": False}
    result = await _make_tool()(action="customization", subaction="is_initial_setup")
    assert result["isFreshInstall"] is False


@pytest.mark.asyncio
async def test_set_theme_requires_theme(_mock_graphql):
    from unraid_mcp.core.exceptions import ToolError

    with pytest.raises(ToolError, match="theme_name"):
        await _make_tool()(action="customization", subaction="set_theme")


@pytest.mark.asyncio
async def test_set_theme_success(_mock_graphql):
    _mock_graphql.return_value = {
        "customization": {"setTheme": {"name": "azure", "showBannerImage": True}}
    }
    result = await _make_tool()(action="customization", subaction="set_theme", theme_name="azure")
    assert result["success"] is True


@pytest.mark.asyncio
async def test_sso_enabled_returns_true(_mock_graphql):
    _mock_graphql.return_value = {"isSSOEnabled": True}
    result = await _make_tool()(action="customization", subaction="sso_enabled")
    assert result["isSSOEnabled"] is True


@pytest.mark.asyncio
async def test_sso_enabled_returns_false(_mock_graphql):
    _mock_graphql.return_value = {"isSSOEnabled": False}
    result = await _make_tool()(action="customization", subaction="sso_enabled")
    assert result["isSSOEnabled"] is False


@pytest.mark.asyncio
async def test_set_locale_requires_locale(_mock_graphql):
    from unraid_mcp.core.exceptions import ToolError

    with pytest.raises(ToolError, match="locale is required"):
        await _make_tool()(action="customization", subaction="set_locale")


@pytest.mark.asyncio
async def test_set_locale_success(_mock_graphql):
    _mock_graphql.return_value = {"customization": {"setLocale": "en_US"}}
    result = await _make_tool()(action="customization", subaction="set_locale", locale="en_US")
    assert result["success"] is True
    assert result["locale"] == "en_US"
