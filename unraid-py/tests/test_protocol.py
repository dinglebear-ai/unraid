# tests/test_protocol.py
"""Direct tests for the shared graphql-ws protocol primitive.

`graphql_ws_session` and `iter_messages` (in src/unraid_mcp/subscriptions/protocol.py)
are the factored-out handshake + message-normalization shared by the manager loop,
the snapshot helpers, and the diagnostics probe. They previously had no direct
tests — coverage came only indirectly through the snapshot/integration suites.

These tests mock ``websockets.connect`` (patch target
``unraid_mcp.subscriptions.protocol.websockets.connect``) the same way
``tests/test_snapshot.py`` / ``tests/integration/test_subscriptions.py`` do.
"""

from __future__ import annotations

import json
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from unraid_mcp.subscriptions.protocol import (
    CompleteEvent,
    DataEvent,
    ErrorEvent,
    GraphqlWsSession,
    ProtocolError,
    graphql_ws_session,
    iter_messages,
)


_CONNECT = "unraid_mcp.subscriptions.protocol.websockets.connect"
_QUERY = "subscription { cpu { percentTotal } }"


# ---------------------------------------------------------------------------
# Fake WebSocket
# ---------------------------------------------------------------------------


class FakeWebSocket:
    """Fake WS supporting recv() (for the ack), async-for, and send.

    ``recv()`` draws from a separate ``recv_messages`` queue (the handshake ack).
    Async-for iteration draws from ``stream_messages`` (the post-handshake data
    stream). ``send`` is an AsyncMock so sent frames can be inspected.
    """

    def __init__(
        self,
        recv_messages: list[str] | None = None,
        stream_messages: list[str] | None = None,
        subprotocol: str = "graphql-transport-ws",
    ) -> None:
        self.subprotocol = subprotocol
        self._recv = list(recv_messages or [])
        self._stream = list(stream_messages or [])
        self._recv_index = 0
        self._stream_index = 0
        self.send = AsyncMock()

    async def recv(self) -> str:
        if self._recv_index >= len(self._recv):
            raise AssertionError("recv() called more times than messages provided")
        msg = self._recv[self._recv_index]
        self._recv_index += 1
        return msg

    def __aiter__(self) -> FakeWebSocket:
        return self

    async def __anext__(self) -> str:
        if self._stream_index >= len(self._stream):
            raise StopAsyncIteration
        msg = self._stream[self._stream_index]
        self._stream_index += 1
        return msg


def _connect_ctx(ws: FakeWebSocket) -> MagicMock:
    """Wrap a FakeWebSocket so ``async with websockets.connect(...) as ws:`` works."""
    ctx = MagicMock()
    ctx.__aenter__ = AsyncMock(return_value=ws)
    ctx.__aexit__ = AsyncMock(return_value=False)
    return ctx


def _patch_connect(ws: FakeWebSocket):
    """Patch protocol.websockets.connect to yield the given fake WS, return the mock."""
    return patch(_CONNECT, return_value=_connect_ctx(ws))


# ---------------------------------------------------------------------------
# graphql_ws_session — handshake failures
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_session_raises_protocol_error_on_connection_error() -> None:
    """A connection_error ack -> ProtocolError(kind="connection_error") carrying payload."""
    err_payload = {"message": "Invalid API key"}
    ws = FakeWebSocket(
        recv_messages=[json.dumps({"type": "connection_error", "payload": err_payload})]
    )

    with _patch_connect(ws), pytest.raises(ProtocolError) as exc_info:
        async with graphql_ws_session("ws://x/graphql", _QUERY, sub_id="s1"):
            pass  # pragma: no cover — handshake raises before yielding

    err = exc_info.value
    assert err.kind == "connection_error"
    assert err.payload == err_payload


@pytest.mark.asyncio
async def test_session_raises_protocol_error_on_unexpected_type() -> None:
    """Any other non-ack init frame -> ProtocolError(kind="unexpected") with ack_type set."""
    ws = FakeWebSocket(recv_messages=[json.dumps({"type": "totally_unexpected"})])

    with _patch_connect(ws), pytest.raises(ProtocolError) as exc_info:
        async with graphql_ws_session("ws://x/graphql", _QUERY, sub_id="s1"):
            pass  # pragma: no cover — handshake raises before yielding

    err = exc_info.value
    assert err.kind == "unexpected"
    assert err.ack_type == "totally_unexpected"


# ---------------------------------------------------------------------------
# graphql_ws_session — successful handshake
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_session_ack_timeout_none_uses_bare_recv() -> None:
    """ack_timeout=None awaits a bare recv() (no wait_for) and yields a live session."""
    ws = FakeWebSocket(recv_messages=[json.dumps({"type": "connection_ack"})])

    # If a deadline were applied, asyncio.wait_for would be used; assert it is NOT.
    with (
        _patch_connect(ws),
        patch(
            "unraid_mcp.subscriptions.protocol.asyncio.wait_for",
            new_callable=AsyncMock,
        ) as mock_wait_for,
    ):
        async with graphql_ws_session(
            "ws://x/graphql", _QUERY, sub_id="s1", ack_timeout=None
        ) as session:
            assert isinstance(session, GraphqlWsSession)
            assert session.ws is ws

    mock_wait_for.assert_not_called()


@pytest.mark.asyncio
async def test_session_transport_ws_uses_subscribe_and_next() -> None:
    """Negotiated graphql-transport-ws -> subscribe frame is 'subscribe', data type 'next'."""
    ws = FakeWebSocket(
        recv_messages=[json.dumps({"type": "connection_ack"})],
        subprotocol="graphql-transport-ws",
    )

    with _patch_connect(ws):
        async with graphql_ws_session("ws://x/graphql", _QUERY, sub_id="s1") as session:
            assert session.proto == "graphql-transport-ws"
            assert session.expected_data_type == "next"

    # Second send is the subscribe frame (first is connection_init).
    subscribe_frame = json.loads(ws.send.call_args_list[1][0][0])
    assert subscribe_frame["type"] == "subscribe"
    assert subscribe_frame["id"] == "s1"
    assert subscribe_frame["payload"]["query"] == _QUERY


@pytest.mark.asyncio
async def test_session_legacy_graphql_ws_uses_start_and_data() -> None:
    """Negotiated graphql-ws -> subscribe frame is 'start', data type 'data'."""
    ws = FakeWebSocket(
        recv_messages=[json.dumps({"type": "connection_ack"})],
        subprotocol="graphql-ws",
    )

    with _patch_connect(ws):
        async with graphql_ws_session("ws://x/graphql", _QUERY, sub_id="s1") as session:
            assert session.proto == "graphql-ws"
            assert session.expected_data_type == "data"

    subscribe_frame = json.loads(ws.send.call_args_list[1][0][0])
    assert subscribe_frame["type"] == "start"


@pytest.mark.asyncio
async def test_session_omits_variables_key_when_none() -> None:
    """variables=None -> the subscribe payload has NO 'variables' key (probe fidelity)."""
    ws = FakeWebSocket(recv_messages=[json.dumps({"type": "connection_ack"})])

    with _patch_connect(ws):
        async with graphql_ws_session("ws://x/graphql", _QUERY, sub_id="s1", variables=None):
            pass

    subscribe_frame = json.loads(ws.send.call_args_list[1][0][0])
    assert "variables" not in subscribe_frame["payload"]


@pytest.mark.asyncio
async def test_session_includes_variables_key_when_provided() -> None:
    """variables provided -> sent as-is under the 'variables' key."""
    ws = FakeWebSocket(recv_messages=[json.dumps({"type": "connection_ack"})])
    variables = {"path": "/var/log/syslog"}

    with _patch_connect(ws):
        async with graphql_ws_session("ws://x/graphql", _QUERY, sub_id="s1", variables=variables):
            pass

    subscribe_frame = json.loads(ws.send.call_args_list[1][0][0])
    assert subscribe_frame["payload"]["variables"] == variables


# ---------------------------------------------------------------------------
# iter_messages — frame normalization
# ---------------------------------------------------------------------------


async def _drain(ws: FakeWebSocket, *, sub_id: str = "s1", expected: str = "next") -> list[Any]:
    return [event async for event in iter_messages(ws, sub_id=sub_id, expected_data_type=expected)]


@pytest.mark.asyncio
async def test_iter_messages_ping_replies_pong_and_skips_malformed() -> None:
    """ping -> pong reply sent; a malformed frame is skipped; a good DataEvent yields."""
    ping = json.dumps({"type": "ping"})
    malformed = "not json {{{"
    good = json.dumps({"type": "next", "id": "s1", "payload": {"data": {"v": 1}}})
    ws = FakeWebSocket(stream_messages=[ping, malformed, good])

    events = await _drain(ws)

    # The malformed frame was skipped; only the data frame is yielded.
    assert len(events) == 1
    assert isinstance(events[0], DataEvent)
    assert events[0].payload == {"data": {"v": 1}}

    # A pong was sent in response to the ping.
    sent_types = [json.loads(c[0][0]).get("type") for c in ws.send.call_args_list]
    assert "pong" in sent_types


@pytest.mark.asyncio
async def test_iter_messages_surfaces_error_and_complete() -> None:
    """error and complete frames are surfaced as ErrorEvent / CompleteEvent."""
    err = json.dumps({"type": "error", "id": "s1", "payload": {"message": "boom"}})
    complete = json.dumps({"type": "complete", "id": "s1"})
    ws = FakeWebSocket(stream_messages=[err, complete])

    events = await _drain(ws)

    assert len(events) == 2
    assert isinstance(events[0], ErrorEvent)
    assert events[0].payload == {"message": "boom"}
    assert isinstance(events[1], CompleteEvent)


@pytest.mark.asyncio
async def test_iter_messages_coerces_non_dict_payload_to_empty_dict() -> None:
    """A data frame with a truthy non-dict payload -> DataEvent(payload={}), not a crash."""
    # payload is a list (truthy, non-dict); the old code yielded it verbatim and the
    # consumer's .get("data") would raise AttributeError. It must be coerced to {}.
    bad_payload = json.dumps({"type": "next", "id": "s1", "payload": [1, 2, 3]})
    ws = FakeWebSocket(stream_messages=[bad_payload])

    events = await _drain(ws)

    assert len(events) == 1
    assert isinstance(events[0], DataEvent)
    assert events[0].payload == {}
    # The consumer pattern must not raise.
    assert events[0].payload.get("data") is None


@pytest.mark.asyncio
async def test_iter_messages_ignores_keepalives_and_unmatched_ids() -> None:
    """ka/pong keepalives and frames for other sub ids are ignored (never yielded)."""
    ka = json.dumps({"type": "ka"})
    pong = json.dumps({"type": "pong"})
    other = json.dumps({"type": "next", "id": "other", "payload": {"data": {"x": 1}}})
    good = json.dumps({"type": "next", "id": "s1", "payload": {"data": {"ok": True}}})
    ws = FakeWebSocket(stream_messages=[ka, pong, other, good])

    events = await _drain(ws)

    assert len(events) == 1
    assert isinstance(events[0], DataEvent)
    assert events[0].payload == {"data": {"ok": True}}


@pytest.mark.asyncio
async def test_iter_messages_legacy_data_type() -> None:
    """expected_data_type='data' matches legacy graphql-ws 'data' frames."""
    legacy = json.dumps({"type": "data", "id": "s1", "payload": {"data": {"legacy": True}}})
    # A 'next' frame must NOT match when the expected type is 'data'.
    next_frame = json.dumps({"type": "next", "id": "s1", "payload": {"data": {"ignored": True}}})
    ws = FakeWebSocket(stream_messages=[next_frame, legacy])

    events = await _drain(ws, expected="data")

    assert len(events) == 1
    assert events[0].payload == {"data": {"legacy": True}}
