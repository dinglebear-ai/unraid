# Prerequisites -- unraid-mcp

## Runtime requirements

### Local development

| Requirement | Version | Purpose |
|-------------|---------|---------|
| Python | 3.12+ | Runtime |
| uv | latest | Package management, virtual environments, script execution |
| An Unraid server | 6.12+ | GraphQL API endpoint |

### Docker deployment

| Requirement | Version | Purpose |
|-------------|---------|---------|
| Docker | 20.10+ | Container runtime |
| Docker Compose | v2+ | Container orchestration |

### CI

| Requirement | Provided by | Purpose |
|-------------|------------|---------|
| Python 3.12 | `uv` setup action | Build and test |
| uv 0.9.25+ | `astral-sh/setup-uv@v5` | Dependency management |
| Docker Buildx | `docker/setup-buildx-action` | Multi-arch builds |

## Unraid server requirements

- **API enabled**: Settings > Management Access > Allow API access
- **API key generated**: Settings > Management Access > API Keys
- **Network accessible**: The MCP server must be able to reach the Unraid server's GraphQL endpoint
- **WebSocket support**: For live subscriptions, the endpoint must support WebSocket upgrades

## Python dependencies

### Runtime

| Package | Version | Purpose |
|---------|---------|---------|
| `python-dotenv` | >=1.1.1 | Environment file loading |
| `fastmcp` | >=3.0.0 | MCP server framework |
| `httpx` | >=0.28.1 | Async HTTP client for GraphQL |
| `fastapi` | >=0.115.0 | ASGI web framework (via FastMCP) |
| `uvicorn[standard]` | >=0.35.0 | ASGI server with HTTP/2 and WebSocket |
| `websockets` | >=15.0.1 | WebSocket connections for subscriptions |
| `rich` | >=14.1.0 | Terminal output enhancement |

### Development

| Package | Version | Purpose |
|---------|---------|---------|
| `pytest` | >=8.4.2 | Test runner |
| `pytest-asyncio` | >=1.2.0 | Async test support |
| `pytest-cov` | >=7.0.0 | Coverage reporting |
| `respx` | >=0.22.0 | httpx mock library |
| `ty` | >=0.0.15 | Type checker |
| `ruff` | >=0.12.8 | Linter and formatter |
| `build` | >=1.2.2 | Package builder |
| `twine` | >=6.0.1 | PyPI upload tool |
| `graphql-core` | >=3.2.0 | GraphQL schema validation in tests |
| `hypothesis` | >=6.151.9 | Property-based testing |

## Optional tools

| Tool | Purpose |
|------|---------|
| `just` | Task runner (Justfile recipes) |
| `openssl` | Bearer token generation |
| `jq` | JSON processing for health checks |
| `wget` | Docker health check command |

## See Also

- [TECH.md](TECH.md) -- Technology rationale
- [../mcp/DEPLOY.md](../mcp/DEPLOY.md) -- Deployment methods
- [../SETUP.md](../SETUP.md) -- Setup guide
