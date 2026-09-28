# Python component structure

This tree is rooted at `unraid-py/` within the tooling monorepo, not at the
repository root. See the [root component map](../../../AGENTS.md).

```text
unraid-py/
  AGENTS.md                 Canonical component contributor instructions
  CLAUDE.md -> AGENTS.md     Claude compatibility alias
  GEMINI.md -> AGENTS.md     Gemini compatibility alias
  README.md                 Installation and usage
  pyproject.toml, uv.lock    Package/dependency/build policy
  Justfile                  Component-local development commands
  Dockerfile                Multi-stage image build
  docker-compose.yaml       Container configuration
  entrypoint.sh             Container startup
  server.json               Release-managed registry metadata
  gemini-extension.json     Gemini extension manifest
  .env.example              Configuration template, never real credentials
  src/unraid_mcp/
    main.py                 Entry point and shutdown
    server.py               FastMCP assembly and middleware
    version.py              Installed package version
    config/                 Configuration and logging
    core/                   GraphQL transport, auth, guards, setup, output bounds
    tools/                  Consolidated action router and domain handlers
    subscriptions/          Live queries, lifecycle, resources, diagnostics
  scripts/                  Repository maintenance and schema tooling
  tests/                    Unit, safety, schema, HTTP, integration, property tests
  docs/                     Maintained guides and captured schema/session evidence
```

The client-agent plugin lives at **`agents/unraid-py/` at the monorepo root**,
not `unraid-py/plugins/` or a Python-local `.claude-plugin/` directory. It owns
its Claude/Codex manifests, `.mcp.json`, manual setup script, and skill. It has
no Claude hook registration. The two marketplace catalogs are also at the
monorepo root.

`src/unraid_mcp/tools/unraid.py` exposes the consolidated tool; domain modules
implement its operations. Consult the router and docs/code contract tests
instead of copying a module/file count into this map. Shared request pacing,
error handling, confirmation, and response bounds belong in core modules,
not per-client integrations.

Root `.github/workflows/` owns CI; root `lefthook.yml` owns git hooks. Run Python
commands from `unraid-py/` unless an explicit monorepo-root path is supplied.
The release manager owns versions and corresponding metadata fields.

See [RECIPES.md](RECIPES.md), [SCRIPTS.md](SCRIPTS.md), and
[component AGENTS](../../AGENTS.md) for working details.
