"""Shared graphql-ws / graphql-transport-ws protocol primitive.

The connect -> connection_init -> wait-for-ack -> choose subscribe/start by the
negotiated subprotocol -> loop over next/data/ping/complete/error handshake was
historically implemented three times (the persistent manager loop, the one-shot
snapshot helpers, and the diagnostics probe) with subtly divergent keepalive and
error handling. This module factors out the *common* parts so all three share one
implementation:

* :func:`iter_messages` — an async generator that normalizes the post-handshake
  message stream: it answers ``ping`` with ``pong`` transparently, ignores
  ``ka``/``pong`` keepalives and unmatched frames, yields :class:`DataEvent` /
  :class:`ErrorEvent` / :class:`CompleteEvent` to the caller, and skips malformed
  frames (logged, not fatal) so a single bad frame never aborts the stream. All
  three call sites consume this generator.
* :func:`graphql_ws_session` — an async context manager that connects,
  authenticates (``connection_init`` -> ``connection_ack``), and starts the
  subscription, yielding a :class:`GraphqlWsSession` once the stream is live.
  Used by the strict-handshake call sites (snapshot + diagnostics). The manager
  keeps its own inline handshake — its handshake is *lenient* (it proceeds past
  an unexpected, non-``connection_ack`` init frame, "some servers send other
  messages first") and interleaves per-name connection-state transitions, so it
  only shares :func:`iter_messages`, not the handshake context manager.

Each historical call site keeps its own behavior by consuming these events
differently — the manager caches data + tracks GraphQL errors + never breaks on
``error``; snapshot returns/collects data and raises ``ToolError`` on errors;
diagnostics just needs the first ack-confirmed connection. The pieces that are
*not* shared (per-name reconnect/backoff, resource caching, return-first vs
collect-window, allowlist validation, diagnostics result shaping) stay at the
call sites.
"""

from __future__ import annotations

import asyncio
import json
from contextlib import asynccontextmanager
from dataclasses import dataclass
from typing import TYPE_CHECKING, Any, Literal

import websockets
from websockets.typing import Subprotocol

from ..config.logging import logger
from .utils import build_connection_init


if TYPE_CHECKING:
    import ssl as _ssl
    from collections.abc import AsyncIterator


# Subprotocols offered to the server, most-preferred first. The negotiated
# subprotocol decides the subscribe-message type and the data-event type.
_SUBPROTOCOLS: tuple[Subprotocol, ...] = (
    Subprotocol("graphql-transport-ws"),
    Subprotocol("graphql-ws"),
)


# ---------------------------------------------------------------------------
# WebSocket connect / keepalive / handshake timeout constants
# ---------------------------------------------------------------------------
# Named lifts of the previously-hardcoded magic numbers spread across this module,
# the snapshot helpers, the diagnostics probe, and the manager loop. Values are
# preserved exactly per call site — where two sites legitimately differ (the ping
# cadence is 20s for the manager/snapshot but 30s for the diagnostics probe), the
# difference is kept as two distinct constants rather than unified.

# websockets.connect open_timeout — connect deadline (manager + diagnostics probe).
# One constant for the single concept; websockets/asyncio accept the float fine.
_WS_OPEN_TIMEOUT: float = 10.0
# Keepalive ping deadline forwarded to websockets.connect.
_WS_PING_TIMEOUT: float = 10.0
# Keepalive ping cadence — most call sites (session default, snapshot, manager).
_WS_PING_INTERVAL: float = 20.0
# Keepalive ping cadence used only by the diagnostics probe.
_WS_PROBE_PING_INTERVAL: float = 30.0
# websockets.connect close_timeout (manager loop only).
_WS_CLOSE_TIMEOUT: int = 10
# Timeout waiting for connection_ack (session default + manager handshake).
_WS_ACK_TIMEOUT: float = 30.0
# Deadline for the diagnostics probe's first post-subscribe frame recv().
_WS_FIRST_FRAME_TIMEOUT: float = 5.0


class ProtocolError(Exception):
    """Raised when the graphql-ws handshake fails (no ack / connection_error).

    Carries structured fields so call sites can reconstruct their historical
    error messages without parsing the string:

    * ``kind`` — ``"connection_error"`` (the server sent ``connection_error``) or
      ``"unexpected"`` (any other non-``connection_ack`` init frame).
    * ``payload`` — the ``connection_error`` payload (``kind == "connection_error"``).
    * ``ack_type`` — the unexpected frame's ``type`` (``kind == "unexpected"``).

    Call sites translate this into their own error type (the manager records a
    connection state; snapshot/diagnostics raise ``ToolError``).
    """

    def __init__(
        self,
        message: str,
        *,
        kind: Literal["connection_error", "unexpected"],
        payload: Any = None,
        ack_type: Any = None,
    ) -> None:
        super().__init__(message)
        self.kind: Literal["connection_error", "unexpected"] = kind
        self.payload = payload
        self.ack_type = ack_type


# ---------------------------------------------------------------------------
# Normalized post-handshake events
# ---------------------------------------------------------------------------


@dataclass(slots=True)
class DataEvent:
    """A ``next`` / ``data`` frame matching the active subscription id.

    ``payload`` is the raw ``payload`` dict from the frame; callers read
    ``payload.get("data")`` and ``payload.get("errors")`` themselves so the
    differing data/GraphQL-error handling per call site is preserved.
    """

    payload: dict[str, Any]


@dataclass(slots=True)
class ErrorEvent:
    """A protocol-level ``error`` frame matching the active subscription id."""

    payload: Any


@dataclass(slots=True)
class CompleteEvent:
    """A ``complete`` frame: the server finished the subscription."""


async def iter_messages(
    ws: Any,
    *,
    sub_id: str,
    expected_data_type: str,
) -> AsyncIterator[DataEvent | ErrorEvent | CompleteEvent]:
    """Yield normalized events from a live post-handshake message stream.

    Iterates ``async for raw in ws`` and dispatches each frame. This is the one
    shared post-handshake loop consumed by the manager, the snapshot helpers, and
    the diagnostics probe.

    Handled transparently (never yielded):
        * ``ping`` -> replies with ``pong`` and continues.
        * ``ka`` / ``pong`` keepalives -> ignored.
        * unknown / unmatched frames -> ignored (keepalives, frames for other ids).
        * malformed frames (non-JSON, non-object, ``.get`` failures) -> logged and
          skipped, never fatal.

    Yielded:
        * :class:`DataEvent` for a matching ``next`` / ``data`` frame.
        * :class:`ErrorEvent` for a matching ``error`` frame.
        * :class:`CompleteEvent` for a ``complete`` frame (the caller decides
          whether to stop iterating).

    Args:
        ws: a connected, already-subscribed websocket.
        sub_id: the subscription id to match data/error frames against.
        expected_data_type: ``"next"`` (transport-ws) or ``"data"`` (legacy).
    """
    async for raw in ws:
        try:
            msg = json.loads(raw)
            msg_type = msg.get("type")

            if msg_type == "ping":
                await ws.send(json.dumps({"type": "pong"}))
                continue

            if msg_type == expected_data_type and msg.get("id") == sub_id:
                # Coerce a missing or non-dict payload to {} so the consumer's
                # ``payload.get("data")`` never raises AttributeError on a truthy
                # non-dict payload (e.g. a list or string sent in a data frame).
                payload = msg.get("payload")
                yield DataEvent(payload=payload if isinstance(payload, dict) else {})
            elif msg_type == "error" and msg.get("id") == sub_id:
                yield ErrorEvent(payload=msg.get("payload"))
            elif msg_type == "complete":
                yield CompleteEvent()
            # ``ka`` / ``pong`` / unknown / unmatched frames fall through and are
            # ignored — keepalives and frames for other subscriptions.
        except (json.JSONDecodeError, AttributeError, TypeError) as e:
            # A single malformed frame must be logged-and-skipped, never abort the
            # stream — mirrors the historical per-message resilience.
            logger.warning("Skipping malformed subscription frame: %s", e)
            continue


@dataclass(slots=True)
class GraphqlWsSession:
    """A live, ack-confirmed graphql-ws subscription stream.

    Attributes:
        ws: the connected websocket (already past connection_ack + subscribe).
        proto: the negotiated subprotocol (``graphql-transport-ws`` or
            ``graphql-ws``), normalized to ``graphql-transport-ws`` when the
            server reports none.
        sub_id: the subscription id used in the subscribe message and matched
            against inbound data/error frames.
        expected_data_type: ``"next"`` for transport-ws, ``"data"`` for legacy.
    """

    ws: Any
    proto: str
    sub_id: str
    expected_data_type: str

    def messages(self) -> AsyncIterator[DataEvent | ErrorEvent | CompleteEvent]:
        """Normalized post-handshake event stream — see :func:`iter_messages`."""
        return iter_messages(
            self.ws,
            sub_id=self.sub_id,
            expected_data_type=self.expected_data_type,
        )


@asynccontextmanager
async def graphql_ws_session(
    ws_url: str,
    query: str,
    *,
    sub_id: str,
    variables: dict[str, Any] | None = None,
    ssl_context: _ssl.SSLContext | None = None,
    open_timeout: float = _WS_OPEN_TIMEOUT,
    ack_timeout: float | None = _WS_ACK_TIMEOUT,
    ping_interval: float = _WS_PING_INTERVAL,
    ping_timeout: float = _WS_PING_TIMEOUT,
    close_timeout: float | None = None,
) -> AsyncIterator[GraphqlWsSession]:
    """Connect, authenticate, and subscribe over a graphql-ws WebSocket.

    Yields a live :class:`GraphqlWsSession` once ``connection_ack`` has been
    received and the subscribe message has been sent. The websocket is closed on
    exit of the context manager.

    Args:
        ws_url: the ``ws(s)://.../graphql`` endpoint.
        query: the GraphQL subscription document.
        sub_id: id used in the subscribe message and to match data/error frames.
        variables: subscription variables. When ``None`` the ``variables`` key is
            omitted from the subscribe payload entirely (matching the diagnostics
            probe's historical wire format); when provided it is sent as-is.
        ssl_context: SSL context for ``wss://`` (``None`` for plaintext).
        open_timeout: websocket connect timeout.
        ack_timeout: timeout waiting for ``connection_ack``. ``None`` waits with a
            plain ``recv()`` (no deadline) — used by the diagnostics probe to keep
            its historical behavior.
        ping_interval: forwarded to ``websockets.connect`` (keepalive ping cadence).
        ping_timeout: forwarded to ``websockets.connect`` (keepalive ping deadline).
        close_timeout: forwarded to ``websockets.connect`` only when not ``None``.

    Raises:
        ProtocolError: if the server replies with ``connection_error`` or any
            non-``connection_ack`` frame to ``connection_init``.
    """
    connect_kwargs: dict[str, Any] = {
        "subprotocols": list(_SUBPROTOCOLS),
        "open_timeout": open_timeout,
        "ping_interval": ping_interval,
        "ping_timeout": ping_timeout,
        "ssl": ssl_context,
    }
    if close_timeout is not None:
        connect_kwargs["close_timeout"] = close_timeout

    async with websockets.connect(ws_url, **connect_kwargs) as ws:
        proto = ws.subprotocol or "graphql-transport-ws"

        # Handshake: connection_init -> connection_ack.
        await ws.send(json.dumps(build_connection_init()))

        if ack_timeout is None:
            ack_raw = await ws.recv()
        else:
            ack_raw = await asyncio.wait_for(ws.recv(), timeout=ack_timeout)
        ack = json.loads(ack_raw)
        ack_type = ack.get("type")
        if ack_type == "connection_error":
            payload = ack.get("payload")
            raise ProtocolError(
                f"connection_error: {payload}", kind="connection_error", payload=payload
            )
        if ack_type != "connection_ack":
            raise ProtocolError(
                f"unexpected handshake response: {ack_type!r}",
                kind="unexpected",
                ack_type=ack_type,
            )

        # Subscribe: transport-ws uses "subscribe"; legacy graphql-ws uses "start".
        start_type = "subscribe" if proto == "graphql-transport-ws" else "start"
        # Omit the "variables" key entirely when no variables are provided so the
        # wire format matches the diagnostics probe's historical exact frame
        # (it sent no "variables" key). When variables ARE passed, send them as-is.
        subscribe_payload: dict[str, Any] = {"query": query}
        if variables is not None:
            subscribe_payload["variables"] = variables
        await ws.send(
            json.dumps(
                {
                    "id": sub_id,
                    "type": start_type,
                    "payload": subscribe_payload,
                }
            )
        )

        expected_data_type = "next" if proto == "graphql-transport-ws" else "data"
        yield GraphqlWsSession(
            ws=ws,
            proto=proto,
            sub_id=sub_id,
            expected_data_type=expected_data_type,
        )
