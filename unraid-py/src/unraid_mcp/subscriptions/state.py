"""Consolidated per-subscription state for the SubscriptionManager.

Historically the manager spread each subscription's state across ~8 parallel
dicts keyed by name (``active_subscriptions``, ``reconnect_attempts``,
``connection_states``, ``last_error``, ``_connection_start_times``,
``_last_graphql_error``, ``_graphql_error_count``, ``resource_data``). Keeping
them in sync was an unstated invariant. This module collapses all of them into a
single :class:`SubscriptionState` dataclass, with one instance per subscription
name held in ``SubscriptionManager.states``. That makes the
"single-writer-per-name" invariant structural: there is exactly one object per
name and every field lives on it.

To keep the manager's historical attribute surface (``mgr.connection_states``,
``mgr.last_error``, ...) — which external callers and the test-suite read and
write directly — those attributes are now :class:`_StateFieldView` mappings.
Each view is a thin ``MutableMapping`` that reads and writes a *single field* of
the underlying :class:`SubscriptionState` objects, auto-creating a state entry on
write. The consolidated ``states`` dict is the one source of truth; the views are
field-projections over it, not independent storage.
"""

from __future__ import annotations

from collections.abc import Iterator, MutableMapping
from dataclasses import dataclass
from typing import TYPE_CHECKING, Any


if TYPE_CHECKING:
    import asyncio

    from ..core.types import SubscriptionData


@dataclass(slots=True)
class SubscriptionState:
    """All per-subscription runtime state, consolidated into one object.

    One instance exists per subscription name in ``SubscriptionManager.states``.
    Lock discipline is unchanged and lives on the manager: the task lifecycle
    fields (``task``, ``connection_state``, ``last_error``, ``reconnect_attempts``,
    ``connection_start_time`` and the graphql-error-dedup fields) are guarded by
    the manager's ``_task_lock``; ``data`` is guarded by ``_data_lock``.

    Transitional note: the manager still writes these fields *through* the
    backward-compat :class:`_StateFieldView` mappings, so the single-writer
    invariant is enforced by convention, not structurally. A future change should
    migrate the manager's writes to ``self.states[name].<field>`` directly and
    make the views read-only — at which point this object becomes the true single
    source of truth and the shim can be retired.
    """

    # Task lifecycle (was active_subscriptions[name]).
    task: asyncio.Task[None] | None = None
    # Cached subscription payload (was resource_data[name]); guarded by _data_lock.
    data: SubscriptionData | None = None
    # Connection state machine value (was connection_states[name]).
    connection_state: str = ""
    # Last error string (was last_error[name]).
    last_error: str | None = None
    # Reconnect attempt counter (was reconnect_attempts[name]).
    reconnect_attempts: int = 0
    # Monotonic connect timestamp (was _connection_start_times[name]).
    connection_start_time: float | None = None
    # Deduplicated GraphQL error tracking (was _last_graphql_error / _graphql_error_count).
    graphql_error_msg: str | None = None
    graphql_error_count: int = 0
    # Monotonic lifecycle token. Every start/stop invalidates older loop cleanup.
    generation: int = 0


@dataclass(frozen=True, slots=True)
class ResourceSnapshot:
    """One state-aware cache read returned as an immutable value object."""

    data: dict[str, Any] | None
    fetched_at: str | None
    connection_state: str
    last_error: str | None
    active: bool
    fresh: bool
    age_seconds: float | None = None
    stale: bool = False


class _StateFieldView[V](MutableMapping[str, V]):
    """A ``MutableMapping`` projecting one field of every ``SubscriptionState``.

    Transitional backward-compat shim: the manager still *writes* through these
    views (e.g. ``mgr.connection_states[name] = "active"``), so the
    single-writer-per-name invariant is not yet structural. A future change
    should migrate the manager's writes to ``self.states[name].<field>`` directly
    and make these views read-only projections; until then they remain writable.

    Backed by the manager's consolidated ``states`` dict — never its own storage.
    Reading ``view[name]`` returns ``getattr(states[name], field)``; writing
    ``view[name] = value`` sets that field, auto-creating a ``SubscriptionState``
    when the name is new (mirroring the old defaultdict-style ``dict[name] = v``
    behavior). This lets ``mgr.connection_states[name] = "active"`` and friends
    keep working while ``states`` remains the single source of truth.

    Iteration/membership only surface names whose field is *not* at its declared
    default, so the view reads like the original sparse dict (a name with a
    default-valued field reads as "absent") — matching the historical
    ``dict.get(name, <fallback>)`` access pattern used throughout the manager.

    Absent-detection rule: when the field default is ``None`` the check is
    identity (``value is None``), which is safe for object-valued fields such as
    ``task`` and ``data`` (``MagicMock() == None`` returns a truthy mock, so an
    equality check there would misbehave). For non-``None`` defaults (``""``,
    ``0``) the values are always simple scalars, so equality is used.
    """

    __slots__ = ("_default", "_default_is_none", "_field", "_states")

    def __init__(
        self,
        states: dict[str, SubscriptionState],
        field: str,
        default: Any = None,
    ) -> None:
        # ``default`` is the per-field "absent" sentinel (None / "" / 0). It is
        # typed ``Any`` so the view's element type ``V`` is fixed by the declared
        # attribute annotation at the call site, not narrowed to the sentinel's
        # type (e.g. ``None``).
        self._states = states
        self._field = field
        self._default = default
        self._default_is_none = default is None

    def _is_absent(self, value: Any) -> bool:
        if self._default_is_none:
            return value is None
        return value == self._default

    def _ensure(self, name: str) -> SubscriptionState:
        state = self._states.get(name)
        if state is None:
            state = SubscriptionState()
            self._states[name] = state
        return state

    def __getitem__(self, name: str) -> V:
        state = self._states.get(name)
        if state is None:
            raise KeyError(name)
        value: V = getattr(state, self._field)
        if self._is_absent(value):
            # A field still at its default reads as "absent", matching the sparse
            # dict the manager used to keep (``dict.get(name)`` -> fallback).
            raise KeyError(name)
        return value

    def __setitem__(self, name: str, value: V) -> None:
        setattr(self._ensure(name), self._field, value)

    def __delitem__(self, name: str) -> None:
        state = self._states.get(name)
        if state is None or self._is_absent(getattr(state, self._field)):
            raise KeyError(name)
        setattr(state, self._field, self._default)

    def __iter__(self) -> Iterator[str]:
        for name, state in self._states.items():
            if not self._is_absent(getattr(state, self._field)):
                yield name

    def __len__(self) -> int:
        return sum(
            1 for state in self._states.values() if not self._is_absent(getattr(state, self._field))
        )

    def __contains__(self, name: object) -> bool:
        state = self._states.get(name)  # type: ignore[arg-type]
        return state is not None and not self._is_absent(getattr(state, self._field))

    def __eq__(self, other: object) -> bool:
        if isinstance(other, _StateFieldView):
            return dict(self) == dict(other)
        if isinstance(other, dict):
            return dict(self) == other
        return NotImplemented

    # Defining __eq__ makes the type unhashable; spell that out explicitly so the
    # view behaves like the mutable dict it projects (a dict is unhashable too).
    __hash__ = None

    def __repr__(self) -> str:
        return f"_StateFieldView({dict(self)!r})"
