# Development Workflow

Day-to-day development guide for unraid-mcp.

## Setup

```bash
# Clone
git clone https://github.com/jmagar/unraid-mcp.git
cd unraid-mcp

# Install all dependencies (including dev)
uv sync --group dev

# Create credentials
mkdir -p ~/.unraid-mcp
cp .env.example ~/.unraid-mcp/.env
chmod 700 ~/.unraid-mcp && chmod 600 ~/.unraid-mcp/.env
# Edit ~/.unraid-mcp/.env with your Unraid credentials
```

## Running the server

```bash
# Local dev (streamable-http on port 6970)
just dev
# or: uv run python -m unraid_mcp

# Direct entry point
uv run unraid-mcp-server

# stdio mode (for testing with MCP clients)
UNRAID_MCP_TRANSPORT=stdio uv run unraid-mcp-server
```

## Code quality

```bash
# Lint
just lint           # uv run ruff check .

# Format
just fmt            # uv run ruff format .

# Type check
just typecheck      # uv run ty check src/

# All quality gates
just lint && just fmt && just typecheck
```

## Testing

```bash
# All unit tests
just test           # uv run pytest tests/ -v

# Specific domain
uv run pytest tests/test_docker.py

# Safety guards only
uv run pytest tests/safety/

# Schema validation only
uv run pytest tests/schema/

# With coverage
uv run pytest --cov=unraid_mcp --cov-report=term-missing
```

## Docker development

```bash
# Build image
just build          # docker build -t unraid-mcp .

# Start container
just up             # docker compose up -d

# View logs
just logs           # docker compose logs -f

# Health check
just health         # curl /health endpoint

# Stop
just down           # docker compose down

# Restart
just restart        # docker compose restart
```

## Adding a new action domain

1. Create `src/unraid_mcp/tools/_newdomain.py`:
   - Define `_NEWDOMAIN_QUERIES` dict with GraphQL queries
   - Define `_NEWDOMAIN_MUTATIONS` dict (if applicable)
   - Define `_NEWDOMAIN_DESTRUCTIVE` set (if applicable)
   - Implement `_handle_newdomain()` async function
   - Mutation handlers MUST return before the query dict lookup

2. Register in `src/unraid_mcp/tools/unraid.py`:
   - Import handler and constants
   - Add to `UNRAID_ACTIONS` Literal type
   - Add routing in `unraid()` function
   - Update `_HELP_TEXT`

3. Add tests:
   - `tests/test_newdomain.py` -- unit tests with mocked GraphQL
   - Update `tests/schema/` if new queries
   - Update `tests/safety/` if destructive actions

4. Update documentation:
   - `skills/unraid/SKILL.md`
   - `CLAUDE.md` tool table
   - `docs/mcp/TOOLS.md`

## Adding a new subscription

1. Add query to `src/unraid_mcp/subscriptions/queries.py`:
   - Add to `SNAPSHOT_ACTIONS` (continuous) or `COLLECT_ACTIONS` (event-driven)
   - If event-driven, add to `EVENT_DRIVEN_ACTIONS`

2. Resources are auto-registered for `SNAPSHOT_ACTIONS` entries.

3. Add to `_handle_live()` in `tools/_live.py`.

4. Update `docs/mcp/RESOURCES.md`.

## Useful Justfile recipes

```bash
just                # List all recipes
just dev            # Start dev server
just test           # Run tests
just lint           # Lint check
just fmt            # Format code
just build          # Build Docker image
just up / down      # Docker compose up/down
just logs           # Tail container logs
just health         # Check /health endpoint
just setup          # Create .env from .env.example
just gen-token      # Generate a bearer token
just check-contract # Run security checks
just clean          # Remove build artifacts
just publish        # Release instructions (releases are automated via release-please)
```

## See Also

- [TESTS.md](TESTS.md) -- Detailed testing guide
- [PATTERNS.md](PATTERNS.md) -- Code patterns and conventions
- [CICD.md](CICD.md) -- CI pipeline details
