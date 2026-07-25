"""One-shot GraphQL subscription helpers for MCP tool snapshot actions.

`subscribe_once(query, variables, timeout)` — connect, subscribe, return the
first event's data, then disconnect.

`subscribe_collect(query, variables, collect_for, timeout)` — connect,
subscribe, collect all events for `collect_for` seconds, and return a list-like
result carrying runtime-cap metadata.

Neither function maintains a persistent connection — they open and close a
WebSocket per call. This is intentional: MCP tools are request-response.
Use the SubscriptionManager for long-lived monitoring resources.

Both helpers share the graphql-ws handshake + message-normalization primitive in
:mod:`.protocol` (``graphql_ws_session`` + ``iter_messages``): the handshake,
ping->pong keepalives, and malformed-frame skipping live there, so this module
only contains the snapshot-specific timeout + return-first / collect-window
semantics.
"""

import asyncio
import json
from collections.abc import Callable, Iterable
from contextlib import asynccontextmanager
from typing import Any

from ..config import settings as _settings
from ..config.logging import logger
from ..core.exceptions import ToolError
from .protocol import (
    _WS_PING_INTERVAL,
    _WS_PING_TIMEOUT,
    CompleteEvent,
    DataEvent,
    ErrorEvent,
    ProtocolError,
    graphql_ws_session,
)
from .utils import build_ws_ssl_context, build_ws_url


_SUB_ID = "snapshot-1"


class CollectedEvents(list[dict[str, Any]]):
    """Backward-compatible event list carrying runtime-cap metadata."""

    def __init__(
        self,
        events: Iterable[dict[str, Any]] = (),
        *,
        truncation_reason: str | None = None,
    ) -> None:
        super().__init__(events)
        self.truncation_reason = truncation_reason

    @property
    def truncated(self) -> bool:
        return self.truncation_reason is not None


@asynccontextmanager
async def _ws_handshake(
    query: str,
    variables: dict[str, Any] | None = None,
    timeout: float = 10.0,  # noqa: ASYNC109
):
    """Connect, authenticate, and subscribe over WebSocket.

    Yields the live :class:`~.protocol.GraphqlWsSession` after the subscription
    is active. The caller iterates ``session.messages()`` for data events.

    Translates the protocol's :class:`~.protocol.ProtocolError` (auth failure /
    unexpected handshake frame) into a :class:`ToolError`, preserving the
    historical snapshot error messages.
    """
    ws_url = build_ws_url()
    ssl_context = build_ws_ssl_context(ws_url)

    try:
        async with graphql_ws_session(
            ws_url,
            query,
            sub_id=_SUB_ID,
            variables=variables,
            ssl_context=ssl_context,
            open_timeout=timeout,
            ack_timeout=timeout,
            ping_interval=_WS_PING_INTERVAL,
            ping_timeout=_WS_PING_TIMEOUT,
        ) as session:
            yield session
    except ProtocolError as e:
        if e.kind == "connection_error":
            raise ToolError(f"Subscription auth failed: {e.payload}") from e
        raise ToolError(f"Unexpected handshake response: {e.ack_type}") from e


def _raise_on_errors(payload: dict[str, Any]) -> None:
    """Raise ToolError if a data payload carries GraphQL errors."""
    if errors := payload.get("errors"):
        msgs = "; ".join(e.get("message", str(e)) for e in errors)
        raise ToolError(f"Subscription errors: {msgs}")


async def subscribe_once(
    query: str,
    variables: dict[str, Any] | None = None,
    timeout: float = 10.0,  # noqa: ASYNC109
) -> dict[str, Any]:
    """Open a WebSocket subscription, receive the first data event, close, return it.

    Raises ToolError on auth failure, GraphQL errors, or timeout.
    """
    if not 0 < timeout <= _settings.UNRAID_SUBSCRIPTION_TIMEOUT_MAX_SECONDS:
        raise ToolError(
            "timeout must be greater than 0 and no more than "
            f"{_settings.UNRAID_SUBSCRIPTION_TIMEOUT_MAX_SECONDS:g} seconds"
        )

    async with _ws_handshake(query, variables, timeout) as session:
        try:
            async with asyncio.timeout(timeout):
                async for event in session.messages():
                    if isinstance(event, DataEvent):
                        _raise_on_errors(event.payload)
                        if data := event.payload.get("data"):
                            return data
                    elif isinstance(event, ErrorEvent):
                        raise ToolError(f"Subscription error: {event.payload}")
                    # CompleteEvent: fall through; the websocket close that follows
                    # surfaces as "closed before data" below.
        except TimeoutError:
            raise ToolError(f"Subscription timed out after {timeout:.0f}s") from None

    raise ToolError("WebSocket closed before receiving subscription data")


async def subscribe_collect(
    query: str,
    variables: dict[str, Any] | None = None,
    collect_for: float = 5.0,
    timeout: float = 10.0,  # noqa: ASYNC109
    *,
    max_events: int | None = None,
    max_bytes: int | None = None,
    transform: Callable[[dict[str, Any]], dict[str, Any] | None] | None = None,
) -> CollectedEvents:
    """Open a subscription and return bounded events plus runtime-cap metadata.

    Returns an empty list if no events arrive within the window.
    Always closes the connection after the window expires.

    Best-effort error handling: a standalone protocol ``error`` frame is logged
    and skipped — collection continues and whatever was gathered before the
    window expired is returned. This matches the historical behavior (the legacy
    collect loop only matched ``expected_type``/``error`` frames and never broke
    on a standalone ``error``, so it kept collecting). Note this differs from
    :func:`subscribe_once`, which *does* raise on an ``ErrorEvent``: a one-shot
    snapshot has nothing to fall back to, whereas a collection window may still
    hold useful events. GraphQL errors carried *inside* a data payload still
    raise via :func:`_raise_on_errors` here, matching ``subscribe_once``.
    """
    if not 0 < collect_for <= _settings.UNRAID_SUBSCRIPTION_COLLECT_MAX_SECONDS:
        raise ToolError(
            "collect_for must be greater than 0 and no more than "
            f"{_settings.UNRAID_SUBSCRIPTION_COLLECT_MAX_SECONDS:g} seconds"
        )
    if not 0 < timeout <= _settings.UNRAID_SUBSCRIPTION_TIMEOUT_MAX_SECONDS:
        raise ToolError(
            "timeout must be greater than 0 and no more than "
            f"{_settings.UNRAID_SUBSCRIPTION_TIMEOUT_MAX_SECONDS:g} seconds"
        )
    if max_events is not None and max_events <= 0:
        raise ValueError("max_events must be positive")
    if max_bytes is not None and max_bytes <= 0:
        raise ValueError("max_bytes must be positive")
    max_events = min(
        max_events if max_events is not None else _settings.UNRAID_SUBSCRIPTION_COLLECT_MAX_EVENTS,
        _settings.UNRAID_SUBSCRIPTION_COLLECT_MAX_EVENTS,
    )
    max_bytes = min(
        max_bytes if max_bytes is not None else _settings.UNRAID_SUBSCRIPTION_COLLECT_MAX_BYTES,
        _settings.UNRAID_SUBSCRIPTION_COLLECT_MAX_BYTES,
    )
    if max_events <= 0:
        raise ValueError("max_events must be positive")
    if max_bytes <= 0:
        raise ValueError("max_bytes must be positive")

    events = CollectedEvents()
    retained_bytes = 0

    async with _ws_handshake(query, variables, timeout) as session:
        try:
            async with asyncio.timeout(collect_for):
                async for event in session.messages():
                    if isinstance(event, DataEvent):
                        _raise_on_errors(event.payload)
                        if data := event.payload.get("data"):
                            retained = transform(data) if transform is not None else data
                            if retained is None:
                                continue
                            event_bytes = len(
                                json.dumps(
                                    retained,
                                    separators=(",", ":"),
                                    ensure_ascii=False,
                                    default=str,
                                ).encode("utf-8")
                            )
                            if retained_bytes + event_bytes > max_bytes:
                                events.truncation_reason = "max_bytes"
                                logger.warning(
                                    "Subscription collection byte limit reached "
                                    "(%d bytes); stopping",
                                    max_bytes,
                                )
                                break
                            if len(events) >= max_events:
                                # Observe one event beyond the retained cap so callers
                                # can distinguish an exact-size result from truncation.
                                events.truncation_reason = "max_events"
                                logger.debug(
                                    "Subscription collection event limit reached (%d); stopping",
                                    max_events,
                                )
                                break
                            events.append(retained)
                            retained_bytes += event_bytes
                    elif isinstance(event, ErrorEvent):
                        # Best-effort: do NOT abort the whole collection window on a
                        # standalone protocol 'error' frame. Log and keep collecting
                        # so already-collected events are still returned (matches the
                        # historical collect loop, which never broke on 'error').
                        logger.warning(
                            "Subscription error frame during collect (continuing): %s",
                            event.payload,
                        )
                    elif isinstance(event, CompleteEvent):
                        break
        except TimeoutError:
            pass  # Collection window expired — return whatever was collected

    logger.debug("Collected %d events in %.1fs window", len(events), collect_for)
    return events
