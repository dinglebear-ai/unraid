#!/bin/bash
# Replace the carried-forward lxcfs payload with one matched, checksummed pair.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
stage="${1:?usage: $0 PACKAGE_STAGE}"
lock="$ROOT/runtime-lock.json"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

url="$(jq -er '.lxcfs.url' "$lock")"
package_sha="$(jq -er '.lxcfs.packageSha256' "$lock")"
binary_sha="$(jq -er '.lxcfs.binarySha256' "$lock")"
module_sha="$(jq -er '.lxcfs.moduleSha256' "$lock")"
deb="$work/lxcfs.deb"
tree="$work/tree"

curl --fail --location --retry 3 --silent --show-error "$url" -o "$deb"
echo "$package_sha  $deb" | sha256sum -c -
mkdir -p "$tree"
dpkg-deb -x "$deb" "$tree"

echo "$binary_sha  $tree/usr/bin/lxcfs" | sha256sum -c -
echo "$module_sha  $tree/usr/lib/x86_64-linux-gnu/lxcfs/liblxcfs.so" | sha256sum -c -

install -D -m 0755 "$tree/usr/bin/lxcfs" "$stage/usr/local/incus/bin/lxcfs"
install -D -m 0644 \
  "$tree/usr/lib/x86_64-linux-gnu/lxcfs/liblxcfs.so" \
  "$stage/usr/lib/x86_64-linux-gnu/lxcfs/liblxcfs.so"
