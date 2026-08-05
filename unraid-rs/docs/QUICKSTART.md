# Quickstart — unraid-rmcp

Get unraid-rmcp running and make your first MCP call in five minutes.

## Prerequisites

- Rust 1.90+ (`rustup show` or `curl https://sh.rustup.rs | sh`)
- An Unraid server with the API enabled
- Your Unraid API URL and API key (Settings → API Management in the Unraid web UI)

## 1. Clone and build

```bash
git clone https://github.com/dinglebear-ai/unraid
cd unraid-mcp/unraid-rs
cargo build --release
# Binary at: target/release/runraid
```

## 2. Configure

Copy `.env` and edit it, or set environment variables directly:

```bash
export UNRAID_API_URL="https://10-1-0-2.<hash>.myunraid.net:31337/graphql"
export UNRAID_API_KEY="your-api-key-here"
export UNRAID_RMCP_PORT=40010
export UNRAID_RMCP_DISABLE_HTTP_AUTH=true
```

If your Unraid API uses a self-signed certificate:
```bash
export UNRAID_API_SKIP_TLS_VERIFY=true
```

## 3. Start the server

```bash
# With cargo (development)
cargo run -- serve mcp

# With the release binary
./target/release/runraid serve mcp

# Or just
./target/release/runraid
```

You should see:
```
INFO unraid_rmcp: unraid-rmcp starting bind=0.0.0.0:40010
INFO unraid_rmcp: MCP HTTP server listening bind=0.0.0.0:40010
```

## 4. Verify

```bash
curl -sf http://localhost:40010/health | jq .
```
Expected: `{"status":"ok"}`

## 5. First MCP call

```bash
# Get server identity
curl -s -X POST http://localhost:40010/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "unraid",
      "arguments": {"action": "server"}
    }
  }' | jq -r '.result.content[0].text' | jq .
```

Expected response (truncated):
```json
{
  "server": {
    "name": "Tower",
    "status": "online",
    "lanip": "192.0.2.2",
    "localurl": "http://tower/"
  }
}
```

## Use with Claude Code (stdio)

Add to your Claude Code MCP config (`~/.claude/mcp_servers.json` or project `.mcp.json`):

```json
{
  "mcpServers": {
    "unraid": {
      "command": "/path/to/runraid",
      "args": ["mcp"],
      "env": {
        "UNRAID_API_URL": "https://10-1-0-2.<hash>.myunraid.net:31337/graphql",
        "UNRAID_API_KEY": "your-api-key",
        "RUST_LOG": "warn"
      }
    }
  }
}
```

Then in Claude: "Use the unraid tool to show me the array status."

## Try the CLI

```bash
./target/release/runraid array
./target/release/runraid docker
./target/release/runraid metrics
./target/release/runraid notifications
./target/release/runraid server --json | jq .server.name
```

## Get help

```bash
./target/release/runraid --help
```

Or via MCP:
```bash
curl -s -X POST http://localhost:40010/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"unraid","arguments":{"action":"help"}}}' \
  | jq -r '.result.content[0].text' | jq -r .help
```

## Next steps

- [README.md](../README.md) — full configuration reference, auth options, all actions
- [docs/INVENTORY.md](INVENTORY.md) — complete action, CLI, and env var inventory
- [docs/stack/ARCH.md](stack/ARCH.md) — architecture overview
