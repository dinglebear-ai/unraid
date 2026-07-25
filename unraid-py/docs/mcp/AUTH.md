# Authentication Reference

## Overview

unraid-mcp has two authentication boundaries:

1. **Inbound (client to MCP server)**: Bearer token authentication by default on HTTP transports, or optional Google OAuth when configured
2. **Outbound (MCP server to Unraid)**: API key authentication via `x-api-key` header

## Inbound: Bearer token (RFC 6750)

### How it works

The `BearerAuthMiddleware` (ASGI-level) wraps the entire HTTP stack. It fires before any MCP protocol processing.

1. Client sends `Authorization: Bearer <token>` header
2. Server validates with constant-time comparison (`hmac.compare_digest`)
3. Valid token: request forwarded to MCP server
4. Invalid/missing token: 401 with `WWW-Authenticate` header

### Token management

**Auto-generation**: On first HTTP startup, if no token is configured:
1. Server generates a `secrets.token_urlsafe(32)` token
2. Writes it to `~/.unraid-mcp/.env` using `dotenv.set_key` (in-place, preserves comments)
3. Sets file permissions to 600
4. Removes the token from `os.environ` (prevents subprocess inheritance)
5. Prints the token location to stderr

**Manual generation**:
```bash
openssl rand -hex 32
```

Set in `~/.unraid-mcp/.env`:
```bash
UNRAID_MCP_BEARER_TOKEN=<your-token>
```

### Client configuration

#### Claude Code plugin
The bundled plugin runs the server over **stdio**, so no inbound bearer token is needed — the `userConfig` collects only `unraid_api_url` / `unraid_api_key` (the outbound Unraid GraphQL credentials), which `.mcp.json` wires into the server's environment. A bearer token applies only to direct HTTP deployments below.

#### Direct HTTP
```bash
curl -H "Authorization: Bearer <token>" http://localhost:6970/mcp
```

### Disabling auth

For deployments behind a trusted reverse proxy (e.g., SWAG with its own auth):

```bash
UNRAID_MCP_DISABLE_HTTP_AUTH=true
# Required to bind a public (non-loopback) interface with auth off:
UNRAID_MCP_TRUST_PROXY=true
```

When disabled, all HTTP requests are forwarded without token validation. The server logs a
warning. This is only safe behind a fronting gateway that terminates auth itself — binding
a public interface with auth disabled additionally requires `UNRAID_MCP_TRUST_PROXY=true`
(without it, the server refuses to bind publicly). Keep the container's published port
unexposed or loopback-scoped; see [DEPLOY.md](DEPLOY.md).

## Inbound: Google OAuth

Setting both `UNRAID_MCP_GOOGLE_CLIENT_ID` and
`UNRAID_MCP_GOOGLE_CLIENT_SECRET` replaces the Bearer-token middleware with
FastMCP's Google OAuth provider for HTTP transports. OAuth mode is mutually exclusive
with `UNRAID_MCP_DISABLE_HTTP_AUTH=true`.

Required when OAuth is enabled:

- `UNRAID_MCP_GOOGLE_BASE_URL`, the public base URL of this MCP server. It must be
  HTTPS outside localhost/loopback development.
- At least one authorization allowlist entry: `UNRAID_MCP_GOOGLE_ALLOWED_EMAILS` or
  `UNRAID_MCP_GOOGLE_ALLOWED_DOMAINS`, unless
  `UNRAID_MCP_GOOGLE_ALLOW_ANY_USER=true` is intentionally set.

Optional persistence:

- Set both `UNRAID_MCP_GOOGLE_JWT_SIGNING_KEY` and
  `UNRAID_MCP_GOOGLE_ENCRYPTION_KEY` to persist OAuth tokens encrypted at rest under
  `UNRAID_MCP_GOOGLE_STORAGE_DIR` (default `~/.unraid-mcp/oauth-tokens`).
- Set neither to keep tokens in memory. Setting only one is a startup error.

See [../AUTHENTICATION.md](../AUTHENTICATION.md#google-oauth-optional) for setup
steps and the full env-var table.

### Error responses

| Status | Condition | WWW-Authenticate |
|--------|-----------|-----------------|
| 401 | Missing Authorization header | `Bearer realm="unraid-mcp"` |
| 401 | Non-bearer auth scheme | `Bearer realm="unraid-mcp"` |
| 401 | Invalid token | `Bearer realm="unraid-mcp", error="invalid_token"` |
| 429 | Rate limit exceeded (60 failures/60s per IP) | -- (includes `Retry-After: 60`) |

### Rate limiting

Per-IP failure tracking:
- Window: 60 seconds
- Max failures: 60 per IP before 429
- Max IPs tracked: 10,000 (oldest evicted on overflow)
- Log throttle: one warning per IP per 30 seconds

### Well-known endpoint (RFC 9728)

`GET /.well-known/oauth-protected-resource` returns:

```json
{
  "resource": "http://localhost:6970",
  "bearer_methods_supported": ["header"]
}
```

Empty `authorization_servers` tells MCP clients there is no OAuth flow -- use a pre-shared token. This endpoint is unauthenticated.

## Outbound: Unraid API key

### How it works

The GraphQL client in `core/client.py` sends requests to the Unraid API with:

```
x-api-key: <UNRAID_API_KEY>
```

### Credential sources

1. **Plugin userConfig**: The plugin config form supplies `CLAUDE_PLUGIN_OPTION_*` env vars; the `setup plugin-hook` (run on SessionStart / ConfigChange) persists them to `~/.unraid-mcp/.env`
2. **Environment file**: Loaded from the `.env` priority chain at startup
3. **Hand-edited `.env`**: Create `~/.unraid-mcp/.env` directly (mode 600); the server reads it at startup

### SSL/TLS

The `UNRAID_VERIFY_SSL` setting controls SSL verification for outbound requests:
- `true` (default): Full SSL verification
- **Path string: custom CA bundle — the recommended way to trust a self-signed cert**
  without weakening verification (`UNRAID_VERIFY_SSL=/path/to/ca.pem`)
- `false`: disables verification entirely (discouraged)

**Why the CA-bundle path is preferred:** with verification off, the `UNRAID_API_KEY`
travels to an unverified peer over **both** the GraphQL HTTP client and the WebSocket
subscription connection, so a man-in-the-middle can capture it. Because of this, disabling
verification is gated behind a second explicit opt-in: the server refuses to start with
`UNRAID_VERIFY_SSL=false` unless `UNRAID_ALLOW_INSECURE_TLS=true` is also set. A warning is
logged when verification is disabled.

## Unauthenticated endpoints

| Endpoint | Middleware | Purpose |
|----------|-----------|---------|
| `GET /health` | `HealthMiddleware` | Docker/container healthchecks |
| `GET /.well-known/oauth-protected-resource` | `WellKnownMiddleware` | MCP client OAuth discovery |
| `GET /.well-known/oauth-protected-resource/mcp` | `WellKnownMiddleware` | MCP-specific OAuth discovery |

These endpoints are handled before `BearerAuthMiddleware` in the ASGI middleware stack.

## See Also

- [ENV.md](ENV.md) -- Environment variables for auth configuration
- [TRANSPORT.md](TRANSPORT.md) -- Transport-specific auth requirements
- [../SETUP.md](../SETUP.md) -- Credential setup (plugin userConfig + `.env`)
- [ELICITATION.md](ELICITATION.md) -- Destructive action confirmation flow
- [../GUARDRAILS.md](../GUARDRAILS.md) -- Security patterns
