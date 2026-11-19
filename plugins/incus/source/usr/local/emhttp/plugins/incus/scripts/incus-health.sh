#!/bin/bash
# incus-health.sh — sourced. The single writer of $INCUS_DIR/plugin-health,
# which the API reads and shows in the settings page and dashboard.
#
# Status values:
#   ready     daemon answers and, if a reconciliation ran, it succeeded
#   degraded  daemon answers but the jail environment is not reconciled
#   failed    daemon could not start or be supervised
#   stopped   daemon stopped on purpose
#
# A daemon-level "ready" (the socket answers) says nothing about the jail
# environment, so it never replaces "degraded". Only a successful
# reconciliation clears it: incus_health_write ready <message> reconciled.

incus_health_file() {
  printf '%s/plugin-health' "${INCUS_DIR:-/mnt/user/appdata/incus}"
}

incus_health_status() {
  sed -n 's/^status=//p' "$(incus_health_file)" 2>/dev/null | head -n 1
}

# incus_health_write <status> <message> [reconciled]
# Prints the reason on stderr and returns 1 if the file cannot be written.
incus_health_write() {
  local status="$1" message="${2//$'\n'/ }" scope="${3:-}" file error
  file="$(incus_health_file)"
  if [ "$status" = ready ] && [ "$scope" != reconciled ] &&
     [ "$(incus_health_status)" = degraded ]; then
    return 0
  fi
  if ! error="$(
    { mkdir -p "${file%/*}" &&
      printf 'status=%s\ntime=%s\nbuild=%s\nmessage=%s\n' \
        "$status" "$(date -Is)" "${PLUGIN_BUILD:-unknown}" "$message" >"${file}.tmp" &&
      mv -f "${file}.tmp" "$file"; } 2>&1
  )"; then
    rm -f "${file}.tmp" 2>/dev/null
    echo "could not write ${file}: ${error//$'\n'/ }" >&2
    return 1
  fi
}
