# Technology Choices -- unraid-mcp

## Language: Python 3.12

- Type hints with `str | None` union syntax
- `match`/`case` support (not used, but available)
- `asyncio` for concurrent WebSocket and HTTP operations
- `importlib.metadata` for version reading

## MCP framework: FastMCP 3.0+

- Unified tool and resource registration via decorators
- Built-in middleware support (logging, error handling, rate limiting, response limiting)
- ASGI integration for HTTP transports
- Elicitation protocol support for interactive flows
- Context object for tool metadata and client capabilities

## HTTP client: httpx

- Async HTTP/2 support
- Configurable timeout per request
- SSL verification control
- Used for all GraphQL queries and mutations to the Unraid API

## WebSocket: websockets 15.0+

- GraphQL-over-WebSocket protocol (`graphql-transport-ws`)
- `connection_init` with API key authentication
- Subprotocol negotiation
- Used for persistent live subscriptions

## Web framework: FastAPI + Uvicorn

- Provided through FastMCP's HTTP transport
- ASGI middleware stack for auth and health endpoints
- Uvicorn with `standard` extras for HTTP/2 and WebSocket support

## Validation: Pydantic

- Used for elicitation response types (`_ConfirmAction` model)
- FastMCP uses Pydantic for tool parameter validation
- `BaseModel` with `Field` for schema generation

## Package manager: uv

- Fast dependency resolution and installation
- Lock file (`uv.lock`) for reproducible builds
- Dependency groups (`[dependency-groups]` in pyproject.toml)
- Build integration (`uv build` for sdist and wheel)
- Script execution (`uv run`)

## Build system: Hatchling

- `pyproject.toml`-native build backend
- Wheel-only includes `unraid_mcp/` package
- sdist includes tests, skills, commands, docs

## Linting: Ruff

- Replaces flake8, isort, pycodestyle, pydocstyle, bandit
- 100-character line length
- Google-style docstrings
- Security rules (bandit) enabled
- Cache in `.cache/.ruff_cache`

## Type checking: ty

- Astral's fast type checker (alternative to mypy/pyright)
- Python 3.12 target
- Respects `type: ignore` comments

## Testing

| Tool | Purpose |
|------|---------|
| pytest | Test runner with markers and strict config |
| pytest-asyncio | Async test support (auto mode) |
| pytest-cov | Coverage reporting (80% minimum) |
| respx | httpx request mocking |
| hypothesis | Property-based testing |
| graphql-core | GraphQL query validation |

## Container: Docker

- Multi-stage build: `uv:python3.12-bookworm-slim` (builder) + `python:3.12-slim-bookworm` (runtime)
- Non-root user (`mcp:1000`)
- uv cache mount for fast builds
- Health check via wget
- Multi-arch: amd64, arm64

## Environment management: python-dotenv

- `.env` file loading with priority chain
- In-place key updates via `set_key` (preserves comments)
- Used for both initial loading and runtime credential writes

## Rich terminal output

- `rich` library for enhanced logging and debug output
- Not used in MCP responses (plain text/JSON only)

## See Also

- [ARCH.md](ARCH.md) -- How these technologies fit together
- [PRE-REQS.md](PRE-REQS.md) -- Installation requirements
