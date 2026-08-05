//! Configuration types for runtime-generated MCP tools.

use serde::{Deserialize, Serialize};

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
    use serde::Deserialize;

    use super::{DynamicSurface, StartupFailureMode};

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
}
