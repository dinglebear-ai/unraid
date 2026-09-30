# Setup guide: unraid-mcp

Choose a plugin subprocess, local Python process, or Docker deployment. These
share server code, not an automatically shared credential store. The Python
component requires the runtime specified in [pyproject.toml](../pyproject.toml).
A real API call also requires an enabled Unraid API and a key for that target.

## Client plugin

In Claude Code:

```text
/plugin marketplace add dinglebear-ai/unraid
/plugin install unraid-mcp@unraid-mcp
```

Set the plugin's Unraid API URL and API key. Use the full GraphQL URL, such as
`https://your-test-server.example/graphql`. The shared
[.mcp.json](../../agents/unraid-py/.mcp.json) maps these settings directly into
`uvx unraid-mcp` with stdio transport. There are no SessionStart/ConfigChange
credential hooks and no automatic persistence for an unrelated shell or Docker
container. The Codex manifest has its own stdio/environment configuration.

Restart the plugin process after configuration changes, then request:

```python
unraid(action="health", subaction="setup")
unraid(action="health", subaction="test_connection")
```

The setup action reports status and may probe the configured endpoint. It does
not collect, write, or replace credentials. HTTP bearer/OAuth settings are not
needed for the local stdio connection. See [CONNECT.md](mcp/CONNECT.md) for
other clients.

## Local development

```bash
git clone https://github.com/dinglebear-ai/unraid.git
cd unraid/unraid-py
uv sync --locked --group dev
```

Provide `UNRAID_API_URL` and `UNRAID_API_KEY` privately in the process
environment or the canonical `~/.unraid-mcp/.env`. The directory can be changed
with `UNRAID_CREDENTIALS_DIR`. Preserve an existing file rather than copying a
template over it. For a new file, create the directory with mode 0700 and the
file with mode 0600, then populate the names shown in [.env.example](../.env.example).

The loader uses the first eligible non-symlink env file, not a merge of all
fallbacks. Nonempty process values win; empty plugin placeholders can inherit
persisted values. See [CONFIG.md](CONFIG.md) for the complete search order.

Start from `unraid-py/`:

```bash
uv run unraid-mcp
```

Bare-metal HTTP defaults to loopback. Direct bearer-mode startup generates and
persists an inbound token when none is configured. Read it privately from the
reported location and configure your MCP client; do not paste it into a shared
document. OAuth mode does not generate a static token.

## Docker Compose

Run Compose from `unraid-py/`. The checked-in file publishes its port on
loopback and expects an **existing external network**. Set `DOCKER_NETWORK`
in the Compose shell to your intended network; its legacy default is `jakenet`,
not Docker's default bridge. Inspect the network before starting the stack.

The Compose `env_file` reads `~/.unraid-mcp/.env` on the Docker host. For
bearer-mode HTTP, configure `UNRAID_MCP_BEARER_TOKEN` there before launching:
the container entrypoint rejects a missing token rather than relying on the
Python startup generator. Alternatively configure Google OAuth, including its
public URL and identity allowlist, as described in [AUTHENTICATION.md](AUTHENTICATION.md).

```bash
docker compose up -d
curl -fsS http://127.0.0.1:6970/health
```

The named credential volume is separate from the host env file. Compose uses
`/ready` for container health; `/health` proves only process liveness.
Do not run multiple replicas or expose an unauthenticated backend directly.
See [DEPLOY.md](mcp/DEPLOY.md) for storage, resource, and proxy requirements.

## Published package

With private configuration already supplied:

```bash
uvx unraid-mcp
```

This defaults to HTTP. A stdio client must set `UNRAID_MCP_TRANSPORT=stdio`.
The `unraid-mcp-server` entry point is an alias of `unraid-mcp`.

## Troubleshooting

For missing credentials, inspect `health/setup`, the process environment, and
the selected credential path without printing secret values. Plugin settings do
not configure every other installation automatically.

For a private CA, set `UNRAID_VERIFY_SSL=/path/to/ca.pem`. Disabling verification
requires both `UNRAID_VERIFY_SSL=false` and `UNRAID_ALLOW_INSECURE_TLS=true`;
that exposes the API key to an unverified peer and is not the normal setup path.

For HTTP authentication failures, distinguish the inbound MCP credential from
the outbound Unraid key. OAuth plus an explicitly configured static token can
coexist, but OAuth plus `UNRAID_MCP_DISABLE_HTTP_AUTH=true` is rejected.
