use std::{
    collections::BTreeMap,
    process::Stdio,
    sync::{
        Arc,
        atomic::{AtomicUsize, Ordering},
    },
};

use rmcp::{
    ClientHandler, ErrorData,
    model::{
        CallToolRequestParams, ClientCapabilities, ClientInfo, ElicitRequestParams, ElicitResult,
        ElicitationAction, Implementation, ReadResourceRequestParams,
    },
    service::{NotificationContext, RequestContext, RoleClient, RunningService, ServiceExt},
    transport::{ConfigureCommandExt, TokioChildProcess},
};
use serde_json::{Value, json};
use tempfile::TempDir;
use tokio::{io::AsyncReadExt, process::Command};
use wiremock::{Mock, MockServer, Request, Respond, ResponseTemplate, matchers::method};

async fn stdio_client(
    _db_path: &std::path::Path,
) -> anyhow::Result<(
    RunningService<RoleClient, ()>,
    Option<tokio::process::ChildStderr>,
)> {
    stdio_client_with_handler_and_env((), &[]).await
}

async fn stdio_client_with_env(
    env: &[(&str, &str)],
) -> anyhow::Result<(
    RunningService<RoleClient, ()>,
    Option<tokio::process::ChildStderr>,
)> {
    stdio_client_with_handler_and_env((), env).await
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
    stdio_client_with_handler_and_env(handler, &[]).await
}

async fn stdio_client_with_handler_and_env<H>(
    handler: H,
    env: &[(&str, &str)],
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
            .env_remove("UNRAID_RMCP_TOKEN")
            .env_remove("UNRAID_RMCP_ENABLED_TOOLS")
            .env_remove("UNRAID_RMCP_DISABLED_TOOLS");
        for (key, value) in env {
            cmd.env(key, value);
        }
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

#[derive(Debug, Clone, Copy)]
enum ElicitationDecision {
    Accept,
    Decline,
    Cancel,
    FalseApproval,
    MalformedApproval,
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

#[derive(Clone)]
struct ToolChangeClient {
    changes: Arc<AtomicUsize>,
}

impl ClientHandler for ToolChangeClient {
    async fn on_tool_list_changed(&self, _context: NotificationContext<RoleClient>) {
        self.changes.fetch_add(1, Ordering::SeqCst);
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
        _request: ElicitRequestParams,
        _context: RequestContext<RoleClient>,
    ) -> Result<ElicitResult, ErrorData> {
        self.calls.fetch_add(1, Ordering::SeqCst);
        let mut result = match self.decision {
            ElicitationDecision::Accept
            | ElicitationDecision::FalseApproval
            | ElicitationDecision::MalformedApproval => {
                ElicitResult::new(ElicitationAction::Accept)
            }
            ElicitationDecision::Decline => ElicitResult::new(ElicitationAction::Decline),
            ElicitationDecision::Cancel => ElicitResult::new(ElicitationAction::Cancel),
        };
        result.content = match self.decision {
            ElicitationDecision::Accept => Some(json!({"confirmed": true, "approved": true})),
            ElicitationDecision::FalseApproval => Some(json!({"approved": false})),
            ElicitationDecision::MalformedApproval => Some(json!({"approved": "yes"})),
            ElicitationDecision::Decline | ElicitationDecision::Cancel => None,
        };
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

#[derive(Clone)]
struct DynamicSchemaResponder {
    by_name: BTreeMap<String, Value>,
}

impl DynamicSchemaResponder {
    fn new() -> Self {
        let mut by_name = BTreeMap::new();
        for raw in [
            include_str!("fixtures/dynamic/minimal-query-types.json"),
            include_str!("fixtures/dynamic/namespace-mutations.json"),
        ] {
            let response: Value = serde_json::from_str(raw).unwrap();
            for value in response["data"].as_object().unwrap().values() {
                let name = value["name"].as_str().unwrap().to_string();
                by_name.entry(name).or_insert_with(|| value.clone());
            }
        }
        Self { by_name }
    }
}

impl Respond for DynamicSchemaResponder {
    fn respond(&self, request: &Request) -> ResponseTemplate {
        let body: Value = serde_json::from_slice(&request.body).unwrap();
        let query = body["query"].as_str().unwrap_or_default();
        if query.contains("__type") {
            let variables = body["variables"].as_object().unwrap();
            let mut data = serde_json::Map::new();
            for index in 0..variables.len() {
                let name = variables[&format!("n{index}")].as_str().unwrap();
                data.insert(
                    format!("t{index}"),
                    self.by_name.get(name).cloned().unwrap_or(Value::Null),
                );
            }
            return ResponseTemplate::new(200).set_body_json(json!({ "data": data }));
        }
        if query.contains("mutation unraid_mutation_vm_start") {
            return ResponseTemplate::new(200)
                .set_body_json(json!({ "data": { "vm": { "start": true } } }));
        }
        ResponseTemplate::new(200).set_body_json(json!({ "data": {} }))
    }
}

#[derive(Clone)]
struct ChangingDynamicSchemaResponder {
    base: DynamicSchemaResponder,
    query_fetches: Arc<AtomicUsize>,
}

impl Respond for ChangingDynamicSchemaResponder {
    fn respond(&self, request: &Request) -> ResponseTemplate {
        let body: Value = serde_json::from_slice(&request.body).unwrap();
        let query = body["query"].as_str().unwrap_or_default();
        if query.contains("__type") {
            let variables = body["variables"].as_object().unwrap();
            let mut data = serde_json::Map::new();
            for index in 0..variables.len() {
                let name = variables[&format!("n{index}")].as_str().unwrap();
                let mut value = self.base.by_name.get(name).cloned().unwrap_or(Value::Null);
                if name == "Query"
                    && self.query_fetches.fetch_add(1, Ordering::SeqCst) >= 1
                    && let Some(fields) = value["fields"].as_array_mut()
                    && !fields.iter().any(|field| field["name"] == "ready")
                {
                    fields.push(json!({
                        "name": "ready",
                        "description": "Reports whether dynamic refresh is active.",
                        "args": [],
                        "type": { "kind": "NON_NULL", "name": null, "ofType": {
                            "kind": "SCALAR", "name": "Boolean", "ofType": null
                        }},
                        "isDeprecated": false,
                        "deprecationReason": null
                    }));
                }
                data.insert(format!("t{index}"), value);
            }
            return ResponseTemplate::new(200).set_body_json(json!({ "data": data }));
        }
        self.base.respond(request)
    }
}

async fn changing_dynamic_schema_server() -> MockServer {
    let server = MockServer::start().await;
    Mock::given(method("POST"))
        .respond_with(ChangingDynamicSchemaResponder {
            base: DynamicSchemaResponder::new(),
            query_fetches: Arc::new(AtomicUsize::new(0)),
        })
        .mount(&server)
        .await;
    server
}

async fn dynamic_schema_server() -> MockServer {
    let server = MockServer::start().await;
    Mock::given(method("POST"))
        .respond_with(DynamicSchemaResponder::new())
        .mount(&server)
        .await;
    server
}

async fn generated_vm_start_request_count(server: &MockServer) -> usize {
    server
        .received_requests()
        .await
        .unwrap()
        .iter()
        .filter(|request| {
            serde_json::from_slice::<Value>(&request.body)
                .ok()
                .and_then(|body| body["query"].as_str().map(str::to_string))
                .is_some_and(|query| query.contains("mutation unraid_mutation_vm_start"))
        })
        .count()
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
async fn stdio_filters_advertised_actions_and_rejects_disabled_calls() {
    let (service, stderr) = stdio_client_with_env(&[
        ("UNRAID_RMCP_ENABLED_TOOLS", "array,status,help"),
        ("UNRAID_RMCP_DISABLED_TOOLS", "array"),
    ])
    .await
    .unwrap();

    let tools = service.list_tools(Default::default()).await.unwrap();
    assert_eq!(tools.tools.len(), 1);
    let tool = serde_json::to_value(&tools.tools[0]).unwrap();
    assert_eq!(
        tool["inputSchema"]["properties"]["action"]["enum"],
        json!(["status", "help"])
    );

    let status = service
        .call_tool(
            CallToolRequestParams::new("unraid")
                .with_arguments(json!({"action": "status"}).as_object().unwrap().clone()),
        )
        .await
        .unwrap();
    assert_eq!(text_content_json(&status)["status"], "ok");

    let error = service
        .call_tool(
            CallToolRequestParams::new("unraid")
                .with_arguments(json!({"action": "array"}).as_object().unwrap().clone()),
        )
        .await
        .unwrap_err();
    assert!(
        error.to_string().contains("disabled by server policy"),
        "disabled action error was: {error}"
    );

    // The schema resource must advertise exactly the filtered action enum, not
    // the full canonical list.
    let resource = service
        .read_resource(ReadResourceRequestParams::new("unraid://schema/mcp-tool"))
        .await
        .unwrap();
    let resource = serde_json::to_value(&resource).unwrap();
    let schema: serde_json::Value = serde_json::from_str(
        resource["contents"][0]["text"]
            .as_str()
            .expect("schema resource should contain text"),
    )
    .expect("schema resource text should be JSON");
    assert_eq!(
        schema[0]["inputSchema"]["properties"]["action"]["enum"],
        json!(["status", "help"])
    );

    // action=help reports the same filtered subset in enabled_actions.
    let help = service
        .call_tool(
            CallToolRequestParams::new("unraid")
                .with_arguments(json!({"action": "help"}).as_object().unwrap().clone()),
        )
        .await
        .unwrap();
    assert_eq!(
        text_content_json(&help)["enabled_actions"],
        json!(["status", "help"])
    );

    cancel_and_drain(service, stderr).await;
}

#[tokio::test]
async fn stdio_can_disable_the_entire_mcp_tool() {
    let (service, stderr) = stdio_client_with_env(&[("UNRAID_RMCP_DISABLED_TOOLS", "*")])
        .await
        .unwrap();

    let tools = service.list_tools(Default::default()).await.unwrap();
    assert!(tools.tools.is_empty());

    let resources = service.list_resources(Default::default()).await.unwrap();
    assert!(
        resources.resources.is_empty(),
        "a fully disabled tool must not advertise its schema resource"
    );

    let error = service
        .read_resource(ReadResourceRequestParams::new("unraid://schema/mcp-tool"))
        .await
        .unwrap_err();
    assert!(
        error.to_string().contains("disabled by server policy"),
        "read_resource error was: {error}"
    );

    let prompts = service.list_prompts(Default::default()).await.unwrap();
    assert!(
        prompts.prompts.is_empty(),
        "a fully disabled tool must not advertise prompts that reference it"
    );

    cancel_and_drain(service, stderr).await;
}

/// The agent plugin's `.mcp.json` passes `""` for both policy env vars by
/// default. Empty MUST behave as unset — the server starts and exposes the
/// full canonical action enum. Breaking this bricks default plugin installs.
#[tokio::test]
async fn stdio_empty_policy_env_vars_expose_the_full_action_enum() {
    let (service, stderr) = stdio_client_with_env(&[
        ("UNRAID_RMCP_ENABLED_TOOLS", ""),
        ("UNRAID_RMCP_DISABLED_TOOLS", ""),
    ])
    .await
    .unwrap();

    let tools = service.list_tools(Default::default()).await.unwrap();
    assert_eq!(tools.tools.len(), 1);
    let tool = serde_json::to_value(&tools.tools[0]).unwrap();
    assert_eq!(
        tool["inputSchema"]["properties"]["action"]["enum"],
        serde_json::to_value(unraid_rmcp::mcp::all_action_names()).unwrap()
    );

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

async fn generated_mutation_outcome(decision: ElicitationDecision) -> (String, usize, usize) {
    let server = dynamic_schema_server().await;
    let temp = TempDir::new().unwrap();
    let endpoint = server.uri();
    let cache = temp.path().join("dynamic-cache.json").display().to_string();
    let calls = Arc::new(AtomicUsize::new(0));
    let client = ElicitingClient::new(decision, calls.clone());
    let env = [
        ("UNRAID_API_URL", endpoint.as_str()),
        ("UNRAID_RMCP_DYNAMIC_ENABLED", "true"),
        ("UNRAID_RMCP_DYNAMIC_SURFACE", "expanded"),
        ("UNRAID_RMCP_DYNAMIC_AUTO_ENABLE_MUTATIONS", "true"),
        ("UNRAID_RMCP_DYNAMIC_CACHE_PATH", cache.as_str()),
        ("UNRAID_RMCP_DYNAMIC_REFRESH_INTERVAL", "24h"),
    ];
    let (service, stderr) = stdio_client_with_handler_and_env(client, &env)
        .await
        .unwrap();
    let result = service
        .call_tool(
            CallToolRequestParams::new("unraid_mutation_vm_start")
                .with_arguments(json!({"id": "vm-1"}).as_object().unwrap().clone()),
        )
        .await;
    let text = match result {
        Ok(result) => text_content(&result),
        Err(error) => error.to_string(),
    };
    let upstream_requests = generated_vm_start_request_count(&server).await;
    let elicitation_calls = calls.load(Ordering::SeqCst);
    cancel_and_drain(service, stderr).await;
    (text, elicitation_calls, upstream_requests)
}

#[tokio::test]
async fn generated_mutation_acceptance_reaches_upstream() {
    let server = dynamic_schema_server().await;
    let temp = TempDir::new().unwrap();
    let endpoint = server.uri();
    let cache = temp.path().join("dynamic-cache.json").display().to_string();
    let calls = Arc::new(AtomicUsize::new(0));
    let client = ElicitingClient::new(ElicitationDecision::Accept, calls.clone());
    let env = [
        ("UNRAID_API_URL", endpoint.as_str()),
        ("UNRAID_RMCP_DYNAMIC_ENABLED", "true"),
        ("UNRAID_RMCP_DYNAMIC_SURFACE", "expanded"),
        ("UNRAID_RMCP_DYNAMIC_AUTO_ENABLE_MUTATIONS", "true"),
        ("UNRAID_RMCP_DYNAMIC_CACHE_PATH", cache.as_str()),
        ("UNRAID_RMCP_DYNAMIC_REFRESH_INTERVAL", "24h"),
    ];
    let (service, stderr) = stdio_client_with_handler_and_env(client, &env)
        .await
        .unwrap();

    let tools = service.list_tools(Default::default()).await.unwrap();
    assert!(
        tools
            .tools
            .iter()
            .any(|tool| tool.name.as_ref() == "unraid_mutation_vm_start")
    );
    let result = service
        .call_tool(
            CallToolRequestParams::new("unraid_mutation_vm_start")
                .with_arguments(json!({"id": "vm-1"}).as_object().unwrap().clone()),
        )
        .await
        .unwrap();

    assert_eq!(calls.load(Ordering::SeqCst), 1);
    assert_eq!(text_content(&result), "true");
    assert_eq!(generated_vm_start_request_count(&server).await, 1);
    cancel_and_drain(service, stderr).await;
}

#[tokio::test]
async fn generated_mutation_decline_stops_before_upstream() {
    let server = dynamic_schema_server().await;
    let temp = TempDir::new().unwrap();
    let endpoint = server.uri();
    let cache = temp.path().join("dynamic-cache.json").display().to_string();
    let calls = Arc::new(AtomicUsize::new(0));
    let client = ElicitingClient::new(ElicitationDecision::Decline, calls.clone());
    let env = [
        ("UNRAID_API_URL", endpoint.as_str()),
        ("UNRAID_RMCP_DYNAMIC_ENABLED", "true"),
        ("UNRAID_RMCP_DYNAMIC_SURFACE", "expanded"),
        ("UNRAID_RMCP_DYNAMIC_AUTO_ENABLE_MUTATIONS", "true"),
        ("UNRAID_RMCP_DYNAMIC_CACHE_PATH", cache.as_str()),
        ("UNRAID_RMCP_DYNAMIC_REFRESH_INTERVAL", "24h"),
    ];
    let (service, stderr) = stdio_client_with_handler_and_env(client, &env)
        .await
        .unwrap();

    let result = service
        .call_tool(
            CallToolRequestParams::new("unraid_mutation_vm_start")
                .with_arguments(json!({"id": "vm-1"}).as_object().unwrap().clone()),
        )
        .await
        .unwrap();
    let text = text_content(&result);

    assert_eq!(calls.load(Ordering::SeqCst), 1);
    assert!(
        text.contains("declined by the user"),
        "unexpected result: {text}"
    );
    assert_eq!(generated_vm_start_request_count(&server).await, 0);
    cancel_and_drain(service, stderr).await;
}

#[tokio::test]
async fn generated_mutation_without_elicitation_capability_stops_before_upstream() {
    let server = dynamic_schema_server().await;
    let temp = TempDir::new().unwrap();
    let endpoint = server.uri();
    let cache = temp.path().join("dynamic-cache.json").display().to_string();
    let env = [
        ("UNRAID_API_URL", endpoint.as_str()),
        ("UNRAID_RMCP_DYNAMIC_ENABLED", "true"),
        ("UNRAID_RMCP_DYNAMIC_SURFACE", "expanded"),
        ("UNRAID_RMCP_DYNAMIC_AUTO_ENABLE_MUTATIONS", "true"),
        ("UNRAID_RMCP_DYNAMIC_CACHE_PATH", cache.as_str()),
        ("UNRAID_RMCP_DYNAMIC_REFRESH_INTERVAL", "24h"),
    ];
    let (service, stderr) = stdio_client_with_env(&env).await.unwrap();

    let result = service
        .call_tool(
            CallToolRequestParams::new("unraid_mutation_vm_start")
                .with_arguments(json!({"id": "vm-1"}).as_object().unwrap().clone()),
        )
        .await
        .unwrap();
    let text = text_content(&result);

    assert!(
        text.contains("requires MCP form elicitation"),
        "unexpected result: {text}"
    );
    assert_eq!(generated_vm_start_request_count(&server).await, 0);
    cancel_and_drain(service, stderr).await;
}

#[tokio::test]
async fn dynamic_refresh_sends_tool_list_changed_and_updates_tools() {
    let server = changing_dynamic_schema_server().await;
    let temp = TempDir::new().unwrap();
    let endpoint = server.uri();
    let cache = temp.path().join("dynamic-cache.json").display().to_string();
    let changes = Arc::new(AtomicUsize::new(0));
    let client = ToolChangeClient {
        changes: changes.clone(),
    };
    let env = [
        ("UNRAID_API_URL", endpoint.as_str()),
        ("UNRAID_RMCP_DYNAMIC_ENABLED", "true"),
        ("UNRAID_RMCP_DYNAMIC_SURFACE", "expanded"),
        ("UNRAID_RMCP_DYNAMIC_CACHE_PATH", cache.as_str()),
        ("UNRAID_RMCP_DYNAMIC_REFRESH_INTERVAL", "1s"),
    ];
    let (service, stderr) = stdio_client_with_handler_and_env(client, &env)
        .await
        .unwrap();

    let initial = service.list_tools(Default::default()).await.unwrap();
    assert!(
        !initial
            .tools
            .iter()
            .any(|tool| tool.name.as_ref() == "unraid_query_ready")
    );

    tokio::time::timeout(std::time::Duration::from_secs(8), async {
        while changes.load(Ordering::SeqCst) == 0 {
            tokio::time::sleep(std::time::Duration::from_millis(100)).await;
        }
    })
    .await
    .expect("timed out waiting for notifications/tools/list_changed");

    let refreshed = service.list_tools(Default::default()).await.unwrap();
    assert!(
        refreshed
            .tools
            .iter()
            .any(|tool| tool.name.as_ref() == "unraid_query_ready")
    );
    assert!(changes.load(Ordering::SeqCst) >= 1);
    cancel_and_drain(service, stderr).await;
}

#[tokio::test]
async fn dynamic_hybrid_rollout_keeps_legacy_and_adds_generated_tools() {
    let server = dynamic_schema_server().await;
    let temp = TempDir::new().unwrap();
    let endpoint = server.uri();
    let cache = temp.path().join("dynamic-cache.json").display().to_string();
    let env = [
        ("UNRAID_API_URL", endpoint.as_str()),
        ("UNRAID_RMCP_DYNAMIC_ENABLED", "true"),
        ("UNRAID_RMCP_DYNAMIC_SURFACE", "hybrid"),
        ("UNRAID_RMCP_DYNAMIC_CACHE_PATH", cache.as_str()),
        ("UNRAID_RMCP_DYNAMIC_REFRESH_INTERVAL", "24h"),
    ];
    let (service, stderr) = stdio_client_with_env(&env).await.unwrap();

    let tools = service.list_tools(Default::default()).await.unwrap();
    let names = tools
        .tools
        .iter()
        .map(|tool| tool.name.as_ref())
        .collect::<Vec<_>>();
    assert!(names.contains(&"unraid"));
    assert!(names.contains(&"unraid_query_disk"));
    assert!(names.contains(&"unraid_query_ping"));

    let status = service
        .call_tool(
            CallToolRequestParams::new("unraid")
                .with_arguments(json!({"action": "status"}).as_object().unwrap().clone()),
        )
        .await
        .unwrap();
    assert_eq!(text_content_json(&status)["status"], "ok");
    cancel_and_drain(service, stderr).await;
}

#[tokio::test]
async fn dynamic_legacy_surface_is_a_configuration_only_rollback() {
    let server = dynamic_schema_server().await;
    let temp = TempDir::new().unwrap();
    let endpoint = server.uri();
    let cache = temp.path().join("dynamic-cache.json").display().to_string();
    let env = [
        ("UNRAID_API_URL", endpoint.as_str()),
        ("UNRAID_RMCP_DYNAMIC_ENABLED", "true"),
        ("UNRAID_RMCP_DYNAMIC_SURFACE", "legacy"),
        ("UNRAID_RMCP_DYNAMIC_CACHE_PATH", cache.as_str()),
        ("UNRAID_RMCP_DYNAMIC_REFRESH_INTERVAL", "24h"),
    ];
    let (service, stderr) = stdio_client_with_env(&env).await.unwrap();

    let tools = service.list_tools(Default::default()).await.unwrap();
    let names = tools
        .tools
        .iter()
        .map(|tool| tool.name.as_ref())
        .collect::<Vec<_>>();
    assert_eq!(names, vec!["unraid"]);

    let status = service
        .call_tool(
            CallToolRequestParams::new("unraid")
                .with_arguments(json!({"action": "status"}).as_object().unwrap().clone()),
        )
        .await
        .unwrap();
    assert_eq!(text_content_json(&status)["status"], "ok");
    cancel_and_drain(service, stderr).await;
}

#[tokio::test]
async fn generated_mutation_all_other_non_approval_outcomes_stop_before_upstream() {
    for decision in [
        ElicitationDecision::Cancel,
        ElicitationDecision::FalseApproval,
        ElicitationDecision::MalformedApproval,
    ] {
        let (text, elicitation_calls, upstream_requests) =
            generated_mutation_outcome(decision).await;
        assert_eq!(elicitation_calls, 1, "{decision:?}");
        assert_eq!(upstream_requests, 0, "{decision:?}: {text}");
        assert_ne!(text, "true", "{decision:?}");
    }
}
