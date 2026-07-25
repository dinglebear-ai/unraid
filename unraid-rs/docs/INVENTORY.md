# Component Inventory — unraid-rmcp

Complete listing of all MCP actions, CLI commands, env vars, HTTP endpoints, and dependencies.

## MCP tool: `unraid`

One tool is exposed. The required `action` argument selects the operation. All actions are read-only.

### Core actions

| Action | Description |
|--------|-------------|
| `array` | Array state, disk health, parity check status, capacity (kilobytes) |
| `disks` | Physical disks: device, type, model, temperature, SMART status, interface, partitions |
| `docker` | Docker containers: names, image, state, status, ports, update availability |
| `docker_logs` | Container logs — requires `id`, optional `tail` (default 100) |
| `vms` | Virtual machine domains: id, name, state |
| `server` | Server identity: name, IPs, local URL, remote URL, status |
| `info` | OS, CPU (brand, cores, threads, speed), memory layout, Unraid/kernel versions |
| `shares` | User shares: name, size, used, free, cache, allocator, LUKS status |
| `notifications` | Active warnings/alerts with overview counts (unread by type) |

### System actions

| Action | Description |
|--------|-------------|
| `services` | System services: id, name, online, version, uptime timestamp |
| `network` | Network access URLs: type, name, IPv4, IPv6 |
| `metrics` | Live CPU % per core, memory (total/used/free/swap), temperature sensors |
| `vars` | System variables: hostname, version, timezone, sharing flags, SSL/SSH config |
| `registration` | License: id, type, state, expiration, update expiration |
| `flash` | USB flash drive: vendor, product |

### Log actions

| Action | Required args | Optional args | Description |
|--------|--------------|---------------|-------------|
| `log_files` | — | — | Available log files: name, path, size, modifiedAt |
| `log_file` | `path` | `lines`, `start_line` | Read a log file; returns path, content, totalLines, startLine |

### Storage actions

| Action | Description |
|--------|-------------|
| `parity_history` | Past parity checks: date, duration, speed, status, errors, correcting, paused, running |
| `rclone` | Backup remotes (name, type) and drives (name) |

### UPS actions

| Action | Description |
|--------|-------------|
| `ups` | UPS devices: name, model, status, battery (charge, runtime, health), power (voltage, load) |
| `ups_config` | UPS configuration: service, cable, type, device, thresholds, NIS settings |

### Remote access actions

| Action | Description |
|--------|-------------|
| `remote_access` | WAN access type, forward type, port |
| `connect` | Unraid Connect: dynamic remote access enabled/running/error, settings |

### Plugin actions

| Action | Description |
|--------|-------------|
| `plugins` | Installed community plugins: name, version, hasApiModule, hasCliModule |

### Meta

| Action | Description |
|--------|-------------|
| `status` | Server observability: version, PID, uptime, request counters (requires `unraid:read`; MCP-only) |
| `help` | Markdown reference for all actions (no auth scope required) |

### Action parameters

| Parameter | Type | Used by | Description |
|-----------|------|---------|-------------|
| `action` | string | all | Required — operation to perform |
| `id` | string | `docker_logs` | Container ID |
| `path` | string | `log_file` | Log file path (from `log_files` response) |
| `lines` | integer | `log_file` | Number of lines to read |
| `start_line` | integer | `log_file` | Starting line number (1-indexed) |
| `tail` | integer | `docker_logs` | Log lines to return (default 100) |
| `limit` | integer | list actions | Max items per page (default 50, max 200) — MCP-only |
| `offset` | integer | list actions | Number of items to skip (default 0) — MCP-only |
| `state` | string | `docker` | Filter containers by state — MCP-only |
| `name` | string | `shares`, `plugins` | Filter results by name — MCP-only |

List actions return a paginated envelope: `{items, total, limit, offset, has_more, next_offset}`.

## MCP resources

| URI | MIME type | Description |
|-----|-----------|-------------|
| `unraid://schema/mcp-tool` | `application/json` | JSON Schema for the `unraid` tool and its parameters |

## MCP prompts

| Name | Description |
|------|-------------|
| `server_summary` | Instructs the model to call `action=info` and summarise array, disks, VMs, containers, notifications |

## CLI commands

All commands accept `--json` for machine-readable output.

| Command | MCP action | Notes |
|---------|-----------|-------|
| `runraid array` | `array` | |
| `runraid disks` | `disks` | |
| `runraid docker` | `docker` | |
| `runraid docker logs <id> [--tail N]` | `docker_logs` | |
| `runraid vms` | `vms` | |
| `runraid server` | `server` | |
| `runraid info` | `info` | |
| `runraid shares` | `shares` | |
| `runraid notifications` | `notifications` | |
| `runraid services` | `services` | |
| `runraid network` | `network` | |
| `runraid metrics` | `metrics` | |
| `runraid vars` | `vars` | |
| `runraid registration` | `registration` | |
| `runraid flash` | `flash` | |
| `runraid log-files` | `log_files` | also: `runraid log files` |
| `runraid log <path> [--lines N] [--start-line N]` | `log_file` | also: `runraid log-file <path>` |
| `runraid parity-history` | `parity_history` | also: `runraid parity history` |
| `runraid rclone` | `rclone` | |
| `runraid ups` | `ups` | |
| `runraid ups-config` | `ups_config` | also: `runraid ups config` |
| `runraid remote-access` | `remote_access` | also: `runraid remote access` |
| `runraid connect` | `connect` | |
| `runraid plugins` | `plugins` | |

The `status` action is MCP-only and has no CLI command. The CLI additionally provides `setup` and `doctor` commands that have no MCP action.

Server/transport commands:

| Command | Description |
|---------|-------------|
| `runraid` or `runraid serve` | Start RMCP Streamable HTTP server |
| `runraid serve mcp` | Same as above (explicit) |
| `runraid mcp` | Start stdio MCP transport |
| `runraid --help` | Print usage |
| `runraid --version` | Print version |

## HTTP endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/mcp` | POST | yes (when configured) | RMCP Streamable HTTP |
| `/health` | GET | no | Returns `{"status":"ok"}` |
| `/mcp/.well-known/oauth-authorization-server` | GET | no | OAuth metadata (OAuth mode only) |
| `/mcp/.well-known/openid-configuration` | GET | no | OAuth metadata (OAuth mode only) |
| `/mcp/.well-known/oauth-protected-resource` | GET | no | Protected resource metadata (OAuth mode only) |
| `/*` (fallback) | any | — | Returns `{"error":"not_found"}` with 404 |

## Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `UNRAID_API_URL` | **yes** | — | Unraid GraphQL endpoint |
| `UNRAID_API_KEY` | **yes** | — | API key sent as `x-api-key` header |
| `UNRAID_API_SKIP_TLS_VERIFY` | no | `false` | Skip TLS certificate verification |
| `UNRAID_RMCP_HOST` | no | `0.0.0.0` | Bind host for the MCP HTTP server |
| `UNRAID_RMCP_PORT` | no | `40010` | Bind port |
| `UNRAID_RMCP_TOKEN` | no | — | Static bearer token for `/mcp` |
| `UNRAID_RMCP_DISABLE_HTTP_AUTH` | no | `false` | Disable MCP auth (1/true/yes) |
| `UNRAID_RMCP_NO_AUTH` | no | `false` | Alias for disabling auth |
| `UNRAID_RMCP_ALLOWED_HOSTS` | no | — | Extra comma-separated Host header values |
| `UNRAID_RMCP_ALLOWED_ORIGINS` | no | — | Extra comma-separated CORS origins |
| `UNRAID_RMCP_PUBLIC_URL` | no | — | Public URL for OAuth metadata and allowed hosts |
| `UNRAID_RMCP_AUTH_ADMIN_EMAIL` | no | — | Admin email for OAuth mode |
| `RUST_LOG` | no | `info` (server) / `warn` (stdio/CLI) | Log filter |

## Runtime dependencies

| Crate | Purpose |
|-------|---------|
| `tokio` | Async runtime |
| `axum` | HTTP framework |
| `rmcp` 1.6 | MCP protocol and transports |
| `tower-http` | CORS, body limit, tracing middleware |
| `reqwest` | GraphQL HTTP client (rustls, no OpenSSL) |
| `serde` / `serde_json` | Serialization |
| `chrono` | Timestamp formatting |
| `toml` | config.toml parsing |
| `lab-auth` | Auth layer (bearer + OAuth) |
| `url` | Public URL parsing |
| `tracing` / `tracing-subscriber` | Structured logging |
| `anyhow` | Error handling |

## Development dependencies

| Crate | Purpose |
|-------|---------|
| `tempfile` | Temporary directories for auth state in tests |
| `tower` | HTTP test utilities |
| `rmcp` (client features) | stdio integration test client |
