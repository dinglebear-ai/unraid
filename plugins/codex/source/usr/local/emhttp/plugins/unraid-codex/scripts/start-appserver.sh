#!/bin/bash
set -euo pipefail

INCUS_ENV=/usr/local/emhttp/plugins/incus/scripts/incus-env.sh
INCUS_CONFIG=/boot/config/plugins/incus/incus.cfg
CONTAINER=unraid-codex
SOCKET_DIR=/run/unraid-codex
CONTAINER_SOCKET_DIR=/mnt/unraid-codex
SOCKET_PATH="$SOCKET_DIR/appserver.sock"
WEBGUI_SOCKET=/var/run/unraid-codex-appserver.sock
PLUGIN_CONFIG=/boot/config/plugins/unraid-codex
NFS_RC=/etc/rc.d/rc.nfsd
RESTORE_NFS=0
MCP_SECRET="$PLUGIN_CONFIG/unraid-mcp.env"
MCP_CONFIG_TEMPLATE=/usr/local/emhttp/plugins/unraid-codex/container/codex-config.toml
MCP_CONFIG_TMP=""
CONTAINER_CONFIG_DIR=/home/agent/.config/unraid-codex
CODEX_CONFIG_DIR=/home/agent/.codex
WORKSPACE_INSTRUCTIONS=/workspace/CLAUDE.md
WORKSPACE_TEMPLATE=/usr/local/emhttp/plugins/unraid-codex/container/workspace-CLAUDE.md

cleanup() {
  [[ -n "$MCP_CONFIG_TMP" ]] && rm -f "$MCP_CONFIG_TMP"
  if [[ "$RESTORE_NFS" -eq 1 && -x "$NFS_RC" ]]; then
    if "$NFS_RC" start >/dev/null 2>&1; then
      RESTORE_NFS=0
      logger -t unraid-codex "Restored NFS after interrupted Incus compatibility start"
    else
      logger -t unraid-codex "Failed to restore NFS after interrupted Incus compatibility start"
    fi
  fi
}
trap cleanup EXIT

read_env_value() {
  local key="$1" line
  [[ -r "$MCP_SECRET" ]] || return 0
  line="$(grep -m1 -E "^[[:space:]]*${key}[[:space:]]*=" "$MCP_SECRET" 2>/dev/null || true)"
  line="${line#*=}"
  line="${line%$'\r'}"
  line="${line#"${line%%[![:space:]]*}"}"
  if [[ "$line" == \"*\" && ${#line} -ge 2 ]]; then
    line="${line:1:${#line}-2}"
  fi
  printf '%s' "$line"
}

nfs_running() {
  [[ -x "$NFS_RC" ]] && "$NFS_RC" status 2>&1 | grep -q 'currently running'
}

start_container() {
  local initial_rc retry_rc=0 restore_rc=0 nfs_was_running=0 target

  incus </dev/null start "$CONTAINER" && return 0
  initial_rc=$?

  if ! mountpoint -q /proc/fs/nfs && ! mountpoint -q /proc/fs/nfsd; then
    logger -t unraid-codex "Container $CONTAINER failed to start without an active nfsd proc mount"
    return "$initial_rc"
  fi

  nfs_running && nfs_was_running=1
  logger -t unraid-codex "Retrying $CONTAINER start inside an NFS procfs compatibility window"

  if [[ "$nfs_was_running" -eq 1 ]]; then
    if ! "$NFS_RC" stop >/dev/null 2>&1; then
      logger -t unraid-codex "Could not pause NFS for the Incus compatibility start"
      return "$initial_rc"
    fi
    RESTORE_NFS=1
  fi

  for target in /proc/fs/nfsd /proc/fs/nfs; do
    if mountpoint -q "$target" && ! umount "$target"; then
      logger -t unraid-codex "Could not unmount $target for the Incus compatibility start"
      return 1
    fi
  done

  incus </dev/null start "$CONTAINER" || retry_rc=$?

  if [[ "$nfs_was_running" -eq 1 ]]; then
    if "$NFS_RC" start >/dev/null 2>&1; then
      RESTORE_NFS=0
    else
      restore_rc=$?
      logger -t unraid-codex "Failed to restore NFS after starting $CONTAINER"
    fi
  fi

  if [[ "$retry_rc" -ne 0 ]]; then
    logger -t unraid-codex "Container $CONTAINER still failed to start after the NFS procfs compatibility retry"
    return "$retry_rc"
  fi
  if [[ "$restore_rc" -ne 0 ]]; then
    return "$restore_rc"
  fi

  logger -t unraid-codex "Started $CONTAINER and restored NFS after the procfs compatibility retry"
}

if [[ ! -r "$INCUS_ENV" ]]; then
  logger -t unraid-codex "Incus plugin environment is unavailable"
  exit 1
fi

# shellcheck disable=SC1090
[[ -r "$INCUS_CONFIG" ]] && source "$INCUS_CONFIG"
# shellcheck disable=SC1090
source "$INCUS_ENV"
export INCUS_DIR

mkdir -p "$SOCKET_DIR"
chmod 0711 "$SOCKET_DIR"

if ! incus </dev/null info "$CONTAINER" >/dev/null 2>&1; then
  logger -t unraid-codex "Container $CONTAINER does not exist"
  exit 1
fi

container_info="$(incus </dev/null info "$CONTAINER")"
if ! grep -q '^Status: RUNNING$' <<<"$container_info"; then
  start_container
fi

device_config="$(incus </dev/null config device show "$CONTAINER")"
if ! grep -q '^appserver-socket:' <<<"$device_config"; then
  incus </dev/null config device add "$CONTAINER" appserver-socket disk \
    source="$SOCKET_DIR" path="$CONTAINER_SOCKET_DIR" shift=true
fi

incus </dev/null exec "$CONTAINER" -- chown agent:agent "$CONTAINER_SOCKET_DIR"
incus </dev/null exec "$CONTAINER" -- chmod 0711 "$CONTAINER_SOCKET_DIR"
ln -sfn "$SOCKET_PATH" "$WEBGUI_SOCKET"
/usr/local/emhttp/plugins/unraid-codex/scripts/configure-nginx.sh install

incus </dev/null exec "$CONTAINER" -- install -d -o agent -g agent -m 0700 \
  "$CONTAINER_CONFIG_DIR" "$CODEX_CONFIG_DIR"

MCP_URL="$(read_env_value UNRAID_MCP_URL)"
MCP_PROXY_HOST="$(read_env_value UNRAID_MCP_PROXY_HOST)"
MCP_CONFIG_TMP="$(mktemp /tmp/unraid-codex-config.XXXXXX)"
chmod 0600 "$MCP_CONFIG_TMP"

if [[ -n "$MCP_URL" ]]; then
  if ! grep -Eq '^https://[A-Za-z0-9.-]+(:[0-9]+)?(/[^[:space:]]*)?$' <<<"$MCP_URL" ||
    grep -Eq '["\\]' <<<"$MCP_URL"; then
    logger -t unraid-codex "UNRAID_MCP_URL must be a valid HTTPS URL"
    exit 1
  fi
  MCP_URL_HOST="${MCP_URL#https://}"
  MCP_URL_HOST="${MCP_URL_HOST%%/*}"
  MCP_URL_HOST="${MCP_URL_HOST%%:*}"
  awk -v url="$MCP_URL" '
    $0 == "url = \"__UNRAID_MCP_URL__\"" { print "url = \"" url "\""; next }
    { print }
  ' "$MCP_CONFIG_TEMPLATE" > "$MCP_CONFIG_TMP"
else
  printf '# Unraid MCP is not configured. Set UNRAID_MCP_URL in %s.\n' \
    "$MCP_SECRET" > "$MCP_CONFIG_TMP"
fi

MCP_HOSTS_ENTRY=""
if [[ -n "$MCP_URL" && -n "$MCP_PROXY_HOST" ]]; then
  if ! grep -Eq '^[A-Za-z0-9.-]+$' <<<"$MCP_PROXY_HOST"; then
    logger -t unraid-codex "UNRAID_MCP_PROXY_HOST contains invalid characters"
    exit 1
  fi
  MCP_PROXY_IP="$(
    incus </dev/null exec "$CONTAINER" -- getent ahostsv4 "$MCP_PROXY_HOST" 2>/dev/null |
      awk 'NR == 1 { print $1; exit }' || true
  )"
  if grep -Eq '^([0-9]{1,3}\.){3}[0-9]{1,3}$' <<<"$MCP_PROXY_IP"; then
    MCP_HOSTS_ENTRY="$MCP_PROXY_IP\t$MCP_URL_HOST\t# unraid-codex-mcp"
    logger -t unraid-codex "Routed $MCP_URL_HOST through Tailscale peer $MCP_PROXY_HOST"
  else
    logger -t unraid-codex "Could not resolve MCP proxy host $MCP_PROXY_HOST; continuing without an override"
  fi
fi

incus </dev/null exec "$CONTAINER" -- sh -c \
  "grep -v -F '# unraid-codex-mcp' /etc/hosts > /tmp/hosts.unraid-codex || true; if [ -n '$MCP_HOSTS_ENTRY' ]; then printf '%b\n' '$MCP_HOSTS_ENTRY' >> /tmp/hosts.unraid-codex; fi; cat /tmp/hosts.unraid-codex > /etc/hosts; rm -f /tmp/hosts.unraid-codex"

incus </dev/null file push "$MCP_CONFIG_TMP" \
  "$CONTAINER$CODEX_CONFIG_DIR/config.toml"
incus </dev/null exec "$CONTAINER" -- chown agent:agent "$CODEX_CONFIG_DIR/config.toml"
incus </dev/null exec "$CONTAINER" -- chmod 0600 "$CODEX_CONFIG_DIR/config.toml"
if [[ -s "$MCP_SECRET" ]]; then
  incus </dev/null file push "$MCP_SECRET" "$CONTAINER$CONTAINER_CONFIG_DIR/env"
  incus </dev/null exec "$CONTAINER" -- chown agent:agent "$CONTAINER_CONFIG_DIR/env"
  incus </dev/null exec "$CONTAINER" -- chmod 0600 "$CONTAINER_CONFIG_DIR/env"
else
  incus </dev/null exec "$CONTAINER" -- rm -f "$CONTAINER_CONFIG_DIR/env"
fi

# Seed the workspace instructions only when the user has not created either
# canonical instruction filename. Subsequent plugin starts preserve edits.
if ! incus </dev/null exec "$CONTAINER" -- test -e "$WORKSPACE_INSTRUCTIONS" &&
  ! incus </dev/null exec "$CONTAINER" -- test -e /workspace/AGENTS.md; then
  incus </dev/null file push "$WORKSPACE_TEMPLATE" "$CONTAINER$WORKSPACE_INSTRUCTIONS"
  incus </dev/null exec "$CONTAINER" -- chown agent:agent "$WORKSPACE_INSTRUCTIONS"
  incus </dev/null exec "$CONTAINER" -- chmod 0644 "$WORKSPACE_INSTRUCTIONS"
fi
incus </dev/null exec "$CONTAINER" -- sh -c \
  'test -e /workspace/AGENTS.md || ln -s CLAUDE.md /workspace/AGENTS.md'
incus </dev/null exec "$CONTAINER" -- sh -c \
  'test -e /workspace/GEMINI.md || ln -s CLAUDE.md /workspace/GEMINI.md'

incus </dev/null file push \
  /usr/local/emhttp/plugins/unraid-codex/container/codex-appserver.service \
  "$CONTAINER/etc/systemd/system/codex-appserver.service"
incus </dev/null exec "$CONTAINER" -- systemctl daemon-reload
incus </dev/null exec "$CONTAINER" -- systemctl enable codex-appserver.service
incus </dev/null exec "$CONTAINER" -- systemctl restart codex-appserver.service

socket_ready=0
for _ in $(seq 1 50); do
  if [[ -S "$SOCKET_PATH" ]]; then
    socket_ready=1
    break
  fi
  sleep 0.2
done
if [[ "$socket_ready" -ne 1 ]]; then
  logger -t unraid-codex "App-server service started but $SOCKET_PATH did not become ready"
  exit 1
fi

logger -t unraid-codex "Codex app-server restarted in $CONTAINER and the WebGUI socket is ready"
