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

/// Spawn `runraid mcp` with the given tool-policy env and expect a startup
/// failure: non-zero exit and the config error on stderr.
fn run_runraid_startup_failure(env: &[(&str, &str)]) -> String {
    let home = tempfile::tempdir().unwrap();
    let mut cmd = Command::new(env!("CARGO_BIN_EXE_runraid"));
    cmd.arg("mcp")
        .env("HOME", home.path())
        .env_remove("UNRAID_HOME")
        .env("UNRAID_API_URL", "http://localhost:1/graphql")
        .env("UNRAID_API_KEY", "test")
        .env_remove("UNRAID_RMCP_ENABLED_TOOLS")
        .env_remove("UNRAID_RMCP_DISABLED_TOOLS");
    for (key, value) in env {
        cmd.env(key, value);
    }
    let out = cmd.output().expect("spawn runraid");
    let stderr = String::from_utf8_lossy(&out.stderr).into_owned();
    assert!(
        !out.status.success(),
        "runraid must refuse to start with env {env:?}; stderr:\n{stderr}"
    );
    stderr
}

/// A typo'd selector must fail startup loudly (fail closed) instead of
/// silently leaving the action exposed.
#[test]
fn binary_refuses_to_start_on_unknown_tool_selector() {
    let stderr = run_runraid_startup_failure(&[("UNRAID_RMCP_DISABLED_TOOLS", "unraid.dockre")]);
    assert!(
        stderr.contains("unknown selector") && stderr.contains("unraid.dockre"),
        "stderr should name the invalid selector; got:\n{stderr}"
    );
    assert!(
        stderr.contains("[mcp.tools].disabled / UNRAID_RMCP_DISABLED_TOOLS"),
        "stderr should name both config sources; got:\n{stderr}"
    );
}

/// A set, non-empty value that parses to zero selectors (separators only) must
/// also fail startup: the operator visibly set a policy that would otherwise
/// silently do nothing. (The empty string stays valid — it means unset.)
#[test]
fn binary_refuses_to_start_on_separator_only_tool_selector_value() {
    let stderr = run_runraid_startup_failure(&[("UNRAID_RMCP_DISABLED_TOOLS", ",")]);
    assert!(
        stderr.contains("UNRAID_RMCP_DISABLED_TOOLS") && stderr.contains("no selectors"),
        "stderr should explain the zero-selector value; got:\n{stderr}"
    );
}

fn run_runraid_config_failure(config: &str) -> String {
    let dir = tempfile::tempdir().unwrap();
    std::fs::write(dir.path().join("config.toml"), config).unwrap();
    let out = Command::new(env!("CARGO_BIN_EXE_runraid"))
        .arg("mcp")
        .current_dir(dir.path())
        .env("UNRAID_HOME", dir.path())
        .env("UNRAID_API_URL", "http://localhost:1/graphql")
        .env("UNRAID_API_KEY", "test")
        .env_remove("UNRAID_RMCP_ENABLED_TOOLS")
        .env_remove("UNRAID_RMCP_DISABLED_TOOLS")
        .output()
        .expect("spawn runraid");
    let stderr = String::from_utf8_lossy(&out.stderr).into_owned();
    assert!(
        !out.status.success(),
        "runraid must reject config {config:?}; stderr: {stderr}"
    );
    stderr
}

/// Unknown keys under `[mcp.tools]` are security-sensitive typos and must
/// fail closed instead of silently leaving actions exposed.
#[test]
fn binary_refuses_unknown_mcp_tools_toml_keys() {
    let stderr = run_runraid_config_failure("[mcp.tools]\ndisable = [\"vm_reset\"]\n");
    assert!(
        stderr.contains("unknown field") && stderr.contains("disable"),
        "parse error must identify the typo; got: {stderr}"
    );
}

#[test]
fn binary_refuses_misspelled_mcp_tools_table() {
    let stderr = run_runraid_config_failure("[mcp.tool]\ndisabled = [\"vm_reset\"]\n");
    assert!(
        stderr.contains("unknown field") && stderr.contains("tool"),
        "parse error must identify the misspelled table; got: {stderr}"
    );
}

#[test]
fn binary_refuses_malformed_dotenv_before_policy() {
    let dir = tempfile::tempdir().unwrap();
    let mut contents = vec![0xff, b'\n'];
    contents.extend_from_slice(b"UNRAID_RMCP_DISABLED_TOOLS=*\n");
    std::fs::write(dir.path().join(".env"), contents).unwrap();
    let out = Command::new(env!("CARGO_BIN_EXE_runraid"))
        .arg("definitely-not-a-command")
        .env("UNRAID_HOME", dir.path())
        .env("UNRAID_API_URL", "http://localhost:1/graphql")
        .env("UNRAID_API_KEY", "test")
        .output()
        .expect("spawn runraid");
    let stderr = String::from_utf8_lossy(&out.stderr);
    assert!(!out.status.success(), "malformed .env must fail closed");
    assert!(
        stderr.contains("failed to parse .env"),
        "stderr must identify the malformed file; got: {stderr}"
    );
}

#[tokio::test]
async fn binary_passes_id_argument() {
    let server = mock_server("healthy").await;
    let (stdout, ok) = run_runraid(&server.uri(), &["api-key", "abc123:key-001", "--json"]);
    assert!(ok, "api-key lookup should exit 0; stdout:\n{stdout}");
    assert!(stdout.contains("apiKey"), "got:\n{stdout}");
}
