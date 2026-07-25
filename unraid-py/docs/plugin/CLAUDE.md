# Plugin Surface Documentation -- unraid-mcp

## Files

| File | Description |
|------|-------------|
| [PLUGINS.md](PLUGINS.md) | Plugin manifest reference (plugin.json for Claude, Codex, Gemini) |
| [SKILLS.md](SKILLS.md) | Skill definitions and SKILL.md format |
| [HOOKS.md](HOOKS.md) | SessionStart + ConfigChange credential-setup hooks |
| [COMMANDS.md](COMMANDS.md) | Slash command definitions (none currently) |
| [AGENTS.md](AGENTS.md) | Agent definitions (none currently) |
| [CHANNELS.md](CHANNELS.md) | Channel integrations (none currently) |
| [CONFIG.md](CONFIG.md) | Plugin settings and userConfig |
| [MARKETPLACES.md](MARKETPLACES.md) | Marketplace publishing and discovery |
| [OUTPUT-STYLES.md](OUTPUT-STYLES.md) | Output style definitions (none currently) |
| [SCHEDULES.md](SCHEDULES.md) | Scheduled tasks (none currently) |

## Plugin surface summary

| Component | Count | Status |
|-----------|-------|--------|
| MCP servers | 1 (`unraid`) | Active |
| Skills | 1 (`unraid`) | Active |
| Hooks | 2 (SessionStart, ConfigChange) | Active |
| Commands | 0 | -- |
| Agents | 0 | -- |
| Channels | 0 | -- |
| Output styles | 0 | -- |
| Schedules | 0 | -- |

## Version sync (gotcha)

The plugin ships **three** manifests that must all match `pyproject.toml`:
`agents/unraid-py/.claude-plugin/plugin.json`, `.codex-plugin/plugin.json`, and
`gemini-extension.json`. release-please keeps them in sync from Conventional Commits —
**never hand-edit version strings.** Verify with `just check-contract`.

## Validating the plugin surface

```bash
just validate-marketplace   # marketplace.json + manifest/skill structure
just validate-skills        # SKILL.md frontmatter and structure
```

## Cross-References

- [mcp/](../mcp/) -- MCP server tools, resources, and configuration
- [repo/](../repo/) -- Repository structure
- [stack/](../stack/) -- Technology stack details
