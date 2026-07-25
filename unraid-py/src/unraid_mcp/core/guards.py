"""Destructive action gating via MCP elicitation.

Provides gate_destructive_action() — a single call to guard any destructive
tool action with interactive user confirmation or confirm=True bypass.
"""

from typing import TYPE_CHECKING

from pydantic import BaseModel, Field


if TYPE_CHECKING:
    from fastmcp import Context

from ..config.logging import logger
from .exceptions import ToolError


class _ConfirmAction(BaseModel):
    confirmed: bool = Field(False, description="Check the box to confirm and proceed")


async def elicit_destructive_confirmation(
    ctx: "Context | None", action: str, description: str
) -> bool:
    """Prompt the user to confirm a destructive action via MCP elicitation.

    Args:
        ctx: The MCP context. If None, returns False immediately.
        action: Action name shown in the prompt.
        description: Human-readable description of what the action will do.

    Returns:
        True if the user confirmed, False otherwise.
    """
    if ctx is None:
        logger.warning(
            "Cannot elicit confirmation for '%s': no MCP context available. "
            "Re-run with confirm=True to bypass elicitation.",
            action,
        )
        return False

    try:
        result = await ctx.elicit(
            message=(
                f"**Confirm destructive action: `{action}`**\n\n"
                f"{description}\n\n"
                "Are you sure you want to proceed?"
            ),
            response_type=_ConfirmAction,
        )
    except NotImplementedError:
        logger.warning(
            "MCP client does not support elicitation for action '%s'. "
            "Re-run with confirm=True to bypass.",
            action,
        )
        return False

    if result.action != "accept":
        logger.info("Destructive action '%s' declined by user (%s).", action, result.action)
        return False

    confirmed: bool = result.data.confirmed  # type: ignore[union-attr]
    if not confirmed:
        logger.info("Destructive action '%s' not confirmed by user.", action)
    return confirmed


async def gate_destructive_action(
    ctx: "Context | None",
    action: str,
    destructive_actions: set[str],
    confirm: bool,
    description: str | dict[str, str],
) -> None:
    """Gate a destructive action with elicitation or confirm=True bypass.

    Does nothing if the action is not in destructive_actions or confirm=True.
    Otherwise calls elicit_destructive_confirmation; raises ToolError if the
    user declines or elicitation is unavailable.

    Args:
        ctx: MCP context for elicitation (None skips elicitation).
        action: The action being requested.
        destructive_actions: Set of action names considered destructive.
        confirm: When True, bypasses elicitation and proceeds immediately.
        description: Human-readable description of the action's impact.
            Convention: prefer the dict[subaction, description] form, keyed by
            subaction, so each destructive action carries its own message — this
            is what the multi-destructive domains pass. A bare str is the
            single-action shorthand: it applies to whichever destructive action
            is gated (typically a domain with exactly one). When a dict is
            passed, the gated subaction MUST have an entry; a missing key raises
            ToolError (see below) rather than silently proceeding.
    """
    if action not in destructive_actions:
        return

    if confirm:
        logger.info("Destructive action '%s' bypassed via confirm=True.", action)
        return

    if isinstance(description, dict):
        desc = description.get(action)
        if desc is None:
            raise ToolError(f"Missing destructive-action description for '{action}'.")
    else:
        desc = description
    confirmed = await elicit_destructive_confirmation(ctx, action, desc)
    if not confirmed:
        raise ToolError(
            f"Action '{action}' was not confirmed. Re-run with confirm=True to bypass elicitation."
        )
