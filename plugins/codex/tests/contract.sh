#!/usr/bin/env bash
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
  "${source_dir}/container/workspace-CLAUDE.md"; do
  [[ "$(stat -c '%a' "$path")" == "644" ]] || {
    echo "web/config source must be mode 0644: $path" >&2
    exit 1
  }
done

node --check "${source_dir}/web/unraid-codex.js"
node --check "${plugin_dir}/tests/appserver-smoke.cjs"
node --check "${plugin_dir}/tests/appserver-device-login.cjs"
bash -n \
  "${source_dir}/scripts/start-appserver.sh" \
  "${source_dir}/scripts/stop-appserver.sh" \
  "${source_dir}/scripts/configure-nginx.sh" \
  "${source_dir}/event/disks_mounted" \
  "${source_dir}/event/unmounting_disks"

grep -Fq 'Menu="Buttons:' "${source_dir}/CodexButton.page"
grep -Fq 'Menu="Utilities"' "${source_dir}/CodexSettings.page"
grep -Fq 'Icon="codex.png"' "${source_dir}/CodexSettings.page"
grep -Fq 'window.UnraidCodex?.openSettings()' "${source_dir}/CodexSettings.page"
file "${source_dir}/codex.png" | grep -Fq 'PNG image data, 128 x 128, 8-bit/color RGBA'
grep -Fq '<URL>&txzURL;</URL>' "${plugin_dir}/unraid-codex.plg"
grep -Fq 'attachShadow({ mode: "open" })' "${web_src}/main.tsx"
grep -Fq 'openSettings: () => void' "${web_src}/main.tsx"
grep -Fq 'unraid-codex:open-settings' "${web_src}/App.tsx"
grep -Fq 'thread/resume' "${web_src}/protocol.ts"
grep -Fq 'item/agentMessage/delta' "${web_src}/protocol.ts"
grep -Fq 'account/login/start' "${web_src}/protocol.ts"
grep -Fq 'mcpServerOpenaiFormElicitation: true' "${web_src}/protocol.ts"
grep -Fq 'mcpServer/elicitation/request' "${web_src}/renderers.tsx"
grep -Fq 'item/permissions/requestApproval' "${web_src}/renderers.tsx"
grep -Fq 'mcp_elicitations: true' "${web_src}/protocol.ts"
grep -Fq 'aurora-btn' "${source_dir}/web/unraid-codex.css"
grep -Fq 'proxy_set_header Sec-WebSocket-Extensions "";' "${source_dir}/scripts/configure-nginx.sh"
if grep -E '^[[:space:]]*incus[[:space:]]' \
  "${source_dir}/scripts/start-appserver.sh" \
  "${source_dir}/scripts/stop-appserver.sh" | grep -v 'incus </dev/null'; then
  echo "every bare incus invocation must redirect stdin from /dev/null" >&2
  exit 1
fi
grep -Fq 'unix:///run/unraid-codex/appserver.sock' "${source_dir}/container/codex-appserver.service"
grep -Fq 'bearer_token_env_var = "UNRAID_MCP_TOKEN"' "${source_dir}/container/codex-config.toml"
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
