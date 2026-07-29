use axum::extract::{Query, State};
use axum::http::{StatusCode, header};
use axum::response::{IntoResponse, Redirect};
use axum::{Json, response::Response};
use base64::Engine;
use base64::engine::general_purpose::URL_SAFE_NO_PAD;
use sha2::{Digest, Sha256};
use tracing::{debug, info, warn};

use crate::error::AuthError;
use crate::google::AuthorizeUrlRequest;
use crate::session::{append_set_cookie, build_browser_session_cookie, create_browser_session};
use crate::state::AuthState;
use crate::types::{
    AuthorizationCodeRow, AuthorizationRequestRow, AuthorizeQuery, BrowserLoginQuery,
    BrowserLoginStateRow, CallbackQuery, ClientRegistrationRequest, ClientRegistrationResponse,
    RegisteredClient,
};
use crate::util::{expires_at, fingerprint, now_unix, random_token};

const AUTH_REQUEST_TTL_SECS: i64 = 300;

/// Enforces the configured email allowlist.
///
/// `email_verified` is enforced before the email comparison: without this guard,
/// an attacker who creates a Google account with someone else's address (without
/// verifying it) could bypass the allowlist.
fn check_email_allowlist(
    email: Option<&str>,
    email_verified: Option<bool>,
    allowed_emails: &[String],
) -> Result<(), AuthError> {
    if allowed_emails.is_empty() {
        return Ok(());
    }
    if email_verified != Some(true) {
        warn!("oauth callback rejected: google did not return a verified email address");
        return Err(AuthError::AuthFailed(
            "google did not return a verified email address".to_string(),
        ));
    }
    let Some(e) = email else {
        warn!("oauth callback rejected: google did not return an email address");
        return Err(AuthError::AuthFailed(
            "google did not return an email address".to_string(),
        ));
    };
    let trimmed = e.trim();
    if allowed_emails
        .iter()
        .any(|a| a.eq_ignore_ascii_case(trimmed))
    {
        return Ok(());
    }
    warn!(
        email_id = %fingerprint(trimmed),
        "oauth callback rejected: email not in allowed list"
    );
    Err(AuthError::AuthFailed(
        "google account is not permitted to access this gateway".to_string(),
    ))
}

pub async fn browser_login(
    State(state): State<AuthState>,
    Query(query): Query<BrowserLoginQuery>,
) -> Result<Response, AuthError> {
    state.check_authorize_rate_limit()?;
    state.ensure_pending_oauth_state_capacity().await?;
    let return_to = sanitize_return_to(&state, query.return_to.as_deref());
    let provider_code_verifier = random_token(32)?;
    let provider_code_challenge =
        URL_SAFE_NO_PAD.encode(Sha256::digest(provider_code_verifier.as_bytes()));
    let request_state = random_token(24)?;
    let oauth_state_id = fingerprint(&request_state);

    state
        .store
        .insert_browser_login_state(BrowserLoginStateRow {
            state: request_state.clone(),
            return_to: return_to.clone(),
            provider_code_verifier,
            created_at: now_unix(),
            expires_at: now_unix() + AUTH_REQUEST_TTL_SECS,
        })
        .await?;

    let location = state.google.authorize_url(&AuthorizeUrlRequest {
        state: request_state,
        scope: state.config.default_scope.clone(),
        code_challenge: provider_code_challenge,
        code_challenge_method: "S256".to_string(),
    })?;
    info!(
        oauth_state_id = %oauth_state_id,
        return_to = %return_to,
        "browser login redirected to upstream provider"
    );

    Ok((
        StatusCode::FOUND,
        [(header::LOCATION, location.to_string())],
    )
        .into_response())
}

pub async fn register_client(
    State(state): State<AuthState>,
    Json(request): Json<ClientRegistrationRequest>,
) -> Result<Json<ClientRegistrationResponse>, AuthError> {
    state.check_register_rate_limit()?;
    if request.redirect_uris.is_empty() {
        warn!("oauth register rejected: no redirect URIs provided");
        return Err(AuthError::Validation(
            "at least one redirect URI is required".to_string(),
        ));
    }
    for redirect_uri in &request.redirect_uris {
        if !is_allowed_redirect_uri(redirect_uri, &state.config.allowed_client_redirect_uris) {
            warn!(
                redirect_uri = %redirect_uri,
                allowed_patterns = ?state.config.allowed_client_redirect_uris,
                "oauth register rejected: redirect URI is not in the allowlist or loopback set"
            );
            return Err(AuthError::Validation(format!(
                "redirect URI `{redirect_uri}` must target a loopback host or match an allowed redirect pattern"
            )));
        }
    }

    let client = RegisteredClient {
        client_id: random_token(18)?,
        redirect_uris: request.redirect_uris,
        created_at: now_unix(),
    };
    state.store.register_client(client.clone()).await?;
    info!(
        client_id = %client.client_id,
        redirect_uri_count = client.redirect_uris.len(),
        redirect_uris = ?client.redirect_uris,
        "oauth client registration accepted"
    );
    Ok(Json(ClientRegistrationResponse {
        client_id: client.client_id,
        redirect_uris: client.redirect_uris,
        token_endpoint_auth_method: "none".to_string(),
    }))
}

pub async fn authorize(
    State(state): State<AuthState>,
    Query(query): Query<AuthorizeQuery>,
) -> Result<Response, AuthError> {
    state.check_authorize_rate_limit()?;
    state.ensure_pending_oauth_state_capacity().await?;
    validate_response_type(&query.response_type)?;
    validate_resource(&state, query.resource.as_deref())?;
    let scope = validate_scope(
        &query.scope,
        &state.config.default_scope,
        &state.config.scopes_supported,
    )?;
    let client_state_id = fingerprint(&query.state);
    info!(
        client_id = %query.client_id,
        redirect_uri = %query.redirect_uri,
        client_state_id = %client_state_id,
        requested_scope = %query.scope,
        "oauth authorize request received"
    );
    let client = state
        .store
        .find_client(&query.client_id)
        .await?
        .ok_or_else(|| {
            warn!(
                client_id = %query.client_id,
                client_state_id = %client_state_id,
                "oauth authorize rejected: unknown client_id"
            );
            AuthError::InvalidGrant("unknown client_id".to_string())
        })?;
    if !client
        .redirect_uris
        .iter()
        .any(|uri| uri == &query.redirect_uri)
    {
        warn!(
            client_id = %query.client_id,
            redirect_uri = %query.redirect_uri,
            client_state_id = %client_state_id,
            "oauth authorize rejected: redirect URI does not match registered client"
        );
        return Err(AuthError::Validation(
            "redirect_uri does not match the registered client".to_string(),
        ));
    }
    if query.code_challenge_method != "S256" {
        warn!(
            client_id = %query.client_id,
            client_state_id = %client_state_id,
            code_challenge_method = %query.code_challenge_method,
            "oauth authorize rejected: unsupported PKCE method"
        );
        return Err(AuthError::Validation(
            "code_challenge_method must be S256".to_string(),
        ));
    }

    let provider_code_verifier = random_token(32)?;
    let provider_code_challenge =
        URL_SAFE_NO_PAD.encode(Sha256::digest(provider_code_verifier.as_bytes()));
    let request_state = random_token(24)?;
    let oauth_state_id = fingerprint(&request_state);

    state
        .store
        .insert_authorization_request(AuthorizationRequestRow {
            state: request_state.clone(),
            client_id: query.client_id.clone(),
            redirect_uri: query.redirect_uri.clone(),
            client_state: query.state.clone(),
            scope: scope.clone(),
            provider_code_verifier,
            code_challenge: query.code_challenge.clone(),
            code_challenge_method: query.code_challenge_method.clone(),
            created_at: now_unix(),
            expires_at: now_unix() + AUTH_REQUEST_TTL_SECS,
        })
        .await?;

    let location = state.google.authorize_url(&AuthorizeUrlRequest {
        state: request_state,
        scope,
        code_challenge: provider_code_challenge,
        code_challenge_method: "S256".to_string(),
    })?;
    info!(
        client_id = %query.client_id,
        redirect_uri = %query.redirect_uri,
        client_state_id = %client_state_id,
        oauth_state_id = %oauth_state_id,
        provider = "google",
        "oauth authorize request redirected to upstream provider"
    );
    debug!(
        client_id = %query.client_id,
        oauth_state_id = %oauth_state_id,
        location = %location,
        "oauth authorize redirect URL generated"
    );

    Ok((
        StatusCode::FOUND,
        [(header::LOCATION, location.to_string())],
    )
        .into_response())
}

pub async fn callback(
    State(state): State<AuthState>,
    Query(query): Query<CallbackQuery>,
) -> Result<Response, AuthError> {
    let oauth_state_id = fingerprint(&query.state);
    info!(
        oauth_state_id = %oauth_state_id,
        provider = "google",
        "oauth callback received"
    );
    if let Some(login) = state.store.take_browser_login_state(&query.state).await? {
        let google = state
            .google
            .exchange_code(&query.code, &login.provider_code_verifier)
            .await?;
        let allowed = state.resolve_allowed_emails().await?;
        check_email_allowlist(google.email.as_deref(), google.email_verified, &allowed)?;
        let session = create_browser_session(&state, google.subject, google.email).await?;
        let mut response = Redirect::to(&login.return_to).into_response();
        append_set_cookie(
            &mut response,
            &build_browser_session_cookie(&state, &session.session_id),
        );
        info!(
            oauth_state_id = %oauth_state_id,
            return_to = %login.return_to,
            subject_id = %fingerprint(&session.subject),
            "browser login callback issued session cookie"
        );
        return Ok(response);
    }

    let request = state
        .store
        .take_authorization_request(&query.state)
        .await
        .map_err(|_| {
            warn!(
                oauth_state_id = %oauth_state_id,
                "oauth callback rejected: authorization state is invalid or expired"
            );
            AuthError::InvalidGrant("authorization state is invalid or expired".to_string())
        })?;
    info!(
        client_id = %request.client_id,
        redirect_uri = %request.redirect_uri,
        oauth_state_id = %oauth_state_id,
        client_state_id = %fingerprint(&request.client_state),
        "oauth callback state redeemed"
    );
    let google = state
        .google
        .exchange_code(&query.code, &request.provider_code_verifier)
        .await?;

    // RFC 6749 §4.1.2.1: errors must redirect to the client's redirect_uri,
    // not surface as a JSON HTTP error. The denial reason is sourced from the
    // AuthError so we only log once (inside check_email_allowlist).
    let allowed = state.resolve_allowed_emails().await?;
    if let Err(denial) =
        check_email_allowlist(google.email.as_deref(), google.email_verified, &allowed)
    {
        let mut redirect_target = url::Url::parse(&request.redirect_uri).map_err(|error| {
            // Unreachable in practice: redirect_uri was validated against the
            // client's registered URIs before being stored.
            AuthError::Config(format!("failed to parse registered redirect_uri: {error}"))
        })?;
        redirect_target
            .query_pairs_mut()
            .append_pair("error", "access_denied")
            .append_pair("error_description", &denial.to_string())
            .append_pair("state", &request.client_state);
        return Ok(Redirect::to(redirect_target.as_str()).into_response());
    }

    let subject_id = fingerprint(&google.subject);
    info!(
        client_id = %request.client_id,
        oauth_state_id = %oauth_state_id,
        subject_id = %subject_id,
        has_provider_refresh_token = google.refresh_token.is_some(),
        "oauth callback exchanged upstream code successfully"
    );
    let auth_code = random_token(24)?;
    let auth_code_id = fingerprint(&auth_code);
    state
        .store
        .insert_auth_code(AuthorizationCodeRow {
            code: auth_code.clone(),
            client_id: request.client_id,
            subject: google.subject,
            redirect_uri: request.redirect_uri.clone(),
            scope: request.scope,
            code_challenge: request.code_challenge,
            code_challenge_method: request.code_challenge_method,
            provider_refresh_token: google.refresh_token,
            created_at: now_unix(),
            expires_at: expires_at(
                now_unix(),
                state.config.auth_code_ttl,
                "LAB_AUTH_CODE_TTL_SECS",
            )?,
        })
        .await?;
    info!(
        auth_code_id = %auth_code_id,
        oauth_state_id = %oauth_state_id,
        redirect_uri = %request.redirect_uri,
        "oauth callback issued local authorization code"
    );

    let redirect_uri = reqwest::Url::parse(&request.redirect_uri).map_err(|error| {
        AuthError::Storage(format!(
            "registered redirect_uri is not a valid URL: {error}"
        ))
    })?;
    let mut redirect_uri = redirect_uri;
    redirect_uri
        .query_pairs_mut()
        .append_pair("code", &auth_code)
        .append_pair("state", &request.client_state);
    debug!(
        auth_code_id = %auth_code_id,
        redirect_uri = %redirect_uri,
        "oauth callback redirecting client back to registered callback"
    );

    Ok(Redirect::to(redirect_uri.as_str()).into_response())
}

fn sanitize_return_to(state: &AuthState, requested: Option<&str>) -> String {
    let Some(requested) = requested.map(str::trim).filter(|value| !value.is_empty()) else {
        return "/".to_string();
    };
    if requested.starts_with('/') && !requested.starts_with("//") {
        return requested.to_string();
    }
    let Some(public_url) = state.config.public_url.as_ref() else {
        return "/".to_string();
    };
    let Ok(url) = reqwest::Url::parse(requested) else {
        return "/".to_string();
    };
    if url.scheme() != public_url.scheme()
        || url.host_str() != public_url.host_str()
        || url.port_or_known_default() != public_url.port_or_known_default()
    {
        return "/".to_string();
    }
    let mut normalized = url.path().to_string();
    if let Some(query) = url.query() {
        normalized.push('?');
        normalized.push_str(query);
    }
    if let Some(fragment) = url.fragment() {
        normalized.push('#');
        normalized.push_str(fragment);
    }
    normalized
}

fn validate_response_type(response_type: &str) -> Result<(), AuthError> {
    if response_type == "code" {
        Ok(())
    } else {
        warn!(
            response_type = %response_type,
            "oauth authorize rejected: unsupported response_type"
        );
        Err(AuthError::Validation(
            "response_type must be `code`".to_string(),
        ))
    }
}

fn validate_scope(
    scope: &str,
    default_scope: &str,
    scopes_supported: &[String],
) -> Result<String, AuthError> {
    let normalized = scope.trim();
    if normalized.is_empty() {
        return Ok(default_scope.to_string());
    }
    // Accept any space-separated combination where every token is in scopes_supported.
    // Falls back to exact-match against default_scope when scopes_supported is empty.
    if !scopes_supported.is_empty() {
        let all_valid = normalized
            .split_whitespace()
            .all(|s| scopes_supported.iter().any(|sup| sup == s));
        if all_valid {
            return Ok(normalized.to_string());
        }
    } else if normalized == default_scope {
        return Ok(normalized.to_string());
    }
    warn!(scope = %normalized, "oauth authorize rejected: unsupported scope");
    Err(AuthError::Validation(format!(
        "scope must be one of: {}",
        scopes_supported.join(", ")
    )))
}

pub(crate) fn validate_resource(
    state: &AuthState,
    requested: Option<&str>,
) -> Result<(), AuthError> {
    let Some(requested) = requested.map(str::trim).filter(|value| !value.is_empty()) else {
        return Ok(());
    };
    let expected = crate::metadata::canonical_resource_url(state);
    if requested == expected {
        return Ok(());
    }

    warn!(
        requested_resource = %requested,
        expected_resource = %expected,
        "oauth request rejected: resource does not match canonical MCP endpoint"
    );
    Err(AuthError::Validation(format!(
        "resource must be `{expected}`"
    )))
}

fn is_loopback_redirect(value: &str) -> bool {
    let Ok(url) = reqwest::Url::parse(value) else {
        return false;
    };
    if url.scheme() != "http" {
        return false;
    }
    matches!(url.host_str(), Some("127.0.0.1" | "localhost" | "::1"))
}

fn is_allowed_redirect_uri(value: &str, patterns: &[String]) -> bool {
    if is_loopback_redirect(value) {
        return true;
    }

    let Ok(candidate) = reqwest::Url::parse(value) else {
        return false;
    };
    patterns
        .iter()
        .any(|pattern| redirect_pattern_matches(pattern, &candidate))
}

fn wildcard_matches(pattern: &str, value: &str) -> bool {
    if pattern == "*" {
        return true;
    }
    let parts: Vec<&str> = pattern.split('*').collect();
    if parts.len() == 1 {
        return pattern == value;
    }

    let anchored_start = !pattern.starts_with('*');
    let anchored_end = !pattern.ends_with('*');
    let non_empty_parts: Vec<&str> = parts.into_iter().filter(|part| !part.is_empty()).collect();
    if non_empty_parts.is_empty() {
        return true;
    }

    let mut cursor = 0usize;
    for (index, part) in non_empty_parts.iter().enumerate() {
        if index == 0 && anchored_start {
            if !value[cursor..].starts_with(part) {
                return false;
            }
            cursor += part.len();
            continue;
        }

        match value[cursor..].find(part) {
            Some(found) => cursor += found + part.len(),
            None => return false,
        }
    }

    if anchored_end && let Some(last) = non_empty_parts.last() {
        return value.ends_with(last);
    }

    true
}

fn redirect_pattern_matches(pattern: &str, candidate: &reqwest::Url) -> bool {
    let Ok(pattern) = reqwest::Url::parse(pattern) else {
        return false;
    };
    if pattern.scheme() != candidate.scheme() {
        return false;
    }
    if pattern.port_or_known_default() != candidate.port_or_known_default() {
        return false;
    }
    let Some(pattern_host) = pattern.host_str() else {
        return false;
    };
    let Some(candidate_host) = candidate.host_str() else {
        return false;
    };
    if !host_pattern_matches(pattern_host, candidate_host) {
        return false;
    }
    if !wildcard_matches(pattern.path(), candidate.path()) {
        return false;
    }

    match (pattern.query(), candidate.query()) {
        (Some(pattern_query), Some(candidate_query)) => {
            wildcard_matches(pattern_query, candidate_query)
        }
        (None, None) => true,
        _ => false,
    }
}

fn host_pattern_matches(pattern_host: &str, candidate_host: &str) -> bool {
    let pattern_labels = pattern_host.split('.').collect::<Vec<_>>();
    let candidate_labels = candidate_host.split('.').collect::<Vec<_>>();
    if pattern_labels.len() != candidate_labels.len() {
        return false;
    }

    pattern_labels
        .iter()
        .zip(candidate_labels.iter())
        .all(|(pattern, candidate)| {
            *pattern == "*" || (!pattern.contains('*') && pattern.eq_ignore_ascii_case(candidate))
        })
}

#[cfg(test)]
pub mod tests {
    use axum::body::Body;
    use axum::http::{Request, StatusCode, header};
    use base64::Engine;
    use jsonwebtoken::{Algorithm, EncodingKey, Header, encode};
    use rsa::RsaPrivateKey;
    use rsa::pkcs8::{DecodePrivateKey, EncodePrivateKey, LineEnding};
    use rsa::traits::PublicKeyParts;
    use serde_json::json;
    use tower::util::ServiceExt;
    use url::Url;
    use wiremock::matchers::{method, path};
    use wiremock::{Mock, MockServer, ResponseTemplate};

    use super::{host_pattern_matches, is_allowed_redirect_uri, wildcard_matches};
    use crate::config::{AuthConfig, AuthMode, GoogleConfig};
    use crate::google::GoogleProvider;
    use crate::routes::router;
    use crate::state::AuthState;
    use crate::types::{AuthorizationRequestRow, RegisteredClient};

    use crate::util::now_unix;

    #[tokio::test]
    async fn register_accepts_public_dcr_and_enforces_loopback_redirects() {
        let mut config = test_auth_config();
        config.enable_dynamic_registration = true;
        let app = router(test_auth_state_with_config(config).await);
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/register")
                    .header(header::CONTENT_TYPE, "application/json")
                    .body(Body::from(
                        json!({
                            "redirect_uris": ["http://127.0.0.1:7777/callback"]
                        })
                        .to_string(),
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);

        let rejected = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/register")
                    .header(header::CONTENT_TYPE, "application/json")
                    .body(Body::from(
                        json!({
                            "redirect_uris": ["https://claude.ai/api/mcp/auth_callback"]
                        })
                        .to_string(),
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(rejected.status(), StatusCode::UNPROCESSABLE_ENTITY);
    }

    #[tokio::test]
    async fn register_accepts_allowed_non_loopback_redirect_patterns() {
        let mut config = test_auth_config();
        config.enable_dynamic_registration = true;
        config.allowed_client_redirect_uris =
            vec!["https://callback.tootie.tv/callback/*".to_string()];
        let app = router(test_auth_state_with_config(config).await);
        let response = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/register")
                    .header(header::CONTENT_TYPE, "application/json")
                    .body(Body::from(
                        json!({
                            "redirect_uris": ["https://callback.tootie.tv/callback/dookie"]
                        })
                        .to_string(),
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);
    }

    #[tokio::test]
    async fn register_is_rate_limited_after_configured_burst() {
        let mut config = test_auth_config();
        config.enable_dynamic_registration = true;
        config.register_requests_per_minute = 1;
        let app = router(test_auth_state_with_config(config).await);

        let first = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/register")
                    .header(header::CONTENT_TYPE, "application/json")
                    .body(Body::from(
                        json!({
                            "redirect_uris": ["http://127.0.0.1:7777/callback"]
                        })
                        .to_string(),
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(first.status(), StatusCode::OK);

        let second = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/register")
                    .header(header::CONTENT_TYPE, "application/json")
                    .body(Body::from(
                        json!({
                            "redirect_uris": ["http://127.0.0.1:8888/callback"]
                        })
                        .to_string(),
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(second.status(), StatusCode::TOO_MANY_REQUESTS);
    }

    #[test]
    fn wildcard_redirect_patterns_support_leading_and_infix_matches() {
        assert!(wildcard_matches(
            "https://callback.tootie.tv/callback/*",
            "https://callback.tootie.tv/callback/dookie"
        ));
        assert!(wildcard_matches(
            "https://callback.*.tv/callback/*",
            "https://callback.tootie.tv/callback/dookie"
        ));
        assert!(!wildcard_matches("/callback", "/callback/extra"));
    }

    #[test]
    fn host_patterns_support_full_label_wildcards_only() {
        assert!(host_pattern_matches("callback.*.tv", "callback.tootie.tv"));
        assert!(host_pattern_matches(
            "*.example.com",
            "callback.example.com"
        ));
        assert!(!host_pattern_matches(
            "callback.example.com*",
            "callback.example.com"
        ));
        assert!(!host_pattern_matches(
            "*.example.com",
            "callback.nested.example.com"
        ));
    }

    #[test]
    fn wildcard_redirect_patterns_do_not_overmatch_similar_hosts() {
        assert!(!is_allowed_redirect_uri(
            "https://callback.tootie.tv.evil.example/callback/dookie",
            &[String::from("https://callback.tootie.tv/callback/*")]
        ));
        assert!(!is_allowed_redirect_uri(
            "https://callback.example.com.evil.example/callback",
            &[String::from("https://callback.example.com*")]
        ));
    }

    #[tokio::test]
    async fn authorize_persists_full_state_and_redirects_to_google() {
        let app = router(test_auth_state_with_registered_client().await);
        let response = app
            .oneshot(
                Request::builder()
                    .uri("/authorize?response_type=code&client_id=client&redirect_uri=http://127.0.0.1:7777/callback&state=abc&scope=lab&code_challenge=pkce&code_challenge_method=S256")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::FOUND);
        let location = response
            .headers()
            .get(header::LOCATION)
            .unwrap()
            .to_str()
            .unwrap();
        assert!(location.contains("accounts.google.com"));
    }

    #[tokio::test]
    async fn authorize_is_rate_limited_after_configured_burst() {
        let mut config = test_auth_config();
        config.authorize_requests_per_minute = 1;
        let state = test_auth_state_with_config(config).await;
        state
            .store
            .register_client(RegisteredClient {
                client_id: "client".to_string(),
                redirect_uris: vec!["http://127.0.0.1:7777/callback".to_string()],
                created_at: now_unix(),
            })
            .await
            .unwrap();
        let app = router(state);

        let first = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/authorize?response_type=code&client_id=client&redirect_uri=http://127.0.0.1:7777/callback&state=abc&scope=lab&code_challenge=pkce&code_challenge_method=S256")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(first.status(), StatusCode::FOUND);

        let second = app
            .oneshot(
                Request::builder()
                    .uri("/authorize?response_type=code&client_id=client&redirect_uri=http://127.0.0.1:7777/callback&state=def&scope=lab&code_challenge=pkce&code_challenge_method=S256")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(second.status(), StatusCode::TOO_MANY_REQUESTS);
    }

    #[tokio::test]
    async fn browser_login_starts_upstream_flow_and_persists_return_to_state() {
        let state = test_auth_state().await;
        let app = router(state.clone());
        let response = app
            .oneshot(
                Request::builder()
                    .uri("/auth/login?return_to=%2Fgateways%2F%3Ftab%3Dlab")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::FOUND);
        let location = Url::parse(
            response
                .headers()
                .get(header::LOCATION)
                .unwrap()
                .to_str()
                .unwrap(),
        )
        .unwrap();
        let upstream_state = location
            .query_pairs()
            .find(|(key, _)| key == "state")
            .map(|(_, value)| value.into_owned())
            .unwrap();
        let stored = state
            .store
            .take_browser_login_state(&upstream_state)
            .await
            .unwrap()
            .unwrap();
        assert_eq!(stored.return_to, "/gateways/?tab=lab");
    }

    #[tokio::test]
    async fn browser_login_rejects_when_pending_oauth_state_cap_is_reached() {
        let mut config = test_auth_config();
        config.max_pending_oauth_states = 1;
        let state = test_auth_state_with_config(config).await;
        state
            .store
            .insert_browser_login_state(crate::types::BrowserLoginStateRow {
                state: "existing-login".to_string(),
                return_to: "/".to_string(),
                provider_code_verifier: "provider-verifier".to_string(),
                created_at: now_unix(),
                expires_at: now_unix() + 300,
            })
            .await
            .unwrap();

        let app = router(state);
        let response = app
            .oneshot(
                Request::builder()
                    .uri("/auth/login?return_to=%2Fgateways%2F")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::TOO_MANY_REQUESTS);
    }

    #[tokio::test]
    async fn callback_rejects_expired_or_mismatched_state() {
        let app = router(test_auth_state_with_mock_google().await);
        let response = app
            .oneshot(
                Request::builder()
                    .uri("/auth/google/callback?state=bad-state&code=upstream-code")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn browser_login_callback_sets_session_cookie_and_redirects_home() {
        let state = test_auth_state_with_mock_google().await;
        let app = router(state.clone());
        let login = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/auth/login?return_to=%2Fgateways%2F")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        let location = Url::parse(
            login
                .headers()
                .get(header::LOCATION)
                .unwrap()
                .to_str()
                .unwrap(),
        )
        .unwrap();
        let upstream_state = location
            .query_pairs()
            .find(|(key, _)| key == "state")
            .map(|(_, value)| value.into_owned())
            .unwrap();

        let callback = app
            .oneshot(
                Request::builder()
                    .uri(format!(
                        "/auth/google/callback?state={upstream_state}&code=upstream-code"
                    ))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(callback.status(), StatusCode::SEE_OTHER);
        assert_eq!(
            callback.headers().get(header::LOCATION).unwrap(),
            "/gateways/"
        );
        let cookie = callback
            .headers()
            .get_all(header::SET_COOKIE)
            .iter()
            .find_map(|value| value.to_str().ok())
            .unwrap();
        assert!(cookie.contains("lab_session="));
    }

    #[tokio::test]
    async fn oauth_client_callback_redirects_with_access_denied_when_email_not_in_allowlist() {
        let mut config = test_auth_config();
        config.admin_email = "allowed@example.com".to_string();
        let base_state = test_auth_state_with_config(config).await;
        base_state
            .store
            .register_client(RegisteredClient {
                client_id: "client".to_string(),
                redirect_uris: vec!["http://127.0.0.1:7777/callback".to_string()],
                created_at: now_unix(),
            })
            .await
            .unwrap();
        // Pre-insert an authorization request (OAuth-client flow, not browser-login).
        base_state
            .store
            .insert_authorization_request(AuthorizationRequestRow {
                state: "good-state".to_string(),
                client_id: "client".to_string(),
                redirect_uri: "http://127.0.0.1:7777/callback".to_string(),
                client_state: "client-abc".to_string(),
                scope: "lab".to_string(),
                provider_code_verifier: "provider-verifier".to_string(),
                code_challenge: "challenge".to_string(),
                code_challenge_method: "S256".to_string(),
                created_at: now_unix(),
                expires_at: now_unix() + 300,
            })
            .await
            .unwrap();

        let server = Box::leak(Box::new(MockServer::start().await));
        Mock::given(method("POST"))
            .and(path("/token"))
            .respond_with(ResponseTemplate::new(200).set_body_json(json!({
                "access_token": "google-access-token",
                "refresh_token": "refresh-token",
                "expires_in": 3600,
                "id_token": signed_test_id_token(), // email=user@example.com, not in allowlist
            })))
            .mount(server)
            .await;
        Mock::given(method("GET"))
            .and(path("/certs"))
            .respond_with(ResponseTemplate::new(200).set_body_json(test_jwks()))
            .mount(server)
            .await;

        let google = GoogleProvider::new(
            "client-id".to_string(),
            "client-secret".to_string(),
            Url::parse("https://lab.example.com/auth/google/callback").unwrap(),
        )
        .unwrap()
        .with_endpoints(
            server.uri().parse::<Url>().unwrap(),
            server.uri().parse::<Url>().unwrap().join("/token").unwrap(),
        )
        .with_jwks_endpoint(server.uri().parse::<Url>().unwrap().join("/certs").unwrap());

        let state = AuthState::for_tests(
            (*base_state.config).clone(),
            base_state.store.clone(),
            (*base_state.signing_keys).clone(),
            google,
        );
        let app = router(state);

        let response = app
            .oneshot(
                Request::builder()
                    .uri("/auth/google/callback?state=good-state&code=upstream-code")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        // Must redirect (not 401) with error=access_denied and the original client state.
        assert_eq!(response.status(), StatusCode::SEE_OTHER);
        let location = response
            .headers()
            .get(header::LOCATION)
            .unwrap()
            .to_str()
            .unwrap();
        let redirect = Url::parse(location).unwrap();
        let params: std::collections::HashMap<_, _> = redirect.query_pairs().collect();
        assert_eq!(
            params.get("error").map(|v| v.as_ref()),
            Some("access_denied")
        );
        assert_eq!(params.get("state").map(|v| v.as_ref()), Some("client-abc"));
    }

    #[tokio::test]
    async fn browser_login_callback_rejects_email_not_in_allowlist() {
        let mut config = test_auth_config();
        // "allowed@example.com" is permitted; the mock id_token returns
        // "user@example.com" → callback must be denied with 401.
        config.admin_email = "allowed@example.com".to_string();
        let base_state = test_auth_state_with_config(config).await;
        base_state
            .store
            .register_client(RegisteredClient {
                client_id: "client".to_string(),
                redirect_uris: vec!["http://127.0.0.1:7777/callback".to_string()],
                created_at: now_unix(),
            })
            .await
            .unwrap();

        let server = Box::leak(Box::new(MockServer::start().await));
        Mock::given(method("POST"))
            .and(path("/token"))
            .respond_with(ResponseTemplate::new(200).set_body_json(json!({
                "access_token": "google-access-token",
                "refresh_token": "refresh-token",
                "expires_in": 3600,
                "id_token": signed_test_id_token(),
            })))
            .mount(server)
            .await;
        Mock::given(method("GET"))
            .and(path("/certs"))
            .respond_with(ResponseTemplate::new(200).set_body_json(test_jwks()))
            .mount(server)
            .await;

        let google = GoogleProvider::new(
            "client-id".to_string(),
            "client-secret".to_string(),
            Url::parse("https://lab.example.com/auth/google/callback").unwrap(),
        )
        .unwrap()
        .with_endpoints(
            server.uri().parse::<Url>().unwrap(),
            server.uri().parse::<Url>().unwrap().join("/token").unwrap(),
        )
        .with_jwks_endpoint(server.uri().parse::<Url>().unwrap().join("/certs").unwrap());

        let state = AuthState::for_tests(
            (*base_state.config).clone(),
            base_state.store.clone(),
            (*base_state.signing_keys).clone(),
            google,
        );
        let app = router(state.clone());

        let login = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/auth/login?return_to=%2F")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        let location = Url::parse(
            login
                .headers()
                .get(header::LOCATION)
                .unwrap()
                .to_str()
                .unwrap(),
        )
        .unwrap();
        let upstream_state = location
            .query_pairs()
            .find(|(key, _)| key == "state")
            .map(|(_, value)| value.into_owned())
            .unwrap();

        let callback = app
            .oneshot(
                Request::builder()
                    .uri(format!(
                        "/auth/google/callback?state={upstream_state}&code=upstream-code"
                    ))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(callback.status(), StatusCode::UNAUTHORIZED);
    }

    #[tokio::test]
    async fn authorize_rejects_missing_or_invalid_response_type() {
        let app = router(test_auth_state_with_registered_client().await);
        for uri in [
            "/authorize?client_id=client&redirect_uri=http://127.0.0.1:7777/callback&state=abc&scope=lab&code_challenge=pkce&code_challenge_method=S256",
            "/authorize?response_type=token&client_id=client&redirect_uri=http://127.0.0.1:7777/callback&state=abc&scope=lab&code_challenge=pkce&code_challenge_method=S256",
        ] {
            let response = app
                .clone()
                .oneshot(Request::builder().uri(uri).body(Body::empty()).unwrap())
                .await
                .unwrap();
            assert_eq!(response.status(), StatusCode::UNPROCESSABLE_ENTITY);
        }
    }

    #[test]
    fn validate_scope_accepts_configured_default_and_rejects_others() {
        // Empty scope falls back to configured default.
        assert_eq!(
            super::validate_scope(
                "",
                "syslog:read",
                &["syslog:read".to_string(), "syslog:admin".to_string()]
            )
            .unwrap(),
            "syslog:read"
        );
        // Matching scope passes through.
        assert_eq!(
            super::validate_scope(
                "syslog:read",
                "syslog:read",
                &["syslog:read".to_string(), "syslog:admin".to_string()]
            )
            .unwrap(),
            "syslog:read"
        );
        // Anything else is rejected — and the error mentions the configured
        // default (proving the LAB_SCOPE constant is gone).
        let err = super::validate_scope(
            "lab",
            "syslog:read",
            &["syslog:read".to_string(), "syslog:admin".to_string()],
        )
        .unwrap_err();
        assert!(err.to_string().contains("syslog:read"), "got: {err}");
    }

    #[tokio::test]
    async fn authorize_rejects_invalid_scope() {
        let app = router(test_auth_state_with_registered_client().await);
        let response = app
            .oneshot(
                Request::builder()
                    .uri("/authorize?response_type=code&client_id=client&redirect_uri=http://127.0.0.1:7777/callback&state=abc&scope=lab:admin&code_challenge=pkce&code_challenge_method=S256")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::UNPROCESSABLE_ENTITY);
    }

    #[tokio::test]
    async fn authorize_rejects_mismatched_resource_parameter() {
        let app = router(test_auth_state_with_registered_client().await);
        let response = app
            .oneshot(
                Request::builder()
                    .uri("/authorize?response_type=code&client_id=client&redirect_uri=http://127.0.0.1:7777/callback&state=abc&resource=https://other.example.com/mcp&scope=lab&code_challenge=pkce&code_challenge_method=S256")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::UNPROCESSABLE_ENTITY);
    }

    #[tokio::test]
    async fn callback_rejects_expired_state() {
        let state = test_auth_state_with_registered_client().await;
        state
            .store
            .insert_authorization_request(AuthorizationRequestRow {
                state: "expired-state".to_string(),
                client_id: "client".to_string(),
                redirect_uri: "http://127.0.0.1:7777/callback".to_string(),
                client_state: "client-state".to_string(),
                scope: "lab".to_string(),
                provider_code_verifier: "provider-verifier".to_string(),
                code_challenge: "challenge".to_string(),
                code_challenge_method: "S256".to_string(),
                created_at: now_unix() - 300,
                expires_at: now_unix() - 1,
            })
            .await
            .unwrap();
        let app = router(state);
        let response = app
            .oneshot(
                Request::builder()
                    .uri("/auth/google/callback?state=expired-state&code=upstream-code")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    }

    pub async fn test_auth_state() -> AuthState {
        test_auth_state_with_config(test_auth_config()).await
    }

    pub async fn test_auth_state_with_config(config: AuthConfig) -> AuthState {
        AuthState::new(config).await.unwrap()
    }

    pub fn test_auth_config() -> AuthConfig {
        let dir = Box::leak(Box::new(tempfile::tempdir().unwrap()));
        AuthConfig {
            mode: AuthMode::OAuth,
            public_url: Some(Url::parse("https://lab.example.com").unwrap()),
            sqlite_path: dir.path().join("auth.db"),
            key_path: dir.path().join("auth-jwt.pem"),
            bootstrap_secret: Some("bootstrap-secret".to_string()),
            allowed_client_redirect_uris: Vec::new(),
            // Matches the mock id_token email returned by signed_test_id_token,
            // so happy-path callback tests pass the allowlist check.
            admin_email: "user@example.com".to_string(),
            google: GoogleConfig {
                client_id: "client-id".to_string(),
                client_secret: "client-secret".to_string(),
                callback_path: "/auth/google/callback".to_string(),
                scopes: vec![
                    "openid".to_string(),
                    "email".to_string(),
                    "profile".to_string(),
                ],
            },
            ..AuthConfig::default()
        }
    }

    pub async fn test_auth_state_with_registered_client() -> AuthState {
        let state = test_auth_state().await;
        state
            .store
            .register_client(RegisteredClient {
                client_id: "client".to_string(),
                redirect_uris: vec!["http://127.0.0.1:7777/callback".to_string()],
                created_at: now_unix(),
            })
            .await
            .unwrap();
        state
    }

    pub(crate) async fn test_auth_state_with_mock_google() -> AuthState {
        let state = test_auth_state_with_registered_client().await;
        let server = Box::leak(Box::new(MockServer::start().await));
        Mock::given(method("POST"))
            .and(path("/token"))
            .respond_with(ResponseTemplate::new(200).set_body_json(json!({
                "access_token": "google-access-token",
                "refresh_token": "refresh-token",
                "expires_in": 3600,
                "id_token": signed_test_id_token(),
            })))
            .mount(server)
            .await;
        Mock::given(method("GET"))
            .and(path("/certs"))
            .respond_with(ResponseTemplate::new(200).set_body_json(test_jwks()))
            .mount(server)
            .await;
        state
            .store
            .insert_authorization_request(AuthorizationRequestRow {
                state: "good-state".to_string(),
                client_id: "client".to_string(),
                redirect_uri: "http://127.0.0.1:7777/callback".to_string(),
                client_state: "client-state".to_string(),
                scope: "lab".to_string(),
                provider_code_verifier: "provider-verifier".to_string(),
                code_challenge: "challenge".to_string(),
                code_challenge_method: "S256".to_string(),
                created_at: now_unix(),
                expires_at: now_unix() + 300,
            })
            .await
            .unwrap();
        let google = GoogleProvider::new(
            "client-id".to_string(),
            "client-secret".to_string(),
            Url::parse("https://lab.example.com/auth/google/callback").unwrap(),
        )
        .unwrap()
        .with_endpoints(
            server.uri().parse::<Url>().unwrap(),
            server.uri().parse::<Url>().unwrap().join("/token").unwrap(),
        )
        .with_jwks_endpoint(server.uri().parse::<Url>().unwrap().join("/certs").unwrap());
        AuthState::for_tests(
            (*state.config).clone(),
            state.store.clone(),
            (*state.signing_keys).clone(),
            google,
        )
    }

    fn signed_test_id_token() -> String {
        let claims = json!({
            "iss": "https://accounts.google.com",
            "aud": "client-id",
            "sub": "google-subject-123",
            "email": "user@example.com",
            "email_verified": true,
            "iat": now_unix() as usize,
            "exp": (now_unix() + 3600) as usize,
        });
        let mut header = Header::new(Algorithm::RS256);
        header.kid = Some("test-kid".to_string());
        encode(&header, &claims, &test_encoding_key()).unwrap()
    }

    fn test_jwks() -> serde_json::Value {
        let key = test_rsa_key();
        let public_key = key.to_public_key();
        json!({
            "keys": [{
                "kid": "test-kid",
                "alg": "RS256",
                "kty": "RSA",
                "use": "sig",
                "n": base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(public_key.n_bytes()),
                "e": base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(public_key.e_bytes()),
            }]
        })
    }

    fn test_rsa_key() -> RsaPrivateKey {
        RsaPrivateKey::from_pkcs8_pem(TEST_RSA_KEY_PEM).unwrap()
    }

    fn test_encoding_key() -> EncodingKey {
        let pem = test_rsa_key().to_pkcs8_pem(LineEnding::LF).unwrap();
        EncodingKey::from_rsa_pem(pem.as_bytes()).unwrap()
    }

    const TEST_RSA_KEY_PEM: &str = r"-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC/Wa3MQnrNbKu9
H5+ZH30lrKV3+EJeuY0ofx3qMx73ax+ArHaPFHXq3PUAalSZ+UlBqRmX89DdzwWG
l5hqt3wzGjGe49zxhY5+nUUPLtRiI4JH0iEH4Bg3W9e9gWAAPjVemuYmZ57R9XOd
O1l0aI20mZiy4jeEN7Ls40I/pwyTcB22krOeHz13E1NzG+uDQnaMZkOKomRdTkKr
tiSETBcpacpIdyLtdc9lHR4LbcZtBH3aMosjmgae3uvQyks6ntj0UQZaKNYqNwNE
+GSOqQdtJeoWhps1IYjhc9wcfrlL69nn5U4FXwCcPzGOKXCOW45/BB4nr2WF2Bkq
N7iytDv/AgMBAAECggEABt1BtdUgsKPYWVV8FTMi+yoBWZdnUhyX6r78pL0mvDt0
itok+qcCP+WjSFuII2nk7d0SFPhjIsHdceGYTyO76d1jsE5+S4+9997ObmgAqHCb
qNXp521rkPjTeXHdrsSMh5NI9FG9SczjU92gLOPfSX5FEw24bh7NZWAVrVDhy5wn
BWAZow2kByQ2SLRitUJr+a1xF3UO3PgHLKdP0H0qZp9TCar3nzJxwMUyGJxOcd4f
mElyYNIsJtOBsIIoBsNh+aj5pSjOiuEZmfipbHuMWpjEwF1+UVH4iPXQugyKgFze
Gc8wy3aFlmA4dH2jbSzP3aIwiFUDgqsUrqdyEXVVeQKBgQD5/psH3uk3AOkRC/k/
P6cI5pwFG0rFRe3UgBJFqODnbTZR+0BwyTqf9kCZgi0nJIudCNyUF5utl8rkWdwE
s2s42NibGWTVyb5dabT+dHwP42jFljCxxbZw1D3GmP1mX0ybyXj0BOqWEpMHc76q
ZxzJFfML0FfyTxMVycukBL4bEwKBgQDD8m2Y5GvO17RJDeG6yPupTvWbcBaUTuwe
0w9LOWSOYi3YPAIt7m6yE9XH9cWSFqXMoOAS5Lu1zUuBvwhZz3XAAeL9JpU2F/1V
DW7NiChNb7Np2X1dUHZTS5EmaAkok55uEMfA1N1FhsDfN+qCxVPITUszYwrPCu52
SMd4Nx5s5QKBgQDfK6woTZWyNYzaW+8IyIEL0BqN8HxCOZgD8MTfDNChqHwqmXpA
dVNxg3rNz0kRvW0pJcUMKzsdr/k++v0P8T+RwvszEmtS8sOPTpN16HTsFh3s7ZPQ
z2h7tuzjAqaMIh0YobXpWQ42JKS+rVQTePNYi9CpxjcMqAyokbnKVTWEowKBgFrB
5/eAHVsh19RahKoyOzZRZztGsH6jC4S/d379J1E3skpMiSnjHQyIWWWTtZ4TtVnR
TdgSb8smOonvBJwsljqH5S4h98ylUeZaIW87WId9bFljrkhRY2zzPFjQqSVNMn2C
cjMjpRV189GwIYPOiB7nhiRYBIKfapII5bMNvJ7tAoGACMvtonFh25b7gB7j3Pep
LEH/fA5CRiOs7Plrt2Sv54wAup4Y6+HQ8i/KFOXIejEN9vfY1YRfyD5Ajc05zg90
uE8aLb5YtFvoaLAnc/A2ceW8sNxGgT5aPyLPUdmfSryAO4ayFDHmRlGFRsZtTUbn
Iy60nwnOxK6B5mZV2Cs+kv8=
-----END PRIVATE KEY-----";

    /// Tests that exercise the merged allowlist path through real callback handlers.
    /// These verify that `resolve_allowed_emails` is correctly wired at both call
    /// sites (browser-login branch and oauth-client branch).
    mod merged_allowlist_callback_tests {
        use axum::body::Body;
        use axum::http::{Request, StatusCode, header};
        use serde_json::json;
        use tower::util::ServiceExt;
        use url::Url;
        use wiremock::matchers::{method, path};
        use wiremock::{Mock, MockServer, ResponseTemplate};

        use super::{
            signed_test_id_token, test_auth_config, test_auth_state_with_config,
            test_auth_state_with_mock_google, test_jwks,
        };
        use crate::google::GoogleProvider;
        use crate::routes::router;
        use crate::state::AuthState;
        use crate::types::{AuthorizationRequestRow, BrowserLoginStateRow, RegisteredClient};
        use crate::util::now_unix;

        /// Helper that mounts Google mock endpoints on a fresh server and builds
        /// an `AuthState` with that mock, reusing an existing base state's store
        /// and signing keys (so DB writes made to `base_state.store` are visible).
        async fn state_with_mock_google_from(base_state: &AuthState) -> AuthState {
            let server = Box::leak(Box::new(MockServer::start().await));
            Mock::given(method("POST"))
                .and(path("/token"))
                .respond_with(ResponseTemplate::new(200).set_body_json(json!({
                    "access_token": "google-access-token",
                    "refresh_token": "refresh-token",
                    "expires_in": 3600,
                    "id_token": signed_test_id_token(),
                })))
                .mount(server)
                .await;
            Mock::given(method("GET"))
                .and(path("/certs"))
                .respond_with(ResponseTemplate::new(200).set_body_json(test_jwks()))
                .mount(server)
                .await;
            let google = GoogleProvider::new(
                "client-id".to_string(),
                "client-secret".to_string(),
                Url::parse("https://lab.example.com/auth/google/callback").unwrap(),
            )
            .unwrap()
            .with_endpoints(
                server.uri().parse::<Url>().unwrap(),
                server.uri().parse::<Url>().unwrap().join("/token").unwrap(),
            )
            .with_jwks_endpoint(server.uri().parse::<Url>().unwrap().join("/certs").unwrap());
            AuthState::for_tests(
                (*base_state.config).clone(),
                base_state.store.clone(),
                (*base_state.signing_keys).clone(),
                google,
            )
        }

        /// The mock id_token always returns `user@example.com`. When admin is set
        /// to a *different* email and that address is added to `allowed_users`, the
        /// browser-login callback must succeed (DB row authorises the login).
        #[tokio::test]
        async fn browser_login_succeeds_for_allowlisted_non_admin_email() {
            let mut config = test_auth_config();
            // Set admin to something other than the id_token email.
            config.admin_email = "admin@example.com".to_string();
            let base_state = test_auth_state_with_config(config).await;

            // Insert id_token email into allowed_users.
            base_state
                .store
                .add_allowed_user("user@example.com", "admin", now_unix())
                .await
                .unwrap();

            let state = state_with_mock_google_from(&base_state).await;

            // Seed the browser-login state row so the callback recognises the flow.
            state
                .store
                .insert_browser_login_state(BrowserLoginStateRow {
                    state: "browser-state".to_string(),
                    return_to: "/".to_string(),
                    provider_code_verifier: "provider-verifier".to_string(),
                    created_at: now_unix(),
                    expires_at: now_unix() + 300,
                })
                .await
                .unwrap();

            let app = router(state);
            let response = app
                .oneshot(
                    Request::builder()
                        .uri("/auth/google/callback?state=browser-state&code=upstream-code")
                        .body(Body::empty())
                        .unwrap(),
                )
                .await
                .unwrap();

            // Successful browser login → redirect with a Set-Cookie header (session).
            assert_eq!(response.status(), StatusCode::SEE_OTHER);
            assert!(response.headers().contains_key(header::SET_COOKIE));
        }

        /// Admin email is always authorised even when the `allowed_users` table is
        /// empty (browser-login branch).
        #[tokio::test]
        async fn browser_login_succeeds_for_admin_when_allowed_users_is_empty() {
            // Default test config sets admin_email = "user@example.com", which
            // matches the id_token returned by signed_test_id_token.
            let base_state = test_auth_state_with_mock_google().await;

            // Confirm no extra rows exist.
            assert!(
                base_state
                    .store
                    .list_allowed_users()
                    .await
                    .unwrap()
                    .is_empty()
            );

            // Seed browser-login state.
            base_state
                .store
                .insert_browser_login_state(BrowserLoginStateRow {
                    state: "browser-state-2".to_string(),
                    return_to: "/".to_string(),
                    provider_code_verifier: "provider-verifier".to_string(),
                    created_at: now_unix(),
                    expires_at: now_unix() + 300,
                })
                .await
                .unwrap();

            let app = router(base_state);
            let response = app
                .oneshot(
                    Request::builder()
                        .uri("/auth/google/callback?state=browser-state-2&code=upstream-code")
                        .body(Body::empty())
                        .unwrap(),
                )
                .await
                .unwrap();

            assert_eq!(response.status(), StatusCode::SEE_OTHER);
            assert!(response.headers().contains_key(header::SET_COOKIE));
        }

        /// The oauth-client callback must also succeed for a non-admin email that
        /// exists in `allowed_users`.
        #[tokio::test]
        async fn oauth_client_callback_succeeds_for_allowlisted_non_admin_email() {
            let mut config = test_auth_config();
            config.admin_email = "admin@example.com".to_string();
            let base_state = test_auth_state_with_config(config).await;

            // Register a client.
            base_state
                .store
                .register_client(RegisteredClient {
                    client_id: "client".to_string(),
                    redirect_uris: vec!["http://127.0.0.1:7777/callback".to_string()],
                    created_at: now_unix(),
                })
                .await
                .unwrap();

            // Add id_token email to allowed_users.
            base_state
                .store
                .add_allowed_user("user@example.com", "admin", now_unix())
                .await
                .unwrap();

            let state = state_with_mock_google_from(&base_state).await;

            // Seed an authorization request row.
            state
                .store
                .insert_authorization_request(AuthorizationRequestRow {
                    state: "oauth-state".to_string(),
                    client_id: "client".to_string(),
                    redirect_uri: "http://127.0.0.1:7777/callback".to_string(),
                    client_state: "client-xyz".to_string(),
                    scope: "lab".to_string(),
                    provider_code_verifier: "provider-verifier".to_string(),
                    code_challenge: "challenge".to_string(),
                    code_challenge_method: "S256".to_string(),
                    created_at: now_unix(),
                    expires_at: now_unix() + 300,
                })
                .await
                .unwrap();

            let app = router(state);
            let response = app
                .oneshot(
                    Request::builder()
                        .uri("/auth/google/callback?state=oauth-state&code=upstream-code")
                        .body(Body::empty())
                        .unwrap(),
                )
                .await
                .unwrap();

            // Success: redirect to client callback with `code` param (no `error`).
            assert_eq!(response.status(), StatusCode::SEE_OTHER);
            let location = response
                .headers()
                .get(header::LOCATION)
                .unwrap()
                .to_str()
                .unwrap();
            let redirect = Url::parse(location).unwrap();
            let params: std::collections::HashMap<_, _> = redirect.query_pairs().collect();
            assert!(
                params.contains_key("code"),
                "expected code in redirect: {location}"
            );
            assert!(
                !params.contains_key("error"),
                "unexpected error in redirect: {location}"
            );
        }

        /// Email not in admin or allowed_users must be rejected in the browser-login
        /// branch (401 Unauthorized).
        #[tokio::test]
        async fn browser_login_rejects_email_absent_from_both_admin_and_db() {
            let mut config = test_auth_config();
            // Neither admin nor allowed_users contains "user@example.com" (the id_token email).
            config.admin_email = "admin@example.com".to_string();
            let base_state = test_auth_state_with_config(config).await;

            let state = state_with_mock_google_from(&base_state).await;

            state
                .store
                .insert_browser_login_state(BrowserLoginStateRow {
                    state: "browser-state-3".to_string(),
                    return_to: "/".to_string(),
                    provider_code_verifier: "provider-verifier".to_string(),
                    created_at: now_unix(),
                    expires_at: now_unix() + 300,
                })
                .await
                .unwrap();

            let app = router(state);
            let response = app
                .oneshot(
                    Request::builder()
                        .uri("/auth/google/callback?state=browser-state-3&code=upstream-code")
                        .body(Body::empty())
                        .unwrap(),
                )
                .await
                .unwrap();

            assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
        }

        /// Admin also in the DB table must not appear twice (dedup check via
        /// resolve_allowed_emails, verified indirectly: the callback still succeeds
        /// and there is no panic from duplicate iteration).
        #[tokio::test]
        async fn admin_in_db_table_is_deduped_and_still_authorised() {
            // Default config: admin_email = "user@example.com".
            let base_state = test_auth_state_with_mock_google().await;

            // Also add the admin email to allowed_users — this is the duplicate.
            base_state
                .store
                .add_allowed_user("user@example.com", "self", now_unix())
                .await
                .unwrap();

            // Seed browser-login state.
            base_state
                .store
                .insert_browser_login_state(BrowserLoginStateRow {
                    state: "browser-state-4".to_string(),
                    return_to: "/".to_string(),
                    provider_code_verifier: "provider-verifier".to_string(),
                    created_at: now_unix(),
                    expires_at: now_unix() + 300,
                })
                .await
                .unwrap();

            let app = router(base_state);
            let response = app
                .oneshot(
                    Request::builder()
                        .uri("/auth/google/callback?state=browser-state-4&code=upstream-code")
                        .body(Body::empty())
                        .unwrap(),
                )
                .await
                .unwrap();

            // Must still succeed — dedup should not break the check.
            assert_eq!(response.status(), StatusCode::SEE_OTHER);
            assert!(response.headers().contains_key(header::SET_COOKIE));
        }
    }

    mod allowlist_tests {
        use super::super::check_email_allowlist;

        #[test]
        fn empty_allowlist_permits_any_email() {
            assert!(check_email_allowlist(Some("anyone@example.com"), Some(true), &[]).is_ok());
        }

        #[test]
        fn empty_allowlist_permits_even_unverified_email() {
            // When no allowlist is configured, email_verified is not enforced.
            assert!(check_email_allowlist(Some("anyone@example.com"), Some(false), &[]).is_ok());
        }

        #[test]
        fn matching_verified_email_is_permitted() {
            let list = vec!["alice@example.com".to_string()];
            assert!(check_email_allowlist(Some("alice@example.com"), Some(true), &list).is_ok());
        }

        #[test]
        fn matching_email_is_case_insensitive() {
            // Allowlist is pre-normalized to lowercase at config load.
            // Incoming email from Google may have any case.
            let list = vec!["alice@example.com".to_string()];
            assert!(check_email_allowlist(Some("Alice@Example.com"), Some(true), &list).is_ok());
        }

        #[test]
        fn non_matching_email_is_rejected() {
            let list = vec!["alice@example.com".to_string()];
            assert!(check_email_allowlist(Some("eve@example.com"), Some(true), &list).is_err());
        }

        #[test]
        fn unverified_email_is_rejected_even_when_in_allowlist() {
            let list = vec!["alice@example.com".to_string()];
            assert!(check_email_allowlist(Some("alice@example.com"), Some(false), &list).is_err());
        }

        #[test]
        fn missing_email_verified_claim_is_rejected_when_allowlist_is_set() {
            let list = vec!["alice@example.com".to_string()];
            assert!(check_email_allowlist(Some("alice@example.com"), None, &list).is_err());
        }

        #[test]
        fn none_email_is_rejected_when_allowlist_is_set() {
            let list = vec!["alice@example.com".to_string()];
            assert!(check_email_allowlist(None, Some(true), &list).is_err());
        }
    }
}
