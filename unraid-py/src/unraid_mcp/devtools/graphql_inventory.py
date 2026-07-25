"""GraphQL operation inventory shared by tests and maintenance scripts."""

from __future__ import annotations

from typing import TYPE_CHECKING


if TYPE_CHECKING:
    from collections.abc import Iterable

from unraid_mcp.subscriptions.queries import COLLECT_ACTIONS, SNAPSHOT_ACTIONS
from unraid_mcp.tools._array import _ARRAY_MUTATIONS, _ARRAY_QUERIES
from unraid_mcp.tools._connect import _CONNECT_MUTATIONS, _CONNECT_QUERIES
from unraid_mcp.tools._customization import _CUSTOMIZATION_MUTATIONS, _CUSTOMIZATION_QUERIES
from unraid_mcp.tools._disk import _DISK_MUTATIONS, _DISK_QUERIES
from unraid_mcp.tools._docker import (
    _DOCKER_BULK_MUTATIONS,
    _DOCKER_MUTATIONS,
    _DOCKER_ORGANIZER,
    _DOCKER_QUERIES,
    _DOCKER_RESOLVE_QUERY,
    _DOCKER_ROOT_MUTATIONS,
)
from unraid_mcp.tools._health import _HEALTH_QUERIES
from unraid_mcp.tools._key import _KEY_MUTATIONS, _KEY_QUERIES
from unraid_mcp.tools._notification import _NOTIFICATION_MUTATIONS, _NOTIFICATION_QUERIES
from unraid_mcp.tools._oidc import _OIDC_QUERIES
from unraid_mcp.tools._onboarding import (
    _ONBOARDING_INPUT_MUTATIONS,
    _ONBOARDING_QUERIES,
    _ONBOARDING_SIMPLE_MUTATIONS,
)
from unraid_mcp.tools._plugin import _PLUGIN_MUTATIONS, _PLUGIN_QUERIES
from unraid_mcp.tools._rclone import _RCLONE_MUTATIONS, _RCLONE_QUERIES
from unraid_mcp.tools._setting import _SETTING_MUTATIONS
from unraid_mcp.tools._system import _SYSTEM_QUERIES
from unraid_mcp.tools._user import _USER_QUERIES
from unraid_mcp.tools._vm import _VM_MUTATIONS, _VM_QUERIES


def public_operation_dicts() -> Iterable[tuple[str, dict[str, str]]]:
    """Return action/subaction operations exposed through the consolidated tool."""
    docker_organizer = {name: spec["mutation"] for name, spec in _DOCKER_ORGANIZER.items()}
    return (
        ("system", _SYSTEM_QUERIES),
        ("health", {"check": _HEALTH_QUERIES["comprehensive_health"]}),
        ("array", _ARRAY_QUERIES),
        ("array", _ARRAY_MUTATIONS),
        ("disk", _DISK_QUERIES),
        ("disk", _DISK_MUTATIONS),
        ("docker", _DOCKER_QUERIES),
        ("docker", _DOCKER_MUTATIONS),
        ("docker", _DOCKER_BULK_MUTATIONS),
        ("docker", _DOCKER_ROOT_MUTATIONS),
        ("docker", docker_organizer),
        ("vm", _VM_QUERIES),
        ("vm", _VM_MUTATIONS),
        ("notification", _NOTIFICATION_QUERIES),
        ("notification", _NOTIFICATION_MUTATIONS),
        ("rclone", _RCLONE_QUERIES),
        ("rclone", _RCLONE_MUTATIONS),
        ("user", _USER_QUERIES),
        ("key", _KEY_QUERIES),
        ("key", _KEY_MUTATIONS),
        ("setting", _SETTING_MUTATIONS),
        ("connect", _CONNECT_QUERIES),
        ("connect", _CONNECT_MUTATIONS),
        ("customization", _CUSTOMIZATION_QUERIES),
        ("customization", _CUSTOMIZATION_MUTATIONS),
        ("plugin", _PLUGIN_QUERIES),
        ("plugin", _PLUGIN_MUTATIONS),
        ("oidc", _OIDC_QUERIES),
        ("onboarding", _ONBOARDING_QUERIES),
        ("onboarding", _ONBOARDING_SIMPLE_MUTATIONS),
        ("onboarding", _ONBOARDING_INPUT_MUTATIONS),
    )


def schema_operation_dicts() -> Iterable[tuple[str, dict[str, str]]]:
    """Return every GraphQL document emitted by runtime code paths."""
    yield from public_operation_dicts()
    yield ("docker_internal", {"resolve_container_id": _DOCKER_RESOLVE_QUERY})
    yield ("live_snapshot", SNAPSHOT_ACTIONS)
    yield ("live_collect", COLLECT_ACTIONS)


def dispatch_operation_cases() -> list[tuple[str, str, str]]:
    """Return public action/subaction cases that can be driven through dispatch."""
    cases: list[tuple[str, str, str]] = []
    for action, operations in public_operation_dicts():
        for subaction, operation in operations.items():
            cases.append((action, subaction, operation))
    return cases


def all_operation_cases() -> list[tuple[str, str, str]]:
    """Return all known GraphQL documents as ``(source, name, operation)`` rows."""
    cases: list[tuple[str, str, str]] = []
    for source, operations in schema_operation_dicts():
        for name, operation in operations.items():
            cases.append((source, name, operation))
    return cases
