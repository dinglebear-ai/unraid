# MCP Tools Reference

## Design Philosophy

unraid-mcp exposes a single MCP tool, `unraid`, with `action` (domain) + `subaction` (operation) routing:

| Tool | Purpose | Parameters |
|------|---------|------------|
| `unraid` | The only tool -- action+subaction dispatch across 19 actions / 178 subactions. The Markdown reference and WebSocket diagnostics are the `help` and `subscriptions` actions. | `action`, `subaction`, plus domain-specific params |

The consolidated action pattern keeps the MCP surface to one tool while supporting 178 subactions across 19 actions. Clients call `unraid(action="help")` first to discover available operations, then call `unraid` with the appropriate action and subaction. WebSocket subscription diagnostics live under `unraid(action="subscriptions", subaction="diagnose"|"test_query")`.

## Primary Tool: `unraid`

### Input Schema

```python
unraid(
    action: str,       # Domain (required)
    subaction: str,    # Operation (required)
    confirm: bool,     # True to bypass elicitation for destructive ops
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
| `collect_for` | `float` | no | Collection duration: `0 < value <= UNRAID_SUBSCRIPTION_COLLECT_MAX_SECONDS` (default call 5.0; ceiling 30 seconds) |
| `timeout` | `float` | no | WebSocket timeout: `0 < value <= UNRAID_SUBSCRIPTION_TIMEOUT_MAX_SECONDS` (default call 10.0; ceiling 60 seconds) |
| `limit` | `int` | no | Max items to return (default: 20); also lowers the in-flight collection event ceiling when positive |
| `offset` | `int` | no | Pagination offset (default: 0) |

### Actions and Subactions

#### `system` (25 subactions)

Server information, metrics, network, and UPS management.

| Subaction | Description | Extra params |
|-----------|-------------|-------------|
| `overview` | Complete system summary (recommended starting point) | -- |
| `server` | Hostname, version, uptime | -- |
| `servers` | All known Unraid servers | -- |
| `array` | Array status and disk list | -- |
| `network` | Network interfaces and config | -- |
| `registration` | License and registration status | -- |
| `variables` | Environment variables | -- |
| `metrics` | Current CPU and memory usage | -- |
| `network_metrics` | Current network throughput metrics | -- |
| `services` | Running services status | -- |
| `display` | Display settings | -- |
| `display_details` | Direct `display` root metadata: case, theme, temperature display settings, thresholds, locale | -- |
| `config` | System configuration | -- |
| `online` | Quick online status check | -- |
| `owner` | Server owner information | -- |
| `settings` | User settings and preferences | -- |
| `server_details` | Direct `server` root details with owner and URLs; API key omitted | -- |
| `network_access_urls` | Direct `network.accessUrls` entries with type, name, IPv4, and IPv6 | -- |
| `flash` | USB flash drive details | -- |
| `ups_devices` | List all UPS devices | -- |
| `ups_device` | Single UPS device details | `device_id` |
| `ups_config` | UPS configuration | -- |
| `server_time` | Current server time, time zone, and NTP config | -- |
| `timezones` | Available IANA time-zone options (capped) | -- |
| `network_interfaces` | Extended network interface list with IPv4/IPv6 address details | -- |

#### `health` (4 subactions)

Health checks, connection testing, diagnostics, and credential setup.

| Subaction | Description | Extra params |
|-----------|-------------|-------------|
| `check` | Comprehensive health check (connectivity, array, disks, containers, VMs, resources) | -- |
| `test_connection` | Test API connectivity and authentication, returns latency | -- |
| `diagnose` | Detailed diagnostic report with subscription status and middleware error stats | -- |
| `setup` | Report credential status and print plugin/`.env` setup instructions (creds persist to `~/.unraid-mcp/.env`) | -- |

#### `array` (14 subactions)

Parity checks, array lifecycle, and disk operations.

| Subaction | Description | Extra params | Destructive |
|-----------|-------------|-------------|-------------|
| `parity_status` | Current parity check progress and status | -- | -- |
| `parity_history` | Historical parity check results | -- | -- |
| `assignable_disks` | Physical disks not yet in the array | `limit` | -- |
| `parity_start` | Start a parity check | `correct` (bool) | -- |
| `parity_pause` | Pause a running parity check | -- | -- |
| `parity_resume` | Resume a paused parity check | -- | -- |
| `parity_cancel` | Cancel a running parity check | -- | -- |
| `start_array` | Start the array | -- | -- |
| `stop_array` | Stop the array | -- | Yes |
| `add_disk` | Add a disk to the array | `slot`, `disk_id` | -- |
| `remove_disk` | Remove a disk from the array | `slot` | Yes |
| `mount_disk` | Mount a disk | `disk_id` | -- |
| `unmount_disk` | Unmount a disk | `disk_id` | -- |
| `clear_disk_stats` | Clear disk statistics permanently | -- | Yes |

#### `disk` (6 subactions)

Shares, physical disks, log files.

| Subaction | Description | Extra params | Destructive |
|-----------|-------------|-------------|-------------|
| `shares` | List network shares | -- | -- |
| `disks` | All physical disks with health and temperatures | -- | -- |
| `disk_details` | Detailed info for a specific disk | `disk_id` | -- |
| `log_files` | List available log files | -- | -- |
| `logs` | Read log content | `log_path`, `tail_lines` | -- |
| `flash_backup` | Trigger a flash backup | `remote_name`, `source_path`, `destination_path`, `backup_options` | Yes |

#### `docker` (26 subactions)

Container lifecycle, image updates, template/digest maintenance, organizer
folders, and network inspection.

| Subaction | Description | Extra params | Destructive |
|-----------|-------------|-------------|-------------|
| `list` | All containers with status, image, state | -- | -- |
| `details` | Single container details | `container_id` | -- |
| `logs` | Not available via the Unraid GraphQL API -- returns guidance to use `docker logs` on the host | `container_id` | -- |
| `ports` | All host port bindings across running containers, sorted by host port | -- | -- |
| `start` | Start a container | `container_id` | -- |
| `stop` | Stop a container | `container_id` | -- |
| `restart` | Restart a container (stop+start composite) | `container_id` | -- |
| `unpause` | Unpause a paused container | `container_id` | -- |
| `remove_container` | Remove a container | `container_id`, `with_image` | Yes |
| `update_container` | Apply a pending image update to one container | `container_id` | -- |
| `update_containers` | Apply image updates to several containers | `container_ids` | -- |
| `update_all_containers` | Apply all pending container image updates | -- | -- |
| `update_autostart` | Set container autostart config | `autostart_entries` | -- |
| `refresh_digests` | Refresh image digests (recheck for updates) | -- | -- |
| `sync_template_paths` | Sync Docker template paths | -- | -- |
| `reset_template_mappings` | Reset template path mappings to defaults | -- | Yes |
| `create_folder` | Create an organizer folder | `organizer_input` | -- |
| `create_folder_with_items` | Create a folder with items | `organizer_input` | -- |
| `rename_folder` | Rename a folder | `organizer_input` | -- |
| `set_folder_children` | Set a folder's children | `organizer_input` | -- |
| `delete_entries` | Delete organizer entries | `organizer_input` | Yes |
| `move_entries_to_folder` | Move entries into a folder | `organizer_input` | -- |
| `move_items_to_position` | Move items to a position | `organizer_input` | -- |
| `update_view_preferences` | Update organizer view preferences | `organizer_input` | -- |
| `networks` | List Docker networks | -- | -- |
| `network_details` | Details for a specific network | `network_id` | -- |

Container identification supports name, ID, or partial name (fuzzy match).
Organizer subactions read their GraphQL variables from the `organizer_input`
dict (e.g. `{name, parentId, childrenIds, folderId, newName, entryIds,
sourceEntryIds, destinationFolderId, position, viewId, prefs}`). They confirm the
change by returning only the organizer `{version}` — re-query the layout
separately (via the Unraid UI/API) if you need the resolved folder tree.

#### `vm` (9 subactions)

Virtual machine lifecycle.

| Subaction | Description | Extra params | Destructive |
|-----------|-------------|-------------|-------------|
| `list` | All VMs with state | -- | -- |
| `details` | Single VM details | `vm_id` | -- |
| `start` | Start a VM | `vm_id` | -- |
| `stop` | Gracefully stop a VM | `vm_id` | -- |
| `pause` | Pause a VM | `vm_id` | -- |
| `resume` | Resume a paused VM | `vm_id` | -- |
| `reboot` | Reboot a VM | `vm_id` | -- |
| `force_stop` | Force stop a VM (no graceful shutdown) | `vm_id` | Yes |
| `reset` | Hard reset a VM | `vm_id` | Yes |

#### `notification` (13 subactions)

System notification management.

| Subaction | Description | Extra params | Destructive |
|-----------|-------------|-------------|-------------|
| `overview` | Notification counts (unread, archived by type) | -- | -- |
| `list` | List notifications | `list_type`, `limit`, `offset` | -- |
| `create` | Create a notification | `title`, `subject`, `description`, `importance` | -- |
| `notify_if_unique` | Create a notification only if an identical one does not already exist | `title`, `subject`, `description`, `importance` | -- |
| `archive` | Archive a notification | `notification_id` | -- |
| `mark_unread` | Mark a notification as unread | `notification_id` | -- |
| `recalculate` | Recalculate notification counts | -- | -- |
| `archive_all` | Archive all unread notifications | -- | -- |
| `archive_many` | Archive multiple notifications | `notification_ids` | -- |
| `unarchive_many` | Unarchive multiple notifications | `notification_ids` | -- |
| `unarchive_all` | Unarchive all archived notifications | -- | -- |
| `delete` | Delete a notification permanently | `notification_id`, `notification_type` | Yes |
| `delete_archived` | Delete all archived notifications | -- | Yes |

#### `key` (13 subactions)

API key and permission management.

| Subaction | Description | Extra params | Destructive |
|-----------|-------------|-------------|-------------|
| `list` | All API keys | -- | -- |
| `get` | Single key details | `key_id` | -- |
| `possible_roles` | All assignable roles | -- | -- |
| `possible_permissions` | All grantable resource/action permissions | -- | -- |
| `permissions_for_roles` | Permissions implied by given roles | `roles` | -- |
| `preview_permissions` | Effective permissions for roles/permissions | `roles`, `permissions_input` | -- |
| `auth_actions` | All available auth actions | -- | -- |
| `creation_form_schema` | JSON-schema form for key creation | -- | -- |
| `create` | Create a new key | `name`, `roles`, `permissions` | -- |
| `update` | Update a key | `key_id`, `name`, `roles`, `permissions` | -- |
| `delete` | Delete a key permanently | `key_id` | Yes |
| `add_role` | Add a role to a key | `key_id`, `roles` | -- |
| `remove_role` | Remove a role from a key | `key_id`, `roles` | -- |

#### `plugin` (8 subactions)

Plugin management and async installs.

| Subaction | Description | Extra params | Destructive |
|-----------|-------------|-------------|-------------|
| `list` | All installed plugins (structured) | `bundled` | -- |
| `installed_unraid` | Raw installed `.plg` filenames | `limit` | -- |
| `install_operations` | List async plugin-install operations | `limit` | -- |
| `install_operation` | Status of one install operation | `operation_id` | -- |
| `add` | Install plugins | `names` (list) | -- |
| `remove` | Uninstall plugins | `names` (list), `restart` | Yes |
| `install` | Async-install a `.plg` — runs code as root (poll via `install_operation`) | `url`, `plugin_name`, `forced` | Yes |
| `install_language` | Async-install a language pack — runs code as root | `url` | Yes |

#### `rclone` (4 subactions)

Cloud storage remote management.

| Subaction | Description | Extra params | Destructive |
|-----------|-------------|-------------|-------------|
| `list_remotes` | List configured rclone remotes | -- | -- |
| `config_form` | Get configuration form for a remote type | `provider_type` | -- |
| `create_remote` | Create a new remote | `name`, `provider_type`, `config_data` | -- |
| `delete_remote` | Delete a remote | `name` | Yes |

#### `setting` (6 subactions)

System settings, UPS, SSH, time, and server identity.

| Subaction | Description | Extra params | Destructive |
|-----------|-------------|-------------|-------------|
| `update` | Update system settings | `settings_input` | -- |
| `configure_ups` | Configure UPS settings | `ups_config` | Yes |
| `update_ssh` | Update SSH daemon settings | `config_input` (`{enabled, port}`) | Yes |
| `update_temperature` | Update temperature sensor config | `config_input` | -- |
| `update_system_time` | Update timezone / NTP / manual time — can invalidate TLS certs | `config_input` | Yes |
| `update_server_identity` | Update server name/comment/model | `name`, `comment`, `sys_model` | -- |

#### `connect` (8 subactions)

Unraid Connect / remote-access state and control.

| Subaction | Description | Extra params | Destructive |
|-----------|-------------|-------------|-------------|
| `remote_access` | Current remote-access settings | -- | -- |
| `cloud` | Unraid Connect / cloud status | -- | -- |
| `status` | Direct `connect` root status: dynamic remote access and settings schema; settings values omitted | -- | -- |
| `update_api_settings` | Update Connect API settings (affects internet reachability) | `connect_input` | Yes |
| `sign_in` | Sign the server in to Unraid Connect — registers with the cloud | `connect_input` (`{apiKey, userInfo?}`) | Yes |
| `sign_out` | Sign the server out of Unraid Connect | -- | Yes |
| `setup_remote_access` | Configure remote access (can expose server) | `connect_input` | Yes |
| `enable_dynamic_remote_access` | Toggle dynamic remote access | `connect_input` (`{url, enabled}`) | Yes |

#### `customization` (6 subactions)

Theme, locale, and UI customization.

| Subaction | Description | Extra params |
|-----------|-------------|-------------|
| `public_theme` | Public-facing theme (also the server's current theme) | -- |
| `is_initial_setup` | Whether this is a fresh install (`isFreshInstall`) | -- |
| `sso_enabled` | Check SSO status | -- |
| `details` | Direct `customization` root onboarding/language details; activation-code values omitted | -- |
| `set_theme` | Update theme | `theme_name` |
| `set_locale` | Update UI locale | `locale` |

Secret-sensitive fields are omitted by default: `server.apikey`, `connect.settings.values`, and raw activation-code values are not returned by the safe read subactions (`system/server_details`, `connect/status`, `customization/details`).

#### `oidc` (5 subactions)

OIDC/SSO provider management.

| Subaction | Description | Extra params |
|-----------|-------------|-------------|
| `providers` | List configured OIDC providers | -- |
| `provider` | Single provider details | `provider_id` |
| `configuration` | OIDC configuration | -- |
| `public_providers` | Public-facing provider list | -- |
| `validate_session` | Validate current SSO session | `token` |

#### `onboarding` (11 subactions)

First-boot / onboarding state and the internal boot context. The dangerous ones
require `confirm=True`.

| Subaction | Description | Extra params | Destructive |
|-----------|-------------|-------------|-------------|
| `internal_boot_context` | Internal boot / first-boot context | -- | -- |
| `complete` | Mark onboarding complete | -- | -- |
| `open` | Open the onboarding flow | -- | -- |
| `close` | Close the onboarding flow | -- | -- |
| `resume` | Resume onboarding | -- | -- |
| `bypass` | Bypass onboarding | -- | -- |
| `reset` | Reset onboarding/setup state | -- | Yes |
| `set_override` | Set an onboarding override | `onboarding_input` | -- |
| `clear_override` | Clear the onboarding override | -- | -- |
| `refresh_internal_boot_context` | Recompute the internal boot context | -- | -- |
| `create_internal_boot_pool` | Create an internal boot pool (formats devices, may reboot) | `onboarding_input` | Yes |

#### `user` (1 subaction)

| Subaction | Description |
|-----------|-------------|
| `me` | Current authenticated user info |

#### `live` (17 subactions)

Real-time WebSocket subscription snapshots. Returns a "connecting" placeholder on first call -- retry momentarily for live data.

| Subaction | Description | Extra params |
|-----------|-------------|-------------|
| `cpu` | Live CPU utilization | `collect_for` |
| `memory` | Live memory usage | `collect_for` |
| `cpu_telemetry` | Detailed CPU telemetry (power, temp) | `collect_for` |
| `array_state` | Live array state changes | `collect_for` |
| `parity_progress` | Live parity check progress | `collect_for` |
| `ups_status` | Live UPS status | `collect_for` |
| `notifications_overview` | Live notification counts | `collect_for` |
| `notifications_warnings` | Live warnings/alerts feed | `collect_for` |
| `owner` | Live owner info | `collect_for` |
| `server_status` | Live server status | `collect_for` |
| `display` | Live theme/display changes | `collect_for` |
| `docker_container_stats` | Live per-container CPU/memory/IO stats | `collect_for` |
| `temperature` | Live temperature sensor readings | `collect_for` |
| `network_metrics` | Live network throughput metrics | `collect_for` |
| `log_tail` | Live log tail stream | `path` (required), `collect_for` |
| `notification_feed` | Live notification feed | `collect_for` |
| `plugin_install_updates` | Live plugin-install progress stream | `operation_id` (required), `collect_for` |

> Note: `plugin_install_updates` requires `operation_id` — get one from `plugin/install`, then poll/stream by that id.

#### `subscriptions` (2 subactions)

WebSocket subscription diagnostics (formerly the standalone `diagnose_subscriptions` / `test_subscription_query` tools).

| Subaction | Description | Extra params |
|-----------|-------------|-------------|
| `diagnose` | Full diagnostic dump of the WebSocket subscription system (connection states, error counts, reconnect status, troubleshooting hints) | -- |
| `test_query` | Send a raw GraphQL subscription string over the WebSocket to debug schema/field issues (allowlisted fields only) | `subscription_query` (required) |

#### `help` (no subaction)

Returns this document as Markdown (formerly the standalone `unraid_help` tool).

```python
unraid(action="help")
```

## Destructive Operations

All destructive operations require `confirm=True`. Without it, interactive clients are prompted via MCP elicitation; non-interactive clients receive a `ToolError` instructing them to re-call with `confirm=True`.

### Destructive subactions summary

| Domain | Subaction | Risk |
|--------|-----------|------|
| `array` | `stop_array` | Stops array while containers/VMs may use shares |
| `array` | `remove_disk` | Removes disk from array |
| `array` | `clear_disk_stats` | Clears disk statistics permanently |
| `vm` | `force_stop` | Hard kills VM without graceful shutdown |
| `vm` | `reset` | Hard resets VM |
| `notification` | `delete` | Permanently deletes a notification |
| `notification` | `delete_archived` | Permanently deletes all archived notifications |
| `rclone` | `delete_remote` | Removes a cloud storage remote |
| `key` | `delete` | Permanently deletes an API key |
| `disk` | `flash_backup` | Triggers flash backup operation |
| `setting` | `configure_ups` | Modifies UPS configuration |
| `setting` | `update_ssh` | Can cut off remote shell access (disable SSH / change port) |
| `setting` | `update_system_time` | Clock changes can invalidate TLS certs / break time-sensitive services |
| `plugin` | `remove` | Uninstalls a plugin |
| `plugin` | `install` / `install_language` | Fetches and runs a `.plg` from a URL as root |
| `connect` | `sign_in` | Registers the server with the Unraid Connect cloud |
| `connect` | `update_api_settings` | Changes remote-access posture / internet reachability |
| `docker` | `remove_container` | Removes a container (and optionally its image) |
| `docker` | `reset_template_mappings` | Resets Docker template path mappings to defaults |
| `docker` | `delete_entries` | Deletes Docker organizer entries |
| `connect` | `sign_out` | Signs the server out of Unraid Connect |
| `connect` | `setup_remote_access` | Reconfigures remote access; can expose the server |
| `connect` | `enable_dynamic_remote_access` | Toggles dynamic remote access |
| `onboarding` | `reset` | Resets onboarding/setup state |
| `onboarding` | `create_internal_boot_pool` | Formats devices and may reboot the server |

## Error Responses

Errors use FastMCP's `ToolError` for user-facing messages:

- **ToolError** -- invalid action, subaction, or missing required parameter
- **CredentialsNotConfiguredError** -- surfaces setup instructions (plugin userConfig + `.env`)
- **TimeoutError** -- upstream Unraid API did not respond in time
- **GraphQL errors** -- converted to ToolError with descriptive messages

## Example Tool Calls

```python
# System overview
unraid(action="system", subaction="overview")

# Health check
unraid(action="health", subaction="check")

# List Docker containers
unraid(action="docker", subaction="list")

# Restart a specific container
unraid(action="docker", subaction="restart", container_id="plex")

# Live CPU monitoring for 3 seconds
unraid(action="live", subaction="cpu", collect_for=3.0)

# Tail a log file
unraid(action="live", subaction="log_tail", path="/var/log/syslog", collect_for=5.0)

# Stop array (destructive)
unraid(action="array", subaction="stop_array", confirm=True)

# List notifications (paginated)
unraid(action="notification", subaction="list", limit=10, list_type="UNREAD")
```

## See Also

- [SCHEMA.md](SCHEMA.md) -- Schema definitions behind these tools
- [AUTH.md](AUTH.md) -- Authentication required before tool calls
- [ENV.md](ENV.md) -- Environment variable configuration
- [ELICITATION.md](ELICITATION.md) -- Destructive action confirmation flows
