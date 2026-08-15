#!/bin/bash
# Scoped runtime environment shared by the native runraid service and updater.
# Plugin settings never leak into login shells or unrelated services.

UNRAID_MCP_CONFIG_DIR="${UNRAID_MCP_CONFIG_DIR:-/boot/config/plugins/unraid-mcp}"
UNRAID_MCP_APPDATA_DIR="${UNRAID_MCP_APPDATA_DIR:-/mnt/user/appdata/unraid-mcp}"
UNRAID_MCP_ENV_FILE="${UNRAID_MCP_ENV_FILE:-${UNRAID_MCP_CONFIG_DIR}/.env}"

unraid_mcp_is_true() {
    case "${1,,}" in
        1|true|yes) return 0 ;;
        *) return 1 ;;
    esac
}

unraid_mcp_is_false() {
    case "${1,,}" in
        0|false|no) return 0 ;;
        *) return 1 ;;
    esac
}

# Do not create anything under /mnt/user while merely loading configuration.
# Persistent paths are prepared only by explicit mutating service/updater actions.
# Load dotenv assignments as literal data. Never source the file: even a
# root-owned config can be manually malformed, and command substitutions must
# not become executable shell syntax. The parser supports the plugin writer's
# POSIX single-quote encoding plus simple legacy quoted/unquoted values.
unraid_mcp_trim() {
    local value="$1"
    value="${value#"${value%%[![:space:]]*}"}"
    value="${value%"${value##*[![:space:]]}"}"
    printf '%s' "${value}"
}

unraid_mcp_load_env() {
    local file="$1" line key raw value
    while IFS= read -r line || [ -n "${line}" ]; do
        line="${line%$'\r'}"
        line="$(unraid_mcp_trim "${line}")"
        [ -n "${line}" ] || continue
        [[ "${line}" == \#* ]] && continue
        if [[ "${line}" != *=* ]]; then
            echo "unraid-mcp: ignoring malformed env line without =" >&2
            continue
        fi
        key="$(unraid_mcp_trim "${line%%=*}")"
        raw="$(unraid_mcp_trim "${line#*=}")"
        if [[ ! "${key}" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
            echo "unraid-mcp: ignoring invalid env key ${key}" >&2
            continue
        fi

        value="${raw}"
        if [ "${#raw}" -ge 2 ] && [ "${raw:0:1}" = "'" ] && [ "${raw: -1}" = "'" ]; then
            value="${raw:1:${#raw}-2}"
            value="$(printf '%s' "${value}" | sed "s/'\\\\''/'/g")"
        elif [ "${#raw}" -ge 2 ] && [ "${raw:0:1}" = '"' ] && [ "${raw: -1}" = '"' ]; then
            value="${raw:1:${#raw}-2}"
            value="$(printf '%s' "${value}" | sed 's/\\"/"/g; s/\\\\/\\/g')"
        fi
        export "${key}=${value}"
    done <"${file}"
}

if [ -r "${UNRAID_MCP_ENV_FILE}" ]; then
    unraid_mcp_load_env "${UNRAID_MCP_ENV_FILE}"
fi

# Assign this after dotenv loading so a persistent appdata override cannot
# split the directory prepared by rc.unraid-mcp from runraid's data directory.
# runraid honors UNRAID_HOME as its exact data directory, avoiding the former
# accidental /mnt/user/appdata/unraid-mcp/.unraid nesting.
export UNRAID_HOME="${UNRAID_MCP_APPDATA_DIR}"

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

# A legacy Python-era install may contain Google credentials but no Rust auth
# mode/admin email. Default safely to bearer; rc.unraid-mcp emits one warning
# only when the operator actually starts the service.
: "${UNRAID_RMCP_AUTH_MODE:=bearer}"
export UNRAID_RMCP_AUTH_MODE

# Translate the former two-switch TLS guard into runraid's explicit skip flag.
if [ -z "${UNRAID_API_SKIP_TLS_VERIFY:-}" ] \
    && unraid_mcp_is_false "${UNRAID_VERIFY_SSL:-true}" \
    && unraid_mcp_is_true "${UNRAID_ALLOW_INSECURE_TLS:-false}"; then
    export UNRAID_API_SKIP_TLS_VERIFY="true"
fi

# The Python server also accepted a CA *bundle path* in UNRAID_VERIFY_SSL, which
# is neither true nor false. Such an install has TLS working via a private CA;
# dropping the value would have broken every GraphQL call with a bare
# certificate error and no hint that a setting had been silently discarded.
# runraid expresses the same intent as UNRAID_API_CA_BUNDLE.
if [ -z "${UNRAID_API_CA_BUNDLE:-}" ] \
    && [ -n "${UNRAID_VERIFY_SSL:-}" ] \
    && ! unraid_mcp_is_true "${UNRAID_VERIFY_SSL}" \
    && ! unraid_mcp_is_false "${UNRAID_VERIFY_SSL}"; then
    # Only adopt a bundle that actually exists; an unreadable path is reported by
    # rc.unraid-mcp at service start (this file is also sourced by config.php,
    # which must stay quiet).
    if [ -r "${UNRAID_VERIFY_SSL}" ]; then
        export UNRAID_API_CA_BUNDLE="${UNRAID_VERIFY_SSL}"
    fi
fi

# A legacy trusted-proxy opt-in is the equivalent explicit acknowledgement
# required by runraid before allowing no-auth on a non-loopback bind.
if unraid_mcp_is_true "${UNRAID_RMCP_DISABLE_HTTP_AUTH}" \
    && unraid_mcp_is_true "${UNRAID_MCP_TRUST_PROXY:-false}" \
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
