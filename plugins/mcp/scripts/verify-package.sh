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
for value in "$version" "$txz" "$md5" "$sha256"; do
  [[ -n "$value" && "$value" != *PLACEHOLDER* ]] || { echo "generated manifest contains an unresolved value" >&2; exit 1; }
done
[[ "$(basename "$archive")" == "$txz" ]] || { echo "package filename does not match manifest: $(basename "$archive") != $txz" >&2; exit 1; }
[[ "$md5" =~ ^[0-9a-f]{32}$ ]] || { echo "invalid manifest MD5" >&2; exit 1; }
[[ "$sha256" =~ ^[0-9a-f]{64}$ ]] || { echo "invalid manifest SHA-256" >&2; exit 1; }
grep -Fq "https://github.com/dinglebear-ai/unraid/releases/download/v${version}/" "$manifest"
grep -Fq 'pluginURL="https://github.com/dinglebear-ai/unraid/releases/latest/download/unraid-mcp.plg"' "$manifest"
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
  usr/local/emhttp/plugins/unraid-mcp/scripts/unraid-mcp-update.sh
  usr/local/emhttp/plugins/unraid-mcp/event/disks_mounted
  usr/local/emhttp/plugins/unraid-mcp/event/unmounting_disks
  usr/local/emhttp/plugins/unraid-mcp/web/unraid-mcp-settings.js
  usr/local/emhttp/plugins/unraid-mcp/web/unraid-mcp-settings.css
  usr/local/emhttp/plugins/unraid-mcp/unraid-mcp.png
  usr/local/unraid-mcp/python/bin/python3
)
for path in "${required[@]}"; do
  grep -Fxq "$path" "$list" || { echo "package missing required member: $path" >&2; exit 1; }
done
for path in usr/local/emhttp/plugins/unraid-mcp/scripts/rc.unraid-mcp usr/local/emhttp/plugins/unraid-mcp/scripts/unraid-mcp-env.sh usr/local/emhttp/plugins/unraid-mcp/scripts/unraid-mcp-update.sh usr/local/emhttp/plugins/unraid-mcp/event/disks_mounted usr/local/emhttp/plugins/unraid-mcp/event/unmounting_disks usr/local/unraid-mcp/python/bin/python3; do
  [[ -x "$tree/$path" ]] || { echo "required package executable lacks execute mode: $path" >&2; exit 1; }
done

if find "$tree" -type f \( -name .env -o -name unraid-mcp.cfg \) -print -quit | grep -q .; then
  echo "package must not contain persisted Unraid MCP configuration or secrets" >&2
  exit 1
fi
if find "$tree" -path '*/__pycache__/*' -o -name '*.py[co]' | grep -q .; then
  echo "package contains generated Python bytecode" >&2
  exit 1
fi
if find "$tree" -path '*.dist-info/direct_url.json' -print -quit | grep -q .; then
  echo "package contains build-host direct_url provenance" >&2
  exit 1
fi
python3 - "$tree/usr/local/unraid-mcp/python" <<'PY'
from pathlib import Path
import sys

prefix = Path(sys.argv[1])
expected = b"#!/usr/local/unraid-mcp/python/bin/python3"
for script in (prefix / "bin").iterdir():
    if script.is_symlink() or not script.is_file():
        continue
    first = script.read_bytes().splitlines()[:1]
    if first and first[0].startswith(b"#!") and b"python" in first[0] and first[0] != expected:
        raise SystemExit(f"noncanonical Python launcher shebang: {script.name}: {first[0].decode(errors='replace')}")
for record in prefix.glob("lib/python*/site-packages/*.dist-info/RECORD"):
    text = record.read_text(errors="replace")
    if "/tmp/" in text or "/home/runner/" in text or "/workspace/" in text:
        raise SystemExit(f"build-host path remains in wheel RECORD: {record}")
PY

python="$tree/usr/local/unraid-mcp/python/bin/python3"
actual_version="$(SOURCE_DATE_EPOCH=0 "$python" -c 'import importlib.metadata as m; print(m.version("unraid-mcp"))')"
[[ "$actual_version" == "$version" ]] || { echo "bundled unraid-mcp version differs: $actual_version != $version" >&2; exit 1; }
SOURCE_DATE_EPOCH=0 "$python" -c 'import unraid_mcp'

echo "Unraid MCP package verification passed"
echo "version=$version"
echo "package=$archive"
echo "md5=$md5"
echo "sha256=$sha256"
