//! Upstream-interaction tests against a mocked GraphQL endpoint (wiremock 0.6).
//!
//! Covers three review items:
//!   A. P0-1 — GraphQL injection FIX verification: caller-controlled values
//!      travel as GraphQL `variables`, never interpolated into the query text.
//!   B. P2-8 / Test L1 — malformed / error upstream responses are handled
//!      gracefully and raw upstream bodies are never relayed to the caller.
//!   C. Test L3 — `Counters` survives concurrent increments with no lost updates.

use serde_json::{json, Value};
use unraid_rmcp::observability::Counters;
use unraid_rmcp::testing::{execute_tool, state_with_upstream};
use wiremock::matchers::method;
use wiremock::{Mock, MockServer, ResponseTemplate};

/// Parse the single request body the mock server received as JSON.
async fn first_request_body(server: &MockServer) -> Value {
    let requests = server
        .received_requests()
        .await
        .expect("request recording should be enabled");
    assert_eq!(requests.len(), 1, "expected exactly one upstream request");
    serde_json::from_slice(&requests[0].body).expect("request body should be valid JSON")
}

// ─── A. Injection-fix verification (proves P0-1) ────────────────────────────

#[tokio::test]
async fn log_file_path_travels_as_variable_not_interpolated() {
    let server = MockServer::start().await;
    // Minimal valid `logFile` response (shape from graphql.rs::log_file).
    Mock::given(method("POST"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({
            "data": { "logFile": { "path": "x", "content": "", "totalLines": 0, "startLine": 0 } }
        })))
        .mount(&server)
        .await;

    let state = state_with_upstream(&server.uri());

    // Classic GraphQL-injection payload: tries to break out of the string and
    // inject an extra field + comment out the rest.
    let malicious = "/var/log/x\") { injected } #";
    let result = execute_tool(
        &state,
        "unraid",
        json!({ "action": "log_file", "path": malicious }),
    )
    .await;
    assert!(result.is_ok(), "log_file should succeed: {result:?}");

    let body = first_request_body(&server).await;

    // 1. The malicious value is carried verbatim as a GraphQL variable.
    assert_eq!(
        body["variables"]["path"],
        json!(malicious),
        "path must be sent as a GraphQL variable, exactly as supplied"
    );

    // 2. The query text must NOT contain the injected payload — proving the
    //    value was bound as a variable, not spliced into the query string.
    let query = body["query"].as_str().expect("query must be a string");
    assert!(
        !query.contains("injected"),
        "query text must not contain injected substring: {query}"
    );
    assert!(
        !query.contains("\") {"),
        "query text must not contain the raw injection break-out: {query}"
    );
    // The query should still reference the parameterized variable declaration.
    assert!(
        query.contains("$path"),
        "query should use the $path variable: {query}"
    );
}

#[tokio::test]
async fn docker_logs_id_travels_as_variable_not_interpolated() {
    let server = MockServer::start().await;
    // Minimal valid `docker.logs` response (cynic DockerContainerLogs shape).
    Mock::given(method("POST"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({
            "data": { "docker": { "logs": { "containerId": "x", "lines": [], "cursor": null } } }
        })))
        .mount(&server)
        .await;

    let state = state_with_upstream(&server.uri());

    // Container id containing a quote — would break a naively interpolated query.
    let malicious_id = "abc\") { injected } #";
    let result = execute_tool(
        &state,
        "unraid",
        json!({ "action": "docker_logs", "id": malicious_id }),
    )
    .await;
    assert!(result.is_ok(), "docker_logs should succeed: {result:?}");

    let body = first_request_body(&server).await;

    assert_eq!(
        body["variables"]["id"],
        json!(malicious_id),
        "id must be sent as a GraphQL variable, exactly as supplied"
    );

    let query = body["query"].as_str().expect("query must be a string");
    assert!(
        !query.contains("injected"),
        "query text must not contain injected substring: {query}"
    );
    assert!(
        !query.contains("\") {"),
        "query text must not contain the raw injection break-out: {query}"
    );
    assert!(
        query.contains("$id"),
        "query should use the $id variable: {query}"
    );
}

// ─── B. Malformed / error responses don't leak raw bodies ───────────────────

#[tokio::test]
async fn http_500_body_is_not_relayed_to_caller() {
    let server = MockServer::start().await;
    Mock::given(method("POST"))
        .respond_with(
            ResponseTemplate::new(500)
                .set_body_string("internal explosion: SECRET_UPSTREAM_DETAIL token=hunter2"),
        )
        .mount(&server)
        .await;

    let state = state_with_upstream(&server.uri());
    let result = execute_tool(&state, "unraid", json!({ "action": "array" })).await;

    let err = result.expect_err("HTTP 500 should surface as an error");
    assert!(
        !err.contains("SECRET_UPSTREAM_DETAIL"),
        "raw upstream body must not be relayed to the caller: {err}"
    );
    assert!(
        !err.contains("hunter2"),
        "raw upstream body must not be relayed to the caller: {err}"
    );
}

#[tokio::test]
async fn graphql_errors_array_is_not_relayed_to_caller() {
    let server = MockServer::start().await;
    Mock::given(method("POST"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({
            "errors": [{ "message": "boom SECRET_GQL field 'array' not found" }]
        })))
        .mount(&server)
        .await;

    let state = state_with_upstream(&server.uri());
    let result = execute_tool(&state, "unraid", json!({ "action": "array" })).await;

    let err = result.expect_err("GraphQL errors should surface as an error");
    assert!(
        !err.contains("SECRET_GQL"),
        "GraphQL error detail must not be relayed to the caller: {err}"
    );
}

#[tokio::test]
async fn missing_data_field_is_handled_gracefully() {
    let server = MockServer::start().await;
    Mock::given(method("POST"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({})))
        .mount(&server)
        .await;

    let state = state_with_upstream(&server.uri());
    // No panic, just a clean Err for a response missing the `data` field.
    let result = execute_tool(&state, "unraid", json!({ "action": "array" })).await;
    assert!(
        result.is_err(),
        "response missing 'data' should be an error, got: {result:?}"
    );
}

// ─── C. Counters concurrency (Test L3) ──────────────────────────────────────

#[tokio::test]
async fn counters_survive_concurrent_increments() {
    let c = Counters::new();
    const N: u64 = 100;

    let mut handles = Vec::new();
    for _ in 0..N {
        let c = c.clone();
        handles.push(tokio::spawn(async move {
            c.inc_upstream();
            c.inc_requests();
        }));
    }
    for h in handles {
        h.await.expect("task should not panic");
    }

    let snap = c.snapshot();
    assert_eq!(
        snap.upstream_calls, N,
        "every concurrent inc_upstream must be counted (no lost updates)"
    );
    assert_eq!(
        snap.requests_total, N,
        "every concurrent inc_requests must be counted (no lost updates)"
    );
}
