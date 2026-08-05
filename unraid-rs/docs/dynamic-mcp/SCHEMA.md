# Dynamic MCP Schema Design

Status: schema and serialization specification

This document defines the wire schemas used for targeted GraphQL discovery, generated MCP tool inputs and outputs, configuration, diagnostics, and last-known-good persistence.

## 1. Schema layers

The implementation handles five distinct schemas:

1. GraphQL introspection response schema
2. normalized internal GraphQL type graph
3. generated MCP input JSON Schema
4. generated MCP output JSON Schema
5. cache and diagnostic JSON schemas

These layers must not be conflated. In particular, introspection JSON is not stored or exposed directly as an MCP tool schema.

## 2. Targeted introspection request

Production Unraid permits `__type` while blocking root `__schema`. The crawler requests complete type definitions with aliases.

Single-type form:

```graphql
query DynamicType($name: String!) {
  __type(name: $name) {
    kind
    name
    description
    specifiedByURL
    fields(includeDeprecated: true) {
      name
      description
      isDeprecated
      deprecationReason
      args(includeDeprecated: true) {
        name
        description
        defaultValue
        isDeprecated
        deprecationReason
        type { ...TypeRef }
      }
      type { ...TypeRef }
    }
    inputFields(includeDeprecated: true) {
      name
      description
      defaultValue
      isDeprecated
      deprecationReason
      type { ...TypeRef }
    }
    interfaces { kind name }
    enumValues(includeDeprecated: true) {
      name
      description
      isDeprecated
      deprecationReason
    }
    possibleTypes { kind name }
  }
}

fragment TypeRef on __Type {
  kind
  name
  ofType {
    kind
    name
    ofType {
      kind
      name
      ofType {
        kind
        name
        ofType { kind name }
      }
    }
  }
}
```

Batched form generates aliases and variables:

```graphql
query DynamicTypes($n0: String!, $n1: String!, $n2: String!) {
  t0: __type(name: $n0) { ...TypeDefinition }
  t1: __type(name: $n1) { ...TypeDefinition }
  t2: __type(name: $n2) { ...TypeDefinition }
}
```

Type names are variables. The document never interpolates caller or upstream strings.

## 3. Introspection response validation

For each alias:

- a non-null type must have the requested name
- its kind must match the fields present
- named kinds require `name`
- list and non-null references require `ofType`
- named references must not contain `ofType`
- field, argument, enum, and type names must match GraphQL name grammar
- duplicate fields or enum values are invalid
- duplicate type responses must normalize identically

A null alias for a referenced type is a candidate-level error. A null configured subscription root may be accepted when subscription discovery is optional.

## 4. Canonical normalized schema

Canonical serialization rules for hashing:

- maps are `BTreeMap`
- set-like lists are sorted by stable name
- line endings become LF
- absent optional values remain absent, not empty strings
- capture timestamps and transient diagnostics are excluded
- descriptions are included because they affect generated tool descriptions and permission hints
- configured scalar adapters and namespace rules are included in catalog hashing, not schema hashing

Hash representation:

```text
sha256:<lowercase hexadecimal digest>
```

## 5. GraphQL type to JSON Schema

### 5.1 Wrapper rules

`NonNull(T)` affects the containing property's required status and nullability. `List(T)` emits an array whose `items` recursively map `T`.

Nullable values use a JSON Schema union with `null` when null is explicitly accepted. For MCP input objects, an omitted optional property and a present null property are distinct and follow GraphQL nullability.

### 5.2 Built-in scalars

| GraphQL | JSON Schema |
|---|---|
| `String` | `{"type":"string"}` |
| `Boolean` | `{"type":"boolean"}` |
| `Int` | integer, minimum -2147483648, maximum 2147483647 |
| `Float` | number |
| `ID` | `oneOf` string or integer |

### 5.3 Unraid custom scalars

| Scalar | Input schema | Notes |
|---|---|---|
| `DateTime` | string, `format: date-time` | validate RFC 3339 |
| `BigInt` | one of integer or decimal string | live output may differ from SDL assumptions |
| `JSON` | unrestricted JSON within server limits | no executable fields |
| `Port` | integer, 1 through 65535 | reject floats and strings |
| `URL` | string, `format: uri` | require absolute URI unless live API proves otherwise |
| `PrefixedID` | non-empty bounded string | preserve value exactly |

Unknown input scalars make the operation unavailable. A configured JSON Schema overlay may describe an unknown scalar but cannot provide coercion code, so executable input adapters remain built-in.

### 5.4 Enums

```json
{
  "type": "string",
  "enum": ["ALERT", "INFO", "WARNING"],
  "description": "Notification importance"
}
```

Deprecated enum values remain in the schema when the containing operation is included. Deprecation text is appended to descriptions or metadata.

### 5.5 Input objects

GraphQL:

```graphql
input UpdateSshInput {
  enabled: Boolean!
  port: Int!
}
```

JSON Schema:

```json
{
  "type": "object",
  "properties": {
    "enabled": { "type": "boolean" },
    "port": {
      "type": "integer",
      "minimum": -2147483648,
      "maximum": 2147483647
    }
  },
  "required": ["enabled", "port"],
  "additionalProperties": false
}
```

Recursive input objects are supported through `$defs` and `$ref` when the target MCP client's JSON Schema dialect handles them. The compiler may inline bounded acyclic inputs when compatibility requires it. Recursive input cycles must use references and must also pass runtime depth limits.

### 5.6 Defaults

GraphQL argument defaults are retained as GraphQL literals. A non-null argument with a default is not required in generated JSON Schema.

Example:

```graphql
updateDockerViewPreferences(viewId: String = "default", prefs: JSON!): ResolvedOrganizerV1!
```

Generated input requires `prefs` but not `viewId`. When omitted, the document omits `viewId` so the upstream default applies.

## 6. Generated tool input schema

Example query tool:

```json
{
  "name": "unraid_query_disk",
  "title": "Unraid: Disk",
  "description": "Retrieve a disk by its Unraid identifier.",
  "inputSchema": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "properties": {
      "id": {
        "type": "string",
        "minLength": 1,
        "description": "Disk identifier."
      },
      "__mcp": {
        "$ref": "#/$defs/McpExecutionOptions"
      }
    },
    "required": ["id"],
    "additionalProperties": false,
    "$defs": {
      "McpExecutionOptions": {
        "type": "object",
        "properties": {
          "select": {
            "type": "array",
            "items": { "type": "string", "minLength": 1 },
            "uniqueItems": true,
            "maxItems": 128
          }
        },
        "additionalProperties": false
      }
    }
  }
}
```

The double-underscore namespace is reserved by GraphQL for introspection, so it cannot collide with a normal upstream argument name.

## 7. Execution options schema

V1 supports only:

```json
{
  "type": "object",
  "properties": {
    "select": {
      "type": "array",
      "items": {
        "type": "string",
        "pattern": "^[_A-Za-z][_0-9A-Za-z]*(\\.[_A-Za-z][_0-9A-Za-z]*)*$"
      },
      "uniqueItems": true
    }
  },
  "additionalProperties": false
}
```

Future execution options must remain server-only and must not weaken selection, validation, authorization, or elicitation.

Prohibited options include raw query text, raw fragments, custom directives, arbitrary aliases, alternate endpoints, authorization values, and confirmation flags.

## 8. Generated output schema

The output schema describes the extracted leaf result, not the GraphQL `data` envelope.

For an object selection:

```json
{
  "type": "object",
  "properties": {
    "id": { "type": "string" },
    "name": { "type": ["string", "null"] },
    "smartStatus": {
      "type": "string",
      "enum": ["OK", "UNKNOWN"]
    }
  },
  "required": ["id", "name", "smartStatus"],
  "additionalProperties": false
}
```

GraphQL response object fields are present when selected, even when nullable, so they belong in JSON Schema `required` while their value type includes null.

For interface or union outputs:

- `__typename` is required
- `oneOf` branches use `const` on `__typename`
- each branch includes only fields selected for that concrete type

When an output scalar's wire representation is uncertain, the output schema may use a conservative `oneOf` and record a diagnostic.

## 9. MCP tool annotations

Query:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false,
  "idempotentHint": true,
  "openWorldHint": false
}
```

Mutation default:

```json
{
  "readOnlyHint": false,
  "destructiveHint": false,
  "idempotentHint": false,
  "openWorldHint": false
}
```

Resolved destructive policy sets `destructiveHint` to true. Annotations are hints and do not replace policy or elicitation.

## 10. Mutation tool example

Canonical path: `mutation.vm.start`

```json
{
  "name": "unraid_mutation_vm_start",
  "title": "Unraid: Start VM",
  "description": "Start a virtual machine. This mutation always requires MCP elicitation.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "id": { "type": "string", "minLength": 1 },
      "__mcp": { "$ref": "#/$defs/McpExecutionOptions" }
    },
    "required": ["id"],
    "additionalProperties": false
  },
  "outputSchema": { "type": "boolean" },
  "annotations": {
    "readOnlyHint": false,
    "destructiveHint": false,
    "idempotentHint": false,
    "openWorldHint": false
  },
  "_meta": {
    "unraid/operationPath": "mutation.vm.start",
    "unraid/requiresElicitation": true
  }
}
```

The metadata flag documents immutable behavior. The executor does not read it to decide whether to elicit; it branches on `OperationKind::Mutation`.

## 11. Configuration schema

Canonical TOML:

```toml
[mcp.dynamic]
enabled = true
surface = "hybrid"
refresh_interval = "1h"
refresh_jitter_percent = 10
startup_failure = "legacy_only"
auto_enable_queries = true
auto_enable_mutations = false
include_deprecated = false
default_selection_depth = 2
max_selection_depth = 5
max_selected_fields = 128
max_fragments = 32
max_document_bytes = 65536
introspection_batch_size = 20
max_discovered_types = 2000
max_introspection_batches = 200
cache_last_known_good = true

[mcp.dynamic.operations."mutation.vm.start"]
enabled = true

[mcp.dynamic.operations."mutation.updateSettings"]
enabled = true
destructive = true
```

Configuration validation rules:

- unknown surface or failure modes are errors
- percentages are 0 through 100
- default depth cannot exceed max depth
- all limits must be nonzero
- selectors must parse and match current or syntactically valid future paths
- operation override keys must be canonical paths
- unknown configuration fields should fail tests and preferably deserialization
- mutation elicitation is not configurable

## 12. Cache schema

```json
{
  "format_version": 1,
  "compiler_version": "0.1",
  "created_at": "2026-08-05T17:00:00Z",
  "endpoint_fingerprint": "sha256:...",
  "schema_hash": "sha256:...",
  "catalog_hash": "sha256:...",
  "source": "live_targeted_introspection",
  "snapshot": {
    "root_types": {},
    "types": {},
    "diagnostics": []
  },
  "catalog": {
    "by_path": {},
    "by_tool_name": {},
    "diagnostics": []
  }
}
```

The cache format is versioned independently from the crate. Unknown versions are rejected. The endpoint fingerprint uses the normalized endpoint URL with user information removed before hashing.

## 13. Diagnostics schema

```json
{
  "severity": "warning",
  "code": "unsupported_input_scalar",
  "operation": "mutation.example.run",
  "type_name": "FutureScalar",
  "message": "Operation is not advertised until an input adapter is configured."
}
```

Codes are stable machine-readable snake-case values. Messages are human-readable and may evolve.

## 14. Dynamic resources

`unraid://schema/dynamic/catalog` returns a bounded summary:

```json
{
  "catalog_hash": "sha256:...",
  "schema_hash": "sha256:...",
  "source": "live_targeted_introspection",
  "created_at": "...",
  "counts": {
    "queries": 58,
    "mutations_discovered": 86,
    "mutations_enabled": 2,
    "unsupported": 1
  }
}
```

Operation resources return the canonical spec, generated input/output schemas, policy state, and diagnostics while excluding sensitive runtime state.

## 15. Structured tool results

A successful call returns both forms:

```json
{
  "content": [
    { "type": "text", "text": "{\n  \\"id\\": \\"...\\"\n}" }
  ],
  "structuredContent": {
    "id": "..."
  },
  "isError": false
}
```

`structuredContent` must validate against the advertised output schema. Serialization errors are visible tool errors and increment error counters.

## 16. Schema tests

Required golden and property tests:

- every built-in scalar mapping
- nullable and non-null wrappers
- nested lists
- enum deprecation
- input object defaults
- unknown input scalar unavailability
- interface and union output schemas
- default and explicit selections
- operation schema determinism
- canonical hash determinism
- cache round trip and version rejection
- reserved `__mcp` isolation
- structured result conformance
