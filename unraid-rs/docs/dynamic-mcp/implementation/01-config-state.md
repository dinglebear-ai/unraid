# Phase 01: Configuration and Runtime State

Goal: introduce validated dynamic configuration and shared state while keeping disabled mode inert.

## Task 01.01: Add configuration enums

Files: `src/mcp/dynamic/config.rs`.

Add `DynamicSurface` and `StartupFailureMode` with snake-case Serde names and defaults:

```rust
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "snake_case")]
pub enum DynamicSurface { Legacy, Expanded, #[default] Hybrid }

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "snake_case")]
pub enum StartupFailureMode { Fail, #[default] LegacyOnly, EmptyDynamic }
```

Add unit tests for accepted values, rejected values, and defaults.

Verify: `cargo test dynamic_config_modes --lib`.

Done when: enums round-trip through TOML.

Dependencies: Phase 00.

## Task 01.02: Add DynamicMcpConfig defaults

Files: `src/mcp/dynamic/config.rs`, `src/config.rs`.

Implement the config fields in [TYPES.md](../TYPES.md). Use `default_data_dir().join("dynamic-schema-cache.json")`. Keep `enabled = false`, query auto-enable true, mutation auto-enable false, depth 2, max depth 5, and one-hour refresh.

Add `pub dynamic: DynamicMcpConfig` to `McpConfig` with `#[serde(default)]`.

Verify:

```bash
cargo test dynamic_config_defaults --lib
cargo test --test dynamic_disabled
```

Done when: old configuration files still load and defaults do not change the MCP surface.

Dependencies: 01.01.

## Task 01.03: Parse duration fields

Files: `Cargo.toml`, `src/mcp/dynamic/config.rs`.

Use `humantime_serde` for `refresh_interval` and `introspection_timeout`. Test:

```toml
[mcp.dynamic]
refresh_interval = "45m"
introspection_timeout = "20s"
```

Reject zero durations during semantic validation, not deserialization.

Verify: `cargo test dynamic_config_duration --lib`.

Done when: valid human durations parse and malformed values name the field.

Dependencies: 01.02.

## Task 01.04: Implement semantic config validation

Files: `src/mcp/dynamic/config.rs`, `src/config.rs`.

Add:

```rust
pub fn validate_dynamic_config(config: &DynamicMcpConfig) -> Result<(), String>
```

Validate:

- nonzero intervals and limits
- default depth not above max depth
- max depth no higher than a hard ceiling such as 32
- jitter 0 through 100
- nonempty root names and namespace suffixes
- operation keys parse as canonical paths
- no selector is blank
- `auto_enable_mutations` emits a startup warning when true, but remains supported only if the contract still permits it

Collect all problems into one error, matching current tool-filter validation style.

Verify: `cargo test dynamic_config_validation --lib`.

Done when: tests cover multiple simultaneous errors.

Dependencies: 01.03.

## Task 01.05: Add TOML fixture tests

Files: `tests/fixtures/dynamic/config-*.toml`, `tests/dynamic_config.rs`.

Create fixtures:

- default/minimal
- expanded queries only
- selected mutation override
- invalid depth
- invalid operation path
- unknown surface
- unknown attempted `confirmation` field

Use strict test deserialization to prove a fake `confirmation` setting is rejected or at minimum has no effect and is flagged by schema validation.

Verify: `cargo test --test dynamic_config`.

Done when: the example configuration in SCHEMA.md parses exactly.

Dependencies: 01.04.

## Task 01.06: Add environment overrides

Files: `src/config.rs`.

Add narrow overrides using current helpers:

```text
UNRAID_RMCP_DYNAMIC_ENABLED
UNRAID_RMCP_DYNAMIC_SURFACE
UNRAID_RMCP_DYNAMIC_REFRESH_INTERVAL
UNRAID_RMCP_DYNAMIC_AUTO_ENABLE_QUERIES
UNRAID_RMCP_DYNAMIC_AUTO_ENABLE_MUTATIONS
UNRAID_RMCP_DYNAMIC_CACHE_PATH
```

Do not invent one environment variable per operation override in v1. Complex operation policy remains TOML.

Add env-isolation tests following existing config test patterns. Restore environment after each test.

Verify: `cargo test dynamic_env --lib -- --test-threads=1`.

Done when: overrides have clear precedence and disabled mode remains the default without variables.

Dependencies: 01.05.

## Task 01.07: Create an empty OperationCatalog

Files: `src/mcp/dynamic/catalog.rs`, `src/mcp/dynamic/models.rs`.

Implement a temporary minimal catalog sufficient for state wiring:

```rust
pub struct OperationCatalog {
    pub format_version: u32,
    pub by_path: BTreeMap<OperationPath, Arc<OperationSpec>>,
    pub by_tool_name: BTreeMap<ToolName, Arc<OperationSpec>>,
}

impl OperationCatalog {
    pub fn empty() -> Self { /* deterministic empty maps */ }
}
```

Use placeholder model types only as needed, then expand them in Phase 03.

Verify: `cargo test dynamic_empty_catalog --lib`.

Done when: empty catalog construction is deterministic and documented as temporary bootstrap state.

Dependencies: 01.02.

## Task 01.08: Add CatalogStore

Files: `src/mcp/dynamic/catalog.rs`.

Implement `CatalogStore` with `ArcSwap`:

```rust
#[derive(Clone)]
pub struct CatalogStore {
    active: Arc<ArcSwap<OperationCatalog>>,
}

impl CatalogStore {
    pub fn new(initial: OperationCatalog) -> Self;
    pub fn load(&self) -> Arc<OperationCatalog>;
    pub fn store(&self, next: Arc<OperationCatalog>);
}
```

Test that an old loaded `Arc` remains valid after a swap and a new load observes the replacement.

Verify: `cargo test dynamic_catalog_store --lib`.

Done when: no lock is held across reads.

Dependencies: 01.07.

## Task 01.09: Add DynamicRuntime to AppState

Files: `src/mcp/dynamic/refresh.rs`, `src/mcp.rs`, state construction call sites.

Create bootstrap runtime:

```rust
#[derive(Clone)]
pub struct DynamicRuntime {
    pub config: Arc<DynamicMcpConfig>,
    pub catalogs: CatalogStore,
}
```

Add `pub dynamic: Option<DynamicRuntime>` to `AppState`. Construct `None` when dynamic is disabled. Construct an empty runtime only when enabled; no discovery yet.

Update every test helper that builds `AppState`.

Verify:

```bash
cargo check --workspace
cargo test --test dynamic_disabled
cargo nextest run
```

Done when: disabled mode is unchanged and enabled mode can construct state without advertising tools.

Dependencies: 01.08.

## Task 01.10: Add dynamic status diagnostics

Files: `src/mcp/dynamic/refresh.rs`, `src/mcp/dynamic/models.rs`.

Add clone-safe status fields for:

- discovery attempts
- discovery failures
- catalog swaps
- active catalog hash
- last success summary
- last failure summary

Use atomics for counters and a small lock for summaries. Do not expose a resource yet.

Add methods rather than public mutable fields:

```rust
impl DynamicStatus {
    pub fn record_attempt(&self);
    pub fn record_success(&self, summary: RefreshSummary);
    pub fn record_failure(&self, summary: RefreshFailureSummary);
    pub fn snapshot(&self) -> DynamicStatusSnapshot;
}
```

Verify: `cargo test dynamic_status --lib`.

Done when: concurrent counter tests pass and Phase 01 gate is green.

Dependencies: 01.09.

## Phase 01 gate

Run:

```bash
cargo fmt --check
cargo check --workspace
cargo clippy --all-targets --all-features -- -D warnings
cargo nextest run
```

Evidence:

- example TOML parses
- invalid config reports all issues
- attempted confirmation field is not accepted as a safety control
- disabled mode matches legacy fixture
- empty runtime and atomic catalog store work
