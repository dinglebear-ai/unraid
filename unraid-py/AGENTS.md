# Python MCP server — agent and contributor instructions

`AGENTS.md` is canonical; `CLAUDE.md` and `GEMINI.md` link here. Follow the
[repository instructions](../AGENTS.md) for shared policy. Commands on this
page run from `unraid-py/` unless another working directory is stated.

## Project Overview
This is an MCP (Model Context Protocol) server that provides tools to interact with an Unraid server's GraphQL API. The server is built using FastMCP with a **modular architecture** consisting of separate packages for configuration, core functionality, subscriptions, and tools.

## Development Commands

### Setup
```bash
# Create/update the virtual environment using the committed lockfile,
# including the development dependency group.
uv sync --locked --group dev
```

### Running the Server
```bash
# Local development with uv (recommended)
uv run unraid-mcp-server

# Direct module execution
uv run -m unraid_mcp.main
```

### Code Quality
```bash
# Lint and format with ruff
uv run ruff check src/
uv run ruff format src/

# Type checking with ty (Astral's fast type checker)
uv run ty check src/

# Run tests
uv run pytest
```

### Environment Setup
Copy `.env.example` to `.env` and configure:

**Required:**
- `UNRAID_API_URL`: Unraid GraphQL endpoint
- `UNRAID_API_KEY`: Unraid API key

**Server:**
- `UNRAID_MCP_LOG_LEVEL`: Log verbosity (default: INFO)
- `UNRAID_MCP_LOG_FILE`: Log filename in logs/ (default: unraid-mcp.log)
- `UNRAID_MCP_MAX_RESPONSE_BYTES`: Max serialized tool-response size in bytes (default: 40000 = 40 KB ≈ 10K tokens). Responses over the cap are replaced with a structured, parseable JSON truncation marker (`{"error": "response_truncated", "truncated": true, ...}`) rather than hard-cut mid-JSON. This is a backstop; the per-list `cap_list` defaults do the primary bounding. See `src/unraid_mcp/core/response_limit.py`.

**SSL/TLS:**
- `UNRAID_VERIFY_SSL`: TLS verification (default: true). Disabling it also requires
  `UNRAID_ALLOW_INSECURE_TLS=true`; never wire or recommend the first setting alone.

**Subscriptions:**
- `UNRAID_AUTO_START_SUBSCRIPTIONS`: Lazily initialize enabled live subscriptions on first MCP resource/diagnostic access (default: true); the first read may return `connecting`
- `UNRAID_MAX_RECONNECT_ATTEMPTS`: WebSocket reconnect limit (default: 10)
- `UNRAID_MCP_ENABLE_RAW_SUBSCRIPTION_PROBE`: Debug-only, data-sensitive raw frame in `subscriptions/test_query` (default: false; never enable on shared deployments)
- Collection safety: `UNRAID_SUBSCRIPTION_COLLECT_MAX_EVENTS=100`, `UNRAID_SUBSCRIPTION_COLLECT_MAX_BYTES=1048576`, and `UNRAID_SUBSCRIPTION_COLLECT_MAX_SECONDS=30` bound retention while streaming; positive `limit` and the response-size budget may lower those ceilings
- Cache/timeout safety: cached subscription payloads are usable for at most `UNRAID_SUBSCRIPTION_CACHE_MAX_AGE_SECONDS=300`; per-call WebSocket timeout is capped by `UNRAID_SUBSCRIPTION_TIMEOUT_MAX_SECONDS=60`

**Credentials override:**
- `UNRAID_CREDENTIALS_DIR`: Override the `~/.unraid-mcp/` credentials directory path

## Architecture

### Core Components
- **Main Server**: `src/unraid_mcp/server.py` - Modular MCP server with FastMCP integration
- **Entry Point**: `src/unraid_mcp/main.py` - Application entry point and startup logic
- **Configuration**: `src/unraid_mcp/config/` - Settings management and logging configuration
- **Core Infrastructure**: `src/unraid_mcp/core/` - GraphQL client, exceptions, and shared types
  - `guards.py` — destructive action gating via MCP elicitation
  - `utils.py` — shared helpers (`safe_get`, `safe_display_url`, path validation)
  - `setup.py` — elicitation-based credential setup flow
- **Subscriptions**: `src/unraid_mcp/subscriptions/` - Real-time WebSocket subscriptions and diagnostics
- **Tools**: `src/unraid_mcp/tools/` - Domain-specific tool implementations
- **GraphQL Client**: Uses httpx for async HTTP requests to Unraid API
- **Version Helper**: `src/unraid_mcp/version.py` - Reads version from package metadata via importlib

### Key Design Patterns
- **Consolidated Action Pattern**: Each tool uses `action: Literal[...]` parameter to expose multiple operations via a single MCP tool, reducing context window usage
- **Pre-built Query Dicts**: `QUERIES` and `MUTATIONS` dicts prevent GraphQL injection and organize operations
- **List Capping**: List subactions bound output via `cap_list` (`core/pagination.py`) threaded
  from the `limit` tool param. Capped responses carry a `page` meta dict
  (`returned`/`total`/`truncated`, plus a `hint` when truncated). `limit<=0` returns everything;
  omitting `limit` uses the tool default (20). Every list-shaped subaction returns a capped
  collection plus `page` metadata, including VM, disk/log, key/permission, OIDC, system,
  Docker, array, notification, plugin, and live event/interface lists. Collect-mode live
  calls retain bounded events/bytes/duration even when `limit<=0`. When a live runtime
  safety cap fires, `page.truncated` remains true and `total_is_lower_bound` identifies the
  observed minimum rather than claiming a complete window. `docker/details` fetches a
  single container via `docker.container(id:)` rather than over-fetching the full container
  list.
- **Destructive Action Safety**: `DESTRUCTIVE_ACTIONS` sets require `confirm=True` for dangerous operations
- **Modular Architecture**: Clean separation of concerns across focused modules
- **Error Handling**: Uses ToolError for user-facing errors, detailed logging for debugging
- **Timeout Management**: Custom timeout configurations for different query types (90s for disk ops)
- **Data Processing**: Tools return both human-readable summaries and detailed raw data
- **Health Monitoring**: Comprehensive health check tool for system monitoring
- **Real-time Subscriptions**: WebSocket-based live data streaming
- **Persistent Subscription Manager**: `live` action subactions use a shared `SubscriptionManager`
  that maintains persistent WebSocket connections. Resources serve cached data via
  `subscription_manager.get_resource_data(action)`. A "connecting" placeholder is returned
  while the subscription starts — callers should retry in a moment. When
  `UNRAID_AUTO_START_SUBSCRIPTIONS=false`, resources fall back to on-demand `subscribe_once`.

### Tool Categories (1 Tool)

The server registers a **single MCP tool**, `unraid`, with `action` (domain) +
`subaction` (operation) routing (19 actions / 179 subactions). Call it as
`unraid(action="docker", subaction="list")`. Subscription diagnostics and the
Markdown reference that used to be standalone tools are now actions of `unraid`:
- **`subscriptions`** — `diagnose` (connection states, errors, WebSocket URLs) and
  `test_query` (test a GraphQL subscription query; allowlisted fields only, needs
  `subscription_query=`).
- **`help`** — returns the full Markdown action/subaction reference (no subaction).

The handler functions live in `src/unraid_mcp/subscriptions/diagnostics.py`
(`_handle_subscriptions`, `diagnose_subscriptions`, `test_subscription_query`);
`server.py` no longer calls `register_diagnostic_tools`.

| action | subactions |
|--------|-----------|
| **system** (25) | overview, array, network, registration, variables, metrics, network_metrics, services, display, display_details, config, online, owner, settings, server, server_details, servers, network_access_urls, flash, ups_devices, ups_device, ups_config, server_time, timezones, network_interfaces |
| **health** (4) | check, test_connection, diagnose, setup |
| **array** (14) | parity_status, parity_history, assignable_disks, parity_start, parity_pause, parity_resume, parity_cancel, start_array, stop_array*, add_disk, remove_disk*, mount_disk, unmount_disk, clear_disk_stats* |
| **disk** (6) | shares, disks, disk_details, log_files, logs, flash_backup* |
| **docker** (27) | list, details, logs, check_updates, ports, start, stop, restart, unpause, networks, network_details, remove_container*, update_container, update_containers, update_all_containers, update_autostart, refresh_digests, sync_template_paths, reset_template_mappings*, create_folder, create_folder_with_items, rename_folder, set_folder_children, delete_entries*, move_entries_to_folder, move_items_to_position, update_view_preferences |
| **vm** (9) | list, details, start, stop, pause, resume, force_stop*, reboot, reset* |
| **notification** (13) | overview, list, create, notify_if_unique, archive, mark_unread, recalculate, archive_all, archive_many, unarchive_many, unarchive_all, delete*, delete_archived* |
| **key** (13) | list, get, possible_roles, possible_permissions, permissions_for_roles, preview_permissions, auth_actions, creation_form_schema, create, update, delete*, add_role, remove_role |
| **plugin** (8) | list, installed_unraid, install_operations, install_operation, add, remove*, install*, install_language* |
| **rclone** (4) | list_remotes, config_form, create_remote, delete_remote* |
| **setting** (6) | update, configure_ups*, update_ssh*, update_temperature, update_system_time*, update_server_identity |
| **connect** (8) | remote_access, cloud, status, update_api_settings*, sign_in*, sign_out*, setup_remote_access*, enable_dynamic_remote_access* |
| **customization** (6) | public_theme, is_initial_setup, sso_enabled, details, set_theme, set_locale |
| **oidc** (5) | providers, provider, configuration, public_providers, validate_session |
| **onboarding** (11) | internal_boot_context, complete, open, close, resume, bypass, reset*, set_override, clear_override, refresh_internal_boot_context, create_internal_boot_pool* |
| **user** (1) | me |
| **live** (17) | cpu, memory, cpu_telemetry, array_state, parity_progress, ups_status, notifications_overview, notifications_warnings, notification_feed, log_tail, owner, server_status, display, docker_container_stats, temperature, network_metrics, plugin_install_updates |
| **subscriptions** (2) | diagnose, test_query (needs `subscription_query=`) |
| **help** (0) | _(no subaction)_ — returns the Markdown reference |

`*` = destructive, requires `confirm=True`. Complex mutations take structured dict
params: `organizer_input` (docker organizer), `connect_input` (connect), `config_input`
(setting ssh/temperature/time), `onboarding_input` (onboarding), `permissions_input` (key).

### Log Filtering (`disk/logs`, `live/log_tail`)
Both log-reading subactions accept optional `level` and `context` params to filter noisy
streams down to relevant severity:
- `level` — one of `debug|info|notice|warning|error|critical`. Keeps lines at-or-above the
  requested severity when a structured level is detectable, else falls back to a
  case-insensitive keyword match. Omit for unchanged output (backward compatible).
- `context` — lines of surrounding context kept before/after each match (default `2`).
  Non-contiguous matches are separated by a `---` marker.

Filtered responses add two counts plus a `filter` echo:
- `matchedLines` — number of lines that actually matched the severity filter (excludes
  context lines and `---` separators).
- `returnedLines` — number of real log lines returned (matches + context, excluding `---`
  separator markers). Expect `matchedLines <= returnedLines`.

The pure helpers are `filter_log_lines(lines, level=None, context=2)` (returns matches +
context + `---` separators) and `count_log_matches(lines, level=None)` (severity-match
count only), both in `src/unraid_mcp/core/utils.py`.

### Destructive Actions (require `confirm=True`)
- **array**: stop_array, remove_disk, clear_disk_stats
- **vm**: force_stop, reset
- **notification**: delete, delete_archived
- **rclone**: delete_remote
- **key**: delete
- **disk**: flash_backup
- **setting**: configure_ups, update_ssh, update_system_time
- **plugin**: remove, install, install_language
- **docker**: remove_container, reset_template_mappings, delete_entries
- **connect**: sign_in, sign_out, update_api_settings, setup_remote_access, enable_dynamic_remote_access
- **onboarding**: reset, create_internal_boot_pool

### Environment Variable Hierarchy
The server loads environment variables from multiple locations in order:
1. `~/.unraid-mcp/.env` (primary — canonical credentials dir, all runtimes)
2. `~/.unraid-mcp/.env.local` (local overrides, only used if primary is absent)
3. `/app/.env.local` (Docker compat mount)
4. `<project root>/.env.local` (project root local overrides)
5. `<project root>/.env` (project root fallback)
6. `src/unraid_mcp/.env` (last resort)

### Error Handling Strategy
- GraphQL errors are converted to ToolError with descriptive messages
- HTTP errors include status codes and response details
- Network errors are caught and wrapped with connection context
- All errors are logged with full context for debugging

### Middleware Chain
`server.py` wraps all tools in a 4-layer stack (order matters — outermost first):
1. **LoggingMiddleware** — logs every `tools/call` and `resources/read` with duration
2. **ErrorHandlingMiddleware** — converts unhandled exceptions to proper MCP errors
3. **SlidingWindowRateLimitingMiddleware** — 540 req/min sliding window. This is an
   **inbound-abuse/DoS guard only**; it does NOT bound the upstream Unraid API's burst
   limit (a 540/min window cannot prevent exceeding 100 req/10s). The authoritative
   upstream limiter is the **httpx token bucket** in `core/client.py` (`_RateLimiter`:
   90 tokens, 9.0 tokens/sec refill). Every outbound GraphQL call acquires a
   token first, and 429s are retried with backoff. A token bucket limits average
   rate and burst size; it does not guarantee a strict rolling-window limit.
4. **StructuredResponseLimitingMiddleware** (`core/response_limit.py`) — replaces responses over the cap (default 40 KB ≈ 10K tokens, override via `UNRAID_MCP_MAX_RESPONSE_BYTES`) with a complete, parseable JSON truncation marker instead of a lossy mid-JSON byte cut

Note: there is **no query cache**. The only caching middleware ever present —
`ResponseCachingMiddleware` — was removed because the consolidated `unraid` tool mixes
reads and mutations under one name, making per-subaction cache exclusion impossible. The
`health/diagnose` "caching disabled" note is simply accurate.

### HTTP Authentication (bearer token, Google OAuth, or both)

HTTP transport supports two auth modes, selected by env vars:
1. **Pre-shared bearer token** (default) — enforced by the ASGI `BearerAuthMiddleware`
   in `core/auth.py`, auto-generated on first HTTP startup. `WellKnownMiddleware` advertises
   *no* OAuth authorization server (clients must send a static token).
2. **Google OAuth** (`core/google_auth.py`) — activated when **both**
   `UNRAID_MCP_GOOGLE_CLIENT_ID` and `UNRAID_MCP_GOOGLE_CLIENT_SECRET` are set. FastMCP's
   `GoogleProvider` is attached via `FastMCP(auth=...)`; `build_google_provider()` returns
   `None` (mode 1) otherwise. When active, `run_server()` installs **only** `HealthMiddleware`
   — the bearer + well-known ASGI middleware are omitted because the provider serves its own
   OAuth/`.well-known` routes and would be shadowed (and the OAuth callback 401'd) otherwise.
   `UNRAID_MCP_GOOGLE_BASE_URL` is **required** when enabled. Token persistence is optional
   and Redis-free: set both `UNRAID_MCP_GOOGLE_JWT_SIGNING_KEY` and
   `UNRAID_MCP_GOOGLE_ENCRYPTION_KEY` (a Fernet key) to persist tokens encrypted-at-rest in a
   `FileTreeStore` under `UNRAID_MCP_GOOGLE_STORAGE_DIR` (default `~/.unraid-mcp/oauth-tokens`);
   setting only one is a fatal config error. Misconfig raises `GoogleOAuthConfigError`, which
   `server.py` converts to a fatal `sys.exit(1)` at import. See `.env.example` for the full
   variable reference.

**Coexistence:** when Google OAuth is active AND `UNRAID_MCP_BEARER_TOKEN` is explicitly set,
both modes work at once — `_StaticBearerFallbackVerifier` (in `core/google_auth.py`) accepts
the static token via constant-time compare before delegating to Google verification, so OAuth
clients (claude.ai) and static-token clients share the endpoint. The token is not
auto-generated in OAuth mode; setting it is the opt-in.

### Performance Considerations
- Increased timeouts for disk operations (90s read timeout)
- Selective queries to avoid GraphQL type overflow issues
- Outbound token-bucket pacing (`core/client.py`, 90 tokens / 9 rps) and 429
  retry/backoff are separate from inbound rate limiting; no query cache exists
- Log file overwrite at 10MB cap to prevent disk space issues

## Critical Gotchas

### Mutation Handler Ordering
**Mutation handlers MUST return before the domain query dict lookup.** Mutations are not in the domain `_*_QUERIES` dicts (e.g., `_DOCKER_QUERIES`, `_ARRAY_QUERIES`) — reaching that line for a mutation subaction causes a `KeyError`. Always add early-return `if subaction == "mutation_name": ... return` blocks BEFORE the queries lookup.

### Test Patching
- Patch at the **core module level**: `unraid_mcp.core.client.make_graphql_request`. Tool
  modules import the client as a module (`from ..core import client as _client`) and call
  `_client.make_graphql_request(...)`, so they resolve the attribute on the `client` module
  object at call time — patching the core target intercepts every call. Patching a
  per-tool name like `unraid_mcp.tools.unraid.make_graphql_request` has **no effect** (that
  name is not bound in the tool module's namespace). `conftest.py`'s `mock_graphql_request` fixture patches it for you.
- Use `conftest.py`'s `make_tool_fn("unraid_mcp.tools.unraid", "register_unraid_tool", "unraid")`
  helper to extract the consolidated `unraid` tool fn, or a local `_make_tool()` pattern.

### Test Suite Structure
```
tests/
├── conftest.py           # Shared fixtures + make_tool_fn() helper
├── test_*.py             # Unit tests (mock at core client level)
├── http_layer/           # httpx-level request/response tests (respx)
├── integration/          # WebSocket subscription lifecycle tests (slow)
├── safety/               # Destructive action guard tests
├── schema/               # GraphQL query validation
├── contract/             # Response shape contract tests
└── property/             # Input validation property-based tests
```

### Running Targeted Tests
```bash
uv run pytest tests/safety/          # Destructive action guards only
uv run pytest tests/schema/          # GraphQL query validation only
uv run pytest tests/http_layer/      # HTTP/httpx layer only
uv run pytest tests/test_docker.py   # Single tool only
uv run pytest -x                     # Fail fast on first error
```

### Scripts
```bash
# Canonical live integration test — exercises the full HTTP stack and optionally
# docker/stdio modes. Direct JSON-RPC for HTTP (no mcporter dependency).
./tests/test_live.sh                                  # --mode all (default)
./tests/test_live.sh --mode http                      # http|docker|stdio|all
./tests/test_live.sh --url http://localhost:6970/mcp --token <tok>
./tests/test_live.sh --skip-auth                      # OAuth gateway deployments
./tests/test_live.sh --skip-tools                     # no live Unraid API needed
./tests/test_live.sh --verbose

# Destructive action smoke-test (confirms guard blocks without confirm=True)
./tests/mcporter/test-destructive.sh [MCP_URL]
```
See `tests/mcporter/README.md` for transport differences and `docs/DESTRUCTIVE_ACTIONS.md` for exact destructive-action test commands.

### API Reference Docs
- `docs/unraid/UNRAID-API-SUMMARY.md` — Condensed schema overview
- `docs/unraid/UNRAID-API-COMPLETE-REFERENCE.md` — Full GraphQL schema reference
- `docs/MARKETPLACE.md` — Plugin marketplace listing and publishing guide
- `docs/PUBLISHING.md` — Step-by-step instructions for publishing to Claude plugin registry

Use these when adding new queries/mutations.

### Versioning (release-please)
**Do NOT bump version strings by hand.** Versioning, tagging, and the CHANGELOG are
automated by [release-please](https://github.com/googleapis/release-please) driven by
Conventional Commit messages:
- `fix:` → patch, `feat:` → minor, `feat!:` / `BREAKING CHANGE` → major.

On every push to `main`, release-please maintains a "release PR" that bumps the version
in `pyproject.toml` + the three plugin manifests
(`agents/unraid-py/.claude-plugin/plugin.json`, `agents/unraid-py/.codex-plugin/plugin.json`,
`unraid-py/gemini-extension.json`) and prepends a CHANGELOG entry.
Merging that PR tags `vX.Y.Z` and triggers `publish-pypi.yml` + `docker-publish.yml`.

Config: `release-please-config.json` (which files get bumped) and
`.release-please-manifest.json` (last released version). `server.json` version fields are also
release-please-managed extra files. `src/unraid_mcp/version.py` reads from package
metadata. Do not manually bump either path; see [release ownership](../docs/RELEASING.md).

The release-please action needs a PAT/GitHub-App token (`RELEASE_PLEASE_TOKEN` secret); the
default `GITHUB_TOKEN` cannot trigger the downstream publish workflows.

### Credential Storage (`~/.unraid-mcp/.env`)
All runtimes (plugin, direct `uv run`) load credentials from `~/.unraid-mcp/.env`.
- **Status only:** `unraid(action="health", subaction="setup")` reports credential
  status and setup instructions. When configured, it performs a read-only
  connection probe. It does not prompt, write, or overwrite credentials; see
  `tools/_health.py::_handle_health`. A failed probe can be a transient outage.
- **Configuration:** use the plugin's userConfig form, or create/edit the
  credential file privately, then restart the server to reload it. Never replace
  an existing credential file blindly with a template. The example keys live
  in `.env.example`; `UNRAID_CREDENTIALS_DIR` changes the directory.
- **No symlinks needed.** Version bumps do not affect this path.
- **Permissions:** dir=700, file=600 (set automatically by elicitation; set manually if
  using `cp`: `chmod 700 ~/.unraid-mcp && chmod 600 ~/.unraid-mcp/.env`).

### Instruction files

Edit this `AGENTS.md`. `CLAUDE.md` and `GEMINI.md` are relative symlinks to
`AGENTS.md`, not separate copies. The root documentation checker enforces
this convention. Do not replace a regular instruction file without first
reviewing and preserving its contents.

## Work tracking and completion

Use `bd prime` when Beads is available. Shared-store migration failures require
coordination, not an automatic migration. Follow the root
[AGENTS.md](../AGENTS.md) for authorized commits/pushes and preservation of
pre-existing changes; do not discard stashes or unrelated work.
