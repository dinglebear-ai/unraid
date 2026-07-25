#!/usr/bin/env bash
set -euo pipefail

# Validate required environment variables before starting the server
required_vars=(
  UNRAID_API_URL
  UNRAID_API_KEY
)

# UNRAID_MCP_BEARER_TOKEN is only required for HTTP-based transports with auth enabled
_transport="${UNRAID_MCP_TRANSPORT:-streamable-http}"
_disable_auth="${UNRAID_MCP_DISABLE_HTTP_AUTH:-false}"
_google_oauth_enabled=false
if [[ -n "${UNRAID_MCP_GOOGLE_CLIENT_ID:-}" && -n "${UNRAID_MCP_GOOGLE_CLIENT_SECRET:-}" ]]; then
  _google_oauth_enabled=true
fi
if [[ "$_transport" != "stdio" && "$_disable_auth" != "true" && "$_disable_auth" != "1" && "$_disable_auth" != "yes" && "$_google_oauth_enabled" != "true" ]]; then
  required_vars+=(UNRAID_MCP_BEARER_TOKEN)
fi

missing=()
for var in "${required_vars[@]}"; do
  if [ -z "${!var:-}" ]; then
    missing+=("$var")
  fi
done

if [ "${#missing[@]}" -gt 0 ]; then
  echo "entrypoint: ERROR — required environment variables not set:" >&2
  for v in "${missing[@]}"; do
    echo "  $v" >&2
  done
  exit 1
fi

# Hand off to server — exec replaces this process so signals are forwarded correctly
exec unraid-mcp-server "$@"
