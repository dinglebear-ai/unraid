---
title: Agent definitions
created: 2026-06-20
updated: 2026-09-27
---

# Agent Definitions -- unraid-mcp

## Status

The Python integration does not define standalone agents. It exposes the
consolidated `unraid` MCP tool and its supporting skill. Consult the tool
reference for the supported action catalog rather than assuming full API coverage.

## Shared and local instruction files

`AGENTS.md` is the regular, canonical instruction file in every documented
scope. `CLAUDE.md` and `GEMINI.md` are relative symlinks to `AGENTS.md`, not
independently maintained copies. These are development instructions, not agent
definitions.

From the repository root, repair shared aliases with the content-preserving helper:

```bash
python3 .github/scripts/check_documentation.py --repair-links
```

The helper refuses to overwrite a regular alias file. Reconcile existing
content before migrating an inverted layout.

Personal settings belong in the ignored `AGENTS.override.md`, with the ignored
relative alias `CLAUDE.local.md -> AGENTS.override.md`. The override must load
the shared baseline because Codex selects only one file per directory. See
[shared and local instructions](../../../docs/AGENT_INSTRUCTIONS.md) for
precedence, safe setup, and verification.

## See Also

- [SKILLS.md](SKILLS.md) -- Skill definitions
- [../mcp/TOOLS.md](../mcp/TOOLS.md) -- Tool reference
