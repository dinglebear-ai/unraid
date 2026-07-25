"""Shared test fixtures and helpers for Unraid MCP server tests."""

from collections.abc import Generator
from pathlib import Path
from typing import Any
from unittest.mock import AsyncMock, patch

import pytest
from fastmcp import FastMCP
from hypothesis import settings
from hypothesis.configuration import set_hypothesis_home_dir
from hypothesis.database import DirectoryBasedExampleDatabase


# Redirect hypothesis storage (unicode_data, constants) and example database
# to .cache/.hypothesis — keeps the repo root clean.
#
# deadline=None: the property tests re-register the (19-action) FastMCP `unraid`
# tool per generated example, so the first example carries import/registration
# warmup that can exceed hypothesis's default 200ms per-example deadline and flake
# CI. These tests assert input validation, not latency, so the per-example
# deadline is irrelevant noise — disable it.
_HYPOTHESIS_DIR = Path(__file__).parent.parent / ".cache" / ".hypothesis"
set_hypothesis_home_dir(_HYPOTHESIS_DIR)
settings.register_profile(
    "default",
    database=DirectoryBasedExampleDatabase(str(_HYPOTHESIS_DIR)),
    deadline=None,
)
settings.load_profile("default")


@pytest.fixture
def mock_graphql_request() -> Generator[AsyncMock, None, None]:
    """Fixture that patches make_graphql_request at the core module.

    This is the correct patch target. Each tool module imports the client as a
    module (``from ..core import client as _client``) and calls
    ``_client.make_graphql_request(...)``, resolving the attribute on the
    ``client`` module object at call time — so patching
    ``unraid_mcp.core.client.make_graphql_request`` intercepts every tool call.
    Do NOT patch a per-tool name (e.g. "unraid_mcp.tools.unraid.make_graphql_request"):
    that name is not bound in the tool module's namespace, so the patch has no effect.
    """
    with patch("unraid_mcp.core.client.make_graphql_request", new_callable=AsyncMock) as mock:
        yield mock


def make_tool_fn(
    module_path: str,
    register_fn_name: str,
    tool_name: str,
) -> Any:
    """Extract a tool function from a FastMCP registration for testing.

    This wraps the repeated pattern of creating a test FastMCP instance,
    registering a tool, and extracting the inner function. Centralizing
    this avoids reliance on FastMCP's internal tool storage API in every
    test file.

    FastMCP 3.x removed `_tool_manager._tools`; use `await mcp.get_tool()`
    instead. We run a small event loop here to keep the helper synchronous
    so callers don't need to change.

    Args:
        module_path: Dotted import path to the tool module (e.g., "unraid_mcp.tools.unraid")
        register_fn_name: Name of the registration function (e.g., "register_unraid_tool")
        tool_name: Name of the registered tool (e.g., "unraid")

    Returns:
        The async tool function callable
    """
    import importlib

    module = importlib.import_module(module_path)
    register_fn = getattr(module, register_fn_name)
    test_mcp = FastMCP("test")
    register_fn(test_mcp)
    # FastMCP 3.x stores tools in providers[0]._components keyed as "tool:{name}@"
    # (the "@" suffix is the version separator with no version set).
    local_provider = test_mcp.providers[0]
    tool = local_provider._components[f"tool:{tool_name}@"]
    return tool.fn
