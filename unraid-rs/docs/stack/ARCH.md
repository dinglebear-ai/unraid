# Architecture — unraid-rmcp

`unraid-rmcp` exposes Unraid GraphQL queries and mutations through MCP and the
`runraid` CLI. The canonical operation/scope catalog is
`src/mcp/schemas.rs::ACTIONS`; consult it instead of maintaining prose counts.

## Request flow

```text
HTTP MCP -> host/origin/auth middleware -> RMCP handler
stdio MCP -----------------------------> RMCP handler
    -> resolve legacy/atomic tool name to canonical action
    -> enabled-action policy, scope check, argument/confirmation guards
    -> tools.rs::dispatch_action -> UnraidService -> UnraidClient
    -> typed cynic operation over reqwest -> Unraid GraphQL API
    -> typed result -> serde_json::Value -> bounded MCP response

CLI -> src/cli parsing/dispatch -> UnraidService -> same UnraidClient
    -> typed result -> Value -> human-readable or JSON output
```

`legacy` is the default MCP projection. It exposes `unraid(action=...)`.
`atomic` exposes focused `unraid_<action>` tools; `both` exposes both.
Selectors apply to canonical actions before projection, so disabling an
action cannot be bypassed by choosing the other surface. The shared
normalization/dispatcher also keeps authorization and confirmation consistent.

## Ownership by module

| Source | Responsibility |
| --- | --- |
| `src/main.rs` | Startup, mode selection, auth policy, and non-loopback safety check |
| `src/config.rs` | TOML/environment configuration and persistence precedence |
| `src/mcp/schemas.rs` | Canonical actions/scopes and projected tool definitions |
| `src/mcp/action_params.rs` | Action parameter membership and requirements |
| `src/mcp/tool_filter.rs` | Canonical enable/disable selectors |
| `src/mcp/rmcp_server.rs` | Projection normalization, MCP handler, scopes, schema resource |
| `src/mcp/elicitation.rs` | Destructive-operation confirmation |
| `src/mcp/tools.rs` | Shared dispatch and response shaping |
| `src/app.rs` | Thin service delegation |
| `src/graphql.rs` | HTTP requests, typed operation execution, API-version compatibility |
| `src/gql_typed.rs` and `build.rs` | Cynic types checked against the vendored schema |
| `src/cli/` | Commands, parsing, dispatch, and formatting |
| `src/mock.rs` | Offline scenario-driven upstream behind `test-support` |

Do not place GraphQL business logic in MCP projection or create a parallel
atomic dispatcher. API-version differences, such as remove-disk operation
shapes, belong at the client boundary and require regression fixtures/tests.

## Authentication and safety

Inbound MCP credentials are distinct from the outbound Unraid API key.
`main.rs::build_auth_policy` selects loopback development policy using
`is_loopback_host` or the explicit no-auth setting. A separate startup check
protects unauthenticated non-loopback HTTP binds. Do not weaken either gate
for convenience. Stdio is a trusted local pipe; CLI is local execution.

For authenticated MCP calls, `Scope::Read` requires `unraid:read`,
`Scope::Write` requires `unraid:admin`, and admin includes read access. Only
scope-free metadata such as `help` uses `Scope::None`. Unknown actions remain
denied. Destructive confirmation is separate from scope authorization.

The health endpoint is unauthenticated and is not evidence that upstream
operations are working. A live test requires an explicitly chosen disposable
Unraid target, especially for mutation and package-lifecycle checks.

## Typed wire contract and output

Cynic validates operations against `schema/unraid-schema.graphql`; the shared
reqwest transport sends them with `x-api-key`. Results become JSON Values
above the wire boundary. Schema-contract tests validate operations/fixtures,
not every behavior of a deployed API. Preserve nullability/BigInt defenses
and version compatibility where real servers differ from captured schemas.

MCP list pagination/filtering and response-size bounds are not automatically
CLI features. `status` is MCP-only; setup/doctor are CLI-only. Keep examples
explicit about the surface rather than promising perfect CLI/MCP parity.

## Discovery and errors

The `unraid://schema/mcp-tool` resource describes the active projected tool
catalog; `server_summary` is projection-aware. Update discovery tests whenever
action filtering or schema generation changes.

Configuration failures should fail startup visibly. Invalid tool names,
arguments, policy, or scopes are rejected at the MCP boundary; upstream HTTP,
GraphQL, and TLS errors retain contextual diagnostics without leaking
credentials. Prefer a trusted CA bundle over disabling TLS verification.

See [TECH.md](TECH.md), [component guide](../../AGENTS.md), and
[repository architecture](../../../docs/ARCHITECTURE.md).
