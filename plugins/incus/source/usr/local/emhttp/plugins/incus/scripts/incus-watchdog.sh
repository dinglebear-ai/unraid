#!/bin/bash
# Lightweight Unraid-compatible supervision. It avoids systemd assumptions,
# retries boundedly, and records health beside persistent Incus state.
set -uo pipefail

PREFIX="/usr/local/incus"
EMHTTP="/usr/local/emhttp/plugins/incus"
CFG="/boot/config/plugins/incus/incus.cfg"
BUILD_ID_FILE="${EMHTTP}/build-id"
PLUGIN_BUILD="$(head -n 1 "$BUILD_ID_FILE" 2>/dev/null || printf 'unknown')"
export INCUS_WATCHDOG=1

failures=0
while [ -f "$CFG" ]; do
  . "$CFG"
  [ "${SERVICE:-disabled}" = "enabled" ] || exit 0
  if "${PREFIX}/bin/incus" info </dev/null >/dev/null 2>&1; then
    failures=0
  else
    failures=$((failures + 1))
    logger -t incus-watchdog "incusd unhealthy; restart attempt ${failures}/3"
    if [ "$failures" -le 3 ]; then
      if /etc/rc.d/rc.incus stop; then
        if ! /etc/rc.d/rc.incus start || ! "${EMHTTP}/scripts/incus-init.sh"; then
          logger -t incus-watchdog "verified stop completed but restart/reconciliation failed"
        fi
      else
        logger -t incus-watchdog "refusing restart because the unhealthy daemon did not stop cleanly"
      fi
    else
      if printf 'status=failed\ntime=%s\nbuild=%s\nmessage=watchdog restart limit reached\n' "$(date -Is)" "$PLUGIN_BUILD" >"${INCUS_DIR}/plugin-health.tmp" 2>/dev/null; then
        mv -f "${INCUS_DIR}/plugin-health.tmp" "${INCUS_DIR}/plugin-health" 2>/dev/null || true
      fi
      logger -t incus-watchdog "restart limit reached; manual intervention required"
      exit 1
    fi
  fi
  sleep 30
done
