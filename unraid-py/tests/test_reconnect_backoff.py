"""Unit tests for the reconnect-backoff decision (PERF-H2).

Pins the invariant that a backend flapping just past the stable threshold can
neither pin the reconnect cadence at the floor nor dodge the give-up ceiling.
The logic was extracted from the 268-line `_subscription_loop` into the pure
`_compute_reconnect_delay` helper precisely so it could be tested here.
"""

import pytest

from unraid_mcp.subscriptions.manager import (
    _HEALTHY_CONNECTION_SECONDS,
    _INITIAL_RETRY_DELAY,
    _MAX_RETRY_DELAY,
    _STABLE_CONNECTION_SECONDS,
    SubscriptionManager,
)


_compute = SubscriptionManager._compute_reconnect_delay


class TestComputeReconnectDelay:
    def test_healthy_connection_resets_backoff_and_attempts(self) -> None:
        delay, reset = _compute(_HEALTHY_CONNECTION_SECONDS + 1, 80.0)
        assert delay == _INITIAL_RETRY_DELAY
        assert reset is True

    def test_briefly_stable_escalates_backoff_but_resets_attempts(self) -> None:
        # A 31s flap must NOT pin backoff at the floor — it escalates — but keeps
        # the attempt counter reset so we don't abandon a reachable backend.
        delay, reset = _compute(_STABLE_CONNECTION_SECONDS + 1, 10.0)
        assert delay == pytest.approx(15.0)  # 10 * 1.5
        assert reset is True

    def test_briefly_stable_does_not_reset_to_floor(self) -> None:
        # The PERF-H2 bug: a 31s connection used to reset backoff to 5 every time,
        # pinning the reconnect cadence and dodging the give-up ceiling.
        delay, _ = _compute(_STABLE_CONNECTION_SECONDS + 1, _INITIAL_RETRY_DELAY)
        assert delay > _INITIAL_RETRY_DELAY

    def test_never_stable_escalates_and_climbs_toward_giveup(self) -> None:
        delay, reset = _compute(2.0, 20.0)
        assert delay == pytest.approx(30.0)  # 20 * 1.5
        assert reset is False  # attempt counter is NOT reset -> climbs to give-up

    def test_no_connection_established_escalates(self) -> None:
        delay, reset = _compute(0.0, _INITIAL_RETRY_DELAY)
        assert delay == pytest.approx(7.5)
        assert reset is False

    def test_backoff_capped(self) -> None:
        delay, _ = _compute(0.0, _MAX_RETRY_DELAY)
        assert delay == _MAX_RETRY_DELAY

    def test_repeated_flap_backoff_grows_monotonically(self) -> None:
        # A backend that flaps at ~31s repeatedly: backoff must keep growing even
        # though the attempt counter is reset each cycle.
        delay = _INITIAL_RETRY_DELAY
        delays = []
        for _ in range(6):
            delay, reset = _compute(_STABLE_CONNECTION_SECONDS + 1, delay)
            assert reset is True
            delays.append(delay)
        assert delays == sorted(delays)
        assert delays[-1] > delays[0]
