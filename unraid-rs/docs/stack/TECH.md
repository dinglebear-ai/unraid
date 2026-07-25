# Technology Choices — unraid-rmcp

Technology stack reference and crate selection rationale.

## Language: Rust

Rust was chosen because:
- Single static binary (`runraid`) simplifies deployment and Docker images
- Memory safety without GC pause eliminates latency spikes in HTTP service code
- Strong async story via tokio for the MCP HTTP server and concurrent GraphQL calls
- `reqwest` with `rustls` avoids OpenSSL system library version issues

## Async runtime: tokio

`tokio` with `features = ["full"]` provides:
- `tokio::net` — TCP listener for the MCP HTTP server
- `tokio::signal` — graceful shutdown on SIGTERM / CTRL-C
- `tokio::time` — not used directly, but depended on by axum and rmcp

## HTTP framework: axum

Minimal, composable HTTP framework built on tokio and tower:
- Native tower middleware support (CORS via `tower-http`, request body limit)
- Type-safe state injection (`AppState` via `axum::extract::State`)
- Composable router for `/mcp`, `/health`, and OAuth discovery routes
- Mounts rmcp's tower-compatible `StreamableHttpService`

## MCP SDK: rmcp 1.6

rmcp owns the MCP protocol lifecycle:
- `transport-streamable-http-server` — Streamable HTTP in stateless JSON-response mode
- `transport-io` — stdio transport for `runraid mcp` child-process mode
- `server` + `macros` — `ServerHandler` trait and derive helpers
- stateless mode: every `POST /mcp` is independent; no session state stored

## HTTP client: reqwest 0.12

Used exclusively in `graphql.rs` for GraphQL API calls:
- `features = ["json", "rustls-tls"]` — no OpenSSL dependency
- `danger_accept_invalid_certs` — controlled by `UNRAID_API_SKIP_TLS_VERIFY`
- All requests POST JSON to `UNRAID_API_URL` with `x-api-key` header

## Serialization: serde + serde_json + toml

| Crate | Purpose |
|-------|---------|
| `serde` | Derive macros for config structs |
| `serde_json` | Tool argument/result payloads; `Value` is the universal data type |
| `toml` | `config.toml` parsing |

All GraphQL responses are `serde_json::Value`. There are no typed response structs for the Unraid API — this avoids schema drift issues and keeps the code lean.

## Auth: lab-auth

Private crate (`git = "https://github.com/jmagar/lab.git"`):
- `AuthLayer` — tower middleware for bearer token and OAuth JWT validation
- `AuthContext` — injected into request extensions after auth passes
- `AuthState` — OAuth state machine (JWKS, RS256 signing, Google flow)
- Scopes: `unraid:read`, `unraid:admin`

## Time: chrono

Used for timestamp formatting in CLI output. `features = ["serde"]` for config struct serde.

## Config: toml

`config.toml` parsing for the `[unraid]`, `[mcp]`, and `[mcp.auth]` sections. Env vars override via helpers in `config.rs` (`env_str`, `env_bool`, `env_parse`, `env_list`, `env_opt_str`).

## URL parsing: url

Used in `mcp/rmcp_server.rs` to parse `UNRAID_RMCP_PUBLIC_URL` for allowed host/origin computation.

## Logging: tracing + tracing-subscriber

Structured, span-based logging:
- `RUST_LOG` directive parsing via `EnvFilter`
- Logs to stderr (not stdout, which is reserved for stdio MCP transport)
- `warn` level in stdio/CLI mode; `info` in HTTP server mode

## Error handling: anyhow

`anyhow::Result` throughout:
- Config loading, GraphQL client, service layer, tool dispatch
- `context()` for error messages that name the failing operation
- `bail!` for early returns with descriptive messages

## CORS: tower-http

`CorsLayer` in `routes.rs` allows `POST` and `GET` from configured origins. Allowed origins include loopback by default plus any `UNRAID_RMCP_ALLOWED_ORIGINS` values and the public URL origin.

## Development dependencies

| Crate | Purpose |
|-------|---------|
| `tempfile` | Temporary directories for isolated auth state in tests |
| `tower` | HTTP testing utilities (service call helpers) |
| `rmcp` (client features) | `transport-child-process` for stdio integration test |

## Design trade-offs

**No typed GraphQL response structs.** All responses are `serde_json::Value`. This avoids a generated GraphQL client, eliminates schema drift failures, and keeps the codebase small. The downside is that field access in formatters is verbose and mistakes surface at runtime. The formatters in `cli.rs` use defensive fallbacks (`unwrap_or`, `unwrap_or_else`) so missing fields produce `"?"` rather than panics.

**No local database.** Every action is a live GraphQL call to the Unraid API. There is no caching, no SQLite, no background tasks. This keeps the binary simple and ensures data is always current, at the cost of latency on every call.

**No write actions.** All 24 actions are read-only. The tool is a monitoring and inspection interface, not a control plane.

## See also

- [ARCH.md](ARCH.md) — architecture overview and request flow
- [../../README.md](../../README.md) — quickstart and env var reference
- [../../Cargo.toml](../../Cargo.toml) — exact crate versions
