# tests/test_state.py
"""Tests for the _StateFieldView backward-compat shim (subscriptions/state.py).

The manager keeps its historical attribute surface (``mgr.active_subscriptions``,
``mgr.connection_states``, ...) as :class:`_StateFieldView` field-projections over
the consolidated ``mgr.states`` dict. These tests pin down the subtle behaviors
that surface differently from a plain dict:

* identity-not-equality membership (so MagicMock/object values behave),
* a field at its declared default reads as ABSENT,
* del / reset-to-default semantics,
* equality against a plain dict.
"""

from __future__ import annotations

from unittest.mock import MagicMock

import pytest

from unraid_mcp.subscriptions.manager import SubscriptionManager
from unraid_mcp.subscriptions.state import SubscriptionState, _StateFieldView


# ---------------------------------------------------------------------------
# Identity, not equality (object-valued fields with None default)
# ---------------------------------------------------------------------------


def test_object_value_stored_and_retrieved_by_identity() -> None:
    """A MagicMock written into active_subscriptions reads back as the SAME object.

    Equality would misbehave (``MagicMock() == None`` is a truthy mock), so the
    None-default view must use identity for absent-detection — the stored mock is
    returned unchanged and membership is True.
    """
    mgr = SubscriptionManager()
    the_mock = MagicMock()
    mgr.active_subscriptions["x"] = the_mock

    assert mgr.active_subscriptions["x"] is the_mock
    assert "x" in mgr.active_subscriptions


def test_object_value_membership_is_identity_not_equality() -> None:
    """A mock that compares == None must still register as present (identity check)."""
    mgr = SubscriptionManager()
    sneaky = MagicMock()
    # Make equality with None return truthy — an equality-based view would treat
    # this as 'absent'. The identity-based view must still see it as present.
    sneaky.__eq__ = MagicMock(return_value=True)
    mgr.active_subscriptions["x"] = sneaky

    assert "x" in mgr.active_subscriptions
    assert mgr.active_subscriptions["x"] is sneaky


# ---------------------------------------------------------------------------
# Default value reads as absent
# ---------------------------------------------------------------------------


def test_field_at_default_reads_as_absent() -> None:
    """A field still at its declared default ('' for connection_state) is 'absent'."""
    states: dict[str, SubscriptionState] = {"x": SubscriptionState()}
    view: _StateFieldView[str] = _StateFieldView(states, "connection_state", "")

    # The state exists, but connection_state == "" (its default) -> KeyError.
    with pytest.raises(KeyError):
        _ = view["name"]
    with pytest.raises(KeyError):
        _ = view["x"]

    # .get falls back to the provided default.
    assert view.get("x", "fallback") == "fallback"
    assert view.get("name", "d") == "d"

    # Membership / iteration / len all treat the default-valued field as absent.
    assert "x" not in view
    assert list(view) == []
    assert len(view) == 0


def test_non_default_value_reads_as_present() -> None:
    """Once set to a non-default value, the name surfaces in all access paths."""
    states: dict[str, SubscriptionState] = {}
    view: _StateFieldView[str] = _StateFieldView(states, "connection_state", "")

    view["x"] = "active"
    assert view["x"] == "active"
    assert "x" in view
    assert list(view) == ["x"]
    assert len(view) == 1
    assert view.get("x", "fallback") == "active"


# ---------------------------------------------------------------------------
# del / reset semantics
# ---------------------------------------------------------------------------


def test_del_resets_field_to_default() -> None:
    """del view[name] resets the field to its default; the state object survives."""
    states: dict[str, SubscriptionState] = {}
    view: _StateFieldView[str] = _StateFieldView(states, "connection_state", "")

    view["x"] = "active"
    del view["x"]

    # The underlying state still exists, but the field is back to its default,
    # so the view reports the name as absent again.
    assert "x" in states
    assert states["x"].connection_state == ""
    assert "x" not in view


def test_del_missing_name_raises_keyerror() -> None:
    """Deleting an absent (default-valued or never-created) name raises KeyError."""
    states: dict[str, SubscriptionState] = {}
    view: _StateFieldView[str] = _StateFieldView(states, "connection_state", "")

    with pytest.raises(KeyError):
        del view["never_created"]

    # A created-but-default-valued name is also 'absent' for del.
    states["x"] = SubscriptionState()
    with pytest.raises(KeyError):
        del view["x"]


def test_pop_uses_default_for_absent() -> None:
    """pop(name, default) returns the default for an absent name (MutableMapping)."""
    states: dict[str, SubscriptionState] = {}
    view: _StateFieldView[int] = _StateFieldView(states, "reconnect_attempts", 0)

    assert view.pop("missing", 7) == 7
    view["x"] = 3
    assert view.pop("x", 7) == 3
    # After pop, the field is reset to default -> absent.
    assert "x" not in view


# ---------------------------------------------------------------------------
# Equality vs a plain dict
# ---------------------------------------------------------------------------


def test_equality_against_plain_dict() -> None:
    """A view equals a plain dict of its non-default {name: value} projection."""
    states: dict[str, SubscriptionState] = {}
    view: _StateFieldView[str] = _StateFieldView(states, "connection_state", "")

    assert view == {}

    view["a"] = "active"
    view["b"] = "connected"
    assert view == {"a": "active", "b": "connected"}
    assert view != {"a": "active"}


def test_equality_against_another_view() -> None:
    """Two views over distinct backing stores are equal when their projections match."""
    states1: dict[str, SubscriptionState] = {}
    states2: dict[str, SubscriptionState] = {}
    v1: _StateFieldView[str] = _StateFieldView(states1, "connection_state", "")
    v2: _StateFieldView[str] = _StateFieldView(states2, "connection_state", "")

    v1["x"] = "active"
    v2["x"] = "active"
    assert v1 == v2

    v2["y"] = "connected"
    assert v1 != v2


def test_view_is_unhashable() -> None:
    """Defining __eq__ makes the view unhashable (like the dict it projects)."""
    view: _StateFieldView[str] = _StateFieldView({}, "connection_state", "")
    with pytest.raises(TypeError):
        hash(view)
