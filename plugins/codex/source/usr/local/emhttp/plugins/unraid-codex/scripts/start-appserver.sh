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
MCP_SECRET="$PLUGIN_CONFIG/unraid-mcp.env"
MCP_CONFIG_TEMPLATE=/usr/local/emhttp/plugins/unraid-codex/container/codex-config.toml
MCP_CONFIG_TMP=""
INCUS_START_HELPER=/usr/local/emhttp/plugins/incus/scripts/start-instance.sh
ENSURE_STATE=/usr/local/emhttp/plugins/unraid-codex/scripts/ensure-state-volume.sh
PROVISION_CONTAINER=/usr/local/emhttp/plugins/unraid-codex/scripts/provision-container.sh
CONTAINER_CONFIG_DIR=/home/agent/.config/unraid-codex
CONTAINER_RUNTIME_DIR=/usr/local/lib/unraid-codex
CODEX_CONFIG_DIR=/home/agent/.codex
WORKSPACE_INSTRUCTIONS=/workspace/CLAUDE.md
WORKSPACE_TEMPLATE=/usr/local/emhttp/plugins/unraid-codex/container/workspace-CLAUDE.md
MAINTENANCE_SOURCE=/usr/local/emhttp/plugins/unraid-codex/container/codex-maintenance.py
VERIFY_SOURCE=/usr/local/emhttp/plugins/unraid-codex/scripts/verify-codex-cli.sh
UPDATE_CLI=/usr/local/emhttp/plugins/unraid-codex/scripts/update-codex-cli.sh
APPSERVER_SMOKE=/usr/local/emhttp/plugins/unraid-codex/scripts/appserver-smoke.py

cleanup() {
  [[ -n "$MCP_CONFIG_TMP" ]] && rm -f "$MCP_CONFIG_TMP"
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

[[ -x "$PROVISION_CONTAINER" ]] || {
  logger -t unraid-codex "Codex container provisioner is unavailable: $PROVISION_CONTAINER"
  exit 1
}
"$PROVISION_CONTAINER"

container_info="$(incus </dev/null info "$CONTAINER")"
if ! grep -q '^Status: RUNNING$' <<<"$container_info"; then
  [[ -x "$INCUS_START_HELPER" ]] || {
    logger -t unraid-codex "Incus start helper is unavailable: $INCUS_START_HELPER"
    exit 1
  }
  "$INCUS_START_HELPER" "$CONTAINER"
fi

[[ -x "$ENSURE_STATE" ]] || {
  logger -t unraid-codex "Codex state-volume helper is unavailable: $ENSURE_STATE"
  exit 1
}
"$ENSURE_STATE"

device_config="$(incus </dev/null config device show "$CONTAINER")"
if ! grep -q '^appserver-socket:' <<<"$device_config"; then
  incus </dev/null config device add "$CONTAINER" appserver-socket disk \
    source="$SOCKET_DIR" path="$CONTAINER_SOCKET_DIR" shift=true
fi

incus </dev/null exec "$CONTAINER" -- chown agent:agent "$CONTAINER_SOCKET_DIR"
incus </dev/null exec "$CONTAINER" -- chmod 0711 "$CONTAINER_SOCKET_DIR"
ln -sfn "$SOCKET_PATH" "$WEBGUI_SOCKET"

incus </dev/null exec "$CONTAINER" -- install -d -o agent -g agent -m 0700 \
  "$CONTAINER_CONFIG_DIR" "$CODEX_CONFIG_DIR"
incus </dev/null exec "$CONTAINER" -- install -d -o root -g root -m 0755 "$CONTAINER_RUNTIME_DIR"
for runtime_source in "$MAINTENANCE_SOURCE" "$VERIFY_SOURCE"; do
  runtime_name="$(basename "$runtime_source")"
  incus </dev/null file push "$runtime_source" "$CONTAINER$CONTAINER_RUNTIME_DIR/$runtime_name"
  incus </dev/null exec "$CONTAINER" -- chown root:root "$CONTAINER_RUNTIME_DIR/$runtime_name"
  incus </dev/null exec "$CONTAINER" -- chmod 0755 "$CONTAINER_RUNTIME_DIR/$runtime_name"
done

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
  incus </dev/null exec "$CONTAINER" -- chown root:root "$CONTAINER_CONFIG_DIR/env"
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
effective_execstart="$(incus </dev/null exec "$CONTAINER" -- \
  systemctl show codex-appserver.service --property=ExecStart --value)"
if ! grep -Fq -- '--listen unix:///mnt/unraid-codex/appserver.sock' <<<"$effective_execstart"; then
  logger -t unraid-codex \
    "Codex service transport is overridden; expected Unix socket ExecStart"
  exit 1
fi
[[ -x "$UPDATE_CLI" ]] || { logger -t unraid-codex "Codex updater is unavailable: $UPDATE_CLI"; exit 1; }
"$UPDATE_CLI"
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
python3 "$APPSERVER_SMOKE" "$SOCKET_PATH" || {
  logger -t unraid-codex "App-server socket opened but protocol initialization failed"
  exit 1
}

# Publish the browser route only after the backend has completed a real protocol
# handshake. A failed service start must not leave nginx pointing at a dead socket.
/usr/local/emhttp/plugins/unraid-codex/scripts/configure-nginx.sh install
/usr/local/emhttp/plugins/unraid-codex/scripts/configure-schedule.sh install
logger -t unraid-codex "Codex app-server restarted in $CONTAINER and the WebGUI socket is ready"
