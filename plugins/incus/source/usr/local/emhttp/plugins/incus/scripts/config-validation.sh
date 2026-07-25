#!/bin/bash
# Shared validation and storage preparation. Containment checks are
# side-effect-free; prepare_storage_config creates missing configured storage
# and runs disposable write probes before a candidate is applied.

path_is_safe_storage() {
  case "$1" in
    /srv/*|/mnt/*) return 0 ;;
    /tmp/*) [ "${INCUS_TEST_ALLOW_TMP:-0}" = "1" ] && return 0 ;;
  esac
  return 1
}

prepare_writable_directory() {
  local label="$1" path="$2" resolved probe moved fstype
  path_is_safe_storage "$path" || {
    echo "$label must be beneath /srv or /mnt: $path" >&2
    return 1
  }
  if [ -e "$path" ] && [ ! -d "$path" ]; then
    echo "$label is not a directory: $path" >&2
    return 1
  fi
  mkdir -p "$path" || {
    echo "$label could not be created: $path" >&2
    return 1
  }
  resolved="$(readlink -f "$path")" || {
    echo "$label cannot be resolved: $path" >&2
    return 1
  }
  path_is_safe_storage "$resolved" || {
    echo "$label resolves outside /srv or /mnt: $resolved" >&2
    return 1
  }
  fstype="$(stat -f -c '%T' "$resolved" 2>/dev/null || echo unknown)"
  case "$fstype" in
    tmpfs|ramfs)
      echo "$label is on non-persistent $fstype storage: $resolved" >&2
      return 1
      ;;
  esac

  probe="$(mktemp "${resolved}/.incus-write-test.XXXXXX")" || {
    echo "$label is not writable: $resolved" >&2
    return 1
  }
  moved="${probe}.renamed"
  if ! printf 'incus-storage-write-test\n' >"$probe" ||
     ! mv "$probe" "$moved" ||
     ! rm -f "$moved"; then
    rm -f "$probe" "$moved" 2>/dev/null || true
    echo "$label failed write/rename/delete probe: $resolved" >&2
    return 1
  fi
}

prepare_zfs_storage_source() {
  local source="$1" pool probe
  [ -n "$source" ] || { echo "ZFS storage source is empty" >&2; return 1; }
  pool="${source%%/*}"
  command -v zfs >/dev/null 2>&1 || {
    echo "STORAGE_DRIVER=zfs but the zfs command is unavailable" >&2
    return 1
  }
  command -v zpool >/dev/null 2>&1 || {
    echo "STORAGE_DRIVER=zfs but the zpool command is unavailable" >&2
    return 1
  }
  zpool list "$pool" >/dev/null 2>&1 || {
    echo "ZFS pool does not exist: $pool" >&2
    return 1
  }
  if ! zfs list "$source" >/dev/null 2>&1; then
    zfs create -p "$source" || {
      echo "ZFS storage dataset could not be created: $source" >&2
      return 1
    }
  fi
  [ "$(zfs list -H -o type "$source" 2>/dev/null)" = "filesystem" ] || {
    echo "ZFS storage source is not a filesystem dataset: $source" >&2
    return 1
  }

  probe="${source}@incus-write-test-$$"
  zfs snapshot "$probe" || {
    echo "ZFS storage dataset is not writable: $source" >&2
    return 1
  }
  if ! zfs destroy "$probe"; then
    echo "ZFS storage write probe could not be cleaned up: $probe" >&2
    return 1
  fi
}

prepare_storage_config() {
  prepare_writable_directory "INCUS_DIR" "${INCUS_DIR:-/mnt/user/appdata/incus}" || return 1
  prepare_writable_directory "JAIL_WORKSPACE_ROOT" "${JAIL_WORKSPACE_ROOT:-/srv/agent-jails}" || return 1
  if [ "${STORAGE_DRIVER:-dir}" = "zfs" ]; then
    prepare_zfs_storage_source "${STORAGE_SOURCE:-}" || return 1
  fi
}

validate_containment_config() {
  local workspace resolved_workspace item host target mode extra resolved_host config_root old_ifs
  workspace="${JAIL_WORKSPACE_ROOT:-/srv/agent-jails}"
  path_is_safe_storage "$workspace" || {
    echo "workspace root must be beneath /srv or /mnt: $workspace" >&2
    return 1
  }
  resolved_workspace="$(readlink -m "$workspace")" || return 1
  path_is_safe_storage "$resolved_workspace" || {
    echo "workspace root resolves outside /srv or /mnt: $resolved_workspace" >&2
    return 1
  }

  [ -z "${JAIL_BIND_MOUNTS:-}" ] && return 0
  config_root="$(readlink -m /boot/config/plugins/incus/bind-mounts)" || return 1
  old_ifs="$IFS"
  IFS=,
  for item in $JAIL_BIND_MOUNTS; do
    IFS=: read -r host target mode extra <<<"$item"
    IFS="$old_ifs"
    if [ -z "$host" ] || [ -z "$target" ] || [ -n "$extra" ]; then
      echo "invalid bind mount '$item' (expected host:container[:ro|rw])" >&2
      return 1
    fi
    mode="${mode:-ro}"
    case "$host" in /*) ;; *) echo "bind source must be absolute: $host" >&2; return 1 ;; esac
    case "$target" in /*) ;; *) echo "bind target must be absolute: $target" >&2; return 1 ;; esac
    case "$host:$target" in *[!A-Za-z0-9_./:-]*) echo "unsupported character in bind mount: $item" >&2; return 1 ;; esac
    case "$mode" in ro|rw) ;; *) echo "bind mode must be ro or rw: $item" >&2; return 1 ;; esac
    [ -e "$host" ] || { echo "bind source does not exist: $host" >&2; return 1; }
    resolved_host="$(readlink -f "$host")" || return 1
    case "$resolved_host" in
      /srv/*|/mnt/*) ;;
      "$config_root"|"$config_root"/*)
        [ "$mode" = "ro" ] || {
          echo "config bind mounts must be read-only: $item" >&2
          return 1
        }
        ;;
      *)
        echo "bind source resolves outside /srv, /mnt, or ${config_root}: $host" >&2
        return 1
        ;;
    esac
    IFS=,
  done
  IFS="$old_ifs"
}
