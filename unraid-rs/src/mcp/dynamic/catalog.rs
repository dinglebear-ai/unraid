//! Deterministic operation catalog compilation and atomic active storage.

use std::{
    collections::{BTreeMap, BTreeSet},
    sync::Arc,
};

use arc_swap::ArcSwap;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

use super::{
    config::DynamicMcpConfig,
    json_schema::{operation_input_schema, operation_output_schema},
    models::{OperationAvailability, OperationSegment, OperationSpec, RequiredScope},
    naming,
    policy::resolve_policy,
    schema::{OutputField, TypeDefinition, TypeRegistry},
    selection::{SelectionPlan, default_selection},
    snapshot::SchemaSnapshot,
    types::{FieldName, OperationKind, OperationPath, ToolName, TypeName},
};

/// Non-fatal catalog compiler diagnostic.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct CatalogDiagnostic {
    /// Canonical operation path, when known.
    pub path: Option<String>,
    /// Stable diagnostic code.
    pub code: String,
    /// Human-readable detail.
    pub detail: String,
}

/// Immutable index of generated GraphQL operations.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct OperationCatalog {
    /// Cache and compiler compatibility version.
    pub format_version: u32,
    /// Catalog creation time.
    pub created_at: DateTime<Utc>,
    /// Source schema hash.
    pub schema_hash: String,
    /// Deterministic compiled catalog hash.
    pub catalog_hash: String,
    /// Immutable normalized schema registry for request validation.
    #[serde(skip, default)]
    pub registry: TypeRegistry,
    /// Complete canonical operation-path index.
    pub by_path: BTreeMap<OperationPath, Arc<OperationSpec>>,
    /// Available rendered MCP tool-name index.
    pub by_tool_name: BTreeMap<ToolName, Arc<OperationSpec>>,
    /// Compiler diagnostics.
    pub diagnostics: Vec<CatalogDiagnostic>,
}

impl OperationCatalog {
    /// Construct deterministic bootstrap state before discovery succeeds.
    pub fn empty() -> Self {
        Self {
            format_version: 1,
            created_at: DateTime::UNIX_EPOCH,
            schema_hash: String::new(),
            catalog_hash: String::new(),
            registry: TypeRegistry::default(),
            by_path: BTreeMap::new(),
            by_tool_name: BTreeMap::new(),
            diagnostics: Vec::new(),
        }
    }

    /// Return only operations currently advertised as generated MCP tools.
    pub fn available_operations(&self) -> impl Iterator<Item = &Arc<OperationSpec>> {
        self.by_tool_name.values()
    }
}

impl Default for OperationCatalog {
    fn default() -> Self {
        Self::empty()
    }
}

/// Catalog compilation failure that prevents any candidate from being installed.
#[derive(Debug, thiserror::Error)]
pub enum CatalogError {
    #[error("schema root type {0} is missing or is not an object")]
    InvalidRoot(TypeName),
    #[error("invalid generated operation path: {0}")]
    InvalidPath(String),
    #[error("failed to serialize catalog hash input")]
    Serialization(#[source] serde_json::Error),
}

#[derive(Clone)]
struct Candidate {
    path: OperationPath,
    segments: Vec<OperationSegment>,
    field: OutputField,
}

/// Compile all query and mutation leaves from a validated schema snapshot.
pub fn compile_catalog(
    snapshot: &SchemaSnapshot,
    config: &DynamicMcpConfig,
) -> Result<OperationCatalog, CatalogError> {
    let registry = TypeRegistry::new(snapshot.types.clone());
    let mut candidates = Vec::new();
    let mut diagnostics = Vec::new();

    discover_queries(&registry, &snapshot.roots.query, &mut candidates)?;
    if let Some(mutation_root) = &snapshot.roots.mutation {
        discover_mutations(
            &registry,
            mutation_root,
            config,
            &mut candidates,
            &mut diagnostics,
        )?;
    }
    candidates.sort_by(|left, right| left.path.cmp(&right.path));

    let mut by_path = BTreeMap::new();
    let mut by_tool_name = BTreeMap::new();
    let mut used_names = BTreeSet::new();
    for candidate in candidates {
        let mut spec = compile_candidate(&registry, config, candidate);
        let unique_name = unique_tool_name(&spec.path, &spec.tool_name, &mut used_names);
        spec.tool_name = unique_name.clone();
        spec.operation_name = unique_name.to_string();
        let spec = Arc::new(spec);
        if spec.availability.is_available() {
            by_tool_name.insert(unique_name, spec.clone());
        }
        by_path.insert(spec.path.clone(), spec);
    }

    let catalog_hash = hash_catalog(&snapshot.schema_hash, &by_path)?;
    Ok(OperationCatalog {
        format_version: 1,
        created_at: Utc::now(),
        schema_hash: snapshot.schema_hash.clone(),
        catalog_hash,
        registry,
        by_path,
        by_tool_name,
        diagnostics,
    })
}

fn discover_queries(
    registry: &TypeRegistry,
    root: &TypeName,
    candidates: &mut Vec<Candidate>,
) -> Result<(), CatalogError> {
    let object = registry
        .object(root)
        .map_err(|_| CatalogError::InvalidRoot(root.clone()))?;
    for field in &object.fields {
        let path = OperationPath::new(OperationKind::Query, [field.name.clone()])
            .map_err(|error| CatalogError::InvalidPath(error.to_string()))?;
        candidates.push(Candidate {
            path,
            segments: vec![OperationSegment {
                field: field.name.clone(),
                parent_type: root.clone(),
                return_type: field.ty.clone(),
            }],
            field: field.clone(),
        });
    }
    Ok(())
}

fn discover_mutations(
    registry: &TypeRegistry,
    root: &TypeName,
    config: &DynamicMcpConfig,
    candidates: &mut Vec<Candidate>,
    diagnostics: &mut Vec<CatalogDiagnostic>,
) -> Result<(), CatalogError> {
    let object = registry
        .object(root)
        .map_err(|_| CatalogError::InvalidRoot(root.clone()))?;
    let mut stack = BTreeSet::from([root.clone()]);
    walk_mutation_fields(
        registry,
        root,
        &object.fields,
        Vec::new(),
        Vec::new(),
        config,
        &mut stack,
        candidates,
        diagnostics,
    )
}

#[allow(clippy::too_many_arguments)]
fn walk_mutation_fields(
    registry: &TypeRegistry,
    parent: &TypeName,
    fields: &[OutputField],
    path_prefix: Vec<FieldName>,
    segment_prefix: Vec<OperationSegment>,
    config: &DynamicMcpConfig,
    stack: &mut BTreeSet<TypeName>,
    candidates: &mut Vec<Candidate>,
    diagnostics: &mut Vec<CatalogDiagnostic>,
) -> Result<(), CatalogError> {
    for field in fields {
        let mut path_segments = path_prefix.clone();
        path_segments.push(field.name.clone());
        let path = OperationPath::new(OperationKind::Mutation, path_segments.clone())
            .map_err(|error| CatalogError::InvalidPath(error.to_string()))?;
        let mut operation_segments = segment_prefix.clone();
        operation_segments.push(OperationSegment {
            field: field.name.clone(),
            parent_type: parent.clone(),
            return_type: field.ty.clone(),
        });

        if is_namespace(registry, field, &path, config) {
            let target = field.ty.named_type().clone();
            if !stack.insert(target.clone()) {
                diagnostics.push(CatalogDiagnostic {
                    path: Some(path.to_string()),
                    code: "namespace_cycle".to_string(),
                    detail: format!("mutation namespace cycle through {target}"),
                });
                continue;
            }
            let object = registry
                .object(&target)
                .map_err(|_| CatalogError::InvalidRoot(target.clone()))?;
            walk_mutation_fields(
                registry,
                &target,
                &object.fields,
                path_segments,
                operation_segments,
                config,
                stack,
                candidates,
                diagnostics,
            )?;
            stack.remove(&target);
        } else {
            candidates.push(Candidate {
                path,
                segments: operation_segments,
                field: field.clone(),
            });
        }
    }
    Ok(())
}

fn is_namespace(
    registry: &TypeRegistry,
    field: &OutputField,
    path: &OperationPath,
    config: &DynamicMcpConfig,
) -> bool {
    if !field.arguments.is_empty() {
        return false;
    }
    if let Some(explicit) = config
        .operations
        .get(&path.to_string())
        .and_then(|value| value.namespace)
    {
        return explicit;
    }
    matches!(
        registry.require(field.ty.named_type()),
        Ok(TypeDefinition::Object(_))
    ) && config
        .namespace_suffixes
        .iter()
        .any(|suffix| field.ty.named_type().as_str().ends_with(suffix))
}

fn compile_candidate(
    registry: &TypeRegistry,
    config: &DynamicMcpConfig,
    candidate: Candidate,
) -> OperationSpec {
    let (mut availability, risk) = resolve_policy(&candidate.path, config);
    let override_policy = config.operations.get(&candidate.path.to_string());
    let depth = override_policy
        .and_then(|value| value.selection_depth)
        .unwrap_or(config.default_selection_depth)
        .min(config.max_selection_depth);

    let input_schema = operation_input_schema(&candidate.field.arguments, registry, config);
    let output_schema = operation_output_schema(&candidate.field.ty, registry, config);
    let selection = default_selection(
        registry,
        &candidate.field.ty,
        depth,
        config.max_selected_fields,
        config.max_fragments,
    );
    let mut unsupported = Vec::new();
    if let Err(error) = &input_schema {
        unsupported.push(error.to_string());
    }
    if let Err(error) = &output_schema {
        unsupported.push(error.to_string());
    }
    if let Err(error) = &selection {
        unsupported.push(error.to_string());
    }
    if !unsupported.is_empty() && !matches!(availability, OperationAvailability::Hidden) {
        availability = OperationAvailability::Unsupported {
            detail: unsupported.join("; "),
        };
    }

    let default_tool_name = naming::tool_name(&candidate.path);
    let title = override_policy
        .and_then(|value| value.title.clone())
        .unwrap_or_else(|| naming::title(&candidate.path));
    let description = override_policy
        .and_then(|value| value.description.clone())
        .or_else(|| candidate.field.description.clone())
        .unwrap_or_else(|| format!("Call Unraid GraphQL operation {}.", candidate.path));
    OperationSpec {
        path: candidate.path.clone(),
        tool_name: default_tool_name.clone(),
        operation_name: default_tool_name.to_string(),
        title,
        description,
        segments: candidate.segments,
        arguments: candidate.field.arguments,
        return_type: candidate.field.ty,
        input_schema: Arc::new(input_schema.unwrap_or_default()),
        output_schema: Arc::new(output_schema.unwrap_or_default()),
        default_selection: selection.unwrap_or_else(|_| SelectionPlan::default()),
        scope: match candidate.path.kind() {
            OperationKind::Query => RequiredScope::Read,
            OperationKind::Mutation | OperationKind::Subscription => RequiredScope::Admin,
        },
        risk,
        availability,
    }
}

fn unique_tool_name(
    path: &OperationPath,
    candidate: &ToolName,
    used: &mut BTreeSet<ToolName>,
) -> ToolName {
    if used.insert(candidate.clone()) {
        return candidate.clone();
    }
    let digest = Sha256::digest(path.to_string().as_bytes());
    let suffix = &hex::encode(digest)[..8];
    let unique = ToolName::new(format!("{candidate}_{suffix}"))
        .expect("generated collision suffix is identifier-safe");
    used.insert(unique.clone());
    unique
}

fn hash_catalog(
    schema_hash: &str,
    operations: &BTreeMap<OperationPath, Arc<OperationSpec>>,
) -> Result<String, CatalogError> {
    #[derive(Serialize)]
    struct HashInput<'a> {
        schema_hash: &'a str,
        operations: &'a BTreeMap<OperationPath, Arc<OperationSpec>>,
    }
    let bytes = serde_json::to_vec(&HashInput {
        schema_hash,
        operations,
    })
    .map_err(CatalogError::Serialization)?;
    Ok(format!("sha256:{}", hex::encode(Sha256::digest(bytes))))
}

/// Lock-free reader access to the active immutable catalog.
#[derive(Clone)]
pub struct CatalogStore {
    active: Arc<ArcSwap<OperationCatalog>>,
}

impl CatalogStore {
    /// Create a store with the initial catalog.
    pub fn new(initial: OperationCatalog) -> Self {
        Self {
            active: Arc::new(ArcSwap::from_pointee(initial)),
        }
    }

    /// Load one catalog snapshot for the complete request lifetime.
    pub fn load(&self) -> Arc<OperationCatalog> {
        self.active.load_full()
    }

    /// Atomically replace the active catalog.
    pub fn store(&self, next: Arc<OperationCatalog>) {
        self.active.store(next);
    }
}

impl Default for CatalogStore {
    fn default() -> Self {
        Self::new(OperationCatalog::empty())
    }
}

#[cfg(test)]
mod tests {
    use std::{collections::BTreeMap, sync::Arc};

    use chrono::Utc;

    use crate::mcp::dynamic::{
        config::{DynamicMcpConfig, OperationOverride},
        introspection::IntrospectionResponse,
        normalize::normalize_type,
        snapshot::{SchemaRoots, SchemaSnapshot},
        types::TypeName,
    };

    use super::{CatalogStore, OperationCatalog, compile_catalog};

    fn snapshot() -> SchemaSnapshot {
        let mut definitions = BTreeMap::new();
        for raw in [
            include_str!("../../../tests/fixtures/dynamic/minimal-query-types.json"),
            include_str!("../../../tests/fixtures/dynamic/namespace-mutations.json"),
        ] {
            let response: IntrospectionResponse = serde_json::from_str(raw).unwrap();
            for wire in response.data.unwrap().aliases.into_values().flatten() {
                let name = TypeName::new(wire.name.clone().unwrap()).unwrap();
                definitions
                    .entry(name.clone())
                    .or_insert_with(|| normalize_type(name, wire).unwrap());
            }
        }
        SchemaSnapshot::new(
            "https://example.test/graphql",
            Utc::now(),
            SchemaRoots {
                query: TypeName::new("Query").unwrap(),
                mutation: Some(TypeName::new("Mutation").unwrap()),
                subscription: None,
            },
            definitions,
        )
        .unwrap()
    }

    #[test]
    fn dynamic_empty_catalog_is_deterministic() {
        let first = OperationCatalog::empty();
        let second = OperationCatalog::empty();
        assert_eq!(first.format_version, 1);
        assert!(first.by_path.is_empty());
        assert_eq!(first, second);
    }

    #[test]
    fn dynamic_catalog_compiles_queries_and_nested_mutations() {
        let catalog = compile_catalog(&snapshot(), &DynamicMcpConfig::default()).unwrap();
        assert!(
            catalog
                .by_path
                .keys()
                .any(|path| path.to_string() == "query.disk")
        );
        assert!(
            catalog
                .by_path
                .keys()
                .any(|path| path.to_string() == "query.ping")
        );
        assert!(
            catalog
                .by_path
                .keys()
                .any(|path| path.to_string() == "mutation.vm.start")
        );
        assert_eq!(catalog.by_tool_name.len(), 2, "mutations default disabled");
        let mutation = catalog
            .by_path
            .iter()
            .find(|(path, _)| path.to_string() == "mutation.vm.start")
            .unwrap()
            .1;
        assert_eq!(mutation.segments.len(), 2);
        assert!(mutation.requires_elicitation());
        assert_eq!(mutation.input_schema["required"], serde_json::json!(["id"]));
    }

    #[test]
    fn dynamic_catalog_override_enables_nested_mutation() {
        let mut config = DynamicMcpConfig::default();
        config.operations.insert(
            "mutation.vm.start".to_string(),
            OperationOverride {
                enabled: Some(true),
                ..OperationOverride::default()
            },
        );
        let catalog = compile_catalog(&snapshot(), &config).unwrap();
        assert!(
            catalog
                .by_tool_name
                .keys()
                .any(|name| name.as_str() == "unraid_mutation_vm_start")
        );
    }

    #[test]
    fn dynamic_catalog_store_swaps_without_invalidating_loaded_arc() {
        let store = CatalogStore::new(OperationCatalog::empty());
        let old = store.load();
        let mut next = OperationCatalog::empty();
        next.format_version = 2;
        store.store(Arc::new(next));
        assert_eq!(old.format_version, 1);
        assert_eq!(store.load().format_version, 2);
    }
}
