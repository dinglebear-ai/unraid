pub mod aurora;
mod formatter;

use std::io::IsTerminal;
use std::path::Path;

use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

use formatter::AuroraFormatter;

/// Detect whether the console layer should emit ANSI color codes.
///
/// Rules (in precedence order):
/// 1. `NO_COLOR` set → no color (https://no-color.org)
/// 2. `FORCE_COLOR` set → color (useful in Docker / CI)
/// 3. stderr is a TTY → color
#[must_use]
pub fn should_colorize() -> bool {
    if std::env::var_os("NO_COLOR").is_some() {
        return false;
    }
    if std::env::var("FORCE_COLOR").is_ok() {
        return true;
    }
    std::io::stderr().is_terminal()
}

/// Initialize dual-output logging:
/// - **Console (stderr)**: human-readable, aurora-colored, pretty format.
/// - **File** (`{data_dir}/logs/{service_name}.log`): structured JSON, no ANSI.
///
/// One log file, 10 MB cap — file is truncated when it reaches the cap.
///
/// Uses `try_init()` so multiple test invocations don't panic on re-init.
pub fn init_logging(data_dir: &Path, service_name: &str) -> anyhow::Result<()> {
    let log_dir = data_dir.join("logs");
    std::fs::create_dir_all(&log_dir)?;

    let log_path = log_dir.join(format!("{service_name}.log"));
    let max_bytes: u64 = 10 * 1024 * 1024; // 10 MB

    // Truncate if over the cap.
    if log_path.exists() {
        if let Ok(meta) = log_path.metadata() {
            if meta.len() >= max_bytes {
                let _ = std::fs::write(&log_path, b"");
            }
        }
    }

    let log_file = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_path)?;

    let console_ansi = should_colorize();

    let console_layer = tracing_subscriber::fmt::layer()
        .with_ansi(console_ansi)
        .with_writer(std::io::stderr)
        .event_format(AuroraFormatter);

    let file_layer = tracing_subscriber::fmt::layer()
        .json()
        .with_ansi(false)
        .with_writer(log_file);

    let filter = EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info"));

    tracing_subscriber::registry()
        .with(filter)
        .with(console_layer)
        .with(file_layer)
        .try_init()
        .ok(); // ok() swallows "already initialized" in tests

    Ok(())
}
