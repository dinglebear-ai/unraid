# Dynamic MCP Domain Models

Status: domain and ownership model

This document explains what each model represents, who owns it, when it changes, and how models relate. Field declarations are in [TYPES.md](TYPES.md).

## Model graph

```text
DynamicMcpConfig
       |
       v
SchemaSource -> SchemaSnapshot -> TypeRegistry
                                      |
                                      v
                               CatalogCompiler
                                      |
                                      v
                              OperationCatalog
                               /      |      \
                              v       v       v
                         Tool view  Policy  Diagnostics
                              \       |       /
                               v      v      v
                                DynamicRuntime
                                  /       \
                                 v         v
                            tools/list  tools/call
                                            |
                                            v
                                    CompiledRequest
                                            |
                                            v
                                      UnraidClient
```

## DynamicMcpConfig

Purpose: immutable operator intent for discovery, compilation, policy, limits, caching, and surface mode.

Owner: `Config`, then `DynamicRuntime` through `Arc`.

Lifecycle:

1. deserialize from `config.toml`
2. apply environment overrides
3. validate before network discovery
4. treat as immutable for the process lifetime

Invariants:

- dynamic mode defaults disabled
- mutations default disabled
- no setting disables mutation elicitation
- explicit deny wins
- exact override wins over broad allow
- selection and discovery limits are internally consistent
- cache path is normalized before use

## SchemaSource

Purpose: identify where a candidate type graph came from.

Variants:

| Source | Use |
|---|---|
| `LiveTargetedIntrospection` | primary production source using `__type` |
| `LastKnownGoodCache` | startup or refresh fallback |
| `VendoredSdl` | offline tests and development diagnostics |
| `Fixture` | unit and integration tests |

Every source produces a `SchemaSnapshot`. No source installs an active catalog directly.

## SchemaSnapshot

Purpose: durable normalized description of the reachable GraphQL type graph at one point in time.

Contains:

- capture timestamp
- endpoint fingerprint
- source kind
- root type names
- canonical named-type map
- discovery diagnostics
- schema hash

It does not contain caller state, operation enable decisions, generated tool names, call arguments, or upstream data results.

The schema hash excludes capture time and transient diagnostics. A snapshot is valid only when every reference resolves and every wrapper is structurally legal.

## TypeRegistry

Purpose: immutable navigation over snapshot types.

Responsibilities:

- resolve named types
- expose output and input fields
- expose possible concrete types
- classify scalar, enum, object, interface, union, and input object definitions
- detect missing or category-mismatched references

It does not apply policy and does not generate tools.

## TypeDefinition family

### ScalarType

Represents a scalar and optional specification URL. Its name selects the input and output adapter.

### EnumType

Represents a closed set of values with descriptions and deprecations.

### InputObjectType

Represents nested operation input. Fields retain nullability and GraphQL defaults.

### ObjectType

Represents selectable output fields and implemented interfaces. An object may also be classified as a mutation namespace.

### InterfaceType and UnionType

Represent abstract outputs and possible concrete types. The selection planner uses them to produce `__typename` and inline fragments.

## OperationPath

Purpose: stable identity independent of MCP tool rendering.

Format:

```text
<kind>.<graphql segment>.<graphql segment>...
```

Examples:

- `query.array`
- `query.disk`
- `mutation.createNotification`
- `mutation.vm.start`
- `mutation.onboarding.createInternalBootPool`

Properties:

- preserves original GraphQL case
- includes operation kind
- uniquely identifies one operation
- is used by configuration overrides
- remains stable if generated naming rules change

Operators configure canonical paths, not generated MCP names.

## OperationSegment

Purpose: one GraphQL field from root to callable leaf.

For `mutation.vm.start`:

| Segment | Parent | Return | Role |
|---|---|---|---|
| `vm` | `Mutation` | `VmMutations!` | namespace |
| `start` | `VmMutations` | `Boolean!` | callable leaf |

The current schema places arguments on the leaf. A future namespace field with arguments is recorded as unsupported until argument merging is deliberately designed.

## OperationSpec

Purpose: complete immutable executable definition for one generated operation.

It binds:

- canonical path
- generated MCP name
- generated GraphQL operation name
- display title and description
- GraphQL path segments
- leaf arguments
- return type
- generated input and output schemas
- default response selection
- coarse required scope
- risk metadata
- optional permission hint
- deprecation metadata
- availability state

An operation is executable only when its compiled availability is `Available` and request policy resolves it as callable.

## OperationAvailability

```text
Discovered
   |
   +--> Unsupported
   +--> Hidden
   +--> Compiled -> policy -> Available or DisabledByPolicy
```

Reason codes include unsupported input scalar, missing type, no legal selection, namespace cycle, excessive complexity, deprecation policy, and explicit disable.

Unavailable operations remain visible in diagnostics so an upstream addition never disappears silently.

## RiskMetadata

Purpose: describe effect without controlling the mandatory mutation gate.

Precedence:

1. exact operation override
2. curated built-in registry
3. parsed upstream description hint
4. conservative mutation default

Every generated mutation elicits regardless of `destructive`. Destructive metadata changes prompt strength, audit severity, and MCP annotations only.

## PermissionHint

Purpose: optional documentation parsed from the upstream field description.

It may improve descriptions, diagnostics, and elicitation wording. It cannot grant access, replace coarse scopes, override deny policy, or prove upstream authorization.

Malformed permission sections produce a warning and are ignored.

## SelectionPlan

Purpose: validated server-owned output AST.

It contains fields, inline fragments, and `__typename` nodes plus complexity counts.

Two forms exist:

- default plan compiled into `OperationSpec`
- request plan derived from validated `__mcp.select`

It never contains caller-supplied GraphQL text. Rendering happens in the document builder.

## OperationCatalog

Purpose: immutable generated surface for one schema and configuration combination.

Indexes:

- `by_path` for policy and diagnostics
- `by_tool_name` for calls
- deterministic ordered tool view for listing

Metadata:

- format version
- endpoint fingerprint
- schema hash
- catalog hash
- creation time
- diagnostics

The catalog hash includes compilation-relevant configuration. The catalog is valid only when names are unique, indexes agree, advertised operations have valid schemas and selections, mutations require admin scope, and subscriptions are not advertised in v1.

## CatalogStore

Purpose: atomic ownership of the active catalog.

A request loads one `Arc<OperationCatalog>` and retains it through resolution, validation, elicitation, document generation, and execution. Refresh cannot change an in-flight call's meaning.

Swap order:

1. compile candidate
2. validate candidate
3. write cache
4. atomically store candidate
5. notify peers

No catalog lock spans network work.

## DynamicRuntime

Purpose: process-wide dynamic state.

Owns:

- immutable dynamic config
- catalog store
- peer registry
- refresh guard
- discovery and refresh status

It is optional in `AppState`. `None` means current behavior is unchanged.

## PeerRegistry

Purpose: track initialized peers that can receive tool-list change notifications.

Entries include a session or transport key, peer handle, negotiated capability snapshot, last successful notification, and failure count.

```text
Initialized -> Registered -> Active
                          -> Removed on termination
                          -> Removed after terminal send failure
```

Notification failure does not roll back the new catalog.

## CompiledRequest

Purpose: final safe request ready for `UnraidClient`.

Contains canonical path, generated operation name, server-generated document, JSON variables, response extraction path, and catalog hash.

It can only be constructed from an `OperationSpec`, validated arguments, and a valid selection plan.

## DynamicCallResult

Purpose: extracted leaf value plus execution identity.

The executor follows the compiled response path through the upstream `data` object. Missing path components are upstream-shape failures. A present null leaf remains a legitimate null result.

The RMCP layer emits both structured and pretty JSON text content.

## CatalogCacheEnvelope

Purpose: versioned last-known-good state.

It combines endpoint identity, hashes, compiler and format versions, source kind, normalized snapshot, and compiled catalog.

```text
Bytes -> parse -> version check -> endpoint check
      -> snapshot validation -> catalog validation -> eligible fallback
```

Any failure makes the cache ineligible. Partial installation is impossible.

## CatalogDiff

Purpose: summarize a successful changed refresh.

Contains ordered sets of added, removed, changed, newly available, and newly unavailable operations, plus generated tool names added or removed.

It contains no call inputs or upstream data.

## Diagnostics

Diagnostics are structured records with severity, code, optional operation path, optional type name, and message.

Candidate-level errors prevent installation. Operation-level unsupported diagnostics may coexist with a valid catalog when affected operations are not advertised.

## Ownership summary

| Model | Mutable | Shared | Persisted |
|---|---:|---:|---:|
| `DynamicMcpConfig` | no | yes | config |
| `SchemaSnapshot` | no | compile-time | cache |
| `TypeRegistry` | no | helper | indirectly |
| `OperationSpec` | no | yes | cache |
| `OperationCatalog` | no | atomic snapshot | cache |
| `SelectionPlan` | no | operation/request | default cached |
| `CompiledRequest` | no | one call | no |
| `DynamicCallResult` | no | one call | no |
| `PeerRegistry` | yes | process | no |
| `DynamicStatus` | yes | process | no |
| `CatalogDiff` | no | refresh result | status only |
