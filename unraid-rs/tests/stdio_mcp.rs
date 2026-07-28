use std::{
    process::Stdio,
    sync::{
        atomic::{AtomicUsize, Ordering},
        Arc,
    },
};

use rmcp::{
    model::{
        CallToolRequestParams, ClientCapabilities, ClientInfo, CreateElicitationRequestParams,
        CreateElicitationResult, ElicitationAction, Implementation,
    },
    service::{RequestContext, RoleClient, RunningService, ServiceExt},
    transport::{ConfigureCommandExt, TokioChildProcess},
    ClientHandler, ErrorData,
};
use serde_json::json;
use tempfile::TempDir;
use tokio::{io::AsyncReadExt, process::Command};

async fn stdio_client(
    _db_path: &std::path::Path,
) -> anyhow::Result<(
    RunningService<RoleClient, ()>,
    Option<tokio::process::ChildStderr>,
)> {
    stdio_client_with_handler(()).await
}

async fn stdio_client_with_handler<H>(
    handler: H,
) -> anyhow::Result<(
    RunningService<RoleClient, H>,
    Option<tokio::process::ChildStderr>,
)>
where
    H: ClientHandler,
{
    let binary = env!("CARGO_BIN_EXE_runraid");
    let (transport, stderr) = TokioChildProcess::builder(Command::new(binary).configure(|cmd| {
        cmd.arg("mcp")
            .env("UNRAID_API_URL", "http://localhost:1/graphql")
            .env("UNRAID_API_KEY", "test")
            .env("UNRAID_RMCP_NO_AUTH", "true")
            .env("RUST_LOG", "warn")
            .env_remove("UNRAID_RMCP_TOKEN");
    }))
    .stderr(Stdio::piped())
    .spawn()?;
    let service = handler.serve(transport).await?;
    Ok((service, stderr))
}

fn text_content(result: &rmcp::model::CallToolResult) -> String {
    let value = serde_json::to_value(result).expect("tool result should serialize");
    value["content"][0]["text"]
        .as_str()
        .expect("tool result should contain text content")
        .to_string()
}

fn text_content_json(result: &rmcp::model::CallToolResult) -> serde_json::Value {
    serde_json::from_str(&text_content(result)).expect("tool text content should be JSON")
}

#[derive(Clone, Copy)]
enum ElicitationDecision {
    Accept,
    Decline,
}

#[derive(Clone)]
struct ElicitingClient {
    decision: ElicitationDecision,
    calls: Arc<AtomicUsize>,
}

impl ElicitingClient {
    fn new(decision: ElicitationDecision, calls: Arc<AtomicUsize>) -> Self {
        Self { decision, calls }
    }
}

impl ClientHandler for ElicitingClient {
    fn get_info(&self) -> ClientInfo {
        ClientInfo::new(
            ClientCapabilities::builder()
                .enable_elicitation()
                .enable_elicitation_schema_validation()
                .build(),
            Implementation::new("unraid-rmcp-test-client", "1.0.0"),
        )
    }

    async fn create_elicitation(
        &self,
        _request: CreateElicitationRequestParams,
        _context: RequestContext<RoleClient>,
    ) -> Result<CreateElicitationResult, ErrorData> {
        self.calls.fetch_add(1, Ordering::SeqCst);
        let mut result = match self.decision {
            ElicitationDecision::Accept => CreateElicitationResult::new(ElicitationAction::Accept),
            ElicitationDecision::Decline => {
                CreateElicitationResult::new(ElicitationAction::Decline)
            }
        };
        if matches!(self.decision, ElicitationDecision::Accept) {
            result.content = Some(json!({"confirmed": true}));
        }
        Ok(result)
    }
}

async fn cancel_and_drain<H: ClientHandler>(
    service: RunningService<RoleClient, H>,
    stderr: Option<tokio::process::ChildStderr>,
) {
    service.cancel().await.unwrap();

    if let Some(mut stderr) = stderr {
        let mut logs = String::new();
        match tokio::time::timeout(
            std::time::Duration::from_secs(1),
            stderr.read_to_string(&mut logs),
        )
        .await
        {
            Ok(Ok(_)) => {}
            Ok(Err(error)) => panic!("failed to read stdio child stderr: {error}"),
            Err(_) => panic!("stdio child stderr did not close after cancellation"),
        }
        assert!(
            !logs.contains("unraid listener") && !logs.contains("MCP server listening"),
            "stdio mode must not start network services; stderr was: {logs}"
        );
    }
}

#[tokio::test]
async fn stdio_child_process_lists_tools_and_calls_queries() {
    let temp = TempDir::new().unwrap();
    let db_path = temp.path().join("stdio-mcp.db");
    let (service, stderr) = stdio_client(&db_path).await.unwrap();

    let tools = service.list_tools(Default::default()).await.unwrap();
    let names: Vec<&str> = tools.tools.iter().map(|tool| tool.name.as_ref()).collect();
    assert_eq!(names, vec!["unraid"]);

    let status = service
        .call_tool(
            CallToolRequestParams::new("unraid")
                .with_arguments(json!({"action": "status"}).as_object().unwrap().clone()),
        )
        .await
        .unwrap();
    let status = text_content_json(&status);
    assert_eq!(status["status"], "ok");

    let help = service
        .call_tool(
            CallToolRequestParams::new("unraid")
                .with_arguments(json!({"action": "help"}).as_object().unwrap().clone()),
        )
        .await
        .unwrap();
    let help = text_content_json(&help);
    assert!(help["help"].as_str().unwrap_or("").contains("unraid"));

    cancel_and_drain(service, stderr).await;
}

#[tokio::test]
async fn destructive_action_acceptance_reaches_dispatch() {
    let calls = Arc::new(AtomicUsize::new(0));
    let client = ElicitingClient::new(ElicitationDecision::Accept, calls.clone());
    let (service, stderr) = stdio_client_with_handler(client).await.unwrap();

    let result = service
        .call_tool(
            CallToolRequestParams::new("unraid").with_arguments(
                json!({"action": "vm_reset", "id": "vm-1"})
                    .as_object()
                    .unwrap()
                    .clone(),
            ),
        )
        .await
        .unwrap();
    let text = text_content(&result);

    assert_eq!(calls.load(Ordering::SeqCst), 1);
    assert!(
        text.contains("upstream unreachable"),
        "accepted destructive action should reach GraphQL dispatch; got: {text}"
    );

    cancel_and_drain(service, stderr).await;
}

#[tokio::test]
async fn destructive_action_decline_stops_before_dispatch() {
    let calls = Arc::new(AtomicUsize::new(0));
    let client = ElicitingClient::new(ElicitationDecision::Decline, calls.clone());
    let (service, stderr) = stdio_client_with_handler(client).await.unwrap();

    let result = service
        .call_tool(
            CallToolRequestParams::new("unraid").with_arguments(
                json!({"action": "vm_reset", "id": "vm-1"})
                    .as_object()
                    .unwrap()
                    .clone(),
            ),
        )
        .await
        .unwrap();
    let text = text_content(&result);

    assert_eq!(calls.load(Ordering::SeqCst), 1);
    assert!(
        text.contains("declined by the user"),
        "declined destructive action must stop at elicitation; got: {text}"
    );
    assert!(
        !text.contains("upstream unreachable"),
        "declined action must not reach GraphQL dispatch; got: {text}"
    );

    cancel_and_drain(service, stderr).await;
}

#[tokio::test]
async fn ordinary_mutation_does_not_elicit() {
    let calls = Arc::new(AtomicUsize::new(0));
    let client = ElicitingClient::new(ElicitationDecision::Decline, calls.clone());
    let (service, stderr) = stdio_client_with_handler(client).await.unwrap();

    let result = service
        .call_tool(
            CallToolRequestParams::new("unraid").with_arguments(
                json!({"action": "vm_stop", "id": "vm-1"})
                    .as_object()
                    .unwrap()
                    .clone(),
            ),
        )
        .await
        .unwrap();
    let text = text_content(&result);

    assert_eq!(calls.load(Ordering::SeqCst), 0);
    assert!(
        text.contains("upstream unreachable"),
        "ordinary mutation should reach dispatch without elicitation; got: {text}"
    );

    cancel_and_drain(service, stderr).await;
}
