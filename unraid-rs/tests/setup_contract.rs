use std::process::Command;

use serde_json::Value;
use tempfile::tempdir;

fn unraid_bin() -> &'static str {
    env!("CARGO_BIN_EXE_runraid")
}

fn base_command(data_dir: &std::path::Path) -> Command {
    let mut cmd = Command::new(unraid_bin());
    cmd.env_clear()
        .env("HOME", data_dir)
        .env("PATH", std::env::var("PATH").unwrap_or_default())
        .env("UNRAID_HOME", data_dir)
        .env("UNRAID_API_URL", "https://tower.example/graphql")
        .env("UNRAID_API_KEY", "secret")
        .env("UNRAID_RMCP_PORT", "0")
        .env("UNRAID_RMCP_TOKEN", "mcp-secret");
    cmd
}

#[test]
fn setup_plugin_hook_no_repair_emits_json_contract() {
    let dir = tempdir().unwrap();
    let mut cmd = base_command(dir.path());
    let output = cmd
        .args(["setup", "plugin-hook", "--no-repair"])
        .output()
        .unwrap();

    assert!(
        output.status.success(),
        "stderr: {}",
        String::from_utf8_lossy(&output.stderr)
    );
    let json: Value = serde_json::from_slice(&output.stdout).unwrap();
    assert_eq!(json["exit_policy"], "advisory_failure");
    assert_eq!(json["ran_repair"], false);
    assert_eq!(json["no_repair"], true);
    assert!(json["blocking_failures"].as_array().unwrap().is_empty());
    assert!(json["advisory_failures"]
        .as_array()
        .unwrap()
        .iter()
        .any(|failure| failure["code"] == "env_file_missing"));
    assert!(!dir.path().join(".env").exists());
}

#[test]
fn setup_repair_creates_env_file_without_upstream_contact() {
    let dir = tempdir().unwrap();
    let missing = dir.path().join("appdata");
    let mut cmd = base_command(&missing);
    let output = cmd.args(["setup", "repair"]).output().unwrap();

    assert!(
        output.status.success(),
        "stderr: {}",
        String::from_utf8_lossy(&output.stderr)
    );
    let json: Value = serde_json::from_slice(&output.stdout).unwrap();
    assert_eq!(json["exit_policy"], "success");
    assert_eq!(json["ran_repair"], true);
    assert_eq!(json["no_repair"], false);

    let env_file = std::fs::read_to_string(missing.join(".env")).unwrap();
    assert!(env_file.contains("UNRAID_API_URL=https://tower.example/graphql"));
    assert!(env_file.contains("UNRAID_API_KEY=secret"));
    assert!(env_file.contains("UNRAID_RMCP_TOKEN=mcp-secret"));
}

/// The setup wrapper script prefers an installed `runraid` binary, falls back to
/// CRGX, and degrades gracefully only when neither executable is available.
///
/// Claude Code hooks were removed from the agent plugin (2026-07-27), so nothing
/// invokes this script automatically any more — it is the manual credential-setup
/// entry point. The contract on its contents still holds.
#[test]
fn plugin_setup_script_prefers_binary_then_crgx() {
    let setup = std::fs::read_to_string("../agents/unraid-rs/scripts/plugin-setup.sh").unwrap();
    assert!(setup.contains("command -v crgx"));
    assert!(setup.contains("exec crgx unraid-rmcp -- setup plugin-hook"));
}

/// The agent plugin must ship no Claude Code hooks: no `hooks/` directory and no
/// `hooks` key in either manifest.
#[test]
fn agent_plugin_declares_no_claude_hooks() {
    assert!(
        !std::path::Path::new("../agents/unraid-rs/hooks").exists(),
        "agents/unraid-rs/hooks/ must not exist — Claude Code hooks are retired"
    );
    for manifest in [
        "../agents/unraid-rs/.claude-plugin/plugin.json",
        "../agents/unraid-rs/.codex-plugin/plugin.json",
    ] {
        let json: Value =
            serde_json::from_str(&std::fs::read_to_string(manifest).unwrap()).unwrap();
        assert!(
            json.get("hooks").is_none(),
            "{manifest} must not declare a \"hooks\" key"
        );
    }
}

#[test]
fn claude_mcp_config_uses_crgx() {
    let mcp: Value =
        serde_json::from_str(&std::fs::read_to_string("../agents/unraid-rs/.mcp.json").unwrap())
            .unwrap();
    assert_eq!(mcp["mcpServers"]["unraid"]["command"], "crgx");
    assert_eq!(
        mcp["mcpServers"]["unraid"]["args"],
        serde_json::json!(["unraid-rmcp", "--", "mcp"])
    );
}

/// `apply_plugin_options()` (run before `Config::load()`) must map
/// `CLAUDE_PLUGIN_OPTION_*` into the binary's `UNRAID_*` env vars regardless of
/// whether the hook script or the binary itself performs the mapping. Setting
/// the credential options here makes the `missing_unraid_api_url` /
/// `missing_unraid_api_key` blocking failures disappear — proving the mapping
/// reaches the loaded config.
#[test]
fn plugin_hook_maps_plugin_options_into_env() {
    let dir = tempdir().unwrap();
    let mut cmd = Command::new(unraid_bin());
    cmd.env_clear()
        .env("HOME", dir.path())
        .env("PATH", std::env::var("PATH").unwrap_or_default())
        .env("UNRAID_HOME", dir.path())
        .env("UNRAID_RMCP_PORT", "0")
        // Supply credentials only via plugin options — not UNRAID_* directly.
        .env(
            "CLAUDE_PLUGIN_OPTION_UNRAID_API_URL",
            "https://tower.example/graphql",
        )
        .env("CLAUDE_PLUGIN_OPTION_UNRAID_API_KEY", "secret")
        .env("CLAUDE_PLUGIN_OPTION_API_TOKEN", "mcp-secret");
    let output = cmd
        .args(["setup", "plugin-hook", "--no-repair"])
        .output()
        .unwrap();

    let json: Value = serde_json::from_slice(&output.stdout).unwrap();
    let blocking: Vec<String> = json["blocking_failures"]
        .as_array()
        .unwrap()
        .iter()
        .map(|f| f["code"].as_str().unwrap_or_default().to_string())
        .collect();
    assert!(
        !blocking.contains(&"missing_unraid_api_url".to_string()),
        "API URL option should map into UNRAID_API_URL; blocking: {blocking:?}"
    );
    assert!(
        !blocking.contains(&"missing_unraid_api_key".to_string()),
        "API key option should map into UNRAID_API_KEY; blocking: {blocking:?}"
    );
}
