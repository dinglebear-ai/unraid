#![allow(clippy::redundant_pub_crate)]

use std::fmt::Write as _;
use std::path::Path;
use std::time::Duration;

use base64::Engine;
use base64::engine::general_purpose::URL_SAFE_NO_PAD;
use sha2::{Digest, Sha256};

use crate::error::AuthError;

pub fn now_unix() -> i64 {
    let secs = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    i64::try_from(secs).unwrap_or(i64::MAX)
}

pub(crate) fn random_token(bytes: usize) -> Result<String, AuthError> {
    let mut buf = vec![0_u8; bytes];
    getrandom::fill(&mut buf)
        .map_err(|error| AuthError::Storage(format!("generate random token: {error}")))?;
    Ok(URL_SAFE_NO_PAD.encode(buf))
}

pub fn fingerprint(value: &str) -> String {
    let digest = Sha256::digest(value.as_bytes());
    let mut output = String::with_capacity(12);
    for byte in &digest[..6] {
        let _ = write!(&mut output, "{byte:02x}");
    }
    output
}

#[cfg(unix)]
pub(crate) fn ensure_restrictive_permissions(path: &Path) -> Result<(), AuthError> {
    use std::os::unix::fs::PermissionsExt;

    let metadata = std::fs::metadata(path)
        .map_err(|error| AuthError::Storage(format!("stat `{}`: {error}", path.display())))?;
    let mode = metadata.permissions().mode() & 0o777;
    if mode & 0o077 != 0 {
        return Err(AuthError::InsecurePermissions {
            path: path.to_path_buf(),
        });
    }
    Ok(())
}

#[cfg(not(unix))]
pub(crate) fn ensure_restrictive_permissions(_path: &Path) -> Result<(), AuthError> {
    Ok(())
}

#[cfg(unix)]
pub(crate) fn set_restrictive_permissions(path: &Path) -> Result<(), AuthError> {
    use std::os::unix::fs::PermissionsExt;

    std::fs::set_permissions(path, std::fs::Permissions::from_mode(0o600))
        .map_err(|error| AuthError::Storage(format!("chmod 0600 `{}`: {error}", path.display())))
}

#[cfg(not(unix))]
pub(crate) fn set_restrictive_permissions(_path: &Path) -> Result<(), AuthError> {
    Ok(())
}

pub(crate) fn duration_secs_i64(duration: Duration, field: &str) -> Result<i64, AuthError> {
    i64::try_from(duration.as_secs())
        .map_err(|_| AuthError::Config(format!("{field} exceeds supported range")))
}

pub(crate) fn duration_secs_usize(duration: Duration, field: &str) -> Result<usize, AuthError> {
    usize::try_from(duration.as_secs())
        .map_err(|_| AuthError::Config(format!("{field} exceeds supported range")))
}

pub(crate) fn timestamp_usize(timestamp: i64, field: &str) -> Result<usize, AuthError> {
    usize::try_from(timestamp)
        .map_err(|_| AuthError::Storage(format!("{field} is negative or exceeds usize range")))
}

pub(crate) fn expires_at(
    created_at: i64,
    duration: Duration,
    field: &str,
) -> Result<i64, AuthError> {
    let ttl = duration_secs_i64(duration, field)?;
    created_at
        .checked_add(ttl)
        .ok_or_else(|| AuthError::Config(format!("{field} exceeds supported range")))
}
