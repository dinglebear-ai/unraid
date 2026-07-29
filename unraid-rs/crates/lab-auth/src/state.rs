use std::sync::Arc;
use std::sync::Mutex;
use std::time::Instant;

use tracing::info;
use url::Url;

use crate::config::{AuthConfig, AuthMode};
use crate::error::AuthError;
use crate::google::GoogleProvider;
use crate::jwt::SigningKeys;
use crate::sqlite::SqliteStore;

const RATE_LIMIT_RETRY_AFTER_MS: u64 = 60_000;

/// Simple token-bucket rate limiter (shared across clones via Arc).
#[derive(Clone)]
struct RateLimiter {
    inner: Arc<Mutex<RateLimiterInner>>,
}

struct RateLimiterInner {
    /// Tokens available in the bucket.
    tokens: f64,
    /// Maximum tokens, equal to the full per-minute burst allowance.
    max_tokens: f64,
    /// Refill rate in tokens per second.
    refill_rate: f64,
    /// Last refill time.
    last_refill: Instant,
}

impl RateLimiter {
    fn new(requests_per_minute: u32) -> Self {
        let rate = requests_per_minute as f64 / 60.0;
        // Burst = requests_per_minute: allows consuming the full per-minute quota
        // immediately, then refills at `rate` tokens/second.
        let max_tokens = requests_per_minute.max(1) as f64;
        Self {
            inner: Arc::new(Mutex::new(RateLimiterInner {
                tokens: max_tokens,
                max_tokens,
                refill_rate: rate,
                last_refill: Instant::now(),
            })),
        }
    }

    /// Try to consume one token. Returns `true` if allowed, `false` if rate-limited.
    fn try_acquire(&self) -> bool {
        let mut inner = self.inner.lock().expect("rate limiter lock");
        let now = Instant::now();
        let elapsed = now.duration_since(inner.last_refill).as_secs_f64();
        inner.tokens = (inner.tokens + elapsed * inner.refill_rate).min(inner.max_tokens);
        inner.last_refill = now;
        if inner.tokens >= 1.0 {
            inner.tokens -= 1.0;
            true
        } else {
            false
        }
    }
}

#[derive(Clone)]
pub struct AuthState {
    pub config: Arc<AuthConfig>,
    pub store: SqliteStore,
    pub signing_keys: Arc<SigningKeys>,
    pub google: Arc<GoogleProvider>,
    authorize_limiter: RateLimiter,
    register_limiter: RateLimiter,
}

impl AuthState {
    pub async fn new(config: AuthConfig) -> Result<Self, AuthError> {
        if !matches!(config.mode, AuthMode::OAuth) {
            return Err(AuthError::Config(format!(
                "AuthState requires {prefix}_AUTH_MODE=oauth",
                prefix = config.env_prefix
            )));
        }

        let public_url = config.public_url.clone().ok_or_else(|| {
            AuthError::Config(format!(
                "{prefix}_PUBLIC_URL is required when {prefix}_AUTH_MODE=oauth",
                prefix = config.env_prefix
            ))
        })?;
        let redirect_uri = build_google_redirect_uri(&public_url, &config.google.callback_path);
        let store = SqliteStore::open(config.sqlite_path.clone()).await?;
        let signing_keys = SigningKeys::load_or_create(&config.key_path)?;
        let mut google = GoogleProvider::new(
            config.google.client_id.clone(),
            config.google.client_secret.clone(),
            redirect_uri,
        )?;
        google.scopes.clone_from(&config.google.scopes);
        info!(
            crate_name = "lab-auth",
            env_prefix = %config.env_prefix,
            auth_mode = "oauth",
            public_url = %public_url,
            google_redirect_uri = %google.redirect_uri,
            sqlite_path = %config.sqlite_path.display(),
            key_path = %config.key_path.display(),
            google_scopes = ?config.google.scopes,
            "auth state initialized"
        );

        let authorize_limiter = RateLimiter::new(config.authorize_requests_per_minute);
        let register_limiter = RateLimiter::new(config.register_requests_per_minute);
        Ok(Self {
            config: Arc::new(config),
            store,
            signing_keys: Arc::new(signing_keys),
            google: Arc::new(google),
            authorize_limiter,
            register_limiter,
        })
    }

    /// Rate-limit guard for `/authorize` and `/browser_login` endpoints.
    pub fn check_authorize_rate_limit(&self) -> Result<(), AuthError> {
        if self.authorize_limiter.try_acquire() {
            Ok(())
        } else {
            Err(AuthError::RateLimited {
                message: "authorize rate limit exceeded".to_string(),
                retry_after_ms: RATE_LIMIT_RETRY_AFTER_MS,
            })
        }
    }

    /// Rate-limit guard for `/register` endpoint.
    pub fn check_register_rate_limit(&self) -> Result<(), AuthError> {
        if self.register_limiter.try_acquire() {
            Ok(())
        } else {
            Err(AuthError::RateLimited {
                message: "register rate limit exceeded".to_string(),
                retry_after_ms: RATE_LIMIT_RETRY_AFTER_MS,
            })
        }
    }

    /// Returns the merged email allowlist: admin first, then all `allowed_users` rows,
    /// deduplicating case-insensitively so admin is never counted twice.
    ///
    /// This is the single source of truth used in both OAuth callback branches. A DB
    /// error is surfaced as [`AuthError::Storage`] (fail-closed — server fault, not
    /// user fault).
    ///
    /// Never log the returned emails directly — pass them only to
    /// `check_email_allowlist`, which uses `fingerprint()` for safe diagnostics.
    pub async fn resolve_allowed_emails(&self) -> Result<Vec<String>, AuthError> {
        let mut emails = vec![self.config.admin_email.clone()];
        for row in self.store.list_allowed_users().await? {
            if !row.email.eq_ignore_ascii_case(&self.config.admin_email) {
                emails.push(row.email);
            }
        }
        Ok(emails)
    }

    /// Rejects new OAuth state rows when the pending count exceeds `max_pending_oauth_states`.
    pub async fn ensure_pending_oauth_state_capacity(&self) -> Result<(), AuthError> {
        let count = self.store.count_pending_oauth_states().await?;
        if count >= self.config.max_pending_oauth_states {
            return Err(AuthError::RateLimited {
                message: "too many pending authorization requests".to_string(),
                retry_after_ms: 5_000,
            });
        }
        Ok(())
    }

    #[cfg(test)]
    pub fn for_tests(
        config: AuthConfig,
        store: SqliteStore,
        signing_keys: SigningKeys,
        google: GoogleProvider,
    ) -> Self {
        let authorize_limiter = RateLimiter::new(config.authorize_requests_per_minute);
        let register_limiter = RateLimiter::new(config.register_requests_per_minute);
        Self {
            config: Arc::new(config),
            store,
            signing_keys: Arc::new(signing_keys),
            google: Arc::new(google),
            authorize_limiter,
            register_limiter,
        }
    }
}

fn build_google_redirect_uri(public_url: &Url, callback_path: &str) -> Url {
    let mut redirect_uri = public_url.clone();
    let base_path = redirect_uri.path().trim_end_matches('/');
    let callback_path = callback_path.trim_start_matches('/');
    let next_path = if base_path.is_empty() {
        format!("/{callback_path}")
    } else {
        format!("{base_path}/{callback_path}")
    };

    redirect_uri.set_path(&next_path);
    redirect_uri.set_query(None);
    redirect_uri.set_fragment(None);
    redirect_uri
}

#[cfg(test)]
mod tests {
    use std::time::Duration;

    use tempfile::tempdir;

    use super::*;
    use crate::config::GoogleConfig;
    use crate::util::now_unix;

    /// Builds a minimal `AuthState` for unit-testing `resolve_allowed_emails`.
    async fn resolve_state(admin_email: &str) -> AuthState {
        let dir = tempdir().expect("tempdir");
        AuthState::new(AuthConfig {
            mode: AuthMode::OAuth,
            public_url: Some(Url::parse("https://lab.example.com").expect("url")),
            sqlite_path: dir.path().join("auth.db"),
            key_path: dir.path().join("auth.pem"),
            bootstrap_secret: None,
            allowed_client_redirect_uris: Vec::new(),
            admin_email: admin_email.to_string(),
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
            access_token_ttl: Duration::from_secs(3600),
            refresh_token_ttl: Duration::from_secs(3600),
            auth_code_ttl: Duration::from_secs(300),
            register_requests_per_minute: 10,
            authorize_requests_per_minute: 20,
            max_pending_oauth_states: 1024,
            ..AuthConfig::default()
        })
        .await
        .expect("auth state")
    }

    #[tokio::test]
    async fn resolve_allowed_emails_returns_admin_when_table_is_empty() {
        let state = resolve_state("admin@example.com").await;
        let emails = state.resolve_allowed_emails().await.unwrap();
        assert_eq!(emails, vec!["admin@example.com"]);
    }

    #[tokio::test]
    async fn resolve_allowed_emails_includes_db_rows_after_admin() {
        let state = resolve_state("admin@example.com").await;
        state
            .store
            .add_allowed_user("alice@example.com", "admin", now_unix())
            .await
            .unwrap();
        state
            .store
            .add_allowed_user("bob@example.com", "admin", now_unix() + 1)
            .await
            .unwrap();
        let emails = state.resolve_allowed_emails().await.unwrap();
        // Admin is always first; DB rows follow in created_at ASC order.
        assert_eq!(
            emails,
            vec!["admin@example.com", "alice@example.com", "bob@example.com"]
        );
    }

    #[tokio::test]
    async fn resolve_allowed_emails_deduplicates_admin_present_in_db() {
        let state = resolve_state("admin@example.com").await;
        // add_allowed_user lowercases; admin_email may differ in case → still deduped.
        state
            .store
            .add_allowed_user("Admin@Example.COM", "self", now_unix())
            .await
            .unwrap();
        state
            .store
            .add_allowed_user("other@example.com", "admin", now_unix() + 1)
            .await
            .unwrap();
        let emails = state.resolve_allowed_emails().await.unwrap();
        // "admin@example.com" from DB is deduped; "other@example.com" remains.
        assert_eq!(emails, vec!["admin@example.com", "other@example.com"]);
    }

    #[tokio::test]
    async fn auth_state_preserves_public_url_path_prefix_in_google_redirect_uri() {
        let temp = tempdir().expect("tempdir");
        let state = AuthState::new(AuthConfig {
            mode: AuthMode::OAuth,
            public_url: Some(Url::parse("https://lab.example.com/gateway").expect("public url")),
            sqlite_path: temp.path().join("auth.db"),
            key_path: temp.path().join("auth.pem"),
            bootstrap_secret: None,
            allowed_client_redirect_uris: Vec::new(),
            admin_email: "admin@example.com".to_string(),
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
            access_token_ttl: Duration::from_secs(3600),
            refresh_token_ttl: Duration::from_secs(3600),
            auth_code_ttl: Duration::from_secs(300),
            register_requests_per_minute: 10,
            authorize_requests_per_minute: 20,
            max_pending_oauth_states: 1024,
            ..AuthConfig::default()
        })
        .await
        .expect("auth state");

        assert_eq!(
            state.google.redirect_uri.as_str(),
            "https://lab.example.com/gateway/auth/google/callback"
        );
    }
}
