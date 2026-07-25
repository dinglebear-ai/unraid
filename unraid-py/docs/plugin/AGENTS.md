# Agent Definitions -- unraid-mcp

## Status

unraid-mcp does not currently define any agents. The `unraid` MCP tool with its 19 actions provides sufficient coverage for all Unraid operations without requiring specialized agent behavior.

## Symlinks

The repository includes `AGENTS.md` and `GEMINI.md` as symlinks to `CLAUDE.md` for Codex and Gemini compatibility:

```bash
ln -sf CLAUDE.md AGENTS.md
ln -sf CLAUDE.md GEMINI.md
```

These are not agent definitions -- they are development instruction files for AI coding assistants.

## See Also

- [SKILLS.md](SKILLS.md) -- Skill definitions
- [../mcp/TOOLS.md](../mcp/TOOLS.md) -- Tool reference
