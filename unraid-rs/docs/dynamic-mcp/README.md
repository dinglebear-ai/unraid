# Dynamic Schema-Driven MCP Tools

Status: design complete, implementation not started

This package defines how `unraid-rmcp` will discover the live Unraid GraphQL surface and expose ordinary API operations as MCP tools without adding a Rust action, argument schema, service method, and dispatcher arm for every upstream change.

The design borrows the useful pattern from Google Workspace CLI: load an API description at runtime, normalize it into a catalog, render commands or tools from the catalog, and execute ordinary methods through one generic transport engine. Handwritten Rust remains for behavior a schema cannot express, including curated workflows, compatibility aliases, pagination helpers, custom scalar adapters, risk overrides, and streaming features.

## Documents

| Document | Purpose |
|---|---|
| [RESEARCH.md](RESEARCH.md) | Verified repository findings and source revisions |
| [CONTRACT.md](CONTRACT.md) | Normative external, security, compatibility, and failure contract |
| [SPEC.md](SPEC.md) | Complete runtime behavior and algorithms |
| [TYPES.md](TYPES.md) | Proposed Rust types, enums, configuration, and invariants |
| [MODELS.md](MODELS.md) | Domain models, ownership, relationships, and state transitions |
| [SCHEMA.md](SCHEMA.md) | Introspection, GraphQL-to-JSON-Schema, tool schemas, and cache format |
| [IMPLEMENTATION-PLAN.md](IMPLEMENTATION-PLAN.md) | Master plan and ordered phase index |
| [implementation/](implementation/) | Bite-sized implementation tasks, each designed for roughly ten focused minutes |

## Source snapshot

Research was performed on 2026-08-05 against:

| Source | Revision |
|---|---|
| `dinglebear-ai/unraid` | `ffe5d06c00acb59526592d1e37bc01db8425c440` |
| `unraid/api` | `98034ff8405d8f1322daca9bd4d7d7dccc262810` |
| MCP specification | protocol `2026-07-28` |
| Rust MCP SDK | `rmcp-v3.1.0`, commit `1f9358eddca42d3a510c70ae6446dd6548c7c856` |
| Google Workspace CLI | current `googleworkspace/cli` main branch during research |

## Current problem

The current Rust server exposes one MCP tool named `unraid`. A required `action` argument selects an entry in the static `ACTIONS` slice in `src/mcp/schemas.rs`. Execution then enters the handwritten action match in `src/mcp/tools.rs` and calls handwritten service and GraphQL methods.

This gives curated behavior and compile-time checks, but routine upstream growth requires coordinated Rust edits and a release. The target architecture changes the source of truth:

```text
Live Unraid GraphQL type graph
          |
          v
Targeted __type crawler
          |
          v
Normalized type registry
          |
          v
Compiled operation catalog
        /   \
       v     v
MCP tools   Generic GraphQL executor
       \     /
        v   v
     Unraid GraphQL API
```

## Verified upstream shape

The vendored Unraid SDL currently contains:

- 58 root query fields
- 45 root mutation fields
- 9 mutation namespace object types
- 48 nested mutation leaf fields beneath those namespaces
- 17 subscription fields
- 147 object types
- 43 input object types
- 40 enums
- 2 interfaces
- 6 custom scalars: `DateTime`, `BigInt`, `JSON`, `Port`, `URL`, and `PrefixedID`

Several mutations are namespace paths rather than directly callable root leaves. For example:

```graphql
mutation DynamicVmStart($id: PrefixedID!) {
  vm {
    start(id: $id)
  }
}
```

The compiler must therefore produce an operation path such as `mutation.vm.start`, not expose the root `vm` container as a callable mutation.

## Critical introspection finding

Production Unraid blocks standard `__schema` introspection unless the developer sandbox is enabled. Its introspection plugin explicitly permits `__type` queries.

The compiler will use a targeted crawler:

1. Request `__type(name: "Query")` and `__type(name: "Mutation")`.
2. Enqueue every referenced named type.
3. Fetch queued types in bounded aliased batches.
4. Continue until the reachable graph is complete.
5. Normalize and validate the graph before compiling tools.
6. Fall back to an endpoint-matched last-known-good cache when live discovery fails.

The design does not require enabling the Unraid developer sandbox.

## Core decisions

### Runtime catalog, not generated Rust source

The server compiles an immutable catalog in memory. A refresh builds a candidate off to the side and atomically replaces the active `Arc<OperationCatalog>` only after complete validation.

### Surface modes

| Mode | MCP behavior |
|---|---|
| `legacy` | Existing single `unraid` tool only |
| `expanded` | Individual generated tools plus explicitly registered curated helpers |
| `hybrid` | Legacy `unraid` tool and generated tools together |

Dynamic mode starts disabled. Initial rollout uses `hybrid` so existing LABBY calls remain valid while generated tools are verified.

### Queries

Discovered queries may be automatically enabled. They require `unraid:read` and are filtered from `tools/list` when the caller lacks the required scope.

### Mutations

Discovered mutations are disabled by default. Operators explicitly enable exact operation paths or approved patterns.

Every enabled generated mutation uses native MCP form elicitation immediately before execution. This is structural behavior, not a configurable confirmation feature.

There is no `confirmed` tool argument, approval token, environment bypass, or weaker mode. Missing client capability, decline, cancel, timeout, or malformed response prevents the upstream mutation.

`destructive = true` changes the elicitation wording, audit severity, and MCP `destructiveHint` only. It never controls whether elicitation occurs.

### No raw GraphQL

Models never provide a GraphQL document. They call a generated tool and provide JSON arguments. Optional response selection uses schema-validated field paths under a reserved `__mcp` object.

### Last-known-good behavior

A failed refresh cannot replace a working catalog. The server validates the candidate, computes a deterministic hash, persists it atomically, swaps it atomically, then notifies capable MCP peers that the tool list changed.

### Subscriptions

The crawler records subscriptions for diagnostics, but v1 does not expose them as request-response tools. Streaming requires a separate MCP resource or subscription design.

## Configuration

```toml
[mcp.dynamic]
enabled = true
surface = "hybrid"
refresh_interval = "1h"
auto_enable_queries = true
auto_enable_mutations = false
default_selection_depth = 2
max_selection_depth = 5
cache_last_known_good = true
cache_path = "/data/dynamic-schema-cache.json"

[mcp.dynamic.operations."mutation.vm.start"]
enabled = true

[mcp.dynamic.operations."mutation.updateSettings"]
enabled = true
destructive = true
```

There is intentionally no `confirmation` or `elicitation` setting. Dynamic mutations always elicit.

## Proposed module layout

```text
src/mcp/dynamic/
  mod.rs
  config.rs
  introspection.rs
  crawler.rs
  types.rs
  models.rs
  catalog.rs
  policy.rs
  naming.rs
  json_schema.rs
  selection.rs
  document.rs
  validate.rs
  execute.rs
  cache.rs
  refresh.rs
  peers.rs
  redact.rs
```

Existing modules gain narrow integration seams:

- `src/config.rs`: `DynamicMcpConfig`
- `src/mcp.rs`: shared dynamic runtime state in `AppState`
- `src/graphql.rs`: safe generic execution and targeted type discovery
- `src/mcp/rmcp_server.rs`: dynamic listing, resolution, structured output, and list-change notifications
- `src/mcp/tool_filter.rs`: catalog-aware selectors while preserving legacy rules
- `src/mcp/elicitation.rs`: operation-driven mutation elicitation with no tool-argument bypass

## Security gates

A generated call crosses four independent gates:

1. MCP transport authentication
2. Coarse MCP scope authorization: `unraid:read` or `unraid:admin`
3. Native MCP elicitation for every generated mutation
4. Upstream Unraid API-key permission enforcement

Discovery is never authorization. A field appearing in the schema does not make it callable.

## Success criteria

The implementation is complete when:

- A new ordinary query using supported types appears after refresh without Rust changes.
- A new mutation appears in diagnostics but remains disabled by default.
- Enabling a mutation exposes a generated tool that always elicits.
- Clients without form elicitation cannot execute generated mutations.
- Generated input schemas follow GraphQL nullability, lists, enums, input objects, and defaults.
- Generated selections are bounded, deterministic, argument-safe, and cycle-safe.
- Bad live discovery cannot replace the active catalog.
- `legacy` and `hybrid` preserve existing `unraid` calls.
- Successful catalog swaps notify capable clients with `notifications/tools/list_changed`.
- Generated results include structured content conforming to the advertised output schema.
- Unit, contract, integration, cache, refresh, authorization, and elicitation tests pass offline.

## Non-goals

The first implementation does not:

- expose arbitrary raw GraphQL
- execute subscriptions as ordinary tools
- auto-enable new mutations
- infer perfect business risk from names or descriptions
- replace curated workflow helpers
- enable the Unraid developer sandbox
- generate or compile Rust source at runtime
- treat schema metadata as the final authorization authority
