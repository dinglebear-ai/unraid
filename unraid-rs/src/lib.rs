#![recursion_limit = "512"]
pub mod app;
pub mod config;
pub mod graphql;

/// Typed GraphQL operations (cynic) — spike for compile-time query checking.
mod gql_typed;
pub mod logging;
pub mod mcp;

/// Scenario-driven mock of the Unraid GraphQL upstream. Test/dev only.
#[cfg(any(test, feature = "test-support"))]
pub mod mock;

pub mod observability;
pub mod token_limit;

#[cfg(any(test, feature = "test-support"))]
#[doc(hidden)]
pub mod testing {
    use std::sync::Arc;

    use crate::{
        app::UnraidService,
        config::{McpConfig, UnraidConfig},
        graphql::UnraidClient,
        mcp::{AppState, AuthPolicy},
        observability::Counters,
    };

    fn stub_service() -> UnraidService {
        let client = UnraidClient::new(&UnraidConfig {
            api_url: "http://localhost:1/graphql".into(),
            api_key: "test".into(),
            skip_tls_verify: true,
        })
        .expect("stub client should build");
        UnraidService::new(client)
    }

    pub fn loopback_state() -> AppState {
        AppState {
            config: McpConfig::default(),
            auth_policy: AuthPolicy::LoopbackDev,
            service: stub_service(),
            counters: Counters::new(),
        }
    }

    pub fn bearer_state(token: &str) -> AppState {
        AppState {
            config: McpConfig {
                api_token: Some(token.to_string()),
                ..McpConfig::default()
            },
            auth_policy: AuthPolicy::Mounted { auth_state: None },
            service: stub_service(),
            counters: Counters::new(),
        }
    }

    pub async fn oauth_state(data_dir: &std::path::Path) -> AppState {
        let (state, _) = oauth_state_with_auth_state(data_dir).await;
        state
    }

    pub async fn oauth_state_with_auth_state(
        data_dir: &std::path::Path,
    ) -> (AppState, Arc<lab_auth::state::AuthState>) {
        let auth_state = Arc::new(build_auth_state(data_dir).await);
        let state = AppState {
            config: McpConfig {
                auth: crate::config::AuthConfig {
                    public_url: Some("https://unraid.example.com".to_string()),
                    ..Default::default()
                },
                ..McpConfig::default()
            },
            auth_policy: AuthPolicy::Mounted {
                auth_state: Some(auth_state.clone()),
            },
            service: stub_service(),
            counters: Counters::new(),
        };
        (state, auth_state)
    }

    pub async fn build_auth_state(data_dir: &std::path::Path) -> lab_auth::state::AuthState {
        let vars: Vec<(String, String)> = vec![
            ("UNRAID_RMCP_AUTH_MODE".into(), "oauth".into()),
            (
                "UNRAID_RMCP_PUBLIC_URL".into(),
                "https://unraid.example.com".into(),
            ),
            (
                "UNRAID_RMCP_GOOGLE_CLIENT_ID".into(),
                "test-client-id".into(),
            ),
            (
                "UNRAID_RMCP_GOOGLE_CLIENT_SECRET".into(),
                "test-client-secret".into(),
            ),
            (
                "UNRAID_RMCP_AUTH_ADMIN_EMAIL".into(),
                "admin@example.com".into(),
            ),
            (
                "UNRAID_RMCP_AUTH_SQLITE_PATH".into(),
                data_dir.join("auth.db").to_str().unwrap().into(),
            ),
            (
                "UNRAID_RMCP_AUTH_KEY_PATH".into(),
                data_dir.join("auth-jwt.pem").to_str().unwrap().into(),
            ),
        ];

        let auth_config = lab_auth::config::AuthConfigBuilder::new()
            .env_prefix("UNRAID_RMCP")
            .session_cookie_name("unraid_mcp_session")
            .scopes_supported(vec!["unraid:read".into(), "unraid:admin".into()])
            .default_scope("unraid:read")
            .resource_path("/mcp")
            .build_from_sources(vars)
            .expect("test auth config should build");

        lab_auth::state::AuthState::new(auth_config)
            .await
            .expect("test auth state should init")
    }

    // ── test-support wrappers over internal APIs (for integration tests) ──

    /// Build a loopback `AppState` whose upstream client points at `url`
    /// (e.g. a wiremock mock server), instead of the default `localhost:1` stub.
    pub fn state_with_upstream(url: &str) -> AppState {
        let client = UnraidClient::new(&UnraidConfig {
            api_url: url.to_string(),
            api_key: "test".into(),
            skip_tls_verify: true,
        })
        .expect("stub client should build");
        AppState {
            config: McpConfig::default(),
            auth_policy: AuthPolicy::LoopbackDev,
            service: UnraidService::new(client),
            counters: Counters::new(),
        }
    }

    /// Drive the `unraid` tool dispatch by name + args without the transport layer.
    /// The typed error is flattened to its display string for assertions.
    pub async fn execute_tool(
        state: &AppState,
        name: &str,
        args: serde_json::Value,
    ) -> Result<serde_json::Value, String> {
        crate::mcp::tools::execute_tool(state, name, args)
            .await
            .map_err(|e| e.to_string())
    }

    /// Every upstream data action plus the args it needs, derived from the
    /// canonical `ACTIONS` slice so new actions are covered by the scenario and
    /// schema-contract tests automatically. Only the few arg-bearing actions need
    /// an entry in the override map below.
    pub fn upstream_action_calls() -> Vec<(&'static str, serde_json::Value)> {
        use serde_json::json;
        crate::mcp::data_action_names()
            .into_iter()
            .map(|name| {
                let args = match name {
                    "docker_logs" => json!({ "action": "docker_logs", "id": "a1b2c3d4e5f6" }),
                    "log_file" => json!({ "action": "log_file", "path": "/var/log/syslog" }),
                    "api_key" => json!({ "action": "api_key", "id": "abc123:key-001" }),
                    "disk" => json!({ "action": "disk", "id": "disk-1" }),
                    "oidc_provider" => {
                        json!({ "action": "oidc_provider", "id": "oidc-provider-google" })
                    }
                    "ups_device_by_id" => json!({ "action": "ups_device_by_id", "id": "ups-1" }),
                    "plugin_install_operation" => {
                        json!({ "action": "plugin_install_operation", "id": "op-1a2b3c" })
                    }
                    "validate_oidc_session" => {
                        json!({ "action": "validate_oidc_session", "token": "session-token-xyz" })
                    }
                    "get_permissions_for_roles" => {
                        json!({ "action": "get_permissions_for_roles", "roles": ["ADMIN"] })
                    }
                    _ => json!({ "action": name }),
                };
                (name, args)
            })
            .collect()
    }

    /// Every mutating action plus representative args, derived from `ACTIONS`
    /// (write-scoped). Covered by the contract + scenario tests alongside reads.
    pub fn mutation_action_calls() -> Vec<(&'static str, serde_json::Value)> {
        use serde_json::json;
        crate::mcp::write_action_names()
            .into_iter()
            .map(|name| {
                let args = match name {
                    "archive_notification" => {
                        json!({ "action": "archive_notification", "id": "ntf-1" })
                    }
                    "create_notification" => json!({
                        "action": "create_notification",
                        "title": "T", "subject": "S", "description": "D", "importance": "INFO"
                    }),
                    n if n.starts_with("vm_") => json!({ "action": name, "id": "vm-win11" }),
                    "docker_update_all_containers" => json!({ "action": name }),
                    "docker_update_containers" => {
                        json!({ "action": name, "ids": ["docker/abc123"] })
                    }
                    "docker_create_folder" => json!({ "action": name, "name": "Media" }),
                    "docker_create_folder_with_items" => {
                        json!({ "action": name, "name": "Media" })
                    }
                    "docker_set_folder_children" => {
                        json!({ "action": name, "children_ids": ["docker/abc123"] })
                    }
                    "docker_delete_entries" => {
                        json!({ "action": name, "entry_ids": ["docker/abc123"] })
                    }
                    "docker_move_entries_to_folder" => json!({
                        "action": name,
                        "source_entry_ids": ["docker/abc123"],
                        "destination_folder_id": "folder-1"
                    }),
                    "docker_move_items_to_position" => json!({
                        "action": name,
                        "source_entry_ids": ["docker/abc123"],
                        "destination_folder_id": "folder-1",
                        "position": 0
                    }),
                    "docker_rename_folder" => {
                        json!({ "action": name, "folder_id": "folder-1", "new_name": "Media 2" })
                    }
                    "docker_update_view_preferences" => json!({ "action": name, "prefs": {} }),
                    "docker_update_autostart_configuration" => json!({
                        "action": name,
                        "entries": [{ "id": "docker/abc123", "auto_start": true }]
                    }),
                    n if n.starts_with("docker_") => {
                        json!({ "action": name, "id": "docker/abc123" })
                    }
                    "customization_set_locale" => json!({ "action": name, "locale": "en_US" }),
                    "customization_set_theme" => json!({ "action": name, "theme": "black" }),
                    "onboarding_create_internal_boot_pool" => json!({
                        "action": name,
                        "pool_name": "boot",
                        "devices": ["/dev/sdz"],
                        "boot_size_mib": 512,
                        "update_bios": false
                    }),
                    "onboarding_set_onboarding_override" => json!({ "action": name, "input": {} }),
                    "connect_sign_in" => json!({ "action": name, "api_key": "connect-key" }),
                    "setup_remote_access" => json!({ "action": name, "access_type": "DYNAMIC" }),
                    "enable_dynamic_remote_access" => json!({
                        "action": name,
                        "access_url": { "type": "LAN", "name": "tower" },
                        "enabled": true
                    }),
                    "update_ssh_settings" => json!({ "action": name, "enabled": true, "port": 22 }),
                    "initiate_flash_backup" => json!({
                        "action": name,
                        "remote_name": "backup",
                        "source_path": "/boot",
                        "destination_path": "flash-backup"
                    }),
                    "notify_if_unique" => json!({
                        "action": name,
                        "title": "T", "subject": "S", "description": "D", "importance": "INFO"
                    }),
                    "update_settings" => json!({ "action": name, "input": {} }),
                    "array_set_state" => json!({ "action": name, "desired_state": "START" }),
                    "parity_check_start" => json!({ "action": name, "correct": true }),
                    n if n.starts_with("array_") => json!({ "action": name, "id": "disk/sdb" }),
                    "api_key_create" => json!({ "action": name, "name": "k" }),
                    "api_key_add_role" | "api_key_remove_role" => {
                        json!({ "action": name, "api_key_id": "apikey:0001", "role": "VIEWER" })
                    }
                    "api_key_delete" => json!({ "action": name, "ids": ["apikey:0001"] }),
                    "api_key_update" => json!({ "action": name, "id": "apikey:0001" }),
                    "rclone_create_r_clone_remote" => {
                        json!({ "action": name, "name": "r", "type": "b2", "parameters": {} })
                    }
                    "rclone_delete_r_clone_remote" => json!({ "action": name, "name": "r" }),
                    n if n.starts_with("unraid_plugins_install_") => {
                        json!({ "action": name, "url": "https://example.com/p.plg" })
                    }
                    "archive_notifications" | "unarchive_notifications" => {
                        json!({ "action": name, "ids": ["ntf-1"] })
                    }
                    "unread_notification" => json!({ "action": name, "id": "ntf-1" }),
                    "update_server_identity" => json!({ "action": name, "name": "Tower" }),
                    "add_plugin" | "remove_plugin" => json!({
                        "action": name,
                        "input": { "names": ["my.plugin"], "bundled": false, "restart": true }
                    }),
                    _ => json!({ "action": name }),
                };
                (name, args)
            })
            .collect()
    }

    /// Wrapper over the internal `paginate_array` for unit/integration testing.
    pub fn paginate_array(
        data: serde_json::Value,
        path: &[&str],
        limit: usize,
        offset: usize,
        filter: Option<String>,
    ) -> serde_json::Value {
        crate::mcp::tools::paginate::paginate_array(data, path, limit, offset, filter)
    }

    pub fn string_arg(args: &serde_json::Value, name: &str) -> Option<String> {
        crate::mcp::tools::arg_helpers::string_arg(args, name)
    }

    pub fn i64_arg(args: &serde_json::Value, name: &str) -> anyhow::Result<Option<i64>> {
        crate::mcp::tools::arg_helpers::i64_arg(args, name)
    }

    pub fn usize_arg(args: &serde_json::Value, name: &str) -> anyhow::Result<Option<usize>> {
        crate::mcp::tools::arg_helpers::usize_arg(args, name)
    }

    pub fn allowed_hosts(config: &McpConfig) -> Vec<String> {
        crate::mcp::host_filter::allowed_hosts(config)
    }

    pub fn allowed_origins(config: &McpConfig) -> Vec<String> {
        crate::mcp::host_filter::allowed_origins(config)
    }
}
