"""Dispatch-level GraphQL contract tests.

These tests validate the GraphQL operations that the consolidated ``unraid``
tool actually emits after action/subaction routing and argument packing. This
complements ``test_query_validation.py``, which validates the raw operation
dicts directly.
"""

from typing import Any
from unittest.mock import AsyncMock

import pytest
from conftest import make_tool_fn

from tests.schema.mock_unraid import CONTAINER_ID, mock_graphql_response
from unraid_mcp.devtools.graphql_inventory import dispatch_operation_cases
from unraid_mcp.tools._docker import _DOCKER_ORGANIZER, _DOCKER_RESOLVE_QUERY


def _make_tool():
    return make_tool_fn("unraid_mcp.tools.unraid", "register_unraid_tool", "unraid")


def _call_kwargs(action: str, subaction: str) -> dict[str, Any]:
    """Representative args broad enough to satisfy every GraphQL subaction."""
    organizer_input = _organizer_input(subaction)
    return {
        "action": action,
        "subaction": subaction,
        "confirm": True,
        "device_id": "server-1",
        "disk_id": "disk-1",
        "correct": True,
        "slot": 1,
        "log_path": "/var/log/syslog",
        "tail_lines": 20,
        "remote_name": "remote",
        "source_path": "/boot/config",
        "destination_path": "/mnt/user/destination",
        "backup_options": {},
        "container_id": CONTAINER_ID,
        "network_id": "network-1",
        "container_ids": [CONTAINER_ID],
        "with_image": False,
        "autostart_entries": [{"id": "docker-1", "autostart": True}],
        "organizer_input": organizer_input,
        "vm_id": "vm-1",
        "notification_id": "notification-1",
        "notification_ids": ["notification-1"],
        "notification_type": "UNREAD",
        "importance": "INFO",
        "offset": 0,
        "limit": 20,
        "list_type": "UNREAD",
        "title": "Title",
        "subject": "Subject",
        "description": "Description",
        "key_id": "key-1",
        "name": "name",
        "roles": ["ADMIN"],
        "permissions": ["READ_ANY"],
        "permissions_input": [{"resource": "all", "actions": ["READ_ANY"]}],
        "names": ["plugin"],
        "bundled": False,
        "restart": True,
        "url": "https://example.com/plugin.plg",
        "plugin_name": "plugin",
        "forced": False,
        "operation_id": "operation-1",
        "provider_type": "b2",
        "config_data": {},
        "settings_input": {},
        "ups_config": {},
        "config_input": {},
        "comment": "comment",
        "sys_model": "model",
        "connect_input": {},
        "onboarding_input": {},
        "theme_name": "white",
        "locale": "en_US",
        "provider_id": "provider-1",
        "token": "session-token",
    }


def _organizer_input(subaction: str) -> dict[str, Any]:
    spec = _DOCKER_ORGANIZER.get(subaction)
    if spec is None:
        return {}
    defaults: dict[str, Any] = {
        "name": "Media",
        "parentId": "folder-root",
        "childrenIds": ["container-a"],
        "sourceEntryIds": ["container-a"],
        "position": 0.0,
        "folderId": "folder-1",
        "newName": "Media",
        "entryIds": ["container-a"],
        "destinationFolderId": "folder-1",
        "viewId": "main",
        "prefs": {},
    }
    allowed = set(spec["required"]) | set(spec["optional"])
    return {key: defaults[key] for key in allowed}


def _mock_graphql_response(query: str, *_args: Any, **_kwargs: Any) -> dict[str, Any]:
    return mock_graphql_response(query)


@pytest.mark.parametrize(
    ("action", "subaction", "expected_query"),
    dispatch_operation_cases(),
    ids=lambda value: value if isinstance(value, str) else None,
)
async def test_every_graphql_operation_is_emitted_by_dispatch(
    action: str,
    subaction: str,
    expected_query: str,
    mock_graphql_request: AsyncMock,
) -> None:
    """Every query/mutation dict entry is reachable through real tool dispatch."""
    mock_graphql_request.side_effect = _mock_graphql_response

    await _make_tool()(**_call_kwargs(action, subaction))

    emitted_queries = [call.args[0] for call in mock_graphql_request.call_args_list]
    assert expected_query in emitted_queries


async def test_docker_name_resolution_query_is_emitted_by_dispatch(
    mock_graphql_request: AsyncMock,
) -> None:
    """Docker name/short-ID paths emit the internal resolver query."""
    mock_graphql_request.side_effect = _mock_graphql_response

    await _make_tool()(
        **{
            **_call_kwargs("docker", "details"),
            "action": "docker",
            "subaction": "details",
            "container_id": "value",
        }
    )

    emitted_queries = [call.args[0] for call in mock_graphql_request.call_args_list]
    assert _DOCKER_RESOLVE_QUERY in emitted_queries
