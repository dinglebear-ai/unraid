use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct AuthorizationServerMetadata {
    pub issuer: String,
    pub authorization_endpoint: String,
    pub token_endpoint: String,
    pub registration_endpoint: String,
    pub jwks_uri: String,
    pub response_types_supported: Vec<String>,
    pub grant_types_supported: Vec<String>,
    pub code_challenge_methods_supported: Vec<String>,
    pub token_endpoint_auth_methods_supported: Vec<String>,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct ProtectedResourceMetadata {
    pub resource: String,
    pub authorization_servers: Vec<String>,
    pub scopes_supported: Vec<String>,
    pub bearer_methods_supported: Vec<String>,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct ClientRegistrationRequest {
    pub redirect_uris: Vec<String>,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct ClientRegistrationResponse {
    pub client_id: String,
    pub redirect_uris: Vec<String>,
    pub token_endpoint_auth_method: String,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct AuthorizeQuery {
    #[serde(default)]
    pub response_type: String,
    pub client_id: String,
    pub redirect_uri: String,
    pub state: String,
    #[serde(default)]
    pub resource: Option<String>,
    #[serde(default)]
    pub scope: String,
    pub code_challenge: String,
    pub code_challenge_method: String,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct CallbackQuery {
    pub state: String,
    pub code: String,
}

#[derive(Clone, Debug, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct BrowserLoginQuery {
    #[serde(default)]
    pub return_to: Option<String>,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct TokenRequest {
    pub grant_type: String,
    #[serde(default)]
    pub code: Option<String>,
    #[serde(default)]
    pub client_id: Option<String>,
    #[serde(default)]
    pub resource: Option<String>,
    #[serde(default)]
    pub redirect_uri: Option<String>,
    #[serde(default)]
    pub code_verifier: Option<String>,
    #[serde(default)]
    pub refresh_token: Option<String>,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct TokenResponse {
    pub access_token: String,
    pub token_type: String,
    pub expires_in: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub refresh_token: Option<String>,
    pub scope: String,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct RegisteredClient {
    pub client_id: String,
    pub redirect_uris: Vec<String>,
    pub created_at: i64,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct AuthorizationRequestRow {
    pub state: String,
    pub client_id: String,
    pub redirect_uri: String,
    pub client_state: String,
    pub scope: String,
    pub provider_code_verifier: String,
    pub code_challenge: String,
    pub code_challenge_method: String,
    pub created_at: i64,
    pub expires_at: i64,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct AuthorizationCodeRow {
    pub code: String,
    pub client_id: String,
    pub subject: String,
    pub redirect_uri: String,
    pub scope: String,
    pub code_challenge: String,
    pub code_challenge_method: String,
    pub provider_refresh_token: Option<String>,
    pub created_at: i64,
    pub expires_at: i64,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct RefreshTokenRow {
    pub refresh_token: String,
    pub client_id: String,
    pub subject: String,
    pub scope: String,
    pub provider_refresh_token: Option<String>,
    pub created_at: i64,
    pub expires_at: i64,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct BrowserSessionRow {
    pub session_id: String,
    pub subject: String,
    pub email: Option<String>,
    pub csrf_token: String,
    pub created_at: i64,
    pub expires_at: i64,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct BrowserLoginStateRow {
    pub state: String,
    pub return_to: String,
    pub provider_code_verifier: String,
    pub created_at: i64,
    pub expires_at: i64,
}

/// Persisted upstream OAuth credential row.
///
/// The encrypted `token_blob` is `chacha20poly1305(token_response_json)` sealed with a
/// fresh 12-byte nonce per write. `access_token_expires_at` is denormalized for cheap
/// pruning in `cleanup_expired`. `refresh_token_present` enables dropping access-only
/// stale rows while keeping rows that still have a refresh token for re-use (SEC-9).
///
/// `Debug` is implemented manually with redaction — never derive it.
#[derive(Clone)]
pub struct UpstreamOauthCredentialRow {
    pub upstream_name: String,
    pub subject: String,
    pub client_id: String,
    pub granted_scopes_json: String,
    pub token_blob: Vec<u8>,
    pub token_blob_nonce: Vec<u8>,
    pub token_received_at: i64,
    pub access_token_expires_at: i64,
    pub refresh_token_present: bool,
}

impl std::fmt::Debug for UpstreamOauthCredentialRow {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("UpstreamOauthCredentialRow")
            .field("upstream_name", &self.upstream_name)
            .field("subject", &"<redacted>")
            .field("client_id", &self.client_id)
            .field("granted_scopes_json", &self.granted_scopes_json)
            .field("token_blob", &"<redacted>")
            .field("token_blob_nonce", &"<redacted>")
            .field("token_received_at", &self.token_received_at)
            .field("access_token_expires_at", &self.access_token_expires_at)
            .field("refresh_token_present", &self.refresh_token_present)
            .finish()
    }
}

/// Short-lived upstream OAuth state row. Holds the CSRF token and PKCE verifier
/// between `/authorize` redirect and `/callback` redemption.
///
/// `expires_at - created_at` MUST NOT exceed 600 seconds. The persistence helper
/// rejects violations.
///
/// `Debug` is implemented manually with redaction — never derive it (`pkce_verifier`
/// is sensitive).
#[derive(Clone)]
pub struct UpstreamOauthStateRow {
    pub upstream_name: String,
    pub subject: String,
    pub csrf_token: String,
    pub pkce_verifier: String,
    pub created_at: i64,
    pub expires_at: i64,
}

/// A row from the `allowed_users` table.
///
/// Email is always stored and returned in lowercase. `added_by` is the subject
/// of the admin who added the entry. Never log `email` directly — use
/// `util::fingerprint(email)` for safe diagnostic output.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct AllowedUserRow {
    pub email: String,
    pub added_by: String,
    pub created_at: i64,
}

impl std::fmt::Debug for UpstreamOauthStateRow {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("UpstreamOauthStateRow")
            .field("upstream_name", &self.upstream_name)
            .field("subject", &"<redacted>")
            .field("csrf_token", &"<redacted>")
            .field("pkce_verifier", &"<redacted>")
            .field("created_at", &self.created_at)
            .field("expires_at", &self.expires_at)
            .finish()
    }
}
