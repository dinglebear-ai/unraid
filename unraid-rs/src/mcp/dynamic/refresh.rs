//! Dynamic runtime bootstrap, cache fallback, refresh, and diagnostics.

use std::{
    sync::{
        Arc, RwLock,
        atomic::{AtomicU64, Ordering},
    },
    time::{Duration, SystemTime, UNIX_EPOCH},
};

use rmcp::{Peer, RoleServer};
use tokio::{sync::Mutex, task::JoinHandle, time::sleep};

use crate::app::UnraidService;

use super::{
    cache::{load_cache, write_cache},
    catalog::{CatalogError, CatalogStore, OperationCatalog, compile_catalog},
    config::{DynamicMcpConfig, StartupFailureMode},
    crawler::crawl_schema,
    introspection::DiscoveryError,
    models::OperationAvailability,
    peers::PeerRegistry,
    types::OperationKind,
};

/// Runtime state shared by MCP request handlers and refresh tasks.
#[derive(Clone)]
pub struct DynamicRuntime {
    /// Immutable validated dynamic configuration.
    pub config: Arc<DynamicMcpConfig>,
    /// Active immutable catalog store.
    pub catalogs: CatalogStore,
    /// Clone-safe refresh diagnostics.
    pub status: Arc<DynamicStatus>,
    /// Connected MCP peers eligible for list-change notifications.
    pub peers: PeerRegistry,
    refresh_gate: Arc<Mutex<()>>,
}

impl DynamicRuntime {
    /// Construct bootstrap runtime only when dynamic MCP is enabled.
    pub fn from_config(config: &DynamicMcpConfig) -> Option<Self> {
        config.enabled.then(|| Self {
            config: Arc::new(config.clone()),
            catalogs: CatalogStore::default(),
            status: Arc::new(DynamicStatus::default()),
            peers: PeerRegistry::default(),
            refresh_gate: Arc::new(Mutex::new(())),
        })
    }

    /// Register a peer that has observed the dynamic tool surface.
    pub async fn register_peer(&self, peer: Peer<RoleServer>) {
        self.peers.register(peer).await;
    }

    /// Load a valid cache, then attempt a live schema refresh.
    pub async fn initialize(
        &self,
        service: &UnraidService,
    ) -> Result<RefreshOutcome, RefreshError> {
        let endpoint = service.graphql_client().raw_client().1.to_string();
        let mut cache_loaded = false;
        if self.config.cache_last_known_good {
            match load_cache(&self.config.cache_path, &endpoint, &self.config) {
                Ok(Some((_snapshot, catalog))) => {
                    let catalog = Arc::new(catalog);
                    self.catalogs.store(catalog.clone());
                    self.status.record_cached_catalog(&catalog.catalog_hash);
                    cache_loaded = true;
                }
                Ok(None) => {}
                Err(error) => {
                    tracing::warn!(error = %error, "dynamic MCP cache was not usable");
                }
            }
        }

        match self.refresh_once(service).await {
            Ok(outcome) => Ok(outcome),
            Err(error) => match self.config.startup_failure {
                StartupFailureMode::Fail => Err(error),
                StartupFailureMode::LegacyOnly | StartupFailureMode::EmptyDynamic => {
                    tracing::warn!(
                        error = %error,
                        cache_loaded,
                        "dynamic MCP live discovery failed; retaining fallback catalog"
                    );
                    let active_hash = self.catalogs.load().catalog_hash.clone();
                    Ok(RefreshOutcome {
                        changed: cache_loaded,
                        old_catalog_hash: None,
                        new_catalog_hash: (!active_hash.is_empty()).then_some(active_hash),
                        notified_peers: 0,
                        source: if cache_loaded {
                            RefreshSource::Cache
                        } else {
                            RefreshSource::Empty
                        },
                    })
                }
            },
        }
    }

    /// Discover, compile, persist, and atomically install one live candidate.
    pub async fn refresh_once(
        &self,
        service: &UnraidService,
    ) -> Result<RefreshOutcome, RefreshError> {
        let _guard = self.refresh_gate.lock().await;
        self.status.record_attempt();

        let snapshot = match crawl_schema(service.graphql_client(), &self.config).await {
            Ok(snapshot) => snapshot,
            Err(error) => {
                self.status
                    .record_failure(RefreshFailureSummary::new("discovery_failed"));
                return Err(RefreshError::Discovery(error));
            }
        };
        let catalog = match compile_catalog(&snapshot, &self.config) {
            Ok(catalog) => catalog,
            Err(error) => {
                self.status
                    .record_failure(RefreshFailureSummary::new("catalog_compile_failed"));
                return Err(RefreshError::Catalog(error));
            }
        };

        let current = self.catalogs.load();
        let old_hash = (!current.catalog_hash.is_empty()).then(|| current.catalog_hash.clone());
        let changed = current.catalog_hash != catalog.catalog_hash;
        let summary = summarize(&catalog);

        if changed {
            if self.config.cache_last_known_good
                && let Err(error) = write_cache(&self.config.cache_path, &snapshot, &catalog)
            {
                tracing::warn!(error = %error, "failed to update dynamic MCP cache");
            }
            let new_hash = catalog.catalog_hash.clone();
            self.catalogs.store(Arc::new(catalog));
            self.status.record_success(summary, true);
            let notified_peers = self.peers.notify_tool_list_changed().await;
            Ok(RefreshOutcome {
                changed: true,
                old_catalog_hash: old_hash,
                new_catalog_hash: Some(new_hash),
                notified_peers,
                source: RefreshSource::Live,
            })
        } else {
            self.status.record_success(summary, false);
            Ok(RefreshOutcome {
                changed: false,
                old_catalog_hash: old_hash.clone(),
                new_catalog_hash: old_hash,
                notified_peers: 0,
                source: RefreshSource::Live,
            })
        }
    }

    /// Spawn the periodic live refresh loop.
    pub fn spawn_refresh_loop(&self, service: UnraidService) -> JoinHandle<()> {
        let runtime = self.clone();
        tokio::spawn(async move {
            loop {
                sleep(runtime.next_refresh_delay()).await;
                if let Err(error) = runtime.refresh_once(&service).await {
                    tracing::warn!(error = %error, "dynamic MCP periodic refresh failed");
                }
            }
        })
    }

    fn next_refresh_delay(&self) -> Duration {
        let base = self.config.refresh_interval;
        let percent = u128::from(self.config.refresh_jitter_percent);
        if percent == 0 {
            return base;
        }
        let maximum = base.as_millis().saturating_mul(percent) / 100;
        if maximum == 0 {
            return base;
        }
        let seed = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_nanos();
        let jitter = seed % (maximum + 1);
        base.saturating_add(Duration::from_millis(
            u64::try_from(jitter).unwrap_or(u64::MAX),
        ))
    }
}

fn summarize(catalog: &OperationCatalog) -> RefreshSummary {
    let mut query_count = 0usize;
    let mut mutation_count = 0usize;
    for operation in catalog.by_path.values() {
        if !matches!(operation.availability, OperationAvailability::Available) {
            continue;
        }
        match operation.kind() {
            OperationKind::Query => query_count += 1,
            OperationKind::Mutation => mutation_count += 1,
            OperationKind::Subscription => {}
        }
    }
    RefreshSummary::new(
        catalog.schema_hash.clone(),
        catalog.catalog_hash.clone(),
        query_count,
        mutation_count,
    )
}

/// Outcome of one initialization or refresh attempt.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RefreshOutcome {
    /// Whether the active catalog changed.
    pub changed: bool,
    /// Previous non-empty catalog hash.
    pub old_catalog_hash: Option<String>,
    /// Active catalog hash after the operation.
    pub new_catalog_hash: Option<String>,
    /// Number of peers successfully notified.
    pub notified_peers: usize,
    /// Source that supplied the active catalog.
    pub source: RefreshSource,
}

/// Source used for the active catalog after initialization.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RefreshSource {
    /// Valid live targeted introspection.
    Live,
    /// Valid last-known-good cache.
    Cache,
    /// No generated catalog was available.
    Empty,
}

/// Live refresh failure.
#[derive(Debug, thiserror::Error)]
pub enum RefreshError {
    /// Live schema discovery failed.
    #[error("dynamic schema discovery failed")]
    Discovery(#[source] DiscoveryError),
    /// Catalog compilation failed.
    #[error("dynamic catalog compilation failed")]
    Catalog(#[source] CatalogError),
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

    /// Record a successful candidate and whether it replaced the active catalog.
    pub fn record_success(&self, summary: RefreshSummary, swapped: bool) {
        if swapped {
            self.catalog_swaps.fetch_add(1, Ordering::Relaxed);
        }
        let mut details = self
            .details
            .write()
            .unwrap_or_else(|error| error.into_inner());
        details.active_catalog_hash = Some(summary.catalog_hash.clone());
        details.last_success = Some(summary);
    }

    /// Record a cache catalog installation before live discovery.
    pub fn record_cached_catalog(&self, catalog_hash: &str) {
        self.catalog_swaps.fetch_add(1, Ordering::Relaxed);
        self.details
            .write()
            .unwrap_or_else(|error| error.into_inner())
            .active_catalog_hash = Some(catalog_hash.to_string());
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
    use std::{collections::BTreeMap, sync::Arc};

    use serde_json::{Value, json};
    use tempfile::tempdir;
    use wiremock::{Mock, MockServer, Request, Respond, ResponseTemplate, matchers::method};

    use crate::{
        app::UnraidService,
        config::UnraidConfig,
        graphql::UnraidClient,
        mcp::dynamic::config::{DynamicMcpConfig, StartupFailureMode},
    };

    use super::{
        DynamicRuntime, DynamicStatus, RefreshFailureSummary, RefreshSource, RefreshSummary,
    };

    #[derive(Clone)]
    struct FixtureResponder {
        by_name: BTreeMap<String, Value>,
    }

    impl FixtureResponder {
        fn new() -> Self {
            let mut by_name = BTreeMap::new();
            for raw in [
                include_str!("../../../tests/fixtures/dynamic/minimal-query-types.json"),
                include_str!("../../../tests/fixtures/dynamic/namespace-mutations.json"),
            ] {
                let response: Value = serde_json::from_str(raw).unwrap();
                for value in response["data"].as_object().unwrap().values() {
                    let name = value["name"].as_str().unwrap().to_string();
                    by_name.entry(name).or_insert_with(|| value.clone());
                }
            }
            Self { by_name }
        }
    }

    impl Respond for FixtureResponder {
        fn respond(&self, request: &Request) -> ResponseTemplate {
            let body: Value = serde_json::from_slice(&request.body).unwrap();
            let variables = body["variables"].as_object().unwrap();
            let mut data = serde_json::Map::new();
            for index in 0..variables.len() {
                let name = variables[&format!("n{index}")].as_str().unwrap();
                data.insert(
                    format!("t{index}"),
                    self.by_name.get(name).cloned().unwrap_or(Value::Null),
                );
            }
            ResponseTemplate::new(200).set_body_json(json!({ "data": data }))
        }
    }

    async fn fixture_server() -> MockServer {
        let listener = std::net::TcpListener::bind("127.0.0.1:0").unwrap();
        let server = MockServer::builder().listener(listener).start().await;
        Mock::given(method("POST"))
            .respond_with(FixtureResponder::new())
            .mount(&server)
            .await;
        server
    }

    fn service(endpoint: String) -> UnraidService {
        UnraidService::new(
            UnraidClient::new(&UnraidConfig {
                api_url: endpoint,
                api_key: "test-key".to_string(),
                skip_tls_verify: false,
            })
            .unwrap(),
        )
    }

    fn runtime_config(cache_path: std::path::PathBuf) -> DynamicMcpConfig {
        DynamicMcpConfig {
            enabled: true,
            cache_path,
            cache_last_known_good: true,
            introspection_batch_size: 2,
            max_introspection_batches: 20,
            max_discovered_types: 20,
            max_introspection_response_bytes: 1024 * 1024,
            introspection_timeout: std::time::Duration::from_secs(5),
            startup_failure: StartupFailureMode::LegacyOnly,
            ..DynamicMcpConfig::default()
        }
    }

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
        status.record_success(RefreshSummary::new("schema-1", "catalog-1", 58, 48), true);
        let snapshot = status.snapshot();
        assert_eq!(snapshot.discovery_attempts, 2);
        assert_eq!(snapshot.discovery_failures, 1);
        assert_eq!(snapshot.catalog_swaps, 1);
        assert_eq!(snapshot.active_catalog_hash.as_deref(), Some("catalog-1"));
        assert_eq!(snapshot.last_success.unwrap().query_count, 58);
        assert_eq!(snapshot.last_failure.unwrap().code, "network_error");
    }

    #[tokio::test]
    async fn dynamic_refresh_installs_live_catalog_and_skips_unchanged_swap() {
        let directory = tempdir().unwrap();
        let cache_path = directory.path().join("dynamic.json");
        let config = runtime_config(cache_path.clone());
        let runtime = DynamicRuntime::from_config(&config).unwrap();
        let server = fixture_server().await;
        let service = service(server.uri());

        let first = runtime.refresh_once(&service).await.unwrap();
        assert!(first.changed);
        assert_eq!(first.source, RefreshSource::Live);
        assert_eq!(first.notified_peers, 0);
        assert!(cache_path.exists());
        assert_eq!(runtime.catalogs.load().by_tool_name.len(), 2);

        let second = runtime.refresh_once(&service).await.unwrap();
        assert!(!second.changed);
        assert_eq!(second.old_catalog_hash, first.new_catalog_hash);
        assert_eq!(runtime.status.snapshot().catalog_swaps, 1);
        assert_eq!(runtime.status.snapshot().discovery_attempts, 2);
    }

    #[tokio::test]
    async fn dynamic_initialize_uses_cache_when_live_upstream_is_unavailable() {
        let directory = tempdir().unwrap();
        let cache_path = directory.path().join("dynamic.json");
        let config = runtime_config(cache_path.clone());
        let server = fixture_server().await;
        let endpoint = server.uri();

        let live_runtime = DynamicRuntime::from_config(&config).unwrap();
        let live = live_runtime
            .initialize(&service(endpoint.clone()))
            .await
            .unwrap();
        assert_eq!(live.source, RefreshSource::Live);
        let live_hash = live.new_catalog_hash.clone().unwrap();
        assert!(cache_path.exists());
        drop(server);

        let cached_runtime = DynamicRuntime::from_config(&config).unwrap();
        let cached = cached_runtime.initialize(&service(endpoint)).await.unwrap();
        assert_eq!(cached.source, RefreshSource::Cache);
        assert_eq!(cached.new_catalog_hash.as_deref(), Some(live_hash.as_str()));
        assert_eq!(cached_runtime.catalogs.load().catalog_hash, live_hash);
        assert!(!cached_runtime.catalogs.load().by_tool_name.is_empty());
        let status = cached_runtime.status.snapshot();
        assert_eq!(status.discovery_attempts, 1);
        assert_eq!(status.discovery_failures, 1);
        assert_eq!(status.catalog_swaps, 1);
    }
}
