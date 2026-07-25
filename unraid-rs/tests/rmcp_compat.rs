use axum::{
    body::{to_bytes, Body},
    http::{header, Request, StatusCode},
    Router,
};
use rmcp::{
    transport::streamable_http_server::{
        session::local::LocalSessionManager, StreamableHttpServerConfig, StreamableHttpService,
    },
    ServerHandler,
};
use tower::util::ServiceExt;

const INIT_BODY: &str = r#"{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"rmcp-compat","version":"1.0"}}}"#;
const ACCEPT_STREAMABLE_HTTP: &str = "application/json, text/event-stream";

#[derive(Clone)]
struct CompatServer;

impl ServerHandler for CompatServer {}

fn compat_router(config: StreamableHttpServerConfig) -> Router {
    let service: StreamableHttpService<CompatServer, LocalSessionManager> =
        StreamableHttpService::new(|| Ok(CompatServer), Default::default(), config);
    Router::new().nest_service("/mcp", service)
}

async fn post_initialize(router: Router) -> (StatusCode, axum::http::HeaderMap, String) {
    let request = Request::builder()
        .method("POST")
        .uri("/mcp")
        .header(header::HOST, "localhost")
        .header(header::CONTENT_TYPE, "application/json")
        .header(header::ACCEPT, ACCEPT_STREAMABLE_HTTP)
        .body(Body::from(INIT_BODY))
        .unwrap();

    assert_eq!(
        request
            .headers()
            .get(header::CONTENT_TYPE)
            .and_then(|value| value.to_str().ok()),
        Some("application/json")
    );
    assert_eq!(
        request
            .headers()
            .get(header::ACCEPT)
            .and_then(|value| value.to_str().ok()),
        Some(ACCEPT_STREAMABLE_HTTP)
    );

    let response = router.oneshot(request).await.unwrap();
    let status = response.status();
    let headers = response.headers().clone();
    let body = String::from_utf8(
        to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap()
            .to_vec(),
    )
    .unwrap();
    (status, headers, body)
}

#[tokio::test]
async fn rmcp_stateless_json_response_returns_application_json() {
    let config = StreamableHttpServerConfig::default()
        .with_stateful_mode(false)
        .with_json_response(true)
        .with_sse_keep_alive(None);

    let (status, headers, body) = post_initialize(compat_router(config)).await;

    assert_eq!(status, StatusCode::OK);
    let content_type = headers
        .get(header::CONTENT_TYPE)
        .and_then(|value| value.to_str().ok())
        .unwrap_or_default();
    assert!(
        content_type.contains("application/json"),
        "expected application/json, got {content_type:?}; body: {body}"
    );

    let parsed: serde_json::Value = serde_json::from_str(&body).unwrap();
    assert_eq!(parsed["jsonrpc"], "2.0");
    assert_eq!(parsed["id"], 1);
    assert!(parsed["result"].is_object(), "body: {body}");
}

#[tokio::test]
async fn rmcp_stateless_sse_mode_is_distinct_from_json_response_target() {
    let config = StreamableHttpServerConfig::default()
        .with_stateful_mode(false)
        .with_sse_keep_alive(None);

    let (status, headers, body) = post_initialize(compat_router(config)).await;

    assert_eq!(status, StatusCode::OK);
    let content_type = headers
        .get(header::CONTENT_TYPE)
        .and_then(|value| value.to_str().ok())
        .unwrap_or_default();
    assert!(
        content_type.contains("text/event-stream"),
        "expected text/event-stream, got {content_type:?}; body: {body}"
    );
    assert!(
        body.contains("data:"),
        "expected SSE framing in stateless non-json mode, got: {body}"
    );
}

#[tokio::test]
async fn rmcp_stateful_mode_keeps_sse_even_when_json_response_is_enabled() {
    let config = StreamableHttpServerConfig::default()
        .with_json_response(true)
        .with_sse_keep_alive(None);

    let (status, headers, body) = post_initialize(compat_router(config)).await;

    assert_eq!(status, StatusCode::OK);
    let content_type = headers
        .get(header::CONTENT_TYPE)
        .and_then(|value| value.to_str().ok())
        .unwrap_or_default();
    assert!(
        content_type.contains("text/event-stream"),
        "expected stateful mode to use SSE, got {content_type:?}; body: {body}"
    );
}
