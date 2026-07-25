---
name: unraid
description: "This skill should be used when the user mentions Unraid, asks to check server health, monitor array or disk status, list or restart Docker containers, start or stop VMs, read system logs, check parity status, view notifications, manage API keys, configure rclone remotes, check UPS or power status, get live CPU or memory data, force stop a VM, check disk temperatures, or perform any operation on an Unraid NAS server. Also use when the user needs to set up or configure Unraid MCP credentials."
---

# Unraid MCP Skill

## Mode Detection

**MCP mode** (preferred): Use when `mcp__unraid-mcp__unraid` tool is available.

**HTTP fallback**: Use when MCP tools are unavailable. Credentials live in the file
`~/.unraid-mcp/.env`; load it before running `curl` (see "HTTP Fallback Mode" below).
Do NOT use `$CLAUDE_PLUGIN_OPTION_*` in the Bash tool — Claude Code injects those vars
only into plugin subprocesses (hooks/MCP/LSP), not the Bash tool. The plugin's setup
hook reads them and materializes `~/.unraid-mcp/.env`; the skill loads that file via
`load-env.sh` (which parses it, never executes it).

---

Use the single `unraid` MCP tool with `action` (domain) + `subaction` (operation) for all Unraid operations.

## Setup

Credentials come from the plugin's configuration form (*Unraid GraphQL API URL* /
*Unraid API Key*) or a hand-edited `~/.unraid-mcp/.env`. They are read once at server
startup, so after changing them you must restart the server / MCP client.

To check whether credentials are configured and the connection works:

```text
unraid(action="health", subaction="setup")            # read-only status + instructions
unraid(action="health", subaction="test_connection")  # verify connectivity
```

`setup` does not prompt for or write credentials — it only reports the current status
and explains how to set them.

## Calling Convention

```text
unraid(action="<domain>", subaction="<operation>", [additional params])
```

**Examples:**
```text
unraid(action="system",  subaction="overview")
unraid(action="docker",  subaction="list")
unraid(action="health",  subaction="check")
unraid(action="array",   subaction="parity_status")
unraid(action="disk",    subaction="disks")
unraid(action="vm",      subaction="list")
unraid(action="notification", subaction="overview")
unraid(action="live",    subaction="cpu")
```

---

## All Domains and Subactions

### `system` — Server Information

| Subaction | Description |
|-----------|-------------|
| `overview` | Complete system summary (recommended starting point) |
| `server` | Hostname, version, uptime |
| `servers` | All known Unraid servers |
| `array` | Array status and disk list |
| `network` | Network interfaces and config |
| `registration` | License and registration status |
| `variables` | Environment variables |
| `metrics` | Real-time CPU, memory, I/O usage |
| `services` | Running services status |
| `display` | Display settings |
| `display_details` | Direct `display` root metadata: case, theme, temperature display settings, thresholds, locale |
| `config` | System configuration |
| `online` | Quick online status check |
| `owner` | Server owner information |
| `settings` | User settings and preferences |
| `server_details` | Direct `server` root details with owner and URLs; API key omitted |
| `network_access_urls` | Direct `network.accessUrls` entries with type, name, IPv4, and IPv6 |
| `flash` | USB flash drive details |
| `ups_devices` | List all UPS devices |
| `ups_device` | Single UPS device (requires `device_id`) |
| `ups_config` | UPS configuration |
| `server_time` | Current server time, time zone, and NTP config |
| `timezones` | Available IANA time-zone options |

### `health` — Diagnostics

| Subaction | Description |
|-----------|-------------|
| `check` | Comprehensive health check — connectivity, array, disks, containers, VMs, resources |
| `test_connection` | Test API connectivity and authentication |
| `diagnose` | Detailed diagnostic report with troubleshooting recommendations |
| `setup` | Report credential status + setup instructions (read-only; does not write or prompt) |

### `array` — Array & Parity

| Subaction | Description |
|-----------|-------------|
| `parity_status` | Current parity check progress and status |
| `parity_history` | Historical parity check results |
| `assignable_disks` | Physical disks not yet in the array (discovery counterpart to `add_disk`) |
| `parity_start` | Start a parity check (requires `correct` — `True` writes corrections, `False` checks only) |
| `parity_pause` | Pause a running parity check |
| `parity_resume` | Resume a paused parity check |
| `parity_cancel` | Cancel a running parity check |
| `start_array` | Start the array |
| `stop_array` | ⚠️ Stop the array (requires `confirm=True`) |
| `add_disk` | Add a disk to the array (requires `slot`, `id`) |
| `remove_disk` | ⚠️ Remove a disk (requires `slot`, `confirm=True`) |
| `mount_disk` | Mount a disk |
| `unmount_disk` | Unmount a disk |
| `clear_disk_stats` | ⚠️ Clear disk statistics (requires `confirm=True`) |

### `disk` — Storage & Logs

| Subaction | Description |
|-----------|-------------|
| `shares` | List network shares |
| `disks` | All physical disks with health and temperatures |
| `disk_details` | Detailed info for a specific disk (requires `disk_id`) |
| `log_files` | List available log files |
| `logs` | Read log content (requires `log_path`; optional `tail_lines`) |
| `flash_backup` | ⚠️ Trigger a flash backup (requires `confirm=True`) |

### `docker` — Containers

| Subaction | Description |
|-----------|-------------|
| `list` | All containers with status, image, state |
| `details` | Single container details (requires container identifier) |
| `start` | Start a container (requires container identifier) |
| `stop` | Stop a container (requires container identifier) |
| `restart` | Restart a container (requires container identifier; stop+start composite) |
| `unpause` | Unpause a paused container (requires container identifier) |
| `remove_container` | ⚠️ Remove a container (requires container identifier, `confirm=True`; optional `with_image`) |
| `update_container` | Apply a pending image update to one container (requires container identifier) |
| `update_containers` | Apply image updates to several containers (requires `container_ids`) |
| `update_all_containers` | Apply all pending container image updates |
| `update_autostart` | Set container autostart config (requires `autostart_entries`: `[{id, autoStart, wait?}]`) |
| `refresh_digests` | Refresh image digests (recheck for available updates) |
| `sync_template_paths` | Sync Docker template paths |
| `reset_template_mappings` | ⚠️ Reset template path mappings to defaults (requires `confirm=True`) |
| `create_folder` | Create an organizer folder (requires `organizer_input`: `{name, parentId?, childrenIds?}`) |
| `create_folder_with_items` | Create a folder containing items (`organizer_input`: `{name, parentId?, sourceEntryIds?, position?}`) |
| `rename_folder` | Rename a folder (`organizer_input`: `{folderId, newName}`) |
| `set_folder_children` | Set a folder's children (`organizer_input`: `{childrenIds, folderId?}`) |
| `delete_entries` | ⚠️ Delete organizer entries (`organizer_input`: `{entryIds}`, `confirm=True`) |
| `move_entries_to_folder` | Move entries into a folder (`organizer_input`: `{sourceEntryIds, destinationFolderId}`) |
| `move_items_to_position` | Move items to a position (`organizer_input`: `{sourceEntryIds, destinationFolderId, position}`) |
| `update_view_preferences` | Update organizer view prefs (`organizer_input`: `{prefs, viewId?}`) |
| `networks` | List Docker networks |
| `network_details` | Details for a specific network (requires `network_id`) |

**Container Identification:** Name, ID, or partial name (fuzzy match supported).

### `vm` — Virtual Machines

| Subaction | Description |
|-----------|-------------|
| `list` | All VMs with state |
| `details` | Single VM details (requires `vm_id`) |
| `start` | Start a VM (requires `vm_id`) |
| `stop` | Gracefully stop a VM (requires `vm_id`) |
| `pause` | Pause a VM (requires `vm_id`) |
| `resume` | Resume a paused VM (requires `vm_id`) |
| `reboot` | Reboot a VM (requires `vm_id`) |
| `force_stop` | ⚠️ Force stop a VM (requires `vm_id`, `confirm=True`) |
| `reset` | ⚠️ Hard reset a VM (requires `vm_id`, `confirm=True`) |

### `notification` — Notifications

| Subaction | Description |
|-----------|-------------|
| `overview` | Notification counts (unread, archived by type) |
| `list` | List notifications (requires `list_type`: `UNREAD`/`ARCHIVE`; optional `importance`, `limit`, `offset`) |
| `mark_unread` | Mark a notification as unread (requires `notification_id`) |
| `create` | Create a notification (requires `title`, `subject`, `description`, `importance`) |
| `archive` | Archive a notification (requires `notification_id`) |
| `delete` | ⚠️ Delete a notification (requires `notification_id`, `notification_type`, `confirm=True`) |
| `delete_archived` | ⚠️ Delete all archived (requires `confirm=True`) |
| `archive_all` | Archive all unread notifications |
| `archive_many` | Archive multiple (requires `ids` list) |
| `unarchive_many` | Unarchive multiple (requires `ids` list) |
| `unarchive_all` | Unarchive all archived notifications |
| `recalculate` | Recalculate notification counts |

### `key` — API Keys

| Subaction | Description |
|-----------|-------------|
| `list` | All API keys |
| `get` | Single key details (requires `key_id`) |
| `possible_roles` | All assignable roles |
| `possible_permissions` | All grantable resource/action permissions |
| `permissions_for_roles` | Permissions implied by given `roles` |
| `preview_permissions` | Effective permissions for `roles` and/or `permissions_input` (`[{resource, actions}]`) |
| `auth_actions` | All available auth actions |
| `creation_form_schema` | JSON-schema form for key creation |
| `create` | Create a new key (requires `name`; optional `roles`, `permissions`) |
| `update` | Update a key (requires `key_id`) |
| `delete` | ⚠️ Delete a key (requires `key_id`, `confirm=True`) |
| `add_role` | Add a role to a key (requires `key_id`, `roles`) |
| `remove_role` | Remove a role from a key (requires `key_id`, `roles`) |

### `plugin` — Plugins

| Subaction | Description |
|-----------|-------------|
| `list` | All installed plugins (structured) |
| `installed_unraid` | Raw installed `.plg` filenames |
| `install_operations` | List async plugin-install operations |
| `install_operation` | Status of one install operation (requires `operation_id`) |
| `add` | Install plugins (requires `names` — list of plugin names) |
| `remove` | ⚠️ Uninstall plugins (requires `names` — list of plugin names, `confirm=True`) |
| `install` | ⚠️ Async-install a `.plg` — runs code as root (requires `url`, `confirm=True`; optional `plugin_name`, `forced`) — poll via `install_operation` |
| `install_language` | ⚠️ Async-install a language pack — runs code as root (requires `url`, `confirm=True`) |

### `rclone` — Cloud Storage

| Subaction | Description |
|-----------|-------------|
| `list_remotes` | List configured rclone remotes |
| `config_form` | Get configuration form for a remote type |
| `create_remote` | Create a new remote (requires `name`, `provider_type`, `config_data`) |
| `delete_remote` | ⚠️ Delete a remote (requires `name`, `confirm=True`) |

### `setting` — System Settings

| Subaction | Description |
|-----------|-------------|
| `update` | Update system settings (requires `settings_input` object) |
| `configure_ups` | ⚠️ Configure UPS settings (requires `confirm=True`) |
| `update_ssh` | ⚠️ Update SSH daemon settings (requires `config_input`: `{enabled, port}`, `confirm=True`) |
| `update_temperature` | Update temperature sensor config (requires `config_input`) |
| `update_system_time` | ⚠️ Update timezone / NTP / manual time — can invalidate TLS certs (requires `config_input`, `confirm=True`) |
| `update_server_identity` | Update server name/comment/model (requires `name`; optional `comment`, `sys_model`) |

### `connect` — Unraid Connect / Remote Access

All mutations change the server's cloud/remote-access posture and require `confirm=True`.

| Subaction | Description |
|-----------|-------------|
| `remote_access` | Current remote-access settings (access/forward type, port) |
| `cloud` | Unraid Connect / cloud status (relay, minigraph, API key validity) |
| `status` | Direct `connect` root status: dynamic remote access and settings schema; settings values omitted |
| `update_api_settings` | ⚠️ Update Connect API settings (requires `connect_input`: `{accessType?, forwardType?, port?}`, `confirm=True`) |
| `sign_in` | ⚠️ Sign the server in to Unraid Connect — registers with the cloud (requires `connect_input`: `{apiKey, userInfo?}`, `confirm=True`) |
| `sign_out` | ⚠️ Sign the server out of Unraid Connect (requires `confirm=True`) |
| `setup_remote_access` | ⚠️ Configure remote access — can expose the server (requires `connect_input`, `confirm=True`) |
| `enable_dynamic_remote_access` | ⚠️ Toggle dynamic remote access (requires `connect_input`: `{url, enabled}`, `confirm=True`) |

### `customization` — Theme & Appearance

| Subaction | Description |
|-----------|-------------|
| `public_theme` | Public-facing theme (also the server's current theme; or use `system/display`) |
| `is_initial_setup` | Whether this is a fresh install (`isFreshInstall`) |
| `sso_enabled` | Check SSO status |
| `details` | Direct `customization` root onboarding/language details; activation-code values omitted |
| `set_theme` | Update theme (requires `theme_name`) |
| `set_locale` | Update UI locale (requires `locale`) |

Secret-sensitive fields are omitted by default: `server.apikey`, `connect.settings.values`, and raw activation-code values are not returned by the safe read subactions (`system/server_details`, `connect/status`, `customization/details`).

### `oidc` — SSO / OpenID Connect

| Subaction | Description |
|-----------|-------------|
| `providers` | List configured OIDC providers |
| `provider` | Single provider details (requires `provider_id`) |
| `configuration` | OIDC configuration |
| `public_providers` | Public-facing provider list |
| `validate_session` | Validate current SSO session (requires `token`) |

### `onboarding` — First-Boot / Setup State

Operate on the server's onboarding/setup state. Rarely needed on a configured
production server; the dangerous ones require `confirm=True`.

| Subaction | Description |
|-----------|-------------|
| `internal_boot_context` | Internal boot / first-boot context (array stopped, boot eligibility, pools) |
| `complete` | Mark onboarding complete |
| `open` | Open the onboarding flow |
| `close` | Close the onboarding flow |
| `resume` | Resume onboarding |
| `bypass` | Bypass onboarding |
| `reset` | ⚠️ Reset onboarding/setup state (requires `confirm=True`) |
| `set_override` | Set an onboarding override (requires `onboarding_input`) |
| `clear_override` | Clear the onboarding override |
| `refresh_internal_boot_context` | Recompute the internal boot context |
| `create_internal_boot_pool` | ⚠️ Create an internal boot pool — FORMATS devices, may REBOOT (requires `onboarding_input`, `confirm=True`) |

### `user` — Current User

| Subaction | Description |
|-----------|-------------|
| `me` | Current authenticated user info |

### `live` — Real-Time Subscriptions
These use persistent WebSocket connections. Returns a "connecting" placeholder on the first call — retry momentarily for live data.

| Subaction | Description |
|-----------|-------------|
| `cpu` | Live CPU utilization |
| `memory` | Live memory usage |
| `cpu_telemetry` | Detailed CPU telemetry |
| `array_state` | Live array state changes |
| `parity_progress` | Live parity check progress |
| `ups_status` | Live UPS status |
| `notifications_overview` | Live notification counts |
| `notifications_warnings` | Live warnings/alerts feed (filtered) |
| `owner` | Live owner info |
| `server_status` | Live server status |
| `display` | Live theme/display changes |
| `docker_container_stats` | Live per-container CPU/memory/IO stats |
| `temperature` | Live temperature sensor readings |
| `log_tail` | Live log tail stream |
| `notification_feed` | Live notification feed |
| `plugin_install_updates` | Live plugin-install progress stream (requires `operation_id`) |

---

## Destructive Actions

All require `confirm=True` as an explicit parameter. Without it, the action is blocked: interactive MCP clients are asked to confirm (elicitation), and non-interactive callers get a `ToolError` — re-run with `confirm=True`.

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
| `connect` | `sign_in` / `update_api_settings` | Registers with the cloud / changes internet reachability |
| `docker` | `remove_container` | Removes a container (and optionally its image) |
| `docker` | `reset_template_mappings` | Resets Docker template path mappings to defaults |
| `docker` | `delete_entries` | Deletes Docker organizer entries |
| `connect` | `sign_out` | Signs the server out of Unraid Connect |
| `connect` | `setup_remote_access` | Reconfigures remote access; can expose the server to the internet |
| `connect` | `enable_dynamic_remote_access` | Toggles dynamic remote access |
| `onboarding` | `reset` | Resets onboarding/setup state |
| `onboarding` | `create_internal_boot_pool` | Formats devices and may reboot the server |

---

## Common Workflows

### Verify credentials
```text
unraid(action="health", subaction="setup")            # status + instructions (read-only)
unraid(action="health", subaction="test_connection")  # confirm connectivity
```

### System health overview
```text
unraid(action="system", subaction="overview")
unraid(action="health", subaction="check")
```

### Container management
```text
unraid(action="docker", subaction="list")
unraid(action="docker", subaction="details", container_id="plex")
unraid(action="docker", subaction="restart", container_id="sonarr")
```

### Array and disk status
```text
unraid(action="array",  subaction="parity_status")
unraid(action="disk",   subaction="disks")
unraid(action="system", subaction="array")
```

### Read logs
```text
unraid(action="disk", subaction="log_files")
unraid(action="disk", subaction="logs", log_path="/var/log/syslog", tail_lines=50)
```

### Live monitoring
```text
unraid(action="live", subaction="cpu")
unraid(action="live", subaction="memory")
unraid(action="live", subaction="array_state")
```

### VM operations
```text
unraid(action="vm", subaction="list")
unraid(action="vm", subaction="start",      vm_id="<id>")
unraid(action="vm", subaction="force_stop", vm_id="<id>", confirm=True)
```

---

## Notes

- **Rate limit:** 100 requests / 10 seconds
- **Log path validation:** Only `/var/log/`, `/boot/logs/`, `/mnt/` prefixes accepted
- **Container logs:** Docker container stdout/stderr are NOT accessible via API — use SSH + `docker logs`
- **`arraySubscription`:** Known Unraid API bug — `live/array_state` may show "connecting" indefinitely
- **Event-driven subs** (`notifications_overview`, `owner`, `server_status`, `ups_status`): Only populate cache on first real server event

---

## HTTP Fallback Mode

When MCP tools are unavailable, query the GraphQL API directly with `curl`. Load the
credentials first — `$CLAUDE_PLUGIN_OPTION_*` is **not** set in the Bash tool, so read
`~/.unraid-mcp/.env` (which the plugin's setup hook materializes) instead. Source the
bundled `load-env.sh` library and call its loader (it parses the `.env`, never executes it):

```bash
# Load UNRAID_API_URL / UNRAID_API_KEY from ~/.unraid-mcp/.env
source "$CLAUDE_PLUGIN_ROOT/skills/unraid/load-env.sh"
load_unraid_credentials || exit 1

# System overview
curl -s "$UNRAID_API_URL" \
  -H "x-api-key: $UNRAID_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ info { os { hostname uptime } } }"}'

# List Docker containers
curl -s "$UNRAID_API_URL" \
  -H "x-api-key: $UNRAID_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ docker { containers { names state status } } }"}'

# Array status
curl -s "$UNRAID_API_URL" \
  -H "x-api-key: $UNRAID_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ array { state capacity { kilobytes { free used total } } disks { name status temp } } }"}'
```

Or use the helper script, which sources `load-env.sh` automatically:

```bash
"$CLAUDE_PLUGIN_ROOT/skills/unraid/scripts/unraid-query.sh" -q "{ online }"
```
