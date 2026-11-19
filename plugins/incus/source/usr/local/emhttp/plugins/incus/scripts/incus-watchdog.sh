#!/bin/bash
# Lightweight Unraid-compatible supervision. It avoids systemd assumptions,
# retries boundedly, and records health beside persistent Incus state.
#
# - The daemon is restarted only after several consecutive failed checks.
#   A restart tears down the managed bridges, so one slow answer under load
#   must not cause it.
# - While plugin-health is "degraded" and the daemon answers, incus-init.sh
#   is retried with backoff. Its success is what clears "degraded".
set -uo pipefail

PREFIX="/usr/local/incus"
EMHTTP="${INCUS_EMHTTP:-/usr/local/emhttp/plugins/incus}"
CFG="${INCUS_CONFIG:-/boot/config/plugins/incus/incus.cfg}"
INCUS="${INCUS_BIN:-${PREFIX}/bin/incus}"
RC_INCUS="${INCUS_RC:-/etc/rc.d/rc.incus}"
INIT="${EMHTTP}/scripts/incus-init.sh"
BUILD_ID_FILE="${EMHTTP}/build-id"
# shellcheck disable=SC2034 # read by incus-health.sh
PLUGIN_BUILD="$(head -n 1 "$BUILD_ID_FILE" 2>/dev/null || printf 'unknown')"
INTERVAL="${INCUS_WATCHDOG_INTERVAL:-30}"
UNHEALTHY_CHECKS="${INCUS_WATCHDOG_UNHEALTHY_CHECKS:-3}"
MAX_RESTARTS=3
RECONCILE_DELAY="${INCUS_WATCHDOG_RECONCILE_DELAY:-300}"
RECONCILE_MAX_DELAY=3600
INIT_TIMEOUT="${INCUS_INIT_TIMEOUT:-300}"
# Test-only bound on loop iterations; 0 means run until disabled.
MAX_LOOPS="${INCUS_WATCHDOG_MAX_LOOPS:-0}"
EX_CONFIG=78
export INCUS_WATCHDOG=1
. "${EMHTTP}/scripts/incus-health.sh"

log() { logger -t incus-watchdog "$*"; }
health() {
  local error
  error="$(incus_health_write "$1" "$2" 2>&1)" || log "$error"
}

# Runs incus-init.sh once with a time limit; prints its last output line.
reconcile() {
  local output status
  output="$(timeout --kill-after=15 "$INIT_TIMEOUT" "$INIT" 2>&1)"
  status=$?
  if [ "$status" -ne 0 ]; then
    printf '%s\n' "$output" | grep -v '^[[:space:]]*$' | logger -t incus-init-output
    printf '%s' "$(printf '%s\n' "$output" | grep -v '^[[:space:]]*$' | grep -v 'exiting with status ' | tail -n 1)"
  fi
  return "$status"
}

unhealthy=0
restarts=0
delay="$RECONCILE_DELAY"
next_reconcile=$((SECONDS + delay))
config_rejected=""
loops=0
while [ -f "$CFG" ]; do
  . "$CFG"
  [ "${SERVICE:-disabled}" = "enabled" ] || exit 0
  if "$INCUS" info </dev/null >/dev/null 2>&1; then
    unhealthy=0
    if [ "$(incus_health_status)" = degraded ] && [ "$SECONDS" -ge "$next_reconcile" ]; then
      cfg_stamp="$(stat -c %Y "$CFG" 2>/dev/null || echo 0)"
      # A rejected config fails the same way until incus.cfg changes.
      if [ "$config_rejected" != "$cfg_stamp" ]; then
        if reason="$(reconcile)"; then
          log "degraded environment reconciled"
          delay="$RECONCILE_DELAY"
        else
          status=$?
          if [ "$status" -eq "$EX_CONFIG" ]; then
            config_rejected="$cfg_stamp"
            log "reconciliation rejected incus.cfg; waiting for a config change: ${reason}"
          else
            delay=$((delay * 2 > RECONCILE_MAX_DELAY ? RECONCILE_MAX_DELAY : delay * 2))
            log "reconciliation still failing (status ${status}); next try in ${delay}s: ${reason}"
          fi
        fi
      fi
      next_reconcile=$((SECONDS + delay))
    fi
  else
    unhealthy=$((unhealthy + 1))
    if [ "$unhealthy" -lt "$UNHEALTHY_CHECKS" ]; then
      log "incusd did not answer (${unhealthy}/${UNHEALTHY_CHECKS} consecutive checks)"
    else
      unhealthy=0
      restarts=$((restarts + 1))
      if [ "$restarts" -gt "$MAX_RESTARTS" ]; then
        health failed "watchdog restart limit reached"
        log "restart limit reached; manual intervention required"
        exit 1
      fi
      log "incusd unhealthy; restart attempt ${restarts}/${MAX_RESTARTS}"
      if "$RC_INCUS" stop; then
        if ! "$RC_INCUS" start; then
          log "verified stop completed but restart failed"
        elif ! reason="$(reconcile)"; then
          health degraded "watchdog restarted incusd but reconciliation failed: ${reason}"
          log "verified restart completed but reconciliation failed: ${reason}"
          delay="$RECONCILE_DELAY"
          next_reconcile=$((SECONDS + delay))
        fi
      else
        log "refusing restart because the unhealthy daemon did not stop cleanly"
      fi
    fi
  fi
  loops=$((loops + 1))
  [ "$MAX_LOOPS" -gt 0 ] && [ "$loops" -ge "$MAX_LOOPS" ] && exit 0
  sleep "$INTERVAL"
done
