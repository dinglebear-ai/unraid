# Transport Methods Reference

## Overview

unraid-mcp supports three transport methods for MCP communication:

| Transport | Default | Auth required | Use case |
|-----------|---------|--------------|----------|
| `streamable-http` | Yes | Yes (bearer token) | Production HTTP deployments, remote access |
| `stdio` | No | No | Claude Desktop, local process-based clients |
| `sse` | No (deprecated; removed in v3.0.0) | Yes (bearer token) | Temporary compatibility only |

Set the transport via `UNRAID_MCP_TRANSPORT` in `.env`.

## streamable-http (default)

The recommended transport for production deployments.

```bash
UNRAID_MCP_TRANSPORT=streamable-http
UNRAID_MCP_HOST=0.0.0.0
UNRAID_MCP_PORT=6970
```

The MCP endpoint is served at `/mcp`:
```
http://localhost:6970/mcp
```

### Authentication

Bearer token required by default. See [AUTH.md](AUTH.md) for configuration.

### Health endpoint

`GET /health` returns `{"status":"ok"}` without authentication. Use for Docker healthchecks and monitoring.

## stdio

Process-based transport for local clients like Claude Desktop.

```bash
UNRAID_MCP_TRANSPORT=stdio
```

The server reads from stdin and writes to stdout. No HTTP server is started, no bearer token is needed.

### Plugin manifest

The `.claude-plugin/plugin.json` configures stdio transport:

```json
{
  "mcpServers": {
    "unraid": {
      "type": "stdio",
      "command": "uv",
      "args": ["run", "--directory", "${CLAUDE_PLUGIN_ROOT}", "unraid-mcp-server"],
      "env": {
        "UNRAID_MCP_TRANSPORT": "stdio"
      }
    }
  }
}
```

## SSE (deprecated; removal in v3.0.0)

Server-Sent Events transport. Supported but deprecated in favor of streamable-http.

```bash
UNRAID_MCP_TRANSPORT=sse
```

A deprecation warning is logged at startup.

Migrate clients to streamable HTTP before v3.0.0. If a legacy client cannot migrate,
put a compatibility proxy in front of the streamable HTTP endpoint; do not build new
deployments on SSE.

## Docker transport configuration

The `docker-compose.yaml` healthcheck adapts to the configured transport:

```yaml
healthcheck:
  test:
    - "CMD-SHELL"
    - |
      if [ "${UNRAID_MCP_TRANSPORT:-streamable-http}" = "stdio" ]; then
        exit 0
      fi
      wget -qO- "http://localhost:${UNRAID_MCP_PORT:-6970}/ready" > /dev/null
```

For stdio transport, the healthcheck always passes (the process itself is the health indicator).

## WebSocket subscriptions

Regardless of MCP transport, the server maintains outbound WebSocket connections to the Unraid GraphQL API for live subscriptions. These use the `graphql-transport-ws` protocol with `connection_init` and `subscribe` messages.

WebSocket URLs are derived from the `UNRAID_API_URL`:
- `https://tower.local/graphql` becomes `wss://tower.local/graphql`
- `http://tower.local/graphql` becomes `ws://tower.local/graphql`

## See Also

- [AUTH.md](AUTH.md) -- Bearer token setup for HTTP transports
- [CONNECT.md](CONNECT.md) -- Client-specific connection guides
- [DEPLOY.md](DEPLOY.md) -- Deployment patterns for each transport
