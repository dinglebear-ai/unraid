//! xtask — project automation for unraid-rmcp
//!
//! Usage: `cargo xtask <command>`
//!
//! Commands:
//!   dist         Build release binary and copy to bin/
//!   ci           Run fmt + clippy + nextest
//!   symlink-docs Safely link CLAUDE.md and GEMINI.md to canonical AGENTS.md files
//!   check-env    Validate required environment variables

use std::env;
use std::process::{Command, exit};

fn main() {
    let args: Vec<String> = env::args().skip(1).collect();
    let cmd = args.first().map(|s| s.as_str()).unwrap_or("help");

    let result = match cmd {
        "dist" => dist(),
        "ci" => ci(),
        "symlink-docs" => symlink_docs(),
        "check-env" => check_env(),
        _ => {
            eprintln!("Usage: cargo xtask [dist|ci|symlink-docs|check-env]");
            exit(1);
        }
    };

    if let Err(e) = result {
        eprintln!("xtask error: {e}");
        exit(1);
    }
}

/// Build release binary and copy to bin/
fn dist() -> anyhow::Result<()> {
    println!("==> Building release binary...");
    run("cargo", &["build", "--release", "--locked"])?;

    let target_dir = env::var("CARGO_TARGET_DIR").unwrap_or_else(|_| "target".into());
    let src = format!("{target_dir}/release/runraid");
    let dst = "bin/runraid";

    std::fs::create_dir_all("bin")?;
    std::fs::copy(&src, dst)?;
    println!("==> Copied {src} → {dst}");
    Ok(())
}

/// Run fmt + clippy + nextest
fn ci() -> anyhow::Result<()> {
    println!("==> cargo fmt --check");
    run("cargo", &["fmt", "--", "--check"])?;

    println!("==> cargo clippy");
    run("cargo", &["clippy", "--", "-D", "warnings"])?;

    println!("==> cargo nextest run --profile ci");
    run("cargo", &["nextest", "run", "--profile", "ci"])?;

    println!("==> CI passed");
    Ok(())
}

/// Repair instruction aliases using the shared, non-destructive repository helper.
fn symlink_docs() -> anyhow::Result<()> {
    let script = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../.github/scripts/check_documentation.py");
    let script = script
        .to_str()
        .ok_or_else(|| anyhow::anyhow!("documentation helper path is not valid UTF-8"))?;
    run("python3", &[script, "--repair-links"])
}

/// Validate required environment variables are set
fn check_env() -> anyhow::Result<()> {
    let required = [
        ("UNRAID_API_URL", "Unraid GraphQL endpoint"),
        ("UNRAID_API_KEY", "Unraid API key"),
    ];

    let optional = [
        ("UNRAID_RMCP_TOKEN", "Bearer token for MCP auth"),
        ("UNRAID_RMCP_ENABLED_TOOLS", "MCP tool/action allowlist"),
        ("UNRAID_RMCP_DISABLED_TOOLS", "MCP tool/action denylist"),
        ("RUST_LOG", "Log filter (default: info)"),
    ];

    let mut missing = vec![];

    println!("==> Checking required variables:");
    for (key, desc) in &required {
        match env::var(key) {
            Ok(val) if !val.is_empty() => {
                let display =
                    if key.contains("KEY") || key.contains("TOKEN") || key.contains("SECRET") {
                        "***".to_string()
                    } else {
                        val.clone()
                    };
                println!("  [ok] {key} = {display}  ({desc})");
            }
            _ => {
                println!("  [MISSING] {key}  ({desc})");
                missing.push(*key);
            }
        }
    }

    println!("==> Checking optional variables:");
    for (key, desc) in &optional {
        match env::var(key) {
            Ok(val) if !val.is_empty() => {
                let display =
                    if key.contains("KEY") || key.contains("TOKEN") || key.contains("SECRET") {
                        "***".to_string()
                    } else {
                        val.clone()
                    };
                println!("  [set] {key} = {display}  ({desc})");
            }
            _ => {
                println!("  [unset] {key}  ({desc})");
            }
        }
    }

    if !missing.is_empty() {
        anyhow::bail!("Missing required env vars: {}", missing.join(", "));
    }

    println!("==> Environment OK");
    Ok(())
}

fn run(cmd: &str, args: &[&str]) -> anyhow::Result<()> {
    let status = Command::new(cmd).args(args).status()?;
    if !status.success() {
        anyhow::bail!("{cmd} {} failed with {status}", args.join(" "));
    }
    Ok(())
}
