"""WebSocket subscription manager for real-time Unraid data.

This module manages GraphQL subscriptions over WebSocket connections,
providing real-time data streaming for MCP resources with comprehensive
error handling, reconnection logic, and authentication.
"""

import asyncio
import json
import random
import re
import time
from datetime import UTC, datetime
from typing import Any

import websockets
from websockets.typing import Subprotocol

from ..config import settings as _settings
from ..config.logging import logger
from ..core.client import redact_sensitive
from ..core.types import SubscriptionData
from .protocol import (
    _WS_ACK_TIMEOUT,
    _WS_CLOSE_TIMEOUT,
    _WS_OPEN_TIMEOUT,
    _WS_PING_INTERVAL,
    _WS_PING_TIMEOUT,
    CompleteEvent,
    DataEvent,
    ErrorEvent,
    iter_messages,
)
from .state import ResourceSnapshot, SubscriptionState, _StateFieldView
from .utils import build_connection_init, build_ws_ssl_context, build_ws_url


# Resource data size limits to prevent unbounded memory growth
_MAX_RESOURCE_DATA_BYTES = 1_048_576  # 1MB
_MAX_RESOURCE_DATA_LINES = 5_000

# Reconnect backoff tuning (PERF-H2). Two thresholds decouple "reset backoff" from
# "reset the give-up counter" so a backend that flaps just past the stable mark
# can neither pin the reconnect cadence at the floor nor dodge the give-up ceiling:
#   * >= _HEALTHY_CONNECTION_SECONDS  -> proven healthy: reset backoff to the floor
#                                        AND clear the attempt counter.
#   * >= _STABLE_CONNECTION_SECONDS   -> briefly stable (flapping): keep the attempt
#                                        counter reset (we DID connect, don't abandon
#                                        it) but ESCALATE backoff so we stop hammering.
#   * <  _STABLE_CONNECTION_SECONDS   -> never stable: escalate backoff and let the
#                                        attempt counter climb toward give-up.
_STABLE_CONNECTION_SECONDS = 30
_HEALTHY_CONNECTION_SECONDS = 120
_INITIAL_RETRY_DELAY: float = 5
_MAX_RETRY_DELAY: float = 300  # 5 minutes max


# Subscription names that carry log content and therefore need _cap_log_content.
# All other subscriptions never have a 'content' field — skip the cap call for them.
_LOG_SUBSCRIPTION_NAMES: frozenset[str] = frozenset({"log_tail", "logFileSubscription"})


def _cap_log_content(data: dict[str, Any]) -> dict[str, Any]:
    """Cap log content in subscription data to prevent unbounded memory growth.

    Returns a new dict — does NOT mutate the input. If any nested 'content'
    field (from log subscriptions) exceeds the byte limit, truncate it to the
    most recent _MAX_RESOURCE_DATA_LINES lines.

    The final content is guaranteed to be <= _MAX_RESOURCE_DATA_BYTES.
    """
    result: dict[str, Any] = {}
    for key, value in data.items():
        if isinstance(value, dict):
            result[key] = _cap_log_content(value)
        elif (
            key == "content"
            and isinstance(value, str)
            # Pre-check uses byte count so multibyte UTF-8 chars cannot bypass the cap
            and len(value.encode("utf-8", errors="replace")) > _MAX_RESOURCE_DATA_BYTES
        ):
            lines = value.splitlines()
            original_line_count = len(lines)

            # Keep most recent lines first.
            if len(lines) > _MAX_RESOURCE_DATA_LINES:
                lines = lines[-_MAX_RESOURCE_DATA_LINES:]

            truncated = "\n".join(lines)
            # Encode once and slice bytes instead of an O(n²) line-trim loop
            encoded = truncated.encode("utf-8", errors="replace")
            if len(encoded) > _MAX_RESOURCE_DATA_BYTES:
                truncated = encoded[-_MAX_RESOURCE_DATA_BYTES:].decode("utf-8", errors="ignore")
                # Strip partial first line that may have been cut mid-character
                nl_pos = truncated.find("\n")
                if nl_pos != -1:
                    truncated = truncated[nl_pos + 1 :]

            logger.warning(
                f"[RESOURCE] Capped log content from {original_line_count} to "
                f"{len(lines)} lines ({len(value)} -> {len(truncated)} chars)"
            )
            result[key] = truncated
        else:
            result[key] = value
    return result


class SubscriptionManager:
    """Manages GraphQL subscriptions and converts them to MCP resources.

    Per-subscription state is consolidated into a single
    ``dict[str, SubscriptionState]`` (``self.states``) — one object per name —
    instead of ~8 parallel dicts. The historical attribute surface
    (``active_subscriptions``, ``resource_data``, ``connection_states``,
    ``last_error``, ``reconnect_attempts``, ``_connection_start_times``,
    ``_last_graphql_error``, ``_graphql_error_count``) is preserved as
    :class:`~.state._StateFieldView` field-projections over ``self.states`` so
    callers and tests can keep reading/writing them as mappings, while
    ``self.states`` remains the one source of truth.

    Lock discipline (unchanged):

    * ``_task_lock`` guards the task-lifecycle fields of each state (task,
      connection_state, last_error, reconnect_attempts, connection_start_time,
      and the graphql-error-dedup fields).
    * ``_data_lock`` guards the ``data`` field (WebSocket message writes + reads).

    Two fine-grained locks (instead of one coarse lock) keep WebSocket message
    updates from blocking tool reads of the task state and vice versa.

    Independent lock domains (no ABBA cycle): the two locks are kept strictly
    independent — *no code path holds both at once*. ``_subscription_loop``
    acquires ``_data_lock`` and ``_task_lock`` only in disjoint blocks (the
    ``data`` write under ``_data_lock``; the task-clear at loop exit under
    ``_task_lock``), never nested. :meth:`get_subscription_status` and
    :meth:`get_summary` need both field groups, so they snapshot under each lock
    *separately* (acquire/release ``_task_lock``, then acquire/release
    ``_data_lock``) rather than nesting them. Reading the two domains under
    separate, non-overlapping critical sections is what keeps them independent
    and avoids ever INTRODUCING an ABBA cycle — there is no inverse-order
    acquisition anywhere for it to deadlock against.

    Single-writer-per-name invariant: each subscription name is driven by exactly
    one ``_subscription_loop`` task (``start_subscription`` enforces this under
    ``_task_lock`` via a TOCTOU-safe guard before creating the task), so that task
    is the sole writer of its name's task-lifecycle fields. The "no await between
    paired writes" rule keeps related fields mutually consistent without a held
    lock: helpers that mutate more than one field together — notably
    :meth:`_set_connection_state` (``connection_state`` + ``last_error``) and the
    graphql-error-dedup writes in :meth:`_track_graphql_error` — contain no
    ``await``, so asyncio's cooperative scheduling cannot interleave another
    coroutine between the paired writes. Readers therefore observe either the
    full pre-write or full post-write pair, never a half-applied mix; the locks
    serialize *readers* against each other, not these single-writer pairs.
    """

    def __init__(self, runtime_settings: _settings.Settings | None = None) -> None:
        # Consolidated single source of truth: one SubscriptionState per name.
        self.states: dict[str, SubscriptionState] = {}

        # Backward-compatible field-views over self.states (see class docstring).
        self.active_subscriptions: _StateFieldView[asyncio.Task[None]] = _StateFieldView(
            self.states, "task", None
        )
        self.resource_data: _StateFieldView[SubscriptionData] = _StateFieldView(
            self.states, "data", None
        )
        self.connection_states: _StateFieldView[str] = _StateFieldView(
            self.states, "connection_state", ""
        )
        self.last_error: _StateFieldView[str] = _StateFieldView(self.states, "last_error", None)
        self.reconnect_attempts: _StateFieldView[int] = _StateFieldView(
            self.states, "reconnect_attempts", 0
        )
        self._connection_start_times: _StateFieldView[float] = _StateFieldView(
            self.states, "connection_start_time", None
        )
        # Deduplicated GraphQL error tracking (first error in the current burst +
        # repeat count) — used to suppress log spam.
        self._last_graphql_error: _StateFieldView[str] = _StateFieldView(
            self.states, "graphql_error_msg", None
        )
        self._graphql_error_count: _StateFieldView[int] = _StateFieldView(
            self.states, "graphql_error_count", 0
        )

        self._task_lock = asyncio.Lock()
        self._data_lock = asyncio.Lock()

        # Typed, startup-validated configuration. Tests may inject a Settings
        # instance without mutating process-global environment state.
        self.runtime_settings = runtime_settings or _settings.SETTINGS
        self.auto_start_enabled = self.runtime_settings.unraid_auto_start_subscriptions
        self.max_reconnect_attempts = self.runtime_settings.unraid_max_reconnect_attempts
        self._connection_semaphore = asyncio.Semaphore(
            self.runtime_settings.unraid_subscription_max_connections
        )
        self._startup_stagger_seconds = (
            self.runtime_settings.unraid_subscription_startup_stagger_seconds
        )

        # Define subscription configurations
        from .queries import SNAPSHOT_ACTIONS

        configured_auto_start = self.runtime_settings.unraid_subscription_auto_start_actions
        unknown_actions = (
            configured_auto_start - SNAPSHOT_ACTIONS.keys() if configured_auto_start else set()
        )
        if unknown_actions:
            raise ValueError(
                "Unknown UNRAID_SUBSCRIPTION_AUTO_START_ACTIONS: "
                + ", ".join(sorted(unknown_actions))
            )
        self.subscription_configs: dict[str, dict] = {
            action: {
                "query": query,
                "resource": f"unraid://live/{action}",
                "description": f"Real-time {action.replace('_', ' ')} data",
                "auto_start": (
                    action in configured_auto_start
                    if configured_auto_start is not None
                    else action != "network_metrics"
                ),
            }
            for action, query in SNAPSHOT_ACTIONS.items()
        }
        self.subscription_configs["logFileSubscription"] = {
            "query": """
                subscription LogFileSubscription($path: String!) {
                    logFile(path: $path) {
                        path
                        content
                        totalLines
                    }
                }
                """,
            "resource": "unraid://logs/stream",
            "description": "Real-time log file streaming",
            "auto_start": False,  # Started manually with path parameter
        }

        logger.info(
            f"[SUBSCRIPTION_MANAGER] Initialized with auto_start={self.auto_start_enabled}, max_reconnects={self.max_reconnect_attempts}"
        )
        logger.debug(
            f"[SUBSCRIPTION_MANAGER] Available subscriptions: {list(self.subscription_configs.keys())}"
        )

    def _clear_graphql_error_burst(self, subscription_name: str) -> None:
        """Reset deduplicated GraphQL error tracking for one subscription."""
        self._last_graphql_error.pop(subscription_name, None)
        self._graphql_error_count.pop(subscription_name, None)

    def _set_connection_state(self, name: str, state: str, error: str | None = None) -> None:
        """Atomically update connection state and optionally last_error.

        Must NOT contain any ``await`` — paired writes rely on asyncio
        cooperative scheduling to stay consistent (no interleaving at
        non-await points).
        """
        self.connection_states[name] = state
        if error is not None:
            self.last_error[name] = error

    async def _store_subscription_data(
        self,
        subscription_name: str,
        data: Any,
        *,
        generation: int | None = None,
    ) -> None:
        """Cache a fresh subscription data payload.

        Clears any GraphQL-error burst (data means recovery), caps log content for
        log subscriptions to bound memory, and writes the resource cache.

        Lock domains: the ``_clear_graphql_error_burst`` call mutates
        task-lock-guarded fields (``graphql_error_msg`` / ``graphql_error_count``)
        but does so WITHOUT holding ``_task_lock`` — that is safe only because of
        the single-writer-per-name invariant (this coroutine runs inside the one
        ``_subscription_loop`` task that owns those fields, so no other writer can
        race it; ``_task_lock`` serializes *readers*, not this sole writer). Only
        the ``data`` write is performed under ``_data_lock`` (paired with
        ``get_resource_data``).
        """
        self._clear_graphql_error_burst(subscription_name)
        capped_data = (
            _cap_log_content(data)
            if isinstance(data, dict) and subscription_name in _LOG_SUBSCRIPTION_NAMES
            else data
        )
        new_entry = SubscriptionData(data=capped_data, last_updated=datetime.now(UTC))
        async with self._data_lock:
            state = self.states.get(subscription_name)
            if generation is not None and (state is None or state.generation != generation):
                logger.debug(
                    "[RESOURCE:%s] Discarded payload from superseded generation",
                    subscription_name,
                )
                return
            if state is not None:
                # A standalone ErrorEvent is recoverable: a later valid payload on
                # the same generation proves the stream is healthy again.
                state.connection_state = "subscribed"
                state.last_error = None
            self.resource_data[subscription_name] = new_entry
        logger.debug(
            "[RESOURCE:%s] Resource data updated successfully",
            subscription_name,
        )

    def _track_graphql_error(self, subscription_name: str, errors: Any) -> None:
        """Record a GraphQL-error payload with deduplicated log spam.

        Logs the first occurrence of a distinct error as a warning, periodic
        reminders at powers of ten for repeats, and debug otherwise. Always
        records ``last_error``. Contains no ``await`` (matches the historical
        inline write).
        """
        err_msg = str(errors)
        prev = self._last_graphql_error.get(subscription_name)
        count = self._graphql_error_count.get(subscription_name, 0) + 1
        self._graphql_error_count[subscription_name] = count
        if prev != err_msg:
            # First occurrence of this error — log as warning.
            self._last_graphql_error[subscription_name] = err_msg
            self._graphql_error_count[subscription_name] = 1
            logger.warning(
                "[DATA:%s] GraphQL error (will suppress repeats): %s",
                subscription_name,
                err_msg,
            )
        elif count in (10, 100, 1000):
            # Periodic reminder at powers of 10.
            logger.warning(
                "[DATA:%s] GraphQL error repeated %d times: %s",
                subscription_name,
                count,
                err_msg,
            )
        else:
            logger.debug(
                "[DATA:%s] GraphQL error (repeat #%d)",
                subscription_name,
                count,
            )
        self.last_error[subscription_name] = f"GraphQL errors: {errors}"

    async def auto_start_all_subscriptions(self) -> None:
        """Auto-start all subscriptions marked for auto-start.

        All auto-start subscriptions are launched in parallel via asyncio.TaskGroup
        to avoid blocking the first MCP request on a sequential startup delay.
        """
        if not self.auto_start_enabled:
            logger.info("[SUBSCRIPTION_MANAGER] Auto-start disabled")
            return

        auto_start_configs = [
            (name, config)
            for name, config in self.subscription_configs.items()
            if config.get("auto_start", False)
        ]

        if not auto_start_configs:
            logger.info("[SUBSCRIPTION_MANAGER] No subscriptions marked for auto-start")
            return

        logger.info(
            f"[SUBSCRIPTION_MANAGER] Starting auto-start process for {len(auto_start_configs)} subscriptions in parallel..."
        )

        start_errors: list[tuple[str, Exception]] = []

        async def _start_one(name: str, config: dict[str, Any]) -> None:
            try:
                logger.info(f"[SUBSCRIPTION_MANAGER] Auto-starting subscription: {name}")
                await self.start_subscription(name, str(config["query"]))
            except asyncio.CancelledError:
                raise  # Never swallow cancellation — propagate for clean shutdown
            except Exception as e:
                logger.error(f"[SUBSCRIPTION_MANAGER] Failed to auto-start {name}: {e}")
                async with self._task_lock:
                    self.last_error[name] = str(e)
                start_errors.append((name, e))

        started_names: list[str] = []

        async def _tracked_start(index: int, name: str, config: dict[str, Any]) -> None:
            if self._startup_stagger_seconds > 0 and index > 0:
                await asyncio.sleep(index * self._startup_stagger_seconds)
            await _start_one(name, config)
            started_names.append(name)

        try:
            async with asyncio.TaskGroup() as tg:
                for index, (name, config) in enumerate(auto_start_configs):
                    tg.create_task(_tracked_start(index, name, config))
        except asyncio.CancelledError:
            for name in started_names:
                if name in self.active_subscriptions:
                    await self.stop_subscription(name)
            raise

        started = len(auto_start_configs) - len(start_errors)
        logger.info(
            f"[SUBSCRIPTION_MANAGER] Auto-start completed. Started {started}/{len(auto_start_configs)} subscriptions"
        )
        if start_errors:
            failed_names = ", ".join(n for n, _ in start_errors)
            logger.warning(
                f"[SUBSCRIPTION_MANAGER] {len(start_errors)} subscription(s) failed to auto-start: {failed_names}"
            )

    async def start_subscription(
        self, subscription_name: str, query: str, variables: dict[str, Any] | None = None
    ) -> None:
        """Start a GraphQL subscription and maintain it as a resource."""
        if not re.fullmatch(r"[a-zA-Z0-9_]+", subscription_name):
            raise ValueError(
                f"subscription_name must contain only [a-zA-Z0-9_], got: {subscription_name!r}"
            )
        self._clear_graphql_error_burst(subscription_name)
        logger.info(f"[SUBSCRIPTION:{subscription_name}] Starting subscription...")

        # Guard must be inside the lock to prevent a TOCTOU race where two
        # concurrent callers both pass the check before either creates the task.
        async with self._task_lock:
            if subscription_name in self.active_subscriptions:
                logger.warning(
                    f"[SUBSCRIPTION:{subscription_name}] Subscription already active, skipping"
                )
                return

            # Reset connection tracking inside the lock so state is consistent
            # with the task creation that follows immediately.
            state = self.states.setdefault(subscription_name, SubscriptionState())
            state.generation += 1
            generation = state.generation
            self.reconnect_attempts[subscription_name] = 0
            self._set_connection_state(subscription_name, "starting")
            self._connection_start_times.pop(subscription_name, None)

            try:
                task = asyncio.create_task(
                    self._subscription_loop(
                        subscription_name,
                        query,
                        variables or {},
                        generation=generation,
                    )
                )
                self.active_subscriptions[subscription_name] = task
                logger.info(
                    f"[SUBSCRIPTION:{subscription_name}] Subscription task created and started"
                )
                self._set_connection_state(subscription_name, "active")
            except Exception as e:
                logger.error(
                    f"[SUBSCRIPTION:{subscription_name}] Failed to start subscription task: {e}"
                )
                self._set_connection_state(subscription_name, "failed", str(e))
                raise

    async def stop_subscription(self, subscription_name: str) -> None:
        """Stop a specific subscription.

        Snapshots the task inside _task_lock, then releases the lock BEFORE
        awaiting cancellation. Holding _task_lock across 'await task' would
        deadlock if _subscription_loop's cleanup path also needs _task_lock
        (it does, at loop exit). Pattern: lock → snapshot → release → await.
        """
        logger.info(f"[SUBSCRIPTION:{subscription_name}] Stopping subscription...")

        async with self._task_lock:
            task = self.active_subscriptions.pop(subscription_name, None)
            if task is None:
                logger.warning(f"[SUBSCRIPTION:{subscription_name}] No active subscription to stop")
                return
            state = self.states[subscription_name]
            state.generation += 1
            stop_generation = state.generation
            self._set_connection_state(subscription_name, "stopped")
            self._connection_start_times.pop(subscription_name, None)
            async with self._data_lock:
                self.resource_data.pop(subscription_name, None)

        # Await cancellation OUTSIDE the lock — _subscription_loop cleanup path
        # acquires _task_lock at loop exit; holding it here while waiting for the
        # task to finish would deadlock.
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            logger.debug(f"[SUBSCRIPTION:{subscription_name}] Task cancelled successfully")
        async with self._task_lock:
            state = self.states.get(subscription_name)
            if state is not None and state.generation == stop_generation:
                self._set_connection_state(subscription_name, "stopped")
                self._clear_graphql_error_burst(subscription_name)
        logger.info(f"[SUBSCRIPTION:{subscription_name}] Subscription stopped")

    async def stop_all(self) -> None:
        """Stop all active subscriptions (called during server shutdown)."""
        async with self._task_lock:
            subscription_names = list(self.active_subscriptions.keys())
        for name in subscription_names:
            try:
                await self.stop_subscription(name)
            except Exception as e:
                logger.error(f"[SHUTDOWN] Error stopping subscription '{name}': {e}", exc_info=True)
        logger.info(f"[SHUTDOWN] Stopped {len(subscription_names)} subscription(s)")

    @staticmethod
    def _compute_reconnect_delay(
        connected_duration: float, current_delay: float
    ) -> tuple[float, bool]:
        """Decide the next reconnect backoff and whether to reset the give-up counter.

        Returns ``(next_delay, reset_attempts)``. Pure function of the just-ended
        connection's duration and the current backoff — extracted from the
        reconnect loop so the PERF-H2 invariant is unit-testable:

        * A connection that flaps just past ``_STABLE_CONNECTION_SECONDS`` keeps the
          attempt counter reset (so we don't abandon a backend we *can* reach) but
          still escalates backoff — it can no longer pin the cadence at the floor.
        * Only a genuinely healthy connection (``>= _HEALTHY_CONNECTION_SECONDS``)
          resets backoff to the floor.
        * A connection that never stabilizes escalates backoff *and* lets the
          attempt counter climb toward the give-up ceiling.
        """
        if connected_duration >= _HEALTHY_CONNECTION_SECONDS:
            return _INITIAL_RETRY_DELAY, True
        if connected_duration >= _STABLE_CONNECTION_SECONDS:
            return min(current_delay * 1.5, _MAX_RETRY_DELAY), True
        return min(current_delay * 1.5, _MAX_RETRY_DELAY), False

    async def _subscription_loop(
        self,
        subscription_name: str,
        query: str,
        variables: dict[str, Any] | None,
        *,
        generation: int | None = None,
    ) -> None:
        """Main loop for maintaining a GraphQL subscription with comprehensive logging."""
        if generation is None:
            generation = self.states.setdefault(subscription_name, SubscriptionState()).generation
        retry_delay: float = _INITIAL_RETRY_DELAY

        while True:
            attempt = self.reconnect_attempts.get(subscription_name, 0) + 1
            self.reconnect_attempts[subscription_name] = attempt

            logger.info(
                f"[WEBSOCKET:{subscription_name}] Connection attempt #{attempt} (max: {self.max_reconnect_attempts})"
            )

            if attempt > self.max_reconnect_attempts:
                logger.error(
                    f"[WEBSOCKET:{subscription_name}] Max reconnection attempts ({self.max_reconnect_attempts}) exceeded, stopping"
                )
                self._set_connection_state(subscription_name, "max_retries_exceeded")
                break

            handshake_slot_acquired = False
            try:
                ws_url = build_ws_url()
                logger.debug(f"[WEBSOCKET:{subscription_name}] Connecting to: {ws_url}")
                logger.debug(
                    f"[WEBSOCKET:{subscription_name}] API Key present: {'Yes' if _settings.UNRAID_API_KEY else 'No'}"
                )

                ssl_context = build_ws_ssl_context(ws_url)

                # Connection with timeout
                connect_timeout = _WS_OPEN_TIMEOUT
                logger.debug(
                    f"[WEBSOCKET:{subscription_name}] Connection timeout: {connect_timeout}s"
                )

                await self._connection_semaphore.acquire()
                handshake_slot_acquired = True
                async with websockets.connect(
                    ws_url,
                    subprotocols=[Subprotocol("graphql-transport-ws"), Subprotocol("graphql-ws")],
                    open_timeout=connect_timeout,
                    ping_interval=_WS_PING_INTERVAL,
                    ping_timeout=_WS_PING_TIMEOUT,
                    close_timeout=_WS_CLOSE_TIMEOUT,
                    ssl=ssl_context,
                ) as websocket:
                    selected_proto = websocket.subprotocol or "none"
                    logger.info(
                        f"[WEBSOCKET:{subscription_name}] Connected! Protocol: {selected_proto}"
                    )
                    self._set_connection_state(subscription_name, "connected")

                    # Track connection start time — only reset retry counter
                    # after the connection proves stable (>30s connected)
                    self._connection_start_times[subscription_name] = time.monotonic()

                    # Initialize GraphQL-WS protocol
                    logger.debug(
                        f"[PROTOCOL:{subscription_name}] Initializing GraphQL-WS protocol..."
                    )
                    init_payload = build_connection_init()
                    if "payload" in init_payload:
                        logger.debug(f"[AUTH:{subscription_name}] Adding authentication payload")
                    else:
                        logger.warning(
                            f"[AUTH:{subscription_name}] No API key available for authentication"
                        )

                    logger.debug(f"[PROTOCOL:{subscription_name}] Sending connection_init message")
                    await websocket.send(json.dumps(init_payload))

                    # Wait for connection acknowledgment
                    logger.debug(f"[PROTOCOL:{subscription_name}] Waiting for connection_ack...")
                    init_raw = await asyncio.wait_for(websocket.recv(), timeout=_WS_ACK_TIMEOUT)

                    try:
                        init_data = json.loads(init_raw)
                        logger.debug(
                            f"[PROTOCOL:{subscription_name}] Received init response: {init_data.get('type')}"
                        )
                    except json.JSONDecodeError as e:
                        init_preview = (
                            init_raw[:200]
                            if isinstance(init_raw, str)
                            else init_raw[:200].decode("utf-8", errors="replace")
                        )
                        logger.error(
                            f"[PROTOCOL:{subscription_name}] Failed to decode init response: {init_preview}..."
                        )
                        # Raise rather than continue — continue skips the reconnect
                        # backoff at the bottom of the while loop, causing tight retry
                        # loops on malformed handshake responses (e.g. misconfigured
                        # proxies). The outer except Exception handler catches this,
                        # sets last_error, and the normal sleep/backoff runs.
                        raise RuntimeError(f"Invalid JSON in init handshake response: {e}") from e

                    # Handle connection acknowledgment
                    if init_data.get("type") == "connection_ack":
                        logger.info(
                            f"[PROTOCOL:{subscription_name}] Connection acknowledged successfully"
                        )
                        self._set_connection_state(subscription_name, "authenticated")
                    elif init_data.get("type") == "connection_error":
                        error_payload = init_data.get("payload", {})
                        logger.error(
                            f"[AUTH:{subscription_name}] Authentication failed: {error_payload}"
                        )
                        self._set_connection_state(
                            subscription_name,
                            "auth_failed",
                            f"Authentication error: {error_payload}",
                        )
                        break
                    else:
                        logger.warning(
                            f"[PROTOCOL:{subscription_name}] Unexpected init response: {init_data}"
                        )
                        # Continue anyway - some servers send other messages first

                    # Start the subscription
                    logger.debug(
                        f"[SUBSCRIPTION:{subscription_name}] Starting GraphQL subscription..."
                    )
                    start_type = (
                        "subscribe" if selected_proto == "graphql-transport-ws" else "start"
                    )
                    subscription_message = {
                        "id": subscription_name,
                        "type": start_type,
                        "payload": {"query": query, "variables": variables},
                    }

                    logger.debug(
                        f"[SUBSCRIPTION:{subscription_name}] Subscription message type: {start_type}"
                    )
                    logger.debug(f"[SUBSCRIPTION:{subscription_name}] Query: {query[:100]}...")
                    logger.debug(
                        f"[SUBSCRIPTION:{subscription_name}] Variables: {redact_sensitive(variables)}"
                    )

                    await websocket.send(json.dumps(subscription_message))
                    logger.info(
                        f"[SUBSCRIPTION:{subscription_name}] Subscription started successfully"
                    )
                    self._set_connection_state(subscription_name, "subscribed")
                    self._connection_semaphore.release()
                    handshake_slot_acquired = False

                    # Listen for subscription data. The shared iter_messages()
                    # primitive normalizes the post-handshake stream: ping->pong,
                    # ka/pong keepalives + unmatched frames ignored, and malformed
                    # frames logged-and-skipped (the per-message resilience that was
                    # previously implemented inline here). The manager-specific
                    # behavior — data caching, GraphQL-error dedup, never breaking on
                    # an 'error' event, breaking on 'complete' — stays here.
                    expected_data_type = (
                        "next" if selected_proto == "graphql-transport-ws" else "data"
                    )
                    async for event in iter_messages(
                        websocket,
                        sub_id=subscription_name,
                        expected_data_type=expected_data_type,
                    ):
                        if isinstance(event, DataEvent):
                            payload = event.payload
                            if payload.get("data"):
                                logger.debug(
                                    "[DATA:%s] Received subscription data update",
                                    subscription_name,
                                )
                                await self._store_subscription_data(
                                    subscription_name,
                                    payload["data"],
                                    generation=generation,
                                )
                            elif payload.get("errors"):
                                self._track_graphql_error(subscription_name, payload["errors"])
                            else:
                                logger.warning(
                                    "[DATA:%s] Empty or invalid data payload: %s",
                                    subscription_name,
                                    payload,
                                )
                        elif isinstance(event, ErrorEvent):
                            # Match the historical default of {} for a payload-less
                            # error frame (the legacy loop used data.get("payload", {})).
                            error_payload = event.payload if event.payload is not None else {}
                            logger.error(
                                "[SUBSCRIPTION:%s] Subscription error: %s",
                                subscription_name,
                                error_payload,
                            )
                            self._set_connection_state(
                                subscription_name,
                                "error",
                                f"Subscription error: {error_payload}",
                            )
                        elif isinstance(event, CompleteEvent):
                            logger.info(
                                "[SUBSCRIPTION:%s] Subscription completed by server",
                                subscription_name,
                            )
                            self._set_connection_state(subscription_name, "completed")
                            break

                    if self.connection_states.get(subscription_name) == "completed":
                        break

            except TimeoutError:
                error_msg = "Connection or authentication timeout"
                logger.error(f"[WEBSOCKET:{subscription_name}] {error_msg}")
                self._set_connection_state(subscription_name, "timeout", error_msg)

            except websockets.exceptions.ConnectionClosed as e:
                error_msg = f"WebSocket connection closed: {e}"
                logger.warning(f"[WEBSOCKET:{subscription_name}] {error_msg}")
                self._set_connection_state(subscription_name, "disconnected", error_msg)

            except websockets.exceptions.InvalidURI as e:
                error_msg = f"Invalid WebSocket URI: {e}"
                logger.error(f"[WEBSOCKET:{subscription_name}] {error_msg}")
                self._set_connection_state(subscription_name, "invalid_uri", error_msg)
                break  # Don't retry on invalid URI

            except ValueError as e:
                # Non-retryable configuration error (e.g. UNRAID_API_URL not set)
                error_msg = f"Configuration error: {e}"
                logger.error(f"[WEBSOCKET:{subscription_name}] {error_msg}")
                self._set_connection_state(subscription_name, "error", error_msg)
                break  # Don't retry on configuration errors

            except Exception as e:
                error_msg = f"Unexpected error: {e}"
                logger.error(f"[WEBSOCKET:{subscription_name}] {error_msg}", exc_info=True)
                self._set_connection_state(subscription_name, "error", error_msg)

            finally:
                if handshake_slot_acquired:
                    self._connection_semaphore.release()

            # Decide retry behavior from how long the just-ended connection lasted.
            start_time = self._connection_start_times.pop(subscription_name, None)
            connected_duration = (time.monotonic() - start_time) if start_time is not None else 0.0
            retry_delay, reset_attempts = self._compute_reconnect_delay(
                connected_duration, retry_delay
            )
            if reset_attempts:
                self.reconnect_attempts[subscription_name] = 0
                logger.info(
                    f"[WEBSOCKET:{subscription_name}] Connection lasted {connected_duration:.0f}s "
                    f"(>= {_STABLE_CONNECTION_SECONDS}s) — reset attempt counter"
                )
            else:
                logger.warning(
                    f"[WEBSOCKET:{subscription_name}] Connection lasted {connected_duration:.0f}s "
                    f"(< {_STABLE_CONNECTION_SECONDS}s) — attempt counter climbing toward give-up"
                )

            # Full jitter on the actual sleep decorrelates the ~14 concurrent loops so a
            # shared-backend outage doesn't produce synchronized reconnect bursts (PERF-H2).
            sleep_for = random.uniform(retry_delay * 0.5, retry_delay)  # noqa: S311 — jitter, not crypto
            logger.info(
                f"[WEBSOCKET:{subscription_name}] Reconnecting in {sleep_for:.1f}s "
                f"(backoff {retry_delay:.1f}s)..."
            )
            self._set_connection_state(subscription_name, "reconnecting")
            await asyncio.sleep(sleep_for)

        # The while loop exited (via break or max_retries exceeded).
        # Remove from active_subscriptions so start_subscription() can restart it.
        async with self._task_lock:
            state = self.states.get(subscription_name)
            current_task = asyncio.current_task()
            if (
                state is not None
                and state.generation == generation
                and (state.task is current_task or state.task is None)
            ):
                self.active_subscriptions.pop(subscription_name, None)
                async with self._data_lock:
                    self.resource_data.pop(subscription_name, None)
        logger.info(
            f"[SUBSCRIPTION:{subscription_name}] Subscription loop ended — "
            f"removed from active_subscriptions. Final state: "
            f"{self.connection_states.get(subscription_name, 'unknown')}"
        )

    async def get_resource_data(self, resource_name: str) -> dict[str, Any] | None:
        """Get current resource data with enhanced logging."""
        logger.debug("[RESOURCE:%s] Resource data requested", resource_name)

        async with self._data_lock:
            if resource_name in self.resource_data:
                data = self.resource_data[resource_name]
                age_seconds = (datetime.now(UTC) - data.last_updated).total_seconds()
                logger.debug("[RESOURCE:%s] Data found, age: %.1fs", resource_name, age_seconds)
                return data.data
        logger.debug("[RESOURCE:%s] No data available", resource_name)
        return None

    async def get_resource_snapshot(self, resource_name: str) -> ResourceSnapshot:
        """Return cache data and lifecycle state from one state-aware read.

        Cached payloads are usable only while their owning loop is active and in
        the ``subscribed`` state. Reconnecting, stopped, completed, and terminal
        failures therefore cannot leak a formerly valid payload.
        """
        async with self._task_lock:
            state = self.states.get(resource_name)
            connection_state = state.connection_state if state is not None else ""
            last_error = state.last_error if state is not None else None
            active = state is not None and state.task is not None and not state.task.done()
            async with self._data_lock:
                entry = state.data if state is not None else None

        age_seconds = (
            (datetime.now(UTC) - entry.last_updated).total_seconds() if entry is not None else None
        )
        fresh = bool(
            active
            and connection_state == "subscribed"
            and entry is not None
            and age_seconds is not None
            and age_seconds <= self.runtime_settings.unraid_subscription_cache_max_age_seconds
        )
        return ResourceSnapshot(
            data=entry.data if fresh and entry is not None else None,
            fetched_at=entry.last_updated.isoformat() if fresh and entry is not None else None,
            connection_state=connection_state,
            last_error=last_error,
            active=active,
            fresh=fresh,
            age_seconds=age_seconds,
            stale=entry is not None and not fresh,
        )

    async def get_resource_data_with_timestamp(
        self, resource_name: str
    ) -> tuple[dict[str, Any], str] | None:
        """Get resource data along with its last-updated ISO timestamp.

        Returns (data_dict, iso_timestamp) or None if no data is available.
        """
        async with self._data_lock:
            if resource_name in self.resource_data:
                entry = self.resource_data[resource_name]
                return entry.data, entry.last_updated.isoformat()
        return None

    async def list_active_subscriptions(self) -> list[str]:
        """List all active subscriptions."""
        async with self._task_lock:
            active = list(self.active_subscriptions.keys())
        logger.debug("[SUBSCRIPTION_MANAGER] Active subscriptions: %s", active)
        return active

    async def has_active_subscriptions(self) -> bool:
        """Return whether any lifecycle task is currently registered."""
        async with self._task_lock:
            return bool(self.active_subscriptions)

    def is_auto_start_subscription(self, name: str) -> bool:
        """Return the immutable configured auto-start decision for ``name``."""
        return bool(self.subscription_configs.get(name, {}).get("auto_start", False))

    def get_subscription_query(self, name: str) -> str | None:
        """Return a configured query without exposing the mutable config mapping."""
        config = self.subscription_configs.get(name)
        return str(config["query"]) if config is not None else None

    async def get_error_state(self, name: str) -> tuple[str | None, str]:
        """Return (last_error, connection_state) for a subscription.

        Public accessor so external callers (e.g. resources.py) never touch
        private lock attributes directly.

        Consistency note: _subscription_loop writes connection_states and
        last_error together via _set_connection_state() which contains no
        ``await``, so asyncio cooperative scheduling guarantees the pair is
        consistent. _task_lock here prevents two *readers* from racing each
        other, not writers.
        """
        async with self._task_lock:
            return (
                self.last_error.get(name),
                self.connection_states.get(name, ""),
            )

    async def get_subscription_status(self) -> dict[str, dict[str, Any]]:
        """Get detailed status of all subscriptions for diagnostics.

        Acquires _task_lock and _data_lock separately (sequential, not
        simultaneous) to keep the two lock domains independent — no code path
        holds both at once, so no ABBA cycle can form:

        - This method snapshots task-lifecycle state under _task_lock, releases
          it, then snapshots resource data under _data_lock.
        - _subscription_loop also touches the two locks only in disjoint blocks
          (the resource_data write under _data_lock; the loop-exit task removal
          under _task_lock), never nested.

        Snapshotting under each lock independently (rather than nesting them)
        avoids INTRODUCING an ABBA cycle: there is no inverse-order acquisition
        anywhere for a nested acquire here to deadlock against.
        """
        # Snapshot task-related state under _task_lock
        async with self._task_lock:
            active_snapshot = set(self.active_subscriptions)
            state_snapshot = dict(self.connection_states)
            reconnect_snapshot = dict(self.reconnect_attempts)
            error_snapshot = dict(self.last_error)

        # Snapshot resource data under _data_lock (acquired separately)
        async with self._data_lock:
            resource_snapshot = dict(self.resource_data)

        status: dict[str, dict[str, Any]] = {}
        for sub_name, config in self.subscription_configs.items():
            sub_status: dict[str, Any] = {
                "config": {
                    "resource": config["resource"],
                    "description": config["description"],
                    "auto_start": config.get("auto_start", False),
                },
                "runtime": {
                    "active": sub_name in active_snapshot,
                    "connection_state": state_snapshot.get(sub_name, "not_started"),
                    "reconnect_attempts": reconnect_snapshot.get(sub_name, 0),
                    "last_error": error_snapshot.get(sub_name),
                },
            }

            # Add data info if available
            if sub_name in resource_snapshot:
                data_info = resource_snapshot[sub_name]
                age_seconds = (datetime.now(UTC) - data_info.last_updated).total_seconds()
                sub_status["data"] = {
                    "available": True,
                    "last_updated": data_info.last_updated.isoformat(),
                    "age_seconds": age_seconds,
                }
            else:
                sub_status["data"] = {"available": False}

            status[sub_name] = sub_status

        logger.debug(f"[SUBSCRIPTION_MANAGER] Generated status for {len(status)} subscriptions")
        return status

    async def get_summary(self) -> dict[str, Any]:
        """Return aggregate subscription counts/states for diagnostics.

        Public accessor so external callers (e.g. diagnostics.py) never reach
        into the manager's internal ``states``/field-views directly — the same
        encapsulation rule the locked accessors above enforce.

        Acquires ``_task_lock`` and ``_data_lock`` *separately* (sequential, not
        simultaneous), mirroring :meth:`get_subscription_status`'s ABBA-avoidance
        ordering — never holding both at once.

        Returns a dict with:

        * ``total_configured`` — number of configured subscriptions.
        * ``auto_start_count`` — configs marked ``auto_start``.
        * ``active_count`` — subscriptions with a live task.
        * ``with_data`` — subscriptions that have cached resource data.
        * ``connection_states`` — ``{name: connection_state}`` snapshot.
        * ``auto_start_enabled`` / ``max_reconnect_attempts`` — config values.
        """
        # subscription_configs is set once in __init__ and never mutated, so it
        # needs no lock. total/auto-start counts derive from it.
        total_configured = len(self.subscription_configs)
        auto_start_count = sum(
            1 for config in self.subscription_configs.values() if config.get("auto_start")
        )

        # Task-lifecycle fields (active task, connection_state) under _task_lock.
        async with self._task_lock:
            active_count = len(self.active_subscriptions)
            connection_states = dict(self.connection_states)

        # Cached resource data under _data_lock (acquired separately).
        async with self._data_lock:
            with_data = len(self.resource_data)

        return {
            "total_configured": total_configured,
            "auto_start_count": auto_start_count,
            "active_count": active_count,
            "with_data": with_data,
            "connection_states": connection_states,
            "auto_start_enabled": self.auto_start_enabled,
            "max_reconnect_attempts": self.max_reconnect_attempts,
        }


# Global subscription manager instance
subscription_manager = SubscriptionManager()
