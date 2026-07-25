pub(crate) mod arg_helpers;
pub(crate) mod paginate;

use std::sync::LazyLock;

use serde_json::{json, Value};
use thiserror::Error;

use crate::graphql::UpstreamError;
use crate::token_limit::truncate_if_needed;

use self::arg_helpers::{i64_arg, string_arg, string_array_arg, usize_arg};
use self::paginate::paginate_array;
use super::schemas::ACTIONS;
use super::AppState;

/// Typed outcome of a tool dispatch, used to *route* failures at the MCP protocol
/// boundary without matching on message prose.
///
/// The variant — not the message text — decides whether a failure is an
/// agent-correctable protocol `invalid_params` error or an in-band tool error that
/// keeps the session alive. The message strings stay rich and helpful, but rewording
/// them can never change routing.
#[derive(Debug, Error)]
pub(crate) enum ToolError {
    /// Missing/malformed argument, unknown action, or unknown tool — the caller can
    /// fix the request and retry. Routes to protocol `invalid_params`.
    #[error("{0}")]
    InvalidParams(String),
    /// Could not reach the upstream Unraid API. Routes to an in-band tool error.
    #[error("{0}")]
    UpstreamUnreachable(String),
    /// Upstream rejected our credentials (401/403). In-band tool error.
    #[error("{0}")]
    UpstreamAuth(String),
    /// Any other upstream-side failure. In-band tool error.
    #[error("{0}")]
    Upstream(String),
    /// Internal/unexpected error (e.g. serialization). In-band tool error.
    #[error("{0}")]
    Internal(#[from] anyhow::Error),
}

impl ToolError {
    /// True when this failure is an agent-correctable input mistake that should be
    /// surfaced as a protocol-level `invalid_params` error.
    pub(crate) fn is_invalid_params(&self) -> bool {
        matches!(self, ToolError::InvalidParams(_))
    }
}

/// Map a service-layer `anyhow` error to the right [`ToolError`] variant.
///
/// Routing is by typed source: if the error chain contains an [`UpstreamError`]
/// (produced by `graphql.rs`), classify by its variant and wrap the message with
/// helpful, action-specific guidance. Anything else is an internal failure.
fn classify_service_error(err: anyhow::Error, action: &str) -> ToolError {
    match err.downcast_ref::<UpstreamError>() {
        Some(UpstreamError::Unreachable(msg)) => ToolError::UpstreamUnreachable(format!(
            "ERROR: {action} failed — upstream unreachable\n\
             Reason: {msg}\n\
             Hint: check that UNRAID_API_URL is reachable and UNRAID_API_KEY is valid.\n\
             Use action=status to check server health."
        )),
        Some(UpstreamError::Auth(msg)) => ToolError::UpstreamAuth(format!(
            "ERROR: {action} failed — API key rejected\n\
             Reason: {msg}\n\
             Hint: check that UNRAID_API_KEY is correct and has not expired."
        )),
        Some(UpstreamError::Other(msg)) => ToolError::Upstream(format!(
            "ERROR: {action} failed\n\
             Reason: {msg}\n\
             Hint: check UNRAID_API_URL and UNRAID_API_KEY. \
             Use action=status to check server health."
        )),
        None => ToolError::Internal(err.context(format!("{action} failed"))),
    }
}

/// All valid action names — used in error messages. Derived from the canonical
/// [`ACTIONS`] list so it can never drift from the schema enum or scope source.
static VALID_ACTIONS: LazyLock<String> = LazyLock::new(|| {
    ACTIONS
        .iter()
        .map(|a| a.name)
        .collect::<Vec<_>>()
        .join(", ")
});

// ── public entry point ────────────────────────────────────────────────────────

/// Dispatch a named MCP tool. Returns `Ok(Value)` always; errors are encoded in
/// the returned value so the MCP protocol layer does not treat them as fatal.
///
/// Exposed at `pub(crate)` so in-crate test-support helpers (gated behind
/// `#[cfg(any(test, feature = "test-support"))]`, see [`crate::testing`]) can
/// drive a tool by name + args without going through the HTTP/stdio transports.
pub(crate) async fn execute_tool(
    state: &AppState,
    name: &str,
    args: Value,
) -> Result<Value, ToolError> {
    match name {
        "unraid" => dispatch(state, args).await,
        _ => Err(ToolError::InvalidParams(format!(
            "unknown tool: {name}\n\
             Hint: the only supported tool is \"unraid\".\n\
             Use action=help for documentation."
        ))),
    }
}

/// Serialize `value` to pretty JSON and apply the 40 KB token-cap truncation.
pub(super) fn serialize_response(value: Value) -> anyhow::Result<String> {
    let text = serde_json::to_string_pretty(&value)?;
    Ok(truncate_if_needed(text))
}

// ── dispatch ──────────────────────────────────────────────────────────────────

async fn dispatch(state: &AppState, args: Value) -> Result<Value, ToolError> {
    let action = match string_arg(&args, "action") {
        Some(a) => a,
        None => {
            let valid = &*VALID_ACTIONS;
            return Err(ToolError::InvalidParams(format!(
                "\"action\" is required.\n\
                 Valid actions: {valid}\n\
                 Example: {{\"action\": \"docker\"}}\n\
                 See: action=help for full documentation."
            )));
        }
    };

    // Request/error counting lives at the MCP boundary (`call_tool` in
    // `rmcp_server.rs`) so every tool call — including pre-dispatch validation
    // failures (missing/unknown action) and serialization errors — is counted
    // exactly once. `inc_upstream`/`inc_upstream_err` (the upstream-specific
    // metrics) stay in the dispatch layer where the upstream call happens.
    dispatch_action(state, &action, &args).await
}

/// Run the action. Argument-validation / unknown-action failures are returned as
/// [`ToolError::InvalidParams`]; each service call's `anyhow` error is classified
/// by its typed source into the matching upstream/internal [`ToolError`] variant.
/// Extract the required `id` argument for a single-entity lookup action.
fn require_id(args: &Value, action: &str) -> Result<String, ToolError> {
    string_arg(args, "id")
        .ok_or_else(|| ToolError::InvalidParams(format!("\"id\" is required for action={action}.")))
}

async fn dispatch_action(state: &AppState, action: &str, args: &Value) -> Result<Value, ToolError> {
    // Helper: run a service call and classify any failure by its typed source.
    //
    // This is the single seam where every upstream-hitting action funnels through
    // (the non-upstream `status`/`help` actions never use it), so the upstream-call
    // observability counters are incremented here — once per upstream call, with the
    // error counter bumped only on failure.
    macro_rules! svc {
        ($fut:expr) => {{
            state.counters.inc_upstream();
            ($fut).await.map_err(|e| {
                state.counters.inc_upstream_err();
                classify_service_error(e, action)
            })
        }};
    }
    // Helper: turn an arg-helper `anyhow::Result` into an `InvalidParams` failure.
    macro_rules! arg {
        ($res:expr) => {
            $res.map_err(|e: anyhow::Error| ToolError::InvalidParams(e.to_string()))?
        };
    }

    match action {
        "array" => svc!(state.service.array()),
        "disks" => svc!(state.service.disks()),

        "docker" => {
            let filter = string_arg(args, "state");
            let limit = arg!(usize_arg(args, "limit")).unwrap_or(50).min(200);
            let offset = arg!(usize_arg(args, "offset")).unwrap_or(0);
            svc!(state.service.docker())
                .map(|v| paginate_array(v, &["docker", "containers"], limit, offset, filter))
        }

        "docker_logs" => {
            let id = string_arg(args, "id").ok_or_else(|| {
                ToolError::InvalidParams(
                    "\"id\" is required for action=docker_logs.\n\
                     Hint: call action=docker first to list available container IDs.\n\
                     Example: {\"action\": \"docker_logs\", \"id\": \"<container_id>\", \"tail\": 100}"
                        .to_string(),
                )
            })?;
            let tail = arg!(i64_arg(args, "tail"));
            svc!(state.service.docker_logs(&id, tail))
        }

        "vms" => {
            let limit = arg!(usize_arg(args, "limit")).unwrap_or(50).min(200);
            let offset = arg!(usize_arg(args, "offset")).unwrap_or(0);
            svc!(state.service.vms())
                .map(|v| paginate_array(v, &["vms", "domains"], limit, offset, None))
        }

        "server" => svc!(state.service.server()),
        "info" => svc!(state.service.info()),

        "shares" => {
            let filter = string_arg(args, "name");
            let limit = arg!(usize_arg(args, "limit")).unwrap_or(50).min(200);
            let offset = arg!(usize_arg(args, "offset")).unwrap_or(0);
            svc!(state.service.shares())
                .map(|v| paginate_array(v, &["shares"], limit, offset, filter))
        }

        "notifications" => {
            let limit = arg!(usize_arg(args, "limit")).unwrap_or(50).min(200);
            let offset = arg!(usize_arg(args, "offset")).unwrap_or(0);
            svc!(state.service.notifications()).map(|v| {
                paginate_array(
                    v,
                    &["notifications", "warningsAndAlerts"],
                    limit,
                    offset,
                    None,
                )
            })
        }

        "log_files" => {
            let limit = arg!(usize_arg(args, "limit")).unwrap_or(50).min(200);
            let offset = arg!(usize_arg(args, "offset")).unwrap_or(0);
            svc!(state.service.log_files())
                .map(|v| paginate_array(v, &["logFiles"], limit, offset, None))
        }

        "log_file" => {
            let path = string_arg(args, "path").ok_or_else(|| {
                ToolError::InvalidParams(
                    "\"path\" is required for action=log_file.\n\
                     Hint: call action=log_files first to list available log file paths.\n\
                     Example: {\"action\": \"log_file\", \"path\": \"/var/log/syslog\", \"lines\": 100}"
                        .to_string(),
                )
            })?;
            let lines = arg!(i64_arg(args, "lines"));
            let start_line = arg!(i64_arg(args, "start_line"));
            svc!(state.service.log_file(&path, lines, start_line))
        }

        "services" => {
            let limit = arg!(usize_arg(args, "limit")).unwrap_or(50).min(200);
            let offset = arg!(usize_arg(args, "offset")).unwrap_or(0);
            svc!(state.service.services())
                .map(|v| paginate_array(v, &["services"], limit, offset, None))
        }

        "network" => svc!(state.service.network()),

        "ups" => {
            let limit = arg!(usize_arg(args, "limit")).unwrap_or(50).min(200);
            let offset = arg!(usize_arg(args, "offset")).unwrap_or(0);
            svc!(state.service.ups())
                .map(|v| paginate_array(v, &["upsDevices"], limit, offset, None))
        }

        "ups_config" => svc!(state.service.ups_config()),
        "metrics" => svc!(state.service.metrics()),

        "plugins" => {
            let filter = string_arg(args, "name");
            let limit = arg!(usize_arg(args, "limit")).unwrap_or(50).min(200);
            let offset = arg!(usize_arg(args, "offset")).unwrap_or(0);
            svc!(state.service.plugins())
                .map(|v| paginate_array(v, &["plugins"], limit, offset, filter))
        }

        "parity_history" => {
            let limit = arg!(usize_arg(args, "limit")).unwrap_or(50).min(200);
            let offset = arg!(usize_arg(args, "offset")).unwrap_or(0);
            svc!(state.service.parity_history())
                .map(|v| paginate_array(v, &["parityHistory"], limit, offset, None))
        }

        "vars" => svc!(state.service.vars()),
        "registration" => svc!(state.service.registration()),
        "flash" => svc!(state.service.flash()),
        "rclone" => svc!(state.service.rclone()),
        "remote_access" => svc!(state.service.remote_access()),
        "connect" => svc!(state.service.connect()),
        "online" => svc!(state.service.online()),
        "system_time" => svc!(state.service.system_time()),
        "installed_unraid_plugins" => svc!(state.service.installed_unraid_plugins()),
        "is_sso_enabled" => svc!(state.service.is_sso_enabled()),
        "public_oidc_providers" => svc!(state.service.public_oidc_providers()),
        "oidc_providers" => svc!(state.service.oidc_providers()),
        "oidc_configuration" => svc!(state.service.oidc_configuration()),
        "api_keys" => svc!(state.service.api_keys()),
        "api_key_possible_roles" => svc!(state.service.api_key_possible_roles()),
        "api_key_possible_permissions" => svc!(state.service.api_key_possible_permissions()),
        "get_available_auth_actions" => svc!(state.service.get_available_auth_actions()),
        "get_api_key_creation_form_schema" => {
            svc!(state.service.get_api_key_creation_form_schema())
        }
        "config" => svc!(state.service.config()),
        "settings" => svc!(state.service.settings()),
        "display" => svc!(state.service.display()),
        "customization" => svc!(state.service.customization()),
        "internal_boot_context" => svc!(state.service.internal_boot_context()),
        "me" => svc!(state.service.me()),
        "owner" => svc!(state.service.owner()),
        "servers" => svc!(state.service.servers()),
        "is_fresh_install" => svc!(state.service.is_fresh_install()),
        "public_theme" => svc!(state.service.public_theme()),
        "network_interfaces" => svc!(state.service.network_interfaces()),
        "time_zone_options" => svc!(state.service.time_zone_options()),
        "assignable_disks" => svc!(state.service.assignable_disks()),
        "plugin_install_operations" => svc!(state.service.plugin_install_operations()),
        "cloud" => svc!(state.service.cloud()),

        // ── arg-bearing read actions ──
        "api_key" => {
            let id = require_id(args, "api_key")?;
            svc!(state.service.api_key(&id))
        }
        "disk" => {
            let id = require_id(args, "disk")?;
            svc!(state.service.disk(&id))
        }
        "oidc_provider" => {
            let id = require_id(args, "oidc_provider")?;
            svc!(state.service.oidc_provider(&id))
        }
        "ups_device_by_id" => {
            let id = require_id(args, "ups_device_by_id")?;
            svc!(state.service.ups_device_by_id(&id))
        }
        "plugin_install_operation" => {
            let id = require_id(args, "plugin_install_operation")?;
            svc!(state.service.plugin_install_operation(&id))
        }
        "validate_oidc_session" => {
            let token = string_arg(args, "token").ok_or_else(|| {
                ToolError::InvalidParams(
                    "\"token\" is required for action=validate_oidc_session.".to_string(),
                )
            })?;
            svc!(state.service.validate_oidc_session(&token))
        }
        "get_permissions_for_roles" => {
            let roles = args
                .get("roles")
                .and_then(|v| v.as_array())
                .map(|a| {
                    a.iter()
                        .filter_map(|x| x.as_str().map(String::from))
                        .collect::<Vec<_>>()
                })
                .filter(|v| !v.is_empty())
                .ok_or_else(|| {
                    ToolError::InvalidParams(
                        "\"roles\" (a non-empty array of role names) is required for \
                         action=get_permissions_for_roles."
                            .to_string(),
                    )
                })?;
            svc!(state.service.get_permissions_for_roles(&roles))
        }
        "preview_effective_permissions" => {
            let roles = string_array_arg(args, "roles");
            let permissions = args.get("permissions").cloned().unwrap_or(Value::Null);
            svc!(state
                .service
                .preview_effective_permissions(roles.as_deref(), &permissions))
        }

        // ── mutations (require unraid:admin) ──
        "recalculate_overview" => svc!(state.service.recalculate_overview()),
        "delete_archived_notifications" => svc!(state.service.delete_archived_notifications()),
        "archive_notification" => {
            let id = require_id(args, "archive_notification")?;
            svc!(state.service.archive_notification(&id))
        }
        "create_notification" => {
            let req = |k: &str| {
                string_arg(args, k).ok_or_else(|| {
                    ToolError::InvalidParams(format!(
                        "\"{k}\" is required for action=create_notification."
                    ))
                })
            };
            let title = req("title")?;
            let subject = req("subject")?;
            let description = req("description")?;
            let importance = req("importance")?;
            let link = string_arg(args, "link");
            svc!(state.service.create_notification(
                &title,
                &subject,
                &description,
                &importance,
                link.as_deref()
            ))
        }
        "vm_start" => {
            let id = require_id(args, "vm_start")?;
            svc!(state.service.vm_start(&id))
        }
        "vm_stop" => {
            let id = require_id(args, "vm_stop")?;
            svc!(state.service.vm_stop(&id))
        }
        "vm_pause" => {
            let id = require_id(args, "vm_pause")?;
            svc!(state.service.vm_pause(&id))
        }
        "vm_resume" => {
            let id = require_id(args, "vm_resume")?;
            svc!(state.service.vm_resume(&id))
        }
        "vm_force_stop" => {
            let id = require_id(args, "vm_force_stop")?;
            svc!(state.service.vm_force_stop(&id))
        }
        "vm_reboot" => {
            let id = require_id(args, "vm_reboot")?;
            svc!(state.service.vm_reboot(&id))
        }
        "vm_reset" => {
            let id = require_id(args, "vm_reset")?;
            svc!(state.service.vm_reset(&id))
        }
        "docker_start" => {
            let id = require_id(args, "docker_start")?;
            svc!(state.service.docker_start(&id))
        }
        "docker_stop" => {
            let id = require_id(args, "docker_stop")?;
            svc!(state.service.docker_stop(&id))
        }
        "docker_restart" => {
            let id = require_id(args, "docker_restart")?;
            svc!(state.service.docker_restart(&id))
        }
        "docker_pause" => {
            let id = require_id(args, "docker_pause")?;
            svc!(state.service.docker_pause(&id))
        }
        "docker_unpause" => {
            let id = require_id(args, "docker_unpause")?;
            svc!(state.service.docker_unpause(&id))
        }
        "docker_update_container" => {
            let id = require_id(args, "docker_update_container")?;
            svc!(state.service.docker_update_container(&id))
        }
        "docker_remove_container" => {
            let id = require_id(args, "docker_remove_container")?;
            let with_image = args.get("with_image").and_then(|v| v.as_bool());
            svc!(state.service.docker_remove_container(&id, with_image))
        }
        "docker_update_containers" => {
            let ids = args.get("ids").and_then(|v| v.as_array())
                .map(|a| a.iter().filter_map(|x| x.as_str().map(String::from)).collect::<Vec<_>>())
                .filter(|v| !v.is_empty())
                .ok_or_else(|| ToolError::InvalidParams("\"ids\" (non-empty array) is required for action=docker_update_containers.".to_string()))?;
            svc!(state.service.docker_update_containers(&ids))
        }
        "docker_update_all_containers" => svc!(state.service.docker_update_all_containers()),
        "docker_create_folder" => {
            let name = string_arg(args, "name").ok_or_else(|| {
                ToolError::InvalidParams(
                    "\"name\" is required for action=docker_create_folder.".to_string(),
                )
            })?;
            let children_ids = string_array_arg(args, "children_ids");
            svc!(state.service.docker_create_folder(
                &name,
                string_arg(args, "parent_id").as_deref(),
                children_ids.as_deref()
            ))
        }
        "docker_create_folder_with_items" => {
            let name = string_arg(args, "name").ok_or_else(|| {
                ToolError::InvalidParams(
                    "\"name\" is required for action=docker_create_folder_with_items.".to_string(),
                )
            })?;
            let source_entry_ids = string_array_arg(args, "source_entry_ids");
            svc!(state.service.docker_create_folder_with_items(
                &name,
                string_arg(args, "parent_id").as_deref(),
                source_entry_ids.as_deref(),
                args.get("position").and_then(|v| v.as_f64())
            ))
        }
        "docker_set_folder_children" => {
            let children_ids = string_array_arg(args, "children_ids").ok_or_else(|| {
                ToolError::InvalidParams(
                    "\"children_ids\" (array) is required for action=docker_set_folder_children."
                        .to_string(),
                )
            })?;
            svc!(state.service.docker_set_folder_children(
                string_arg(args, "folder_id").as_deref(),
                &children_ids
            ))
        }
        "docker_delete_entries" => {
            let entry_ids = string_array_arg(args, "entry_ids").ok_or_else(|| {
                ToolError::InvalidParams(
                    "\"entry_ids\" (array) is required for action=docker_delete_entries."
                        .to_string(),
                )
            })?;
            svc!(state.service.docker_delete_entries(&entry_ids))
        }
        "docker_move_entries_to_folder" => {
            let source_entry_ids = string_array_arg(args, "source_entry_ids").ok_or_else(|| {
                ToolError::InvalidParams(
                    "\"source_entry_ids\" (array) is required for action=docker_move_entries_to_folder."
                        .to_string(),
                )
            })?;
            let destination_folder_id = string_arg(args, "destination_folder_id").ok_or_else(|| {
                ToolError::InvalidParams(
                    "\"destination_folder_id\" is required for action=docker_move_entries_to_folder."
                        .to_string(),
                )
            })?;
            svc!(state
                .service
                .docker_move_entries_to_folder(&source_entry_ids, &destination_folder_id))
        }
        "docker_move_items_to_position" => {
            let source_entry_ids = string_array_arg(args, "source_entry_ids").ok_or_else(|| {
                ToolError::InvalidParams(
                    "\"source_entry_ids\" (array) is required for action=docker_move_items_to_position."
                        .to_string(),
                )
            })?;
            let destination_folder_id = string_arg(args, "destination_folder_id").ok_or_else(|| {
                ToolError::InvalidParams(
                    "\"destination_folder_id\" is required for action=docker_move_items_to_position."
                        .to_string(),
                )
            })?;
            let position = args
                .get("position")
                .and_then(|v| v.as_f64())
                .ok_or_else(|| {
                    ToolError::InvalidParams(
                    "\"position\" (number) is required for action=docker_move_items_to_position."
                        .to_string(),
                )
                })?;
            svc!(state.service.docker_move_items_to_position(
                &source_entry_ids,
                &destination_folder_id,
                position
            ))
        }
        "docker_rename_folder" => {
            let folder_id = string_arg(args, "folder_id").ok_or_else(|| {
                ToolError::InvalidParams(
                    "\"folder_id\" is required for action=docker_rename_folder.".to_string(),
                )
            })?;
            let new_name = string_arg(args, "new_name").ok_or_else(|| {
                ToolError::InvalidParams(
                    "\"new_name\" is required for action=docker_rename_folder.".to_string(),
                )
            })?;
            svc!(state.service.docker_rename_folder(&folder_id, &new_name))
        }
        "docker_update_view_preferences" => {
            let prefs = args
                .get("prefs")
                .cloned()
                .unwrap_or_else(|| serde_json::json!({}));
            svc!(state
                .service
                .docker_update_view_preferences(string_arg(args, "view_id").as_deref(), prefs))
        }
        "docker_update_autostart_configuration" => {
            let entries = args
                .get("entries")
                .cloned()
                .filter(|v| v.is_array())
                .ok_or_else(|| {
                    ToolError::InvalidParams(
                        "\"entries\" (array) is required for action=docker_update_autostart_configuration."
                            .to_string(),
                    )
                })?;
            svc!(state.service.docker_update_autostart_configuration(
                entries,
                args.get("persist_user_preferences")
                    .and_then(|v| v.as_bool())
            ))
        }
        "refresh_docker_digests" => svc!(state.service.refresh_docker_digests()),
        "reset_docker_template_mappings" => svc!(state.service.reset_docker_template_mappings()),
        "sync_docker_template_paths" => svc!(state.service.sync_docker_template_paths()),
        "customization_set_locale" => {
            let locale = string_arg(args, "locale").ok_or_else(|| {
                ToolError::InvalidParams(
                    "\"locale\" is required for action=customization_set_locale.".to_string(),
                )
            })?;
            svc!(state.service.customization_set_locale(&locale))
        }
        "customization_set_theme" => {
            let theme = string_arg(args, "theme").ok_or_else(|| {
                ToolError::InvalidParams(
                    "\"theme\" is required for action=customization_set_theme.".to_string(),
                )
            })?;
            svc!(state.service.customization_set_theme(&theme))
        }
        "array_set_state" => {
            let ds = string_arg(args, "desired_state").ok_or_else(|| {
                ToolError::InvalidParams(
                    "\"desired_state\" (START/STOP) is required for action=array_set_state."
                        .to_string(),
                )
            })?;
            let decryption_password = string_arg(args, "decryption_password");
            let decryption_keyfile = string_arg(args, "decryption_keyfile");
            svc!(state.service.array_set_state(
                &ds,
                decryption_password.as_deref(),
                decryption_keyfile.as_deref()
            ))
        }
        "array_add_disk_to_array" => {
            let id = require_id(args, "array_add_disk_to_array")?;
            svc!(state.service.array_add_disk_to_array(
                &id,
                args.get("slot").and_then(|v| v.as_i64()).map(|n| n as i32)
            ))
        }
        "array_remove_disk_from_array" => {
            let id = require_id(args, "array_remove_disk_from_array")?;
            svc!(state.service.array_remove_disk_from_array(
                &id,
                args.get("slot").and_then(|v| v.as_i64()).map(|n| n as i32)
            ))
        }
        "array_mount_array_disk" => {
            let id = require_id(args, "array_mount_array_disk")?;
            svc!(state.service.array_mount_array_disk(&id))
        }
        "array_unmount_array_disk" => {
            let id = require_id(args, "array_unmount_array_disk")?;
            svc!(state.service.array_unmount_array_disk(&id))
        }
        "array_clear_array_disk_statistics" => {
            let id = require_id(args, "array_clear_array_disk_statistics")?;
            svc!(state.service.array_clear_array_disk_statistics(&id))
        }
        "parity_check_start" => {
            let correct = args
                .get("correct")
                .and_then(|v| v.as_bool())
                .unwrap_or(false);
            svc!(state.service.parity_check_start(correct))
        }
        "parity_check_pause" => svc!(state.service.parity_check_pause()),
        "parity_check_resume" => svc!(state.service.parity_check_resume()),
        "parity_check_cancel" => svc!(state.service.parity_check_cancel()),
        "api_key_create" => {
            let name = string_arg(args, "name").ok_or_else(|| {
                ToolError::InvalidParams(
                    "\"name\" is required for action=api_key_create.".to_string(),
                )
            })?;
            let roles = args.get("roles").and_then(|v| v.as_array()).map(|a| {
                a.iter()
                    .filter_map(|x| x.as_str().map(String::from))
                    .collect::<Vec<_>>()
            });
            let perms = args.get("permissions").cloned().unwrap_or(Value::Null);
            svc!(state.service.api_key_create(
                &name,
                string_arg(args, "description").as_deref(),
                roles.as_deref(),
                &perms,
                args.get("overwrite").and_then(|v| v.as_bool())
            ))
        }
        "api_key_add_role" => {
            let id = string_arg(args, "api_key_id").ok_or_else(|| {
                ToolError::InvalidParams(
                    "\"api_key_id\" is required for action=api_key_add_role.".to_string(),
                )
            })?;
            let role = string_arg(args, "role").ok_or_else(|| {
                ToolError::InvalidParams(
                    "\"role\" is required for action=api_key_add_role.".to_string(),
                )
            })?;
            svc!(state.service.api_key_add_role(&id, &role))
        }
        "api_key_remove_role" => {
            let id = string_arg(args, "api_key_id").ok_or_else(|| {
                ToolError::InvalidParams(
                    "\"api_key_id\" is required for action=api_key_remove_role.".to_string(),
                )
            })?;
            let role = string_arg(args, "role").ok_or_else(|| {
                ToolError::InvalidParams(
                    "\"role\" is required for action=api_key_remove_role.".to_string(),
                )
            })?;
            svc!(state.service.api_key_remove_role(&id, &role))
        }
        "api_key_delete" => {
            let ids = args
                .get("ids")
                .and_then(|v| v.as_array())
                .map(|a| {
                    a.iter()
                        .filter_map(|x| x.as_str().map(String::from))
                        .collect::<Vec<_>>()
                })
                .filter(|v| !v.is_empty())
                .ok_or_else(|| {
                    ToolError::InvalidParams(
                        "\"ids\" (non-empty array) is required for action=api_key_delete."
                            .to_string(),
                    )
                })?;
            svc!(state.service.api_key_delete(&ids))
        }
        "api_key_update" => {
            let id = require_id(args, "api_key_update")?;
            let roles = args.get("roles").and_then(|v| v.as_array()).map(|a| {
                a.iter()
                    .filter_map(|x| x.as_str().map(String::from))
                    .collect::<Vec<_>>()
            });
            let perms = args.get("permissions").cloned().unwrap_or(Value::Null);
            svc!(state.service.api_key_update(
                &id,
                string_arg(args, "name").as_deref(),
                string_arg(args, "description").as_deref(),
                roles.as_deref(),
                &perms
            ))
        }
        "rclone_create_r_clone_remote" => {
            let name = string_arg(args, "name").ok_or_else(|| {
                ToolError::InvalidParams(
                    "\"name\" is required for action=rclone_create_r_clone_remote.".to_string(),
                )
            })?;
            let ty = string_arg(args, "type").ok_or_else(|| {
                ToolError::InvalidParams(
                    "\"type\" is required for action=rclone_create_r_clone_remote.".to_string(),
                )
            })?;
            let parameters = args
                .get("parameters")
                .cloned()
                .unwrap_or_else(|| serde_json::json!({}));
            svc!(state
                .service
                .rclone_create_r_clone_remote(&name, &ty, parameters))
        }
        "rclone_delete_r_clone_remote" => {
            let name = string_arg(args, "name").ok_or_else(|| {
                ToolError::InvalidParams(
                    "\"name\" is required for action=rclone_delete_r_clone_remote.".to_string(),
                )
            })?;
            svc!(state.service.rclone_delete_r_clone_remote(&name))
        }
        "unraid_plugins_install_plugin" => {
            let url = string_arg(args, "url").ok_or_else(|| {
                ToolError::InvalidParams(
                    "\"url\" is required for action=unraid_plugins_install_plugin.".to_string(),
                )
            })?;
            svc!(state.service.unraid_plugins_install_plugin(
                &url,
                string_arg(args, "name").as_deref(),
                args.get("forced").and_then(|v| v.as_bool())
            ))
        }
        "unraid_plugins_install_language" => {
            let url = string_arg(args, "url").ok_or_else(|| {
                ToolError::InvalidParams(
                    "\"url\" is required for action=unraid_plugins_install_language.".to_string(),
                )
            })?;
            svc!(state.service.unraid_plugins_install_language(
                &url,
                string_arg(args, "name").as_deref(),
                args.get("forced").and_then(|v| v.as_bool())
            ))
        }
        "onboarding_complete_onboarding" => svc!(state.service.onboarding_complete_onboarding()),
        "onboarding_reset_onboarding" => svc!(state.service.onboarding_reset_onboarding()),
        "onboarding_bypass_onboarding" => svc!(state.service.onboarding_bypass_onboarding()),
        "onboarding_clear_onboarding_override" => {
            svc!(state.service.onboarding_clear_onboarding_override())
        }
        "onboarding_close_onboarding" => svc!(state.service.onboarding_close_onboarding()),
        "onboarding_open_onboarding" => svc!(state.service.onboarding_open_onboarding()),
        "onboarding_resume_onboarding" => svc!(state.service.onboarding_resume_onboarding()),
        "onboarding_refresh_internal_boot_context" => {
            svc!(state.service.onboarding_refresh_internal_boot_context())
        }
        "onboarding_set_onboarding_override" => {
            let input = args
                .get("input")
                .cloned()
                .unwrap_or_else(|| serde_json::json!({}));
            svc!(state.service.onboarding_set_onboarding_override(input))
        }
        "onboarding_create_internal_boot_pool" => {
            let pool_name = string_arg(args, "pool_name").ok_or_else(|| {
                ToolError::InvalidParams(
                    "\"pool_name\" is required for action=onboarding_create_internal_boot_pool."
                        .to_string(),
                )
            })?;
            let devices = string_array_arg(args, "devices").filter(|v| !v.is_empty()).ok_or_else(|| {
                ToolError::InvalidParams(
                    "\"devices\" (non-empty array) is required for action=onboarding_create_internal_boot_pool."
                        .to_string(),
                )
            })?;
            let boot_size_mib = args.get("boot_size_mib").and_then(|v| v.as_i64()).ok_or_else(|| {
                ToolError::InvalidParams(
                    "\"boot_size_mib\" (integer) is required for action=onboarding_create_internal_boot_pool."
                        .to_string(),
                )
            })? as i32;
            let update_bios = args.get("update_bios").and_then(|v| v.as_bool()).ok_or_else(|| {
                ToolError::InvalidParams(
                    "\"update_bios\" (boolean) is required for action=onboarding_create_internal_boot_pool."
                        .to_string(),
                )
            })?;
            svc!(state.service.onboarding_create_internal_boot_pool(
                &pool_name,
                &devices,
                boot_size_mib,
                update_bios,
                args.get("reboot").and_then(|v| v.as_bool())
            ))
        }
        "archive_notifications" => {
            let ids = args
                .get("ids")
                .and_then(|v| v.as_array())
                .map(|a| {
                    a.iter()
                        .filter_map(|x| x.as_str().map(String::from))
                        .collect::<Vec<_>>()
                })
                .filter(|v| !v.is_empty())
                .ok_or_else(|| {
                    ToolError::InvalidParams(
                        "\"ids\" (non-empty array) is required for action=archive_notifications."
                            .to_string(),
                    )
                })?;
            svc!(state.service.archive_notifications(&ids))
        }
        "unarchive_notifications" => {
            let ids = args
                .get("ids")
                .and_then(|v| v.as_array())
                .map(|a| {
                    a.iter()
                        .filter_map(|x| x.as_str().map(String::from))
                        .collect::<Vec<_>>()
                })
                .filter(|v| !v.is_empty())
                .ok_or_else(|| {
                    ToolError::InvalidParams(
                        "\"ids\" (non-empty array) is required for action=unarchive_notifications."
                            .to_string(),
                    )
                })?;
            svc!(state.service.unarchive_notifications(&ids))
        }
        "unread_notification" => {
            let id = require_id(args, "unread_notification")?;
            svc!(state.service.unread_notification(&id))
        }
        "archive_all" => svc!(state
            .service
            .archive_all(string_arg(args, "importance").as_deref())),
        "unarchive_all" => svc!(state
            .service
            .unarchive_all(string_arg(args, "importance").as_deref())),
        "update_server_identity" => {
            let name = string_arg(args, "name").ok_or_else(|| {
                ToolError::InvalidParams(
                    "\"name\" is required for action=update_server_identity.".to_string(),
                )
            })?;
            svc!(state.service.update_server_identity(
                &name,
                string_arg(args, "comment").as_deref(),
                string_arg(args, "sys_model").as_deref()
            ))
        }
        "configure_ups" => {
            let config = args
                .get("config")
                .cloned()
                .unwrap_or_else(|| serde_json::json!({}));
            svc!(state.service.configure_ups(config))
        }
        "update_system_time" => {
            let input = args
                .get("input")
                .cloned()
                .unwrap_or_else(|| serde_json::json!({}));
            svc!(state.service.update_system_time(input))
        }
        "update_temperature_config" => {
            let input = args
                .get("input")
                .cloned()
                .unwrap_or_else(|| serde_json::json!({}));
            svc!(state.service.update_temperature_config(input))
        }
        "add_plugin" => {
            let input = args
                .get("input")
                .cloned()
                .unwrap_or_else(|| serde_json::json!({}));
            svc!(state.service.add_plugin(input))
        }
        "remove_plugin" => {
            let input = args
                .get("input")
                .cloned()
                .unwrap_or_else(|| serde_json::json!({}));
            svc!(state.service.remove_plugin(input))
        }
        "connect_sign_out" => svc!(state.service.connect_sign_out()),
        "connect_sign_in" => {
            let api_key = string_arg(args, "api_key").ok_or_else(|| {
                ToolError::InvalidParams(
                    "\"api_key\" is required for action=connect_sign_in.".to_string(),
                )
            })?;
            svc!(state
                .service
                .connect_sign_in(&api_key, args.get("user_info").cloned()))
        }
        "setup_remote_access" => {
            let access_type = string_arg(args, "access_type").ok_or_else(|| {
                ToolError::InvalidParams(
                    "\"access_type\" is required for action=setup_remote_access.".to_string(),
                )
            })?;
            svc!(state.service.setup_remote_access(
                &access_type,
                string_arg(args, "forward_type").as_deref(),
                args.get("port").and_then(|v| v.as_i64()).map(|n| n as i32)
            ))
        }
        "enable_dynamic_remote_access" => {
            let url = args.get("access_url").cloned().ok_or_else(|| {
                ToolError::InvalidParams(
                    "\"access_url\" is required for action=enable_dynamic_remote_access."
                        .to_string(),
                )
            })?;
            let enabled = args
                .get("enabled")
                .and_then(|v| v.as_bool())
                .ok_or_else(|| {
                    ToolError::InvalidParams(
                    "\"enabled\" (boolean) is required for action=enable_dynamic_remote_access."
                        .to_string(),
                )
                })?;
            svc!(state.service.enable_dynamic_remote_access(url, enabled))
        }
        "update_api_settings" => svc!(state.service.update_api_settings(
            string_arg(args, "access_type").as_deref(),
            string_arg(args, "forward_type").as_deref(),
            args.get("port").and_then(|v| v.as_i64()).map(|n| n as i32)
        )),
        "update_settings" => {
            let input = args.get("input").cloned().ok_or_else(|| {
                ToolError::InvalidParams(
                    "\"input\" is required for action=update_settings.".to_string(),
                )
            })?;
            svc!(state.service.update_settings(input))
        }
        "update_ssh_settings" => {
            let enabled = args
                .get("enabled")
                .and_then(|v| v.as_bool())
                .ok_or_else(|| {
                    ToolError::InvalidParams(
                        "\"enabled\" (boolean) is required for action=update_ssh_settings."
                            .to_string(),
                    )
                })?;
            let port = args.get("port").and_then(|v| v.as_i64()).ok_or_else(|| {
                ToolError::InvalidParams(
                    "\"port\" (integer) is required for action=update_ssh_settings.".to_string(),
                )
            })? as i32;
            svc!(state.service.update_ssh_settings(enabled, port))
        }
        "initiate_flash_backup" => {
            let remote_name = string_arg(args, "remote_name").ok_or_else(|| {
                ToolError::InvalidParams(
                    "\"remote_name\" is required for action=initiate_flash_backup.".to_string(),
                )
            })?;
            let source_path = string_arg(args, "source_path").ok_or_else(|| {
                ToolError::InvalidParams(
                    "\"source_path\" is required for action=initiate_flash_backup.".to_string(),
                )
            })?;
            let destination_path = string_arg(args, "destination_path").ok_or_else(|| {
                ToolError::InvalidParams(
                    "\"destination_path\" is required for action=initiate_flash_backup."
                        .to_string(),
                )
            })?;
            svc!(state.service.initiate_flash_backup(
                &remote_name,
                &source_path,
                &destination_path,
                args.get("options").cloned()
            ))
        }
        "notify_if_unique" => {
            let req = |k: &str| {
                string_arg(args, k).ok_or_else(|| {
                    ToolError::InvalidParams(format!(
                        "\"{k}\" is required for action=notify_if_unique."
                    ))
                })
            };
            let title = req("title")?;
            let subject = req("subject")?;
            let description = req("description")?;
            let importance = req("importance")?;
            let link = string_arg(args, "link");
            svc!(state.service.notify_if_unique(
                &title,
                &subject,
                &description,
                &importance,
                link.as_deref()
            ))
        }

        "status" => {
            let snap = state.counters.snapshot();
            Ok(json!({
                "status": "ok",
                "server": {
                    "version": env!("CARGO_PKG_VERSION"),
                    "pid": std::process::id(),
                },
                "counters": snap,
            }))
        }

        "help" => Ok(json!({ "help": HELP_TEXT })),

        other => {
            let valid = &*VALID_ACTIONS;
            Err(ToolError::InvalidParams(format!(
                "unknown unraid action: \"{other}\"\n\
                 Valid actions: {valid}\n\
                 See: action=help for full documentation."
            )))
        }
    }
}

// ── help text ─────────────────────────────────────────────────────────────────

const HELP_TEXT: &str = r#"# unraid MCP Tool

Read-only access to the Unraid server via its GraphQL API.
Set the required `action` argument to select the operation.

## Core
- `array`          — Array state, disk health, parity, capacity
- `disks`          — Physical disks with SMART status and temps
- `docker`         — All Docker containers (supports limit, offset, state filter)
- `docker_logs`    — Container logs (requires `id`, optional `tail`)
                     Hint: call action=docker first to get a container id.
- `vms`            — Virtual machines and state (supports limit, offset)
- `server`         — Server identity, IPs, online status
- `info`           — OS, CPU, memory, Unraid/kernel versions
- `shares`         — User shares with sizes and cache settings (supports limit, offset, name filter)
- `notifications`  — Active warnings/alerts and overview counts (supports limit, offset)

## System
- `services`       — Running system services and uptime (supports limit, offset)
- `network`        — Network access URLs
- `metrics`        — Live CPU, memory, and temperature readings
- `vars`           — System configuration variables
- `registration`   — License registration state and expiry
- `flash`          — USB flash drive info

## Logs
- `log_files`      — List available log files with sizes (supports limit, offset)
                     Hint: call this first to get valid paths for action=log_file.
- `log_file`       — Read a log file (requires `path`, optional `lines`, `start_line`)

## Storage
- `parity_history` — All past parity check results (supports limit, offset)
- `rclone`         — Backup remote configurations

## UPS
- `ups`            — UPS devices: battery, power, status (supports limit, offset)
- `ups_config`     — UPS monitoring configuration

## Remote access
- `remote_access`  — WAN access type, port forwarding config
- `connect`        — Unraid Connect dynamic remote access status

## Plugins
- `plugins`        — Installed community plugins with versions (supports limit, offset, name filter)

## Observability
- `status`         — Server runtime state, request counters, pid

## Pagination (for list actions)
Pass `limit` (default 50, max 200) and `offset` (default 0) to page through results.
Response shape: {items, total, limit, offset, has_more, next_offset}

## Meta
- `help`           — This documentation
"#;

#[cfg(test)]
mod tests {
    use super::*;

    // These tests lock the routing contract that used to live implicitly in
    // substring matching: routing is decided by the typed `ToolError` variant, not
    // by the wording of the message. Rewording a message must not change routing.

    #[test]
    fn invalid_params_routes_to_protocol_error() {
        assert!(ToolError::InvalidParams("anything".into()).is_invalid_params());
    }

    #[test]
    fn upstream_variants_route_in_band() {
        // None of the upstream/internal variants are agent-correctable input
        // mistakes, so they must NOT route to protocol invalid_params (they stay
        // in-band tool errors that keep the session alive).
        assert!(!ToolError::UpstreamUnreachable("x".into()).is_invalid_params());
        assert!(!ToolError::UpstreamAuth("x".into()).is_invalid_params());
        assert!(!ToolError::Upstream("x".into()).is_invalid_params());
        assert!(!ToolError::Internal(anyhow::anyhow!("boom")).is_invalid_params());
    }

    #[test]
    fn classify_maps_unreachable_upstream_error() {
        let err = anyhow::Error::from(UpstreamError::Unreachable("nope".into()));
        let classified = classify_service_error(err, "array");
        assert!(matches!(classified, ToolError::UpstreamUnreachable(_)));
        assert!(!classified.is_invalid_params());
        // Helpful, action-specific message text is preserved.
        assert!(classified.to_string().contains("array failed"));
    }

    #[test]
    fn classify_maps_auth_upstream_error() {
        let err = anyhow::Error::from(UpstreamError::Auth("rejected".into()));
        let classified = classify_service_error(err, "disks");
        assert!(matches!(classified, ToolError::UpstreamAuth(_)));
        assert!(!classified.is_invalid_params());
        assert!(classified.to_string().contains("API key rejected"));
    }

    #[test]
    fn classify_maps_other_upstream_error() {
        let err = anyhow::Error::from(UpstreamError::Other("HTTP 500".into()));
        let classified = classify_service_error(err, "metrics");
        assert!(matches!(classified, ToolError::Upstream(_)));
        assert!(!classified.is_invalid_params());
    }

    #[test]
    fn classify_maps_unknown_error_to_internal() {
        // An error with no UpstreamError in its chain is an internal failure, and
        // routes in-band (not invalid_params).
        let err = anyhow::anyhow!("some non-upstream failure");
        let classified = classify_service_error(err, "info");
        assert!(matches!(classified, ToolError::Internal(_)));
        assert!(!classified.is_invalid_params());
    }

    #[test]
    fn classify_finds_upstream_error_through_context_layers() {
        // Routing must survive added context layers — it downcasts the source chain,
        // it does not match on the top-level message.
        let err = anyhow::Error::from(UpstreamError::Auth("401".into()))
            .context("while fetching docker containers");
        let classified = classify_service_error(err, "docker");
        assert!(matches!(classified, ToolError::UpstreamAuth(_)));
    }
}
