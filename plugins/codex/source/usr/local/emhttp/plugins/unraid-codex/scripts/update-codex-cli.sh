#!/bin/bash
set -euo pipefail
INCUS_ENV="${INCUS_ENV:-/usr/local/emhttp/plugins/incus/scripts/incus-env.sh}"
INCUS_CONFIG="${INCUS_CONFIG:-/boot/config/plugins/incus/incus.cfg}"
START_HELPER="${INCUS_START_HELPER:-/usr/local/emhttp/plugins/incus/scripts/start-instance.sh}"
CONTAINER="${CODEX_CONTAINER:-unraid-codex}"
INSTALLER_SOURCE="${CODEX_INSTALLER_SOURCE:-/usr/local/emhttp/plugins/unraid-codex/container/install-codex-cli.sh}"
SMOKE_SOURCE="${CODEX_SMOKE_SOURCE:-/usr/local/emhttp/plugins/unraid-codex/scripts/appserver-smoke.py}"
RUNTIME_DIR=/usr/local/lib/unraid-codex
CONTAINER_INSTALLER="$RUNTIME_DIR/install-codex-cli.sh"
SOCKET="${CODEX_SOCKET_PATH:-/run/unraid-codex/appserver.sock}"
LOCK_FILE="${CODEX_MAINTENANCE_LOCK:-/var/run/unraid-codex-maintenance.lock}"

log(){ logger -t unraid-codex -- "$*" 2>/dev/null || true; printf 'unraid-codex: %s
' "$*"; }
fail(){ log "ERROR: $*" >&2; exit 1; }
[[ -r "$INCUS_ENV" ]] || fail "Incus environment is unavailable"
[[ -r "$INCUS_CONFIG" ]] || fail "Incus configuration is unavailable"
[[ -x "$START_HELPER" ]] || fail "Incus start helper is unavailable"
[[ -r "$INSTALLER_SOURCE" ]] || fail "Codex updater is unavailable"
[[ -r "$SMOKE_SOURCE" ]] || fail "app-server smoke verifier is unavailable"
# shellcheck disable=SC1090
source "$INCUS_CONFIG"
# shellcheck disable=SC1090
source "$INCUS_ENV"
export INCUS_DIR
install -d -m 0755 "$(dirname "$LOCK_FILE")"
exec 9>"$LOCK_FILE"
flock -w 300 9 || fail "timed out waiting for the Codex maintenance lock"
incus </dev/null info "$CONTAINER" >/dev/null 2>&1 || fail "container does not exist: $CONTAINER"
if ! incus </dev/null info "$CONTAINER" | grep -q '^Status: RUNNING$'; then
  "$START_HELPER" "$CONTAINER"
fi
incus </dev/null exec "$CONTAINER" -- install -d -o root -g root -m 0755 "$RUNTIME_DIR"
incus </dev/null file push "$INSTALLER_SOURCE" "$CONTAINER$CONTAINER_INSTALLER"
incus </dev/null exec "$CONTAINER" -- chown root:root "$CONTAINER_INSTALLER"
incus </dev/null exec "$CONTAINER" -- chmod 0755 "$CONTAINER_INSTALLER"
service_active=0
incus </dev/null exec "$CONTAINER" -- systemctl is-active --quiet codex-appserver.service && service_active=1
result="$(incus </dev/null exec "$CONTAINER" -- env CODEX_OFFLINE_OK=1 "$CONTAINER_INSTALLER")"
printf '%s
' "$result"
if ! grep -q 'installation=updated' <<<"$result"; then
  log "Codex CLI update check completed without a binary change"
  exit 0
fi
if [[ "$service_active" -eq 0 ]]; then
  log "Codex CLI updated; app-server was inactive and was not started by maintenance"
  exit 0
fi
socket_ready(){
  [[ -S "$SOCKET" ]] || { [[ "${CODEX_TEST_SOCKET_READY:-0}" = 1 ]] && [[ -e "$SOCKET" ]]; }
}
restart_and_verify(){
  incus </dev/null exec "$CONTAINER" -- systemctl restart codex-appserver.service || return 1
  for _ in $(seq 1 75); do socket_ready && break; sleep 0.2; done
  socket_ready || return 1
  python3 "$SMOKE_SOURCE" "$SOCKET"
}
if restart_and_verify; then
  log "Codex CLI updated and app-server protocol health passed"
  exit 0
fi
log "Updated Codex CLI failed app-server health; restoring previous binary"
incus </dev/null exec "$CONTAINER" -- test -x /home/agent/.local/bin/codex.previous ||
  fail "updated CLI failed health and no previous binary exists"
incus </dev/null exec "$CONTAINER" -- cp -af /home/agent/.local/bin/codex.previous /home/agent/.local/bin/codex
incus </dev/null exec "$CONTAINER" -- chown agent:agent /home/agent/.local/bin/codex
incus </dev/null exec "$CONTAINER" -- chmod 0755 /home/agent/.local/bin/codex
restart_and_verify || fail "rollback binary also failed app-server health"
fail "Codex CLI update was rolled back after failed health verification"
