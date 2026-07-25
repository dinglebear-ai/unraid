"""Single consolidated Unraid tool.

Provides the `unraid` tool with 19 actions, each routing to domain-specific
subactions via the action + subaction pattern.

Actions:
  system       - Server info, metrics, network, UPS (25 subactions)
  health       - Health checks, connection test, diagnostics, setup (4 subactions)
  array        - Parity checks, array state, disk operations (14 subactions)
  disk         - Shares, physical disks, log files (6 subactions)
  docker       - Container lifecycle, updates, organizer, networks (26 subactions)
  vm           - Virtual machine lifecycle (9 subactions)
  notification - System notifications CRUD (13 subactions)
  key          - API key & permission management (13 subactions)
  plugin       - Plugin management and async installs (8 subactions)
  rclone       - Cloud storage remote management (4 subactions)
  setting      - System settings, UPS, SSH, time, identity (6 subactions)
  connect      - Unraid Connect / remote access (8 subactions)
  customization - Theme, locale and UI customization (6 subactions)
  oidc         - OIDC/SSO provider management (5 subactions)
  onboarding   - First-boot/onboarding state (11 subactions)
  user         - Current authenticated user (1 subaction)
  live         - Real-time WebSocket subscription snapshots (17 subactions)
  subscriptions - WebSocket subscription diagnostics (2 subactions)
  help         - Return the full Markdown action/subaction reference (no subaction)
"""

from collections.abc import Awaitable, Callable
from typing import Any, Literal, get_args

from fastmcp import Context, FastMCP
from pydantic import BaseModel, Field

from ..config.logging import logger
from ..core.exceptions import ToolError
from ..core.utils import validate_subaction

# Re-exports: domain modules' constants and helpers needed by tests
# Re-export array queries for schema tests
from ._array import (  # noqa: F401
    _ARRAY_DESTRUCTIVE,
    _ARRAY_MUTATIONS,
    _ARRAY_QUERIES,
    _ARRAY_SUBACTIONS,
    _handle_array,
)
from ._connect import (  # noqa: F401
    _CONNECT_DESTRUCTIVE,
    _CONNECT_MUTATIONS,
    _CONNECT_QUERIES,
    _CONNECT_SUBACTIONS,
    _handle_connect,
)
from ._customization import (  # noqa: F401
    _CUSTOMIZATION_MUTATIONS,
    _CUSTOMIZATION_QUERIES,
    _CUSTOMIZATION_SUBACTIONS,
    _handle_customization,
)
from ._disk import (  # noqa: F401
    _DISK_DESTRUCTIVE,
    _DISK_MUTATIONS,
    _DISK_QUERIES,
    _DISK_SUBACTIONS,
    _handle_disk,
)
from ._docker import (  # noqa: F401
    _DOCKER_BULK_MUTATIONS,
    _DOCKER_DESTRUCTIVE,
    _DOCKER_MUTATIONS,
    _DOCKER_ORGANIZER,
    _DOCKER_QUERIES,
    _DOCKER_ROOT_MUTATIONS,
    _DOCKER_SUBACTIONS,
    _handle_docker,
)
from ._health import (  # noqa: F401
    _HEALTH_QUERIES,
    _HEALTH_SUBACTIONS,
    _SEVERITY,
    _comprehensive_health_check,
    _handle_health,
)
from ._key import (  # noqa: F401
    _KEY_DESTRUCTIVE,
    _KEY_MUTATIONS,
    _KEY_QUERIES,
    _KEY_SUBACTIONS,
    _handle_key,
)
from ._live import _handle_live
from ._notification import (  # noqa: F401
    _NOTIFICATION_DESTRUCTIVE,
    _NOTIFICATION_MUTATIONS,
    _NOTIFICATION_QUERIES,
    _NOTIFICATION_SUBACTIONS,
    _handle_notification,
)
from ._oidc import _OIDC_QUERIES, _OIDC_SUBACTIONS, _handle_oidc  # noqa: F401
from ._onboarding import (  # noqa: F401
    _ONBOARDING_DESTRUCTIVE,
    _ONBOARDING_INPUT_MUTATIONS,
    _ONBOARDING_QUERIES,
    _ONBOARDING_SIMPLE_MUTATIONS,
    _ONBOARDING_SUBACTIONS,
    _handle_onboarding,
)
from ._plugin import (  # noqa: F401
    _PLUGIN_DESTRUCTIVE,
    _PLUGIN_MUTATIONS,
    _PLUGIN_QUERIES,
    _PLUGIN_SUBACTIONS,
    _handle_plugin,
)
from ._rclone import (  # noqa: F401
    _RCLONE_DESTRUCTIVE,
    _RCLONE_MUTATIONS,
    _RCLONE_QUERIES,
    _RCLONE_SUBACTIONS,
    _handle_rclone,
)
from ._setting import (  # noqa: F401
    _SETTING_DESTRUCTIVE,
    _SETTING_MUTATIONS,
    _SETTING_SUBACTIONS,
    _handle_setting,
)
from ._system import (  # noqa: F401
    _SYSTEM_QUERIES,
    _SYSTEM_SUBACTIONS,
    _analyze_disk_health,
    _handle_system,
)
from ._user import _USER_QUERIES, _USER_SUBACTIONS, _handle_user  # noqa: F401
from ._vm import (  # noqa: F401
    _VM_DESTRUCTIVE,
    _VM_MUTATIONS,
    _VM_QUERIES,
    _VM_SUBACTIONS,
    _handle_vm,
)


_HELP_TEXT = """# Unraid MCP Server

Interact with an Unraid server's GraphQL API.

## Tool: `unraid`

Single entry point for all operations. Use `action` + `subaction` to select an operation.

### Actions and Subactions

| Action | Subactions | Notes |
|--------|-----------|-------|
| `system` | `overview`, `array`, `network`, `registration`, `variables`, `metrics`, `network_metrics`, `services`, `display`, `display_details`, `config`, `online`, `owner`, `settings`, `server`, `server_details`, `servers`, `network_access_urls`, `flash`, `ups_devices`, `ups_device`, `ups_config`, `server_time`, `timezones`, `network_interfaces` | |
| `health` | `check`, `test_connection`, `diagnose`, `setup` | |
| `array` | `parity_status`, `parity_history`, `assignable_disks`, `parity_start`, `parity_pause`, `parity_resume`, `parity_cancel`, `start_array`, `stop_array`*, `add_disk`, `remove_disk`*, `mount_disk`, `unmount_disk`, `clear_disk_stats`* | |
| `disk` | `shares`, `disks`, `disk_details`, `log_files`, `logs`, `flash_backup`* | |
| `docker` | `list`, `details`, `logs`, `ports`, `start`, `stop`, `restart`, `unpause`, `networks`, `network_details`, `remove_container`*, `update_container`, `update_containers`, `update_all_containers`, `update_autostart`, `refresh_digests`, `sync_template_paths`, `reset_template_mappings`*, `create_folder`, `create_folder_with_items`, `rename_folder`, `set_folder_children`, `delete_entries`*, `move_entries_to_folder`, `move_items_to_position`, `update_view_preferences` | organizer ops use `organizer_input` |
| `vm` | `list`, `details`, `start`, `stop`, `pause`, `resume`, `force_stop`*, `reboot`, `reset`* | |
| `notification` | `overview`, `list`, `create`, `notify_if_unique`, `archive`, `mark_unread`, `recalculate`, `archive_all`, `archive_many`, `unarchive_many`, `unarchive_all`, `delete`*, `delete_archived`* | |
| `key` | `list`, `get`, `possible_roles`, `possible_permissions`, `permissions_for_roles`, `preview_permissions`, `auth_actions`, `creation_form_schema`, `create`, `update`, `delete`*, `add_role`, `remove_role` | |
| `plugin` | `list`, `installed_unraid`, `install_operations`, `install_operation`, `add`, `remove`*, `install`*, `install_language`* | install runs a .plg as root |
| `rclone` | `list_remotes`, `config_form`, `create_remote`, `delete_remote`* | |
| `setting` | `update`, `configure_ups`*, `update_ssh`*, `update_temperature`, `update_system_time`*, `update_server_identity` | |
| `connect` | `remote_access`, `cloud`, `status`, `update_api_settings`*, `sign_in`*, `sign_out`*, `setup_remote_access`*, `enable_dynamic_remote_access`* | Unraid Connect; all mutations destructive; inputs via `connect_input` |
| `customization` | `public_theme`, `is_initial_setup`, `sso_enabled`, `details`, `set_theme`, `set_locale` | |
| `oidc` | `providers`, `provider`, `configuration`, `public_providers`, `validate_session` | |
| `onboarding` | `internal_boot_context`, `complete`, `open`, `close`, `resume`, `bypass`, `reset`*, `set_override`, `clear_override`, `refresh_internal_boot_context`, `create_internal_boot_pool`* | inputs via `onboarding_input` |
| `user` | `me` | |
| `live` | `cpu`, `memory`, `cpu_telemetry`, `array_state`, `parity_progress`, `ups_status`, `notifications_overview`, `notifications_warnings`, `owner`, `server_status`, `display`, `docker_container_stats`, `temperature`, `network_metrics`, `log_tail` (requires `path=`), `notification_feed`, `plugin_install_updates` | |
| `subscriptions` | `diagnose`, `test_query` (requires `subscription_query=`) | WebSocket subscription diagnostics |
| `help` | _(no subaction)_ | Returns this reference |

\\* Destructive — requires `confirm=True`

### Key Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `action` | str | One of the actions above |
| `subaction` | str | Operation within the action |
| `confirm` | bool | Set `True` for destructive subactions (marked `*`). Interactive clients are prompted via elicitation; agents and one-shot API callers **must** pass `confirm=True` to bypass elicitation. (default: False) |
| `container_id` | str | Docker container ID or name |
| `container_ids` | list[str] | Multiple container IDs/names (docker/update_containers) |
| `with_image` | bool | Also remove the image (docker/remove_container) |
| `autostart_entries` | list[dict] | Autostart config: `[{id, autoStart, wait?}]` (docker/update_autostart) |
| `organizer_input` | dict | Docker organizer/folder mutation fields (docker/*_folder, *_entries, etc.) |
| `vm_id` | str | VM identifier |
| `disk_id` | str | Disk identifier |
| `notification_id` | str | Single notification ID |
| `notification_ids` | list[str] | Multiple notification IDs |
| `key_id` | str | API key identifier |
| `name` | str | Name for create/update operations (also server name for setting/update_server_identity) |
| `roles` | list[str] | Roles (key ops, key/permissions_for_roles, key/preview_permissions) |
| `permissions_input` | list[dict] | Structured permissions `[{resource, actions}]` (key/preview_permissions) |
| `url` | str | Plugin .plg URL (plugin/install, plugin/install_language) |
| `plugin_name` | str | Optional plugin name (plugin/install) |
| `forced` | bool | Force plugin install (plugin/install) |
| `operation_id` | str | Plugin install operation ID (plugin/install_operation, live/plugin_install_updates) |
| `config_input` | dict | Input object for setting/update_ssh, update_temperature, update_system_time |
| `comment` | str | Server comment (setting/update_server_identity) |
| `sys_model` | str | Server model string (setting/update_server_identity) |
| `connect_input` | dict | Input object for connect mutations (sign_in, setup_remote_access, etc.) |
| `onboarding_input` | dict | Input object for onboarding/set_override, create_internal_boot_pool |
| `theme_name` | str | Theme name (customization/set_theme) |
| `locale` | str | Locale string (customization/set_locale) |
| `path` | str | Log file path (for live/log_tail) |
| `subscription_query` | str | Raw GraphQL subscription string (for `subscriptions/test_query`) |
| `collect_for` | float | WebSocket collection duration in seconds (default: 5.0) |
| `level` | str | Filter logs to this severity and above: one of debug, info, notice, warning, error, critical (for `disk/logs` and `live/log_tail`). Omit for no filtering. |
| `context` | int | Lines of context kept before/after each matching log line (default: 2). Non-contiguous matches are separated by `---`. |
| `limit` | int | Max items to return (default: 20) |
| `offset` | int | Pagination offset (default: 0) |

### Examples

```
unraid(action="system", subaction="overview")
unraid(action="health", subaction="check")
unraid(action="health", subaction="test_connection")
unraid(action="docker", subaction="list")
unraid(action="docker", subaction="start", container_id="my-container")
unraid(action="vm", subaction="list")
unraid(action="array", subaction="parity_status")
unraid(action="notification", subaction="list", limit=10, list_type="UNREAD")
unraid(action="disk", subaction="disks")
unraid(action="live", subaction="cpu", collect_for=3.0)
unraid(action="live", subaction="log_tail", path="/var/log/syslog", collect_for=5.0)
unraid(action="live", subaction="log_tail", path="/var/log/syslog", level="warning", context=3)
unraid(action="disk", subaction="logs", log_path="/var/log/syslog", level="error", context=2)
unraid(action="array", subaction="stop_array", confirm=True)
unraid(action="subscriptions", subaction="diagnose")
unraid(action="subscriptions", subaction="test_query", subscription_query="subscription { cpu { used idle system } }")
unraid(action="help")
```

## `subscriptions` action

- `diagnose` — full diagnostic dump of the WebSocket subscription system
  (connection states, error counts, reconnect status, troubleshooting hints).
- `test_query` — send a raw GraphQL subscription string directly over the
  WebSocket to debug schema/field issues. Requires `subscription_query=`. Only
  whitelisted subscription fields are permitted; mutation/query keywords are
  rejected.

## `help` action

`unraid(action="help")` returns this document.
"""


# ===========================================================================
# TOOL REGISTRATION
# ===========================================================================

UNRAID_ACTIONS = Literal[
    "array",
    "connect",
    "customization",
    "disk",
    "docker",
    "health",
    "help",
    "key",
    "live",
    "notification",
    "oidc",
    "onboarding",
    "plugin",
    "rclone",
    "setting",
    "subscriptions",
    "system",
    "user",
    "vm",
]


# ===========================================================================
# STRUCTURED INPUT MODEL
# ===========================================================================
#
# `UnraidInput` collects every tool parameter into one validated model. The
# registered `unraid` tool keeps its flat keyword signature (so the MCP input
# schema stays flat — top-level `action`, `subaction`, … — and the consumer
# contract is unchanged), but it immediately packs those args into an
# `UnraidInput` instance and dispatches through the handler registry below.
# Keeping the model fields' names/types/defaults identical to the signature
# guarantees both stay in lockstep.
class UnraidInput(BaseModel):
    """Validated parameter bag for the consolidated `unraid` tool.

    Field names, types, and defaults mirror the `unraid` tool signature exactly.
    The tool builds one of these from its flat keyword args, so the MCP-facing
    input schema is unaffected — this is an internal structure used for dispatch.
    """

    model_config = {"extra": "forbid"}

    # Typed `str`, not the UNRAID_ACTIONS Literal: the MCP-facing enum constraint
    # lives on the tool *signature* (which is what builds the input schema). The
    # model accepts any string so an invalid action falls through to the registry
    # lookup and raises a uniform ToolError — matching the original ladder's
    # behavior — instead of a pydantic ValidationError.
    action: str = Field(description="Domain to operate on (one of the actions).")
    subaction: str = Field(default="", description="Operation within the action.")
    confirm: bool = Field(
        default=False,
        description=(
            "Set True for destructive subactions (marked *). Interactive clients are "
            "prompted via elicitation; agents and one-shot API callers must pass "
            "confirm=True to bypass elicitation."
        ),
    )
    # system
    device_id: str | None = Field(default=None, description="UPS device id (system/ups_device).")
    # array + disk
    disk_id: str | None = Field(default=None, description="Disk identifier.")
    correct: bool | None = Field(
        default=None, description="Correct parity errors during a check (array)."
    )
    slot: int | None = Field(default=None, description="Disk slot number (array add/remove).")
    # disk
    log_path: str | None = Field(default=None, description="Log file path (disk/logs).")
    tail_lines: int = Field(default=100, description="Number of trailing log lines (disk/logs).")
    remote_name: str | None = Field(
        default=None, description="Rclone remote name (disk/flash_backup)."
    )
    source_path: str | None = Field(default=None, description="Source path (disk/flash_backup).")
    destination_path: str | None = Field(
        default=None, description="Destination path (disk/flash_backup)."
    )
    backup_options: dict[str, Any] | None = Field(
        default=None, description="Flash-backup options (disk/flash_backup)."
    )
    # docker
    container_id: str | None = Field(default=None, description="Docker container ID or name.")
    network_id: str | None = Field(
        default=None, description="Docker network ID (docker/network_details)."
    )
    container_ids: list[str] | None = Field(
        default=None, description="Multiple container IDs/names (docker/update_containers)."
    )
    with_image: bool = Field(
        default=False, description="Also remove the image (docker/remove_container)."
    )
    autostart_entries: list[dict[str, Any]] | None = Field(
        default=None,
        description="Autostart config: [{id, autoStart, wait?}] (docker/update_autostart).",
    )
    organizer_input: dict[str, Any] | None = Field(
        default=None,
        description="Docker organizer/folder mutation fields (docker/*_folder, *_entries, etc.).",
    )
    # vm
    vm_id: str | None = Field(default=None, description="VM identifier.")
    # notification
    notification_id: str | None = Field(default=None, description="Single notification ID.")
    notification_ids: list[str] | None = Field(
        default=None, description="Multiple notification IDs."
    )
    notification_type: str | None = Field(default=None, description="Notification type (create).")
    importance: str | None = Field(default=None, description="Notification importance (create).")
    offset: int = Field(default=0, description="Pagination offset.")
    limit: int = Field(default=20, description="Max items to return.")
    list_type: str = Field(default="UNREAD", description="Notification list filter.")
    title: str | None = Field(default=None, description="Notification title (create).")
    subject: str | None = Field(default=None, description="Notification subject (create).")
    description: str | None = Field(default=None, description="Notification description (create).")
    # key
    key_id: str | None = Field(default=None, description="API key identifier.")
    name: str | None = Field(
        default=None,
        description=(
            "Name for create/update operations (also server name for "
            "setting/update_server_identity)."
        ),
    )
    roles: list[str] | None = Field(
        default=None,
        description="Roles (key ops, key/permissions_for_roles, key/preview_permissions).",
    )
    permissions: list[str] | None = Field(default=None, description="Permission strings (key ops).")
    permissions_input: list[dict[str, Any]] | None = Field(
        default=None,
        description="Structured permissions [{resource, actions}] (key/preview_permissions).",
    )
    # plugin
    names: list[str] | None = Field(default=None, description="Plugin names (plugin/add, remove).")
    bundled: bool = Field(default=False, description="Include bundled plugins (plugin/list).")
    restart: bool = Field(default=True, description="Restart after plugin op.")
    url: str | None = Field(
        default=None, description="Plugin .plg URL (plugin/install, plugin/install_language)."
    )
    plugin_name: str | None = Field(
        default=None, description="Optional plugin name (plugin/install)."
    )
    forced: bool = Field(default=False, description="Force plugin install (plugin/install).")
    operation_id: str | None = Field(
        default=None,
        description="Plugin install operation ID (plugin/install_operation, live/plugin_install_updates).",
    )
    # rclone
    provider_type: str | None = Field(
        default=None, description="Rclone provider type (rclone/create_remote)."
    )
    config_data: dict[str, Any] | None = Field(
        default=None, description="Rclone remote config (rclone/create_remote)."
    )
    # setting
    settings_input: dict[str, Any] | None = Field(
        default=None, description="Settings input object (setting/update)."
    )
    ups_config: dict[str, Any] | None = Field(
        default=None, description="UPS config object (setting/configure_ups)."
    )
    config_input: dict[str, Any] | None = Field(
        default=None,
        description="Input object for setting/update_ssh, update_temperature, update_system_time.",
    )
    comment: str | None = Field(
        default=None, description="Server comment (setting/update_server_identity)."
    )
    sys_model: str | None = Field(
        default=None, description="Server model string (setting/update_server_identity)."
    )
    # connect
    connect_input: dict[str, Any] | None = Field(
        default=None,
        description="Input object for connect mutations (sign_in, setup_remote_access, etc.).",
    )
    # onboarding
    onboarding_input: dict[str, Any] | None = Field(
        default=None,
        description="Input object for onboarding/set_override, create_internal_boot_pool.",
    )
    # customization
    theme_name: str | None = Field(
        default=None, description="Theme name (customization/set_theme)."
    )
    locale: str | None = Field(
        default=None, description="Locale string (customization/set_locale)."
    )
    # oidc
    provider_id: str | None = Field(default=None, description="OIDC provider id (oidc/provider).")
    token: str | None = Field(default=None, description="Session token (oidc/validate_session).")
    # subscriptions
    subscription_query: str | None = Field(
        default=None, description="Raw GraphQL subscription string (subscriptions/test_query)."
    )
    # live
    path: str | None = Field(default=None, description="Log file path (live/log_tail).")
    collect_for: float = Field(default=5.0, description="WebSocket collection duration in seconds.")
    timeout: float = Field(default=10.0, description="WebSocket timeout in seconds.")
    # log filtering (disk/logs + live/log_tail)
    level: str | None = Field(
        default=None,
        description=(
            "Filter logs to this severity and above: one of debug, info, notice, warning, "
            "error, critical (disk/logs and live/log_tail). Omit for no filtering."
        ),
    )
    context: int = Field(
        default=2,
        description=(
            "Lines of context kept before/after each matching log line (default 2). "
            "Non-contiguous matches are separated by ---."
        ),
    )


# ===========================================================================
# DISPATCH REGISTRY
# ===========================================================================
#
# One async adapter per action, mapping the structured `UnraidInput` onto the
# corresponding `_handle_*` with the exact same keyword arguments the original
# 19-branch ladder used. Replaces the `if action == ...` chain (arch-L2).
# Handlers that need no ctx ignore the `ctx` parameter. The `help` action is a
# pure-string special case kept inline in the tool body (no GraphQL/ctx needed).

# Type of a registry entry: (input model, ctx) -> result.
_ActionHandler = Callable[[UnraidInput, "Context | None"], Awaitable[dict[str, Any] | str]]


async def _dispatch_system(inp: UnraidInput, ctx: Context | None) -> dict[str, Any] | str:
    return await _handle_system(inp.subaction, device_id=inp.device_id, limit=inp.limit)


async def _dispatch_health(inp: UnraidInput, ctx: Context | None) -> dict[str, Any] | str:
    return await _handle_health(inp.subaction, ctx)


async def _dispatch_array(inp: UnraidInput, ctx: Context | None) -> dict[str, Any] | str:
    return await _handle_array(
        inp.subaction,
        disk_id=inp.disk_id,
        correct=inp.correct,
        slot=inp.slot,
        ctx=ctx,
        confirm=inp.confirm,
        limit=inp.limit,
    )


async def _dispatch_disk(inp: UnraidInput, ctx: Context | None) -> dict[str, Any] | str:
    return await _handle_disk(
        inp.subaction,
        disk_id=inp.disk_id,
        log_path=inp.log_path,
        tail_lines=inp.tail_lines,
        remote_name=inp.remote_name,
        source_path=inp.source_path,
        destination_path=inp.destination_path,
        backup_options=inp.backup_options,
        ctx=ctx,
        confirm=inp.confirm,
        level=inp.level,
        context=inp.context,
        limit=inp.limit,
    )


async def _dispatch_docker(inp: UnraidInput, ctx: Context | None) -> dict[str, Any] | str:
    return await _handle_docker(
        inp.subaction,
        container_id=inp.container_id,
        network_id=inp.network_id,
        limit=inp.limit,
        ctx=ctx,
        confirm=inp.confirm,
        container_ids=inp.container_ids,
        with_image=inp.with_image,
        autostart_entries=inp.autostart_entries,
        organizer_input=inp.organizer_input,
    )


async def _dispatch_vm(inp: UnraidInput, ctx: Context | None) -> dict[str, Any] | str:
    return await _handle_vm(
        inp.subaction, vm_id=inp.vm_id, ctx=ctx, confirm=inp.confirm, limit=inp.limit
    )


async def _dispatch_notification(inp: UnraidInput, ctx: Context | None) -> dict[str, Any] | str:
    return await _handle_notification(
        inp.subaction,
        ctx=ctx,
        confirm=inp.confirm,
        notification_id=inp.notification_id,
        notification_ids=inp.notification_ids,
        notification_type=inp.notification_type,
        importance=inp.importance,
        offset=inp.offset,
        limit=inp.limit,
        list_type=inp.list_type,
        title=inp.title,
        subject=inp.subject,
        description=inp.description,
    )


async def _dispatch_key(inp: UnraidInput, ctx: Context | None) -> dict[str, Any] | str:
    return await _handle_key(
        inp.subaction,
        key_id=inp.key_id,
        name=inp.name,
        roles=inp.roles,
        permissions=inp.permissions,
        ctx=ctx,
        confirm=inp.confirm,
        limit=inp.limit,
        permissions_input=inp.permissions_input,
    )


async def _dispatch_plugin(inp: UnraidInput, ctx: Context | None) -> dict[str, Any] | str:
    return await _handle_plugin(
        inp.subaction,
        names=inp.names,
        bundled=inp.bundled,
        restart=inp.restart,
        ctx=ctx,
        confirm=inp.confirm,
        limit=inp.limit,
        url=inp.url,
        plugin_name=inp.plugin_name,
        forced=inp.forced,
        operation_id=inp.operation_id,
    )


async def _dispatch_rclone(inp: UnraidInput, ctx: Context | None) -> dict[str, Any] | str:
    return await _handle_rclone(
        inp.subaction,
        name=inp.name,
        provider_type=inp.provider_type,
        config_data=inp.config_data,
        ctx=ctx,
        confirm=inp.confirm,
        limit=inp.limit,
    )


async def _dispatch_setting(inp: UnraidInput, ctx: Context | None) -> dict[str, Any] | str:
    return await _handle_setting(
        inp.subaction,
        settings_input=inp.settings_input,
        ups_config=inp.ups_config,
        ctx=ctx,
        confirm=inp.confirm,
        config_input=inp.config_input,
        name=inp.name,
        comment=inp.comment,
        sys_model=inp.sys_model,
    )


async def _dispatch_connect(inp: UnraidInput, ctx: Context | None) -> dict[str, Any] | str:
    return await _handle_connect(
        inp.subaction, ctx=ctx, confirm=inp.confirm, connect_input=inp.connect_input
    )


async def _dispatch_onboarding(inp: UnraidInput, ctx: Context | None) -> dict[str, Any] | str:
    return await _handle_onboarding(
        inp.subaction, ctx=ctx, confirm=inp.confirm, onboarding_input=inp.onboarding_input
    )


async def _dispatch_customization(inp: UnraidInput, ctx: Context | None) -> dict[str, Any] | str:
    return await _handle_customization(inp.subaction, theme_name=inp.theme_name, locale=inp.locale)


async def _dispatch_oidc(inp: UnraidInput, ctx: Context | None) -> dict[str, Any] | str:
    return await _handle_oidc(
        inp.subaction, provider_id=inp.provider_id, token=inp.token, limit=inp.limit
    )


async def _dispatch_user(inp: UnraidInput, ctx: Context | None) -> dict[str, Any] | str:
    return await _handle_user(inp.subaction)


async def _dispatch_live(inp: UnraidInput, ctx: Context | None) -> dict[str, Any] | str:
    return await _handle_live(
        inp.subaction,
        path=inp.path,
        collect_for=inp.collect_for,
        timeout=inp.timeout,
        level=inp.level,
        context=inp.context,
        limit=inp.limit,
        operation_id=inp.operation_id,
    )


async def _dispatch_subscriptions(inp: UnraidInput, ctx: Context | None) -> dict[str, Any] | str:
    # Lazy import to keep tool import-time free of the subscription stack
    # (mirrors the health/diagnose pattern).
    from ..subscriptions.diagnostics import _handle_subscriptions

    return await _handle_subscriptions(inp.subaction, inp.subscription_query)


# action name -> adapter. Built once at import; `help` is handled inline in the
# tool body because it is a pure string with no ctx/GraphQL dependency.
_ACTION_DISPATCH: dict[str, _ActionHandler] = {
    "system": _dispatch_system,
    "health": _dispatch_health,
    "array": _dispatch_array,
    "disk": _dispatch_disk,
    "docker": _dispatch_docker,
    "vm": _dispatch_vm,
    "notification": _dispatch_notification,
    "key": _dispatch_key,
    "plugin": _dispatch_plugin,
    "rclone": _dispatch_rclone,
    "setting": _dispatch_setting,
    "connect": _dispatch_connect,
    "onboarding": _dispatch_onboarding,
    "customization": _dispatch_customization,
    "oidc": _dispatch_oidc,
    "user": _dispatch_user,
    "live": _dispatch_live,
    "subscriptions": _dispatch_subscriptions,
}

_OPERATION_REGISTRY: dict[str, frozenset[str]] = {
    "system": frozenset(_SYSTEM_SUBACTIONS),
    "health": frozenset(_HEALTH_SUBACTIONS),
    "array": frozenset(_ARRAY_SUBACTIONS),
    "disk": frozenset(_DISK_SUBACTIONS),
    "docker": frozenset(_DOCKER_SUBACTIONS),
    "vm": frozenset(_VM_SUBACTIONS),
    "notification": frozenset(_NOTIFICATION_SUBACTIONS),
    "key": frozenset(_KEY_SUBACTIONS),
    "plugin": frozenset(_PLUGIN_SUBACTIONS),
    "rclone": frozenset(_RCLONE_SUBACTIONS),
    "setting": frozenset(_SETTING_SUBACTIONS),
    "connect": frozenset(_CONNECT_SUBACTIONS),
    "onboarding": frozenset(_ONBOARDING_SUBACTIONS),
    "customization": frozenset(_CUSTOMIZATION_SUBACTIONS),
    "oidc": frozenset(_OIDC_SUBACTIONS),
    "user": frozenset(_USER_SUBACTIONS),
    "live": frozenset(
        {
            "cpu",
            "memory",
            "cpu_telemetry",
            "array_state",
            "parity_progress",
            "ups_status",
            "notifications_overview",
            "notifications_warnings",
            "notification_feed",
            "log_tail",
            "owner",
            "server_status",
            "display",
            "docker_container_stats",
            "temperature",
            "network_metrics",
            "plugin_install_updates",
        }
    ),
    "subscriptions": frozenset({"diagnose", "test_query"}),
    "help": frozenset(),
}


def register_unraid_tool(
    mcp: FastMCP,
    *,
    error_stats_provider: Callable[[], dict[str, Any]] | None = None,
) -> None:
    """Register the single `unraid` tool with the FastMCP instance."""

    async def dispatch_health(inp: UnraidInput, ctx: Context | None) -> dict[str, Any] | str:
        return await _handle_health(
            inp.subaction,
            ctx,
            error_stats_provider=error_stats_provider,
        )

    dispatch = {**_ACTION_DISPATCH, "health": dispatch_health}

    @mcp.tool(timeout=120)
    async def unraid(
        action: UNRAID_ACTIONS,
        subaction: str = "",
        ctx: Context | None = None,
        confirm: bool = False,
        # system
        device_id: str | None = None,
        # array + disk
        disk_id: str | None = None,
        correct: bool | None = None,
        slot: int | None = None,
        # disk
        log_path: str | None = None,
        tail_lines: int = 100,
        remote_name: str | None = None,
        source_path: str | None = None,
        destination_path: str | None = None,
        backup_options: dict[str, Any] | None = None,
        # docker
        container_id: str | None = None,
        network_id: str | None = None,
        container_ids: list[str] | None = None,
        with_image: bool = False,
        autostart_entries: list[dict[str, Any]] | None = None,
        organizer_input: dict[str, Any] | None = None,
        # vm
        vm_id: str | None = None,
        # notification
        notification_id: str | None = None,
        notification_ids: list[str] | None = None,
        notification_type: str | None = None,
        importance: str | None = None,
        offset: int = 0,
        limit: int = 20,
        list_type: str = "UNREAD",
        title: str | None = None,
        subject: str | None = None,
        description: str | None = None,
        # key
        key_id: str | None = None,
        name: str | None = None,
        roles: list[str] | None = None,
        permissions: list[str] | None = None,
        permissions_input: list[dict[str, Any]] | None = None,
        # plugin
        names: list[str] | None = None,
        bundled: bool = False,
        restart: bool = True,
        url: str | None = None,
        plugin_name: str | None = None,
        forced: bool = False,
        operation_id: str | None = None,
        # rclone
        provider_type: str | None = None,
        config_data: dict[str, Any] | None = None,
        # setting
        settings_input: dict[str, Any] | None = None,
        ups_config: dict[str, Any] | None = None,
        config_input: dict[str, Any] | None = None,
        comment: str | None = None,
        sys_model: str | None = None,
        # connect
        connect_input: dict[str, Any] | None = None,
        # onboarding
        onboarding_input: dict[str, Any] | None = None,
        # customization
        theme_name: str | None = None,
        locale: str | None = None,
        # oidc
        provider_id: str | None = None,
        token: str | None = None,
        # subscriptions
        subscription_query: str | None = None,
        # live
        path: str | None = None,
        collect_for: float = 5.0,
        timeout: float = 10.0,  # noqa: ASYNC109
        # log filtering (disk/logs + live/log_tail)
        level: str | None = None,
        context: int = 2,
    ) -> dict[str, Any] | str:
        """Interact with an Unraid server's GraphQL API.

        Use action + subaction to select an operation. All params are optional
        except those required by the specific subaction.

        ┌─────────────────┬──────────────────────────────────────────────────────────────────────┐
        │ action          │ subactions                                                           │
        ├─────────────────┼──────────────────────────────────────────────────────────────────────┤
        │ system          │ overview, array, network, registration, variables, metrics,          │
        │                 │ network_metrics, services, display, display_details, config, online, │
        │                 │ owner, settings,                                                     │
        │                 │ server, server_details, servers, network_access_urls, flash,         │
        │                 │ ups_devices, ups_device, ups_config, server_time, timezones,         │
        │                 │ network_interfaces                                                   │
        ├─────────────────┼──────────────────────────────────────────────────────────────────────┤
        │ health          │ check, test_connection, diagnose, setup                              │
        ├─────────────────┼──────────────────────────────────────────────────────────────────────┤
        │ array           │ parity_status, parity_history, assignable_disks,                     │
        │                 │ parity_start, parity_pause, parity_resume, parity_cancel,            │
        │                 │ start_array, stop_array*, add_disk, remove_disk*, mount_disk,        │
        │                 │ unmount_disk, clear_disk_stats*                                      │
        ├─────────────────┼──────────────────────────────────────────────────────────────────────┤
        │ disk            │ shares, disks, disk_details, log_files, logs, flash_backup*          │
        ├─────────────────┼──────────────────────────────────────────────────────────────────────┤
        │ docker          │ list, details, logs, ports, start, stop, restart, unpause,           │
        │                 │ networks, network_details, remove_container*, update_container,      │
        │                 │ update_containers, update_all_containers, update_autostart,          │
        │                 │ refresh_digests, sync_template_paths, reset_template_mappings*,      │
        │                 │ create_folder, create_folder_with_items, rename_folder,              │
        │                 │ set_folder_children, delete_entries*, move_entries_to_folder,        │
        │                 │ move_items_to_position, update_view_preferences                      │
        ├─────────────────┼──────────────────────────────────────────────────────────────────────┤
        │ vm              │ list, details, start, stop, pause, resume,                           │
        │                 │ force_stop*, reboot, reset*                                          │
        ├─────────────────┼──────────────────────────────────────────────────────────────────────┤
        │ notification    │ overview, list, create, notify_if_unique, archive, mark_unread,      │
        │                 │ recalculate, archive_all, archive_many, unarchive_many,              │
        │                 │ unarchive_all, delete*, delete_archived*                             │
        ├─────────────────┼──────────────────────────────────────────────────────────────────────┤
        │ key             │ list, get, possible_roles, possible_permissions,                     │
        │                 │ permissions_for_roles, preview_permissions, auth_actions,            │
        │                 │ creation_form_schema, create, update, delete*, add_role, remove_role │
        ├─────────────────┼──────────────────────────────────────────────────────────────────────┤
        │ plugin          │ list, installed_unraid, install_operations, install_operation,       │
        │                 │ add, remove*, install*, install_language*                            │
        ├─────────────────┼──────────────────────────────────────────────────────────────────────┤
        │ rclone          │ list_remotes, config_form, create_remote, delete_remote*             │
        ├─────────────────┼──────────────────────────────────────────────────────────────────────┤
        │ setting         │ update, configure_ups*, update_ssh*, update_temperature,             │
        │                 │ update_system_time*, update_server_identity                          │
        ├─────────────────┼──────────────────────────────────────────────────────────────────────┤
        │ connect         │ remote_access, cloud, status, update_api_settings*, sign_in*,        │
        │                 │ sign_out*, setup_remote_access*, enable_dynamic_remote_access*       │
        ├─────────────────┼──────────────────────────────────────────────────────────────────────┤
        │ customization   │ public_theme, is_initial_setup, sso_enabled, details, set_theme,     │
        │                 │ set_locale                                                           │
        ├─────────────────┼──────────────────────────────────────────────────────────────────────┤
        │ oidc            │ providers, provider, configuration, public_providers,                │
        │                 │ validate_session                                                     │
        ├─────────────────┼──────────────────────────────────────────────────────────────────────┤
        │ onboarding      │ internal_boot_context, complete, open, close, resume, bypass,        │
        │                 │ reset*, set_override, clear_override,                                │
        │                 │ refresh_internal_boot_context, create_internal_boot_pool*            │
        ├─────────────────┼──────────────────────────────────────────────────────────────────────┤
        │ user            │ me                                                                   │
        ├─────────────────┼──────────────────────────────────────────────────────────────────────┤
        │ live            │ cpu, memory, cpu_telemetry, array_state, parity_progress,            │
        │                 │ ups_status, notifications_overview, notifications_warnings,          │
        │                 │ owner, server_status, display, docker_container_stats,               │
        │                 │ temperature, network_metrics, log_tail (requires path=),             │
        │                 │ notification_feed, plugin_install_updates                            │
        ├─────────────────┼──────────────────────────────────────────────────────────────────────┤
        │ subscriptions   │ diagnose, test_query (requires subscription_query=)                  │
        ├─────────────────┼──────────────────────────────────────────────────────────────────────┤
        │ help            │ (no subaction — returns the full Markdown reference)                 │
        └─────────────────┴──────────────────────────────────────────────────────────────────────┘

        * Destructive — interactive clients are prompted for confirmation via
          elicitation. Agents and non-interactive callers must pass confirm=True
          to execute these subactions.

        Log filtering (disk/logs, live/log_tail): pass level= to keep only lines
        at-or-above a severity (debug|info|notice|warning|error|critical) and
        context= (default 2) for lines of surrounding context around each match.
        Non-contiguous matches are separated by a '---' marker. Omit level for
        unchanged output.
        """
        # `help` is a pure string with no ctx/GraphQL dependency — handle it
        # before building the model so it stays a trivial fast path.
        if action == "help":
            if subaction:
                raise ToolError("help does not accept a subaction")
            return _HELP_TEXT

        # Pack the flat keyword args into the structured input model. The tool
        # signature stays flat (so the MCP input schema is unchanged), but the
        # rest of the routing operates on the validated model. Build the model
        # straight from the bound parameters instead of restating all ~60 names by
        # hand (#4): at this point locals() holds exactly the tool parameters, so
        # we drop `ctx` (not a model field) and pass the rest. `extra="forbid"`
        # still catches any signature/model drift, and a contract test asserts the
        # two field sets stay identical. (locals() is captured into a variable
        # first because a comprehension has its own scope.)
        _params = locals()
        inp = UnraidInput(**{k: v for k, v in _params.items() if k in UnraidInput.model_fields})

        allowed_subactions = _OPERATION_REGISTRY.get(action)
        if allowed_subactions is None:
            raise ToolError(
                f"Invalid action '{action}'. Must be one of: {sorted(_OPERATION_REGISTRY)}"
            )
        validate_subaction(subaction, set(allowed_subactions), action)

        handler = dispatch.get(action)
        if handler is None:
            raise ToolError(
                f"Invalid action '{action}'. Must be one of: {sorted(get_args(UNRAID_ACTIONS))}"
            )
        return await handler(inp, ctx)

    logger.info("Unraid tool registered successfully")
