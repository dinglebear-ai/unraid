# Quickstart: unraid-rmcp

Build the local CLI and run a loopback MCP server. Commands below use the
Rust component, not the zero-member Cargo manifest at the repository root.
A real API call requires an explicitly selected Unraid target and its API key.

## Build

```bash
git clone https://github.com/dinglebear-ai/unraid
cd unraid/unraid-rs
cargo build --release --locked
./target/release/runraid --help
```

Use the checked-in toolchain and an activated repository environment. The
binary path changes when `CARGO_TARGET_DIR` is set. Building does not install
`runraid` onto PATH.

## Configure the selected target

Supply these values privately to the process:

```bash
export UNRAID_API_URL="https://your-test-server.example/graphql"
export UNRAID_API_KEY="replace-with-your-test-key"
export UNRAID_RMCP_HOST=127.0.0.1
export UNRAID_RMCP_PORT=40010
```

These are placeholders, not working credentials. For persistence, use
`<UNRAID_HOME>/.env` when configured, otherwise `~/.unraid/.env` on a host
or `/data/.env` in a container. An arbitrary checkout-local `.env` is not the
binary's canonical credential file. Preserve existing configuration.

For a private certificate authority, configure `UNRAID_API_CA_BUNDLE` with
its readable PEM bundle. Do not disable TLS verification as the normal setup
step. Nonempty process settings take precedence over the selected env file.

## Start loopback HTTP

```bash
./target/release/runraid serve mcp
```

The explicit loopback bind selects development authentication policy. Do not
combine the default non-loopback host with an auth-disable flag: the startup
guard rejects that combination unless a separate acknowledgement is supplied.
`UNRAID_NOAUTH` alone does not turn authentication off. Shared deployments
should use bearer authentication or OAuth; see the [README](../README.md).

In a second terminal:

```bash
curl -fsS http://127.0.0.1:40010/health
```

This proves process liveness, not upstream API access or permission to mutate.

## Read server identity through MCP

With the default `legacy` projection:

```bash
curl -fsS http://127.0.0.1:40010/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"unraid","arguments":{"action":"server"}}}'
```

This is the repository's stateless HTTP call pattern, not a general replacement
for an MCP client's initialization lifecycle. The response depends on the
selected Unraid API. In atomic projection, discover `unraid_server` instead;
selectors and scopes still apply.

## Stdio and CLI

A local MCP client should launch the built binary with the `mcp` argument:

```json
{
  "mcpServers": {
    "unraid": {
      "command": "/absolute/path/to/unraid/unraid-rs/target/release/runraid",
      "args": ["mcp"]
    }
  }
}
```

The child process must receive the configuration above through its environment
or canonical credential file. Stdio does not use HTTP bearer authentication.
For Claude Code project configuration, the file is `.mcp.json`; use the
client's own configuration commands for other scopes.

For direct read-only CLI queries:

```bash
./target/release/runraid server --json
./target/release/runraid array
./target/release/runraid docker
./target/release/runraid --help
```

The overall server is not read-only. Other commands can mutate Unraid. MCP
pagination and selector policy are not automatically CLI features.

See the [component guide](../AGENTS.md), [configuration and authentication
reference](../README.md), and [architecture](stack/ARCH.md).
