use std::{borrow::Cow, sync::Arc, time::Instant};

use lab_auth::AuthContext;
use rmcp::{
    ErrorData, RoleServer, ServerHandler,
    model::{
        CallToolRequestParams, CallToolResponse, CallToolResult, ContentBlock,
        GetPromptRequestParams, GetPromptResponse, Implementation, ListPromptsResult,
        ListResourcesResult, ListToolsResult, PaginatedRequestParams, ReadResourceRequestParams,
        ReadResourceResponse, ReadResourceResult, Resource, ResourceContents, ServerCapabilities,
        ServerInfo, Tool,
    },
    service::RequestContext,
    transport::streamable_http_server::{
        StreamableHttpServerConfig, StreamableHttpService, session::local::LocalSessionManager,
    },
};
use serde_json::{Map, Value};

use crate::config::McpConfig;

use super::{
    AppState, AuthPolicy,
    dynamic::{
        config::DynamicSurface,
        execute::{ExecutionError, execute_dynamic_operation_after_authorization},
        models::RequiredScope,
        surface::render_tools,
    },
    elicitation::{require_destructive_elicitation, require_dynamic_mutation_elicitation},
    host_filter::{allowed_hosts, allowed_origins},
    prompts,
    schemas::{ACTIONS, tool_definitions},
    tool_filter::{enabled_action_names, ensure_tool_call_enabled, tool_is_enabled},
    tools::{execute_tool, serialize_response},
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
        request: Option<PaginatedRequestParams>,
        context: RequestContext<RoleServer>,
    ) -> Result<ListToolsResult, ErrorData> {
        require_auth_context(&self.state, &context)?;
        if let Some(runtime) = &self.state.dynamic {
            runtime.register_peer(context.peer.clone()).await;
        }

        let surface = self
            .state
            .dynamic
            .as_ref()
            .map(|runtime| runtime.config.surface)
            .unwrap_or(DynamicSurface::Legacy);
        let mut tools = Vec::new();
        if matches!(surface, DynamicSurface::Legacy | DynamicSurface::Hybrid) {
            let action_names = enabled_action_names(&self.state.config.tools);
            tools.extend(rmcp_tool_definitions(&action_names)?);
        }
        if matches!(surface, DynamicSurface::Expanded | DynamicSurface::Hybrid)
            && let Some(runtime) = &self.state.dynamic
        {
            tools.extend(render_tools(&runtime.catalogs.load()));
        }
        let (tools, next_cursor) = paginate_tools(tools, request)?;
        tracing::info!(tool_count = tools.len(), "MCP tools listed");
        Ok(ListToolsResult {
            tools,
            next_cursor,
            ..Default::default()
        })
    }

    async fn call_tool(
        &self,
        request: CallToolRequestParams,
        context: RequestContext<RoleServer>,
    ) -> Result<CallToolResponse, ErrorData> {
        let tool_name = request.name.to_string();
        if let Some(runtime) = &self.state.dynamic {
            runtime.register_peer(context.peer.clone()).await;
        }
        let auth = require_auth_context(&self.state, &context)?;

        if let Some(runtime) = &self.state.dynamic
            && matches!(
                runtime.config.surface,
                DynamicSurface::Expanded | DynamicSurface::Hybrid
            )
        {
            let catalog = runtime.catalogs.load();
            let generated_name = super::dynamic::types::ToolName::new(&tool_name).ok();
            if let Some(operation) = generated_name
                .as_ref()
                .and_then(|name| catalog.by_tool_name.get(name))
                .cloned()
            {
                if let Some(auth) = auth {
                    let required_scope = match operation.scope {
                        RequiredScope::Read => READ_SCOPE,
                        RequiredScope::Admin => WRITE_SCOPE,
                    };
                    check_scope(auth, required_scope, &operation.path.to_string())?;
                }
                let arguments = request.arguments.unwrap_or_default();
                let arguments_value = Value::Object(arguments.clone());
                let started = Instant::now();
                self.state.counters.inc_requests();
                tracing::info!(
                    tool = %tool_name,
                    operation = %operation.path,
                    "generated MCP tool execution started"
                );

                if let Err(message) = require_dynamic_mutation_elicitation(
                    &context.peer,
                    &operation,
                    &arguments_value,
                )
                .await
                {
                    self.state.counters.inc_errors();
                    tracing::warn!(
                        tool = %tool_name,
                        operation = %operation.path,
                        elapsed_ms = started.elapsed().as_millis(),
                        reason = %message,
                        "generated mutation stopped by elicitation"
                    );
                    return Ok(CallToolResult::error(vec![ContentBlock::text(message)]).into());
                }

                return match execute_dynamic_operation_after_authorization(
                    &self.state.service,
                    &catalog,
                    &operation,
                    arguments,
                    &runtime.config,
                )
                .await
                {
                    Ok(result) => {
                        tracing::info!(
                            tool = %tool_name,
                            operation = %operation.path,
                            elapsed_ms = started.elapsed().as_millis(),
                            "generated MCP tool execution completed"
                        );
                        Ok(CallToolResult::structured(result).into())
                    }
                    Err(error @ (ExecutionError::Validation(_) | ExecutionError::Document(_))) => {
                        self.state.counters.inc_errors();
                        Err(ErrorData::invalid_params(error.to_string(), None))
                    }
                    Err(error @ ExecutionError::Upstream(_)) => {
                        self.state.counters.inc_errors();
                        tracing::error!(
                            tool = %tool_name,
                            operation = %operation.path,
                            elapsed_ms = started.elapsed().as_millis(),
                            error = %error,
                            "generated MCP tool execution failed"
                        );
                        Ok(
                            CallToolResult::error(vec![ContentBlock::text(error.to_string())])
                                .into(),
                        )
                    }
                };
            }
        }

        let action: String = request
            .arguments
            .as_ref()
            .and_then(|arguments| arguments.get("action"))
            .and_then(Value::as_str)
            .unwrap_or("")
            .to_owned();
        if let Err(message) =
            ensure_tool_call_enabled(&self.state.config.tools, &tool_name, &action)
        {
            tracing::warn!(tool = %tool_name, action = %action, reason = %message, "MCP tool denied by server policy");
            return Err(ErrorData::invalid_request(message, None));
        }
        if let (Some(auth), Some(required_scope)) = (auth, required_scope_for(&action)) {
            check_scope(auth, required_scope, &action)?;
        }

        let arguments = request
            .arguments
            .map(Value::Object)
            .unwrap_or_else(|| Value::Object(Map::new()));
        let started = Instant::now();
        self.state.counters.inc_requests();
        tracing::info!(tool = %tool_name, action = %action, "MCP tool execution started");

        if let Err(message) =
            require_destructive_elicitation(&context.peer, &action, &arguments).await
        {
            self.state.counters.inc_errors();
            tracing::warn!(
                tool = %tool_name,
                action = %action,
                elapsed_ms = started.elapsed().as_millis(),
                reason = %message,
                "MCP destructive action stopped by elicitation"
            );
            return Ok(CallToolResult::error(vec![ContentBlock::text(message)]).into());
        }

        match execute_tool(&self.state, &tool_name, arguments).await {
            Ok(result) => {
                tracing::info!(
                    tool = %tool_name,
                    elapsed_ms = started.elapsed().as_millis(),
                    "MCP tool execution completed"
                );
                match serialize_response(result) {
                    Ok(text) => Ok(CallToolResult::success(vec![ContentBlock::text(text)]).into()),
                    Err(error) => {
                        self.state.counters.inc_errors();
                        Ok(CallToolResult::error(vec![ContentBlock::text(format!(
                            "ERROR: serialization failed\nReason: {error}"
                        ))])
                        .into())
                    }
                }
            }
            Err(error) => {
                self.state.counters.inc_errors();
                let message = error.to_string();
                if error.is_invalid_params() {
                    tracing::warn!(tool = %tool_name, elapsed_ms = started.elapsed().as_millis(), "MCP tool rejected invalid params");
                    Err(ErrorData::invalid_params(message, None))
                } else {
                    tracing::error!(tool = %tool_name, elapsed_ms = started.elapsed().as_millis(), error = %message, "MCP tool execution failed");
                    Ok(CallToolResult::error(vec![ContentBlock::text(message)]).into())
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
        let resources = if tool_is_enabled(&self.state.config.tools) {
            vec![schema_resource()]
        } else {
            Vec::new()
        };
        Ok(ListResourcesResult {
            resources,
            ..Default::default()
        })
    }

    async fn read_resource(
        &self,
        request: ReadResourceRequestParams,
        context: RequestContext<RoleServer>,
    ) -> Result<ReadResourceResponse, ErrorData> {
        require_auth_context(&self.state, &context)?;
        if request.uri != SCHEMA_RESOURCE_URI {
            return Err(ErrorData::invalid_params(
                format!("unknown resource: {}", request.uri),
                None,
            ));
        }
        if !tool_is_enabled(&self.state.config.tools) {
            return Err(ErrorData::invalid_request(
                "unraid MCP tool is disabled by server policy",
                None,
            ));
        }
        let action_names = enabled_action_names(&self.state.config.tools);
        let schema = tool_definitions(&action_names);
        let text = serde_json::to_string_pretty(&schema)
            .map_err(|e| ErrorData::internal_error(format!("serialization error: {e}"), None))?;
        Ok(ReadResourceResult::new(vec![
            ResourceContents::text(text, SCHEMA_RESOURCE_URI).with_mime_type("application/json"),
        ])
        .into())
    }

    // ── prompts ───────────────────────────────────────────────────────────────

    async fn list_prompts(
        &self,
        _request: Option<PaginatedRequestParams>,
        context: RequestContext<RoleServer>,
    ) -> Result<ListPromptsResult, ErrorData> {
        require_auth_context(&self.state, &context)?;
        // Every prompt instructs the client to call the unraid tool, so a fully
        // disabled tool must not advertise prompts that reference it.
        if !tool_is_enabled(&self.state.config.tools) {
            return Ok(ListPromptsResult::default());
        }
        Ok(prompts::list_prompts())
    }

    async fn get_prompt(
        &self,
        request: GetPromptRequestParams,
        context: RequestContext<RoleServer>,
    ) -> Result<GetPromptResponse, ErrorData> {
        require_auth_context(&self.state, &context)?;
        if !tool_is_enabled(&self.state.config.tools) {
            return Err(ErrorData::invalid_request(
                "unraid MCP tool is disabled by server policy",
                None,
            ));
        }
        prompts::get_prompt(request)
            .map(Into::into)
            .map_err(|e| ErrorData::invalid_params(e.to_string(), None))
    }

    // ── server info ───────────────────────────────────────────────────────────

    fn get_info(&self) -> ServerInfo {
        ServerInfo::new(
            ServerCapabilities::builder()
                .enable_tools()
                .enable_tool_list_changed()
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

const TOOL_PAGE_SIZE: usize = 100;

fn paginate_tools(
    tools: Vec<Tool>,
    request: Option<PaginatedRequestParams>,
) -> Result<(Vec<Tool>, Option<String>), ErrorData> {
    let start = request
        .and_then(|request| request.cursor)
        .map(|cursor| {
            cursor.parse::<usize>().map_err(|_| {
                ErrorData::invalid_params(format!("invalid tools cursor: {cursor}"), None)
            })
        })
        .transpose()?
        .unwrap_or(0);
    if start > tools.len() {
        return Err(ErrorData::invalid_params(
            format!("tools cursor {start} is beyond the catalog"),
            None,
        ));
    }
    let end = start.saturating_add(TOOL_PAGE_SIZE).min(tools.len());
    let next_cursor = (end < tools.len()).then(|| end.to_string());
    Ok((tools[start..end].to_vec(), next_cursor))
}

// ── transport helpers ─────────────────────────────────────────────────────────

pub fn streamable_http_config(config: &McpConfig) -> StreamableHttpServerConfig {
    StreamableHttpServerConfig::default()
        .with_legacy_session_mode(false)
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
    Resource::new(SCHEMA_RESOURCE_URI, "unraid tool schema")
        .with_description("JSON schema for the unraid MCP tool and its action-based parameters")
        .with_mime_type("application/json")
}

// ── tool definition conversion ────────────────────────────────────────────────

fn rmcp_tool_definitions(action_names: &[&str]) -> Result<Vec<Tool>, ErrorData> {
    if action_names.is_empty() {
        return Ok(Vec::new());
    }
    tool_definitions(action_names)
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
    fn empty_action_set_hides_the_tool() {
        assert!(rmcp_tool_definitions(&[]).unwrap().is_empty());
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

    #[test]
    fn dynamic_tool_pagination_is_stable_and_cursor_based() {
        let tools = (0..205)
            .map(|index| {
                Tool::new_with_raw(
                    format!("tool_{index:03}"),
                    None::<Cow<'static, str>>,
                    Arc::new(Map::new()),
                )
            })
            .collect::<Vec<_>>();
        let (first, first_cursor) = paginate_tools(tools.clone(), None).unwrap();
        assert_eq!(first.len(), 100);
        assert_eq!(first[0].name, "tool_000");
        assert_eq!(first_cursor.as_deref(), Some("100"));

        let (second, second_cursor) = paginate_tools(
            tools.clone(),
            Some(PaginatedRequestParams::default().with_cursor(first_cursor)),
        )
        .unwrap();
        assert_eq!(second.len(), 100);
        assert_eq!(second[0].name, "tool_100");
        assert_eq!(second_cursor.as_deref(), Some("200"));

        let (third, third_cursor) = paginate_tools(
            tools,
            Some(PaginatedRequestParams::default().with_cursor(second_cursor)),
        )
        .unwrap();
        assert_eq!(third.len(), 5);
        assert_eq!(third[0].name, "tool_200");
        assert!(third_cursor.is_none());
    }

    #[test]
    fn dynamic_tool_pagination_rejects_invalid_cursors() {
        let tools = vec![Tool::new_with_raw(
            "tool",
            None::<Cow<'static, str>>,
            Arc::new(Map::new()),
        )];
        assert!(
            paginate_tools(
                tools.clone(),
                Some(PaginatedRequestParams::default().with_cursor(Some("wat".to_string()))),
            )
            .is_err()
        );
        assert!(
            paginate_tools(
                tools,
                Some(PaginatedRequestParams::default().with_cursor(Some("2".to_string()))),
            )
            .is_err()
        );
    }
}
