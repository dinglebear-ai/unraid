use anyhow::Result;
use rmcp::{transport::stdio, ServiceExt};
use std::sync::Arc;
use tracing::info;

use unraid_rmcp::{
    app::UnraidService,
    config::{AuthMode, Config},
    graphql::UnraidClient,
    mcp::{self, AppState, AuthPolicy},
    observability::Counters,
};

mod cli;

#[tokio::main]
async fn main() -> Result<()> {
    let args: Vec<String> = std::env::args().skip(1).collect();

    match args.as_slice() {
        [f] if matches!(f.as_str(), "--help" | "-h" | "help") => {
            print_usage();
            return Ok(());
        }
        [f] if matches!(f.as_str(), "--version" | "-V" | "version") => {
            println!("unraid-rmcp {}", env!("CARGO_PKG_VERSION"));
            return Ok(());
        }
        _ => {}
    }

    // Load ~/.unraid/.env (or /data/.env in a container) before any Config::load
    // so the binary works on bare metal without a process manager injecting env.
    // Non-overriding: explicit process env still wins.
    unraid_rmcp::config::load_dotenv();

    let stdio_mode = matches!(args.as_slice(), [c] if c == "mcp");
    let serve_mode = args.is_empty()
        || matches!(args.as_slice(), [c] if c == "serve")
        || matches!(args.as_slice(), [a, b] if a == "serve" && b == "mcp");

    // Dual logging: console (aurora-colored stderr) + JSON file.
    // In stdio/CLI modes we suppress info-level to keep stdout clean.
    if stdio_mode || !serve_mode {
        // Minimal logging for stdio/CLI: warnings only to stderr.
        tracing_subscriber::fmt()
            .with_env_filter(
                tracing_subscriber::EnvFilter::try_from_default_env()
                    .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("warn")),
            )
            .with_writer(std::io::stderr)
            .with_ansi(unraid_rmcp::logging::should_colorize())
            .try_init()
            .ok();
    } else {
        let data_dir = unraid_rmcp::config::default_data_dir();
        if let Err(e) = unraid_rmcp::logging::init_logging(&data_dir, "unraid-rmcp") {
            // Fall back to simple stderr logging if file init fails.
            eprintln!("Warning: could not init file logging: {e}");
            tracing_subscriber::fmt()
                .with_env_filter(
                    tracing_subscriber::EnvFilter::try_from_default_env()
                        .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("info")),
                )
                .with_writer(std::io::stderr)
                .try_init()
                .ok();
        }
    }

    if serve_mode {
        serve_mcp().await
    } else if stdio_mode {
        serve_stdio_mcp().await
    } else {
        run_cli(args).await
    }
}

/// Returns true if `host` is a loopback bind target: the IPv4 `127.0.0.0/8`
/// range, the IPv6 loopback `::1` (bracketed or not), or `localhost`
/// (case-insensitive). Shared by `validate_bind_security` and
/// `build_auth_policy` so the no-auth guard and the auto-bypass agree on what
/// counts as loopback.
fn is_loopback_host(host: &str) -> bool {
    // Parse as an IP (covering all of 127.0.0.0/8 and ::1) rather than a string
    // prefix, so e.g. "127.evil.com" is NOT treated as loopback. Strip optional
    // IPv6 brackets first ("[::1]" -> "::1").
    let trimmed = host
        .strip_prefix('[')
        .and_then(|s| s.strip_suffix(']'))
        .unwrap_or(host);
    if let Ok(ip) = trimmed.parse::<std::net::IpAddr>() {
        return ip.is_loopback();
    }
    host.eq_ignore_ascii_case("localhost")
}

/// Safety guard: refuse to start if binding to a non-loopback address with auth disabled
/// unless the operator explicitly sets UNRAID_NOAUTH=true.
fn validate_bind_security(config: &Config) -> Result<()> {
    let host = &config.mcp.host;
    let is_loopback = is_loopback_host(host);
    let auth_disabled = config.mcp.no_auth;

    if !is_loopback && auth_disabled {
        let noauth_override = std::env::var("UNRAID_NOAUTH")
            .map(|v| matches!(v.to_lowercase().as_str(), "1" | "true" | "yes"))
            .unwrap_or(false);

        if !noauth_override {
            anyhow::bail!(
                "Security error: binding to non-loopback address '{}' with auth disabled.\n\
                 This exposes the MCP endpoint without any authentication.\n\
                 Options:\n\
                 1. Set UNRAID_RMCP_HOST=127.0.0.1 to restrict to local connections\n\
                 2. Remove no_auth=true / UNRAID_RMCP_DISABLE_HTTP_AUTH from your config\n\
                 3. Set UNRAID_NOAUTH=true to explicitly acknowledge this risk",
                host
            );
        }
        tracing::warn!(
            host = %host,
            "UNRAID_NOAUTH=true: starting with auth disabled on non-loopback — ensure upstream auth is in place"
        );
    }
    Ok(())
}

async fn serve_mcp() -> Result<()> {
    let config = Config::load()?;
    validate_bind_security(&config)?;
    let state = build_state(config).await?;

    info!(
        bind = %state.config.bind_addr(),
        server_name = %state.config.server_name,
        auth = ?state.auth_policy,
        "unraid-rmcp starting"
    );

    let bind = state.config.bind_addr();
    let app = mcp::router(state).layer(tower_http::trace::TraceLayer::new_for_http());
    let listener = tokio::net::TcpListener::bind(&bind).await?;
    info!(bind = %bind, "MCP HTTP server listening");

    axum::serve(listener, app.into_make_service())
        .with_graceful_shutdown(shutdown_signal())
        .await?;
    Ok(())
}

async fn serve_stdio_mcp() -> Result<()> {
    let config = Config::load()?;
    let state = build_state(config).await?;
    let svc = mcp::rmcp_server(state).serve(stdio()).await?;
    svc.waiting().await?;
    Ok(())
}

async fn run_cli(args: Vec<String>) -> Result<()> {
    let (cmd, json) = cli::CliCommand::parse(&args)?;
    // Translate CLAUDE_PLUGIN_OPTION_* into UNRAID_* env vars BEFORE Config::load()
    // so the plugin hook can call the binary directly (no plugin-setup.sh wrapper).
    // unrust is template-style: check() validates the pre-loaded &Config, so the
    // mapping must happen before the load, not inside the handler.
    if matches!(cmd, cli::CliCommand::Setup(_)) {
        cli::setup::apply_plugin_options();
    }
    let config = Config::load()?;

    // Doctor does not need a live service/client connection.
    if matches!(cmd, cli::CliCommand::Doctor) {
        return cli::doctor::run_doctor(&config, json).await;
    }
    if let cli::CliCommand::Setup(command) = cmd {
        return cli::setup::run_setup(&config, command).await;
    }

    let service = UnraidService::new(UnraidClient::new(&config.unraid)?);
    cli::run(&service, cmd, json).await
}

async fn build_state(config: Config) -> Result<AppState> {
    let auth_policy = build_auth_policy(&config).await?;
    let service = UnraidService::new(UnraidClient::new(&config.unraid)?);
    Ok(AppState {
        config: config.mcp,
        auth_policy,
        service,
        counters: Counters::new(),
    })
}

async fn build_auth_policy(config: &Config) -> Result<AuthPolicy> {
    if config.mcp.no_auth || is_loopback_host(&config.mcp.host) {
        return Ok(AuthPolicy::LoopbackDev);
    }
    if config.mcp.auth.mode == AuthMode::OAuth {
        let auth_cfg = lab_auth::config::AuthConfigBuilder::new()
            .env_prefix("UNRAID_RMCP")
            .session_cookie_name("unraid_rmcp_session")
            .scopes_supported(vec!["unraid:read".into(), "unraid:admin".into()])
            .default_scope("unraid:read")
            .resource_path("/mcp")
            .enable_dynamic_registration(true)
            .build_from_sources(std::env::vars())
            .map_err(|e| anyhow::anyhow!("OAuth config error: {e}"))?;
        let auth_state = lab_auth::state::AuthState::new(auth_cfg)
            .await
            .map_err(|e| anyhow::anyhow!("OAuth state init error: {e}"))?;
        Ok(AuthPolicy::Mounted {
            auth_state: Some(Arc::new(auth_state)),
        })
    } else {
        Ok(AuthPolicy::Mounted { auth_state: None })
    }
}

fn print_usage() {
    eprintln!(
        "Usage:
  unraid [serve]                        Start MCP HTTP server
  unraid mcp                            Start MCP stdio transport
  unraid doctor [--json]                Validate environment and config
  unraid setup check                    Check plugin setup without mutating appdata
  unraid setup repair                   Create missing appdata/env setup files
  unraid setup plugin-hook [--no-repair]  Plugin hook JSON contract

Core:
  unraid array [--json]                 Array state, disk health, parity
  unraid disks [--json]                 Physical disks with SMART
  unraid docker [--json]                Docker containers
  unraid docker logs <id> [--tail N] [--json]
  unraid vms [--json]                   Virtual machines
  unraid server [--json]                Server identity and IPs
  unraid info [--json]                  OS, CPU, memory, versions
  unraid shares [--json]                User shares
  unraid notifications [--json]         Active alerts

System:
  unraid services [--json]              Running system services
  unraid network [--json]               Network access URLs
  unraid metrics [--json]               Live CPU, memory, temperature
  unraid vars [--json]                  System configuration variables
  unraid registration [--json]          License state and expiry
  unraid flash [--json]                 USB flash drive info

Logs:
  unraid log-files [--json]             List available log files
  unraid log <path> [--lines N] [--start-line N] [--json]

Storage:
  unraid parity-history [--json]        Past parity check results
  unraid rclone [--json]                Backup remote configurations

UPS:
  unraid ups [--json]                   UPS devices: battery, power, status
  unraid ups-config [--json]            UPS monitoring configuration

Remote access:
  unraid remote-access [--json]         WAN access config
  unraid connect [--json]               Unraid Connect status

Plugins:
  unraid plugins [--json]               Installed community plugins

Environment:
  UNRAID_API_URL                  Unraid GraphQL endpoint (required)
  UNRAID_API_KEY                  Unraid API key (required)
  UNRAID_API_SKIP_TLS_VERIFY      Skip TLS cert check
  UNRAID_RMCP_HOST                 Bind host (default 0.0.0.0)
  UNRAID_RMCP_PORT                 Bind port (default 40010)
  UNRAID_RMCP_DISABLE_HTTP_AUTH    Disable MCP auth
  RUST_LOG                        Log filter"
    );
}

async fn shutdown_signal() {
    let ctrl_c = async {
        if let Err(e) = tokio::signal::ctrl_c().await {
            tracing::error!(error = %e, "CTRL+C handler failed");
            std::future::pending::<()>().await;
        }
    };

    #[cfg(unix)]
    let terminate = async {
        match tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate()) {
            Ok(mut s) => {
                s.recv().await;
            }
            Err(e) => {
                tracing::error!(error = %e, "SIGTERM handler failed");
                std::future::pending::<()>().await;
            }
        }
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! { _ = ctrl_c => {}, _ = terminate => {} }
    tracing::info!("Shutdown signal received");
}
