# unraid-rmcp

Rust MCP server and CLI for Unraid GraphQL operations across NAS, Docker, VM, and storage workflows.

It exposes one MCP tool, `unraid`, plus the `runraid` CLI. Agents can inspect
array health, disks, Docker containers and logs, VMs, shares, notifications,
system metrics, UPS, logs, network settings, plugins, parity history, rclone,
remote access, and Unraid Connect through stdio MCP, Streamable HTTP MCP, or
direct shell commands.

**30-second path:** install CRGX, set `UNRAID_API_URL` and `UNRAID_API_KEY`,
then run `crgx unraid-rmcp -- server --json` -> start loopback HTTP with
`UNRAID_RMCP_HOST=127.0.0.1 crgx unraid-rmcp -- serve mcp` -> call
`tools/call` with `{"action":"server"}`.

**Status:** operational RMCP upstream-client server with the full Unraid GraphQL
query and mutation surface. Read actions require `unraid:read`; writes require
`unraid:admin`. Destructive operations use MCP form elicitation and fail closed
when the client cannot obtain user approval. HTTP MCP supports loopback dev mode,
static bearer tokens, and Google OAuth through `lab-auth`. Release binaries and
Docker images target linux/amd64 only.

**Not for:** replacing the Unraid web UI, running arbitrary shell commands,
storing API keys for callers, multi-tenant isolation, or passing Unraid API keys
through MCP tool arguments.

## Contents

- [Naming](#naming)
- [Capabilities And Boundaries](#capabilities-and-boundaries)
- [Install](#install)
- [Quickstart](#quickstart)
- [Client Configuration](#client-configuration)
- [Runtime Surfaces](#runtime-surfaces)
- [MCP Tool Reference](#mcp-tool-reference)
- [CLI Reference](#cli-reference)
- [Configuration](#configuration)
- [Authentication](#authentication)
- [Safety And Trust Model](#safety-and-trust-model)
- [Architecture](#architecture)
- [Distribution Contract](#distribution-contract)
- [Development](#development)
- [Verification](#verification)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Related Servers](#related-servers)
- [Documentation](#documentation)
- [License](#license)

## Naming

| Surface | This repo |
|---|---|
| Repository | `unraid` monorepo (`unraid-rs/` component) |
| Rust crate | `unraid-rmcp` |
| Binary / CLI | `runraid` |
| crates.io package | `unraid-rmcp` |
| CRGX command | `crgx unraid-rmcp -- <runraid args>` |
| Legacy npm package | `unraid-rmcp` |
| MCP tool | `unraid` |
| Config home | `~/.unraid` on hosts, `/data` in containers |
| Env prefixes | `UNRAID_*`, `UNRAID_RMCP_*` |

This repo is a small naming exception in the RMCP family: MCP/server variables
use `UNRAID_RMCP_*` rather than `UNRAID_MCP_*` for compatibility with the
existing deployment config.

## Capabilities And Boundaries

- Read Unraid array state, parity status, disk health, SMART summaries, and
  capacity.
- Manage array, Docker, VM, notification, plugin, API-key, rclone, onboarding,
  settings, remote-access, and Unraid Connect state through GraphQL mutations.
- Require MCP form elicitation for destructive operations while allowing ordinary
  writes to proceed after scope authorization.
- Provide pagination/filtering for MCP list actions and output truncation for
  large MCP responses.
- Expose the `server_summary` prompt and `unraid://schema/mcp-tool` schema
  resource.
- Provide setup and doctor commands for local plugin/runtime checks.

| This repo owns | Unraid owns | Explicitly out of scope |
|---|---|---|
| MCP/CLI projection, GraphQL operation selection, response shaping, pagination, auth policy, elicitation policy, setup checks, and prompt/resource metadata. | NAS state, array/docker/VM behavior, GraphQL schema, Unraid API key issuance, remote access, and Connect state. | Arbitrary shell execution, controller UI replacement, credential brokerage, background monitoring, multi-tenant sandboxing, and direct local filesystem writes. |

## Install

| Path | Command | Best for | Notes |
|---|---|---|---|
| CRGX | `crgx unraid-rmcp -- --help` | Local MCP clients and quick trials. | Resolves the crate from crates.io and downloads the matching GitHub Release binary. |
| Cargo install | `cargo install unraid-rmcp --locked` | Persistent CLI installation. | Builds `runraid` from the crates.io source package. |
| Release installer | `curl -fsSL https://raw.githubusercontent.com/dinglebear-ai/unraid/main/unraid-rs/scripts/install.sh \| bash` | Host installs without CRGX. | Installs `runraid` for linux/amd64. |
| Docker / Compose | `docker compose up -d` | Shared HTTP MCP deployments. | Reads `.env` and exposes container port `40010`. |
| Build from source | `cargo build --release` | Development and audits. | Produces `target/release/runraid`. |
| Plugin | `claude plugin install agents/unraid-rs` | Claude Code local plugin setup from this checkout. | Ships the skill and local runtime metadata. No hooks — run `runraid setup plugin-hook` once to provision credentials. |

### CRGX / crates.io

Run the stdio MCP server or CLI without installing Node or compiling Rust:

```bash
crgx unraid-rmcp -- --help
crgx unraid-rmcp -- mcp
crgx unraid-rmcp -- server --json
```

CRGX resolves `unraid-rmcp` from crates.io, reads its cargo-binstall metadata,
and downloads the matching `runraid` archive from the component-prefixed GitHub
Release. Exact crate versions can be pinned with `unraid-rmcp@<version>`.

The npm launcher remains available only as a compatibility path for existing
installations; new MCP configurations should use CRGX.

### Build From Source

```bash
git clone https://github.com/dinglebear-ai/unraid
cd unraid-mcp/unraid-rs
cargo build --release
./target/release/runraid --help
```

Minimum supported Rust version: 1.90.

## Quickstart

### 1. Configure Unraid

Create an Unraid API key in Settings -> API Management, then set:

```bash
export UNRAID_API_URL="https://10-1-0-2.<hash>.myunraid.net:31337/graphql"
export UNRAID_API_KEY="your-api-key-here"
```

Set `UNRAID_API_SKIP_TLS_VERIFY=true` only when your Unraid GraphQL endpoint uses
a certificate your host does not trust.

### 2. Run A Safe CLI Call

```bash
crgx unraid-rmcp -- server --json
```

### 3. Start Loopback HTTP MCP

```bash
UNRAID_RMCP_HOST=127.0.0.1 crgx unraid-rmcp -- serve mcp
```

In another shell:

```bash
curl -sf http://127.0.0.1:40010/health
```

### 4. Make A First MCP Call

```bash
curl -s -X POST http://127.0.0.1:40010/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"unraid","arguments":{"action":"server"}}}'
```

## Client Configuration

### Claude Code Stdio

```json
{
  "mcpServers": {
    "unraid": {
      "command": "crgx",
      "args": ["unraid-rmcp", "--", "mcp"],
      "env": {
        "UNRAID_API_URL": "https://10-1-0-2.<hash>.myunraid.net:31337/graphql",
        "UNRAID_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### Claude Code HTTP

```json
{
  "mcpServers": {
    "unraid": {
      "type": "http",
      "url": "http://127.0.0.1:40010/mcp",
      "headers": {
        "Authorization": "Bearer ${UNRAID_RMCP_TOKEN}"
      }
    }
  }
}
```

### Codex / Labby Gateway

Register Unraid through Labby as an HTTP upstream when sharing one long-running
server, or run it directly as stdio for local-only use.

```toml
[mcp_servers.unraid]
command = "crgx"
args = ["unraid-rmcp", "--", "mcp"]
```

### Generic MCP JSON

```json
{
  "command": "runraid",
  "args": ["mcp"],
  "env": {
    "UNRAID_API_URL": "https://10-1-0-2.<hash>.myunraid.net:31337/graphql",
    "UNRAID_API_KEY": "your-api-key-here"
  }
}
```

Do not put `UNRAID_API_KEY`, OAuth secrets, passwords, SSH keys, or upstream
bearer tokens in MCP tool arguments. Use env, config files, or the MCP client's
secret storage. MCP callers never provide credentials, tokens, keys, or secrets
as action arguments.

## Runtime Surfaces

| Surface | Status | Entry point | Purpose |
|---|---:|---|---|
| MCP stdio | Supported | `runraid mcp`, `crgx unraid-rmcp -- mcp` | Local child-process MCP clients. |
| MCP HTTP | Supported | `runraid serve mcp`, `POST /mcp` | Streamable HTTP MCP for local or shared server deployments. |
| CLI | Supported | `runraid <command>` | Scriptable parity and debugging. |
| Prompt | Supported | `server_summary` | Guides a model to call `info` and summarize server state. |
| Resource | Supported | `unraid://schema/mcp-tool` | JSON schema for the `unraid` tool. |
| Health endpoint | Supported | `GET /health` | Unauthenticated liveness check. |
| REST API | Not shipped | N/A | Unraid owns the GraphQL API. |
| Web UI | Not shipped | N/A | Unraid owns the web UI. |

## MCP Tool Reference

One MCP tool is exposed: `unraid`. Pass the required `action` argument to select
the operation.

### Core Actions

| Action | Description | Required params | Optional params |
|---|---|---|---|
| `array` | Array state, disk health, parity check status, and capacity. | none | none |
| `disks` | Physical disks with SMART status, temperature, size, interface, and partitions. | none | `limit`, `offset`, `name` |
| `docker` | Docker containers with state, status, ports, and update availability. | none | `limit`, `offset`, `state`, `name` |
| `docker_logs` | Container log lines. | `id` | `tail` |
| `vms` | Virtual machines and state. | none | `limit`, `offset`, `state`, `name` |
| `server` | Server identity, LAN/WAN IP, local/remote URLs, GUID, and online status. | none | none |
| `info` | OS, CPU, memory layout, Unraid version, and kernel version. | none | none |
| `shares` | User shares with size, cache settings, and encryption state. | none | `limit`, `offset`, `name` |
| `notifications` | Active warnings and alerts with overview counts. | none | none |

### System Actions

| Action | Description |
|---|---|
| `services` | Running system services with uptime. |
| `network` | Network access URLs and addresses. |
| `metrics` | Live CPU, memory, and temperature sensor data. |
| `vars` | System configuration variables. |
| `registration` | License type, state, and expiry. |
| `flash` | USB flash drive details. |

### Log And Storage Actions

| Action | Description | Required params | Optional params |
|---|---|---|---|
| `log_files` | Available log files with sizes and modified times. | none | none |
| `log_file` | Read a log file. | `path` | `lines`, `start_line` |
| `parity_history` | Past parity check results. | none | none |
| `rclone` | Backup remote configurations and drive names. | none | none |

### UPS, Remote, Plugin, And Meta Actions

| Action | Description |
|---|---|
| `ups` | UPS devices, charge, runtime, and load. |
| `ups_config` | UPS monitoring configuration. |
| `remote_access` | WAN access and port forwarding configuration. |
| `connect` | Unraid Connect dynamic remote access state. |
| `plugins` | Installed community plugins with versions. |
| `status` | Server observability: version, PID, uptime, and counters. |
| `help` | Markdown reference for the actions enabled by server policy. |

Pagination and filtering are MCP-only. List actions return a paginated envelope
with `items`, `total`, `limit`, `offset`, `has_more`, and `next_offset`.

## CLI Reference

All CLI commands accept `--json` for machine-readable output.

```bash
runraid array [--json]
runraid disks [--json]
runraid docker [--json]
runraid docker logs <id> [--tail N] [--json]
runraid vms [--json]
runraid server [--json]
runraid info [--json]
runraid shares [--json]
runraid notifications [--json]
runraid services [--json]
runraid network [--json]
runraid metrics [--json]
runraid vars [--json]
runraid registration [--json]
runraid flash [--json]
runraid log-files [--json]
runraid log <path> [--lines N] [--start-line N] [--json]
runraid parity-history [--json]
runraid rclone [--json]
runraid ups [--json]
runraid ups-config [--json]
runraid remote-access [--json]
runraid connect [--json]
runraid plugins [--json]
runraid doctor [--json]
runraid setup check [--json]
runraid setup repair [--json]
```

`status` is MCP-only; `setup` and `doctor` are CLI-only.

## Configuration

When `UNRAID_HOME` is non-empty, the binary reads `<UNRAID_HOME>/.env`.
Otherwise host installs read `~/.unraid/.env` and containers read `/data/.env`.
Non-empty process environment values override `.env`; empty plugin placeholders
inherit persisted `.env` values instead of clearing them. A present but malformed
`.env` is rejected so parsing cannot silently skip a later deny rule or credential.

| Variable | Default | Purpose |
|---|---|---|
| `UNRAID_API_URL` | unset | Full Unraid GraphQL endpoint URL. |
| `UNRAID_API_KEY` | unset | API key for the `x-api-key` header. |
| `UNRAID_API_SKIP_TLS_VERIFY` | `false` | Skip TLS certificate verification for self-signed endpoints. |
| `UNRAID_API_CA_BUNDLE` | _(unset)_ | Path to a PEM CA bundle to trust. Prefer this over skipping verification for a private CA; startup fails if the file is unreadable or not a PEM bundle. |
| `UNRAID_HOME` | platform default | Exact data directory for `.env`, auth DB, and JWT key; overrides `/data` or `~/.unraid`. |
| `UNRAID_RMCP_HOST` | `0.0.0.0` | HTTP bind host. |
| `UNRAID_RMCP_PORT` | `40010` | HTTP bind port. |
| `UNRAID_RMCP_ENABLED_TOOLS` | unset | Comma-separated MCP tool/action allowlist; empty means all. |
| `UNRAID_RMCP_DISABLED_TOOLS` | unset | Comma-separated MCP tool/action denylist; deny rules win. |
| `UNRAID_RMCP_SERVER_NAME` | `unraid-rmcp` | Advertised MCP server name. |
| `UNRAID_RMCP_TOKEN` | unset | Static bearer token for HTTP MCP. |
| `UNRAID_RMCP_NO_AUTH` | `false` | Disable auth only for loopback development. |
| `UNRAID_RMCP_DISABLE_HTTP_AUTH` | `false` | Compatibility alias for disabling auth. |
| `UNRAID_NOAUTH` | `false` | Trust an upstream gateway to enforce auth. |
| `UNRAID_RMCP_ALLOWED_HOSTS` | unset | Extra accepted Host header values. |
| `UNRAID_RMCP_ALLOWED_ORIGINS` | unset | Extra accepted CORS origins. |
| `UNRAID_RMCP_PUBLIC_URL` | unset | Public URL for OAuth metadata. |
| `UNRAID_RMCP_AUTH_MODE` | `bearer` | `bearer` or `oauth`. |
| `UNRAID_RMCP_GOOGLE_CLIENT_ID` | unset | Google OAuth client ID. |
| `UNRAID_RMCP_GOOGLE_CLIENT_SECRET` | unset | Google OAuth client secret. |
| `UNRAID_RMCP_AUTH_ADMIN_EMAIL` | unset | Admin email for OAuth bootstrap. |

Tool selectors may target the entire tool (`*`, `unraid`, or `unraid.*`) or
a single action (`docker_logs` or `unraid.vm_reset`). Tool discovery and the
schema resource expose only enabled actions and parameters used by those
actions; disabled calls are still rejected when a client uses a stale cached
schema. Invalid selectors and unknown TOML fields fail configuration loading.

A set, non-empty `UNRAID_RMCP_ENABLED_TOOLS` / `UNRAID_RMCP_DISABLED_TOOLS`
**replaces** the corresponding `[mcp.tools]` list from `config.toml` — env and
toml are never merged, so the env var is the complete policy for that list.
An env var set to the empty string is treated as a placeholder: a matching
value from `<UNRAID_HOME>/.env`, `~/.unraid/.env`, or `/data/.env` is loaded when
present, otherwise it behaves as unset. A non-empty value that parses to zero selectors (for example
`","`) fails startup. This policy governs the MCP surface only; the `runraid`
CLI is not filtered by `[mcp.tools]`.

## Authentication

Stdio MCP runs as a local trusted child process and does not use HTTP auth.

HTTP MCP auth policy:

| State | Condition | Behavior |
|---|---|---|
| Loopback dev | `UNRAID_RMCP_HOST` starts with `127.` or auth is explicitly disabled on loopback | Local unauthenticated development is allowed. |
| Mounted bearer | Non-loopback with `UNRAID_RMCP_TOKEN` | Requires `Authorization: Bearer <token>` and action scopes. |
| Mounted OAuth | `UNRAID_RMCP_AUTH_MODE=oauth` | Uses Google OAuth/JWT through `lab-auth`. |
| Trusted gateway | `UNRAID_NOAUTH=true` | Assumes a reverse proxy or gateway already enforced auth. |

Read actions require `unraid:read`; mutating actions require `unraid:admin`.
Configured static bearer tokens are operator credentials and receive admin scope.
OAuth clients receive the scopes granted by the authorization flow.

## Safety And Trust Model

- Unraid API keys are loaded from config/env only.
- MCP callers select actions and arguments, not upstream credentials.
- Destructive actions issue an MCP form-elicitation request before dispatch. A
  decline, cancellation, malformed response, or client without elicitation support
  stops the operation before the GraphQL request is sent.
- Ordinary mutations remain directly available after `unraid:admin` authorization;
  the server does not add a second confirmation parameter or disable writes.
- `log_file` reads through the Unraid GraphQL API, not arbitrary local files.
- Non-loopback HTTP deployments must use bearer auth, OAuth, or a trusted
  authenticated gateway.
- This bridge does not sandbox Unraid itself. Unraid remains responsible for API
  permissions and GraphQL response semantics.

## Architecture

```text
GraphQL operations (src/graphql.rs)  queries + mutations
        |
UnraidService (src/app.rs)           action behavior and response shaping
        |
MCP scope + elicitation              authorization and destructive approval
        |
MCP shim      (src/mcp/tools.rs)     JSON args -> service -> Value
CLI shim      (src/cli.rs)           argv -> service -> stdout
```

## Distribution Contract

- `Cargo.toml`, `Cargo.lock`, both `version` and `binaryVersion` in
  `packages/unraid-rmcp/package.json`, `.release-please-manifest.json`, agent
  manifests, and `server.json` must agree on the released version.
- crates.io publishes `lab-auth` first and `unraid-rmcp` second through
  `.github/workflows/crates-publish.yml`; automatic publication stays disabled
  until `CRATES_IO_PUBLISHING_ENABLED=true` and the `crates-io` environment holds
  `CARGO_REGISTRY_TOKEN`.
- GitHub Releases publish the linux/amd64 `runraid` archive consumed by CRGX and
  cargo-binstall through the manifest metadata in `Cargo.toml`.
- The npm package remains a compatibility surface only. Automatic npm publishing
  is enabled only when `NPM_TRUSTED_PUBLISHING_ENABLED=true`.
- Docker/OCI metadata uses `ghcr.io/dinglebear-ai/unraid-rmcp:<version>`.
- `agents/unraid-rs/.mcp.json` must launch `crgx unraid-rmcp -- mcp` so stdio
  clients resolve the crates.io package without requiring Node.
- The root README is curated. `docs/INVENTORY.md` is the curated inventory for
  actions, CLI commands, env vars, HTTP endpoints, and dependencies.

## Development

```bash
cargo fmt --check
cargo test
cargo clippy -- -D warnings
cargo build --release
npm --prefix packages/unraid-rmcp run check
```

## Verification

```bash
python3 /home/jmagar/workspace/soma/scripts/check-readme-guide.py README.md
npm --prefix packages/unraid-rmcp run check
cargo check
cargo test
git diff --check
```

Runtime smoke:

```bash
UNRAID_API_URL=https://10-1-0-2.<hash>.myunraid.net:31337/graphql \
UNRAID_API_KEY=... \
runraid server --json
```

HTTP smoke:

```bash
UNRAID_RMCP_HOST=127.0.0.1 runraid serve mcp
curl -sf http://127.0.0.1:40010/health
```

## Deployment

Use loopback for local development:

```bash
UNRAID_RMCP_HOST=127.0.0.1 runraid serve mcp
```

Use Docker Compose for shared HTTP deployment:

```bash
cp .env.example .env
docker compose up -d
```

When binding to a non-loopback address, configure `UNRAID_RMCP_TOKEN`,
`UNRAID_RMCP_AUTH_MODE=oauth`, or `UNRAID_NOAUTH=true` behind an authenticated
gateway.

## Troubleshooting

| Symptom | Check |
|---|---|
| `UNRAID_API_URL` or `UNRAID_API_KEY` is missing | Set it in env or `~/.unraid/.env`. |
| TLS errors against Unraid | Point `UNRAID_API_CA_BUNDLE` at your CA's PEM bundle to keep verification on. Use `UNRAID_API_SKIP_TLS_VERIFY=true` only when you have no bundle. |
| HTTP `/mcp` returns unauthorized | Set `UNRAID_RMCP_TOKEN` and send `Authorization: Bearer <token>`. |
| Stdio client hangs or logs JSON errors | Ensure client config runs `unraid-rmcp mcp`, not the default HTTP server mode. |
| Large list response is truncated | Use `limit`, `offset`, `name`, or `state` filters on MCP list actions. |
| `docker_logs` fails | Pass a valid container `id` and optional `tail`. |

## Related Servers

- [soma](https://github.com/jmagar/soma) - RMCP runtime for provider-backed MCP servers.
- [unifi-rmcp](https://github.com/jmagar/runifi) - UniFi controller REST API bridge.
- [tailscale-rmcp](https://github.com/jmagar/rtailscale) - Tailscale API bridge for devices, users, and tailnet operations.
- [apprise-rmcp](https://github.com/jmagar/rapprise) - Apprise notification fan-out bridge for many delivery backends.
- [gotify-rmcp](https://github.com/jmagar/rgotify) - Gotify push notification bridge for sends, messages, apps, and clients.
- [arcane-rmcp](https://github.com/jmagar/rarcane) - Arcane Docker management bridge for containers and related resources.
- [yarr](https://github.com/jmagar/yarr) - Media-stack bridge for Sonarr, Radarr, Prowlarr, Plex, and related services.
- [ytdl-rmcp](https://github.com/jmagar/rytdl) - Media download and metadata workflow server.
- [synapse-rmcp](https://github.com/jmagar/synapse) - Local Synapse workflow server for scout and flux actions.
- [cortex](https://github.com/jmagar/cortex) - Syslog and homelab log aggregation MCP server.
- [axon](https://github.com/jmagar/axon) - RAG, crawl, scrape, extract, and semantic search project.
- [labby](https://github.com/jmagar/labby) - Homelab control plane and MCP gateway project.
- [lumen](https://github.com/jmagar/lumen) - Local semantic code search MCP server.

## Documentation

- `CLAUDE.md` is the curated local operating guide for contributors and agents.
- `docs/INVENTORY.md` is the curated/generated inventory for actions, CLI
  commands, env vars, HTTP endpoints, and dependencies.
- `docs/stack/ARCH.md` is the curated architecture guide.
- `agents/unraid-rs/skills/unraid/SKILL.md` is the agent usage guide.
- `src/` is the source of truth for current GraphQL queries, config defaults,
  auth behavior, and CLI parsing.

## License

MIT. See [LICENSE](LICENSE).
