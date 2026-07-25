# Architecture Overview -- unraid-mcp

## Component diagram

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
    |      |   +-- subscriptions action -> diagnostics.py (2 subactions: diagnose, test_query)
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

## Data flow

### Tool call (query)

1. Client sends `tools/call` with `action` + `subaction`
2. ASGI middleware validates bearer token (HTTP) or passes through (stdio)
3. MCP middleware logs, handles errors, checks rate limit, caps response size
4. `unraid()` routes to domain handler (e.g., `_handle_docker`)
5. Handler looks up pre-built GraphQL query from domain `_*_QUERIES` dict
6. `core/client.py` acquires a token from the upstream **token-bucket rate limiter**
   (`_RateLimiter`: 90 tokens / 9 rps, modeling Unraid's 100 req/10s hard limit), then
   sends the async HTTP request to the Unraid API with `x-api-key` (429s retried with backoff)
7. Response parsed, formatted, returned to client

### Tool call (mutation with destructive gate)

1. Client sends `tools/call` with destructive subaction
2. `gate_destructive_action()` checks if subaction is in `_*_DESTRUCTIVE` set
3. If `confirm=True`: proceed immediately
4. If interactive client: send elicitation request with `_ConfirmAction` form
5. If user confirms: proceed; otherwise raise `ToolError`
6. Handler sends GraphQL mutation
7. Response returned to client

### Resource read (live data)

1. Client reads `unraid://live/<action>`
2. `ensure_subscriptions_started()` initializes WebSocket connections (once)
3. Resource function checks `SubscriptionManager.resource_data` cache
4. If data available: return with `_fetched_at` timestamp
5. If connecting: return "connecting" placeholder
6. If failed (terminal state): return error message
7. If auto-start disabled: fall back to `subscribe_once` one-shot query

### Credential setup (plugin userConfig + setup hook)

1. User sets *Unraid GraphQL API URL* / *Unraid API Key* in the plugin's config form
2. Claude Code injects them as `CLAUDE_PLUGIN_OPTION_*` env vars and fires the
   SessionStart / ConfigChange hooks, which run `unraid-mcp setup plugin-hook`
3. `run_plugin_hook()` maps the plugin options to canonical names (`apply_plugin_options()`),
   rejecting empty/newline-injected values
4. If both URL and key are present: write to `~/.unraid-mcp/.env` (atomic: tmp + `os.replace`, mode 600)
5. The server, CLI, and Docker read those credentials from `.env`/env at startup
6. `unraid(action="health", subaction="setup")` reports status and prints instructions —
   it never prompts interactively

## Key design decisions

### Consolidated tool pattern

One `unraid` tool with 19 actions (178 subactions) instead of many separate tools. This:
- Reduces MCP context window usage (one tool description covers all operations)
- Simplifies client tool selection
- Enables shared parameters across domains

**Tradeoff**: There is no response/query cache. The single `unraid` tool mixes reads and
mutations under one name, so per-subaction cache exclusion is impossible — the
`ResponseCachingMiddleware` that once existed was removed for this reason.

### Pre-built query dicts

GraphQL queries are pre-defined in Python dicts, not constructed dynamically. This:
- Prevents GraphQL injection
- Makes queries discoverable and testable
- Enables schema validation tests (119 tests)

### Persistent subscription manager

WebSocket connections are maintained as long-running async tasks. This:
- Provides instant access to live data via MCP resources
- Reduces latency compared to on-demand connections
- Supports automatic reconnection with exponential backoff

## See Also

- [TECH.md](TECH.md) -- Technology choices
- [../mcp/PATTERNS.md](../mcp/PATTERNS.md) -- Code patterns
- [../mcp/TOOLS.md](../mcp/TOOLS.md) -- Tool reference
