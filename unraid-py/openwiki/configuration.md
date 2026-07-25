# Configuration

unraid-mcp uses environment variables for configuration. The server searches for `.env` files in a priority order and supports deployment-specific overrides.

## Environment File Priority

The canonical configuration file is `~/.unraid-mcp/.env`. The server searches for `.env` files in this priority order:

1. `~/.unraid-mcp/.env` — primary (canonical credentials dir, all runtimes)
2. `~/.unraid-mcp/.env.local` — local overrides (only if primary is absent)
3. `/app/.env.local` — Docker compat mount
4. `<project-root>/.env.local` — dev overrides
5. `<project-root>/.env` — dev fallback
6. `unraid_mcp/.env` — last resort

Override the credentials directory with `UNRAID_CREDENTIALS_DIR`.

## Required Variables

| Variable | Description |
|----------|-------------|
| `UNRAID_API_URL` | Unraid GraphQL endpoint (e.g., `https://tower.local/graphql`). No trailing slash. |
| `UNRAID_API_KEY` | Unraid API key. Found in Settings > Management Access > API Keys. |

### API Key Setup

Generate an API key in Unraid:
1. Open Unraid web GUI
2. Navigate to **Settings** > **Management Access** > **API Keys**
3. Create a new key with appropriate permissions
4. Copy the key to `UNRAID_API_KEY` in your `.env` file

## Server Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `UNRAID_MCP_HOST` | `127.0.0.1` (bare metal); Docker image sets `0.0.0.0` | Bind address for HTTP transport |
| `UNRAID_MCP_PORT` | `6970` | Port for the MCP HTTP server. Must be 1-65535. |
| `UNRAID_MCP_TRANSPORT` | `streamable-http` | `streamable-http`, `stdio`, or legacy `sse` (deprecated; removed in v3.0.0) |
| `UNRAID_MCP_MAX_RESPONSE_BYTES` | `40000` | Max serialized tool-response size (~10K tokens). Over-cap responses are replaced with a parseable JSON truncation marker. |

### Transport Options

**streamable-http** (default):
- Exposes HTTP endpoint at `http://<host>:<port>/mcp`
- Requires bearer authentication
- Production-ready for gateway deployments

**stdio**:
- Standard input/output communication
- No HTTP authentication
- Used by Claude Code plugin

**sse** (deprecated):
- Server-Sent Events transport
- Still supported but deprecated
- Prefer streamable-http

## Authentication Configuration

### Bearer Token Authentication

| Variable | Default | Description |
|----------|---------|-------------|
| `UNRAID_MCP_BEARER_TOKEN` | auto-generated | Bearer token for HTTP auth. Auto-generated on first HTTP startup if absent. Generate manually with `openssl rand -hex 32`. |
| `UNRAID_MCP_DISABLE_HTTP_AUTH` | `false` | Set `true` to disable bearer auth. Only valid behind a trusted fronting gateway — requires `UNRAID_MCP_TRUST_PROXY=true`. |
| `UNRAID_MCP_TRUST_PROXY` | `false` | Required second opt-in when auth is disabled and the server binds a non-loopback interface. Asserts a fronting gateway terminates auth. |

**Auth-disabled flow** (only for gateway deployments):
1. Set `UNRAID_MCP_DISABLE_HTTP_AUTH=true`
2. Set `UNRAID_MCP_TRUST_PROXY=true`
3. Set `UNRAID_MCP_HOST=0.0.0.0` (or specific interface)
4. Server refuses to start if auth is disabled without `TRUST_PROXY` on a non-loopback bind

### Google OAuth (Optional)

Google OAuth is mutually exclusive with bearer-token authentication. Enabled only when both client ID and secret are set.

| Variable | Default | Description |
|----------|---------|-------------|
| `UNRAID_MCP_GOOGLE_CLIENT_ID` | -- | Google OAuth Client ID. Setting this and the client secret enables OAuth. |
| `UNRAID_MCP_GOOGLE_CLIENT_SECRET` | -- | Google OAuth Client Secret. Must be set with the client ID. |
| `UNRAID_MCP_GOOGLE_BASE_URL` | -- | Required when OAuth is enabled. Public base URL of this MCP server; must be `https://` except for localhost/loopback development. |
| `UNRAID_MCP_GOOGLE_REQUIRED_SCOPES` | `openid https://www.googleapis.com/auth/userinfo.email` | Comma/space-separated OAuth scopes. |
| `UNRAID_MCP_GOOGLE_ALLOWED_EMAILS` | -- | Comma/space-separated verified Google email addresses allowed to use this MCP server. Required unless domains or allow-any-user is set. |
| `UNRAID_MCP_GOOGLE_ALLOWED_DOMAINS` | -- | Comma/space-separated verified Google email domains allowed to use this MCP server. Required unless emails or allow-any-user is set. |
| `UNRAID_MCP_GOOGLE_ALLOW_ANY_USER` | `false` | Explicitly allow any verified Google account. Use only for private/trusted deployments. |
| `UNRAID_MCP_GOOGLE_REDIRECT_PATH` | `/auth/callback` | OAuth callback path. Must be an absolute path with no scheme, host, query, or fragment. |
| `UNRAID_MCP_GOOGLE_JWT_SIGNING_KEY` | -- | With `UNRAID_MCP_GOOGLE_ENCRYPTION_KEY`, enables restart-surviving token storage. Set both keys or neither. |
| `UNRAID_MCP_GOOGLE_ENCRYPTION_KEY` | -- | Fernet key for encrypted OAuth token storage. Generate with `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`. |
| `UNRAID_MCP_GOOGLE_STORAGE_DIR` | `~/.unraid-mcp/oauth-tokens` | Directory for persisted encrypted OAuth tokens. Created with mode 700 where possible. |

**Startup guards:**
- Fails closed when OAuth is partially configured
- Fails when combined with `UNRAID_MCP_DISABLE_HTTP_AUTH=true`
- Fails when no email/domain allowlist without `UNRAID_MCP_GOOGLE_ALLOW_ANY_USER=true`
- Fails when only one persistence key is set

## SSL/TLS Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `UNRAID_VERIFY_SSL` | `true` | SSL verification for the upstream Unraid API. **Recommended for self-signed certs: point this at a CA-bundle path** (`/path/to/ca.pem`) to trust the cert without disabling verification. |
| `UNRAID_ALLOW_INSECURE_TLS` | `false` | Required second opt-in when `UNRAID_VERIFY_SSL=false`. Disabling verification sends the `UNRAID_API_KEY` to an unverified peer over **both** HTTP and WebSocket, exposing it to MITM interception. |

**Self-signed cert workflow** (recommended):
1. Export Unraid's CA certificate: `cp /boot/config/ssl/certs/unraid_bundle.pem /path/to/ca.pem`
2. Set `UNRAID_VERIFY_SSL=/path/to/ca.pem`
3. Server trusts the cert without disabling verification

**Insecure TLS workflow** (discouraged):
1. Set `UNRAID_VERIFY_SSL=false`
2. Set `UNRAID_ALLOW_INSECURE_TLS=true`
3. Server accepts any certificate (MITM risk)

## Logging Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `UNRAID_MCP_LOG_LEVEL` | `INFO` | Log verbosity: `DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL` |
| `UNRAID_MCP_LOG_FILE` | `unraid-mcp.log` | Log filename (written to `logs/` directory or `/app/logs/` in Docker) |

Log files are capped at 10 MB and overwritten to prevent disk space issues.

**Log levels:**
- `DEBUG` - Detailed diagnostics, GraphQL queries, raw responses
- `INFO` - Normal operations, tool calls, connection events
- `WARNING` - Non-critical issues (retries, fallbacks)
- `ERROR` - Failed operations, exceptions
- `CRITICAL` - Startup failures, fatal errors

## Subscription Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `UNRAID_AUTO_START_SUBSCRIPTIONS` | `true` | Lazily initialize enabled subscriptions on first MCP resource/diagnostic access |
| `UNRAID_MAX_RECONNECT_ATTEMPTS` | `10` | Maximum WebSocket reconnection attempts before giving up |
| `UNRAID_AUTOSTART_LOG_PATH` | auto-detect | Log file path for the log tail subscription. Defaults to `/var/log/syslog` if available. |
| `UNRAID_MCP_ENABLE_RAW_SUBSCRIPTION_PROBE` | `false` | Debug-only raw upstream frame in `subscriptions/test_query`; data-sensitive and unsafe on shared deployments |
| `UNRAID_SUBSCRIPTION_MAX_CONNECTIONS` | `3` | Concurrent startup handshakes per process (1..32) |
| `UNRAID_SUBSCRIPTION_STARTUP_STAGGER_SECONDS` | `0.05` | Startup launch delay in seconds (0..10) |
| `UNRAID_SUBSCRIPTION_COLLECT_MAX_EVENTS` | `100` | Streaming event ceiling (1..10000; positive `limit` may lower it) |
| `UNRAID_SUBSCRIPTION_COLLECT_MAX_BYTES` | `1048576` | Streaming byte ceiling; response budget may lower it |
| `UNRAID_SUBSCRIPTION_COLLECT_MAX_SECONDS` | `30` | Maximum `collect_for`; configurable up to 300 seconds |
| `UNRAID_SUBSCRIPTION_CACHE_MAX_AGE_SECONDS` | `300` | Maximum usable cache age; configurable up to 86400 seconds |
| `UNRAID_SUBSCRIPTION_TIMEOUT_MAX_SECONDS` | `60` | Maximum per-call WebSocket timeout; configurable up to 300 seconds |

### Subscription Behavior

When `UNRAID_AUTO_START_SUBSCRIPTIONS=true` (default):
- WebSocket subscriptions initialize on the first resource/diagnostic access
- MCP resources (`unraid://live/{action}`) serve cached data
- The first access may return a "connecting" placeholder; callers retry

When `UNRAID_AUTO_START_SUBSCRIPTIONS=false`:
- Resources fall back to on-demand `subscribe_once` calls
- Each resource read triggers a temporary WebSocket connection

## Credentials Directory

| Variable | Default | Description |
|----------|---------|-------------|
| `UNRAID_CREDENTIALS_DIR` | `~/.unraid-mcp` | Override the credentials directory path. Useful for containers or custom deployments. |

### Credentials Directory Structure

```
~/.unraid-mcp/
├── .env              # Primary credentials file
├── .env.local        # Local overrides (optional)
└── oauth-tokens/     # Encrypted OAuth tokens (if Google OAuth enabled)
```

**Permissions:**
- Directory created with mode 700 where possible
- `.env` should be mode 600 (chmod 600)
- OAuth token directory created with mode 700

## Docker Configuration

Docker-specific variables are set via environment or docker-compose.yaml:

| Variable | Docker Default | Description |
|----------|----------------|-------------|
| `UNRAID_MCP_HOST` | `0.0.0.0` | Bind all interfaces (required for gateway deployments) |
| Credential dir | `/app/.env` or `~/.unraid-mcp/.env` | Docker image checks both paths |

### Docker Compose Example

```yaml
services:
  unraid-mcp:
    image: ghcr.io/jmagar/unraid-mcp:latest
    environment:
      - UNRAID_API_URL=https://tower.local/graphql
      - UNRAID_API_KEY=your-api-key
      - UNRAID_MCP_HOST=0.0.0.0
      - UNRAID_MCP_PORT=6970
      - UNRAID_MCP_BEARER_TOKEN=auto-generate-or-set
    volumes:
      - ~/.unraid-mcp:/root/.unraid-mcp:ro  # Mount credentials dir
    ports:
      - "6970:6970"
```

See `/docker-compose.yaml` for the official deployment configuration.

## Quick Setup Commands

### Claude Code Plugin

```bash
# Add marketplace and install
/plugin marketplace add jmagar/unraid-mcp
/plugin install unraid-mcp@unraid-mcp

# Plugin prompts for URL and key
# Credentials stored in ~/.unraid-mcp/.env
```

### Local Development

```bash
# Create .env from example
cp .env.example .env
chmod 600 .env

# Edit with your values
nano .env  # Add UNRAID_API_URL and UNRAID_API_KEY

# Run server
uv run unraid-mcp-server
```

### Interactive Setup

```bash
# Run the setup flow (uses elicitation)
uv run unraid-mcp-server setup

# Or call via tool
unraid(action="health", subaction="setup")
```

The setup flow prompts for `UNRAID_API_URL` and `UNRAID_API_KEY`, then writes to `~/.unraid-mcp/.env`.

## Configuration Validation

### Health Check

```bash
# Check if server is running
curl http://localhost:6970/health

# Test connection to Unraid API
uv run unraid-mcp-server && unraid(action="health", subaction="test_connection")
```

### Diagnostics

```bash
# Full diagnostics
unraid(action="health", subaction="diagnose")

# Check configuration status
unraid(action="system", subaction="overview")
```

## Source References

- **Settings module**: `/unraid_mcp/config/settings.py`
- **Logging module**: `/unraid_mcp/config/logging.py`
- **Authentication middleware**: `/unraid_mcp/core/auth.py`
- **Credential setup**: `/unraid_mcp/core/setup.py`
- **Example configuration**: `/.env.example`
- **Complete ENV reference**: [`/docs/mcp/ENV.md`](docs/mcp/ENV.md)
- **Authentication guide**: [`/docs/mcp/AUTH.md`](docs/mcp/AUTH.md)
- **Deployment patterns**: [`/docs/mcp/DEPLOY.md`](docs/mcp/DEPLOY.md)
