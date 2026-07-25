# Hook Configuration -- unraid-mcp

## Overview

unraid-mcp registers two hooks — `SessionStart` and `ConfigChange` — that both
run the same idempotent script to persist the plugin's userConfig credentials to
`~/.unraid-mcp/.env`. They are **advisory** (credential-setup convenience), not
security enforcement: the MCP server also receives credentials directly via the
plugin's `.mcp.json` env, so a hook failure must never block the session.

## Hook definition

**File**: `hooks/hooks.json` (single source of truth; the Claude manifest
references it via `"hooks": "./hooks/hooks.json"` rather than inlining commands).

```json
{
  "hooks": {
    "SessionStart": [
      { "hooks": [{ "type": "command", "command": "${CLAUDE_PLUGIN_ROOT}/scripts/plugin-setup.sh" }] }
    ],
    "ConfigChange": [
      { "matcher": "user_settings",
        "hooks": [{ "type": "command", "command": "${CLAUDE_PLUGIN_ROOT}/scripts/plugin-setup.sh" }] }
    ]
  }
}
```

## Hook script

### scripts/plugin-setup.sh

**Purpose**: Persist the plugin's userConfig credentials to `~/.unraid-mcp/.env`.

- Runs `uvx unraid-mcp setup plugin-hook` (the published PyPI package — no bundled
  uv project to sync, so the old `sync-uv.sh` hook was removed).
- **Idempotent**: writing identical credentials is a no-op-equivalent rewrite.
- **Never blocks**: missing `uvx`, no network, or a setup error warns to stderr
  (greppable `plugin-setup.sh:` prefix) and exits `0`.

## Triggers

- **SessionStart** — fires once at session start to persist current credentials.
- **ConfigChange** (`user_settings` matcher) — re-runs when the user edits plugin
  settings, so updated credentials reach `~/.unraid-mcp/.env` without a restart.

## See Also

- [../GUARDRAILS.md](../GUARDRAILS.md) -- Destructive-action and security patterns (enforced in code, not hooks)
- [CONFIG.md](CONFIG.md) -- Plugin userConfig fields the hook persists
- [PLUGINS.md](PLUGINS.md) -- Plugin manifest that references hooks.json
