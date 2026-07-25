"""Tests for the onboarding subactions of the consolidated unraid tool."""

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


class TestOnboardingQueries:
    async def test_internal_boot_context(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {
            "internalBootContext": {
                "arrayStopped": False,
                "bootEligible": True,
                "driveWarnings": [
                    {
                        "diskId": "disk1",
                        "device": "/dev/sdb",
                        "warnings": ["device will be formatted"],
                    }
                ],
            }
        }
        result = await _make_tool()(action="onboarding", subaction="internal_boot_context")
        query = _mock_graphql.call_args.args[0]
        assert "driveWarnings" in query
        assert "diskId" in query
        assert "device" in query
        assert "warnings" in query
        assert result["context"]["bootEligible"] is True
        assert result["context"]["driveWarnings"] == [
            {
                "diskId": "disk1",
                "device": "/dev/sdb",
                "warnings": ["device will be formatted"],
            }
        ]

    async def test_internal_boot_context_falls_back_without_drive_warnings(
        self, _mock_graphql: AsyncMock
    ) -> None:
        _mock_graphql.side_effect = [
            ToolError('GraphQL API error: Cannot query field "driveWarnings"'),
            {"internalBootContext": {"arrayStopped": False, "bootEligible": True}},
        ]

        result = await _make_tool()(action="onboarding", subaction="internal_boot_context")

        assert result["success"] is True
        assert result["context"]["bootEligible"] is True
        assert "driveWarnings" in _mock_graphql.call_args_list[0].args[0]
        assert "driveWarnings" not in _mock_graphql.call_args_list[1].args[0]


class TestOnboardingSimpleMutations:
    @pytest.mark.parametrize("subaction", ["complete", "open", "close", "resume", "bypass"])
    async def test_simple_mutation(self, _mock_graphql: AsyncMock, subaction: str) -> None:
        from unraid_mcp.tools._onboarding import _ONBOARDING_RESULT_FIELD

        field = _ONBOARDING_RESULT_FIELD[subaction]
        _mock_graphql.return_value = {"onboarding": {field: {"status": "COMPLETED"}}}
        result = await _make_tool()(action="onboarding", subaction=subaction)
        assert result["success"] is True
        assert result["onboarding"]["status"] == "COMPLETED"

    async def test_reset_is_destructive(self, _mock_graphql: AsyncMock) -> None:
        with pytest.raises(ToolError, match="confirm=True"):
            await _make_tool()(action="onboarding", subaction="reset")

    async def test_reset_with_confirm(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {"onboarding": {"resetOnboarding": {"status": "INCOMPLETE"}}}
        result = await _make_tool()(action="onboarding", subaction="reset", confirm=True)
        assert result["onboarding"]["status"] == "INCOMPLETE"


class TestOnboardingInputMutations:
    async def test_set_override_requires_input(self, _mock_graphql: AsyncMock) -> None:
        with pytest.raises(ToolError, match="onboarding_input is required"):
            await _make_tool()(action="onboarding", subaction="set_override")

    async def test_create_internal_boot_pool_is_destructive(self, _mock_graphql: AsyncMock) -> None:
        with pytest.raises(ToolError, match="confirm=True"):
            await _make_tool()(
                action="onboarding",
                subaction="create_internal_boot_pool",
                onboarding_input={
                    "poolName": "p",
                    "devices": ["sdb"],
                    "bootSizeMiB": 1,
                    "updateBios": False,
                },
            )

    async def test_create_internal_boot_pool_with_confirm(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {
            "onboarding": {"createInternalBootPool": {"ok": True, "code": 0, "output": "done"}}
        }
        result = await _make_tool()(
            action="onboarding",
            subaction="create_internal_boot_pool",
            onboarding_input={
                "poolName": "p",
                "devices": ["sdb"],
                "bootSizeMiB": 1,
                "updateBios": False,
            },
            confirm=True,
        )
        assert result["result"]["ok"] is True

    async def test_invalid_subaction(self, _mock_graphql: AsyncMock) -> None:
        with pytest.raises(ToolError, match="Invalid subaction"):
            await _make_tool()(action="onboarding", subaction="nope")


class TestOnboardingSuccessDerivation:
    @pytest.mark.parametrize("subaction", ["clear_override", "refresh_internal_boot_context"])
    async def test_remaining_simple_mutations(
        self, _mock_graphql: AsyncMock, subaction: str
    ) -> None:
        from unraid_mcp.tools._onboarding import _ONBOARDING_RESULT_FIELD

        field = _ONBOARDING_RESULT_FIELD[subaction]
        _mock_graphql.return_value = {"onboarding": {field: {"status": "INCOMPLETE"}}}
        result = await _make_tool()(action="onboarding", subaction=subaction)
        assert result["success"] is True

    async def test_refresh_internal_boot_context_preserves_drive_warnings(
        self, _mock_graphql: AsyncMock
    ) -> None:
        warning = {
            "diskId": "disk1",
            "device": "/dev/sdb",
            "warnings": ["device will be formatted"],
        }
        _mock_graphql.return_value = {
            "onboarding": {
                "refreshInternalBootContext": {
                    "arrayStopped": True,
                    "bootEligible": False,
                    "poolNames": ["cache"],
                    "driveWarnings": [warning],
                }
            }
        }
        result = await _make_tool()(action="onboarding", subaction="refresh_internal_boot_context")
        query = _mock_graphql.call_args.args[0]
        assert "driveWarnings" in query
        assert "diskId" in query
        assert "device" in query
        assert "warnings" in query
        assert result["onboarding"]["driveWarnings"] == [warning]

    async def test_refresh_internal_boot_context_falls_back_without_drive_warnings(
        self, _mock_graphql: AsyncMock
    ) -> None:
        _mock_graphql.side_effect = [
            ToolError('GraphQL API error: Cannot query field "driveWarnings"'),
            {
                "onboarding": {
                    "refreshInternalBootContext": {
                        "arrayStopped": True,
                        "bootEligible": False,
                        "poolNames": ["cache"],
                    }
                }
            },
        ]

        result = await _make_tool()(action="onboarding", subaction="refresh_internal_boot_context")

        assert result["success"] is True
        assert result["onboarding"]["poolNames"] == ["cache"]
        assert "driveWarnings" in _mock_graphql.call_args_list[0].args[0]
        assert "driveWarnings" not in _mock_graphql.call_args_list[1].args[0]

    async def test_simple_mutation_null_is_not_success(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {"onboarding": {"completeOnboarding": None}}
        result = await _make_tool()(action="onboarding", subaction="complete")
        assert result["success"] is False

    async def test_set_override_success(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {
            "onboarding": {"setOnboardingOverride": {"status": "COMPLETED"}}
        }
        result = await _make_tool()(
            action="onboarding",
            subaction="set_override",
            onboarding_input={"registrationState": "PRO"},
        )
        assert result["success"] is True
        assert result["result"]["status"] == "COMPLETED"

    async def test_create_internal_boot_pool_ok_false_is_not_success(
        self, _mock_graphql: AsyncMock
    ) -> None:
        _mock_graphql.return_value = {
            "onboarding": {
                "createInternalBootPool": {"ok": False, "code": 1, "output": "device busy"}
            }
        }
        result = await _make_tool()(
            action="onboarding",
            subaction="create_internal_boot_pool",
            onboarding_input={
                "poolName": "p",
                "devices": ["sdb"],
                "bootSizeMiB": 1,
                "updateBios": False,
            },
            confirm=True,
        )
        assert result["success"] is False
        assert result["output"] == "device busy"
