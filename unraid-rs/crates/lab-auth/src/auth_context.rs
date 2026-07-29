//! Auth context injected into request extensions by [`crate::middleware::AuthLayer`].
//!
//! Downstream handlers can read this when they need caller identity or scope
//! checks, but not every route consumes it yet.

use axum::http::request::Parts;
use std::sync::Arc;

/// Stored in request extensions by the HTTP auth middleware (see
/// [`crate::middleware::AuthLayer`]).
#[derive(Debug, Clone)]
pub struct AuthContext {
    /// JWT `sub` claim (or `"static-bearer"` for static-token requests).
    pub sub: String,
    /// Optional opaque actor key (lab-specific observability hook); produced
    /// by the [`crate::middleware::ActorKeyDeriver`] closure when one is
    /// installed on the layer. Consumers without an actor-key concept
    /// (syslog-mcp etc.) leave this `None`.
    pub actor_key: Option<Arc<str>>,
    /// Effective scopes for this request.
    pub scopes: Vec<String>,
    /// JWT `iss` claim (or `"local"` / `"browser-session"` sentinel).
    pub issuer: String,
    /// `true` when the request was authenticated via the browser session
    /// cookie rather than a bearer token.
    pub via_session: bool,
    /// Browser-session CSRF token, when the request was authenticated via
    /// session cookie. Echoed back to handlers that need to mint a fresh
    /// `x-csrf-token` for follow-up state-changing requests.
    pub csrf_token: Option<String>,
    /// Verified Google email tied to the browser session, when known.
    pub email: Option<String>,
}

/// Build the value of an `WWW-Authenticate: Bearer ...` response header
/// pointing browsers/agents at the protected-resource metadata document.
#[must_use]
pub fn www_authenticate_value(resource_url: &str) -> String {
    format!(
        "Bearer resource_metadata=\"{}/.well-known/oauth-protected-resource\"",
        resource_url.trim_end_matches('/')
    )
}

/// Convenience accessor for handlers that have already split a request into
/// [`Parts`].
#[must_use]
pub fn auth_context(parts: &Parts) -> Option<&AuthContext> {
    parts.extensions.get::<AuthContext>()
}

#[cfg(test)]
mod tests {
    use super::www_authenticate_value;

    #[test]
    fn www_authenticate_value_appends_metadata_path_and_strips_trailing_slash() {
        assert_eq!(
            www_authenticate_value("https://lab.example.com/"),
            "Bearer resource_metadata=\"https://lab.example.com/.well-known/oauth-protected-resource\""
        );
        assert_eq!(
            www_authenticate_value("https://lab.example.com"),
            "Bearer resource_metadata=\"https://lab.example.com/.well-known/oauth-protected-resource\""
        );
    }
}
