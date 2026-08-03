#!/bin/bash
set -euo pipefail

INCUS_ENV="${INCUS_ENV:-/usr/local/emhttp/plugins/incus/scripts/incus-env.sh}"
INCUS_CONFIG="${INCUS_CONFIG:-/boot/config/plugins/incus/incus.cfg}"
INCUS_BIN="${INCUS_BIN:-incus}"
NFS_RC="${NFS_RC:-/etc/rc.d/rc.nfsd}"
LOCK_FILE="${INCUS_START_LOCK_FILE:-/var/run/incus-start-instance.lock}"
LOCK_TIMEOUT="${INCUS_START_LOCK_TIMEOUT:-120}"
INSTANCE="${1:-}"
RESTORE_NFS=0

log() {
  logger -t incus-start-instance -- "$*" 2>/dev/null || true
}

restore_nfs() {
  if [[ "$RESTORE_NFS" -eq 1 && -x "$NFS_RC" ]]; then
    if "$NFS_RC" start >/dev/null 2>&1; then
      RESTORE_NFS=0
      log "Restored NFS after compatibility start for $INSTANCE"
    else
      log "Failed to restore NFS after compatibility start for $INSTANCE"
      return 1
    fi
  fi
}
trap restore_nfs EXIT INT TERM

usage() {
  echo "usage: $0 <instance>" >&2
  exit 2
}

[[ -n "$INSTANCE" ]] || usage
[[ "$INSTANCE" =~ ^[A-Za-z0-9][A-Za-z0-9._-]*$ ]] || {
  echo "invalid Incus instance name: $INSTANCE" >&2
  exit 2
}

if [[ -r "$INCUS_CONFIG" ]]; then
  # shellcheck disable=SC1090
  source "$INCUS_CONFIG"
fi
if [[ -r "$INCUS_ENV" ]]; then
  # shellcheck disable=SC1090
  source "$INCUS_ENV"
fi
export INCUS_DIR

instance_running() {
  "$INCUS_BIN" </dev/null info "$INSTANCE" 2>/dev/null | grep -q '^Status: RUNNING$'
}

nfs_running() {
  [[ -x "$NFS_RC" ]] && "$NFS_RC" status 2>&1 | grep -q 'currently running'
}

if instance_running; then
  exit 0
fi

initial_rc=0
"$INCUS_BIN" </dev/null start "$INSTANCE" || initial_rc=$?
[[ "$initial_rc" -ne 0 ]] || exit 0

if ! mountpoint -q /proc/fs/nfs && ! mountpoint -q /proc/fs/nfsd; then
  log "Instance $INSTANCE failed to start without an active nfsd proc mount"
  exit "$initial_rc"
fi

install -d -m 0755 "$(dirname "$LOCK_FILE")"
exec 9>"$LOCK_FILE"
if ! flock -w "$LOCK_TIMEOUT" 9; then
  log "Timed out waiting for the global Incus start lock for $INSTANCE"
  exit 75
fi

# Another caller may have completed recovery while this process waited.
if instance_running; then
  exit 0
fi

nfs_was_running=0
nfs_running && nfs_was_running=1
log "Retrying $INSTANCE start inside the serialized NFS procfs compatibility window"

if [[ "$nfs_was_running" -eq 1 ]]; then
  if ! "$NFS_RC" stop >/dev/null 2>&1; then
    log "Could not pause NFS before starting $INSTANCE"
    exit "$initial_rc"
  fi
  RESTORE_NFS=1
fi

for target in /proc/fs/nfsd /proc/fs/nfs; do
  if mountpoint -q "$target" && ! umount "$target"; then
    log "Could not unmount $target before starting $INSTANCE"
    exit 1
  fi
done

retry_rc=0
"$INCUS_BIN" </dev/null start "$INSTANCE" || retry_rc=$?
restore_rc=0
restore_nfs || restore_rc=$?

if [[ "$retry_rc" -ne 0 ]]; then
  log "Instance $INSTANCE still failed after the NFS procfs compatibility retry"
  exit "$retry_rc"
fi
if [[ "$restore_rc" -ne 0 ]]; then
  exit "$restore_rc"
fi

log "Started $INSTANCE and restored NFS after the procfs compatibility retry"
