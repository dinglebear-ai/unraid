"""End-to-end round trips against the schema-faithful mock GraphQL server.

These exercise the REAL httpx client (`make_graphql_request`) and tool handlers
against a graphql-yoga + addMocksToSchema server built from the bundled SDL — no
live Unraid, no `make_graphql_request` patching. Unlike the dict-mock unit tests,
this proves the actual HTTP path and that the queries are valid against a
schema-accurate server.

Skips automatically unless `npm --prefix tests/mock install` has been run.
"""

from __future__ import annotations

import pytest


pytestmark = pytest.mark.mockserver


async def test_raw_query_roundtrip(mock_graphql_env: str) -> None:
    from unraid_mcp.core.client import make_graphql_request

    data = await make_graphql_request("query { isFreshInstall }")
    assert "isFreshInstall" in data
    assert isinstance(data["isFreshInstall"], bool)


async def test_handler_query_roundtrip(mock_graphql_env: str) -> None:
    from unraid_mcp.tools._customization import _handle_customization

    result = await _handle_customization("sso_enabled", None)
    assert "isSSOEnabled" in result
    assert isinstance(result["isSSOEnabled"], bool)


async def test_handler_mutation_roundtrip(mock_graphql_env: str) -> None:
    # set_theme runs the real mutation HTTP path; the mock returns a Theme object.
    from unraid_mcp.tools._customization import _handle_customization

    result = await _handle_customization("set_theme", "white")
    assert result["success"] is True
    assert result["data"] is not None


async def test_list_query_roundtrip(mock_graphql_env: str) -> None:
    # Exercises coerce_list + cap_list pagination over a real list response.
    from unraid_mcp.tools._array import _handle_array

    result = await _handle_array("assignable_disks", None, None, None, None, False, limit=5)
    assert result["success"] is True
    disks = result["data"]["assignableDisks"]
    assert isinstance(disks, list)
    assert "page" in result
