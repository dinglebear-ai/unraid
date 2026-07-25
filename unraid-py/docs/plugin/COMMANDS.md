# Slash Commands -- unraid-mcp

## Status

unraid-mcp does not currently define any slash commands. All operations are performed through the `unraid` MCP tool with action+subaction routing.

## Future considerations

If slash commands are added, they would be placed in a `commands/` directory and registered in the plugin manifest. Potential candidates:

- `/unraid:setup` -- shortcut for `unraid(action="health", subaction="setup")`
- `/unraid:health` -- shortcut for `unraid(action="health", subaction="check")`
- `/unraid:overview` -- shortcut for `unraid(action="system", subaction="overview")`

Currently, the `unraid` skill in `skills/unraid/SKILL.md` serves as the primary interface for Claude Code, making slash commands redundant.

## See Also

- [SKILLS.md](SKILLS.md) -- Skill definitions (primary interface)
- [../mcp/TOOLS.md](../mcp/TOOLS.md) -- MCP tool reference
