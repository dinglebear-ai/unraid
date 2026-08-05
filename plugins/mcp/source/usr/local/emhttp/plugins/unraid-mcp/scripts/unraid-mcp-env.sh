#!/bin/bash
# Scoped runtime environment for the native runraid server. Sourced only by
# rc.unraid-mcp so plugin settings never leak into login shells or other services.

UNRAID_MCP_CONFIG_DIR="/boot/config/plugins/unraid-mcp"
UNRAID_MCP_APPDATA_DIR="/mnt/user/appdata/unraid-mcp"
UNRAID_MCP_ENV_FILE="${UNRAID_MCP_CONFIG_DIR}/.env"

mkdir -p "${UNRAID_MCP_APPDATA_DIR}"
chmod 700 "${UNRAID_MCP_APPDATA_DIR}" 2>/dev/null || true
export HOME="${UNRAID_MCP_APPDATA_DIR}"

# The settings endpoint writes shell-safe, single-quoted assignments and rejects
# newlines. Export them into runraid's process environment without exposing them
# globally.
if [ -r "${UNRAID_MCP_ENV_FILE}" ]; then
    set -a
    # shellcheck source=/dev/null
    source "${UNRAID_MCP_ENV_FILE}"
    set +a
fi

# Preserve existing installations while the settings page migrates from the
# Python server's UNRAID_MCP_* names to runraid's UNRAID_RMCP_* contract.
: "${UNRAID_RMCP_HOST:=${UNRAID_MCP_HOST:-0.0.0.0}}"
: "${UNRAID_RMCP_PORT:=${UNRAID_MCP_PORT:-40010}}"
: "${UNRAID_RMCP_TOKEN:=${UNRAID_MCP_BEARER_TOKEN:-}}"
: "${UNRAID_RMCP_DISABLE_HTTP_AUTH:=${UNRAID_MCP_DISABLE_HTTP_AUTH:-false}}"
: "${UNRAID_RMCP_PUBLIC_URL:=${UNRAID_MCP_GOOGLE_BASE_URL:-}}"
: "${UNRAID_RMCP_GOOGLE_CLIENT_ID:=${UNRAID_MCP_GOOGLE_CLIENT_ID:-}}"
: "${UNRAID_RMCP_GOOGLE_CLIENT_SECRET:=${UNRAID_MCP_GOOGLE_CLIENT_SECRET:-}}"

export UNRAID_RMCP_HOST UNRAID_RMCP_PORT UNRAID_RMCP_TOKEN UNRAID_RMCP_DISABLE_HTTP_AUTH
export UNRAID_RMCP_PUBLIC_URL UNRAID_RMCP_GOOGLE_CLIENT_ID UNRAID_RMCP_GOOGLE_CLIENT_SECRET

: "${UNRAID_RMCP_AUTH_MODE:=bearer}"
export UNRAID_RMCP_AUTH_MODE

# Translate the former two-switch TLS guard into runraid's explicit skip flag.
if [ -z "${UNRAID_API_SKIP_TLS_VERIFY:-}" ] \
    && [ "${UNRAID_VERIFY_SSL:-true}" = "false" ] \
    && [ "${UNRAID_ALLOW_INSECURE_TLS:-false}" = "true" ]; then
    export UNRAID_API_SKIP_TLS_VERIFY="true"
fi

# A legacy trusted-proxy opt-in is the equivalent explicit acknowledgement
# required by runraid before allowing no-auth on a non-loopback bind.
if [ "${UNRAID_RMCP_DISABLE_HTTP_AUTH}" = "true" ] \
    && [ "${UNRAID_MCP_TRUST_PROXY:-false}" = "true" ] \
    && [ -z "${UNRAID_NOAUTH:-}" ]; then
    export UNRAID_NOAUTH="true"
fi

if [ -z "${RUST_LOG:-}" ] && [ -n "${UNRAID_MCP_LOG_LEVEL:-}" ]; then
    export RUST_LOG="${UNRAID_MCP_LOG_LEVEL,,}"
fi
