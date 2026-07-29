use axum::extract::{Form, State};
use axum::{
    Json,
    http::{HeaderValue, header},
    response::{IntoResponse, Response},
};
use base64::Engine;
use base64::engine::general_purpose::URL_SAFE_NO_PAD;
use sha2::{Digest, Sha256};
use subtle::ConstantTimeEq;
use tracing::{info, warn};

use crate::error::AuthError;
use crate::jwt::AccessClaims;
use crate::state::AuthState;
use crate::types::AuthorizationCodeRow;
use crate::types::{RefreshTokenRow, TokenRequest, TokenResponse};
use crate::util::{
    duration_secs_usize, expires_at, fingerprint, now_unix, random_token, timestamp_usize,
};

pub async fn token(
    State(state): State<AuthState>,
    Form(request): Form<TokenRequest>,
) -> Result<impl IntoResponse, AuthError> {
    info!(
        grant_type = %request.grant_type,
        client_id = request.client_id.as_deref().unwrap_or("<missing>"),
        "oauth token request received"
    );
    let response = match request.grant_type.as_str() {
        "authorization_code" => authorization_code_grant(state, request)
            .await
            .map(|response| TokenResponseWithCache(Json(response))),
        "refresh_token" => refresh_token_grant(state, request)
            .await
            .map(|response| TokenResponseWithCache(Json(response))),
        other => {
            warn!(grant_type = %other, "oauth token rejected: unsupported grant type");
            Err(AuthError::Validation(format!(
                "unsupported grant_type `{other}`"
            )))
        }
    };

    match response {
        Ok(response) => Ok(response),
        Err(error) => Err(error),
    }
}

struct TokenResponseWithCache(Json<TokenResponse>);

impl IntoResponse for TokenResponseWithCache {
    fn into_response(self) -> Response {
        apply_token_cache_headers(self.0.into_response())
    }
}

fn apply_token_cache_headers(mut response: Response) -> Response {
    response
        .headers_mut()
        .insert(header::CACHE_CONTROL, HeaderValue::from_static("no-store"));
    response
        .headers_mut()
        .insert(header::PRAGMA, HeaderValue::from_static("no-cache"));
    response
}

async fn authorization_code_grant(
    state: AuthState,
    request: TokenRequest,
) -> Result<TokenResponse, AuthError> {
    crate::authorize::validate_resource(&state, request.resource.as_deref())?;
    let code = require_field(request.code, "code")?;
    let client_id = require_field(request.client_id, "client_id")?;
    let redirect_uri = require_field(request.redirect_uri, "redirect_uri")?;
    let code_verifier = require_field(request.code_verifier, "code_verifier")?;
    let auth_code_id = fingerprint(&code);
    info!(
        grant_type = "authorization_code",
        client_id = %client_id,
        auth_code_id = %auth_code_id,
        redirect_uri = %redirect_uri,
        "oauth authorization_code grant redeeming local code"
    );

    let row = state.store.redeem_auth_code(&code).await.map_err(|error| {
        warn!(
            auth_code_id = %auth_code_id,
            client_id = %client_id,
            error = %error,
            "oauth token rejected: authorization code is invalid, expired, or already redeemed"
        );
        error
    })?;
    validate_authorization_code_row(
        &row,
        &client_id,
        &redirect_uri,
        &code_verifier,
        &auth_code_id,
    )?;

    let refresh_token = if let Some(provider_refresh_token) = row.provider_refresh_token {
        let refresh_token = random_token(24)?;
        let created_at = now_unix();
        state
            .store
            .upsert_refresh_token(RefreshTokenRow {
                refresh_token: refresh_token.clone(),
                client_id: row.client_id.clone(),
                subject: row.subject.clone(),
                scope: row.scope.clone(),
                provider_refresh_token: Some(provider_refresh_token),
                created_at,
                expires_at: expires_at(
                    created_at,
                    state.config.refresh_token_ttl,
                    "LAB_AUTH_REFRESH_TOKEN_TTL_SECS",
                )?,
            })
            .await?;
        info!(
            grant_type = "authorization_code",
            client_id = %row.client_id,
            auth_code_id = %auth_code_id,
            subject_id = %fingerprint(&row.subject),
            scope = %row.scope,
            "oauth authorization_code grant issued lab access token and refresh token"
        );
        Some(refresh_token)
    } else {
        info!(
            grant_type = "authorization_code",
            client_id = %row.client_id,
            auth_code_id = %auth_code_id,
            subject_id = %fingerprint(&row.subject),
            scope = %row.scope,
            "oauth authorization_code grant issued lab access token without refresh token"
        );
        None
    };

    build_token_response(&state, row.client_id, row.subject, row.scope, refresh_token)
}

async fn refresh_token_grant(
    state: AuthState,
    request: TokenRequest,
) -> Result<TokenResponse, AuthError> {
    crate::authorize::validate_resource(&state, request.resource.as_deref())?;
    let client_id = require_field(request.client_id, "client_id")?;
    let refresh_token = require_field(request.refresh_token, "refresh_token")?;
    let refresh_token_id = fingerprint(&refresh_token);
    info!(
        grant_type = "refresh_token",
        client_id = %client_id,
        refresh_token_id = %refresh_token_id,
        "oauth refresh_token grant received"
    );
    let stored = state
        .store
        .find_refresh_token(&refresh_token)
        .await?
        .ok_or_else(|| {
            warn!(
                refresh_token_id = %refresh_token_id,
                client_id = %client_id,
                "oauth token rejected: unknown or expired refresh token"
            );
            AuthError::InvalidGrant("unknown refresh_token".to_string())
        })?;
    if stored.client_id != client_id {
        warn!(
            refresh_token_id = %refresh_token_id,
            requested_client_id = %client_id,
            stored_client_id = %stored.client_id,
            "oauth token rejected: client_id does not match refresh token"
        );
        return Err(AuthError::InvalidGrant(
            "client_id does not match the refresh token".to_string(),
        ));
    }

    let Some(provider_refresh_token) = stored.provider_refresh_token.clone() else {
        warn!(
            refresh_token_id = %refresh_token_id,
            client_id = %stored.client_id,
            "oauth token rejected: refresh token is not backed by an upstream refresh token"
        );
        return Err(AuthError::InvalidGrant(
            "refresh token is not backed by an upstream refresh token".to_string(),
        ));
    };
    let google = state.google.refresh(&provider_refresh_token).await?;

    state
        .store
        .upsert_refresh_token(RefreshTokenRow {
            refresh_token: refresh_token.clone(),
            client_id: stored.client_id.clone(),
            subject: google.subject.clone(),
            scope: stored.scope.clone(),
            provider_refresh_token: google.refresh_token.or(Some(provider_refresh_token)),
            created_at: stored.created_at,
            expires_at: expires_at(
                now_unix(),
                state.config.refresh_token_ttl,
                "LAB_AUTH_REFRESH_TOKEN_TTL_SECS",
            )?,
        })
        .await?;
    info!(
        grant_type = "refresh_token",
        client_id = %stored.client_id,
        refresh_token_id = %refresh_token_id,
        subject_id = %fingerprint(&google.subject),
        scope = %stored.scope,
        "oauth refresh_token grant issued new lab access token"
    );

    build_token_response(
        &state,
        stored.client_id,
        google.subject,
        stored.scope,
        Some(refresh_token),
    )
}

fn build_token_response(
    state: &AuthState,
    client_id: String,
    subject: String,
    scope: String,
    refresh_token: Option<String>,
) -> Result<TokenResponse, AuthError> {
    let issuer = crate::metadata::public_base_url(state);
    let resource = crate::metadata::canonical_resource_url(state);
    let now = timestamp_usize(now_unix(), "current unix timestamp")?;
    let access_token_ttl = duration_secs_usize(
        state.config.access_token_ttl,
        "LAB_AUTH_ACCESS_TOKEN_TTL_SECS",
    )?;
    let access_token = state.signing_keys.issue_access_token(&AccessClaims {
        iss: issuer,
        sub: subject,
        aud: resource,
        exp: now.checked_add(access_token_ttl).ok_or_else(|| {
            AuthError::Config("LAB_AUTH_ACCESS_TOKEN_TTL_SECS exceeds supported range".to_string())
        })?,
        iat: now,
        jti: random_token(18)?,
        scope: scope.clone(),
        azp: client_id,
    })?;
    Ok(TokenResponse {
        access_token,
        token_type: "Bearer".to_string(),
        expires_in: state.config.access_token_ttl.as_secs(),
        refresh_token,
        scope,
    })
}

fn require_field(value: Option<String>, field: &str) -> Result<String, AuthError> {
    value.ok_or_else(|| AuthError::Validation(format!("missing `{field}` parameter")))
}

fn pkce_challenge(code_verifier: &str) -> String {
    URL_SAFE_NO_PAD.encode(Sha256::digest(code_verifier.as_bytes()))
}

fn validate_authorization_code_row(
    row: &AuthorizationCodeRow,
    client_id: &str,
    redirect_uri: &str,
    code_verifier: &str,
    auth_code_id: &str,
) -> Result<(), AuthError> {
    if row.client_id != client_id {
        warn!(
            auth_code_id = %auth_code_id,
            requested_client_id = %client_id,
            stored_client_id = %row.client_id,
            "oauth token rejected: client_id does not match authorization code"
        );
        return Err(AuthError::InvalidGrant(
            "client_id does not match the authorization code".to_string(),
        ));
    }
    if row.redirect_uri != redirect_uri {
        warn!(
            auth_code_id = %auth_code_id,
            requested_redirect_uri = %redirect_uri,
            stored_redirect_uri = %row.redirect_uri,
            "oauth token rejected: redirect_uri does not match authorization code"
        );
        return Err(AuthError::InvalidGrant(
            "redirect_uri does not match the authorization code".to_string(),
        ));
    }
    if row.code_challenge_method != "S256" {
        warn!(
            auth_code_id = %auth_code_id,
            code_challenge_method = %row.code_challenge_method,
            "oauth token rejected: unsupported PKCE method on authorization code"
        );
        return Err(AuthError::InvalidGrant(
            "authorization code uses an unsupported PKCE method".to_string(),
        ));
    }
    if !bool::from(
        pkce_challenge(code_verifier)
            .as_bytes()
            .ct_eq(row.code_challenge.as_bytes()),
    ) {
        warn!(
            auth_code_id = %auth_code_id,
            client_id = %row.client_id,
            "oauth token rejected: code_verifier did not match authorization code"
        );
        return Err(AuthError::InvalidGrant(
            "code_verifier does not match the authorization code".to_string(),
        ));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use axum::body::Body;
    use axum::http::{Request, StatusCode, header};
    use jsonwebtoken::dangerous::insecure_decode;
    use tower::util::ServiceExt;

    use crate::routes::router;

    use super::super::authorize::tests::test_auth_state_with_mock_google;
    use super::super::authorize::tests::test_auth_state_with_registered_client;

    #[tokio::test]
    async fn token_endpoint_mints_lab_jwt_and_refresh_token() {
        let state = test_auth_state_with_registered_client().await;
        seed_authorization_code(&state).await;
        let app = router(state);
        let response = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/token")
                    .header(
                        header::CONTENT_TYPE,
                        "application/x-www-form-urlencoded",
                    )
                    .body(Body::from("grant_type=authorization_code&code=lab-code&client_id=client&redirect_uri=http://127.0.0.1:7777/callback&code_verifier=verifier"))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);
        assert_eq!(
            response
                .headers()
                .get(header::CACHE_CONTROL)
                .and_then(|value| value.to_str().ok()),
            Some("no-store")
        );
        assert_eq!(
            response
                .headers()
                .get(header::PRAGMA)
                .and_then(|value| value.to_str().ok()),
            Some("no-cache")
        );
        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let json: serde_json::Value = serde_json::from_slice(&body).unwrap();
        assert!(json["access_token"].is_string());
        assert!(json["refresh_token"].is_string());
        let access_token = json["access_token"].as_str().expect("access token string");
        let claims = insecure_decode::<crate::jwt::AccessClaims>(access_token)
            .expect("decode access token")
            .claims;
        assert_eq!(claims.aud, "https://lab.example.com/mcp");
    }

    #[tokio::test]
    async fn token_endpoint_omits_refresh_token_without_upstream_refresh_capability() {
        let state = test_auth_state_with_registered_client().await;
        seed_authorization_code_without_provider_refresh(&state).await;
        let app = router(state);
        let response = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/token")
                    .header(
                        header::CONTENT_TYPE,
                        "application/x-www-form-urlencoded",
                    )
                    .body(Body::from("grant_type=authorization_code&code=lab-code&client_id=client&redirect_uri=http://127.0.0.1:7777/callback&code_verifier=verifier"))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);
        assert_eq!(
            response
                .headers()
                .get(header::CACHE_CONTROL)
                .and_then(|value| value.to_str().ok()),
            Some("no-store")
        );
        assert_eq!(
            response
                .headers()
                .get(header::PRAGMA)
                .and_then(|value| value.to_str().ok()),
            Some("no-cache")
        );
        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let json: serde_json::Value = serde_json::from_slice(&body).unwrap();
        assert!(json["access_token"].is_string());
        assert!(json.get("refresh_token").is_none());
    }

    #[tokio::test]
    async fn token_endpoint_redeems_authorization_code_once() {
        let state = test_auth_state_with_registered_client().await;
        seed_authorization_code(&state).await;
        let app = router(state);
        let (a, b) = tokio::join!(
            app.clone().oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/token")
                    .header(
                        header::CONTENT_TYPE,
                        "application/x-www-form-urlencoded",
                    )
                    .body(Body::from("grant_type=authorization_code&code=lab-code&client_id=client&redirect_uri=http://127.0.0.1:7777/callback&code_verifier=verifier"))
                    .unwrap()
            ),
            app.oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/token")
                    .header(
                        header::CONTENT_TYPE,
                        "application/x-www-form-urlencoded",
                    )
                    .body(Body::from("grant_type=authorization_code&code=lab-code&client_id=client&redirect_uri=http://127.0.0.1:7777/callback&code_verifier=verifier"))
                    .unwrap()
            )
        );
        let a = a.unwrap();
        let b = b.unwrap();
        assert!(a.status() == StatusCode::OK || b.status() == StatusCode::OK);
        assert!(a.status() == StatusCode::BAD_REQUEST || b.status() == StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn token_endpoint_rejects_expired_authorization_code() {
        let state = test_auth_state_with_registered_client().await;
        seed_authorization_code_with_expiry(&state, crate::util::now_unix() - 1).await;
        let app = router(state);
        let response = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/token")
                    .header(
                        header::CONTENT_TYPE,
                        "application/x-www-form-urlencoded",
                    )
                    .body(Body::from("grant_type=authorization_code&code=lab-code&client_id=client&redirect_uri=http://127.0.0.1:7777/callback&code_verifier=verifier"))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
        assert_eq!(
            response
                .headers()
                .get(header::CACHE_CONTROL)
                .and_then(|value| value.to_str().ok()),
            Some("no-store")
        );
        assert_eq!(
            response
                .headers()
                .get(header::PRAGMA)
                .and_then(|value| value.to_str().ok()),
            Some("no-cache")
        );
    }

    #[tokio::test]
    async fn token_endpoint_refresh_grant_sets_cache_headers() {
        let state = test_auth_state_with_mock_google().await;
        state
            .store
            .upsert_refresh_token(crate::types::RefreshTokenRow {
                refresh_token: "refresh-token".to_string(),
                client_id: "client".to_string(),
                subject: "google-subject-123".to_string(),
                scope: "lab".to_string(),
                provider_refresh_token: Some("provider-refresh".to_string()),
                created_at: crate::util::now_unix() - 60,
                expires_at: crate::util::now_unix() + 3600,
            })
            .await
            .unwrap();
        let app = router(state);
        let response = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/token")
                    .header(header::CONTENT_TYPE, "application/x-www-form-urlencoded")
                    .body(Body::from(
                        "grant_type=refresh_token&refresh_token=refresh-token&client_id=client",
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);
        assert_eq!(
            response
                .headers()
                .get(header::CACHE_CONTROL)
                .and_then(|value| value.to_str().ok()),
            Some("no-store")
        );
        assert_eq!(
            response
                .headers()
                .get(header::PRAGMA)
                .and_then(|value| value.to_str().ok()),
            Some("no-cache")
        );
    }

    #[tokio::test]
    async fn token_endpoint_rejects_mismatched_resource_parameter() {
        let state = test_auth_state_with_registered_client().await;
        seed_authorization_code(&state).await;
        let app = router(state);
        let response = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/token")
                    .header(
                        header::CONTENT_TYPE,
                        "application/x-www-form-urlencoded",
                    )
                    .body(Body::from("grant_type=authorization_code&code=lab-code&client_id=client&resource=https%3A%2F%2Fother.example.com%2Fmcp&redirect_uri=http://127.0.0.1:7777/callback&code_verifier=verifier"))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::UNPROCESSABLE_ENTITY);
    }

    #[tokio::test]
    async fn token_endpoint_rejects_expired_refresh_token() {
        let state = test_auth_state_with_registered_client().await;
        state
            .store
            .upsert_refresh_token(crate::types::RefreshTokenRow {
                refresh_token: "refresh-token".to_string(),
                client_id: "client".to_string(),
                subject: "google-subject-123".to_string(),
                scope: "lab".to_string(),
                provider_refresh_token: Some("provider-refresh".to_string()),
                created_at: crate::util::now_unix() - 3600,
                expires_at: crate::util::now_unix() - 1,
            })
            .await
            .unwrap();
        let app = router(state);
        let response = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/token")
                    .header(header::CONTENT_TYPE, "application/x-www-form-urlencoded")
                    .body(Body::from(
                        "grant_type=refresh_token&refresh_token=refresh-token&client_id=client",
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
        assert_eq!(
            response
                .headers()
                .get(header::CACHE_CONTROL)
                .and_then(|value| value.to_str().ok()),
            Some("no-store")
        );
        assert_eq!(
            response
                .headers()
                .get(header::PRAGMA)
                .and_then(|value| value.to_str().ok()),
            Some("no-cache")
        );
    }

    #[tokio::test]
    async fn token_endpoint_rejects_refresh_token_client_mismatch() {
        let state = test_auth_state_with_registered_client().await;
        state
            .store
            .upsert_refresh_token(crate::types::RefreshTokenRow {
                refresh_token: "refresh-token".to_string(),
                client_id: "client".to_string(),
                subject: "google-subject-123".to_string(),
                scope: "lab".to_string(),
                provider_refresh_token: Some("provider-refresh".to_string()),
                created_at: crate::util::now_unix() - 60,
                expires_at: crate::util::now_unix() + 3600,
            })
            .await
            .unwrap();
        let app = router(state);
        let response = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/token")
                    .header(
                        header::CONTENT_TYPE,
                        "application/x-www-form-urlencoded",
                    )
                    .body(Body::from(
                        "grant_type=refresh_token&refresh_token=refresh-token&client_id=other-client",
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
        assert_eq!(
            response
                .headers()
                .get(header::CACHE_CONTROL)
                .and_then(|value| value.to_str().ok()),
            Some("no-store")
        );
        assert_eq!(
            response
                .headers()
                .get(header::PRAGMA)
                .and_then(|value| value.to_str().ok()),
            Some("no-cache")
        );
    }

    #[tokio::test]
    async fn token_endpoint_rejects_refresh_token_without_upstream_refresh_capability() {
        let state = test_auth_state_with_registered_client().await;
        state
            .store
            .upsert_refresh_token(crate::types::RefreshTokenRow {
                refresh_token: "refresh-token".to_string(),
                client_id: "client".to_string(),
                subject: "google-subject-123".to_string(),
                scope: "lab".to_string(),
                provider_refresh_token: None,
                created_at: crate::util::now_unix() - 60,
                expires_at: crate::util::now_unix() + 3600,
            })
            .await
            .unwrap();
        let app = router(state);
        let response = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/token")
                    .header(header::CONTENT_TYPE, "application/x-www-form-urlencoded")
                    .body(Body::from(
                        "grant_type=refresh_token&refresh_token=refresh-token&client_id=client",
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    }

    async fn seed_authorization_code(state: &crate::state::AuthState) {
        seed_authorization_code_with_expiry(state, 4_102_444_800).await;
    }

    async fn seed_authorization_code_without_provider_refresh(state: &crate::state::AuthState) {
        state
            .store
            .insert_auth_code(crate::types::AuthorizationCodeRow {
                code: "lab-code".to_string(),
                client_id: "client".to_string(),
                subject: "google-subject-123".to_string(),
                redirect_uri: "http://127.0.0.1:7777/callback".to_string(),
                scope: "lab".to_string(),
                code_challenge: super::pkce_challenge("verifier"),
                code_challenge_method: "S256".to_string(),
                provider_refresh_token: None,
                created_at: 1_700_000_000,
                expires_at: 4_102_444_800,
            })
            .await
            .unwrap();
    }

    async fn seed_authorization_code_with_expiry(state: &crate::state::AuthState, expires_at: i64) {
        state
            .store
            .insert_auth_code(crate::types::AuthorizationCodeRow {
                code: "lab-code".to_string(),
                client_id: "client".to_string(),
                subject: "google-subject-123".to_string(),
                redirect_uri: "http://127.0.0.1:7777/callback".to_string(),
                scope: "lab".to_string(),
                code_challenge: super::pkce_challenge("verifier"),
                code_challenge_method: "S256".to_string(),
                provider_refresh_token: Some("provider-refresh".to_string()),
                created_at: 1_700_000_000,
                expires_at,
            })
            .await
            .unwrap();
    }
}
