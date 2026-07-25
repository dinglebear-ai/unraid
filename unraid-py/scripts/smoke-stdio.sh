#!/usr/bin/env bash
set -euo pipefail

server="${1:?usage: smoke-stdio.sh /path/to/unraid-mcp-server}"
request='{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"artifact-smoke","version":"1"}}}'
initialized='{"jsonrpc":"2.0","method":"notifications/initialized","params":{}}'
list='{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'

output="$({ printf '%s\n%s\n%s\n' "$request" "$initialized" "$list"; sleep 20; } \
  | UNRAID_MCP_TRANSPORT=stdio \
    UNRAID_API_URL=http://127.0.0.1:1/graphql \
    UNRAID_API_KEY=artifact-smoke-key \
    timeout 60 "$server" 2>/dev/null \
  | head -c 1048576 || true)"

initialize_response="$(printf '%s\n' "$output" | sed -n '1p')"
tools_response="$(printf '%s\n' "$output" | sed -n '2p')"
jq -e '.result.serverInfo.name | length > 0' <<<"$initialize_response" >/dev/null
jq -e '.result.tools[] | select(.name == "unraid")' <<<"$tools_response" >/dev/null
