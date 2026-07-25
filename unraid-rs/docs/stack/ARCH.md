# Architecture — unraid-rmcp

## Overview

`unraid-rmcp` is a thin GraphQL proxy. It exposes 24 read-only data actions (plus a `status` observability action and `help`) through the Model Context Protocol and an equivalent CLI. There is no local database, no ingestion pipeline, and no background tasks. All data comes from the Unraid GraphQL API on demand.

```
                      ┌─────────────────────────────────────────┐
  Claude / MCP ◀────▶ │  POST /mcp  (RMCP Streamable HTTP)      │
  stdio client ◀────▶ │  runraid mcp  (stdio transport)          │
  shell / CI  ────▶   │  runraid <cmd>  (CLI)                    │
                      │                                         │
                      │  Routes layer (axum)                    │
                      │    /mcp         → RMCP service           │
                      │    /health      → {"status":"ok"}        │
                      │    /mcp/.well-known/* → OAuth meta       │
                      │                                         │
                      │  Auth layer (lab-auth)                  │
                      │    LoopbackDev: no-op                   │
                      │    Mounted:  bearer token or OAuth JWT   │
                      │                                         │
                      │  MCP handler (rmcp_server.rs)           │
                      │    list_tools / call_tool / list_prompts │
                      │                                         │
                      │  Tool dispatch (tools.rs)               │
                      │    match action → service method         │
                      │                                         │
                      │  Business layer (app.rs / UnraidService) │
                      │                                         │
                      │  GraphQL client (graphql.rs)            │
                      │    POST UNRAID_API_URL                  │
                      │    x-api-key: UNRAID_API_KEY            │
                      └──────────────────┬──────────────────────┘
                                         │  HTTPS
                                         ▼
                        Unraid server GraphQL API
                        (myunraid.net or LAN address)
```

## Request flow (MCP HTTP)

```
MCP client (Claude / curl / MCP inspector)
    │  POST /mcp  JSON-RPC 2.0
    ▼
axum HTTP listener  (bind UNRAID_RMCP_HOST:UNRAID_RMCP_PORT)
    │
    ▼
lab-auth AuthLayer  (bearer token or OAuth JWT, or no-op on loopback)
    │
    ▼
RMCP StreamableHttpService  (stateless JSON-response mode)
    │  calls ServerHandler methods
    ▼
UnraidRmcpServer::call_tool  (rmcp_server.rs)
    │  scope check: unraid:read required
    ▼
execute_tool → dispatch()  (tools.rs)
    │  match action string
    ▼
UnraidService method  (app.rs)
    │
    ▼
UnraidClient::query()  (graphql.rs)
    │  POST to UNRAID_API_URL with x-api-key header
    ▼
Unraid GraphQL API
    │  JSON {"data": {...}}
    ▼
serde_json::Value  returned up the chain
    │
    ▼
JSON-RPC response → MCP client
```

## Request flow (CLI)

```
runraid <command> [--json]
    │
    ▼
CliCommand::parse()  (cli.rs)
    │  parse args into enum variant
    ▼
UnraidService method  (app.rs)
    │
    ▼
UnraidClient::query()  (graphql.rs)
    │
    ▼
Unraid GraphQL API
    │
    ▼
serde_json::Value
    │
    ▼
fmt_*() formatter  or  serde_json::to_string_pretty()
    │
    ▼
stdout
```

## Module responsibilities

| Module | File | Responsibility |
|--------|------|----------------|
| Entry point | `src/main.rs` | Mode dispatch: HTTP server / stdio / CLI; tracing init |
| Config | `src/config.rs` | TOML + env loading, defaults, `Config::load()` |
| GraphQL client | `src/graphql.rs` | `UnraidClient`: HTTP POST, `x-api-key` auth, error propagation |
| Business layer | `src/app.rs` | `UnraidService`: one method per action, delegates to client |
| MCP tools | `src/mcp/tools.rs` | `execute_tool`: action string dispatch, arg extraction |
| MCP schema | `src/mcp/schemas.rs` | JSON Schema for the `unraid` tool, action enum |
| MCP server | `src/mcp/rmcp_server.rs` | `ServerHandler` impl, scope checks, resource/prompt defs |
| HTTP routes | `src/mcp/routes.rs` | `/mcp`, `/health`, OAuth discovery routes, CORS |
| Prompts | `src/mcp/prompts.rs` | `server_summary` prompt |
| MCP state | `src/mcp.rs` | `AppState`, `AuthPolicy`, `build_auth_layer` |
| CLI | `src/cli.rs` | Arg parsing, human-readable formatters for all 24 actions |
| Library | `src/lib.rs` | Public module exports, `testing` helpers |

## Authentication

`AuthPolicy` is an enum, not a boolean, so there is no accidental default:

| Policy | When used | Behaviour |
|--------|-----------|-----------|
| `LoopbackDev` | `no_auth=true` or host starts with `127.` | All requests pass; no auth middleware mounted |
| `Mounted { auth_state: None }` | Static bearer token set | lab-auth checks `Authorization: Bearer <token>` |
| `Mounted { auth_state: Some(_) }` | OAuth configured | lab-auth validates RS256 JWT; Google OAuth flow available |

Scopes enforced per-action:
- `unraid:read` — all 24 data actions
- `unraid:admin` — satisfies `unraid:read`
- No scope — `help` action only

`/health` is always unauthenticated.

## Error handling

| Source | Error | Client sees |
|--------|-------|-------------|
| Missing `UNRAID_API_URL` or `UNRAID_API_KEY` | startup panic | process exits with message |
| Auth: missing/invalid token | 401 HTTP | JSON error body |
| Auth: insufficient scope | RMCP `invalid_request` | JSON-RPC error |
| Unknown tool name | RMCP error | JSON-RPC error |
| Unknown action | `invalid_params` | JSON-RPC error with hint to use `action=help` |
| Missing required param | `invalid_params` | JSON-RPC error naming the missing param |
| GraphQL HTTP error | `anyhow::Error` | MCP content text with error message |
| GraphQL `errors` field present | `anyhow::Error` | MCP content text with error message |
| TLS error (cert invalid) | `anyhow::Error` | MCP content text; set `UNRAID_API_SKIP_TLS_VERIFY=true` to bypass |

## MCP surface

- **1 tool**: `unraid` with `action` dispatch (24 read-only data actions + `status` + `help`)
- **1 resource**: `unraid://schema/mcp-tool` — JSON Schema of the tool (application/json)
- **1 prompt**: `server_summary` — instructs the model to call `action=info` and summarise

## Cross-references

- [TECH.md](TECH.md) — technology stack and crate selection
- [../INVENTORY.md](../INVENTORY.md) — full action and CLI inventory
- [../../README.md](../../README.md) — quickstart and configuration reference
