# Marketplace Publishing -- unraid-mcp

## Distribution channels

| Marketplace | Identifier | Install method |
|-------------|-----------|----------------|
| Claude Plugin Marketplace | `jmagar/unraid-mcp` | `/plugin install unraid-mcp@unraid-mcp` |
| MCP Registry | `tv.tootie/unraid-mcp` | Auto-discovery by MCP clients |
| PyPI | `unraid-mcp` | `pip install unraid-mcp` or `uvx unraid-mcp` |
| GitHub Container Registry | `ghcr.io/jmagar/unraid-mcp` | `docker pull ghcr.io/jmagar/unraid-mcp` |

## Claude Plugin Marketplace

unraid-mcp ships its own Claude Code marketplace manifest at `.claude-plugin/marketplace.json`:

```json
{
  "unraid-mcp": {
    "source": {
      "type": "git",
      "url": "https://github.com/jmagar/unraid-mcp"
    },
    "category": "infrastructure",
    "description": "Query, monitor, and manage Unraid servers via GraphQL API."
  }
}
```

### Installation

```bash
# Add the marketplace (one-time)
/plugin marketplace add jmagar/unraid-mcp

# Install the plugin
/plugin install unraid-mcp@unraid-mcp
```

## MCP Registry

Published via DNS-authenticated `mcp-publisher` using the `tootie.tv` domain.

### Registry entry (`server.json`)

- **Name**: `tv.tootie/unraid-mcp`
- **Package**: PyPI `unraid-mcp`
- **Runtime hint**: `uvx` (no install needed)
- **Transport**: stdio
- **Required env vars**: `UNRAID_API_URL`, `UNRAID_API_KEY`

### Publishing flow

Triggered by `publish-pypi.yml` workflow on `v*.*.*` tags:
1. Build and publish to PyPI
2. Update version in `server.json`
3. Authenticate via DNS TXT record on `tootie.tv`
4. Publish to MCP Registry

## PyPI

Published as `unraid-mcp` with:
- Trusted publisher attestations
- Source and wheel distributions
- Python 3.12+ requirement

## See Also

- [PLUGINS.md](PLUGINS.md) -- Manifest details
- [../mcp/PUBLISH.md](../mcp/PUBLISH.md) -- Full publishing workflow
