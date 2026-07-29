use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::{Arc, Mutex};

use rusqlite::types::Value;
use rusqlite::{Connection, OptionalExtension, params};
use tracing::warn;

use crate::error::AuthError;
use crate::types::{
    AllowedUserRow, AuthorizationCodeRow, AuthorizationRequestRow, BrowserLoginStateRow,
    BrowserSessionRow, RefreshTokenRow, RegisteredClient, UpstreamOauthCredentialRow,
    UpstreamOauthStateRow,
};

const UPSTREAM_OAUTH_STATE_MAX_TTL_SECS: i64 = 600;
use crate::util::{
    ensure_restrictive_permissions, fingerprint, now_unix, set_restrictive_permissions,
};

const SQLITE_BUSY_TIMEOUT_MS: u64 = 5_000;
const SQLITE_POOL_SIZE: usize = 4;

#[derive(Clone, Debug)]
pub struct SqliteStore {
    conns: Arc<Vec<Mutex<Connection>>>,
    next_conn: Arc<AtomicUsize>,
    path: Arc<PathBuf>,
}

impl SqliteStore {
    pub async fn open(path: PathBuf) -> Result<Self, AuthError> {
        let path_for_open = path.clone();
        let conns = tokio::task::spawn_blocking(move || {
            open_connections(path_for_open.as_path(), SQLITE_POOL_SIZE)
        })
        .await;
        let store = match conns {
            Ok(result) => result,
            Err(error) => Err(AuthError::Storage(format!(
                "sqlite open task failed: {error}"
            ))),
        }
        .map(|conns| Self {
            conns: Arc::new(conns.into_iter().map(Mutex::new).collect()),
            next_conn: Arc::new(AtomicUsize::new(0)),
            path: Arc::new(path),
        })?;

        store.cleanup_expired().await?;
        Ok(store)
    }

    pub async fn pragma(&self, name: &str) -> Result<String, AuthError> {
        let pragma = match name {
            "journal_mode" | "busy_timeout" | "foreign_keys" => name.to_string(),
            other => {
                return Err(AuthError::Config(format!(
                    "unsupported pragma query `{other}`"
                )));
            }
        };

        self.with_conn(move |conn| {
            conn.query_row(&format!("PRAGMA {pragma};"), [], |row| {
                row.get::<_, Value>(0)
            })
            .map(|value| match value {
                Value::Text(text) => text,
                Value::Integer(int) => int.to_string(),
                other => format!("{other:?}"),
            })
            .map_err(sqlite_error)
        })
        .await
    }

    pub async fn register_client(&self, client: RegisteredClient) -> Result<(), AuthError> {
        self.with_conn(move |conn| {
            let redirect_uris = serde_json::to_string(&client.redirect_uris)
                .map_err(|error| AuthError::Storage(format!("serialize redirect_uris: {error}")))?;
            conn.execute(
                "INSERT INTO registered_clients (client_id, redirect_uris, created_at)
                 VALUES (?1, ?2, ?3)
                 ON CONFLICT(client_id) DO UPDATE SET
                    redirect_uris = excluded.redirect_uris,
                    created_at = excluded.created_at",
                params![client.client_id, redirect_uris, client.created_at],
            )
            .map_err(sqlite_error)?;
            Ok(())
        })
        .await
    }

    pub async fn find_client(
        &self,
        client_id: &str,
    ) -> Result<Option<RegisteredClient>, AuthError> {
        let client_id = client_id.to_string();
        self.with_conn(move |conn| {
            conn.query_row(
                "SELECT client_id, redirect_uris, created_at
                 FROM registered_clients
                 WHERE client_id = ?1",
                params![client_id],
                |row| {
                    let redirect_uris: String = row.get(1)?;
                    let redirect_uris = serde_json::from_str(&redirect_uris).map_err(|error| {
                        rusqlite::Error::FromSqlConversionFailure(
                            1,
                            rusqlite::types::Type::Text,
                            Box::new(error),
                        )
                    })?;
                    Ok(RegisteredClient {
                        client_id: row.get(0)?,
                        redirect_uris,
                        created_at: row.get(2)?,
                    })
                },
            )
            .optional()
            .map_err(sqlite_error)
        })
        .await
    }

    pub async fn insert_authorization_request(
        &self,
        request: AuthorizationRequestRow,
    ) -> Result<(), AuthError> {
        self.with_conn(move |conn| {
            conn.execute(
                "INSERT INTO authorization_requests (
                    state, client_id, redirect_uri, client_state, scope, provider_code_verifier,
                    code_challenge, code_challenge_method, created_at, expires_at
                 ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
                params![
                    request.state,
                    request.client_id,
                    request.redirect_uri,
                    request.client_state,
                    request.scope,
                    request.provider_code_verifier,
                    request.code_challenge,
                    request.code_challenge_method,
                    request.created_at,
                    request.expires_at,
                ],
            )
            .map_err(sqlite_error)?;
            Ok(())
        })
        .await
    }

    pub async fn take_authorization_request(
        &self,
        state: &str,
    ) -> Result<AuthorizationRequestRow, AuthError> {
        let state = state.to_string();
        let now = now_unix();
        self.with_conn(move |conn| {
            conn.query_row(
                "DELETE FROM authorization_requests
                 WHERE state = ?1
                   AND expires_at > ?2
                 RETURNING state, client_id, redirect_uri, client_state, scope, provider_code_verifier,
                           code_challenge, code_challenge_method, created_at, expires_at",
                params![state, now],
                row_to_authorization_request,
            )
            .map_err(|error| match error {
                rusqlite::Error::QueryReturnedNoRows => AuthError::InvalidGrant(
                    "authorization state is missing, expired, or already used".to_string(),
                ),
                other => sqlite_error(other),
            })
        })
        .await
    }

    pub async fn insert_auth_code(&self, code: AuthorizationCodeRow) -> Result<(), AuthError> {
        self.with_conn(move |conn| {
            conn.execute(
                "INSERT INTO authorization_codes (
                    code, client_id, subject, redirect_uri, scope,
                    code_challenge, code_challenge_method, provider_refresh_token,
                    created_at, expires_at
                 ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
                params![
                    code.code,
                    code.client_id,
                    code.subject,
                    code.redirect_uri,
                    code.scope,
                    code.code_challenge,
                    code.code_challenge_method,
                    code.provider_refresh_token,
                    code.created_at,
                    code.expires_at,
                ],
            )
            .map_err(sqlite_error)?;
            Ok(())
        })
        .await
    }

    pub async fn redeem_auth_code(&self, code: &str) -> Result<AuthorizationCodeRow, AuthError> {
        let code = code.to_string();
        let now = now_unix();
        self.with_conn(move |conn| {
            conn.query_row(
                "DELETE FROM authorization_codes
                 WHERE code = ?1
                   AND expires_at > ?2
                 RETURNING code, client_id, subject, redirect_uri, scope,
                           code_challenge, code_challenge_method, provider_refresh_token,
                           created_at, expires_at",
                params![code, now],
                row_to_authorization_code,
            )
            .map_err(|error| match error {
                rusqlite::Error::QueryReturnedNoRows => AuthError::InvalidGrant(
                    "authorization code is missing, expired, or already redeemed".to_string(),
                ),
                other => sqlite_error(other),
            })
        })
        .await
    }

    pub async fn upsert_refresh_token(&self, token: RefreshTokenRow) -> Result<(), AuthError> {
        self.with_conn(move |conn| {
            conn.execute(
                "INSERT INTO refresh_tokens (
                    refresh_token, client_id, subject, scope,
                    provider_refresh_token, created_at, expires_at
                 ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
                 ON CONFLICT(refresh_token) DO UPDATE SET
                    client_id = excluded.client_id,
                    subject = excluded.subject,
                    scope = excluded.scope,
                    provider_refresh_token = excluded.provider_refresh_token,
                    created_at = excluded.created_at,
                    expires_at = excluded.expires_at",
                params![
                    token.refresh_token,
                    token.client_id,
                    token.subject,
                    token.scope,
                    token.provider_refresh_token,
                    token.created_at,
                    token.expires_at,
                ],
            )
            .map_err(sqlite_error)?;
            Ok(())
        })
        .await
    }

    pub async fn find_refresh_token(
        &self,
        refresh_token: &str,
    ) -> Result<Option<RefreshTokenRow>, AuthError> {
        let refresh_token = refresh_token.to_string();
        let now = now_unix();
        self.with_conn(move |conn| {
            conn.query_row(
                "SELECT refresh_token, client_id, subject, scope,
                        provider_refresh_token, created_at, expires_at
                 FROM refresh_tokens
                 WHERE refresh_token = ?1
                   AND expires_at > ?2",
                params![refresh_token, now],
                row_to_refresh_token,
            )
            .optional()
            .map_err(sqlite_error)
        })
        .await
    }

    pub async fn upsert_browser_session(
        &self,
        session: BrowserSessionRow,
    ) -> Result<(), AuthError> {
        self.with_conn(move |conn| {
            conn.execute(
                "INSERT INTO browser_sessions (
                    session_id, subject, email, csrf_token, created_at, expires_at
                 ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)
                 ON CONFLICT(session_id) DO UPDATE SET
                    subject = excluded.subject,
                    email = excluded.email,
                    csrf_token = excluded.csrf_token,
                    created_at = excluded.created_at,
                    expires_at = excluded.expires_at",
                params![
                    session.session_id,
                    session.subject,
                    session.email,
                    session.csrf_token,
                    session.created_at,
                    session.expires_at,
                ],
            )
            .map_err(sqlite_error)?;
            Ok(())
        })
        .await
    }

    pub async fn find_browser_session(
        &self,
        session_id: &str,
    ) -> Result<Option<BrowserSessionRow>, AuthError> {
        let session_id = session_id.to_string();
        let now = now_unix();
        self.with_conn(move |conn| {
            conn.query_row(
                "SELECT session_id, subject, email, csrf_token, created_at, expires_at
                 FROM browser_sessions
                 WHERE session_id = ?1
                   AND expires_at > ?2",
                params![session_id, now],
                row_to_browser_session,
            )
            .optional()
            .map_err(sqlite_error)
        })
        .await
    }

    pub async fn revoke_browser_session(&self, session_id: &str) -> Result<(), AuthError> {
        let session_id = session_id.to_string();
        self.with_conn(move |conn| {
            conn.execute(
                "DELETE FROM browser_sessions WHERE session_id = ?1",
                params![session_id],
            )
            .map_err(sqlite_error)?;
            Ok(())
        })
        .await
    }

    pub async fn execute_test_statement(&self, sql: &str) -> Result<(), AuthError> {
        let sql = sql.to_string();
        self.with_conn(move |conn| conn.execute_batch(&sql).map_err(sqlite_error))
            .await
    }

    pub async fn insert_browser_login_state(
        &self,
        login: BrowserLoginStateRow,
    ) -> Result<(), AuthError> {
        self.with_conn(move |conn| {
            conn.execute(
                "INSERT INTO browser_login_states (
                    state, return_to, provider_code_verifier, created_at, expires_at
                 ) VALUES (?1, ?2, ?3, ?4, ?5)",
                params![
                    login.state,
                    login.return_to,
                    login.provider_code_verifier,
                    login.created_at,
                    login.expires_at,
                ],
            )
            .map_err(sqlite_error)?;
            Ok(())
        })
        .await
    }

    pub async fn count_pending_oauth_states(&self) -> Result<usize, AuthError> {
        let now = now_unix();
        self.with_conn(move |conn| {
            let authorization_requests: i64 = conn
                .query_row(
                    "SELECT COUNT(*) FROM authorization_requests WHERE expires_at > ?1",
                    params![now],
                    |row| row.get(0),
                )
                .map_err(sqlite_error)?;
            let browser_login_states: i64 = conn
                .query_row(
                    "SELECT COUNT(*) FROM browser_login_states WHERE expires_at > ?1",
                    params![now],
                    |row| row.get(0),
                )
                .map_err(sqlite_error)?;
            Ok((authorization_requests + browser_login_states) as usize)
        })
        .await
    }

    pub async fn take_browser_login_state(
        &self,
        state: &str,
    ) -> Result<Option<BrowserLoginStateRow>, AuthError> {
        let state = state.to_string();
        let now = now_unix();
        self.with_conn(move |conn| {
            conn.query_row(
                "DELETE FROM browser_login_states
                 WHERE state = ?1
                   AND expires_at > ?2
                 RETURNING state, return_to, provider_code_verifier, created_at, expires_at",
                params![state, now],
                row_to_browser_login_state,
            )
            .optional()
            .map_err(sqlite_error)
        })
        .await
    }

    /// Delete expired rows from all short-lived tables. Also drops upstream OAuth
    /// credential rows whose access token has expired AND have no refresh token
    /// available for re-use (SEC-9). Returns the total number of deleted rows.
    pub async fn cleanup_expired(&self) -> Result<u64, AuthError> {
        let now = now_unix();
        self.with_conn(move |conn| {
            let mut total: u64 = 0;
            for table in [
                "authorization_requests",
                "authorization_codes",
                "refresh_tokens",
                "browser_sessions",
                "browser_login_states",
            ] {
                let deleted = conn
                    .execute(
                        &format!("DELETE FROM {table} WHERE expires_at <= ?1"),
                        params![now],
                    )
                    .map_err(sqlite_error)?;
                total += deleted as u64;
            }
            let deleted = conn
                .execute(
                    "DELETE FROM upstream_oauth_state WHERE expires_at <= ?1",
                    params![now],
                )
                .map_err(sqlite_error)?;
            total += deleted as u64;
            let deleted = conn
                .execute(
                    "DELETE FROM upstream_oauth_credentials
                     WHERE access_token_expires_at <= ?1 AND refresh_token_present = 0",
                    params![now],
                )
                .map_err(sqlite_error)?;
            total += deleted as u64;
            Ok(total)
        })
        .await
    }

    pub async fn upsert_upstream_oauth_credentials(
        &self,
        row: UpstreamOauthCredentialRow,
    ) -> Result<(), AuthError> {
        self.with_conn(move |conn| {
            conn.execute(
                "INSERT INTO upstream_oauth_credentials (
                    upstream_name, subject, client_id, granted_scopes_json,
                    token_blob, token_blob_nonce, token_received_at,
                    access_token_expires_at, refresh_token_present
                 ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
                 ON CONFLICT(upstream_name, subject) DO UPDATE SET
                    client_id = excluded.client_id,
                    granted_scopes_json = excluded.granted_scopes_json,
                    token_blob = excluded.token_blob,
                    token_blob_nonce = excluded.token_blob_nonce,
                    token_received_at = excluded.token_received_at,
                    access_token_expires_at = excluded.access_token_expires_at,
                    refresh_token_present = excluded.refresh_token_present",
                params![
                    row.upstream_name,
                    row.subject,
                    row.client_id,
                    row.granted_scopes_json,
                    row.token_blob,
                    row.token_blob_nonce,
                    row.token_received_at,
                    row.access_token_expires_at,
                    i64::from(row.refresh_token_present),
                ],
            )
            .map_err(sqlite_error)?;
            Ok(())
        })
        .await
    }

    pub async fn find_upstream_oauth_credentials(
        &self,
        upstream_name: &str,
        subject: &str,
    ) -> Result<Option<UpstreamOauthCredentialRow>, AuthError> {
        let upstream_name = upstream_name.to_string();
        let subject = subject.to_string();
        self.with_conn(move |conn| {
            conn.query_row(
                "SELECT upstream_name, subject, client_id, granted_scopes_json,
                        token_blob, token_blob_nonce, token_received_at,
                        access_token_expires_at, refresh_token_present
                 FROM upstream_oauth_credentials
                 WHERE upstream_name = ?1 AND subject = ?2",
                params![upstream_name, subject],
                row_to_upstream_oauth_credentials,
            )
            .optional()
            .map_err(sqlite_error)
        })
        .await
    }

    pub async fn delete_upstream_oauth_credentials(
        &self,
        upstream_name: &str,
        subject: &str,
    ) -> Result<(), AuthError> {
        let upstream_name = upstream_name.to_string();
        let subject = subject.to_string();
        self.with_conn(move |conn| {
            conn.execute(
                "DELETE FROM upstream_oauth_credentials
                 WHERE upstream_name = ?1 AND subject = ?2",
                params![upstream_name, subject],
            )
            .map_err(sqlite_error)?;
            Ok(())
        })
        .await
    }

    pub async fn save_upstream_oauth_state(
        &self,
        row: UpstreamOauthStateRow,
    ) -> Result<(), AuthError> {
        if row.expires_at <= row.created_at
            || row.expires_at - row.created_at > UPSTREAM_OAUTH_STATE_MAX_TTL_SECS
        {
            return Err(AuthError::InvalidGrant(
                "state TTL exceeds 600s".to_string(),
            ));
        }
        self.with_conn(move |conn| {
            conn.execute(
                "INSERT INTO upstream_oauth_state (
                    upstream_name, subject, csrf_token, pkce_verifier, created_at, expires_at
                 ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                params![
                    row.upstream_name,
                    row.subject,
                    row.csrf_token,
                    row.pkce_verifier,
                    row.created_at,
                    row.expires_at,
                ],
            )
            .map_err(sqlite_error)?;
            Ok(())
        })
        .await
    }

    pub async fn find_upstream_oauth_state_subject(
        &self,
        upstream_name: &str,
        csrf_token: &str,
        now: i64,
    ) -> Result<Option<String>, AuthError> {
        let upstream_name = upstream_name.to_string();
        let csrf_token = csrf_token.to_string();
        self.with_conn(move |conn| {
            conn.query_row(
                "SELECT subject
                 FROM upstream_oauth_state
                 WHERE upstream_name = ?1
                   AND csrf_token = ?2
                   AND expires_at > ?3",
                params![upstream_name, csrf_token, now],
                |row| row.get(0),
            )
            .optional()
            .map_err(sqlite_error)
        })
        .await
    }

    /// Look up `(upstream_name, subject)` by `csrf_token` alone.
    ///
    /// Used by the OAuth callback handler to recover the upstream identity from
    /// the state parameter without requiring the caller to know it upfront.
    pub async fn find_upstream_oauth_state_owner(
        &self,
        csrf_token: &str,
        now: i64,
    ) -> Result<Option<(String, String)>, AuthError> {
        let csrf_token = csrf_token.to_string();
        self.with_conn(move |conn| {
            conn.query_row(
                "SELECT upstream_name, subject
                 FROM upstream_oauth_state
                 WHERE csrf_token = ?1
                   AND expires_at > ?2",
                params![csrf_token, now],
                |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?)),
            )
            .optional()
            .map_err(sqlite_error)
        })
        .await
    }

    /// Delete a pending OAuth state token by CSRF token to foreclose replay attacks after exchange failure.
    pub async fn delete_upstream_oauth_state_by_csrf(
        &self,
        csrf_token: &str,
        now: i64,
    ) -> Result<(), AuthError> {
        let csrf_token = csrf_token.to_string();
        self.with_conn(move |conn| {
            conn.execute(
                "DELETE FROM upstream_oauth_state
                 WHERE csrf_token = ?1
                   AND expires_at > ?2",
                params![csrf_token, now],
            )
            .map_err(sqlite_error)?;
            Ok(())
        })
        .await
    }

    /// Atomic take-once via `DELETE ... RETURNING`.
    pub async fn take_upstream_oauth_state(
        &self,
        upstream_name: &str,
        subject: &str,
        csrf_token: &str,
        now: i64,
    ) -> Result<Option<UpstreamOauthStateRow>, AuthError> {
        let upstream_name = upstream_name.to_string();
        let subject = subject.to_string();
        let csrf_token = csrf_token.to_string();
        self.with_conn(move |conn| {
            conn.query_row(
                "DELETE FROM upstream_oauth_state
                 WHERE upstream_name = ?1
                   AND subject = ?2
                   AND csrf_token = ?3
                   AND expires_at > ?4
                 RETURNING upstream_name, subject, csrf_token, pkce_verifier, created_at, expires_at",
                params![upstream_name, subject, csrf_token, now],
                row_to_upstream_oauth_state,
            )
            .optional()
            .map_err(sqlite_error)
        })
        .await
    }

    pub async fn save_dynamic_client_registration(
        &self,
        upstream_name: &str,
        subject: &str,
        client_id: &str,
    ) -> Result<(), AuthError> {
        let upstream_name = upstream_name.to_string();
        let subject = subject.to_string();
        let client_id = client_id.to_string();
        let now = now_unix();
        self.with_conn(move |conn| {
            conn.execute(
                "INSERT INTO upstream_oauth_dynamic_clients (upstream_name, subject, client_id, created_at)
                 VALUES (?1, ?2, ?3, ?4)
                 ON CONFLICT(upstream_name, subject) DO UPDATE SET
                    client_id = excluded.client_id,
                    created_at = excluded.created_at",
                params![upstream_name, subject, client_id, now],
            )
            .map_err(sqlite_error)?;
            Ok(())
        })
        .await
    }

    pub async fn find_dynamic_client_registration(
        &self,
        upstream_name: &str,
        subject: &str,
    ) -> Result<Option<String>, AuthError> {
        let upstream_name = upstream_name.to_string();
        let subject = subject.to_string();
        self.with_conn(move |conn| {
            conn.query_row(
                "SELECT client_id
                 FROM upstream_oauth_dynamic_clients
                 WHERE upstream_name = ?1 AND subject = ?2",
                params![upstream_name, subject],
                |row| row.get(0),
            )
            .optional()
            .map_err(sqlite_error)
        })
        .await
    }

    pub async fn delete_dynamic_client_registration(
        &self,
        upstream_name: &str,
        subject: &str,
    ) -> Result<(), AuthError> {
        let upstream_name = upstream_name.to_string();
        let subject = subject.to_string();
        self.with_conn(move |conn| {
            conn.execute(
                "DELETE FROM upstream_oauth_dynamic_clients
                 WHERE upstream_name = ?1 AND subject = ?2",
                params![upstream_name, subject],
            )
            .map_err(sqlite_error)?;
            Ok(())
        })
        .await
    }

    /// Add an email address to the allowlist.
    ///
    /// `email` is normalised to lowercase before storage. Returns
    /// `AuthError::Validation` if the email is already present.
    pub async fn add_allowed_user(
        &self,
        email: &str,
        added_by: &str,
        created_at: i64,
    ) -> Result<(), AuthError> {
        let email = email.to_lowercase();
        let fp = fingerprint(&email);
        let added_by = added_by.to_string();
        self.with_conn(move |conn| {
            let changed = conn
                .execute(
                    "INSERT INTO allowed_users (email, added_by, created_at)
                     VALUES (?1, ?2, ?3)",
                    params![email, added_by, created_at],
                )
                .map_err(|error| match error {
                    rusqlite::Error::SqliteFailure(ref e, _)
                        if e.code == rusqlite::ErrorCode::ConstraintViolation =>
                    {
                        AuthError::Validation(format!(
                            "email fingerprint {fp} is already in the allowlist"
                        ))
                    }
                    other => sqlite_error(other),
                })?;
            debug_assert_eq!(changed, 1);
            Ok(())
        })
        .await
    }

    /// Remove an email address from the allowlist.
    ///
    /// Idempotent: returns `Ok(())` even if the email was not present.
    pub async fn remove_allowed_user(&self, email: &str) -> Result<(), AuthError> {
        let email = email.to_lowercase();
        self.with_conn(move |conn| {
            conn.execute("DELETE FROM allowed_users WHERE email = ?1", params![email])
                .map_err(sqlite_error)?;
            Ok(())
        })
        .await
    }

    /// Return all allowlist rows ordered by `created_at ASC`.
    pub async fn list_allowed_users(&self) -> Result<Vec<AllowedUserRow>, AuthError> {
        self.with_conn(move |conn| {
            let mut stmt = conn
                .prepare(
                    "SELECT email, added_by, created_at
                     FROM allowed_users
                     ORDER BY created_at ASC",
                )
                .map_err(sqlite_error)?;
            let rows = stmt
                .query_map([], row_to_allowed_user)
                .map_err(sqlite_error)?
                .collect::<rusqlite::Result<Vec<_>>>()
                .map_err(sqlite_error)?;
            Ok(rows)
        })
        .await
    }

    async fn with_conn<T, F>(&self, op: F) -> Result<T, AuthError>
    where
        T: Send + 'static,
        F: FnOnce(&Connection) -> Result<T, AuthError> + Send + 'static,
    {
        let conns = Arc::clone(&self.conns);
        let path = Arc::clone(&self.path);
        let len = conns.len();
        let idx = self.next_conn.fetch_add(1, Ordering::Relaxed) % len;
        tokio::task::spawn_blocking(move || {
            let mut guard = conns[idx]
                .lock()
                .map_err(|_| AuthError::Storage("sqlite mutex poisoned".to_string()))?;
            validate_or_reopen_connection(&mut guard, path.as_ref())?;
            op(&guard)
        })
        .await
        .map_err(|error| AuthError::Storage(format!("sqlite task failed: {error}")))?
    }

    #[cfg(test)]
    fn connection_count(&self) -> usize {
        self.conns.len()
    }
}

fn open_connections(path: &Path, count: usize) -> Result<Vec<Connection>, AuthError> {
    (0..count).map(|_| open_connection(path)).collect()
}

#[allow(clippy::too_many_lines)]
fn open_connection(path: &Path) -> Result<Connection, AuthError> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|error| {
            AuthError::Storage(format!(
                "create auth database directory `{}`: {error}",
                parent.display()
            ))
        })?;
    }

    let existed = path.exists();
    if existed {
        ensure_restrictive_permissions(path)?;
    }

    let conn = Connection::open(path).map_err(sqlite_error)?;
    conn.busy_timeout(std::time::Duration::from_millis(SQLITE_BUSY_TIMEOUT_MS))
        .map_err(sqlite_error)?;
    conn.pragma_update(None, "journal_mode", "WAL")
        .map_err(sqlite_error)?;
    conn.pragma_update(None, "foreign_keys", "ON")
        .map_err(sqlite_error)?;
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS registered_clients (
            client_id TEXT PRIMARY KEY,
            redirect_uris TEXT NOT NULL,
            created_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS authorization_requests (
            state TEXT PRIMARY KEY,
            client_id TEXT NOT NULL,
            redirect_uri TEXT NOT NULL,
            client_state TEXT NOT NULL,
            scope TEXT NOT NULL,
            provider_code_verifier TEXT NOT NULL,
            code_challenge TEXT NOT NULL,
            code_challenge_method TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            expires_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS authorization_codes (
            code TEXT PRIMARY KEY,
            client_id TEXT NOT NULL,
            subject TEXT NOT NULL,
            redirect_uri TEXT NOT NULL,
            scope TEXT NOT NULL,
            code_challenge TEXT NOT NULL,
            code_challenge_method TEXT NOT NULL,
            provider_refresh_token TEXT,
            created_at INTEGER NOT NULL,
            expires_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS refresh_tokens (
            refresh_token TEXT PRIMARY KEY,
            client_id TEXT NOT NULL,
            subject TEXT NOT NULL,
            scope TEXT NOT NULL,
            provider_refresh_token TEXT,
            created_at INTEGER NOT NULL,
            expires_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS browser_sessions (
            session_id TEXT PRIMARY KEY,
            subject TEXT NOT NULL,
            email TEXT,
            csrf_token TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            expires_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS browser_login_states (
            state TEXT PRIMARY KEY,
            return_to TEXT NOT NULL,
            provider_code_verifier TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            expires_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS upstream_oauth_credentials (
            upstream_name             TEXT NOT NULL,
            subject                   TEXT NOT NULL,
            client_id                 TEXT NOT NULL,
            granted_scopes_json       TEXT NOT NULL,
            token_blob                BLOB NOT NULL,
            token_blob_nonce          BLOB NOT NULL,
            token_received_at         INTEGER NOT NULL,
            access_token_expires_at   INTEGER NOT NULL,
            refresh_token_present     INTEGER NOT NULL,
            PRIMARY KEY (upstream_name, subject)
        ) WITHOUT ROWID;
        CREATE TABLE IF NOT EXISTS upstream_oauth_state (
            upstream_name   TEXT NOT NULL,
            subject         TEXT NOT NULL,
            csrf_token      TEXT NOT NULL,
            pkce_verifier   TEXT NOT NULL,
            created_at      INTEGER NOT NULL,
            expires_at      INTEGER NOT NULL,
            PRIMARY KEY (upstream_name, subject, csrf_token)
        ) WITHOUT ROWID;
        CREATE TABLE IF NOT EXISTS upstream_oauth_dynamic_clients (
            upstream_name   TEXT NOT NULL,
            subject         TEXT NOT NULL,
            client_id       TEXT NOT NULL,
            created_at      INTEGER NOT NULL,
            PRIMARY KEY (upstream_name, subject)
        ) WITHOUT ROWID;
        CREATE TABLE IF NOT EXISTS allowed_users (
            email       TEXT PRIMARY KEY NOT NULL,
            added_by    TEXT NOT NULL,
            created_at  INTEGER NOT NULL
        );",
    )
    .map_err(sqlite_error)?;

    if !existed {
        set_restrictive_permissions(path)?;
    }
    ensure_restrictive_permissions(path)?;

    Ok(conn)
}

fn validate_or_reopen_connection(conn: &mut Connection, path: &Path) -> Result<(), AuthError> {
    let Err(error) = conn.query_row("SELECT 1", [], |row| row.get::<_, i64>(0)) else {
        return Ok(());
    };
    warn!(
        path = %path.display(),
        error = %error,
        "stale sqlite connection detected, reopening"
    );

    *conn = open_connection(path)?;
    conn.query_row("SELECT 1", [], |row| row.get::<_, i64>(0))
        .map(|_| ())
        .map_err(sqlite_error)
}

#[allow(clippy::needless_pass_by_value)]
fn sqlite_error(error: rusqlite::Error) -> AuthError {
    AuthError::Storage(format!("sqlite error: {error}"))
}

fn row_to_allowed_user(row: &rusqlite::Row<'_>) -> rusqlite::Result<AllowedUserRow> {
    Ok(AllowedUserRow {
        email: row.get(0)?,
        added_by: row.get(1)?,
        created_at: row.get(2)?,
    })
}

fn row_to_authorization_request(
    row: &rusqlite::Row<'_>,
) -> rusqlite::Result<AuthorizationRequestRow> {
    Ok(AuthorizationRequestRow {
        state: row.get(0)?,
        client_id: row.get(1)?,
        redirect_uri: row.get(2)?,
        client_state: row.get(3)?,
        scope: row.get(4)?,
        provider_code_verifier: row.get(5)?,
        code_challenge: row.get(6)?,
        code_challenge_method: row.get(7)?,
        created_at: row.get(8)?,
        expires_at: row.get(9)?,
    })
}

fn row_to_authorization_code(row: &rusqlite::Row<'_>) -> rusqlite::Result<AuthorizationCodeRow> {
    Ok(AuthorizationCodeRow {
        code: row.get(0)?,
        client_id: row.get(1)?,
        subject: row.get(2)?,
        redirect_uri: row.get(3)?,
        scope: row.get(4)?,
        code_challenge: row.get(5)?,
        code_challenge_method: row.get(6)?,
        provider_refresh_token: row.get(7)?,
        created_at: row.get(8)?,
        expires_at: row.get(9)?,
    })
}

fn row_to_refresh_token(row: &rusqlite::Row<'_>) -> rusqlite::Result<RefreshTokenRow> {
    Ok(RefreshTokenRow {
        refresh_token: row.get(0)?,
        client_id: row.get(1)?,
        subject: row.get(2)?,
        scope: row.get(3)?,
        provider_refresh_token: row.get(4)?,
        created_at: row.get(5)?,
        expires_at: row.get(6)?,
    })
}

fn row_to_browser_session(row: &rusqlite::Row<'_>) -> rusqlite::Result<BrowserSessionRow> {
    Ok(BrowserSessionRow {
        session_id: row.get(0)?,
        subject: row.get(1)?,
        email: row.get(2)?,
        csrf_token: row.get(3)?,
        created_at: row.get(4)?,
        expires_at: row.get(5)?,
    })
}

fn row_to_browser_login_state(row: &rusqlite::Row<'_>) -> rusqlite::Result<BrowserLoginStateRow> {
    Ok(BrowserLoginStateRow {
        state: row.get(0)?,
        return_to: row.get(1)?,
        provider_code_verifier: row.get(2)?,
        created_at: row.get(3)?,
        expires_at: row.get(4)?,
    })
}

fn row_to_upstream_oauth_credentials(
    row: &rusqlite::Row<'_>,
) -> rusqlite::Result<UpstreamOauthCredentialRow> {
    let refresh_token_present: i64 = row.get(8)?;
    Ok(UpstreamOauthCredentialRow {
        upstream_name: row.get(0)?,
        subject: row.get(1)?,
        client_id: row.get(2)?,
        granted_scopes_json: row.get(3)?,
        token_blob: row.get(4)?,
        token_blob_nonce: row.get(5)?,
        token_received_at: row.get(6)?,
        access_token_expires_at: row.get(7)?,
        refresh_token_present: refresh_token_present != 0,
    })
}

fn row_to_upstream_oauth_state(row: &rusqlite::Row<'_>) -> rusqlite::Result<UpstreamOauthStateRow> {
    Ok(UpstreamOauthStateRow {
        upstream_name: row.get(0)?,
        subject: row.get(1)?,
        csrf_token: row.get(2)?,
        pkce_verifier: row.get(3)?,
        created_at: row.get(4)?,
        expires_at: row.get(5)?,
    })
}

#[cfg(test)]
mod tests {
    use std::path::PathBuf;

    use crate::types::{
        AllowedUserRow, AuthorizationCodeRow, BrowserSessionRow, RefreshTokenRow,
        UpstreamOauthCredentialRow, UpstreamOauthStateRow,
    };

    use crate::util::now_unix;

    use super::{SQLITE_POOL_SIZE, SqliteStore};

    #[tokio::test]
    async fn sqlite_store_enables_wal_and_busy_timeout() {
        let store = temp_store().await;
        assert_eq!(pragma(&store, "journal_mode").await, "wal");
        assert!(pragma_ms(&store, "busy_timeout").await >= 5_000);
    }

    #[tokio::test]
    async fn sqlite_store_opens_multiple_connections() {
        let store = temp_store().await;
        assert_eq!(store.connection_count(), SQLITE_POOL_SIZE);
    }

    #[tokio::test]
    async fn sqlite_store_redeems_auth_code_only_once_under_race() {
        let store = temp_store().await;
        store.insert_auth_code(sample_code()).await.unwrap();
        let (a, b) = tokio::join!(
            store.redeem_auth_code("code-123"),
            store.redeem_auth_code("code-123"),
        );
        assert!(a.is_ok() ^ b.is_ok(), "a={a:?} b={b:?}");
    }

    #[cfg(unix)]
    #[tokio::test]
    async fn sqlite_store_refuses_world_readable_database_file() {
        use std::os::unix::fs::PermissionsExt;

        let path = temp_db_path();
        std::fs::write(&path, []).unwrap();
        std::fs::set_permissions(&path, PermissionsExt::from_mode(0o644)).unwrap();
        let err = SqliteStore::open(path).await.unwrap_err();
        assert!(err.to_string().contains("permissions"));
    }

    #[tokio::test]
    async fn sqlite_store_rejects_expired_authorization_code() {
        let store = temp_store().await;
        let mut code = sample_code();
        code.expires_at = now_unix() - 1;
        store.insert_auth_code(code).await.unwrap();
        let err = store.redeem_auth_code("code-123").await.unwrap_err();
        assert!(err.to_string().contains("expired"));
    }

    #[tokio::test]
    async fn sqlite_store_ignores_expired_refresh_token() {
        let store = temp_store().await;
        store
            .upsert_refresh_token(RefreshTokenRow {
                refresh_token: "refresh-token".to_string(),
                client_id: "client".to_string(),
                subject: "google-user".to_string(),
                scope: "lab".to_string(),
                provider_refresh_token: Some("provider-refresh".to_string()),
                created_at: now_unix() - 300,
                expires_at: now_unix() - 1,
            })
            .await
            .unwrap();
        assert!(
            store
                .find_refresh_token("refresh-token")
                .await
                .unwrap()
                .is_none()
        );
    }

    #[tokio::test]
    async fn sqlite_store_cleanup_expired_removes_stale_rows() {
        let store = temp_store().await;
        let now = now_unix();

        // Insert an expired auth code.
        let mut code = sample_code();
        code.expires_at = now - 10;
        store.insert_auth_code(code).await.unwrap();

        // Insert an expired refresh token.
        store
            .upsert_refresh_token(RefreshTokenRow {
                refresh_token: "expired-refresh".to_string(),
                client_id: "client".to_string(),
                subject: "google-user".to_string(),
                scope: "lab".to_string(),
                provider_refresh_token: None,
                created_at: now - 600,
                expires_at: now - 10,
            })
            .await
            .unwrap();

        // Insert an expired authorization request.
        use crate::types::AuthorizationRequestRow;
        store
            .insert_authorization_request(AuthorizationRequestRow {
                state: "expired-state".to_string(),
                client_id: "client".to_string(),
                redirect_uri: "http://127.0.0.1:7777/callback".to_string(),
                client_state: "cs".to_string(),
                scope: "lab".to_string(),
                provider_code_verifier: "verifier".to_string(),
                code_challenge: "challenge".to_string(),
                code_challenge_method: "S256".to_string(),
                created_at: now - 600,
                expires_at: now - 10,
            })
            .await
            .unwrap();

        // Insert a valid (non-expired) refresh token.
        store
            .upsert_refresh_token(RefreshTokenRow {
                refresh_token: "valid-refresh".to_string(),
                client_id: "client".to_string(),
                subject: "google-user".to_string(),
                scope: "lab".to_string(),
                provider_refresh_token: None,
                created_at: now,
                expires_at: now + 3600,
            })
            .await
            .unwrap();

        let deleted = store.cleanup_expired().await.unwrap();
        assert_eq!(deleted, 3, "should delete exactly 3 expired rows");

        // The valid refresh token should still exist.
        assert!(
            store
                .find_refresh_token("valid-refresh")
                .await
                .unwrap()
                .is_some()
        );
    }

    async fn temp_store() -> SqliteStore {
        SqliteStore::open(temp_db_path()).await.unwrap()
    }

    async fn pragma(store: &SqliteStore, name: &str) -> String {
        store.pragma(name).await.unwrap()
    }

    async fn pragma_ms(store: &SqliteStore, name: &str) -> u64 {
        pragma(store, name).await.parse().unwrap()
    }

    fn temp_db_path() -> PathBuf {
        tempfile::tempdir().unwrap().keep().join("auth.db")
    }

    fn sample_code() -> AuthorizationCodeRow {
        let now = now_unix();
        AuthorizationCodeRow {
            code: "code-123".to_string(),
            client_id: "client".to_string(),
            subject: "google-user".to_string(),
            redirect_uri: "http://127.0.0.1:7777/callback".to_string(),
            scope: "lab".to_string(),
            code_challenge: "challenge".to_string(),
            code_challenge_method: "S256".to_string(),
            provider_refresh_token: Some("provider-refresh".to_string()),
            created_at: now,
            expires_at: now + 300,
        }
    }

    #[tokio::test]
    async fn browser_session_round_trip_succeeds() {
        let store = temp_store().await;
        let row = BrowserSessionRow {
            session_id: "sess_123".into(),
            subject: "user_1".into(),
            email: Some("jmagar@example.com".into()),
            csrf_token: "csrf_123".into(),
            created_at: 1,
            expires_at: now_unix() + 9_999,
        };

        store.upsert_browser_session(row.clone()).await.unwrap();
        let fetched = store
            .find_browser_session("sess_123")
            .await
            .unwrap()
            .unwrap();

        assert_eq!(fetched.session_id, row.session_id);
        assert_eq!(fetched.subject, row.subject);
        assert_eq!(fetched.csrf_token, row.csrf_token);
    }

    fn sample_upstream_credentials() -> UpstreamOauthCredentialRow {
        let now = now_unix();
        UpstreamOauthCredentialRow {
            upstream_name: "acme".to_string(),
            subject: "alice".to_string(),
            client_id: "client-xyz".to_string(),
            granted_scopes_json: "[\"mcp\"]".to_string(),
            token_blob: vec![1, 2, 3, 4],
            token_blob_nonce: vec![0u8; 12],
            token_received_at: now,
            access_token_expires_at: now + 3600,
            refresh_token_present: true,
        }
    }

    fn sample_upstream_state() -> UpstreamOauthStateRow {
        let now = now_unix();
        UpstreamOauthStateRow {
            upstream_name: "acme".to_string(),
            subject: "alice".to_string(),
            csrf_token: "csrf-1".to_string(),
            pkce_verifier: "verifier-1".to_string(),
            created_at: now,
            expires_at: now + 300,
        }
    }

    #[tokio::test]
    async fn sqlite_store_upsert_upstream_oauth_credentials_round_trip() {
        let store = temp_store().await;
        let row = sample_upstream_credentials();
        store
            .upsert_upstream_oauth_credentials(row.clone())
            .await
            .unwrap();

        let fetched = store
            .find_upstream_oauth_credentials("acme", "alice")
            .await
            .unwrap()
            .unwrap();

        assert_eq!(fetched.upstream_name, row.upstream_name);
        assert_eq!(fetched.subject, row.subject);
        assert_eq!(fetched.client_id, row.client_id);
        assert_eq!(fetched.granted_scopes_json, row.granted_scopes_json);
        assert_eq!(fetched.token_blob, row.token_blob);
        assert_eq!(fetched.token_blob_nonce, row.token_blob_nonce);
        assert_eq!(fetched.token_received_at, row.token_received_at);
        assert_eq!(fetched.access_token_expires_at, row.access_token_expires_at);
        assert_eq!(fetched.refresh_token_present, row.refresh_token_present);
    }

    #[tokio::test]
    async fn sqlite_store_takes_upstream_oauth_state_only_once_under_race() {
        let store = temp_store().await;
        store
            .save_upstream_oauth_state(sample_upstream_state())
            .await
            .unwrap();
        let now = now_unix();
        let (a, b) = tokio::join!(
            store.take_upstream_oauth_state("acme", "alice", "csrf-1", now),
            store.take_upstream_oauth_state("acme", "alice", "csrf-1", now),
        );
        let a_some = matches!(a, Ok(Some(_)));
        let b_some = matches!(b, Ok(Some(_)));
        assert!(
            a_some ^ b_some,
            "exactly one take should win: a={a:?} b={b:?}"
        );
    }

    #[tokio::test]
    async fn sqlite_store_rejects_state_ttl_over_600s() {
        let store = temp_store().await;
        let mut row = sample_upstream_state();
        row.created_at = 1_000;
        row.expires_at = 1_000 + 601;
        let err = store.save_upstream_oauth_state(row).await.unwrap_err();
        assert!(err.to_string().contains("600"));
    }

    #[tokio::test]
    async fn sqlite_store_cleanup_expired_drops_state() {
        let store = temp_store().await;
        let now = now_unix();
        let row = UpstreamOauthStateRow {
            upstream_name: "acme".to_string(),
            subject: "alice".to_string(),
            csrf_token: "csrf-expired".to_string(),
            pkce_verifier: "verifier-expired".to_string(),
            created_at: now - 400,
            expires_at: now - 10,
        };
        store.save_upstream_oauth_state(row).await.unwrap();

        store.cleanup_expired().await.unwrap();

        let fetched = store
            .take_upstream_oauth_state("acme", "alice", "csrf-expired", now)
            .await
            .unwrap();
        assert!(fetched.is_none(), "expired state should be gone");
    }

    #[tokio::test]
    async fn sqlite_store_credentials_isolated_per_subject() {
        let store = temp_store().await;
        let mut row1 = sample_upstream_credentials();
        row1.subject = "alice".to_string();
        let mut row2 = sample_upstream_credentials();
        row2.subject = "bob".to_string();
        store.upsert_upstream_oauth_credentials(row1).await.unwrap();
        store.upsert_upstream_oauth_credentials(row2).await.unwrap();

        store
            .delete_upstream_oauth_credentials("acme", "alice")
            .await
            .unwrap();

        assert!(
            store
                .find_upstream_oauth_credentials("acme", "alice")
                .await
                .unwrap()
                .is_none()
        );
        assert!(
            store
                .find_upstream_oauth_credentials("acme", "bob")
                .await
                .unwrap()
                .is_some()
        );
    }

    #[tokio::test]
    async fn sqlite_store_upsert_overwrites_existing_credentials() {
        let store = temp_store().await;
        let row1 = sample_upstream_credentials();
        store.upsert_upstream_oauth_credentials(row1).await.unwrap();

        let mut row2 = sample_upstream_credentials();
        row2.client_id = "client-rotated".to_string();
        row2.token_blob = vec![9, 9, 9];
        store.upsert_upstream_oauth_credentials(row2).await.unwrap();

        let fetched = store
            .find_upstream_oauth_credentials("acme", "alice")
            .await
            .unwrap()
            .unwrap();
        assert_eq!(fetched.client_id, "client-rotated");
        assert_eq!(fetched.token_blob, vec![9, 9, 9]);
    }

    #[tokio::test]
    async fn dynamic_client_registration_round_trip() {
        let store = temp_store().await;

        // Nothing stored yet.
        assert!(
            store
                .find_dynamic_client_registration("acme", "alice")
                .await
                .unwrap()
                .is_none()
        );

        // Save and retrieve.
        store
            .save_dynamic_client_registration("acme", "alice", "client-dyn-1")
            .await
            .unwrap();
        let found = store
            .find_dynamic_client_registration("acme", "alice")
            .await
            .unwrap()
            .unwrap();
        assert_eq!(found, "client-dyn-1");

        // Upsert with a new client_id (server re-registered).
        store
            .save_dynamic_client_registration("acme", "alice", "client-dyn-2")
            .await
            .unwrap();
        let found2 = store
            .find_dynamic_client_registration("acme", "alice")
            .await
            .unwrap()
            .unwrap();
        assert_eq!(found2, "client-dyn-2");

        // Delete and confirm gone; other subjects unaffected.
        store
            .save_dynamic_client_registration("acme", "bob", "client-dyn-bob")
            .await
            .unwrap();
        store
            .delete_dynamic_client_registration("acme", "alice")
            .await
            .unwrap();
        assert!(
            store
                .find_dynamic_client_registration("acme", "alice")
                .await
                .unwrap()
                .is_none()
        );
        assert!(
            store
                .find_dynamic_client_registration("acme", "bob")
                .await
                .unwrap()
                .is_some()
        );
    }

    #[tokio::test]
    async fn revoking_browser_session_removes_it() {
        let store = temp_store().await;
        let row = BrowserSessionRow {
            session_id: "sess_123".into(),
            subject: "user_1".into(),
            email: None,
            csrf_token: "csrf_123".into(),
            created_at: 1,
            expires_at: now_unix() + 9_999,
        };

        store.upsert_browser_session(row).await.unwrap();
        store.revoke_browser_session("sess_123").await.unwrap();

        assert!(
            store
                .find_browser_session("sess_123")
                .await
                .unwrap()
                .is_none()
        );
    }

    // ── allowed_users tests ─────────────────────────────────────────────────

    #[tokio::test]
    async fn allowed_users_add_and_list() {
        let store = temp_store().await;
        store
            .add_allowed_user("alice@example.com", "admin", now_unix())
            .await
            .unwrap();
        let rows = store.list_allowed_users().await.unwrap();
        assert_eq!(rows.len(), 1);
        assert_eq!(rows[0].email, "alice@example.com");
        assert_eq!(rows[0].added_by, "admin");
    }

    #[tokio::test]
    async fn allowed_users_duplicate_returns_validation_error() {
        let store = temp_store().await;
        let now = now_unix();
        store
            .add_allowed_user("bob@example.com", "admin", now)
            .await
            .unwrap();
        let err = store
            .add_allowed_user("bob@example.com", "admin2", now)
            .await
            .unwrap_err();
        assert!(
            matches!(err, crate::error::AuthError::Validation(_)),
            "expected Validation, got {err:?}"
        );
    }

    #[tokio::test]
    async fn allowed_users_input_is_lowercased() {
        let store = temp_store().await;
        store
            .add_allowed_user("Alice@Example.COM", "admin", now_unix())
            .await
            .unwrap();
        let rows = store.list_allowed_users().await.unwrap();
        assert_eq!(rows.len(), 1);
        assert_eq!(rows[0].email, "alice@example.com");
    }

    #[tokio::test]
    async fn allowed_users_remove_nonexistent_is_idempotent() {
        let store = temp_store().await;
        // Must not error even when no row exists.
        store
            .remove_allowed_user("nobody@example.com")
            .await
            .unwrap();
    }

    #[tokio::test]
    async fn allowed_users_list_ordered_by_created_at_asc() {
        let store = temp_store().await;
        let base = now_unix();
        store
            .add_allowed_user("third@example.com", "admin", base + 2)
            .await
            .unwrap();
        store
            .add_allowed_user("first@example.com", "admin", base)
            .await
            .unwrap();
        store
            .add_allowed_user("second@example.com", "admin", base + 1)
            .await
            .unwrap();
        let rows = store.list_allowed_users().await.unwrap();
        let emails: Vec<&str> = rows.iter().map(|r| r.email.as_str()).collect();
        assert_eq!(
            emails,
            vec![
                "first@example.com",
                "second@example.com",
                "third@example.com"
            ]
        );
    }

    #[tokio::test]
    async fn allowed_users_schema_bootstrap_is_idempotent() {
        // Open the same file twice; second open must not error.
        let path = temp_db_path();
        let _store1 = SqliteStore::open(path.clone()).await.unwrap();
        let _store2 = SqliteStore::open(path).await.unwrap();
    }

    // Ensure AllowedUserRow is importable as the right type in tests.
    #[allow(dead_code)]
    fn _assert_allowed_user_row_type() -> AllowedUserRow {
        AllowedUserRow {
            email: String::new(),
            added_by: String::new(),
            created_at: 0,
        }
    }
}
