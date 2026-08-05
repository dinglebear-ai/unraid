# Proposed Rust Types

Status: code-oriented type reference

These declarations are the intended shape for `src/mcp/dynamic/`. Mechanical adjustments for pinned crates are allowed; safety invariants and ownership boundaries are not.

## Module surface

```rust
// src/mcp/dynamic/mod.rs
mod cache;
mod catalog;
mod config;
mod crawler;
mod document;
mod execute;
mod introspection;
mod json_schema;
mod models;
mod naming;
mod peers;
mod policy;
mod redact;
mod refresh;
mod selection;
mod types;
mod validate;

pub(crate) use catalog::{CatalogDiff, CatalogStore, OperationCatalog};
pub(crate) use config::{DynamicMcpConfig, DynamicSurface};
pub(crate) use execute::execute_dynamic_tool;
pub(crate) use models::{OperationKind, OperationPath, OperationSpec};
pub(crate) use refresh::DynamicRuntime;
```

## Configuration

```rust
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(default)]
pub struct DynamicMcpConfig {
    pub enabled: bool,
    pub surface: DynamicSurface,
    #[serde(with = "humantime_serde")]
    pub refresh_interval: std::time::Duration,
    pub refresh_jitter_percent: u8,
    pub startup_failure: StartupFailureMode,
    pub auto_enable_queries: bool,
    pub auto_enable_mutations: bool,
    pub include_deprecated: bool,
    pub default_selection_depth: u8,
    pub max_selection_depth: u8,
    pub max_selected_fields: usize,
    pub max_fragments: usize,
    pub max_document_bytes: usize,
    pub max_argument_bytes: usize,
    pub max_input_depth: usize,
    pub max_array_items: usize,
    pub introspection_batch_size: usize,
    pub max_discovered_types: usize,
    pub max_introspection_batches: usize,
    pub max_introspection_response_bytes: usize,
    #[serde(with = "humantime_serde")]
    pub introspection_timeout: std::time::Duration,
    pub cache_last_known_good: bool,
    pub cache_path: std::path::PathBuf,
    pub root_types: RootTypeNames,
    pub namespace_suffixes: Vec<String>,
    pub enabled: Vec<String>,
    pub disabled: Vec<String>,
    pub operations: std::collections::BTreeMap<String, OperationOverride>,
    pub scalar_schemas: std::collections::BTreeMap<String, serde_json::Value>,
}

#[derive(Debug, Clone, Copy, serde::Serialize, serde::Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "snake_case")]
pub enum DynamicSurface { Legacy, Expanded, #[default] Hybrid }

#[derive(Debug, Clone, Copy, serde::Serialize, serde::Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "snake_case")]
pub enum StartupFailureMode { Fail, #[default] LegacyOnly, EmptyDynamic }

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct RootTypeNames {
    pub query: String,
    pub mutation: String,
    pub subscription: String,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, Default)]
#[serde(default)]
pub struct OperationOverride {
    pub enabled: Option<bool>,
    pub hidden: Option<bool>,
    pub destructive: Option<bool>,
    pub title: Option<String>,
    pub description: Option<String>,
    pub selection_depth: Option<u8>,
    pub default_select: Option<Vec<String>>,
    pub namespace: Option<bool>,
}
```

There is no `confirmation` or `elicitation` field. Every generated mutation elicits structurally. Defaults are defined in `config.rs` and include disabled dynamic mode, hybrid surface, one-hour refresh, query auto-enable, mutation auto-disable, depth 2, max depth 5, and `default_data_dir()/dynamic-schema-cache.json`.

## Validated identifiers

Tuple fields remain private. Constructors validate GraphQL or MCP grammar.

```rust
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Hash, serde::Serialize, serde::Deserialize)]
#[serde(transparent)]
pub struct TypeName(std::sync::Arc<str>);

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Hash, serde::Serialize, serde::Deserialize)]
#[serde(transparent)]
pub struct FieldName(std::sync::Arc<str>);

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Hash, serde::Serialize, serde::Deserialize)]
#[serde(transparent)]
pub struct ToolName(std::sync::Arc<str>);

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Hash, serde::Serialize, serde::Deserialize)]
pub struct OperationPath {
    pub kind: OperationKind,
    pub segments: std::sync::Arc<[FieldName]>,
}
```

`Display` for `OperationPath` emits canonical dotted form such as `mutation.vm.start`.

## GraphQL references

```rust
#[derive(Debug, Clone, PartialEq, Eq, Hash, serde::Serialize, serde::Deserialize)]
pub enum TypeRef {
    Named(TypeName),
    List(Box<TypeRef>),
    NonNull(Box<TypeRef>),
}

impl TypeRef {
    pub fn named_type(&self) -> &TypeName;
    pub fn is_non_null(&self) -> bool;
    pub fn nullable(&self) -> &TypeRef;
    pub fn to_graphql(&self) -> String;
}
```

Normalization rejects `NonNull(NonNull(_))`, unnamed named types, and wrappers without `ofType`.

## Introspection wire models

```rust
#[derive(Debug, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IntrospectionType {
    pub kind: TypeKind,
    pub name: Option<String>,
    pub description: Option<String>,
    pub specified_by_url: Option<String>,
    pub fields: Option<Vec<IntrospectionField>>,
    pub input_fields: Option<Vec<IntrospectionInputValue>>,
    pub interfaces: Option<Vec<IntrospectionNamedType>>,
    pub enum_values: Option<Vec<IntrospectionEnumValue>>,
    pub possible_types: Option<Vec<IntrospectionNamedType>>,
}

#[derive(Debug, Clone, Copy, serde::Deserialize, serde::Serialize, PartialEq, Eq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum TypeKind { Scalar, Object, Interface, Union, Enum, InputObject, List, NonNull }

#[derive(Debug, serde::Deserialize)]
pub struct IntrospectionData {
    #[serde(flatten)]
    pub aliases: std::collections::BTreeMap<String, Option<IntrospectionType>>,
}
```

A separate recursive `IntrospectionTypeRef { kind, name, of_type }` converts into validated `TypeRef` before catalog code receives it.

## Normalized definitions

```rust
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub enum TypeDefinition {
    Scalar(ScalarType),
    Object(ObjectType),
    Interface(InterfaceType),
    Union(UnionType),
    Enum(EnumType),
    InputObject(InputObjectType),
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ObjectType {
    pub name: TypeName,
    pub description: Option<std::sync::Arc<str>>,
    pub fields: std::sync::Arc<[OutputField]>,
    pub interfaces: std::sync::Arc<[TypeName]>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct OutputField {
    pub name: FieldName,
    pub description: Option<std::sync::Arc<str>>,
    pub arguments: std::sync::Arc<[InputValue]>,
    pub ty: TypeRef,
    pub deprecation: Option<Deprecation>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct InputValue {
    pub name: std::sync::Arc<str>,
    pub description: Option<std::sync::Arc<str>>,
    pub ty: TypeRef,
    pub default_literal: Option<std::sync::Arc<str>>,
    pub deprecation: Option<Deprecation>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct InputObjectType {
    pub name: TypeName,
    pub description: Option<std::sync::Arc<str>>,
    pub fields: std::sync::Arc<[InputValue]>,
    pub one_of: bool,
}
```

`ScalarType` stores name, description, and optional specified-by URL. `EnumType` stores ordered values and deprecations. `InterfaceType` stores fields and possible concrete types. `UnionType` stores possible types.

## Snapshot and registry

```rust
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct SchemaSnapshot {
    pub captured_at: chrono::DateTime<chrono::Utc>,
    pub endpoint_fingerprint: EndpointFingerprint,
    pub source: SchemaSourceKind,
    pub root_types: RootTypeNames,
    pub types: std::collections::BTreeMap<TypeName, TypeDefinition>,
    pub diagnostics: Vec<SchemaDiagnostic>,
    pub schema_hash: SchemaHash,
}

#[derive(Debug, Clone)]
pub struct TypeRegistry {
    types: std::sync::Arc<std::collections::BTreeMap<TypeName, TypeDefinition>>,
}

impl TypeRegistry {
    pub fn require(&self, name: &TypeName) -> Result<&TypeDefinition, CatalogError>;
    pub fn output_fields(&self, name: &TypeName) -> Result<&[OutputField], CatalogError>;
    pub fn input_fields(&self, name: &TypeName) -> Result<&[InputValue], CatalogError>;
    pub fn possible_types(&self, name: &TypeName) -> Result<&[TypeName], CatalogError>;
}
```

The registry is immutable after construction.

## Operation models

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum OperationKind { Query, Mutation, Subscription }

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct OperationSpec {
    pub path: OperationPath,
    pub tool_name: ToolName,
    pub operation_name: std::sync::Arc<str>,
    pub title: std::sync::Arc<str>,
    pub description: std::sync::Arc<str>,
    pub segments: std::sync::Arc<[OperationSegment]>,
    pub arguments: std::sync::Arc<[InputValue]>,
    pub return_type: TypeRef,
    pub input_schema: std::sync::Arc<serde_json::Map<String, serde_json::Value>>,
    pub output_schema: std::sync::Arc<serde_json::Map<String, serde_json::Value>>,
    pub default_selection: SelectionPlan,
    pub scope: RequiredScope,
    pub risk: RiskMetadata,
    pub permission_hint: Option<PermissionHint>,
    pub deprecation: Option<Deprecation>,
    pub availability: OperationAvailability,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct OperationSegment {
    pub field: FieldName,
    pub parent_type: TypeName,
    pub return_type: TypeRef,
}

#[derive(Debug, Clone, Copy, serde::Serialize, serde::Deserialize, PartialEq, Eq)]
pub enum RequiredScope { Read, Admin }

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct RiskMetadata {
    pub destructive: bool,
    pub reason: Option<std::sync::Arc<str>>,
    pub source: RiskSource,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub enum OperationAvailability {
    Available,
    DisabledByPolicy,
    Unsupported { code: DiagnosticCode, detail: std::sync::Arc<str> },
    Hidden,
}
```

Every `Mutation` elicits at execution time. This is not represented as an optional boolean.

## Selection and request types

```rust
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct SelectionPlan {
    pub nodes: std::sync::Arc<[SelectionNode]>,
    pub selected_fields: usize,
    pub depth: u8,
    pub fragments: usize,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub enum SelectionNode {
    Field { name: FieldName, children: std::sync::Arc<[SelectionNode]> },
    InlineFragment { on_type: TypeName, children: std::sync::Arc<[SelectionNode]> },
    Typename,
}

#[derive(Debug, Clone, Default, serde::Deserialize)]
#[serde(deny_unknown_fields)]
pub struct McpExecutionOptions {
    #[serde(default)]
    pub select: Vec<String>,
}

#[derive(Debug, Clone)]
pub struct CompiledRequest {
    pub operation_path: OperationPath,
    pub operation_name: std::sync::Arc<str>,
    pub document: std::sync::Arc<str>,
    pub variables: serde_json::Map<String, serde_json::Value>,
    pub response_path: std::sync::Arc<[FieldName]>,
    pub catalog_hash: CatalogHash,
}
```

## Catalog and runtime

```rust
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct OperationCatalog {
    pub format_version: u32,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub endpoint_fingerprint: EndpointFingerprint,
    pub schema_hash: SchemaHash,
    pub catalog_hash: CatalogHash,
    pub by_path: std::collections::BTreeMap<OperationPath, std::sync::Arc<OperationSpec>>,
    pub by_tool_name: std::collections::BTreeMap<ToolName, std::sync::Arc<OperationSpec>>,
    pub diagnostics: std::sync::Arc<[CatalogDiagnostic]>,
}

#[derive(Clone)]
pub struct CatalogStore {
    active: std::sync::Arc<arc_swap::ArcSwap<OperationCatalog>>,
}

#[derive(Clone)]
pub struct DynamicRuntime {
    pub config: std::sync::Arc<DynamicMcpConfig>,
    pub catalogs: CatalogStore,
    pub peers: PeerRegistry,
    pub refresh_gate: std::sync::Arc<tokio::sync::Mutex<()>>,
    pub status: std::sync::Arc<DynamicStatus>,
}
```

`AppState` gains `pub dynamic: Option<DynamicRuntime>`. Requests call `catalogs.load()` once and retain that `Arc` through validation and execution.

## Elicitation

```rust
#[derive(Debug, serde::Deserialize, schemars::JsonSchema)]
struct DynamicMutationApproval {
    /// Approve this one concrete Unraid mutation.
    approved: bool,
}
rmcp::elicit_safe!(DynamicMutationApproval);

#[derive(Debug, thiserror::Error)]
pub enum MutationElicitationError {
    #[error("mutation was not approved")] NotApproved,
    #[error("mutation was declined")] Declined,
    #[error("mutation was cancelled")] Cancelled,
    #[error("client lacks MCP form elicitation")] CapabilityNotSupported,
    #[error("elicitation failed: {0}")] Service(String),
}
```

The approval type is internal and never appears in a tool input schema.

## Cache

```rust
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct CatalogCacheEnvelope {
    pub format_version: u32,
    pub compiler_version: std::sync::Arc<str>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub endpoint_fingerprint: EndpointFingerprint,
    pub schema_hash: SchemaHash,
    pub catalog_hash: CatalogHash,
    pub source: SchemaSourceKind,
    pub snapshot: SchemaSnapshot,
    pub catalog: OperationCatalog,
}
```

The cache contains metadata only, never credentials, arguments, elicitation data, or upstream results.

## Errors

Use typed boundary errors:

```rust
#[derive(Debug, thiserror::Error)]
pub enum DynamicError {
    #[error(transparent)] Discovery(#[from] DiscoveryError),
    #[error(transparent)] Catalog(#[from] CatalogError),
    #[error(transparent)] Validation(#[from] DynamicValidationError),
    #[error(transparent)] Selection(#[from] SelectionError),
    #[error(transparent)] Document(#[from] DocumentError),
    #[error(transparent)] Cache(#[from] CacheError),
    #[error(transparent)] Elicitation(#[from] MutationElicitationError),
}
```

Do not route failures by matching message prose. The RMCP boundary converts caller-correctable failures to invalid params and execution failures to visible tool errors.

## Likely dependencies

```toml
arc-swap = "1"
sha2 = "0.10"
hex = "0.4"
humantime-serde = "1"
```

Check the workspace lockfile before adding crates. A general JSON-Schema validator is optional; catalog-aware validation is the primary validator.
