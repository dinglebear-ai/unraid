# Justfile Recipes -- unraid-mcp

## Development

| Recipe | Command | Description |
|--------|---------|-------------|
| `just dev` | `uv run python -m unraid_mcp` | Start development server |
| `just test` | `uv run pytest tests/ -v` | Run all tests |
| `just lint` | `uv run ruff check .` | Run linter |
| `just fmt` | `uv run ruff format .` | Format code |
| `just typecheck` | `uv run pyright` or `mypy` | Type check |
| `just validate-skills` | Check `skills/*/SKILL.md` | Validate skill files exist |

## Docker Compose

| Recipe | Command | Description |
|--------|---------|-------------|
| `just build` | `docker build -t unraid-mcp .` | Build Docker image |
| `just up` | `docker compose up -d` | Start containers |
| `just down` | `docker compose down` | Stop containers |
| `just restart` | `docker compose restart` | Restart containers |
| `just logs` | `docker compose logs -f` | Tail container logs |
| `just health` | `curl /health` | Check health endpoint |

## Live Testing

| Recipe | Command | Description |
|--------|---------|-------------|
| `just test-live` | `pytest -m live` | Run live integration tests |
| `just test-http` | `test-http.sh` | HTTP e2e test with auth |
| `just test-http-no-auth` | `test-http.sh --skip-auth` | HTTP e2e test without auth |
| `just test-http-remote <url>` | `test-http.sh --url <url>` | HTTP e2e against remote URL |

## Setup

| Recipe | Command | Description |
|--------|---------|-------------|
| `just setup` | Copy `.env.example` to `.env` | Create local env file |
| `just gen-token` | `secrets.token_urlsafe(32)` | Generate a bearer token |

## Quality Gates

| Recipe | Command | Description |
|--------|---------|-------------|
| `just check-contract` | Security check scripts | Docker security, no baked env, ignore files |

## Cleanup

| Recipe | Command | Description |
|--------|---------|-------------|
| `just clean` | Remove caches and artifacts | dist/, __pycache__, .pytest_cache, .coverage |

## Publishing

| Recipe | Command | Description |
|--------|---------|-------------|
| `just publish` | Prints release instructions | Releases are automated via release-please |

Releases are not bumped by hand. Land changes on `main` with Conventional Commit
messages and release-please opens a release PR that bumps every version file and updates
`CHANGELOG.md`; merging it tags `vX.Y.Z` and triggers PyPI + Docker + MCP-registry
publishing. See [../mcp/PUBLISH.md](../mcp/PUBLISH.md).

## See Also

- [../mcp/DEV.md](../mcp/DEV.md) -- Development workflow
- [SCRIPTS.md](SCRIPTS.md) -- Scripts called by recipes
