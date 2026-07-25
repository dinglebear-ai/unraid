"""Every list-shaped non-live operation honors the shared limit/page contract."""

import sys
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest


_TESTS_DIR = str(Path(__file__).parent)
if _TESTS_DIR not in sys.path:
    sys.path.insert(0, _TESTS_DIR)

from conftest import make_tool_fn  # noqa: E402


@pytest.mark.parametrize(
    ("action", "subaction", "payload", "output_key", "extra"),
    [
        ("system", "services", {"services": [{"id": i} for i in range(5)]}, "services", {}),
        (
            "docker",
            "networks",
            {"docker": {"networks": [{"id": i} for i in range(5)]}},
            "networks",
            {},
        ),
        ("disk", "log_files", {"logFiles": [str(i) for i in range(5)]}, "log_files", {}),
        ("vm", "list", {"vms": {"domains": [{"id": i} for i in range(5)]}}, "vms", {}),
        ("key", "possible_roles", {"apiKeyPossibleRoles": list(range(5))}, "roles", {}),
        (
            "oidc",
            "public_providers",
            {"publicOidcProviders": [{"id": i} for i in range(5)]},
            "providers",
            {},
        ),
    ],
)
async def test_list_operation_honors_limit_and_returns_page(
    action: str,
    subaction: str,
    payload: dict,
    output_key: str,
    extra: dict,
) -> None:
    tool = make_tool_fn("unraid_mcp.tools.unraid", "register_unraid_tool", "unraid")
    request = AsyncMock(return_value=payload)
    with patch("unraid_mcp.core.client.make_graphql_request", request):
        result = await tool(action=action, subaction=subaction, limit=2, **extra)
    assert len(result[output_key]) == 2
    assert result["page"]["returned"] == 2
    assert result["page"]["total"] == 5
    assert result["page"]["truncated"] is True
    assert "limit" in result["page"]["hint"]
