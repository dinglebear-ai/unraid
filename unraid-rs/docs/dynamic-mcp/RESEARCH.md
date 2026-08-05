# Research Record

Research date: 2026-08-05

This file records the evidence used to design dynamic schema-driven MCP tools. Verified facts are separated from design decisions and implementation checks.

## Revisions

| Source | Revision |
|---|---|
| `dinglebear-ai/unraid` | `ffe5d06c00acb59526592d1e37bc01db8425c440` |
| `unraid/api` | `98034ff8405d8f1322daca9bd4d7d7dccc262810` |
| MCP specification | `2026-07-28` |
| Rust MCP SDK | `rmcp-v3.1.0`, `1f9358eddca42d3a510c70ae6446dd6548c7c856` |
| Google Workspace CLI | current main during research |

## Current Rust server

### Static tool registration

Files:

- `unraid-rs/src/mcp/schemas.rs`
- `unraid-rs/src/mcp/rmcp_server.rs`
- `unraid-rs/src/mcp/tool_filter.rs`

Verified:

- `ACTIONS` is the canonical static action list.
- Each action carries `Scope::None`, `Scope::Read`, or `Scope::Write`.
- `tool_definitions()` renders one MCP tool named `unraid` with a shared argument object and an `action` enum.
- `list_tools` derives the enum from configured enabled actions.
- `required_scope_for()` looks up `ACTIONS`.
- Tool selectors are validated against `ACTIONS`.
- A test asserts that the entire MCP surface is exactly one tool named `unraid`.

Consequence: new upstream operations cannot appear without updating the static registry, schemas, policy tests, and dispatch.

### Static dispatch

File: `unraid-rs/src/mcp/tools.rs`

Verified:

- `execute_tool()` accepts a tool name and JSON arguments.
- The only accepted tool name is `unraid`.
- `dispatch_action()` contains the handwritten action match.
- Argument extraction, pagination, service calls, and error classification meet inside the dispatcher.

Consequence: ordinary schema-described operations need catalog lookup and a generic executor. Curated helpers may remain handwritten.

### Existing GraphQL transport

File: `unraid-rs/src/graphql.rs`

Verified:

- `UnraidClient::send_graphql()` already sends an assembled GraphQL HTTP body.
- It uses the configured endpoint and `x-api-key` header.
- It applies a 30-second timeout.
- It classifies transport, 401/403, non-success HTTP, malformed JSON, GraphQL errors, and missing `data` failures.
- `run_typed()` sends Cynic operations through the same transport.

Consequence: the dynamic executor should expose a safe crate-visible wrapper around this transport rather than create another HTTP path.

### Typed GraphQL and contract tests

Files:

- `unraid-rs/src/gql_typed.rs`
- `unraid-rs/build.rs`
- `unraid-rs/schema/unraid-schema.graphql`
- `unraid-rs/tests/schema_contract.rs`

Verified:

- Cynic operations are checked against the vendored SDL at compile time.
- The schema contract test captures outgoing queries and mutations and validates them using `apollo-compiler`.
- The test documents that SDL validity does not prove live runtime values match nullability or scalar expectations.

Consequence: typed curated operations remain useful, but compile-time fragments cannot provide zero-touch runtime discovery. Typed and dynamic paths should coexist.

### Existing elicitation

File: `unraid-rs/src/mcp/elicitation.rs`

Verified:

- The server already uses native typed form elicitation through `Peer<RoleServer>::elicit`.
- There is no confirmation tool argument or bypass.
- Unsupported capability, decline, cancel, malformed response, or other elicitation failure stops the operation before the upstream call.
- The current registry covers a static subset of destructive legacy actions.
- Ordinary legacy mutations do not all elicit today.

Design decision: every generated mutation elicits. Existing legacy behavior remains unchanged until a separate migration decision is made.

### Application state and configuration

Files:

- `unraid-rs/src/mcp.rs`
- `unraid-rs/src/config.rs`

Verified:

- `AppState` owns `McpConfig`, `AuthPolicy`, `UnraidService`, and shared counters.
- Tool policy is nested under `[mcp.tools]`.
- The persistent data directory defaults to `/data` in containers and {{$BT}}HOME/.unraid` locally.

Consequence: dynamic runtime state should be clone-cheap shared state in `AppState`. The cache default should use `default_data_dir().join("dynamic-schema-cache.json")`.

### Current MCP behavior

File: `unraid-rs/src/mcp/rmcp_server.rs`

Verified:

- The server advertises tools, resources, and prompts.
- It does not advertise tool-list changes.
- Results are returned as pretty JSON text, not structured content.

Consequence: dynamic tools should advertise list changes only after notification delivery is implemented, and return structured content matching their output schema.

## Upstream Unraid API

### Schema construction

File: `api/src/unraid-api/graph/graph.module.ts`

Verified:

- NestJS generates the schema automatically.
- Development writes `./generated-schema.graphql`; other environments keep the schema in memory.
- The HTTP and GraphQL WebSocket endpoint is `/graphql`.
- The schema includes `UsePermissionsDirective` outside tests.
- Schema transforms apply permission documentation and omit conditional fields.
- Subscriptions use `graphql-ws`.

### Introspection policy

Files:

- `api/src/unraid-api/graph/introspection-plugin.ts`
- `api/src/unraid-api/graph/introspection-plugin.spec.ts`
- `api/src/unraid-api/config/api-config.module.ts`
- `api/src/unraid-api/graph/resolvers/settings/settings.service.ts`

Verified:

- The developer sandbox defaults to disabled.
- Its value is read dynamically per request.
- Full introspection is blocked when the operation name is `IntrospectionQuery` or the query contains a root `__schema` field.
- The plugin deliberately permits `__type` and `__typename`.
- Tests explicitly allow `__type(name: "User")` while the sandbox is disabled.

Consequence: the compiler can crawl reachable types with batched `__type` queries without enabling the sandbox. The standard full introspection query must not be the primary strategy.

### Permission metadata

File: `packages/unraid-shared/src/use-permissions.directive.ts`

Verified:

- Resolver decorators apply actual `nest-authz` authorization.
- The decorator also emits `@usePermissions(action: ..., resource: ...)` into SDL.
- A schema transformer prepends a structured `Required Permissions` section to field descriptions.
- Directive values are runtime-validated against TypeScript enums.

Consequences:

- Standard introspection does not reliably expose directives applied to fields.
- `__type` exposes descriptions, which may contain the transformed permission section.
- Description parsing may enrich catalog metadata but cannot be a security dependency.
- Queries require coarse `unraid:read`, mutations require `unraid:admin`, and the upstream API remains the fine-grained authority.

### Schema inventory

The vendored SDL at `unraid-rs/schema/unraid-schema.graphql` currently has:

| Kind | Count |
|---|---:|
| root queries | 58 |
| root mutations | 45 |
| root subscriptions | 17 |
| objects | 147 |
| input objects | 43 |
| enums | 40 |
| interfaces | 2 |
| unions | 0 |
| custom scalars | 6 |

Custom scalars are `DateTime`, `BigInt`, `JSON`, `Port`, `URL`, and `PrefixedID`.

### Mutation namespaces

Nine root mutation fields return namespace objects:

| Type | Leaves |
|---|---:|
| `ArrayMutations` | 6 |
| `DockerMutations` | 10 |
| `VmMutations` | 7 |
| `ApiKeyMutations` | 5 |
| `CustomizationMutations` | 2 |
| `ParityCheckMutations` | 4 |
| `RCloneMutations` | 2 |
| `OnboardingMutations` | 10 |
| `UnraidPluginsMutations` | 2 |

There are 48 nested mutation leaves. Catalog compilation must recurse through these namespace objects and expose paths such as `mutation.docker.restart` and `mutation.array.setState`.

### Subscriptions

The schema has 17 subscriptions covering display, notifications, owner/server state, parity, array, Docker statistics, logs, metrics, UPS updates, and plugin installation events.

Decision: retain subscription metadata in diagnostics, but do not expose subscriptions as ordinary v1 tools.

## MCP and RMCP

### MCP protocol

Source: `modelcontextprotocol/modelcontextprotocol`, protocol `2026-07-28`.

Verified:

- Servers advertise `tools.listChanged` when they emit tool-list notifications.
- Tool sets may change over time and may be filtered by request authorization.
- Tool order should be deterministic.
- Tools may include input schema, output schema, annotations, and metadata.
- Ordinary execution failures should normally be visible tool-level errors.

### RMCP 3.1.0

Verified at tag `rmcp-v3.1.0`:

- `Tool` supports raw input and output schemas, annotations, and metadata.
- `ServerCapabilitiesBuilder::enable_tool_list_changed()` exists.
- `Peer<RoleServer>::notify_tool_list_changed()` exists.
- `CallToolResult` supports `structured_content`.
- `Peer<RoleServer>::elicit<T>()` supports typed form elicitation and fails when the client did not advertise it.

## Google Workspace CLI

Files reviewed:

- `crates/google-workspace/src/discovery.rs`
- `crates/google-workspace-cli/src/commands.rs`
- `crates/google-workspace-cli/src/main.rs`

Verified:

- Discovery documents are fetched and cached at runtime.
- Resources and methods form a runtime model.
- The CLI command tree is built recursively from that model.
- Ordinary calls use a generic executor.
- Special helper commands remain handwritten.

Transferable pattern: runtime model, generic execution, optional helpers.

GraphQL-specific addition: selection planning and recursive type crawling are required because object-returning fields cannot execute without a selection set.

## Resolved gaps

| Gap | Resolution |
|---|---|
| Production blocks `__schema` | Targeted batched `__type` crawler |
| Mutations contain namespace objects | Recursive leaf operation compilation |
| Applied directives are not portable through introspection | Optional permission-description parsing plus coarse scope fallback |
| Object returns require fields | Bounded deterministic selection planner |
| New input scalar is unknown | Disable affected operation until an adapter exists |
| New mutation risk is unknown | Disabled by default and always elicited when enabled |
| Client caches tools | Atomic swap plus `notifications/tools/list_changed` |
| Existing callers use `unraid` | `legacy` and `hybrid` modes |
| Cache might belong to another server | Endpoint fingerprint in the cache envelope |

## Required live verification during implementation

1. Run `__type(name: "Query")` against a current server with sandbox disabled and capture the exact response.
2. Check whether live field descriptions contain the transformed permission section.
3. Measure a safe batch size for aliased `__type` requests.
4. Verify peer notification delivery for Streamable HTTP and stdio with pinned RMCP 3.1.0.
5. Verify target clients re-list after `notifications/tools/list_changed`.
6. Verify live wire values for `BigInt`, `Port`, `PrefixedID`, and `JSON`.
7. Measure catalog compilation time and generated `tools/list` payload size.
8. Test client behavior with the complete query set and a small enabled mutation set.

## Existing documentation drift

Some older stack and inventory files contain historical claims about RMCP versions, read-only behavior, or the absence of typed GraphQL responses. This package follows current code and manifests. Updating those files is an explicit implementation-plan task rather than an unrelated edit in the design commit.
