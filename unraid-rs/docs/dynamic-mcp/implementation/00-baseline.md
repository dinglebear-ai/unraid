# Phase 00: Baseline and Skeleton

Goal: establish reproducible evidence and inert module boundaries without changing the MCP surface.

## Task 00.01: Verify the target workspace

Goal: prove commands are running on the intended host and repository.

Run:

```bash
hostname
whoami
uname -a
cd /home/jmagar/workspace/unraid
git remote -v
git status --short --branch
git rev-parse HEAD
```

Expected:

- host is DOOKIE
- user is `jmagar`
- repository remote is `dinglebear-ai/unraid`
- working tree state is understood before edits

Done when: identity and starting commit are copied into the implementation session log.

Dependencies: none.

## Task 00.02: Create the implementation branch

Goal: isolate runtime work from the documentation branch.

Run after the documentation branch is merged or rebased:

```bash
cd /home/jmagar/workspace/unraid
git fetch origin
git switch main
git pull --ff-only origin main
git switch -c feat/dynamic-mcp-schema
```

Do not branch from an old local main. Do not reuse `docs/dynamic-mcp-schema` for runtime code.

Done when: `git status --short --branch` shows the new branch at current origin/main.

Dependencies: 00.01.

## Task 00.03: Read the design contract

Goal: prevent implementation drift before code begins.

Read:

```text
unraid-rs/docs/dynamic-mcp/README.md
unraid-rs/docs/dynamic-mcp/CONTRACT.md
unraid-rs/docs/dynamic-mcp/SPEC.md
unraid-rs/docs/dynamic-mcp/TYPES.md
unraid-rs/docs/dynamic-mcp/MODELS.md
unraid-rs/docs/dynamic-mcp/SCHEMA.md
```

Create `unraid-rs/docs/sessions/<date>-dynamic-mcp-implementation.md` with:

- starting commit
- decisions that must not change
- current task
- commands run
- test outcomes

The first pinned decision must state: every generated mutation uses native MCP form elicitation and there is no confirmation argument or bypass.

Done when: session log exists and contains the pinned invariants.

Dependencies: 00.02.

## Task 00.04: Run the baseline checks

Goal: distinguish pre-existing failures from implementation regressions.

Run from `unraid-rs/`:

```bash
cargo fmt --check
cargo check --workspace
cargo clippy --all-targets --all-features -- -D warnings
cargo nextest run
cargo xtask ci
```

Record each command, duration, and result. Do not start feature edits until failures are understood. A pre-existing failure may be documented, but do not relabel it as caused by dynamic MCP.

Done when: baseline is green or every existing failure has reproducible evidence and an explicit disposition.

Dependencies: 00.03.

## Task 00.05: Capture the legacy MCP surface

Goal: create a compatibility artifact for disabled and hybrid modes.

Use the existing RMCP tests or start the mock and server:

```bash
just mock healthy 8999
UNRAID_API_URL=http://127.0.0.1:8999/graphql \
UNRAID_API_KEY=test \
UNRAID_RMCP_NO_AUTH=true \
just dev
```

In another shell, use the repository's MCP test client or `mcporter` to save `tools/list` as:

```text
tests/fixtures/dynamic/legacy-tools-list.json
```

Normalize volatile fields and preserve tool name, description, input schema, prompts, and resources.

Done when: a test can compare current legacy listing to the fixture.

Dependencies: 00.04.

## Task 00.06: Record existing live-schema behavior

Goal: preserve and understand the existing contract pipeline.

Inspect and run offline:

```bash
cargo test --test live_schema_contract
python3 scripts/live-schema-contract.py --help
```

When live credentials are available, run without printing them:

```bash
just schema-live-diff
```

Record whether full `__schema` currently succeeds on the target server and whether its sandbox is known to be enabled. Do not change upstream settings.

Done when: the session log describes the current script, snapshot format, live-only plugin types, and live request outcome.

Dependencies: 00.04.

## Task 00.07: Audit candidate dependencies

Goal: avoid unnecessary crates and MSRV surprises.

Run:

```bash
grep -R 'name = "arc-swap"\|name = "sha2"\|name = "hex"\|name = "humantime-serde"' Cargo.lock
cargo tree -d
rustc --version
cargo --version
```

Check each candidate crate's current MSRV and license before editing `Cargo.toml`. Prefer existing transitive crates only when using them directly is allowed and version policy remains clear.

Document decisions in the session log.

Done when: each candidate is marked add, avoid, or defer with a reason.

Dependencies: 00.04.

## Task 00.08: Add only approved dependencies

Goal: introduce the smallest dependency delta.

Edit `unraid-rs/Cargo.toml`. Expected additions if approved:

```toml
arc-swap = "1"
sha2 = "0.10"
hex = "0.4"
humantime-serde = "1"
```

Run:

```bash
cargo check --workspace
cargo tree -d
```

Do not add a JSON-Schema validator in this task.

Done when: lockfile changes are understood, MSRV remains 1.97.1, and workspace check passes.

Dependencies: 00.07.

## Task 00.09: Create the inert module tree

Goal: establish compile-time boundaries without behavior.

Create:

```text
src/mcp/dynamic/mod.rs
src/mcp/dynamic/config.rs
src/mcp/dynamic/introspection.rs
src/mcp/dynamic/crawler.rs
src/mcp/dynamic/types.rs
src/mcp/dynamic/models.rs
src/mcp/dynamic/catalog.rs
src/mcp/dynamic/policy.rs
src/mcp/dynamic/naming.rs
src/mcp/dynamic/json_schema.rs
src/mcp/dynamic/selection.rs
src/mcp/dynamic/document.rs
src/mcp/dynamic/validate.rs
src/mcp/dynamic/execute.rs
src/mcp/dynamic/cache.rs
src/mcp/dynamic/refresh.rs
src/mcp/dynamic/peers.rs
src/mcp/dynamic/redact.rs
```

Each file starts with a crate-level or module-level doc comment because workspace lints deny missing documentation where applicable. Add `pub(crate) mod dynamic;` to `src/mcp.rs` or its module declaration location.

Do not add `AppState` fields yet.

Run:

```bash
cargo fmt
cargo check --workspace
```

Done when: the empty module tree compiles and no tool listing changes.

Dependencies: 00.08.

## Task 00.10: Add a disabled-feature compatibility test

Goal: lock the no-op guarantee before state integration.

Create `tests/dynamic_disabled.rs` or extend an existing RMCP integration test. Load default config and assert:

- dynamic mode is disabled
- `tools/list` contains only the legacy `unraid` tool
- legacy input schema matches `legacy-tools-list.json`
- existing prompt and resource lists are unchanged

Test skeleton:

```rust
#[tokio::test]
async fn dynamic_defaults_do_not_change_the_legacy_surface() {
    let fixture = legacy_tools_fixture();
    let actual = list_tools_with_default_config().await;
    assert_eq!(normalize(actual), fixture);
}
```

Run:

```bash
cargo test --test dynamic_disabled
cargo nextest run
```

Done when: the new compatibility test passes and Phase 00 gate is green.

Dependencies: 00.05, 00.09.

## Phase 00 gate

```bash
cargo fmt --check
cargo check --workspace
cargo clippy --all-targets --all-features -- -D warnings
cargo nextest run
```

Evidence required:

- target identity
- baseline results
- dependency decision record
- inert module tree
- legacy surface fixture
- disabled-mode compatibility test
