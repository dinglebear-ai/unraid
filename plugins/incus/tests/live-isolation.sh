#!/bin/bash
set -euo pipefail

[ "${INCUS_LIVE_TEST:-0}" = "1" ] || { echo "set INCUS_LIVE_TEST=1 on a disposable host" >&2; exit 2; }
INCUS="${INCUS_BIN:-/usr/local/incus/bin/incus}"
name="incus-isolation-test-$$"
listener_pid=""
workspace_marker="/workspace/.incus-live-${name}"
workspace_token="workspace-persisted-${name}"
cleanup() {
  [ -z "$listener_pid" ] || kill "$listener_pid" 2>/dev/null || true
  "$INCUS" exec "$name" -- rm -f "$workspace_marker" </dev/null >/dev/null 2>&1 || true
  "$INCUS" delete "$name" --force </dev/null >/dev/null 2>&1 || true
}
trap cleanup EXIT

"$INCUS" launch images:debian/trixie/cloud "$name" --profile default --profile agent-jail </dev/null
# Retry the exec operation itself. During first boot systemd can briefly reject
# an attach while it establishes the initial cgroup tree; a loop inside the
# container never starts in that case and therefore cannot perform the retry.
container_ready=false
for _ in $(seq 1 90); do
  if "$INCUS" exec "$name" -- sh -c 'command -v nc >/dev/null && id agent >/dev/null' 2>/dev/null; then
    container_ready=true
    break
  fi
  sleep 2
done
[ "$container_ready" = true ] || { echo "container did not become exec/cloud-init ready" >&2; exit 1; }
"$INCUS" exec "$name" -- nc -z -w5 1.1.1.1 443
for target in 10.0.0.1 172.16.0.1 192.168.1.1 169.254.169.254 100.64.0.1; do
  if "$INCUS" exec "$name" -- nc -z -w2 "$target" 443; then
    echo "containment failure: reached $target" >&2
    exit 1
  fi
done

# Prove the bridge gateway itself is filtered by opening a known host listener;
# testing an arbitrary closed port would produce the same result without ACLs.
bridge="${INCUS_TEST_BRIDGE:-agentbr0}"
gateway_cidr="$($INCUS network get "$bridge" ipv4.address </dev/null)"
gateway="${gateway_cidr%/*}"
host_port="${INCUS_HOST_TEST_PORT:-45678}"
python3 -c 'import socket, sys
s = socket.socket()
s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
s.bind((sys.argv[1], int(sys.argv[2])))
s.listen(1)
s.accept()' "$gateway" "$host_port" >/dev/null 2>&1 &
listener_pid=$!
sleep 1
kill -0 "$listener_pid" 2>/dev/null || { echo "failed to start host bridge test listener" >&2; exit 1; }
if "$INCUS" exec "$name" -- nc -z -w3 "$gateway" "$host_port"; then
  echo "containment failure: reached host bridge gateway $gateway:$host_port" >&2
  exit 1
fi

# Optional site-known listeners make LAN/Tailscale denial conclusive too.
# Format: space-separated host:port pairs.
for endpoint in ${INCUS_KNOWN_BLOCKED_ENDPOINTS:-}; do
  target="${endpoint%:*}"
  port="${endpoint##*:}"
  if "$INCUS" exec "$name" -- nc -z -w3 "$target" "$port"; then
    echo "containment failure: reached known blocked endpoint $endpoint" >&2
    exit 1
  fi
done
if "$INCUS" exec "$name" -- ip -6 route | grep -q '^default'; then
  echo "containment failure: container has an IPv6 default route" >&2
  exit 1
fi

# The configured shifted workspace must be writable by the non-root agent and
# survive a full container restart.
"$INCUS" exec "$name" -- su -s /bin/sh agent -c "printf '%s\\n' '$workspace_token' >'$workspace_marker'"
"$INCUS" restart "$name" </dev/null
exec_ready=false
for _ in $(seq 1 60); do
  if "$INCUS" exec "$name" -- test -f "$workspace_marker" 2>/dev/null; then
    exec_ready=true
    break
  fi
  sleep 1
done
[ "$exec_ready" = true ] || { echo "container did not become ready after restart" >&2; exit 1; }
[ "$("$INCUS" exec "$name" -- cat "$workspace_marker")" = "$workspace_token" ] || {
  echo "workspace marker did not persist across restart" >&2
  exit 1
}
"$INCUS" exec "$name" -- rm -f "$workspace_marker"

# Make deletion part of the gate rather than relying only on the EXIT trap.
"$INCUS" delete "$name" --force </dev/null
if "$INCUS" info "$name" </dev/null >/dev/null 2>&1; then
  echo "test container still exists after deletion" >&2
  exit 1
fi
trap - EXIT
echo "live isolation, workspace, restart, and deletion checks passed"
