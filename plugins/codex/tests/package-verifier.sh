#!/bin/bash
set -euo pipefail

plugin_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
verifier="$plugin_dir/scripts/verify-package.sh"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
mkdir -p "$tmp/source"
printf 'not a real plugin package
' >"$tmp/source/member"
package="$tmp/unraid-codex-20260802.001-x86_64-34.txz"
tar --owner=1000 --group=1000 --numeric-owner -cJf "$package" -C "$tmp/source" .

if output="$($verifier "$package" 20260802.001 34 2>&1)"; then
  echo 'non-root archive ownership unexpectedly passed verification' >&2
  exit 1
fi
grep -Fq 'package contains non-root archive ownership' <<<"$output"

echo 'Codex package verifier regression tests passed'
