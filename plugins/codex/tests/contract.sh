#!/usr/bin/env bash
# Contract checks intentionally search for literal shell expressions and source a generated path.
# shellcheck disable=SC1091,SC2016
set -euo pipefail

plugin_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source_dir="${plugin_dir}/source/usr/local/emhttp/plugins/unraid-codex"
web_src="${plugin_dir}/web-src/src"

required=(
  "${source_dir}/CodexButton.page"
  "${source_dir}/CodexSettings.page"
  "${source_dir}/codex.png"
  "${source_dir}/codex-icon.svg"
  "${source_dir}/web/unraid-codex.css"
  "${source_dir}/web/unraid-codex.js"
  "${source_dir}/scripts/start-appserver.sh"
  "${source_dir}/scripts/stop-appserver.sh"
  "${source_dir}/scripts/configure-nginx.sh"
  "${source_dir}/scripts/backup-state.sh"
  "${source_dir}/scripts/restore-state.sh"
  "${source_dir}/scripts/configure-schedule.sh"
  "${source_dir}/scripts/ensure-state-volume.sh"
  "${source_dir}/scripts/verify-codex-cli.sh"
  "${source_dir}/scripts/provision-container.sh"
  "${source_dir}/scripts/update-codex-cli.sh"
  "${source_dir}/scripts/appserver-smoke.py"
  "${source_dir}/container/codex-maintenance.py"
  "${source_dir}/container/install-codex-cli.sh"
  "${source_dir}/event/disks_mounted"
  "${source_dir}/event/unmounting_disks"
  "${source_dir}/container/codex-appserver.service"
  "${source_dir}/container/codex-config.toml"
  "${source_dir}/container/workspace-CLAUDE.md"
)

for path in "${required[@]}"; do
  [[ -f "$path" ]] || {
    echo "missing required plugin file: $path" >&2
    exit 1
  }
done

for path in \
  "${source_dir}/scripts/start-appserver.sh" \
  "${source_dir}/scripts/stop-appserver.sh" \
  "${source_dir}/scripts/configure-nginx.sh" \
  "${source_dir}/scripts/backup-state.sh" \
  "${source_dir}/scripts/restore-state.sh" \
  "${source_dir}/scripts/configure-schedule.sh" \
  "${source_dir}/scripts/ensure-state-volume.sh" \
  "${source_dir}/scripts/verify-codex-cli.sh" \
  "${source_dir}/scripts/provision-container.sh" \
  "${source_dir}/scripts/update-codex-cli.sh" \
  "${source_dir}/container/install-codex-cli.sh" \
  "${source_dir}/event/disks_mounted" \
  "${source_dir}/event/unmounting_disks"; do
  [[ -x "$path" ]] || {
    echo "required plugin executable is not executable: $path" >&2
    exit 1
  }
done

for path in \
  "${source_dir}/CodexButton.page" \
  "${source_dir}/CodexSettings.page" \
  "${source_dir}/codex.png" \
  "${source_dir}/codex-icon.svg" \
  "${source_dir}/web/unraid-codex.css" \
  "${source_dir}/web/unraid-codex.js" \
  "${source_dir}/container/codex-appserver.service" \
  "${source_dir}/container/codex-config.toml" \
  "${source_dir}/container/workspace-CLAUDE.md" \
  "${source_dir}/container/codex-maintenance.py" \
  "${source_dir}/scripts/appserver-smoke.py"; do
  [[ "$(stat -c '%a' "$path")" == "644" ]] || {
    echo "web/config source must be mode 0644: $path" >&2
    exit 1
  }
done

php -l "${source_dir}/CodexButton.page" >/dev/null
php -l "${source_dir}/CodexSettings.page" >/dev/null
node --check "${source_dir}/web/unraid-codex.js"
node --check "${plugin_dir}/tests/aurora-contract.cjs"
node --check "${plugin_dir}/tests/appserver-smoke.cjs"
node --check "${plugin_dir}/tests/appserver-device-login.cjs"
node --check "${plugin_dir}/tests/settings-page.cjs"
bash -n \
  "${source_dir}/scripts/start-appserver.sh" \
  "${source_dir}/scripts/stop-appserver.sh" \
  "${source_dir}/scripts/configure-nginx.sh" \
  "${source_dir}/scripts/backup-state.sh" \
  "${source_dir}/scripts/restore-state.sh" \
  "${source_dir}/scripts/configure-schedule.sh" \
  "${source_dir}/scripts/ensure-state-volume.sh" \
  "${source_dir}/scripts/verify-codex-cli.sh" \
  "${source_dir}/scripts/provision-container.sh" \
  "${source_dir}/scripts/update-codex-cli.sh" \
  "${source_dir}/container/install-codex-cli.sh" \
  "${source_dir}/event/disks_mounted" \
  "${source_dir}/event/unmounting_disks"
python3 -c 'import pathlib, sys; path = pathlib.Path(sys.argv[1]); compile(path.read_text(), str(path), "exec")' "${source_dir}/container/codex-maintenance.py"
python3 -c 'import pathlib, sys; path = pathlib.Path(sys.argv[1]); compile(path.read_text(), str(path), "exec")' "${source_dir}/scripts/appserver-smoke.py"

grep -Fq 'Menu="Buttons:' "${source_dir}/CodexButton.page"
grep -Fq 'Menu="Utilities"' "${source_dir}/CodexSettings.page"
grep -Fq 'Icon="codex.png"' "${source_dir}/CodexSettings.page"
grep -Fq 'window.UnraidCodex?.openSettings()' "${source_dir}/CodexSettings.page"
grep -Fq 'role="status" aria-live="polite"' "${source_dir}/CodexSettings.page"
grep -Fq 'unraid-codex-state-pre-restore-*' "${plugin_dir}/README.md"
node "${plugin_dir}/tests/settings-page.cjs" "${source_dir}/CodexSettings.page"
file "${source_dir}/codex.png" | grep -Fq 'PNG image data, 128 x 128, 8-bit/color RGBA'
grep -Fq '<URL>&txzURL;</URL>' "${plugin_dir}/unraid-codex.plg"
grep -Fq 'min="7.0.0"' "${plugin_dir}/unraid-codex.plg"
grep -Fq 'Unraid OS 7.0.0 as the minimum supported release' "${plugin_dir}/README.md"
grep -Fq 'Partial proxy and schedule state was cleaned up' "${plugin_dir}/unraid-codex.plg"
grep -Fq 'rm -f /etc/cron.d/unraid-codex /var/run/unraid-codex-appserver.sock' "${plugin_dir}/unraid-codex.plg"
grep -Fq 'incus &lt;/dev/null storage show "$CODEX_POOL"' "${plugin_dir}/unraid-codex.plg"
grep -Fq 'incus &lt;/dev/null profile show "$CODEX_PROFILE"' "${plugin_dir}/unraid-codex.plg"
grep -Fq 'attachShadow({ mode: "open" })' "${web_src}/main.tsx"
grep -Fq 'openSettings: () => void' "${web_src}/main.tsx"
grep -Fq 'return event.code === value' "${web_src}/shortcut.ts"
grep -Fq 'isEditableShortcutTarget(event.target)' "${web_src}/main.tsx"
grep -Fq '__unraidCodexShortcutHandler' "${web_src}/main.tsx"
grep -Fq 'aria-keyshortcuts={codexShortcutAria(shortcut)}' "${web_src}/App.tsx"
grep -Fq 'codexShortcutLabel(shortcut)' "${web_src}/App.tsx"
grep -Fq 'unraid-codex:open-settings' "${web_src}/App.tsx"
grep -Fq 'thread/resume' "${web_src}/protocol.ts"
grep -Fq 'item/agentMessage/delta' "${web_src}/protocol.ts"
grep -Fq 'account/login/start' "${web_src}/protocol.ts"
grep -Fq 'mcpServerOpenaiFormElicitation: true' "${web_src}/protocol.ts"
grep -Fq 'mcpServer/elicitation/request' "${web_src}/renderers.tsx"
grep -Fq 'item/permissions/requestApproval' "${web_src}/renderers.tsx"
grep -Fq 'mcp_elicitations: true' "${web_src}/protocol.ts"
grep -Fq 'aurora-btn' "${source_dir}/web/unraid-codex.css"
node "${plugin_dir}/tests/aurora-contract.cjs" "${web_src}"
grep -Fq 'proxy_set_header Sec-WebSocket-Extensions "";' "${source_dir}/scripts/configure-nginx.sh"
if grep -E '^[[:space:]]*incus[[:space:]]' \
  "${source_dir}/scripts/start-appserver.sh" \
  "${source_dir}/scripts/stop-appserver.sh" | grep -v 'incus </dev/null'; then
  echo "every bare incus invocation must redirect stdin from /dev/null" >&2
  exit 1
fi
grep -Fq 'unix:///mnt/unraid-codex/appserver.sock' "${source_dir}/container/codex-appserver.service"
grep -Fq 'url = "__UNRAID_MCP_URL__"' "${source_dir}/container/codex-config.toml"
grep -Fq 'bearer_token_env_var = "UNRAID_MCP_TOKEN"' "${source_dir}/container/codex-config.toml"
grep -Fq 'allow_login_shell = false' "${source_dir}/container/codex-config.toml"
grep -Fq 'shell_snapshot = false' "${source_dir}/container/codex-config.toml"
grep -Fq 'inherit = "all"' "${source_dir}/container/codex-config.toml"
grep -Fq 'exclude = ["UNRAID_MCP_TOKEN"]' "${source_dir}/container/codex-config.toml"
grep -Fq 'UNRAID_MCP_URL' "${source_dir}/scripts/start-appserver.sh"
grep -Fq 'UNRAID_MCP_PROXY_HOST' "${source_dir}/scripts/start-appserver.sh"
grep -Fq '# unraid-codex-mcp' "${source_dir}/scripts/start-appserver.sh"
grep -Fq 'systemctl restart codex-appserver.service' "${source_dir}/scripts/start-appserver.sh"
grep -Fq 'INCUS_START_HELPER=/usr/local/emhttp/plugins/incus/scripts/start-instance.sh' "${source_dir}/scripts/start-appserver.sh"
grep -Fq '"$INCUS_START_HELPER" "$CONTAINER"' "${source_dir}/scripts/start-appserver.sh"
grep -Fq 'App-server service started but $SOCKET_PATH did not become ready' "${source_dir}/scripts/start-appserver.sh"
grep -Fq 'ENSURE_STATE=/usr/local/emhttp/plugins/unraid-codex/scripts/ensure-state-volume.sh' "${source_dir}/scripts/start-appserver.sh"
grep -Fq 'PROVISION_CONTAINER=/usr/local/emhttp/plugins/unraid-codex/scripts/provision-container.sh' "${source_dir}/scripts/start-appserver.sh"
grep -Fq '"$PROVISION_CONTAINER"' "${source_dir}/scripts/start-appserver.sh"
grep -Fq 'storage volume create "$POOL" "$VOLUME" security.shifted=true' "${source_dir}/scripts/ensure-state-volume.sh"
grep -Fq 'storage volume snapshot create' "${source_dir}/scripts/backup-state.sh"
grep -Fq 'openssl enc -aes-256-cbc -pbkdf2' "${source_dir}/scripts/backup-state.sh"
grep -Fq 'openssl dgst -sha256 -mac HMAC' "${source_dir}/scripts/backup-state.sh"
grep -Fq 'unraid-codex-maintenance.lock' "${source_dir}/scripts/backup-state.sh"
grep -Fq 'storage volume import' "${source_dir}/scripts/restore-state.sh"
grep -Fq 'openssl dgst -sha256 -mac HMAC' "${source_dir}/scripts/restore-state.sh"
grep -Fq 'backup HMAC verification failed' "${source_dir}/scripts/restore-state.sh"
if grep -Fq 'python3 - "$tmp"' "${source_dir}/scripts/backup-state.sh" \
  || grep -Fq 'python3 - "$BACKUP"' "${source_dir}/scripts/restore-state.sh"; then
  echo "host backup and restore integrity checks must not require Python" >&2
  exit 1
fi
grep -Fq 'pre-restore-$stamp' "${source_dir}/scripts/restore-state.sh"
grep -Fq 'Previous Codex state was restored successfully' "${source_dir}/scripts/restore-state.sh"
grep -Fq '/etc/cron.d/unraid-codex' "${source_dir}/scripts/configure-schedule.sh"
grep -Fq 'NoNewPrivileges=true' "${source_dir}/container/codex-appserver.service"
grep -Fq 'CapabilityBoundingSet=' "${source_dir}/container/codex-appserver.service"
grep -Fq 'InaccessiblePaths=/home/agent/.config/unraid-codex/env' "${source_dir}/container/codex-appserver.service"
grep -Fq 'verify-codex-cli.sh' "${source_dir}/container/codex-appserver.service"
grep -Fq 'unraid-codex.conf' "${source_dir}/scripts/configure-nginx.sh"
grep -Fq 'flock -w 60 9' "${source_dir}/scripts/configure-nginx.sh"
grep -Fq 'CODEX_SHORTCUT_OPTIONS' "${web_src}/shortcut.ts"
grep -Fq 'ConnectionDiagnostics' "${web_src}/App.tsx"
grep -Fq 'appServerLastOkAtMs' "${web_src}/protocol.ts"
python3 -c 'import pathlib, sys; path = pathlib.Path(sys.argv[1]); compile(path.read_text(), str(path), "exec")' "${source_dir}/container/codex-maintenance.py"
python3 -c 'import pathlib, sys; path = pathlib.Path(sys.argv[1]); compile(path.read_text(), str(path), "exec")' "${source_dir}/scripts/appserver-smoke.py"
grep -Fq 'find "$1" -mindepth 1 -maxdepth 1 -print -quit' "${source_dir}/scripts/ensure-state-volume.sh"
grep -Fq '/usr/local/emhttp/plugins/unraid-codex/scripts/backup-state.sh' "${source_dir}/scripts/configure-schedule.sh"
grep -Fq 'config device override "$CONTAINER" workspace' "${source_dir}/scripts/provision-container.sh"
grep -Fq 'Incus is not running' "${source_dir}/scripts/provision-container.sh"
grep -Fq 'https://api.github.com/repos/openai/codex/releases/latest' "${source_dir}/container/install-codex-cli.sh"
grep -Fq 'release asset is missing a valid SHA-256 digest' "${source_dir}/container/install-codex-cli.sh"
grep -Fq 'installation=updated' "${source_dir}/scripts/update-codex-cli.sh"
grep -Fq 'restoring previous binary' "${source_dir}/scripts/update-codex-cli.sh"
grep -Fq 'update-codex-cli.sh' "${source_dir}/scripts/configure-schedule.sh"
grep -Fq 'appserver_initialize=ok' "${source_dir}/scripts/appserver-smoke.py"
grep -Fq 'sha256sum -c -' "${source_dir}/container/install-codex-cli.sh"
if find "${source_dir}" -type f \( -name codex-version -o -name codex-release.env \) -print -quit | grep -q .; then
  echo "Codex release must not pin a CLI version" >&2
  exit 1
fi
test_output_dir="$(mktemp -d)"
test_names=(install-codex-cli update-codex-cli provision-container configure-nginx backup-restore-state package-verifier ca-metadata)
test_pids=()
for test_name in "${test_names[@]}"; do
  "${plugin_dir}/tests/$test_name.sh" >"$test_output_dir/$test_name.log" 2>&1 &
  test_pids+=("$!")
done
test_failed=0
for index in "${!test_pids[@]}"; do
  test_name="${test_names[$index]}"
  if ! wait "${test_pids[$index]}"; then
    test_failed=1
  fi
  cat "$test_output_dir/$test_name.log"
done
rm -rf "$test_output_dir"
[[ "$test_failed" -eq 0 ]]
if grep -R -F 'unraid.dinglebear.ai' "${source_dir}" >/dev/null; then
  echo "personal Unraid MCP URL must not be hardcoded in plugin source" >&2
  exit 1
fi
grep -Fq 'Treat every write, mutation, command execution' "${source_dir}/container/workspace-CLAUDE.md"
grep -Fq '/workspace/AGENTS.md' "${source_dir}/scripts/start-appserver.sh"
grep -Fq '/workspace/GEMINI.md' "${source_dir}/scripts/start-appserver.sh"

credential_prefix='tskey'
credential_suffix='-'
if grep -R -n "${credential_prefix}${credential_suffix}" \
  "${source_dir}" "${plugin_dir}/unraid-codex.plg" >/dev/null; then
  echo "Tailscale credential found in plugin source" >&2
  exit 1
fi

echo "unraid-codex contract checks passed"
