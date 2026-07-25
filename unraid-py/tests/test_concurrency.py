"""Concurrency tests for the autostart double-checked lock and the rate limiter.

Two independent concurrency-safety properties are covered:

1. ``ensure_subscriptions_started`` uses double-checked locking so the
   underlying ``autostart_subscriptions`` fan-out runs at most once even when
   many coroutines race into it concurrently.
2. ``_RateLimiter`` (token bucket) must never over-issue under contention:
   the bucket may go to zero but never negative, and acquiring more tokens
   than the bucket capacity must take at least the refill-bounded time.
"""

import asyncio
import contextlib
import time
from typing import Any
from unittest.mock import AsyncMock, patch

from unraid_mcp.core.client import _RateLimiter
from unraid_mcp.subscriptions import resources as res
from unraid_mcp.subscriptions.manager import SubscriptionManager


# ---------------------------------------------------------------------------
# Autostart double-checked lock
# ---------------------------------------------------------------------------


class TestAutostartDoubleCheckedLock:
    """ensure_subscriptions_started must fan out exactly once under a stampede."""

    async def test_autostart_runs_once_under_concurrency(self) -> None:
        original_flag = res._subscriptions_started
        try:
            with patch.object(
                res, "autostart_subscriptions", new_callable=AsyncMock
            ) as mock_autostart:
                # Reset the latch so the slow-path actually runs.
                res._subscriptions_started = False

                await asyncio.gather(*[res.ensure_subscriptions_started() for _ in range(20)])

                # Despite 20 racing callers, the fan-out fired exactly once.
                mock_autostart.assert_awaited_once()
                # And the flag is latched so future callers fast-path out.
                assert res._subscriptions_started is True
        finally:
            res._subscriptions_started = original_flag

    async def test_fast_path_skips_autostart_when_already_started(self) -> None:
        """When the flag is already latched, no autostart is attempted at all."""
        original_flag = res._subscriptions_started
        try:
            with patch.object(
                res, "autostart_subscriptions", new_callable=AsyncMock
            ) as mock_autostart:
                res._subscriptions_started = True

                await asyncio.gather(*[res.ensure_subscriptions_started() for _ in range(10)])

                mock_autostart.assert_not_awaited()
        finally:
            res._subscriptions_started = original_flag


# ---------------------------------------------------------------------------
# SubscriptionManager._data_lock (resource_data read-vs-write) under contention
# ---------------------------------------------------------------------------


class TestResourceDataLockUnderContention:
    """_data_lock must serialize resource_data writes against reads so a reader
    never observes a torn/half-written payload.

    Each writer stores a payload whose fields satisfy an internal invariant
    (``doubled == n * 2`` and ``marker == f"v{n}"``). A reader that ever sees a
    dict violating that invariant would prove a partial write escaped the lock.
    """

    @staticmethod
    def _is_consistent(payload: dict[str, Any]) -> bool:
        n = payload["n"]
        return payload["doubled"] == n * 2 and payload["marker"] == f"v{n}"

    async def test_no_torn_value_escapes_get_resource_data(self) -> None:
        manager = SubscriptionManager()
        name = "metrics"  # single name -> maximal contention on one slot
        n_writers = 60
        n_readers = 60
        reads_per_reader = 40

        observed: list[dict[str, Any] | None] = []

        async def _writer(n: int) -> None:
            # Yield first so writers actually interleave with readers under gather.
            await asyncio.sleep(0)
            await manager._store_subscription_data(
                name, {"n": n, "doubled": n * 2, "marker": f"v{n}"}
            )

        async def _reader() -> None:
            for _ in range(reads_per_reader):
                value = await manager.get_resource_data(name)
                observed.append(value)
                await asyncio.sleep(0)

        writers = [_writer(i) for i in range(n_writers)]
        readers = [_reader() for _ in range(n_readers)]

        # No exception and no deadlock: a bounded timeout guards against a hang.
        await asyncio.wait_for(asyncio.gather(*writers, *readers), timeout=5.0)

        # Every read is either None (pre-first-write) or a *complete, consistent*
        # prior value — never a half-applied dict.
        seen_value = False
        for value in observed:
            if value is None:
                continue
            seen_value = True
            assert set(value) == {"n", "doubled", "marker"}, value
            assert self._is_consistent(value), value

        # Sanity: readers actually observed written data at least once (the test
        # would be vacuous if every read returned None).
        assert seen_value

        # Final stored value must be one of the writers' complete payloads.
        final = await manager.get_resource_data(name)
        assert final is not None
        assert self._is_consistent(final)

    async def test_timestamp_accessor_also_returns_whole_values(self) -> None:
        """get_resource_data_with_timestamp shares _data_lock — same guarantee."""
        manager = SubscriptionManager()
        name = "cpu"

        async def _writer(n: int) -> None:
            await asyncio.sleep(0)
            await manager._store_subscription_data(
                name, {"n": n, "doubled": n * 2, "marker": f"v{n}"}
            )

        results: list[tuple[dict[str, Any], str] | None] = []

        async def _reader() -> None:
            for _ in range(30):
                results.append(await manager.get_resource_data_with_timestamp(name))
                await asyncio.sleep(0)

        await asyncio.wait_for(
            asyncio.gather(*[_writer(i) for i in range(40)], *[_reader() for _ in range(40)]),
            timeout=5.0,
        )

        for result in results:
            if result is None:
                continue
            data, ts = result
            assert self._is_consistent(data), data
            assert isinstance(ts, str) and ts  # complete ISO timestamp


# ---------------------------------------------------------------------------
# Rate limiter under contention
# ---------------------------------------------------------------------------


class TestRateLimiterUnderContention:
    """The token bucket must never over-issue tokens under concurrent acquire()."""

    async def test_bucket_never_goes_negative(self) -> None:
        """Gathering more acquires than capacity must keep tokens >= 0 throughout."""
        # Small, fast bucket: 5 tokens, fast refill so the test stays quick.
        limiter = _RateLimiter(max_tokens=5, refill_rate=50.0)

        observed_min = float("inf")
        original_refill = limiter._refill

        def _spy_refill() -> None:
            nonlocal observed_min
            original_refill()
            observed_min = min(observed_min, limiter.tokens)

        with patch.object(limiter, "_refill", side_effect=_spy_refill):
            # 25 acquires against a 5-token bucket forces heavy contention.
            await asyncio.gather(*[limiter.acquire() for _ in range(25)])

        # The bucket may hit zero but must never be over-issued (negative).
        assert limiter.tokens >= 0.0
        assert observed_min >= 0.0

    async def test_never_over_issues_within_a_frozen_window(self) -> None:
        """Under heavy contention with refill frozen, the limiter must issue at
        most ``max_tokens`` acquires and tokens must never go negative AFTER a
        decrement.

        Unlike ``test_bucket_never_goes_negative`` (which samples ``tokens``
        *before* the ``tokens -= 1`` decrement and so asserts a near-tautology),
        this gathers far more concurrent ``acquire()`` calls than capacity and
        observes the post-decrement token count to prove no extra token is ever
        physically issued within the window.
        """
        max_tokens = 5
        limiter = _RateLimiter(max_tokens=max_tokens, refill_rate=1.0)

        completed = 0
        post_decrement_min = float("inf")
        observed_negative = False
        original_acquire = limiter.acquire

        async def _instrumented_acquire() -> None:
            nonlocal completed, post_decrement_min, observed_negative
            await original_acquire()
            # We are here only because a token was actually decremented.
            completed += 1
            post_decrement_min = min(post_decrement_min, limiter.tokens)
            if limiter.tokens < 0.0:
                observed_negative = True

        # Freeze time so no refill happens: only the initial ``max_tokens`` may
        # be issued; every further acquire must block on the (never-advancing)
        # refill.
        frozen = time.monotonic()
        n_callers = max_tokens * 6  # heavy over-subscription
        with (
            patch("unraid_mcp.core.client.time.monotonic", return_value=frozen),
            patch.object(limiter, "acquire", side_effect=_instrumented_acquire),
        ):
            tasks = [asyncio.ensure_future(limiter.acquire()) for _ in range(n_callers)]
            # Let every task run up to either completion or its refill-wait.
            await asyncio.sleep(0)
            await asyncio.sleep(0)

            # Exactly the bucket capacity may have been issued — never more.
            assert completed == max_tokens
            assert not observed_negative
            assert post_decrement_min >= 0.0
            # The bucket is drained but non-negative.
            assert 0.0 <= limiter.tokens < 1.0

            # The remaining callers are still blocked on refill (no over-issue).
            done = [t for t in tasks if t.done()]
            assert len(done) == max_tokens

            for t in tasks:
                t.cancel()
            for t in tasks:
                with contextlib.suppress(asyncio.CancelledError):
                    await t

    async def test_does_not_over_issue_within_initial_capacity(self) -> None:
        """With refill effectively frozen, only `max_tokens` acquires complete."""
        max_tokens = 4
        limiter = _RateLimiter(max_tokens=max_tokens, refill_rate=1.0)

        # Freeze time so no tokens refill during the window: every acquire beyond
        # the initial capacity would have to wait on refill (which never advances).
        frozen = time.monotonic()
        with patch("unraid_mcp.core.client.time.monotonic", return_value=frozen):
            # Exactly max_tokens acquires should complete instantly without waiting.
            await asyncio.wait_for(
                asyncio.gather(*[limiter.acquire() for _ in range(max_tokens)]),
                timeout=2.0,
            )
            # The bucket is now drained — never negative.
            assert limiter.tokens >= 0.0
            assert limiter.tokens < 1.0

            # One more acquire must block (no refill while time is frozen).
            with_extra = asyncio.ensure_future(limiter.acquire())
            await asyncio.sleep(0)  # let it run up to the wait
            assert not with_extra.done()
            with_extra.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await with_extra

    async def test_refill_bounded_total_time(self) -> None:
        """Acquiring beyond capacity must take at least the refill-bounded time."""
        # 2 tokens, slow-ish refill. Acquiring 4 needs 2 refilled tokens, each
        # taking 1/refill_rate seconds -> a measurable, deterministic lower bound.
        refill_rate = 20.0  # tokens/sec -> 0.05s per refilled token
        limiter = _RateLimiter(max_tokens=2, refill_rate=refill_rate)

        start = time.monotonic()
        await asyncio.gather(*[limiter.acquire() for _ in range(4)])
        elapsed = time.monotonic() - start

        # 2 tokens are immediate; the other 2 must wait on refill. Lower bound is
        # ~2 / refill_rate = 0.1s. Use a conservative fraction to avoid flake.
        min_expected = (2 / refill_rate) * 0.8
        assert elapsed >= min_expected
        assert limiter.tokens >= 0.0
