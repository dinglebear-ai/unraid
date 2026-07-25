//! Integration tests for auth-mode routing behaviour.
//!
//! Uses the real axum router via `tower::ServiceExt::oneshot` — no live server
//! needed. Covers the locked decisions from the OAuth epic:
//!
//! - `/.well-known/oauth-authorization-server` and `/jwks` → 200 only when
//!   `Mounted { auth_state: Some(_) }`; 404 in bearer-only and LoopbackDev.
//! - `POST /register` → 404 in ALL modes.
//! - `GET /auth/login`  → 404 in ALL modes.
//! - `GET /health`      → 200 in ALL modes (always unauthenticated).
//! - `POST /mcp` without credentials → 401 when Mounted, 200 when LoopbackDev.
//! - `tools/list` with AuthContext present + no scope → 200 (discovery does
//!   not require a specific scope, only an AuthContext).

use axum::{
    body::to_bytes,
    http::{header, Request, StatusCode},
};
use tempfile::TempDir;
use tower::util::ServiceExt;
use unraid_rmcp::{mcp::router, testing};

// ── shared helpers ────────────────────────────────────────────────────────────

fn jsonrpc_body(method: &str) -> Vec<u8> {
    serde_json::to_vec(&serde_json::json!({
        "jsonrpc": "2.0",
        "id": 1,
        "method": method,
    }))
    .unwrap()
}

async fn get_status(app: axum::Router, uri: &str) -> StatusCode {
    let req = Request::builder()
        .method("GET")
        .uri(uri)
        .body(axum::body::Body::empty())
        .unwrap();
    app.oneshot(req).await.unwrap().status()
}

async fn post_mcp(
    app: axum::Router,
    body: Vec<u8>,
    token: Option<&str>,
) -> (StatusCode, serde_json::Value) {
    let mut b = Request::builder()
        .method("POST")
        .uri("/mcp")
        .header(header::HOST, "localhost:3100")
        .header(header::CONTENT_TYPE, "application/json")
        .header(header::ACCEPT, "application/json, text/event-stream");
    if let Some(t) = token {
        b = b.header("Authorization", format!("Bearer {t}"));
    }
    let resp = app
        .oneshot(b.body(axum::body::Body::from(body)).unwrap())
        .await
        .unwrap();
    let status = resp.status();
    let bytes = to_bytes(resp.into_body(), usize::MAX).await.unwrap();
    let json: serde_json::Value = serde_json::from_slice(&bytes).unwrap_or(serde_json::Value::Null);
    (status, json)
}

// ── discovery endpoints ───────────────────────────────────────────────────────

/// `/.well-known/oauth-authorization-server` → 200 when OAuth mounted.
#[tokio::test]
async fn well_known_returns_200_when_oauth_mounted() {
    let dir = TempDir::new().unwrap();
    let state = testing::oauth_state(dir.path()).await;
    assert_eq!(
        get_status(router(state), "/.well-known/oauth-authorization-server").await,
        StatusCode::OK,
        "OAuth discovery endpoint must be 200 when auth_state is Some"
    );
}

/// `/.well-known/oauth-authorization-server` → 404 in bearer-only mode.
#[tokio::test]
async fn well_known_returns_404_when_bearer_only() {
    let state = testing::bearer_state("test-token");
    assert_eq!(
        get_status(router(state), "/.well-known/oauth-authorization-server").await,
        StatusCode::NOT_FOUND,
        "OAuth discovery endpoint must be 404 in bearer-only mode"
    );
}

/// `/.well-known/oauth-authorization-server` → 404 when LoopbackDev.
#[tokio::test]
async fn well_known_returns_404_when_loopback_dev() {
    let state = testing::loopback_state();
    assert_eq!(
        get_status(router(state), "/.well-known/oauth-authorization-server").await,
        StatusCode::NOT_FOUND,
        "OAuth discovery endpoint must be 404 in LoopbackDev mode"
    );
}

/// `/jwks` → 200 when OAuth mounted.
#[tokio::test]
async fn jwks_returns_200_when_oauth_mounted() {
    let dir = TempDir::new().unwrap();
    let state = testing::oauth_state(dir.path()).await;
    assert_eq!(
        get_status(router(state), "/jwks").await,
        StatusCode::OK,
        "/jwks must be 200 when OAuth mounted"
    );
}

/// `/jwks` → 404 when bearer-only.
#[tokio::test]
async fn jwks_returns_404_when_bearer_only() {
    let state = testing::bearer_state("test-token");
    assert_eq!(
        get_status(router(state), "/jwks").await,
        StatusCode::NOT_FOUND,
        "/jwks must be 404 in bearer-only mode"
    );
}

/// `/jwks` → 404 when LoopbackDev.
#[tokio::test]
async fn jwks_returns_404_when_loopback_dev() {
    let state = testing::loopback_state();
    assert_eq!(
        get_status(router(state), "/jwks").await,
        StatusCode::NOT_FOUND,
        "/jwks must be 404 in LoopbackDev mode"
    );
}

// ── /register and /auth/login are excluded in ALL modes ──────────────────────

/// `POST /register` → 404 in ALL three modes.
/// Locked Decision: `/register` is excluded from `bearer_only_router`.
#[tokio::test]
async fn register_returns_404_in_all_modes() {
    let d3 = TempDir::new().unwrap();
    let loopback = testing::loopback_state();
    let bearer = testing::bearer_state("tok");
    let oauth = testing::oauth_state(d3.path()).await;

    for (label, state) in [
        ("LoopbackDev", loopback),
        ("bearer-only", bearer),
        ("OAuth", oauth),
    ] {
        let req = Request::builder()
            .method("POST")
            .uri("/register")
            .header(header::CONTENT_TYPE, "application/json")
            .body(axum::body::Body::from(r#"{"redirect_uris":[]}"#))
            .unwrap();
        let status = router(state).oneshot(req).await.unwrap().status();
        assert_eq!(
            status,
            StatusCode::NOT_FOUND,
            "POST /register must not be mounted in {label} mode (Locked Decision)"
        );
    }
}

/// `GET /auth/login` → 404 when OAuth is NOT active (no OAuth router mounted).
/// When OAuth IS active we use lab_auth::routes::router() (not bearer_only_router)
/// so that DCR /register is available; this means /auth/login is also mounted then.
#[tokio::test]
async fn auth_login_returns_404_without_oauth() {
    let loopback = testing::loopback_state();
    let bearer = testing::bearer_state("tok");

    for (label, state) in [("LoopbackDev", loopback), ("bearer-only", bearer)] {
        let status = get_status(router(state), "/auth/login").await;
        assert_eq!(
            status,
            StatusCode::NOT_FOUND,
            "GET /auth/login must not be mounted in {label} mode"
        );
    }
}

// ── /health is always unauthenticated ────────────────────────────────────────

/// `/health` → 200 in ALL modes without credentials.
#[tokio::test]
async fn health_returns_200_in_all_modes() {
    let d3 = TempDir::new().unwrap();
    let loopback = testing::loopback_state();
    let bearer = testing::bearer_state("tok");
    let oauth = testing::oauth_state(d3.path()).await;

    for (label, state) in [
        ("LoopbackDev", loopback),
        ("bearer-only", bearer),
        ("OAuth", oauth),
    ] {
        let status = get_status(router(state), "/health").await;
        assert_eq!(
            status,
            StatusCode::OK,
            "/health must be 200 in {label} mode (always unauthenticated)"
        );
    }
}

// ── /mcp credential enforcement ──────────────────────────────────────────────

/// `POST /mcp` without credentials → 401 when Mounted (bearer-only).
#[tokio::test]
async fn mcp_without_credentials_returns_401_when_mounted() {
    let state = testing::bearer_state("secret-token");
    let (status, _) = post_mcp(router(state), jsonrpc_body("tools/list"), None).await;
    assert_eq!(
        status,
        StatusCode::UNAUTHORIZED,
        "/mcp must return 401 when credentials absent and policy is Mounted"
    );
}

/// `POST /mcp` without credentials → 200 when LoopbackDev (no auth applied).
#[tokio::test]
async fn mcp_without_credentials_succeeds_when_loopback_dev() {
    let state = testing::loopback_state();
    let (status, value) = post_mcp(router(state), jsonrpc_body("tools/list"), None).await;
    assert_eq!(
        status,
        StatusCode::OK,
        "/mcp must return 200 in LoopbackDev mode without credentials"
    );
    let tools = value["result"]["tools"].as_array();
    assert!(
        tools.is_some_and(|t| !t.is_empty()),
        "tools/list should return the unraid tool in LoopbackDev mode"
    );
}

// ── tools/list does not require a scope, only an AuthContext ─────────────────

/// `tools/list` with valid bearer token (AuthContext present) → 200.
/// The server must NOT gate `tools/list` on any specific scope.
#[tokio::test]
async fn tools_list_succeeds_with_auth_context() {
    let state = testing::bearer_state("discover-token");
    let (status, value) = post_mcp(
        router(state),
        jsonrpc_body("tools/list"),
        Some("discover-token"),
    )
    .await;
    assert_eq!(
        status,
        StatusCode::OK,
        "tools/list must succeed when AuthContext is present"
    );
    let tools = value["result"]["tools"].as_array();
    assert!(
        tools.is_some_and(|t| t.iter().any(|tool| tool["name"] == "unraid")),
        "tools/list must return the unraid tool"
    );
}

// ── oauth-protected-resource discovery ───────────────────────────────────────

/// `/.well-known/oauth-protected-resource` → 200 when OAuth mounted.
/// This companion endpoint is required by RFC 9728 and some MCP clients.
#[tokio::test]
async fn protected_resource_returns_200_when_oauth_mounted() {
    let dir = TempDir::new().unwrap();
    let state = testing::oauth_state(dir.path()).await;
    assert_eq!(
        get_status(router(state), "/.well-known/oauth-protected-resource").await,
        StatusCode::OK,
        "/.well-known/oauth-protected-resource must be 200 when auth_state is Some"
    );
}

/// `/.well-known/oauth-protected-resource` → 404 in bearer-only mode.
#[tokio::test]
async fn protected_resource_returns_404_when_bearer_only() {
    let state = testing::bearer_state("test-token");
    assert_eq!(
        get_status(router(state), "/.well-known/oauth-protected-resource").await,
        StatusCode::NOT_FOUND,
        "/.well-known/oauth-protected-resource must be 404 in bearer-only mode"
    );
}

// ── discovery response body validation ───────────────────────────────────────

/// `/.well-known/oauth-authorization-server` response body must include
/// `issuer`, `authorization_endpoint`, `token_endpoint`, and `jwks_uri`.
#[tokio::test]
async fn well_known_response_body_has_required_fields() {
    let dir = TempDir::new().unwrap();
    let state = testing::oauth_state(dir.path()).await;
    let req = Request::builder()
        .method("GET")
        .uri("/.well-known/oauth-authorization-server")
        .body(axum::body::Body::empty())
        .unwrap();
    let resp = router(state).oneshot(req).await.unwrap();
    assert_eq!(resp.status(), StatusCode::OK);
    let bytes = to_bytes(resp.into_body(), usize::MAX).await.unwrap();
    let body: serde_json::Value =
        serde_json::from_slice(&bytes).expect("discovery body must be valid JSON");
    for field in &[
        "issuer",
        "authorization_endpoint",
        "token_endpoint",
        "jwks_uri",
    ] {
        assert!(
            body[field].is_string(),
            "/.well-known/oauth-authorization-server must contain field '{field}'; got: {body}"
        );
    }
}

/// `/jwks` response body must contain a non-empty `keys` array.
#[tokio::test]
async fn jwks_response_body_has_keys_array() {
    let dir = TempDir::new().unwrap();
    let state = testing::oauth_state(dir.path()).await;
    let req = Request::builder()
        .method("GET")
        .uri("/jwks")
        .body(axum::body::Body::empty())
        .unwrap();
    let resp = router(state).oneshot(req).await.unwrap();
    assert_eq!(resp.status(), StatusCode::OK);
    let bytes = to_bytes(resp.into_body(), usize::MAX).await.unwrap();
    let body: serde_json::Value =
        serde_json::from_slice(&bytes).expect("JWKS body must be valid JSON");
    let keys = body["keys"]
        .as_array()
        .expect("JWKS must have a 'keys' array");
    assert!(!keys.is_empty(), "JWKS 'keys' array must be non-empty");
}
