//! JWT-level OAuth flow integration tests.
//!
//! These tests exercise the full auth middleware stack using real RS256 JWTs
//! issued by lab-auth's [`SigningKeys`]. No Google credentials are needed —
//! the RSA key is generated fresh in a temp directory for each test.

use axum::{
    body::to_bytes,
    http::{header, Request, StatusCode},
};
use lab_auth::jwt::AccessClaims;
use lab_auth::metadata::canonical_resource_url;
use tempfile::TempDir;
use tower::util::ServiceExt;
use unraid_rmcp::{mcp::router, testing};

// ── helpers ───────────────────────────────────────────────────────────────────

fn now_unix() -> usize {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs() as usize
}

fn make_claims(
    auth_state: &lab_auth::state::AuthState,
    scope: &str,
    exp_offset_secs: i64,
) -> AccessClaims {
    let iss = auth_state
        .config
        .public_url
        .as_ref()
        .unwrap()
        .as_str()
        .trim_end_matches('/')
        .to_string();
    let aud = canonical_resource_url(auth_state);
    let now = now_unix() as i64;
    AccessClaims {
        iss,
        sub: "user@example.com".to_string(),
        aud,
        exp: (now + exp_offset_secs) as usize,
        iat: now as usize,
        jti: "test-jti".to_string(),
        scope: scope.to_string(),
        azp: String::new(),
    }
}

async fn post_mcp(
    app: axum::Router,
    method: &str,
    params: Option<serde_json::Value>,
    token: &str,
) -> (StatusCode, serde_json::Value) {
    let mut body = serde_json::json!({ "jsonrpc": "2.0", "id": 1, "method": method });
    if let Some(p) = params {
        body.as_object_mut().unwrap().insert("params".into(), p);
    }
    let req = Request::builder()
        .method("POST")
        .uri("/mcp")
        .header(header::HOST, "localhost:3100")
        .header(header::CONTENT_TYPE, "application/json")
        .header(header::ACCEPT, "application/json, text/event-stream")
        .header("Authorization", format!("Bearer {token}"))
        .body(axum::body::Body::from(serde_json::to_vec(&body).unwrap()))
        .unwrap();
    let resp = app.oneshot(req).await.unwrap();
    let status = resp.status();
    let bytes = to_bytes(resp.into_body(), usize::MAX).await.unwrap();
    let json: serde_json::Value = serde_json::from_slice(&bytes).unwrap_or(serde_json::Value::Null);
    (status, json)
}

fn status_call() -> serde_json::Value {
    serde_json::json!({ "name": "unraid", "arguments": { "action": "status" } })
}

// ── tests ─────────────────────────────────────────────────────────────────────

/// Valid JWT with `unraid:read` -> `tools/call action=status` succeeds (200).
#[tokio::test]
async fn valid_jwt_with_read_scope_allows_status() {
    let dir = TempDir::new().unwrap();
    let (state, auth_state) = testing::oauth_state_with_auth_state(dir.path()).await;
    let token = auth_state
        .signing_keys
        .issue_access_token(&make_claims(&auth_state, "unraid:read", 60))
        .unwrap();

    let (status, value) = post_mcp(router(state), "tools/call", Some(status_call()), &token).await;
    assert_eq!(
        status,
        StatusCode::OK,
        "valid JWT with unraid:read should succeed"
    );
    assert!(
        value["result"]["content"][0]["text"]
            .as_str()
            .unwrap_or("")
            .contains("\"status\""),
        "status response should contain status field; got: {value}"
    );
}

/// `unraid:admin` implicitly satisfies `unraid:read` — status must succeed.
#[tokio::test]
async fn valid_jwt_with_admin_scope_satisfies_read() {
    let dir = TempDir::new().unwrap();
    let (state, auth_state) = testing::oauth_state_with_auth_state(dir.path()).await;
    let token = auth_state
        .signing_keys
        .issue_access_token(&make_claims(&auth_state, "unraid:admin", 60))
        .unwrap();

    let (status, _) = post_mcp(router(state), "tools/call", Some(status_call()), &token).await;
    assert_eq!(
        status,
        StatusCode::OK,
        "unraid:admin must implicitly satisfy unraid:read"
    );
}

/// Expired JWT (`exp` well in the past) → 401.
/// Uses -120s offset to exceed jsonwebtoken's default 60s leeway.
#[tokio::test]
async fn expired_jwt_returns_401() {
    let dir = TempDir::new().unwrap();
    let (state, auth_state) = testing::oauth_state_with_auth_state(dir.path()).await;
    let token = auth_state
        .signing_keys
        .issue_access_token(&make_claims(&auth_state, "unraid:read", -120))
        .unwrap();

    let (status, _) = post_mcp(router(state), "tools/call", Some(status_call()), &token).await;
    assert_eq!(
        status,
        StatusCode::UNAUTHORIZED,
        "expired JWT must be rejected with 401"
    );
}

/// JWT with wrong issuer → 401.
#[tokio::test]
async fn jwt_with_wrong_issuer_returns_401() {
    let dir = TempDir::new().unwrap();
    let (state, auth_state) = testing::oauth_state_with_auth_state(dir.path()).await;
    let mut bad_claims = make_claims(&auth_state, "unraid:read", 60);
    bad_claims.iss = "https://attacker.example.com".to_string();
    let token = auth_state
        .signing_keys
        .issue_access_token(&bad_claims)
        .unwrap();

    let (status, _) = post_mcp(router(state), "tools/call", Some(status_call()), &token).await;
    assert_eq!(
        status,
        StatusCode::UNAUTHORIZED,
        "JWT with wrong issuer must be rejected with 401"
    );
}

/// JWT with empty scope → MCP-level scope error (HTTP 200, JSON-RPC error body).
/// The auth middleware passes (JWT is valid) but tool dispatch fails the scope check.
#[tokio::test]
async fn jwt_with_empty_scope_is_denied_at_scope_check() {
    let dir = TempDir::new().unwrap();
    let (state, auth_state) = testing::oauth_state_with_auth_state(dir.path()).await;
    let token = auth_state
        .signing_keys
        .issue_access_token(&make_claims(&auth_state, "", 60))
        .unwrap();

    let (status, value) = post_mcp(router(state), "tools/call", Some(status_call()), &token).await;
    // HTTP 200 — auth passed. MCP layer returns a JSON-RPC error.
    assert_eq!(
        status,
        StatusCode::OK,
        "scope denial must be HTTP 200 with MCP-level error, not HTTP 401"
    );
    assert!(
        value["error"].is_object(),
        "empty-scope JWT should produce a JSON-RPC error; got: {value}"
    );
    let msg = value["error"]["message"].as_str().unwrap_or("");
    assert!(
        msg.contains("forbidden") || msg.contains("scope"),
        "error message should mention 'forbidden' or 'scope'; got: {msg}"
    );
}

/// `tools/list` with valid JWT -> 200 and unraid tool present.
/// Tool discovery does not require any specific scope — only an AuthContext.
#[tokio::test]
async fn tools_list_succeeds_with_valid_jwt() {
    let dir = TempDir::new().unwrap();
    let (state, auth_state) = testing::oauth_state_with_auth_state(dir.path()).await;
    let token = auth_state
        .signing_keys
        .issue_access_token(&make_claims(&auth_state, "unraid:read", 60))
        .unwrap();

    let (status, value) = post_mcp(router(state), "tools/list", None, &token).await;
    assert_eq!(
        status,
        StatusCode::OK,
        "tools/list must succeed with valid JWT"
    );
    let tools = value["result"]["tools"].as_array();
    assert!(
        tools.is_some_and(|t| t.iter().any(|tool| tool["name"] == "unraid")),
        "tools/list must return the unraid tool"
    );
}

/// JWT signed with a *different* RSA key must be rejected (signature verification).
///
/// This is the canonical test for the cryptographic layer: if `jsonwebtoken`'s
/// `Validation` ever loses signature checking (e.g., `validate_signature` set
/// to false), all other tests would still pass because they use the server's
/// own key. Only this test catches that regression.
#[tokio::test]
async fn jwt_signed_with_wrong_key_returns_401() {
    let dir = TempDir::new().unwrap();
    let (state, auth_state) = testing::oauth_state_with_auth_state(dir.path()).await;

    // Build a *second* AuthState with a different RSA key pair under a
    // separate TempDir — same config, different key material.
    let dir2 = TempDir::new().unwrap();
    let (_, auth_state2) = testing::oauth_state_with_auth_state(dir2.path()).await;
    let claims = make_claims(&auth_state, "unraid:read", 60); // valid iss/aud for server
    let token = auth_state2
        .signing_keys
        .issue_access_token(&claims) // signed with wrong key
        .unwrap();

    let (status, _) = post_mcp(router(state), "tools/call", Some(status_call()), &token).await;
    assert_eq!(
        status,
        StatusCode::UNAUTHORIZED,
        "JWT signed with a different RSA key must be rejected with 401"
    );
}

/// JWT with wrong `aud` claim → 401.
///
/// Audience confusion: a valid token issued for a different resource server
/// (e.g., `"https://attacker.example.com/mcp"`) must not be accepted.
#[tokio::test]
async fn jwt_with_wrong_audience_returns_401() {
    let dir = TempDir::new().unwrap();
    let (state, auth_state) = testing::oauth_state_with_auth_state(dir.path()).await;
    let mut bad_claims = make_claims(&auth_state, "unraid:read", 60);
    bad_claims.aud = "https://other-service.example.com/mcp".to_string();
    let token = auth_state
        .signing_keys
        .issue_access_token(&bad_claims)
        .unwrap();

    let (status, _) = post_mcp(router(state), "tools/call", Some(status_call()), &token).await;
    assert_eq!(
        status,
        StatusCode::UNAUTHORIZED,
        "JWT with wrong audience must be rejected with 401 (audience confusion)"
    );
}
