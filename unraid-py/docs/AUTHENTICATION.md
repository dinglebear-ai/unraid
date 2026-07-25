# Authentication Setup Guide

The unraid-mcp server supports two **mutually exclusive** HTTP auth modes for the
`streamable-http` / `sse` transports:

1. **Static Bearer token** (default) — you generate a token once and put it in both
   the server config and the MCP client config. No OAuth flow. Covered below.
2. **Google OAuth** (optional) — delegate authentication to Google's login. Enabled
   by setting Google credentials; see [Google OAuth](#google-oauth-optional) below.

`stdio` transport (the Claude Code plugin default) runs as a local subprocess
and does **not** require a token.

---

## Quick start

### 1. Generate a token

```bash
openssl rand -hex 32
# example output: a3f8c2d1e4b7...
```

### 2. Set the token on the server

Add it to `~/.unraid-mcp/.env` (preferred) or the project `.env`:

```env
UNRAID_MCP_BEARER_TOKEN=a3f8c2d1e4b7...
```

(The server also auto-generates this token on first HTTP startup if it is absent —
see [SETUP.md](SETUP.md). `unraid(action="health", subaction="setup")` reports
credential status but does not set the bearer token.)

### 3. Configure your MCP client

#### Claude Code (`~/.claude/claude.json` or `claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "unraid": {
      "type": "http",
      "url": "http://your-server:6970/mcp",
      "headers": {
        "Authorization": "Bearer a3f8c2d1e4b7..."
      }
    }
  }
}
```

> **Important:** The value must be `Bearer <token>` (with the `Bearer ` prefix
> and a space).  Omitting the prefix causes an immediate 401.

#### Docker Compose (server side)

```yaml
environment:
  UNRAID_MCP_BEARER_TOKEN: "a3f8c2d1e4b7..."
  UNRAID_MCP_TRANSPORT: streamable-http
```

---

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `UNRAID_MCP_BEARER_TOKEN` | *(none)* | Required for HTTP transport (bearer mode). Generate with `openssl rand -hex 32`. |
| `UNRAID_MCP_DISABLE_HTTP_AUTH` | `false` | Set `true` to disable auth entirely (testing/trusted-network only). Ignored when Google OAuth is active. |
| `UNRAID_MCP_TRUST_PROXY` | `false` | Required when auth is disabled and `UNRAID_MCP_HOST` binds a non-loopback interface. Asserts a trusted proxy enforces auth. |

---

## Google OAuth (optional)

Set **both** `UNRAID_MCP_GOOGLE_CLIENT_ID` and `UNRAID_MCP_GOOGLE_CLIENT_SECRET` to
delegate HTTP authentication to Google OAuth (FastMCP's `GoogleProvider`). When
active, the bearer-token middleware is **not** installed and clients authenticate via
the standard OAuth browser flow. Leave these unset to keep bearer-token auth (the
default).

**Coexistence:** if `UNRAID_MCP_BEARER_TOKEN` is *also* explicitly set while OAuth is
enabled, the static token stays valid alongside OAuth tokens (compared in constant
time before Google verification). This lets OAuth clients (claude.ai) and
static-token clients (Claude Code, scripts, gateways) share the same endpoint. The
token is never auto-generated in OAuth mode — setting it is the opt-in.

### Using with claude.ai custom connectors

claude.ai's custom connector UI only supports OAuth 2.1 with dynamic client
registration — it cannot send a static bearer token. Enabling Google OAuth mode makes
the server fully claude.ai-compatible: it serves OAuth discovery metadata
(`/.well-known/oauth-authorization-server`) and a registration endpoint, so adding
`https://<your-host>/mcp` as a custom connector walks you through Google sign-in
(restricted to your allowlist). No client ID needs to be entered in claude.ai's
connector form.

### Setup

1. In the [Google Cloud Console](https://console.cloud.google.com/apis/credentials),
   create an **OAuth 2.0 Client ID** of type **Web application**.
2. Add `<UNRAID_MCP_GOOGLE_BASE_URL>/auth/callback` as an **Authorized redirect URI**
   (it must match exactly; HTTPS is required in production).
3. Configure an allowed email/domain list for the Google users who may control this
   MCP server.
4. Set the env vars below and restart the server.

### Environment variables

| Variable | Default | Description |
|---|---|---|
| `UNRAID_MCP_GOOGLE_CLIENT_ID` | *(none)* | Google OAuth Client ID. Setting id **and** secret enables OAuth. |
| `UNRAID_MCP_GOOGLE_CLIENT_SECRET` | *(none)* | Google OAuth Client Secret (`GOCSPX-…`). |
| `UNRAID_MCP_GOOGLE_BASE_URL` | *(none)* | **Required when enabled.** This server's public base URL; must match the Google redirect URI host. |
| `UNRAID_MCP_GOOGLE_REQUIRED_SCOPES` | `openid` + `userinfo.email` | Comma/space-separated OAuth scopes. |
| `UNRAID_MCP_GOOGLE_ALLOWED_EMAILS` | *(none)* | Comma/space-separated verified Google emails allowed to use this server. |
| `UNRAID_MCP_GOOGLE_ALLOWED_DOMAINS` | *(none)* | Comma/space-separated verified email domains allowed to use this server. |
| `UNRAID_MCP_GOOGLE_ALLOW_ANY_USER` | `false` | Explicit escape hatch for private deployments that intentionally allow any Google account. |
| `UNRAID_MCP_GOOGLE_REDIRECT_PATH` | `/auth/callback` | OAuth callback path; must match the Google config. |
| `UNRAID_MCP_GOOGLE_JWT_SIGNING_KEY` | *(none)* | With the encryption key, enables persistent token storage. |
| `UNRAID_MCP_GOOGLE_ENCRYPTION_KEY` | *(none)* | Fernet key for encrypting persisted tokens at rest. |
| `UNRAID_MCP_GOOGLE_STORAGE_DIR` | `~/.unraid-mcp/oauth-tokens` | Directory for persisted encrypted tokens. |

### Token persistence (no Redis required)

By default issued tokens live in memory and are cleared on restart (clients silently
re-authenticate). To persist them across restarts, set **both**
`UNRAID_MCP_GOOGLE_JWT_SIGNING_KEY` and `UNRAID_MCP_GOOGLE_ENCRYPTION_KEY`. Tokens are
then written, encrypted-at-rest, to a `FileTreeStore` on disk — no Redis or other
service is needed. Setting only one of the two keys is a fatal configuration error.

OAuth identity is not authorization by itself. Unless
`UNRAID_MCP_GOOGLE_ALLOW_ANY_USER=true` is explicitly set, startup fails until at
least one allowed email or domain is configured.

Generate the encryption key:

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

The client side needs no static header — point your MCP client at the server URL with
OAuth enabled (e.g. Claude Code uses its built-in OAuth flow), and the browser login
handles the rest.

---

## How it works

1. The server starts an HTTP listener on port 6970.
2. In Bearer-token mode, every request must include `Authorization: Bearer <token>`
   or it gets a `401 Unauthorized` response. In Google OAuth mode, FastMCP's
   `GoogleProvider` serves OAuth discovery and gates requests instead.
3. `/health` (Docker healthcheck) is always allowed without a token.
4. In Bearer-token mode, `/.well-known/oauth-protected-resource` is served without a token so MCP
   clients can discover the auth scheme automatically (RFC 9728).  It returns
   `{"bearer_methods_supported":["header"]}` with no `authorization_servers`,
   telling clients to use a pre-configured Bearer token.

---

## Troubleshooting

### `401 Unauthorized` — "missing authorization header"

The `Authorization` header is absent.  Check:

- Your MCP client config has `"headers": {"Authorization": "Bearer <token>"}`.
- The token in the client exactly matches `UNRAID_MCP_BEARER_TOKEN` on the server.
- No proxy between client and server is stripping the `Authorization` header.

### `401 Unauthorized` — "invalid token"

The header is present but the token value is wrong.  Regenerate and update
both sides, then restart the server.

### Claude Code shows "An unknown error occurred connecting to the MCP server"

This was a bug fixed in v1.2.1: the `/.well-known/oauth-protected-resource`
endpoint was not exempt from auth, so Claude Code's auth-discovery flow
received a 401 and surfaced a generic error.  Upgrade to v1.2.1 or later.

### Temporarily disable auth for testing

```env
UNRAID_MCP_DISABLE_HTTP_AUTH=true
```

Remove this before exposing the server outside a trusted network.
