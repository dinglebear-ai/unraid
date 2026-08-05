#!/bin/bash
set -euo pipefail

INCUS_ENV="${INCUS_ENV:-/usr/local/emhttp/plugins/incus/scripts/incus-env.sh}"
INCUS_CONFIG="${INCUS_CONFIG:-/boot/config/plugins/incus/incus.cfg}"
INCUS_START_HELPER="${CODEX_INCUS_START_HELPER:-/usr/local/emhttp/plugins/incus/scripts/start-instance.sh}"
START_APPSERVER="${CODEX_START_APPSERVER:-/usr/local/emhttp/plugins/unraid-codex/scripts/start-appserver.sh}"
CONTAINER="${CODEX_CONTAINER:-unraid-codex}"
POOL="${CODEX_STATE_POOL:-default}"
VOLUME="${CODEX_STATE_VOLUME:-unraid-codex-state}"
DEVICE="${CODEX_STATE_DEVICE:-codex-state}"
STATE_PATH="${CODEX_STATE_PATH:-/home/agent/.codex}"
PLUGIN_CONFIG="${CODEX_PLUGIN_CONFIG:-/boot/config/plugins/unraid-codex}"
KEY_FILE="${CODEX_BACKUP_KEY_FILE:-$PLUGIN_CONFIG/backup.key}"
LOCK_FILE="${CODEX_MAINTENANCE_LOCK:-/var/run/unraid-codex-maintenance.lock}"
RESTORE_TMP_DIR="${CODEX_RESTORE_TMP_DIR:-/run}"
PBKDF2_ITERATIONS=200000
if [[ "${CODEX_TEST_ALLOW_NON_ROOT:-0}" = "1" && -n "${CODEX_TEST_PBKDF2_ITERATIONS:-}" ]]; then
  PBKDF2_ITERATIONS="$CODEX_TEST_PBKDF2_ITERATIONS"
fi
[[ "$PBKDF2_ITERATIONS" =~ ^[1-9][0-9]*$ ]] || { echo "invalid PBKDF2 iteration count" >&2; exit 2; }
VERIFY_ONLY=1
DISCARD_ROLLBACK=0
BACKUP=""
plain=""
restore_volume=""
rollback_volume=""
failed_volume=""
container_was_running=0
service_was_running=0
restore_imported=0
original_renamed=0
restored_promoted=0
restore_succeeded=0

usage() {
  cat <<'EOF'
Usage: restore-state.sh [--verify-only] [--force] [--discard-rollback] BACKUP.tar.gz.enc

The default verifies the encrypted backup, its SHA-256 sidecar, its HMAC, and
its decrypted Incus export without changing state. --force performs the restore.
The previous state volume is retained under a timestamped rollback name unless
--discard-rollback is also supplied.
EOF
}

log() {
  logger -t unraid-codex -- "$*" 2>/dev/null || true
  printf 'unraid-codex: %s
' "$*"
}

fail() {
  log "ERROR: $*" >&2
  exit 1
}

volume_exists() {
  incus </dev/null storage volume show "$POOL" "$1" >/dev/null 2>&1
}

device_exists() {
  incus </dev/null config device show "$CONTAINER" 2>/dev/null | grep -q "^$DEVICE:"
}

start_previous_runtime() {
  if [[ "$container_was_running" -eq 1 ]]; then
    if [[ -x "$INCUS_START_HELPER" ]]; then
      "$INCUS_START_HELPER" "$CONTAINER" >/dev/null
    else
      incus </dev/null start "$CONTAINER"
    fi
    if [[ "$service_was_running" -eq 1 ]]; then
      "$START_APPSERVER" >/dev/null
    else
      incus </dev/null exec "$CONTAINER" -- systemctl stop codex-appserver.service >/dev/null 2>&1 || true
    fi
  fi
}

rollback_restore() {
  local rollback_failed=0
  [[ "$original_renamed" -eq 1 ]] || return 0
  log "Restore failed after the volume swap; restoring the previous state volume"
  incus </dev/null exec "$CONTAINER" -- systemctl stop codex-appserver.service >/dev/null 2>&1 || true
  incus </dev/null stop "$CONTAINER" --timeout 120 >/dev/null 2>&1 || true
  if device_exists; then
    incus </dev/null config device remove "$CONTAINER" "$DEVICE" >/dev/null 2>&1 || rollback_failed=1
  fi
  if [[ "$restored_promoted" -eq 1 ]] && volume_exists "$VOLUME"; then
    if ! incus </dev/null storage volume move "$POOL/$VOLUME" "$POOL/$failed_volume" >/dev/null; then
      rollback_failed=1
    fi
  elif [[ "$restore_imported" -eq 1 ]] && volume_exists "$restore_volume"; then
    incus </dev/null storage volume delete "$POOL" "$restore_volume" >/dev/null 2>&1 || true
  fi
  if volume_exists "$rollback_volume"; then
    if ! incus </dev/null storage volume move "$POOL/$rollback_volume" "$POOL/$VOLUME" >/dev/null; then
      rollback_failed=1
    fi
  else
    rollback_failed=1
  fi
  if volume_exists "$VOLUME"; then
    incus </dev/null storage volume attach "$POOL" "$VOLUME" "$CONTAINER" "$DEVICE" "$STATE_PATH" >/dev/null 2>&1 || rollback_failed=1
  fi
  start_previous_runtime >/dev/null 2>&1 || rollback_failed=1
  if [[ "$rollback_failed" -eq 0 ]]; then
    log "Previous Codex state was restored successfully"
  else
    log "CRITICAL: automatic rollback was incomplete; inspect $POOL/$VOLUME, $POOL/$rollback_volume, and $POOL/$failed_volume before starting Codex"
  fi
}

cleanup() {
  local rc=$?
  trap - EXIT INT TERM
  [[ -z "$plain" ]] || rm -f "$plain"
  if [[ "$rc" -ne 0 && "$restore_succeeded" -ne 1 ]]; then
    rollback_restore || true
    if [[ "$original_renamed" -eq 0 && "$restore_imported" -eq 1 ]] && volume_exists "$restore_volume"; then
      incus </dev/null storage volume delete "$POOL" "$restore_volume" >/dev/null 2>&1 || true
    fi
  fi
  exit "$rc"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

while [[ $# -gt 0 ]]; do
  case "$1" in
    --verify-only) VERIFY_ONLY=1 ;;
    --force) VERIFY_ONLY=0 ;;
    --discard-rollback) DISCARD_ROLLBACK=1 ;;
    -h|--help) usage; exit 0 ;;
    --) shift; break ;;
    -*) usage >&2; fail "unknown option: $1" ;;
    *)
      [[ -z "$BACKUP" ]] || { usage >&2; fail "only one backup file may be supplied"; }
      BACKUP="$1"
      ;;
  esac
  shift
done
if [[ $# -gt 0 ]]; then
  [[ -z "$BACKUP" && $# -eq 1 ]] || { usage >&2; fail "only one backup file may be supplied"; }
  BACKUP="$1"
fi

[[ "$EUID" -eq 0 || "${CODEX_TEST_ALLOW_NON_ROOT:-0}" = "1" ]] || fail "restore must run as root"
[[ -n "$BACKUP" ]] || { usage >&2; fail "a backup file is required"; }
[[ -f "$BACKUP" && ! -L "$BACKUP" ]] || fail "backup is not a regular file: $BACKUP"
BACKUP="$(readlink -f -- "$BACKUP")"
[[ "$BACKUP" == *.tar.gz.enc ]] || fail "backup filename must end in .tar.gz.enc"
[[ -f "$BACKUP.sha256" && ! -L "$BACKUP.sha256" ]] || fail "missing SHA-256 sidecar: $BACKUP.sha256"
[[ -f "$BACKUP.hmac" && ! -L "$BACKUP.hmac" ]] || fail "missing HMAC sidecar: $BACKUP.hmac"
[[ -r "$KEY_FILE" && -f "$KEY_FILE" && ! -L "$KEY_FILE" ]] || fail "backup key is unavailable: $KEY_FILE"
key="$(tr -d '
' <"$KEY_FILE")"
[[ "$key" =~ ^[0-9A-Fa-f]{128}$ ]] || fail "backup key must contain exactly 128 hexadecimal characters"
enc_pass="${key:0:64}"
hmac_key="${key:64:64}"

install -d -m 0755 "$(dirname "$LOCK_FILE")"
exec 9>"$LOCK_FILE"
flock -w 300 9 || fail "timed out waiting for the Codex maintenance lock"

expected_sha="$(awk 'NR == 1 { print $1 }' "$BACKUP.sha256")"
[[ "$expected_sha" =~ ^[0-9A-Fa-f]{64}$ ]] || fail "invalid SHA-256 sidecar"
actual_sha="$(sha256sum "$BACKUP" | awk '{ print $1 }')"
[[ "${actual_sha,,}" = "${expected_sha,,}" ]] || fail "backup SHA-256 does not match its sidecar"

expected_hmac="$(awk 'NR == 1 { print $1 }' "$BACKUP.hmac")"
[[ "$expected_hmac" =~ ^[0-9A-Fa-f]{64}$ ]] || fail "invalid HMAC sidecar"
actual_hmac="$(openssl dgst -sha256 -mac HMAC -macopt "hexkey:$hmac_key" "$BACKUP" | awk '{print $NF}')"
[[ "${actual_hmac,,}" = "${expected_hmac,,}" ]] || fail "backup HMAC verification failed"

install -d -m 0700 "$RESTORE_TMP_DIR"
plain="$(mktemp "$RESTORE_TMP_DIR/unraid-codex-restore.XXXXXX.tar.gz")"
chmod 0600 "$plain"
printf '%s' "$enc_pass" | openssl enc -d -aes-256-cbc -pbkdf2 -iter "$PBKDF2_ITERATIONS" \
  -in "$BACKUP" -out "$plain" -pass stdin

gzip -t "$plain"
tar -tzf "$plain" >/dev/null
log "Verified encrypted Codex state backup $(basename "$BACKUP")"
if [[ "$VERIFY_ONLY" -eq 1 ]]; then
  printf 'verification=ok
backup=%s
' "$BACKUP"
  exit 0
fi

[[ -r "$INCUS_ENV" ]] || fail "Incus plugin environment is unavailable: $INCUS_ENV"
# shellcheck disable=SC1090
[[ -r "$INCUS_CONFIG" ]] && source "$INCUS_CONFIG"
# shellcheck disable=SC1090
source "$INCUS_ENV"
export INCUS_DIR
incus </dev/null query /1.0 >/dev/null 2>&1 || fail "Incus is not running"
incus </dev/null storage show "$POOL" >/dev/null 2>&1 || fail "Incus storage pool '$POOL' is unavailable"
incus </dev/null info "$CONTAINER" >/dev/null 2>&1 || fail "Codex container '$CONTAINER' does not exist"
volume_exists "$VOLUME" || fail "Codex state volume '$POOL/$VOLUME' does not exist"
[[ -x "$START_APPSERVER" ]] || fail "Codex start helper is unavailable: $START_APPSERVER"

stamp="$(date -u +%Y%m%d-%H%M%S)"
restore_volume="$VOLUME-restore-$stamp-$$"
rollback_volume="$VOLUME-pre-restore-$stamp"
failed_volume="$VOLUME-failed-restore-$stamp"
for candidate in "$restore_volume" "$rollback_volume" "$failed_volume"; do
  volume_exists "$candidate" && fail "temporary restore volume already exists: $POOL/$candidate"
done

container_info="$(incus </dev/null info "$CONTAINER")"
if grep -q '^Status: RUNNING$' <<<"$container_info"; then
  container_was_running=1
  if incus </dev/null exec "$CONTAINER" -- systemctl is-active --quiet codex-appserver.service; then
    service_was_running=1
  fi
fi

log "Importing verified backup into temporary volume $POOL/$restore_volume"
incus </dev/null storage volume import "$POOL" "$plain" "$restore_volume"
restore_imported=1
incus </dev/null storage volume set "$POOL" "$restore_volume" security.shifted true >/dev/null

if [[ "$container_was_running" -eq 1 ]]; then
  incus </dev/null exec "$CONTAINER" -- systemctl stop codex-appserver.service >/dev/null 2>&1 || true
  incus </dev/null stop "$CONTAINER" --timeout 120
fi
if device_exists; then
  incus </dev/null config device remove "$CONTAINER" "$DEVICE"
fi

incus </dev/null storage volume move "$POOL/$VOLUME" "$POOL/$rollback_volume"
original_renamed=1
incus </dev/null storage volume move "$POOL/$restore_volume" "$POOL/$VOLUME"
restored_promoted=1
incus </dev/null storage volume attach "$POOL" "$VOLUME" "$CONTAINER" "$DEVICE" "$STATE_PATH"
start_previous_runtime

if [[ "$container_was_running" -eq 1 ]]; then
  incus </dev/null exec "$CONTAINER" -- chown -R agent:agent "$STATE_PATH"
  incus </dev/null exec "$CONTAINER" -- chmod 0700 "$STATE_PATH"
fi
if [[ "$service_was_running" -eq 1 ]]; then
  incus </dev/null exec "$CONTAINER" -- systemctl is-active --quiet codex-appserver.service     || fail "restored state did not pass the app-server health check"
fi

restore_succeeded=1
if [[ "$DISCARD_ROLLBACK" -eq 1 ]]; then
  if incus </dev/null storage volume delete "$POOL" "$rollback_volume"; then
    rollback_note="discarded"
  else
    rollback_note="$POOL/$rollback_volume"
    log "WARNING: restore succeeded, but the rollback volume could not be deleted"
  fi
else
  rollback_note="$POOL/$rollback_volume"
fi
log "Restored Codex state from $(basename "$BACKUP"); rollback volume: $rollback_note"
printf 'restore=ok
backup=%s
rollback=%s
' "$BACKUP" "$rollback_note"
