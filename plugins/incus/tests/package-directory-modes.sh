#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

build_fixture() {
  local mask="$1"
  local fixture="$tmp/umask-$mask"
  local seed="$fixture/seed"
  local previous="$fixture/previous.txz"
  local output="$fixture/packages/incus-unraid-7.0.0-9001-x86_64-1.txz"

  mkdir -p \
    "$fixture/scripts" \
    "$fixture/packages" \
    "$fixture/source/usr/local/emhttp/plugins/incus" \
    "$fixture/source/usr/local/incus/bin" \
    "$seed/usr/local/emhttp/plugins/incus"
  cp "$ROOT/scripts/build-classic-package.sh" "$fixture/scripts/"
  printf '{"release":"test"}\n' >"$fixture/release-manifest.json"
  printf '%s\n' \
    '- File: old' \
    '- Size: old' \
    '- Entries: old' \
    '- MD5: old' \
    '- SHA-256: old' >"$fixture/MANIFEST.md"
  printf 'fixture\n' >"$seed/usr/local/emhttp/plugins/incus/fixture"
  printf '#!/bin/sh\nexit 0\n' >"$fixture/source/usr/local/incus/bin/zstd"
  chmod 0644 "$fixture/source/usr/local/incus/bin/zstd"

  # Reproduce the unsafe input metadata that caused the tootie incident.
  chmod 0777 "$seed" "$seed/usr" "$seed/usr/local" \
    "$seed/usr/local/emhttp" "$seed/usr/local/emhttp/plugins" \
    "$seed/usr/local/emhttp/plugins/incus"
  tar -C "$seed" -cJf "$previous" .

  (
    umask "$mask"
    "$fixture/scripts/build-classic-package.sh" 9001 "$previous" >/dev/null
  )

  [ -f "$output" ]
  [ "$(tar -tJf "$output" | awk '$0 == "./" { count++ } END { print count+0 }')" -eq 0 ]
  bad_directory="$(
    tar --numeric-owner -tvJf "$output" |
      awk '$1 ~ /^d/ && ($1 != "drwxr-xr-x" || $2 != "0/0") { print $NF; exit }'
  )"
  [ -z "$bad_directory" ] || {
    echo "umask $mask produced unsafe directory metadata: $bad_directory" >&2
    exit 1
  }
  [ "$(tar -tvJf "$output" usr/local/incus/bin/zstd | awk '{print $1}')" = "-rwxr-xr-x" ] || {
    echo "umask $mask produced a non-executable private runtime helper" >&2
    exit 1
  }
  first_hash="$(sha256sum "$output" | awk '{print $1}')"
  (
    umask "$mask"
    "$fixture/scripts/build-classic-package.sh" 9001 "$previous" >/dev/null
  )
  second_hash="$(sha256sum "$output" | awk '{print $1}')"
  [ "$first_hash" = "$second_hash" ] || {
    echo "umask $mask produced different hashes for unchanged package content" >&2
    exit 1
  }
}

build_fixture 022
build_fixture 077

echo "package modes and hashes are stable under umask 022 and 077"
