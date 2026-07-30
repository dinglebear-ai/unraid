#!/usr/bin/env bash
set -euo pipefail

# Compatibility entry point for existing one-line installation URLs. Keep the
# implementation in scripts/install.sh so local and remote installs share one
# x86_64-only contract.
SCRIPT_URL="https://raw.githubusercontent.com/dinglebear-ai/unraid/main/unraid-rs/scripts/install.sh"
SCRIPT_DIR="$(CDPATH='' cd -- "$(dirname -- "${BASH_SOURCE[0]}")" 2>/dev/null && pwd || true)"

if [[ -n "${SCRIPT_DIR}" && -f "${SCRIPT_DIR}/scripts/install.sh" ]]; then
  exec bash "${SCRIPT_DIR}/scripts/install.sh" "$@"
fi

if ! command -v curl >/dev/null 2>&1; then
  printf 'error: curl is required to download the installer\n' >&2
  exit 1
fi

curl -fsSL "${SCRIPT_URL}" | bash -s -- "$@"
