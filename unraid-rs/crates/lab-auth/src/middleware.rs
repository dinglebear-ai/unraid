//! Dual-mode bearer/JWT/cookie auth middleware shipped as a [`tower::Layer`].
//!
//! Consumers integrate with `.layer(AuthLayer::new(...))` rather than wrapping
//! a free `authenticate_request` function in a closure-of-7-args. The
//! middleware writes an [`AuthContext`] into request extensions on success,
//! returns an [`AuthError`]-shaped 401 response on failure, and (for cookie
//! mode + browser GETs) optionally redirects to a configured login path so the
//! Google OAuth flow can establish a session.
//!
//! Precedence (matches the legacy lab middleware):
//!
//! 1. `Authorization: Bearer <token>` matches the static bearer (constant-time
//!    compare) -> grants `static_token_scopes`.
//! 2. `Authorization: Bearer <token>` validates as a JWT issued by the local
//!    auth state (audience + issuer enforced inside
//!    [`crate::jwt::SigningKeys::validate_access_token_with_issuer`]) ->
//!    grants the JWT-claim scopes.
//! 3. (Optional, when [`AuthLayer`] was constructed with
//!    `allow_session_cookie = true`.) Browser session cookie matches a row in
//!    the auth store, with CSRF enforced for non-GET/HEAD/OPTIONS.
//! 4. Otherwise, browser GET requests with `Accept: text/html` are redirected
//!    to the configured login path; everything else returns 401 with
//!    `WWW-Authenticate: Bearer resource_metadata=...`.

use std::convert::Infallible;
use std::future::Future;
use std::pin::Pin;
use std::sync::Arc;
use std::task::{Context, Poll};

use axum::body::Body;
use axum::http::{HeaderValue, Method, Request, header};
use axum::response::{IntoResponse, Redirect, Response};
use subtle::ConstantTimeEq;
use tower::{Layer, Service};

use crate::auth_context::{AuthContext, www_authenticate_value};
use crate::error::AuthError;
use crate::metadata::canonical_resource_url;
use crate::session;
use crate::state::AuthState;

/// Closure-erased actor-key derivation hook.
///
/// Consumers that have a notion of an opaque actor identifier (lab uses an
/// HMAC over the JWT subject for non-PII observability) build one and pass
/// it through [`AuthLayer::with_actor_key_deriver`]. Consumers without this
/// concept (e.g. syslog-mcp) leave it unset.
///
/// The closure receives the JWT `sub` (or `"static-bearer"` /
/// browser-session subject) and returns a per-request [`Arc<str>`] key.
pub type ActorKeyDeriver = dyn Fn(&str) -> Option<Arc<str>> + Send + Sync;

/// Tower layer that authenticates inbound requests and writes
/// [`AuthContext`] into request extensions.
///
/// Construct via [`AuthLayer::new`] and customize with the chained
/// `with_*` helpers.
#[derive(Clone)]
pub struct AuthLayer {
    inner: Arc<AuthLayerInner>,
}

#[derive(Clone)]
struct AuthLayerInner {
    static_token: Option<Arc<str>>,
    auth_state: Option<Arc<AuthState>>,
    actor_key_deriver: Option<Arc<ActorKeyDeriver>>,
    resource_url: Option<Arc<str>>,
    allow_session_cookie: bool,
    /// Scopes minted into the [`AuthContext`] when the static bearer or
    /// session-cookie path matches. For the static path this is the legacy
    /// `static_token_scopes` config; for the cookie path lab keeps the same
    /// list (browser-session subjects are admin-equivalent today).
    static_token_scopes: Vec<String>,
    /// Browser login path used for the GET+text/html unauthenticated
    /// redirect (when `allow_session_cookie` is `true`). Defaults to
    /// `/auth/login` per [`crate::config::DEFAULT_LOGIN_PATH`].
    login_path: String,
    /// Browser session cookie name. Read from
    /// [`crate::config::AuthConfig::session_cookie_name`] when an
    /// `auth_state` is supplied; otherwise this is unused.
    session_cookie_name: String,
}

impl AuthLayer {
    /// Build a bearer-only layer with neither a static token nor an auth
    /// state. Such a layer always rejects requests with 401 — useful only
    /// as a placeholder; real consumers immediately chain at least one of
    /// [`Self::with_static_token`] / [`Self::with_auth_state`].
    #[must_use]
    pub fn new() -> Self {
        Self {
            inner: Arc::new(AuthLayerInner {
                static_token: None,
                auth_state: None,
                actor_key_deriver: None,
                resource_url: None,
                allow_session_cookie: false,
                static_token_scopes: Vec::new(),
                login_path: crate::config::DEFAULT_LOGIN_PATH.to_string(),
                session_cookie_name: crate::config::DEFAULT_SESSION_COOKIE_NAME.to_string(),
            }),
        }
    }

    /// Convenience constructor that pulls
    /// `static_token_scopes`, `login_path`, and `session_cookie_name`
    /// directly from the supplied [`AuthState`]'s config — typically the
    /// only call sites consumers need.
    #[must_use]
    pub fn from_state(auth_state: Arc<AuthState>) -> Self {
        let cfg = &auth_state.config;
        let static_token_scopes = cfg.static_token_scopes.clone();
        let login_path = cfg.login_path.clone();
        let session_cookie_name = cfg.session_cookie_name.clone();
        Self {
            inner: Arc::new(AuthLayerInner {
                static_token: None,
                auth_state: Some(auth_state),
                actor_key_deriver: None,
                resource_url: None,
                allow_session_cookie: false,
                static_token_scopes,
                login_path,
                session_cookie_name,
            }),
        }
    }

    fn with(mut self, mutate: impl FnOnce(&mut AuthLayerInner)) -> Self {
        let inner = Arc::make_mut(&mut self.inner);
        mutate(inner);
        self
    }

    #[must_use]
    pub fn with_static_token(self, token: Option<Arc<str>>) -> Self {
        self.with(|inner| inner.static_token = token)
    }

    #[must_use]
    pub fn with_auth_state(self, state: Option<Arc<AuthState>>) -> Self {
        self.with(|inner| {
            if let Some(state) = state.as_ref() {
                let cfg = &state.config;
                inner.static_token_scopes = cfg.static_token_scopes.clone();
                inner.login_path = cfg.login_path.clone();
                inner.session_cookie_name = cfg.session_cookie_name.clone();
            }
            inner.auth_state = state;
        })
    }

    #[must_use]
    pub fn with_actor_key_deriver(self, deriver: Option<Arc<ActorKeyDeriver>>) -> Self {
        self.with(|inner| inner.actor_key_deriver = deriver)
    }

    #[must_use]
    pub fn with_resource_url(self, resource_url: Option<Arc<str>>) -> Self {
        self.with(|inner| inner.resource_url = resource_url)
    }

    #[must_use]
    pub fn with_allow_session_cookie(self, allow: bool) -> Self {
        self.with(|inner| inner.allow_session_cookie = allow)
    }

    /// Override the static-token scope list (defaults to the value pulled
    /// from `AuthConfig::static_token_scopes` via [`Self::from_state`] /
    /// [`Self::with_auth_state`]).
    #[must_use]
    pub fn with_static_token_scopes(self, scopes: Vec<String>) -> Self {
        self.with(|inner| inner.static_token_scopes = scopes)
    }

    /// Override the browser login path used for the GET+text/html
    /// unauthenticated redirect.
    #[must_use]
    pub fn with_login_path(self, path: impl Into<String>) -> Self {
        self.with(|inner| inner.login_path = path.into())
    }

    /// Override the session cookie name read from inbound requests.
    #[must_use]
    pub fn with_session_cookie_name(self, name: impl Into<String>) -> Self {
        self.with(|inner| inner.session_cookie_name = name.into())
    }
}

impl Default for AuthLayer {
    fn default() -> Self {
        Self::new()
    }
}

impl<S> Layer<S> for AuthLayer {
    type Service = AuthService<S>;

    fn layer(&self, inner: S) -> Self::Service {
        AuthService {
            inner,
            layer: self.inner.clone(),
        }
    }
}

/// Service half of [`AuthLayer`]. Forwards to `inner` after a successful
/// authentication; otherwise short-circuits with a 401 / redirect response.
#[derive(Clone)]
pub struct AuthService<S> {
    inner: S,
    layer: Arc<AuthLayerInner>,
}

impl<S> Service<Request<Body>> for AuthService<S>
where
    S: Service<Request<Body>, Response = Response, Error = Infallible> + Clone + Send + 'static,
    S::Future: Send + 'static,
{
    type Response = Response;
    type Error = Infallible;
    type Future = Pin<Box<dyn Future<Output = Result<Response, Infallible>> + Send>>;

    fn poll_ready(&mut self, cx: &mut Context<'_>) -> Poll<Result<(), Infallible>> {
        self.inner.poll_ready(cx)
    }

    fn call(&mut self, request: Request<Body>) -> Self::Future {
        // Per tower::Service contract, `call` may take a stale `self.inner`
        // because Service callers clone the service before calling. We follow
        // the standard tower middleware idiom: clone, then swap so the
        // freshly-readied service is the one we call.
        let clone = self.inner.clone();
        let inner = std::mem::replace(&mut self.inner, clone);
        let layer = self.layer.clone();
        Box::pin(authenticate_and_forward(layer, inner, request))
    }
}

async fn authenticate_and_forward<S>(
    layer: Arc<AuthLayerInner>,
    mut inner: S,
    request: Request<Body>,
) -> Result<Response, Infallible>
where
    S: Service<Request<Body>, Response = Response, Error = Infallible> + Send,
    S::Future: Send,
{
    match authenticate(&layer, request).await {
        Ok(request) => inner.call(request).await,
        Err(response) => Ok(response),
    }
}

/// Core authentication routine. Returns the (possibly mutated) request on
/// success so the wrapping Service can forward it; returns a finished
/// [`Response`] on failure (401, redirect, etc.).
async fn authenticate(
    layer: &AuthLayerInner,
    mut request: Request<Body>,
) -> Result<Request<Body>, Response> {
    let auth_header = request
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|v| v.to_str().ok())
        .and_then(parse_bearer_token);

    if let Some(token) = auth_header {
        // 1. Static bearer match — skipped when the consumer has set
        //    `disable_static_token_with_oauth=true` and OAuth mode is active.
        let static_token_blocked = layer.auth_state.as_ref().is_some_and(|s| {
            s.config.disable_static_token_with_oauth
                && matches!(s.config.mode, crate::config::AuthMode::OAuth)
        });
        if !static_token_blocked
            && let Some(ref expected) = layer.static_token
            && tokens_equal(&token, expected.as_ref())
        {
            let sub = "static-bearer".to_string();
            let actor_key = derive_actor_key(layer.actor_key_deriver.as_deref(), &sub);
            request.extensions_mut().insert(AuthContext {
                sub,
                actor_key,
                scopes: layer.static_token_scopes.clone(),
                issuer: "local".to_string(),
                via_session: false,
                csrf_token: None,
                email: None,
            });
            return Ok(request);
        }

        // 2. JWT validation.
        if let Some(ref auth_state) = layer.auth_state {
            let Some(expected_issuer) = auth_state
                .config
                .public_url
                .as_ref()
                .map(|url| url.as_str().trim_end_matches('/').to_string())
            else {
                return Err(auth_error_response(
                    "server misconfigured: PUBLIC_URL required for JWT validation",
                    layer.resource_url.as_deref(),
                ));
            };
            let expected_aud = canonical_resource_url(auth_state);
            match auth_state.signing_keys.validate_access_token_with_issuer(
                &token,
                &expected_aud,
                &expected_issuer,
            ) {
                Ok(claims) => {
                    let actor_key =
                        derive_actor_key(layer.actor_key_deriver.as_deref(), &claims.sub);
                    request.extensions_mut().insert(AuthContext {
                        actor_key,
                        sub: claims.sub,
                        scopes: claims
                            .scope
                            .split_whitespace()
                            .filter(|scope| !scope.is_empty())
                            .map(ToOwned::to_owned)
                            .collect(),
                        issuer: claims.iss,
                        via_session: false,
                        csrf_token: None,
                        email: None,
                    });
                    return Ok(request);
                }
                Err(error) => {
                    tracing::debug!(error = %error, "lab-auth JWT validation failed");
                }
            }
        }

        return Err(auth_error_response(
            "invalid bearer token",
            layer.resource_url.as_deref(),
        ));
    }

    // 3. Browser session cookie path.
    if layer.allow_session_cookie
        && let Some(auth_state) = layer.auth_state.as_ref()
        && let Some(session_id) =
            session::read_cookie(request.headers(), &layer.session_cookie_name)
    {
        match auth_state.store.find_browser_session(&session_id).await {
            Ok(Some(session)) => {
                if !matches!(
                    *request.method(),
                    Method::GET | Method::HEAD | Method::OPTIONS
                ) {
                    let csrf = request
                        .headers()
                        .get(session::BROWSER_CSRF_HEADER_NAME)
                        .and_then(|value| value.to_str().ok());
                    if csrf != Some(session.csrf_token.as_str()) {
                        return Err(csrf_error_response("missing or invalid csrf token"));
                    }
                }

                let actor_key =
                    derive_actor_key(layer.actor_key_deriver.as_deref(), &session.subject);
                request.extensions_mut().insert(AuthContext {
                    actor_key,
                    sub: session.subject,
                    scopes: layer.static_token_scopes.clone(),
                    issuer: "browser-session".to_string(),
                    via_session: true,
                    csrf_token: Some(session.csrf_token),
                    email: session.email,
                });
                return Ok(request);
            }
            Ok(None) => {}
            Err(error) => {
                tracing::debug!(error = %error, "browser session lookup failed");
            }
        }
    }

    // 4. Browser GET → redirect to login_path.
    if layer.allow_session_cookie
        && layer.auth_state.is_some()
        && *request.method() == Method::GET
        && request
            .headers()
            .get(header::ACCEPT)
            .and_then(|v| v.to_str().ok())
            .is_some_and(|accept| accept.contains("text/html"))
    {
        let return_to = request
            .uri()
            .path_and_query()
            .map(|pq| pq.as_str())
            .unwrap_or("/");
        let encoded = percent_encode_path(return_to);
        let login_url = format!("{}?return_to={encoded}", layer.login_path);
        return Err(Redirect::to(&login_url).into_response());
    }

    Err(auth_error_response(
        if layer.allow_session_cookie {
            "missing bearer token or session cookie"
        } else {
            "missing bearer token"
        },
        layer.resource_url.as_deref(),
    ))
}

/// Constant-time byte comparison for static-bearer matching (prevents
/// timing-based prefix leakage).
#[must_use]
pub fn tokens_equal(a: &str, b: &str) -> bool {
    a.as_bytes().ct_eq(b.as_bytes()).into()
}

/// Parse a single `Authorization: Bearer <token>` header value, returning
/// `None` for malformed or non-Bearer schemes.
#[must_use]
pub fn parse_bearer_token(header_value: &str) -> Option<String> {
    let mut parts = header_value.split_whitespace();
    let scheme = parts.next()?;
    let token = parts.next()?;
    if parts.next().is_some() || !scheme.eq_ignore_ascii_case("bearer") {
        return None;
    }
    Some(token.to_string())
}

fn derive_actor_key(deriver: Option<&ActorKeyDeriver>, subject: &str) -> Option<Arc<str>> {
    deriver.and_then(|deriver| deriver(subject))
}

/// Build a 401 response wrapping [`AuthError::AuthFailed`] and decorate it
/// with `WWW-Authenticate` when a `resource_url` was supplied.
fn auth_error_response(message: &str, resource_url: Option<&str>) -> Response {
    let mut response = AuthError::AuthFailed(message.to_string()).into_response();
    if let Some(url) = resource_url {
        let www_auth = www_authenticate_value(url);
        if let Ok(value) = HeaderValue::from_str(&www_auth) {
            response
                .headers_mut()
                .insert(header::WWW_AUTHENTICATE, value);
        }
    }
    response
}

fn csrf_error_response(message: &str) -> Response {
    AuthError::Validation(message.to_string()).into_response()
}

fn percent_encode_path(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for b in s.bytes() {
        if b.is_ascii_alphanumeric() || matches!(b, b'-' | b'_' | b'.' | b'~' | b'/' | b'?') {
            out.push(b as char);
        } else {
            out.push('%');
            out.push(
                char::from_digit(u32::from(b >> 4), 16)
                    .unwrap()
                    .to_ascii_uppercase(),
            );
            out.push(
                char::from_digit(u32::from(b & 0xf), 16)
                    .unwrap()
                    .to_ascii_uppercase(),
            );
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::Router;
    use axum::http::{Request as HttpRequest, StatusCode};
    use axum::routing::get;
    use tower::ServiceExt;

    use crate::authorize::tests::{test_auth_config, test_auth_state, test_auth_state_with_config};

    fn echo_app(layer: AuthLayer) -> Router {
        Router::new()
            .route("/probe", get(|| async { "ok" }))
            .route_layer(layer)
    }

    #[test]
    fn parse_bearer_token_accepts_valid_header() {
        assert_eq!(
            parse_bearer_token("Bearer abc.def").as_deref(),
            Some("abc.def")
        );
        assert_eq!(
            parse_bearer_token("bearer abc.def").as_deref(),
            Some("abc.def")
        );
    }

    #[test]
    fn parse_bearer_token_rejects_malformed() {
        assert_eq!(parse_bearer_token("Basic abc.def"), None);
        assert_eq!(parse_bearer_token("Bearer"), None);
        assert_eq!(parse_bearer_token("Bearer one two"), None);
        assert_eq!(parse_bearer_token(""), None);
    }

    #[test]
    fn tokens_equal_distinguishes_unequal_strings() {
        assert!(tokens_equal("abc", "abc"));
        assert!(!tokens_equal("abc", "abd"));
        assert!(!tokens_equal("abc", "abcd"));
    }

    #[tokio::test(flavor = "current_thread")]
    async fn missing_bearer_token_returns_401_with_www_authenticate() {
        let layer =
            AuthLayer::new().with_resource_url(Some(Arc::<str>::from("https://lab.example.com")));
        let app = echo_app(layer);
        let response = app
            .oneshot(
                HttpRequest::builder()
                    .uri("/probe")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
        let www = response
            .headers()
            .get(header::WWW_AUTHENTICATE)
            .and_then(|v| v.to_str().ok())
            .unwrap_or_default();
        assert!(
            www.contains("resource_metadata="),
            "missing resource_metadata in WWW-Authenticate: `{www}`"
        );
    }

    #[tokio::test(flavor = "current_thread")]
    async fn static_bearer_match_grants_configured_scopes() {
        let token: Arc<str> = Arc::<str>::from("super-secret");
        let layer = AuthLayer::new()
            .with_static_token(Some(token.clone()))
            .with_static_token_scopes(vec!["syslog:read".to_string(), "syslog:admin".to_string()]);
        let app = Router::new()
            .route(
                "/probe",
                get(
                    |axum::Extension(ctx): axum::Extension<AuthContext>| async move {
                        ctx.scopes.join(",")
                    },
                ),
            )
            .route_layer(layer);

        let response = app
            .oneshot(
                HttpRequest::builder()
                    .uri("/probe")
                    .header(header::AUTHORIZATION, "Bearer super-secret")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);
        let body = axum::body::to_bytes(response.into_body(), 1024)
            .await
            .unwrap();
        assert_eq!(&body[..], b"syslog:read,syslog:admin");
    }

    #[tokio::test(flavor = "current_thread")]
    async fn wrong_static_bearer_rejected() {
        let layer = AuthLayer::new().with_static_token(Some(Arc::<str>::from("super-secret")));
        let app = echo_app(layer);

        let response = app
            .oneshot(
                HttpRequest::builder()
                    .uri("/probe")
                    .header(header::AUTHORIZATION, "Bearer wrong")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    }

    #[tokio::test(flavor = "current_thread")]
    async fn jwt_validation_path_accepts_signed_token_and_writes_context() {
        let state = Arc::new(test_auth_state().await);
        let aud = canonical_resource_url(&state);
        let iss = state
            .config
            .public_url
            .as_ref()
            .map(|url| url.as_str().trim_end_matches('/').to_string())
            .unwrap();
        let claims = crate::jwt::AccessClaims {
            iss: iss.clone(),
            sub: "user@example.com".to_string(),
            aud: aud.clone(),
            exp: (crate::util::now_unix() + 60) as usize,
            iat: crate::util::now_unix() as usize,
            jti: "j-1".to_string(),
            scope: "syslog:read syslog:admin".to_string(),
            azp: String::new(),
        };
        let token = state.signing_keys.issue_access_token(&claims).unwrap();
        let layer = AuthLayer::from_state(state);
        let app = Router::new()
            .route(
                "/probe",
                get(
                    |axum::Extension(ctx): axum::Extension<AuthContext>| async move {
                        format!("{}|{}", ctx.sub, ctx.scopes.join(","))
                    },
                ),
            )
            .route_layer(layer);

        let response = app
            .oneshot(
                HttpRequest::builder()
                    .uri("/probe")
                    .header(header::AUTHORIZATION, format!("Bearer {token}"))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);
        let body = axum::body::to_bytes(response.into_body(), 1024)
            .await
            .unwrap();
        assert_eq!(&body[..], b"user@example.com|syslog:read,syslog:admin");
    }

    #[tokio::test(flavor = "current_thread")]
    async fn jwt_with_wrong_issuer_rejected() {
        let state = Arc::new(test_auth_state().await);
        let aud = canonical_resource_url(&state);
        let claims = crate::jwt::AccessClaims {
            iss: "https://attacker.example.com".to_string(),
            sub: "user@example.com".to_string(),
            aud,
            exp: (crate::util::now_unix() + 60) as usize,
            iat: crate::util::now_unix() as usize,
            jti: "j-1".to_string(),
            scope: "syslog:read".to_string(),
            azp: String::new(),
        };
        let token = state.signing_keys.issue_access_token(&claims).unwrap();
        let layer = AuthLayer::from_state(state)
            .with_resource_url(Some(Arc::<str>::from("https://lab.example.com")));
        let app = echo_app(layer);

        let response = app
            .oneshot(
                HttpRequest::builder()
                    .uri("/probe")
                    .header(header::AUTHORIZATION, format!("Bearer {token}"))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    }

    #[tokio::test(flavor = "current_thread")]
    async fn jwt_with_wrong_audience_rejected() {
        let state = Arc::new(test_auth_state().await);
        let iss = state
            .config
            .public_url
            .as_ref()
            .map(|url| url.as_str().trim_end_matches('/').to_string())
            .unwrap();
        let claims = crate::jwt::AccessClaims {
            iss,
            sub: "user@example.com".to_string(),
            aud: "https://other.example.com/mcp".to_string(),
            exp: (crate::util::now_unix() + 60) as usize,
            iat: crate::util::now_unix() as usize,
            jti: "j-1".to_string(),
            scope: "syslog:read".to_string(),
            azp: String::new(),
        };
        let token = state.signing_keys.issue_access_token(&claims).unwrap();
        let layer = AuthLayer::from_state(state);
        let app = echo_app(layer);

        let response = app
            .oneshot(
                HttpRequest::builder()
                    .uri("/probe")
                    .header(header::AUTHORIZATION, format!("Bearer {token}"))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    }

    #[tokio::test(flavor = "current_thread")]
    async fn html_get_with_session_cookie_enabled_redirects_to_login_path() {
        let state = Arc::new(test_auth_state().await);
        let layer = AuthLayer::from_state(state)
            .with_allow_session_cookie(true)
            .with_login_path("/auth/login");
        let app = echo_app(layer);

        let response = app
            .oneshot(
                HttpRequest::builder()
                    .uri("/probe?x=1")
                    .header(header::ACCEPT, "text/html")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::SEE_OTHER);
        let location = response
            .headers()
            .get(header::LOCATION)
            .and_then(|v| v.to_str().ok())
            .unwrap_or_default();
        assert!(
            location.starts_with("/auth/login?return_to="),
            "unexpected redirect Location: `{location}`"
        );
    }

    #[tokio::test(flavor = "current_thread")]
    async fn html_get_uses_configured_login_path_override() {
        let state = Arc::new(test_auth_state().await);
        let layer = AuthLayer::from_state(state)
            .with_allow_session_cookie(true)
            .with_login_path("/syslog/auth/login");
        let app = echo_app(layer);

        let response = app
            .oneshot(
                HttpRequest::builder()
                    .uri("/probe")
                    .header(header::ACCEPT, "text/html")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::SEE_OTHER);
        let location = response
            .headers()
            .get(header::LOCATION)
            .and_then(|v| v.to_str().ok())
            .unwrap_or_default();
        assert!(
            location.starts_with("/syslog/auth/login?return_to="),
            "unexpected redirect Location: `{location}`"
        );
    }

    #[tokio::test(flavor = "current_thread")]
    async fn static_bearer_blocked_when_disable_static_token_with_oauth_is_set() {
        // When disable_static_token_with_oauth=true and mode=OAuth, the static
        // token must be rejected even though the token value matches.
        let mut config = test_auth_config();
        config.disable_static_token_with_oauth = true;
        let state = Arc::new(test_auth_state_with_config(config).await);

        let token: Arc<str> = Arc::from("super-secret");
        let layer = AuthLayer::from_state(state).with_static_token(Some(token.clone()));
        let app = echo_app(layer);

        let response = app
            .oneshot(
                HttpRequest::builder()
                    .uri("/probe")
                    .header(header::AUTHORIZATION, "Bearer super-secret")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        // Must be 401 — static token blocked because OAuth is active.
        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    }
}
