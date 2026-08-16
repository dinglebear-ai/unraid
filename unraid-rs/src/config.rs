use std::collections::HashSet;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(default, deny_unknown_fields)]
pub struct Config {
    pub mcp: McpConfig,
    pub unraid: UnraidConfig,
}

/// Unraid GraphQL API connection config
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(default, deny_unknown_fields)]
pub struct UnraidConfig {
    /// Full GraphQL endpoint URL (UNRAID_API_URL)
    pub api_url: String,
    /// API key for the `x-api-key` header (UNRAID_API_KEY)
    pub api_key: String,
    /// Skip TLS certificate verification (UNRAID_API_SKIP_TLS_VERIFY)
    pub skip_tls_verify: bool,
    /// Path to an extra PEM CA bundle to trust (UNRAID_API_CA_BUNDLE).
    ///
    /// This is the verifying counterpart to `skip_tls_verify`: it lets a
    /// self-signed or private-CA endpoint be trusted *without* disabling
    /// verification. The Python server accepted a bundle path in
    /// `UNRAID_VERIFY_SSL`, so upgraded plugin installs migrate onto this key.
    pub ca_bundle: Option<String>,
}

/// MCP HTTP server configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default, deny_unknown_fields)]
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
#[serde(default, deny_unknown_fields)]
pub struct McpToolsConfig {
    pub enabled: Vec<String>,
    pub disabled: Vec<String>,
}

/// OAuth / auth sub-config (nested under `[mcp.auth]` in config.toml)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default, deny_unknown_fields)]
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

fn data_dir_from_sources(
    unraid_home: Option<std::ffi::OsString>,
    is_container: bool,
    home: Option<std::ffi::OsString>,
) -> std::path::PathBuf {
    if let Some(path) = unraid_home.filter(|value| !value.is_empty()) {
        return std::path::PathBuf::from(path);
    }
    if is_container {
        return std::path::PathBuf::from("/data");
    }
    std::path::PathBuf::from(home.unwrap_or_else(|| std::ffi::OsString::from("/tmp")))
        .join(".unraid")
}

/// Returns the data directory. `UNRAID_HOME` is an explicit override used by
/// native service integrations such as the Unraid plugin; otherwise containers
/// use `/data` and local installs use `~/.unraid/`.
/// Container detection checks for `/.dockerenv` or `RUNNING_IN_CONTAINER`.
pub fn default_data_dir() -> std::path::PathBuf {
    let unraid_home = std::env::var_os("UNRAID_HOME");
    let is_container = std::path::Path::new("/.dockerenv").exists()
        || std::env::var("RUNNING_IN_CONTAINER")
            .map(|v| matches!(v.to_lowercase().as_str(), "1" | "true" | "yes"))
            .unwrap_or(false);
    let home = std::env::var_os("HOME");

    if unraid_home.as_ref().is_none_or(|value| value.is_empty()) && !is_container && home.is_none()
    {
        tracing::warn!(
            "HOME is not set; falling back to /tmp for the data directory — secrets \
             (.env, auth.db, JWT key) will be world-readable and non-persistent. \
             Set HOME (or run in a container, which uses /data) to fix this."
        );
    }

    data_dir_from_sources(unraid_home, is_container, home)
}

/// Load `<UNRAID_HOME>/.env` when explicitly configured, otherwise
/// `~/.unraid/.env` (or `/data/.env` in a container), into the process
/// environment if present.
///
/// A missing file is ignored, and existing NON-EMPTY env vars are not
/// overridden — values injected by docker-compose/systemd or plugin config still
/// take precedence. Empty process values are treated as placeholders and may be
/// filled from `.env`, preventing optional plugin entries from masking persisted
/// credentials or tool policy. A present but malformed file is fatal so a parse
/// error cannot silently skip a later deny rule or credential. Call once at
/// startup before `Config::load`. A symlinked `.env` is refused (the dir holds
/// secrets; mirrors axon).
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
            if let Err(error) = load_dotenv_file(&env_path) {
                eprintln!(
                    "error: failed to parse .env at {}: {error}",
                    env_path.display()
                );
                std::process::exit(1);
            }
        }
        Err(_) => {}
    }
}

fn load_dotenv_file(path: &std::path::Path) -> Result<(), dotenvy::Error> {
    let iter = dotenvy::from_path_iter(path)?;
    let mut seen = HashSet::new();
    for item in iter {
        let (key, value) = item?;
        // Match dotenvy's normal first-declaration-wins behavior.
        if !seen.insert(key.clone()) {
            continue;
        }
        let should_set = std::env::var_os(&key).is_none_or(|existing| existing.is_empty());
        if should_set {
            // SAFETY: load_dotenv() runs once during process startup, before any
            // worker threads or async tasks are created, so environment mutation
            // cannot race another thread.
            unsafe { std::env::set_var(key, value) };
        }
    }
    Ok(())
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
        env_opt_str("UNRAID_API_CA_BUNDLE", &mut config.unraid.ca_bundle);

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

        Ok(config)
    }
}

// ── env helpers ───────────────────────────────────────────────────────────────

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
mod data_dir_tests {
    use super::data_dir_from_sources;
    use std::{ffi::OsString, path::PathBuf};

    #[test]
    fn explicit_unraid_home_wins_over_all_other_sources() {
        assert_eq!(
            data_dir_from_sources(
                Some(OsString::from("/mnt/user/appdata/unraid-mcp")),
                true,
                Some(OsString::from("/home/ignored")),
            ),
            PathBuf::from("/mnt/user/appdata/unraid-mcp")
        );
    }

    #[test]
    fn empty_unraid_home_is_ignored() {
        assert_eq!(
            data_dir_from_sources(
                Some(OsString::new()),
                false,
                Some(OsString::from("/home/jake")),
            ),
            PathBuf::from("/home/jake/.unraid")
        );
    }

    #[test]
    fn container_uses_data_when_no_override_exists() {
        assert_eq!(
            data_dir_from_sources(None, true, Some(OsString::from("/home/ignored"))),
            PathBuf::from("/data")
        );
    }

    #[test]
    fn local_install_uses_home_and_has_a_tmp_fallback() {
        assert_eq!(
            data_dir_from_sources(None, false, Some(OsString::from("/home/jake"))),
            PathBuf::from("/home/jake/.unraid")
        );
        assert_eq!(
            data_dir_from_sources(None, false, None),
            PathBuf::from("/tmp/.unraid")
        );
    }
}
