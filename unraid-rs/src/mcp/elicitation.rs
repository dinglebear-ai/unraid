use rmcp::{service::ElicitationError, Peer, RoleServer};
use schemars::JsonSchema;
use serde::Deserialize;
use serde_json::Value;

/// Destructive actions shared with the Python implementation's elicitation policy.
///
/// This is deliberately narrower than the write-scoped action set. Ordinary state
/// changes remain directly callable; only actions with destructive or
/// security-boundary impact require an MCP elicitation round trip.
pub(super) const DESTRUCTIVE_ACTIONS: &[&str] = &[
    "api_key_delete",
    "array_clear_array_disk_statistics",
    "array_remove_disk_from_array",
    "array_set_state",
    "configure_ups",
    "connect_sign_in",
    "connect_sign_out",
    "delete_archived_notifications",
    "docker_delete_entries",
    "docker_remove_container",
    "enable_dynamic_remote_access",
    "initiate_flash_backup",
    "onboarding_create_internal_boot_pool",
    "onboarding_reset_onboarding",
    "remove_plugin",
    "reset_docker_template_mappings",
    "rclone_delete_r_clone_remote",
    "setup_remote_access",
    "unraid_plugins_install_language",
    "unraid_plugins_install_plugin",
    "update_api_settings",
    "update_ssh_settings",
    "update_system_time",
    "vm_force_stop",
    "vm_reset",
];

#[derive(Debug, Deserialize, JsonSchema)]
struct DestructiveConfirmation {
    /// Check the box to confirm and proceed.
    confirmed: bool,
}

rmcp::elicit_safe!(DestructiveConfirmation);

fn string_arg<'a>(args: &'a Value, key: &str) -> Option<&'a str> {
    args.get(key).and_then(Value::as_str)
}

fn label(args: &Value, key: &str) -> String {
    string_arg(args, key)
        .filter(|value| !value.is_empty())
        .unwrap_or("unspecified")
        .replace(['\n', '\r', '\t'], " ")
}

/// Return an elicitation description when this concrete request is destructive.
///
/// array_set_state is conditional: starting the array is an ordinary write,
/// while stopping it is destructive and therefore elicits.
pub(super) fn destructive_action_description(action: &str, args: &Value) -> Option<String> {
    if !DESTRUCTIVE_ACTIONS.contains(&action) {
        return None;
    }

    let description = match action {
        "vm_force_stop" => format!(
            "Force stop VM {}. Unsaved data may be lost.",
            label(args, "id")
        ),
        "vm_reset" => format!(
            "Hard reset VM {}. Unsaved data may be lost.",
            label(args, "id")
        ),
        "docker_remove_container" => {
            let image = args
                .get("with_image")
                .and_then(Value::as_bool)
                .unwrap_or(false);
            format!(
                "Remove container {}{}. This cannot be undone.",
                label(args, "id"),
                if image { " and its image" } else { "" }
            )
        }
        "reset_docker_template_mappings" => {
            "Reset all Docker template path mappings to defaults. Custom path overrides will be lost."
                .to_string()
        }
        "docker_delete_entries" => {
            "Delete the specified Docker organizer entries from the layout.".to_string()
        }
        "array_set_state"
            if string_arg(args, "desired_state")
                .is_some_and(|state| state.eq_ignore_ascii_case("STOP")) =>
        {
            "Stop the Unraid array. Running containers and VMs may lose access to array shares."
                .to_string()
        }
        "array_set_state" => return None,
        "array_remove_disk_from_array" => format!(
            "Remove disk {} from the array. The array must be stopped first.",
            label(args, "id")
        ),
        "array_clear_array_disk_statistics" => format!(
            "Clear all I/O statistics for disk {}. This cannot be undone.",
            label(args, "id")
        ),
        "api_key_delete" => {
            "Delete the selected API key(s). Clients using them will immediately lose access."
                .to_string()
        }
        "rclone_delete_r_clone_remote" => format!(
            "Delete rclone remote {}. This cannot be undone.",
            label(args, "remote_name")
        ),
        "unraid_plugins_install_plugin" => {
            "Install a caller-supplied .plg file. The Unraid host will fetch and run it as root."
                .to_string()
        }
        "unraid_plugins_install_language" => {
            "Install a caller-supplied language .plg file. The Unraid host will fetch and run it as root."
                .to_string()
        }
        "remove_plugin" => {
            "Remove the selected Unraid API plugin configuration. Reinstallation may be required to restore it."
                .to_string()
        }
        "onboarding_reset_onboarding" => {
            "Reset the server's onboarding state and re-trigger the first-boot setup flow."
                .to_string()
        }
        "onboarding_create_internal_boot_pool" => {
            "Create an internal boot pool. This formats the specified devices and may reboot the server."
                .to_string()
        }
        "delete_archived_notifications" => {
            "Delete all archived notifications permanently. This cannot be undone.".to_string()
        }
        "configure_ups" => {
            "Overwrite the current UPS monitoring and daemon configuration.".to_string()
        }
        "update_ssh_settings" => {
            "Update the SSH daemon settings. Disabling SSH or changing its port can cut off remote shell access."
                .to_string()
        }
        "update_system_time" => {
            "Update system time or NTP configuration. Clock changes can disrupt TLS and time-sensitive services."
                .to_string()
        }
        "connect_sign_in" => {
            "Sign this server in to Unraid Connect, registering it with the cloud service and enabling remote management."
                .to_string()
        }
        "connect_sign_out" => {
            "Sign this server out of Unraid Connect. Connect-based remote access will stop working."
                .to_string()
        }
        "update_api_settings" => {
            "Change the Unraid Connect remote-access configuration, affecting internet reachability."
                .to_string()
        }
        "setup_remote_access" => {
            "Reconfigure Unraid Connect remote access. This can expose the server through UPnP or port forwarding."
                .to_string()
        }
        "enable_dynamic_remote_access" => {
            "Change dynamic remote access for Unraid Connect, altering how the server is reachable remotely."
                .to_string()
        }
        "initiate_flash_backup" => {
            "Start a flash-drive backup. Existing data at the configured backup destination may be overwritten."
                .to_string()
        }
        _ => return None,
    };
    Some(description)
}

/// Require the MCP client to elicit explicit user approval for destructive calls.
///
/// There is no tool argument bypass. If the client does not advertise form
/// elicitation, the user declines/cancels, or the response is malformed, the
/// destructive operation does not reach the Unraid API.
pub(super) async fn require_destructive_elicitation(
    peer: &Peer<RoleServer>,
    action: &str,
    args: &Value,
) -> Result<(), String> {
    let Some(description) = destructive_action_description(action, args) else {
        return Ok(());
    };

    let message = format!(
        "Confirm destructive Unraid action: {action}\n\n{description}\n\nCheck the confirmation box to proceed."
    );

    match peer.elicit::<DestructiveConfirmation>(message).await {
        Ok(Some(response)) if response.confirmed => {
            tracing::info!(action, "destructive action approved via MCP elicitation");
            Ok(())
        }
        Ok(Some(_)) | Ok(None) => Err(format!(
            "Action '{action}' was not confirmed through MCP elicitation."
        )),
        Err(ElicitationError::UserDeclined) => {
            Err(format!("Action '{action}' was declined by the user."))
        }
        Err(ElicitationError::UserCancelled) => {
            Err(format!("Action '{action}' was cancelled by the user."))
        }
        Err(ElicitationError::CapabilityNotSupported) => Err(format!(
            "Action '{action}' requires MCP form elicitation, but the connected client did not advertise elicitation support."
        )),
        Err(error) => Err(format!(
            "Action '{action}' could not obtain MCP elicitation approval: {error}"
        )),
    }
}

#[cfg(test)]
mod tests {
    use std::collections::HashSet;

    use serde_json::json;

    use super::*;
    use crate::mcp::schemas::{Scope, ACTIONS};

    #[test]
    fn destructive_registry_is_unique_and_write_scoped() {
        let unique: HashSet<_> = DESTRUCTIVE_ACTIONS.iter().copied().collect();
        assert_eq!(unique.len(), DESTRUCTIVE_ACTIONS.len());

        for action in DESTRUCTIVE_ACTIONS {
            let spec = ACTIONS
                .iter()
                .find(|candidate| candidate.name == *action)
                .unwrap_or_else(|| panic!("destructive action {action} is not registered"));
            assert_eq!(spec.scope, Scope::Write, "{action} must be write-scoped");
        }
    }

    #[test]
    fn array_stop_elicits_but_start_does_not() {
        assert!(destructive_action_description(
            "array_set_state",
            &json!({"desired_state": "STOP"})
        )
        .is_some());
        assert!(destructive_action_description(
            "array_set_state",
            &json!({"desired_state": "START"})
        )
        .is_none());
    }

    #[test]
    fn ordinary_mutations_do_not_elicit() {
        assert!(destructive_action_description("vm_stop", &json!({"id": "vm-1"})).is_none());
        assert!(destructive_action_description("docker_restart", &json!({"id": "c-1"})).is_none());
        assert!(destructive_action_description("api_key_update", &json!({})).is_none());
    }

    #[test]
    fn every_static_destructive_action_has_a_prompt() {
        for action in DESTRUCTIVE_ACTIONS {
            let args = if *action == "array_set_state" {
                json!({"desired_state": "STOP"})
            } else {
                json!({})
            };
            assert!(
                destructive_action_description(action, &args).is_some(),
                "{action} has no elicitation description"
            );
        }
    }
}
