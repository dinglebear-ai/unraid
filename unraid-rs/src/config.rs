use serde::{Deserialize, Serialize};

use crate::mcp::dynamic::config::{DynamicMcpConfig, validate_dynamic_config};

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(default)]
pub struct Config {
    pub mcp: McpConfig,
    pub unraid: UnraidConfig,
}

/// Unraid GraphQL API connection config
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(default)]
pub struct UnraidConfig {
    /// Full GraphQL endpoint URL (UNRAID_API_URL)
    pub api_url: String,
    /// API key for the `x-api-key` header (UNRAID_API_KEY)
    pub api_key: String,
    /// Skip TLS certificate verification (UNRAID_API_SKIP_TLS_VERIFY)
    pub skip_tls_verify: bool,
}

/// MCP HTTP server configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct McpConfig {
    #[serde(default = "default_mcp_host")]
    pub host: String,
    #[serde(default = "default_mcp_port")]
    pub port: u16,
    #[serde(default = "default_server_name")]
    pub server_name: String,
    /// Disable auth entirely (only legal when bound to loopback)
    pub no_auth: bool,
    /// Static bearer token (UNRAID_RMCP_TOKEN)
    pub api_token: Option<String>,
    pub allowed_hosts: Vec<String>,
    pub allowed_origins: Vec<String>,
    /// Granular MCP tool/action exposure policy.
    pub tools: McpToolsConfig,
    /// Runtime GraphQL schema discovery and generated MCP tool policy.
    pub dynamic: DynamicMcpConfig,
    pub auth: AuthConfig,
}

impl McpConfig {
    pub fn bind_addr(&self) -> String {
        format!("{}:{}", self.host, self.port)
    }
}

/// Granular MCP tool/action filtering (nested under `[mcp.tools]`).
///
/// An empty `enabled` list means all tools/actions are eligible. Entries in
/// `disabled` always win. Selectors may be `*`, `unraid`, `unraid.*`, a
/// bare action such as `docker_logs`, or a qualified action such as
/// `unraid.docker_logs`.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(default)]
pub struct McpToolsConfig {
    pub enabled: Vec<String>,
    pub disabled: Vec<String>,
}

/// OAuth / auth sub-config (nested under `[mcp.auth]` in config.toml)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct AuthConfig {
    pub mode: AuthMode,
    pub public_url: Option<String>,
    pub google_client_id: Option<String>,
    pub google_client_secret: Option<String>,
    pub admin_email: String,
    pub allowed_emails: Vec<String>,
    pub sqlite_path: String,
    pub key_path: String,
    pub access_token_ttl_secs: u64,
    pub refresh_token_ttl_secs: u64,
    pub auth_code_ttl_secs: u64,
    pub register_rpm: u32,
    pub authorize_rpm: u32,
    pub disable_static_token_with_oauth: bool,
    pub allowed_client_redirect_uris: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum AuthMode {
    #[default]
    Bearer,
    OAuth,
}

// ── defaults ──────────────────────────────────────────────────────────────────

/// Returns the data directory: `/data` in containers, `~/.unraid/` locally.
/// Container detection: checks for `/.dockerenv` or `RUNNING_IN_CONTAINER` env.
pub fn default_data_dir() -> std::path::PathBuf {
    if std::path::Path::new("/.dockerenv").exists()
        || std::env::var("RUNNING_IN_CONTAINER")
            .map(|v| matches!(v.to_lowercase().as_str(), "1" | "true" | "yes"))
            .unwrap_or(false)
    {
        std::path::PathBuf::from("/data")
    } else {
        let home = std::env::var("HOME").unwrap_or_else(|_| {
            tracing::warn!(
                "HOME is not set; falling back to /tmp for the data directory — secrets \
                 (.env, auth.db, JWT key) will be world-readable and non-persistent. \
                 Set HOME (or run in a container, which uses /data) to fix this."
            );
            "/tmp".to_string()
        });
        std::path::PathBuf::from(home).join(".unraid")
    }
}

/// Load `~/.unraid/.env` (or `/data/.env` in a container) into the process
/// environment if present.
///
/// Best-effort: a missing file is ignored, and existing env vars are NOT
/// overridden — values injected by docker-compose/systemd or the plugin hook's
/// `CLAUDE_PLUGIN_OPTION_*` mapping still take precedence. This lets the binary
/// find its credentials directly from `~/.unraid/.env` without relying on a
/// process manager. Call once at startup before `Config::load`. A symlinked
/// `.env` is refused (the dir holds secrets; mirrors axon).
pub fn load_dotenv() {
    let env_path = default_data_dir().join(".env");
    match std::fs::symlink_metadata(&env_path) {
        Ok(md) if md.file_type().is_symlink() => {
            eprintln!(
                "error: refusing to load symlinked .env at {} (potential symlink attack)",
                env_path.display()
            );
            std::process::exit(1);
        }
        Ok(_) => {
            let _ = dotenvy::from_path(&env_path);
        }
        Err(_) => {}
    }
}

fn default_mcp_host() -> String {
    "0.0.0.0".into()
}
fn default_mcp_port() -> u16 {
    40010
}
fn default_server_name() -> String {
    "unraid-rmcp".into()
}
fn default_auth_sqlite_path() -> String {
    default_data_dir()
        .join("auth.db")
        .to_string_lossy()
        .into_owned()
}
fn default_auth_key_path() -> String {
    default_data_dir()
        .join("auth-jwt.pem")
        .to_string_lossy()
        .into_owned()
}
fn default_access_token_ttl_secs() -> u64 {
    3600
}
fn default_refresh_token_ttl_secs() -> u64 {
    86400 * 30
}
fn default_auth_code_ttl_secs() -> u64 {
    300
}
fn default_register_rpm() -> u32 {
    10
}
fn default_authorize_rpm() -> u32 {
    60
}

impl Default for McpConfig {
    fn default() -> Self {
        Self {
            host: default_mcp_host(),
            port: default_mcp_port(),
            server_name: default_server_name(),
            no_auth: false,
            api_token: None,
            allowed_hosts: Vec::new(),
            allowed_origins: Vec::new(),
            tools: McpToolsConfig::default(),
            dynamic: DynamicMcpConfig::default(),
            auth: AuthConfig::default(),
        }
    }
}

impl Default for AuthConfig {
    fn default() -> Self {
        Self {
            mode: AuthMode::default(),
            public_url: None,
            google_client_id: None,
            google_client_secret: None,
            admin_email: String::new(),
            allowed_emails: Vec::new(),
            sqlite_path: default_auth_sqlite_path(),
            key_path: default_auth_key_path(),
            access_token_ttl_secs: default_access_token_ttl_secs(),
            refresh_token_ttl_secs: default_refresh_token_ttl_secs(),
            auth_code_ttl_secs: default_auth_code_ttl_secs(),
            register_rpm: default_register_rpm(),
            authorize_rpm: default_authorize_rpm(),
            disable_static_token_with_oauth: true,
            allowed_client_redirect_uris: Vec::new(),
        }
    }
}

// ── Config loading ────────────────────────────────────────────────────────────

impl Config {
    pub fn load() -> anyhow::Result<Self> {
        let mut config = Config::default();

        match std::fs::read_to_string("config.toml") {
            Ok(contents) => {
                config = toml::from_str(&contents)
                    .map_err(|e| anyhow::anyhow!("Failed to parse config.toml: {e}"))?;
            }
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => {}
            Err(e) => return Err(anyhow::anyhow!("Failed to read config.toml: {e}")),
        }

        // Env overrides (UNRAID_RMCP_* prefix)
        env_str("UNRAID_RMCP_HOST", &mut config.mcp.host);
        env_parse("UNRAID_RMCP_PORT", &mut config.mcp.port)?;
        env_bool("UNRAID_RMCP_NO_AUTH", &mut config.mcp.no_auth)?;
        env_opt_str("UNRAID_RMCP_TOKEN", &mut config.mcp.api_token);
        env_list("UNRAID_RMCP_ALLOWED_HOSTS", &mut config.mcp.allowed_hosts);
        env_list(
            "UNRAID_RMCP_ALLOWED_ORIGINS",
            &mut config.mcp.allowed_origins,
        );
        env_tool_selector_list("UNRAID_RMCP_ENABLED_TOOLS", &mut config.mcp.tools.enabled)?;
        env_tool_selector_list("UNRAID_RMCP_DISABLED_TOOLS", &mut config.mcp.tools.disabled)?;
        apply_dynamic_env(&mut config.mcp.dynamic)?;
        env_opt_str("UNRAID_RMCP_PUBLIC_URL", &mut config.mcp.auth.public_url);
        env_str(
            "UNRAID_RMCP_AUTH_ADMIN_EMAIL",
            &mut config.mcp.auth.admin_email,
        );
        env_opt_str(
            "UNRAID_RMCP_GOOGLE_CLIENT_ID",
            &mut config.mcp.auth.google_client_id,
        );
        env_opt_str(
            "UNRAID_RMCP_GOOGLE_CLIENT_SECRET",
            &mut config.mcp.auth.google_client_secret,
        );
        if let Ok(v) = std::env::var("UNRAID_RMCP_AUTH_MODE")
            && !v.is_empty()
        {
            config.mcp.auth.mode = match v.to_lowercase().as_str() {
                "oauth" => AuthMode::OAuth,
                _ => AuthMode::Bearer,
            };
        }

        // Unraid API
        env_str("UNRAID_API_URL", &mut config.unraid.api_url);
        env_str("UNRAID_API_KEY", &mut config.unraid.api_key);
        env_bool(
            "UNRAID_API_SKIP_TLS_VERIFY",
            &mut config.unraid.skip_tls_verify,
        )?;

        // Honour UNRAID_RMCP_DISABLE_HTTP_AUTH from the existing .env
        if std::env::var("UNRAID_RMCP_DISABLE_HTTP_AUTH")
            .map(|v| matches!(v.to_lowercase().as_str(), "1" | "true" | "yes"))
            .unwrap_or(false)
        {
            config.mcp.no_auth = true;
        }

        // UNRAID_NOAUTH=true is the explicit "I know what I'm doing" override
        // that bypasses the non-loopback bind safety check in main.rs.
        // It does NOT set no_auth itself — it merely permits it.
        // (auth gating is handled in build_auth_policy; this flag is read in main.rs)

        crate::mcp::validate_tool_config(&config.mcp.tools)
            .map_err(|error| anyhow::anyhow!("Invalid MCP tool configuration: {error}"))?;
        validate_dynamic_config(&config.mcp.dynamic)
            .map_err(|error| anyhow::anyhow!("Invalid dynamic MCP configuration: {error}"))?;

        Ok(config)
    }
}

// ── env helpers ───────────────────────────────────────────────────────────────

fn apply_dynamic_env(config: &mut DynamicMcpConfig) -> anyhow::Result<()> {
    apply_dynamic_env_with(config, |key| std::env::var(key).ok())
}

fn apply_dynamic_env_with<F>(config: &mut DynamicMcpConfig, mut get: F) -> anyhow::Result<()>
where
    F: FnMut(&str) -> Option<String>,
{
    if let Some(value) = nonempty_env(&mut get, "UNRAID_RMCP_DYNAMIC_ENABLED") {
        config.enabled = parse_bool_value("UNRAID_RMCP_DYNAMIC_ENABLED", &value)?;
    }
    if let Some(value) = nonempty_env(&mut get, "UNRAID_RMCP_DYNAMIC_SURFACE") {
        config.surface = match value.to_ascii_lowercase().as_str() {
            "legacy" => crate::mcp::dynamic::config::DynamicSurface::Legacy,
            "expanded" => crate::mcp::dynamic::config::DynamicSurface::Expanded,
            "hybrid" => crate::mcp::dynamic::config::DynamicSurface::Hybrid,
            _ => anyhow::bail!(
                "UNRAID_RMCP_DYNAMIC_SURFACE: expected legacy, expanded, or hybrid, got {value:?}"
            ),
        };
    }
    if let Some(value) = nonempty_env(&mut get, "UNRAID_RMCP_DYNAMIC_REFRESH_INTERVAL") {
        config.refresh_interval =
            humantime_serde::re::humantime::parse_duration(&value).map_err(|error| {
                anyhow::anyhow!(
                    "UNRAID_RMCP_DYNAMIC_REFRESH_INTERVAL: invalid duration {value:?}: {error}"
                )
            })?;
    }
    if let Some(value) = nonempty_env(&mut get, "UNRAID_RMCP_DYNAMIC_AUTO_ENABLE_QUERIES") {
        config.auto_enable_queries =
            parse_bool_value("UNRAID_RMCP_DYNAMIC_AUTO_ENABLE_QUERIES", &value)?;
    }
    if let Some(value) = nonempty_env(&mut get, "UNRAID_RMCP_DYNAMIC_AUTO_ENABLE_MUTATIONS") {
        config.auto_enable_mutations =
            parse_bool_value("UNRAID_RMCP_DYNAMIC_AUTO_ENABLE_MUTATIONS", &value)?;
    }
    if let Some(value) = nonempty_env(&mut get, "UNRAID_RMCP_DYNAMIC_CACHE_PATH") {
        config.cache_path = value.into();
    }
    Ok(())
}

fn nonempty_env<F>(get: &mut F, key: &str) -> Option<String>
where
    F: FnMut(&str) -> Option<String>,
{
    get(key).filter(|value| !value.is_empty())
}

fn parse_bool_value(key: &str, value: &str) -> anyhow::Result<bool> {
    match value.to_ascii_lowercase().as_str() {
        "1" | "true" | "yes" => Ok(true),
        "0" | "false" | "no" => Ok(false),
        _ => anyhow::bail!("{key}: expected bool, got {value:?}"),
    }
}

fn env_str(key: &str, target: &mut String) {
    if let Ok(v) = std::env::var(key)
        && !v.is_empty()
    {
        *target = v;
    }
}

fn env_opt_str(key: &str, target: &mut Option<String>) {
    if let Ok(v) = std::env::var(key)
        && !v.is_empty()
    {
        *target = Some(v);
    }
}

fn env_parse<T: std::str::FromStr>(key: &str, target: &mut T) -> anyhow::Result<()> {
    if let Ok(v) = std::env::var(key)
        && !v.is_empty()
    {
        *target = v
            .parse()
            .map_err(|_| anyhow::anyhow!("{key}: invalid value {v:?}"))?;
    }
    Ok(())
}

fn env_bool(key: &str, target: &mut bool) -> anyhow::Result<()> {
    if let Ok(v) = std::env::var(key) {
        match v.to_lowercase().as_str() {
            "1" | "true" | "yes" => *target = true,
            "0" | "false" | "no" => *target = false,
            other => anyhow::bail!("{key}: expected bool, got {other:?}"),
        }
    }
    Ok(())
}

/// Env override for the two `[mcp.tools]` selector lists ONLY — the generic
/// `env_list` semantics are deliberately not reused here:
///
/// - Set to the empty string `""` → treated as unset (the toml value stays).
///   The agent plugin's `.mcp.json` passes `""` for both vars by default, so
///   empty MUST NOT be an error or default plugin installs would fail to start.
/// - Set, non-empty, but parsing to ZERO selectors (whitespace/commas only,
///   e.g. `","`) → fail config load. The operator visibly set a policy and it
///   would otherwise silently do nothing.
/// - Otherwise the parsed selectors REPLACE the `[mcp.tools]` toml list — env
///   and toml are never merged. A set env var is the complete policy for that
///   list (documented in README.md, .env.example, and config.toml).
fn env_tool_selector_list(key: &str, target: &mut Vec<String>) -> anyhow::Result<()> {
    let Ok(v) = std::env::var(key) else {
        return Ok(());
    };
    if v.is_empty() {
        return Ok(());
    }
    let items: Vec<String> = v
        .split(',')
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect();
    if items.is_empty() {
        anyhow::bail!(
            "{key}: value {v:?} contains no selectors; \
             unset the variable or provide comma-separated selectors"
        );
    }
    *target = items;
    Ok(())
}

fn env_list(key: &str, target: &mut Vec<String>) {
    if let Ok(v) = std::env::var(key) {
        let items: Vec<String> = v
            .split(',')
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .collect();
        if !items.is_empty() {
            *target = items;
        }
    }
}

#[cfg(test)]
mod tests {
    use std::{collections::BTreeMap, time::Duration};

    use super::*;
    use crate::mcp::dynamic::config::{DynamicSurface, StartupFailureMode};

    #[test]
    fn mcp_config_defaults_disable_dynamic_tools() {
        let config = McpConfig::default();
        assert!(!config.dynamic.enabled);
        assert_eq!(config.dynamic.surface, DynamicSurface::Hybrid);
    }

    #[test]
    fn nested_dynamic_toml_parses_with_operation_override() {
        let config: Config = toml::from_str(
            r#"
            [mcp.dynamic]
            enabled = true
            surface = "expanded"
            refresh_interval = "30m"
            startup_failure = "empty_dynamic"

            [mcp.dynamic.operations."mutation.vm.start"]
            enabled = true
            destructive = true
            "#,
        )
        .expect("valid nested dynamic MCP config");

        assert!(config.mcp.dynamic.enabled);
        assert_eq!(config.mcp.dynamic.surface, DynamicSurface::Expanded);
        assert_eq!(
            config.mcp.dynamic.refresh_interval,
            Duration::from_secs(1800)
        );
        assert_eq!(
            config.mcp.dynamic.startup_failure,
            StartupFailureMode::EmptyDynamic
        );
        let vm_start = &config.mcp.dynamic.operations["mutation.vm.start"];
        assert_eq!(vm_start.enabled, Some(true));
        assert_eq!(vm_start.destructive, Some(true));
    }

    #[test]
    fn nested_dynamic_confirmation_field_is_rejected() {
        let error = toml::from_str::<Config>(
            r#"
            [mcp.dynamic.operations."mutation.vm.start"]
            enabled = true
            confirmation = "required"
            "#,
        )
        .expect_err("confirmation is not a supported dynamic MCP field");

        assert!(error.to_string().contains("confirmation"));
    }

    #[test]
    fn dynamic_env_overrides_have_expected_precedence() {
        let values = BTreeMap::from([
            ("UNRAID_RMCP_DYNAMIC_ENABLED", "true".to_string()),
            ("UNRAID_RMCP_DYNAMIC_SURFACE", "legacy".to_string()),
            ("UNRAID_RMCP_DYNAMIC_REFRESH_INTERVAL", "15m".to_string()),
            (
                "UNRAID_RMCP_DYNAMIC_AUTO_ENABLE_QUERIES",
                "false".to_string(),
            ),
            (
                "UNRAID_RMCP_DYNAMIC_AUTO_ENABLE_MUTATIONS",
                "true".to_string(),
            ),
            (
                "UNRAID_RMCP_DYNAMIC_CACHE_PATH",
                "/tmp/dynamic-cache.json".to_string(),
            ),
        ]);
        let mut config = DynamicMcpConfig::default();

        apply_dynamic_env_with(&mut config, |key| values.get(key).cloned())
            .expect("valid dynamic env overrides");

        assert!(config.enabled);
        assert_eq!(config.surface, DynamicSurface::Legacy);
        assert_eq!(config.refresh_interval, Duration::from_secs(15 * 60));
        assert!(!config.auto_enable_queries);
        assert!(config.auto_enable_mutations);
        assert_eq!(
            config.cache_path,
            std::path::Path::new("/tmp/dynamic-cache.json")
        );
    }

    #[test]
    fn dynamic_env_rejects_invalid_surface() {
        let mut config = DynamicMcpConfig::default();
        let error = apply_dynamic_env_with(&mut config, |key| {
            (key == "UNRAID_RMCP_DYNAMIC_SURFACE").then(|| "sideways".to_string())
        })
        .expect_err("unknown dynamic surface must fail");

        assert!(error.to_string().contains("UNRAID_RMCP_DYNAMIC_SURFACE"));
        assert!(error.to_string().contains("sideways"));
    }
}
