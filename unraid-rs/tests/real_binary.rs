//! End-to-end test of the actual `runraid` binary as a black box.
//!
//! Starts a real HTTP mock (wiremock) backed by the scenario fixtures, points the
//! compiled binary at it via `UNRAID_API_URL`, and asserts it runs and renders.
//! This covers the process / config-loading / CLI-formatter path that the
//! in-process dispatch tests skip.
//!
//! Note: this proves the binary *plumbs* data through correctly — not that a real
//! Unraid returns this shape (the mock returns our own fixtures). Only a live
//! integration test closes that gap.

use std::process::Command;

use serde_json::Value;
use unraid_rmcp::mock::Scenario;
use wiremock::{Mock, MockServer, Request, Respond, ResponseTemplate};

struct ScenarioResponder {
    scenario: Scenario,
}
impl Respond for ScenarioResponder {
    fn respond(&self, request: &Request) -> ResponseTemplate {
        let body: Value = serde_json::from_slice(&request.body).unwrap_or(Value::Null);
        let query = body.get("query").and_then(Value::as_str).unwrap_or("");
        ResponseTemplate::new(200).set_body_json(self.scenario.respond(query))
    }
}

async fn mock_server(scenario: &str) -> MockServer {
    let server = MockServer::start().await;
    Mock::given(wiremock::matchers::method("POST"))
        .respond_with(ScenarioResponder {
            scenario: Scenario::load(scenario).unwrap(),
        })
        .mount(&server)
        .await;
    server
}

/// Run the compiled `runraid` binary against the mock and return (stdout, ok).
fn run_runraid(url: &str, args: &[&str]) -> (String, bool) {
    let out = Command::new(env!("CARGO_BIN_EXE_runraid"))
        .args(args)
        .env("UNRAID_API_URL", url)
        .env("UNRAID_API_KEY", "test")
        .env("UNRAID_API_SKIP_TLS_VERIFY", "1")
        .output()
        .expect("spawn runraid");
    (
        String::from_utf8_lossy(&out.stdout).into_owned(),
        out.status.success(),
    )
}

#[tokio::test]
async fn binary_renders_representative_actions() {
    let server = mock_server("healthy").await;
    let url = server.uri();

    // (cli args, a substring the human output should contain)
    let cases: &[(&[&str], &str)] = &[
        (&["array"], "Array:"),
        (&["disks"], "DEVICE"),
        (&["docker"], "container(s)"),
        (&["ups"], "Battery:"),
        (&["online"], "online"),
        (&["api-keys", "--json"], "apiKeys"),
    ];
    for (args, needle) in cases {
        let (stdout, ok) = run_runraid(&url, args);
        assert!(ok, "`runraid {args:?}` should exit 0; stdout:\n{stdout}");
        assert!(
            stdout.contains(needle),
            "`runraid {args:?}` stdout should contain {needle:?}; got:\n{stdout}"
        );
    }
}

#[tokio::test]
async fn binary_passes_id_argument() {
    let server = mock_server("healthy").await;
    let (stdout, ok) = run_runraid(&server.uri(), &["api-key", "abc123:key-001", "--json"]);
    assert!(ok, "api-key lookup should exit 0; stdout:\n{stdout}");
    assert!(stdout.contains("apiKey"), "got:\n{stdout}");
}
