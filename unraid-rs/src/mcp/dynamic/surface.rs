//! Projection of compiled operations onto the MCP tool surface.

use std::{borrow::Cow, sync::Arc};

use rmcp::model::{Tool, ToolAnnotations};

use super::{catalog::OperationCatalog, models::OperationSpec, types::OperationKind};

/// Render every available operation in deterministic tool-name order.
pub fn render_tools(catalog: &OperationCatalog) -> Vec<Tool> {
    catalog
        .by_tool_name
        .values()
        .map(|operation| render_tool(operation))
        .collect()
}

/// Render one compiled operation as a standards-compliant MCP tool.
pub fn render_tool(operation: &OperationSpec) -> Tool {
    let query = matches!(operation.kind(), OperationKind::Query);
    Tool::new_with_raw(
        Cow::Owned(operation.tool_name.to_string()),
        Some(Cow::Owned(operation.description.clone())),
        Arc::new((*operation.input_schema).clone()),
    )
    .with_title(operation.title.clone())
    .with_raw_output_schema(Arc::new((*operation.output_schema).clone()))
    .with_annotations(ToolAnnotations::from_raw(
        Some(operation.title.clone()),
        Some(query),
        Some(!query && operation.risk.destructive),
        query.then_some(true),
        Some(false),
    ))
}

#[cfg(test)]
mod tests {
    use std::collections::BTreeMap;

    use chrono::Utc;

    use crate::mcp::dynamic::{
        catalog::compile_catalog,
        config::DynamicMcpConfig,
        introspection::IntrospectionResponse,
        normalize::normalize_type,
        snapshot::{SchemaRoots, SchemaSnapshot},
        types::TypeName,
    };

    use super::render_tools;

    #[test]
    fn dynamic_surface_renders_available_queries_in_sorted_order() {
        let response: IntrospectionResponse = serde_json::from_str(include_str!(
            "../../../tests/fixtures/dynamic/minimal-query-types.json"
        ))
        .unwrap();
        let types = response
            .data
            .unwrap()
            .aliases
            .into_values()
            .flatten()
            .map(|wire| {
                let name = TypeName::new(wire.name.clone().unwrap()).unwrap();
                (name.clone(), normalize_type(name, wire).unwrap())
            })
            .collect::<BTreeMap<_, _>>();
        let snapshot = SchemaSnapshot::new(
            "https://example.test/graphql",
            Utc::now(),
            SchemaRoots {
                query: TypeName::new("Query").unwrap(),
                mutation: None,
                subscription: None,
            },
            types,
        )
        .unwrap();
        let catalog = compile_catalog(&snapshot, &DynamicMcpConfig::default()).unwrap();
        let tools = render_tools(&catalog);
        assert_eq!(tools.len(), 2);
        assert_eq!(tools[0].name, "unraid_query_disk");
        assert_eq!(tools[1].name, "unraid_query_ping");
        assert_eq!(
            tools[0].annotations.as_ref().unwrap().read_only_hint,
            Some(true)
        );
        assert!(tools[0].output_schema.is_some());
    }
}
