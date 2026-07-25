"""Safety audit tests for destructive action confirmation guards.

Verifies that all destructive operations across every domain require
explicit `confirm=True` before execution, and that the DESTRUCTIVE_ACTIONS
registries are complete and consistent.
"""

from collections.abc import Generator
from unittest.mock import AsyncMock, patch

import pytest
from conftest import make_tool_fn

from unraid_mcp.core.exceptions import ToolError

# Import DESTRUCTIVE_ACTIONS and MUTATIONS sets from the consolidated unraid module
from unraid_mcp.tools.unraid import (
    _ARRAY_DESTRUCTIVE,
    _ARRAY_MUTATIONS,
    _CONNECT_DESTRUCTIVE,
    _CONNECT_MUTATIONS,
    _DISK_DESTRUCTIVE,
    _DISK_MUTATIONS,
    _DOCKER_BULK_MUTATIONS,
    _DOCKER_DESTRUCTIVE,
    _DOCKER_MUTATIONS,
    _DOCKER_ORGANIZER,
    _DOCKER_ROOT_MUTATIONS,
    _KEY_DESTRUCTIVE,
    _KEY_MUTATIONS,
    _NOTIFICATION_DESTRUCTIVE,
    _NOTIFICATION_MUTATIONS,
    _ONBOARDING_DESTRUCTIVE,
    _ONBOARDING_INPUT_MUTATIONS,
    _ONBOARDING_SIMPLE_MUTATIONS,
    _PLUGIN_DESTRUCTIVE,
    _PLUGIN_MUTATIONS,
    _RCLONE_DESTRUCTIVE,
    _RCLONE_MUTATIONS,
    _SETTING_DESTRUCTIVE,
    _SETTING_MUTATIONS,
    _VM_DESTRUCTIVE,
    _VM_MUTATIONS,
)


# Docker mutations are split across several dicts; the audit treats them as one
# namespace. Same for onboarding (simple + input mutations).
_DOCKER_ALL_MUTATIONS = {
    **_DOCKER_MUTATIONS,
    **_DOCKER_BULK_MUTATIONS,
    **_DOCKER_ROOT_MUTATIONS,
    **{k: v["mutation"] for k, v in _DOCKER_ORGANIZER.items()},
}
_ONBOARDING_ALL_MUTATIONS = {**_ONBOARDING_SIMPLE_MUTATIONS, **_ONBOARDING_INPUT_MUTATIONS}


# ---------------------------------------------------------------------------
# Known destructive actions registry (ground truth for this audit)
# ---------------------------------------------------------------------------

KNOWN_DESTRUCTIVE: dict[str, dict] = {
    "array": {
        "actions": {"remove_disk", "clear_disk_stats", "stop_array"},
        "runtime_set": _ARRAY_DESTRUCTIVE,
        "mutations": _ARRAY_MUTATIONS,
    },
    "vm": {
        "actions": {"force_stop", "reset"},
        "runtime_set": _VM_DESTRUCTIVE,
        "mutations": _VM_MUTATIONS,
    },
    "notification": {
        "actions": {"delete", "delete_archived"},
        "runtime_set": _NOTIFICATION_DESTRUCTIVE,
        "mutations": _NOTIFICATION_MUTATIONS,
    },
    "rclone": {
        "actions": {"delete_remote"},
        "runtime_set": _RCLONE_DESTRUCTIVE,
        "mutations": _RCLONE_MUTATIONS,
    },
    "key": {
        "actions": {"delete"},
        "runtime_set": _KEY_DESTRUCTIVE,
        "mutations": _KEY_MUTATIONS,
    },
    "disk": {
        "actions": {"flash_backup"},
        "runtime_set": _DISK_DESTRUCTIVE,
        "mutations": _DISK_MUTATIONS,
    },
    "setting": {
        "actions": {"configure_ups", "update_ssh", "update_system_time"},
        "runtime_set": _SETTING_DESTRUCTIVE,
        "mutations": _SETTING_MUTATIONS,
    },
    "plugin": {
        "actions": {"remove", "install", "install_language"},
        "runtime_set": _PLUGIN_DESTRUCTIVE,
        "mutations": _PLUGIN_MUTATIONS,
    },
    "docker": {
        "actions": {"remove_container", "reset_template_mappings", "delete_entries"},
        "runtime_set": _DOCKER_DESTRUCTIVE,
        "mutations": _DOCKER_ALL_MUTATIONS,
    },
    "connect": {
        "actions": {
            "sign_in",
            "sign_out",
            "update_api_settings",
            "setup_remote_access",
            "enable_dynamic_remote_access",
        },
        "runtime_set": _CONNECT_DESTRUCTIVE,
        "mutations": _CONNECT_MUTATIONS,
    },
    "onboarding": {
        "actions": {"reset", "create_internal_boot_pool"},
        "runtime_set": _ONBOARDING_DESTRUCTIVE,
        "mutations": _ONBOARDING_ALL_MUTATIONS,
    },
}


# ---------------------------------------------------------------------------
# Registry validation: DESTRUCTIVE_ACTIONS sets match ground truth
# ---------------------------------------------------------------------------


class TestDestructiveActionRegistries:
    """Verify that DESTRUCTIVE_ACTIONS sets in source code match the audit."""

    @pytest.mark.parametrize("domain", list(KNOWN_DESTRUCTIVE.keys()))
    def test_destructive_set_matches_audit(self, domain: str) -> None:
        info = KNOWN_DESTRUCTIVE[domain]
        assert info["runtime_set"] == info["actions"], (
            f"{domain}: DESTRUCTIVE_ACTIONS is {info['runtime_set']}, expected {info['actions']}"
        )

    @pytest.mark.parametrize("domain", list(KNOWN_DESTRUCTIVE.keys()))
    def test_destructive_actions_are_valid_mutations(self, domain: str) -> None:
        info = KNOWN_DESTRUCTIVE[domain]
        for action in info["actions"]:
            assert action in info["mutations"], (
                f"{domain}: destructive action '{action}' is not in MUTATIONS"
            )

    def test_no_delete_or_remove_mutations_missing_from_destructive(self) -> None:
        """Any mutation with 'delete' or 'remove' in its name should be destructive.

        Exceptions (documented, intentional):
          key/remove_role — fully reversible; the role can always be re-added via add_role.
        """
        _HEURISTIC_EXCEPTIONS: frozenset[str] = frozenset(  # noqa: N806
            {
                "key/remove_role",  # reversible — role can be re-added via add_role
            }
        )

        missing: list[str] = []
        for domain, info in KNOWN_DESTRUCTIVE.items():
            destructive = info["runtime_set"]
            for action_name in info["mutations"]:
                if (
                    ("delete" in action_name or "remove" in action_name)
                    and action_name not in destructive
                    and f"{domain}/{action_name}" not in _HEURISTIC_EXCEPTIONS
                ):
                    missing.append(f"{domain}/{action_name}")  # noqa: PERF401
        assert not missing, (
            f"Mutations with 'delete'/'remove' not in DESTRUCTIVE_ACTIONS: {missing}"
        )


# ---------------------------------------------------------------------------
# Confirmation guard tests
# ---------------------------------------------------------------------------

# (action, subaction, extra_kwargs)
_DESTRUCTIVE_TEST_CASES: list[tuple[str, str, dict]] = [
    # Array
    ("array", "remove_disk", {"disk_id": "abc123:local"}),
    ("array", "clear_disk_stats", {"disk_id": "abc123:local"}),
    ("array", "stop_array", {}),
    # VM
    ("vm", "force_stop", {"vm_id": "test-vm-uuid"}),
    ("vm", "reset", {"vm_id": "test-vm-uuid"}),
    # Notifications
    ("notification", "delete", {"notification_id": "notif-1", "notification_type": "UNREAD"}),
    ("notification", "delete_archived", {}),
    # RClone
    ("rclone", "delete_remote", {"name": "my-remote"}),
    # Keys
    ("key", "delete", {"key_id": "key-123"}),
    # Disk (flash_backup)
    (
        "disk",
        "flash_backup",
        {"remote_name": "r", "source_path": "/boot", "destination_path": "r:b"},
    ),
    # Settings
    ("setting", "configure_ups", {"ups_config": {"mode": "slave"}}),
    ("setting", "update_ssh", {"config_input": {"enabled": True, "port": 22}}),
    ("setting", "update_system_time", {"config_input": {"timeZone": "UTC"}}),
    # Plugins
    ("plugin", "remove", {"names": ["my-plugin"]}),
    ("plugin", "install", {"url": "https://example.com/x.plg"}),
    ("plugin", "install_language", {"url": "https://example.com/lang.plg"}),
    # Docker
    ("docker", "remove_container", {"container_id": "abc"}),
    ("docker", "reset_template_mappings", {}),
    ("docker", "delete_entries", {"organizer_input": {"entryIds": ["e1"]}}),
    # Connect
    ("connect", "sign_in", {"connect_input": {"apiKey": "k"}}),
    ("connect", "sign_out", {}),
    ("connect", "update_api_settings", {"connect_input": {"accessType": "DYNAMIC"}}),
    ("connect", "setup_remote_access", {"connect_input": {"accessType": "DISABLED"}}),
    (
        "connect",
        "enable_dynamic_remote_access",
        {"connect_input": {"url": {"type": "WAN"}, "enabled": True}},
    ),
    # Onboarding
    ("onboarding", "reset", {}),
    (
        "onboarding",
        "create_internal_boot_pool",
        {
            "onboarding_input": {
                "poolName": "p",
                "devices": ["sdb"],
                "bootSizeMiB": 1,
                "updateBios": False,
            }
        },
    ),
]

_CASE_IDS = [f"{c[0]}/{c[1]}" for c in _DESTRUCTIVE_TEST_CASES]

_MODULE = "unraid_mcp.tools.unraid"
_PATCH_TARGET = "unraid_mcp.core.client"
_REGISTER_FN = "register_unraid_tool"
_TOOL_NAME = "unraid"


@pytest.fixture
def _mock_graphql() -> Generator[AsyncMock, None, None]:
    with patch(f"{_PATCH_TARGET}.make_graphql_request", new_callable=AsyncMock) as m:
        yield m


class TestConfirmationGuards:
    """Every destructive action must reject calls without confirm=True."""

    @pytest.mark.parametrize("action,subaction,kwargs", _DESTRUCTIVE_TEST_CASES, ids=_CASE_IDS)
    async def test_rejects_without_confirm(
        self,
        action: str,
        subaction: str,
        kwargs: dict,
        _mock_graphql: AsyncMock,
    ) -> None:
        tool_fn = make_tool_fn(_MODULE, _REGISTER_FN, _TOOL_NAME)
        with pytest.raises(ToolError, match="confirm=True"):
            await tool_fn(action=action, subaction=subaction, **kwargs)

    @pytest.mark.parametrize("action,subaction,kwargs", _DESTRUCTIVE_TEST_CASES, ids=_CASE_IDS)
    async def test_rejects_with_confirm_false(
        self,
        action: str,
        subaction: str,
        kwargs: dict,
        _mock_graphql: AsyncMock,
    ) -> None:
        tool_fn = make_tool_fn(_MODULE, _REGISTER_FN, _TOOL_NAME)
        with pytest.raises(ToolError, match="confirm=True"):
            await tool_fn(action=action, subaction=subaction, confirm=False, **kwargs)

    @pytest.mark.parametrize("action,subaction,kwargs", _DESTRUCTIVE_TEST_CASES, ids=_CASE_IDS)
    async def test_error_message_includes_subaction_name(
        self,
        action: str,
        subaction: str,
        kwargs: dict,
        _mock_graphql: AsyncMock,
    ) -> None:
        tool_fn = make_tool_fn(_MODULE, _REGISTER_FN, _TOOL_NAME)
        with pytest.raises(ToolError, match=subaction):
            await tool_fn(action=action, subaction=subaction, **kwargs)


# ---------------------------------------------------------------------------
# Strict guard tests: no network calls escape when unconfirmed
# ---------------------------------------------------------------------------


class TestNoGraphQLCallsWhenUnconfirmed:
    """The most critical safety property: when confirm is missing/False,
    NO GraphQL request must ever reach the network layer.
    """

    @pytest.mark.parametrize("action,subaction,kwargs", _DESTRUCTIVE_TEST_CASES, ids=_CASE_IDS)
    async def test_no_graphql_call_without_confirm(
        self,
        action: str,
        subaction: str,
        kwargs: dict,
        _mock_graphql: AsyncMock,
    ) -> None:
        tool_fn = make_tool_fn(_MODULE, _REGISTER_FN, _TOOL_NAME)
        with pytest.raises(ToolError):
            await tool_fn(action=action, subaction=subaction, **kwargs)
        _mock_graphql.assert_not_called()

    @pytest.mark.parametrize("action,subaction,kwargs", _DESTRUCTIVE_TEST_CASES, ids=_CASE_IDS)
    async def test_no_graphql_call_with_confirm_false(
        self,
        action: str,
        subaction: str,
        kwargs: dict,
        _mock_graphql: AsyncMock,
    ) -> None:
        tool_fn = make_tool_fn(_MODULE, _REGISTER_FN, _TOOL_NAME)
        with pytest.raises(ToolError):
            await tool_fn(action=action, subaction=subaction, confirm=False, **kwargs)
        _mock_graphql.assert_not_called()


# ---------------------------------------------------------------------------
# Positive tests: destructive actions proceed when confirm=True
# ---------------------------------------------------------------------------


class TestConfirmAllowsExecution:
    """Destructive actions with confirm=True should reach the GraphQL layer."""

    async def test_vm_force_stop_with_confirm(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {"vm": {"forceStop": True}}
        tool_fn = make_tool_fn(_MODULE, _REGISTER_FN, _TOOL_NAME)
        result = await tool_fn(action="vm", subaction="force_stop", vm_id="test-uuid", confirm=True)
        assert result["success"] is True

    async def test_vm_reset_with_confirm(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {"vm": {"reset": True}}
        tool_fn = make_tool_fn(_MODULE, _REGISTER_FN, _TOOL_NAME)
        result = await tool_fn(action="vm", subaction="reset", vm_id="test-uuid", confirm=True)
        assert result["success"] is True

    async def test_notifications_delete_with_confirm(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {
            "deleteNotification": {
                "unread": {"info": 0, "warning": 0, "alert": 0, "total": 0},
                "archive": {"info": 0, "warning": 0, "alert": 0, "total": 0},
            }
        }
        tool_fn = make_tool_fn(_MODULE, _REGISTER_FN, _TOOL_NAME)
        result = await tool_fn(
            action="notification",
            subaction="delete",
            notification_id="notif-1",
            notification_type="UNREAD",
            confirm=True,
        )
        assert result["success"] is True

    async def test_notifications_delete_archived_with_confirm(
        self, _mock_graphql: AsyncMock
    ) -> None:
        _mock_graphql.return_value = {
            "deleteArchivedNotifications": {
                "unread": {"info": 0, "warning": 0, "alert": 0, "total": 0},
                "archive": {"info": 0, "warning": 0, "alert": 0, "total": 0},
            }
        }
        tool_fn = make_tool_fn(_MODULE, _REGISTER_FN, _TOOL_NAME)
        result = await tool_fn(action="notification", subaction="delete_archived", confirm=True)
        assert result["success"] is True

    async def test_rclone_delete_remote_with_confirm(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {"rclone": {"deleteRCloneRemote": True}}
        tool_fn = make_tool_fn(_MODULE, _REGISTER_FN, _TOOL_NAME)
        result = await tool_fn(
            action="rclone", subaction="delete_remote", name="my-remote", confirm=True
        )
        assert result["success"] is True

    async def test_keys_delete_with_confirm(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {"apiKey": {"delete": True}}
        tool_fn = make_tool_fn(_MODULE, _REGISTER_FN, _TOOL_NAME)
        result = await tool_fn(action="key", subaction="delete", key_id="key-123", confirm=True)
        assert result["success"] is True

    async def test_disk_flash_backup_with_confirm(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {"initiateFlashBackup": {"status": "started", "jobId": "j:1"}}
        tool_fn = make_tool_fn(_MODULE, _REGISTER_FN, _TOOL_NAME)
        result = await tool_fn(
            action="disk",
            subaction="flash_backup",
            confirm=True,
            remote_name="r",
            source_path="/boot",
            destination_path="r:b",
        )
        assert result["success"] is True

    async def test_settings_configure_ups_with_confirm(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {"configureUps": True}
        tool_fn = make_tool_fn(_MODULE, _REGISTER_FN, _TOOL_NAME)
        result = await tool_fn(
            action="setting",
            subaction="configure_ups",
            confirm=True,
            ups_config={"mode": "master", "cable": "usb"},
        )
        assert result["success"] is True

    async def test_array_remove_disk_with_confirm(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {"array": {"removeDiskFromArray": {"state": "STOPPED"}}}
        tool_fn = make_tool_fn(_MODULE, _REGISTER_FN, _TOOL_NAME)
        result = await tool_fn(
            action="array", subaction="remove_disk", disk_id="abc:local", confirm=True
        )
        assert result["success"] is True

    async def test_array_clear_disk_stats_with_confirm(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {"array": {"clearArrayDiskStatistics": True}}
        tool_fn = make_tool_fn(_MODULE, _REGISTER_FN, _TOOL_NAME)
        result = await tool_fn(
            action="array", subaction="clear_disk_stats", disk_id="abc:local", confirm=True
        )
        assert result["success"] is True

    async def test_array_stop_array_with_confirm(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {"array": {"setState": {"state": "STOPPED"}}}
        tool_fn = make_tool_fn(_MODULE, _REGISTER_FN, _TOOL_NAME)
        result = await tool_fn(action="array", subaction="stop_array", confirm=True)
        assert result["success"] is True

    async def test_plugins_remove_with_confirm(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {"removePlugin": True}
        tool_fn = make_tool_fn(_MODULE, _REGISTER_FN, _TOOL_NAME)
        result = await tool_fn(
            action="plugin", subaction="remove", names=["my-plugin"], confirm=True
        )
        assert result["success"] is True


# ---------------------------------------------------------------------------
# Non-destructive actions must NOT require confirm
# ---------------------------------------------------------------------------


class TestNonDestructiveActionsNeverRequireConfirm:
    """Guard regression: non-destructive ops must work without confirm."""

    @pytest.mark.parametrize(
        "action,subaction,kwargs,mock_return",
        [
            ("array", "parity_cancel", {}, {"parityCheck": {"cancel": True}}),
            ("vm", "start", {"vm_id": "test-uuid"}, {"vm": {"start": True}}),
            ("notification", "archive_all", {}, {"archiveAll": {"info": 0, "total": 0}}),
            ("rclone", "list_remotes", {}, {"rclone": {"remotes": []}}),
            ("key", "list", {}, {"apiKeys": []}),
        ],
        ids=[
            "array/parity_cancel",
            "vm/start",
            "notification/archive_all",
            "rclone/list_remotes",
            "key/list",
        ],
    )
    async def test_non_destructive_action_works_without_confirm(
        self,
        action: str,
        subaction: str,
        kwargs: dict,
        mock_return: dict,
        _mock_graphql: AsyncMock,
    ) -> None:
        _mock_graphql.return_value = mock_return
        tool_fn = make_tool_fn(_MODULE, _REGISTER_FN, _TOOL_NAME)
        result = await tool_fn(action=action, subaction=subaction, **kwargs)
        assert result is not None
        _mock_graphql.assert_called_once()
