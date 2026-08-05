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
