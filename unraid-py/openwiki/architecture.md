# Architecture

unraid-mcp is built with FastMCP using a modular architecture that separates concerns across focused modules: configuration, core infrastructure, subscriptions, and domain-specific tools.

## Component Overview

```
MCP Client (Claude Code / Codex / Gemini / HTTP)
    |
    | MCP Protocol (stdio or streamable-http)
    |
    v
+----------------------------------------------+
|  ASGI Middleware Stack                        |
|  1. HealthMiddleware     (GET /health)        |
|  2. WellKnownMiddleware  (OAuth discovery)    |
|  3. BearerAuthMiddleware (RFC 6750)           |
+----------------------------------------------+
    |
    v
+----------------------------------------------+
|  FastMCP Server                               |
|  MCP Middleware Chain:                         |
|  1. LoggingMiddleware    (request logging)     |
|  2. ErrorHandlingMiddleware (exception wrap)   |
|  3. RateLimitingMiddleware (540/min, inbound)  |
|  4. StructuredResponseLimitingMiddleware       |
|     (40 KB cap -> JSON truncation marker)       |
+----------------------------------------------+
    |
    +----> Tools (1 registered)
    |      +-- unraid (action+subaction router, 19 actions / 178 subactions)
    |      |   +-- _system.py    (25 subactions)
    |      |   +-- _health.py    (4 subactions)
    |      |   +-- _array.py     (14 subactions)
    |      |   +-- _disk.py      (6 subactions)
    |      |   +-- _docker.py    (26 subactions)
    |      |   +-- _vm.py        (9 subactions)
    |      |   +-- _notification (13 subactions)
    |      |   +-- _key.py       (13 subactions)
    |      |   +-- _plugin.py    (8 subactions)
    |      |   +-- _rclone.py    (4 subactions)
    |      |   +-- _setting.py   (6 subactions)
    |      |   +-- _connect.py   (8 subactions)
    |      |   +-- _customization (6 subactions)
    |      |   +-- _oidc.py      (5 subactions)
    |      |   +-- _onboarding.py (11 subactions)
    |      |   +-- _user.py      (1 subaction)
    |      |   +-- _live.py      (17 subactions)
    |      |   +-- subscriptions action -> diagnostics.py (2 subactions)
    |      |   +-- help action (returns the Markdown reference)
    |
    +----> Resources (10 registered)
           +-- unraid://logs/stream
           +-- unraid://live/{action} (9 subscriptions)
                |
                v
        +---------------------------+
        |  SubscriptionManager      |
        |  (WebSocket connections)  |
        +---------------------------+
                |
                | GraphQL-over-WebSocket
                | (graphql-transport-ws)
                |
                v
        +---------------------------+
        |  Unraid GraphQL API       |
        |  (upstream server)        |
        +---------------------------+
```

## Module Structure

### Server Layer (`/unraid_mcp/server.py`)

Main entry point that orchestrates all components:

- **FastMCP server** with 4-layer middleware chain
- **ASGI middleware** for HTTP-specific concerns (health, well-known, bearer auth)
- **Tool registration** via `register_unraid_tool()`
- **Resource registration** via `register_subscription_resources()`
- **Startup guards** for loopback binds when auth is disabled
- **Lifespan management** for HTTP client cleanup and subscription shutdown

Key code sections:
- Middleware order matters: logging → error_handling → rate_limiter → response_limiter → tool
- Loopback detection for safe auth-disabled binds (`_is_loopback_host`)
- Safe chmod helpers for credentials directory (`_chmod_safe`)

### Configuration (`/unraid_mcp/config/`)

Settings management and structured logging:

- **`settings.py`** - Environment variable loading, validation, defaults
- **`logging.py`** - Structured logging configuration with rotation (10 MB cap)

Configuration search priority:
1. `~/.unraid-mcp/.env` (canonical)
2. `~/.unraid-mcp/.env.local`
3. `/app/.env.local` (Docker)
4. `<project-root>/.env.local`
5. `<project-root>/.env`
6. `unraid_mcp/.env`

### Core Infrastructure (`/unraid_mcp/core/`)

Shared utilities and client layer:

- **`client.py`** - Async httpx GraphQL client with token-bucket rate limiting (540 req/min)
- **`auth.py`** - ASGI middleware (BearerAuthMiddleware, HealthMiddleware, WellKnownMiddleware)
- **`guards.py`** - Destructive action gating via `DESTRUCTIVE_ACTIONS` sets and `confirm=True` check
- **`setup.py`** - Elicitation-based credential setup flow for interactive environment configuration
- **`pagination.py`** - List capping via `cap_list()` with `page` meta dict
- **`response_limit.py`** - Structured response truncation at 40 KB (~10K tokens)
- **`validation.py`** - Input validation and path safety helpers
- **`utils.py`** - Shared helpers (`safe_get`, `safe_display_url`, path validation)
- **`types.py`** - Shared type definitions
- **`middleware_refs.py`** - Neutral module for middleware exports (breaks circular imports)
- **`google_auth.py`** - Google OAuth provider construction and validation
- **`exceptions.py`** - ToolError and exception handlers

### Subscriptions (`/unraid_mcp/subscriptions/`)

Real-time WebSocket data streaming:

- **`manager.py`** - SubscriptionManager with persistent WebSocket connections, auto-reconnect (10 attempts)
- **`resources.py`** - MCP resource URI registration (`unraid://live/{action}`)
- **`protocol.py`** - GraphQL-over-WebSocket protocol handling (connection_init, subscribe, next, complete)
- **`queries.py`** - Subscription query definitions for live data
- **`state.py`** - Connection state tracking (connecting, connected, disconnected, error)
- **`snapshot.py`** - One-shot subscription data collection via `subscribe_once()`
- **`utils.py`** - WebSocket URL conversion, SSL context building, connection_init construction
- **`diagnostics.py`** - WebSocket subscription diagnostics (`diagnose`, `test_query` actions)

Subscription flow:
1. Lazily initialize on first MCP resource/diagnostic access (controlled by `UNRAID_AUTO_START_SUBSCRIPTIONS`, default: true)
2. Connect via `graphql-transport-ws` protocol to `wss://<unraid-host>/graphql`
3. Send `connection_init` with API key payload
4. Subscribe to GraphQL queries for live telemetry
5. Cache data in memory for resource reads
6. Return "connecting" placeholder while starting; callers retry

### Tools (`/unraid_mcp/tools/`)

Domain-specific tool implementations (17 modules + consolidated router):

- **`unraid.py`** - Single consolidated `unraid` tool with action/subaction routing (19 actions, 178 subactions)
- **`_system.py`** - Server info, metrics, network, UPS (25 subactions)
- **`_health.py`** - Health checks, diagnostics, setup (4 subactions)
- **`_array.py`** - Parity checks, array lifecycle, disk ops (14 subactions)
- **`_disk.py`** - Shares, physical disks, log files (6 subactions)
- **`_docker.py`** - Container lifecycle, updates, organizer, networks (26 subactions)
- **`_vm.py`** - Virtual machine lifecycle (9 subactions)
- **`_notification.py`** - Notification CRUD (13 subactions)
- **`_key.py`** - API key and permission management (13 subactions)
- **`_plugin.py`** - Plugin management and async installs (8 subactions)
- **`_rclone.py`** - Cloud storage remote management (4 subactions)
- **`_setting.py`** - System settings, UPS, SSH, time, identity (6 subactions)
- **`_connect.py`** - Unraid Connect / remote access (8 subactions)
- **`_customization.py`** - Theme, locale and UI customization (6 subactions)
- **`_oidc.py`** - OIDC/SSO provider management (5 subactions)
- **`_onboarding.py`** - First-boot/onboarding state (11 subactions)
- **`_user.py`** - Current authenticated user (1 subaction)
- **`_live.py`** - Real-time WebSocket subscription snapshots (17 subactions)

Each tool module exports:
- `_*_QUERIES` - Pre-built GraphQL query dict (prevents injection)
- `_*_MUTATIONS` - GraphQL mutations dict (if any)
- `_DESTRUCTIVE` - Set of destructive subaction names (if any)
- `_handle_*` - Domain handler function

### Entry Point (`/unraid_mcp/main.py`)

Application startup and configuration:
- Loads settings from environment
- Initializes logging
- Runs the appropriate transport (stdio, streamable-http, SSE)

## Data Flow

### Tool Call (Query/Mutation)

1. Client sends `tools/call` with `action` + `subaction` + params
2. ASGI middleware validates bearer token (HTTP) or passes through (stdio)
3. MCP middleware logs request, handles errors, checks rate limit, caps response size
4. `unraid()` router routes to domain handler (e.g., `_handle_docker`)
5. Handler looks up pre-built GraphQL query from domain `_*_QUERIES` dict
6. `core/client.py` acquires token from rate limiter
7. httpx sends POST to Unraid GraphQL API with `x-api-key` header
8. Response is processed, capped if needed, and returned via MCP protocol

**Key points:**
- Mutations must early-return before the `_*_QUERIES` lookup (not in the dict)
- List subactions use `cap_list()` from `core/pagination.py` for pagination
- Destructive subactions check `confirm=True` via `core/guards.py`

### Resource Read (Subscription Data)

1. Client sends `resources/read` with URI (e.g., `unraid://live/cpu`)
2. ASGI middleware validates bearer token
3. MCP middleware logs and handles errors
4. Resource handler calls `subscription_manager.get_resource_data(action)`
5. SubscriptionManager returns cached data from active WebSocket
6. If subscription is connecting, returns "connecting" placeholder

### WebSocket Subscription

1. First resource/diagnostic access → enabled subscriptions initialize lazily (if `UNRAID_AUTO_START_SUBSCRIPTIONS=true`)
2. WebSocket connects to `wss://<unraid-host>/graphql` via `graphql-transport-ws`
3. Send `connection_init` with API key payload
4. Receive `connection_ack`
5. Send `subscribe` with GraphQL query
6. Receive `next` messages with live data
7. Update in-memory cache for resource reads
8. Handle disconnects → reconnect (max 10 attempts by default)

## Design Patterns

### Consolidated Action Pattern

Single MCP tool with `action` (domain) + `subaction` (operation) routing reduces context window usage and keeps the MCP surface minimal while supporting 178 operations.

### Pre-built Query Dicts

Each tool module exports `_*_QUERIES` and `_*_MUTATIONS` dicts with pre-built GraphQL strings. This prevents GraphQL injection and organizes operations by domain.

```python
_DOCKER_QUERIES = {
    "list": """...""",
    "details": """...""",
}
```

### Destructive Action Gates

All destructive operations require `confirm=True`. The `DESTRUCTIVE_ACTIONS` set is checked in each handler via `core/guards.py`. Without `confirm`, the server raises an MCP elicitation form.

### List Capping

List-returning subactions support `limit` parameter (default 20). The `cap_list()` helper in `core/pagination.py` truncates responses and adds a `page` meta dict with `returned`, `total`, `truncated`, and `hint`.

### Rate Limiting

Two layers:
1. **Inbound MCP** - SlidingWindowRateLimitingMiddleware (540 req/min) to protect the server
2. **Outbound GraphQL** - Token-bucket rate limiter in `core/client.py` to stay under Unraid's ~100 req/10s limit

### Response Limiting

StructuredResponseLimitingMiddleware caps serialized responses at 40 KB (~10K tokens). Over-cap responses are replaced with a parseable JSON truncation marker:
```json
{"error": "response_truncated", "truncated": true, "original_size": 45000, "cap": 40000}
```

## Transport Options

### streamable-http (Default)

- Exposes HTTP endpoint at `http://<host>:<port>/mcp`
- Requires bearer authentication (via `UNRAID_MCP_BEARER_TOKEN`)
- ASGI middleware handles health, well-known, and auth endpoints
- Production-ready for gateway deployments

### stdio

- Standard input/output communication
- No HTTP authentication (bypassed)
- Used by Claude Code plugin
- Supports streaming responses

### SSE (Deprecated)

- Server-Sent Events transport
- Still supported but deprecated
- Prefer streamable-http for new deployments

See `/docs/mcp/TRANSPORT.md` for transport-specific configuration.

## Source References

- **Server**: `/unraid_mcp/server.py`
- **Entry point**: `/unraid_mcp/main.py`
- **Configuration**: `/unraid_mcp/config/settings.py`, `/unraid_mcp/config/logging.py`
- **Core**: `/unraid_mcp/core/`
- **Subscriptions**: `/unraid_mcp/subscriptions/`
- **Tools**: `/unraid_mcp/tools/`
- **Module documentation**: [`/docs/mcp/`](docs/mcp/) (TOOLS.md, ENV.md, AUTH.md, etc.)
- **Architecture details**: [`/docs/stack/ARCH.md`](docs/stack/ARCH.md)
