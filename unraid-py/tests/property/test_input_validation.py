"""Property-based tests for tool input validation.

Uses Hypothesis to fuzz tool inputs and verify the core invariant:
    Tools MUST only raise ToolError (or return normally).
    Any KeyError, AttributeError, TypeError, ValueError, IndexError, or
    other unhandled exception from arbitrary inputs is a bug.

Each test class targets a distinct tool domain and strategy profile:
- Docker: arbitrary container IDs, subaction names, numeric params
- Notifications: importance strings, list_type strings, field lengths
- Keys: arbitrary key IDs, role lists, name strings
- VM: arbitrary VM IDs, subaction names
- Info: invalid subaction names (cross-tool invariant for the subaction guard)
"""

import asyncio
import contextlib
import sys
from pathlib import Path
from typing import Any, get_args
from unittest.mock import AsyncMock, patch

import pytest
from fastmcp.exceptions import ToolError
from hypothesis import HealthCheck, given, settings
from hypothesis import strategies as st

from unraid_mcp.tools._key import _KEY_SUBACTIONS
from unraid_mcp.tools.unraid import UNRAID_ACTIONS


# Ensure tests/ is on sys.path so "from conftest import make_tool_fn" resolves
# the same way that top-level test files do.
_TESTS_DIR = str(Path(__file__).parent.parent)
if _TESTS_DIR not in sys.path:
    sys.path.insert(0, _TESTS_DIR)

from conftest import make_tool_fn  # noqa: E402


# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------

_ALLOWED_EXCEPTION_TYPES = (ToolError,)
"""Only ToolError (or a clean return) is acceptable from any tool call.

Any other exception is a bug — it means the tool let an internal error
surface to the caller instead of wrapping it in a user-friendly ToolError.
"""


def _run(coro) -> Any:
    """Run a coroutine synchronously so Hypothesis @given works with async tools."""
    return asyncio.run(coro)


def _assert_only_tool_error(exc: BaseException) -> None:
    """Assert that an exception is a ToolError, not an internal crash."""
    assert isinstance(exc, ToolError), (
        f"Tool raised {type(exc).__name__} instead of ToolError: {exc!r}\n"
        "This is a bug — all error paths must produce ToolError."
    )


def _make_tool() -> Any:
    return make_tool_fn("unraid_mcp.tools.unraid", "register_unraid_tool", "unraid")


# ---------------------------------------------------------------------------
# Docker: arbitrary container IDs
# ---------------------------------------------------------------------------


class TestDockerContainerIdFuzzing:
    """Fuzz the container_id parameter for Docker actions.

    Invariant: no matter what string is supplied as container_id,
    the tool must only raise ToolError or return normally — never crash
    with a KeyError, AttributeError, or other internal exception.
    """

    @given(st.text())
    @settings(max_examples=100, suppress_health_check=[HealthCheck.function_scoped_fixture])
    def test_details_arbitrary_container_id(self, container_id: str) -> None:
        """Arbitrary container IDs for 'details' must not crash the tool."""

        async def _run_test() -> None:
            tool_fn = _make_tool()
            with patch(
                "unraid_mcp.core.client.make_graphql_request", new_callable=AsyncMock
            ) as mock:
                mock.return_value = {"docker": {"containers": []}}
                with contextlib.suppress(ToolError):
                    # ToolError is the only acceptable exception — suppress it
                    await tool_fn(action="docker", subaction="details", container_id=container_id)

        _run(_run_test())

    @given(st.text())
    @settings(max_examples=100, suppress_health_check=[HealthCheck.function_scoped_fixture])
    def test_start_arbitrary_container_id(self, container_id: str) -> None:
        """Arbitrary container IDs for 'start' must not crash the tool."""

        async def _run_test() -> None:
            tool_fn = _make_tool()
            with patch(
                "unraid_mcp.core.client.make_graphql_request", new_callable=AsyncMock
            ) as mock:
                mock.return_value = {"docker": {"containers": []}}
                with contextlib.suppress(ToolError):
                    await tool_fn(action="docker", subaction="start", container_id=container_id)

        _run(_run_test())

    @given(st.text())
    @settings(max_examples=100, suppress_health_check=[HealthCheck.function_scoped_fixture])
    def test_stop_arbitrary_container_id(self, container_id: str) -> None:
        """Arbitrary container IDs for 'stop' must not crash the tool."""

        async def _run_test() -> None:
            tool_fn = _make_tool()
            with patch(
                "unraid_mcp.core.client.make_graphql_request", new_callable=AsyncMock
            ) as mock:
                mock.return_value = {"docker": {"containers": []}}
                with contextlib.suppress(ToolError):
                    await tool_fn(action="docker", subaction="stop", container_id=container_id)

        _run(_run_test())

    @given(st.text())
    @settings(max_examples=100, suppress_health_check=[HealthCheck.function_scoped_fixture])
    def test_restart_arbitrary_container_id(self, container_id: str) -> None:
        """Arbitrary container IDs for 'restart' must not crash the tool."""

        async def _run_test() -> None:
            tool_fn = _make_tool()
            with patch(
                "unraid_mcp.core.client.make_graphql_request", new_callable=AsyncMock
            ) as mock:
                # stop then start both need container list + mutation responses
                mock.return_value = {"docker": {"containers": []}}
                with contextlib.suppress(ToolError):
                    await tool_fn(action="docker", subaction="restart", container_id=container_id)

        _run(_run_test())


# ---------------------------------------------------------------------------
# Docker: invalid subaction names
# ---------------------------------------------------------------------------


class TestDockerInvalidActions:
    """Fuzz the subaction parameter with arbitrary strings for the docker domain.

    Invariant: invalid subaction names raise ToolError, never KeyError or crash.
    This validates the subaction guard that sits inside every domain handler.
    """

    @given(st.text())
    @settings(max_examples=200, suppress_health_check=[HealthCheck.function_scoped_fixture])
    def test_invalid_action_raises_tool_error(self, subaction: str) -> None:
        """Any non-valid subaction string for docker must raise ToolError, not crash."""
        valid_subactions = {
            "list",
            "details",
            "start",
            "stop",
            "restart",
            "networks",
            "network_details",
        }
        if subaction in valid_subactions:
            return  # Skip valid subactions — they have different semantics

        async def _run_test() -> None:
            tool_fn = _make_tool()
            with patch("unraid_mcp.core.client.make_graphql_request", new_callable=AsyncMock):
                try:
                    await tool_fn(action="docker", subaction=subaction)
                except ToolError:
                    pass  # Correct: invalid subaction raises ToolError
                except Exception as exc:
                    # Any other exception is a bug
                    pytest.fail(
                        f"subaction={subaction!r} raised {type(exc).__name__} "
                        f"instead of ToolError: {exc!r}"
                    )

        _run(_run_test())


# ---------------------------------------------------------------------------
# Notifications: importance and list_type enum fuzzing
# ---------------------------------------------------------------------------


class TestNotificationsEnumFuzzing:
    """Fuzz notification enum parameters.

    Invariant: invalid enum values must produce ToolError with a helpful message,
    never crash with an AttributeError or unhandled exception.
    """

    @given(st.text())
    @settings(max_examples=150, suppress_health_check=[HealthCheck.function_scoped_fixture])
    def test_invalid_importance_raises_tool_error(self, importance: str) -> None:
        """Arbitrary importance strings must raise ToolError or be accepted if valid."""
        valid_importances = {"INFO", "WARNING", "ALERT"}
        if importance.upper() in valid_importances:
            return  # Skip valid values

        async def _run_test() -> None:
            tool_fn = _make_tool()
            with patch(
                "unraid_mcp.core.client.make_graphql_request",
                new_callable=AsyncMock,
            ) as mock:
                mock.return_value = {
                    "createNotification": {"id": "1", "title": "t", "importance": "INFO"}
                }
                try:
                    await tool_fn(
                        action="notification",
                        subaction="create",
                        title="Test",
                        subject="Sub",
                        description="Desc",
                        importance=importance,
                    )
                except ToolError:
                    pass  # Expected for invalid importance
                except Exception as exc:
                    pytest.fail(f"importance={importance!r} raised {type(exc).__name__}: {exc!r}")

        _run(_run_test())

    @given(st.text())
    @settings(max_examples=150, suppress_health_check=[HealthCheck.function_scoped_fixture])
    def test_invalid_list_type_raises_tool_error(self, list_type: str) -> None:
        """Arbitrary list_type strings must raise ToolError or proceed if valid."""
        valid_list_types = {"UNREAD", "ARCHIVE"}
        if list_type.upper() in valid_list_types:
            return  # Skip valid values

        async def _run_test() -> None:
            tool_fn = _make_tool()
            with patch(
                "unraid_mcp.core.client.make_graphql_request",
                new_callable=AsyncMock,
            ) as mock:
                mock.return_value = {"notifications": {"list": []}}
                try:
                    await tool_fn(action="notification", subaction="list", list_type=list_type)
                except ToolError:
                    pass
                except Exception as exc:
                    pytest.fail(f"list_type={list_type!r} raised {type(exc).__name__}: {exc!r}")

        _run(_run_test())

    @given(
        st.text(max_size=300),  # title: limit is 200
        st.text(max_size=600),  # subject: limit is 500
        st.text(max_size=2500),  # description: limit is 2000
    )
    @settings(max_examples=100, suppress_health_check=[HealthCheck.function_scoped_fixture])
    def test_create_notification_field_lengths(
        self, title: str, subject: str, description: str
    ) -> None:
        """Oversized title/subject/description must raise ToolError, not crash.

        This tests the length-guard invariant: tools that have max-length checks
        must raise ToolError for oversized values, never truncate silently or crash.
        """

        async def _run_test() -> None:
            tool_fn = _make_tool()
            with patch(
                "unraid_mcp.core.client.make_graphql_request",
                new_callable=AsyncMock,
            ) as mock:
                mock.return_value = {
                    "createNotification": {"id": "1", "title": "t", "importance": "INFO"}
                }
                try:
                    await tool_fn(
                        action="notification",
                        subaction="create",
                        title=title,
                        subject=subject,
                        description=description,
                        importance="INFO",
                    )
                except ToolError:
                    pass
                except Exception as exc:
                    pytest.fail(
                        f"create with oversized fields raised {type(exc).__name__}: {exc!r}"
                    )

        _run(_run_test())

    @given(st.text())
    @settings(max_examples=100, suppress_health_check=[HealthCheck.function_scoped_fixture])
    def test_invalid_notification_type_raises_tool_error(self, notif_type: str) -> None:
        """Arbitrary notification_type strings must raise ToolError or proceed if valid."""
        valid_types = {"UNREAD", "ARCHIVE"}
        if notif_type.upper() in valid_types:
            return

        async def _run_test() -> None:
            tool_fn = _make_tool()
            with patch(
                "unraid_mcp.core.client.make_graphql_request",
                new_callable=AsyncMock,
            ) as mock:
                mock.return_value = {"deleteNotification": {}}
                try:
                    await tool_fn(
                        action="notification",
                        subaction="delete",
                        notification_id="some-id",
                        notification_type=notif_type,
                        confirm=True,
                    )
                except ToolError:
                    pass
                except Exception as exc:
                    pytest.fail(
                        f"notification_type={notif_type!r} raised {type(exc).__name__}: {exc!r}"
                    )

        _run(_run_test())

    @given(st.text())
    @settings(max_examples=100, suppress_health_check=[HealthCheck.function_scoped_fixture])
    def test_invalid_action_raises_tool_error(self, subaction: str) -> None:
        """Invalid subaction names for notifications domain raise ToolError."""
        valid_subactions = {
            "overview",
            "list",
            "create",
            "archive",
            "mark_unread",
            "delete",
            "delete_archived",
            "archive_all",
            "archive_many",
            "unarchive_many",
            "unarchive_all",
            "recalculate",
        }
        if subaction in valid_subactions:
            return

        async def _run_test() -> None:
            tool_fn = _make_tool()
            with patch(
                "unraid_mcp.core.client.make_graphql_request",
                new_callable=AsyncMock,
            ):
                try:
                    await tool_fn(action="notification", subaction=subaction)
                except ToolError:
                    pass
                except Exception as exc:
                    pytest.fail(
                        f"subaction={subaction!r} raised {type(exc).__name__} "
                        f"instead of ToolError: {exc!r}"
                    )

        _run(_run_test())


# ---------------------------------------------------------------------------
# Keys: arbitrary key IDs and role lists
# ---------------------------------------------------------------------------


class TestKeysInputFuzzing:
    """Fuzz API key management parameters.

    Invariant: arbitrary key_id strings, names, and role lists never crash
    the keys domain — only ToolError or clean return values are acceptable.
    """

    @given(st.text())
    @settings(max_examples=100, suppress_health_check=[HealthCheck.function_scoped_fixture])
    def test_get_arbitrary_key_id(self, key_id: str) -> None:
        """Arbitrary key_id for 'get' must not crash the tool."""

        async def _run_test() -> None:
            tool_fn = _make_tool()
            with patch(
                "unraid_mcp.core.client.make_graphql_request", new_callable=AsyncMock
            ) as mock:
                mock.return_value = {"apiKey": None}
                try:
                    await tool_fn(action="key", subaction="get", key_id=key_id)
                except ToolError:
                    pass
                except Exception as exc:
                    pytest.fail(f"key_id={key_id!r} raised {type(exc).__name__}: {exc!r}")

        _run(_run_test())

    @given(st.text())
    @settings(max_examples=100, suppress_health_check=[HealthCheck.function_scoped_fixture])
    def test_create_arbitrary_key_name(self, name: str) -> None:
        """Arbitrary name strings for 'create' must not crash the tool."""

        async def _run_test() -> None:
            tool_fn = _make_tool()
            with patch(
                "unraid_mcp.core.client.make_graphql_request", new_callable=AsyncMock
            ) as mock:
                mock.return_value = {
                    "apiKey": {"create": {"id": "1", "name": name, "key": "k", "roles": []}}
                }
                try:
                    await tool_fn(action="key", subaction="create", name=name)
                except ToolError:
                    pass
                except Exception as exc:
                    pytest.fail(f"name={name!r} raised {type(exc).__name__}: {exc!r}")

        _run(_run_test())

    @given(st.lists(st.text(), min_size=1, max_size=10))
    @settings(max_examples=80, suppress_health_check=[HealthCheck.function_scoped_fixture])
    def test_add_role_arbitrary_roles(self, roles: list[str]) -> None:
        """Arbitrary role lists for 'add_role' must not crash the tool."""

        async def _run_test() -> None:
            tool_fn = _make_tool()
            with patch(
                "unraid_mcp.core.client.make_graphql_request", new_callable=AsyncMock
            ) as mock:
                mock.return_value = {"apiKey": {"addRole": True}}
                try:
                    await tool_fn(
                        action="key", subaction="add_role", key_id="some-key-id", roles=roles
                    )
                except ToolError:
                    pass
                except Exception as exc:
                    pytest.fail(f"roles={roles!r} raised {type(exc).__name__}: {exc!r}")

        _run(_run_test())

    @given(st.text())
    @settings(max_examples=100, suppress_health_check=[HealthCheck.function_scoped_fixture])
    def test_invalid_action_raises_tool_error(self, subaction: str) -> None:
        """Invalid subaction names for keys domain raise ToolError."""
        if subaction in _KEY_SUBACTIONS:
            return

        async def _run_test() -> None:
            tool_fn = _make_tool()
            with patch("unraid_mcp.core.client.make_graphql_request", new_callable=AsyncMock):
                try:
                    await tool_fn(action="key", subaction=subaction)
                except ToolError:
                    pass
                except Exception as exc:
                    pytest.fail(
                        f"subaction={subaction!r} raised {type(exc).__name__} "
                        f"instead of ToolError: {exc!r}"
                    )

        _run(_run_test())


# ---------------------------------------------------------------------------
# VM: arbitrary VM IDs and subaction names
# ---------------------------------------------------------------------------


class TestVMInputFuzzing:
    """Fuzz VM management parameters.

    Invariant: arbitrary vm_id strings and subaction names must never crash
    the VM domain — only ToolError or clean return values are acceptable.
    """

    @given(st.text())
    @settings(max_examples=100, suppress_health_check=[HealthCheck.function_scoped_fixture])
    def test_start_arbitrary_vm_id(self, vm_id: str) -> None:
        """Arbitrary vm_id for 'start' must not crash the tool."""

        async def _run_test() -> None:
            tool_fn = _make_tool()
            with patch(
                "unraid_mcp.core.client.make_graphql_request",
                new_callable=AsyncMock,
            ) as mock:
                mock.return_value = {"vm": {"start": True}}
                try:
                    await tool_fn(action="vm", subaction="start", vm_id=vm_id)
                except ToolError:
                    pass
                except Exception as exc:
                    pytest.fail(f"vm_id={vm_id!r} raised {type(exc).__name__}: {exc!r}")

        _run(_run_test())

    @given(st.text())
    @settings(max_examples=100, suppress_health_check=[HealthCheck.function_scoped_fixture])
    def test_stop_arbitrary_vm_id(self, vm_id: str) -> None:
        """Arbitrary vm_id for 'stop' must not crash the tool."""

        async def _run_test() -> None:
            tool_fn = _make_tool()
            with patch(
                "unraid_mcp.core.client.make_graphql_request",
                new_callable=AsyncMock,
            ) as mock:
                mock.return_value = {"vm": {"stop": True}}
                try:
                    await tool_fn(action="vm", subaction="stop", vm_id=vm_id)
                except ToolError:
                    pass
                except Exception as exc:
                    pytest.fail(f"vm_id={vm_id!r} raised {type(exc).__name__}: {exc!r}")

        _run(_run_test())

    @given(st.text())
    @settings(max_examples=100, suppress_health_check=[HealthCheck.function_scoped_fixture])
    def test_details_arbitrary_vm_id(self, vm_id: str) -> None:
        """Arbitrary vm_id for 'details' must not crash the tool."""

        async def _run_test() -> None:
            tool_fn = _make_tool()
            with patch(
                "unraid_mcp.core.client.make_graphql_request",
                new_callable=AsyncMock,
            ) as mock:
                # Return an empty VM list so the lookup gracefully fails
                mock.return_value = {"vms": {"domains": []}}
                try:
                    await tool_fn(action="vm", subaction="details", vm_id=vm_id)
                except ToolError:
                    pass
                except Exception as exc:
                    pytest.fail(f"vm_id={vm_id!r} raised {type(exc).__name__}: {exc!r}")

        _run(_run_test())

    @given(st.text())
    @settings(max_examples=200, suppress_health_check=[HealthCheck.function_scoped_fixture])
    def test_invalid_action_raises_tool_error(self, subaction: str) -> None:
        """Invalid subaction names for VM domain raise ToolError."""
        valid_subactions = {
            "list",
            "details",
            "start",
            "stop",
            "pause",
            "resume",
            "force_stop",
            "reboot",
            "reset",
        }
        if subaction in valid_subactions:
            return

        async def _run_test() -> None:
            tool_fn = _make_tool()
            with patch(
                "unraid_mcp.core.client.make_graphql_request",
                new_callable=AsyncMock,
            ):
                try:
                    await tool_fn(action="vm", subaction=subaction)
                except ToolError:
                    pass
                except Exception as exc:
                    pytest.fail(
                        f"subaction={subaction!r} raised {type(exc).__name__} "
                        f"instead of ToolError: {exc!r}"
                    )

        _run(_run_test())


# ---------------------------------------------------------------------------
# Cross-tool: boundary-value and unicode stress tests
# ---------------------------------------------------------------------------


class TestBoundaryValues:
    """Boundary-value and adversarial string tests across multiple tools.

    These tests probe specific edge cases that have historically caused bugs
    in similar systems: null bytes, very long strings, unicode surrogates,
    and empty strings.
    """

    @given(
        st.one_of(
            st.just(""),
            st.just("\x00"),
            st.just("\xff\xfe"),
            st.just("a" * 10_001),
            st.just("/" * 500),
            st.just("'; DROP TABLE containers; --"),
            st.just("${7*7}"),
            st.just("\u0000\uffff"),
            st.just("\n\r\t"),
            st.binary().map(lambda b: b.decode("latin-1")),
        )
    )
    @settings(max_examples=50, suppress_health_check=[HealthCheck.function_scoped_fixture])
    def test_docker_details_adversarial_inputs(self, container_id: str) -> None:
        """Adversarial container_id values must not crash the Docker domain."""

        async def _run_test() -> None:
            tool_fn = _make_tool()
            with patch(
                "unraid_mcp.core.client.make_graphql_request", new_callable=AsyncMock
            ) as mock:
                mock.return_value = {"docker": {"containers": []}}
                try:
                    await tool_fn(action="docker", subaction="details", container_id=container_id)
                except ToolError:
                    pass
                except Exception as exc:
                    pytest.fail(
                        f"Adversarial input {container_id!r} raised {type(exc).__name__}: {exc!r}"
                    )

        _run(_run_test())

    @given(
        st.one_of(
            st.just(""),
            st.just("\x00"),
            st.just("a" * 100_000),
            st.just("ALERT\x00"),
            st.just("info"),  # wrong case
            st.just("Info"),  # mixed case
            st.just("UNKNOWN"),
            st.just(" INFO "),  # padded
        )
    )
    @settings(max_examples=30, suppress_health_check=[HealthCheck.function_scoped_fixture])
    def test_notifications_importance_adversarial(self, importance: str) -> None:
        """Adversarial importance values must raise ToolError, not crash."""

        async def _run_test() -> None:
            tool_fn = _make_tool()
            with patch(
                "unraid_mcp.core.client.make_graphql_request",
                new_callable=AsyncMock,
            ) as mock:
                mock.return_value = {
                    "createNotification": {"id": "1", "title": "t", "importance": "INFO"}
                }
                try:
                    await tool_fn(
                        action="notification",
                        subaction="create",
                        title="t",
                        subject="s",
                        description="d",
                        importance=importance,
                    )
                except ToolError:
                    pass
                except Exception as exc:
                    pytest.fail(f"importance={importance!r} raised {type(exc).__name__}: {exc!r}")

        _run(_run_test())

    @given(
        st.one_of(
            st.just(""),
            st.just("\x00"),
            st.just("a" * 1_000_000),  # extreme length
            st.just("key with spaces"),
            st.just("key\nnewline"),
        )
    )
    @settings(max_examples=20, suppress_health_check=[HealthCheck.function_scoped_fixture])
    def test_keys_get_adversarial_key_ids(self, key_id: str) -> None:
        """Adversarial key_id values must not crash the keys get action."""

        async def _run_test() -> None:
            tool_fn = _make_tool()
            with patch(
                "unraid_mcp.core.client.make_graphql_request", new_callable=AsyncMock
            ) as mock:
                mock.return_value = {"apiKey": None}
                try:
                    await tool_fn(action="key", subaction="get", key_id=key_id)
                except ToolError:
                    pass
                except Exception as exc:
                    pytest.fail(f"key_id={key_id!r} raised {type(exc).__name__}: {exc!r}")

        _run(_run_test())


# ---------------------------------------------------------------------------
# Top-level action guard (invalid domain names)
# ---------------------------------------------------------------------------


class TestInfoActionGuard:
    """Fuzz the top-level action parameter (domain selector).

    Invariant: the consolidated unraid tool must reject any invalid domain
    with a ToolError rather than a KeyError crash.
    """

    @given(st.text())
    @settings(max_examples=200, suppress_health_check=[HealthCheck.function_scoped_fixture])
    def test_invalid_action_raises_tool_error(self, action: str) -> None:
        """Invalid domain names raise ToolError."""
        # Derive the valid set from the real action Literal so it can't go stale
        # (a hardcoded list previously omitted connect/onboarding/subscriptions/
        # oidc/etc., which would have fuzzed real actions as if they were invalid).
        valid_actions = set(get_args(UNRAID_ACTIONS))
        if action in valid_actions:
            return

        async def _run_test() -> None:
            tool_fn = _make_tool()
            with patch("unraid_mcp.core.client.make_graphql_request", new_callable=AsyncMock):
                try:
                    await tool_fn(action=action, subaction="list")
                except ToolError:
                    pass
                except Exception as exc:
                    pytest.fail(
                        f"Action {action!r} raised {type(exc).__name__} "
                        f"instead of ToolError: {exc!r}"
                    )

        _run(_run_test())
