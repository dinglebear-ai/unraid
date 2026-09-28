---
title: Repository architecture
created: 2026-09-27
updated: 2026-09-27
---

# Repository architecture

This monorepo contains two independent MCP implementations, three Unraid OS
plugins, and two client-agent integrations. They share repository/release
policy, **not** one application runtime. See [AGENTS.md](../AGENTS.md) for
component paths and package identities.

## Execution paths

The Python server follows:

```text
MCP transport/auth -> unraid(action, subaction)
                  -> domain handler -> shared GraphQL client -> Unraid API
Live resources    -> subscription manager -> graphql-transport-ws -> Unraid API
```

Its entry point is `unraid-py/src/unraid_mcp/main.py`; `server.py` assembles
FastMCP and middleware. Domain handlers, schema documents, confirmation
guards, response bounds, and HTTP retry/rate limits are separate modules.
Do not add query caching over the entire consolidated tool: it also performs
mutations. Upstream request pacing is distinct from inbound abuse protection.

The Rust server follows:

```text
HTTP/stdio MCP -> projection/policy -> canonical action -> scope/confirmation
               -> shared dispatcher -> service -> typed GraphQL client -> API
CLI arguments  -> CLI dispatch -----------------> service -> same client -> API
```

`ACTIONS` in `unraid-rs/src/mcp/schemas.rs` owns action identity and scope.
`tool_filter.rs` applies selectors before `legacy`, `atomic`, or `both`
projection. `action_params.rs` owns parameter membership/requirements.
`rmcp_server.rs` normalizes the surface before policy checks and
`tools.rs::dispatch_action`. Projection is not a provider or second backend.

Cynic operations in `gql_typed.rs` are checked against the vendored SDL;
`graphql.rs` owns HTTP transport and typed execution. Results become
`serde_json::Value` for CLI/MCP presentation. Compatibility fallbacks, including
old/new remove-disk APIs, belong at the GraphQL boundary, not in projections.
See the [Rust architecture guide](../unraid-rs/docs/stack/ARCH.md).

## Packaging boundaries

`agents/unraid-py/` launches `uvx unraid-mcp` over stdio.
`agents/unraid-rs/` launches the `@dinglebear/unraid` npm wrapper, which runs the
Rust binary. These are client manifests/settings/skills, not Unraid OS plugins.
They declare no Claude hooks; `.mcp.json` maps the supported user settings.

`plugins/mcp/` installs the Rust server on Unraid and provides its settings UI.
The binary version must match the requested package version.

`plugins/incus/` owns OS daemon installation, lifecycle, networking, storage,
and initialization. Its nested NestJS API plugin talks to Incus's Unix-socket
REST API. Vue settings/dashboard bundles are shipped inside the classic
package. The API plugin does not replace classic OS installation.

`plugins/codex/` supplies the chathead UI and app-server integration. Its
container workspace instruction template is runtime payload, distinct from
the repository's AGENTS/CLAUDE/GEMINI developer-instruction links.

## Trust and configuration

Unraid API credentials authenticate **outbound** GraphQL requests. MCP bearer
and OAuth credentials authenticate **inbound** clients. Do not interchange
them or assume stdio and HTTP share the same trust boundary.

Both implementations can mutate a server. Rust read/write scopes and Python
confirmation guards are not substitutes for selecting the correct target.
The OS plugins additionally install services and alter host state; their live
release gates require a disposable Unraid environment.

Each component owns its configuration loader and persistence path. Python's
canonical credential directory is `~/.unraid-mcp`; Rust uses `UNRAID_HOME`,
container `/data`, or `~/.unraid` according to its loader. Consult the component
guide before changing precedence, TLS, loopback auth, or placeholder handling.
Never consolidate these conventions through a drive-by documentation rename.

## Contracts and change impact

Changing a Rust action can affect its catalog, parameter schema, typed query,
service/dispatcher, CLI, fixtures, prompt/schema resource, scopes, and client
allowlists. Keep one canonical operation path and extend the relevant contract
tests. Changing Python routing can affect its tool reference, handler dispatch,
query/mutation inventory, mock fixtures, and destructive-action tests.

Cross-component changes also need marketplace parity, version-sync, release
tag/manifest, action allowlist, and documentation checks. The root CI workflows
are path-scoped; adding a new shared file requires checking its trigger coverage.
See [development](DEVELOPMENT.md) and [release](RELEASING.md) guides.
