#!/usr/bin/env bash
# SessionStart / ConfigChange hook for the Unraid plugin.
set -euo pipefail

binary="${UNRAID_RMCP_BIN:-runraid}"

if command -v "${binary}" >/dev/null 2>&1; then
  exec "${binary}" setup plugin-hook "$@"
fi

if command -v npx >/dev/null 2>&1; then
  exec npx -y @dinglebear/unraid setup plugin-hook "$@"
fi

printf 'unraid plugin setup: neither runraid nor npx is installed or on PATH.\n' >&2
printf 'Install Node.js with npx, then retry; it will fetch @dinglebear/unraid from npm.\n' >&2
exit 0
