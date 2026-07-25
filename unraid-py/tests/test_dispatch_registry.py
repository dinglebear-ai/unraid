"""Guard the dispatcher refactor: action-registry completeness + UnraidInput contract.

The consolidated `unraid` tool was refactored to pack its flat keyword args into
an internal `UnraidInput` model and route through the `_ACTION_DISPATCH` registry.
Two invariants must hold or the refactor silently degrades:

1. **Registry completeness.** Every action in `UNRAID_ACTIONS` must be reachable —
   either via `_ACTION_DISPATCH` or handled inline (`help`). A future action added
   to the Literal + tool signature but forgotten in the registry would route to the
   uniform "Invalid action" `ToolError` with no test failing.
2. **`UnraidInput` behavior.** `action` is typed `str` (not the Literal) so an
   invalid action falls through to the registry's uniform `ToolError` instead of a
   pydantic `ValidationError` (preserving the documented contract); and
   `extra="forbid"` rejects unknown fields (keeping the model in lockstep with the
   tool signature).
"""

import inspect
import sys
from pathlib import Path
from typing import get_args

import pytest
from pydantic import ValidationError

from unraid_mcp.tools.unraid import (
    _ACTION_DISPATCH,
    _OPERATION_REGISTRY,
    UNRAID_ACTIONS,
    UnraidInput,
)


# Ensure tests/ is on sys.path so "from conftest import make_tool_fn" resolves.
_TESTS_DIR = str(Path(__file__).parent)
if _TESTS_DIR not in sys.path:
    sys.path.insert(0, _TESTS_DIR)

from conftest import make_tool_fn  # noqa: E402


# Actions handled in the tool body before/around the registry lookup rather than
# via `_ACTION_DISPATCH`. `help` is a pure string fast path returned before the
# model is even built. Keep this set in sync with the inline branches in
# `register_unraid_tool`.
_INLINE_ACTIONS = {"help"}


# ---------------------------------------------------------------------------
# Registry completeness
# ---------------------------------------------------------------------------


def test_dispatch_registry_covers_every_action() -> None:
    """`_ACTION_DISPATCH` + inline-handled actions must cover the full action set.

    This is the core regression guard: a new action added to `UNRAID_ACTIONS`
    (and the tool signature) but forgotten in `_ACTION_DISPATCH` would otherwise
    route to "Invalid action" with no failing test.
    """
    all_actions = set(get_args(UNRAID_ACTIONS))
    covered = set(_ACTION_DISPATCH) | _INLINE_ACTIONS

    assert covered == all_actions, (
        "Action coverage drift between UNRAID_ACTIONS and the dispatch registry.\n"
        f"  In UNRAID_ACTIONS but unreachable: {sorted(all_actions - covered)}\n"
        f"  In registry/inline but not in UNRAID_ACTIONS: {sorted(covered - all_actions)}"
    )


def test_inline_actions_are_not_also_in_registry() -> None:
    """Inline-handled actions must not also live in the registry (no double-routing)."""
    overlap = set(_ACTION_DISPATCH) & _INLINE_ACTIONS
    assert not overlap, f"Inline actions also present in _ACTION_DISPATCH: {sorted(overlap)}"


def test_operation_registry_covers_every_action_and_subactions_are_nonempty() -> None:
    assert set(_OPERATION_REGISTRY) == set(_ACTION_DISPATCH) | {"help"}
    assert _OPERATION_REGISTRY["help"] == frozenset()
    assert all(_OPERATION_REGISTRY[action] for action in _ACTION_DISPATCH)


# ---------------------------------------------------------------------------
# UnraidInput model contract
# ---------------------------------------------------------------------------


def test_unraid_input_accepts_unknown_action() -> None:
    """`action` is `str`, not the Literal — an invalid action must construct cleanly.

    This proves invalid actions fall through to the registry lookup (uniform
    ToolError) rather than failing model validation with a ValidationError.
    """
    inp = UnraidInput(action="bogus", subaction="x")
    assert inp.action == "bogus"
    assert inp.subaction == "x"


def test_unraid_input_forbids_extra_fields() -> None:
    """`model_config = {"extra": "forbid"}` must reject unknown fields."""
    with pytest.raises(ValidationError):
        UnraidInput(action="system", subaction="overview", totally_unknown_field=1)


def test_unraid_input_fields_match_tool_signature() -> None:
    """The model field set must mirror the tool's parameter set exactly.

    Guards the flat-signature <-> model lockstep: the tool packs its flat keyword
    args into `UnraidInput`, so a param added to one but not the other would either
    drop silently or raise on construction. `ctx` is the only signature parameter
    with no model field (it carries the MCP request context, not a dispatch arg).
    """
    tool_fn = make_tool_fn("unraid_mcp.tools.unraid", "register_unraid_tool", "unraid")
    sig_params = set(inspect.signature(tool_fn).parameters) - {"ctx"}
    model_fields = set(UnraidInput.model_fields)

    assert sig_params == model_fields, (
        "Tool signature and UnraidInput fields are out of lockstep.\n"
        f"  In signature but not model: {sorted(sig_params - model_fields)}\n"
        f"  In model but not signature: {sorted(model_fields - sig_params)}"
    )
