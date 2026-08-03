#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HELPER="$ROOT/source/usr/local/emhttp/plugins/incus/scripts/start-instance.sh"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
bin="$tmp/bin"
state="$tmp/state"
mkdir -p "$bin" "$state"

cat >"$bin/incus" <<'EOF'
#!/bin/bash
set -euo pipefail
state="$MOCK_STATE"
case "$1" in
  info)
    if [[ -e "$state/running" ]]; then echo 'Status: RUNNING'; else echo 'Status: STOPPED'; fi
    ;;
  start)
    count=0; [[ -r "$state/count" ]] && count="$(cat "$state/count")"
    count=$((count + 1)); echo "$count" >"$state/count"
    printf 'incus-start-%s
' "$count" >>"$state/events"
    if [[ "${MOCK_START_IMMEDIATE:-0}" = 1 || "$count" -gt 1 ]]; then
      [[ ! -e "$state/nfs-running" ]]
      [[ ! -e "$state/mount-nfs" ]]
      [[ ! -e "$state/mount-nfsd" ]]
      touch "$state/running"
      exit 0
    fi
    exit 1
    ;;
  *) exit 2 ;;
esac
EOF

cat >"$bin/rc.nfsd" <<'EOF'
#!/bin/bash
set -euo pipefail
state="$MOCK_STATE"
case "$1" in
  status) [[ -e "$state/nfs-running" ]] && echo 'NFS server daemon is currently running.' || exit 1 ;;
  stop) printf 'nfs-stop
' >>"$state/events"; rm -f "$state/nfs-running" ;;
  start) printf 'nfs-start
' >>"$state/events"; touch "$state/nfs-running" ;;
  *) exit 2 ;;
esac
EOF

cat >"$bin/mountpoint" <<'EOF'
#!/bin/bash
set -euo pipefail
state="$MOCK_STATE"
[[ "$1" = -q ]] && shift
case "$1" in
  /proc/fs/nfs) test -e "$state/mount-nfs" ;;
  /proc/fs/nfsd) test -e "$state/mount-nfsd" ;;
  *) exit 1 ;;
esac
EOF

cat >"$bin/umount" <<'EOF'
#!/bin/bash
set -euo pipefail
state="$MOCK_STATE"
case "$1" in
  /proc/fs/nfs) rm -f "$state/mount-nfs" ;;
  /proc/fs/nfsd) rm -f "$state/mount-nfsd" ;;
  *) exit 1 ;;
esac
printf 'umount-%s
' "$1" >>"$state/events"
EOF

cat >"$bin/logger" <<'EOF'
#!/bin/sh
exit 0
EOF
chmod 0755 "$bin"/* "$HELPER"

# A normal start does not touch NFS.
MOCK_STATE="$state" MOCK_START_IMMEDIATE=1 PATH="$bin:$PATH"   INCUS_BIN="$bin/incus" NFS_RC="$bin/rc.nfsd"   INCUS_ENV=/dev/null INCUS_CONFIG=/dev/null INCUS_DIR="$tmp/incus"   INCUS_START_LOCK_FILE="$tmp/lock" "$HELPER" normal
[[ -e "$state/running" ]]
! grep -q '^nfs-' "$state/events"

# A failed normal start with nfsd proc mounts uses one serialized compatibility window.
rm -rf "$state"; mkdir -p "$state"
touch "$state/nfs-running" "$state/mount-nfs" "$state/mount-nfsd"
MOCK_STATE="$state" PATH="$bin:$PATH"   INCUS_BIN="$bin/incus" NFS_RC="$bin/rc.nfsd"   INCUS_ENV=/dev/null INCUS_CONFIG=/dev/null INCUS_DIR="$tmp/incus"   INCUS_START_LOCK_FILE="$tmp/lock" "$HELPER" recovered
[[ "$(cat "$state/count")" = 2 ]]
[[ -e "$state/running" ]]
[[ -e "$state/nfs-running" ]]
[[ ! -e "$state/mount-nfs" ]]
[[ ! -e "$state/mount-nfsd" ]]
grep -Fqx 'nfs-stop' "$state/events"
grep -Fqx 'umount-/proc/fs/nfsd' "$state/events"
grep -Fqx 'umount-/proc/fs/nfs' "$state/events"
grep -Fqx 'nfs-start' "$state/events"

printf 'start-instance compatibility tests passed
'
