#!/bin/bash
# unraid-mcp-update.sh — update the MCP server independently of the plugin.
#
# The plugin ships a bundled interpreter at /usr/local/unraid-mcp/python with
# unraid-mcp preinstalled (that tree is RAM-resident, re-laid every boot). This
# script maintains a PERSISTENT overlay venv on the array that layers a
# different unraid-mcp version on top of the bundled site-packages. rc.unraid-mcp
# prefers the overlay when present, so an update survives reboots and plugin
# reinstalls without rebuilding the txz.
#
#   unraid-mcp-update.sh installed   -> print the active version
#   unraid-mcp-update.sh latest      -> print the latest GitHub release tag
#   unraid-mcp-update.sh update [ver]-> install a version (default: latest) into
#                                       the overlay venv and print the result
#   unraid-mcp-update.sh reset       -> remove the overlay (revert to bundled)
set -euo pipefail

PREFIX="/usr/local/unraid-mcp"
BUNDLED_PY="${PREFIX}/python/bin/python3"
OVERLAY_DIR="/mnt/user/appdata/unraid-mcp/venv"
OVERLAY_PY="${OVERLAY_DIR}/bin/python3"
REPO="dinglebear-ai/unraid-mcp"

active_python() {
    if [ -x "$OVERLAY_PY" ]; then echo "$OVERLAY_PY"; else echo "$BUNDLED_PY"; fi
}

installed_version() {
    "$(active_python)" - <<'PY' 2>/dev/null || echo "unknown"
import importlib.metadata as m
print(m.version("unraid-mcp"))
PY
}

latest_tag() {
    # No jq dependency assumed; parse the tag_name from the releases API.
    curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" 2>/dev/null \
        | sed -n 's/.*"tag_name":[[:space:]]*"\([^"]*\)".*/\1/p' | head -n1
}

# Compare dotted versions: returns 0 if $1 < $2 (a strict downgrade).
version_lt() {
    [ "$1" = "$2" ] && return 1
    [ "$(printf '%s\n%s\n' "$1" "$2" | sort -V | head -n1)" = "$1" ]
}

do_update() {
    local target="${1:-}"
    if [ -z "$target" ]; then
        target="$(latest_tag)"
        [ -z "$target" ] && { echo "error: could not resolve latest release" >&2; exit 1; }
    fi
    local version="${target#v}"
    if [[ ! "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        echo "error: refusing to install non-release version '${version}'" >&2
        exit 1
    fi

    # Refuse rollbacks: a tampered/compromised "latest" that points at an older,
    # known-vulnerable release must not silently downgrade the running server.
    local current
    current="$(installed_version)"
    if [ "$current" != "unknown" ] && version_lt "$version" "$current"; then
        echo "error: ${version} is older than the installed ${current}; refusing to downgrade" >&2
        echo "run 'reset' to revert to the bundled version instead" >&2
        exit 1
    fi

    # Create the overlay venv layered on the bundled site-packages so heavy
    # shared deps don't need reinstalling — only unraid-mcp and any changed
    # dependency versions are fetched.
    if [ ! -x "$OVERLAY_PY" ]; then
        mkdir -p "$(dirname "$OVERLAY_DIR")"
        "$BUNDLED_PY" -m venv --system-site-packages "$OVERLAY_DIR"
    fi

    # Pin the index explicitly so a stray PIP_INDEX_URL can't redirect the pull;
    # pip verifies PyPI's own artifact hashes over TLS.
    "$OVERLAY_PY" -m pip install --quiet --upgrade --no-cache-dir \
        --index-url https://pypi.org/simple "unraid-mcp==${version}" >&2
    local got
    got="$("$OVERLAY_PY" -c 'import importlib.metadata as m; print(m.version("unraid-mcp"))' 2>/dev/null)"
    if [ "$got" != "$version" ]; then
        echo "error: installed ${got:-nothing}, expected ${version}" >&2
        exit 1
    fi
    echo "$got"
}

do_reset() {
    # Best-effort; the caller stops the service first so nothing holds files.
    rm -rf "$OVERLAY_DIR" 2>/dev/null || true
    [ -e "$OVERLAY_DIR" ] && rm -rf "$OVERLAY_DIR"
    installed_version
}

case "${1:-installed}" in
    installed) installed_version ;;
    latest)    latest_tag ;;
    update)    do_update "${2:-}" ;;
    reset)     do_reset ;;
    which)     active_python ;;
    *) echo "usage: $0 installed|latest|update [version]|reset|which" >&2; exit 1 ;;
esac
