# Repository Structure -- unraid-mcp

> **Scope note (monorepo):** the tree below is rooted at `unraid-py/` within the
> [dinglebear-ai/unraid](https://github.com/dinglebear-ai/unraid) monorepo,
> not at the repository root. The Claude/Codex plugin manifests it lists moved to
> `agents/unraid-py/` at the repo root during the consolidation.


## Directory layout

```
unraid-mcp/
+-- CLAUDE.md                          # Development instructions for AI coding assistants
+-- AGENTS.md -> CLAUDE.md             # Codex compatibility symlink
+-- GEMINI.md -> CLAUDE.md             # Gemini compatibility symlink
+-- CHANGELOG.md                       # Version history
+-- README.md                          # User-facing documentation
+-- LICENSE                            # MIT license
+-- pyproject.toml                     # Python project metadata, dependencies, tool config
+-- uv.lock                            # Locked dependency versions
+-- Justfile                           # Task runner recipes
+-- Dockerfile                         # Multi-stage Docker build
+-- docker-compose.yaml                # Container orchestration
+-- entrypoint.sh                      # Docker entrypoint with env validation
+-- server.json                        # MCP Registry manifest (tv.tootie/unraid-mcp)
+-- gemini-extension.json              # Gemini CLI manifest
+-- .env.example                       # Environment variable template
|
+-- .claude-plugin/
|   +-- plugin.json                    # Claude Code plugin manifest
|   +-- marketplace.json               # Marketplace catalog entry
|   +-- README.md                      # Plugin marketplace description
|
+-- .codex-plugin/
|   +-- plugin.json                    # Codex CLI plugin manifest
|
+-- src/unraid_mcp/                        # Python source package
|   +-- __init__.py
|   +-- main.py                        # Entry point and shutdown cleanup
|   +-- server.py                      # FastMCP server, middleware chain, ASGI auth
|   +-- version.py                     # Version from package metadata
|   +-- config/
|   |   +-- __init__.py
|   |   +-- settings.py                # Environment loading, configuration constants
|   |   +-- logging.py                 # Structured logging setup
|   +-- core/
|   |   +-- __init__.py
|   |   +-- auth.py                    # BearerAuthMiddleware, HealthMiddleware, WellKnownMiddleware
|   |   +-- client.py                  # Async GraphQL HTTP client
|   |   +-- exceptions.py              # ToolError, CredentialsNotConfiguredError
|   |   +-- guards.py                  # Destructive action gating via elicitation
|   |   +-- middleware_refs.py         # Circular import breaker for error middleware
|   |   +-- setup.py                   # Plugin-option credential persistence (setup plugin-hook)
|   |   +-- types.py                   # Shared type definitions
|   |   +-- utils.py                   # safe_get, safe_display_url, path validation
|   |   +-- validation.py             # Input validation helpers
|   +-- subscriptions/
|   |   +-- __init__.py
|   |   +-- diagnostics.py            # Diagnostic tools for subscription debugging
|   |   +-- manager.py                # WebSocket subscription manager singleton
|   |   +-- queries.py                # GraphQL subscription query strings
|   |   +-- resources.py              # MCP resource registration
|   |   +-- snapshot.py               # One-shot subscribe_once fallback
|   |   +-- utils.py                  # WebSocket URL building, SSL context, status analysis
|   +-- tools/
|       +-- __init__.py
|       +-- unraid.py                  # Consolidated action router (15 domains)
|       +-- _array.py                  # Array and parity operations
|       +-- _customization.py          # Theme and UI customization
|       +-- _disk.py                   # Shares, disks, logs, flash backup
|       +-- _docker.py                # Container lifecycle and networks
|       +-- _health.py                 # Health check, connection test
|       +-- _key.py                    # API key management
|       +-- _live.py                   # Live subscription snapshots
|       +-- _notification.py           # Notification CRUD
|       +-- _oidc.py                   # OIDC/SSO providers
|       +-- _plugin.py                 # Plugin management
|       +-- _rclone.py                 # Cloud storage remotes
|       +-- _setting.py                # System settings and UPS
|       +-- _system.py                 # Server info, metrics, network
|       +-- _user.py                   # Current user
|       +-- _vm.py                     # Virtual machine lifecycle
|
+-- plugins/
|   +-- unraid/
|       +-- .claude-plugin/plugin.json   # Claude plugin manifest
|       +-- .codex-plugin/plugin.json    # Codex plugin manifest
|       +-- .mcp.json                     # MCP server registration (uvx unraid-mcp)
|       +-- hooks/
|       |   +-- hooks.json                # SessionStart + ConfigChange hook wiring
|       |   +-- CLAUDE.md                  # AI instructions for hook config
|       +-- scripts/
|       |   +-- plugin-setup.sh           # Credential-setup hook (uvx unraid-mcp setup plugin-hook)
|       +-- skills/
|           +-- unraid/SKILL.md           # Client-facing skill documentation
|
+-- scripts/                           # Repo-maintenance scripts (CI, git hooks, Justfile)
|   +-- CLAUDE.md                      # AI assistant instructions for scripts/
|   +-- block-env-commits.sh           # lefthook pre-commit: block .env file commits
|   +-- check-version-sync.sh          # Verify version consistency across manifest files
|   +-- validate-marketplace.sh        # Validate marketplace/plugin manifest structure
|   +-- generate_unraid_api_reference.py  # Generate GraphQL API docs from live introspection
|
+-- tests/                             # Test suite (see mcp/TESTS.md)
|   +-- conftest.py
|   +-- test_*.py                      # 28 unit test files
|   +-- contract/                      # Response shape tests
|   +-- http_layer/                    # httpx layer tests
|   +-- integration/                   # WebSocket lifecycle tests
|   +-- mcporter/                      # End-to-end smoke tests
|   +-- property/                      # Hypothesis property tests
|   +-- safety/                        # Destructive guard tests
|   +-- schema/                        # GraphQL validation tests
|
+-- docs/                              # Documentation (this directory)
|   +-- plans/                         # Development plans
|   +-- reports/                       # Audit reports
|   +-- sessions/                      # Session logs
|   +-- superpowers/                   # Capability docs
|   +-- AUTHENTICATION.md              # Auth reference
|   +-- DESTRUCTIVE_ACTIONS.md         # Destructive action reference
|   +-- MARKETPLACE.md                 # Marketplace guide
|   +-- PUBLISHING.md                  # Publishing guide
|   +-- UNRAID-API-SUMMARY.md         # Condensed Unraid API overview
|   +-- UNRAID-API-CHANGES.md         # Schema diff vs previous snapshot
|   +-- UNRAID-API-COMPLETE-REFERENCE.md # Full Unraid API reference
|   +-- UNRAID-SCHEMA.graphql          # Full GraphQL schema
|   +-- UNRAID-API-INTROSPECTION.json  # Schema introspection data
|
+-- .github/
|   +-- workflows/
|       +-- ci.yml                     # CI pipeline
|       +-- release-please.yml         # Version bump + changelog + tagging
|       +-- docker-publish.yml         # Docker image publishing
|       +-- publish-pypi.yml           # PyPI and MCP registry publishing
|
+-- assets/                            # Icons and logos
+-- backups/                           # Flash backup storage
+-- logs/                              # Application logs
```

## Key conventions

- **Single source package**: `src/unraid_mcp/` contains all server code
- **Domain modules**: Private `_<domain>.py` files in `tools/`, imported by `unraid.py`
- **Config module**: `config/settings.py` loads all env vars at import time
- **Symlinks**: `AGENTS.md` and `GEMINI.md` symlink to `CLAUDE.md`
- **Credentials**: Never stored in repo; live at `~/.unraid-mcp/.env`
