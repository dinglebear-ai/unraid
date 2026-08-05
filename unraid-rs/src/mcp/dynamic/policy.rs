//! Generated-operation exposure and risk policy.

use super::{
    config::DynamicMcpConfig,
    models::{OperationAvailability, RiskMetadata},
    types::{OperationKind, OperationPath},
};

/// Resolve exposure and risk metadata for one canonical operation path.
pub fn resolve_policy(
    path: &OperationPath,
    config: &DynamicMcpConfig,
) -> (OperationAvailability, RiskMetadata) {
    let canonical = path.to_string();
    let override_policy = config.operations.get(&canonical);
    let risk = RiskMetadata {
        destructive: override_policy
            .and_then(|value| value.destructive)
            .unwrap_or(false),
        reason: None,
    };
    if override_policy.and_then(|value| value.hidden) == Some(true) {
        return (OperationAvailability::Hidden, risk);
    }
    if config
        .disabled_operations
        .iter()
        .any(|selector| matches_selector(selector, &canonical))
        || override_policy.and_then(|value| value.enabled) == Some(false)
    {
        return (OperationAvailability::DisabledByPolicy, risk);
    }
    let default_enabled = match path.kind() {
        OperationKind::Query => config.auto_enable_queries,
        OperationKind::Mutation => config.auto_enable_mutations,
        OperationKind::Subscription => false,
    };
    let selected = config.allowed_operations.is_empty()
        || config
            .allowed_operations
            .iter()
            .any(|selector| matches_selector(selector, &canonical));
    let enabled = override_policy
        .and_then(|value| value.enabled)
        .unwrap_or(default_enabled && selected);
    (
        if enabled {
            OperationAvailability::Available
        } else {
            OperationAvailability::DisabledByPolicy
        },
        risk,
    )
}

/// Match exact paths, kind wildcards, or deterministic prefix wildcards.
pub fn matches_selector(selector: &str, canonical: &str) -> bool {
    selector == "*"
        || selector == canonical
        || selector
            .strip_suffix('*')
            .is_some_and(|prefix| canonical.starts_with(prefix))
}

#[cfg(test)]
mod tests {
    use std::str::FromStr;

    use crate::mcp::dynamic::{
        config::{DynamicMcpConfig, OperationOverride},
        models::OperationAvailability,
        types::OperationPath,
    };

    use super::{matches_selector, resolve_policy};

    #[test]
    fn dynamic_policy_enables_queries_and_disables_mutations_by_default() {
        let config = DynamicMcpConfig::default();
        assert!(matches!(
            resolve_policy(&OperationPath::from_str("query.array").unwrap(), &config).0,
            OperationAvailability::Available
        ));
        assert!(matches!(
            resolve_policy(
                &OperationPath::from_str("mutation.vm.start").unwrap(),
                &config
            )
            .0,
            OperationAvailability::DisabledByPolicy
        ));
    }

    #[test]
    fn dynamic_policy_override_enables_mutation_without_changing_elicitation() {
        let mut config = DynamicMcpConfig::default();
        config.operations.insert(
            "mutation.vm.start".to_string(),
            OperationOverride {
                enabled: Some(true),
                destructive: Some(true),
                ..OperationOverride::default()
            },
        );
        let (availability, risk) = resolve_policy(
            &OperationPath::from_str("mutation.vm.start").unwrap(),
            &config,
        );
        assert!(matches!(availability, OperationAvailability::Available));
        assert!(risk.destructive);
    }

    #[test]
    fn dynamic_selector_matching_is_deterministic() {
        assert!(matches_selector("query.*", "query.array"));
        assert!(matches_selector("mutation.vm.*", "mutation.vm.start"));
        assert!(!matches_selector("mutation.docker.*", "mutation.vm.start"));
    }
}
