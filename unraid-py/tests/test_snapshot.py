# tests/test_snapshot.py
"""Tests for subscribe_once() and subscribe_collect() snapshot helpers."""

from __future__ import annotations

import asyncio
import json
import time
from unittest.mock import AsyncMock, MagicMock, patch

import pytest


def _make_ws_message(sub_id: str, data: dict, proto: str = "graphql-transport-ws") -> str:
    msg_type = "next" if proto == "graphql-transport-ws" else "data"
    return json.dumps({"id": sub_id, "type": msg_type, "payload": {"data": data}})


def _make_ws_recv_sequence(*messages: str):
    """Build an async iterator that yields strings then hangs."""

    async def _gen():
        for m in messages:
            yield m
        # hang — simulates no more messages
        await asyncio.Event().wait()

    return _gen()


@pytest.fixture(autouse=True)
def mock_ws_url():
    """Patch build_ws_url so tests don't need UNRAID_API_URL configured."""
    with (
        patch(
            "unraid_mcp.subscriptions.snapshot.build_ws_url",
            return_value="ws://localhost:2999/graphql",
        ),
        patch(
            "unraid_mcp.subscriptions.snapshot.build_ws_ssl_context",
            return_value=None,
        ),
    ):
        yield


@pytest.fixture
def mock_ws():
    ws = MagicMock()
    ws.subprotocol = "graphql-transport-ws"
    ws.send = AsyncMock()
    return ws


@pytest.mark.asyncio
async def test_subscribe_once_returns_first_event(mock_ws):
    """subscribe_once returns data from the first matching event."""
    from unraid_mcp.subscriptions.snapshot import subscribe_once

    ack = json.dumps({"type": "connection_ack"})
    data_msg = _make_ws_message("snapshot-1", {"systemMetricsCpu": {"percentTotal": 42.0}})
    mock_ws.__aiter__ = lambda s: aiter([data_msg])
    mock_ws.recv = AsyncMock(return_value=ack)

    async def aiter(items):
        for item in items:
            yield item

    with patch("unraid_mcp.subscriptions.protocol.websockets.connect") as mock_connect:
        mock_connect.return_value.__aenter__ = AsyncMock(return_value=mock_ws)
        mock_connect.return_value.__aexit__ = AsyncMock(return_value=False)

        result = await subscribe_once("subscription { systemMetricsCpu { percentTotal } }")

    assert result == {"systemMetricsCpu": {"percentTotal": 42.0}}


@pytest.mark.asyncio
async def test_subscribe_once_raises_on_graphql_error(mock_ws):
    """subscribe_once raises ToolError when server returns GraphQL errors."""
    from unraid_mcp.core.exceptions import ToolError
    from unraid_mcp.subscriptions.snapshot import subscribe_once

    ack = json.dumps({"type": "connection_ack"})
    error_msg = json.dumps(
        {
            "id": "snapshot-1",
            "type": "next",
            "payload": {"errors": [{"message": "Not authorized"}]},
        }
    )

    async def aiter(items):
        for item in items:
            yield item

    mock_ws.__aiter__ = lambda s: aiter([error_msg])
    mock_ws.recv = AsyncMock(return_value=ack)

    with patch("unraid_mcp.subscriptions.protocol.websockets.connect") as mock_connect:
        mock_connect.return_value.__aenter__ = AsyncMock(return_value=mock_ws)
        mock_connect.return_value.__aexit__ = AsyncMock(return_value=False)

        with pytest.raises(ToolError, match="Not authorized"):
            await subscribe_once("subscription { systemMetricsCpu { percentTotal } }")


@pytest.mark.asyncio
async def test_subscribe_collect_returns_multiple_events(mock_ws):
    """subscribe_collect returns a list of events received within the window."""
    from unraid_mcp.subscriptions.snapshot import subscribe_collect

    ack = json.dumps({"type": "connection_ack"})
    msg1 = _make_ws_message("snapshot-1", {"notificationAdded": {"id": "1", "title": "A"}})
    msg2 = _make_ws_message("snapshot-1", {"notificationAdded": {"id": "2", "title": "B"}})

    async def aiter(items):
        for item in items:
            yield item
        await asyncio.sleep(10)  # hang after messages

    mock_ws.__aiter__ = lambda s: aiter([msg1, msg2])
    mock_ws.recv = AsyncMock(return_value=ack)

    with patch("unraid_mcp.subscriptions.protocol.websockets.connect") as mock_connect:
        mock_connect.return_value.__aenter__ = AsyncMock(return_value=mock_ws)
        mock_connect.return_value.__aexit__ = AsyncMock(return_value=False)

        result = await subscribe_collect(
            "subscription { notificationAdded { id title } }",
            collect_for=0.1,
        )

    assert len(result) == 2
    assert result[0]["notificationAdded"]["id"] == "1"


@pytest.mark.asyncio
async def test_subscribe_collect_stops_at_event_limit(mock_ws):
    """A noisy stream is disconnected once the in-memory event cap is reached."""
    from unraid_mcp.subscriptions.snapshot import subscribe_collect

    ack = json.dumps({"type": "connection_ack"})
    messages = [_make_ws_message("snapshot-1", {"event": {"id": str(i)}}) for i in range(20)]

    async def aiter(items):
        for item in items:
            yield item

    mock_ws.__aiter__ = lambda s: aiter(messages)
    mock_ws.recv = AsyncMock(return_value=ack)

    with patch("unraid_mcp.subscriptions.protocol.websockets.connect") as mock_connect:
        mock_connect.return_value.__aenter__ = AsyncMock(return_value=mock_ws)
        mock_connect.return_value.__aexit__ = AsyncMock(return_value=False)

        result = await subscribe_collect("subscription { event { id } }", max_events=3)

    assert [item["event"]["id"] for item in result] == ["0", "1", "2"]
    assert result.truncated is True
    assert result.truncation_reason == "max_events"


@pytest.mark.asyncio
async def test_subscribe_collect_stops_before_byte_budget_is_exceeded(mock_ws):
    """Serialized retained events never exceed the configured byte budget."""
    from unraid_mcp.subscriptions.snapshot import subscribe_collect

    ack = json.dumps({"type": "connection_ack"})
    first = {"event": {"value": "a" * 12}}
    second = {"event": {"value": "b" * 12}}

    async def aiter(items):
        for item in items:
            yield item

    mock_ws.__aiter__ = lambda s: aiter(
        [_make_ws_message("snapshot-1", first), _make_ws_message("snapshot-1", second)]
    )
    mock_ws.recv = AsyncMock(return_value=ack)
    one_event_bytes = len(json.dumps(first, separators=(",", ":")).encode())

    with patch("unraid_mcp.subscriptions.protocol.websockets.connect") as mock_connect:
        mock_connect.return_value.__aenter__ = AsyncMock(return_value=mock_ws)
        mock_connect.return_value.__aexit__ = AsyncMock(return_value=False)

        result = await subscribe_collect(
            "subscription { event { value } }",
            max_bytes=one_event_bytes,
        )

    assert result == [first]
    assert result.truncated is True
    assert result.truncation_reason == "max_bytes"


@pytest.mark.asyncio
async def test_subscribe_collect_transforms_before_retaining(mock_ws):
    """Log filtering/compaction can run before events consume the memory budget."""
    from unraid_mcp.subscriptions.snapshot import subscribe_collect

    ack = json.dumps({"type": "connection_ack"})
    raw = {"event": {"value": "x" * 20_000}}
    compact = {"event": {"value": "kept"}}

    async def aiter(items):
        for item in items:
            yield item

    mock_ws.__aiter__ = lambda s: aiter([_make_ws_message("snapshot-1", raw)])
    mock_ws.recv = AsyncMock(return_value=ack)

    with patch("unraid_mcp.subscriptions.protocol.websockets.connect") as mock_connect:
        mock_connect.return_value.__aenter__ = AsyncMock(return_value=mock_ws)
        mock_connect.return_value.__aexit__ = AsyncMock(return_value=False)

        result = await subscribe_collect(
            "subscription { event { value } }",
            max_bytes=100,
            transform=lambda _event: compact,
        )

    assert result == [compact]


@pytest.mark.asyncio
async def test_subscribe_collect_returns_promptly_on_complete(mock_ws):
    """A CompleteEvent terminates collection instead of waiting out the window."""
    from unraid_mcp.subscriptions.snapshot import subscribe_collect

    ack = json.dumps({"type": "connection_ack"})
    complete = json.dumps({"id": "snapshot-1", "type": "complete"})

    async def aiter():
        yield complete
        await asyncio.Event().wait()

    mock_ws.__aiter__ = lambda s: aiter()
    mock_ws.recv = AsyncMock(return_value=ack)

    with patch("unraid_mcp.subscriptions.protocol.websockets.connect") as mock_connect:
        mock_connect.return_value.__aenter__ = AsyncMock(return_value=mock_ws)
        mock_connect.return_value.__aexit__ = AsyncMock(return_value=False)

        started = time.monotonic()
        result = await subscribe_collect(
            "subscription { event { id } }",
            collect_for=5.0,
        )

    assert result == []
    assert time.monotonic() - started < 0.5


@pytest.mark.asyncio
async def test_subscribe_collect_rejects_unbounded_window_before_connect(mock_ws):
    from unraid_mcp.config.settings import UNRAID_SUBSCRIPTION_COLLECT_MAX_SECONDS
    from unraid_mcp.core.exceptions import ToolError
    from unraid_mcp.subscriptions.snapshot import subscribe_collect

    with pytest.raises(ToolError, match="collect_for"):
        await subscribe_collect(
            "subscription { event { id } }",
            collect_for=UNRAID_SUBSCRIPTION_COLLECT_MAX_SECONDS + 1,
        )


def test_snapshot_actions_importable_from_subscriptions() -> None:
    from unraid_mcp.subscriptions.queries import COLLECT_ACTIONS, SNAPSHOT_ACTIONS

    assert "cpu" in SNAPSHOT_ACTIONS
    assert "log_tail" in COLLECT_ACTIONS


# ---------------------------------------------------------------------------
# Malformed-frame resilience (T-M4)
#
# A single bad WebSocket frame must be logged-and-skipped, not abort the whole
# snapshot — matching the persistent manager loop's per-message resilience.
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_subscribe_once_skips_non_json_frame_then_returns(mock_ws):
    """A non-JSON text frame is skipped; a good frame that follows still returns."""
    from unraid_mcp.subscriptions.snapshot import subscribe_once

    ack = json.dumps({"type": "connection_ack"})
    good = _make_ws_message("snapshot-1", {"systemMetricsCpu": {"percentTotal": 7.5}})

    async def aiter(items):
        for item in items:
            yield item

    # First frame is garbage, second is valid.
    mock_ws.__aiter__ = lambda s: aiter(["this is not json {{{", good])
    mock_ws.recv = AsyncMock(return_value=ack)

    with patch("unraid_mcp.subscriptions.protocol.websockets.connect") as mock_connect:
        mock_connect.return_value.__aenter__ = AsyncMock(return_value=mock_ws)
        mock_connect.return_value.__aexit__ = AsyncMock(return_value=False)

        result = await subscribe_once("subscription { systemMetricsCpu { percentTotal } }")

    assert result == {"systemMetricsCpu": {"percentTotal": 7.5}}


@pytest.mark.asyncio
async def test_subscribe_once_skips_non_dict_json_frame_then_returns(mock_ws):
    """A JSON array/string frame (where .get() would blow up) is skipped, not fatal."""
    from unraid_mcp.subscriptions.snapshot import subscribe_once

    ack = json.dumps({"type": "connection_ack"})
    # Valid JSON, but not an object — msg.get(...) raises AttributeError.
    bad_list = json.dumps([1, 2, 3])
    bad_str = json.dumps("just a string")
    good = _make_ws_message("snapshot-1", {"systemMetricsCpu": {"percentTotal": 1.0}})

    async def aiter(items):
        for item in items:
            yield item

    mock_ws.__aiter__ = lambda s: aiter([bad_list, bad_str, good])
    mock_ws.recv = AsyncMock(return_value=ack)

    with patch("unraid_mcp.subscriptions.protocol.websockets.connect") as mock_connect:
        mock_connect.return_value.__aenter__ = AsyncMock(return_value=mock_ws)
        mock_connect.return_value.__aexit__ = AsyncMock(return_value=False)

        result = await subscribe_once("subscription { systemMetricsCpu { percentTotal } }")

    assert result == {"systemMetricsCpu": {"percentTotal": 1.0}}


@pytest.mark.asyncio
async def test_subscribe_once_skips_missing_payload_and_unknown_type(mock_ws):
    """A data frame missing 'payload' and an unknown type are ignored; good frame wins."""
    from unraid_mcp.subscriptions.snapshot import subscribe_once

    ack = json.dumps({"type": "connection_ack"})
    # Matching id/type but no 'payload' key — must not raise, just yield nothing.
    missing_payload = json.dumps({"id": "snapshot-1", "type": "next"})
    unknown_type = json.dumps({"id": "snapshot-1", "type": "totally_unknown", "payload": {}})
    good = _make_ws_message("snapshot-1", {"systemMetricsCpu": {"percentTotal": 99.0}})

    async def aiter(items):
        for item in items:
            yield item

    mock_ws.__aiter__ = lambda s: aiter([missing_payload, unknown_type, good])
    mock_ws.recv = AsyncMock(return_value=ack)

    with patch("unraid_mcp.subscriptions.protocol.websockets.connect") as mock_connect:
        mock_connect.return_value.__aenter__ = AsyncMock(return_value=mock_ws)
        mock_connect.return_value.__aexit__ = AsyncMock(return_value=False)

        result = await subscribe_once("subscription { systemMetricsCpu { percentTotal } }")

    assert result == {"systemMetricsCpu": {"percentTotal": 99.0}}


@pytest.mark.asyncio
async def test_subscribe_once_still_raises_on_graphql_error_after_bad_frame(mock_ws):
    """A real GraphQL error (ToolError) still propagates even past a malformed frame."""
    from unraid_mcp.core.exceptions import ToolError
    from unraid_mcp.subscriptions.snapshot import subscribe_once

    ack = json.dumps({"type": "connection_ack"})
    bad = "garbage frame {{{"
    error_msg = json.dumps(
        {
            "id": "snapshot-1",
            "type": "next",
            "payload": {"errors": [{"message": "Not authorized"}]},
        }
    )

    async def aiter(items):
        for item in items:
            yield item

    mock_ws.__aiter__ = lambda s: aiter([bad, error_msg])
    mock_ws.recv = AsyncMock(return_value=ack)

    with patch("unraid_mcp.subscriptions.protocol.websockets.connect") as mock_connect:
        mock_connect.return_value.__aenter__ = AsyncMock(return_value=mock_ws)
        mock_connect.return_value.__aexit__ = AsyncMock(return_value=False)

        with pytest.raises(ToolError, match="Not authorized"):
            await subscribe_once("subscription { systemMetricsCpu { percentTotal } }")


@pytest.mark.asyncio
async def test_subscribe_collect_skips_malformed_frames(mock_ws):
    """subscribe_collect skips bad frames and still collects the valid ones."""
    from unraid_mcp.subscriptions.snapshot import subscribe_collect

    ack = json.dumps({"type": "connection_ack"})
    bad_json = "not json {{{"
    bad_list = json.dumps([1, 2])
    missing_payload = json.dumps({"id": "snapshot-1", "type": "next"})
    good1 = _make_ws_message("snapshot-1", {"notificationAdded": {"id": "1", "title": "A"}})
    good2 = _make_ws_message("snapshot-1", {"notificationAdded": {"id": "2", "title": "B"}})

    async def aiter(items):
        for item in items:
            yield item
        await asyncio.sleep(10)  # hang after messages so the window expires

    mock_ws.__aiter__ = lambda s: aiter([bad_json, good1, bad_list, missing_payload, good2])
    mock_ws.recv = AsyncMock(return_value=ack)

    with patch("unraid_mcp.subscriptions.protocol.websockets.connect") as mock_connect:
        mock_connect.return_value.__aenter__ = AsyncMock(return_value=mock_ws)
        mock_connect.return_value.__aexit__ = AsyncMock(return_value=False)

        result = await subscribe_collect(
            "subscription { notificationAdded { id title } }",
            collect_for=0.1,
        )

    assert len(result) == 2
    assert result[0]["notificationAdded"]["id"] == "1"
    assert result[1]["notificationAdded"]["id"] == "2"


# ---------------------------------------------------------------------------
# Best-effort error handling: subscribe_collect must NOT abort on a standalone
# protocol 'error' frame. It logs and keeps collecting, returning the events it
# gathered before the window expired (this differs from subscribe_once, which
# raises on an error frame). This restores the historical collect behavior.
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_subscribe_collect_continues_past_standalone_error_frame(mock_ws):
    """[good, error, good] within the window returns BOTH good events, not a raise."""
    from unraid_mcp.subscriptions.snapshot import subscribe_collect

    ack = json.dumps({"type": "connection_ack"})
    good1 = _make_ws_message("snapshot-1", {"notificationAdded": {"id": "1", "title": "A"}})
    error_frame = json.dumps(
        {"id": "snapshot-1", "type": "error", "payload": {"message": "transient blip"}}
    )
    good2 = _make_ws_message("snapshot-1", {"notificationAdded": {"id": "2", "title": "B"}})

    async def aiter(items):
        for item in items:
            yield item
        await asyncio.sleep(10)  # hang after messages so the window expires

    mock_ws.__aiter__ = lambda s: aiter([good1, error_frame, good2])
    mock_ws.recv = AsyncMock(return_value=ack)

    with patch("unraid_mcp.subscriptions.protocol.websockets.connect") as mock_connect:
        mock_connect.return_value.__aenter__ = AsyncMock(return_value=mock_ws)
        mock_connect.return_value.__aexit__ = AsyncMock(return_value=False)

        result = await subscribe_collect(
            "subscription { notificationAdded { id title } }",
            collect_for=0.1,
        )

    # The standalone error frame was logged-and-skipped, not fatal: both good
    # events survive and are returned.
    assert len(result) == 2
    assert result[0]["notificationAdded"]["id"] == "1"
    assert result[1]["notificationAdded"]["id"] == "2"


@pytest.mark.asyncio
async def test_subscribe_once_still_raises_on_standalone_error_frame(mock_ws):
    """subscribe_once must still RAISE on a standalone error frame (unlike collect)."""
    from unraid_mcp.core.exceptions import ToolError
    from unraid_mcp.subscriptions.snapshot import subscribe_once

    ack = json.dumps({"type": "connection_ack"})
    error_frame = json.dumps(
        {"id": "snapshot-1", "type": "error", "payload": {"message": "bad subscription"}}
    )

    async def aiter(items):
        for item in items:
            yield item

    mock_ws.__aiter__ = lambda s: aiter([error_frame])
    mock_ws.recv = AsyncMock(return_value=ack)

    with patch("unraid_mcp.subscriptions.protocol.websockets.connect") as mock_connect:
        mock_connect.return_value.__aenter__ = AsyncMock(return_value=mock_ws)
        mock_connect.return_value.__aexit__ = AsyncMock(return_value=False)

        with pytest.raises(ToolError, match="Subscription error"):
            await subscribe_once("subscription { systemMetricsCpu { percentTotal } }")


@pytest.mark.asyncio
async def test_subscribe_collect_still_raises_on_errors_inside_data_payload(mock_ws):
    """GraphQL errors carried INSIDE a data payload still raise in subscribe_collect."""
    from unraid_mcp.core.exceptions import ToolError
    from unraid_mcp.subscriptions.snapshot import subscribe_collect

    ack = json.dumps({"type": "connection_ack"})
    # A 'next' (data-type) frame whose payload carries GraphQL 'errors' — this is
    # _raise_on_errors territory and must still abort, unlike a standalone 'error'.
    data_with_errors = json.dumps(
        {
            "id": "snapshot-1",
            "type": "next",
            "payload": {"errors": [{"message": "Not authorized"}]},
        }
    )

    async def aiter(items):
        for item in items:
            yield item
        await asyncio.sleep(10)

    mock_ws.__aiter__ = lambda s: aiter([data_with_errors])
    mock_ws.recv = AsyncMock(return_value=ack)

    with patch("unraid_mcp.subscriptions.protocol.websockets.connect") as mock_connect:
        mock_connect.return_value.__aenter__ = AsyncMock(return_value=mock_ws)
        mock_connect.return_value.__aexit__ = AsyncMock(return_value=False)

        with pytest.raises(ToolError, match="Not authorized"):
            await subscribe_collect(
                "subscription { notificationAdded { id title } }",
                collect_for=0.1,
            )
