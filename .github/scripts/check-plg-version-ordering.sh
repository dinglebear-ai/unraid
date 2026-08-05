#!/usr/bin/env bash
# Guard against a silent Unraid plugin-update failure.
#
# WHY THIS EXISTS
# Unraid compares plugin versions as STRINGS, not semver. release-please's
# `simple` release-type bumps these units as SEMVER on a date-shaped version.
# Those two rules disagree, and the disagreement is invisible:
#
#   2026.7.24  ->  2026.7.25   ok  ('5' > '4')
#   2026.7.24  ->  2026.8.0    ok  ('8' > '7')
#   2026.7.24  ->  2026.10.0   REGRESSION  ('1' < '9' at index 5)
#   2026.7.24  ->  2026.7.100  REGRESSION  ('1' < '2' at index 7)
#
# On a regression Unraid does not error — it simply decides the remote version is
# older than the installed one and every installed plugin silently stops updating.
# The third `feat:` commit is enough to trigger it.
#
# This script fails the build when a .plg version does not sort strictly after the
# highest already-released version for that component, under LC_ALL=C byte order.
#
# Requires full tag history: checkout with `fetch-depth: 0`.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"

status=0

plg_version() {
  sed -n 's/.*<!ENTITY[[:space:]]*version[[:space:]]*"\([^"]*\)".*/\1/p' "$1" | head -1
}

# Greater of two strings under C collation ("" if equal).
greater() {
  [ "$1" = "$2" ] && return 0
  printf '%s\n%s\n' "$1" "$2" | LC_ALL=C sort | tail -1
}

check_component() {
  local name="$1" plg="$2" prefix="$3"

  if [ ! -f "$plg" ]; then
    echo "error: $name: no .plg at $plg" >&2
    status=1
    return
  fi

  local current
  current="$(plg_version "$plg")"
  if [ -z "$current" ]; then
    echo "error: $name: could not parse the <!ENTITY version> from $plg" >&2
    status=1
    return
  fi

  local last
  last="$(git tag --list "${prefix}*" | sed "s|^${prefix}||" | LC_ALL=C sort | tail -1)"

  if [ -z "$last" ]; then
    echo "ok: $name $current (no prior ${prefix}* tag — first release)"
    return
  fi

  if [ "$current" = "$last" ]; then
    echo "ok: $name $current (unchanged since last release)"
    return
  fi

  if [ "$(greater "$last" "$current")" != "$current" ]; then
    cat >&2 <<EOF
error: $name version REGRESSES under Unraid's string comparison.
       last released : $last
       this build    : $current
       Under LC_ALL=C byte order "$current" sorts BEFORE "$last", so every
       installed copy of this plugin would silently refuse to update.
       Fix: choose a version that sorts after "$last" — e.g. zero-pad the date
       components (2026.08.01) instead of letting semver produce 2026.10.0.
       See $plg and release-please-config.json.
EOF
    status=1
    return
  fi

  echo "ok: $name $last -> $current (sorts forward)"
}

# The mcp plugin version is not in its .plg template (VERSION_PLACEHOLDER); it
# is derived at release time from the unraid-rs semver by
# plugins/mcp/scripts/plugin-version.sh (0.3.1 -> 3.000.003.001). The candidate
# must sort strictly after BOTH the highest legacy Python-lane v* release
# (installed boxes may hold any of them) and every previously released epoch-3
# version (one per unraid-rs-v* tag), all under LC_ALL=C byte order.
check_mcp() {
  local name="mcp"

  local rust_version
  rust_version="$(sed -n 's/^version = "\(.*\)"/\1/p' unraid-rs/Cargo.toml | head -1)"
  if [ -z "$rust_version" ]; then
    echo "error: $name: could not parse the package version from unraid-rs/Cargo.toml" >&2
    status=1
    return
  fi

  local current
  if ! current="$(plugins/mcp/scripts/plugin-version.sh "$rust_version")"; then
    echo "error: $name: plugin-version.sh rejected unraid-rs version '$rust_version'" >&2
    status=1
    return
  fi

  # Highest legacy Python-lane plugin version under C collation.
  local legacy
  legacy="$(git tag --list 'v*' | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' | sed 's/^v//' | LC_ALL=C sort | tail -1)"
  if [ -n "$legacy" ] && { [ "$current" = "$legacy" ] || [ "$(greater "$legacy" "$current")" != "$current" ]; }; then
    cat >&2 <<EOF
error: $name version REGRESSES against the legacy Python plugin lane.
       highest legacy release : $legacy
       this build             : $current (from unraid-rs $rust_version)
       Under LC_ALL=C byte order "$current" does not sort strictly after
       "$legacy", so upgraded boxes on the old lane would silently refuse to
       update. Fix plugins/mcp/scripts/plugin-version.sh's epoch mapping.
EOF
    status=1
    return
  fi

  # Highest previously released epoch-3 version (mapped from unraid-rs-v* tags).
  local last=""
  local tag mapped
  while IFS= read -r tag; do
    mapped="$(plugins/mcp/scripts/plugin-version.sh "$tag" 2>/dev/null)" || continue
    if [ -z "$last" ] || [ "$(greater "$last" "$mapped")" = "$mapped" ]; then
      last="$mapped"
    fi
  done < <(git tag --list 'unraid-rs-v*')

  if [ -z "$last" ]; then
    echo "ok: $name $current (no prior unraid-rs-v* tag — first release)"
    return
  fi

  if [ "$current" = "$last" ]; then
    echo "ok: $name $current (unchanged since last release)"
    return
  fi

  if [ "$(greater "$last" "$current")" != "$current" ]; then
    cat >&2 <<EOF
error: $name version REGRESSES under Unraid's string comparison.
       last released : $last
       this build    : $current (from unraid-rs $rust_version)
       Under LC_ALL=C byte order "$current" sorts BEFORE "$last", so every
       installed copy of this plugin would silently refuse to update.
       Fix: bump unraid-rs/Cargo.toml so plugin-version.sh yields a version
       that sorts after "$last".
EOF
    status=1
    return
  fi

  echo "ok: $name $last -> $current (sorts forward)"
}

check_component "incus" "plugins/incus/incus.plg" "incus-v"
check_component "codex" "plugins/codex/unraid-codex.plg" "codex-v"
check_mcp

if [ "$status" -ne 0 ]; then
  echo "plg version ordering check FAILED" >&2
  exit 1
fi
echo "plg version ordering check passed"
