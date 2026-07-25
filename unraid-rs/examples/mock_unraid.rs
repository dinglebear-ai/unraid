//! Standalone mock Unraid GraphQL server.
//!
//! Serves canned, scenario-driven responses so the real `runraid` binary, an
//! MCP client, or the Claude `unraid` skill can be exercised with no real Unraid
//! box. The wire contract matches `graphql.rs`: `POST <url>` with a JSON body
//! `{"query": "...", "variables": {...}}` and an `x-api-key` header.
//!
//! Run it:
//!     cargo run --example mock_unraid -- --scenario healthy --port 8999
//!
//! Point the binary at it:
//!     export UNRAID_API_URL=http://127.0.0.1:8999/graphql
//!     export UNRAID_API_KEY=anything          # or whatever you pass to --require-key
//!     cargo run -- array                       # CLI
//!     cargo run -- serve mcp                    # MCP server, now backed by the mock
//!
//! Flip scenarios live (great for watching degraded-state rendering mid-session):
//!     curl -XPOST http://127.0.0.1:8999/scenario/disk-failing
//!
//! Flags:
//!     --scenario <name>   initial scenario (default: healthy). One of:
//!                         healthy | degraded | parity-running | disk-failing
//!     --port <n>          listen port (default: 8999)
//!     --host <ip>         bind host (default: 127.0.0.1)
//!     --require-key <k>   reject requests whose x-api-key != k with HTTP 401
//!                         (omit to accept any key — useful for the auth-fail path)

use std::sync::{Arc, RwLock};

use axum::{
    extract::{Path, State},
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use serde_json::{json, Value};
use unraid_rmcp::mock::{Scenario, SCENARIOS};

#[derive(Clone)]
struct AppState {
    scenario: Arc<RwLock<Scenario>>,
    require_key: Option<String>,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let args = Args::parse();

    let scenario = Scenario::load(&args.scenario).ok_or_else(|| {
        anyhow::anyhow!(
            "unknown scenario `{}` (known: {})",
            args.scenario,
            SCENARIOS.join(", ")
        )
    })?;

    let state = AppState {
        scenario: Arc::new(RwLock::new(scenario)),
        require_key: args.require_key.clone(),
    };

    let app = Router::new()
        .route("/", get(index))
        .route("/health", get(health))
        .route("/graphql", post(graphql))
        .route("/scenario", get(scenario_get))
        .route("/scenario/{name}", post(scenario_set))
        .with_state(state);

    let addr = format!("{}:{}", args.host, args.port);
    let listener = tokio::net::TcpListener::bind(&addr).await?;

    eprintln!("mock-unraid listening on http://{addr}");
    eprintln!("  scenario : {}", args.scenario);
    eprintln!(
        "  auth     : {}",
        match &args.require_key {
            Some(_) => "x-api-key required (--require-key set)",
            None => "any x-api-key accepted",
        }
    );
    eprintln!();
    eprintln!("  export UNRAID_API_URL=http://{addr}/graphql");
    eprintln!(
        "  export UNRAID_API_KEY={}",
        args.require_key.as_deref().unwrap_or("anything")
    );
    eprintln!();
    eprintln!("  switch scenario: curl -XPOST http://{addr}/scenario/<name>");
    eprintln!("  known scenarios: {}", SCENARIOS.join(", "));

    axum::serve(listener, app).await?;
    Ok(())
}

async fn index() -> impl IntoResponse {
    Json(json!({
        "service": "mock-unraid",
        "endpoints": {
            "POST /graphql": "GraphQL query endpoint (point UNRAID_API_URL here)",
            "GET /scenario": "current scenario name + known scenarios",
            "POST /scenario/{name}": "switch the active scenario",
            "GET /health": "liveness probe",
        },
        "scenarios": SCENARIOS,
    }))
}

async fn health() -> impl IntoResponse {
    Json(json!({ "status": "ok" }))
}

async fn scenario_get(State(state): State<AppState>) -> impl IntoResponse {
    let current = state.scenario.read().unwrap().name.clone();
    Json(json!({ "scenario": current, "available": SCENARIOS }))
}

async fn scenario_set(
    State(state): State<AppState>,
    Path(name): Path<String>,
) -> impl IntoResponse {
    match Scenario::load(&name) {
        Some(next) => {
            *state.scenario.write().unwrap() = next;
            (StatusCode::OK, Json(json!({ "scenario": name }))).into_response()
        }
        None => (
            StatusCode::NOT_FOUND,
            Json(json!({ "error": "unknown scenario", "available": SCENARIOS })),
        )
            .into_response(),
    }
}

async fn graphql(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(body): Json<Value>,
) -> impl IntoResponse {
    // Optional auth gate — lets you exercise the 401 path in graphql.rs.
    if let Some(expected) = &state.require_key {
        let presented = headers.get("x-api-key").and_then(|v| v.to_str().ok());
        if presented != Some(expected.as_str()) {
            return (
                StatusCode::UNAUTHORIZED,
                Json(json!({ "error": "invalid x-api-key" })),
            )
                .into_response();
        }
    }

    let query = body.get("query").and_then(Value::as_str).unwrap_or("");
    let response = state.scenario.read().unwrap().respond(query);
    (StatusCode::OK, Json(response)).into_response()
}

// ── tiny arg parser (matches the no-clap style of the main binary) ──────────

struct Args {
    scenario: String,
    host: String,
    port: u16,
    require_key: Option<String>,
}

impl Args {
    fn parse() -> Self {
        let mut scenario = "healthy".to_string();
        let mut host = "127.0.0.1".to_string();
        let mut port: u16 = 8999;
        let mut require_key = None;

        let mut it = std::env::args().skip(1);
        while let Some(arg) = it.next() {
            match arg.as_str() {
                "--scenario" => scenario = it.next().unwrap_or(scenario),
                "--host" => host = it.next().unwrap_or(host),
                "--port" => {
                    if let Some(p) = it.next().and_then(|v| v.parse().ok()) {
                        port = p;
                    }
                }
                "--require-key" => require_key = it.next(),
                "-h" | "--help" => {
                    eprintln!(
                        "Usage: cargo run --example mock_unraid -- \
                         [--scenario NAME] [--host IP] [--port N] [--require-key KEY]\n\
                         scenarios: {}",
                        SCENARIOS.join(", ")
                    );
                    std::process::exit(0);
                }
                other => eprintln!("mock-unraid: ignoring unknown arg `{other}`"),
            }
        }

        Args {
            scenario,
            host,
            port,
            require_key,
        }
    }
}
