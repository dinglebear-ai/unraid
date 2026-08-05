# Dynamic MCP Specification

Status: implementation specification

## 1. Architecture

Dynamic MCP adds an immutable runtime catalog beside the existing legacy action path.

```text
Config + UnraidClient
        |
        v
SchemaSource
  live targeted crawler
  cache fallback
  vendored test fixture
        |
        v
SchemaSnapshot -> TypeRegistry -> CatalogCompiler
                                |
                                v
                         OperationCatalog
                          /            \
                         v              v
                   tools/list       tools/call
                         |              |
                         v              v
                    ToolRenderer   DynamicExecutor
                                         |
                                         v
                                  UnraidClient
```

The active catalog is held as an immutable shared snapshot. Compilation and refresh happen outside request critical sections.

## 2. Startup sequence

1. Load `Config` and validate dynamic settings.
2. Build the existing `UnraidClient` and `UnraidService`.
3. Construct `DynamicRuntime` with an empty or cache-derived catalog.
4. If dynamic mode is enabled, run live targeted discovery.
5. Normalize the type graph and compile a candidate catalog.
6. Validate the candidate with the same checks used for cache loading.
7. Install the live candidate when valid.
8. Otherwise install a valid endpoint-matched cache when configured.
9. Apply `startup_failure` when no catalog is available.
10. Start MCP HTTP or stdio transport.
11. Start the refresh loop only after initial state is settled.

The recommended default `startup_failure` is `legacy_only` in `hybrid` mode and `fail` in `expanded` mode.

## 3. Targeted introspection

### 3.1 Type query

The crawler uses `__type`, not `__schema`. A complete type response requests:

```graphql
query DynamicType($name: String!) {
  __type(name: $name) {
    kind
    name
    description
    specifiedByURL
    fields(includeDeprecated: true) {
      name
      description
      isDeprecated
      deprecationReason
      args(includeDeprecated: true) {
        name
        description
        defaultValue
        isDeprecated
        deprecationReason
        type { ...TypeRef }
      }
      type { ...TypeRef }
    }
    inputFields(includeDeprecated: true) {
      name
      description
      defaultValue
      isDeprecated
      deprecationReason
      type { ...TypeRef }
    }
    interfaces { name kind }
    enumValues(includeDeprecated: true) {
      name
      description
      isDeprecated
      deprecationReason
    }
    possibleTypes { name kind }
  }
}

fragment TypeRef on __Type {
  kind
  name
  ofType {
    kind
    name
    ofType {
      kind
      name
      ofType {
        kind
        name
        ofType { kind name }
      }
    }
  }
}
```

The wrapper depth must cover every legal combination used by the upstream schema. The implementation should generate or centrally define the fragment rather than duplicate it.

### 3.2 Batched crawl

The crawler maintains:

- `pending: BTreeSet<TypeName>`
- `visited: BTreeMap<TypeName, TypeDefinition>`
- counters for batches, types, bytes, and elapsed time

Algorithm:

```text
pending = {Query, Mutation, Subscription}
while pending is not empty:
    take up to batch_size names
    send one query with aliased __type fields and variables
    for each response:
        validate requested name equals returned name
        normalize type definition
        insert or compare with prior definition
        enqueue every referenced named type
return SchemaSnapshot
```

Aliases are generated locally, for example `t0: __type(name: $n0)`. Type names are variables, never interpolated into GraphQL source.

The crawler ignores built-in introspection names beginning with `__` except for root requests and rejects server responses that exceed configured limits.

### 3.3 Reachability

Referenced names are collected from:

- field return types
- field arguments
- input object fields
- implemented interfaces
- possible concrete types
- nested list and non-null wrappers

Scalars and enums are terminal. Object, input object, interface, and union types are expanded.

### 3.4 Live failure classification

Discovery failures are categorized as:

- `Unavailable`: network, TLS, timeout
- `Unauthorized`: upstream 401 or 403
- `IntrospectionBlocked`: `__type` rejected
- `Malformed`: invalid GraphQL response or inconsistent type graph
- `LimitExceeded`: bounded crawl limit reached
- `Unsupported`: required introspection field not supported

Only a fully valid snapshot proceeds to compilation.

## 4. Normalized type system

Introspection wire values are converted immediately into owned normalized models. GraphQL wrappers become recursive `TypeRef` values:

```rust
pub enum TypeRef {
    Named(TypeName),
    List(Box<TypeRef>),
    NonNull(Box<TypeRef>),
}
```

Normalization rules:

- `NON_NULL` and `LIST` require `ofType`.
- named kinds require `name`.
- `NonNull(NonNull(_))` is invalid.
- field and input names must be valid GraphQL names.
- definitions are sorted by name for deterministic hashing.
- default values are retained as GraphQL literals and parsed before use.
- descriptions are normalized for line endings but otherwise preserved.

## 5. Operation discovery

### 5.1 Queries

Every eligible root `Query` field is a query operation. Its path is:

```text
query.<field>
```

### 5.2 Direct mutations

A root `Mutation` field is directly callable when it has arguments, returns a scalar/enum, or returns an ordinary business object.

Its path is:

```text
mutation.<field>
```

### 5.3 Mutation namespaces

A root or nested mutation field is a namespace when all are true:

1. it has no arguments
2. its unwrapped return type is an object
3. the object matches configured namespace detection
4. traversing it does not create a cycle

Default namespace detection accepts object names ending in `Mutations`. An explicit allow/deny override can correct future upstream exceptions.

Namespace children are recursively traversed. A child with arguments or a non-namespace return becomes a callable leaf. The GraphQL execution path preserves each segment.

Example:

```text
root Mutation.vm -> VmMutations.start(id)
canonical path: mutation.vm.start
selection path: vm { start(id: $id) }
```

### 5.4 Unsupported operations

An operation is recorded but unavailable when:

- an input scalar has no adapter
- an argument or input object cannot be represented safely
- no legal bounded output selection exists
- namespace traversal is ambiguous or cyclic
- generated names cannot be made unique
- policy marks it hidden

Diagnostics include path, reason code, human description, and implicated type.

## 6. Tool naming

Default name format:

```text
unraid_<kind>_<path segments in snake_case>
```

Examples:

- `query.array` -> `unraid_query_array`
- `mutation.vm.forceStop` -> `unraid_mutation_vm_force_stop`
- `mutation.unraidPlugins.installPlugin` -> `unraid_mutation_unraid_plugins_install_plugin`

Normalization:

1. split camel case and acronym boundaries
2. replace non-alphanumeric separators with underscores
3. lowercase
4. collapse repeated underscores
5. trim edges
6. prefix names that would begin with a digit
7. enforce `max_tool_name_len`

When truncation or collision occurs, append `_<first 10 hex chars of SHA-256(canonical path)>`. Collision resolution is deterministic and tested.

## 7. Input compilation

The generated root input schema is an object with:

- one property for each GraphQL argument
- optional reserved `__mcp` execution options
- `additionalProperties: false`

GraphQL mapping:

| GraphQL | JSON Schema |
|---|---|
| `String` | string |
| `Boolean` | boolean |
| `Int` | integer, 32-bit range |
| `Float` | number |
| `ID` | string or integer |
| enum | string with enum values |
| list | array with recursive items |
| input object | object with recursive properties |
| non-null | enclosing property required and non-null |

An argument with a GraphQL default is not JSON-Schema-required even when its type is non-null. Omitting it allows the upstream default to apply.

The server performs catalog-aware validation in addition to publishing JSON Schema. It validates exact integer ranges, nullability, default literals, list items, enum membership, object properties, aggregate limits, and custom scalar adapters.

## 8. Custom scalar adapters

Built-in adapters:

| Scalar | Input validation | Output schema |
|---|---|---|
| `DateTime` | RFC 3339 string | string, date-time |
| `BigInt` | integer, numeric string, or configured live-compatible mode | integer or string union |
| `JSON` | any JSON value within limits | unconstrained JSON |
| `Port` | integer 1 through 65535 | integer 1 through 65535 |
| `URL` | absolute URI string | string, uri |
| `PrefixedID` | non-empty bounded string | string |

Unknown input scalars disable affected operations. Configuration may define scalar JSON-Schema overlays, but executable coercion adapters must be built-in Rust code. A schema snippet alone cannot provide safe coercion behavior.

## 9. Output selection

### 9.1 Default planner

The planner unwraps the operation return type:

- scalar or enum: no nested selection
- object: recursively select legal leaves
- interface or union: select `__typename` and bounded inline fragments

At each object:

1. sort fields by stable priority then name
2. include scalar and enum leaves
3. descend into object-like fields while below depth and field budgets
4. skip fields with required arguments
5. skip fields that would create an active-path cycle
6. include `id`, `name`, `status`, and `state` early when present

Budgets include depth, selected field count, fragment count, and document bytes.

### 9.2 Explicit selection

`__mcp.select` is an array of dotted field paths:

```json
{
  "__mcp": {
    "select": ["id", "name", "capacity.total"]
  }
}
```

Paths are parsed as identifiers, resolved against the return graph, and rejected when they require field arguments, exceed limits, reference unknown fields, or cross impossible concrete types.

No raw aliases, directives, fragments, or GraphQL text are accepted.

## 10. GraphQL document generation

The document builder consumes only catalog-owned names and validated variables.

For a query:

```graphql
query UnraidQueryDisk($id: PrefixedID!) {
  disk(id: $id) {
    id
    name
    smartStatus
  }
}
```

For a namespace mutation:

```graphql
mutation UnraidMutationVmStart($id: PrefixedID!) {
  vm {
    start(id: $id)
  }
}
```

Only provided arguments are emitted. Variable names are generated from argument positions and names. Variable definitions use the exact catalog type reference. Values remain JSON variables.

The builder returns `CompiledRequest { operation_name, document, variables, response_path }`. `response_path` extracts the leaf result from the upstream `data` object.

## 11. Authorization and policy

Resolved policy combines:

1. global dynamic enabled state
2. surface mode
3. operation-kind defaults
4. enable/disable patterns
5. exact operation override
6. deprecation policy
7. supported-type status
8. request caller scopes

Explicit deny wins. Invalid configured selectors fail startup validation.

Coarse scopes are fixed:

- query: `unraid:read`
- mutation: `unraid:admin`

Parsed upstream permission descriptions are metadata for diagnostics and prompts, not a replacement for these checks.

## 12. Mutation elicitation

After input validation and authorization, every generated mutation invokes a new operation-driven elicitation helper.

Prompt composition includes:

- title: operation display title
- canonical operation path
- safe effect description
- redacted argument summary
- destructive warning when applicable
- explicit affirmative checkbox

The helper returns only `Approved` or a typed failure. There is no reusable approval state.

The executor calls the upstream only after `Approved`. A test transport must count outgoing requests to prove all other outcomes send zero mutations.

## 13. Tool results

A successful generated call returns:

- `structuredContent` containing the extracted leaf JSON
- a text content block containing pretty JSON
- optional metadata with canonical path and catalog hash, excluding secrets

The tool's output schema describes the extracted leaf, not the entire GraphQL `data` wrapper.

Caller input errors use invalid params. Valid calls that fail upstream return visible tool-level errors using the existing typed upstream classification.

## 14. Cache

Cache envelope:

```json
{
  "format_version": 1,
  "compiler_version": "0.1",
  "created_at": "2026-08-05T17:00:00Z",
  "endpoint_fingerprint": "sha256:...",
  "schema_hash": "sha256:...",
  "catalog_hash": "sha256:...",
  "source": "live_targeted_introspection",
  "snapshot": {},
  "catalog": {}
}
```

The fingerprint hashes a normalized URL with userinfo removed. Cache writing uses a temporary sibling file, permission tightening, flush, and rename. Cache loading revalidates all invariants.

## 15. Refresh

A `tokio` task wakes at the configured interval with jitter. Concurrent refreshes are prevented by a mutex or compare-and-set guard.

Refresh pipeline:

1. discover candidate snapshot
2. normalize and compile
3. validate
4. compare catalog hash
5. if unchanged, record success
6. if changed, atomically write cache
7. atomically swap active catalog
8. compute added, removed, changed, and availability diffs
9. notify registered capable peers

Calls capture one `Arc<OperationCatalog>` at request start, so refresh never changes the meaning of an in-flight call.

## 16. Peer notifications

The server advertises `enable_tool_list_changed()` after notification support is wired.

A peer registry stores weak or removable peer handles keyed by session or transport identity. Peers are registered after initialization and removed on termination or repeated send failure. After a changed swap, notification fan-out uses bounded concurrency and reports per-peer errors without rolling back the catalog.

For stateless clients that cannot receive notifications, reconnecting or a later `tools/list` observes the new catalog.

## 17. MCP resources

Dynamic mode adds read-only diagnostic resources:

| URI | Content |
|---|---|
| `unraid://schema/dynamic/catalog` | filtered catalog summary without secrets |
| `unraid://schema/dynamic/types` | normalized type inventory |
| `unraid://schema/dynamic/operations/<path>` | one operation definition |
| `unraid://schema/dynamic/diagnostics` | discovery and unavailable-operation diagnostics |

Resource reads require authentication and appropriate read scope. Large resources are paginated or summarized.

## 18. Migration

Phase 1 keeps legacy behavior unchanged and adds disabled dynamic code.

Phase 2 enables `hybrid` in development with generated queries only.

Phase 3 enables selected mutations, each with mandatory elicitation.

Phase 4 validates LABBY discovery, tool payload size, client notification behavior, and live scalar wire formats.

Phase 5 may make `hybrid` the recommended mode. Removing the legacy action dispatcher is a separate future decision after compatibility data exists.
