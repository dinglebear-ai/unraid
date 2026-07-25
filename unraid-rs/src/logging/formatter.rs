use std::collections::BTreeMap;
use std::fmt as stdfmt;

use tracing::{
    field::{Field, Visit},
    Event, Subscriber,
};
use tracing_subscriber::{
    fmt::{
        format::{FormatEvent, FormatFields, Writer},
        FmtContext,
    },
    registry::LookupSpan,
};

use super::aurora;

// ── Raw ANSI helpers ──────────────────────────────────────────────────────────

fn ansi256(n: u8, text: &str) -> String {
    format!("\x1b[38;5;{n}m{text}\x1b[0m")
}

fn ansi256_bold(n: u8, text: &str) -> String {
    format!("\x1b[1;38;5;{n}m{text}\x1b[0m")
}

fn ansi_dim(text: &str) -> String {
    format!("\x1b[2m{text}\x1b[0m")
}

// ── Field collector ───────────────────────────────────────────────────────────

#[derive(Default)]
struct EventFieldCollector {
    fields: BTreeMap<&'static str, String>,
}

impl EventFieldCollector {
    fn insert(&mut self, field: &Field, value: String) {
        self.fields.insert(field.name(), value);
    }

    fn take(&mut self, key: &str) -> Option<String> {
        self.fields.remove(key)
    }
}

impl Visit for EventFieldCollector {
    fn record_str(&mut self, field: &Field, value: &str) {
        self.insert(field, value.to_string());
    }

    fn record_bool(&mut self, field: &Field, value: bool) {
        self.insert(field, value.to_string());
    }

    fn record_i64(&mut self, field: &Field, value: i64) {
        self.insert(field, value.to_string());
    }

    fn record_u64(&mut self, field: &Field, value: u64) {
        self.insert(field, value.to_string());
    }

    fn record_f64(&mut self, field: &Field, value: f64) {
        self.insert(field, value.to_string());
    }

    fn record_debug(&mut self, field: &Field, value: &dyn std::fmt::Debug) {
        self.insert(field, format!("{value:?}"));
    }
}

// ── Semantic field coloring ───────────────────────────────────────────────────

fn style_value(key: &str, value: &str, level: tracing::Level) -> String {
    match key {
        "service" => ansi256(aurora::SERVICE_NAME, value),
        "tool" | "prompt" | "resource_uri" | "upstream" | "route" | "action" | "addr"
        | "instance" | "target" | "capability" => ansi256(aurora::ACCENT_PRIMARY, value),
        "subsystem" | "phase" | "transport" | "operation" => ansi256(aurora::TEXT_MUTED, value),
        "status" => {
            if let Ok(n) = value.parse::<u16>() {
                let color = if n < 300 {
                    aurora::SUCCESS
                } else if n < 500 {
                    aurora::WARN
                } else {
                    aurora::ERROR
                };
                ansi256(color, value)
            } else {
                value.to_string()
            }
        }
        "error" => ansi256(aurora::ERROR, value),
        "kind" if matches!(level, tracing::Level::WARN | tracing::Level::ERROR) => {
            ansi256(aurora::WARN, value)
        }
        _ => value.to_string(),
    }
}

/// Strip ANSI-injection-capable control characters from field values.
/// Tab (0x09) and newline (0x0A) are preserved.
fn sanitize(value: &str) -> std::borrow::Cow<'_, str> {
    if value
        .chars()
        .any(|c| c.is_control() && c != '\t' && c != '\n')
    {
        std::borrow::Cow::Owned(
            value
                .chars()
                .map(|c| {
                    if c.is_control() && c != '\t' && c != '\n' {
                        '\u{FFFD}'
                    } else {
                        c
                    }
                })
                .collect(),
        )
    } else {
        std::borrow::Cow::Borrowed(value)
    }
}

fn format_value(value: &str) -> String {
    if value.contains(char::is_whitespace) {
        format!("{value:?}")
    } else {
        value.to_string()
    }
}

fn write_level(writer: &mut Writer<'_>, level: tracing::Level, ansi: bool) -> stdfmt::Result {
    let s = if ansi {
        match level {
            tracing::Level::ERROR => ansi256_bold(aurora::ERROR, "ERROR"),
            tracing::Level::WARN => ansi256_bold(aurora::WARN, " WARN"),
            tracing::Level::INFO => " INFO".to_string(),
            tracing::Level::DEBUG => ansi_dim("DEBUG"),
            tracing::Level::TRACE => ansi_dim("TRACE"),
        }
    } else {
        match level {
            tracing::Level::ERROR => "ERROR".to_string(),
            tracing::Level::WARN => " WARN".to_string(),
            tracing::Level::INFO => " INFO".to_string(),
            tracing::Level::DEBUG => "DEBUG".to_string(),
            tracing::Level::TRACE => "TRACE".to_string(),
        }
    };
    write!(writer, "{s}  ")
}

// ── Aurora formatter ──────────────────────────────────────────────────────────

/// Custom `tracing_subscriber` event formatter using the Aurora color palette.
///
/// Format:
/// ```text
/// HH:MM:SS  LEVEL  <message>  key=value  key=value
/// ```
#[derive(Clone, Copy)]
pub struct AuroraFormatter;

impl<S, N> FormatEvent<S, N> for AuroraFormatter
where
    S: Subscriber + for<'a> LookupSpan<'a>,
    N: for<'a> FormatFields<'a> + 'static,
{
    fn format_event(
        &self,
        _ctx: &FmtContext<'_, S, N>,
        mut writer: Writer<'_>,
        event: &Event<'_>,
    ) -> stdfmt::Result {
        let ansi = writer.has_ansi_escapes();

        let mut fields = EventFieldCollector::default();
        event.record(&mut fields);

        let level = *event.metadata().level();
        let message = fields
            .take("message")
            .map(|m| sanitize(&m).into_owned())
            .unwrap_or_default();

        // HH:MM:SS (local time — simple, no external dep)
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();
        let secs_in_day = now % 86400;
        let h = secs_in_day / 3600;
        let m = (secs_in_day % 3600) / 60;
        let s = secs_in_day % 60;
        let ts = format!("{h:02}:{m:02}:{s:02}");
        if ansi {
            write!(writer, "{}  ", ansi_dim(&ts))?;
        } else {
            write!(writer, "{ts}  ")?;
        }

        write_level(&mut writer, level, ansi)?;

        // Message: first token SERVICE_NAME+bold, rest plain or key=val dim.
        if ansi && !message.is_empty() {
            for (i, token) in message.split_whitespace().enumerate() {
                if i > 0 {
                    write!(writer, " ")?;
                }
                if i == 0 {
                    write!(writer, "{}", ansi256_bold(aurora::SERVICE_NAME, token))?;
                } else if let Some(eq) = token.find('=') {
                    write!(
                        writer,
                        "{}{}{}",
                        ansi_dim(&token[..eq]),
                        ansi_dim("="),
                        &token[eq + 1..]
                    )?;
                } else {
                    write!(writer, "{token}")?;
                }
            }
        } else {
            write!(writer, "{message}")?;
        }

        // Priority fields first, then remaining alphabetically.
        let priority = [
            "kind",
            "request_id",
            "tool",
            "action",
            "route",
            "addr",
            "method",
            "status",
            "operation",
            "capability",
            "transport",
            "response_bytes",
            "elapsed_ms",
            "error",
        ];

        let write_kv = |writer: &mut Writer<'_>, key: &str, raw: &str| -> stdfmt::Result {
            let safe = sanitize(raw);
            let formatted = format_value(&safe);
            if ansi {
                write!(
                    writer,
                    "  {}{}{}",
                    ansi_dim(key),
                    ansi_dim("="),
                    style_value(key, &formatted, level),
                )
            } else {
                write!(writer, "  {key}={formatted}")
            }
        };

        for key in priority {
            if let Some(val) = fields.take(key) {
                write_kv(&mut writer, key, &val)?;
            }
        }

        let remaining: Vec<_> = fields.fields.iter().map(|(k, v)| (*k, v.clone())).collect();
        for (key, val) in remaining {
            write_kv(&mut writer, key, &val)?;
        }

        writeln!(writer)
    }
}
