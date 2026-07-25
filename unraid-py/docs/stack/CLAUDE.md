# Technology Stack Documentation -- unraid-mcp

## Files

| File | Description |
|------|-------------|
| [TECH.md](TECH.md) | Technology choices and rationale |
| [ARCH.md](ARCH.md) | Architecture overview and component diagram |
| [PRE-REQS.md](PRE-REQS.md) | Prerequisites and system requirements |

## Stack summary

- **Language**: Python 3.12+
- **MCP framework**: FastMCP 3.0+
- **HTTP client**: httpx (async)
- **WebSocket**: websockets 15.0+
- **Web framework**: FastAPI + Uvicorn (via FastMCP)
- **Validation**: Pydantic (via FastMCP)
- **Package manager**: uv
- **Build system**: Hatchling
- **Linting**: Ruff
- **Type checking**: ty (Astral)
- **Testing**: pytest + pytest-asyncio + respx + hypothesis
- **Container**: Docker (multi-stage, Python 3.12 slim)

## Version pins (gotchas)

Two churn-prone deps carry upper bounds in `pyproject.toml` — do **not** widen them
without testing against the new major:

- `fastmcp>=3.0.0,<4.0.0` — the middleware/transport API breaks across majors.
- `websockets>=15.0.1,<17.0.0` — subscription client depends on the v15+ API shape.

`httpx>=0.28.1` is unpinned on the upper end. Python floor is `>=3.12`.

## Quality gates

```bash
just lint        # uv run ruff check .
just fmt         # uv run ruff format .
just typecheck   # uv run ty check src/  (ty = Astral's type checker, NOT mypy)
just test        # uv run pytest tests/ -v
```

## Cross-References

- [mcp/](../mcp/) -- MCP server specifics
- [repo/](../repo/) -- Repository structure
- [upstream/](../upstream/) -- Unraid GraphQL API details
