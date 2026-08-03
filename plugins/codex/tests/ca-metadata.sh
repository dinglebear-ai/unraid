#!/bin/bash
set -euo pipefail

plugin_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
profile="$plugin_dir/ca/ca_profile.xml"
wrapper="$plugin_dir/ca/unraid-codex.xml"
xmllint --noout "$profile" "$wrapper"
grep -Fq '<Profile>' "$profile"
grep -Fq '<Name>Unraid Codex</Name>' "$wrapper"
grep -Fq '<PluginURL>https://raw.githubusercontent.com/dinglebear-ai/unraid-codex/main/unraid-codex.plg</PluginURL>' "$wrapper"
grep -Fq '<Category>Productivity: Tools:</Category>' "$wrapper"
grep -Fq '<Support>https://github.com/dinglebear-ai/unraid-codex/issues</Support>' "$wrapper"
grep -Fq 'Requires the Incus Dev Containers plugin' "$wrapper"

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
"$plugin_dir/scripts/export-ca-repository.sh" "$tmp/export" >/dev/null
for path in LICENSE README.md ca_profile.xml unraid-codex.xml unraid-codex.plg icon.svg; do
  [[ -s "$tmp/export/$path" ]] || { echo "missing CA export file: $path" >&2; exit 1; }
done
grep -Fq '<!ENTITY gitURL    "https://raw.githubusercontent.com/dinglebear-ai/unraid-codex/main">' "$tmp/export/unraid-codex.plg"
xmllint --noout "$tmp/export/ca_profile.xml" "$tmp/export/unraid-codex.xml" "$tmp/export/unraid-codex.plg"
echo 'Community Applications metadata tests passed'
