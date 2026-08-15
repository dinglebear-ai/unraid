#!/bin/bash
set -euo pipefail

plugin_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
env_script="$plugin_dir/source/usr/local/emhttp/plugins/unraid-mcp/scripts/unraid-mcp-env.sh"
rc_script="$plugin_dir/source/usr/local/emhttp/plugins/unraid-mcp/scripts/rc.unraid-mcp"
update_script="$plugin_dir/source/usr/local/emhttp/plugins/unraid-mcp/scripts/unraid-mcp-update.sh"
paths_script="$plugin_dir/source/usr/local/emhttp/plugins/unraid-mcp/scripts/unraid-mcp-paths.sh"
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

# An override loaded from .env must update UNRAID_HOME after parsing, not leave
# the runtime using the pre-parse default while rc and the updater use another
# directory.
override_tmp="$(mktemp -d)"
printf "UNRAID_MCP_APPDATA_DIR='%s'\n" "${override_tmp}/custom" >"${override_tmp}/.env"
(
    unset UNRAID_HOME UNRAID_MCP_APPDATA_DIR UNRAID_MCP_ENV_FILE
    export UNRAID_MCP_CONFIG_DIR="${override_tmp}"
    # shellcheck source=/dev/null
    source "$env_script"
    test "$UNRAID_HOME" = "${override_tmp}/custom"
    test "$UNRAID_MCP_APPDATA_DIR" = "${override_tmp}/custom"
)
rm -rf "$override_tmp"

# Exercise the shared preparation boundary used by both rc.unraid-mcp and the
# updater. A configured named-pool target succeeds and creates the requested
# directories; unsafe targets fail before writing anything.
# shellcheck source=/dev/null
source "$paths_script"
test_persistent_path_preparation() {
    local fixture share appdata overlay mounts pools target
    fixture="$(mktemp -d)"
    mounts="${fixture}/mounts"
    pools="${fixture}/pools"
    mkdir -p "${fixture}/user" "${fixture}/cache/appdata" "${pools}"
    {
        printf 'shfs %s/user fuse.shfs rw 0 0\n' "${fixture}"
        printf '/dev/cache %s/cache btrfs rw 0 0\n' "${fixture}"
    } >"${mounts}"
    : >"${pools}/cache.cfg"
    share="${fixture}/user/appdata"
    appdata="${share}/unraid-mcp"
    overlay="${appdata}/bin"

    ln -s ../cache/appdata "${share}"
    unraid_mcp_prepare_persistent_paths \
        "${appdata}" "${overlay}" "${fixture}" "${pools}" "${mounts}"
    test -d "${appdata}"
    test -d "${overlay}"

    # Pool configuration alone is insufficient: an unavailable pool can leave
    # a stale directory in the RAM rootfs that must never receive appdata.
    rm -rf "${share}" "${fixture}/cache/appdata/unraid-mcp"
    ln -s ../cache/appdata "${share}"
    printf 'shfs %s/user fuse.shfs rw 0 0\n' "${fixture}" >"${mounts}"
    if unraid_mcp_prepare_persistent_paths \
        "${appdata}" "${overlay}" "${fixture}" "${pools}" "${mounts}" 2>/dev/null; then
        echo "configured but unmounted pool was accepted" >&2
        return 1
    fi
    test ! -e "${appdata}"
    printf '/dev/cache %s/cache btrfs rw 0 0\n' "${fixture}" >>"${mounts}"

    for target in \
        ../cache/nested/appdata \
        ../disk1/appdata \
        ../remotes/appdata \
        ../arbitrary/appdata \
        /etc \
        ../missing/appdata; do
        rm -rf "${share}" "${fixture}/cache/appdata/unraid-mcp"
        mkdir -p "${fixture}/cache/nested/appdata" \
            "${fixture}/disk1/appdata" "${fixture}/remotes/appdata" \
            "${fixture}/arbitrary/appdata"
        ln -s "${target}" "${share}"
        if unraid_mcp_prepare_persistent_paths \
            "${appdata}" "${overlay}" "${fixture}" "${pools}" "${mounts}" 2>/dev/null; then
            echo "unsafe appdata target was accepted: ${target}" >&2
            return 1
        fi
        test ! -e "${appdata}"
    done
    rm -rf "${fixture}"
}
test_persistent_path_preparation

# Both runtime entry points must use the shared boundary and the same override.
grep -Fq 'APPDATA_DIR="${UNRAID_MCP_APPDATA_DIR}"' "$rc_script"
grep -Fq 'APPDATA_DIR="${UNRAID_MCP_APPDATA_DIR}"' "$update_script"
grep -Fq 'unraid_mcp_prepare_persistent_paths' "$rc_script"
grep -Fq 'unraid_mcp_prepare_persistent_paths' "$update_script"

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
