# Phase 02: Targeted Type Discovery

Goal: reconstruct the reachable GraphQL type graph with production-safe `__type` requests and reuse the existing live-schema contract pipeline.

## Task 02.01: Create minimal introspection fixtures

Files: `tests/fixtures/dynamic/minimal-query-types.json` and `namespace-mutations.json`.

Hand-author responses for:

- `Query.ping: Boolean!`
- `Query.disk(id: PrefixedID!): Disk!`
- `Mutation.vm: VmMutations!`
- `VmMutations.start(id: PrefixedID!): Boolean!`
- supporting scalar and object types

Use aliased response keys `t0`, `t1` to match the planned batched crawler.

Done when: fixtures are valid JSON and contain no `__schema` root.

Dependencies: Phase 01.

## Task 02.02: Implement introspection wire structs

Files: `src/mcp/dynamic/introspection.rs`.

Add Serde models for type kind, type references, fields, input values, enum values, named types, and aliased response data. Model GraphQL errors separately.

Use `#[serde(rename_all = "camelCase")]` and `SCREAMING_SNAKE_CASE` exactly where the wire format requires it.

Test by deserializing the fixtures from 02.01.

Verify: `cargo test dynamic_introspection_deserialize --lib`.

Done when: no normalized model appears in the wire module.

Dependencies: 02.01.

## Task 02.03: Convert introspection TypeRef

Files: `src/mcp/dynamic/types.rs`, `src/mcp/dynamic/introspection.rs`.

Implement recursive conversion:

```rust
impl TryFrom<IntrospectionTypeRef> for TypeRef {
    type Error = DiscoveryError;
    fn try_from(value: IntrospectionTypeRef) -> Result<Self, Self::Error> { /* ... */ }
}
```

Reject:

- named kinds without a name
- `LIST` or `NON_NULL` without `ofType`
- named type with unexpected `ofType`
- nested non-null wrappers
- excessive wrapper depth

Test `String!`, `[String!]!`, and malformed wrappers.

Verify: `cargo test dynamic_type_ref --lib`.

Done when: `to_graphql()` round-trips fixture signatures.

Dependencies: 02.02.

## Task 02.04: Define the targeted type query

Files: `src/mcp/dynamic/introspection.rs`.

Add one constant fragment and a builder for aliased batches. The builder accepts validated `TypeName` values and returns document plus variables.

Expected shape:

```rust
pub struct TypeBatchRequest {
    pub document: String,
    pub variables: serde_json::Map<String, Value>,
    pub aliases: BTreeMap<String, TypeName>,
}

pub fn build_type_batch(names: &[TypeName]) -> Result<TypeBatchRequest, DiscoveryError>;
```

Sort names before assigning aliases. Never interpolate type names into source.

Verify with a golden snapshot test.

Done when: identical name sets produce identical documents and variable order.

Dependencies: 02.03.

## Task 02.05: Expose a safe GraphQL body method

Files: `src/graphql.rs`.

Add a crate-visible method that reuses `send_graphql`:

```rust
pub(crate) async fn execute_graphql_body(&self, body: Value) -> Result<Value> {
    self.send_graphql(body).await
}
```

Do not expose the HTTP client publicly and do not duplicate auth or timeout logic.

Add a wiremock test proving the `x-api-key` header and JSON body are identical to existing execution.

Verify: focused GraphQL transport test plus `cargo test --test schema_contract`.

Done when: existing typed operations still use the same private core.

Dependencies: 02.04.

## Task 02.06: Add batch fetch to UnraidClient

Files: `src/mcp/dynamic/crawler.rs`, `src/graphql.rs`.

Implement:

```rust
async fn fetch_type_batch(
    client: &UnraidClient,
    names: &[TypeName],
) -> Result<Vec<(TypeName, IntrospectionType)>, DiscoveryError>
```

Build `{"query": document, "variables": variables}`, call `execute_graphql_body`, map aliases back to requested names, and reject missing or mismatched responses.

Use a mock response fixture, not a live server.

Verify: `cargo test dynamic_fetch_type_batch --lib`.

Done when: GraphQL errors become typed discovery errors and no partial vector is returned.

Dependencies: 02.05.

## Task 02.07: Normalize one type definition

Files: `src/mcp/dynamic/types.rs`, `src/mcp/dynamic/crawler.rs`.

Convert `IntrospectionType` into `TypeDefinition`. Validate names, duplicate fields, duplicate arguments, duplicate enum values, and category-specific required fields.

Sort fields and values deterministically. Preserve descriptions, defaults, deprecations, interfaces, possible types, and specified-by URL.

Verify fixtures for scalar, enum, input object, object, interface, and union.

Done when: canonical JSON serialization is stable across source order permutations.

Dependencies: 02.03.

## Task 02.08: Implement the crawl queue

Files: `src/mcp/dynamic/crawler.rs`.

Implement `crawl_schema(client, config)` using `BTreeSet` pending names and `BTreeMap` visited definitions.

Pseudo-code:

```rust
while !pending.is_empty() {
    let batch = take_first(&mut pending, config.introspection_batch_size);
    for (name, wire) in fetch_type_batch(client, &batch).await? {
        let definition = normalize(wire)?;
        compare_or_insert(&mut visited, name, definition)?;
        pending.extend(referenced_names(&definition).filter(not_visited));
    }
}
```

Start with configured roots. Treat an absent optional subscription root separately.

Verify against the minimal and namespace fixtures.

Done when: every referenced type is fetched once and result order is deterministic.

Dependencies: 02.06, 02.07.

## Task 02.09: Enforce crawl limits

Files: `src/mcp/dynamic/crawler.rs`, `src/mcp/dynamic/models.rs`.

Track:

- number of fetched types
- number of batches
- cumulative response bytes
- elapsed duration
- maximum reference wrapper depth

Return `DiscoveryError::LimitExceeded { limit, observed }` before allocating beyond limits.

Add fixtures that intentionally exceed each small test limit.

Verify: `cargo test dynamic_crawl_limits --lib`.

Done when: a limit failure produces no `SchemaSnapshot`.

Dependencies: 02.08.

## Task 02.10: Build and hash SchemaSnapshot

Files: `src/mcp/dynamic/models.rs`, `src/mcp/dynamic/crawler.rs`.

Create the endpoint fingerprint from a normalized URL with user information removed. Canonically serialize root names and normalized types, then compute `sha256:...`.

Exclude capture timestamp and transient diagnostics from `schema_hash`.

Test:

- source ordering does not affect hash
- description changes do affect hash
- timestamp changes do not affect hash
- endpoint fingerprint changes with host/path but not credentials

Verify: `cargo test dynamic_schema_hash --lib`.

Done when: hash behavior matches SCHEMA.md.

Dependencies: 02.09.

## Task 02.11: Refactor the existing Python capture

Files: `scripts/live-schema-contract.py`, `schema/live-introspection.json` only if a deliberate recapture is performed.

Preserve the current normalized structural output. Add:

1. full `__schema` fast path
2. fallback to targeted batched `__type` crawling when the server returns the upstream introspection-disabled error
3. the same roots, type references, deprecated fields, interfaces, enum values, and possible types

Do not copy Rust logic line by line. Share JSON fixtures and expected normalized output.

Add Python self-tests or a Rust integration test that runs the script against a fixture HTTP server.

Verify:

```bash
python3 scripts/live-schema-contract.py --help
cargo test --test live_schema_contract
```

Done when: existing snapshot format remains compatible and the script no longer requires sandbox-enabled full introspection.

Dependencies: 02.08.

## Task 02.12: Add Rust/Python parity and live smoke tests

Files: `tests/dynamic_discovery.rs`, fixture server support, `tests/README.md`.

Add tests that:

- feed the same fixture type graph to Python and Rust normalization
- compare structural roots and types
- preserve live-only plugin additions
- reject conflicting duplicate definitions
- classify blocked `__type` separately from network failure

Add an ignored live test:

```rust
#[tokio::test]
#[ignore = "requires live Unraid credentials"]
async fn targeted_type_crawl_live() { /* assert Query and Mutation exist */ }
```

Verify offline suite, then run the ignored test only with authorized live credentials.

Done when: Phase 02 gate passes and the captured live outcome is logged without secrets.

Dependencies: 02.10, 02.11.

## Phase 02 gate

```bash
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
cargo test dynamic_ --lib
cargo test --test dynamic_discovery
cargo test --test live_schema_contract
cargo nextest run
```

Evidence:

- deterministic targeted query golden
- complete fixture crawl
- limit failures
- matching structural output from Rust and Python
- optional live `Query` and `Mutation` crawl
