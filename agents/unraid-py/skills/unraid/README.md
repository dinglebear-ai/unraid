# Unraid Skill

Query, monitor, and manage Unraid servers through the consolidated `unraid` MCP tool,
with a `curl`-based HTTP fallback for when MCP tools are unavailable.

## What's Included

The skill drives the single `unraid` MCP tool, which uses `action` (domain) +
`subaction` (operation) routing across 17 domains and ~160 subactions — e.g.
`unraid(action="docker", subaction="list")`. See `SKILL.md` for the full domain tables.

### Files

```text
skills/unraid/
├── SKILL.md                       # Main skill documentation (domains, subactions, examples)
├── README.md                      # This file
├── load-env.sh                    # Parses ~/.unraid-mcp/.env for the HTTP fallback (this library is sourced, not run)
├── scripts/
│   ├── unraid-query.sh            # GraphQL query helper (sources load-env.sh)
│   └── dashboard.sh               # System dashboard (single server, or a multi-server fleet)
├── examples/
│   ├── disk-health.sh             # Disk temperature & health check
│   └── read-logs.sh               # Log file reader
└── references/
    ├── quick-reference.md         # Common operations cheat sheet
    ├── troubleshooting.md         # Error → fix guide
    ├── api-reference.md           # GraphQL API reference
    ├── endpoints.md               # Endpoint catalog
    ├── introspection-schema.md    # Introspection notes
    └── schema.graphql             # Raw GraphQL schema
```

## Installation

This skill ships with the Unraid MCP plugin. Install via the Claude Code marketplace:

```bash
/plugin marketplace add dinglebear-ai/unraid-mcp
/plugin install unraid-mcp @unraid-mcp
```

## Credentials

Configuration comes from the plugin's **userConfig** form (*Unraid GraphQL API URL* /
*Unraid API Key*). Claude Code injects those values as `CLAUDE_PLUGIN_OPTION_*` only into
plugin subprocesses (hooks/MCP), **not** the Bash tool — so the plugin's setup hook reads
them and writes `~/.unraid-mcp/.env`, and the skill's scripts read that file via
`load-env.sh` (which parses it, not sources it). For manual/Docker installs, create
`~/.unraid-mcp/.env` directly:

```bash
UNRAID_API_URL=https://your-unraid-server/graphql
UNRAID_API_KEY=your-api-key
```

Credentials are read once at server startup — restart the server after changing them.
Check status any time (read-only) with `unraid(action="health", subaction="setup")`.

## Quick Start

Preferred — use the MCP tool:

```python
unraid(action="system", subaction="overview")
unraid(action="health", subaction="check")
unraid(action="docker", subaction="list")
```

HTTP fallback (when MCP tools are unavailable) — the helper sources `load-env.sh` for you:

```bash
"$CLAUDE_PLUGIN_ROOT/skills/unraid/scripts/unraid-query.sh" -q "{ online }"
"$CLAUDE_PLUGIN_ROOT/skills/unraid/examples/disk-health.sh"
```

## Triggers

Activates on Unraid-related requests: check server health, array/parity status, disk
temperatures, Docker container list/restart, VM start/stop, system logs, notifications,
UPS/power status, live CPU/memory, API keys, and rclone remotes.

## Requirements

- Unraid server with the GraphQL API enabled, and an API key (Settings → Management
  Access → API Keys)
- `curl` and `jq` for the HTTP fallback scripts (usually pre-installed)

## Documentation

- `SKILL.md` — task-oriented guidance and the full domain/subaction tables
- `references/quick-reference.md` — common operations cheat sheet
- `references/troubleshooting.md` — error → fix guide
- `references/api-reference.md` / `schema.graphql` — GraphQL API reference

## Notes

- Array/disk sizes are in **kilobytes**; memory values are in **bytes**; temperatures in **Celsius**.
- Docker container logs are **not** available via the API — use SSH + `docker logs`.
- Destructive subactions require `confirm=True` (see the Destructive Actions table in `SKILL.md`).
- Rate limit: 100 requests / 10 seconds.
