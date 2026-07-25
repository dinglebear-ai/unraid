# Unraid MCP

<!-- mcp-name: tv.tootie/unraid-mcp -->

[![PyPI](https://img.shields.io/pypi/v/unraid-mcp)](https://pypi.org/project/unraid-mcp/) [![ghcr.io](https://img.shields.io/badge/ghcr.io-jmagar%2Funraid--mcp-blue?logo=docker)](https://github.com/jmagar/unraid-mcp/pkgs/container/unraid-mcp)

MCP server for Unraid NAS management. Exposes a single unified `unraid` tool with 19 action domains and 178 subactions, backed by Unraid's GraphQL API and real-time WebSocket subscriptions.

## Overview

A single MCP tool is exposed:

| Tool | Purpose |
| --- | --- |
| `unraid` | Unified action/subaction router for all operations (19 actions, 178 subactions). The Markdown reference and WebSocket diagnostics, which used to be standalone tools, are now the `help` and `subscriptions` actions of this tool. |

Discover the full surface with `unraid(action="help")`. WebSocket subscription diagnostics are available via `unraid(action="subscriptions", subaction="diagnose")` and `unraid(action="subscriptions", subaction="test_query", subscription_query=...)`.

The server supports streamable-http (default), stdio, and legacy SSE (deprecated and removed in v3.0.0). HTTP transports require RFC 6750 bearer authentication via `UNRAID_MCP_BEARER_TOKEN`.

## What this repository ships

- `src/unraid_mcp/server.py`: FastMCP server with 4-layer middleware chain and ASGI bearer auth
- `src/unraid_mcp/tools/`: 17 domain modules (array, connect, customization, disk, docker, health, key, live, notification, oidc, onboarding, plugin, rclone, setting, system, user, vm) plus the consolidated `unraid.py` router
- `src/unraid_mcp/subscriptions/`: WebSocket subscription manager, resource registration, diagnostics, and snapshot queries
- `src/unraid_mcp/core/`: GraphQL client, plugin-option credential setup, destructive action guards, auth middleware
- `src/unraid_mcp/config/`: Settings management and structured logging
- `skills/unraid/SKILL.md`: Client-facing skill documentation
- `.claude-plugin/plugin.json`, `.codex-plugin/plugin.json`, `gemini-extension.json`: Client manifests
- `docker-compose.yaml`, `Dockerfile`, `entrypoint.sh`: Container deployment
- `scripts/`: Security checks, dependency audits, and plugin validation
- `hooks/`: Post-tool hooks for env permissions and gitignore enforcement

## Tools

### `unraid`

Single entry point for all Unraid operations. Select the operation with `action` + `subaction`.

| Action | Subactions | Description |
| --- | --- | --- |
| `system` (25) | `overview`, `array`, `network`, `registration`, `variables`, `metrics`, `network_metrics`, `services`, `display`, `display_details`, `config`, `online`, `owner`, `settings`, `server`, `server_details`, `servers`, `network_access_urls`, `flash`, `ups_devices`, `ups_device`, `ups_config`, `server_time`, `timezones`, `network_interfaces` | Server info, metrics, network, UPS |
| `health` (4) | `check`, `test_connection`, `diagnose`, `setup` | Health checks, connection test, credential setup |
| `array` (14) | `parity_status`, `parity_history`, `assignable_disks`, `parity_start`, `parity_pause`, `parity_resume`, `parity_cancel`, `start_array`, `stop_array`\*, `add_disk`, `remove_disk`\*, `mount_disk`, `unmount_disk`, `clear_disk_stats`\* | Parity checks, array lifecycle, disk operations |
| `disk` (6) | `shares`, `disks`, `disk_details`, `log_files`, `logs`, `flash_backup`\* | Shares, physical disks, log files |
| `docker` (26) | `list`, `details`, `logs`, `ports`, `start`, `stop`, `restart`, `unpause`, `networks`, `network_details`, `remove_container`\*, `update_container`, `update_containers`, `update_all_containers`, `update_autostart`, `refresh_digests`, `sync_template_paths`, `reset_template_mappings`\*, `create_folder`, `create_folder_with_items`, `rename_folder`, `set_folder_children`, `delete_entries`\*, `move_entries_to_folder`, `move_items_to_position`, `update_view_preferences` | Container lifecycle, updates, organizer folders, network inspection |
| `vm` (9) | `list`, `details`, `start`, `stop`, `pause`, `resume`, `force_stop`\*, `reboot`, `reset`\* | Virtual machine lifecycle |
| `notification` (13) | `overview`, `list`, `create`, `notify_if_unique`, `archive`, `mark_unread`, `recalculate`, `archive_all`, `archive_many`, `unarchive_many`, `unarchive_all`, `delete`\*, `delete_archived`\* | Notification CRUD |
| `key` (13) | `list`, `get`, `possible_roles`, `possible_permissions`, `permissions_for_roles`, `preview_permissions`, `auth_actions`, `creation_form_schema`, `create`, `update`, `delete`\*, `add_role`, `remove_role` | API key and permission management |
| `plugin` (8) | `list`, `installed_unraid`, `install_operations`, `install_operation`, `add`, `remove`\*, `install`\*, `install_language`\* | Plugin management and async installs |
| `rclone` (4) | `list_remotes`, `config_form`, `create_remote`, `delete_remote`\* | Cloud storage remotes |
| `setting` (6) | `update`, `configure_ups`\*, `update_ssh`\*, `update_temperature`, `update_system_time`\*, `update_server_identity` | System settings, UPS, SSH, time, identity |
| `connect` (8) | `remote_access`, `cloud`, `status`, `update_api_settings`\*, `sign_in`\*, `sign_out`\*, `setup_remote_access`\*, `enable_dynamic_remote_access`\* | Unraid Connect / remote access |
| `customization` (6) | `public_theme`, `is_initial_setup`, `sso_enabled`, `details`, `set_theme`, `set_locale` | Theme, locale, and UI customization |
| `oidc` (5) | `providers`, `provider`, `configuration`, `public_providers`, `validate_session` | OIDC/SSO provider management |
| `onboarding` (11) | `internal_boot_context`, `complete`, `open`, `close`, `resume`, `bypass`, `reset`\*, `set_override`, `clear_override`, `refresh_internal_boot_context`, `create_internal_boot_pool`\* | First-boot / onboarding state |
| `user` (1) | `me` | Current authenticated user |
| `live` (17) | `cpu`, `memory`, `cpu_telemetry`, `array_state`, `parity_progress`, `ups_status`, `notifications_overview`, `notifications_warnings`, `notification_feed`, `log_tail`, `owner`, `server_status`, `display`, `docker_container_stats`, `temperature`, `network_metrics`, `plugin_install_updates` | Real-time WebSocket subscription snapshots |
| `subscriptions` (2) | `diagnose`, `test_query` (needs `subscription_query=`) | WebSocket subscription diagnostics |
| `help` (0) | _(no subaction)_ | Returns the full Markdown action/subaction reference |

\* Destructive -- requires `confirm=True`

Secret-sensitive fields are omitted by default: `server.apikey`, `connect.settings.values`, and raw activation-code values are not returned by the safe read subactions (`system/server_details`, `connect/status`, `customization/details`).

### `help` action

Returns the full action reference as Markdown. Call this to discover available actions.

```python
unraid(action="help")
```

## Installation

### Marketplace

```bash
/plugin marketplace add jmagar/unraid-mcp
/plugin install unraid-mcp@unraid-mcp
```

### Local development

```bash
uv sync --dev
uv run unraid-mcp-server
```

### Docker

```bash
just up
```

Or manually:

```bash
docker compose up -d
```

## Authentication

The MCP server uses bearer token authentication for HTTP transports (streamable-http, SSE).

A token is auto-generated on first HTTP startup if none is configured. It is written to `~/.unraid-mcp/.env`.

To generate manually:

```bash
openssl rand -hex 32
```

Set it in `~/.unraid-mcp/.env`:

```bash
UNRAID_MCP_BEARER_TOKEN=<generated-token>
```

Configure your MCP client to send the token as a Bearer header. See [AUTH](mcp/AUTH.md) for detailed setup.

To disable auth (only behind a trusted reverse proxy):

```bash
UNRAID_MCP_DISABLE_HTTP_AUTH=true
```

## Configuration

Copy `.env.example` to `~/.unraid-mcp/.env` and fill in the required values:

```bash
mkdir -p ~/.unraid-mcp
cp .env.example ~/.unraid-mcp/.env
chmod 600 ~/.unraid-mcp/.env
```

Or, as a Claude Code plugin, set the *Unraid GraphQL API URL* / *Unraid API Key*
fields in the plugin config form — the setup hook persists them to `~/.unraid-mcp/.env`.
Check status any time with:

```python
unraid(action="health", subaction="setup")
```

### Environment variables

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `UNRAID_API_URL` | yes | -- | Unraid GraphQL endpoint (e.g. `https://tower.local/graphql`) |
| `UNRAID_API_KEY` | yes | -- | Unraid API key (Settings > Management Access > API Keys) |
| `UNRAID_MCP_BEARER_TOKEN` | yes\* | auto-generated | Bearer token for MCP HTTP auth |
| `UNRAID_MCP_PORT` | no | `6970` | Port for the MCP HTTP server |

\*Required when `UNRAID_MCP_TRANSPORT != stdio` and `UNRAID_MCP_DISABLE_HTTP_AUTH != true`.

See [CONFIG](CONFIG.md) for all variables including logging, SSL, subscriptions, and Docker settings.

## Quick start

```python
# First-time setup
unraid(action="health", subaction="setup")

# System overview
unraid(action="system", subaction="overview")

# Health check
unraid(action="health", subaction="check")

# List Docker containers
unraid(action="docker", subaction="list")

# Restart a container
unraid(action="docker", subaction="restart", container_id="plex")

# Parity status
unraid(action="array", subaction="parity_status")

# Live CPU monitoring
unraid(action="live", subaction="cpu")

# Stop array (destructive)
unraid(action="array", subaction="stop_array", confirm=True)
```

## Docker usage

```bash
# Build and start
just up

# View logs
just logs

# Health check
just health
# or: curl http://localhost:6970/health

# Stop
just down
```

The `/health` endpoint is unauthenticated for liveness probes.

## Related plugins

| Plugin | Category | Description |
|--------|----------|-------------|
| [homelab-core](https://github.com/jmagar/claude-homelab) | core | Core agents, commands, skills, and setup/health workflows for homelab management. |
| [overseerr-mcp](https://github.com/jmagar/overseerr-mcp) | media | Search movies and TV shows, submit requests, and monitor failed requests via Overseerr. |
| [unifi-mcp](https://github.com/jmagar/unifi-mcp) | infrastructure | Monitor and manage UniFi devices and network health. |
| [swag-mcp](https://github.com/jmagar/swag-mcp) | infrastructure | Manage SWAG nginx reverse proxy configurations. |
| [synapse-mcp](https://github.com/jmagar/synapse-mcp) | infrastructure | Docker management and SSH remote operations across homelab hosts. |
| [arcane-mcp](https://github.com/jmagar/arcane-mcp) | infrastructure | Manage Docker environments, containers, images, volumes, and networks. |
| [syslog-mcp](https://github.com/jmagar/syslog-mcp) | infrastructure | Receive, index, and search syslog streams via SQLite FTS5. |
| [gotify-mcp](https://github.com/jmagar/gotify-mcp) | utilities | Send push notifications and manage Gotify messages and applications. |
| [plugin-lab](https://github.com/jmagar/plugin-lab) | dev-tools | Scaffold, review, align, and deploy homelab MCP plugins. |

## License

MIT
