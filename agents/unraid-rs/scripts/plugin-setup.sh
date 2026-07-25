#!/usr/bin/env bash
# SessionStart / ConfigChange hook for the Unraid plugin.
set -euo pipefail

binary="${UNRAID_RMCP_BIN:-runraid}"

if ! command -v "${binary}" >/dev/null 2>&1; then
  printf 'unraid plugin setup: runraid is not installed or not on PATH.\n' >&2
  printf 'Install runraid separately, then run: runraid setup\n' >&2
  exit 0
fi

exec "${binary}" setup plugin-hook "$@"
