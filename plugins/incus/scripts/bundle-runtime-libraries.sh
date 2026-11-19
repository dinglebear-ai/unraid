#!/bin/bash
# Install the libraries pinned in runtime-libraries.lock into a package stage.
# Usage: bundle-runtime-libraries.sh STAGE_DIR
#
# Each library is installed under its soname in usr/local/incus/lib, with the
# Debian copyright file in usr/local/incus/share/doc/<package>/. A library and
# copyright that already match the lock are left alone, so carried-forward
# payloads need no download. Every download is checked against the .deb
# SHA-256 and the extracted library against the library SHA-256.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
stage="${1:?usage: $0 STAGE_DIR}"
lock="${INCUS_RUNTIME_LOCK:-$ROOT/runtime-libraries.lock}"
cache="${INCUS_DEB_CACHE:-$ROOT/packages/debs}"
lib_dir="$stage/usr/local/incus/lib"
doc_root="$stage/usr/local/incus/share/doc"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

sha256() { sha256sum "$1" | cut -d' ' -f1; }

fetch_deb() {
  local package="$1" url="$2" expected="$3" deb
  deb="$cache/${package}_${expected}.deb"
  if [ ! -f "$deb" ] || [ "$(sha256 "$deb")" != "$expected" ]; then
    mkdir -p "$cache"
    curl -fsSL --retry 3 -o "$deb.part" "$url" || {
      rm -f "$deb.part"
      echo "could not download ${package} from ${url}" >&2
      return 1
    }
    mv -f "$deb.part" "$deb"
  fi
  if [ "$(sha256 "$deb")" != "$expected" ]; then
    echo "checksum mismatch for ${package}: ${url} is not ${expected}" >&2
    rm -f "$deb"
    return 1
  fi
  printf '%s' "$deb"
}

mkdir -p "$lib_dir" "$doc_root"
while read -r package version url deb_sha member soname lib_sha extra; do
  case "$package" in ''|'#'*) continue ;; esac
  [ -n "$lib_sha" ] && [ -z "${extra:-}" ] || {
    echo "malformed line in ${lock} for ${package}" >&2
    exit 1
  }
  target="$lib_dir/$soname"
  copyright="$doc_root/$package/copyright"
  if [ -f "$target" ] && [ ! -L "$target" ] && [ "$(sha256 "$target")" = "$lib_sha" ] &&
     [ -s "$copyright" ]; then
    echo "${soname}: ${package} ${version} already bundled"
    continue
  fi
  if [ -e "$target" ] && { [ -L "$target" ] || [ "$(sha256 "$target")" != "$lib_sha" ]; }; then
    echo "replacing ${soname}: carried-forward copy does not match ${package} ${version}"
  fi

  deb="$(fetch_deb "$package" "$url" "$deb_sha")"
  extract="$work/$package"
  mkdir -p "$extract"
  (cd "$extract" && ar x "$deb")
  data="$(find "$extract" -maxdepth 1 -name 'data.tar.*' -print -quit)"
  [ -n "$data" ] || { echo "${package}: no data archive in .deb" >&2; exit 1; }
  tar -xf "$data" -C "$extract" "./$member" "./usr/share/doc/$package/copyright"
  if [ "$(sha256 "$extract/$member")" != "$lib_sha" ]; then
    echo "library checksum mismatch for ${soname}: ${package} ${version} ${member} is not ${lib_sha}" >&2
    exit 1
  fi
  rm -f "$target"
  install -m 0644 "$extract/$member" "$target"
  install -D -m 0644 "$extract/usr/share/doc/$package/copyright" "$copyright"
  echo "${soname}: bundled ${package} ${version}"
done <"$lock"
