# Component Inventory -- unraid-mcp

Complete listing of all plugin components.

## MCP tools

| Tool | Type | Module | Description |
| --- | --- | --- | --- |
| `unraid` | Primary (only tool) | `tools/unraid.py` | Unified action/subaction router: 19 actions, 178 subactions. The Markdown reference (`help` action) and WebSocket diagnostics (`subscriptions` action, handled in `subscriptions/diagnostics.py`) are folded into this single tool. |

## MCP resources

| URI | Source | Description |
| --- | --- | --- |
| `unraid://logs/stream` | `logFileSubscription` | Real-time log stream data |
| `unraid://live/cpu` | `cpu` subscription | Live CPU utilization |
| `unraid://live/memory` | `memory` subscription | Live memory usage |
| `unraid://live/cpu_telemetry` | `cpu_telemetry` subscription | CPU power and temperature |
| `unraid://live/array_state` | `array_state` subscription | Array state changes |
| `unraid://live/parity_progress` | `parity_progress` subscription | Parity check progress |
| `unraid://live/ups_status` | `ups_status` subscription | UPS battery and power |
| `unraid://live/notifications_overview` | `notifications_overview` subscription | Notification counts |
| `unraid://live/owner` | `owner` subscription | Server owner info |
| `unraid://live/server_status` | `server_status` subscription | Server status and connectivity |

## Action domains

| Domain | Subaction count | Module | Destructive? |
| --- | --- | --- | --- |
| `system` | 23 | `tools/_system.py` | No |
| `health` | 4 | `tools/_health.py` (+ handler in `tools/unraid.py`) | No |
| `array` | 14 | `tools/_array.py` | Yes (3) |
| `disk` | 6 | `tools/_disk.py` | Yes (1) |
| `docker` | 26 | `tools/_docker.py` | Yes (3) |
| `vm` | 9 | `tools/_vm.py` | Yes (2) |
| `notification` | 13 | `tools/_notification.py` | Yes (2) |
| `key` | 13 | `tools/_key.py` | Yes (1) |
| `plugin` | 8 | `tools/_plugin.py` | Yes (3) |
| `rclone` | 4 | `tools/_rclone.py` | Yes (1) |
| `setting` | 6 | `tools/_setting.py` | Yes (3) |
| `connect` | 8 | `tools/_connect.py` | Yes (5) |
| `customization` | 6 | `tools/_customization.py` | No |
| `oidc` | 5 | `tools/_oidc.py` | No |
| `onboarding` | 11 | `tools/_onboarding.py` | Yes (2) |
| `user` | 1 | `tools/_user.py` | No |
| `live` | 16 | `tools/_live.py` | No |
| `subscriptions` | 2 | `subscriptions/diagnostics.py` | No |
| `help` | 0 | `tools/unraid.py` | No |

## Middleware chain

| Layer | Class | Purpose |
| --- | --- | --- |
| 1 (outermost) | `LoggingMiddleware` | Logs every tools/call and resources/read with duration |
| 2 | `ErrorHandlingMiddleware` | Converts unhandled exceptions to MCP errors |
| 3 | `SlidingWindowRateLimitingMiddleware` | 540 req/min sliding window (inbound abuse/DoS guard; the authoritative upstream limiter is the token bucket in `core/client.py`) |
| 4 (innermost) | `StructuredResponseLimitingMiddleware` | Replaces responses over the cap (40 KB default, `UNRAID_MCP_MAX_RESPONSE_BYTES`) with a parseable JSON truncation marker |

## ASGI middleware

| Layer | Class | Purpose |
| --- | --- | --- |
| 1 (outermost) | `HealthMiddleware` | `GET /health` returns 200 without auth |
| 2 | `WellKnownMiddleware` | RFC 9728 OAuth protected resource metadata |
| 3 (innermost) | `BearerAuthMiddleware` | RFC 6750 bearer token validation |

## Plugin manifests

| File | Client | Transport |
| --- | --- | --- |
| `agents/unraid-py/.claude-plugin/plugin.json` | Claude Code | stdio (via `uv run`) |
| `agents/unraid-py/.codex-plugin/plugin.json` | Codex CLI | stdio (via `.mcp.json`) |
| `gemini-extension.json` | Gemini CLI | stdio (via `uv run`) |
| `server.json` | MCP Registry (tv.tootie/unraid-mcp) | stdio (PyPI package) |

## Skills

| Path | Name | Description |
| --- | --- | --- |
| `agents/unraid-py/skills/unraid/SKILL.md` | unraid | Client-facing skill with all domains, subactions, and workflows |

## scripts/

| Path | Language | Description |
| --- | --- | --- |
| `scripts/block-env-commits.sh` | Bash | Pre-commit hook: block accidental .env file commits |
| `scripts/check-version-sync.sh` | Bash | Verify version consistency across pyproject.toml and manifests |
| `scripts/validate-marketplace.sh` | Bash | Validate Claude Code marketplace and plugin manifest structure |
| `scripts/generate_unraid_api_reference.py` | Python | Generate canonical GraphQL API docs from live Unraid introspection |
| `agents/unraid-py/scripts/plugin-setup.sh` | Bash | Manual credential setup: persist userConfig credentials to `~/.unraid-mcp/.env` via `uvx unraid-mcp setup plugin-hook` |

## Hooks

**None.** The plugin's `SessionStart` + `ConfigChange` credential-setup hooks and the
`agents/unraid-py/hooks/` directory were removed on 2026-07-27. Neither plugin manifest
declares a `"hooks"` key. `plugin-setup.sh` survives as a manual entry point.
See `docs/plugin/HOOKS.md`.

## CI/CD workflows

| Workflow | Trigger | Jobs |
| --- | --- | --- |
| `ci.yml` | Push/PR to main | lint, typecheck, test, version-sync, mcp-integration, audit, gitleaks |
| `release-please.yml` | Push to main | Maintain release PR (version bump + CHANGELOG), tag + GitHub Release on merge |
| `docker-publish.yml` | Push to main/tags | Build multi-arch Docker image, push to ghcr.io, Trivy scan |
| `publish-pypi.yml` | `release: published` | Build, PyPI publish, upload artifacts, MCP registry publish |

## Test suites

| Directory | Focus | Count |
| --- | --- | --- |
| `tests/` (root) | Unit tests per domain | 40 test files |
| `tests/safety/` | Destructive action guards | guard verification |
| `tests/schema/` | GraphQL query validation | 119 tests |
| `tests/http_layer/` | httpx request/response | HTTP client tests |
| `tests/integration/` | WebSocket subscription lifecycle | slow, live tests |
| `tests/contract/` | Response shape contracts | shape validation |
| `tests/property/` | Input validation (Hypothesis) | property-based |
