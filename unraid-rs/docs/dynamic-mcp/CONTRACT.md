# Dynamic MCP Contract

Status: normative design contract

The key words MUST, MUST NOT, REQUIRED, SHOULD, SHOULD NOT, and MAY are interpreted as normative requirements for the dynamic MCP implementation.

## 1. Scope

This contract governs runtime GraphQL discovery, operation compilation, MCP tool advertisement, dynamic tool execution, authorization, elicitation, caching, refresh, and compatibility with the existing `unraid` tool.

It does not change the upstream Unraid API contract and does not make schema discovery an authorization mechanism.

## 2. Sources of truth

1. The active immutable `OperationCatalog` MUST be the source of truth for generated tool names, argument types, response selections, operation documents, and dynamic policy resolution.
2. The current static `ACTIONS` registry MUST remain the source of truth for the legacy `unraid` tool until legacy migration is explicitly completed.
3. The upstream Unraid API MUST remain the authority for fine-grained resource/action authorization.
4. Configuration MUST be the authority for whether dynamic discovery is enabled, which surface mode is active, and which discovered mutations are callable.
5. A field's description, name, or inferred risk MUST NOT override explicit deny policy.

## 3. Discovery contract

1. The primary live discovery strategy MUST use targeted GraphQL `__type` requests.
2. The implementation MUST NOT require the Unraid developer sandbox or full `__schema` introspection.
3. Discovery MUST begin from configured root type names, defaulting to `Query`, `Mutation`, and `Subscription`.
4. The crawler MUST recursively fetch every named type reachable from root fields, arguments, input fields, output fields, interfaces, possible types, and list/non-null wrappers.
5. Type requests SHOULD be batched with aliases and MUST have configurable limits for type count, batch count, response bytes, nesting depth, and elapsed time.
6. The crawler MUST reject duplicate type names with conflicting definitions.
7. Missing referenced types, impossible wrapper structures, malformed defaults, and invalid type kinds MUST make the candidate invalid.
8. Discovery errors MUST NOT mutate the active catalog.
9. Subscription metadata MAY be discovered and cached, but v1 MUST NOT advertise subscriptions as ordinary request-response tools.

## 4. Catalog compilation contract

1. Catalog compilation MUST be deterministic for identical normalized input and configuration.
2. Root query fields MUST compile to query operations unless excluded by policy or unsupported types.
3. Direct root mutation leaves MUST compile to mutation operations.
4. A no-argument root mutation field returning a configured mutation namespace object MUST be traversed recursively.
5. Namespace traversal MUST stop at callable leaves and MUST reject cycles.
6. The canonical operation path MUST include the operation kind and every GraphQL field segment, for example `query.array` and `mutation.vm.start`.
7. A generated tool name MUST be derived deterministically from the canonical path.
8. Name normalization MUST produce MCP-safe names, enforce a configured length limit, and resolve collisions with a stable hash suffix.
9. Every operation MUST retain the original GraphQL field names separately from its generated MCP name.
10. An operation using an unsupported input scalar or structurally unsupported input type MUST be catalogued as unavailable with a diagnostic reason and MUST NOT be advertised.
11. An unsupported output scalar MAY use an unconstrained output schema, but it MUST be recorded as a diagnostic.
12. Deprecated fields MUST retain deprecation metadata. Policy MAY hide deprecated operations by default.
13. The catalog MUST have a canonical hash covering schema metadata and compilation-relevant configuration.

## 5. MCP surface contract

The server MUST support these modes:

| Mode | Required behavior |
|---|---|
| `legacy` | Advertise only legacy tools and helpers |
| `expanded` | Advertise generated tools and explicitly enabled curated helpers |
| `hybrid` | Advertise both legacy and generated tools |

Additional requirements:

1. Dynamic mode MUST default to disabled during initial rollout.
2. Generated tools MUST be ordered deterministically by generated name.
3. `tools/list` MAY filter generated tools according to the authenticated caller's scopes.
4. Query tools MUST require `unraid:read`.
5. Mutation tools MUST require `unraid:admin`.
6. A caller with `unraid:admin` MUST satisfy `unraid:read`, matching current behavior.
7. Hidden, disabled, unsupported, or unauthorized operations MUST NOT appear in the generated list for that request.
8. Each generated tool MUST include a title, description, input schema, output schema, and MCP annotations.
9. Query annotations MUST set `readOnlyHint = true` and `destructiveHint = false`.
10. Mutation annotations MUST set `readOnlyHint = false`. `destructiveHint` MUST reflect resolved risk policy and MUST NOT control elicitation.
11. Tool metadata MUST NOT contain secrets, raw credentials, cache paths containing sensitive values, or internal authorization tokens.

## 6. Dynamic operation policy

1. Queries MAY be auto-enabled when `auto_enable_queries = true`.
2. Mutations MUST default to disabled, regardless of discovery metadata.
3. `auto_enable_mutations` MUST default to `false`.
4. Exact operation overrides MUST take precedence over pattern rules.
5. Explicit deny rules MUST take precedence over all allow rules.
6. Invalid selectors MUST fail configuration validation rather than silently match nothing.
7. Policies MUST be evaluated against canonical operation paths, never descriptions.
8. The implementation MUST NOT provide a configuration value that disables elicitation for an enabled generated mutation.
9. `destructive = true` MAY increase warning detail, audit severity, and `destructiveHint`, but MUST NOT add or remove the elicitation gate.

## 7. Input schema and validation contract

1. GraphQL non-null arguments MUST appear in the JSON Schema `required` array unless the GraphQL argument has an upstream default.
2. Optional arguments omitted by the caller MUST be omitted from the GraphQL document so upstream defaults apply.
3. Lists, nested input objects, enums, and non-null wrappers MUST be validated recursively.
4. Unknown properties MUST be rejected by default for generated operation inputs.
5. The reserved `__mcp` property MUST contain only server-side execution options and MUST never be forwarded as a GraphQL argument.
6. `__mcp.select` MUST be an array of schema-valid output field paths.
7. Raw GraphQL fragments, directives, aliases, variables, or documents MUST NOT be accepted from tool arguments.
8. Validation failures caused by caller input MUST return MCP invalid-params errors.
9. Secret-like arguments MUST be redacted in logs, elicitation summaries, diagnostics, and traces.
10. The validator MUST impose configured limits for string bytes, array length, object properties, nested depth, and aggregate input bytes.

## 8. Selection contract

1. Every object, interface, or union return type MUST have a valid GraphQL selection set.
2. The default selection planner MUST be deterministic and cycle-safe.
3. It MUST select scalar and enum leaves within the configured depth and budget.
4. It MUST skip output fields requiring arguments unless a curated selection rule supplies them.
5. It MUST include `__typename` for interface and union branches.
6. User-provided `__mcp.select` paths MUST be resolved against the output type graph.
7. Invalid, inaccessible, argument-requiring, or over-budget selection paths MUST be rejected before execution.
8. Selection limits MUST include maximum depth, maximum selected fields, maximum fragments, and maximum generated document bytes.
9. The planner MUST NOT silently broaden a caller's explicit selection beyond required structural fields such as `__typename`.
10. An operation with no legal bounded selection MUST be unavailable rather than advertised with a broken document.

## 9. Mutation elicitation contract

1. Every generated mutation MUST perform native MCP form elicitation after validation and authorization and immediately before the upstream request.
2. The elicitation MUST use the request's current `Peer<RoleServer>`.
3. The prompt MUST identify the canonical operation path, describe the effect using catalog and policy metadata, and summarize only non-sensitive arguments.
4. Destructive operations SHOULD use stronger wording and identify irreversible or disruptive effects.
5. The elicitation response MUST require an explicit affirmative boolean collected by MCP form elicitation.
6. The implementation MUST NOT accept `confirmed`, `approved`, an approval token, or equivalent value from tool arguments.
7. Missing form capability, user decline, user cancel, timeout, malformed data, or service error MUST fail closed.
8. A failed or non-affirmative elicitation MUST guarantee that no upstream mutation request is sent.
9. Elicitation decisions MUST apply to one concrete call only and MUST NOT be cached or reused.
10. Queries MUST NOT elicit unless implemented as a separate curated helper with its own explicit contract.

## 10. GraphQL execution contract

1. GraphQL field names, paths, argument names, and type references MUST come from the active catalog, not caller-controlled strings.
2. Dynamic documents MUST use variables for caller values.
3. Operation names MUST be generated deterministically and MUST be valid GraphQL names.
4. Execution MUST reuse `UnraidClient` authentication, TLS, timeout, and upstream error classification.
5. The dynamic executor MUST NOT create an unauthenticated fallback path.
6. Transport and upstream failures MUST remain tool-level errors so the model can observe and recover when possible.
7. Unknown tools, disabled tools, unauthorized calls, and invalid input MUST remain protocol-level request errors.
8. Raw upstream GraphQL error bodies MUST remain server-side and MUST NOT be exposed if current error policy would redact them.
9. A successful result MUST include structured JSON content.
10. Text content SHOULD contain a serialized representation for clients that do not consume structured content.
11. Structured content MUST conform to the advertised output schema, subject to documented custom-scalar wire flexibility.

## 11. Cache contract

1. The last-known-good cache MUST contain only schema and compiled catalog metadata required to reconstruct tools.
2. It MUST NOT contain API keys, bearer tokens, OAuth material, elicitation responses, tool arguments, or upstream data results.
3. The cache envelope MUST include format version, catalog hash, creation time, endpoint fingerprint, source mode, and compiler version.
4. The endpoint fingerprint MUST be derived without writing raw embedded credentials.
5. Cache writes MUST be atomic using a temporary file, flush, and rename in the same directory.
6. Cache files SHOULD be owner-readable and owner-writable only.
7. A cache from another endpoint fingerprint MUST NOT be installed unless explicitly allowed by a migration tool.
8. Unknown future cache versions MUST fail safely.
9. A corrupt cache MUST be ignored with a diagnostic and MUST NOT prevent a successful live discovery.
10. Cache loading MUST run through the same catalog validation used for live candidates.

## 12. Startup and refresh contract

1. When dynamic mode is disabled, startup behavior MUST remain equivalent to the current server.
2. When enabled, startup MUST attempt live discovery before serving generated tools.
3. A valid endpoint-matched cache MAY be used when live discovery fails.
4. Startup failure behavior MUST be configurable as `fail`, `legacy_only`, or `empty_dynamic`, with a safe documented default.
5. Refresh MUST compile a candidate without mutating active state.
6. An unchanged canonical hash MUST not trigger a swap or notification.
7. A changed valid candidate MUST be cached and swapped atomically.
8. A failed candidate MUST leave the active catalog untouched.
9. The server MUST advertise `tools.listChanged` only when it can send `notifications/tools/list_changed`.
10. After a successful changed swap, the server SHOULD notify every active capable peer and remove stale peers after delivery failure or session termination.
11. Concurrent calls MUST continue using the catalog snapshot captured at call start.
12. Refresh work MUST have bounded time, memory, and network usage.

## 13. Compatibility contract

1. `legacy` mode MUST preserve current tool names, action names, arguments, scopes, prompts, resources, and result behavior unless changed by an independent release.
2. `hybrid` mode MUST preserve the legacy tool while adding generated tools.
3. Generated tools MUST NOT reuse the exact name of an existing legacy or curated tool.
4. Dynamic mode MUST not alter CLI commands in v1.
5. Existing static contract and scenario tests MUST continue passing in legacy mode.
6. New dynamic tests MUST not require a live Unraid server unless explicitly marked as live integration tests.
7. Disabling dynamic mode MUST provide an immediate rollback path without changing upstream configuration.

## 14. Observability and audit contract

The implementation MUST record:

- discovery attempts, duration, source, and result
- types fetched and candidate operation counts
- catalog hashes and diff counts
- unavailable-operation reasons
- cache load and write outcomes
- refresh swaps and notification outcomes
- generated tool calls by canonical path and kind
- authorization, validation, elicitation, execution, and serialization failure categories

It MUST NOT log:

- API keys or bearer tokens
- raw secret arguments
- decryption passwords or key files
- full elicitation form responses
- full upstream error bodies at caller-visible levels

Mutation audit records SHOULD include operation path, subject, outcome, catalog hash, elapsed time, and whether the operation was marked destructive.

## 15. Acceptance contract

The feature MUST NOT be enabled by default until automated tests prove:

1. deterministic catalog compilation
2. recursive namespace mutation discovery
3. scalar, enum, list, nullability, and input-object validation
4. cycle-safe bounded selection generation
5. mutation-wide fail-closed elicitation
6. authorization-filtered tool listing and calling
7. no raw GraphQL injection path
8. atomic cache and catalog replacement
9. last-known-good retention after refresh failure
10. legacy and hybrid compatibility
11. structured content conformance
12. tool-list notification behavior for supported transports
