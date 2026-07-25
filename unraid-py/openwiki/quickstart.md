# Unraid MCP - Quickstart

**unraid-mcp** is an MCP (Model Context Protocol) server that provides a unified interface to manage Unraid NAS servers. It exposes a single `unraid` tool with 19 action domains covering 178 subactions for system inspection, Docker/VM management, monitoring, and administrative operations.

## What is unraid-mcp?

unraid-mcp is a GraphQL-backed MCP server that:
- Provides **one consolidated tool** (`unraid`) with action/subaction routing
- Exposes **19 action domains**: system, health, array, disk, docker, vm, notification, key, plugin, rclone, setting, connect, customization, oidc, onboarding, user, live, subscriptions, help
- Supports **real-time data** via WebSocket subscriptions (CPU, memory, array state, logs, network metrics)
- Gates **destructive operations** behind explicit `confirm=True` requirement
- Runs on **multiple transports**: streamable-http (default), stdio, and legacy SSE (deprecated; removed in v3.0.0)
- Integrates with **AI clients**: Claude Code, Codex, Gemini CLI, and direct HTTP

The server is built with FastMCP and follows a modular architecture with separate packages for configuration, core functionality, subscriptions, and tools. See `/unraid_mcp/server.py` for the main server implementation.

## Quick Start

### For Claude Code Users (Recommended)

Add the marketplace and install the plugin:

```bash
/plugin marketplace add jmagar/unraid-mcp
/plugin install unraid-mcp@unraid-mcp
```

Claude Code will prompt for:
- **Unraid GraphQL API URL** (e.g., `https://tower.local/graphql`)
- **Unraid API Key** (generated in Settings > Management Access > API Keys)

The plugin stores credentials in `~/.unraid-mcp/.env` and launches the server via `uvx unraid-mcp` (the published PyPI package).

### For Local Development

```bash
# Clone and install dependencies
uv sync --dev

# Create .env from .env.example
cp .env.example .env
# Edit .env with your UNRAID_API_URL and UNRAID_API_KEY

# Run the server
uv run unraid-mcp-server
```

See `/Justfile` for development commands (`just dev`, `just test`, `just lint`).

### For Docker Deployment

```bash
# Build and run with docker-compose
docker compose up -d

# Or use Justfile
just up
```

The Docker image reads configuration from `/app/.env` or `~/.unraid-mcp/.env`.

### For Gemini CLI

```bash
gemini extensions install https://github.com/jmagar/unraid-mcp
```

Gemini prompts for `UNRAID_API_URL` and `UNRAID_API_KEY` on install.

## Key Concepts

### Single Tool Pattern

unraid-mcp exposes **one MCP tool** (`unraid`) that routes operations via `action` (domain) and `subaction` (operation):

```python
unraid(action="docker", subaction="list")
unraid(action="system", subaction="overview")
unraid(action="vm", subaction="details", vm_id="101")
```

Call `unraid(action="help")` to return the full Markdown reference of all actions and subactions.

### Action Domains

| Action | Subactions | Purpose |
|--------|------------|---------|
| `system` | 25 | Server info, metrics, network, UPS |
| `health` | 4 | Health checks, diagnostics, setup |
| `array` | 14 | Parity checks, array lifecycle, disk ops |
| `disk` | 6 | Shares, physical disks, log files |
| `docker` | 26 | Container lifecycle, updates, organizer |
| `vm` | 9 | Virtual machine lifecycle |
| `notification` | 13 | Notification CRUD |
| `key` | 13 | API key and permission management |
| `live` | 17 | Real-time WebSocket subscription snapshots |
| `subscriptions` | 2 | WebSocket diagnostics |
| `help` | 0 | Returns full Markdown reference |
| ... | ... | See [API reference](openwiki/api-reference.md) |

### Destructive Action Guards

Destructive subactions (26 total across 11 domains) require `confirm=True`:

```python
# This will raise an error without confirm=True
unraid(action="array", subaction="stop_array", confirm=True)

# Destructive operations include: stop_array, remove_container, force_stop, delete, etc.
```

See `/docs/DESTRUCTIVE_ACTIONS.md` for the complete list and testing strategies.

### List Capping

List-returning subactions support pagination via the `limit` parameter (default 20):

```python
unraid(action="docker", subaction="list", limit=50)
unraid(action="disk", subaction="shares", limit=-1)  # No limit
```

Capped responses include a `page` meta dict with `returned`, `total`, `truncated`, and `hint` fields.

### Real-time Subscriptions

Live data is available via WebSocket subscriptions exposed as MCP resources:

```
unraid://live/cpu
unraid://live/memory
unraid://live/array_state
unraid://live/log_tail
unraid://live/network_metrics
```

Or via the `live` action snapshots:
```python
unraid(action="live", subaction="cpu")
unraid(action="live", subaction="array_state")
```

See `/unraid_mcp/subscriptions/` for the subscription manager implementation.

## Configuration

### Required Variables

| Variable | Description |
|----------|-------------|
| `UNRAID_API_URL` | Unraid GraphQL endpoint (e.g., `https://tower.local/graphql`) |
| `UNRAID_API_KEY` | API key from Settings > Management Access > API Keys |

### Server Configuration

The server searches for `.env` files in this priority order:
1. `~/.unraid-mcp/.env` (primary / canonical)
2. `~/.unraid-mcp/.env.local`
3. `/app/.env.local` (Docker)
4. `<project-root>/.env.local`
5. `<project-root>/.env`
6. `unraid_mcp/.env`

Override the credentials directory with `UNRAID_CREDENTIALS_DIR`.

Key server variables:
- `UNRAID_MCP_HOST` - Bind address (default: `127.0.0.1`; Docker uses `0.0.0.0`)
- `UNRAID_MCP_PORT` - Server port (default: `6970`)
- `UNRAID_MCP_TRANSPORT` - Transport method (default: `streamable-http`)
- `UNRAID_MCP_LOG_LEVEL` - Log verbosity (default: `INFO`)

See [configuration documentation](openwiki/configuration.md) for complete environment variable reference.

### Authentication

**HTTP Transport** requires bearer authentication:
- `UNRAID_MCP_BEARER_TOKEN` - Auto-generated on first startup if absent
- `UNRAID_MCP_DISABLE_HTTP_AUTH` - Set `true` to disable (only behind trusted gateway)
- Optional **Google OAuth** support via `UNRAID_MCP_GOOGLE_CLIENT_ID` + client secret

**stdio Transport** bypasses HTTP authentication (used by Claude Code plugin).

See `/docs/mcp/AUTH.md` for complete authentication documentation.

## Documentation Structure

- **[Architecture](openwiki/architecture.md)** - Technical architecture, component diagram, data flow
- **[API Reference](openwiki/api-reference.md)** - Complete tool surface with all actions and subactions
- **[Configuration](openwiki/configuration.md)** - Environment variables, authentication, SSL options
- **[Development](openwiki/development.md)** - Local development, testing, code quality, versioning

### Detailed Documentation (External)

The repository includes extensive documentation in the `/docs/` directory:

- **[`/docs/mcp/`](docs/mcp/)** - MCP server internals (TOOLS.md, ENV.md, AUTH.md, TRANSPORT.md, etc.)
- **[`/docs/stack/`](docs/stack/)** - Architecture and implementation details
- **[`/docs/upstream/`](docs/upstream/)** - Unraid GraphQL API integration
- **[`/docs/plugin/`](docs/plugin/)** - Plugin manifests and hooks
- **[`/docs/repo/`](docs/repo/)** - Repository structure and workflow

## Next Steps

1. **Install and connect** - Follow the quick start for your client above
2. **Explore the API** - Call `unraid(action="help")` to see all available operations
3. **Read the architecture** - See [architecture documentation](openwiki/architecture.md) for technical details
4. **Configure your deployment** - Review [configuration documentation](openwiki/configuration.md) for options
5. **Develop locally** - See [development documentation](openwiki/development.md) for workflow

## Source References

- Main server: `/unraid_mcp/server.py`
- Tool router: `/unraid_mcp/tools/unraid.py`
- Domain tools: `/unraid_mcp/tools/` (17 modules)
- Configuration: `/unraid_mcp/config/`
- Subscriptions: `/unraid_mcp/subscriptions/`
- Entry point: `/unraid_mcp/main.py`

## Version

Use PyPI or GitHub Release metadata for the current release; this evergreen guide does
not embed a version literal that can drift from release-please.

Versioning is fully automated via Conventional Commits. See `/AGENTS.md` for the versioning workflow.
