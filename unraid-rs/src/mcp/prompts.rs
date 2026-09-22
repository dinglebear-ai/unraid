use crate::config::McpProjectionMode;

use rmcp::model::{
    GetPromptRequestParams, GetPromptResult, ListPromptsResult, Prompt, PromptMessage, Role,
};

const SERVER_SUMMARY_ACTIONS: &[&str] =
    &["info", "array", "disks", "vms", "docker", "notifications"];

pub(super) fn list_prompts_for_projection(
    enabled_actions: &[&str],
    _projection: McpProjectionMode,
) -> ListPromptsResult {
    let prompts = if enabled_summary_actions(enabled_actions).is_empty() {
        Vec::new()
    } else {
        vec![Prompt::new(
            "server_summary",
            Some("Generate a human-readable summary from the enabled Unraid status actions."),
            None,
        )]
    };
    ListPromptsResult {
        prompts,
        ..Default::default()
    }
}

pub(super) fn get_prompt_for_projection(
    request: GetPromptRequestParams,
    enabled_actions: &[&str],
    projection: McpProjectionMode,
) -> anyhow::Result<GetPromptResult> {
    match request.name.as_str() {
        "server_summary" => {
            let actions = enabled_summary_actions(enabled_actions);
            if actions.is_empty() {
                anyhow::bail!("prompt unavailable: none of the server_summary actions are enabled");
            }
            let (surface, calls) = match projection {
                McpProjectionMode::Legacy => (
                    "Use the unraid tool",
                    actions
                        .iter()
                        .map(|action| format!("action={action}"))
                        .collect::<Vec<_>>()
                        .join(", "),
                ),
                McpProjectionMode::Atomic | McpProjectionMode::Both => (
                    "Use the enabled atomic Unraid tools",
                    actions
                        .iter()
                        .map(|action| format!("unraid_{action}"))
                        .collect::<Vec<_>>()
                        .join(", "),
                ),
            };
            Ok(GetPromptResult::new(vec![PromptMessage::new_text(
                Role::User,
                format!(
                    "{surface} to retrieve the currently enabled server summary data. \
                     Call: {calls}. Then provide a concise summary covering only the categories \
                     returned by those calls, highlighting unhealthy or unusual values."
                ),
            )])
            .with_description("Summarize the enabled Unraid server status data"))
        }
        other => Err(anyhow::anyhow!("unknown prompt: {other}")),
    }
}

fn enabled_summary_actions(enabled_actions: &[&str]) -> Vec<&'static str> {
    SERVER_SUMMARY_ACTIONS
        .iter()
        .copied()
        .filter(|action| enabled_actions.contains(action))
        .collect()
}
