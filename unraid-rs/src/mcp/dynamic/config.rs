//! Configuration types for runtime-generated MCP tools.

use std::{collections::BTreeMap, path::PathBuf, time::Duration};

use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::config::default_data_dir;

/// Complete configuration for runtime-generated MCP tools.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default, deny_unknown_fields)]
pub struct DynamicMcpConfig {
    /// Enables runtime GraphQL discovery and generated MCP tools.
    pub enabled: bool,
    /// Selects the advertised legacy/generated tool projection.
    pub surface: DynamicSurface,
    /// Interval between live schema refresh attempts.
    #[serde(with = "humantime_serde")]
    pub refresh_interval: Duration,
    /// Percentage of refresh jitter, from 0 through 100.
    pub refresh_jitter_percent: u8,
    /// Startup behavior when no valid dynamic catalog is available.
    pub startup_failure: StartupFailureMode,
    /// Automatically expose discovered query operations.
    pub auto_enable_queries: bool,
    /// Automatically expose discovered mutation operations.
    pub auto_enable_mutations: bool,
    /// Include deprecated GraphQL fields and arguments.
    pub include_deprecated: bool,
    /// Default response selection depth.
    pub default_selection_depth: u8,
    /// Maximum caller-selectable response depth.
    pub max_selection_depth: u8,
    /// Maximum fields in a generated selection.
    pub max_selected_fields: usize,
    /// Maximum inline fragments in a generated selection.
    pub max_fragments: usize,
    /// Maximum generated GraphQL document size.
    pub max_document_bytes: usize,
    /// Maximum serialized argument payload size.
    pub max_argument_bytes: usize,
    /// Maximum nested input-object depth.
    pub max_input_depth: usize,
    /// Maximum elements accepted in an input array.
    pub max_array_items: usize,
    /// Number of type names requested per targeted introspection batch.
    pub introspection_batch_size: usize,
    /// Maximum number of types accepted from discovery.
    pub max_discovered_types: usize,
    /// Maximum targeted introspection batches per refresh.
    pub max_introspection_batches: usize,
    /// Maximum bytes accepted from one introspection response.
    pub max_introspection_response_bytes: usize,
    /// Timeout for one introspection HTTP request.
    #[serde(with = "humantime_serde")]
    pub introspection_timeout: Duration,
    /// Persist and load the last successfully compiled catalog.
    pub cache_last_known_good: bool,
    /// Last-known-good catalog path.
    pub cache_path: PathBuf,
    /// GraphQL operation root type names.
    pub root_types: RootTypeNames,
    /// Object type suffixes that may represent mutation namespaces.
    pub namespace_suffixes: Vec<String>,
    /// Canonical operation selectors eligible for exposure.
    pub allowed_operations: Vec<String>,
    /// Canonical operation selectors denied from exposure.
    pub disabled_operations: Vec<String>,
    /// Per-operation policy overrides keyed by canonical operation path.
    pub operations: BTreeMap<String, OperationOverride>,
    /// Custom scalar JSON Schema overrides.
    pub scalar_schemas: BTreeMap<String, Value>,
}

impl Default for DynamicMcpConfig {
    fn default() -> Self {
        Self {
            enabled: false,
            surface: DynamicSurface::default(),
            refresh_interval: Duration::from_secs(60 * 60),
            refresh_jitter_percent: 10,
            startup_failure: StartupFailureMode::default(),
            auto_enable_queries: true,
            auto_enable_mutations: false,
            include_deprecated: false,
            default_selection_depth: 2,
            max_selection_depth: 5,
            max_selected_fields: 128,
            max_fragments: 32,
            max_document_bytes: 64 * 1024,
            max_argument_bytes: 64 * 1024,
            max_input_depth: 16,
            max_array_items: 1024,
            introspection_batch_size: 20,
            max_discovered_types: 2000,
            max_introspection_batches: 200,
            max_introspection_response_bytes: 8 * 1024 * 1024,
            introspection_timeout: Duration::from_secs(20),
            cache_last_known_good: true,
            cache_path: default_data_dir().join("dynamic-schema-cache.json"),
            root_types: RootTypeNames::default(),
            namespace_suffixes: vec!["Mutations".to_string()],
            allowed_operations: Vec::new(),
            disabled_operations: Vec::new(),
            operations: BTreeMap::new(),
            scalar_schemas: BTreeMap::new(),
        }
    }
}

/// Configured GraphQL operation root names.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(default, deny_unknown_fields)]
pub struct RootTypeNames {
    /// Query root object name.
    pub query: String,
    /// Mutation root object name.
    pub mutation: String,
    /// Subscription root object name.
    pub subscription: String,
}

impl Default for RootTypeNames {
    fn default() -> Self {
        Self {
            query: "Query".to_string(),
            mutation: "Mutation".to_string(),
            subscription: "Subscription".to_string(),
        }
    }
}

/// Optional policy and presentation overrides for one canonical operation path.
#[derive(Debug, Clone, Serialize, Deserialize, Default, PartialEq)]
#[serde(default, deny_unknown_fields)]
pub struct OperationOverride {
    /// Explicitly enable or disable the operation.
    pub enabled: Option<bool>,
    /// Hide the operation from generated tool listings.
    pub hidden: Option<bool>,
    /// Mark the operation destructive for wording, audit severity, and annotations.
    pub destructive: Option<bool>,
    /// Override the generated human-readable title.
    pub title: Option<String>,
    /// Override the generated operation description.
    pub description: Option<String>,
    /// Override the default selection depth.
    pub selection_depth: Option<u8>,
    /// Override the generated default field selection.
    pub default_select: Option<Vec<String>>,
    /// Explicitly classify an object-returning field as a namespace.
    pub namespace: Option<bool>,
}

/// Validate cross-field dynamic MCP configuration constraints.
pub fn validate_dynamic_config(config: &DynamicMcpConfig) -> Result<(), String> {
    let mut problems = Vec::new();

    if config.refresh_interval.is_zero() {
        problems.push("refresh_interval must be nonzero".to_string());
    }
    if config.introspection_timeout.is_zero() {
        problems.push("introspection_timeout must be nonzero".to_string());
    }
    if config.default_selection_depth > config.max_selection_depth {
        problems.push(format!(
            "default_selection_depth ({}) cannot exceed max_selection_depth ({})",
            config.default_selection_depth, config.max_selection_depth
        ));
    }
    if config.max_selection_depth > 32 {
        problems.push("max_selection_depth cannot exceed 32".to_string());
    }
    if config.refresh_jitter_percent > 100 {
        problems.push("refresh_jitter_percent must be between 0 and 100".to_string());
    }

    for (name, value) in [
        ("max_selected_fields", config.max_selected_fields),
        ("max_fragments", config.max_fragments),
        ("max_document_bytes", config.max_document_bytes),
        ("max_argument_bytes", config.max_argument_bytes),
        ("max_input_depth", config.max_input_depth),
        ("max_array_items", config.max_array_items),
        ("introspection_batch_size", config.introspection_batch_size),
        ("max_discovered_types", config.max_discovered_types),
        (
            "max_introspection_batches",
            config.max_introspection_batches,
        ),
        (
            "max_introspection_response_bytes",
            config.max_introspection_response_bytes,
        ),
    ] {
        if value == 0 {
            problems.push(format!("{name} must be nonzero"));
        }
    }

    for (name, value) in [
        ("root_types.query", config.root_types.query.as_str()),
        ("root_types.mutation", config.root_types.mutation.as_str()),
        (
            "root_types.subscription",
            config.root_types.subscription.as_str(),
        ),
    ] {
        if !is_graphql_name(value) {
            problems.push(format!("{name} must be a valid GraphQL name"));
        }
    }

    for (index, suffix) in config.namespace_suffixes.iter().enumerate() {
        if suffix.trim().is_empty() {
            problems.push(format!("namespace_suffixes[{index}] must not be blank"));
        }
    }
    for (field, selectors) in [
        ("allowed_operations", &config.allowed_operations),
        ("disabled_operations", &config.disabled_operations),
    ] {
        for (index, selector) in selectors.iter().enumerate() {
            if selector.trim().is_empty() {
                problems.push(format!("{field}[{index}] must not be blank"));
            }
        }
    }
    for path in config.operations.keys() {
        if !is_canonical_operation_path(path) {
            problems.push(format!(
                "operations.{path:?} must be a canonical query, mutation, or subscription path"
            ));
        }
    }

    if config.auto_enable_mutations {
        tracing::warn!(
            "dynamic MCP auto_enable_mutations is enabled; every generated mutation still requires MCP form elicitation"
        );
    }

    if problems.is_empty() {
        Ok(())
    } else {
        Err(problems.join("; "))
    }
}

fn is_graphql_name(value: &str) -> bool {
    let mut chars = value.chars();
    let Some(first) = chars.next() else {
        return false;
    };
    (first == '_' || first.is_ascii_alphabetic())
        && chars.all(|character| character == '_' || character.is_ascii_alphanumeric())
}

fn is_canonical_operation_path(value: &str) -> bool {
    let mut segments = value.split('.');
    let Some(kind) = segments.next() else {
        return false;
    };
    if !matches!(kind, "query" | "mutation" | "subscription") {
        return false;
    }
    let fields = segments.collect::<Vec<_>>();
    !fields.is_empty() && fields.iter().all(|segment| is_graphql_name(segment))
}

/// Selects which MCP tool projection is advertised.
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "snake_case")]
pub enum DynamicSurface {
    /// Advertise only the existing action-based `unraid` tool.
    Legacy,
    /// Advertise only one generated tool per enabled GraphQL operation.
    Expanded,
    /// Advertise both the legacy tool and generated operation tools.
    #[default]
    Hybrid,
}

/// Controls startup behavior when no dynamic catalog can be loaded.
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "snake_case")]
pub enum StartupFailureMode {
    /// Fail server startup.
    Fail,
    /// Start with only the legacy MCP surface.
    #[default]
    LegacyOnly,
    /// Start with an empty dynamic catalog.
    EmptyDynamic,
}

#[cfg(test)]
mod tests {
    use std::time::Duration;

    use serde::Deserialize;

    use crate::config::default_data_dir;

    use super::{
        DynamicMcpConfig, DynamicSurface, OperationOverride, RootTypeNames, StartupFailureMode,
        validate_dynamic_config,
    };

    #[derive(Debug, Deserialize)]
    struct ModeFixture {
        surface: DynamicSurface,
        startup_failure_mode: StartupFailureMode,
    }

    #[test]
    fn dynamic_config_modes_round_trip_from_toml() {
        let parsed: ModeFixture = toml::from_str(
            r#"
            surface = "expanded"
            startup_failure_mode = "empty_dynamic"
            "#,
        )
        .expect("valid dynamic mode fixture");

        assert_eq!(parsed.surface, DynamicSurface::Expanded);
        assert_eq!(
            parsed.startup_failure_mode,
            StartupFailureMode::EmptyDynamic
        );
    }

    #[test]
    fn dynamic_config_modes_reject_unknown_values() {
        let error = toml::from_str::<ModeFixture>(
            r#"
            surface = "exploded"
            startup_failure_mode = "legacy_only"
            "#,
        )
        .expect_err("unknown surface must fail");

        assert!(error.to_string().contains("exploded"));
    }

    #[test]
    fn dynamic_config_modes_have_safe_defaults() {
        assert_eq!(DynamicSurface::default(), DynamicSurface::Hybrid);
        assert_eq!(
            StartupFailureMode::default(),
            StartupFailureMode::LegacyOnly
        );
    }

    #[test]
    fn dynamic_config_defaults_are_safe() {
        let config = DynamicMcpConfig::default();

        assert!(!config.enabled);
        assert_eq!(config.surface, DynamicSurface::Hybrid);
        assert_eq!(config.refresh_interval, Duration::from_secs(60 * 60));
        assert!(config.auto_enable_queries);
        assert!(!config.auto_enable_mutations);
        assert_eq!(config.default_selection_depth, 2);
        assert_eq!(config.max_selection_depth, 5);
        assert!(config.cache_last_known_good);
        assert_eq!(
            config.cache_path,
            default_data_dir().join("dynamic-schema-cache.json")
        );
    }

    #[test]
    fn dynamic_config_duration_fields_parse_human_values() {
        let config: DynamicMcpConfig = toml::from_str(
            r#"
            refresh_interval = "45m"
            introspection_timeout = "20s"
            "#,
        )
        .expect("human duration fields must parse");

        assert_eq!(config.refresh_interval, Duration::from_secs(45 * 60));
        assert_eq!(config.introspection_timeout, Duration::from_secs(20));
    }

    #[test]
    fn dynamic_config_validation_reports_all_problems() {
        let config = DynamicMcpConfig {
            refresh_interval: Duration::ZERO,
            introspection_timeout: Duration::ZERO,
            default_selection_depth: 6,
            max_selection_depth: 5,
            refresh_jitter_percent: 101,
            max_selected_fields: 0,
            root_types: RootTypeNames {
                query: String::new(),
                ..RootTypeNames::default()
            },
            namespace_suffixes: vec![String::new()],
            allowed_operations: vec![String::new()],
            ..DynamicMcpConfig::default()
        };

        let error = validate_dynamic_config(&config).expect_err("invalid config must fail");
        for expected in [
            "refresh_interval",
            "introspection_timeout",
            "default_selection_depth",
            "refresh_jitter_percent",
            "max_selected_fields",
            "root_types.query",
            "namespace_suffixes",
            "allowed_operations",
        ] {
            assert!(error.contains(expected), "missing {expected} in {error}");
        }
    }

    #[test]
    fn dynamic_operation_override_rejects_confirmation_field() {
        let error = toml::from_str::<OperationOverride>("confirmation = true")
            .expect_err("confirmation is not a supported safety control");
        assert!(error.to_string().contains("confirmation"));
    }
}
