//! Production-safe targeted GraphQL type discovery.

use std::{
    collections::{BTreeMap, BTreeSet},
    time::Duration,
};

use chrono::Utc;
use serde_json::json;

use crate::graphql::UnraidClient;

use super::{
    config::DynamicMcpConfig,
    introspection::{
        DiscoveryError, IntrospectionData, IntrospectionType, TypeBatchRequest, build_type_batch,
    },
    normalize::normalize_type,
    schema::TypeDefinition,
    snapshot::{SchemaRoots, SchemaSnapshot},
    types::TypeName,
};

#[derive(Debug)]
struct FetchedBatch {
    types: Vec<(TypeName, IntrospectionType)>,
    response_bytes: usize,
}

/// Fetch and validate one deterministic targeted introspection batch.
pub(crate) async fn fetch_type_batch(
    client: &UnraidClient,
    names: &[TypeName],
) -> Result<Vec<(TypeName, IntrospectionType)>, DiscoveryError> {
    Ok(
        fetch_batch(client, names, Duration::from_secs(30), usize::MAX, false)
            .await?
            .types,
    )
}

/// Crawl every type reachable from configured operation roots.
pub async fn crawl_schema(
    client: &UnraidClient,
    config: &DynamicMcpConfig,
) -> Result<SchemaSnapshot, DiscoveryError> {
    let query = parse_root(&config.root_types.query, "query")?;
    let mutation = parse_root(&config.root_types.mutation, "mutation")?;
    let subscription = parse_root(&config.root_types.subscription, "subscription")?;

    let mut pending = BTreeSet::from([query.clone(), mutation.clone()]);
    let mut visited = BTreeMap::<TypeName, TypeDefinition>::new();
    let mut batches = 0usize;
    let mut discovered_subscription = None;

    reserve_batch(&mut batches, config.max_introspection_batches)?;
    let optional = fetch_batch(
        client,
        std::slice::from_ref(&subscription),
        config.introspection_timeout,
        config.max_introspection_response_bytes,
        true,
    )
    .await?;
    if let Some((name, wire)) = optional.types.into_iter().next() {
        let definition = normalize_type(name.clone(), wire)?;
        insert_definition(
            &mut visited,
            &mut pending,
            definition,
            config.max_discovered_types,
        )?;
        discovered_subscription = Some(name);
    }

    while !pending.is_empty() {
        reserve_batch(&mut batches, config.max_introspection_batches)?;
        let batch = take_batch(&mut pending, config.introspection_batch_size);
        let fetched = fetch_batch(
            client,
            &batch,
            config.introspection_timeout,
            config.max_introspection_response_bytes,
            false,
        )
        .await?;
        debug_assert!(fetched.response_bytes <= config.max_introspection_response_bytes);
        for (name, wire) in fetched.types {
            let definition = normalize_type(name, wire)?;
            insert_definition(
                &mut visited,
                &mut pending,
                definition,
                config.max_discovered_types,
            )?;
        }
    }

    for required in [&query, &mutation] {
        if !visited.contains_key(required) {
            return Err(DiscoveryError::InvalidResponse(format!(
                "required root type {required} was not discovered"
            )));
        }
    }

    let endpoint = client.raw_client().1;
    SchemaSnapshot::new(
        endpoint,
        Utc::now(),
        SchemaRoots {
            query,
            mutation: Some(mutation),
            subscription: discovered_subscription,
        },
        visited,
    )
    .map_err(DiscoveryError::from)
}

fn parse_root(value: &str, kind: &str) -> Result<TypeName, DiscoveryError> {
    TypeName::new(value).map_err(|error| {
        DiscoveryError::InvalidDefinition(format!("invalid configured {kind} root: {error}"))
    })
}

fn reserve_batch(current: &mut usize, maximum: usize) -> Result<(), DiscoveryError> {
    let observed = current.saturating_add(1);
    if observed > maximum {
        return Err(DiscoveryError::LimitExceeded {
            limit: "max_introspection_batches",
            observed,
        });
    }
    *current = observed;
    Ok(())
}

fn take_batch(pending: &mut BTreeSet<TypeName>, size: usize) -> Vec<TypeName> {
    let mut batch = Vec::with_capacity(size.min(pending.len()));
    while batch.len() < size {
        let Some(name) = pending.pop_first() else {
            break;
        };
        batch.push(name);
    }
    batch
}

fn insert_definition(
    visited: &mut BTreeMap<TypeName, TypeDefinition>,
    pending: &mut BTreeSet<TypeName>,
    definition: TypeDefinition,
    maximum: usize,
) -> Result<(), DiscoveryError> {
    let name = definition.name().clone();
    if let Some(existing) = visited.get(&name) {
        if existing != &definition {
            return Err(DiscoveryError::InvalidDefinition(format!(
                "conflicting duplicate definition for {name}"
            )));
        }
        return Ok(());
    }
    let observed = visited.len().saturating_add(1);
    if observed > maximum {
        return Err(DiscoveryError::LimitExceeded {
            limit: "max_discovered_types",
            observed,
        });
    }
    for referenced in definition.referenced_types() {
        if !referenced.as_str().starts_with("__") && !visited.contains_key(&referenced) {
            pending.insert(referenced);
        }
    }
    pending.remove(&name);
    visited.insert(name, definition);
    Ok(())
}

async fn fetch_batch(
    client: &UnraidClient,
    names: &[TypeName],
    request_timeout: Duration,
    max_response_bytes: usize,
    allow_null: bool,
) -> Result<FetchedBatch, DiscoveryError> {
    let request = build_type_batch(names)?;
    let body = json!({
        "query": request.document,
        "variables": request.variables,
    });
    let data = tokio::time::timeout(request_timeout, client.execute_graphql_body(body))
        .await
        .map_err(|_| DiscoveryError::Timeout)?
        .map_err(DiscoveryError::Upstream)?;
    let response_bytes = serde_json::to_vec(&data)
        .map_err(|error| DiscoveryError::InvalidResponse(error.to_string()))?
        .len();
    if response_bytes > max_response_bytes {
        return Err(DiscoveryError::LimitExceeded {
            limit: "max_introspection_response_bytes",
            observed: response_bytes,
        });
    }
    let response: IntrospectionData = serde_json::from_value(data).map_err(|error| {
        DiscoveryError::InvalidResponse(format!("data object does not match alias schema: {error}"))
    })?;
    let types = validate_aliases(response, request, allow_null)?;
    Ok(FetchedBatch {
        types,
        response_bytes,
    })
}

fn validate_aliases(
    response: IntrospectionData,
    request: TypeBatchRequest,
    allow_null: bool,
) -> Result<Vec<(TypeName, IntrospectionType)>, DiscoveryError> {
    if response.aliases.len() != request.aliases.len() {
        return Err(DiscoveryError::InvalidResponse(format!(
            "expected {} aliases, received {}",
            request.aliases.len(),
            response.aliases.len()
        )));
    }
    let mut complete = Vec::with_capacity(request.aliases.len());
    for (alias, requested_name) in request.aliases {
        let discovered = response.aliases.get(&alias).ok_or_else(|| {
            DiscoveryError::InvalidResponse(format!(
                "missing alias {alias} for requested type {requested_name}"
            ))
        })?;
        let Some(discovered) = discovered.as_ref() else {
            if allow_null {
                continue;
            }
            return Err(DiscoveryError::InvalidResponse(format!(
                "alias {alias} returned null for requested type {requested_name}"
            )));
        };
        validate_returned_name(&alias, &requested_name, discovered)?;
        complete.push((requested_name, discovered.clone()));
    }
    Ok(complete)
}

fn validate_returned_name(
    alias: &str,
    requested_name: &TypeName,
    discovered: &IntrospectionType,
) -> Result<(), DiscoveryError> {
    let returned_name = discovered.name.as_deref().ok_or_else(|| {
        DiscoveryError::InvalidResponse(format!(
            "alias {alias} returned unnamed type for requested type {requested_name}"
        ))
    })?;
    if returned_name != requested_name.as_str() {
        return Err(DiscoveryError::InvalidResponse(format!(
            "alias {alias} requested type {requested_name} but returned {returned_name}"
        )));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use std::collections::BTreeMap;

    use serde_json::{Value, json};
    use wiremock::{Mock, MockServer, Request, Respond, ResponseTemplate, matchers::method};

    use crate::{config::UnraidConfig, graphql::UnraidClient};

    use super::{crawl_schema, fetch_type_batch};
    use crate::mcp::dynamic::{config::DynamicMcpConfig, types::TypeName};

    fn client(server: &MockServer) -> UnraidClient {
        UnraidClient::new(&UnraidConfig {
            api_url: server.uri(),
            api_key: "test-key".to_string(),
            skip_tls_verify: false,
        })
        .expect("test client")
    }

    #[derive(Clone)]
    struct FixtureResponder {
        by_name: BTreeMap<String, Value>,
    }

    impl FixtureResponder {
        fn new() -> Self {
            let mut by_name = BTreeMap::new();
            for raw in [
                include_str!("../../../tests/fixtures/dynamic/minimal-query-types.json"),
                include_str!("../../../tests/fixtures/dynamic/namespace-mutations.json"),
            ] {
                let response: Value = serde_json::from_str(raw).unwrap();
                for value in response["data"].as_object().unwrap().values() {
                    let name = value["name"].as_str().unwrap().to_string();
                    by_name.entry(name).or_insert_with(|| value.clone());
                }
            }
            Self { by_name }
        }
    }

    impl Respond for FixtureResponder {
        fn respond(&self, request: &Request) -> ResponseTemplate {
            let body: Value = serde_json::from_slice(&request.body).unwrap();
            let variables = body["variables"].as_object().unwrap();
            let mut data = serde_json::Map::new();
            for index in 0..variables.len() {
                let name = variables[&format!("n{index}")].as_str().unwrap();
                data.insert(
                    format!("t{index}"),
                    self.by_name.get(name).cloned().unwrap_or(Value::Null),
                );
            }
            ResponseTemplate::new(200).set_body_json(json!({ "data": data }))
        }
    }

    async fn fixture_server() -> MockServer {
        let server = MockServer::start().await;
        Mock::given(method("POST"))
            .respond_with(FixtureResponder::new())
            .mount(&server)
            .await;
        server
    }

    fn crawl_config() -> DynamicMcpConfig {
        DynamicMcpConfig {
            introspection_batch_size: 2,
            max_introspection_batches: 20,
            max_discovered_types: 20,
            max_introspection_response_bytes: 1024 * 1024,
            introspection_timeout: std::time::Duration::from_secs(5),
            ..DynamicMcpConfig::default()
        }
    }

    #[tokio::test]
    async fn dynamic_fetch_type_batch_maps_aliases_to_requested_names() {
        let server = MockServer::start().await;
        Mock::given(method("POST"))
            .respond_with(ResponseTemplate::new(200).set_body_json(json!({
                "data": {
                    "t0": {
                        "kind": "OBJECT",
                        "name": "Mutation",
                        "description": null,
                        "specifiedByURL": null,
                        "fields": [],
                        "inputFields": null,
                        "interfaces": [],
                        "enumValues": null,
                        "possibleTypes": null
                    },
                    "t1": {
                        "kind": "OBJECT",
                        "name": "VmMutations",
                        "description": null,
                        "specifiedByURL": null,
                        "fields": [],
                        "inputFields": null,
                        "interfaces": [],
                        "enumValues": null,
                        "possibleTypes": null
                    }
                }
            })))
            .expect(1)
            .mount(&server)
            .await;

        let result = fetch_type_batch(
            &client(&server),
            &[
                TypeName::new("VmMutations").unwrap(),
                TypeName::new("Mutation").unwrap(),
            ],
        )
        .await
        .expect("valid batch response");

        assert_eq!(result.len(), 2);
        assert_eq!(result[0].0.as_str(), "Mutation");
        assert_eq!(result[0].1.name.as_deref(), Some("Mutation"));
        assert_eq!(result[1].0.as_str(), "VmMutations");
    }

    #[tokio::test]
    async fn dynamic_fetch_type_batch_rejects_mismatched_type_without_partial_result() {
        let server = MockServer::start().await;
        Mock::given(method("POST"))
            .respond_with(ResponseTemplate::new(200).set_body_json(json!({
                "data": {
                    "t0": {
                        "kind": "OBJECT",
                        "name": "Query",
                        "description": null,
                        "specifiedByURL": null,
                        "fields": [],
                        "inputFields": null,
                        "interfaces": [],
                        "enumValues": null,
                        "possibleTypes": null
                    }
                }
            })))
            .mount(&server)
            .await;

        let error = fetch_type_batch(&client(&server), &[TypeName::new("Mutation").unwrap()])
            .await
            .expect_err("mismatched type must fail the whole batch");
        assert!(error.to_string().contains("Mutation"));
        assert!(error.to_string().contains("Query"));
    }

    #[tokio::test]
    async fn dynamic_fetch_type_batch_maps_graphql_errors_to_discovery_error() {
        let server = MockServer::start().await;
        Mock::given(method("POST"))
            .respond_with(ResponseTemplate::new(200).set_body_json(json!({
                "errors": [{
                    "message": "GraphQL introspection is not allowed",
                    "extensions": { "code": "INTROSPECTION_DISABLED" }
                }]
            })))
            .mount(&server)
            .await;

        let error = fetch_type_batch(&client(&server), &[TypeName::new("Mutation").unwrap()])
            .await
            .expect_err("GraphQL error must fail the batch");
        assert!(error.to_string().contains("upstream"));
        assert!(!error.to_string().contains("INTROSPECTION_DISABLED"));
    }

    #[tokio::test]
    async fn dynamic_crawl_schema_fetches_each_reachable_type_once() {
        let server = fixture_server().await;
        let snapshot = crawl_schema(&client(&server), &crawl_config())
            .await
            .expect("fixture crawl must succeed");

        assert_eq!(snapshot.types.len(), 6);
        assert_eq!(snapshot.roots.query.as_str(), "Query");
        assert_eq!(
            snapshot.roots.mutation.as_ref().unwrap().as_str(),
            "Mutation"
        );
        assert!(snapshot.roots.subscription.is_none());
        assert!(snapshot.schema_hash.starts_with("sha256:"));

        let requests = server.received_requests().await.unwrap();
        let mut counts = BTreeMap::<String, usize>::new();
        for request in requests {
            let body: Value = serde_json::from_slice(&request.body).unwrap();
            for name in body["variables"].as_object().unwrap().values() {
                *counts
                    .entry(name.as_str().unwrap().to_string())
                    .or_default() += 1;
            }
        }
        for name in [
            "Subscription",
            "Query",
            "Mutation",
            "Disk",
            "VmMutations",
            "Boolean",
            "PrefixedID",
        ] {
            assert_eq!(
                counts.get(name),
                Some(&1),
                "unexpected fetch count for {name}"
            );
        }
    }

    #[tokio::test]
    async fn dynamic_crawl_schema_enforces_type_limit_without_snapshot() {
        let server = fixture_server().await;
        let mut config = crawl_config();
        config.max_discovered_types = 3;
        let error = crawl_schema(&client(&server), &config)
            .await
            .expect_err("small type limit must fail");
        assert!(error.to_string().contains("max_discovered_types"));
    }

    #[tokio::test]
    async fn dynamic_crawl_schema_enforces_batch_limit() {
        let server = fixture_server().await;
        let mut config = crawl_config();
        config.max_introspection_batches = 1;
        let error = crawl_schema(&client(&server), &config)
            .await
            .expect_err("small batch limit must fail");
        assert!(error.to_string().contains("max_introspection_batches"));
    }

    #[tokio::test]
    async fn dynamic_crawl_schema_enforces_response_size_limit() {
        let server = fixture_server().await;
        let mut config = crawl_config();
        config.max_introspection_response_bytes = 2;
        let error = crawl_schema(&client(&server), &config)
            .await
            .expect_err("small response limit must fail");
        assert!(
            error
                .to_string()
                .contains("max_introspection_response_bytes")
        );
    }
}
