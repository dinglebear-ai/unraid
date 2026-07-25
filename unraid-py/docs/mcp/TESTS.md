# Testing Guide

Testing patterns for unraid-mcp. All non-live testing is covered here; see [MCPORTER.md](MCPORTER.md) for end-to-end smoke tests.

## Unit Tests

### Running

```bash
# All unit tests (excludes slow and integration)
uv run pytest -m "not slow and not integration"

# Single domain
uv run pytest tests/test_docker.py

# Fail fast
uv run pytest -x

# With coverage
uv run pytest --cov=unraid_mcp --cov-report=term-missing
```

### Organization

```
tests/
+-- conftest.py                    # Shared fixtures + make_tool_fn() helper
+-- test_array.py                  # Array domain tests
+-- test_auth.py                   # Bearer auth middleware tests
+-- test_client.py                 # GraphQL client tests
+-- test_customization.py          # Customization domain tests
+-- test_docker.py                 # Docker domain tests
+-- test_guards.py                 # Destructive action guard tests
+-- test_health.py                 # Health domain tests
+-- test_info.py                   # System info tests
+-- test_keys.py                   # API key domain tests
+-- test_live.py                   # Live subscription tests
+-- test_notifications.py          # Notification domain tests
+-- test_oidc.py                   # OIDC domain tests
+-- test_plugins.py                # Plugin domain tests
+-- test_rclone.py                 # Rclone domain tests
+-- test_resources.py              # MCP resource tests
+-- test_review_regressions.py     # Regression tests
+-- test_settings.py               # Settings domain tests
+-- test_setup.py                  # Credential .env write + sentinel error tests
+-- test_plugin_setup.py           # Plugin-option mapping + setup plugin-hook tests
+-- test_snapshot.py               # WebSocket snapshot tests
+-- test_storage.py                # Storage/disk domain tests
+-- test_subscription_manager.py   # Subscription manager tests
+-- test_subscription_validation.py # Subscription validation tests
+-- test_users.py                  # User domain tests
+-- test_validation.py             # Input validation tests
+-- test_vm.py                     # VM domain tests
```

### Patching convention

Patch at the **tool module level**, not the core module:

```python
# Correct
@patch("unraid_mcp.tools.unraid.make_graphql_request")

# Wrong -- conftest's mock_graphql_request patches core, not tools
@patch("unraid_mcp.core.client.make_graphql_request")
```

Use `conftest.py`'s `make_tool_fn()` helper for creating test tool functions.

## Specialized Test Suites

### Safety tests (`tests/safety/`)

Verify that all destructive actions are properly gated:

```bash
uv run pytest tests/safety/
```

Tests confirm that:
- Destructive subactions are blocked without `confirm=True`
- Elicitation is triggered for interactive clients
- `ToolError` is raised for non-interactive clients without `confirm=True`

### Schema tests (`tests/schema/`)

Validate GraphQL query strings against the Unraid API schema (119 tests):

```bash
uv run pytest tests/schema/
```

Uses `graphql-core` to parse and validate all query/mutation dicts, drives the
real consolidated `unraid` tool dispatch to verify every GraphQL operation is
actually emitted by the action/subaction path, and validates the offline mock
Unraid scenarios against the selected response shapes. The dispatch contract
covers reads and mutations.

To print the complete generated GraphQL operation inventory or the API root-field
parity report:

```bash
scripts/list_graphql_operations.py
scripts/list_graphql_operations.py --json
scripts/report_api_parity.py
scripts/report_api_parity.py --json
```

The parity report compares the vendored Unraid SDL root query/mutation/
subscription fields against the emitted GraphQL inventory, including internal
helper queries and live subscription queries. Missing mutation/subscription
roots fail the schema tests unless explicitly classified; current query gaps are
documented as intentional in `src/unraid_mcp/devtools/api_parity.py`.

### HTTP layer tests (`tests/http_layer/`)

Test httpx request/response handling using `respx`:

```bash
uv run pytest tests/http_layer/
```

### Contract tests (`tests/contract/`)

Verify response shape contracts:

```bash
uv run pytest tests/contract/
```

### Property tests (`tests/property/`)

Input validation using Hypothesis:

```bash
uv run pytest tests/property/
```

### Integration tests (`tests/integration/`)

WebSocket subscription lifecycle tests (slow, requires live server):

```bash
uv run pytest tests/integration/ -m slow
```

## Coverage

Configuration in `pyproject.toml`:

- **Minimum**: 80% branch coverage (`fail_under = 80`)
- **Source**: `src/unraid_mcp/` directory
- **Excludes**: tests, `__pycache__`, `.venv`, abstract methods, type checking blocks
- **Reports**: terminal, HTML (`.cache/htmlcov/`), XML (`.cache/coverage.xml`)

```bash
# Generate coverage report
uv run pytest --cov=unraid_mcp --cov-report=html

# View HTML report
open .cache/htmlcov/index.html
```

## Test markers

| Marker | Description |
|--------|-------------|
| `slow` | Long-running tests (deselect with `-m "not slow"`) |
| `integration` | Integration tests requiring external services |
| `unit` | Unit tests (fast, no external dependencies) |

## Justfile recipes

```bash
just test          # Run all tests
just test-live     # Run live integration tests
just test-http     # HTTP e2e smoke test
```

## See Also

- [MCPORTER.md](MCPORTER.md) -- End-to-end smoke testing
- [CICD.md](CICD.md) -- CI test configuration
- [SCHEMA.md](SCHEMA.md) -- Schema definitions tested by schema tests
