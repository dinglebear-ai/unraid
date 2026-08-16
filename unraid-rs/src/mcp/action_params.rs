use std::collections::HashSet;

/// Canonical action-to-parameter usage for the action-based `unraid` tool.
///
/// The dispatcher remains authoritative for execution. This catalog drives MCP
/// schema minimization so a restricted policy advertises only arguments used by
/// enabled actions. Tests in `schemas.rs` pin the catalog against the schema
/// property set and reject unknown action names.
pub(super) const ACTION_PARAMETERS: &[(&str, &[&str])] = &[
    ("docker", &["state", "limit", "offset"]),
    ("docker_logs", &["id", "tail"]),
    ("vms", &["limit", "offset"]),
    ("shares", &["name", "limit", "offset"]),
    ("notifications", &["limit", "offset"]),
    ("log_files", &["limit", "offset"]),
    ("log_file", &["path", "lines", "start_line"]),
    ("services", &["limit", "offset"]),
    ("ups", &["limit", "offset"]),
    ("plugins", &["name", "limit", "offset"]),
    ("parity_history", &["limit", "offset"]),
    ("api_key", &["id"]),
    ("disk", &["id"]),
    ("oidc_provider", &["id"]),
    ("ups_device_by_id", &["id"]),
    ("plugin_install_operation", &["id"]),
    ("validate_oidc_session", &["token"]),
    ("get_permissions_for_roles", &["roles"]),
    ("preview_effective_permissions", &["roles", "permissions"]),
    ("archive_notification", &["id"]),
    (
        "create_notification",
        &["title", "subject", "description", "importance", "link"],
    ),
    ("vm_start", &["id"]),
    ("vm_stop", &["id"]),
    ("vm_pause", &["id"]),
    ("vm_resume", &["id"]),
    ("vm_force_stop", &["id"]),
    ("vm_reboot", &["id"]),
    ("vm_reset", &["id"]),
    ("docker_start", &["id"]),
    ("docker_stop", &["id"]),
    ("docker_restart", &["id"]),
    ("docker_pause", &["id"]),
    ("docker_unpause", &["id"]),
    ("docker_update_container", &["id"]),
    ("docker_remove_container", &["id", "with_image"]),
    ("docker_update_containers", &["ids"]),
    (
        "docker_create_folder",
        &["name", "parent_id", "children_ids"],
    ),
    (
        "docker_create_folder_with_items",
        &["name", "parent_id", "source_entry_ids", "position"],
    ),
    ("docker_set_folder_children", &["folder_id", "children_ids"]),
    ("docker_delete_entries", &["entry_ids"]),
    (
        "docker_move_entries_to_folder",
        &["source_entry_ids", "destination_folder_id"],
    ),
    (
        "docker_move_items_to_position",
        &["source_entry_ids", "destination_folder_id", "position"],
    ),
    ("docker_rename_folder", &["folder_id", "new_name"]),
    ("docker_update_view_preferences", &["view_id", "prefs"]),
    (
        "docker_update_autostart_configuration",
        &["entries", "persist_user_preferences"],
    ),
    ("customization_set_locale", &["locale"]),
    ("customization_set_theme", &["theme"]),
    (
        "array_set_state",
        &["desired_state", "decryption_password", "decryption_keyfile"],
    ),
    ("array_add_disk_to_array", &["id", "slot"]),
    ("array_remove_disk_from_array", &["id", "slot"]),
    ("array_mount_array_disk", &["id"]),
    ("array_unmount_array_disk", &["id"]),
    ("array_clear_array_disk_statistics", &["id"]),
    ("parity_check_start", &["correct"]),
    (
        "api_key_create",
        &["name", "description", "roles", "permissions", "overwrite"],
    ),
    ("api_key_add_role", &["api_key_id", "role"]),
    ("api_key_remove_role", &["api_key_id", "role"]),
    ("api_key_delete", &["ids"]),
    (
        "api_key_update",
        &["id", "name", "description", "roles", "permissions"],
    ),
    (
        "rclone_create_r_clone_remote",
        &["name", "type", "parameters"],
    ),
    ("rclone_delete_r_clone_remote", &["name"]),
    ("unraid_plugins_install_plugin", &["name", "url", "forced"]),
    (
        "unraid_plugins_install_language",
        &["name", "url", "forced"],
    ),
    ("onboarding_set_onboarding_override", &["input"]),
    (
        "onboarding_create_internal_boot_pool",
        &[
            "pool_name",
            "devices",
            "boot_size_mib",
            "update_bios",
            "reboot",
        ],
    ),
    ("archive_notifications", &["ids"]),
    ("unarchive_notifications", &["ids"]),
    ("unread_notification", &["id"]),
    ("archive_all", &["importance"]),
    ("unarchive_all", &["importance"]),
    ("update_server_identity", &["name", "comment", "sys_model"]),
    ("configure_ups", &["config"]),
    ("update_system_time", &["input"]),
    ("update_temperature_config", &["input"]),
    ("add_plugin", &["input"]),
    ("remove_plugin", &["input"]),
    ("connect_sign_in", &["api_key", "user_info"]),
    (
        "setup_remote_access",
        &["access_type", "forward_type", "port"],
    ),
    ("enable_dynamic_remote_access", &["enabled", "access_url"]),
    (
        "update_api_settings",
        &["access_type", "forward_type", "port"],
    ),
    ("update_settings", &["input"]),
    ("update_ssh_settings", &["enabled", "port"]),
    (
        "initiate_flash_backup",
        &["remote_name", "source_path", "destination_path", "options"],
    ),
    (
        "notify_if_unique",
        &["title", "subject", "description", "importance", "link"],
    ),
];

pub(super) fn visible_parameter_names(action_names: &[&str]) -> HashSet<&'static str> {
    ACTION_PARAMETERS
        .iter()
        .filter(|(action, _)| action_names.contains(action))
        .flat_map(|(_, parameters)| parameters.iter().copied())
        .collect()
}

pub(super) fn enabled_actions_for_parameter<'a>(
    action_names: &'a [&'a str],
    parameter: &str,
) -> Vec<&'a str> {
    action_names
        .iter()
        .copied()
        .filter(|action| {
            ACTION_PARAMETERS
                .iter()
                .find(|(candidate, _)| candidate == action)
                .is_some_and(|(_, parameters)| parameters.contains(&parameter))
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use std::collections::HashMap;

    use super::*;
    use crate::mcp::schemas::ACTIONS;

    fn scan_call_keys(compact: &str) -> HashSet<String> {
        let mut keys = HashSet::new();
        for helper in ["string_arg", "string_array_arg", "usize_arg", "i64_arg"] {
            let needle = format!("{helper}(args,\"");
            let mut offset = 0;
            while let Some(start) = compact[offset..].find(&needle) {
                let value_start = offset + start + needle.len();
                let Some(end) = compact[value_start..].find('\"') else {
                    break;
                };
                keys.insert(compact[value_start..value_start + end].to_string());
                offset = value_start + end + 1;
            }
        }
        for needle in ["args.get(\"", "args.get_mut(\"", "req(\""] {
            let mut offset = 0;
            while let Some(start) = compact[offset..].find(needle) {
                let value_start = offset + start + needle.len();
                let Some(end) = compact[value_start..].find('\"') else {
                    break;
                };
                keys.insert(compact[value_start..value_start + end].to_string());
                offset = value_start + end + 1;
            }
        }
        if compact.contains("require_id(args") {
            keys.insert("id".to_string());
        }
        keys
    }

    fn dispatcher_parameter_usage() -> HashMap<String, HashSet<String>> {
        let lines: Vec<&str> = include_str!("tools.rs").lines().collect();
        let dispatch_start = lines
            .iter()
            .position(|line| line.starts_with("async fn dispatch_action"))
            .unwrap();
        let dispatch_end = lines[dispatch_start..]
            .iter()
            .position(|line| line.starts_with("// ── help text"))
            .map(|offset| dispatch_start + offset)
            .unwrap_or(lines.len());
        let starts: Vec<(usize, Vec<String>)> = lines[dispatch_start..dispatch_end]
            .iter()
            .enumerate()
            .filter_map(|(offset, line)| {
                if !line.starts_with("        \"") || !line.contains("=>") {
                    return None;
                }
                let lhs = line.split_once("=>")?.0;
                let names = lhs
                    .split('\"')
                    .skip(1)
                    .step_by(2)
                    .map(str::to_string)
                    .collect::<Vec<_>>();
                Some((dispatch_start + offset, names))
            })
            .collect();

        let mut usage = HashMap::new();
        for (index, (start, names)) in starts.iter().enumerate() {
            let end = starts
                .get(index + 1)
                .map(|(next, _)| *next)
                .unwrap_or(dispatch_end);
            let compact = lines[*start..end]
                .join("")
                .chars()
                .filter(|ch| !ch.is_whitespace())
                .collect::<String>();
            let keys = scan_call_keys(&compact);
            for name in names {
                usage.insert(name.clone(), keys.clone());
            }
        }
        usage
    }

    #[test]
    fn parameter_catalog_has_unique_canonical_actions() {
        let canonical: HashSet<&str> = ACTIONS.iter().map(|spec| spec.name).collect();
        let mut seen = HashSet::new();
        for (action, _) in ACTION_PARAMETERS {
            assert!(
                canonical.contains(action),
                "unknown action in parameter catalog: {action}"
            );
            assert!(
                seen.insert(*action),
                "duplicate action in parameter catalog: {action}"
            );
        }
    }

    #[test]
    fn parameter_catalog_matches_dispatcher_argument_access() {
        let dispatcher = dispatcher_parameter_usage();
        let catalog: HashMap<String, HashSet<String>> = ACTION_PARAMETERS
            .iter()
            .map(|(action, parameters)| {
                (
                    (*action).to_string(),
                    parameters
                        .iter()
                        .map(|parameter| (*parameter).to_string())
                        .collect(),
                )
            })
            .collect();

        for (action, actual) in dispatcher
            .iter()
            .filter(|(_, parameters)| !parameters.is_empty())
        {
            assert_eq!(
                catalog.get(action),
                Some(actual),
                "parameter catalog drift for action {action}"
            );
        }
        for (action, expected) in &catalog {
            assert_eq!(
                dispatcher.get(action),
                Some(expected),
                "catalog action missing from dispatcher scan: {action}"
            );
        }
    }

    #[test]
    fn visible_parameters_are_the_union_for_enabled_actions() {
        assert_eq!(
            visible_parameter_names(&["docker_logs", "status"]),
            HashSet::from(["id", "tail"])
        );
        assert!(visible_parameter_names(&["status", "help"]).is_empty());
        assert_eq!(
            enabled_actions_for_parameter(&["vm_reset", "docker_logs"], "id"),
            vec!["vm_reset", "docker_logs"]
        );
    }
}
