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

# A legacy Python-era install with Google OAuth credentials auto-enabled OAuth;
# runraid needs an explicit UNRAID_RMCP_AUTH_MODE=oauth plus an admin email
# (which has no legacy source), so we can only warn loudly — never auto-switch,
# since a missing admin email would crash startup.
if [ -z "${UNRAID_RMCP_AUTH_MODE:-}" ] \
    && [ -n "${UNRAID_MCP_GOOGLE_CLIENT_ID:-}" ] \
    && [ -n "${UNRAID_MCP_GOOGLE_CLIENT_SECRET:-}" ]; then
    unraid_mcp_oauth_warn="unraid-mcp: WARNING: OAuth credentials detected but auth mode defaulting to bearer; set UNRAID_RMCP_AUTH_MODE=oauth and UNRAID_RMCP_AUTH_ADMIN_EMAIL to restore OAuth"
    echo "${unraid_mcp_oauth_warn}" >&2
    mkdir -p /var/log/unraid-mcp 2>/dev/null || true
    # stderr first so a failed append-open is silenced too (best effort only).
    echo "$(date '+%Y-%m-%d %H:%M:%S') ${unraid_mcp_oauth_warn}" 2>/dev/null >>/var/log/unraid-mcp/server.log || true
    unset unraid_mcp_oauth_warn
fi

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
    unraid_mcp_log_level="${UNRAID_MCP_LOG_LEVEL,,}"
    # Python's WARNING is not a tracing level — it would silently fall back to
    # info. tracing spells it "warn".
    [ "${unraid_mcp_log_level}" = "warning" ] && unraid_mcp_log_level="warn"
    export RUST_LOG="${unraid_mcp_log_level}"
    unset unraid_mcp_log_level
fi
