# Phase 06: Cache, Refresh, and Tool-List Notifications

Goal: make live schema changes durable and safe without changing in-flight calls or leaving MCP clients with a stale tool catalog.

## Task 06.01: Define cache envelope and version

Files: `src/mcp/dynamic/cache.rs`, `src/mcp/dynamic/models.rs`.

Implement `CatalogCacheEnvelope` with:

- `format_version`
- compiler version
- creation time
- endpoint fingerprint
- schema hash
- catalog hash
- source kind
- normalized snapshot
- compiled catalog

Use a constant such as `CACHE_FORMAT_VERSION: u32 = 1`. Reject unknown versions.

Verify JSON round trip with `tests/fixtures/dynamic/catalog-v1.json`.

Done when: cache deserialization does not install anything by itself.

Dependencies: Phase 05.

## Task 06.02: Implement endpoint fingerprinting

Files: `src/mcp/dynamic/cache.rs`.

Parse the configured URL using the existing `url` crate. Remove user info, normalize scheme and host case, preserve meaningful path and port, omit fragments, then hash the normalized representation.

Test:

- embedded user info does not affect fingerprint
- host, port, or GraphQL path changes do
- query ordering is canonical or query is excluded by explicit rule
- malformed URL is a config error

Done when: raw URL and credentials never appear in the cache envelope.

Dependencies: 06.01.

## Task 06.03: Validate loaded cache

Files: `src/mcp/dynamic/cache.rs`, `src/mcp/dynamic/catalog.rs`.

Validation sequence:

1. parse JSON
2. verify format version
3. verify endpoint fingerprint
4. recompute schema hash
5. validate normalized type references
6. validate catalog indexes and hashes
7. re-run catalog invariants

Return typed `CacheError` variants. A corrupt or mismatched cache is ineligible, not partially repaired.

Verify each failure with a mutated fixture.

Done when: cache validation uses the same catalog invariant function as live candidates.

Dependencies: 06.02.

## Task 06.04: Write the cache atomically

Files: `src/mcp/dynamic/cache.rs`.

Write a temporary sibling file, set restrictive permissions on Unix, serialize, flush, call `sync_all`, then rename. Optionally sync the parent directory when supported.

```rust
pub async fn write_cache_atomic(
    path: &Path,
    envelope: &CatalogCacheEnvelope,
) -> Result<(), CacheError>;
```

Never follow a symlinked destination. Mirror the repository's defensive handling of secret-bearing data directories even though this cache contains metadata only.

Verify interrupted-write simulation leaves the previous cache readable.

Done when: no direct truncate-and-write path exists.

Dependencies: 06.03.

## Task 06.05: Load cache during startup

Files: state construction in `src/mcp.rs` or startup module, `src/mcp/dynamic/refresh.rs`.

When dynamic mode is enabled:

1. try live discovery
2. if valid, install live candidate
3. otherwise load valid endpoint-matched cache when enabled
4. otherwise apply `startup_failure`

For `hybrid + legacy_only`, keep legacy tools and expose dynamic diagnostics describing the failure. For `expanded + fail`, return startup error.

Verify all source/failure combinations with injected fake sources.

Done when: source precedence is deterministic and logged.

Dependencies: 06.04.

## Task 06.06: Implement refresh_once

Files: `src/mcp/dynamic/refresh.rs`.

Entry point:

```rust
pub async fn refresh_once(
    runtime: &DynamicRuntime,
    client: &UnraidClient,
) -> Result<RefreshOutcome, DynamicError>;
```

Pipeline:

- acquire refresh gate
- discover
- compile
- validate
- compare hashes
- if unchanged, record success
- if changed, write cache
- atomically swap
- compute diff
- notify peers in later task

A cache write failure should prevent swap by default so the active catalog remains recoverable after restart. Document any alternative explicitly.

Verify unchanged, changed, and failed candidates.

Done when: candidate errors leave `CatalogStore` untouched.

Dependencies: 06.05.

## Task 06.07: Add periodic refresh with jitter

Files: `src/mcp/dynamic/refresh.rs`, startup and shutdown wiring.

Spawn a `tokio` task only when dynamic mode is enabled and interval is nonzero. Use bounded random or deterministic seeded jitter without adding a heavyweight dependency if possible.

The task must:

- respect shutdown cancellation
- never overlap refreshes
- record attempt and failure status
- avoid a tight retry loop after failure

Test with paused Tokio time and a fake source.

Done when: shutdown does not leak the task and intervals are testable.

Dependencies: 06.06.

## Task 06.08: Implement PeerRegistry

Files: `src/mcp/dynamic/peers.rs`, `src/mcp/rmcp_server.rs`.

Determine the exact RMCP 3.1.0 lifecycle hook for initialized sessions. Register a peer key, handle, capabilities, and failure count. Remove on termination where hooks permit; otherwise prune failed handles.

API:

```rust
impl PeerRegistry {
    pub fn register(&self, key: PeerKey, peer: Peer<RoleServer>, capable: bool);
    pub fn remove(&self, key: &PeerKey);
    pub fn snapshot_capable(&self) -> Vec<(PeerKey, Peer<RoleServer>)>;
}
```

Do not hold registry locks while sending notifications.

Verify concurrent register/remove/snapshot tests.

Done when: both HTTP sessions and stdio behavior are explicitly documented.

Dependencies: 06.07.

## Task 06.09: Advertise tool-list change support

Files: `src/mcp/rmcp_server.rs`.

Only after PeerRegistry and send behavior exist, change capabilities:

```rust
ServerCapabilities::builder()
    .enable_tools()
    .enable_tool_list_changed()
    .enable_resources()
    .enable_prompts()
    .build()
```

Add a protocol test that inspects initialize response. Do not advertise the capability in builds where notification wiring is disabled.

Done when: advertised capability reflects actual behavior.

Dependencies: 06.08.

## Task 06.10: Notify peers after changed swap

Files: `src/mcp/dynamic/peers.rs`, `src/mcp/dynamic/refresh.rs`.

After a successful changed swap, call `notify_tool_list_changed()` for capable peers with bounded concurrency. Collect per-peer outcomes. Remove handles after terminal failure; retain retry-safe failures according to a small policy.

Notification failure does not roll back the catalog or cache.

Test:

- unchanged refresh sends none
- changed refresh sends one per capable peer
- incapable peer receives none
- one failure does not prevent others
- stale peer is removed

Done when: notification counts are part of `RefreshOutcome`.

Dependencies: 06.09.

## Task 06.11: Expose refresh status and diff resources

Files: `src/mcp/rmcp_server.rs`, `src/mcp/dynamic/refresh.rs`.

Extend dynamic resources with bounded status:

```json
{
  "active_catalog_hash": "sha256:...",
  "source": "live_targeted_introspection",
  "last_success": {},
  "last_failure": null,
  "last_diff": {
    "added": 2,
    "removed": 0,
    "changed": 1
  }
}
```

Do not expose full endpoint URLs, credentials, or unbounded type maps. Require read scope.

Verify resource auth and size tests.

Done when: operators can diagnose fallback source and refresh failure without reading server memory or logs.

Dependencies: 06.10.

## Task 06.12: Add cache, refresh, and notification integration tests

Files: `tests/dynamic_refresh.rs`, fixture source and test peer support.

Scenarios:

- live success writes and installs cache
- live failure loads matching cache
- mismatched endpoint rejects cache
- corrupt cache falls back safely
- invalid new schema retains old catalog
- unchanged schema does not notify
- changed schema swaps and notifies
- in-flight call retains old catalog snapshot
- restart from cache reproduces exact tool names and schemas
- cache contains no configured token strings

Run with temporary directories and paused time.

Verify `cargo test --test dynamic_refresh` plus full suite.

Done when: Phase 06 gate passes.

Dependencies: 06.11.

## Phase 06 gate

```bash
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
cargo test --test dynamic_refresh
cargo test --test rmcp_compat
cargo test --test stdio_mcp
cargo nextest run
```

Evidence:

- atomic cache tests
- endpoint mismatch rejection
- failed candidate retention
- in-flight snapshot stability
- capability advertisement
- per-peer notification outcomes
