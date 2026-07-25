#!/bin/bash
set -euo pipefail

INCUS_ENV=/usr/local/emhttp/plugins/incus/scripts/incus-env.sh
INCUS_CONFIG=/boot/config/plugins/incus/incus.cfg
CONTAINER=unraid-codex

if [[ -r "$INCUS_ENV" ]]; then
  # shellcheck disable=SC1090
  [[ -r "$INCUS_CONFIG" ]] && source "$INCUS_CONFIG"
  # shellcheck disable=SC1090
  source "$INCUS_ENV"
  export INCUS_DIR
  incus </dev/null exec "$CONTAINER" -- systemctl stop codex-appserver.service 2>/dev/null || true
fi

rm -f /var/run/unraid-codex-appserver.sock
