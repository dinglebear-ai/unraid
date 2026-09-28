#!/bin/bash
set -euo pipefail

INCUS_ENV="${INCUS_ENV:-/usr/local/emhttp/plugins/incus/scripts/incus-env.sh}"
INCUS_CONFIG="${INCUS_CONFIG:-/boot/config/plugins/incus/incus.cfg}"
CONTAINER="${CODEX_CONTAINER:-unraid-codex}"
POOL="${CODEX_STATE_POOL:-default}"
VOLUME="${CODEX_STATE_VOLUME:-unraid-codex-state}"
PLUGIN_CONFIG="${CODEX_PLUGIN_CONFIG:-/boot/config/plugins/unraid-codex}"
BACKUP_DIR="${CODEX_BACKUP_DIR:-/mnt/cache_appdata/appdata/unraid-codex/backups}"
BACKUP_TMP_DIR="${CODEX_BACKUP_TMP_DIR:-/run}"
KEY_FILE="$PLUGIN_CONFIG/backup.key"
LOCK_FILE="${CODEX_MAINTENANCE_LOCK:-/var/run/unraid-codex-maintenance.lock}"
KEEP_SNAPSHOTS="${CODEX_KEEP_SNAPSHOTS:-14}"
KEEP_EXPORT_DAYS="${CODEX_KEEP_EXPORT_DAYS:-30}"
PBKDF2_ITERATIONS=200000
if [[ "${CODEX_TEST_ALLOW_NON_ROOT:-0}" = "1" && -n "${CODEX_TEST_PBKDF2_ITERATIONS:-}" ]]; then
  PBKDF2_ITERATIONS="$CODEX_TEST_PBKDF2_ITERATIONS"
fi
[[ "$PBKDF2_ITERATIONS" =~ ^[1-9][0-9]*$ ]] || { echo "invalid PBKDF2 iteration count" >&2; exit 2; }
service_was_running=0
plain=""

cleanup() {
  [[ -z "$plain" ]] || rm -f "$plain"
  if [[ "$service_was_running" -eq 1 ]]; then
    incus </dev/null exec "$CONTAINER" -- systemctl start codex-appserver.service >/dev/null 2>&1 || true
    service_was_running=0
  fi
}
trap cleanup EXIT INT TERM

# shellcheck disable=SC1090
[[ -r "$INCUS_CONFIG" ]] && source "$INCUS_CONFIG"
# shellcheck disable=SC1090
source "$INCUS_ENV"
export INCUS_DIR

install -d -m 0700 "$PLUGIN_CONFIG" "$BACKUP_DIR" "$BACKUP_TMP_DIR"
exec 9>"$LOCK_FILE"
flock -w 300 9

incus </dev/null storage volume show "$POOL" "$VOLUME" >/dev/null
if [[ ! -s "$KEY_FILE" ]]; then
  umask 077
  openssl rand -hex 64 >"$KEY_FILE"
fi
chmod 0600 "$KEY_FILE"

if incus </dev/null exec "$CONTAINER" -- systemctl is-active --quiet codex-appserver.service; then
  service_was_running=1
  incus </dev/null exec "$CONTAINER" -- systemctl stop codex-appserver.service
fi

incus </dev/null exec "$CONTAINER" -- su -s /bin/sh agent -c \
  'python3 /usr/local/lib/unraid-codex/codex-maintenance.py'
incus </dev/null exec "$CONTAINER" -- journalctl --vacuum-time=14d --vacuum-size=128M >/dev/null

stamp="$(date -u +%Y%m%d-%H%M%S)"
snapshot="daily-$stamp"
incus </dev/null storage volume snapshot create "$POOL" "$VOLUME" "$snapshot" --expiry 15d

if [[ "$service_was_running" -eq 1 ]]; then
  incus </dev/null exec "$CONTAINER" -- systemctl start codex-appserver.service
  service_was_running=0
fi

plain="$(mktemp "$BACKUP_TMP_DIR/unraid-codex-state.XXXXXX.tar.gz")"
incus </dev/null storage volume export "$POOL" "$VOLUME/$snapshot" "$plain"   --force --volume-only --compression gzip

final="$BACKUP_DIR/unraid-codex-state-$stamp.tar.gz.enc"
tmp="$final.tmp"
enc_pass="$(cut -c1-64 "$KEY_FILE")"
hmac_key="$(cut -c65-128 "$KEY_FILE")"
printf '%s' "$enc_pass" | openssl enc -aes-256-cbc -pbkdf2 -iter "$PBKDF2_ITERATIONS" -salt \
  -in "$plain" -out "$tmp" -pass stdin
chmod 0600 "$tmp"
openssl dgst -sha256 -mac HMAC -macopt "hexkey:$hmac_key" "$tmp" \
  | awk '{print $NF}' >"$tmp.hmac"
sha256sum "$tmp" | awk '{print $1}' >"$tmp.sha256"
chmod 0600 "$tmp.hmac" "$tmp.sha256"
mv "$tmp" "$final"
mv "$tmp.hmac" "$final.hmac"
mv "$tmp.sha256" "$final.sha256"
rm -f "$plain"; plain=""

mapfile -t snapshots < <(incus </dev/null storage volume snapshot list "$POOL" "$VOLUME" -f csv -c n | sort)
if (( ${#snapshots[@]} > KEEP_SNAPSHOTS )); then
  remove_count=$((${#snapshots[@]} - KEEP_SNAPSHOTS))
  for ((i=0; i<remove_count; i++)); do
    incus </dev/null storage volume snapshot delete "$POOL" "$VOLUME/${snapshots[$i]}"
  done
fi
find "$BACKUP_DIR" -type f -name 'unraid-codex-state-*.tar.gz.enc' -mtime "+$KEEP_EXPORT_DAYS" -print0 |
  while IFS= read -r -d '' old; do rm -f "$old" "$old.hmac" "$old.sha256"; done

logger -t unraid-codex "Created encrypted Codex state backup $(basename "$final")"
printf '%s
' "$final"
