# Hook Configuration -- unraid-mcp

## Status: no hooks

**The `unraid-mcp` plugin ships no Claude Code hooks.** They were removed on
2026-07-27 along with the `agents/unraid-py/hooks/` directory. Neither
`agents/unraid-py/.claude-plugin/plugin.json` nor `.codex-plugin/plugin.json`
declares a `"hooks"` key, and no `hooks/hooks.json` exists.

Do not re-add them.

## What used to be here

Two hooks — `SessionStart` and `ConfigChange` (matcher `user_settings`) — both ran
`${CLAUDE_PLUGIN_ROOT}/scripts/plugin-setup.sh`, which invoked
`uvx unraid-mcp setup plugin-hook` to mirror the plugin's `userConfig` credentials
into `~/.unraid-mcp/.env`. They were explicitly **advisory**: idempotent, always
exiting `0`, never permitted to block a session.

## Why removing them costs nothing here

The plugin's `.mcp.json` injects the credentials straight into the server process:

```json
"env": {
  "UNRAID_MCP_TRANSPORT": "stdio",
  "UNRAID_API_URL": "${CLAUDE_PLUGIN_OPTION_UNRAID_API_URL}",
  "UNRAID_API_KEY": "${CLAUDE_PLUGIN_OPTION_UNRAID_API_KEY}"
}
```

The hook only ever duplicated credentials that already reached the server.
`~/.unraid-mcp/.env` is still the canonical credentials file when running the server
**outside** Claude Code — populate it on demand with either of:

```bash
uvx unraid-mcp setup plugin-hook       # non-interactive, from plugin config
unraid action=health subaction=setup   # interactive elicitation flow
```

`scripts/plugin-setup.sh` is retained as the non-interactive entry point.

> **Contrast with `agents/unraid-rs`.** The Rust plugin's `.mcp.json` passes **no**
> env, so for that plugin the hook *was* the only automatic credential path. After
> installing `runraid`, `runraid setup plugin-hook` must be run once by hand.

## See Also

- [../GUARDRAILS.md](../GUARDRAILS.md) -- Destructive-action and security patterns (enforced in code, not hooks)
- [CONFIG.md](CONFIG.md) -- Plugin userConfig fields
- [PLUGINS.md](PLUGINS.md) -- Plugin manifests
