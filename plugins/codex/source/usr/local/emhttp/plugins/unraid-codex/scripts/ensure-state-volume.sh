#!/bin/bash
set -euo pipefail
INCUS_ENV="${INCUS_ENV:-/usr/local/emhttp/plugins/incus/scripts/incus-env.sh}"
INCUS_CONFIG="${INCUS_CONFIG:-/boot/config/plugins/incus/incus.cfg}"
CONTAINER="${CODEX_CONTAINER:-unraid-codex}"
POOL="${CODEX_STATE_POOL:-default}"
VOLUME="${CODEX_STATE_VOLUME:-unraid-codex-state}"
DEVICE="${CODEX_STATE_DEVICE:-codex-state}"
STATE_PATH=/home/agent/.codex
MIGRATION_PATH=/mnt/unraid-codex-state-migration
LOCK_FILE="${CODEX_MAINTENANCE_LOCK:-/var/run/unraid-codex-maintenance.lock}"
# shellcheck disable=SC1090
[[ -r "$INCUS_CONFIG" ]] && source "$INCUS_CONFIG"
# shellcheck disable=SC1090
source "$INCUS_ENV"
export INCUS_DIR
exec 9>"$LOCK_FILE"
flock -w 120 9
if ! incus </dev/null storage volume show "$POOL" "$VOLUME" >/dev/null 2>&1; then
  incus </dev/null storage volume create "$POOL" "$VOLUME" security.shifted=true
  logger -t unraid-codex "Created persistent Incus volume $POOL/$VOLUME"
fi
device_yaml="$(incus </dev/null config device show "$CONTAINER")"
if grep -q "^$DEVICE:" <<<"$device_yaml"; then
  source_value="$(incus </dev/null config device get "$CONTAINER" "$DEVICE" source 2>/dev/null || true)"
  path_value="$(incus </dev/null config device get "$CONTAINER" "$DEVICE" path 2>/dev/null || true)"
  pool_value="$(incus </dev/null config device get "$CONTAINER" "$DEVICE" pool 2>/dev/null || true)"
  if [[ "$source_value" = "$VOLUME" && "$path_value" = "$STATE_PATH" && "$pool_value" = "$POOL" ]]; then
    incus </dev/null exec "$CONTAINER" -- install -d -o agent -g agent -m 0700 "$STATE_PATH"
    exit 0
  fi
  incus </dev/null exec "$CONTAINER" -- systemctl stop codex-appserver.service 2>/dev/null || true
  incus </dev/null config device remove "$CONTAINER" "$DEVICE"
fi
incus </dev/null exec "$CONTAINER" -- systemctl stop codex-appserver.service 2>/dev/null || true
migration_device="$DEVICE-migration"
if incus </dev/null config device show "$CONTAINER" | grep -q "^$migration_device:"; then
  incus </dev/null config device remove "$CONTAINER" "$migration_device"
fi
incus </dev/null storage volume attach "$POOL" "$VOLUME" "$CONTAINER" "$migration_device" "$MIGRATION_PATH"
incus </dev/null exec "$CONTAINER" -- install -d -o agent -g agent -m 0700 "$MIGRATION_PATH"
volume_empty=0
# The expression is intentionally evaluated by the container's sh -c.
# shellcheck disable=SC2016
if incus </dev/null exec "$CONTAINER" -- sh -c \
  'test -z "$(find "$1" -mindepth 1 -maxdepth 1 -print -quit)"' sh "$MIGRATION_PATH"; then
  volume_empty=1
fi
if [[ "$volume_empty" -eq 1 ]]; then
  incus </dev/null exec "$CONTAINER" -- sh -c "if [ -d '$STATE_PATH' ]; then cp -a '$STATE_PATH'/.' '$MIGRATION_PATH'/; fi"
  logger -t unraid-codex "Migrated existing Codex state into $POOL/$VOLUME"
fi
incus </dev/null exec "$CONTAINER" -- chown -R agent:agent "$MIGRATION_PATH"
incus </dev/null exec "$CONTAINER" -- chmod 0700 "$MIGRATION_PATH"
incus </dev/null config device remove "$CONTAINER" "$migration_device"
incus </dev/null storage volume attach "$POOL" "$VOLUME" "$CONTAINER" "$DEVICE" "$STATE_PATH"
incus </dev/null exec "$CONTAINER" -- chown -R agent:agent "$STATE_PATH"
incus </dev/null exec "$CONTAINER" -- chmod 0700 "$STATE_PATH"
logger -t unraid-codex "Mounted persistent Codex state volume at $STATE_PATH"
