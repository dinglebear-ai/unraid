# Coding Rules -- unraid-mcp

## Python style

- **Version**: Python 3.12+
- **Type hints**: All function signatures must have type annotations
- **Docstrings**: Google style convention
- **Line length**: 100 characters (enforced by Ruff)
- **Imports**: isort with `unraid_mcp` as known first-party
- **Async**: All tool handlers and GraphQL calls are `async`

## Ruff rules

Enabled rule sets: F, E, W, I, N, D, UP, YTT, B, Q, C4, SIM, TCH, PTH, ASYNC, RET, PERF, RUF, S (bandit security).

Notable ignores:
- `E501`: Line length (handled by formatter)
- `D100-D107`: Missing docstrings (relaxed for modules and methods)
- `D203/D213`: Docstring spacing conflicts

Per-file relaxations:
- `__init__.py`: F401 (unused imports), D104 (missing docstring)
- `tests/`: D (docstrings), S101 (assert), S105-S107 (hardcoded passwords), N815 (camelCase for GraphQL response fields)

## Architecture rules

### Module organization

- Domain tool modules are private: `_docker.py`, `_vm.py`, etc.
- Only `unraid.py` is the public entry point for tool registration
- Each domain module exports: queries dict, mutations dict (if any), destructive set (if any), handler function

### Mutation handler ordering

Mutation handlers MUST return before the domain query dict lookup. This is the most critical gotcha -- violating it causes `KeyError` at runtime.

### Import patterns

- `from ..config import settings as _settings` -- never `import settings` directly
- `from ..core import client as _client` -- aliased to avoid name collisions
- `from ..core.exceptions import ToolError, tool_error_handler` -- always use these for errors

### Circular import prevention

`middleware_refs.py` breaks the circular dependency between `server.py` (which imports `tools/unraid.py`) and health/diagnose (which needs error middleware stats).

## Test rules

- Patch at the **tool module level**: `unraid_mcp.tools.unraid.make_graphql_request`
- Never patch at core module level for tool tests
- Use `conftest.py`'s `make_tool_fn()` helper
- Mark slow tests with `@pytest.mark.slow`
- Mark integration tests with `@pytest.mark.integration`
- camelCase allowed in test files for Pydantic fields mirroring GraphQL keys

## Security rules

- Never commit credentials
- Never log sensitive values (even at DEBUG)
- Always use `redact_sensitive()` for debug output
- Destructive actions MUST use `gate_destructive_action()`
- Credential files MUST be mode 600, directories mode 700
- Bearer tokens MUST be removed from `os.environ` after startup

## Version rules

- **Never bump versions by hand** — release-please does it from Conventional Commits
- Use Conventional Commit messages (`fix:` → patch, `feat:` → minor, `feat!:` → major)
- release-please keeps the four manifest files in sync and generates the `CHANGELOG.md` entry
- Merge the release PR to tag `vX.Y.Z` and trigger publishing

## See Also

- [../mcp/PATTERNS.md](../mcp/PATTERNS.md) -- Code patterns
- [../mcp/PRE-COMMIT.md](../mcp/PRE-COMMIT.md) -- Lint and format enforcement
- [../GUARDRAILS.md](../GUARDRAILS.md) -- Security rules
