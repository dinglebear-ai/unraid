# TEST_COVERAGE.md — `tests/test_live.sh`

Canonical live integration test for the `unraid-mcp` server. This document is the authoritative
reference for what the script tests, how every assertion is structured, and how to run each mode.
A QA engineer should be able to verify correctness of the script without executing it.

---

## 1. Overview

| Field | Value |
|---|---|
| Script | `tests/test_live.sh` |
| Service under test | Unraid home-server OS (NAS / hypervisor) |
| MCP server exercised | `unraid-mcp` — Python MCP server that proxies Unraid's GraphQL API |
| Transport protocols covered | Streamable-HTTP (primary), Docker container (build + run), stdio (subprocess) |
| Test approach | Direct JSON-RPC 2.0 over HTTP — no mcporter or secondary proxy dependency |
| Total tool subactions attempted | 52 (50 read-only + 2 destructive-guard bypass) |
| Destructive operations | None — all state-changing tools are invoked only with `confirm=true` to verify the guard bypasses correctly, not to execute the operation |

### What the script is not

- It is not a unit test. It requires (or optionally skips) a live Unraid API.
- It does not verify response _values_ beyond structural presence — it checks that the tool
  returned HTTP 200 with `isError != true`, not that specific field values match expected
  business data.
- It does not test write operations (container start/stop, VM actions beyond force_stop guard
  check, array operations, etc.) to avoid causing data loss or service disruption.
- It intentionally covers new read-only schema-drift surfaces in the live phase, including
  `system/network_interfaces`, `system/network_metrics`, `onboarding/internal_boot_context`,
  `live/network_metrics`, and `subscriptions/test_query` for `systemMetricsNetwork`.
- Some live API/config-dependent probes report `SKIP` instead of `FAIL` when the upstream
  Unraid appliance rejects a newly-added schema field or optional subsystem data is absent.
  The skipped subaction remains visible in the summary.

---

## 2. Prerequisites

The script checks for these binaries at startup and exits with code `2` if either is absent:

- `curl` — HTTP client for all network requests
- `jq` — JSON parsing for all assertions

For Docker mode: `docker` must be in `PATH` (soft requirement — skipped with `SKIP` if absent).

For stdio mode: `uv` must be in `PATH` (soft requirement — skipped with `SKIP` if absent).

---

## 3. How to Run

### 3.1 Modes and flags

```bash
# Default: runs all three modes sequentially (http → docker → stdio)
./tests/test_live.sh

# HTTP only — fastest, requires a running server
./tests/test_live.sh --mode http

# Docker only — builds image, starts container, tests, tears down
./tests/test_live.sh --mode docker

# Stdio only — spawns server subprocess via uv run
./tests/test_live.sh --mode stdio

# All three modes explicitly
./tests/test_live.sh --mode all

# Override endpoint and token
./tests/test_live.sh --url http://myhost:6970/mcp --token mytoken

# Skip auth tests (use when behind an OAuth gateway that handles auth)
./tests/test_live.sh --skip-auth

# Skip tool smoke tests (no live Unraid API available — tests MCP protocol only)
./tests/test_live.sh --skip-tools

# Show raw HTTP response bodies alongside test output
./tests/test_live.sh --verbose
```

### 3.2 Environment variables

| Variable | Required for | Default | Description |
|---|---|---|---|
| `UNRAID_API_URL` | docker, stdio | `http://127.0.0.1:1` (dummy) | Unraid GraphQL API base URL |
| `UNRAID_API_KEY` | docker, stdio | `ci-fake-key` (dummy) | Unraid API key |
| `UNRAID_MCP_BEARER_TOKEN` | http, docker | auto-read from `~/.unraid-mcp/.env` | MCP bearer token for authenticated requests |
| `TOKEN` | http, docker | alias for above | Alternate env var for the bearer token |
| `PORT` | all | `6970` | Override the server port |

### 3.3 Token auto-detection

If `TOKEN` / `UNRAID_MCP_BEARER_TOKEN` is not set on the command line or in the environment,
the script reads `~/.unraid-mcp/.env` and extracts `UNRAID_MCP_BEARER_TOKEN=...` from it.
If the file does not exist or the variable is absent, `TOKEN` remains empty and auth tests
are silently skipped.

### 3.4 Exit codes

| Code | Meaning |
|---|---|
| `0` | All tests passed (or intentionally skipped) |
| `1` | One or more tests failed |
| `2` | Prerequisite check failed (`curl` or `jq` missing, or invalid `--mode`) |

---

## 4. Test Phases

The script is structured into four numbered phases, run in order within each mode. Phases 1–4
share common implementation functions; each mode (http, docker, stdio) calls them after
establishing its own transport.

### Phase 1 — Middleware (no auth)

**Purpose:** Verify that unauthenticated HTTP endpoints respond correctly. These endpoints must
be publicly accessible without a bearer token (RFC 8414 / OAuth protected resource metadata).

**Runs in:** HTTP mode and Docker mode. Not run in stdio mode.

### Phase 2 — Auth enforcement

**Purpose:** Verify that the MCP endpoint enforces bearer token authentication — rejecting
requests with no token (401), rejecting requests with a wrong token (401), and accepting
requests with the correct token.

**Runs in:** HTTP mode and Docker mode. Not run in stdio mode.

### Phase 3 — MCP Protocol

**Purpose:** Verify the MCP JSON-RPC handshake (`initialize`, `tools/list`, `ping`) works
correctly and returns well-formed responses with the expected structure.

**Runs in:** HTTP mode, Docker mode, and stdio mode (stdio has its own Phase 3 implementation).

### Phase 4 — Tool smoke-tests (non-destructive)

**Purpose:** Call every read-only `unraid` tool subaction and verify it returns HTTP 200 with
`isError != true`. No assertions are made on response field values — this phase proves
connectivity and basic API reachability.

**Runs in:** HTTP mode and Docker mode only. Skipped with `--skip-tools`.

### Phase 4b — Destructive action guards

**Purpose:** Verify that destructive operations do NOT require the user to re-confirm when
`confirm=true` is passed — i.e., `confirm=true` correctly bypasses the guard prompt.

---

## 5. Phase 1 — Middleware (no auth)

### 5.1 `/health` endpoint

| Field | Value |
|---|---|
| URL | `GET {base_url}/health` |
| Auth | None (unauthenticated) |
| Expected HTTP status | `200` |
| jq assertion | `.status == "ok"` |
| PASS | HTTP 200 AND body contains `{"status":"ok"}` |
| FAIL | Any other status code, or status field is not `"ok"` |

The base URL is derived from `MCP_URL` by stripping the trailing `/mcp` path segment
(e.g., `http://localhost:6970/mcp` → `http://localhost:6970`).

### 5.2 `/.well-known/oauth-protected-resource`

| Field | Value |
|---|---|
| URL | `GET {base_url}/.well-known/oauth-protected-resource` |
| Auth | None |
| Expected HTTP status | `200` |
| PASS | HTTP 200 |
| FAIL | Any other status |

On HTTP 200, two sub-assertions are evaluated:

**Sub-assertion A — `bearer_methods_supported` present:**

| Field | Value |
|---|---|
| jq filter | `.bearer_methods_supported \| length > 0` |
| PASS | Array is non-empty |
| FAIL | Array is absent, null, or empty |
| SKIP | Parent assertion (HTTP 200) failed |

**Sub-assertion B — `resource` field present:**

| Field | Value |
|---|---|
| jq filter | `.resource \| length > 0` |
| PASS | String is non-empty |
| FAIL | Field is absent, null, or empty |
| SKIP | Parent assertion (HTTP 200) failed |

### 5.3 `/.well-known/oauth-protected-resource/mcp`

| Field | Value |
|---|---|
| URL | `GET {base_url}/.well-known/oauth-protected-resource/mcp` |
| Auth | None |
| Expected HTTP status | `200` |
| PASS | HTTP 200 |
| FAIL | Any other status |

No sub-assertions — presence of the endpoint is sufficient.

---

## 6. Phase 2 — Auth enforcement

Phase 2 is skipped entirely if `--skip-auth` is passed, or if no token is configured (in which
case auth is assumed to be disabled). All three tests are marked `SKIP` with a reason string.

### 6.1 No-token request

**What it does:** Sends a `POST` to `MCP_URL` with a valid JSON-RPC `ping` payload but with
no `Authorization` header.

```
POST /mcp HTTP/1.1
Content-Type: application/json
Accept: application/json, text/event-stream

{"jsonrpc":"2.0","id":99,"method":"ping","params":null}
```

| Field | Value |
|---|---|
| Expected HTTP status | `401` |
| PASS | HTTP status is exactly `"401"` |
| FAIL | Any other status (e.g., `200` would indicate auth is disabled) |

### 6.2 Wrong-token request

**What it does:** Sends the same `ping` payload with a deliberately incorrect bearer token:
`Bearer this-is-the-wrong-token-intentionally`.

| Field | Value |
|---|---|
| Expected HTTP status | `401` |
| PASS (preferred) | HTTP 401 AND `.error == "invalid_token"` in response body |
| PASS (fallback) | HTTP 401 with any error field value (or absent) |
| FAIL | Any non-401 status |

The test inspects the response body's `.error` field. If it equals `"invalid_token"` the label
reads `"bad-token → 401 invalid_token"`; otherwise it reads `"bad-token → 401 (error field: …)"`.
Both are recorded as PASS — the sub-check on the error field value is informational.

### 6.3 Good-token request

**What it does:** Sends a full MCP `initialize` request with the configured valid bearer token.

```
POST /mcp HTTP/1.1
Content-Type: application/json
Accept: application/json, text/event-stream
Authorization: Bearer <TOKEN>

{"jsonrpc":"2.0","id":1,"method":"initialize","params":{
  "protocolVersion":"2024-11-05",
  "capabilities":{},
  "clientInfo":{"name":"test_live","version":"0"}
}}
```

| Field | Value |
|---|---|
| Condition for PASS | HTTP status is NOT `401` AND NOT `403` |
| PASS | Any status other than 401 or 403 (typically 200) |
| FAIL | HTTP 401 or 403 |

This test does not assert a specific status — it only proves the server does not reject a
valid token.

---

## 7. Phase 3 — MCP Protocol

### 7.1 `initialize`

**What it does:** Posts MCP protocol initialization request.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {},
    "clientInfo": {"name": "test_live", "version": "0"}
  }
}
```

| Field | Value |
|---|---|
| Expected HTTP status | `200` |
| PASS | HTTP 200 |
| FAIL | Any other status (with body excerpt in label) |

On HTTP 200, two sub-assertions:

**`serverInfo.name` present:**

| jq filter | `.result.serverInfo.name \| length > 0` |
|---|---|
| PASS | Name string is non-empty |
| FAIL | Field absent, null, or empty |
| SKIP | `initialize` returned non-200 |

**`protocolVersion` present:**

| jq filter | `.result.protocolVersion \| length > 0` |
|---|---|
| PASS | Version string is non-empty |
| FAIL | Field absent, null, or empty |
| SKIP | `initialize` returned non-200 |

The `mcp_post` helper extracts the `Mcp-Session-Id` response header and stores it in
`MCP_SESSION_ID`. Subsequent requests in the same mode run include this header automatically.

SSE response handling: if the response body contains lines starting with `data:`, the helper
extracts the first `data:` line and strips the prefix before parsing JSON.

### 7.2 `tools/list`

```json
{"jsonrpc":"2.0","id":2,"method":"tools/list","params":null}
```

| Field | Value |
|---|---|
| Expected HTTP status | `200` |
| PASS | HTTP 200 |
| FAIL | Any other status |

The tool count (`jq '.result.tools \| length'`) is printed in the PASS label for informational
purposes but not asserted against a minimum.

On HTTP 200, two sub-assertions:

**`unraid` tool present:**

| jq filter | `.result.tools[] \| select(.name == "unraid") \| .name` |
|---|---|
| PASS | Filter returns non-empty, non-null string |
| FAIL | No tool named `"unraid"` found |
| SKIP | `tools/list` returned non-200 |

**`diagnose_subscriptions` tool present:**

| jq filter | `.result.tools[] \| select(.name == "diagnose_subscriptions") \| .name` |
|---|---|
| PASS | Filter returns non-empty, non-null string |
| FAIL | No tool named `"diagnose_subscriptions"` found |
| SKIP | `tools/list` returned non-200 |

These two assertions confirm the server exposes exactly the two expected top-level tools.

### 7.3 `ping`

```json
{"jsonrpc":"2.0","id":3,"method":"ping","params":null}
```

| Field | Value |
|---|---|
| Expected HTTP status | `200` |
| PASS | HTTP 200 |
| SKIP (not FAIL) | Any non-200 status — `ping` is treated as optional |

Ping is not a required MCP method; the test tolerates absence.

---

## 8. Phase 4 — Tool Smoke Tests

All smoke tests use the `call_unraid` helper, which:

1. Builds a `tools/call` JSON-RPC request targeting the `unraid` tool with the given
   `action` and `subaction` arguments.
2. Sends it via `mcp_post`.
3. PASS condition: HTTP 200 AND `.result.isError != true`.
4. FAIL condition: HTTP status other than 200, OR `.result.isError == true`.
   When `isError` is true, the first 100 characters of `.result.content[0].text` are appended
   to the FAIL label.

The JSON-RPC payload structure for each call:

```json
{
  "jsonrpc": "2.0",
  "id": <N>,
  "method": "tools/call",
  "params": {
    "name": "unraid",
    "arguments": {
      "action": "<action>",
      "subaction": "<subaction>"
    }
  }
}
```

Extra arguments (e.g., `provider_type`) are merged into the `arguments` object via jq.

### 8.1 Complete list of smoke-tested subactions

#### `health` action

| Test label | action | subaction | Extra args | Notes |
|---|---|---|---|---|
| `unraid health/check` | `health` | `check` | — | Basic connectivity check to Unraid API |
| `unraid health/test_connection` | `health` | `test_connection` | — | Tests GraphQL API reachability |
| `unraid health/diagnose` | `health` | `diagnose` | — | Detailed health diagnostic |

#### `system` action

| Test label | action | subaction | Extra args | Notes |
|---|---|---|---|---|
| `unraid system/overview` | `system` | `overview` | — | Full system overview |
| `unraid system/network` | `system` | `network` | — | Network interfaces and configuration |
| `unraid system/array` | `system` | `array` | — | Disk array state |
| `unraid system/registration` | `system` | `registration` | — | License/registration info |
| `unraid system/variables` | `system` | `variables` | — | Unraid system variables |
| `unraid system/metrics` | `system` | `metrics` | — | Performance metrics |
| `unraid system/network_metrics` | `system` | `network_metrics` | — | Current network throughput metrics; skips on older schemas |
| `unraid system/services` | `system` | `services` | — | Running services |
| `unraid system/display` | `system` | `display` | — | Display/UI settings |
| `unraid system/config` | `system` | `config` | — | System configuration |
| `unraid system/online` | `system` | `online` | — | Online/connectivity status |
| `unraid system/owner` | `system` | `owner` | — | Server owner information |
| `unraid system/settings` | `system` | `settings` | — | System settings |
| `unraid system/server` | `system` | `server` | — | Single server info |
| `unraid system/servers` | `system` | `servers` | — | All known servers |
| `unraid system/flash` | `system` | `flash` | — | USB flash device info |
| `unraid system/ups_devices` | `system` | `ups_devices` | — | UPS device list |
| `unraid system/network_interfaces` | `system` | `network_interfaces` | — | Extended network interface list; skips on older schemas |

#### `array` action

| Test label | action | subaction | Extra args | Notes |
|---|---|---|---|---|
| `unraid array/parity_status` | `array` | `parity_status` | — | Current parity check status |
| `unraid array/parity_history` | `array` | `parity_history` | — | Historical parity check records |

#### `disk` action

| Test label | action | subaction | Extra args | Notes |
|---|---|---|---|---|
| `unraid disk/shares` | `disk` | `shares` | — | User shares list |
| `unraid disk/disks` | `disk` | `disks` | — | All disk devices |
| `unraid disk/log_files` | `disk` | `log_files` | — | Available log files |

#### `docker` action

| Test label | action | subaction | Extra args | Notes |
|---|---|---|---|---|
| `unraid docker/list` | `docker` | `list` | — | All Docker containers |
| `unraid docker/networks` | `docker` | `networks` | — | Docker networks |

#### `vm` action

| Test label | action | subaction | Extra args | Notes |
|---|---|---|---|---|
| `unraid vm/list` | `vm` | `list` | — | All virtual machines |

#### `notification` action

| Test label | action | subaction | Extra args | Notes |
|---|---|---|---|---|
| `unraid notification/overview` | `notification` | `overview` | — | Notification summary counts |
| `unraid notification/list` | `notification` | `list` | — | Full notification list |
| `unraid notification/recalculate` | `notification` | `recalculate` | — | Trigger notification recalculation |

#### `user` action

| Test label | action | subaction | Extra args | Notes |
|---|---|---|---|---|
| `unraid user/me` | `user` | `me` | — | Current authenticated user info |

#### `key` action

| Test label | action | subaction | Extra args | Notes |
|---|---|---|---|---|
| `unraid key/list` | `key` | `list` | — | API keys list |

#### `rclone` action

| Test label | action | subaction | Extra args | Notes |
|---|---|---|---|---|
| `unraid rclone/list_remotes` | `rclone` | `list_remotes` | — | Configured rclone remotes |
| `unraid rclone/config_form` | `rclone` | `config_form` | `{"provider_type":"s3"}` | Config form for S3 provider |

`rclone/config_form` is the only smoke test that passes extra arguments — `provider_type` is
set to `"s3"` to exercise argument merging.

#### `plugin` action

| Test label | action | subaction | Extra args | Notes |
|---|---|---|---|---|
| `unraid plugin/list` | `plugin` | `list` | — | Installed Unraid plugins |

#### `customization` action

| Test label | action | subaction | Extra args | Notes |
|---|---|---|---|---|
| `unraid customization/theme` | `customization` | `theme` | — | Active UI theme |
| `unraid customization/public_theme` | `customization` | `public_theme` | — | Public-facing theme settings |
| `unraid customization/sso_enabled` | `customization` | `sso_enabled` | — | SSO enabled flag |
| `unraid customization/is_initial_setup` | `customization` | `is_initial_setup` | — | Whether initial setup is complete |

#### `oidc` action

| Test label | action | subaction | Extra args | Notes |
|---|---|---|---|---|
| `unraid oidc/providers` | `oidc` | `providers` | — | Configured OIDC providers |
| `unraid oidc/public_providers` | `oidc` | `public_providers` | — | Public OIDC provider list |
| `unraid oidc/configuration` | `oidc` | `configuration` | — | OIDC server configuration |

#### `live` action

| Test label | action | subaction | Extra args | Notes |
|---|---|---|---|---|
| `unraid live/cpu` | `live` | `cpu` | — | Real-time CPU usage |
| `unraid live/memory` | `live` | `memory` | — | Real-time memory usage |
| `unraid live/cpu_telemetry` | `live` | `cpu_telemetry` | — | Detailed CPU telemetry |
| `unraid live/notifications_overview` | `live` | `notifications_overview` | — | Live notification overview |
| `unraid live/network_metrics` | `live` | `network_metrics` | — | Live network throughput metrics; skips on older schemas |
| `unraid subscriptions/test_query systemMetricsNetwork` | `subscriptions` | `test_query` | `subscription_query` | Diagnostic probe for `systemMetricsNetwork`; skips on older schemas |

### 8.2 What "PASS" means for each smoke test

For all 50 read-only subactions listed above, PASS means:

1. The MCP server returned HTTP `200`.
2. The response body does NOT have `.result.isError == true`.

PASS does NOT mean:
- The Unraid API returned useful data.
- Any specific field is present in the response.
- The response matches a schema.

These tests are "did it blow up" smoke tests, not field-level validation tests.

---

## 9. Phase 4b — Destructive Action Guards

This sub-phase tests that the `confirm=true` flag correctly bypasses the safety guard that
would otherwise tell the user to re-run the command with `confirm=true`.

The guard check logic: if the tool response body (`.result.content[0].text`) contains the
string `"re-run with confirm"` (case-insensitive), the guard did NOT accept `confirm=true`
and the test fails.

### 9.1 `notification/delete` guard bypass

```json
{
  "name": "unraid",
  "arguments": {
    "action": "notification",
    "subaction": "delete",
    "confirm": true,
    "notification_id": "test-guard-check-nonexistent"
  }
}
```

| Field | Value |
|---|---|
| Test label | `notification/delete guard bypass` |
| `notification_id` | `"test-guard-check-nonexistent"` — deliberately nonexistent ID |
| FAIL (guard rejected) | Response text matches `/re-run with confirm/i` |
| PASS | HTTP 200 AND guard text not present (even if deletion fails due to nonexistent ID) |
| FAIL (other) | HTTP status other than 200 |

The nonexistent ID ensures no actual notification is deleted. The test only verifies that
`confirm=true` was accepted by the guard layer.

### 9.2 `vm/force_stop` guard bypass

```json
{
  "name": "unraid",
  "arguments": {
    "action": "vm",
    "subaction": "force_stop",
    "confirm": true
  }
}
```

| Field | Value |
|---|---|
| Test label | `vm/force_stop guard bypass` |
| Extra args | None beyond `confirm=true` |
| FAIL (guard rejected) | Response text matches `/re-run with confirm/i` |
| PASS | HTTP 200 AND guard text not present |
| FAIL (other) | HTTP status other than 200 |

No VM ID is supplied, so the actual force-stop operation is expected to fail at the API level
(no target) rather than succeed. The guard bypass test passes regardless of whether the
underlying operation succeeds.

---

## 10. Skipped Tests and Why

| Test / Section | Skip condition | Reason |
|---|---|---|
| Phase 2 (all three auth tests) | `--skip-auth` flag | OAuth gateway handles auth externally; MCP server may not enforce tokens |
| Phase 2 (all three auth tests) | No token configured | Auth appears disabled; can't meaningfully test 401 behavior |
| Phase 4 and 4b (all tool tests) | `--skip-tools` flag | No live Unraid API available; Phase 3 protocol tests remain active |
| Docker mode (all) | `docker` not in `PATH` | Docker unavailable in this environment |
| Stdio mode (all) | `uv` not in `PATH` | `uv` Python runner unavailable |
| `ping → 200` | Server returns non-200 | `ping` is optional in MCP; treated as non-fatal |
| `serverInfo.name` / `protocolVersion` | `initialize` returned non-200 | Parent test failed; child tests skipped with `"initialize failed"` |
| `unraid tool present` / `diagnose_subscriptions present` | `tools/list` returned non-200 | Parent test failed; child tests skipped with `"tools/list failed"` |
| `bearer_methods_supported` / `resource` | `/.well-known/…` returned non-200 | Parent test failed; child tests skipped with `"parent failed"` |
| Container teardown | Container already removed | Marked SKIP (not FAIL) — idempotent teardown |

**Why write operations are excluded from Phase 4:**

The script's design philosophy is "non-destructive" smoke testing. Operations that create,
modify, or delete state on the Unraid server (array operations, container start/stop, VM
create/delete, user management writes, plugin install/uninstall, etc.) are not called in
Phase 4 to avoid data loss, service disruption, or hard-to-reverse side effects in a CI or
production environment.

The only partial exception is Phase 4b, which calls two destructive subactions
(`notification/delete`, `vm/force_stop`) but does so with a nonexistent ID / no ID, ensuring
the underlying API operation cannot succeed even if the guard is bypassed.

---

## 11. Docker Mode — Full Lifecycle

Docker mode does a complete lifecycle: build image → start container → health poll →
run all four phases → tear down.

### 11.1 Prerequisites

- `docker` in `PATH` (otherwise entire docker mode is `SKIP`).
- `UNRAID_API_URL` and `UNRAID_API_KEY` env vars (defaults to dummy values if unset).

### 11.2 Build

```bash
docker build -t unraid-mcp-test <REPO_DIR>
```

| Field | Value |
|---|---|
| Image name | `unraid-mcp-test` |
| Build context | Repository root (`$REPO_DIR`) — uses `Dockerfile` at repo root |
| stdout/stderr | Suppressed (`>/dev/null 2>&1`) |
| PASS | Build exits 0 |
| FAIL | Build exits non-zero — all subsequent docker tests are skipped (early return) |

### 11.3 Container start

```bash
docker run -d \
  --name unraid-mcp-test-<PID> \
  -p <PORT>:6970 \
  -e UNRAID_MCP_TRANSPORT=streamable-http \
  -e UNRAID_MCP_BEARER_TOKEN=ci-integration-token \
  -e UNRAID_MCP_DISABLE_HTTP_AUTH=false \
  -e UNRAID_API_URL=<UNRAID_API_URL or http://127.0.0.1:1> \
  -e UNRAID_API_KEY=<UNRAID_API_KEY or ci-fake-key> \
  unraid-mcp-test
```

Key environment variables injected into the container:

| Variable | Value |
|---|---|
| `UNRAID_MCP_TRANSPORT` | `streamable-http` |
| `UNRAID_MCP_BEARER_TOKEN` | `ci-integration-token` (hardcoded test token) |
| `UNRAID_MCP_DISABLE_HTTP_AUTH` | `false` (auth is enabled) |
| `UNRAID_API_URL` | From env or dummy `http://127.0.0.1:1` |
| `UNRAID_API_KEY` | From env or dummy `ci-fake-key` |

After `docker run`, `TOKEN` is set to `"ci-integration-token"` so Phase 2 auth tests use
the correct token. `MCP_URL` is updated to `http://localhost:<PORT>/mcp`.

Container name includes the shell PID (`$$`) to avoid name collisions in parallel CI runs.

### 11.4 Health poll

```bash
# Polls up to 30 times, 1 second apart
curl -sf -H "Accept: application/json, text/event-stream" \
  http://localhost:<PORT>/health
```

| Field | Value |
|---|---|
| Poll interval | 1 second |
| Max attempts | 30 (30 second timeout) |
| PASS | Server responds to `/health` within 30 seconds |
| FAIL | No healthy response after 30 seconds — last 20 lines of container logs printed |

On FAIL, the container is removed and the function returns 1 (aborting docker mode).

### 11.5 Test phases

Runs `run_phase1`, `run_phase2`, `run_phase3`, `run_phase4` against the container's endpoint.
`MCP_SESSION_ID` is reset to empty before Phase 1.

### 11.6 Teardown

```bash
docker rm -f unraid-mcp-test-<PID>
```

| Field | Value |
|---|---|
| PASS | Container removed successfully |
| SKIP | `docker rm -f` fails (container already gone — treated as idempotent) |

Teardown runs regardless of test phase outcomes (no `trap` but the teardown call is
unconditional in the function body).

---

## 12. Stdio Mode — Subprocess Protocol Handshake

Stdio mode bypasses HTTP entirely. It spawns the MCP server as a subprocess, writes JSON-RPC
requests to stdin, and reads responses from stdout.

### 12.1 Prerequisites

- `uv` in `PATH` (otherwise entire stdio mode is `SKIP`).
- `UNRAID_API_URL` and `UNRAID_API_KEY` env vars (defaults to dummy values if unset).

### 12.2 Server invocation

```bash
printf '%s\n%s\n' "$init_req" "$list_req" \
  | UNRAID_MCP_TRANSPORT=stdio \
    UNRAID_API_URL=<...> \
    UNRAID_API_KEY=<...> \
    uv run --directory <REPO_DIR> --from . unraid-mcp-server \
    2>/dev/null \
  | head -c 16384
```

Key details:
- Transport is set to `stdio` via `UNRAID_MCP_TRANSPORT=stdio`.
- `uv run` is used to launch the server from the repository root without a separate install step.
- The entry point is the `unraid-mcp-server` console script defined in `pyproject.toml`.
- stderr is discarded (`2>/dev/null`) — only stdout (JSON-RPC responses) is captured.
- Output is capped at 16 KiB (`head -c 16384`) to prevent runaway output.
- The subprocess exits naturally when stdin is closed (end of `printf` pipe).

### 12.3 Two requests sent

**Request 1 — `initialize`:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {},
    "clientInfo": {"name": "test_live_stdio", "version": "0"}
  }
}
```

**Request 2 — `tools/list`:**
```json
{"jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": null}
```

### 12.4 Response parsing

The server is expected to write one JSON object per line (newline-delimited JSON). The script
parses:
- Line 1 = `initialize` response
- Line 2 = `tools/list` response

**Initialize response assertions:**

| Assertion | jq filter | PASS | FAIL |
|---|---|---|---|
| Response received | `.result.serverInfo.name \| length > 0` | Non-empty name | No response or invalid JSON |
| `serverInfo.name` logged | `jq -r '.result.serverInfo.name'` | Prints name in label | (informational — no separate pass/fail) |

Note: the `serverInfo.name` value is extracted and embedded in the PASS label string
(e.g., `"stdio: serverInfo.name = unraid-mcp"`). Both are recorded as separate PASS entries.

**`tools/list` response assertions:**

| Assertion | jq filter | PASS | FAIL |
|---|---|---|---|
| Response received with tools | `.result.tools \| length > 0` | At least 1 tool | Empty or missing |
| `unraid` tool present | `.result.tools[] \| select(.name == "unraid")` | Match found | No `unraid` tool |

The tool count is embedded in the PASS label (e.g., `"stdio: tools/list response (2 tools)"`).

### 12.5 What stdio mode does NOT test

- Auth (no bearer token in stdio mode — transport is direct)
- Phase 1 middleware endpoints (no HTTP server running)
- Phase 4 tool calls (no HTTP mode infrastructure)
- SSE response format (stdio uses plain newline-delimited JSON)

---

## 13. Output Format and Interpretation

### 13.1 Per-test lines

Each test produces one line:

```
  <label padded to 62 chars>                                    PASS   (green)
  <label padded to 62 chars>                                    FAIL   (red)
  <label padded to 62 chars>                                    SKIP   (yellow, with reason in dim)
```

Color codes are stripped when stdout is not a TTY (e.g., CI log files).

### 13.2 Section headers

```
━━━ Phase 1 · Middleware (no auth) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 13.3 Summary block

```
Results: 47 passed  0 failed  3 skipped  (50 total)
```

On any failures, a bullet list of failed test labels follows:

```
Failed tests:
  • /health → 200 {status:ok}
  • initialize → 200
```

### 13.4 Verbose mode

With `--verbose`, raw HTTP response bodies are printed in dim text after each request.
jq filter and truncated body (first 300 chars) are also printed after each failed
`assert_jq` call.

### 13.5 Interpreting results

| Result | Meaning |
|---|---|
| All PASS | Server is correctly implementing the MCP protocol and all Unraid API endpoints are reachable |
| FAIL on Phase 1 | Server not running, wrong port, or middleware misconfigured |
| FAIL on Phase 2 | Auth layer broken — token not being enforced or correct token being rejected |
| FAIL on Phase 3 | MCP protocol handler broken — `initialize` or `tools/list` not returning correct structure |
| FAIL on Phase 4 | Specific Unraid API action/subaction failing — check Unraid API connectivity and API key |
| FAIL on Phase 4b | Guard layer broken — `confirm=true` not being recognized |
| SKIP (most) | Expected in CI without live Unraid API — use `--skip-tools` |
| SKIP on Docker | Docker not available in this environment |
| SKIP on stdio | `uv` not available in this environment |

---

## 14. Internal Helper Reference

### `mcp_post METHOD [PARAMS_JSON]`

Posts a JSON-RPC 2.0 request to `MCP_URL`. Sets globals:
- `HTTP_STATUS` — curl HTTP status code string (e.g., `"200"`)
- `HTTP_BODY` — response body (SSE `data:` prefix stripped if present)
- `MCP_RESULT` — `.result` field from body (may be empty)
- `MCP_ERROR` — `.error` field from body (may be empty)
- `MCP_SESSION_ID` — updated if `Mcp-Session-Id` header present in response

### `assert_jq LABEL JSON_INPUT JQ_FILTER`

Evaluates `jq -r "$filter"` against `$body`. PASS if result is non-empty, non-null, and
non-false. FAIL otherwise.

### `call_unraid LABEL ACTION SUBACTION [EXTRA_ARGS_JSON]`

Builds and posts a `tools/call` for the `unraid` tool. PASS if HTTP 200 and `isError != true`.
Extra args JSON is merged into the `arguments` object.

### `http_get URL [extra_curl_args...]`

Simple GET request. Sets `HTTP_STATUS` and `HTTP_BODY`. No auth headers added.

### `_guard_bypass_test LABEL ACTION SUBACTION [ARGS_JSON]`

Internal function for Phase 4b. Sends `tools/call` with `confirm: true`. Checks response text
does NOT contain `"re-run with confirm"`. PASS means the guard accepted `confirm=true`.

---

## 15. Coverage Summary

| Category | Subactions tested | Destructive? |
|---|---|---|
| health | 3 (check, test_connection, diagnose) | No |
| system | 18 (overview, network, array, registration, variables, metrics, network_metrics, services, display, config, online, owner, settings, server, servers, flash, ups_devices, network_interfaces) | No |
| array | 2 (parity_status, parity_history) | No |
| disk | 3 (shares, disks, log_files) | No |
| docker | 2 (list, networks) | No |
| vm | 1 (list) | No |
| notification | 3 (overview, list, recalculate) | No |
| user | 1 (me) | No |
| key | 1 (list) | No |
| rclone | 2 (list_remotes, config_form) | No |
| plugin | 1 (list) | No |
| customization | 4 (theme, public_theme, sso_enabled, is_initial_setup) | No |
| oidc | 3 (providers, public_providers, configuration) | No |
| live/subscriptions | 6 (cpu, memory, cpu_telemetry, notifications_overview, network_metrics, subscriptions/test_query) | No |
| **Guard bypass** | 2 (notification/delete, vm/force_stop) | Guarded (confirm=true) |
| **Total** | **52** | — |

**Not tested (by design):**

- `docker/start`, `docker/stop`, `docker/restart`, `docker/remove` — container state changes
- `vm/start`, `vm/stop`, `vm/restart`, `vm/remove` — VM state changes
- `array/start`, `array/stop`, `array/mount`, `array/unmount` — array state changes
- `notification/delete` (actual execution) — tested as guard bypass only
- `vm/force_stop` (actual execution) — tested as guard bypass only
- `user/create`, `user/delete`, `user/update` — user management writes
- `plugin/install`, `plugin/uninstall`, `plugin/update` — plugin management writes
- `key/create`, `key/delete` — API key management
- `rclone/create_remote`, `rclone/delete_remote` — rclone configuration writes
- `customization/update` — UI customization writes
- Any SSE subscription or long-polling endpoints
