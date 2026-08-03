#!/bin/bash
set -euo pipefail
INCUS_ENV="${INCUS_ENV:-/usr/local/emhttp/plugins/incus/scripts/incus-env.sh}"
INCUS_CONFIG="${INCUS_CONFIG:-/boot/config/plugins/incus/incus.cfg}"
INCUS_START_HELPER="${INCUS_START_HELPER:-/usr/local/emhttp/plugins/incus/scripts/start-instance.sh}"
INSTALLER_SOURCE="${CODEX_INSTALLER_SOURCE:-/usr/local/emhttp/plugins/unraid-codex/container/install-codex-cli.sh}"
CONTAINER="${CODEX_CONTAINER:-unraid-codex}"
LOCK_FILE="${CODEX_PROVISION_LOCK:-/var/run/unraid-codex-provision.lock}"
READY_TIMEOUT="${CODEX_PROVISION_TIMEOUT:-900}"
CONTAINER_RUNTIME_DIR=/usr/local/lib/unraid-codex
CONTAINER_INSTALLER="$CONTAINER_RUNTIME_DIR/install-codex-cli.sh"
created_container=0
provisioned=0
log(){ logger -t unraid-codex -- "$*" 2>/dev/null || true; printf 'unraid-codex: %s
' "$*"; }
fail(){ log "ERROR: $*" >&2; exit 1; }
cleanup(){ local rc=$?; trap - EXIT; if [[ "$rc" -ne 0 && "$created_container" -eq 1 && "$provisioned" -eq 0 ]]; then log "Removing incomplete container $CONTAINER after provisioning failure"; incus </dev/null delete --force "$CONTAINER" >/dev/null 2>&1 || true; fi; exit "$rc"; }
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
[[ -r "$INCUS_ENV" ]] || fail "Install and configure the Incus plugin first: missing $INCUS_ENV"
[[ -r "$INCUS_CONFIG" ]] || fail "Incus configuration is missing: $INCUS_CONFIG"
[[ -x "$INCUS_START_HELPER" ]] || fail "Incus start helper is unavailable: $INCUS_START_HELPER"
[[ -r "$INSTALLER_SOURCE" ]] || fail "Codex updater is missing: $INSTALLER_SOURCE"
[[ "$READY_TIMEOUT" =~ ^[1-9][0-9]*$ ]] || fail "CODEX_PROVISION_TIMEOUT must be a positive integer"
[[ "$CONTAINER" =~ ^[A-Za-z0-9][A-Za-z0-9._-]*$ ]] || fail "invalid container name: $CONTAINER"
# shellcheck disable=SC1090
source "$INCUS_CONFIG"
# shellcheck disable=SC1090
source "$INCUS_ENV"
export INCUS_DIR
JAIL_PROFILE="${JAIL_PROFILE:-agent-jail}"
JAIL_IMAGE="${JAIL_IMAGE:-images:debian/trixie/cloud}"
JAIL_WORKSPACE_ROOT="${JAIL_WORKSPACE_ROOT:-/srv/agent-jails}"
JAIL_AGENT_UID="${JAIL_AGENT_UID:-1000}"
JAIL_AGENT_GID="${JAIL_AGENT_GID:-1000}"
STORAGE_POOL_NAME="${STORAGE_POOL_NAME:-default}"
install -d -m 0755 "$(dirname "$LOCK_FILE")"
exec 9>"$LOCK_FILE"
flock -w 300 9 || fail "timed out waiting for the Codex provisioning lock"
incus </dev/null query /1.0 >/dev/null 2>&1 || fail "Incus is not running"
incus </dev/null storage show "$STORAGE_POOL_NAME" >/dev/null 2>&1 || fail "Incus storage pool '$STORAGE_POOL_NAME' is not initialized"
incus </dev/null profile show "$JAIL_PROFILE" >/dev/null 2>&1 || fail "Incus profile '$JAIL_PROFILE' is not initialized"
if ! incus </dev/null info "$CONTAINER" >/dev/null 2>&1; then
  workspace="${JAIL_WORKSPACE_ROOT%/}/$CONTAINER"
  case "$workspace" in /srv/*|/mnt/*) ;; /tmp/*) [[ "${CODEX_TEST_ALLOW_TMP:-0}" = 1 ]] || fail "Codex workspace must remain beneath /srv or /mnt" ;; *) fail "Codex workspace must remain beneath /srv or /mnt" ;; esac
  install -d -o "$JAIL_AGENT_UID" -g "$JAIL_AGENT_GID" -m 0750 "$workspace"
  log "Creating dedicated Incus container $CONTAINER from $JAIL_IMAGE"
  incus </dev/null init "$JAIL_IMAGE" "$CONTAINER" --profile default --profile "$JAIL_PROFILE"
  created_container=1
  incus </dev/null config device override "$CONTAINER" workspace source="$workspace" path=/workspace shift=true
fi
if ! incus </dev/null info "$CONTAINER" | grep -q '^Status: RUNNING$'; then "$INCUS_START_HELPER" "$CONTAINER"; fi
log "Waiting for cloud-init and the agent account in $CONTAINER"
deadline=$((SECONDS + READY_TIMEOUT))
while (( SECONDS < deadline )); do
  if incus </dev/null exec "$CONTAINER" -- test -e /var/lib/cloud/instance/boot-finished >/dev/null 2>&1 && incus </dev/null exec "$CONTAINER" -- id agent >/dev/null 2>&1; then break; fi
  sleep 2
done
incus </dev/null exec "$CONTAINER" -- test -e /var/lib/cloud/instance/boot-finished >/dev/null 2>&1 || fail "container cloud-init did not finish"
incus </dev/null exec "$CONTAINER" -- id agent >/dev/null 2>&1 || fail "container agent account is unavailable"
if ! incus </dev/null exec "$CONTAINER" -- sh -c 'command -v curl >/dev/null && command -v python3 >/dev/null && command -v tar >/dev/null'; then
  incus </dev/null exec "$CONTAINER" -- sh -c 'apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y ca-certificates curl python3 tar'
fi
incus </dev/null exec "$CONTAINER" -- install -d -o root -g root -m 0755 "$CONTAINER_RUNTIME_DIR"
incus </dev/null file push "$INSTALLER_SOURCE" "$CONTAINER$CONTAINER_INSTALLER"
incus </dev/null exec "$CONTAINER" -- chown root:root "$CONTAINER_INSTALLER"
incus </dev/null exec "$CONTAINER" -- chmod 0755 "$CONTAINER_INSTALLER"
if ! incus </dev/null exec "$CONTAINER" -- test -x /home/agent/.local/bin/codex; then
  result="$(incus </dev/null exec "$CONTAINER" -- env CODEX_OFFLINE_OK=0 "$CONTAINER_INSTALLER")"
  printf '%s
' "$result"
fi
actual="$(incus </dev/null exec "$CONTAINER" -- su -s /bin/sh agent -c '/home/agent/.local/bin/codex --version' | awk '{print $NF}')"
[[ -n "$actual" ]] || fail "Codex verification as agent failed"
provisioned=1
log "Container $CONTAINER is ready with Codex $actual"
