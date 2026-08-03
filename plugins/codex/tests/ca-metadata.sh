#!/bin/bash
set -euo pipefail

plugin_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
repo_dir="$(cd "$plugin_dir/../.." && pwd)"
profile="$repo_dir/ca_profile.xml"
wrapper="$plugin_dir/ca/unraid-codex.xml"
manifest="$plugin_dir/unraid-codex.plg"
icon="$plugin_dir/source/usr/local/emhttp/plugins/unraid-codex/codex-icon.svg"

for path in "$repo_dir/LICENSE" "$profile" "$wrapper" "$manifest" "$icon"; do
  [[ -s "$path" ]] || { echo "missing CA publication file: $path" >&2; exit 1; }
done

xmllint --noout "$profile" "$wrapper" "$manifest"
grep -Fq '<Profile>' "$profile"
grep -Fq '<WebPage>https://github.com/dinglebear-ai/unraid</WebPage>' "$profile"
grep -Fq '<Name>Unraid Codex</Name>' "$wrapper"
grep -Fq '<PluginURL>https://raw.githubusercontent.com/dinglebear-ai/unraid/main/plugins/codex/unraid-codex.plg</PluginURL>' "$wrapper"
grep -Fq '<Category>Productivity: Tools:</Category>' "$wrapper"
grep -Fq '<Support>https://github.com/dinglebear-ai/unraid/issues</Support>' "$wrapper"
grep -Fq 'Requires the Incus Dev Containers plugin' "$wrapper"
grep -Fq '<!ENTITY gitURL    "https://raw.githubusercontent.com/dinglebear-ai/unraid/main/plugins/codex">' "$manifest"
grep -Fq '<!ENTITY txzURL    "https://github.com/dinglebear-ai/unraid/releases/download/codex-v&version;/&txz;">' "$manifest"

if grep -R -Fq 'dinglebear-ai/unraid-codex' "$plugin_dir/ca" "$manifest" "$plugin_dir/README.md"; then
  echo 'standalone CA repository reference remains' >&2
  exit 1
fi

echo 'Community Applications metadata tests passed'
