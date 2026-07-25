# MCP Server Documentation

Documentation for the unraid-mcp MCP server.

## Files

| File | Description |
|------|-------------|
| [TOOLS.md](TOOLS.md) | Tool definitions, action/subaction routing, parameters, and examples |
| [RESOURCES.md](RESOURCES.md) | MCP resource URIs for live subscription data |
| [SCHEMA.md](SCHEMA.md) | Pydantic models and input validation |
| [ENV.md](ENV.md) | All environment variables with types, defaults, and sensitivity |
| [AUTH.md](AUTH.md) | Bearer token auth (inbound) and API key auth (outbound to Unraid) |
| [TRANSPORT.md](TRANSPORT.md) | stdio, streamable-http, and SSE configuration |
| [DEPLOY.md](DEPLOY.md) | Docker, local, and PyPI deployment patterns |
| [LOGS.md](LOGS.md) | Structured logging, log rotation, and error handling |
| [TESTS.md](TESTS.md) | Unit, schema, safety, property, and contract test suites |
| [MCPORTER.md](MCPORTER.md) | End-to-end HTTP and stdio smoke tests |
| [CICD.md](CICD.md) | GitHub Actions workflows for CI, Docker publish, and PyPI release |
| [PRE-COMMIT.md](PRE-COMMIT.md) | Ruff lint/format and the lefthook pre-commit suite |
| [PUBLISH.md](PUBLISH.md) | Versioning, PyPI, Docker, and MCP registry publishing |
| [CONNECT.md](CONNECT.md) | Client connection guides for Claude Code, Codex, Gemini, and direct HTTP |
| [DEV.md](DEV.md) | Day-to-day development workflow with uv and Justfile recipes |
| [ELICITATION.md](ELICITATION.md) | Destructive action confirmation (credential setup is in SETUP.md) |
| [PATTERNS.md](PATTERNS.md) | Common code patterns: action routing, GraphQL queries, error handling |
| [WEBMCP.md](WEBMCP.md) | Health endpoint, well-known discovery, and CORS configuration |
| [MCPUI.md](MCPUI.md) | Protocol-level UI hints for tool rendering |

## Reading Order

**New to this MCP server:**
1. ENV.md -- understand required configuration
2. AUTH.md -- set up authentication
3. TRANSPORT.md -- choose a transport and connect
4. TOOLS.md -- learn available operations (19 actions, 178 subactions)
5. RESOURCES.md -- discover live subscription data endpoints
6. ELICITATION.md -- understand the destructive action gates

**Experienced developers:**
- TOOLS.md and RESOURCES.md for the API surface
- ENV.md for configuration reference
- PATTERNS.md for code conventions
- TESTS.md for test suite structure

## At a glance

- **One tool**, `unraid`, routed by `action` (domain) + `subaction` (operation):
  `unraid(action="docker", subaction="list")`. 19 actions / 178 subactions.
- **Destructive subactions require `confirm=True`** (e.g. `array/stop_array`,
  `docker/remove_container`); without it, an MCP elicitation form is raised.
- **List subactions are capped** via the `limit` param (default 20; `limit<=0` =
  everything). Capped responses carry a `page` meta dict.
- **Default transport is `streamable-http`**; production runs `stdio`. HTTP bearer
  auth (`core/auth.py`) is inert under stdio.

## Editing the tool surface (gotchas)

- **Mutation handlers must early-return before the domain `_*_QUERIES` lookup** —
  mutations aren't in the queries dicts, so falling through raises `KeyError`.
- **Patch `make_graphql_request` at `unraid_mcp.core.client`**, never at tool level —
  tool modules resolve it on the `client` module object at call time.

## Cross-References

- [plugin/](../plugin/) -- Plugin manifests, hooks, skills, and marketplace config
- [stack/](../stack/) -- Python/FastMCP/uv implementation details
- [upstream/](../upstream/) -- Unraid GraphQL API documentation
- [repo/](../repo/) -- Repository structure and development workflow
