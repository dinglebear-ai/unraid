use std::collections::HashMap;
use std::path::PathBuf;
use std::time::Duration;

use serde::{Deserialize, Serialize};
use url::Url;

use crate::error::AuthError;

const DEFAULT_CALLBACK_PATH: &str = "/auth/google/callback";
const DEFAULT_AUTH_DB_NAME: &str = "auth.db";
const DEFAULT_KEY_NAME: &str = "auth-jwt.pem";
const DEFAULT_ACCESS_TOKEN_TTL_SECS: u64 = 3600;
const DEFAULT_REFRESH_TOKEN_TTL_SECS: u64 = 30 * 24 * 3600;
const DEFAULT_AUTH_CODE_TTL_SECS: u64 = 300;
const DEFAULT_REGISTER_REQUESTS_PER_MINUTE: u32 = 20;
const DEFAULT_AUTHORIZE_REQUESTS_PER_MINUTE: u32 = 60;
const DEFAULT_MAX_PENDING_OAUTH_STATES: usize = 1024;

/// Default env-var prefix used when consumers do not specify one.
/// Backward-compatible with the original `LAB_*` env scheme.
pub const DEFAULT_ENV_PREFIX: &str = "LAB";
/// Default browser session cookie name (preserved for the lab consumer).
pub const DEFAULT_SESSION_COOKIE_NAME: &str = "lab_session";
/// Default OAuth scope label applied when callers do not request one.
pub const DEFAULT_SCOPE: &str = "lab";
/// Default protected resource path (canonical MCP endpoint).
pub const DEFAULT_RESOURCE_PATH: &str = "/mcp";
/// Default browser login path mounted by the auth router.
pub const DEFAULT_LOGIN_PATH: &str = "/auth/login";

#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AuthMode {
    #[default]
    Bearer,
    OAuth,
}

impl AuthMode {
    fn parse(value: Option<&str>, env_key_for_diagnostics: &str) -> Result<Self, AuthError> {
        match value
            .unwrap_or("bearer")
            .trim()
            .to_ascii_lowercase()
            .as_str()
        {
            "bearer" => Ok(Self::Bearer),
            "oauth" => Ok(Self::OAuth),
            other => Err(AuthError::Config(format!(
                "{env_key_for_diagnostics} must be `bearer` or `oauth`, got `{other}`"
            ))),
        }
    }
}

#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct AuthModeConfig {
    pub mode: AuthMode,
}

impl AuthModeConfig {
    pub fn from_sources(
        vars: impl IntoIterator<Item = (String, String)>,
    ) -> Result<Self, AuthError> {
        Self::from_sources_with_prefix(vars, DEFAULT_ENV_PREFIX)
    }

    pub fn from_sources_with_prefix(
        vars: impl IntoIterator<Item = (String, String)>,
        env_prefix: &str,
    ) -> Result<Self, AuthError> {
        let vars = normalize(vars);
        let key = env_key(env_prefix, "AUTH_MODE");
        Ok(Self {
            mode: AuthMode::parse(vars.get(&key).map(String::as_str), &key)?,
        })
    }
}

#[derive(Clone, Debug, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct GoogleConfig {
    #[serde(default)]
    pub client_id: String,
    #[serde(default)]
    pub client_secret: String,
    #[serde(default = "default_callback_path")]
    pub callback_path: String,
    #[serde(default = "default_google_scopes")]
    pub scopes: Vec<String>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct AuthConfig {
    pub mode: AuthMode,
    pub public_url: Option<Url>,
    pub sqlite_path: PathBuf,
    pub key_path: PathBuf,
    pub bootstrap_secret: Option<String>,
    pub allowed_client_redirect_uris: Vec<String>,
    /// Single bootstrap admin email permitted to log in via Google OAuth.
    /// Required when `mode == AuthMode::OAuth`. Additional users will be
    /// granted access through a future SQLite-backed allowlist managed via
    /// the web UI.
    pub admin_email: String,
    pub google: GoogleConfig,
    pub access_token_ttl: Duration,
    pub refresh_token_ttl: Duration,
    pub auth_code_ttl: Duration,
    pub register_requests_per_minute: u32,
    pub authorize_requests_per_minute: u32,
    pub max_pending_oauth_states: usize,

    // ---- Brand / consumer-specific parameterization (see L1 bead) ----
    /// Env var prefix used for diagnostics (e.g. `"LAB"`, `"SYSLOG_MCP"`).
    /// Set via [`AuthConfigBuilder::env_prefix`] BEFORE any env reads.
    pub env_prefix: String,
    /// Default base directory for `auth.db` and `auth-jwt.pem` when the
    /// corresponding env vars are unset.
    pub default_data_dir: PathBuf,
    /// Browser session cookie name. Lab consumer leaves this at the default
    /// (`"lab_session"`); other consumers override with their own brand.
    pub session_cookie_name: String,
    /// Scopes advertised on `/.well-known/oauth-authorization-server` and
    /// `/.well-known/oauth-protected-resource`.
    pub scopes_supported: Vec<String>,
    /// Path appended to `public_url` to form the canonical resource URL
    /// returned in the protected-resource metadata document.
    pub resource_path: String,
    /// Default scope applied when `/authorize` requests omit one and the
    /// only scope accepted by the legacy single-scope validator.
    pub default_scope: String,
    /// Scopes minted into the static-bearer-derived AuthContext so legacy
    /// admin tools keep functioning when the dual-mode middleware (L2) is
    /// deployed. Lab keeps the legacy `["lab:read","lab:admin"]` defaults;
    /// syslog-mcp will override with `["syslog:read","syslog:admin"]`.
    pub static_token_scopes: Vec<String>,
    /// Path of the browser login route (typically `/auth/login`).
    pub login_path: String,
    /// Whether `POST /register` (RFC 7591 dynamic client registration) is
    /// mounted. Defaults to `false` (closed) — opt-in per consumer.
    pub enable_dynamic_registration: bool,
    /// When `true`, dual-mode middleware MUST reject the static bearer
    /// token whenever OAuth is active. Defaults to `false` (lab keeps the
    /// historical break-glass behavior); syslog-mcp overrides to `true`.
    pub disable_static_token_with_oauth: bool,
}

impl Default for AuthConfig {
    fn default() -> Self {
        let base_dir = default_auth_dir();
        Self {
            mode: AuthMode::Bearer,
            public_url: None,
            sqlite_path: base_dir.join(DEFAULT_AUTH_DB_NAME),
            key_path: base_dir.join(DEFAULT_KEY_NAME),
            bootstrap_secret: None,
            allowed_client_redirect_uris: Vec::new(),
            admin_email: String::new(),
            google: GoogleConfig::default(),
            access_token_ttl: Duration::from_secs(DEFAULT_ACCESS_TOKEN_TTL_SECS),
            refresh_token_ttl: Duration::from_secs(DEFAULT_REFRESH_TOKEN_TTL_SECS),
            auth_code_ttl: Duration::from_secs(DEFAULT_AUTH_CODE_TTL_SECS),
            register_requests_per_minute: DEFAULT_REGISTER_REQUESTS_PER_MINUTE,
            authorize_requests_per_minute: DEFAULT_AUTHORIZE_REQUESTS_PER_MINUTE,
            max_pending_oauth_states: DEFAULT_MAX_PENDING_OAUTH_STATES,
            env_prefix: DEFAULT_ENV_PREFIX.to_string(),
            default_data_dir: base_dir,
            session_cookie_name: DEFAULT_SESSION_COOKIE_NAME.to_string(),
            scopes_supported: vec![DEFAULT_SCOPE.to_string()],
            resource_path: DEFAULT_RESOURCE_PATH.to_string(),
            default_scope: DEFAULT_SCOPE.to_string(),
            static_token_scopes: vec!["lab:read".to_string(), "lab:admin".to_string()],
            login_path: DEFAULT_LOGIN_PATH.to_string(),
            enable_dynamic_registration: false,
            disable_static_token_with_oauth: false,
        }
    }
}

impl AuthConfig {
    /// Backward-compatible convenience: read env vars using the default
    /// `LAB` prefix. Equivalent to `AuthConfigBuilder::new().build_from_sources(vars)`.
    pub fn from_sources(
        vars: impl IntoIterator<Item = (String, String)>,
    ) -> Result<Self, AuthError> {
        AuthConfigBuilder::new().build_from_sources(vars)
    }

    fn validate(&self) -> Result<(), AuthError> {
        let prefix = &self.env_prefix;
        if !self.google.callback_path.starts_with('/') {
            return Err(AuthError::Config(format!(
                "{prefix}_GOOGLE_CALLBACK_PATH must start with `/`, got `{}`",
                self.google.callback_path
            )));
        }

        if !self.resource_path.starts_with('/') {
            return Err(AuthError::Config(format!(
                "resource_path must start with `/`, got `{}`",
                self.resource_path
            )));
        }
        if !self.login_path.starts_with('/') {
            return Err(AuthError::Config(format!(
                "login_path must start with `/`, got `{}`",
                self.login_path
            )));
        }
        if self.session_cookie_name.is_empty() {
            return Err(AuthError::Config(
                "session_cookie_name must not be empty".to_string(),
            ));
        }
        if self.default_scope.is_empty() {
            return Err(AuthError::Config(
                "default_scope must not be empty".to_string(),
            ));
        }
        if self.scopes_supported.is_empty() {
            return Err(AuthError::Config(
                "scopes_supported must contain at least one scope".to_string(),
            ));
        }

        if matches!(self.mode, AuthMode::OAuth) {
            if self.public_url.is_none() {
                return Err(AuthError::Config(format!(
                    "{prefix}_PUBLIC_URL is required when {prefix}_AUTH_MODE=oauth"
                )));
            }
            if self.google.client_id.is_empty() {
                return Err(AuthError::Config(format!(
                    "{prefix}_GOOGLE_CLIENT_ID is required when {prefix}_AUTH_MODE=oauth"
                )));
            }
            if self.google.client_secret.is_empty() {
                return Err(AuthError::Config(format!(
                    "{prefix}_GOOGLE_CLIENT_SECRET is required when {prefix}_AUTH_MODE=oauth"
                )));
            }
            if self.admin_email.is_empty() {
                return Err(AuthError::Config(format!(
                    "{prefix}_AUTH_ADMIN_EMAIL is required when {prefix}_AUTH_MODE=oauth — \
                     set the Google email of the bootstrap admin so no account \
                     can log in unless explicitly permitted"
                )));
            }
        }

        Ok(())
    }
}

/// Consuming builder for [`AuthConfig`]. The `env_prefix` MUST be set BEFORE
/// any env-driven `build_*` call; builder methods themselves do not read env.
///
/// ```ignore
/// let cfg = AuthConfigBuilder::new()
///     .env_prefix("SYSLOG_MCP")
///     .session_cookie_name("syslog_session")
///     .scopes_supported(vec!["syslog:read".to_string(), "syslog:admin".to_string()])
///     .resource_path("/mcp")
///     .default_scope("syslog:read")
///     .static_token_scopes(vec!["syslog:read".to_string(), "syslog:admin".to_string()])
///     .disable_static_token_with_oauth(true)
///     .build_from_sources(std::env::vars())?;
/// ```
#[derive(Clone, Debug)]
pub struct AuthConfigBuilder {
    env_prefix: String,
    default_data_dir: Option<PathBuf>,
    session_cookie_name: String,
    scopes_supported: Vec<String>,
    resource_path: String,
    default_scope: String,
    static_token_scopes: Vec<String>,
    login_path: String,
    enable_dynamic_registration: bool,
    disable_static_token_with_oauth: bool,
}

impl Default for AuthConfigBuilder {
    fn default() -> Self {
        Self::new()
    }
}

impl AuthConfigBuilder {
    pub fn new() -> Self {
        Self {
            env_prefix: DEFAULT_ENV_PREFIX.to_string(),
            default_data_dir: None,
            session_cookie_name: DEFAULT_SESSION_COOKIE_NAME.to_string(),
            scopes_supported: vec![DEFAULT_SCOPE.to_string()],
            resource_path: DEFAULT_RESOURCE_PATH.to_string(),
            default_scope: DEFAULT_SCOPE.to_string(),
            static_token_scopes: vec!["lab:read".to_string(), "lab:admin".to_string()],
            login_path: DEFAULT_LOGIN_PATH.to_string(),
            enable_dynamic_registration: false,
            disable_static_token_with_oauth: false,
        }
    }

    #[must_use]
    pub fn env_prefix(mut self, prefix: impl Into<String>) -> Self {
        self.env_prefix = prefix.into();
        self
    }

    #[must_use]
    pub fn default_data_dir(mut self, dir: impl Into<PathBuf>) -> Self {
        self.default_data_dir = Some(dir.into());
        self
    }

    #[must_use]
    pub fn session_cookie_name(mut self, name: impl Into<String>) -> Self {
        self.session_cookie_name = name.into();
        self
    }

    #[must_use]
    pub fn scopes_supported(mut self, scopes: Vec<String>) -> Self {
        self.scopes_supported = scopes;
        self
    }

    #[must_use]
    pub fn resource_path(mut self, path: impl Into<String>) -> Self {
        self.resource_path = path.into();
        self
    }

    #[must_use]
    pub fn default_scope(mut self, scope: impl Into<String>) -> Self {
        self.default_scope = scope.into();
        self
    }

    #[must_use]
    pub fn static_token_scopes(mut self, scopes: Vec<String>) -> Self {
        self.static_token_scopes = scopes;
        self
    }

    #[must_use]
    pub fn login_path(mut self, path: impl Into<String>) -> Self {
        self.login_path = path.into();
        self
    }

    #[must_use]
    pub const fn enable_dynamic_registration(mut self, enabled: bool) -> Self {
        self.enable_dynamic_registration = enabled;
        self
    }

    #[must_use]
    pub const fn disable_static_token_with_oauth(mut self, disabled: bool) -> Self {
        self.disable_static_token_with_oauth = disabled;
        self
    }

    /// Read configuration from the supplied env-style key/value pairs using
    /// the configured `env_prefix`, then validate and return [`AuthConfig`].
    pub fn build_from_sources(
        self,
        vars: impl IntoIterator<Item = (String, String)>,
    ) -> Result<AuthConfig, AuthError> {
        let vars = normalize(vars);
        let prefix = self.env_prefix.clone();
        let key_mode = env_key(&prefix, "AUTH_MODE");
        let key_admin = env_key(&prefix, "AUTH_ADMIN_EMAIL");
        let key_public_url = env_key(&prefix, "PUBLIC_URL");
        let key_db = env_key(&prefix, "AUTH_SQLITE_PATH");
        let key_keypath = env_key(&prefix, "AUTH_KEY_PATH");
        let key_secret = env_key(&prefix, "AUTH_BOOTSTRAP_SECRET");
        let key_redirects = env_key(&prefix, "AUTH_ALLOWED_REDIRECT_URIS");
        let key_g_id = env_key(&prefix, "GOOGLE_CLIENT_ID");
        let key_g_secret = env_key(&prefix, "GOOGLE_CLIENT_SECRET");
        let key_g_callback = env_key(&prefix, "GOOGLE_CALLBACK_PATH");
        let key_g_scopes = env_key(&prefix, "GOOGLE_SCOPES");
        let key_at_ttl = env_key(&prefix, "AUTH_ACCESS_TOKEN_TTL_SECS");
        let key_rt_ttl = env_key(&prefix, "AUTH_REFRESH_TOKEN_TTL_SECS");
        let key_code_ttl = env_key(&prefix, "AUTH_CODE_TTL_SECS");
        let key_reg_rpm = env_key(&prefix, "AUTH_REGISTER_REQUESTS_PER_MINUTE");
        let key_az_rpm = env_key(&prefix, "AUTH_AUTHORIZE_REQUESTS_PER_MINUTE");
        let key_max_pending = env_key(&prefix, "AUTH_MAX_PENDING_OAUTH_STATES");

        let mode = AuthMode::parse(vars.get(&key_mode).map(String::as_str), &key_mode)?;
        let admin_email = read_string(&vars, &key_admin)
            .map(|raw| raw.trim().to_ascii_lowercase())
            .unwrap_or_default();
        let base_dir = self
            .default_data_dir
            .clone()
            .unwrap_or_else(default_auth_dir);
        let config = AuthConfig {
            mode,
            public_url: read_url(&vars, &key_public_url)?,
            sqlite_path: read_path(&vars, &key_db)
                .unwrap_or_else(|| base_dir.join(DEFAULT_AUTH_DB_NAME)),
            key_path: read_path(&vars, &key_keypath)
                .unwrap_or_else(|| base_dir.join(DEFAULT_KEY_NAME)),
            bootstrap_secret: read_string(&vars, &key_secret),
            allowed_client_redirect_uris: read_csv(&vars, &key_redirects).unwrap_or_default(),
            admin_email,
            google: GoogleConfig {
                client_id: read_string(&vars, &key_g_id).unwrap_or_default(),
                client_secret: read_string(&vars, &key_g_secret).unwrap_or_default(),
                callback_path: read_string(&vars, &key_g_callback)
                    .unwrap_or_else(|| DEFAULT_CALLBACK_PATH.to_string()),
                scopes: read_csv(&vars, &key_g_scopes).unwrap_or_else(default_google_scopes),
            },
            access_token_ttl: Duration::from_secs(
                read_u64(&vars, &key_at_ttl)?.unwrap_or(DEFAULT_ACCESS_TOKEN_TTL_SECS),
            ),
            refresh_token_ttl: Duration::from_secs(
                read_u64(&vars, &key_rt_ttl)?.unwrap_or(DEFAULT_REFRESH_TOKEN_TTL_SECS),
            ),
            auth_code_ttl: Duration::from_secs(
                read_u64(&vars, &key_code_ttl)?.unwrap_or(DEFAULT_AUTH_CODE_TTL_SECS),
            ),
            register_requests_per_minute: read_u32(&vars, &key_reg_rpm)?
                .unwrap_or(DEFAULT_REGISTER_REQUESTS_PER_MINUTE),
            authorize_requests_per_minute: read_u32(&vars, &key_az_rpm)?
                .unwrap_or(DEFAULT_AUTHORIZE_REQUESTS_PER_MINUTE),
            max_pending_oauth_states: read_usize(&vars, &key_max_pending)?
                .unwrap_or(DEFAULT_MAX_PENDING_OAUTH_STATES),
            env_prefix: prefix,
            default_data_dir: base_dir,
            session_cookie_name: self.session_cookie_name,
            scopes_supported: self.scopes_supported,
            resource_path: self.resource_path,
            default_scope: self.default_scope,
            static_token_scopes: self.static_token_scopes,
            login_path: self.login_path,
            enable_dynamic_registration: self.enable_dynamic_registration,
            disable_static_token_with_oauth: self.disable_static_token_with_oauth,
        };

        config.validate()?;
        Ok(config)
    }
}

fn env_key(prefix: &str, suffix: &str) -> String {
    let trimmed = prefix.trim_end_matches('_');
    if trimmed.is_empty() {
        suffix.to_string()
    } else {
        format!("{trimmed}_{suffix}")
    }
}

fn normalize(vars: impl IntoIterator<Item = (String, String)>) -> HashMap<String, String> {
    vars.into_iter()
        .filter_map(|(key, value)| {
            let trimmed = value.trim();
            if trimmed.is_empty() {
                None
            } else {
                Some((key, trimmed.to_string()))
            }
        })
        .collect()
}

fn default_auth_dir() -> PathBuf {
    home_dir().map_or_else(|| PathBuf::from(".lab"), |home| home.join(".lab"))
}

fn home_dir() -> Option<PathBuf> {
    std::env::var_os("HOME")
        .or_else(|| std::env::var_os("USERPROFILE"))
        .map(PathBuf::from)
}

fn default_callback_path() -> String {
    DEFAULT_CALLBACK_PATH.to_string()
}

fn default_google_scopes() -> Vec<String> {
    vec![
        "openid".to_string(),
        "email".to_string(),
        "profile".to_string(),
    ]
}

fn read_string(vars: &HashMap<String, String>, key: &str) -> Option<String> {
    vars.get(key).cloned()
}

fn read_path(vars: &HashMap<String, String>, key: &str) -> Option<PathBuf> {
    read_string(vars, key).map(PathBuf::from)
}

fn read_csv(vars: &HashMap<String, String>, key: &str) -> Option<Vec<String>> {
    read_string(vars, key).map(|value| {
        value
            .split(',')
            .map(str::trim)
            .filter(|entry| !entry.is_empty())
            .map(ToOwned::to_owned)
            .collect()
    })
}

fn read_url(vars: &HashMap<String, String>, key: &str) -> Result<Option<Url>, AuthError> {
    read_string(vars, key)
        .map(|value| {
            Url::parse(&value)
                .map_err(|error| AuthError::Config(format!("{key} must be a valid URL: {error}")))
        })
        .transpose()
}

fn read_u64(vars: &HashMap<String, String>, key: &str) -> Result<Option<u64>, AuthError> {
    read_string(vars, key)
        .map(|value| {
            value.parse::<u64>().map_err(|error| {
                AuthError::Config(format!(
                    "{key} must be an integer number of seconds: {error}"
                ))
            })
        })
        .transpose()
}

fn read_u32(vars: &HashMap<String, String>, key: &str) -> Result<Option<u32>, AuthError> {
    read_string(vars, key)
        .map(|value| {
            value.parse::<u32>().map_err(|error| {
                AuthError::Config(format!(
                    "{key} must be an integer number of requests per minute: {error}"
                ))
            })
        })
        .transpose()
}

fn read_usize(vars: &HashMap<String, String>, key: &str) -> Result<Option<usize>, AuthError> {
    read_string(vars, key)
        .map(|value| {
            value.parse::<usize>().map_err(|error| {
                AuthError::Config(format!("{key} must be a positive integer: {error}"))
            })
        })
        .transpose()
}

#[cfg(test)]
mod tests {
    use super::{AuthConfig, AuthConfigBuilder, AuthMode, AuthModeConfig};

    #[test]
    fn bearer_mode_preserves_existing_http_token_behavior() {
        let cfg = AuthModeConfig::from_sources(fake_env_with("LAB_AUTH_MODE", "bearer")).unwrap();
        assert!(matches!(cfg.mode, AuthMode::Bearer));
    }

    #[test]
    fn oauth_mode_requires_public_url_and_google_credentials() {
        let err = AuthConfig::from_sources(fake_env_with_many([
            ("LAB_AUTH_MODE", "oauth"),
            ("LAB_GOOGLE_CLIENT_ID", "id"),
        ]))
        .unwrap_err();
        assert!(err.to_string().contains("LAB_PUBLIC_URL"));
    }

    #[test]
    fn oauth_mode_defaults_paths_and_callback() {
        let cfg = AuthConfig::from_sources(fake_env_with_many([
            ("LAB_AUTH_MODE", "oauth"),
            ("LAB_PUBLIC_URL", "https://lab.example.com"),
            ("LAB_GOOGLE_CLIENT_ID", "id"),
            ("LAB_GOOGLE_CLIENT_SECRET", "secret"),
            ("LAB_AUTH_ADMIN_EMAIL", "admin@example.com"),
        ]))
        .unwrap();
        assert_eq!(cfg.sqlite_path.file_name().unwrap(), "auth.db");
        assert_eq!(cfg.key_path.file_name().unwrap(), "auth-jwt.pem");
        assert_eq!(cfg.google.callback_path, "/auth/google/callback");
    }

    #[test]
    fn oauth_mode_requires_admin_email() {
        let err = AuthConfig::from_sources(fake_env_with_many([
            ("LAB_AUTH_MODE", "oauth"),
            ("LAB_PUBLIC_URL", "https://lab.example.com"),
            ("LAB_GOOGLE_CLIENT_ID", "id"),
            ("LAB_GOOGLE_CLIENT_SECRET", "secret"),
        ]))
        .unwrap_err();
        assert!(err.to_string().contains("LAB_AUTH_ADMIN_EMAIL"));
    }

    #[test]
    fn admin_email_normalizes_case_and_trims_whitespace() {
        let cfg = AuthConfig::from_sources(fake_env_with_many([
            ("LAB_AUTH_MODE", "oauth"),
            ("LAB_PUBLIC_URL", "https://lab.example.com"),
            ("LAB_GOOGLE_CLIENT_ID", "id"),
            ("LAB_GOOGLE_CLIENT_SECRET", "secret"),
            ("LAB_AUTH_ADMIN_EMAIL", "  Admin@Example.COM  "),
        ]))
        .unwrap();
        assert_eq!(cfg.admin_email, "admin@example.com");
    }

    #[test]
    fn oauth_mode_parses_allowed_client_redirect_uris() {
        let cfg = AuthConfig::from_sources(fake_env_with_many([
            ("LAB_AUTH_MODE", "oauth"),
            ("LAB_PUBLIC_URL", "https://lab.example.com"),
            ("LAB_GOOGLE_CLIENT_ID", "id"),
            ("LAB_GOOGLE_CLIENT_SECRET", "secret"),
            ("LAB_AUTH_ADMIN_EMAIL", "admin@example.com"),
            (
                "LAB_AUTH_ALLOWED_REDIRECT_URIS",
                "https://callback.tootie.tv/callback/*,https://claude.ai/api/mcp/auth_callback",
            ),
        ]))
        .unwrap();
        assert_eq!(
            cfg.allowed_client_redirect_uris,
            vec![
                "https://callback.tootie.tv/callback/*".to_string(),
                "https://claude.ai/api/mcp/auth_callback".to_string()
            ]
        );
    }

    #[test]
    fn default_config_preserves_lab_brand_for_backward_compat() {
        let cfg = AuthConfig::default();
        assert_eq!(cfg.env_prefix, "LAB");
        assert_eq!(cfg.session_cookie_name, "lab_session");
        assert_eq!(cfg.scopes_supported, vec!["lab".to_string()]);
        assert_eq!(cfg.resource_path, "/mcp");
        assert_eq!(cfg.default_scope, "lab");
        assert_eq!(
            cfg.static_token_scopes,
            vec!["lab:read".to_string(), "lab:admin".to_string()]
        );
        assert_eq!(cfg.login_path, "/auth/login");
        assert!(!cfg.enable_dynamic_registration);
        assert!(!cfg.disable_static_token_with_oauth);
    }

    #[test]
    fn builder_env_prefix_resolves_consumer_env_vars() {
        let cfg = AuthConfigBuilder::new()
            .env_prefix("SYSLOG_MCP")
            .session_cookie_name("syslog_session")
            .scopes_supported(vec!["syslog:read".to_string(), "syslog:admin".to_string()])
            .default_scope("syslog:read")
            .static_token_scopes(vec!["syslog:read".to_string(), "syslog:admin".to_string()])
            .disable_static_token_with_oauth(true)
            .build_from_sources(fake_env_with_many([
                ("SYSLOG_MCP_AUTH_MODE", "oauth"),
                ("SYSLOG_MCP_PUBLIC_URL", "https://syslog.example.com"),
                ("SYSLOG_MCP_GOOGLE_CLIENT_ID", "id"),
                ("SYSLOG_MCP_GOOGLE_CLIENT_SECRET", "secret"),
                ("SYSLOG_MCP_AUTH_ADMIN_EMAIL", "admin@example.com"),
            ]))
            .unwrap();
        assert!(matches!(cfg.mode, AuthMode::OAuth));
        assert_eq!(cfg.env_prefix, "SYSLOG_MCP");
        assert_eq!(cfg.session_cookie_name, "syslog_session");
        assert_eq!(cfg.default_scope, "syslog:read");
        assert!(cfg.disable_static_token_with_oauth);
        assert_eq!(
            cfg.scopes_supported,
            vec!["syslog:read".to_string(), "syslog:admin".to_string()]
        );
    }

    #[test]
    fn builder_lab_env_vars_ignored_when_prefix_is_overridden() {
        // Vars use LAB_*; builder is set to SYSLOG_MCP — so AUTH_MODE goes
        // unread, defaults to bearer, and PUBLIC_URL stays None.
        let cfg = AuthConfigBuilder::new()
            .env_prefix("SYSLOG_MCP")
            .build_from_sources(fake_env_with_many([
                ("LAB_AUTH_MODE", "oauth"),
                ("LAB_PUBLIC_URL", "https://lab.example.com"),
                ("LAB_GOOGLE_CLIENT_ID", "id"),
                ("LAB_GOOGLE_CLIENT_SECRET", "secret"),
                ("LAB_AUTH_ADMIN_EMAIL", "admin@example.com"),
            ]))
            .unwrap();
        assert!(matches!(cfg.mode, AuthMode::Bearer));
        assert!(cfg.public_url.is_none());
    }

    #[test]
    fn builder_validates_resource_path_starts_with_slash() {
        let err = AuthConfigBuilder::new()
            .resource_path("mcp")
            .build_from_sources(Vec::<(String, String)>::new())
            .unwrap_err();
        assert!(err.to_string().contains("resource_path"));
    }

    #[test]
    fn builder_validates_login_path_starts_with_slash() {
        let err = AuthConfigBuilder::new()
            .login_path("auth/login")
            .build_from_sources(Vec::<(String, String)>::new())
            .unwrap_err();
        assert!(err.to_string().contains("login_path"));
    }

    fn fake_env_with(key: &'static str, value: &'static str) -> Vec<(String, String)> {
        vec![(key.to_string(), value.to_string())]
    }

    fn fake_env_with_many<const N: usize>(
        pairs: [(&'static str, &'static str); N],
    ) -> Vec<(String, String)> {
        pairs
            .into_iter()
            .map(|(key, value)| (key.to_string(), value.to_string()))
            .collect()
    }
}
