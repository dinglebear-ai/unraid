use axum::Router;
use axum::extract::Request;
use axum::http::{HeaderMap, StatusCode};
use axum::middleware::{self, Next};
use axum::response::Response;
use axum::routing::{get, post};
use std::time::Instant;

use crate::authorize::{authorize, browser_login, callback, register_client};
use crate::error::AuthErrorKind;
use crate::metadata::{authorization_server_metadata, jwks, protected_resource_metadata};
use crate::state::AuthState;
use crate::token::token;

pub fn router(state: AuthState) -> Router {
    let enable_registration = state.config.enable_dynamic_registration;
    let mut app = Router::new()
        .route(
            "/.well-known/oauth-authorization-server",
            get(authorization_server_metadata),
        )
        .route(
            "/.well-known/oauth-protected-resource",
            get(protected_resource_metadata),
        )
        .route("/jwks", get(jwks))
        .route("/authorize", get(authorize))
        .route("/auth/login", get(browser_login))
        .route("/auth/google/callback", get(callback))
        .route("/token", post(token));
    if enable_registration {
        app = app.route("/register", post(register_client));
    }
    app.with_state(state)
        .layer(middleware::from_fn(auth_dispatch_observability))
}

/// Bearer-only OAuth subset router for headless consumers (e.g. syslog-mcp).
///
/// Mounts only the endpoints a non-browser MCP client needs to discover and
/// exchange tokens — `/.well-known/*`, `/jwks`, `/authorize`,
/// `/auth/google/callback`, and `/token`. Excludes:
///
/// - `/auth/login` (browser HTML — no UI on a headless service).
/// - `/register` (RFC 7591 dynamic client registration — extra attack
///   surface with no current consumer).
/// - Any session-cookie endpoints.
///
/// Use [`router`] for the full surface (lab itself).
pub fn bearer_only_router(state: AuthState) -> Router {
    Router::new()
        .route(
            "/.well-known/oauth-authorization-server",
            get(authorization_server_metadata),
        )
        .route(
            "/.well-known/oauth-protected-resource",
            get(protected_resource_metadata),
        )
        .route("/jwks", get(jwks))
        .route("/authorize", get(authorize))
        .route("/auth/google/callback", get(callback))
        .route("/token", post(token))
        .with_state(state)
        .layer(middleware::from_fn(auth_dispatch_observability))
}

/// Pinned snapshot of the routes mounted by [`bearer_only_router`]. Sorted.
///
/// If you add or remove an endpoint in `bearer_only_router`, update this
/// list AND consider whether the change is intentional — silently
/// drifting the headless subset is the bug this snapshot exists to catch
/// (REVIEW-APPLIED #9).
pub const BEARER_ONLY_ROUTER_PATHS: &[(&str, &str)] = &[
    ("GET", "/.well-known/oauth-authorization-server"),
    ("GET", "/.well-known/oauth-protected-resource"),
    ("GET", "/authorize"),
    ("GET", "/auth/google/callback"),
    ("GET", "/jwks"),
    ("POST", "/token"),
];

/// Paths that must NOT be mounted by [`bearer_only_router`] — verified
/// by the snapshot test.
pub const BEARER_ONLY_ROUTER_FORBIDDEN_PATHS: &[(&str, &str)] =
    &[("GET", "/auth/login"), ("POST", "/register")];

async fn auth_dispatch_observability(request: Request, next: Next) -> Response {
    let action = auth_dispatch_action(request.uri().path());
    let request_id = request_id(request.headers()).map(ToOwned::to_owned);
    let start = Instant::now();
    let response = next.run(request).await;
    let elapsed_ms = start.elapsed().as_millis();
    let status = response.status();
    let kind = response
        .extensions()
        .get::<AuthErrorKind>()
        .map(|kind| kind.0)
        .or_else(|| status_error_kind(status));

    if status.is_server_error() || status.is_client_error() {
        tracing::warn!(
            surface = "api",
            service = "auth",
            action,
            request_id = request_id.as_deref(),
            elapsed_ms,
            kind,
            status = status.as_u16(),
            "dispatch.error"
        );
    } else {
        tracing::info!(
            surface = "api",
            service = "auth",
            action,
            request_id = request_id.as_deref(),
            elapsed_ms,
            status = status.as_u16(),
            "dispatch.finish"
        );
    }

    response
}

fn request_id(headers: &HeaderMap) -> Option<&str> {
    headers
        .get("x-request-id")
        .and_then(|value| value.to_str().ok())
}

fn status_error_kind(status: StatusCode) -> Option<&'static str> {
    if status.is_client_error() {
        Some("request_failed")
    } else if status.is_server_error() {
        Some("internal_error")
    } else {
        None
    }
}

fn auth_dispatch_action(path: &str) -> &'static str {
    match path {
        "/.well-known/oauth-authorization-server" => "oauth.metadata.authorization_server",
        "/.well-known/oauth-protected-resource" => "oauth.metadata.protected_resource",
        "/jwks" => "oauth.jwks",
        "/register" => "oauth.register",
        "/authorize" => "oauth.authorize",
        "/auth/login" => "oauth.browser_login",
        "/auth/google/callback" => "oauth.callback",
        "/token" => "oauth.token",
        _ => "oauth.unknown",
    }
}

#[cfg(test)]
mod tests {
    use axum::body::Body;
    use axum::http::{Request as HttpRequest, StatusCode};
    use tower::util::ServiceExt;
    use tracing_subscriber::layer::SubscriberExt;

    use super::*;
    use crate::authorize::tests::{test_auth_config, test_auth_state, test_auth_state_with_config};

    #[test]
    fn auth_dispatch_action_names_are_stable() {
        assert_eq!(
            auth_dispatch_action("/.well-known/oauth-authorization-server"),
            "oauth.metadata.authorization_server"
        );
        assert_eq!(auth_dispatch_action("/register"), "oauth.register");
        assert_eq!(auth_dispatch_action("/authorize"), "oauth.authorize");
        assert_eq!(auth_dispatch_action("/token"), "oauth.token");
    }

    #[tokio::test(flavor = "current_thread")]
    async fn auth_dispatch_logs_request_id_action_elapsed_and_failure_kind() {
        let _tracing_lock = crate::test_support::TRACING_TEST_LOCK.lock().await;
        let buf = crate::test_support::SharedBuf::default();
        let subscriber = tracing_subscriber::registry()
            .with(tracing_subscriber::EnvFilter::new("lab_auth=info"))
            .with(
                tracing_subscriber::fmt::layer()
                    .json()
                    .with_writer(buf.clone())
                    .with_ansi(false)
                    .without_time(),
            );
        let _ = tracing::subscriber::set_global_default(subscriber);

        // Build a state with dynamic registration enabled so /register is mounted.
        let mut config = test_auth_config();
        config.enable_dynamic_registration = true;
        let app = router(test_auth_state_with_config(config).await);
        let response = app
            .oneshot(
                HttpRequest::builder()
                    .method("POST")
                    .uri("/register")
                    .header("content-type", "application/json")
                    .header("x-request-id", "req-auth-1")
                    .body(Body::from(r#"{"redirect_uris":[]}"#))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::UNPROCESSABLE_ENTITY);

        let logs = crate::test_support::captured_logs(&buf);
        for expected in [
            "\"surface\":\"api\"",
            "\"service\":\"auth\"",
            "\"action\":\"oauth.register\"",
            "\"request_id\":\"req-auth-1\"",
            "\"kind\":\"validation_failed\"",
            "\"status\":422",
            "\"dispatch.error\"",
        ] {
            assert!(
                logs.contains(expected),
                "missing auth dispatch log field `{expected}` in:\n{logs}"
            );
        }
        assert!(
            logs.contains("\"elapsed_ms\":"),
            "missing elapsed_ms in:\n{logs}"
        );
    }

    /// Pinned-snapshot test for [`bearer_only_router`] — sends a probe
    /// request to each path in [`BEARER_ONLY_ROUTER_PATHS`] and asserts
    /// the response is NOT 404 (i.e. the route is mounted), then probes
    /// each path in [`BEARER_ONLY_ROUTER_FORBIDDEN_PATHS`] and asserts
    /// IT IS 404 (i.e. the route is NOT mounted).
    ///
    /// Catches future drift where lab-auth contributors add endpoints to
    /// [`router`] but forget to keep the headless subset in lock-step.
    #[tokio::test(flavor = "current_thread")]
    async fn bearer_only_router_route_list_matches_pinned_snapshot() {
        let state = test_auth_state().await;
        let app = bearer_only_router(state);

        for (method, path) in BEARER_ONLY_ROUTER_PATHS {
            let response = app
                .clone()
                .oneshot(
                    HttpRequest::builder()
                        .method(*method)
                        .uri(*path)
                        .body(Body::empty())
                        .unwrap(),
                )
                .await
                .unwrap();
            assert_ne!(
                response.status(),
                StatusCode::NOT_FOUND,
                "expected `{method} {path}` to be mounted on bearer_only_router \
                 but got 404 — did the route get removed without updating \
                 BEARER_ONLY_ROUTER_PATHS?"
            );
        }

        for (method, path) in BEARER_ONLY_ROUTER_FORBIDDEN_PATHS {
            let response = app
                .clone()
                .oneshot(
                    HttpRequest::builder()
                        .method(*method)
                        .uri(*path)
                        .body(Body::empty())
                        .unwrap(),
                )
                .await
                .unwrap();
            assert_eq!(
                response.status(),
                StatusCode::NOT_FOUND,
                "expected `{method} {path}` to be ABSENT from bearer_only_router \
                 but got status {} — Locked Decision: bearer_only_router \
                 must NOT mount /auth/login or /register",
                response.status()
            );
        }
    }
}
