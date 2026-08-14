#!/bin/bash
set -euo pipefail

plugin_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
env_script="$plugin_dir/source/usr/local/emhttp/plugins/unraid-mcp/scripts/unraid-mcp-env.sh"
rc_script="$plugin_dir/source/usr/local/emhttp/plugins/unraid-mcp/scripts/rc.unraid-mcp"
update_script="$plugin_dir/source/usr/local/emhttp/plugins/unraid-mcp/scripts/unraid-mcp-update.sh"
nchan_script="$plugin_dir/source/usr/local/emhttp/plugins/unraid-mcp/nchan/unraid_mcp"
verifier="$plugin_dir/scripts/verify-package.sh"

php "$plugin_dir/tests/config-endpoint.php"

# The runtime env parser must treat shell-looking text as literal data.
env_tmp="$(mktemp -d)"
marker="${env_tmp}/executed"
{
    printf '%s\n' "PLAIN='hello world'"
    printf '%s\n' "APOSTROPHE='Jake'\\''s server'"
    printf '%s\n' "BACKSLASH='C:\server\path'"
    printf '%s\n' "SHELL_TEXT='\$(touch ${marker})'"
    printf '%s\n' "UNQUOTED=\$(touch ${marker})"
    printf '%s\n' "INVALID;KEY='ignored'"
} >"${env_tmp}/.env"
(
    unset PLAIN APOSTROPHE BACKSLASH SHELL_TEXT UNQUOTED
    unset UNRAID_MCP_ENV_FILE UNRAID_MCP_CONFIG_DIR UNRAID_MCP_APPDATA_DIR
    export UNRAID_MCP_CONFIG_DIR="${env_tmp}"
    export UNRAID_MCP_APPDATA_DIR="${env_tmp}/appdata"
    # shellcheck source=/dev/null
    source "$env_script" 2>"${env_tmp}/parser.err"
    test "$PLAIN" = "hello world"
    test "$APOSTROPHE" = "Jake's server"
    test "$BACKSLASH" = "C:\server\path"
    test "$SHELL_TEXT" = "\$(touch ${marker})"
    test "$UNQUOTED" = "\$(touch ${marker})"
)
test ! -e "$marker"
grep -Fq 'ignoring invalid env key INVALID;KEY' "${env_tmp}/parser.err"
rm -rf "$env_tmp"

unsafe_output="$(php "$plugin_dir/tests/config-endpoint.php" unsafe-noauth)"
grep -Fq 'Disabling HTTP auth on a non-loopback bind' <<<"$unsafe_output"
oauth_output="$(php "$plugin_dir/tests/config-endpoint.php" incomplete-oauth)"
grep -Fq 'UNRAID_RMCP_PUBLIC_URL must use https:' <<<"$oauth_output"
api_key_output="$(php "$plugin_dir/tests/config-endpoint.php" missing-api-key)"
grep -Fq 'UNRAID_API_KEY is required before the service can start' <<<"$api_key_output"

# Sourcing the environment must select the exact persistent directory without
# creating /mnt/user paths merely for status/stop operations.
appdata=/mnt/user/appdata/unraid-mcp
existed=false
[ -e "$appdata" ] && existed=true
(
    unset UNRAID_HOME HOME
    # shellcheck source=/dev/null
    source "$env_script"
    test "$UNRAID_HOME" = "$appdata"
    unraid_mcp_is_true yes
    unraid_mcp_is_true 1
    unraid_mcp_is_false no
    unraid_mcp_is_false 0
)
if [ "$existed" = false ]; then
    test ! -e "$appdata" || { echo "env script created appdata while the array was unavailable" >&2; exit 1; }
fi

# Unraid represents an exclusive appdata share as a symlink directly into its
# pool. Both startup and updater must accept that exact shape while rejecting
# arbitrary, nested, dangling, and /mnt/user targets.
test_appdata_share_validator() {
    local script="$1" fixture share
    fixture="$(mktemp -d)"
    mkdir -p "${fixture}/user" "${fixture}/cache/appdata" \
        "${fixture}/cache/nested/appdata" "${fixture}/user0/appdata"
    share="${fixture}/user/appdata"

    eval "$(sed -n '/^appdata_share_safe() {/,/^}/p' "${script}")"
    ln -s ../cache/appdata "${share}"
    appdata_share_safe "${share}" "${fixture}"

    rm "${share}"
    ln -s ../cache/nested/appdata "${share}"
    if appdata_share_safe "${share}" "${fixture}"; then
        echo "nested pool path was accepted as an exclusive share" >&2
        return 1
    fi
    rm "${share}"
    ln -s ../user0/appdata "${share}"
    if appdata_share_safe "${share}" "${fixture}"; then
        echo "user0 path was accepted as an exclusive share" >&2
        return 1
    fi
    rm "${share}"
    ln -s /etc "${share}"
    if appdata_share_safe "${share}" "${fixture}"; then
        echo "host path was accepted as an exclusive share" >&2
        return 1
    fi
    rm "${share}"
    ln -s ../missing/appdata "${share}"
    if appdata_share_safe "${share}" "${fixture}"; then
        echo "dangling path was accepted as an exclusive share" >&2
        return 1
    fi
    rm -rf "${fixture}"
}
test_appdata_share_validator "$rc_script"
test_appdata_share_validator "$update_script"

# The rc script must apply an appdata override consistently, rather than only
# exporting it as UNRAID_HOME while continuing to prepare the hardcoded path.
grep -Fq 'APPDATA_DIR="${UNRAID_MCP_APPDATA_DIR}"' "$rc_script"

# CI runners have no Unraid FUSE mount. In that state update/reset must fail
# closed rather than constructing a convincing /mnt/user tree in RAM.
if ! grep -qsE '[[:space:]]/mnt/user[[:space:]]' /proc/mounts; then
    if "$update_script" reset >/tmp/unraid-mcp-reset.out 2>/tmp/unraid-mcp-reset.err; then
        echo "reset unexpectedly succeeded without /mnt/user mounted" >&2
        exit 1
    fi
    grep -Fq '/mnt/user is not mounted' /tmp/unraid-mcp-reset.err
    rm -f /tmp/unraid-mcp-reset.out /tmp/unraid-mcp-reset.err
fi

# The Python server overloaded UNRAID_VERIFY_SSL as boolean OR CA bundle path.
# A readable path must migrate onto runraid's UNRAID_API_CA_BUNDLE; a boolean must
# not, and an unreadable path must not invent a bundle.
ca_tmp="$(mktemp -d)"
mkdir -p "${ca_tmp}/appdata"
printf '%s\n' '-----BEGIN CERTIFICATE-----' > "${ca_tmp}/ca.pem"
run_env_case() {
    # $1 = UNRAID_VERIFY_SSL value; echoes the resulting UNRAID_API_CA_BUNDLE
    printf "UNRAID_VERIFY_SSL='%s'\n" "$1" >"${ca_tmp}/.env"
    (
        unset UNRAID_API_CA_BUNDLE UNRAID_VERIFY_SSL UNRAID_MCP_ENV_FILE
        unset UNRAID_MCP_CONFIG_DIR UNRAID_MCP_APPDATA_DIR
        export UNRAID_MCP_CONFIG_DIR="${ca_tmp}"
        export UNRAID_MCP_APPDATA_DIR="${ca_tmp}/appdata"
        # shellcheck source=/dev/null
        source "$env_script" >/dev/null 2>&1
        printf '%s' "${UNRAID_API_CA_BUNDLE:-}"
    )
}
test "$(run_env_case "${ca_tmp}/ca.pem")" = "${ca_tmp}/ca.pem"
test -z "$(run_env_case true)"
test -z "$(run_env_case false)"
test -z "$(run_env_case /nonexistent/ca.pem)"
rm -rf "$ca_tmp"

# An unmappable legacy value must be reported, not silently dropped.
grep -Fq 'warn_legacy_ca_bundle' "$rc_script"
grep -Fq 'UNRAID_API_CA_BUNDLE' "$plugin_dir/source/usr/local/emhttp/plugins/unraid-mcp/include/config.php"
grep -Fq 'UNRAID_API_CA_BUNDLE' "$plugin_dir/web/src/fields.ts"

# The co-uploaded .sha256 only proves transit integrity; provenance must be
# checked against GitHub's attestation store before a binary is installed.
grep -Fq 'verify_attestation' "$update_script"
grep -Fq 'attestations/sha256:' "$update_script"
grep -Fq 'verify_attestation "${actual}" || exit 1' "$update_script"

grep -Fq "curl -fsS --noproxy '*' --max-time 2" "$rc_script"
grep -Fq 'TAILSCALE_PORT_FILE=' "$rc_script"
grep -Fq 'validate_required_config || return 1' "$rc_script"
grep -Fq 'process_is_runraid_server' "$plugin_dir/source/usr/local/emhttp/plugins/unraid-mcp/include/config.php"
grep -Fq 'runraid +serve' "$nchan_script"
grep -Fq 'unraid-mcp-widget.js' "$verifier"
grep -Fq 'nchan/unraid_mcp' "$verifier"
grep -Fq 'stage-update) do_update' "$update_script"
grep -Fq 'update) do_update "${2:-}"; do_commit' "$update_script"
grep -Fq 'rollback) do_rollback' "$update_script"
grep -Fq "command_result(\$updateCommand . ' rollback')" "$plugin_dir/source/usr/local/emhttp/plugins/unraid-mcp/include/config.php"
grep -Fq 'objdump -T' "$verifier"
grep -Fq 'JSON_HEX_TAG' "$plugin_dir/source/usr/local/emhttp/plugins/unraid-mcp/UnraidMCP.page"
grep -Fq 'REVEALABLE_SECRET_KEYS' "$plugin_dir/source/usr/local/emhttp/plugins/unraid-mcp/include/config.php"

echo 'Unraid MCP runtime contract tests passed'
