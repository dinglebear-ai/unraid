use crate::config::McpToolsConfig;

use super::schemas::ACTIONS;

const TOOL_NAME: &str = "unraid";

/// Validate configured selectors before the server starts.
///
/// Selectors may target the whole tool (`*`, `unraid`, or `unraid.*`) or
/// one action (`array` or `unraid.array`). Validation is deliberately strict:
/// a typo in a deny rule must not silently leave an action exposed. All invalid
/// selectors are collected and reported in one error so the operator can fix
/// the whole config in one pass.
pub(crate) fn validate_tool_config(config: &McpToolsConfig) -> Result<(), String> {
    let mut problems = Vec::new();
    for (field, env_var, selectors) in [
        (
            "enabled",
            "UNRAID_RMCP_ENABLED_TOOLS",
            config.enabled.as_slice(),
        ),
        (
            "disabled",
            "UNRAID_RMCP_DISABLED_TOOLS",
            config.disabled.as_slice(),
        ),
    ] {
        let invalid: Vec<String> = selectors
            .iter()
            .filter(|selector| !selector_is_valid(selector))
            .map(|selector| format!("{selector:?}"))
            .collect();
        if !invalid.is_empty() {
            problems.push(format!(
                "[mcp.tools].{field} / {env_var} contains unknown selector(s) {}",
                invalid.join(", ")
            ));
        }
    }
    if problems.is_empty() {
        Ok(())
    } else {
        Err(format!(
            "{}; expected *, unraid, unraid.*, an action name, or unraid.<action>",
            problems.join("; ")
        ))
    }
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

/// Whether a (trimmed) selector targets the whole `unraid` tool rather than a
/// single action. Shared by validation and matching so the alias list can
/// never drift between the two.
fn is_whole_tool_selector(selector: &str) -> bool {
    matches!(selector, "*" | TOOL_NAME | "unraid.*")
}

/// The action name a (trimmed) selector refers to: the bare selector, or the
/// remainder after an `unraid.` qualifier.
fn selector_action(selector: &str) -> &str {
    selector.strip_prefix("unraid.").unwrap_or(selector)
}

fn selector_is_valid(selector: &str) -> bool {
    let selector = selector.trim();
    is_whole_tool_selector(selector)
        || ACTIONS
            .iter()
            .any(|spec| spec.name == selector_action(selector))
}

fn selector_matches(selector: &str, action: &str) -> bool {
    let selector = selector.trim();
    is_whole_tool_selector(selector) || selector_action(selector) == action
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
    fn every_action_supports_bare_and_qualified_selectors() {
        for spec in ACTIONS {
            let qualified = format!("unraid.{}", spec.name);
            for selector in [spec.name, qualified.as_str()] {
                let policy = config(&[selector], &[]);
                assert_eq!(
                    enabled_action_names(&policy),
                    vec![spec.name],
                    "allow selector {selector:?}"
                );

                let policy = config(&[], &[selector]);
                assert!(
                    !action_is_enabled(&policy, spec.name),
                    "deny selector {selector:?}"
                );
            }
        }
    }

    #[test]
    fn whole_tool_aliases_have_identical_effect() {
        for selector in ["*", "unraid", "unraid.*"] {
            assert!(enabled_action_names(&config(&[selector], &[])).len() == ACTIONS.len());
            assert!(enabled_action_names(&config(&[], &[selector])).is_empty());
        }
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
        assert!(
            error.contains("[mcp.tools].disabled / UNRAID_RMCP_DISABLED_TOOLS"),
            "error must name both config sources; got: {error}"
        );
    }

    #[test]
    fn all_invalid_selectors_are_reported_in_one_error() {
        let config = config(&["arrayy", "docker"], &["unraid.dockre", "vm_rest"]);
        let error = validate_tool_config(&config).unwrap_err();
        for needle in [
            "\"arrayy\"",
            "\"unraid.dockre\"",
            "\"vm_rest\"",
            "[mcp.tools].enabled / UNRAID_RMCP_ENABLED_TOOLS",
            "[mcp.tools].disabled / UNRAID_RMCP_DISABLED_TOOLS",
        ] {
            assert!(
                error.contains(needle),
                "error should mention {needle}; got: {error}"
            );
        }
        assert!(
            !error.contains("\"docker\""),
            "valid selector flagged: {error}"
        );
    }

    /// Tripwire: `ensure_tool_call_enabled` passes through unknown tool names so
    /// the dispatcher can emit its protocol-level error. That passthrough is safe
    /// only while `unraid` is the server's entire tool surface — if a second MCP
    /// tool ever appears, this file's selector policy must learn about it before
    /// this assertion is relaxed.
    #[test]
    fn mcp_tool_surface_is_exactly_unraid() {
        let config = McpToolsConfig::default();
        let names: Vec<String> =
            crate::mcp::schemas::tool_definitions(&enabled_action_names(&config))
                .into_iter()
                .map(|def| {
                    def.get("name")
                        .and_then(serde_json::Value::as_str)
                        .expect("tool definition must have a name")
                        .to_string()
                })
                .collect();
        assert_eq!(names, vec![TOOL_NAME.to_string()]);
    }

    #[test]
    fn unknown_actions_are_left_to_dispatch_validation() {
        let config = config(&["array"], &[]);
        assert!(ensure_tool_call_enabled(&config, "unraid", "not_real").is_ok());
    }
}
