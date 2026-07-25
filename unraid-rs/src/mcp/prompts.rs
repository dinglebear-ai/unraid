use rmcp::model::{
    GetPromptRequestParams, GetPromptResult, ListPromptsResult, Prompt, PromptMessage,
    PromptMessageRole,
};

pub(super) fn list_prompts() -> ListPromptsResult {
    ListPromptsResult {
        prompts: vec![Prompt::new(
            "server_summary",
            Some("Generate a human-readable summary of the Unraid server status."),
            None,
        )],
        ..Default::default()
    }
}

pub(super) fn get_prompt(request: GetPromptRequestParams) -> anyhow::Result<GetPromptResult> {
    match request.name.as_str() {
        "server_summary" => Ok(GetPromptResult::new(vec![PromptMessage::new_text(
            PromptMessageRole::User,
            "Use the unraid tool with action=info to retrieve the current server status, \
             then provide a concise summary covering array state, disk health, \
             running VMs, Docker containers, and any active notifications.",
        )])
        .with_description("Summarize the Unraid server status")),
        other => Err(anyhow::anyhow!("unknown prompt: {other}")),
    }
}
