use std::sync::Arc;

use lab_auth::AuthLayer;

use crate::{app::UnraidService, config::McpConfig, observability::Counters};

pub(crate) mod host_filter;
mod prompts;
mod rmcp_server;
mod routes;
mod schemas;
pub(crate) mod tools;

pub use rmcp_server::{
    rmcp_server, streamable_http_config, streamable_http_service, UnraidRmcpServer,
};
pub use routes::router;
pub use schemas::{data_action_names, write_action_names};

/// Authentication policy attached to [`AppState`].
///
/// Intentionally an enum so constructing an `AppState` requires an explicit
/// choice — there is no `Default` impl.
#[derive(Clone)]
pub enum AuthPolicy {
    /// No authentication. Only legal when bound to a loopback address.
    /// Scope checks are bypassed — the bind itself is the trust boundary.
    LoopbackDev,
    /// Authentication middleware is mounted. Scope checks MUST run.
    /// - `Some(auth_state)`: OAuth mode (Google flow + JWKS issuance)
    /// - `None`: static bearer token only
    Mounted {
        auth_state: Option<Arc<lab_auth::state::AuthState>>,
    },
}

impl std::fmt::Debug for AuthPolicy {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AuthPolicy::LoopbackDev => f.write_str("AuthPolicy::LoopbackDev"),
            AuthPolicy::Mounted {
                auth_state: Some(_),
            } => f.write_str("AuthPolicy::Mounted { auth_state: Some(<AuthState>) }"),
            AuthPolicy::Mounted { auth_state: None } => {
                f.write_str("AuthPolicy::Mounted { auth_state: None /* bearer-only */ }")
            }
        }
    }
}

/// Shared application state injected into every request handler.
#[derive(Clone)]
pub struct AppState {
    pub config: McpConfig,
    pub auth_policy: AuthPolicy,
    pub service: UnraidService,
    /// Shared atomic counters (all clones share the same Arc).
    pub counters: Arc<Counters>,
}

/// Build an [`AuthLayer`] from an [`AuthPolicy`], or `None` for
/// [`AuthPolicy::LoopbackDev`] (loopback bind is the trust boundary).
pub fn build_auth_layer(
    policy: &AuthPolicy,
    static_token: Option<Arc<str>>,
    resource_url: Option<Arc<str>>,
) -> Option<AuthLayer> {
    match policy {
        AuthPolicy::LoopbackDev => None,
        AuthPolicy::Mounted { auth_state } => Some(
            AuthLayer::new()
                .with_static_token(static_token)
                .with_auth_state(auth_state.clone())
                .with_static_token_scopes(vec!["unraid:read".into()])
                .with_resource_url(resource_url)
                .with_allow_session_cookie(false),
        ),
    }
}
