# Pre-commit Hook Configuration

Pre-commit checks (via lefthook) for unraid-mcp.

## Code Quality Tools

### Ruff (linting and formatting)

Configured in `pyproject.toml`:

```bash
# Lint
uv run ruff check src/

# Auto-fix
uv run ruff check --fix src/

# Format
uv run ruff format src/

# Format check (no changes)
uv run ruff format --check src/
```

**Configuration highlights**:
- Target: Python 3.12
- Line length: 100
- Enabled rule sets: F, E, W, I, N, D, UP, YTT, B, Q, C4, SIM, TCH, PTH, ASYNC, RET, PERF, RUF, S
- Docstring convention: Google style
- Per-file ignores: relaxed rules for `__init__.py` and `tests/`
- Cache: `.cache/.ruff_cache`

### ty (type checking)

Astral's fast type checker:

```bash
uv run ty check src/
```

Configured for Python 3.12 with respect for `type: ignore` comments.

## Git pre-commit hooks (lefthook)

`lefthook.yml` defines the pre-commit suite (run in parallel):

| Command | Action |
|---------|--------|
| `diff_check` | `git diff --check --cached` (whitespace/conflict markers) |
| `yaml` | parse staged `*.yml`/`*.yaml` with PyYAML |
| `lint` | `just lint` (ruff check) |
| `format` | `just fmt` (ruff format) |
| `typecheck` | `just typecheck` (ty) |
| `skills` | `just validate-skills` |
| `env_guard` | `bash scripts/block-env-commits.sh` — blocks committing `.env` files |

> Note: the **plugin's** `hooks.json` (`SessionStart` + `ConfigChange`) is unrelated —
> it persists credentials at runtime, not a git/PostToolUse hook. See
> [../plugin/HOOKS.md](../plugin/HOOKS.md).

## Justfile Integration

```bash
just lint       # uv run ruff check .
just fmt        # uv run ruff format .
just typecheck  # uv run ty check src/
```

## CI Enforcement

The `ci.yml` workflow runs lint and format checks:
- `uv run ruff check src/ tests/`
- `uv run ruff format --check src/ tests/`
- `uv run ty check src/`

All three must pass for the CI pipeline to succeed.

## See Also

- [CICD.md](CICD.md) -- CI workflow details
- [DEV.md](DEV.md) -- Development workflow
- [../GUARDRAILS.md](../GUARDRAILS.md) -- Destructive-action and security patterns (in code)
