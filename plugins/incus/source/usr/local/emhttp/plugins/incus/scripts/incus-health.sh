#!/bin/bash
# incus-health.sh — sourced. The single writer of $INCUS_DIR/plugin-health,
# which the API reads and shows in the settings page and dashboard.
#
# Status values:
#   ready     daemon answers and the jail environment is reconciled
#   degraded  daemon answers but the jail environment is not reconciled
#   failed    daemon could not start or be supervised
#   stopped   daemon stopped on purpose
#
# Whether the environment is reconciled is separate from whether the daemon
# runs, so it is kept in its own `unreconciled=<reason>` line. Writing
# "degraded" sets it. Daemon-level writes (ready, stopped, failed) keep it,
# and a daemon-level "ready" is reported as "degraded" while it is set. That
# way a restart (stop, then start) cannot hide an unreconciled environment.
# Only a successful reconciliation clears it:
#   incus_health_write ready <message> reconciled

incus_health_file() {
  printf '%s/plugin-health' "${INCUS_DIR:-/mnt/user/appdata/incus}"
}

# Prints a field's value, or nothing when the file or field is missing. Never
# fails, so callers under set -e -o pipefail can use it in assignments.
incus_health_field() {
  local file
  file="$(incus_health_file)"
  [ -r "$file" ] || return 0
  sed -n "s/^$1=//p" "$file" 2>/dev/null | head -n 1 || true
}

incus_health_status() {
  incus_health_field status
}

# incus_health_write <status> <message> [reconciled]
# Prints the reason on stderr and returns 1 if the file cannot be written.
incus_health_write() {
  local status="$1" message="${2//$'\n'/ }" scope="${3:-}" file error unreconciled
  file="$(incus_health_file)"
  unreconciled="$(incus_health_field unreconciled)"
  if [ "$status" = degraded ]; then
    unreconciled="$message"
  elif [ "$status" = ready ] && [ "$scope" = reconciled ]; then
    unreconciled=""
  elif [ "$status" = ready ] && [ -n "$unreconciled" ]; then
    status=degraded
    message="$unreconciled"
  fi
  if ! error="$(
    { mkdir -p "${file%/*}" &&
      {
        printf 'status=%s\ntime=%s\nbuild=%s\nmessage=%s\n' \
          "$status" "$(date -Is)" "${PLUGIN_BUILD:-unknown}" "$message"
        [ -z "$unreconciled" ] || printf 'unreconciled=%s\n' "$unreconciled"
      } >"${file}.tmp" &&
      mv -f "${file}.tmp" "$file"; } 2>&1
  )"; then
    rm -f "${file}.tmp" 2>/dev/null
    echo "could not write ${file}: ${error//$'\n'/ }" >&2
    return 1
  fi
}
