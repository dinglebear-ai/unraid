# Security Guardrails -- unraid-mcp

Safety and security patterns enforced across the unraid-mcp server.

## Credential management

### Storage

- Credentials live in `~/.unraid-mcp/.env` (mode 600, directory mode 700)
- The plugin setup hook writes credentials atomically (tmp file + `os.replace`)
- Credentials are never written to `os.environ` after startup -- all internal consumers read from module globals via `from ..config import settings`
- Bearer tokens are removed from `os.environ` immediately after being applied to prevent subprocess inheritance

### Loading priority

The server loads from the first `.env` file found:
1. `~/.unraid-mcp/.env`
2. `~/.unraid-mcp/.env.local`
3. `/app/.env.local`
4. `<project-root>/.env.local`
5. `<project-root>/.env`
6. `src/unraid_mcp/.env`

### Sensitive value redaction

The `redact_sensitive()` function in `core/client.py` recursively replaces values for keys matching:
- Exact: `key`, `pin`
- Substring: `password`, `secret`, `clientsecret`, `token`, `apikey`, `authorization`, `credential`, `passphrase`, `jwt`, `cookie`, `session`, `activationcode`, `privatekey`

Beyond key-name matching, the function also redacts by **value shape** (`_is_sensitive_value`): any string value that looks like a JWT (`eyJ...` three-segment token), an `sk-`-prefixed API key, or a high-entropy opaque token (>=20 chars, token-charset only, mixing letters and digits) is masked even under an innocuous key name.

All debug logging passes through this function.

## Destructive action gating

### Two-tier confirmation

All destructive operations are gated by the `gate_destructive_action()` function in `core/guards.py`:

1. **Interactive clients (elicitation)**: The server sends an elicitation request with a checkbox confirmation. The user must explicitly check "confirmed" and submit.
2. **Non-interactive clients (confirm=True)**: Agents and API callers must pass `confirm=True` to bypass elicitation.

### Destructive actions registry

**26 destructive subactions across 11 domains.**

| Domain | Destructive subactions |
| --- | --- |
| `array` | `stop_array`, `remove_disk`, `clear_disk_stats` |
| `vm` | `force_stop`, `reset` |
| `notification` | `delete`, `delete_archived` |
| `rclone` | `delete_remote` |
| `key` | `delete` |
| `disk` | `flash_backup` |
| `setting` | `configure_ups`, `update_ssh`, `update_system_time` |
| `plugin` | `remove`, `install`, `install_language` |
| `docker` | `remove_container`, `reset_template_mappings`, `delete_entries` |
| `connect` | `sign_in`, `sign_out`, `update_api_settings`, `setup_remote_access`, `enable_dynamic_remote_access` |
| `onboarding` | `reset`, `create_internal_boot_pool` |

Each domain module defines its own `_*_DESTRUCTIVE` set and per-action description
dictionary. `tests/safety/test_destructive_guards.py` asserts each runtime
`_*_DESTRUCTIVE` set matches an in-test `KNOWN_DESTRUCTIVE` audit dict (it does **not**
parse this Markdown table — keep the two in sync manually).

### Highest blast-radius action: `plugin install` / `plugin install_language`

`plugin install` (and `install_language`) is the single most dangerous operation in this
server: it makes the Unraid host **fetch a caller-supplied `.plg` URL and execute it as
root**. It is gated by `confirm=True` like every destructive action, and additionally by
an SSRF guard (`_validate_plugin_url()` in `tools/_plugin.py`) that rejects non-`http(s)`,
hostless, and private/loopback/link-local/reserved targets before forwarding — blocking
pivots such as `http://169.254.169.254/` (cloud metadata) and RFC1918 hosts. That guard is
**defence-in-depth, not a complete mitigation**: the Unraid host does its own DNS
(re-)resolution at fetch time (a TOCTOU window), and the URL still resolves to whatever the
`.plg` author intends. **For shared / multi-tenant deployments, disable `plugin install`
and `plugin install_language` at the gateway** rather than relying on `confirm` + SSRF
guard alone.

### Elicitation fallback

When the MCP client does not support elicitation:
- `NotImplementedError` is caught
- A warning is logged
- The operation is blocked with a `ToolError` instructing the user to re-run with `confirm=True`

## HTTP authentication

### Bearer token (RFC 6750)

- Constant-time comparison via `hmac.compare_digest` prevents timing attacks
- Missing header returns 401 with `WWW-Authenticate: Bearer realm="unraid-mcp"`
- Invalid token returns 401 with `error="invalid_token"`
- Per-IP rate limiting: 60 failures per 60-second window triggers 429 with `Retry-After: 60`
- Maximum 10,000 unique IPs tracked to prevent memory exhaustion DoS
- Log throttling: at most one warning per IP per 30 seconds

### RFC 9728 well-known endpoint

`GET /.well-known/oauth-protected-resource` returns resource metadata with an empty `authorization_servers` list, telling MCP clients to use a pre-shared bearer token (no OAuth flow).

### Health endpoint bypass

`GET /health` is served by `HealthMiddleware` outside the auth layer, allowing unauthenticated Docker healthchecks.

## Input validation

### Log path validation

Log file paths are restricted to allowed prefixes (`/var/log/`, `/boot/logs/`) to prevent path traversal.

### GraphQL injection prevention

- All queries and mutations use pre-built query dicts (`_*_QUERIES`, `_*_MUTATIONS`)
- No string interpolation of user input into GraphQL query strings
- The subscription test tool (`subscriptions/test_query`) only allows the **12 whitelisted
  schema field names** in `_ALLOWED_SUBSCRIPTION_FIELDS`
  (`src/unraid_mcp/subscriptions/diagnostics.py`): `containerStats`, `cpu`,
  `dockerContainerStats`, `memory`, `array`, `network`, `docker`,
  `systemMetricsTemperature`, `vm`, `displaySubscription`,
  `notificationsWarningsAndAlerts`, `pluginInstallUpdates`. The validator also rejects any
  query containing a bare `mutation` or `query` keyword.

### Port validation

`UNRAID_MCP_PORT` is validated as an integer in range 1-65535 at startup. Invalid values cause immediate exit.

## Response safety

### Size limiting

`StructuredResponseLimitingMiddleware` (`core/response_limit.py`) replaces any response
exceeding the cap (default **40 KB / `UNRAID_MCP_MAX_RESPONSE_BYTES=40000`**, ~10K tokens)
with a complete, parseable JSON truncation marker
(`{"error": "response_truncated", "truncated": true, ...}`) rather than hard-cutting
mid-JSON or appending a suffix. This protects client context windows from oversized
responses. It is a backstop; the per-list `cap_list` defaults do the primary bounding.

### Rate limiting

Two independent limiters cover two different concerns:

- **Upstream (authoritative):** the httpx **token bucket** in `core/client.py`
  (`_RateLimiter`: 90 tokens, 9.0 tokens/sec refill, ~9 rps) bounds outbound calls to the
  Unraid API's hard **100 req / 10 s** limit (with ~10% headroom). Every GraphQL request
  acquires a token first; 429 responses are retried with backoff. This is the limiter that
  actually keeps the server within Unraid's burst window.
- **Inbound (abuse/DoS guard):** `SlidingWindowRateLimitingMiddleware` enforces 540
  requests per 60-second sliding window on the MCP surface. It guards against inbound
  abuse but **cannot** bound Unraid's 10-second burst limit (a 540/min window permits far
  more than 100 req in any given 10 s) — that job belongs to the token bucket above.

### Log content capping

Subscription data with log content is capped at 1 MB / 5,000 lines to prevent unbounded memory growth from persistent WebSocket streams.

## Hooks

The plugin's only hooks are `SessionStart` + `ConfigChange`, which persist credentials
to `~/.unraid-mcp/.env` (advisory, never-blocking). They enforce **no** guardrails — the
safety mechanisms above (destructive-action confirmation, rate limiting, response/log
capping) live in the server code, not in hooks. Git-side enforcement is the lefthook
pre-commit suite (`lefthook.yml`). See `docs/plugin/HOOKS.md` and `docs/mcp/PRE-COMMIT.md`.
