#!/bin/bash
set -euo pipefail

plugin_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
repo_dir="$(cd "$plugin_dir/../.." && pwd)"
profile="$repo_dir/ca_profile.xml"
wrapper="$plugin_dir/ca/incus.xml"
manifest="$plugin_dir/incus.plg"
icon="$plugin_dir/icon.svg"

for path in "$repo_dir/LICENSE" "$profile" "$wrapper" "$manifest" "$icon"; do
  [[ -s "$path" ]] || { echo "missing Incus CA publication file: $path" >&2; exit 1; }
done

xmllint --noout "$profile" "$wrapper" "$manifest"
grep -Fq '<Profile>' "$profile"
grep -Fq '<Name>Incus Dev Containers</Name>' "$wrapper"
grep -Fq '<PluginURL>https://raw.githubusercontent.com/dinglebear-ai/unraid/main/plugins/incus/incus.plg</PluginURL>' "$wrapper"
grep -Fq '<Category>Tools:System</Category>' "$wrapper"
grep -Fq '<Support>https://github.com/dinglebear-ai/unraid/issues</Support>' "$wrapper"
grep -Fq '<!ENTITY gitURL    "https://raw.githubusercontent.com/dinglebear-ai/unraid/main/plugins/incus">' "$manifest"
grep -Fq '<!ENTITY txzURL    "https://github.com/dinglebear-ai/unraid/releases/download/incus-v&version;/&txz;">' "$manifest"
grep -Fq 'support="https://github.com/dinglebear-ai/unraid/issues"' "$manifest"

if [[ -e "$plugin_dir/ca_profile.xml" ]]; then
  echo 'Incus repository profile must live only at repository root' >&2
  exit 1
fi
if grep -R -Eq 'dinglebear-ai/(incus-unraid|unraid-mcp)' "$wrapper" "$manifest" "$plugin_dir/README.md"; then
  echo 'stale standalone Incus repository reference remains' >&2
  exit 1
fi

echo 'Incus Community Applications metadata tests passed'
