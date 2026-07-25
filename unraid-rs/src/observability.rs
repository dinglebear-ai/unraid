use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use std::time::{Duration, Instant};

/// Shared atomic counters for observability. Wrap in `Arc` so all `AppState`
/// clones share the same counters.
#[derive(Debug, Default)]
pub struct Counters {
    pub requests_total: AtomicU64,
    pub errors_total: AtomicU64,
    pub upstream_calls: AtomicU64,
    pub upstream_errors: AtomicU64,
}

impl Counters {
    pub fn new() -> Arc<Self> {
        Arc::new(Self::default())
    }

    pub fn inc_requests(&self) {
        self.requests_total.fetch_add(1, Ordering::Relaxed);
    }

    pub fn inc_errors(&self) {
        self.errors_total.fetch_add(1, Ordering::Relaxed);
    }

    pub fn inc_upstream(&self) {
        self.upstream_calls.fetch_add(1, Ordering::Relaxed);
    }

    pub fn inc_upstream_err(&self) {
        self.upstream_errors.fetch_add(1, Ordering::Relaxed);
    }

    pub fn snapshot(&self) -> CounterSnapshot {
        CounterSnapshot {
            requests_total: self.requests_total.load(Ordering::Relaxed),
            errors_total: self.errors_total.load(Ordering::Relaxed),
            upstream_calls: self.upstream_calls.load(Ordering::Relaxed),
            upstream_errors: self.upstream_errors.load(Ordering::Relaxed),
        }
    }
}

#[derive(Debug, serde::Serialize)]
pub struct CounterSnapshot {
    pub requests_total: u64,
    pub errors_total: u64,
    pub upstream_calls: u64,
    pub upstream_errors: u64,
}

/// Timeout for the upstream health probe. Chosen to sit within a range: long
/// enough to absorb a realistic DNS+TLS+latency round-trip to the externally
/// resolved Unraid endpoint (so a transient spike does not register as a
/// failure and fire warn-level alert noise while the API is actually healthy),
/// yet strictly *below* the container healthcheck's curl timeout (5s) so this
/// probe resolves and `/health` returns its own error category before curl
/// gives up — otherwise a slow upstream would fail the container healthcheck
/// rather than surfacing as `degraded`.
const PROBE_TIMEOUT: Duration = Duration::from_secs(4);

/// Result of a lightweight upstream health probe.
#[derive(Debug, serde::Serialize)]
pub struct UpstreamHealth {
    pub reachable: bool,
    pub latency_ms: Option<u64>,
    pub error: Option<String>,
}

impl UpstreamHealth {
    pub fn ok(latency: Duration) -> Self {
        Self {
            reachable: true,
            latency_ms: Some(latency.as_millis() as u64),
            error: None,
        }
    }

    pub fn down(err: impl std::fmt::Display) -> Self {
        Self {
            reachable: false,
            latency_ms: None,
            error: Some(err.to_string()),
        }
    }
}

/// Probe upstream with a short timeout (see [`PROBE_TIMEOUT`]) via a simple
/// info query.
pub async fn probe_upstream(client: &reqwest::Client, url: &str, api_key: &str) -> UpstreamHealth {
    let started = Instant::now();
    let res = client
        .post(url)
        .header("x-api-key", api_key)
        .header("Content-Type", "application/json")
        .json(&serde_json::json!({ "query": "query { info { time } }" }))
        .timeout(PROBE_TIMEOUT)
        .send()
        .await;
    match res {
        Ok(r) if r.status().is_success() => UpstreamHealth::ok(started.elapsed()),
        Ok(r) => UpstreamHealth::down(format!("HTTP {}", r.status())),
        Err(e) => {
            // `/health` is public — log the full error server-side (which may
            // embed the upstream URL), but return only a category to the caller.
            // Use `?e`: reqwest's `Debug` renders the whole `source()` chain
            // (timeout vs DNS vs connect vs TLS), whereas `Display` only shows
            // the outer "error sending request" line.
            tracing::warn!(error = ?e, "upstream health probe failed");
            let category = if e.is_timeout() {
                "request timed out"
            } else if e.is_connect() {
                "connection failed"
            } else {
                "request failed"
            };
            UpstreamHealth::down(category)
        }
    }
}
