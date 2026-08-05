# Phase 05: MCP Execution and Mutation Elicitation

Goal: render generated tools, execute them through the existing GraphQL transport, and prove every generated mutation fails closed without native MCP approval.

## Task 05.01: Render SelectionPlan to GraphQL

Files: `src/mcp/dynamic/document.rs`.

Implement a renderer that accepts only `SelectionNode` values:

```rust
fn render_selection(plan: &SelectionPlan, out: &mut String) -> Result<(), DocumentError>;
```

Render fields, nested braces, `__typename`, and inline fragments. Revalidate document byte budget after rendering.

Golden-test object, nested object, interface, and empty scalar selections.

Done when: the renderer has no API accepting raw field text.

Dependencies: Phase 04.

## Task 05.02: Build operation variables and definitions

Files: `src/mcp/dynamic/document.rs`.

Given `ValidatedInput`, include only supplied GraphQL arguments. Create deterministic variable names and exact GraphQL type signatures.

Example:

```graphql
query UnraidQueryDisk($id: PrefixedID!) {
  disk(id: $id) { id name }
}
```

Omitted optional arguments must not appear in the document or variables map.

Verify defaulted and nullable arguments.

Done when: variables contain no `__mcp` data.

Dependencies: 05.01.

## Task 05.03: Build namespace mutation documents

Files: `src/mcp/dynamic/document.rs`.

Render every `OperationSegment` as nested selections, applying arguments only at the callable leaf.

Expected:

```graphql
mutation UnraidMutationVmStart($id: PrefixedID!) {
  vm {
    start(id: $id)
  }
}
```

Return `CompiledRequest.response_path = ["vm", "start"]`.

Test at least VM, Docker, array, and onboarding namespace paths.

Done when: documents validate against the vendored SDL using `apollo-compiler`.

Dependencies: 05.02.

## Task 05.04: Add dynamic document contract tests

Files: `tests/dynamic_schema_contract.rs`.

For every available operation compiled from the vendored snapshot:

1. create minimal valid arguments or use fixture values
2. build its default document
3. parse and validate against `schema/unraid-schema.graphql`

Live-only plugin operations are tested against the live structural fixture or skipped from vendored validation with an explicit reason.

Verify: `cargo test --test dynamic_schema_contract`.

Done when: every published generated operation creates a schema-valid document.

Dependencies: 05.03.

## Task 05.05: Add safe generic execution

Files: `src/graphql.rs`, `src/mcp/dynamic/execute.rs`.

Expose a narrow method that sends `CompiledRequest.document` and variables through existing `send_graphql`. Do not accept endpoint or header overrides.

```rust
pub(crate) async fn execute_dynamic(
    &self,
    request: &CompiledRequest,
) -> anyhow::Result<Value> {
    self.send_graphql(json!({
        "query": request.document,
        "variables": request.variables,
        "operationName": request.operation_name,
    })).await
}
```

Keep current upstream error redaction.

Done when: wiremock proves the exact document and variables sent.

Dependencies: 05.04.

## Task 05.06: Extract the leaf response

Files: `src/mcp/dynamic/execute.rs`.

Implement response-path traversal over the `data` object returned by `send_graphql`.

Rules:

- missing path component is an upstream-shape error
- present null leaf is valid when output type is nullable
- extra sibling fields are ignored
- extraction never uses caller path strings

Verify direct and namespace responses plus missing/null cases.

Done when: result is exactly the value described by the tool output schema.

Dependencies: 05.05.

## Task 05.07: Render rmcp Tool values

Files: `src/mcp/dynamic/catalog.rs` or a new `tool.rs`, `src/mcp/rmcp_server.rs`.

Convert available operations to RMCP `Tool`:

```rust
Tool::new_with_raw(name, Some(description), input_schema)
    .with_title(title)
    .with_raw_output_schema(output_schema)
    .with_annotations(annotations)
    .with_meta(meta)
```

Meta may include canonical path and catalog hash. It must not contain secrets.

Test annotations for query, mutation, and destructive mutation.

Done when: tool JSON matches SCHEMA.md examples.

Dependencies: 05.06.

## Task 05.08: Integrate generated tools into list_tools

Files: `src/mcp/rmcp_server.rs`, `src/mcp/dynamic/policy.rs`.

At request start, load one catalog snapshot. Render based on surface mode:

- legacy: existing tools only
- expanded: generated tools plus curated helpers
- hybrid: legacy plus generated tools

Filter by caller scope and policy. Sort final tools deterministically and reject duplicate names during catalog validation, not at request time.

Verify list tests for read token, admin token, and no dynamic state.

Done when: mutation tools do not appear to read-only callers.

Dependencies: 05.07.

## Task 05.09: Route generated tool calls

Files: `src/mcp/rmcp_server.rs`, `src/mcp/dynamic/execute.rs`.

Before legacy `execute_tool`, attempt exact generated-name lookup when surface mode includes dynamic tools.

Call flow:

```text
lookup -> policy -> scope -> validate input -> selection -> elicitation if mutation
       -> document -> upstream -> extract -> serialize
```

Unknown generated names fall through to legacy routing only when the name is `unraid` or an existing curated helper. Never use fuzzy matching.

Verify unknown, disabled, hidden, unsupported, and authorized calls.

Done when: generated query fixture executes end to end.

Dependencies: 05.08.

## Task 05.10: Implement universal dynamic mutation elicitation

Files: `src/mcp/elicitation.rs`, `src/mcp/dynamic/execute.rs`, `src/mcp/dynamic/redact.rs`.

Add:

```rust
pub async fn require_dynamic_mutation_elicitation(
    peer: &Peer<RoleServer>,
    operation: &OperationSpec,
    input: &ValidatedInput,
) -> Result<(), MutationElicitationError>;
```

Branch only on `operation.kind == OperationKind::Mutation`. Use typed form elicitation with an internal `approved: bool` field.

Prompt includes operation path, effect description, redacted argument summary, and stronger warning when destructive. It never includes secret values.

Required tests use a counting mock upstream and prove zero requests after:

- capability unsupported
- decline
- cancel
- false approval
- malformed response
- elicitation service error

Only explicit true approval permits one request.

Done when: no generated mutation execution path bypasses this function.

Dependencies: 05.09.

## Task 05.11: Return structured MCP results and typed errors

Files: `src/mcp/rmcp_server.rs`, `src/mcp/dynamic/execute.rs`.

Build `CallToolResult` with:

- pretty JSON text content
- `structured_content = Some(value.clone())`
- `is_error = false`

Route caller-correctable input, selection, and unknown-tool failures to invalid params. Route upstream and execution failures to visible tool errors, following the current `ToolError` philosophy.

Validate structured content against the generated output schema in tests.

Done when: clients that ignore structured content still receive text.

Dependencies: 05.10.

## Task 05.12: Add dynamic resources and legacy compatibility tests

Files: `src/mcp/rmcp_server.rs`, `src/mcp/dynamic/catalog.rs`, `tests/dynamic_mcp.rs`.

Add authenticated resources:

- `unraid://schema/dynamic/catalog`
- `unraid://schema/dynamic/operations/<path>`
- `unraid://schema/dynamic/diagnostics`

Return bounded summaries and schemas without secrets.

Integration tests cover:

- legacy mode exact fixture
- expanded query listing and call
- hybrid listing with no duplicate name
- read/admin filtering
- mutation approval and rejection
- structured output
- current prompts and legacy resource remain available where expected

Verify: `cargo test --test dynamic_mcp`, `rmcp_compat`, and `stdio_mcp`.

Done when: Phase 05 gate passes.

Dependencies: 05.11.

## Phase 05 gate

```bash
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
cargo test --test dynamic_schema_contract
cargo test --test dynamic_mcp
cargo test --test rmcp_compat
cargo test --test stdio_mcp
cargo nextest run
```

Evidence:

- generated documents validate
- query executes through existing transport
- read/admin tool filtering
- structured content conformance
- zero upstream mutation calls for every non-approval outcome
- legacy fixture unchanged
