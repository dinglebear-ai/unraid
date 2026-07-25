# Environment Variable Reference

## Upstream Service

| Variable | Required | Default | Sensitive | Description |
|----------|----------|---------|-----------|-------------|
| `UNRAID_API_URL` | yes | -- | yes (in plugin.json) | Unraid GraphQL endpoint. No trailing slash. |
| `UNRAID_API_KEY` | yes | -- | yes | Unraid API key from Settings > Management Access > API Keys |

## MCP Server

| Variable | Required | Default | Sensitive | Description |
|----------|----------|---------|-----------|-------------|
| `UNRAID_MCP_HOST` | no | `127.0.0.1` bare metal; Docker image sets `0.0.0.0` | no | Bind address for HTTP transport |
| `UNRAID_MCP_PORT` | no | `6970` | no | HTTP server port (1-65535) |
| `UNRAID_MCP_TRANSPORT` | no | `streamable-http` | no | Transport: `streamable-http`, `stdio`, or `sse` |
| `UNRAID_MCP_MAX_RESPONSE_BYTES` | no | `40000` | no | Max serialized tool-response size. Over-cap responses return a parseable truncation marker. |

## Authentication

| Variable | Required | Default | Sensitive | Description |
|----------|----------|---------|-----------|-------------|
| `UNRAID_MCP_BEARER_TOKEN` | conditional | auto-generated | yes | Bearer token for HTTP auth. Required when transport is HTTP and auth is not disabled. |
| `UNRAID_MCP_DISABLE_HTTP_AUTH` | no | `false` | no | Disable bearer auth. Only valid behind a trusted fronting gateway; binding a public interface with auth disabled additionally requires `UNRAID_MCP_TRUST_PROXY=true`. |
| `UNRAID_MCP_TRUST_PROXY` | conditional | `false` | no | Required second opt-in to bind a non-loopback interface while `UNRAID_MCP_DISABLE_HTTP_AUTH=true`. Asserts an upstream gateway terminates auth; without it a public bind with auth off is refused. |

## Google OAuth (optional — replaces bearer token when enabled)

Setting both client id and secret delegates HTTP auth to Google OAuth (FastMCP `GoogleProvider`); the bearer-token middleware is then not installed. Leave unset to keep bearer auth. See [AUTHENTICATION.md](../AUTHENTICATION.md#google-oauth-optional).

| Variable | Required | Default | Sensitive | Description |
|----------|----------|---------|-----------|-------------|
| `UNRAID_MCP_GOOGLE_CLIENT_ID` | no | -- | yes | Google OAuth Client ID. Setting id **and** secret enables OAuth. |
| `UNRAID_MCP_GOOGLE_CLIENT_SECRET` | no | -- | yes | Google OAuth Client Secret (`GOCSPX-…`). |
| `UNRAID_MCP_GOOGLE_BASE_URL` | conditional | -- | no | Required when OAuth is enabled. Public base URL of this server; must match the Google redirect URI host. |
| `UNRAID_MCP_GOOGLE_REQUIRED_SCOPES` | no | `openid` + `userinfo.email` | no | Comma/space-separated OAuth scopes. |
| `UNRAID_MCP_GOOGLE_ALLOWED_EMAILS` | conditional | -- | no | Verified Google emails allowed to use this MCP server. Required unless domains or allow-any-user is set. |
| `UNRAID_MCP_GOOGLE_ALLOWED_DOMAINS` | conditional | -- | no | Verified email domains allowed to use this MCP server. Required unless emails or allow-any-user is set. |
| `UNRAID_MCP_GOOGLE_ALLOW_ANY_USER` | no | `false` | no | Explicitly allow any verified Google account. Use only for private/trusted deployments. |
| `UNRAID_MCP_GOOGLE_REDIRECT_PATH` | no | `/auth/callback` | no | OAuth callback path; must match the Google client config. |
| `UNRAID_MCP_GOOGLE_JWT_SIGNING_KEY` | conditional | -- | yes | With the encryption key, enables persistent (restart-surviving) token storage. Both or neither. |
| `UNRAID_MCP_GOOGLE_ENCRYPTION_KEY` | conditional | -- | yes | Fernet key encrypting persisted tokens at rest. Generate: `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`. |
| `UNRAID_MCP_GOOGLE_STORAGE_DIR` | no | `~/.unraid-mcp/oauth-tokens` | no | Directory for persisted encrypted tokens (FileTreeStore; no Redis needed). |

## SSL/TLS

| Variable | Required | Default | Sensitive | Description |
|----------|----------|---------|-----------|-------------|
| `UNRAID_VERIFY_SSL` | no | `true` | no | SSL verification for the upstream API. **Recommended for self-signed certs: a CA-bundle path** (`/path/to/ca.pem`) to trust the cert without disabling verification. `false` disables verification entirely (dangerous). |
| `UNRAID_ALLOW_INSECURE_TLS` | conditional | `false` | no | Required second opt-in when `UNRAID_VERIFY_SSL=false`. With verification off, the `UNRAID_API_KEY` is sent to an unverified peer over both the HTTP GraphQL client and the WebSocket subscription connection (MITM exposure), so the server refuses to start unless this is `true`. Prefer the CA-bundle path instead. |

## Logging

| Variable | Required | Default | Sensitive | Description |
|----------|----------|---------|-----------|-------------|
| `UNRAID_MCP_LOG_LEVEL` | no | `INFO` | no | Log verbosity: DEBUG, INFO, WARNING, ERROR, CRITICAL |
| `UNRAID_MCP_LOG_FILE` | no | `unraid-mcp.log` | no | Log filename in the logs/ directory |

## Subscriptions

| Variable | Required | Default | Sensitive | Description |
|----------|----------|---------|-----------|-------------|
| `UNRAID_AUTO_START_SUBSCRIPTIONS` | no | `true` | no | Lazily initialize enabled subscriptions on first resource/diagnostic access; first read may return `connecting` |
| `UNRAID_MAX_RECONNECT_ATTEMPTS` | no | `10` | no | Max WebSocket reconnection attempts |
| `UNRAID_AUTOSTART_LOG_PATH` | no | auto-detect | no | Log file path for log tail subscription |
| `UNRAID_MCP_ENABLE_RAW_SUBSCRIPTION_PROBE` | no | `false` | no | Debug-only raw upstream frame in `subscriptions/test_query`; response-data-sensitive and unsafe on shared deployments |
| `UNRAID_SUBSCRIPTION_MAX_CONNECTIONS` | no | `3` | no | Concurrent startup handshakes per process (1..32) |
| `UNRAID_SUBSCRIPTION_STARTUP_STAGGER_SECONDS` | no | `0.05` | no | Startup launch delay in seconds (0..10) |
| `UNRAID_SUBSCRIPTION_COLLECT_MAX_EVENTS` | no | `100` | no | Streaming event ceiling (1..10000; `limit` may lower it) |
| `UNRAID_SUBSCRIPTION_COLLECT_MAX_BYTES` | no | `1048576` | no | Streaming byte ceiling; response budget may lower it |
| `UNRAID_SUBSCRIPTION_COLLECT_MAX_SECONDS` | no | `30` | no | Maximum `collect_for`; configurable up to 300 seconds |
| `UNRAID_SUBSCRIPTION_CACHE_MAX_AGE_SECONDS` | no | `300` | no | Maximum usable cache age; configurable up to 86400 seconds |
| `UNRAID_SUBSCRIPTION_TIMEOUT_MAX_SECONDS` | no | `60` | no | Maximum per-call WebSocket timeout; configurable up to 300 seconds |

## Credentials Directory

| Variable | Required | Default | Sensitive | Description |
|----------|----------|---------|-----------|-------------|
| `UNRAID_CREDENTIALS_DIR` | no | `~/.unraid-mcp` | no | Override credentials directory path |

## Docker / Compose

| Variable | Required | Default | Sensitive | Description |
|----------|----------|---------|-----------|-------------|
| `PUID` | no | `1000` | no | User ID for container process |
| `PGID` | no | `1000` | no | Group ID for container process |
| `DOCKER_NETWORK` | no | -- | no | External Docker network name |

## Loading priority

The server loads the first `.env` file found:

1. `~/.unraid-mcp/.env`
2. `~/.unraid-mcp/.env.local`
3. `/app/.env.local`
4. `<project-root>/.env.local`
5. `<project-root>/.env`
6. `src/unraid_mcp/.env`

## See Also

- [AUTH.md](AUTH.md) -- Authentication details
- [../CONFIG.md](../CONFIG.md) -- Full configuration reference with timeouts and middleware
- [../SETUP.md](../SETUP.md) -- Credential setup (plugin userConfig + `.env`)
- [ELICITATION.md](ELICITATION.md) -- Destructive action confirmation
