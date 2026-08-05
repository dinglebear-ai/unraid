# Phase 07: Integration, Verification, and Rollout

Goal: prove the complete feature against fixtures, mock Unraid, the authorized live schema, LABBY, and supported MCP clients, then demonstrate a configuration-only rollback.

## Task 07.01: Extend the test mock

Files: `src/mock.rs` or test-support modules.

Add fixture modes for targeted `__type` batches, generated queries, direct mutations, namespace mutations, schema versions A/B, malformed responses, GraphQL errors, and an upstream mutation-call counter.

Verify: one test discovers A, calls a query, switches to B, and discovers the change.

Done when: later integration tests need no live server.

Dependencies: Phase 06.

## Task 07.02: Test every surface mode

File: `tests/dynamic_end_to_end.rs`.

Cover:

- legacy plus disabled dynamic state
- hybrid plus live fixture catalog
- expanded plus live fixture catalog
- hybrid plus cache fallback
- expanded plus required-startup failure

For successful modes, test listing, one query call, resources, and structured content.

Verify: `cargo test --test dynamic_end_to_end`.

Done when: mode behavior matches CONTRACT.md.

Dependencies: 07.01.

## Task 07.03: Add the mutation gate matrix

File: `tests/dynamic_mutation_safety.rs`.

Test mutation disabled, read scope, missing form capability, decline, cancel, false approval, malformed response, elicitation error, true approval, and both destructive states.

Assert the mock mutation counter remains zero except for true approval, where it is exactly one. Also assert `confirmed: true` is rejected as an unknown argument.

Done when: this test is required by CI.

Dependencies: 07.02.

## Task 07.04: Prove zero-touch query evolution

File: `tests/dynamic_schema_evolution.rs`.

Schema A contains `Query.ping`. Schema B adds `Query.newCapability(limit: Int): NewType`.

Without changing Rust operation code:

1. load A and assert tool absent
2. refresh B
3. assert tool and schemas appear
4. call it successfully
5. assert a list-change notification

Schema C adds a mutation. Assert it is discovered but disabled by default.

Done when: the central automatic-discovery claim is proven.

Dependencies: 07.02.

## Task 07.05: Check authorized live-schema extensions

Use the existing live schema commands and the new targeted crawler against the configured development or production-compatible endpoint. Do not change upstream settings and do not execute live mutations.

Compare with `schema/live-introspection.json`. Record published operations, plugin additions, unsupported scalar diagnostics, and mutation policy state.

Verify:

```bash
just schema-live-diff
cargo test targeted_type_crawl_live -- --ignored --nocapture
```

Done when: counts and differences are recorded without sensitive configuration values.

Dependencies: 07.04.

## Task 07.06: Measure cost and payload size

Add an ignored release-mode benchmark or report test. Measure discovery request count, bytes, duration, compile duration, catalog size, cache size, generated tool count, `tools/list` bytes, and listing latency.

Run:

```bash
cargo test --release dynamic_catalog_benchmark -- --ignored --nocapture
```

Document thresholds before optimizing.

Done when: the implementation PR contains a reproducible report.

Dependencies: 07.05.

## Task 07.07: Verify LABBY behavior

Run `runraid` in hybrid mode against the mock or a safe development endpoint.

Through LABBY:

1. refresh gateway status
2. search for a generated query by intent
3. describe the exact discovered tool
4. call the read-only tool
5. verify structured output and canonical-path metadata
6. refresh to a fixture with a new query
7. verify the new tool is discoverable after notification or reconnect

Use a fixture mutation to verify MCP elicitation. Do not use a production mutation for the first test.

Done when: namespace, tool signature, result, and refresh outcome are recorded.

Dependencies: 07.04, 07.06.

## Task 07.08: Verify supported MCP clients

For each supported client, record version and test:

- initialize capabilities
- hybrid or expanded listing
- structured output
- reaction to tool-list change
- form elicitation
- clear failure when elicitation is unavailable

Do not weaken server policy for a client that lacks form elicitation. Generated mutations remain unavailable there.

Done when: a compatibility matrix is added to operator docs.

Dependencies: 07.07.

## Task 07.09: Review safety boundaries

Review:

```text
src/mcp/dynamic/document.rs
src/mcp/dynamic/validate.rs
src/mcp/dynamic/execute.rs
src/mcp/dynamic/cache.rs
src/mcp/elicitation.rs
src/mcp/rmcp_server.rs
```

Map each CONTRACT.md requirement to code or a test. Confirm catalog-owned GraphQL names, no raw query input, redacted logs, metadata-only cache, mandatory mutation elicitation, authorization before elicitation, snapshot stability, and no request lock across network work.

Add a test for every gap found.

Done when: the review mapping is attached to the implementation PR.

Dependencies: 07.03, 07.08.

## Task 07.10: Update project documentation

Update current operator and developer docs, including:

```text
unraid-rs/README.md
unraid-rs/CLAUDE.md
unraid-rs/docs/INVENTORY.md
unraid-rs/docs/stack/ARCH.md
unraid-rs/docs/stack/TECH.md
unraid-rs/tests/README.md
```

Document configuration, generated names, canonical paths, mutation elicitation, cache, refresh, notifications, diagnostics, schema commands, and rollback. Correct stale RMCP version and read-only claims found during research.

Done when: enable, inspect, diagnose, and disable steps require no source reading.

Dependencies: 07.09.

## Task 07.11: Run release-quality checks

Run:

```bash
cargo fmt --check
cargo check --workspace
cargo clippy --all-targets --all-features -- -D warnings
cargo nextest run
cargo xtask ci
cargo test --test schema_contract
cargo test --test live_schema_contract
cargo test --test scenarios
cargo test --test rmcp_compat
cargo test --test stdio_mcp
cargo test --test dynamic_end_to_end
cargo test --test dynamic_mutation_safety
cargo test --test dynamic_schema_evolution
cargo build --release
./target/release/runraid --version
cargo tree -d
```

Record exact commit and results. Do not describe ignored or skipped tests as passing.

Done when: all required checks are green or a documented blocker remains.

Dependencies: 07.10.

## Task 07.12: Stage rollout and prove rollback

Start in development:

```toml
[mcp.dynamic]
enabled = true
surface = "hybrid"
auto_enable_queries = true
auto_enable_mutations = false
refresh_interval = "1h"
```

Rollout order:

1. generated queries in development
2. observe one refresh
3. one fixture or safe development mutation with elicitation
4. production hybrid mode with mutations disabled
5. selected mutation enables after individual review

Rollback:

```toml
[mcp.dynamic]
enabled = false
surface = "legacy"
```

Restart and compare `tools/list` with `legacy-tools-list.json`. No upstream setting change is required.

Done when: rollout and rollback evidence are attached to release notes.

Dependencies: 07.11.

## Phase 07 gate

Required evidence:

- full surface-mode matrix
- mutation request-counter matrix
- zero-touch schema evolution test
- live extension report
- cost and payload report
- LABBY and client matrix
- contract-to-test review
- updated docs
- full CI and release build
- demonstrated configuration-only rollback
