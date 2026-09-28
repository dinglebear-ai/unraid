#!/bin/bash
# Shared persistent-path validation for the runraid service and updater.

unraid_mcp_array_mounted() {
    local mount_root="${1:-/mnt}" mounts_file="${2:-/proc/mounts}"
    grep -qsE "[[:space:]]${mount_root}/user[[:space:]]" "${mounts_file}"
}

unraid_mcp_appdata_share_safe() {
    local path="$1" mount_root="${2:-/mnt}" pools_dir="${3:-/boot/config/pools}"
    local mounts_file="${4:-/proc/mounts}" resolved relative pool
    [ -L "${path}" ] || return 0
    resolved="$(readlink -f -- "${path}" 2>/dev/null)" || return 1
    [ -d "${resolved}" ] || return 1

    # An Unraid exclusive share resolves directly into a configured named pool.
    case "${resolved}" in
        "${mount_root}"/*/appdata) ;;
        *) return 1 ;;
    esac
    relative="${resolved#"${mount_root}"/}"
    pool="${relative%%/*}"
    [ -n "${pool}" ] && [ "${relative}" = "${pool}/appdata" ] \
        && [ -f "${pools_dir}/${pool}.cfg" ] \
        && [ ! -L "${pools_dir}/${pool}.cfg" ] \
        && grep -qsE "[[:space:]]${mount_root}/${pool}[[:space:]]" "${mounts_file}"
}

unraid_mcp_prepare_persistent_paths() {
    local appdata_dir="$1" leaf_dir="${2:-}" mount_root="${3:-/mnt}"
    local pools_dir="${4:-/boot/config/pools}" mounts_file="${5:-/proc/mounts}"
    local share="${mount_root}/user/appdata" path

    if ! unraid_mcp_array_mounted "${mount_root}" "${mounts_file}"; then
        echo "${mount_root}/user is not mounted; refusing to create appdata in the RAM rootfs" >&2
        return 1
    fi
    if ! unraid_mcp_appdata_share_safe \
        "${share}" "${mount_root}" "${pools_dir}" "${mounts_file}"; then
        echo "refusing unsafe symlinked appdata share ${share}" >&2
        return 1
    fi
    for path in "${appdata_dir}" ${leaf_dir:+"${leaf_dir}"}; do
        if [ -L "${path}" ]; then
            echo "refusing symlinked persistent path ${path}" >&2
            return 1
        fi
    done

    mkdir -p "${leaf_dir:-${appdata_dir}}"
    for path in "${appdata_dir}" ${leaf_dir:+"${leaf_dir}"}; do
        if [ ! -d "${path}" ] || [ -L "${path}" ]; then
            echo "persistent path is not a real directory: ${path}" >&2
            return 1
        fi
        chown 0:0 "${path}" 2>/dev/null || true
        chmod 700 "${path}" 2>/dev/null || true
    done
}
