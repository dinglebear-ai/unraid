"""Unit tests for unraid_mcp.core.guards."""

from unittest.mock import AsyncMock, patch

import pytest
from fastmcp.exceptions import ToolError

from unraid_mcp.core.guards import gate_destructive_action


DESTRUCTIVE = {"delete", "wipe"}


class TestGateDestructiveAction:
    """gate_destructive_action raises ToolError or elicits based on state."""

    @pytest.mark.asyncio
    async def test_non_destructive_action_passes_through(self) -> None:
        """Non-destructive actions are never blocked."""
        await gate_destructive_action(
            None, "list", DESTRUCTIVE, confirm=False, description="irrelevant"
        )

    @pytest.mark.asyncio
    async def test_confirm_true_bypasses_elicitation(self) -> None:
        """confirm=True skips elicitation entirely."""
        with patch("unraid_mcp.core.guards.elicit_destructive_confirmation") as mock_elicit:
            await gate_destructive_action(
                None, "delete", DESTRUCTIVE, confirm=True, description="desc"
            )
        mock_elicit.assert_not_called()

    @pytest.mark.asyncio
    async def test_no_ctx_raises_tool_error(self) -> None:
        """ctx=None means elicitation returns False → ToolError."""
        with pytest.raises(ToolError, match="not confirmed"):
            await gate_destructive_action(
                None, "delete", DESTRUCTIVE, confirm=False, description="desc"
            )

    @pytest.mark.asyncio
    async def test_elicitation_accepted_does_not_raise(self) -> None:
        """When elicitation returns True, no ToolError is raised."""
        with patch(
            "unraid_mcp.core.guards.elicit_destructive_confirmation",
            new_callable=AsyncMock,
            return_value=True,
        ):
            await gate_destructive_action(
                object(), "delete", DESTRUCTIVE, confirm=False, description="desc"
            )

    @pytest.mark.asyncio
    async def test_elicitation_declined_raises_tool_error(self) -> None:
        """When elicitation returns False, ToolError is raised."""
        with (
            patch(
                "unraid_mcp.core.guards.elicit_destructive_confirmation",
                new_callable=AsyncMock,
                return_value=False,
            ) as mock_elicit,
            pytest.raises(ToolError, match="confirm=True"),
        ):
            await gate_destructive_action(
                object(), "delete", DESTRUCTIVE, confirm=False, description="desc"
            )
        mock_elicit.assert_called_once()

    @pytest.mark.asyncio
    async def test_string_description_passed_to_elicitation(self) -> None:
        """A plain string description is forwarded as-is."""
        with patch(
            "unraid_mcp.core.guards.elicit_destructive_confirmation",
            new_callable=AsyncMock,
            return_value=True,
        ) as mock_elicit:
            await gate_destructive_action(
                object(), "delete", DESTRUCTIVE, confirm=False, description="Delete everything."
            )
        _, _, desc = mock_elicit.call_args.args
        assert desc == "Delete everything."

    @pytest.mark.asyncio
    async def test_dict_description_resolves_by_action(self) -> None:
        """A dict description is resolved by action key."""
        descs = {"delete": "Delete desc.", "wipe": "Wipe desc."}
        with patch(
            "unraid_mcp.core.guards.elicit_destructive_confirmation",
            new_callable=AsyncMock,
            return_value=True,
        ) as mock_elicit:
            await gate_destructive_action(
                object(), "wipe", DESTRUCTIVE, confirm=False, description=descs
            )
        _, _, desc = mock_elicit.call_args.args
        assert desc == "Wipe desc."

    @pytest.mark.asyncio
    async def test_error_message_contains_action_name(self) -> None:
        """ToolError message includes the action name."""
        with pytest.raises(ToolError, match="'delete'"):
            await gate_destructive_action(
                None, "delete", DESTRUCTIVE, confirm=False, description="desc"
            )
