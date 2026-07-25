#!/bin/bash
set -euo pipefail

INCUS_ENV=/usr/local/emhttp/plugins/incus/scripts/incus-env.sh
INCUS_CONFIG=/boot/config/plugins/incus/incus.cfg
CONTAINER=unraid-codex
SOCKET_DIR=/run/unraid-codex
SOCKET_PATH="$SOCKET_DIR/appserver.sock"
WEBGUI_SOCKET=/var/run/unraid-codex-appserver.sock
PLUGIN_CONFIG=/boot/config/plugins/unraid-codex
MCP_SECRET="$PLUGIN_CONFIG/unraid-mcp.env"
CONTAINER_CONFIG_DIR=/home/agent/.config/unraid-codex
CODEX_CONFIG_DIR=/home/agent/.codex
WORKSPACE_INSTRUCTIONS=/workspace/CLAUDE.md
WORKSPACE_TEMPLATE=/usr/local/emhttp/plugins/unraid-codex/container/workspace-CLAUDE.md

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
  incus </dev/null start "$CONTAINER"
fi

device_config="$(incus </dev/null config device show "$CONTAINER")"
if ! grep -q '^appserver-socket:' <<<"$device_config"; then
  incus </dev/null config device add "$CONTAINER" appserver-socket disk \
    source="$SOCKET_DIR" path=/run/unraid-codex shift=true
fi

incus </dev/null exec "$CONTAINER" -- chown agent:agent /run/unraid-codex
incus </dev/null exec "$CONTAINER" -- chmod 0711 /run/unraid-codex
ln -sfn "$SOCKET_PATH" "$WEBGUI_SOCKET"
/usr/local/emhttp/plugins/unraid-codex/scripts/configure-nginx.sh install

incus </dev/null exec "$CONTAINER" -- install -d -o agent -g agent -m 0700 \
  "$CONTAINER_CONFIG_DIR" "$CODEX_CONFIG_DIR"
incus </dev/null file push \
  /usr/local/emhttp/plugins/unraid-codex/container/codex-config.toml \
  "$CONTAINER$CODEX_CONFIG_DIR/config.toml"
incus </dev/null exec "$CONTAINER" -- chown agent:agent "$CODEX_CONFIG_DIR/config.toml"
incus </dev/null exec "$CONTAINER" -- chmod 0600 "$CODEX_CONFIG_DIR/config.toml"
if [[ -s "$MCP_SECRET" ]]; then
  incus </dev/null file push "$MCP_SECRET" "$CONTAINER$CONTAINER_CONFIG_DIR/env"
  incus </dev/null exec "$CONTAINER" -- chown agent:agent "$CONTAINER_CONFIG_DIR/env"
  incus </dev/null exec "$CONTAINER" -- chmod 0600 "$CONTAINER_CONFIG_DIR/env"
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
incus </dev/null exec "$CONTAINER" -- systemctl enable --now codex-appserver.service
logger -t unraid-codex "Codex app-server started in $CONTAINER"
