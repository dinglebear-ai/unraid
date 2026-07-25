# Connect to MCP

How to connect to the unraid-mcp server from every supported client and transport.

## Claude Code (plugin -- recommended)

### Install from marketplace

```bash
/plugin marketplace add jmagar/unraid-mcp
/plugin install unraid-mcp@unraid-mcp
```

Claude Code runs the published server in stdio mode via `uvx unraid-mcp`.

The plugin prompts for `userConfig` values:
- **Unraid GraphQL API URL**: Your Unraid server's GraphQL endpoint
- **Unraid API Key**: API key from Unraid Settings

The plugin's setup hook persists those values to `~/.unraid-mcp/.env`. It does not
prompt for a Bearer token because the plugin uses local stdio transport. Bearer tokens
or Google OAuth apply only when you run a separate HTTP server.

### Connect to remote HTTP server

If running the server separately (Docker, remote host):

```json
{
  "mcpServers": {
    "unraid": {
      "type": "url",
      "url": "http://localhost:6970/mcp",
      "headers": {
        "Authorization": "Bearer <your-token>"
      }
    }
  }
}
```

## Claude Desktop (via mcp-remote proxy)

Newer Claude Desktop builds may reject the raw `streamable-http` URL config
(`{ "url": "...", "transport": "streamable-http" }`), especially when the server runs
in Docker. The reliable workaround is to proxy the connection locally with the
[`mcp-remote`](https://www.npmjs.com/package/mcp-remote) npm package, which speaks stdio
to Claude Desktop and forwards to the HTTP endpoint.

Add one of the following to your `claude_desktop_config.json` under `mcpServers`.
Replace `<SERVER>` with your Unraid (or MCP server) host.

**macOS / Linux:**

```json
"unraid": {
  "command": "npx",
  "args": ["-y", "mcp-remote", "http://<SERVER>:6970/mcp", "--allow-http"]
}
```

**Windows:**

```json
"unraid": {
  "command": "wsl",
  "args": ["npx", "-y", "mcp-remote", "http://<SERVER>:6970/mcp", "--allow-http"]
}
```

`--allow-http` permits a plain `http://` endpoint; omit it if the server is reachable
over `https://`. If the server requires a Bearer token, append
`--header "Authorization: Bearer <token>"`.

## Codex

The repo ships a Codex marketplace manifest at `.agents/plugins/marketplace.json`:

```bash
codex plugin marketplace add jmagar/unraid-mcp
# then enable `unraid-mcp@unraid-mcp` from the Codex `/plugins` view
```

Codex forwards `UNRAID_API_URL` and `UNRAID_API_KEY` by env-var name. Export them in
the shell that launches Codex or populate `~/.unraid-mcp/.env`.

## Gemini CLI

The `gemini-extension.json` provides Gemini integration:

```json
{
  "mcpServers": {
    "unraid-mcp": {
      "command": "uv",
      "args": ["run", "unraid-mcp-server"],
      "cwd": "${extensionPath}"
    }
  }
}
```

Gemini collects `UNRAID_API_URL` and `UNRAID_API_KEY` through the extension settings.

## Direct HTTP (any client)

### streamable-http

```bash
# Health check (no auth)
curl http://localhost:6970/health

# Tool call (with auth)
curl -X POST http://localhost:6970/mcp \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"unraid","arguments":{"action":"system","subaction":"overview"}},"id":1}'
```

### stdio

```bash
# Spawn and interact via pipes
echo '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":1}' | \
  UNRAID_MCP_TRANSPORT=stdio uv run unraid-mcp-server
```

## MCP Registry

The server is published to the MCP Registry as `tv.tootie/unraid-mcp`. Clients that support registry discovery can auto-install:

```bash
uvx unraid-mcp
```

Required environment variables: `UNRAID_API_URL`, `UNRAID_API_KEY`.

## MCP Inspector

For development and debugging:

```bash
# Start server
uv run unraid-mcp-server

# Open MCP Inspector in browser
# Connect to http://localhost:6970/mcp with bearer token
```

## See Also

- [TRANSPORT.md](TRANSPORT.md) -- Transport configuration details
- [AUTH.md](AUTH.md) -- Authentication setup
- [DEPLOY.md](DEPLOY.md) -- Server deployment options
