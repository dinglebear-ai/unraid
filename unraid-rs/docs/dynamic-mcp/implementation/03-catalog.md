# Phase 03: Catalog Compilation

Goal: compile a deterministic operation catalog from the normalized type graph, including recursive mutation namespaces and policy diagnostics.

## Task 03.01: Finish validated identifier newtypes

Files: `src/mcp/dynamic/types.rs`.

Implement private-field constructors for `TypeName`, `FieldName`, `ToolName`, and `OperationPath`. Validate GraphQL names with:

```rust
fn valid_graphql_name(value: &str) -> bool {
    let mut chars = value.chars();
    matches!(chars.next(), Some('_' | 'A'..='Z' | 'a'..='z'))
        && chars.all(|c| matches!(c, '_' | '0'..='9' | 'A'..='Z' | 'a'..='z'))
}
```

Reject empty operation paths and `Subscription` paths when constructing executable v1 specs.

Verify: `cargo test dynamic_identifiers --lib`.

Done when: invalid raw strings cannot construct identifiers outside the module.

Dependencies: Phase 02.

## Task 03.02: Implement TypeRegistry accessors

Files: `src/mcp/dynamic/types.rs`.

Add typed accessors that report category mismatches:

```rust
pub fn object(&self, name: &TypeName) -> Result<&ObjectType, CatalogError>;
pub fn input_object(&self, name: &TypeName) -> Result<&InputObjectType, CatalogError>;
pub fn enum_type(&self, name: &TypeName) -> Result<&EnumType, CatalogError>;
pub fn output_fields(&self, name: &TypeName) -> Result<&[OutputField], CatalogError>;
```

Add `unwrap_named_output` and `unwrap_named_input` helpers that preserve wrappers separately.

Verify: `cargo test dynamic_type_registry --lib`.

Done when: no catalog code pattern-matches the raw type map directly.

Dependencies: 03.01.

## Task 03.03: Discover query operation paths

Files: `src/mcp/dynamic/catalog.rs`.

Read the configured query root from `TypeRegistry`. Create one candidate per root field:

```rust
fn discover_queries(
    registry: &TypeRegistry,
    root: &TypeName,
) -> Result<Vec<OperationCandidate>, CatalogError>
```

Path format: `query.<field>`. Retain field arguments, return type, description, and deprecation.

Verify with minimal fixture and current vendored/live snapshot projection.

Done when: current snapshot reports all 58 published root queries plus live-only plugin queries.

Dependencies: 03.02.

## Task 03.04: Discover direct mutation leaves

Files: `src/mcp/dynamic/catalog.rs`.

Treat a root mutation field as a direct leaf when it is not a namespace. Build `mutation.<field>` candidates.

Test direct examples such as `createNotification`, `updateSettings`, and `updateSystemTime`.

Do not apply enable policy yet.

Verify: `cargo test dynamic_direct_mutations --lib`.

Done when: direct mutation count is deterministic and namespace containers are excluded.

Dependencies: 03.03.

## Task 03.05: Classify mutation namespaces

Files: `src/mcp/dynamic/catalog.rs`, `src/mcp/dynamic/config.rs`.

Default classifier:

```rust
fn is_namespace(field: &OutputField, target: &ObjectType, config: &DynamicMcpConfig) -> bool {
    field.arguments.is_empty()
        && config.namespace_suffixes.iter().any(|suffix| target.name.as_str().ends_with(suffix))
}
```

Apply exact `OperationOverride.namespace` after the default classifier. Reject a configured namespace whose return type is not an object.

Verify all nine current `*Mutations` types.

Done when: classifier output matches the researched namespace inventory.

Dependencies: 03.04.

## Task 03.06: Recursively flatten mutation namespaces

Files: `src/mcp/dynamic/catalog.rs`.

Implement depth-first traversal with an active-type stack and maximum namespace depth. Append one `OperationSegment` per field.

```rust
fn walk_mutation_namespace(
    registry: &TypeRegistry,
    path: &mut Vec<FieldName>,
    segments: &mut Vec<OperationSegment>,
    active_types: &mut BTreeSet<TypeName>,
    output: &mut Vec<OperationCandidate>,
) -> Result<(), CatalogError>;
```

A field with namespace arguments is unsupported with a diagnostic, not silently flattened.

Verify expected leaves:

- Array 6
- Docker 10
- VM 7
- API key 5
- Customization 2
- Parity 4
- RClone 2
- Onboarding 10
- Unraid plugins 2

Done when: current published schema produces all 48 nested leaves and no namespace tool.

Dependencies: 03.05.

## Task 03.07: Implement stable tool naming

Files: `src/mcp/dynamic/naming.rs`.

Implement camel/acronym splitting, snake case, prefix, length cap, and hash suffix. Keep canonical path independent of rendered name.

Examples:

```text
query.apiKeys -> unraid_query_api_keys
mutation.vm.forceStop -> unraid_mutation_vm_force_stop
mutation.unraidPlugins.installPlugin -> unraid_mutation_unraid_plugins_install_plugin
```

Use SHA-256 of canonical path for collision/truncation suffix. Test Unicode rejection, long names, repeated separators, and collisions.

Verify: `cargo test dynamic_tool_naming --lib`.

Done when: output is deterministic across map order.

Dependencies: 03.01.

## Task 03.08: Parse optional permission hints

Files: `src/mcp/dynamic/catalog.rs` or `permission.rs` if separation is useful.

Parse only the structured `Required Permissions` section produced by upstream. Return `Option<PermissionHint>` plus warnings.

Do not fail compilation when absent or malformed. Do not map this hint to access grants.

Test normal, absent, malformed, duplicate, and unrelated prose.

Verify: `cargo test dynamic_permission_hint --lib`.

Done when: a malformed description cannot change scope or enable state.

Dependencies: 03.03.

## Task 03.09: Add scalar capability registry

Files: `src/mcp/dynamic/catalog.rs`, `src/mcp/dynamic/json_schema.rs`.

Create a registry that answers whether a scalar is safe for input and output:

```rust
pub trait ScalarAdapter: Send + Sync {
    fn input_schema(&self) -> Value;
    fn output_schema(&self) -> Value;
    fn validate_input(&self, value: &Value) -> Result<(), DynamicValidationError>;
}
```

Register built-ins and the six known Unraid custom scalars. Unknown output scalars are allowed conservatively; unknown input scalars mark operations unsupported.

Verify: `cargo test dynamic_scalar_registry --lib`.

Done when: availability diagnostics name the operation and scalar.

Dependencies: 03.02.

## Task 03.10: Resolve operation policy

Files: `src/mcp/dynamic/policy.rs`.

Implement pure policy evaluation in this order:

1. global dynamic state and surface
2. kind default
3. enabled patterns
4. disabled patterns
5. exact override
6. deprecation policy
7. supported-type status
8. caller scope at request time

Explicit deny wins. Queries default according to `auto_enable_queries`. Mutations default according to `auto_enable_mutations`, which is false by default.

Do not include an elicitation decision in policy output.

Verify a table-driven test matrix.

Done when: exact mutation enable exposes the candidate but cannot weaken admin scope.

Dependencies: 03.06.

## Task 03.11: Build OperationCatalog indexes and hash

Files: `src/mcp/dynamic/catalog.rs`.

Compile candidates into `OperationSpec` placeholders with paths, names, metadata, scope, risk, and availability. Schema and selection fields may remain temporary until Phase 04.

Build `by_path` and `by_tool_name` and validate one-to-one agreement. Canonically hash compilation-relevant fields and policy.

Test:

- source map ordering does not affect hash
- policy change affects catalog hash
- timestamp does not affect hash
- duplicate generated names fail candidate installation

Verify: `cargo test dynamic_catalog_hash --lib`.

Done when: identical fixture plus config yields byte-identical catalog JSON.

Dependencies: 03.07, 03.08, 03.09, 03.10.

## Task 03.12: Implement diagnostics and CatalogDiff

Files: `src/mcp/dynamic/models.rs`, `src/mcp/dynamic/catalog.rs`.

Use stable diagnostic codes for unsupported scalar, missing type, namespace cycle, invalid override, hidden deprecation, and name collision.

Implement `CatalogDiff::between(old, new)` with ordered added, removed, changed, newly available, and newly unavailable paths.

Add a summary method that returns counts without dumping catalogs.

Verify: `cargo test dynamic_catalog_diff --lib` and current schema inventory assertions.

Done when: Phase 03 gate passes with the current 58 published queries and 48 namespace mutation leaves accounted for.

Dependencies: 03.11.

## Phase 03 gate

```bash
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
cargo test dynamic_catalog --lib
cargo test dynamic_tool_naming --lib
cargo nextest run
```

Evidence:

- deterministic counts and hashes
- all namespace leaves discovered
- mutations disabled by default
- live-only operations retained with policy
- unsupported operations produce structured diagnostics
