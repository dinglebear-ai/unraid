use std::path::PathBuf;

use axum::http::{HeaderValue, StatusCode, header};
use axum::response::{IntoResponse, Response};
use thiserror::Error;

#[derive(Clone, Copy, Debug)]
pub struct AuthErrorKind(pub &'static str);

#[derive(Debug, Error)]
pub enum AuthError {
    #[error("{0}")]
    Config(String),

    #[error("{0}")]
    Storage(String),

    #[error("{0}")]
    InvalidGrant(String),

    #[error("{0}")]
    AuthFailed(String),

    #[error("{0}")]
    Validation(String),

    #[error("{0}")]
    Network(String),

    #[error("{0}")]
    Server(String),

    #[error("{0}")]
    Decode(String),

    #[error("{message}")]
    RateLimited {
        message: String,
        retry_after_ms: u64,
    },

    #[error("invalid access token")]
    InvalidAccessToken,

    #[error("path `{path}` has insecure permissions")]
    InsecurePermissions { path: PathBuf },
}

impl AuthError {
    pub const fn kind(&self) -> &'static str {
        match self {
            Self::Config(_) | Self::Storage(_) | Self::InsecurePermissions { .. } => {
                "internal_error"
            }
            Self::InvalidGrant(_) => "invalid_grant",
            Self::AuthFailed(_) | Self::InvalidAccessToken => "auth_failed",
            Self::Validation(_) => "validation_failed",
            Self::Network(_) => "network_error",
            Self::Server(_) => "server_error",
            Self::Decode(_) => "decode_error",
            Self::RateLimited { .. } => "rate_limited",
        }
    }

    const fn status(&self) -> StatusCode {
        match self {
            Self::InvalidGrant(_) => StatusCode::BAD_REQUEST,
            Self::AuthFailed(_) | Self::InvalidAccessToken => StatusCode::UNAUTHORIZED,
            Self::Validation(_) => StatusCode::UNPROCESSABLE_ENTITY,
            Self::Network(_) | Self::Server(_) => StatusCode::BAD_GATEWAY,
            Self::Decode(_) => StatusCode::INTERNAL_SERVER_ERROR,
            Self::RateLimited { .. } => StatusCode::TOO_MANY_REQUESTS,
            Self::Config(_) | Self::Storage(_) | Self::InsecurePermissions { .. } => {
                StatusCode::INTERNAL_SERVER_ERROR
            }
        }
    }
}

impl IntoResponse for AuthError {
    fn into_response(self) -> Response {
        let status = self.status();
        let body = axum::Json(serde_json::json!({
            "kind": self.kind(),
            "message": self.to_string(),
        }));
        let mut response = (status, body).into_response();
        response.extensions_mut().insert(AuthErrorKind(self.kind()));
        response
            .headers_mut()
            .insert(header::CACHE_CONTROL, HeaderValue::from_static("no-store"));
        response
            .headers_mut()
            .insert(header::PRAGMA, HeaderValue::from_static("no-cache"));
        if let Self::RateLimited { retry_after_ms, .. } = self
            && let Ok(value) = HeaderValue::from_str(&(retry_after_ms / 1_000).max(1).to_string())
        {
            response.headers_mut().insert(header::RETRY_AFTER, value);
        }
        response
    }
}
