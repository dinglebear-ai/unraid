# Phase 04: JSON Schema, Validation, and Selection

Goal: give every available operation a precise MCP input schema, output schema, runtime validator, and bounded legal response selection.

## Task 04.01: Add JSON Schema helpers

Files: `src/mcp/dynamic/json_schema.rs`.

Create helpers for object, nullable, required properties, descriptions, definitions, and references. Use `serde_json::Map` with deterministic insertion order or canonical sorting before hashing.

```rust
fn object_schema(
    properties: BTreeMap<String, Value>,
    required: BTreeSet<String>,
) -> Value;

fn nullable(schema: Value) -> Value;
```

Set `additionalProperties: false` for generated input objects.

Verify: golden unit tests for empty and nested objects.

Done when: schema construction code does not scatter raw JSON literals through the compiler.

Dependencies: Phase 03.

## Task 04.02: Map built-in scalar inputs

Files: `src/mcp/dynamic/json_schema.rs`, `src/mcp/dynamic/validate.rs`.

Implement input schemas and validators for `String`, `Boolean`, `Int`, `Float`, and `ID`.

`Int` must enforce GraphQL's signed 32-bit range. `ID` accepts a string or integral JSON number and preserves the JSON value sent as a variable.

Verify boundary values, fractions, overflow, and nullability.

Done when: schema and runtime validator agree for every test value.

Dependencies: 04.01.

## Task 04.03: Map Unraid custom scalars

Files: `src/mcp/dynamic/json_schema.rs`, `src/mcp/dynamic/validate.rs`.

Implement adapters for:

- `DateTime`
- `BigInt`
- `JSON`
- `Port`
- `URL`
- `PrefixedID`

Use the live-schema notes in `CLAUDE.md` and existing Cynic scalar behavior. Add fixtures showing known live wire representations. Keep `BigInt` conservative until live input behavior is verified.

Verify: `cargo test dynamic_custom_scalars --lib`.

Done when: all six known scalars have input validation and output schemas.

Dependencies: 04.02.

## Task 04.04: Compile enums and wrappers

Files: `src/mcp/dynamic/json_schema.rs`.

Recursively compile `TypeRef`:

- enum to string enum
- list to array with recursive items
- nullable wrapper to union with null
- non-null to non-null schema plus containing required status

Keep required-property calculation outside the leaf schema so nested object fields and root arguments behave consistently.

Verify list combinations such as `[String!]!` and `[Enum]`.

Done when: generated schema matches GraphQL null semantics, not Rust `Option` guesses.

Dependencies: 04.02.

## Task 04.05: Compile input objects and defaults

Files: `src/mcp/dynamic/json_schema.rs`, `src/mcp/dynamic/validate.rs`.

Generate `$defs` and `$ref` for input objects. Track active types to support recursive input definitions without infinite recursion.

Required rule:

```rust
let required = field.ty.is_non_null() && field.default_literal.is_none();
```

Parse GraphQL default literals into an internal value only for documentation and validation. Omitted arguments remain omitted from the request.

Verify nested objects, recursion, defaults, and unknown properties.

Done when: current upstream input objects compile without uncontrolled inlining.

Dependencies: 04.04.

## Task 04.06: Add the reserved __mcp schema

Files: `src/mcp/dynamic/json_schema.rs`, `src/mcp/dynamic/models.rs`.

Add `McpExecutionOptions` with only `select: Vec<String>` in v1. Use `#[serde(deny_unknown_fields)]`.

Attach `__mcp` to every generated operation input object. It is optional and never forwarded upstream.

Reject any discovered GraphQL argument beginning with `__` as invalid upstream schema rather than permitting a collision.

Verify: tests reject `__mcp.raw_query`, `confirmed`, and unknown execution options.

Done when: there is no input path for raw GraphQL or mutation approval.

Dependencies: 04.05.

## Task 04.07: Implement catalog-aware input validation

Files: `src/mcp/dynamic/validate.rs`.

Entry point:

```rust
pub fn validate_operation_input(
    registry: &TypeRegistry,
    operation: &OperationSpec,
    input: &Value,
    limits: &InputLimits,
) -> Result<ValidatedInput, DynamicValidationError>;
```

Return separated GraphQL arguments and `McpExecutionOptions`. Enforce:

- required and optional arguments
- explicit null rules
- arrays and nested objects
- enum values
- custom scalar adapters
- unknown-property rejection
- total bytes, depth, array length, and property count

Errors include a JSON-pointer-like path such as `$.input.devices[2]`.

Verify table and property tests.

Done when: validation never relies solely on a client honoring JSON Schema.

Dependencies: 04.06.

## Task 04.08: Generate scalar and enum output schemas

Files: `src/mcp/dynamic/json_schema.rs`.

Map operation return types to output schemas. Output nullability differs from input omission:

- a selected object field is required in the JSON object
- its value schema includes null when GraphQL says nullable

Add conservative output unions for uncertain custom scalar wire shapes and diagnostics where needed.

Verify output values against generated schema fixtures.

Done when: scalar-returning queries and mutations have complete output schemas.

Dependencies: 04.03, 04.04.

## Task 04.09: Implement default object selection

Files: `src/mcp/dynamic/selection.rs`.

Build a deterministic AST, not GraphQL text. At each object:

1. include terminal scalar/enum fields
2. prioritize `id`, `name`, `status`, and `state`
3. skip fields with required arguments
4. descend while under depth and field budgets
5. stop active-path cycles

```rust
pub fn default_selection(
    registry: &TypeRegistry,
    return_type: &TypeRef,
    limits: &SelectionLimits,
) -> Result<SelectionPlan, SelectionError>;
```

Verify deterministic selection under shuffled source fields.

Done when: current query outputs produce legal bounded plans.

Dependencies: 04.08.

## Task 04.10: Support interfaces and unions

Files: `src/mcp/dynamic/selection.rs`, `src/mcp/dynamic/json_schema.rs`.

For abstract types:

- add `SelectionNode::Typename`
- add one bounded inline fragment per selected possible type
- reject missing possible-type definitions
- enforce fragment count budget

Output schema uses `oneOf` branches with `__typename.const`.

Use dedicated fixtures even though the current schema has interfaces and no unions.

Verify: `cargo test dynamic_abstract_selection --lib`.

Done when: interface output schema and selection agree exactly.

Dependencies: 04.09.

## Task 04.11: Validate explicit field-path selections

Files: `src/mcp/dynamic/selection.rs`.

Parse dotted paths into validated GraphQL names. Resolve every segment against the current output graph. Reject:

- unknown fields
- fields requiring arguments
- paths through scalar/enum leaves
- impossible abstract branches
- duplicate paths after normalization
- depth, field, fragment, or document-budget excess

Merge common prefixes into a `SelectionPlan`. Add `__typename` only where structurally required.

Verify examples from SCHEMA.md and malicious strings containing braces, aliases, directives, or whitespace.

Done when: no explicit selection string is copied into a GraphQL document.

Dependencies: 04.10.

## Task 04.12: Finalize operation schemas and availability

Files: `src/mcp/dynamic/catalog.rs`, `src/mcp/dynamic/json_schema.rs`, `src/mcp/dynamic/selection.rs`.

During catalog compilation, attach:

- root input schema
- leaf output schema
- default selection
- schema diagnostics

Mark an operation unsupported when input compilation fails or no legal selection exists. Output uncertainty alone may remain available when the output schema is conservatively valid.

Add a catalog invariant test:

```rust
for operation in catalog.available_operations() {
    assert!(operation.input_schema.is_object());
    assert!(operation.output_schema.is_object());
    assert!(operation.default_selection.within_limits());
}
```

Verify current published and live-plugin operations.

Done when: Phase 04 gate passes and every advertised operation is schema-complete.

Dependencies: 04.07, 04.11.

## Phase 04 gate

```bash
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
cargo test dynamic_custom_scalars --lib
cargo test dynamic_validation --lib
cargo test dynamic_selection --lib
cargo nextest run
```

Evidence:

- scalar mapping table
- default and explicit selection goldens
- unknown input scalar unavailability
- input limit failures
- abstract output schema tests
- catalog invariant test
