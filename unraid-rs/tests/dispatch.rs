//! Dispatch error / validation surface coverage (P1-7).
//!
//! These tests lock the *error message contract* of the `unraid` tool dispatch
//! and the argument-coercion helpers. `execute_tool` returns `Err(String)` where
//! the String is the `ToolError`'s display message — so validation failures are
//! asserted on substrings, and upstream failures are asserted as "is an error
//! with a sensible message" without over-specifying wording.
//!
//! Validation errors (missing/unknown action, unknown tool, missing required
//! args) are produced *before* any upstream call, so they are deterministic even
//! though the stub upstream (`localhost:1`) is unreachable.

use serde_json::json;

use unraid_rmcp::testing::{execute_tool, i64_arg, loopback_state, string_arg, usize_arg};

// ── Dispatch validation: the error MESSAGE is the contract ─────────────────────

#[tokio::test]
async fn missing_action_is_invalid_params() {
    let state = loopback_state();
    let err = execute_tool(&state, "unraid", json!({}))
        .await
        .expect_err("missing action must be an error");
    assert!(
        err.contains("action"),
        "message should mention action: {err}"
    );
    assert!(
        err.contains("required"),
        "message should mention required: {err}"
    );
}

#[tokio::test]
async fn unknown_action_is_rejected() {
    let state = loopback_state();
    let err = execute_tool(&state, "unraid", json!({"action": "bogus"}))
        .await
        .expect_err("unknown action must be an error");
    assert!(
        err.contains("unknown unraid action"),
        "message should flag the unknown action: {err}"
    );
    assert!(
        err.contains("bogus"),
        "message should echo the bad action name: {err}"
    );
}

#[tokio::test]
async fn unknown_tool_name_is_rejected() {
    let state = loopback_state();
    let err = execute_tool(&state, "not_unraid", json!({"action": "array"}))
        .await
        .expect_err("unknown tool must be an error");
    assert!(
        err.contains("unknown tool"),
        "message should flag the unknown tool: {err}"
    );
    assert!(
        err.contains("not_unraid"),
        "message should echo the bad tool name: {err}"
    );
}

#[tokio::test]
async fn docker_logs_without_id_is_rejected() {
    let state = loopback_state();
    let err = execute_tool(&state, "unraid", json!({"action": "docker_logs"}))
        .await
        .expect_err("docker_logs without id must be an error");
    assert!(
        err.contains("id"),
        "message should mention the missing id arg: {err}"
    );
}

#[tokio::test]
async fn log_file_without_path_is_rejected() {
    let state = loopback_state();
    let err = execute_tool(&state, "unraid", json!({"action": "log_file"}))
        .await
        .expect_err("log_file without path must be an error");
    assert!(
        err.contains("path"),
        "message should mention the missing path arg: {err}"
    );
}

#[tokio::test]
async fn valid_action_against_unreachable_upstream_errors_sensibly() {
    // `array` is a real upstream-hitting action. Against the unreachable
    // localhost:1 stub it must fail with a sensible upstream message — not a
    // panic, not a raw stack trace, not a leaked secret.
    let state = loopback_state();
    let err = execute_tool(&state, "unraid", json!({"action": "array"}))
        .await
        .expect_err("array against unreachable upstream must be an error");

    // It names the failing action and points at the upstream as the cause.
    assert!(
        err.contains("array"),
        "message should name the failing action: {err}"
    );
    assert!(
        err.to_lowercase().contains("upstream") || err.to_lowercase().contains("unreachable"),
        "message should indicate an upstream/connection failure: {err}"
    );
    // It is not empty and does not leak the API key value used by the stub.
    assert!(!err.trim().is_empty(), "message should not be empty");
    assert!(
        !err.contains("x-api-key:"),
        "message should not leak raw credential headers: {err}"
    );
}

// ── Arg helpers (P3 fixes — real behavior to lock) ─────────────────────────────

#[test]
fn usize_arg_rejects_negative() {
    // Negative is now an error, NOT clamped to 0.
    let res = usize_arg(&json!({"limit": -5}), "limit");
    assert!(res.is_err(), "negative limit must be rejected: {res:?}");
}

#[test]
fn usize_arg_clamps_to_max() {
    // Upper bound is explicitly clamped to 10_000 (see arg_helpers.rs).
    let res = usize_arg(&json!({"limit": 999_999}), "limit");
    assert_eq!(res.unwrap(), Some(10_000));
}

#[test]
fn i64_arg_rejects_non_integer() {
    let res = i64_arg(&json!({"tail": "abc"}), "tail");
    assert!(res.is_err(), "non-integer tail must be rejected: {res:?}");
}

#[test]
fn string_arg_present_and_absent() {
    assert_eq!(
        string_arg(&json!({"action": "docker"}), "action"),
        Some("docker".to_string())
    );
    assert_eq!(string_arg(&json!({"action": "docker"}), "missing"), None);
}
