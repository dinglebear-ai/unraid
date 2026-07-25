# Skill Definitions -- unraid-mcp

## Overview

unraid-mcp ships one skill that provides client-facing documentation for all Unraid operations.

## Skill: `unraid`

**Location**: `skills/unraid/SKILL.md`

### Frontmatter

```yaml
---
name: unraid
description: "This skill should be used when the user mentions Unraid, asks to check server health, monitor array or disk status, list or restart Docker containers, start or stop VMs, read system logs, check parity status, view notifications, manage API keys, configure rclone remotes, check UPS or power status, get live CPU or memory data, force stop a VM, check disk temperatures, or perform any operation on an Unraid NAS server."
---
```

The description is a comprehensive trigger list that helps Claude Code match user intents to this skill.

### Sections

1. **Mode Detection**: MCP mode (preferred) vs HTTP fallback
2. **Setup**: First-time credential configuration via `health/setup`
3. **Calling Convention**: `unraid(action="<domain>", subaction="<operation>")`
4. **All Domains and Subactions**: 15 domain tables with every subaction, description, and required parameters
5. **Destructive Actions**: Summary table with risk descriptions
6. **Common Workflows**: Multi-step examples for setup, monitoring, container management, logs, and VMs
7. **Notes**: Rate limits, log path validation, known API bugs
8. **HTTP Fallback Mode**: Direct GraphQL curl commands using `$CLAUDE_PLUGIN_OPTION_*` variables

### HTTP fallback

When MCP tools are unavailable, the skill documents direct GraphQL queries:

```bash
curl -s "$CLAUDE_PLUGIN_OPTION_UNRAID_API_URL" \
  -H "x-api-key: $CLAUDE_PLUGIN_OPTION_UNRAID_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ info { os { hostname uptime } } }"}'
```

Credentials are available as `$CLAUDE_PLUGIN_OPTION_*` environment variables (from plugin.json `userConfig`, sensitive fields).

## See Also

- [PLUGINS.md](PLUGINS.md) -- Plugin manifests that register the skill
- [../mcp/TOOLS.md](../mcp/TOOLS.md) -- Tool definitions the skill documents
- [../mcp/ELICITATION.md](../mcp/ELICITATION.md) -- Destructive action confirmation referenced by the skill
