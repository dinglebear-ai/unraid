# API Reference

unraid-mcp exposes a single MCP tool (`unraid`) with action/subaction routing across 19 domains covering 178 subactions.

## Primary Tool: `unraid`

### Input Schema

```python
unraid(
    action: str,              # Domain (required)
    subaction: str,           # Operation (required)
    confirm: bool = False,    # True to bypass elicitation for destructive ops
    # ... domain-specific parameters
)
```

### Common Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | `Literal[19 values]` | yes | Domain to operate on |
| `subaction` | `str` | yes | Operation within the domain |
| `confirm` | `bool` | no | Set `True` for destructive subactions (default: `False`) |
| `container_id` | `str` | no | Docker container ID or name (fuzzy match supported) |
| `vm_id` | `str` | no | VM identifier |
| `disk_id` | `str` | no | Disk identifier |
| `notification_id` | `str` | no | Single notification ID |
| `notification_ids` | `list[str]` | no | Multiple notification IDs |
| `key_id` | `str` | no | API key identifier |
| `name` | `str` | no | Name for create/update operations |
| `path` | `str` | no | Log file path (for `live/log_tail`) |
| `collect_for` | `float` | no | Collection duration: greater than 0 and no more than the configured ceiling (default call 5.0; ceiling 30 seconds) |
| `timeout` | `float` | no | WebSocket timeout: greater than 0 and no more than the configured ceiling (default call 10.0; ceiling 60 seconds) |
| `limit` | `int` | no | Max items to return (default: 20; `<=0` = response-unbounded, but streaming safety ceilings still apply) |
| `offset` | `int` | no | Pagination offset (default: 0) |

### Action Domains

#### `system` (25 subactions)

Server information, metrics, network, and UPS management.

**Key subactions:**
- `overview` - Complete system summary (recommended starting point)
- `server` - Hostname, version, uptime
- `array` - Array status and disk list
- `network` - Network interfaces and config
- `metrics` - Current CPU and memory usage
- `network_metrics` - Current network throughput metrics
- `services` - Running services status
- `ups_devices` - List all UPS devices
- `ups_config` - UPS configuration

**Example:**
```python
unraid(action="system", subaction="overview")
```

#### `health` (4 subactions)

Health checks, connection testing, diagnostics, and credential setup.

**Subactions:**
- `check` - Comprehensive health check (returns all subsystem status)
- `test_connection` - Test GraphQL API connectivity
- `diagnose` - Detailed diagnostics including error counts
- `setup` - Interactive credential setup via elicitation

**Example:**
```python
unraid(action="health", subaction="check")
```

#### `array` (14 subactions)

Parity checks, array lifecycle, and disk operations.

**Read operations:**
- `parity_status` - Current parity check progress
- `parity_history` - Historical parity check logs
- `assignable_disks` - Disks available for array assignment

**Destructive operations (require `confirm=True`):**
- `stop_array`* - Stop the Unraid array
- `remove_disk`* - Remove a disk from the array
- `clear_disk_stats`* - Clear I/O statistics

**Lifecycle:**
- `parity_start` / `parity_pause` / `parity_resume` / `parity_cancel`
- `start_array`
- `add_disk` / `mount_disk` / `unmount_disk`

#### `disk` (6 subactions)

Shares, physical disks, and log files.

**Subactions:**
- `shares` - List all user shares
- `disks` - List all physical disks
- `disk_details` - Detailed disk information
- `log_files` - Available log files
- `logs` - Read log file contents
- `flash_backup`* - Backup flash drive (destructive)

#### `docker` (26 subactions)

Container lifecycle, updates, organizer folders, and network inspection.

**Read operations:**
- `list` - List all containers (supports `limit`)
- `details` - Single container details (via `container_id`)
- `logs` - Container logs
- `ports` - Container port mappings
- `networks` - Docker networks list
- `network_details` - Single network details

**Lifecycle:**
- `start` / `stop` / `restart` / `unpause`

**Updates:**
- `update_container` / `update_containers` / `update_all_containers`
- `update_autostart` - Update containers with autostart enabled
- `refresh_digests` - Refresh image digests

**Organizer (folders):**
- `create_folder` / `create_folder_with_items`
- `rename_folder` / `set_folder_children`
- `move_entries_to_folder` / `move_items_to_position`
- `update_view_preferences`

**Destructive:**
- `remove_container`* / `delete_entries`* / `reset_template_mappings`*

#### `vm` (9 subactions)

Virtual machine lifecycle.

**Subactions:**
- `list` - List all VMs
- `details` - VM details (via `vm_id`)
- `start` / `stop` / `pause` / `resume` / `reboot`
- `force_stop`* - Hard power-off (destructive)
- `reset`* - Reset VM (destructive)

#### `notification` (13 subactions)

System notification CRUD operations.

**Read:**
- `overview` - Notification summary
- `list` - List notifications
- `notifications_warnings` - Important/warning notifications

**Write:**
- `create` - Create a notification
- `archive` / `mark_unread` / `recalculate`

**Bulk operations:**
- `notify_if_unique` - Create only if not duplicate
- `archive_all` / `archive_many` / `unarchive_many` / `unarchive_all`

**Destructive:**
- `delete`* / `delete_archived`*

#### `key` (13 subactions)

API key and permission management.

**Read:**
- `list` - List all API keys
- `get` - Get key details (via `key_id`)
- `possible_roles` / `possible_permissions`
- `permissions_for_roles` / `preview_permissions`
- `auth_actions` - Available authentication actions
- `creation_form_schema` - Form schema for key creation

**Write:**
- `create` / `update`
- `add_role` / `remove_role`

**Destructive:**
- `delete`*

#### `plugin` (8 subactions)

Plugin management and async installs.

**Subactions:**
- `list` - All available plugins
- `installed_unraid` - Installed Unraid plugins
- `install_operations` - List async install operations
- `install_operation` - Single operation status
- `add` - Add plugin from URL

**Destructive:**
- `remove`* / `install`* / `install_language`*

#### `rclone` (4 subactions)

Cloud storage remote management.

**Subactions:**
- `list_remotes` - List all rclone remotes
- `config_form` - Configuration form schema
- `create_remote` - Create a new remote
- `delete_remote`* - Delete a remote

#### `setting` (6 subactions)

System settings, UPS, SSH, time, and identity.

**Subactions:**
- `update` - Generic setting update
- `configure_ups`* - Configure UPS (destructive)
- `update_ssh`* - Update SSH settings (destructive)
- `update_temperature` - Update temperature settings
- `update_system_time`* - Update system time/timezone (destructive)
- `update_server_identity` - Update server identity

#### `connect` (8 subactions)

Unraid Connect and remote access management.

**Read:**
- `remote_access` - Remote access status
- `cloud` - Cloud connection status
- `status` - Full connection status

**Write:**
- `update_api_settings`* - Update API settings (destructive)

**Destructive:**
- `sign_in`* / `sign_out`* / `setup_remote_access`* / `enable_dynamic_remote_access`*

#### `customization` (6 subactions)

Theme, locale, and UI customization.

**Subactions:**
- `public_theme` - Public theme settings
- `is_initial_setup` - Initial setup state
- `sso_enabled` - SSO status
- `details` - Full customization details
- `set_theme` / `set_locale`

#### `oidc` (5 subactions)

OIDC/SSO provider management.

**Subactions:**
- `providers` - List OIDC providers
- `provider` - Single provider details
- `configuration` - Provider configuration
- `public_providers` - Public provider list
- `validate_session` - Validate current session

#### `onboarding` (11 subactions)

First-boot and onboarding state management.

**Subactions:**
- `internal_boot_context` - Boot context state
- `complete` / `open` / `close` / `resume` / `bypass`
- `set_override` / `clear_override`
- `refresh_internal_boot_context`
- `create_internal_boot_pool`* - Create boot pool (destructive)
- `reset`* - Reset onboarding (destructive)

#### `user` (1 subaction)

Current authenticated user.

**Subaction:**
- `me` - Current user information

#### `live` (17 subactions)

Real-time WebSocket subscription snapshots.

**Subactions:**
- `cpu` - Current CPU usage
- `memory` - Current memory usage
- `cpu_telemetry` - CPU telemetry snapshot
- `array_state` - Array state snapshot
- `parity_progress` - Parity check progress
- `ups_status` - UPS device status
- `notifications_overview` - Notification summary
- `notifications_warnings` - Warning notifications
- `notification_feed` - Live notification feed
- `log_tail` - Live log tail (via `path`)
- `owner` - Owner information
- `server_status` - Server status
- `display` - Display settings
- `docker_container_stats` - Container statistics
- `temperature` - Temperature readings
- `network_metrics` - Network throughput metrics
- `plugin_install_updates` - Plugin install/update status

**Example:**
```python
unraid(action="live", subaction="cpu")
```

#### `subscriptions` (2 subactions)

WebSocket subscription diagnostics.

**Subactions:**
- `diagnose` - WebSocket connection diagnostics
- `test_query` - Test a subscription query (requires `subscription_query` parameter)

**Example:**
```python
unraid(action="subscriptions", subaction="diagnose")
```

#### `help` (0 subactions)

Returns the full Markdown action/subaction reference.

**Example:**
```python
unraid(action="help")
```

## Destructive Actions

26 destructive subactions across 11 domains require `confirm=True`:

| Domain | Destructive Subactions |
|--------|------------------------|
| `array` | `stop_array`, `remove_disk`, `clear_disk_stats` |
| `vm` | `force_stop`, `reset` |
| `notification` | `delete`, `delete_archived` |
| `rclone` | `delete_remote` |
| `key` | `delete` |
| `disk` | `flash_backup` |
| `setting` | `configure_ups`, `update_ssh`, `update_system_time` |
| `plugin` | `remove`, `install`, `install_language` |
| `docker` | `remove_container`, `reset_template_mappings`, `delete_entries` |
| `connect` | `sign_in`, `sign_out`, `update_api_settings`, `setup_remote_access`, `enable_dynamic_remote_access` |
| `onboarding` | `reset`, `create_internal_boot_pool` |

**Without `confirm=True`, destructive operations raise an MCP elicitation form** prompting the user to confirm the action.

See `/docs/DESTRUCTIVE_ACTIONS.md` for detailed testing strategies and example commands.

## List Capping

List-returning subactions support pagination via the `limit` parameter:

```python
# Default limit (20 items)
unraid(action="docker", subaction="list")

# Custom limit
unraid(action="docker", subaction="list", limit=50)

# No limit (all items)
unraid(action="docker", subaction="list", limit=-1)
```

Capped responses include a `page` meta dict:

```python
{
    "containers": [...],
    "page": {
        "returned": 20,
        "total": 45,
        "truncated": true,
        "hint": "Use limit=-1 to retrieve all items or increase limit"
    }
}
```

All list-shaped subactions apply `limit` and return `page` metadata, including VM, disk,
key/permission, OIDC, system, Docker, array, notification, plugin, and live event/interface
lists. `limit<=0` disables response item capping, but collect-mode live calls still enforce
the in-flight event, byte, and duration safety ceilings.

Collect-mode retention stops while streaming when the effective event ceiling (default
100, lowered by a positive `limit`), byte ceiling (the smaller of 1 MiB and half the MCP
response budget), duration ceiling (30 seconds), or upstream completion is reached. The
`page` object describes response shaping; those fields are distinct from in-flight bounds.

## MCP Resources

Real-time subscription data is available via MCP resource URIs:

```
unraid://live/cpu
unraid://live/memory
unraid://live/array_state
unraid://live/parity_progress
unraid://live/ups_status
unraid://live/notifications_overview
unraid://live/log_tail
unraid://live/network_metrics
unraid://live/docker_container_stats
unraid://live/temperature
```

Resources serve cache only while the owning task is active, state is `subscribed`, and age
is no more than `UNRAID_SUBSCRIPTION_CACHE_MAX_AGE_SECONDS` (300 seconds by default).
Fresh responses include `_fetched_at` plus `_subscription.state`, `active`, `fresh`,
`stale`, and `age_seconds`. Connecting returns a placeholder; stale/terminal cache is not
returned as successful live data and instead triggers an on-demand fetch or explicit error.

See `/unraid_mcp/subscriptions/resources.py` for resource registration.

## Error Handling

### ToolError

User-facing errors return structured `ToolError` with:
- Error message
- Original GraphQL error (if applicable)
- Context about the failed operation

### Response Truncation

Responses over 40 KB (~10K tokens) are replaced with a parseable JSON marker:

```json
{
    "error": "response_truncated",
    "truncated": true,
    "original_size": 45000,
    "cap": 40000,
    "hint": "Reduce query scope or use pagination"
}
```

This is a backstop; per-list `cap_list` defaults do the primary bounding.

## Source References

- **Tool router**: `/unraid_mcp/tools/unraid.py`
- **Domain tools**: `/unraid_mcp/tools/_*.py` (17 modules)
- **Destructive guards**: `/unraid_mcp/core/guards.py`
- **Pagination**: `/unraid_mcp/core/pagination.py`
- **Response limiting**: `/unraid_mcp/core/response_limit.py`
- **Detailed tool reference**: [`/docs/mcp/TOOLS.md`](docs/mcp/TOOLS.md)
- **Destructive actions**: [`/docs/DESTRUCTIVE_ACTIONS.md`](docs/DESTRUCTIVE_ACTIONS.md)
- **Subscription resources**: `/unraid_mcp/subscriptions/resources.py`
