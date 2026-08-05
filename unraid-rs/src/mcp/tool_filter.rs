use crate::config::McpToolsConfig;

use super::schemas::ACTIONS;

const TOOL_NAME: &str = "unraid";

/// Validate configured selectors before the server starts.
///
/// Selectors may target the whole tool (`*`, `unraid`, or `unraid.*`) or
/// one action (`array` or `unraid.array`). Validation is deliberately strict:
/// a typo in a deny rule must not silently leave an action exposed.
pub(crate) fn validate_tool_config(config: &McpToolsConfig) -> Result<(), String> {
    for (field, selectors) in [
        ("enabled", config.enabled.as_slice()),
        ("disabled", config.disabled.as_slice()),
    ] {
        for selector in selectors {
            if !selector_is_valid(selector) {
                return Err(format!(
                    "[mcp.tools].{field} contains unknown selector {selector:?}; \
                     expected *, unraid, unraid.*, an action name, or unraid.<action>"
                ));
            }
        }
    }
    Ok(())
}

/// Return canonical action names that are visible under the configured policy.
pub(super) fn enabled_action_names(config: &McpToolsConfig) -> Vec<&'static str> {
    ACTIONS
        .iter()
        .filter(|spec| action_is_enabled(config, spec.name))
        .map(|spec| spec.name)
        .collect()
}

/// Whether the top-level `unraid` MCP tool has at least one enabled action.
pub(super) fn tool_is_enabled(config: &McpToolsConfig) -> bool {
    ACTIONS
        .iter()
        .any(|spec| action_is_enabled(config, spec.name))
}

/// Whether one canonical action is enabled. Deny rules always win.
pub(super) fn action_is_enabled(config: &McpToolsConfig, action: &str) -> bool {
    let allowed = config.enabled.is_empty()
        || config
            .enabled
            .iter()
            .any(|selector| selector_matches(selector, action));
    let denied = config
        .disabled
        .iter()
        .any(|selector| selector_matches(selector, action));
    allowed && !denied
}

/// Enforce policy before scope checks, elicitation, or dispatch. Unknown tools and
/// unknown actions remain the dispatcher's responsibility so callers receive the
/// existing protocol-level validation errors for those cases.
pub(super) fn ensure_tool_call_enabled(
    config: &McpToolsConfig,
    tool_name: &str,
    action: &str,
) -> Result<(), String> {
    if tool_name != TOOL_NAME {
        return Ok(());
    }
    if !tool_is_enabled(config) {
        return Err(format!(
            "MCP tool {TOOL_NAME:?} is disabled by server policy"
        ));
    }
    if ACTIONS.iter().any(|spec| spec.name == action) && !action_is_enabled(config, action) {
        return Err(format!(
            "MCP action {TOOL_NAME}.{action} is disabled by server policy"
        ));
    }
    Ok(())
}

fn selector_is_valid(selector: &str) -> bool {
    let selector = selector.trim();
    if matches!(selector, "*" | TOOL_NAME | "unraid.*") {
        return true;
    }
    let action = selector.strip_prefix("unraid.").unwrap_or(selector);
    !action.is_empty() && ACTIONS.iter().any(|spec| spec.name == action)
}

fn selector_matches(selector: &str, action: &str) -> bool {
    let selector = selector.trim();
    matches!(selector, "*" | TOOL_NAME | "unraid.*")
        || selector == action
        || selector.strip_prefix("unraid.") == Some(action)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn config(enabled: &[&str], disabled: &[&str]) -> McpToolsConfig {
        McpToolsConfig {
            enabled: enabled.iter().map(|value| (*value).to_string()).collect(),
            disabled: disabled.iter().map(|value| (*value).to_string()).collect(),
        }
    }

    #[test]
    fn default_policy_enables_every_action() {
        let config = McpToolsConfig::default();
        assert_eq!(enabled_action_names(&config).len(), ACTIONS.len());
        assert!(tool_is_enabled(&config));
    }

    #[test]
    fn allowlist_accepts_bare_and_qualified_actions() {
        let config = config(&["array", "unraid.docker"], &[]);
        assert_eq!(enabled_action_names(&config), vec!["array", "docker"]);
    }

    #[test]
    fn deny_rules_override_allow_rules() {
        let config = config(&["unraid"], &["docker", "unraid.vm_reset"]);
        assert!(action_is_enabled(&config, "array"));
        assert!(!action_is_enabled(&config, "docker"));
        assert!(!action_is_enabled(&config, "vm_reset"));
    }

    #[test]
    fn wildcard_can_disable_the_entire_tool() {
        let config = config(&[], &["*"]);
        assert!(!tool_is_enabled(&config));
        assert!(enabled_action_names(&config).is_empty());
        assert!(ensure_tool_call_enabled(&config, "unraid", "array").is_err());
    }

    #[test]
    fn invalid_selector_is_rejected() {
        let config = config(&[], &["unraid.dockre"]);
        let error = validate_tool_config(&config).unwrap_err();
        assert!(error.contains("unraid.dockre"));
    }

    #[test]
    fn unknown_actions_are_left_to_dispatch_validation() {
        let config = config(&["array"], &[]);
        assert!(ensure_tool_call_enabled(&config, "unraid", "not_real").is_ok());
    }
}
