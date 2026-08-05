use rmcp::model::{
    GetPromptRequestParams, GetPromptResult, ListPromptsResult, Prompt, PromptMessage, Role,
};

const SERVER_SUMMARY_ACTIONS: &[&str] =
    &["info", "array", "disks", "vms", "docker", "notifications"];

pub(super) fn list_prompts(enabled_actions: &[&str]) -> ListPromptsResult {
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

pub(super) fn get_prompt(
    request: GetPromptRequestParams,
    enabled_actions: &[&str],
) -> anyhow::Result<GetPromptResult> {
    match request.name.as_str() {
        "server_summary" => {
            let actions = enabled_summary_actions(enabled_actions);
            if actions.is_empty() {
                anyhow::bail!("prompt unavailable: none of the server_summary actions are enabled");
            }
            let calls = actions
                .iter()
                .map(|action| format!("action={action}"))
                .collect::<Vec<_>>()
                .join(", ");
            Ok(GetPromptResult::new(vec![PromptMessage::new_text(
                Role::User,
                format!(
                    "Use the unraid tool to retrieve the currently enabled server summary data. \
                     Call these actions: {calls}. Then provide a concise summary covering only \
                     the categories returned by those calls, highlighting unhealthy or unusual values."
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
