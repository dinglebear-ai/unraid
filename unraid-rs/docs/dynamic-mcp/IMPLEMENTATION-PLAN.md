# Dynamic MCP Implementation Plan

Status: ready for implementation

This is the master execution plan. The linked phase files contain the concrete tasks, code seams, commands, and completion checks. Tasks are intentionally scoped to approximately ten focused minutes. A task may run longer when compilation or integration tests are slow, but its code change should remain small enough to review independently.

## Plan index

| Phase | Focus | Tasks | Gate |
|---|---|---:|---|
| [00 Baseline and skeleton](implementation/00-baseline.md) | establish evidence, dependencies, and empty module boundaries | 10 | current behavior unchanged |
| [01 Configuration and runtime state](implementation/01-config-state.md) | config, defaults, validation, AppState, disabled-mode parity | 10 | dynamic state constructs safely |
| [02 Targeted discovery](implementation/02-introspection.md) | `__type` wire models, crawler, existing Python pipeline reuse | 12 | live and fixture snapshots normalize identically |
| [03 Catalog compilation](implementation/03-catalog.md) | type registry, operation paths, namespace mutations, policy, naming | 12 | deterministic catalog with diagnostics |
| [04 JSON Schema and selection](implementation/04-schema-selection.md) | inputs, scalars, defaults, output schemas, bounded selections | 12 | every available operation has valid schemas and selection |
| [05 MCP execution and elicitation](implementation/05-execution-elicitation.md) | document generation, generic transport, tools/list, tools/call, structured output | 12 | generated queries execute; every mutation fails closed without approval |
| [06 Cache, refresh, and notifications](implementation/06-refresh-cache.md) | last-known-good, atomic swap, peer registry, list-change notifications | 12 | changed catalog swaps safely and notifies peers |
| [07 Integration and rollout](implementation/07-tests-rollout.md) | end-to-end tests, live checks, performance, docs, staged release | 12 | hybrid rollout with immediate rollback |

Total: 92 small tasks. The task count is deliberately granular so implementation can stop at any green checkpoint.

## Execution rules

1. Work from `dookie:/home/jmagar/workspace/unraid` and confirm `hostname`, `whoami`, platform, repository root, and branch before editing.
2. Use a dedicated implementation branch created from the latest `main` after this documentation branch is merged or rebased.
3. Read [CONTRACT.md](CONTRACT.md), [SPEC.md](SPEC.md), [TYPES.md](TYPES.md), [MODELS.md](MODELS.md), and [SCHEMA.md](SCHEMA.md) before Phase 00.
4. Preserve current behavior whenever `mcp.dynamic.enabled = false`.
5. Do not delete or rename the legacy `unraid` tool during this plan.
6. Do not add a confirmation argument, approval token, mutation bypass, or configurable no-elicitation mode.
7. Never use caller-provided GraphQL text.
8. Keep each commit green when practical. At minimum, keep each phase gate green.
9. Add typed errors and tests with each boundary rather than postponing all tests to Phase 07.
10. Reuse `scripts/live-schema-contract.py`, `tests/live_schema_contract.rs`, and `schema/live-introspection.json`.
11. Use the pinned Rust toolchain and RMCP version in the repository.
12. Do not change upstream Unraid settings or enable its developer sandbox as part of implementation.

## Standard command set

Run from `unraid-rs/`:

```bash
cargo fmt --check
cargo check --workspace
cargo clippy --all-targets --all-features -- -D warnings
cargo nextest run
cargo xtask ci
```

Focused tests during small tasks:

```bash
cargo test dynamic_ --lib
cargo test --test live_schema_contract
cargo test --test rmcp_compat
cargo test --test stdio_mcp
cargo test --test scenarios
cargo test --test schema_contract
```

Existing schema commands:

```bash
just schema-live-capture
just schema-live-diff
```

The live commands require `UNRAID_API_URL` and `UNRAID_API_KEY`. Do not print either value.

## Task format

Each task includes:

- Goal
- Files
- Steps
- Code direction
- Verification
- Done when
- Dependencies

A task is complete only when its listed verification passes. Do not mark tasks complete from code inspection alone when a runnable test is specified.

## Dependency policy

Potential additions:

```toml
arc-swap = "1"
sha2 = "0.10"
hex = "0.4"
humantime-serde = "1"
```

Before adding a crate:

1. search `Cargo.lock` and workspace manifests
2. confirm current maintenance and MSRV compatibility
3. use exact or workspace-constrained versions consistent with repository policy
4. run `cargo tree -d` after changes
5. avoid a general JSON-Schema validator unless catalog-aware validation cannot meet the contract

## Phase gates

### Gate 00: inert skeleton

- new modules compile
- no generated tools appear
- existing tests pass
- dynamic mode defaults disabled

### Gate 01: safe state

- config loads from TOML and environment
- invalid limits and selectors fail startup
- disabled mode is byte-for-byte or semantically equivalent at the MCP surface

### Gate 02: trustworthy discovery

- targeted crawler reconstructs fixture type graphs
- current Python structural snapshot remains compatible
- live-only plugin types remain visible
- blocked or malformed discovery never produces a candidate catalog

### Gate 03: deterministic catalog

- all current queries are discovered
- all direct and namespace mutation leaves are discovered
- names and hashes are deterministic
- unsupported operations have explicit diagnostics
- mutations remain disabled by default

### Gate 04: safe schemas and selections

- all advertised operations have valid input/output schemas
- unknown input scalars disable only affected operations
- selections are bounded and cycle-safe
- no raw GraphQL enters a plan

### Gate 05: safe execution

- generated queries execute through the existing transport
- generated mutations require admin scope and native form elicitation
- every non-approval result sends zero upstream mutation requests
- results contain structured content
- legacy mode remains unchanged

### Gate 06: durable live refresh

- cache is endpoint-bound, versioned, and atomic
- failed refresh leaves the active catalog untouched
- changed refresh swaps atomically
- capable peers receive tool-list change notifications

### Gate 07: rollout ready

- hybrid mode works with LABBY and target MCP clients
- live plugin operations are governed by policy
- payload size and compilation time are measured
- docs and operator rollback steps are current
- all CI checks pass

## Commit strategy

Recommended commit boundaries:

1. module and config skeleton
2. normalized type system
3. targeted crawler
4. existing live-schema script refactor
5. catalog compiler and naming
6. JSON Schema and validator
7. selection and document builder
8. generated query execution
9. mutation elicitation
10. cache and refresh
11. peer notifications
12. integration tests and rollout docs

Do not combine mutation elicitation with broad unrelated refactors. That invariant deserves a small reviewable commit.

## Test fixtures

Create fixtures under:

```text
tests/fixtures/dynamic/
  minimal-query-types.json
  nested-input-types.json
  namespace-mutations.json
  interface-output.json
  union-output.json
  recursive-output.json
  unknown-input-scalar.json
  permission-descriptions.json
  malformed-missing-type.json
  catalog-v1.json
```

Where possible, derive fixtures from a small hand-authored introspection response rather than copying the full live snapshot into every unit test.

## Runtime feature sequence

The implementation should become observable in this order:

1. diagnostics only
2. generated tools visible in tests
3. generated queries callable in fixture integration tests
4. generated queries callable against mock Unraid
5. generated queries callable in development hybrid mode
6. selected generated mutations callable with test elicitation peer
7. selected generated mutations callable in development
8. periodic refresh and notifications
9. production hybrid rollout

Do not enable auto-generated mutations before step 9. Even then, the default remains disabled.

## Rollback

Immediate runtime rollback:

```toml
[mcp.dynamic]
enabled = false
surface = "legacy"
```

Then restart the service and verify `tools/list` exposes the legacy surface only. No upstream change is required.

Code rollback should remove the dynamic integration from `AppState` and RMCP routing while leaving standalone modules available for diagnosis if needed. The legacy dispatcher remains intact throughout this plan.

## Definition of complete

The project is complete when:

- all phase gates pass
- every contract requirement has a corresponding test or explicit manual verification
- generated queries automatically follow a newly added supported upstream field
- newly discovered mutations remain disabled until configured
- enabled generated mutations always use native MCP elicitation
- cache and refresh failure modes are proven
- legacy and hybrid compatibility are proven
- operator documentation includes enable, inspect, refresh, diagnose, and rollback procedures
