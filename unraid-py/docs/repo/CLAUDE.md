# Repository Documentation -- unraid-mcp

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
plugins/      Claude/Codex/Gemini plugin (manifests, hooks, scripts, skill)
scripts/      Repo-maintenance scripts (CI, git hooks, Justfile) — NOT shipped to runtimes
docs/         This documentation tree
```

The 19 domain tool modules live in `src/unraid_mcp/tools/_<domain>.py`; the consolidated
`unraid` tool is assembled in `src/unraid_mcp/tools/unraid.py`.

## Common commands

```bash
uv sync                 # install deps (add --group dev for test/lint tooling)
just dev                # uv run python -m unraid_mcp
just test               # uv run pytest tests/ -v
just lint && just fmt   # ruff check + format
just check-contract     # verify version sync across pyproject + 3 manifests
```

**Do not hand-bump versions** — release-please computes them from Conventional
Commit messages on `main`. See `RULES.md` and the root `CLAUDE.md`.

## Cross-References

- [mcp/](../mcp/) -- MCP server documentation
- [plugin/](../plugin/) -- Plugin surface documentation
- [stack/](../stack/) -- Technology stack details
