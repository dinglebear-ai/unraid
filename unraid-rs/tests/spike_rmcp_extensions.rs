// Regression test: verifies rmcp 1.6 axum-extension propagation (syslog-mcp-brt0.10).
// See docs/internal/rmcp-auth-spike.md for the investigation that confirmed Pattern (a).
//
// Proves that axum request extensions set by middleware ARE propagated into
// rmcp 1.6's `RequestContext.extensions` for tool handlers, when using
// `transport-streamable-http-server`. This is the empirical verification for
// the syslog-mcp-brt0.10 spike.
//
// rmcp 1.6 publishes `http::request::Parts` into the JSON-RPC request's
// extensions before dispatching. Any axum middleware that calls
// `request.extensions_mut().insert(value)` upstream of the rmcp
// `StreamableHttpService` will be visible inside a tool handler via:
//
//     let parts = ctx.extensions.get::<http::request::Parts>().unwrap();
//     let value = parts.extensions.get::<AuthContext>().unwrap();
//
// This works in BOTH `stateful_mode(true)` and `stateful_mode(false)`. The
// current syslog-mcp deployment uses stateful_mode(false); no flip required.
//
// See `docs/internal/rmcp-auth-spike.md` for full write-up.

use std::sync::{Arc, Mutex};

use axum::{
    body::{to_bytes, Body},
    extract::Request,
    http::{header, StatusCode},
    middleware::{self, Next},
    response::Response,
    Router,
};
use rmcp::{
    model::{
        CallToolRequestParams, CallToolResult, Content, ListToolsResult, PaginatedRequestParams,
        ServerCapabilities, ServerInfo, Tool,
    },
    service::RequestContext,
    transport::streamable_http_server::{
        session::local::LocalSessionManager, StreamableHttpServerConfig, StreamableHttpService,
    },
    ErrorData, RoleServer, ServerHandler,
};
use tower::util::ServiceExt;

const ACCEPT_STREAMABLE_HTTP: &str = "application/json, text/event-stream";

/// The "auth context" the middleware injects and the tool reads.
/// Stand-in for the real AuthContext that lab-auth will provide in S5.
#[derive(Clone, Debug, PartialEq, Eq)]
struct AuthContext {
    subject: String,
    scopes: Vec<String>,
}

const EXPECTED_SUBJECT: &str = "spike-user@example.com";

/// What the tool handler observed for the most recent call. Lets us assert
/// from the test that propagation worked end-to-end.
#[derive(Clone, Default)]
struct Observed(Arc<Mutex<Option<AuthContext>>>);

#[derive(Clone)]
struct SpikeServer {
    observed: Observed,
}

impl ServerHandler for SpikeServer {
    async fn list_tools(
        &self,
        _request: Option<PaginatedRequestParams>,
        _context: RequestContext<RoleServer>,
    ) -> Result<ListToolsResult, ErrorData> {
        let schema = serde_json::json!({"type": "object", "properties": {}})
            .as_object()
            .unwrap()
            .clone();
        Ok(ListToolsResult {
            tools: vec![Tool::new_with_raw(
                std::borrow::Cow::Borrowed("whoami"),
                Some(std::borrow::Cow::Borrowed("returns observed AuthContext")),
                Arc::new(schema),
            )],
            ..Default::default()
        })
    }

    async fn call_tool(
        &self,
        _request: CallToolRequestParams,
        context: RequestContext<RoleServer>,
    ) -> Result<CallToolResult, ErrorData> {
        // Pattern (a): rmcp injects http::request::Parts into request extensions.
        // Axum middleware extensions live inside Parts.extensions.
        let parts = context
            .extensions
            .get::<axum::http::request::Parts>()
            .ok_or_else(|| {
                ErrorData::internal_error(
                    "no http::request::Parts in RequestContext.extensions",
                    None,
                )
            })?;
        let auth = parts
            .extensions
            .get::<AuthContext>()
            .cloned()
            .ok_or_else(|| ErrorData::internal_error("no AuthContext in Parts.extensions", None))?;

        *self.observed.0.lock().unwrap() = Some(auth.clone());

        Ok(CallToolResult::success(vec![Content::text(format!(
            "subject={} scopes={:?}",
            auth.subject, auth.scopes
        ))]))
    }

    fn get_info(&self) -> ServerInfo {
        ServerInfo::new(ServerCapabilities::builder().enable_tools().build())
    }
}

async fn auth_middleware(mut req: Request, next: Next) -> Response {
    // Real impl would parse Authorization header / verify JWT. For the spike,
    // any non-None value confirms propagation works.
    req.extensions_mut().insert(AuthContext {
        subject: EXPECTED_SUBJECT.to_string(),
        scopes: vec!["unraid:read".to_string(), "unraid:admin".to_string()],
    });
    next.run(req).await
}

fn build_router(observed: Observed, stateful: bool) -> Router {
    let config = StreamableHttpServerConfig::default()
        .with_stateful_mode(stateful)
        .with_json_response(true)
        .with_sse_keep_alive(None);

    let server = SpikeServer { observed };
    let service: StreamableHttpService<SpikeServer, LocalSessionManager> =
        StreamableHttpService::new(move || Ok(server.clone()), Default::default(), config);

    Router::new()
        .nest_service("/mcp", service)
        .layer(middleware::from_fn(auth_middleware))
}

async fn post_json(
    router: Router,
    body: &str,
    session_id: Option<&str>,
) -> (StatusCode, axum::http::HeaderMap, String) {
    let mut builder = axum::http::Request::builder()
        .method("POST")
        .uri("/mcp")
        .header(header::HOST, "localhost")
        .header(header::CONTENT_TYPE, "application/json")
        .header(header::ACCEPT, ACCEPT_STREAMABLE_HTTP);
    if let Some(sid) = session_id {
        builder = builder.header("Mcp-Session-Id", sid);
    }
    let request = builder.body(Body::from(body.to_string())).unwrap();
    let response = router.oneshot(request).await.unwrap();
    let status = response.status();
    let headers = response.headers().clone();
    let body = String::from_utf8(
        to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap()
            .to_vec(),
    )
    .unwrap();
    (status, headers, body)
}

const INIT_BODY: &str = r#"{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"spike","version":"1.0"}}}"#;
const CALL_BODY: &str =
    r#"{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"whoami","arguments":{}}}"#;

#[tokio::test]
async fn axum_extension_propagates_into_tool_handler_stateless() {
    // Mirrors syslog-mcp's current production setup: stateful_mode=false,
    // json_response=true. This is the case that matters most.
    let observed = Observed::default();
    let router = build_router(observed.clone(), false);

    // In stateless mode each request is independent — no init handshake needed
    // before tool calls. Send tools/call directly.
    let (status, _headers, body) = post_json(router, CALL_BODY, None).await;

    assert_eq!(status, StatusCode::OK, "body: {body}");

    let seen = observed.0.lock().unwrap().clone();
    assert_eq!(
        seen,
        Some(AuthContext {
            subject: EXPECTED_SUBJECT.to_string(),
            scopes: vec!["unraid:read".to_string(), "unraid:admin".to_string()],
        }),
        "tool handler did not observe the AuthContext set by middleware (body={body})",
    );
}

#[tokio::test]
async fn axum_extension_propagates_into_tool_handler_stateful() {
    // Verifies the same pattern works under stateful_mode=true (lab's current
    // setup). Useful to lock in cross-mode behaviour for future work.
    let observed = Observed::default();
    let router = build_router(observed.clone(), true);

    // Initialize first to obtain session id.
    let (init_status, init_headers, init_body) = post_json(router.clone(), INIT_BODY, None).await;
    assert_eq!(init_status, StatusCode::OK, "init body: {init_body}");
    let session_id = init_headers
        .get("mcp-session-id")
        .expect("stateful mode must return Mcp-Session-Id")
        .to_str()
        .unwrap()
        .to_string();

    let (status, _headers, body) = post_json(router, CALL_BODY, Some(&session_id)).await;
    assert_eq!(status, StatusCode::OK, "body: {body}");

    let seen = observed.0.lock().unwrap().clone();
    assert_eq!(
        seen,
        Some(AuthContext {
            subject: EXPECTED_SUBJECT.to_string(),
            scopes: vec!["unraid:read".to_string(), "unraid:admin".to_string()],
        }),
        "tool handler did not observe the AuthContext set by middleware (body={body})",
    );
}
