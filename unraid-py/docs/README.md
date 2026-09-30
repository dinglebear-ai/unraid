# Python MCP documentation

This directory documents the Python `unraid-mcp` server. It is separate from
the Rust implementation and native OS plugins in this monorepo. Start with the
[Python README](../README.md) for the product overview and the
[component guide](../AGENTS.md) for implementation contracts.

## Find the owning reference

| Topic | Guide |
| --- | --- |
| Plugin, local, and container setup | [SETUP.md](SETUP.md) |
| Environment, TLS, and credential paths | [CONFIG.md](CONFIG.md) |
| Inbound bearer/OAuth versus outbound API keys | [AUTHENTICATION.md](AUTHENTICATION.md), [MCP auth](mcp/AUTH.md) |
| Actions, arguments, and destructive operations | [Tool reference](mcp/TOOLS.md), [DESTRUCTIVE_ACTIONS.md](DESTRUCTIVE_ACTIONS.md) |
| Live data and subscription resources | [Resources](mcp/RESOURCES.md) |
| Client configuration and transports | [Connection guide](mcp/CONNECT.md), [Transport guide](mcp/TRANSPORT.md) |
| Container health and proxy boundaries | [Deployment guide](mcp/DEPLOY.md) |
| Safety mechanisms and their limits | [GUARDRAILS.md](GUARDRAILS.md) |
| Runtime ownership and execution flow | [Architecture](stack/ARCH.md) |
| Client manifests, settings, and skills | [Plugin index](plugin/AGENTS.md) |
| Tests, task recipes, and repository structure | [MCP developer index](mcp/AGENTS.md), [Repository index](repo/AGENTS.md) |
| Release ownership and component tags | [Monorepo release guide](../../docs/RELEASING.md) |

## Runtime contract

The server registers one `unraid` tool routed by `action` and `subaction`.
Use `unraid(action="help")` for the maintained operation reference. Subscription
diagnostics are subactions of `subscriptions`, not additional standalone tools.
The runtime router and domain handlers in [tools/](../src/unraid_mcp/tools/)
own behavior; do not infer API coverage from an old schema snapshot or count.

The default transport is Streamable HTTP. The client plugin explicitly selects
stdio. HTTP supports a generated/configured static bearer token, Google OAuth,
or an explicitly configured static-token fallback alongside OAuth. Stdio is a
local process boundary and does not use HTTP authentication.

The client manifests and skill live under
[agents/unraid-py/](../../agents/unraid-py/), while the Gemini extension manifest
lives in the Python component. Neither Claude nor Codex plugin ships hooks.
Their MCP configuration passes settings to the launched process; it does not
automatically write a credential file for unrelated shells or Docker instances.
`health/setup` reports setup status and may perform a read-only connection probe;
it does not prompt for or save credentials.

## Development entry point

From `unraid-py/` with the repository toolchain active:

```bash
uv sync --locked --group dev
uv run unraid-mcp
```

Configuration must be supplied privately before making API calls. The
[development guide](../../docs/DEVELOPMENT.md) owns the offline gates and build
roots; live operations require a separately selected test target. A green
`/health` response is not upstream readiness or proof of a successful tool call.

## Maintaining this index

Keep detailed examples in the owning guides instead of copying entire action,
configuration, or dependency inventories here. Imported API snapshots and
historical session records describe their capture revision, not current runtime
behavior. Structural link checks and source review are different checks; see the
[monorepo documentation index](../../docs/README.md) for validation scope.
