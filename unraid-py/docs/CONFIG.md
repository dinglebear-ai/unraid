# Configuration Reference -- unraid-mcp

Complete environment variable reference and configuration options.

## Environment file

The canonical configuration file is `~/.unraid-mcp/.env`. The server searches for `.env` files in this priority order:

1. `~/.unraid-mcp/.env` -- primary (canonical credentials dir, all runtimes)
2. `~/.unraid-mcp/.env.local` -- local overrides (only if primary is absent)
3. `/app/.env.local` -- Docker compat mount
4. `<project-root>/.env.local` -- dev overrides
5. `<project-root>/.env` -- dev fallback
6. `src/unraid_mcp/.env` -- last resort

Override the credentials directory with `UNRAID_CREDENTIALS_DIR`.

## Required variables

| Variable | Description |
| --- | --- |
| `UNRAID_API_URL` | Unraid GraphQL endpoint (e.g. `https://tower.local/graphql`). No trailing slash. |
| `UNRAID_API_KEY` | Unraid API key. Found in Settings > Management Access > API Keys. |

## Server variables

| Variable | Default | Description |
| --- | --- | --- |
| `UNRAID_MCP_HOST` | `127.0.0.1` bare metal; Docker image sets `0.0.0.0` | Bind address for HTTP transport |
| `UNRAID_MCP_PORT` | `6970` | Port for the MCP HTTP server. Must be 1-65535. |
| `UNRAID_MCP_TRANSPORT` | `streamable-http` | Transport method: `streamable-http`, `stdio`, or `sse` (deprecated) |
| `UNRAID_MCP_MAX_RESPONSE_BYTES` | `40000` | Max serialized tool-response size (~10K tokens). Over-cap responses are replaced with a parseable JSON truncation marker (`{"error":"response_truncated","truncated":true,...}`). |

## Authentication variables

| Variable | Default | Description |
| --- | --- | --- |
| `UNRAID_MCP_BEARER_TOKEN` | auto-generated | Bearer token for HTTP auth. Auto-generated on first HTTP startup if absent. Generate manually with `openssl rand -hex 32`. |
| `UNRAID_MCP_DISABLE_HTTP_AUTH` | `false` | Set `true` to disable bearer auth. Only valid behind a trusted fronting gateway — requires `UNRAID_MCP_TRUST_PROXY=true` to bind a public interface (see below). |
| `UNRAID_MCP_TRUST_PROXY` | `false` | Required second opt-in when auth is disabled (`UNRAID_MCP_DISABLE_HTTP_AUTH=true`) and the server binds a non-loopback interface. Asserts a fronting gateway terminates auth; without it, a public bind with auth disabled is refused. |

## Google OAuth variables

Google OAuth is optional and mutually exclusive with the Bearer-token middleware. It is
enabled only when both `UNRAID_MCP_GOOGLE_CLIENT_ID` and
`UNRAID_MCP_GOOGLE_CLIENT_SECRET` are set. When enabled, HTTP clients authenticate
through the OAuth browser flow and the static `UNRAID_MCP_BEARER_TOKEN` is not used.

| Variable | Default | Description |
| --- | --- | --- |
| `UNRAID_MCP_GOOGLE_CLIENT_ID` | -- | Google OAuth Client ID. Setting this and the client secret enables OAuth. |
| `UNRAID_MCP_GOOGLE_CLIENT_SECRET` | -- | Google OAuth Client Secret. Must be set with the client ID. |
| `UNRAID_MCP_GOOGLE_BASE_URL` | -- | Required when OAuth is enabled. Public base URL of this MCP server; must be `https://` except for localhost/loopback development. The Google authorized redirect URI is this base URL plus the redirect path. |
| `UNRAID_MCP_GOOGLE_REQUIRED_SCOPES` | `openid https://www.googleapis.com/auth/userinfo.email` | Comma/space-separated OAuth scopes. |
| `UNRAID_MCP_GOOGLE_ALLOWED_EMAILS` | -- | Comma/space-separated verified Google email addresses allowed to use this MCP server. Required unless domains or allow-any-user is set. |
| `UNRAID_MCP_GOOGLE_ALLOWED_DOMAINS` | -- | Comma/space-separated verified Google email domains allowed to use this MCP server. Required unless emails or allow-any-user is set. |
| `UNRAID_MCP_GOOGLE_ALLOW_ANY_USER` | `false` | Explicitly allow any verified Google account. Use only for private/trusted deployments. |
| `UNRAID_MCP_GOOGLE_REDIRECT_PATH` | `/auth/callback` | OAuth callback path. Must be an absolute path with no scheme, host, query, or fragment. |
| `UNRAID_MCP_GOOGLE_JWT_SIGNING_KEY` | -- | With `UNRAID_MCP_GOOGLE_ENCRYPTION_KEY`, enables restart-surviving token storage. Set both keys or neither. |
| `UNRAID_MCP_GOOGLE_ENCRYPTION_KEY` | -- | Fernet key for encrypted OAuth token storage. Generate with `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`. |
| `UNRAID_MCP_GOOGLE_STORAGE_DIR` | `~/.unraid-mcp/oauth-tokens` | Directory for persisted encrypted OAuth tokens. Created with mode 700 where possible. |

Startup fails closed when OAuth is partially configured, when OAuth is combined with
`UNRAID_MCP_DISABLE_HTTP_AUTH=true`, when no email/domain allowlist is configured
without `UNRAID_MCP_GOOGLE_ALLOW_ANY_USER=true`, or when only one persistence key is
set. See [AUTHENTICATION.md](AUTHENTICATION.md#google-oauth-optional).

## SSL variables

| Variable | Default | Description |
| --- | --- | --- |
| `UNRAID_VERIFY_SSL` | `true` | SSL verification for the upstream Unraid API. **Recommended for self-signed certs: point this at a CA-bundle path** (`/path/to/ca.pem`) to trust the cert without disabling verification. `false` disables verification entirely (dangerous — see `UNRAID_ALLOW_INSECURE_TLS`). |
| `UNRAID_ALLOW_INSECURE_TLS` | `false` | Required second opt-in when `UNRAID_VERIFY_SSL=false`. Disabling verification sends the `UNRAID_API_KEY` to an unverified peer over **both** the httpx GraphQL client and the WebSocket subscription connection, exposing it to MITM interception. The server refuses to start with verification off unless this is `true`. Prefer the CA-bundle path instead. |

## Logging variables

| Variable | Default | Description |
| --- | --- | --- |
| `UNRAID_MCP_LOG_LEVEL` | `INFO` | Log verbosity: `DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL` |
| `UNRAID_MCP_LOG_FILE` | `unraid-mcp.log` | Log filename (written to `logs/` directory or `/app/logs/` in Docker) |

Log files are capped at 10 MB and overwritten to prevent disk space issues.

## Subscription variables

| Variable | Default | Description |
| --- | --- | --- |
| `UNRAID_AUTO_START_SUBSCRIPTIONS` | `true` | Lazily initialize enabled subscriptions on first MCP resource/diagnostic access; the first read may return `connecting` |
| `UNRAID_MAX_RECONNECT_ATTEMPTS` | `10` | Maximum WebSocket reconnection attempts before giving up |
| `UNRAID_AUTOSTART_LOG_PATH` | auto-detect | Log file path for the log tail subscription. Defaults to `/var/log/syslog` if available. |
| `UNRAID_MCP_ENABLE_RAW_SUBSCRIPTION_PROBE` | `false` | Debug-only: include the data-sensitive raw upstream frame in `subscriptions/test_query`. Never enable on shared deployments. |
| `UNRAID_SUBSCRIPTION_MAX_CONNECTIONS` | `3` | Concurrent subscription startup handshakes per process (1..32) |
| `UNRAID_SUBSCRIPTION_STARTUP_STAGGER_SECONDS` | `0.05` | Delay between startup launches in seconds (0..10) |
| `UNRAID_SUBSCRIPTION_COLLECT_MAX_EVENTS` | `100` | Events retained during collection (1..10000; positive `limit` may lower it) |
| `UNRAID_SUBSCRIPTION_COLLECT_MAX_BYTES` | `1048576` | Serialized bytes retained during collection; response budget may lower it |
| `UNRAID_SUBSCRIPTION_COLLECT_MAX_SECONDS` | `30` | Maximum `collect_for`; configurable up to 300 seconds |
| `UNRAID_SUBSCRIPTION_CACHE_MAX_AGE_SECONDS` | `300` | Maximum usable cache age in seconds; configurable up to 86400 |
| `UNRAID_SUBSCRIPTION_TIMEOUT_MAX_SECONDS` | `60` | Maximum per-call WebSocket timeout; configurable up to 300 seconds |

## Credentials directory

| Variable | Default | Description |
| --- | --- | --- |
| `UNRAID_CREDENTIALS_DIR` | `~/.unraid-mcp` | Override the credentials directory path. Useful for containers or custom deployments. |

## Docker variables

| Variable | Default | Description |
| --- | --- | --- |
| `PUID` | `1000` | User ID for the container process |
| `PGID` | `1000` | Group ID for the container process |
| `DOCKER_NETWORK` | -- | External Docker network name. Leave unset for default bridge. |

## Timeouts

Configured in code (not via environment variables):

| Context | Timeout | Notes |
| --- | --- | --- |
| Default HTTP requests | 30s | Standard GraphQL queries |
| Disk operations | 90s | SMART data queries need longer |
| Tool execution | 120s | FastMCP tool timeout |
| WebSocket collection | 5s default | Configurable via `collect_for` parameter |

## Rate limiting

Two independent limiters:

- **Upstream token bucket (authoritative):** `core/client.py` `_RateLimiter` — 90 tokens,
  9.0 tokens/sec refill (~9 rps), modeling Unraid's hard **100 req / 10 s** limit with
  ~10% headroom. Every outbound GraphQL call acquires a token first; 429s are retried with
  backoff. This is what keeps the server inside Unraid's burst window.
- **Inbound abuse/DoS guard:** `SlidingWindowRateLimitingMiddleware` — 540 requests per
  60-second sliding window on the MCP surface. It does **not** bound Unraid's 10-second
  burst (a per-minute window can't), so it is not the upstream limiter.

## Middleware configuration

Configured in code:

| Middleware | Setting | Value |
| --- | --- | --- |
| Rate limiting (inbound) | Max requests | 540 per 60-second sliding window (abuse/DoS guard, not the upstream limiter) |
| Response limiting | Max size | 40 KB default (`UNRAID_MCP_MAX_RESPONSE_BYTES=40000`); over-cap responses are replaced with a parseable JSON truncation marker, not byte-cut |
| Logging | Methods logged | `tools/call`, `resources/read` |
| Error handling | Traceback included | Only when `LOG_LEVEL=DEBUG` |

## Example .env file

```bash
# Core API Configuration (Required)
UNRAID_API_KEY=your_api_key
UNRAID_API_URL=http://your-unraid-server

# MCP Server Settings
UNRAID_MCP_HOST=127.0.0.1
UNRAID_MCP_PORT=6970
UNRAID_MCP_TRANSPORT=streamable-http
UNRAID_MCP_MAX_RESPONSE_BYTES=40000

# HTTP Bearer Token Authentication
UNRAID_MCP_BEARER_TOKEN=your_bearer_token

# Safety flags
UNRAID_MCP_DISABLE_HTTP_AUTH=false
UNRAID_MCP_TRUST_PROXY=false

# Optional Google OAuth alternative to Bearer auth
# UNRAID_MCP_GOOGLE_CLIENT_ID=123456789.apps.googleusercontent.com
# UNRAID_MCP_GOOGLE_CLIENT_SECRET=GOCSPX-...
# UNRAID_MCP_GOOGLE_BASE_URL=https://unraid-mcp.example.com
# UNRAID_MCP_GOOGLE_ALLOWED_EMAILS=you@example.com
# UNRAID_MCP_GOOGLE_ALLOWED_DOMAINS=example.com
# UNRAID_MCP_GOOGLE_ALLOW_ANY_USER=false
# UNRAID_MCP_GOOGLE_REDIRECT_PATH=/auth/callback
# UNRAID_MCP_GOOGLE_JWT_SIGNING_KEY=your_jwt_signing_secret
# UNRAID_MCP_GOOGLE_ENCRYPTION_KEY=your_fernet_key
# UNRAID_MCP_GOOGLE_STORAGE_DIR=/path/to/oauth-tokens

# TLS / SSL Verification
UNRAID_VERIFY_SSL=true
UNRAID_ALLOW_INSECURE_TLS=false

# Logging
UNRAID_MCP_LOG_LEVEL=INFO
UNRAID_MCP_LOG_FILE=unraid-mcp.log

# Subscriptions
UNRAID_AUTO_START_SUBSCRIPTIONS=true
UNRAID_MAX_RECONNECT_ATTEMPTS=10
# UNRAID_AUTOSTART_LOG_PATH=/var/log/syslog

# Credentials directory override
# UNRAID_CREDENTIALS_DIR=

# Docker user / network
DOCKER_NETWORK=
PGID=1000
PUID=1000
```
