//! Dynamic runtime bootstrap and refresh diagnostics.

use std::sync::{
    Arc, RwLock,
    atomic::{AtomicU64, Ordering},
};

use super::{catalog::CatalogStore, config::DynamicMcpConfig};

/// Runtime state shared by MCP request handlers and refresh tasks.
#[derive(Clone)]
pub struct DynamicRuntime {
    /// Immutable validated dynamic configuration.
    pub config: Arc<DynamicMcpConfig>,
    /// Active immutable catalog store.
    pub catalogs: CatalogStore,
    /// Clone-safe refresh diagnostics.
    pub status: Arc<DynamicStatus>,
}

impl DynamicRuntime {
    /// Construct bootstrap runtime only when dynamic MCP is enabled.
    pub fn from_config(config: &DynamicMcpConfig) -> Option<Self> {
        config.enabled.then(|| Self {
            config: Arc::new(config.clone()),
            catalogs: CatalogStore::default(),
            status: Arc::new(DynamicStatus::default()),
        })
    }
}

/// Summary of one successful catalog refresh.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RefreshSummary {
    /// Normalized schema hash.
    pub schema_hash: String,
    /// Compiled catalog hash.
    pub catalog_hash: String,
    /// Available query count.
    pub query_count: usize,
    /// Available mutation count.
    pub mutation_count: usize,
}

impl RefreshSummary {
    /// Construct a successful refresh summary.
    pub fn new(
        schema_hash: impl Into<String>,
        catalog_hash: impl Into<String>,
        query_count: usize,
        mutation_count: usize,
    ) -> Self {
        Self {
            schema_hash: schema_hash.into(),
            catalog_hash: catalog_hash.into(),
            query_count,
            mutation_count,
        }
    }
}

/// Summary of one failed discovery or catalog compilation attempt.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RefreshFailureSummary {
    /// Stable failure category.
    pub code: String,
}

impl RefreshFailureSummary {
    /// Construct a failure summary without retaining sensitive error bodies.
    pub fn new(code: impl Into<String>) -> Self {
        Self { code: code.into() }
    }
}

#[derive(Debug, Default, Clone)]
struct DynamicStatusDetails {
    active_catalog_hash: Option<String>,
    last_success: Option<RefreshSummary>,
    last_failure: Option<RefreshFailureSummary>,
}

/// Concurrent refresh counters and compact last-result summaries.
#[derive(Debug, Default)]
pub struct DynamicStatus {
    discovery_attempts: AtomicU64,
    discovery_failures: AtomicU64,
    catalog_swaps: AtomicU64,
    details: RwLock<DynamicStatusDetails>,
}

impl DynamicStatus {
    /// Count one live discovery attempt.
    pub fn record_attempt(&self) {
        self.discovery_attempts.fetch_add(1, Ordering::Relaxed);
    }

    /// Record a successful candidate validation and active-catalog swap.
    pub fn record_success(&self, summary: RefreshSummary) {
        self.catalog_swaps.fetch_add(1, Ordering::Relaxed);
        let mut details = self
            .details
            .write()
            .unwrap_or_else(|error| error.into_inner());
        details.active_catalog_hash = Some(summary.catalog_hash.clone());
        details.last_success = Some(summary);
    }

    /// Record a failed discovery or compilation attempt.
    pub fn record_failure(&self, summary: RefreshFailureSummary) {
        self.discovery_failures.fetch_add(1, Ordering::Relaxed);
        self.details
            .write()
            .unwrap_or_else(|error| error.into_inner())
            .last_failure = Some(summary);
    }

    /// Capture one internally consistent diagnostics snapshot.
    pub fn snapshot(&self) -> DynamicStatusSnapshot {
        let details = self
            .details
            .read()
            .unwrap_or_else(|error| error.into_inner())
            .clone();
        DynamicStatusSnapshot {
            discovery_attempts: self.discovery_attempts.load(Ordering::Relaxed),
            discovery_failures: self.discovery_failures.load(Ordering::Relaxed),
            catalog_swaps: self.catalog_swaps.load(Ordering::Relaxed),
            active_catalog_hash: details.active_catalog_hash,
            last_success: details.last_success,
            last_failure: details.last_failure,
        }
    }
}

/// Serializable-ready diagnostics projection for future MCP resources.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DynamicStatusSnapshot {
    /// Total live discovery attempts.
    pub discovery_attempts: u64,
    /// Total failed discovery or compilation attempts.
    pub discovery_failures: u64,
    /// Total active-catalog swaps.
    pub catalog_swaps: u64,
    /// Hash of the currently active compiled catalog.
    pub active_catalog_hash: Option<String>,
    /// Most recent successful refresh summary.
    pub last_success: Option<RefreshSummary>,
    /// Most recent failed refresh summary.
    pub last_failure: Option<RefreshFailureSummary>,
}

#[cfg(test)]
mod tests {
    use std::sync::Arc;

    use crate::mcp::dynamic::config::DynamicMcpConfig;

    use super::{DynamicRuntime, DynamicStatus, RefreshFailureSummary, RefreshSummary};

    #[test]
    fn dynamic_runtime_is_absent_when_disabled_and_empty_when_enabled() {
        let disabled = DynamicMcpConfig::default();
        assert!(DynamicRuntime::from_config(&disabled).is_none());

        let enabled = DynamicMcpConfig {
            enabled: true,
            ..Default::default()
        };
        let runtime = DynamicRuntime::from_config(&enabled).expect("enabled runtime");
        assert!(runtime.catalogs.load().by_path.is_empty());
        assert!(Arc::ptr_eq(&runtime.config, &runtime.config.clone()));
    }

    #[test]
    fn dynamic_status_records_attempt_success_failure_and_swap() {
        let status = DynamicStatus::default();
        status.record_attempt();
        status.record_failure(RefreshFailureSummary::new("network_error"));
        status.record_attempt();
        status.record_success(RefreshSummary::new("schema-1", "catalog-1", 58, 48));

        let snapshot = status.snapshot();
        assert_eq!(snapshot.discovery_attempts, 2);
        assert_eq!(snapshot.discovery_failures, 1);
        assert_eq!(snapshot.catalog_swaps, 1);
        assert_eq!(snapshot.active_catalog_hash.as_deref(), Some("catalog-1"));
        assert_eq!(snapshot.last_success.unwrap().query_count, 58);
        assert_eq!(snapshot.last_failure.unwrap().code, "network_error");
    }
}
