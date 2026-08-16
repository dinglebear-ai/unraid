#!/bin/bash
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "usage: $0 <generated-manifest.plg> <package.txz>" >&2
  exit 2
fi

manifest="$(realpath "$1")"
archive="$(realpath "$2")"
[[ -s "$manifest" ]] || { echo "missing generated manifest: $manifest" >&2; exit 1; }
[[ -s "$archive" ]] || { echo "missing package: $archive" >&2; exit 1; }

entity() {
  local name="$1"
  sed -n 's/.*<!ENTITY[[:space:]]*'"$name"'[[:space:]]*"\([^"]*\)".*/\1/p' "$manifest"
}

xmllint --noout "$manifest"
version="$(entity version)"
txz="$(entity txz)"
md5="$(entity md5)"
sha256="$(entity sha256)"
txz_url="$(entity txzURL)"
for value in "$version" "$txz" "$md5" "$sha256" "$txz_url"; do
  [[ -n "$value" && "$value" != *PLACEHOLDER* ]] || { echo "generated manifest contains an unresolved value" >&2; exit 1; }
done
# The plugin version is the fixed-width epoch-3 mapping of the rust semver
# embedded in the txzURL release tag (see scripts/plugin-version.sh).
[[ "$version" =~ ^3\.[0-9]{3}\.[0-9]{3}\.[0-9]{3}$ ]] || { echo "manifest version '$version' is not a fixed-width epoch-3 plugin version" >&2; exit 1; }
rust_version="$(sed -n 's|.*/releases/download/unraid-rs-v\([0-9][0-9.]*\)/.*|\1|p' <<<"$txz_url")"
[[ -n "$rust_version" ]] || { echo "could not parse the unraid-rs-v release tag from txzURL: $txz_url" >&2; exit 1; }
expected_plugin_version="$("$(dirname "${BASH_SOURCE[0]}")/plugin-version.sh" "$rust_version")"
[[ "$version" == "$expected_plugin_version" ]] || { echo "manifest version $version does not match plugin-version.sh mapping of runraid $rust_version ($expected_plugin_version)" >&2; exit 1; }
[[ "$(basename "$archive")" == "$txz" ]] || { echo "package filename does not match manifest: $(basename "$archive") != $txz" >&2; exit 1; }
[[ "$md5" =~ ^[0-9a-f]{32}$ ]] || { echo "invalid manifest MD5" >&2; exit 1; }
[[ "$sha256" =~ ^[0-9a-f]{64}$ ]] || { echo "invalid manifest SHA-256" >&2; exit 1; }
grep -Fq "https://github.com/dinglebear-ai/unraid/releases/download/unraid-rs-v${rust_version}/" "$manifest"
grep -Fq 'pluginURL="https://github.com/dinglebear-ai/unraid/releases/download/unraid-plugin-latest/unraid-mcp.plg"' "$manifest"
grep -Fq 'support="https://github.com/dinglebear-ai/unraid/issues"' "$manifest"
printf '%s  %s\n' "$md5" "$archive" | md5sum -c -
printf '%s  %s\n' "$sha256" "$archive" | sha256sum -c -

list="$(mktemp)"
tree="$(mktemp -d)"
trap 'rm -f "$list"; rm -rf "$tree"' EXIT
tar -tJf "$archive" > "$list"
if grep -Eq '(^/|(^|/)\.\.(/|$))' "$list"; then
  echo "package contains an absolute or traversal path" >&2
  exit 1
fi
if tar -tvJf "$archive" | awk '$1 ~ /^[lh]/ { print $NF; found=1 } END { exit !found }' | grep -q .; then
  echo "package contains a symbolic or hard link; links are forbidden in the root-owned payload" >&2
  exit 1
fi
tar -xJf "$archive" -C "$tree"

bad_owner="$(tar --numeric-owner -tvJf "$archive" | awk '$2 != "0/0" { print $NF; exit }')"
[[ -z "$bad_owner" ]] || { echo "package contains non-root ownership: $bad_owner" >&2; exit 1; }
bad_mode="$(tar -tvJf "$archive" | awk '$1 ~ /^[-d]/ && (substr($1,6,1) == "w" || substr($1,9,1) == "w") { print $NF; exit }')"
[[ -z "$bad_mode" ]] || { echo "package contains group/other-writable entry: $bad_mode" >&2; exit 1; }

required=(
  install/slack-desc
  usr/local/emhttp/plugins/unraid-mcp/UnraidMCP.page
  usr/local/emhttp/plugins/unraid-mcp/UnraidMCPDashboard.page
  usr/local/emhttp/plugins/unraid-mcp/include/config.php
  usr/local/emhttp/plugins/unraid-mcp/scripts/rc.unraid-mcp
  usr/local/emhttp/plugins/unraid-mcp/scripts/unraid-mcp-env.sh
  usr/local/emhttp/plugins/unraid-mcp/scripts/unraid-mcp-paths.sh
  usr/local/emhttp/plugins/unraid-mcp/scripts/unraid-mcp-update.sh
  usr/local/emhttp/plugins/unraid-mcp/event/disks_mounted
  usr/local/emhttp/plugins/unraid-mcp/event/unmounting_disks
  usr/local/emhttp/plugins/unraid-mcp/nchan/unraid_mcp
  usr/local/emhttp/plugins/unraid-mcp/web/unraid-mcp-settings.js
  usr/local/emhttp/plugins/unraid-mcp/web/unraid-mcp-settings.css
  usr/local/emhttp/plugins/unraid-mcp/web/unraid-mcp-widget.js
  usr/local/emhttp/plugins/unraid-mcp/unraid-mcp.png
  usr/local/unraid-mcp/bin/runraid
)
for path in "${required[@]}"; do
  grep -Fxq "$path" "$list" || { echo "package missing required member: $path" >&2; exit 1; }
done
for path in usr/local/emhttp/plugins/unraid-mcp/scripts/rc.unraid-mcp usr/local/emhttp/plugins/unraid-mcp/scripts/unraid-mcp-env.sh usr/local/emhttp/plugins/unraid-mcp/scripts/unraid-mcp-paths.sh usr/local/emhttp/plugins/unraid-mcp/scripts/unraid-mcp-update.sh usr/local/emhttp/plugins/unraid-mcp/event/disks_mounted usr/local/emhttp/plugins/unraid-mcp/event/unmounting_disks usr/local/emhttp/plugins/unraid-mcp/nchan/unraid_mcp usr/local/unraid-mcp/bin/runraid; do
  [[ -x "$tree/$path" ]] || { echo "required package executable lacks execute mode: $path" >&2; exit 1; }
done

if find "$tree" -type f \( -name .env -o -name unraid-mcp.cfg \) -print -quit | grep -q .; then
  echo "package must not contain persisted Unraid MCP configuration or secrets" >&2
  exit 1
fi
if [[ -e "$tree/usr/local/unraid-mcp/python" ]]; then
  echo "package unexpectedly contains the retired Python runtime" >&2
  exit 1
fi

binary="$tree/usr/local/unraid-mcp/bin/runraid"
file "$binary" | grep -Eq 'ELF 64-bit.*x86-64' || { echo "runraid is not an x86-64 ELF binary" >&2; exit 1; }
actual_version="$("$binary" --version)"
[[ "$actual_version" == "unraid-rmcp $rust_version" ]] || { echo "bundled runraid version differs: $actual_version != unraid-rmcp $rust_version" >&2; exit 1; }

# Unraid 7.0.0 (the manifest minimum) ships glibc 2.40. Reject a binary that
# imports a newer symbol version, otherwise installation succeeds but the
# service fails immediately with an opaque loader error on supported systems.
command -v objdump >/dev/null 2>&1 || { echo "objdump is required to verify glibc compatibility" >&2; exit 1; }
max_glibc="$(objdump -T "$binary" | sed -n 's/.*(GLIBC_\([0-9][0-9.]*\)).*/\1/p' | sort -V | tail -n1)"
[[ -n "$max_glibc" ]] || { echo "could not determine runraid glibc requirements" >&2; exit 1; }
min_unraid_glibc="2.40"
if [[ "$(printf '%s\n%s\n' "$max_glibc" "$min_unraid_glibc" | sort -V | tail -n1)" != "$min_unraid_glibc" ]]; then
  echo "runraid requires glibc $max_glibc, newer than Unraid 7.0.0 glibc $min_unraid_glibc" >&2
  exit 1
fi

echo "Unraid MCP package verification passed"
echo "version=$version"
echo "runraid=$rust_version"
echo "glibc_required=$max_glibc"
echo "package=$archive"
echo "md5=$md5"
echo "sha256=$sha256"
