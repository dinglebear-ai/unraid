use std::net::TcpListener;
use std::path::{Path, PathBuf};

use anyhow::Result;
use serde::Serialize;

use unraid_rmcp::config::{default_data_dir, AuthMode, Config};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SetupCommand {
    Check,
    Repair,
    /// Copy this binary into ~/.local/bin so it is callable as a bare command
    /// in the user's own terminal, independent of Claude Code.
    Install,
    PluginHook {
        no_repair: bool,
    },
}

#[derive(Debug, Serialize)]
struct SetupFailure {
    code: &'static str,
    message: String,
}

#[derive(Debug, Serialize)]
struct SetupReport {
    exit_policy: &'static str,
    ran_repair: bool,
    no_repair: bool,
    blocking_failures: Vec<SetupFailure>,
    advisory_failures: Vec<SetupFailure>,
}

impl SetupReport {
    fn new(no_repair: bool) -> Self {
        Self {
            exit_policy: "success",
            ran_repair: false,
            no_repair,
            blocking_failures: Vec::new(),
            advisory_failures: Vec::new(),
        }
    }

    fn finish(mut self) -> Self {
        self.exit_policy = if !self.blocking_failures.is_empty() {
            "blocking_failure"
        } else if !self.advisory_failures.is_empty() {
            "advisory_failure"
        } else {
            "success"
        };
        self
    }

    fn should_exit_failure(&self) -> bool {
        !self.blocking_failures.is_empty()
    }
}

/// Translate Claude Code plugin options (`CLAUDE_PLUGIN_OPTION_*`) into the
/// `UNRAID_*` process env vars the binary reads, before `Config::load()` runs.
///
/// This replaces the former `plugin-setup.sh` wrapper: the binary now owns the
/// env-var mapping itself, so the plugin hook calls the binary directly. unrust
/// is template-style — `Config::load()` runs before the setup command dispatches
/// and `check()` validates the pre-loaded `&Config` — so this MUST be called
/// before `Config::load()` (hoisted in `run_cli`, gated to the setup path), not
/// inside the handler. Values containing newlines/CR are skipped, mirroring the
/// script's `reject_unsafe_value` guard.
///
/// No `CLAUDE_PLUGIN_DATA` → `UNRAID_HOME` mapping is needed: `setup_data_dir()`
/// resolves the canonical `~/.unraid/` appdata dir (honoring an explicit
/// `UNRAID_HOME` override) — the same place the binary loads `.env` from.
pub fn apply_plugin_options() {
    // CLAUDE_PLUGIN_OPTION_<OPT> -> <UNRAID_ENVVAR>
    let map = [
        ("CLAUDE_PLUGIN_OPTION_API_TOKEN", "UNRAID_RMCP_TOKEN"),
        ("CLAUDE_PLUGIN_OPTION_MCP_PORT", "UNRAID_RMCP_PORT"),
        ("CLAUDE_PLUGIN_OPTION_UNRAID_API_URL", "UNRAID_API_URL"),
        ("CLAUDE_PLUGIN_OPTION_UNRAID_API_KEY", "UNRAID_API_KEY"),
        (
            "CLAUDE_PLUGIN_OPTION_UNRAID_SKIP_TLS",
            "UNRAID_API_SKIP_TLS_VERIFY",
        ),
        ("CLAUDE_PLUGIN_OPTION_NO_AUTH", "UNRAID_RMCP_NO_AUTH"),
        ("CLAUDE_PLUGIN_OPTION_AUTH_MODE", "UNRAID_RMCP_AUTH_MODE"),
        ("CLAUDE_PLUGIN_OPTION_PUBLIC_URL", "UNRAID_RMCP_PUBLIC_URL"),
        (
            "CLAUDE_PLUGIN_OPTION_GOOGLE_CLIENT_ID",
            "UNRAID_RMCP_GOOGLE_CLIENT_ID",
        ),
        (
            "CLAUDE_PLUGIN_OPTION_GOOGLE_CLIENT_SECRET",
            "UNRAID_RMCP_GOOGLE_CLIENT_SECRET",
        ),
        (
            "CLAUDE_PLUGIN_OPTION_AUTH_ADMIN_EMAIL",
            "UNRAID_RMCP_AUTH_ADMIN_EMAIL",
        ),
    ];
    for (opt, dest) in map {
        if let Some(v) = std::env::var_os(opt) {
            let s = v.to_string_lossy();
            if s.is_empty() || s.contains('\n') || s.contains('\r') {
                continue;
            }
            // edition 2021: set_var is safe (no unsafe block required).
            std::env::set_var(dest, v);
        }
    }
}

pub async fn run_setup(config: &Config, command: SetupCommand) -> Result<()> {
    let report = match command {
        SetupCommand::Check => check(config, true),
        SetupCommand::Repair => repair(config)?,
        SetupCommand::Install => {
            let dest = install_self()?;
            println!("installed -> {}", dest.display());
            return Ok(());
        }
        SetupCommand::PluginHook { no_repair } => run_plugin_hook(config, no_repair)?,
    };

    println!("{}", serde_json::to_string_pretty(&report)?);
    if report.should_exit_failure() {
        std::process::exit(1);
    }
    Ok(())
}

/// Copy the running binary into `~/.local/bin/<name>` so it is callable as a
/// bare command in the user's own terminal, independent of Claude Code. Copy
/// (not symlink) so it survives `/plugin update`. std + anyhow only.
fn install_self() -> anyhow::Result<std::path::PathBuf> {
    let exe = std::env::current_exe()?;
    let name = exe
        .file_name()
        .ok_or_else(|| anyhow::anyhow!("no binary name"))?;
    let home = std::env::var_os("HOME").ok_or_else(|| anyhow::anyhow!("HOME is not set"))?;
    let bin_dir = std::path::PathBuf::from(home).join(".local").join("bin");
    std::fs::create_dir_all(&bin_dir)?;
    let dest = bin_dir.join(name);
    if dest == exe {
        return Ok(dest);
    }
    let tmp = bin_dir.join(format!(".{}.tmp", name.to_string_lossy()));
    std::fs::copy(&exe, &tmp)?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        std::fs::set_permissions(&tmp, std::fs::Permissions::from_mode(0o755))?;
    }
    std::fs::rename(&tmp, &dest).inspect_err(|_| {
        let _ = std::fs::remove_file(&tmp);
    })?;
    let on_path = std::env::var_os("PATH")
        .map(|p| std::env::split_paths(&p).any(|d| d == bin_dir))
        .unwrap_or(false);
    if !on_path {
        eprintln!(
            "note: {} is not on your PATH; add:  export PATH=\"$HOME/.local/bin:$PATH\"",
            bin_dir.display()
        );
    }
    Ok(dest)
}

fn run_plugin_hook(config: &Config, no_repair: bool) -> Result<SetupReport> {
    if let Err(e) = install_self() {
        eprintln!("setup plugin-hook: self-install skipped: {e}");
    }
    let initial = check(config, no_repair);
    if initial.blocking_failures.is_empty() || no_repair {
        return Ok(initial);
    }
    repair(config)
}

fn check(config: &Config, no_repair: bool) -> SetupReport {
    let mut report = SetupReport::new(no_repair);
    let data_dir = setup_data_dir();

    if !data_dir.is_dir() {
        report.blocking_failures.push(SetupFailure {
            code: "appdata_missing",
            message: format!("appdata directory does not exist: {}", data_dir.display()),
        });
    }
    let env_path = data_dir.join(".env");
    if !env_path.is_file() {
        report.advisory_failures.push(SetupFailure {
            code: "env_file_missing",
            message: format!(
                "{} does not exist; setup repair will create one, but process env can supply values",
                env_path.display()
            ),
        });
    }

    if config.unraid.api_url.is_empty() {
        report.blocking_failures.push(SetupFailure {
            code: "missing_unraid_api_url",
            message: "UNRAID_API_URL is required".into(),
        });
    }
    if config.unraid.api_key.is_empty() {
        report.blocking_failures.push(SetupFailure {
            code: "missing_unraid_api_key",
            message: "UNRAID_API_KEY is required".into(),
        });
    }

    validate_auth(config, &mut report);
    check_port(config.mcp.port, &mut report);

    report.finish()
}

fn repair(config: &Config) -> Result<SetupReport> {
    let data_dir = setup_data_dir();
    std::fs::create_dir_all(&data_dir)?;
    write_env_file(&data_dir, config)?;

    // Remediation (create_dir_all + write_env_file) ran above, *before* this
    // check, so the check already reflects the repaired state — re-running it
    // would produce an identical result.
    let mut report = check(config, false);
    report.ran_repair = true;

    Ok(report.finish())
}

fn validate_auth(config: &Config, report: &mut SetupReport) {
    if config.mcp.no_auth {
        return;
    }

    if config.mcp.auth.mode == AuthMode::OAuth {
        if config
            .mcp
            .auth
            .public_url
            .as_deref()
            .unwrap_or("")
            .is_empty()
        {
            report.blocking_failures.push(SetupFailure {
                code: "missing_oauth_public_url",
                message: "UNRAID_RMCP_PUBLIC_URL is required for OAuth mode".into(),
            });
        }
        if config
            .mcp
            .auth
            .google_client_id
            .as_deref()
            .unwrap_or("")
            .is_empty()
        {
            report.blocking_failures.push(SetupFailure {
                code: "missing_oauth_client_id",
                message: "UNRAID_RMCP_GOOGLE_CLIENT_ID is required for OAuth mode".into(),
            });
        }
        if config
            .mcp
            .auth
            .google_client_secret
            .as_deref()
            .unwrap_or("")
            .is_empty()
        {
            report.blocking_failures.push(SetupFailure {
                code: "missing_oauth_client_secret",
                message: "UNRAID_RMCP_GOOGLE_CLIENT_SECRET is required for OAuth mode".into(),
            });
        }
        if config.mcp.auth.admin_email.is_empty() {
            report.blocking_failures.push(SetupFailure {
                code: "missing_oauth_admin_email",
                message: "UNRAID_RMCP_AUTH_ADMIN_EMAIL is required for OAuth mode".into(),
            });
        }
    } else if config.mcp.api_token.as_deref().unwrap_or("").is_empty() {
        report.blocking_failures.push(SetupFailure {
            code: "missing_mcp_token",
            message: "UNRAID_RMCP_TOKEN is required unless no_auth or OAuth mode is enabled".into(),
        });
    }
}

fn check_port(port: u16, report: &mut SetupReport) {
    if TcpListener::bind(("127.0.0.1", port)).is_err() {
        report.advisory_failures.push(SetupFailure {
            code: "mcp_port_in_use",
            message: format!("MCP port {port} is already in use"),
        });
    }
}

fn setup_data_dir() -> PathBuf {
    // Canonical service appdata dir (~/.unraid/ or /data) — the same location the
    // binary loads `.env` from (`config::load_dotenv`), so the plugin hook's
    // writes and the server's reads always agree. An explicit `UNRAID_HOME`
    // override is honored; `CLAUDE_PLUGIN_DATA` is intentionally NOT consulted.
    std::env::var_os("UNRAID_HOME")
        .map(PathBuf::from)
        .unwrap_or_else(default_data_dir)
}

fn write_env_file(data_dir: &Path, config: &Config) -> Result<()> {
    let env_path = data_dir.join(".env");
    let mut lines = vec![
        format!("UNRAID_RMCP_HOST={}", config.mcp.host),
        format!("UNRAID_RMCP_PORT={}", config.mcp.port),
        format!("UNRAID_RMCP_NO_AUTH={}", config.mcp.no_auth),
    ];

    if let Some(token) = config
        .mcp
        .api_token
        .as_deref()
        .filter(|value| !value.is_empty())
    {
        lines.push(format!("UNRAID_RMCP_TOKEN={token}"));
    }
    if !config.unraid.api_url.is_empty() {
        lines.push(format!("UNRAID_API_URL={}", config.unraid.api_url));
    }
    if !config.unraid.api_key.is_empty() {
        lines.push(format!("UNRAID_API_KEY={}", config.unraid.api_key));
    }
    if config.unraid.skip_tls_verify {
        lines.push("UNRAID_API_SKIP_TLS_VERIFY=true".into());
    }
    if config.mcp.auth.mode == AuthMode::OAuth {
        lines.push("UNRAID_RMCP_AUTH_MODE=oauth".into());
        if let Some(value) = &config.mcp.auth.public_url {
            lines.push(format!("UNRAID_RMCP_PUBLIC_URL={value}"));
        }
        if let Some(value) = &config.mcp.auth.google_client_id {
            lines.push(format!("UNRAID_RMCP_GOOGLE_CLIENT_ID={value}"));
        }
        if let Some(value) = &config.mcp.auth.google_client_secret {
            lines.push(format!("UNRAID_RMCP_GOOGLE_CLIENT_SECRET={value}"));
        }
        if !config.mcp.auth.admin_email.is_empty() {
            lines.push(format!(
                "UNRAID_RMCP_AUTH_ADMIN_EMAIL={}",
                config.mcp.auth.admin_email
            ));
        }
    }

    std::fs::write(env_path, format!("{}\n", lines.join("\n")))?;
    Ok(())
}
