#!/usr/bin/env bash
# SessionStart / ConfigChange hook for the Unraid plugin.
set -euo pipefail

binary="${UNRAID_RMCP_BIN:-runraid}"

if command -v "${binary}" >/dev/null 2>&1; then
  exec "${binary}" setup plugin-hook "$@"
fi

if command -v crgx >/dev/null 2>&1; then
  exec crgx unraid-rmcp -- setup plugin-hook "$@"
fi

printf 'unraid plugin setup: neither runraid nor crgx is installed or on PATH.\n' >&2
printf 'Install crgx, then retry; it will fetch unraid-rmcp from crates.io.\n' >&2
exit 0
