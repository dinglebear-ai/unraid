# Issue #411 — atomic MCP tools

Goal: expose each enabled Unraid action as a focused MCP tool while preserving the existing dispatcher, auth, confirmation, selector, and error paths.

- [x] **T1 — Add MCP projection mode configuration**
  Acceptance: support `legacy`, `atomic`, and `both` projection modes; default remains `legacy`; env/config parsing is validated.
  Verify: config unit tests plus `cargo test -p unraid-rmcp`.
  Files: `unraid-rs/src/config.rs`, config examples/docs.

- [x] **T2 — Generate one focused schema per enabled action**
  Depends on: T1.
  Acceptance: atomic projection emits exactly one tool per enabled action; each schema includes only fields from `ACTION_PARAMETERS` with correct required/optional constraints and stable names/descriptions.
  Verify: schema completeness, uniqueness, selector-parity, and per-action minimal-schema tests plus `cargo test -p unraid-rmcp`.
  Files: `unraid-rs/src/mcp/schemas.rs`, `unraid-rs/src/mcp/action_params.rs`.

- [x] **T3 — Route atomic calls through the existing dispatcher**
  Depends on: T2.
  Acceptance: atomic tool names resolve to their canonical action, disabled actions are not callable, and arguments enter the same `execute_tool` path used by legacy `unraid(action=...)`.
  Verify: call routing tests for read, mutation, and invalid input plus `cargo test -p unraid-rmcp`.
  Files: `unraid-rs/src/mcp/rmcp_server.rs`, `unraid-rs/src/mcp/tools.rs`, `unraid-rs/src/mcp/tool_filter.rs`.

- [x] **T4 — Preserve auth, destructive confirmation, and truthful annotations**
  Depends on: T3.
  Acceptance: scope checks derive from `ACTIONS`; destructive actions still require elicitation; MCP tool annotations accurately reflect read-only/destructive/idempotency semantics.
  Verify: authorization-denial and destructive-confirmation parity tests plus focused annotation tests.
  Files: `unraid-rs/src/mcp/rmcp_server.rs`, `unraid-rs/src/mcp/schemas.rs`, `unraid-rs/src/mcp/elicitation.rs`.

- [x] **T5 — Add legacy/atomic parity contract tests**
  Depends on: T3, T4.
  Acceptance: legacy vs atomic parity covers representative read, mutation, invalid input, authorization denial, selector filtering, and destructive confirmation behavior.
  Verify: new integration tests plus existing RMCP/stdio suites.
  Files: `unraid-rs/tests/rmcp_compat.rs`, `unraid-rs/tests/stdio_mcp.rs`, new focused atomic projection tests if warranted.

- [x] **T6 — Document rollout and generated MCP help**
  Depends on: T1–T5.
  Acceptance: package docs explain projection modes, compatibility behavior, selector semantics, naming, and examples; generated schema/help reflects the active projection.
  Verify: docs/config examples agree with implementation and CLI/help tests remain green.
  Files: `unraid-rs/README.md`, `unraid-rs/packages/unraid-rmcp/README.md`, config examples/help text.
