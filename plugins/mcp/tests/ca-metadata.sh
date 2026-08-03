#!/bin/bash
set -euo pipefail

plugin_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
repo_dir="$(cd "$plugin_dir/../.." && pwd)"
profile="$repo_dir/ca_profile.xml"
wrapper="$plugin_dir/ca/unraid-mcp.xml"
manifest="$plugin_dir/unraid-mcp.plg"
icon="$plugin_dir/source/usr/local/emhttp/plugins/unraid-mcp/unraid-mcp.png"
updater="$plugin_dir/source/usr/local/emhttp/plugins/unraid-mcp/scripts/unraid-mcp-update.sh"

for path in "$repo_dir/LICENSE" "$profile" "$wrapper" "$manifest" "$icon" "$updater"; do
  [[ -s "$path" ]] || { echo "missing Unraid MCP CA publication file: $path" >&2; exit 1; }
done

xmllint --noout "$profile" "$wrapper" "$manifest"
grep -Fq '<Profile>' "$profile"
grep -Fq '<Name>Unraid MCP</Name>' "$wrapper"
grep -Fq '<PluginURL>https://github.com/dinglebear-ai/unraid/releases/latest/download/unraid-mcp.plg</PluginURL>' "$wrapper"
grep -Fq '<Category>Tools:Utilities</Category>' "$wrapper"
grep -Fq '<Support>https://github.com/dinglebear-ai/unraid/issues</Support>' "$wrapper"
grep -Fq 'https://github.com/dinglebear-ai/unraid/releases/download/vVERSION_PLACEHOLDER/' "$manifest"
grep -Fq 'pluginURL="https://github.com/dinglebear-ai/unraid/releases/latest/download/unraid-mcp.plg"' "$manifest"
grep -Fq 'support="https://github.com/dinglebear-ai/unraid/issues"' "$manifest"
grep -Fq 'REPO="dinglebear-ai/unraid"' "$updater"
grep -Fq '/releases?per_page=100' "$updater"
grep -Fq "grep -E '^v[0-9]+\\.[0-9]+\\.[0-9]+$'" "$updater"

if grep -R -Fq 'dinglebear-ai/unraid-mcp' "$wrapper" "$manifest" "$plugin_dir/README.md" "$updater"; then
  echo 'stale standalone Unraid MCP repository reference remains' >&2
  exit 1
fi

echo 'Unraid MCP Community Applications metadata tests passed'
