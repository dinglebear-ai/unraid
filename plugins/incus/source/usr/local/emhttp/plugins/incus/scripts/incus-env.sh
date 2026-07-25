#!/bin/bash
# incus-env.sh — sourced by the wrapper + rc script.
# Scopes Incus's runtime to a private prefix so we NEVER shadow host libraries
# for any other process on the Unraid box. Bundled incus-specific libs win;
# everything standard (libc, libselinux, libseccomp, libsqlite3, ...) falls
# through to the host loader path.

INCUS_PREFIX="/usr/local/incus"

# Bundled libs first, then host. Because this is exported only into incusd's
# own process environment (via the wrapper / rc script), no other binary on the
# system ever sees these .so files.
export LD_LIBRARY_PATH="${INCUS_PREFIX}/lib${LD_LIBRARY_PATH:+:${LD_LIBRARY_PATH}}"

# So incusd finds `incus`, `lxcfs`, and its libexec helpers.
export PATH="${INCUS_PREFIX}/bin:${INCUS_PREFIX}/libexec/incus:${PATH}"

# Persistent state on the array (survives Unraid's RAM-boot). Override in
# /boot/config/plugins/incus/incus.cfg if you want it elsewhere / on a ZFS dataset.
export INCUS_DIR="${INCUS_DIR:-/mnt/user/appdata/incus}"

# lxcfs runtime dir (container /proc virtualization).
export INCUS_LXCFS_DIR="${INCUS_PREFIX}/libexec/lxcfs"
