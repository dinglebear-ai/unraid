# Web MCP Integration

HTTP-accessible endpoints on the unraid-mcp server.

## Endpoints

### `/mcp` -- MCP protocol endpoint

The primary MCP endpoint for tool calls and resource reads. Requires bearer token authentication (unless disabled).

- **Transport**: streamable-http (POST with JSON-RPC)
- **Auth**: `Authorization: Bearer <token>`
- **Content-Type**: `application/json`

### `/health` -- Health check

Unauthenticated endpoint for liveness probes.

- **Method**: GET
- **Response**: `{"status":"ok"}` (200)
- **Auth**: None (served before auth middleware)

Used by:
- Docker HEALTHCHECK directive
- docker-compose healthcheck
- External monitoring systems
- Load balancer health probes

### `/.well-known/oauth-protected-resource` -- OAuth discovery

RFC 9728 OAuth 2.0 Protected Resource Metadata. Unauthenticated.

- **Method**: GET
- **Response**:
  ```json
  {
    "resource": "http://localhost:6970",
    "bearer_methods_supported": ["header"]
  }
  ```
- **Purpose**: MCP clients probe this after receiving a 401 to discover authentication requirements. The empty `authorization_servers` list tells clients to use a pre-shared bearer token.

Also served at `/.well-known/oauth-protected-resource/mcp` for MCP-specific discovery.

## ASGI Middleware Stack

Requests pass through middleware in this order (outermost first):

1. **HealthMiddleware** -- intercepts `GET /health`
2. **WellKnownMiddleware** -- intercepts `GET /.well-known/oauth-protected-resource`
3. **BearerAuthMiddleware** -- validates bearer token for all other requests
4. **FastMCP app** -- MCP protocol handling with its own middleware chain

## CORS

No CORS middleware is configured. The server is designed for server-to-server MCP communication, not browser access. If browser access is needed (e.g., MCP Inspector), configure CORS at the reverse proxy level.

## WebSocket Support

The `BearerAuthMiddleware` passes WebSocket scopes (`scope["type"] == "websocket"`) through without authentication, as WebSocket connections are initiated by the server itself (outbound to Unraid API), not by MCP clients.

## Reverse Proxy Configuration

For SWAG/nginx:

```nginx
location /mcp {
    proxy_pass http://unraid-mcp:6970/mcp;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location /health {
    proxy_pass http://unraid-mcp:6970/health;
}
```

See `docs/unraid.subdomain.conf` for a complete SWAG subdomain example.

## See Also

- [AUTH.md](AUTH.md) -- Bearer token configuration
- [TRANSPORT.md](TRANSPORT.md) -- Transport method details
- [DEPLOY.md](DEPLOY.md) -- Reverse proxy deployment
