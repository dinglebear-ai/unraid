use std::{borrow::Cow, sync::Arc, time::Instant};

use lab_auth::AuthContext;
use rmcp::{
    model::{
        CallToolRequestParams, CallToolResult, Content, GetPromptRequestParams, GetPromptResult,
        Implementation, ListPromptsResult, ListResourcesResult, ListToolsResult,
        PaginatedRequestParams, RawResource, ReadResourceRequestParams, ReadResourceResult,
        Resource, ResourceContents, ServerCapabilities, ServerInfo, Tool,
    },
    service::RequestContext,
    transport::streamable_http_server::{
        session::local::LocalSessionManager, StreamableHttpServerConfig, StreamableHttpService,
    },
    ErrorData, RoleServer, ServerHandler,
};
use serde_json::{Map, Value};

use crate::config::McpConfig;

use super::{
    host_filter::{allowed_hosts, allowed_origins},
    prompts,
    schemas::{tool_definitions, ACTIONS},
    tools::{execute_tool, serialize_response},
    AppState, AuthPolicy,
};

const READ_SCOPE: &str = "unraid:read";
const WRITE_SCOPE: &str = "unraid:admin";
const DENY_SCOPE: &str = "unraid:__deny__";

#[derive(Clone)]
pub struct UnraidRmcpServer {
    state: AppState,
}

pub fn rmcp_server(state: AppState) -> UnraidRmcpServer {
    UnraidRmcpServer { state }
}

impl ServerHandler for UnraidRmcpServer {
    // ── tools ─────────────────────────────────────────────────────────────────

    async fn list_tools(
        &self,
        _request: Option<PaginatedRequestParams>,
        context: RequestContext<RoleServer>,
    ) -> Result<ListToolsResult, ErrorData> {
        require_auth_context(&self.state, &context)?;
        let tools = rmcp_tool_definitions()?;
        tracing::info!(tool_count = tools.len(), "MCP tools listed");
        Ok(ListToolsResult {
            tools,
            ..Default::default()
        })
    }

    async fn call_tool(
        &self,
        request: CallToolRequestParams,
        context: RequestContext<RoleServer>,
    ) -> Result<CallToolResult, ErrorData> {
        let tool_name = request.name.to_string();

        let action: String = request
            .arguments
            .as_ref()
            .and_then(|m| m.get("action"))
            .and_then(Value::as_str)
            .unwrap_or("")
            .to_owned();

        let auth = require_auth_context(&self.state, &context)?;
        if let (Some(auth), Some(required_scope)) = (auth, required_scope_for(&action)) {
            check_scope(auth, required_scope, &action)?;
        }

        let arguments = request
            .arguments
            .map(Value::Object)
            .unwrap_or_else(|| Value::Object(Map::new()));
        let started = Instant::now();
        // Count every tool call exactly once at the MCP boundary (see the note in
        // `tools::dispatch`). Covers pre-dispatch validation and serialization errors.
        self.state.counters.inc_requests();
        tracing::info!(tool = %tool_name, action = %action, "MCP tool execution started");

        // All errors become agent-readable CallToolResult::error — never Err(ErrorData).
        // This keeps the MCP session alive even when the upstream Unraid API is down.
        match execute_tool(&self.state, &tool_name, arguments).await {
            Ok(result) => {
                let elapsed = started.elapsed().as_millis();
                tracing::info!(tool = %tool_name, elapsed_ms = elapsed, "MCP tool execution completed");
                match serialize_response(result) {
                    Ok(text) => Ok(CallToolResult::success(vec![Content::text(text)])),
                    Err(e) => {
                        self.state.counters.inc_errors();
                        Ok(CallToolResult::error(vec![Content::text(format!(
                            "ERROR: serialization failed\nReason: {e}"
                        ))]))
                    }
                }
            }
            Err(error) => {
                let elapsed = started.elapsed().as_millis();
                self.state.counters.inc_errors();
                // Route on the typed variant, never on message prose: an
                // agent-correctable input mistake becomes a protocol-level
                // `invalid_params` error; every other failure (upstream
                // unreachable/auth/other, internal) stays an in-band tool error so
                // the MCP session survives upstream outages.
                let msg = error.to_string();
                if error.is_invalid_params() {
                    tracing::warn!(tool = %tool_name, elapsed_ms = elapsed, "MCP tool rejected invalid params");
                    Err(ErrorData::invalid_params(msg, None))
                } else {
                    tracing::error!(tool = %tool_name, elapsed_ms = elapsed, error = %msg, "MCP tool execution failed");
                    Ok(CallToolResult::error(vec![Content::text(msg)]))
                }
            }
        }
    }

    // ── resources ─────────────────────────────────────────────────────────────

    async fn list_resources(
        &self,
        _request: Option<PaginatedRequestParams>,
        context: RequestContext<RoleServer>,
    ) -> Result<ListResourcesResult, ErrorData> {
        require_auth_context(&self.state, &context)?;
        Ok(ListResourcesResult {
            resources: vec![schema_resource()],
            ..Default::default()
        })
    }

    async fn read_resource(
        &self,
        request: ReadResourceRequestParams,
        context: RequestContext<RoleServer>,
    ) -> Result<ReadResourceResult, ErrorData> {
        require_auth_context(&self.state, &context)?;
        if request.uri != SCHEMA_RESOURCE_URI {
            return Err(ErrorData::invalid_params(
                format!("unknown resource: {}", request.uri),
                None,
            ));
        }
        let schema = tool_definitions();
        let text = serde_json::to_string_pretty(&schema)
            .map_err(|e| ErrorData::internal_error(format!("serialization error: {e}"), None))?;
        Ok(ReadResourceResult::new(vec![ResourceContents::text(
            text,
            SCHEMA_RESOURCE_URI,
        )
        .with_mime_type("application/json")]))
    }

    // ── prompts ───────────────────────────────────────────────────────────────

    async fn list_prompts(
        &self,
        _request: Option<PaginatedRequestParams>,
        context: RequestContext<RoleServer>,
    ) -> Result<ListPromptsResult, ErrorData> {
        require_auth_context(&self.state, &context)?;
        Ok(prompts::list_prompts())
    }

    async fn get_prompt(
        &self,
        request: GetPromptRequestParams,
        context: RequestContext<RoleServer>,
    ) -> Result<GetPromptResult, ErrorData> {
        require_auth_context(&self.state, &context)?;
        prompts::get_prompt(request).map_err(|e| ErrorData::invalid_params(e.to_string(), None))
    }

    // ── server info ───────────────────────────────────────────────────────────

    fn get_info(&self) -> ServerInfo {
        ServerInfo::new(
            ServerCapabilities::builder()
                .enable_tools()
                .enable_resources()
                .enable_prompts()
                .build(),
        )
        .with_server_info(Implementation::new(
            self.state.config.server_name.clone(),
            env!("CARGO_PKG_VERSION"),
        ))
    }
}

// ── transport helpers ─────────────────────────────────────────────────────────

pub fn streamable_http_config(config: &McpConfig) -> StreamableHttpServerConfig {
    StreamableHttpServerConfig::default()
        .with_stateful_mode(false)
        .with_json_response(true)
        .with_allowed_hosts(allowed_hosts(config))
        .with_allowed_origins(allowed_origins(config))
}

pub fn streamable_http_service(
    state: AppState,
    config: StreamableHttpServerConfig,
) -> StreamableHttpService<UnraidRmcpServer, LocalSessionManager> {
    StreamableHttpService::new(
        move || {
            Ok(UnraidRmcpServer {
                state: state.clone(),
            })
        },
        Default::default(),
        config,
    )
}

// ── resource definitions ──────────────────────────────────────────────────────

const SCHEMA_RESOURCE_URI: &str = "unraid://schema/mcp-tool";

fn schema_resource() -> Resource {
    Resource::new(
        RawResource::new(SCHEMA_RESOURCE_URI, "unraid tool schema")
            .with_description("JSON schema for the unraid MCP tool and its action-based parameters")
            .with_mime_type("application/json"),
        None,
    )
}

// ── tool definition conversion ────────────────────────────────────────────────

fn rmcp_tool_definitions() -> Result<Vec<Tool>, ErrorData> {
    tool_definitions()
        .into_iter()
        .map(rmcp_tool_from_json)
        .collect()
}

fn rmcp_tool_from_json(value: Value) -> Result<Tool, ErrorData> {
    let name = value
        .get("name")
        .and_then(Value::as_str)
        .ok_or_else(|| ErrorData::internal_error("tool definition missing name", None))?;
    let description = value
        .get("description")
        .and_then(Value::as_str)
        .map(|d| Cow::Owned(d.to_string()));
    let input_schema = value
        .get("inputSchema")
        .and_then(Value::as_object)
        .cloned()
        .ok_or_else(|| ErrorData::internal_error("tool definition missing inputSchema", None))?;
    Ok(Tool::new_with_raw(
        Cow::Owned(name.to_string()),
        description,
        Arc::new(input_schema),
    ))
}

// ── auth helpers ──────────────────────────────────────────────────────────────

fn require_auth_context<'a>(
    state: &AppState,
    ctx: &'a RequestContext<RoleServer>,
) -> Result<Option<&'a AuthContext>, ErrorData> {
    match &state.auth_policy {
        AuthPolicy::LoopbackDev => Ok(None),
        AuthPolicy::Mounted { .. } => {
            let parts = ctx
                .extensions
                .get::<axum::http::request::Parts>()
                .ok_or_else(|| {
                    tracing::error!(
                        "rmcp HTTP Parts extension absent — middleware ordering may be broken"
                    );
                    ErrorData::invalid_request("forbidden: missing http context", None)
                })?;
            let auth = parts.extensions.get::<AuthContext>().ok_or_else(|| {
                tracing::warn!("AuthContext absent — AuthLayer may not be mounted");
                ErrorData::invalid_request("forbidden: missing auth context", None)
            })?;
            Ok(Some(auth))
        }
    }
}

fn check_scope(auth: &AuthContext, required_scope: &str, action: &str) -> Result<(), ErrorData> {
    let satisfied = auth
        .scopes
        .iter()
        .any(|s| s == required_scope || (required_scope == READ_SCOPE && s == "unraid:admin"));
    if satisfied {
        return Ok(());
    }
    tracing::warn!(
        subject = %auth.sub,
        action = %action,
        required_scope = %required_scope,
        "MCP tool denied: insufficient scope"
    );
    Err(ErrorData::invalid_request(
        format!("forbidden: requires scope: {required_scope}"),
        None,
    ))
}

/// Map an action to its required scope, driven entirely off the canonical
/// [`ACTIONS`] list in `schemas.rs`:
/// - a read-only action (every action except `help`) requires [`READ_SCOPE`];
/// - `help` (the one non-read-only spec) requires no scope;
/// - any action not in the canonical list falls through to [`DENY_SCOPE`],
///   which no caller can hold, so an unmapped action is unreachable.
fn required_scope_for(action: &str) -> Option<&'static str> {
    use crate::mcp::schemas::Scope;
    match ACTIONS.iter().find(|a| a.name == action) {
        Some(spec) => match spec.scope {
            Scope::None => None,               // `help`
            Scope::Read => Some(READ_SCOPE),   // query actions + `status`
            Scope::Write => Some(WRITE_SCOPE), // mutating actions
        },
        None => Some(DENY_SCOPE),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Scope gating is derived from the single canonical [`ACTIONS`] list:
    /// read specs map to `unraid:read`, write (mutating) specs to `unraid:admin`,
    /// `help` to no scope, and an unknown action to the deny sentinel.
    #[test]
    fn required_scope_tracks_canonical_list() {
        use crate::mcp::schemas::Scope;
        for spec in ACTIONS {
            let got = required_scope_for(spec.name);
            let want = match spec.scope {
                Scope::None => None,
                Scope::Read => Some(READ_SCOPE),
                Scope::Write => Some(WRITE_SCOPE),
            };
            assert_eq!(got, want, "{} scope mapping", spec.name);
        }
    }

    #[test]
    fn help_requires_no_scope() {
        assert_eq!(required_scope_for("help"), None);
    }

    #[test]
    fn unknown_action_falls_to_deny_sentinel() {
        assert_eq!(
            required_scope_for("definitely_not_an_action"),
            Some(DENY_SCOPE)
        );
    }
}
