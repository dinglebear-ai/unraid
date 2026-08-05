//! Validation, request compilation, and upstream execution for generated tools.

use serde_json::{Map, Value, json};

use crate::app::UnraidService;

use super::{
    catalog::OperationCatalog,
    config::DynamicMcpConfig,
    document::{DocumentError, compile_request, extract_response},
    models::OperationSpec,
    validate::{ValidationError, validate_arguments},
};

/// Generated-operation execution failure.
#[derive(Debug, thiserror::Error)]
pub enum ExecutionError {
    /// Caller-supplied arguments failed catalog-aware validation.
    #[error(transparent)]
    Validation(#[from] ValidationError),
    /// A safe GraphQL request could not be compiled.
    #[error(transparent)]
    Document(#[from] DocumentError),
    /// The canonical upstream transport failed.
    #[error("generated Unraid operation failed")]
    Upstream(#[source] anyhow::Error),
}

/// Execute a generated operation after scope and mutation-elicitation gates pass.
pub(crate) async fn execute_dynamic_operation_after_authorization(
    service: &UnraidService,
    catalog: &OperationCatalog,
    operation: &OperationSpec,
    arguments: Map<String, Value>,
    config: &DynamicMcpConfig,
) -> Result<Value, ExecutionError> {
    validate_arguments(&operation.arguments, &arguments, &catalog.registry, config)?;
    let request = compile_request(operation, &arguments, catalog, config)?;
    let data = service
        .execute_graphql_body(json!({
            "query": request.document,
            "variables": request.variables,
        }))
        .await
        .map_err(ExecutionError::Upstream)?;
    Ok(extract_response(data, &request.response_path))
}

#[cfg(test)]
mod tests {
    use std::collections::BTreeMap;

    use chrono::Utc;
    use serde_json::{Map, Value, json};
    use wiremock::{Mock, MockServer, ResponseTemplate, matchers::method};

    use crate::{
        app::UnraidService,
        config::UnraidConfig,
        graphql::UnraidClient,
        mcp::dynamic::{
            catalog::compile_catalog,
            config::DynamicMcpConfig,
            introspection::IntrospectionResponse,
            normalize::normalize_type,
            snapshot::{SchemaRoots, SchemaSnapshot},
            types::TypeName,
        },
    };

    use super::execute_dynamic_operation_after_authorization;

    fn catalog(config: &DynamicMcpConfig) -> crate::mcp::dynamic::catalog::OperationCatalog {
        let response: IntrospectionResponse = serde_json::from_str(include_str!(
            "../../../tests/fixtures/dynamic/minimal-query-types.json"
        ))
        .unwrap();
        let definitions = response
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
            definitions,
        )
        .unwrap();
        compile_catalog(&snapshot, config).unwrap()
    }

    #[tokio::test]
    async fn dynamic_execution_validates_compiles_and_extracts_leaf() {
        let server = MockServer::start().await;
        Mock::given(method("POST"))
            .respond_with(ResponseTemplate::new(200).set_body_json(json!({
                "data": { "disk": { "id": "disk-1" } }
            })))
            .expect(1)
            .mount(&server)
            .await;
        let service = UnraidService::new(
            UnraidClient::new(&UnraidConfig {
                api_url: server.uri(),
                api_key: "test".to_string(),
                skip_tls_verify: false,
            })
            .unwrap(),
        );
        let config = DynamicMcpConfig::default();
        let catalog = catalog(&config);
        let operation = catalog
            .by_path
            .iter()
            .find(|(path, _)| path.to_string() == "query.disk")
            .unwrap()
            .1;
        let value = execute_dynamic_operation_after_authorization(
            &service,
            &catalog,
            operation,
            Map::from_iter([
                ("id".to_string(), json!("disk-1")),
                ("select".to_string(), json!(["id"])),
            ]),
            &config,
        )
        .await
        .unwrap();
        assert_eq!(value, json!({ "id": "disk-1" }));
        let requests = server.received_requests().await.unwrap();
        let body: Value = serde_json::from_slice(&requests[0].body).unwrap();
        assert_eq!(body["variables"]["id"], json!("disk-1"));
        assert!(!body["query"].as_str().unwrap().contains("disk-1"));
    }

    #[tokio::test]
    async fn dynamic_execution_rejects_invalid_args_before_upstream() {
        let server = MockServer::start().await;
        let service = UnraidService::new(
            UnraidClient::new(&UnraidConfig {
                api_url: server.uri(),
                api_key: "test".to_string(),
                skip_tls_verify: false,
            })
            .unwrap(),
        );
        let config = DynamicMcpConfig::default();
        let catalog = catalog(&config);
        let operation = catalog
            .by_path
            .iter()
            .find(|(path, _)| path.to_string() == "query.disk")
            .unwrap()
            .1;
        assert!(
            execute_dynamic_operation_after_authorization(
                &service,
                &catalog,
                operation,
                Map::new(),
                &config,
            )
            .await
            .is_err()
        );
        assert!(server.received_requests().await.unwrap().is_empty());
    }
}
