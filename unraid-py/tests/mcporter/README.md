# mcporter Integration Tests

Live integration smoke-tests for the unraid-mcp server.

---

## Generated GraphQL Operation Inventory

Use the generated inventory before adding or updating live smoke tests. It is
derived from the same action/subaction query and mutation dictionaries that the
schema dispatch contract tests exercise, so it includes **all** GraphQL reads and
mutations plus internal helper queries and live subscription documents:

```bash
scripts/list_graphql_operations.py
scripts/list_graphql_operations.py --json
```

Use the root-field parity report when checking whether that inventory tracks the
vendored Unraid schema surface:

```bash
scripts/report_api_parity.py
scripts/report_api_parity.py --json
```

Live smoke scripts should consume this inventory or be checked against it rather
than carrying a hand-maintained action list.

---

## Canonical runner — `tests/test_live.sh`

Non-destructive integration smoke-tests now live in a single canonical runner,
[`tests/test_live.sh`](../test_live.sh) (the old `test-http.sh` and `test-tools.sh`
scripts were consolidated into it). It exercises the full stack over HTTP, Docker, or
stdio. No mcporter required — uses `curl` and `jq`.

```bash
# All modes (http + docker + stdio) — the default
./tests/test_live.sh

# HTTP only, against a running local server (token auto-read from ~/.unraid-mcp/.env)
./tests/test_live.sh --mode http

# HTTP, auth disabled (gateway handles auth)
./tests/test_live.sh --mode http --skip-auth

# HTTP, explicit token
./tests/test_live.sh --mode http --url http://localhost:6970/mcp --token <tok>

# HTTP against a remote server via gateway
./tests/test_live.sh --mode http --url https://unraid.tootie.tv/mcp --skip-auth

# Docker mode (builds the image, starts a container, tests, tears down)
./tests/test_live.sh --mode docker

# stdio mode (launches the server over stdio; no running server needed — good for CI)
./tests/test_live.sh --mode stdio

# Skip the live-API tool calls (no Unraid API needed); verbose response bodies
./tests/test_live.sh --mode http --skip-tools --verbose
```

The `just` wrappers map to these: `just test-http` → `--mode http`,
`just test-http-no-auth` → `--mode http --skip-auth`,
`just test-http-remote <url>` → `--mode http --url <url> --skip-auth`.

### Options

| Flag | Effect |
|---|---|
| `--mode http\|docker\|stdio\|all` | Which transport(s) to exercise (default: `all`) |
| `--url URL` | MCP endpoint for `http` mode (default: `http://localhost:6970/mcp`) |
| `--token TOK` | Bearer token (auto-read from `~/.unraid-mcp/.env` if omitted) |
| `--skip-auth` | Skip Phase 2 auth tests (for OAuth gateway deployments) |
| `--skip-tools` | Skip Phase 4 tool smoke-tests (no live Unraid API needed) |
| `--verbose` | Print raw response bodies |

### What it tests (http / docker modes)

| Phase | Tests |
|---|---|
| **1 · Middleware** | `/health`, `/.well-known/oauth-protected-resource`, `/.well-known/oauth-protected-resource/mcp` (all without auth) |
| **2 · Auth** | No-token → 401, bad-token → 401 `invalid_token`, good-token → passes (skipped with `--skip-auth` or when no token is configured) |
| **3 · MCP protocol** | `initialize`, `tools/list` (tool count + `unraid` tool present), `ping` |
| **4 · Tool smoke-tests** | Non-destructive subactions across all domains (skipped with `--skip-tools`) |
| **4b · Guard bypass** | `confirm=True` bypasses destructive guard on `notification/delete` and `vm/force_stop` |

Current schema-drift smoke coverage includes `system/network_interfaces`,
`onboarding/internal_boot_context`, `live/network_metrics`, and
`subscriptions/test_query` for the `systemMetricsNetwork` subscription field.

`stdio` mode performs the protocol handshake (`initialize`, `tools/list`) and confirms the
`unraid` tool is present, without needing a running server.

Prerequisites: `curl`, `jq` (plus `docker` for `--mode docker`, `uv` for `--mode stdio`).

---

## Destructive Actions — `test-destructive.sh`

`tests/test_live.sh` never executes destructive actions (Phase 4b only verifies that the
`confirm=True` guard *can* be bypassed). Destructive coverage lives in
[`test-destructive.sh`](./test-destructive.sh), which exercises the destructive actions
using create→destroy and no-op patterns over stdio (it spawns `uv run unraid-mcp-server`
per call — no running server needed).

```bash
# Dry-run — lists what would execute, runs nothing destructive (default)
./tests/mcporter/test-destructive.sh

# Actually execute the destructive tests
./tests/mcporter/test-destructive.sh --confirm
```

`--confirm` is **required** to execute; without it the script only dry-runs. Actions with
global blast radius (no safe isolation) are `skip_test`-ed regardless. The two tests it
actually runs under `--confirm` are `notifications: delete` and `keys: delete`, each via a
create→delete cycle. Requires `mcporter`, `uv`, and `python3` in `PATH`.

All destructive actions require `confirm=True` at the call site. There is no environment variable gate — `confirm` is the sole guard.

### Safe Testing Strategy

| Strategy | When to use |
|----------|-------------|
| **Create → destroy** | Action has a create counterpart (keys, notifications, rclone remotes, docker folders) |
| **No-op apply** | Action mutates config but can be re-applied with current values unchanged (`update_ssh`) |
| **Dedicated test remote** | Action requires a remote target (`flash_backup`) |
| **Test VM** | Action requires a live VM (`force_stop`, `reset`) |
| **Mock/safety audit only** | Global blast radius, no safe isolation (`update_all`, `reset_template_mappings`, `setup_remote_access`, `configure_ups`) |
| **Secondary server only** | Run on `shart` (10.1.0.3), never `tootie` (10.1.0.2) |

For exact per-action mcporter commands, see [`docs/DESTRUCTIVE_ACTIONS.md`](../../docs/DESTRUCTIVE_ACTIONS.md).

---

## Prerequisites

```bash
# mcporter CLI (for test-destructive.sh)
npm install -g mcporter

# uv (for stdio/docker modes and test-destructive.sh)
curl -LsSf https://astral.sh/uv/install.sh | sh

# python3 — used for inline JSON extraction in test-destructive.sh
python3 --version  # 3.12+
```

---

## Cleanup

`test-destructive.sh` spawns stdio server subprocesses per call — they exit when mcporter finishes each invocation. `tests/test_live.sh --mode docker` builds an image and runs a container that it always tears down at the end. Neither leaves background processes.
