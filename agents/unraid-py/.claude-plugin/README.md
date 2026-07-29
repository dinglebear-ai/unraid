# Unraid MCP Plugin

Query, monitor, and manage Unraid servers via GraphQL API using a single consolidated `unraid` tool with action+subaction routing.

**Category:** Infrastructure | **Tags:** unraid, homelab, graphql, docker, virtualization

---

## Installation

```bash
/plugin marketplace add dinglebear-ai/unraid
/plugin install unraid-mcp@unraid-mcp
```

After install, Claude Code prompts for the plugin `userConfig` values:
**Unraid GraphQL API URL** and **Unraid API Key**. These are injected straight into
the server process by the plugin's `.mcp.json`, so no further setup is required.
Get an API key from **Unraid WebUI → Settings → Management Access → API Keys**.

To also persist them to `~/.unraid-mcp/.env` (useful when running the server
outside Claude Code), run `uvx unraid-mcp setup plugin-hook` once. This used to
happen automatically via a `SessionStart` hook; the plugin no longer ships hooks.

You can check credential status with:

```python
unraid(action="health", subaction="setup")
```

---

## Tools

### `unraid` — Primary Tool

Call as `unraid(action="<domain>", subaction="<operation>", [params])`.
For the complete current action/subaction reference, call `unraid(action="help")`.

#### `system` — Server Information

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

#### `health` — Diagnostics

| Subaction | Description |
|-----------|-------------|
| `check` | Comprehensive health check — connectivity, array, disks, containers, VMs, resources |
| `test_connection` | Test API connectivity and authentication |
| `diagnose` | Detailed diagnostic report with troubleshooting recommendations |
| `setup` | Report credential status and setup instructions |

#### `array` — Array & Parity

| Subaction | Description |
|-----------|-------------|
| `parity_status` | Current parity check progress and status |
| `parity_history` | Historical parity check results |
| `parity_start` | Start a parity check (requires `correct`) |
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

#### `disk` — Storage & Logs

| Subaction | Description |
|-----------|-------------|
| `shares` | List network shares |
| `disks` | All physical disks with health and temperatures |
| `disk_details` | Detailed info for a specific disk (requires `disk_id`) |
| `log_files` | List available log files |
| `logs` | Read log content (requires `log_path`; optional `tail_lines`) |
| `flash_backup` | ⚠️ Trigger a flash backup (requires `confirm=True`) |

#### `docker` — Containers

| Subaction | Description |
|-----------|-------------|
| `list` | All containers with status, image, state |
| `details` | Single container details (requires container identifier) |
| `ports` | All host port bindings across running containers, sorted by host port |
| `start` | Start a container (requires container identifier) |
| `stop` | Stop a container (requires container identifier) |
| `restart` | Restart a container (requires container identifier) |
| `networks` | List Docker networks |
| `network_details` | Details for a specific network (requires `network_id`) |

Container identification: name, ID, or partial name (fuzzy match).

#### `vm` — Virtual Machines

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

#### `notification` — Notifications

| Subaction | Description |
|-----------|-------------|
| `overview` | Notification counts (unread, archived by type) |
| `list` | List notifications (optional `filter`, `limit`, `offset`) |
| `create` | Create a notification (requires `title`, `subject`, `description`, `importance`) |
| `archive` | Archive a notification (requires `notification_id`) |
| `mark_unread` | Mark a notification as unread (requires `notification_id`) |
| `recalculate` | Recalculate notification counts |
| `archive_all` | Archive all unread notifications |
| `archive_many` | Archive multiple (requires `ids` list) |
| `unarchive_many` | Unarchive multiple (requires `ids` list) |
| `unarchive_all` | Unarchive all archived notifications |
| `delete` | ⚠️ Delete a notification (requires `notification_id`, `notification_type`, `confirm=True`) |
| `delete_archived` | ⚠️ Delete all archived (requires `confirm=True`) |

#### `key` — API Keys

| Subaction | Description |
|-----------|-------------|
| `list` | All API keys |
| `get` | Single key details (requires `key_id`) |
| `create` | Create a new key (requires `name`; optional `roles`, `permissions`) |
| `update` | Update a key (requires `key_id`) |
| `delete` | ⚠️ Delete a key (requires `key_id`, `confirm=True`) |
| `add_role` | Add roles to a key (requires `key_id`, `roles`) |
| `remove_role` | Remove roles from a key (requires `key_id`, `roles`) |

#### `plugin` — Plugins

| Subaction | Description |
|-----------|-------------|
| `list` | All installed plugins |
| `add` | Install plugins (requires `names` list) |
| `remove` | ⚠️ Uninstall plugins (requires `names` list, `confirm=True`) |

#### `rclone` — Cloud Storage

| Subaction | Description |
|-----------|-------------|
| `list_remotes` | List configured rclone remotes |
| `config_form` | Get configuration form for a remote type |
| `create_remote` | Create a new remote (requires `name`, `provider_type`, `config_data`) |
| `delete_remote` | ⚠️ Delete a remote (requires `name`, `confirm=True`) |

#### `setting` — System Settings

| Subaction | Description |
|-----------|-------------|
| `update` | Update system settings (requires `settings_input` object) |
| `configure_ups` | ⚠️ Configure UPS settings (requires `confirm=True`) |

#### `connect` — Unraid Connect / Remote Access

| Subaction | Description |
|-----------|-------------|
| `remote_access` | Current remote-access settings (access/forward type, port) |
| `cloud` | Unraid Connect / cloud status (relay, minigraph, API key validity) |
| `status` | Direct `connect` root status: dynamic remote access and settings metadata; settings values and schemas omitted |
| `update_api_settings` | ⚠️ Update Connect API settings (requires `connect_input`: `{accessType?, forwardType?, port?}`, `confirm=True`) |
| `sign_in` | ⚠️ Sign the server in to Unraid Connect (requires `connect_input`, `confirm=True`) |
| `sign_out` | ⚠️ Sign the server out of Unraid Connect (requires `confirm=True`) |
| `setup_remote_access` | ⚠️ Configure remote access (requires `connect_input`, `confirm=True`) |
| `enable_dynamic_remote_access` | ⚠️ Toggle dynamic remote access (requires `connect_input`, `confirm=True`) |

#### `customization` — Theme & Appearance

| Subaction | Description |
|-----------|-------------|
| `public_theme` | Public-facing theme |
| `is_initial_setup` | Whether this is a fresh install (`isFreshInstall`) |
| `sso_enabled` | Check SSO status |
| `details` | Direct `customization` root onboarding/language details; activation-code values omitted |
| `set_theme` | Update theme (requires `theme_name`) |
| `set_locale` | Update UI locale (requires `locale`) |

Secret-sensitive fields are omitted by default: `server.apikey`, `connect.settings.values`, and raw activation-code values are not returned by the safe read subactions (`system/server_details`, `connect/status`, `customization/details`).

#### `oidc` — SSO / OpenID Connect

| Subaction | Description |
|-----------|-------------|
| `providers` | List configured OIDC providers |
| `provider` | Single provider details (requires `provider_id`) |
| `configuration` | OIDC configuration |
| `public_providers` | Public-facing provider list |
| `validate_session` | Validate current SSO session (requires `token`) |

#### `user` — Current User

| Subaction | Description |
|-----------|-------------|
| `me` | Current authenticated user info |

#### `live` — Real-Time Subscriptions

Persistent WebSocket connections. Returns `{"status": "connecting"}` on first call — retry momentarily.

| Subaction | Description |
|-----------|-------------|
| `cpu` | Live CPU utilization |
| `memory` | Live memory usage |
| `cpu_telemetry` | Detailed CPU telemetry |
| `array_state` | Live array state changes |
| `parity_progress` | Live parity check progress |
| `ups_status` | Live UPS status |
| `notifications_overview` | Live notification counts |
| `owner` | Live owner info |
| `server_status` | Live server status |
| `log_tail` | Live log tail stream (requires `path`) |
| `notification_feed` | Live notification feed |

---

#### `subscriptions` — Subscription Diagnostics

Inspect WebSocket subscription connection states, errors, and URLs:

```python
unraid(action="subscriptions", subaction="diagnose")
```

Test a specific GraphQL subscription query against the live Unraid API. Uses an
allowlisted set of safe fields only:

```python
unraid(
    action="subscriptions",
    subaction="test_query",
    subscription_query="subscription { arraySubscription { state } }",
)
```

---

## Destructive Actions

All destructive subactions require `confirm=True`. Without it, the action is
blocked before any GraphQL request is sent. For the complete current destructive
action list, call `unraid(action="help")` or see `unraid-py/docs/mcp/TOOLS.md`.

---

## Support

- **Issues:** https://github.com/dinglebear-ai/unraid/issues
- **Repository:** https://github.com/dinglebear-ai/unraid
- **Skill docs:** `skills/unraid/SKILL.md`
- **API reference:** `skills/unraid/references/`
