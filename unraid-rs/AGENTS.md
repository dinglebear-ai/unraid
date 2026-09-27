# unraid-rmcp — agent and contributor instructions

`AGENTS.md` is canonical; `CLAUDE.md` and `GEMINI.md` link here. Follow the
[repository instructions](../AGENTS.md) for shared policy, safety, and releases.

## What this project is

`unraid-rmcp` is a Rust binary (`runraid`) that exposes supported Unraid GraphQL
queries and mutations through MCP and a CLI. The `ACTIONS` catalog determines
the MCP surface; do not infer that every operation in an upstream schema is
implemented. Read actions require `unraid:read`; mutating actions require
`unraid:admin` (see the scope model below).

## Module map

| File | Role |
|------|------|
| `src/graphql.rs` | `UnraidClient` — HTTP client; one method per operation. Typed operations run via cynic (`run_typed`/`send_graphql`); compatibility fallbacks stay at this boundary |
| `src/gql_typed.rs` | **Typed cynic operations**: QueryFragment/Enum/Scalar/InputObject structs checked against the vendored SDL at compile time (`build.rs`) |
| `build.rs` | Registers `schema/unraid-schema.graphql` with cynic for compile-time query checking |
| `schema/unraid-schema.graphql` | Vendored Unraid SDL (provenance header at top) — the contract source |
| `src/mock.rs` | Scenario-driven offline mock + `classify_query` router (behind `test-support`) |
| `src/app.rs` | `UnraidService` — thin pass-through to `UnraidClient` (no business logic) |
| `src/mcp/tools.rs` | Dispatches JSON args to service methods, returns `Value` |
| `src/mcp/schemas.rs` | MCP tool JSON Schema and action enum |
| `src/mcp/rmcp_server.rs` | RMCP `ServerHandler`: tools, resources, prompts, scope checks |
| `src/mcp/routes.rs` | Axum router: `/mcp`, `/health`, OAuth discovery routes |
| `src/mcp/prompts.rs` | MCP prompts (`server_summary`) |
| `src/mcp.rs` | `AppState`, `AuthPolicy`, `build_auth_layer` |
| `src/config.rs` | Config structs, env loading, TOML parsing |
| `src/cli.rs` | CLI arg parsing, human-readable formatters |
| `src/main.rs` | Mode dispatch: HTTP server / stdio / CLI |
| `src/lib.rs` | Public API surface + `testing` helpers |

## Key patterns

**Thin shims.** Neither the CLI nor the MCP tool contains logic. They parse their input format and delegate to `UnraidService`. The service delegates to `UnraidClient`. All data retrieval is in the client's GraphQL queries.

**Projection-only MCP boundary.** `legacy` mode exposes the single `unraid(action=...)` tool; `atomic` exposes focused `unraid_<action>` tools; `both` exposes both during migration. Selectors are applied to canonical actions before projection. `rmcp_server.rs` normalizes either surface to a canonical action before scope checks, destructive elicitation, and the same `mcp/tools.rs` dispatcher. Never add a second dispatcher for atomic tools.

**GraphQL as the data layer.** `graphql.rs` POSTs to `UNRAID_API_URL` with `x-api-key: UNRAID_API_KEY`. Responses are `serde_json::Value` throughout the dispatch/CLI/MCP layers.

**Typed at the wire, `Value` downstream (cynic).** Most operations are defined as typed cynic structs in `gql_typed.rs`, checked against the vendored SDL at **compile time** — a query/mutation that selects a non-existent field or wrong arg won't compile. `run_typed` runs the op over the existing reqwest client (cynic's `http-reqwest` integration is deliberately disabled) and serialises the typed result back to `Value`, so dispatch/formatters/MCP are unchanged. cynic owns response **deserialization** (its derives generate serde `Deserialize`); structs add `serde::Serialize` for the `Value` round-trip with `#[serde(rename_all = "camelCase")]`. Input objects add `serde::Deserialize` so MCP JSON args build them via `from_value`.

**cynic gotchas** (learned the hard way): `ID!` → `cynic::Id` (not `String`); `BigInt` → string scalar, `Float`/`Int` → numbers; a Rust-keyword field (`type`, `virtual`) needs `r#type` + `#[cynic(rename = "...")]`; a GraphQL **argument** named after a keyword (`type:`) can't be expressed — `delete_notification` is omitted for this reason; enums whose SDL name differs in case (`UPSServiceState`) or whose values are lowercase (`ThemeName`) / double-underscored (`CONNECT__REMOTE_ACCESS`) need hand-written `#[cynic(graphql_type/rename)]`; namespaced mutations map to a selection — `mutation { vm { start } }` needs paired `Mutation`-root + `VmMutations`-namespace structs.

**Scope model (`schemas.rs::Scope`).** `ActionSpec.scope` is `Scope::None` (only `help`), `Scope::Read` (`unraid:read` — queries + `status`), or `Scope::Write` (`unraid:admin` — mutations). `unraid:admin` satisfies `unraid:read`, so a read-scoped token can't reach a mutation. `required_scope_for` derives gating from this single source.

**Adding an action.** Extend `ACTIONS` in `schemas.rs` with its scope and `action_params.rs` with the action's parameter contract. Add the typed operation, client method, service pass-through, shared dispatch arm, applicable CLI handling, and scenario fixtures. Review the mock router and catalog-derived test lists rather than assuming every new operation is covered automatically. Run the affected schema, projection, selector, scope, and destructive-confirmation tests so legacy and atomic tools retain the same behavior.

**Typed by default, with explicit compatibility exceptions.** New normal operations belong in `gql_typed.rs` and run through `run_typed`. The existing schema-capability probe and cross-version remove-disk fallback in `graphql.rs` use hand-written wire documents because the deployed schema can differ from the vendored SDL. Keep these exceptions at the client boundary, preserve their compatibility tests, and route every request through `send_graphql` for the same authentication, timeout, and error handling.

**Auth policy enum.** `AuthPolicy::LoopbackDev` skips all auth. `AuthPolicy::Mounted` uses `lab-auth` (bearer token or OAuth). `main.rs::build_auth_policy` selects `LoopbackDev` when `is_loopback_host` accepts the configured host or `no_auth` is set. A separate startup guard rejects unauthenticated non-loopback binds unless explicitly acknowledged; never disable it to make tests pass.

## Environment variables

```
UNRAID_API_URL                Unraid GraphQL endpoint (required)
UNRAID_API_KEY                API key for x-api-key header (required)
UNRAID_API_SKIP_TLS_VERIFY    Skip TLS cert check (default false)
UNRAID_API_CA_BUNDLE          PEM CA bundle to trust; verifies instead of skipping
UNRAID_HOME                   Exact data directory; overrides /data or ~/.unraid
UNRAID_RMCP_HOST               Bind host (default 0.0.0.0)
UNRAID_RMCP_PORT               Bind port (default 40010)
UNRAID_RMCP_PROJECTION         Tool projection: legacy (default), atomic, or both
UNRAID_RMCP_ENABLED_TOOLS      Comma-separated MCP tool/action allowlist
UNRAID_RMCP_DISABLED_TOOLS     Comma-separated MCP tool/action denylist
UNRAID_RMCP_TOKEN              Static bearer token for /mcp
UNRAID_RMCP_DISABLE_HTTP_AUTH  Disable MCP auth entirely (1/true/yes)
UNRAID_RMCP_NO_AUTH            Alias that disables MCP auth entirely (1/true/yes)
UNRAID_RMCP_ALLOWED_HOSTS      Extra comma-separated Host header values
UNRAID_RMCP_ALLOWED_ORIGINS    Extra comma-separated CORS origins
UNRAID_RMCP_PUBLIC_URL         Public URL for OAuth metadata
UNRAID_RMCP_AUTH_MODE          Auth mode: `bearer` (default) or `oauth`
UNRAID_RMCP_AUTH_ADMIN_EMAIL   Admin email for OAuth policy
UNRAID_RMCP_GOOGLE_CLIENT_ID       Google OAuth client ID
UNRAID_RMCP_GOOGLE_CLIENT_SECRET   Google OAuth client secret
UNRAID_NOAUTH                 Permits a NON-loopback bind without auth being mounted.
                              This is NOT the same as the two flags above — it does
                              NOT disable auth; it only lifts main.rs's safety check
                              that otherwise refuses a non-127.x bind in no-auth mode.
RUST_LOG                      Log filter
```

The binary loads `<UNRAID_HOME>/.env` when the override is set, otherwise
`~/.unraid/.env` (or `/data/.env` in a container), before `Config::load` — see
`load_dotenv()` in `config.rs`. A symlinked `.env` is refused (symlink-attack guard).
Non-empty process values win; empty plugin placeholders are filled from `.env` when
a persisted value exists. A malformed persisted `.env` fails startup instead of
silently skipping later policy or credential entries.

## How to add a new action

`src/mcp/schemas.rs::ACTIONS` is the sole action/scope catalog. Add one
`ActionSpec { name: "your_action", scope: Scope::Read }` for a query or
`Scope::Write` for a mutation. `Scope::None` is reserved for scope-free metadata
such as `help`; there is no `read_only` field on `ActionSpec`. Unknown actions
remain denied. Never maintain a second list of authorized actions.

1. Add the typed cynic operation/input types in `src/gql_typed.rs` against the
   vendored SDL, the `run_typed` client method in `src/graphql.rs`, and the
   service delegation in `src/app.rs`. Keep API-version fallbacks in the client.
2. Add the canonical catalog entry and the dispatch arm in
   `src/mcp/tools.rs::dispatch_action`. Update help text and
   `src/mcp/action_params.rs` parameter membership and required-parameter metadata.
3. For destructive operations, extend `src/mcp/elicitation.rs`'s destructive
   catalog and its tests. Scope authorization and destructive confirmation are
   different gates; preserve both.
4. Add CLI parsing/dispatch/formatting under `src/cli/` when the operation
   belongs on that surface. Document intentional CLI/MCP differences.
5. Extend the scenario fixtures and schema/dispatch tests. Run focused tests
   covering legacy and atomic projection, selectors, missing arguments, scope
   denial, and destructive-action refusal as applicable.

`tool_filter.rs` filters canonical actions before `projected_tool_definitions`
creates legacy, atomic, or combined schemas. `rmcp_server.rs` normalizes either
MCP surface before policy checks and the shared dispatcher. Prompts and the
schema resource must reflect the active projection too. Do not implement a
parallel atomic dispatcher or authorization list.

## Common gotchas

- **BigInt fields** from the Unraid GraphQL API arrive as JSON strings, not numbers. See `bigint_f64()` in `cli.rs`. Memory sizes in the `metrics` query use this pattern.
- **Temperature unit** is a GraphQL enum (`CELSIUS`, `FAHRENHEIT`, `KELVIN`). See `temp_unit_symbol()` in `cli.rs`.
- **`flash.guid`** is declared non-nullable in the Unraid schema but can be null at runtime. The query omits it.
- **Default port**: the built-in default in `config.rs` (`default_mcp_port()`) is **40010**, matching `config.toml`. The project runs on 40010.
- **Scopes**: `unraid:read` is required for every data action (including `status`). `unraid:admin` satisfies `unraid:read`. `help` has no scope requirement.
- **Pagination + truncation (MCP surface only)**: list actions accept optional `limit`/`offset` (and `state`/`name` filters where relevant) and return a `{items, total, limit, offset, has_more, next_offset}` envelope. MCP responses are truncated at ~40 KB. Neither pagination nor the truncation cap is exposed through the CLI.
- **Tests** in `tests/` use stub clients pointing at `http://localhost:1/graphql`. They do not need a real Unraid server.

## Test files

| File | What it tests |
|------|---------------|
| `tests/auth_modes.rs` | Auth middleware: LoopbackDev, bearer, OAuth; `/health`, `/mcp`, well-known routes |
| `tests/cli_help.rs` | `--help` and `--version` flags |
| `tests/oauth_flow.rs` | RS256 JWT acceptance/rejection, scope checks, expired/wrong-issuer tokens |
| `tests/rmcp_compat.rs` | RMCP stateless JSON-response mode, SSE negotiation |
| `tests/stdio_mcp.rs` | stdio child-process transport: `tools/list` then `tools/call` |
| `tests/spike_rmcp_extensions.rs` | Axum extension propagation into tool handlers |
| `tests/scenarios.rs` | Scenario-driven mock: every action dispatches across all scenarios (also proves `classify_query` routing) |
| `tests/schema_contract.rs` | Validates every `graphql.rs` query AND every fixture against the vendored Unraid SDL (`apollo-compiler`) — the drift guardrail |

## Mocking the Unraid upstream (no real server needed)

The mock in `src/mock.rs` (behind `test-support`) recognizes the operation and
returns fixture JSON from `tests/fixtures/scenarios/*.json`. Typed cynic response
deserialization still runs at the client boundary before results become `Value`
for CLI/MCP presentation. Fixtures must satisfy those types as well as the
vendored schema; arbitrary opaque JSON is not sufficient.

- **Fixtures.** `healthy.json` is a full realistic snapshot (the supported query and mutation
  payloads). `degraded.json`, `parity-running.json`, `disk-failing.json` are
  thin overlays that replace only the fixture keys that differ; `_`-prefixed
  keys are docs and ignored. `Scenario::load` merges base + overlay.
- **Routing.** `mock::classify_query(query)` parses the GraphQL AST, including
  operation type, root field, and relevant sub-selection. Namespaced mutations
  such as `vm { start }` map to action keys such as `vm_start`; Docker Organizer
  mutations have explicit prefixed mappings. Query exceptions include
  `docker { logs }` and abbreviated UPS action names. Extend these mappings when
  needed rather than assuming every new field routes automatically.
- **Fixture field types mirror the real SDL** (`api/generated-schema.graphql` in
  `unraid/api`), not a guess. The split that matters:
  - `BigInt` scalars arrive as JSON **strings** (KB): `ArrayDisk.size`/`fsSize`/
    `fsFree`/`fsUsed`/`numReads`/`numWrites`/`numErrors`, `Share.free`/`used`/
    `size`, `MemoryLayout.size`, `MemoryUtilization.*`, `Capacity.*`.
  - `Float!`/`Int!` arrive as JSON **numbers**: `Disk.size`/`DiskPartition.size`
    (bytes), `LogFile.size` (bytes).
  - Enums are exact: `DiskSmartStatus` = `{OK, UNKNOWN}` (no `FAILING`);
    `ArrayDiskType` = `DATA|PARITY|CACHE|BOOT|FLASH` (UPPERCASE);
    `ArrayDiskStatus` = `DISK_OK|DISK_DSBL|…`; `ArrayDiskFsColor` = `GREEN_ON|…`.
  - A failing disk is signalled by `UNKNOWN` SMART + array `numErrors`/`DISK_DSBL`
    + an ALERT notification — there is no `FAILING` SMART value.
  Note: the CLI formatters must read BigInt size fields with `bigint_f64`/
  `bigint_opt` (string-or-number aware), **not** `as_i64`/`as_f64` — the latter
  silently render `0` against real (string) data (fixed in `src/cli/format.rs`;
  see the bigint regression tests there).
- **Standalone server** (`examples/mock_unraid.rs`): `just mock [scenario]` or
  `cargo run --features test-support --example mock_unraid -- --scenario degraded --port 8999`. Point
  `UNRAID_API_URL` at `http://127.0.0.1:PORT/graphql`, set any `UNRAID_API_KEY`,
  then drive the real `runraid` CLI / `serve mcp` / Claude skill. Hot-swap the
  scenario live: `curl -XPOST http://127.0.0.1:PORT/scenario/disk-failing`.
  `--require-key KEY` exercises the upstream-auth (401) path.
- **Schema-as-contract guard** (`tests/schema_contract.rs`). The vendored SDL
  `schema/unraid-schema.graphql` (provenance comment at the top — copied
  from `unraid/api`, re-copy when Unraid ships an API change) is the source of
  truth. The test validates **every query** `graphql.rs` sends and **every
  fixture leaf** (scalar JSON-type + enum membership) against it via
  `apollo-compiler`. This is what mechanically catches drift — it already caught
  two real production query bugs (`docker_logs` selected the non-existent
  `logLineUrl` and treated `lines` as a scalar; `ups` queried `loadPercent`
  instead of `loadPercentage`). It is **lenient on nullability** (the real server
  violates its own non-null types, e.g. `flash.guid`) and does **not** prove a
  real server returns fixture-shaped data — only a live test does.

## CLI ↔ MCP action parity

Most data actions exist on both surfaces, but the two are **not** a perfect mirror —
there are known, intentional gaps:

- **`status`** is **MCP-only** — it is an observability action with no CLI command.
- **`doctor`** and **`setup`** (incl. `setup install` / `setup plugin-hook`) are
  **CLI-only** — they are not exposed as MCP actions.
- **Pagination/filtering** (`limit`/`offset`/`state`/`name`) and the **~40 KB
  response truncation** are part of the **MCP surface only**; the CLI does not take
  these params.

The `help` MCP action maps to `runraid --help`.

| Service Method | MCP Action | CLI Command |
|---|---|---|
| `service.array()` | `unraid(action="array")` | `runraid array` |
| `service.disks()` | `unraid(action="disks")` | `runraid disks` |
| `service.docker()` | `unraid(action="docker")` | `runraid docker` |
| `service.docker_logs(id, tail)` | `unraid(action="docker_logs", id=…, tail=…)` | `runraid docker logs <id> [--tail N]` |
| `service.vms()` | `unraid(action="vms")` | `runraid vms` |
| `service.server()` | `unraid(action="server")` | `runraid server` |
| `service.info()` | `unraid(action="info")` | `runraid info` |
| `service.shares()` | `unraid(action="shares")` | `runraid shares` |
| `service.notifications()` | `unraid(action="notifications")` | `runraid notifications` |
| `service.log_files()` | `unraid(action="log_files")` | `runraid log-files` |
| `service.log_file(path, lines, start_line)` | `unraid(action="log_file", path=…, lines=…, start_line=…)` | `runraid log <path> [--lines N] [--start-line N]` |
| `service.services()` | `unraid(action="services")` | `runraid services` |
| `service.network()` | `unraid(action="network")` | `runraid network` |
| `service.ups()` | `unraid(action="ups")` | `runraid ups` |
| `service.ups_config()` | `unraid(action="ups_config")` | `runraid ups-config` |
| `service.metrics()` | `unraid(action="metrics")` | `runraid metrics` |
| `service.plugins()` | `unraid(action="plugins")` | `runraid plugins` |
| `service.parity_history()` | `unraid(action="parity_history")` | `runraid parity-history` |
| `service.vars()` | `unraid(action="vars")` | `runraid vars` |
| `service.registration()` | `unraid(action="registration")` | `runraid registration` |
| `service.flash()` | `unraid(action="flash")` | `runraid flash` |
| `service.rclone()` | `unraid(action="rclone")` | `runraid rclone` |
| `service.remote_access()` | `unraid(action="remote_access")` | `runraid remote-access` |
| `service.connect()` | `unraid(action="connect")` | `runraid connect` |
| `service.status()` | `unraid(action="status")` | _(MCP-only — no CLI command)_ |
| _(meta)_ | `unraid(action="help")` | `runraid --help` |
| _(CLI-only)_ | _(no MCP action)_ | `runraid doctor` |
| _(CLI-only)_ | _(no MCP action)_ | `runraid setup [install\|plugin-hook]` |

## Build commands

```bash
cargo build --release     # produces target/release/runraid
just dev                  # cargo run -- serve mcp
just test                 # cargo nextest run
just lint                 # cargo clippy -- -D warnings
just fmt                  # cargo fmt
just gen-token            # openssl rand -hex 32
```


## Work tracking and completion

Use `bd prime` when the local Beads database is available. A database migration
blocker is not permission to migrate a shared store. Follow the root
[AGENTS.md](../AGENTS.md) completion policy: preserve other work, run relevant
gates, and commit/push only within the user's authorization. Never clear
stashes or prune worktrees as an automatic documentation-cleanup step.
