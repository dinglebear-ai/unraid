# Plugin Settings -- unraid-mcp

## userConfig (Claude Code)

The `.claude-plugin/plugin.json` defines two user-configurable settings:

| Key | Type | Sensitive | Default | Description |
|-----|------|-----------|---------|-------------|
| `unraid_api_url` | string | yes | -- | Unraid GraphQL API URL |
| `unraid_api_key` | string | yes | -- | Unraid API key |

### How settings are used

Both values are sensitive and are exposed to plugin-spawned processes as
`$CLAUDE_PLUGIN_OPTION_*` environment variables:

- `$CLAUDE_PLUGIN_OPTION_UNRAID_API_URL`
- `$CLAUDE_PLUGIN_OPTION_UNRAID_API_KEY`

`.mcp.json` wires these into the stdio MCP server's environment so the server
picks them up directly:

```json
"env": {
  "UNRAID_API_URL": "${CLAUDE_PLUGIN_OPTION_UNRAID_API_URL}",
  "UNRAID_API_KEY": "${CLAUDE_PLUGIN_OPTION_UNRAID_API_KEY}"
}
```

> The `${user_config.*}` placeholder form is **not** used here: referencing it
> directly in a `.mcp.json` `env` block causes the MCP server to silently fail
> to spawn (claude-code issue #51573). The `$CLAUDE_PLUGIN_OPTION_*` env-var
> form is the reliable path.

## Settings (Gemini CLI)

The `gemini-extension.json` defines two settings:

| Name | envVar | Sensitive |
|------|--------|-----------|
| Unraid API URL | `UNRAID_API_URL` | no |
| Unraid API Key | `UNRAID_API_KEY` | yes |

Gemini sets these as environment variables before launching the MCP server.

## Codex CLI

The `.codex-plugin/plugin.json` does not define explicit settings. Codex reads credentials from `~/.unraid-mcp/.env` via the standard loading chain.

## See Also

- [PLUGINS.md](PLUGINS.md) -- Full plugin manifest reference
- [SKILLS.md](SKILLS.md) -- How skills reference userConfig
- [../mcp/ENV.md](../mcp/ENV.md) -- Server-side environment variables
