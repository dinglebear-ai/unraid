# Claude Code Marketplace Setup

> **Scope note (monorepo):** paths shown as repo-root siblings of `agents/unraid-py/`
> (`src/unraid_mcp/`, `scripts/`, …) actually live under `unraid-py/` in the
> monorepo. Only `agents/`, `plugins/`, and the orchestration files sit at the root.


This document explains the Claude Code marketplace and plugin structure for the Unraid MCP project.

## What Was Created

### 1. Marketplace Manifest (`.claude-plugin/marketplace.json`)
The marketplace catalog that lists all available plugins in this repository.

**Location:** `.claude-plugin/marketplace.json`

**Contents:**
- Marketplace metadata (name, version, owner, repository)
- Plugin catalog with the "unraid" plugin
- Categories and tags for discoverability

### 2. Plugin Manifest (`agents/unraid-py/.claude-plugin/plugin.json`)
The individual plugin configuration for the Unraid MCP server.

**Location:** `agents/unraid-py/.claude-plugin/plugin.json`

**Contents:**
- Plugin name (`unraid-mcp`), release-please-managed version, author
- Repository and homepage links
- `mcpServers` reference to `agents/unraid-py/.mcp.json`, which runs the published `uvx unraid-mcp` server in stdio mode
- `userConfig` fields for `UNRAID_API_URL` and `UNRAID_API_KEY`

## MCP Tools Exposed

The plugin registers **a single MCP tool**:

| Tool | Purpose |
|------|---------|
| `unraid` | The only tool — `action` (domain) + `subaction` (operation) routing, 178 subactions across 19 actions. WebSocket diagnostics and the Markdown reference are the `subscriptions` and `help` actions of this tool. |

### Calling Convention

All Unraid operations go through the single `unraid` tool:

```
unraid(action="docker", subaction="list")
unraid(action="system", subaction="overview")
unraid(action="array", subaction="parity_status")
unraid(action="vm", subaction="list")
unraid(action="live", subaction="cpu")
```

### Domains (action=)

| action | example subactions |
|--------|--------------------|
| `system` | overview, array, network, metrics, services, ups_devices |
| `health` | check, test_connection, diagnose, setup |
| `array` | parity_status, parity_start, start_array, add_disk |
| `disk` | shares, disks, disk_details, logs |
| `docker` | list, details, start, stop, restart |
| `vm` | list, details, start, stop, pause, resume |
| `notification` | overview, list, create, archive, archive_all |
| `key` | list, get, create, update, delete |
| `plugin` | list, add, remove |
| `rclone` | list_remotes, config_form, create_remote |
| `setting` | update, configure_ups |
| `customization` | theme, set_theme, sso_enabled |
| `oidc` | providers, configuration, validate_session |
| `user` | me |
| `live` | cpu, memory, array_state, log_tail, notification_feed |

Destructive subactions (e.g. `stop_array`, `force_stop`, `delete`) require `confirm=True`.

## Installation Methods

### Method 1: GitHub Distribution (Recommended for Users)

Once pushed to GitHub, users install via:

```bash
# Add the marketplace
/plugin marketplace add jmagar/unraid-mcp

# Install the Unraid plugin
/plugin install unraid-mcp@unraid-mcp
```

### Method 2: Local Installation (Development)

For testing locally before publishing:

```bash
# Add local marketplace
/plugin marketplace add /home/jmagar/workspace/unraid-mcp

# Install the plugin
/plugin install unraid-mcp@unraid-mcp
```

### Method 3: Direct URL

Install from a specific branch or commit:

```bash
# From specific branch
/plugin marketplace add jmagar/unraid-mcp#main

# From specific commit
/plugin marketplace add jmagar/unraid-mcp#abc123
```

## Validation Script

To verify the marketplace and plugin structure is valid before publishing:

```bash
bash scripts/validate-marketplace.sh [repo-root]   # or: just validate-marketplace
```

The script checks:
- Marketplace and plugin JSON manifests exist and are valid
- Required plugin files are in place (`SKILL.md`, `README.md`, `scripts/`, `examples/`, `references/`)
- Plugin is listed in the marketplace manifest
- Version numbers are in sync between `pyproject.toml` and `.claude-plugin/plugin.json`

Exits 0 on success, 1 if any check fails.

## Plugin Structure

```text
unraid-mcp/
├── .claude-plugin/
│   └── marketplace.json     # Claude Code marketplace catalog
├── .agents/plugins/
│   └── marketplace.json     # Codex marketplace catalog
├── agents/unraid-py/
│   ├── .claude-plugin/
│   │   ├── plugin.json      # Claude Code plugin manifest
│   │   └── README.md
│   ├── .codex-plugin/
│   │   └── plugin.json      # Codex plugin manifest
│   ├── .mcp.json            # Shared MCP server definition
│   ├── hooks/               # SessionStart / ConfigChange hooks
│   └── skills/unraid/       # Client-facing skill docs and references
├── src/unraid_mcp/              # Python package (the actual MCP server)
│   ├── main.py              # Entry point
│   ├── server.py            # FastMCP server registration
│   ├── tools/unraid.py      # Consolidated `unraid` tool (single tool, action-routed)
│   ├── config/              # Settings management
│   ├── core/                # GraphQL client, exceptions, shared types
│   └── subscriptions/       # Real-time WebSocket subscription manager
└── scripts/
    ├── validate-marketplace.sh         # Validate marketplace/plugin structure
    ├── check-version-sync.sh           # Verify version sync across manifests
    ├── block-env-commits.sh            # lefthook guard against committing .env
    └── generate_unraid_api_reference.py  # Regenerate GraphQL API docs
```

## Marketplace Metadata

### Categories
- `infrastructure` — Server management and monitoring tools

### Tags
- `unraid` — Unraid-specific functionality
- `monitoring` — System monitoring capabilities
- `homelab` — Homelab automation
- `graphql` — GraphQL API integration
- `docker` — Docker container management
- `virtualization` — VM management

## Publishing Checklist

Before publishing to GitHub:

1. **Let release-please update version-bearing files**
   - Do not bump versions by hand.
   - release-please keeps `pyproject.toml`, plugin manifests, extension manifests, and `CHANGELOG.md` in sync.

3. **Test Locally**
   ```bash
   /plugin marketplace add .
   /plugin install unraid-mcp@unraid-mcp
   ```

4. **Commit and Push**
   ```bash
   git add .claude-plugin/ .agents/plugins/ agents/unraid-py/ gemini-extension.json
   git commit -m "docs: update marketplace documentation"
   git push origin main
   ```

5. **Cut releases via release-please**
   - Merge the release-please PR.
   - The tag triggers PyPI, GHCR, and MCP Registry publication workflows.

## User Experience

After installation, users can:

1. **Invoke Unraid operations directly in Claude Code**
   ```
   unraid(action="system", subaction="overview")
   unraid(action="docker", subaction="list")
   unraid(action="health", subaction="check")
   ```

2. **Check credential status on first run**

   ```text
   unraid(action="health", subaction="setup")
   ```

   Reports whether credentials are configured and prints setup instructions. Set the
   plugin's *Unraid GraphQL API URL* / *Unraid API Key* fields in the config form — the
   setup hook persists them to `~/.unraid-mcp/.env` on the next session.

3. **Monitor live data via subscriptions**
   ```
   unraid(action="live", subaction="cpu")
   unraid(action="live", subaction="log_tail")
   ```

## Maintenance

### Updating the Plugin

To release a new version:

1. Make changes to the plugin code
2. Commit and push with Conventional Commit messages
3. Merge the release-please PR when ready

Users with the plugin installed will see the update available and can upgrade:
```bash
/plugin update unraid
/plugin update unraid-mcp
```

## Support

- **Repository:** https://github.com/jmagar/unraid-mcp
- **Issues:** https://github.com/jmagar/unraid-mcp/issues
- **Destructive Actions:** `docs/DESTRUCTIVE_ACTIONS.md`

- Source path accuracy
- Documentation completeness
