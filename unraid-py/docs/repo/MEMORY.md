# Memory Files -- unraid-mcp

## Overview

This project uses `bd` (beads) for persistent knowledge instead of MEMORY.md files. Run `bd prime` for full context.

## Key knowledge

### Architecture

- FastMCP server with consolidated `unraid` tool (15 action domains, 108 subactions)
- 4-layer MCP middleware chain: logging, error handling, rate limiting, response limiting
- 3-layer ASGI middleware: health bypass, well-known discovery, bearer auth
- WebSocket subscription manager for 10 live data streams
- Plugin-option credential setup (setup plugin-hook -> .env) and elicitation-based destructive action gating

### Critical gotchas

- Mutation handlers MUST return before the domain query dict lookup (prevents `KeyError`)
- Patch at tool module level for tests, not core module level
- `ResponseCachingMiddleware` was removed because the consolidated tool mixes reads and mutations
- Bearer tokens are removed from `os.environ` after startup
- `arraySubscription` has a known Unraid API bug (may show "connecting" indefinitely)

### Version files

Four files must stay in sync: `pyproject.toml`, `.claude-plugin/plugin.json`, `.codex-plugin/plugin.json`, `gemini-extension.json`.

### Credential storage

Canonical path: `~/.unraid-mcp/.env` (mode 600, directory mode 700). Override with `UNRAID_CREDENTIALS_DIR`.

## See Also

- Root `CLAUDE.md` -- Complete development instructions
- [RULES.md](RULES.md) -- Coding conventions
