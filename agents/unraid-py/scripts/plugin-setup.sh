#!/usr/bin/env bash
# Persist the plugin's userConfig credentials to ~/.unraid-mcp/.env.
# Runs `unraid-mcp setup plugin-hook` via uvx (the published PyPI package).
# Idempotent: writing identical credentials is a no-op-equivalent rewrite.
#
# ADVISORY hook (SessionStart / ConfigChange): persisting credentials is a
# convenience — the MCP server also receives them directly via the plugin's
# .mcp.json env — so a missing `uvx`, no network, or a setup error must NEVER
# block the session. Every failure path warns to stderr (greppable) and exits 0.
set -uo pipefail

if ! command -v uvx >/dev/null 2>&1; then
  echo "plugin-setup.sh: 'uvx' not found on PATH — skipping credential persistence." \
       "Install uv (https://docs.astral.sh/uv/) to enable it." >&2
  exit 0
fi

if ! uvx unraid-mcp setup plugin-hook; then
  echo "plugin-setup.sh: credential setup hook failed (uvx/network/setup error) —" \
       "continuing; the server still receives credentials via the plugin env." >&2
fi

exit 0
