#!/bin/bash
# Scoped runtime environment for the bundled Python. Sourced ONLY by
# rc.unraid-mcp — never by login shells — so the bundled interpreter and its
# shared libraries can never shadow host binaries for anything else.
# (Same isolation pattern as incus-unraid's incus-env.sh.)

UNRAID_MCP_PREFIX="/usr/local/unraid-mcp"

export PATH="${UNRAID_MCP_PREFIX}/python/bin:${PATH}"
export LD_LIBRARY_PATH="${UNRAID_MCP_PREFIX}/python/lib${LD_LIBRARY_PATH:+:${LD_LIBRARY_PATH}}"

# The app reads all credentials/config from this dir (UNRAID_CREDENTIALS_DIR is
# a first-class override in unraid_mcp.config.settings). /boot is the flash
# drive — the only rootfs path that survives Unraid's RAM-based boot.
export UNRAID_CREDENTIALS_DIR="/boot/config/plugins/unraid-mcp"

# Keep bytecode out of the read-mostly runtime tree.
export PYTHONDONTWRITEBYTECODE=1
