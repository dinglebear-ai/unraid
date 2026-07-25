"""Unit tests for the destructive-action elicitation body in core/guards.py.

The safety suite (tests/safety/) exercises ``gate_destructive_action`` via
``ctx=None`` or by mocking ``elicit_destructive_confirmation`` away, so the
elicitation *body* — the ``ctx.elicit(...)`` call, the NotImplementedError
fallback when the client doesn't support elicitation, and the
``result.action != 'accept'`` / ``result.data.confirmed`` parsing — is
otherwise untested. These tests drive that body directly with a fake ctx.
"""

from types import SimpleNamespace
from typing import ClassVar
from unittest.mock import AsyncMock

import pytest

from unraid_mcp.core.exceptions import ToolError
from unraid_mcp.core.guards import (
    elicit_destructive_confirmation,
    gate_destructive_action,
)


def _make_ctx(elicit: AsyncMock) -> SimpleNamespace:
    """Build a minimal fake MCP context whose .elicit is the given AsyncMock."""
    return SimpleNamespace(elicit=elicit)


# ---------------------------------------------------------------------------
# elicit_destructive_confirmation — the elicitation body
# ---------------------------------------------------------------------------


class TestElicitDestructiveConfirmation:
    """Drive the ctx.elicit(...) path directly with a fake/mock ctx."""

    async def test_not_implemented_returns_false(self) -> None:
        """Client without elicitation support -> NotImplementedError -> False."""
        elicit = AsyncMock(side_effect=NotImplementedError)
        ctx = _make_ctx(elicit)

        result = await elicit_destructive_confirmation(ctx, "stop_array", "Stops the array.")

        assert result is False
        elicit.assert_awaited_once()

    async def test_accept_with_confirmed_true_returns_true(self) -> None:
        """An accept result carrying confirmed=True -> True."""
        elicit_result = SimpleNamespace(action="accept", data=SimpleNamespace(confirmed=True))
        elicit = AsyncMock(return_value=elicit_result)
        ctx = _make_ctx(elicit)

        result = await elicit_destructive_confirmation(ctx, "stop_array", "Stops the array.")

        assert result is True
        elicit.assert_awaited_once()

    async def test_accept_with_confirmed_false_returns_false(self) -> None:
        """An accept result with the box unchecked (confirmed=False) -> False."""
        elicit_result = SimpleNamespace(action="accept", data=SimpleNamespace(confirmed=False))
        elicit = AsyncMock(return_value=elicit_result)
        ctx = _make_ctx(elicit)

        result = await elicit_destructive_confirmation(ctx, "stop_array", "Stops the array.")

        assert result is False

    @pytest.mark.parametrize("non_accept_action", ["decline", "cancel", "reject"])
    async def test_non_accept_result_returns_false(self, non_accept_action: str) -> None:
        """A decline/cancel/other non-accept result -> False, before data is read."""
        # data is deliberately absent: a non-accept result must short-circuit
        # before result.data.confirmed is ever accessed.
        elicit_result = SimpleNamespace(action=non_accept_action, data=None)
        elicit = AsyncMock(return_value=elicit_result)
        ctx = _make_ctx(elicit)

        result = await elicit_destructive_confirmation(ctx, "stop_array", "Stops the array.")

        assert result is False
        elicit.assert_awaited_once()

    async def test_none_ctx_returns_false_without_elicit(self) -> None:
        """No MCP context available -> False immediately, no elicitation attempted."""
        result = await elicit_destructive_confirmation(None, "stop_array", "Stops the array.")
        assert result is False


# ---------------------------------------------------------------------------
# gate_destructive_action — body integration via the same fake ctx
# ---------------------------------------------------------------------------


class TestGateDestructiveActionElicitationIntegration:
    """Exercise gate_destructive_action driving the real elicitation body."""

    _DESTRUCTIVE: ClassVar[set[str]] = {"stop_array"}
    _DESC = "Stops the array."

    async def test_accept_confirmed_passes_gate(self) -> None:
        """An accepted+confirmed elicitation lets the gate return without raising."""
        elicit_result = SimpleNamespace(action="accept", data=SimpleNamespace(confirmed=True))
        ctx = _make_ctx(AsyncMock(return_value=elicit_result))

        # No exception means the gate passed.
        await gate_destructive_action(
            ctx, "stop_array", self._DESTRUCTIVE, confirm=False, description=self._DESC
        )

    async def test_decline_raises_tool_error(self) -> None:
        """A declined elicitation raises ToolError mentioning confirm=True bypass."""
        elicit_result = SimpleNamespace(action="decline", data=None)
        ctx = _make_ctx(AsyncMock(return_value=elicit_result))

        with pytest.raises(ToolError, match="confirm=True"):
            await gate_destructive_action(
                ctx, "stop_array", self._DESTRUCTIVE, confirm=False, description=self._DESC
            )

    async def test_unsupported_client_raises_tool_error(self) -> None:
        """When the client can't elicit (NotImplementedError) the gate raises ToolError."""
        ctx = _make_ctx(AsyncMock(side_effect=NotImplementedError))

        with pytest.raises(ToolError, match="confirm=True"):
            await gate_destructive_action(
                ctx, "stop_array", self._DESTRUCTIVE, confirm=False, description=self._DESC
            )

    async def test_dict_description_present_key_used_in_message(self) -> None:
        """A dict description keyed by the gated subaction feeds that text to elicit."""
        marker = "ZAPP_BRANNIGAN_DELETES_THE_ARRAY_UNIQUE_MARKER"
        elicit_result = SimpleNamespace(action="accept", data=SimpleNamespace(confirmed=True))
        elicit = AsyncMock(return_value=elicit_result)
        ctx = _make_ctx(elicit)

        await gate_destructive_action(
            ctx,
            "stop_array",
            self._DESTRUCTIVE,
            confirm=False,
            description={"stop_array": marker},
        )

        elicit.assert_awaited_once()
        message = elicit.await_args.kwargs["message"]
        assert marker in message

    async def test_dict_description_missing_key_raises_before_elicit(self) -> None:
        """A dict missing the gated subaction's key raises ToolError, never eliciting."""
        elicit = AsyncMock()
        ctx = _make_ctx(elicit)

        with pytest.raises(ToolError, match="Missing destructive-action description"):
            await gate_destructive_action(
                ctx,
                "stop_array",
                self._DESTRUCTIVE,
                confirm=False,
                description={"some_other_action": "Not for stop_array."},
            )

        elicit.assert_not_awaited()
