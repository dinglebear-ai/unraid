#!/bin/bash
# unraid-mcp-update.sh — update the native runraid server independently of the plugin.
#
# The plugin ships /usr/local/unraid-mcp/bin/runraid in the RAM rootfs. This
# script maintains a persistent, checksum-verified binary overlay on the array;
# rc.unraid-mcp prefers the overlay when it is a safe root-owned regular file.
#
#   unraid-mcp-update.sh installed    -> print the active version
#   unraid-mcp-update.sh latest       -> print the latest unraid-rs-vX.Y.Z tag
#   unraid-mcp-update.sh update [ver] -> install a release (default: latest)
#   unraid-mcp-update.sh reset        -> remove the overlay (revert to bundled)
#   unraid-mcp-update.sh which        -> print the active binary path
#
# stage-update/stage-reset/commit/rollback are internal transaction commands
# used by the webGUI so a runtime that fails to start can be reverted.
set -euo pipefail

PREFIX="/usr/local/unraid-mcp"
BUNDLED_BIN="${PREFIX}/bin/runraid"
APPDATA_DIR="/mnt/user/appdata/unraid-mcp"
OVERLAY_DIR="${APPDATA_DIR}/bin"
OVERLAY_BIN="${OVERLAY_DIR}/runraid"
PREVIOUS_BIN="${OVERLAY_DIR}/runraid.previous"
PREVIOUS_ABSENT="${OVERLAY_DIR}/runraid.previous.absent"
REPO="dinglebear-ai/unraid"
ASSET="runraid-linux-x86_64"

array_mounted() {
    grep -qsE '[[:space:]]/mnt/user[[:space:]]' /proc/mounts
}

prepare_overlay_dir() {
    if ! array_mounted; then
        echo "error: /mnt/user is not mounted; refusing to write an overlay into the RAM rootfs" >&2
        return 1
    fi

    local path
    for path in /mnt/user/appdata "${APPDATA_DIR}" "${OVERLAY_DIR}"; do
        if [ -L "${path}" ]; then
            echo "error: refusing symlinked overlay path ${path}" >&2
            return 1
        fi
    done

    mkdir -p "${OVERLAY_DIR}"
    for path in "${APPDATA_DIR}" "${OVERLAY_DIR}"; do
        if [ ! -d "${path}" ] || [ -L "${path}" ]; then
            echo "error: overlay path is not a real directory: ${path}" >&2
            return 1
        fi
        chown 0:0 "${path}" 2>/dev/null || true
        chmod 700 "${path}" 2>/dev/null || true
    done
}

overlay_valid() {
    [ -f "${OVERLAY_BIN}" ] \
        && [ ! -L "${OVERLAY_BIN}" ] \
        && [ -x "${OVERLAY_BIN}" ] \
        && [ "$(stat -c %u "${OVERLAY_BIN}" 2>/dev/null)" = "0" ]
}

previous_binary_valid() {
    [ -f "${PREVIOUS_BIN}" ] \
        && [ ! -L "${PREVIOUS_BIN}" ] \
        && [ "$(stat -c %u "${PREVIOUS_BIN}" 2>/dev/null)" = "0" ]
}

clear_previous() {
    rm -f "${PREVIOUS_BIN}" "${PREVIOUS_ABSENT}"
}

snapshot_previous() {
    clear_previous
    if overlay_valid; then
        install -o 0 -g 0 -m 0755 "${OVERLAY_BIN}" "${PREVIOUS_BIN}"
    else
        umask 0077
        : >"${PREVIOUS_ABSENT}"
        chown 0:0 "${PREVIOUS_ABSENT}" 2>/dev/null || true
    fi
}

active_binary() {
    if overlay_valid; then
        echo "${OVERLAY_BIN}"
    else
        echo "${BUNDLED_BIN}"
    fi
}

installed_version() {
    local line
    line="$("$(active_binary)" --version 2>/dev/null || true)"
    case "${line}" in
        "unraid-rmcp "*) echo "${line#unraid-rmcp }" ;;
        *) echo "unknown" ;;
    esac
}

latest_tag() {
    # -S surfaces curl's own error on stderr even in silent mode so a failed
    # lookup is diagnosable instead of vanishing into an empty result.
    curl -fsSL -S "https://api.github.com/repos/${REPO}/releases?per_page=100" \
        | sed -n 's/.*"tag_name":[[:space:]]*"\([^"]*\)".*/\1/p' \
        | awk '/^unraid-rs-v[0-9]+\.[0-9]+\.[0-9]+$/' \
        | sort -V \
        | tail -n1
}

normalize_target() {
    local target="$1"
    target="${target#unraid-rs-v}"
    target="${target#v}"
    if [[ ! "${target}" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        echo "error: refusing non-release version '$1'" >&2
        return 1
    fi
    echo "${target}"
}

# Returns success when $1 is strictly older than $2.
version_lt() {
    [ "$1" = "$2" ] && return 1
    [ "$(printf '%s\n%s\n' "$1" "$2" | sort -V | head -n1)" = "$1" ]
}

do_update() {
    local requested="${1:-}"
    local tag
    if [ -z "${requested}" ]; then
        tag="$(latest_tag)" || true
        if [ -z "${tag}" ]; then
            echo "error: could not resolve the latest unraid-rs release from the GitHub API" >&2
            echo "       likely causes: no network/DNS, a GitHub outage, or API rate limiting" >&2
            exit 1
        fi
    elif [[ "${requested}" == unraid-rs-v* ]]; then
        tag="${requested}"
    else
        tag="unraid-rs-v$(normalize_target "${requested}")"
    fi

    local version
    version="$(normalize_target "${tag}")"
    local current
    current="$(installed_version)"
    if [ "${current}" != "unknown" ] && version_lt "${version}" "${current}"; then
        echo "error: ${version} is older than installed ${current}; refusing to downgrade" >&2
        echo "run 'reset' to revert to the bundled version instead" >&2
        exit 1
    fi

    prepare_overlay_dir

    local base="https://github.com/${REPO}/releases/download/${tag}"
    local tmp_dir candidate checksum expected actual staged
    tmp_dir="$(mktemp -d "${OVERLAY_DIR}/.update.XXXXXX")"
    trap 'rm -rf "$tmp_dir"' EXIT
    candidate="${tmp_dir}/${ASSET}"
    checksum="${tmp_dir}/${ASSET}.sha256"
    staged="${OVERLAY_DIR}/.runraid.new.$$"

    curl -fL --retry 3 --retry-delay 2 -o "${candidate}" "${base}/${ASSET}"
    curl -fL --retry 3 --retry-delay 2 -o "${checksum}" "${base}/${ASSET}.sha256"
    expected="$(sed -n '1{s/[[:space:]].*//;p;}' "${checksum}")"
    actual="$(sha256sum "${candidate}" | cut -d' ' -f1)"
    if [[ ! "${expected}" =~ ^[0-9a-f]{64}$ ]] || [ "${actual}" != "${expected}" ]; then
        echo "error: checksum verification failed for ${tag}/${ASSET}" >&2
        echo "expected: ${expected:-<missing>}" >&2
        echo "actual:   ${actual}" >&2
        exit 1
    fi

    chmod 755 "${candidate}"
    local got
    got="$("${candidate}" --version 2>/dev/null || true)"
    if [ "${got}" != "unraid-rmcp ${version}" ]; then
        echo "error: downloaded binary reports '${got:-nothing}', expected 'unraid-rmcp ${version}'" >&2
        exit 1
    fi

    snapshot_previous
    rm -f "${staged}"
    install -o 0 -g 0 -m 0755 "${candidate}" "${staged}"
    mv -f "${staged}" "${OVERLAY_BIN}"
    rm -rf "${tmp_dir}"
    trap - EXIT
    echo "${version}"
}

do_reset() {
    prepare_overlay_dir
    snapshot_previous
    rm -f "${OVERLAY_BIN}"
    installed_version
}

do_commit() {
    if ! array_mounted; then
        echo "error: /mnt/user is not mounted; refusing to commit an overlay transaction" >&2
        exit 1
    fi
    if [ -L "${APPDATA_DIR}" ] || [ -L "${OVERLAY_DIR}" ]; then
        echo "error: refusing symlinked overlay directory" >&2
        exit 1
    fi
    clear_previous
    rmdir "${OVERLAY_DIR}" 2>/dev/null || true
}

do_rollback() {
    prepare_overlay_dir
    if previous_binary_valid; then
        install -o 0 -g 0 -m 0755 "${PREVIOUS_BIN}" "${OVERLAY_BIN}"
        clear_previous
    elif [ -f "${PREVIOUS_ABSENT}" ] \
        && [ ! -L "${PREVIOUS_ABSENT}" ] \
        && [ "$(stat -c %u "${PREVIOUS_ABSENT}" 2>/dev/null)" = "0" ]; then
        rm -f "${OVERLAY_BIN}"
        clear_previous
    else
        echo "error: no valid previous overlay transaction is available" >&2
        exit 1
    fi
    installed_version
}

case "${1:-installed}" in
    installed) installed_version ;;
    latest) latest_tag ;;
    update) do_update "${2:-}"; do_commit ;;
    reset) do_reset; do_commit ;;
    stage-update) do_update "${2:-}" ;;
    stage-reset) do_reset ;;
    commit) do_commit ;;
    rollback) do_rollback ;;
    which) active_binary ;;
    *) echo "usage: $0 installed|latest|update [version]|reset|which" >&2; exit 1 ;;
esac
