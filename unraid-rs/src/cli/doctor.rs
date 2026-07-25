//! `unraid doctor` — pre-flight environment validation (§48).

use std::net::TcpListener;
use std::path::Path;
use std::time::Instant;

use serde::Serialize;

use unraid_rmcp::config::{default_data_dir, AuthMode, Config};

/// A single check result emitted by `doctor`.
#[derive(Debug, Serialize)]
pub struct DoctorCheck {
    pub category: &'static str,
    pub name: String,
    pub ok: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub value: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub hint: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub latency_ms: Option<u64>,
    /// True when the check is a warning (not a hard failure).
    #[serde(skip)]
    pub warn_only: bool,
}

impl DoctorCheck {
    fn pass(category: &'static str, name: impl Into<String>, value: impl Into<String>) -> Self {
        Self {
            category,
            name: name.into(),
            ok: true,
            value: Some(value.into()),
            hint: None,
            latency_ms: None,
            warn_only: false,
        }
    }

    fn fail(category: &'static str, name: impl Into<String>, hint: impl Into<String>) -> Self {
        Self {
            category,
            name: name.into(),
            ok: false,
            value: None,
            hint: Some(hint.into()),
            latency_ms: None,
            warn_only: false,
        }
    }

    fn warn(category: &'static str, name: impl Into<String>, value: impl Into<String>) -> Self {
        Self {
            category,
            name: name.into(),
            ok: true,
            value: Some(value.into()),
            hint: None,
            latency_ms: None,
            warn_only: true,
        }
    }
}

// ── individual checks ─────────────────────────────────────────────────────────

fn check_config_file(data_dir: &Path) -> DoctorCheck {
    let p = data_dir.join("config.toml");
    if p.exists() {
        DoctorCheck::pass("config", "Config file", p.display().to_string())
    } else {
        DoctorCheck {
            category: "config",
            name: "Config file".into(),
            ok: true, // missing config.toml is fine — env vars are used instead
            value: Some(format!("{} (not found — using defaults)", p.display())),
            hint: None,
            latency_ms: None,
            warn_only: true,
        }
    }
}

fn check_dir_writable(category: &'static str, label: &str, dir: &Path) -> DoctorCheck {
    // Try to create the dir if it doesn't exist (non-fatal)
    let _ = std::fs::create_dir_all(dir);
    if dir.exists() {
        // Check write permission by attempting a temp file
        let probe = dir.join(".doctor_write_test");
        match std::fs::write(&probe, b"") {
            Ok(_) => {
                let _ = std::fs::remove_file(&probe);
                // Report size of logs dir if relevant
                let extra = if label.contains("Log") {
                    dir_size_mb(dir)
                        .map(|mb| format!(" ({:.1} MB)", mb))
                        .unwrap_or_default()
                } else {
                    String::new()
                };
                DoctorCheck::pass(category, label, format!("{}{}", dir.display(), extra))
            }
            Err(_) => DoctorCheck::fail(
                category,
                label,
                format!(
                    "{} exists but is not writable — check permissions",
                    dir.display()
                ),
            ),
        }
    } else {
        DoctorCheck::fail(
            category,
            label,
            format!("{} does not exist and could not be created", dir.display()),
        )
    }
}

fn dir_size_mb(dir: &Path) -> Option<f64> {
    let mut total: u64 = 0;
    for entry in std::fs::read_dir(dir).ok()?.flatten() {
        if let Ok(meta) = entry.metadata() {
            if meta.is_file() {
                total += meta.len();
            }
        }
    }
    Some(total as f64 / (1024.0 * 1024.0))
}

fn check_binary_in_path(binary: &str) -> DoctorCheck {
    match which_binary(binary) {
        Some(path) => DoctorCheck::pass("config", "Binary in PATH", path),
        None => DoctorCheck::fail(
            "config",
            "Binary in PATH",
            format!("`{binary}` not found in $PATH — add ~/.local/bin to PATH or run install.sh"),
        ),
    }
}

fn which_binary(name: &str) -> Option<String> {
    std::env::var("PATH").ok().and_then(|path_var| {
        path_var
            .split(':')
            .map(|dir| std::path::PathBuf::from(dir).join(name))
            .find(|p| p.is_file())
            .map(|p| p.display().to_string())
    })
}

fn check_required_var(name: &'static str, value: &str) -> DoctorCheck {
    if value.is_empty() {
        DoctorCheck::fail(
            "credentials",
            name,
            format!("Set {name} in ~/.unraid/.env or your environment"),
        )
    } else {
        // Redact value — just confirm it is set
        DoctorCheck::pass("credentials", name, "set")
    }
}

fn check_skip_tls_warn(skip: bool) -> Option<DoctorCheck> {
    if skip {
        Some(DoctorCheck::warn(
            "credentials",
            "UNRAID_API_SKIP_TLS_VERIFY",
            "true (SECURITY WARNING: TLS certificate verification disabled)",
        ))
    } else {
        None
    }
}

async fn check_upstream(url: &str, api_key: &str, skip_tls_verify: bool) -> DoctorCheck {
    // Use a lightweight introspection query to probe connectivity
    let query = r#"{"query":"{ info { os { platform } } }"}"#;
    // Honor the same TLS-verify setting the real client uses, so doctor does not
    // report "reachable" against a cert the real client would reject.
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(5))
        .danger_accept_invalid_certs(skip_tls_verify)
        .build();

    let Ok(client) = client else {
        return DoctorCheck::fail(
            "connectivity",
            "Upstream reachable",
            "Failed to build HTTP client",
        );
    };

    let start = Instant::now();
    let result = client
        .post(url)
        .header("x-api-key", api_key)
        .header("Content-Type", "application/json")
        .body(query)
        .send()
        .await;

    let elapsed = start.elapsed().as_millis() as u64;

    match result {
        Ok(resp) => {
            let status = resp.status();
            let value = format!("{url} → {status} ({elapsed} ms)");
            if status.is_success() || status.as_u16() == 400 {
                // 400 can be a valid GraphQL response for an invalid query — upstream is reachable
                DoctorCheck {
                    category: "connectivity",
                    name: "Upstream reachable".into(),
                    ok: true,
                    value: Some(value),
                    hint: None,
                    latency_ms: Some(elapsed),
                    warn_only: false,
                }
            } else if status.as_u16() == 401 || status.as_u16() == 403 {
                DoctorCheck {
                    category: "connectivity",
                    name: "Upstream reachable".into(),
                    ok: false,
                    value: Some(value),
                    hint: Some("Authentication failed — check UNRAID_API_KEY is correct".into()),
                    latency_ms: Some(elapsed),
                    warn_only: false,
                }
            } else {
                DoctorCheck {
                    category: "connectivity",
                    name: "Upstream reachable".into(),
                    ok: false,
                    value: Some(value),
                    hint: Some(format!(
                        "Unexpected HTTP {status} from upstream — check UNRAID_API_URL"
                    )),
                    latency_ms: Some(elapsed),
                    warn_only: false,
                }
            }
        }
        Err(e) => {
            // If TLS verification is ON and this failure is specifically a cert
            // error, the upstream is reachable but presenting an invalid/self-signed
            // certificate. Surface that as a distinct warning rather than a hard
            // "unreachable" failure (or silently accepting it).
            if !skip_tls_verify && is_tls_cert_error(&e) {
                DoctorCheck {
                    category: "connectivity",
                    name: "Upstream reachable".into(),
                    ok: true,
                    value: Some(format!("{url} → TLS certificate invalid ({elapsed} ms)")),
                    hint: Some(
                        "upstream reachable but TLS certificate invalid — set \
                         UNRAID_API_SKIP_TLS_VERIFY=true if this is intentional (self-signed)"
                            .into(),
                    ),
                    latency_ms: Some(elapsed),
                    warn_only: true,
                }
            } else {
                DoctorCheck {
                    category: "connectivity",
                    name: "Upstream reachable".into(),
                    ok: false,
                    value: Some(url.to_string()),
                    hint: Some(format!(
                        "Connection failed: {e} — is Unraid running and reachable at {url}?"
                    )),
                    latency_ms: Some(elapsed),
                    warn_only: false,
                }
            }
        }
    }
}

/// Best-effort detection of a TLS certificate-verification failure in a reqwest
/// error chain. reqwest does not expose a typed cert-error variant, so we walk the
/// `source()` chain and match on the textual markers emitted by rustls/OpenSSL.
fn is_tls_cert_error(err: &reqwest::Error) -> bool {
    let mut src: Option<&(dyn std::error::Error + 'static)> = Some(err);
    while let Some(e) = src {
        let msg = e.to_string().to_lowercase();
        if msg.contains("certificate")
            || msg.contains("cert verify")
            || msg.contains("self-signed")
            || msg.contains("self signed")
            || msg.contains("unknownissuer")
            || msg.contains("invalidcertificate")
            || msg.contains("tls handshake")
        {
            return true;
        }
        src = e.source();
    }
    false
}

fn check_port_available(port: u16) -> DoctorCheck {
    match TcpListener::bind(("0.0.0.0", port)) {
        Ok(_) => DoctorCheck::pass("mcp_server", format!("MCP port {port}"), "available"),
        Err(_) => DoctorCheck {
            category: "mcp_server",
            name: format!("MCP port {port}"),
            ok: true, // warn-only: port in use doesn't prevent running
            value: Some("already in use (change UNRAID_RMCP_PORT if needed)".to_string()),
            hint: None,
            latency_ms: None,
            warn_only: true,
        },
    }
}

fn check_auth_config(config: &Config) -> DoctorCheck {
    let host = &config.mcp.host;
    let is_loopback = host.starts_with("127.") || host == "::1" || host == "localhost";

    let (mode_label, ok, hint) = if config.mcp.no_auth {
        if is_loopback {
            (format!("no-auth (loopback bind {host} — safe)"), true, None)
        } else {
            (
                format!("no-auth on non-loopback {host} — SECURITY RISK"),
                false,
                Some(
                    "Set UNRAID_RMCP_TOKEN or use auth_mode=oauth, \
                     or bind to 127.0.0.1 (UNRAID_RMCP_HOST=127.0.0.1)"
                        .to_string(),
                ),
            )
        }
    } else if config.mcp.auth.mode == AuthMode::OAuth {
        ("oauth".to_string(), true, None)
    } else if config.mcp.api_token.is_some() {
        ("bearer (token set)".to_string(), true, None)
    } else {
        (
            "bearer (no token — MCP endpoint is unprotected)".to_string(),
            false,
            Some("Set UNRAID_RMCP_TOKEN=<token> in your .env".to_string()),
        )
    };

    DoctorCheck {
        category: "mcp_server",
        name: "Auth mode".into(),
        ok,
        value: Some(mode_label),
        hint,
        latency_ms: None,
        warn_only: false,
    }
}

// ── output ────────────────────────────────────────────────────────────────────

fn print_doctor_report(checks: &[DoctorCheck]) {
    let version = env!("CARGO_PKG_VERSION");
    eprintln!();
    eprintln!("unraid-rmcp v{version} — environment check");
    eprintln!();

    let categories = [
        ("config", "Config"),
        ("credentials", "Service credentials"),
        ("connectivity", "Connectivity"),
        ("mcp_server", "MCP server"),
    ];

    for (cat_key, cat_label) in categories {
        let cat_checks: Vec<&DoctorCheck> =
            checks.iter().filter(|c| c.category == cat_key).collect();
        if cat_checks.is_empty() {
            continue;
        }
        eprintln!("  {cat_label}");
        eprintln!("  {}", "─".repeat(46));
        for c in &cat_checks {
            let icon = if c.ok { "✓" } else { "✗" };
            let name_pad = format!("{:<24}", c.name);
            let value_part = c.value.as_deref().unwrap_or("");
            eprintln!("  {icon} {name_pad} {value_part}");
            if let Some(hint) = &c.hint {
                eprintln!("    → {hint}");
            }
        }
        eprintln!();
    }

    let failures: usize = checks.iter().filter(|c| !c.ok && !c.warn_only).count();
    eprintln!("  {}", "━".repeat(48));
    if failures == 0 {
        eprintln!("  All checks passed. Ready to run: unraid serve");
    } else {
        eprintln!("  {failures} issue(s) found. Fix them before running: unraid serve");
    }
    eprintln!();
}

// ── entry point ───────────────────────────────────────────────────────────────

pub async fn run_doctor(config: &Config, json: bool) -> anyhow::Result<()> {
    let data_dir = default_data_dir();
    let mut checks: Vec<DoctorCheck> = vec![
        // Config / filesystem
        check_config_file(&data_dir),
        check_dir_writable("config", "Data directory", &data_dir),
        check_dir_writable("config", "Log directory", &data_dir.join("logs")),
        check_binary_in_path("runraid"),
        // Required credentials
        check_required_var("UNRAID_API_URL", &config.unraid.api_url),
        check_required_var("UNRAID_API_KEY", &config.unraid.api_key),
    ];
    if let Some(w) = check_skip_tls_warn(config.unraid.skip_tls_verify) {
        checks.push(w);
    }

    // Upstream connectivity (skip if URL not set — would panic the client)
    let skip_tls = config.unraid.skip_tls_verify;
    if !config.unraid.api_url.is_empty() && !config.unraid.api_key.is_empty() {
        checks.push(check_upstream(&config.unraid.api_url, &config.unraid.api_key, skip_tls).await);
    } else if !config.unraid.api_url.is_empty() {
        // URL set but no key — still probe (will get 401, caught by check_upstream)
        checks.push(check_upstream(&config.unraid.api_url, "", skip_tls).await);
    }

    // MCP port
    checks.push(check_port_available(config.mcp.port));

    // Auth mode
    checks.push(check_auth_config(config));

    let failures: usize = checks.iter().filter(|c| !c.ok && !c.warn_only).count();

    if json {
        println!("{}", serde_json::to_string_pretty(&checks)?);
    } else {
        print_doctor_report(&checks);
    }

    if failures > 0 {
        std::process::exit(1);
    }
    Ok(())
}
