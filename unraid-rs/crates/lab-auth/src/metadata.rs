use axum::{Json, extract::State};

use crate::state::AuthState;
use crate::types::{AuthorizationServerMetadata, ProtectedResourceMetadata};

pub async fn authorization_server_metadata(
    State(state): State<AuthState>,
) -> Json<AuthorizationServerMetadata> {
    let base = public_base_url(&state);
    Json(AuthorizationServerMetadata {
        issuer: base.clone(),
        authorization_endpoint: format!("{base}/authorize"),
        token_endpoint: format!("{base}/token"),
        registration_endpoint: format!("{base}/register"),
        jwks_uri: format!("{base}/jwks"),
        response_types_supported: vec!["code".to_string()],
        grant_types_supported: vec![
            "authorization_code".to_string(),
            "refresh_token".to_string(),
        ],
        code_challenge_methods_supported: vec!["S256".to_string()],
        token_endpoint_auth_methods_supported: vec!["none".to_string()],
    })
}

pub async fn protected_resource_metadata(
    State(state): State<AuthState>,
) -> Json<ProtectedResourceMetadata> {
    let base = public_base_url(&state);
    Json(ProtectedResourceMetadata {
        resource: canonical_resource_url(&state),
        authorization_servers: vec![base],
        scopes_supported: state.config.scopes_supported.clone(),
        bearer_methods_supported: vec!["header".to_string()],
    })
}

pub async fn jwks(State(state): State<AuthState>) -> Json<crate::jwt::JwksDocument> {
    Json(state.signing_keys.jwks().clone())
}

pub(crate) fn public_base_url(state: &AuthState) -> String {
    // Panicking on absent public_url is intentional: this is a programmer/operator
    // error (misconfigured server). Callers are not expected to handle a missing URL.
    #[allow(clippy::expect_used)]
    state
        .config
        .public_url
        .as_ref()
        .expect("oauth state must have public_url configured")
        .as_str()
        .trim_end_matches('/')
        .to_string()
}

pub fn canonical_resource_url(state: &AuthState) -> String {
    let base = public_base_url(state);
    let suffix = state.config.resource_path.trim_start_matches('/');
    if suffix.is_empty() {
        base
    } else {
        format!("{base}/{suffix}")
    }
}

#[cfg(test)]
mod tests {
    use axum::body::Body;
    use axum::http::{Request, StatusCode};
    use tower::util::ServiceExt;

    use crate::routes::router;

    use super::super::authorize::tests::test_auth_state;

    #[tokio::test]
    async fn authorization_server_metadata_exposes_lab_endpoints() {
        let app = router(test_auth_state().await);
        let response = app
            .oneshot(
                Request::builder()
                    .uri("/.well-known/oauth-authorization-server")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);
        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let json: serde_json::Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json["token_endpoint"], "https://lab.example.com/token");
    }

    #[tokio::test]
    async fn protected_resource_metadata_uses_canonical_mcp_resource_uri() {
        let app = router(test_auth_state().await);
        let response = app
            .oneshot(
                Request::builder()
                    .uri("/.well-known/oauth-protected-resource")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);
        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let json: serde_json::Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json["resource"], "https://lab.example.com/mcp");
    }

    #[tokio::test]
    async fn protected_resource_metadata_advertises_configured_scopes_and_resource_path() {
        use crate::authorize::tests::test_auth_state_with_config;
        use crate::config::AuthConfig;

        // Synthesize a config that overrides scopes_supported and resource_path,
        // matching how syslog-mcp will eventually configure lab-auth.
        let dir = tempfile::tempdir().unwrap();
        let config = AuthConfig {
            mode: crate::config::AuthMode::OAuth,
            public_url: Some(url::Url::parse("https://syslog.example.com").unwrap()),
            sqlite_path: dir.path().join("auth.db"),
            key_path: dir.path().join("auth.pem"),
            admin_email: "admin@example.com".into(),
            google: crate::config::GoogleConfig {
                client_id: "id".into(),
                client_secret: "secret".into(),
                callback_path: "/auth/google/callback".into(),
                scopes: vec!["openid".into(), "email".into()],
            },
            scopes_supported: vec!["syslog:read".to_string(), "syslog:admin".to_string()],
            resource_path: "/syslog/mcp".to_string(),
            ..AuthConfig::default()
        };
        let state = test_auth_state_with_config(config).await;
        let app = router(state);

        let response = app
            .oneshot(
                Request::builder()
                    .uri("/.well-known/oauth-protected-resource")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let json: serde_json::Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json["resource"], "https://syslog.example.com/syslog/mcp");
        assert_eq!(
            json["scopes_supported"],
            serde_json::json!(["syslog:read", "syslog:admin"])
        );
    }
}
