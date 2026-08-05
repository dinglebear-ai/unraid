//! Safe GraphQL document compilation from validated catalog operations.

use serde_json::{Map, Value};

use super::{
    catalog::OperationCatalog,
    config::DynamicMcpConfig,
    models::OperationSpec,
    selection::{render_selection, requested_selection},
    types::{FieldName, OperationKind},
};

/// Fully compiled GraphQL request for one generated tool call.
#[derive(Debug, Clone, PartialEq)]
pub struct CompiledRequest {
    /// GraphQL source document.
    pub document: String,
    /// JSON variables for arguments supplied by the caller.
    pub variables: Map<String, Value>,
    /// Path used to extract the callable leaf from the GraphQL data object.
    pub response_path: Vec<FieldName>,
    /// Catalog hash used to compile the request.
    pub catalog_hash: String,
}

/// Safe document compilation failure.
#[derive(Debug, thiserror::Error)]
pub enum DocumentError {
    #[error("invalid requested selection: {0}")]
    Selection(#[from] super::selection::SelectionError),
    #[error("generated GraphQL document exceeds maximum size {0} bytes")]
    DocumentBytes(usize),
    #[error("generated operation has no GraphQL path segments")]
    EmptyPath,
}

/// Build a GraphQL request without interpolating caller-controlled values.
pub fn compile_request(
    operation: &OperationSpec,
    arguments: &Map<String, Value>,
    catalog: &OperationCatalog,
    config: &DynamicMcpConfig,
) -> Result<CompiledRequest, DocumentError> {
    if operation.segments.is_empty() {
        return Err(DocumentError::EmptyPath);
    }
    let requested = arguments
        .get("select")
        .and_then(Value::as_array)
        .map(|values| {
            values
                .iter()
                .filter_map(Value::as_str)
                .map(ToString::to_string)
                .collect::<Vec<_>>()
        })
        .unwrap_or_default();
    let selection = if requested.is_empty() {
        operation.default_selection.clone()
    } else {
        requested_selection(
            &catalog.registry,
            &operation.return_type,
            &requested,
            config.max_selection_depth,
            config.max_selected_fields,
            config.max_fragments,
        )?
    };

    let supplied = operation
        .arguments
        .iter()
        .filter(|argument| arguments.contains_key(argument.name.as_str()))
        .collect::<Vec<_>>();
    let definitions = supplied
        .iter()
        .map(|argument| format!("${}: {}", argument.name, argument.ty.to_graphql()))
        .collect::<Vec<_>>()
        .join(", ");
    let operation_header = if definitions.is_empty() {
        operation.operation_name.clone()
    } else {
        format!("{}({definitions})", operation.operation_name)
    };
    let leaf_arguments = supplied
        .iter()
        .map(|argument| format!("{}: ${}", argument.name, argument.name))
        .collect::<Vec<_>>()
        .join(", ");
    let leaf_arguments = if leaf_arguments.is_empty() {
        String::new()
    } else {
        format!("({leaf_arguments})")
    };
    let selection_text = render_selection(&selection);
    let body = render_segments(operation, 0, &leaf_arguments, &selection_text);
    let keyword = match operation.kind() {
        OperationKind::Query => "query",
        OperationKind::Mutation => "mutation",
        OperationKind::Subscription => "subscription",
    };
    let document = format!("{keyword} {operation_header} {{ {body} }}");
    if document.len() > config.max_document_bytes {
        return Err(DocumentError::DocumentBytes(config.max_document_bytes));
    }
    let variables = arguments
        .iter()
        .filter(|(name, _)| name.as_str() != "select")
        .map(|(name, value)| (name.clone(), value.clone()))
        .collect();
    Ok(CompiledRequest {
        document,
        variables,
        response_path: operation
            .segments
            .iter()
            .map(|segment| segment.field.clone())
            .collect(),
        catalog_hash: catalog.catalog_hash.clone(),
    })
}

fn render_segments(
    operation: &OperationSpec,
    index: usize,
    leaf_arguments: &str,
    selection: &str,
) -> String {
    let segment = &operation.segments[index];
    let leaf = index + 1 == operation.segments.len();
    if leaf {
        if selection.is_empty() {
            format!("{}{leaf_arguments}", segment.field)
        } else {
            format!("{}{leaf_arguments} {{ {selection} }}", segment.field)
        }
    } else {
        format!(
            "{} {{ {} }}",
            segment.field,
            render_segments(operation, index + 1, leaf_arguments, selection)
        )
    }
}

/// Extract the generated operation's callable leaf from a GraphQL data object.
pub fn extract_response(data: Value, path: &[FieldName]) -> Value {
    let mut current = data;
    for segment in path {
        current = match current {
            Value::Object(mut object) => object.remove(segment.as_str()).unwrap_or(Value::Null),
            _ => Value::Null,
        };
    }
    current
}

#[cfg(test)]
mod tests {
    use std::collections::BTreeMap;

    use chrono::Utc;
    use serde_json::{Map, json};

    use crate::mcp::dynamic::{
        catalog::compile_catalog,
        config::{DynamicMcpConfig, OperationOverride},
        introspection::IntrospectionResponse,
        normalize::normalize_type,
        snapshot::{SchemaRoots, SchemaSnapshot},
        types::TypeName,
    };

    use super::{compile_request, extract_response};

    fn fixture_catalog(
        config: &DynamicMcpConfig,
    ) -> crate::mcp::dynamic::catalog::OperationCatalog {
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
        let snapshot = SchemaSnapshot::new(
            "https://example.test/graphql",
            Utc::now(),
            SchemaRoots {
                query: TypeName::new("Query").unwrap(),
                mutation: Some(TypeName::new("Mutation").unwrap()),
                subscription: None,
            },
            definitions,
        )
        .unwrap();
        compile_catalog(&snapshot, config).unwrap()
    }

    #[test]
    fn dynamic_document_uses_variables_and_validated_selection() {
        let config = DynamicMcpConfig::default();
        let catalog = fixture_catalog(&config);
        let operation = catalog
            .by_path
            .iter()
            .find(|(path, _)| path.to_string() == "query.disk")
            .unwrap()
            .1;
        let request = compile_request(
            operation,
            &Map::from_iter([
                ("id".to_string(), json!("disk-1")),
                ("select".to_string(), json!(["id"])),
            ]),
            &catalog,
            &config,
        )
        .unwrap();
        assert!(request.document.contains("$id: PrefixedID!"));
        assert!(request.document.contains("disk(id: $id) { id }"));
        assert!(!request.document.contains("disk-1"));
        assert_eq!(request.variables["id"], json!("disk-1"));
    }

    #[test]
    fn dynamic_document_renders_nested_mutation_namespace() {
        let mut config = DynamicMcpConfig::default();
        config.operations.insert(
            "mutation.vm.start".to_string(),
            OperationOverride {
                enabled: Some(true),
                ..OperationOverride::default()
            },
        );
        let catalog = fixture_catalog(&config);
        let name = crate::mcp::dynamic::types::ToolName::new("unraid_mutation_vm_start").unwrap();
        let operation = catalog.by_tool_name[&name].clone();
        let request = compile_request(
            &operation,
            &Map::from_iter([("id".to_string(), json!("vm-1"))]),
            &catalog,
            &config,
        )
        .unwrap();
        assert!(
            request
                .document
                .contains("mutation unraid_mutation_vm_start")
        );
        assert!(request.document.contains("vm { start(id: $id) }"));
        assert_eq!(
            extract_response(json!({"vm": {"start": true}}), &request.response_path),
            json!(true)
        );
    }
}
