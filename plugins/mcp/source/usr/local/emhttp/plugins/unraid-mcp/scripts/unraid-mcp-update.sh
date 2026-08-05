#!/bin/bash
# unraid-mcp-update.sh — update the native runraid server independently of the plugin.
#
# The plugin ships /usr/local/unraid-mcp/bin/runraid in the RAM rootfs. This
# script maintains a persistent, checksum-verified binary overlay on the array;
# rc.unraid-mcp prefers the overlay when present.
#
#   unraid-mcp-update.sh installed    -> print the active version
#   unraid-mcp-update.sh latest       -> print the latest unraid-rs-vX.Y.Z tag
#   unraid-mcp-update.sh update [ver] -> install a release (default: latest)
#   unraid-mcp-update.sh reset        -> remove the overlay (revert to bundled)
#   unraid-mcp-update.sh which        -> print the active binary path
set -euo pipefail

PREFIX="/usr/local/unraid-mcp"
BUNDLED_BIN="${PREFIX}/bin/runraid"
OVERLAY_DIR="/mnt/user/appdata/unraid-mcp/bin"
OVERLAY_BIN="${OVERLAY_DIR}/runraid"
REPO="dinglebear-ai/unraid"
ASSET="runraid-linux-x86_64"

active_binary() {
    if [ -x "$OVERLAY_BIN" ]; then
        echo "$OVERLAY_BIN"
    else
        echo "$BUNDLED_BIN"
    fi
}

installed_version() {
    local line
    line="$("$(active_binary)" --version 2>/dev/null || true)"
    case "$line" in
        "unraid-rmcp "*) echo "${line#unraid-rmcp }" ;;
        *) echo "unknown" ;;
    esac
}

latest_tag() {
    curl -fsSL "https://api.github.com/repos/${REPO}/releases?per_page=100" 2>/dev/null \
        | sed -n 's/.*"tag_name":[[:space:]]*"\([^"]*\)".*/\1/p' \
        | awk '/^unraid-rs-v[0-9]+\.[0-9]+\.[0-9]+$/' \
        | sort -V \
        | tail -n1
}

normalize_target() {
    local target="$1"
    target="${target#unraid-rs-v}"
    target="${target#v}"
    if [[ ! "$target" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        echo "error: refusing non-release version '$1'" >&2
        return 1
    fi
    echo "$target"
}

# Returns success when $1 is strictly older than $2.
version_lt() {
    [ "$1" = "$2" ] && return 1
    [ "$(printf '%s\n%s\n' "$1" "$2" | sort -V | head -n1)" = "$1" ]
}

do_update() {
    local requested="${1:-}"
    local tag
    if [ -z "$requested" ]; then
        tag="$(latest_tag)"
        [ -n "$tag" ] || { echo "error: could not resolve latest Rust release" >&2; exit 1; }
    elif [[ "$requested" == unraid-rs-v* ]]; then
        tag="$requested"
    else
        tag="unraid-rs-v$(normalize_target "$requested")"
    fi

    local version
    version="$(normalize_target "$tag")"
    local current
    current="$(installed_version)"
    if [ "$current" != "unknown" ] && version_lt "$version" "$current"; then
        echo "error: ${version} is older than installed ${current}; refusing to downgrade" >&2
        echo "run 'reset' to revert to the bundled version instead" >&2
        exit 1
    fi

    local base="https://github.com/${REPO}/releases/download/${tag}"
    local tmp_dir candidate checksum expected actual
    mkdir -p "$OVERLAY_DIR"
    chmod 700 "$(dirname "$OVERLAY_DIR")" "$OVERLAY_DIR" 2>/dev/null || true
    tmp_dir="$(mktemp -d "${OVERLAY_DIR}/.update.XXXXXX")"
    trap 'rm -rf "$tmp_dir"' EXIT
    candidate="${tmp_dir}/${ASSET}"
    checksum="${tmp_dir}/${ASSET}.sha256"

    curl -fL --retry 3 --retry-delay 2 -o "$candidate" "${base}/${ASSET}"
    curl -fL --retry 3 --retry-delay 2 -o "$checksum" "${base}/${ASSET}.sha256"
    expected="$(sed -n '1{s/[[:space:]].*//;p;}' "$checksum")"
    actual="$(sha256sum "$candidate" | cut -d' ' -f1)"
    if [[ ! "$expected" =~ ^[0-9a-f]{64}$ ]] || [ "$actual" != "$expected" ]; then
        echo "error: checksum verification failed for ${tag}/${ASSET}" >&2
        echo "expected: ${expected:-<missing>}" >&2
        echo "actual:   ${actual}" >&2
        exit 1
    fi

    chmod 755 "$candidate"
    local got
    got="$("$candidate" --version 2>/dev/null || true)"
    if [ "$got" != "unraid-rmcp ${version}" ]; then
        echo "error: downloaded binary reports '${got:-nothing}', expected 'unraid-rmcp ${version}'" >&2
        exit 1
    fi

    mv -f "$candidate" "$OVERLAY_BIN"
    chmod 755 "$OVERLAY_BIN"
    rm -rf "$tmp_dir"
    trap - EXIT
    echo "$version"
}

do_reset() {
    rm -f "$OVERLAY_BIN"
    rmdir "$OVERLAY_DIR" 2>/dev/null || true
    installed_version
}

case "${1:-installed}" in
    installed) installed_version ;;
    latest) latest_tag ;;
    update) do_update "${2:-}" ;;
    reset) do_reset ;;
    which) active_binary ;;
    *) echo "usage: $0 installed|latest|update [version]|reset|which" >&2; exit 1 ;;
esac
