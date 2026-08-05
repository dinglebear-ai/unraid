use std::sync::Arc;

use lab_auth::AuthLayer;

use crate::{app::UnraidService, config::McpConfig, observability::Counters};

use self::dynamic::refresh::DynamicRuntime;

pub mod dynamic;
mod elicitation;
pub(crate) mod host_filter;
mod prompts;
mod rmcp_server;
mod routes;
mod schemas;
mod tool_filter;
pub(crate) mod tools;

pub use rmcp_server::{
    UnraidRmcpServer, rmcp_server, streamable_http_config, streamable_http_service,
};
pub use routes::router;
pub use schemas::{all_action_names, data_action_names, write_action_names};
pub(crate) use tool_filter::validate_tool_config;

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
    /// Runtime-generated MCP state, absent when dynamic mode is disabled.
    pub dynamic: Option<DynamicRuntime>,
}

impl AppState {
    /// Construct application state and derive optional dynamic runtime from config.
    pub fn new(
        config: McpConfig,
        auth_policy: AuthPolicy,
        service: UnraidService,
        counters: Arc<Counters>,
    ) -> Self {
        let dynamic = DynamicRuntime::from_config(&config.dynamic);
        Self {
            config,
            auth_policy,
            service,
            counters,
            dynamic,
        }
    }
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
                .with_static_token_scopes(vec!["unraid:admin".into()])
                .with_resource_url(resource_url)
                .with_allow_session_cookie(false),
        ),
    }
}

#[cfg(test)]
mod tests {
    use crate::{
        app::UnraidService,
        config::{McpConfig, UnraidConfig},
        graphql::UnraidClient,
        observability::Counters,
    };

    use super::{AppState, AuthPolicy};

    fn service() -> UnraidService {
        let client = UnraidClient::new(&UnraidConfig {
            api_url: "http://localhost:1/graphql".to_string(),
            api_key: "test".to_string(),
            skip_tls_verify: true,
        })
        .expect("test client");
        UnraidService::new(client)
    }

    #[test]
    fn dynamic_app_state_runtime_follows_configuration() {
        let disabled = AppState::new(
            McpConfig::default(),
            AuthPolicy::LoopbackDev,
            service(),
            Counters::new(),
        );
        assert!(disabled.dynamic.is_none());

        let mut enabled_config = McpConfig::default();
        enabled_config.dynamic.enabled = true;
        let enabled = AppState::new(
            enabled_config,
            AuthPolicy::LoopbackDev,
            service(),
            Counters::new(),
        );
        assert!(enabled.dynamic.is_some());
        assert!(enabled.dynamic.unwrap().catalogs.load().by_path.is_empty());
    }
}
