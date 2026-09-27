# Repository Documentation -- unraid-mcp

Edit `AGENTS.md`; `CLAUDE.md` and `GEMINI.md` are symlinks to this file.

## Files

| File | Description |
|------|-------------|
| [REPO.md](REPO.md) | Repository structure and directory layout |
| [RECIPES.md](RECIPES.md) | Justfile recipes for development and operations |
| [SCRIPTS.md](SCRIPTS.md) | Scripts reference for quality gates and utilities |
| [RULES.md](RULES.md) | Coding rules and conventions |
| [MEMORY.md](MEMORY.md) | Memory files and persistent knowledge |

## Top-level layout

```
src/unraid_mcp/   Python package — server.py, main.py, config/, core/, subscriptions/, tools/
tests/        conftest.py + unit/http_layer/integration/safety/schema/contract/property suites
../agents/unraid-py/  Claude/Codex client manifests, manual setup, and skill (no hooks)
gemini-extension.json  Gemini extension manifest in this component
scripts/      Repo-maintenance scripts (CI, git hooks, Justfile) — NOT shipped to runtimes
docs/         This documentation tree
```

Domain tool modules live in `src/unraid_mcp/tools/_<domain>.py`; the consolidated
`unraid` tool is assembled in `src/unraid_mcp/tools/unraid.py`.

## Common commands

```bash
uv sync --locked --group dev  # install locked runtime and development dependencies
just dev                # uv run python -m unraid_mcp
just test               # uv run pytest tests/ -v
just lint && just fmt   # ruff check + format
just check-contract     # verify version sync across pyproject + 3 manifests
```

**Do not hand-bump versions** — release-please computes them from Conventional
Commit messages on `main`. See `RULES.md` and the root `AGENTS.md`.

## Cross-References

- [mcp/](../mcp/) -- MCP server documentation
- [plugin/](../plugin/) -- Plugin surface documentation
- [stack/](../stack/) -- Technology stack details
