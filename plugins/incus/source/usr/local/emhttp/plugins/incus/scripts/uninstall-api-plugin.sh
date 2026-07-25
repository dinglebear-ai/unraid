#!/bin/bash
set -euo pipefail

TARGET="/usr/local/unraid-api/node_modules/unraid-api-plugin-incus"
REGISTRATION="/usr/local/emhttp/plugins/incus/scripts/api-plugin-registration.sh"
if command -v unraid-api >/dev/null; then
  unraid-api stop || true
  "$REGISTRATION" unregister || {
    unraid-api start || true
    logger -t incus "API backend registration removal failed"
    exit 1
  }
fi
rm -rf "$TARGET" "${TARGET}.rollback" "${TARGET}.new."*
if command -v unraid-api >/dev/null; then
  unraid-api start || {
    logger -t incus "API backend removed but unraid-api reload failed"
    exit 1
  }
fi
logger -t incus "API backend removed"
