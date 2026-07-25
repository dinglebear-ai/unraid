#!/bin/bash
# incus-preflight.sh — verify the host can actually run incusd BEFORE we start it.
# Prints a clear pass/fail report. Non-zero exit = do not start the daemon.
# The configured persistent directories and ZFS source are created if missing
# and exercised with disposable write probes before the daemon starts.

PREFIX="/usr/local/incus"
CFG="/boot/config/plugins/incus/incus.cfg"
EMHTTP="/usr/local/emhttp/plugins/incus"
FAIL=0
say() { printf '  %-22s %s\n' "$1" "$2"; }

[ -f "${EMHTTP}/scripts/incus-env.sh" ] || {
  echo "PREFLIGHT: FAIL — ${EMHTTP}/scripts/incus-env.sh is missing" >&2
  exit 1
}
. "${EMHTTP}/scripts/incus-env.sh"
[ -f "$CFG" ] && . "$CFG"
. "${EMHTTP}/scripts/config-validation.sh"

echo "== Incus preflight =="

# Incus reads the system idmap at daemon startup, so subordinate ranges must
# exist during preflight rather than in the post-start environment reconciler.
if "${EMHTTP}/scripts/prepare-idmap.sh"; then
  say "subordinate ids" "root ranges ready"
else
  say "subordinate ids" "FAIL — could not prepare /etc/subuid and /etc/subgid"
  FAIL=1
fi

# 1) glibc >= 2.38 (incusd requires libc6 >= 2.38)
GLIBC="$(ldd --version 2>/dev/null | head -1 | grep -oE '[0-9]+\.[0-9]+' | head -1)"
if [ -n "$GLIBC" ] && awk "BEGIN{exit !($GLIBC >= 2.38)}"; then
  say "glibc $GLIBC" "OK (>= 2.38)"
else
  say "glibc ${GLIBC:-unknown}" "FAIL — incusd needs >= 2.38"; FAIL=1
fi

# 2) Standard libs incusd needs. Most fall through to the host loader path;
#    a few (libselinux, libfuse3, libaudit + their own deps) aren't guaranteed
#    present on Unraid, so we bundle those ourselves into ${PREFIX}/lib. Check
#    both locations — only host-reliant libs missing from BOTH are fatal here.
#    (Step 3 below re-validates via the real incusd binary as the final word.)
for lib in libselinux.so.1 libseccomp.so.2 libsqlite3.so.0 libudev.so.1 \
           libcap.so.2 libacl.so.1 libdbus-1.so.3 libfuse3.so.4 \
           libgcc_s.so.1 libbsd.so.0 libaudit.so.1; do
  if [ -e "${PREFIX}/lib/${lib}" ]; then
    say "$lib" "found (bundled)"
  elif ldconfig -p 2>/dev/null | grep -q "$lib" || \
     find /lib /lib64 /usr/lib /usr/lib64 -name "$lib" 2>/dev/null | grep -q .; then
    say "$lib" "found (host)"
  else
    say "$lib" "MISSING — bundle it into ${PREFIX}/lib"; FAIL=1
  fi
done

# 3) unsquashfs — incusd shells out to it at startup (image/rootfs unpacking)
#    and exits immediately if it's not on PATH. Bundled into ${PREFIX}/bin,
#    which incus-env.sh puts on PATH ahead of the host.
if command -v unsquashfs >/dev/null; then
  say "unsquashfs" "found"
else
  say "unsquashfs" "MISSING — bundle it into ${PREFIX}/bin"; FAIL=1
fi

# 3b) nft — the LAN-ban ACL feature requires the nftables firewall driver,
#     which shells out to `nft` to apply rules. Without it, ACL operations
#     (network acl create/edit) hang rather than failing cleanly. Bundled
#     into ${PREFIX}/bin.
if command -v nft >/dev/null; then
  say "nft" "found"
else
  say "nft" "MISSING — bundle it into ${PREFIX}/bin (ACL creation will hang)"; FAIL=1
fi

# 4) Confirm our bundled loader resolves for incusd (catches any lib we missed).
if command -v ldd >/dev/null; then
  MISS="$(LD_LIBRARY_PATH="${PREFIX}/lib" ldd "${PREFIX}/libexec/incus/incusd" 2>/dev/null | awk '/not found/{print $1}')"
  if [ -z "$MISS" ]; then say "incusd link" "all resolved"; else
    say "incusd link" "UNRESOLVED: $MISS"; FAIL=1; fi
fi

# 5) cgroup v2 (incus 7.x prefers unified hierarchy).
CG="$(stat -fc %T /sys/fs/cgroup 2>/dev/null)"
if [ "$CG" = "cgroup2fs" ]; then say "cgroup" "v2 (unified) OK"
else say "cgroup" "v1/hybrid ($CG) — works but deprecated"; fi

# 6) user namespaces (needed for unprivileged containers).
if [ "$(cat /proc/sys/kernel/unprivileged_userns_clone 2>/dev/null || echo 1)" = "1" ]; then
  say "userns" "enabled"
else
  say "userns" "disabled — only privileged containers will work"
fi

# 7) uid-mapping helpers (unprivileged containers).
if command -v newuidmap >/dev/null && command -v newgidmap >/dev/null; then
  say "uidmap" "newuidmap/newgidmap present"
else
  say "uidmap" "absent — bundle uidmap for unprivileged containers"
fi

# 8) Persistent storage must be usable before incusd starts. This creates
#    missing configured directories/datasets and performs real disposable
#    write/rename/delete (directories) and snapshot/destroy (ZFS) probes.
if storage_error="$(prepare_storage_config 2>&1)"; then
  say "storage paths" "created/verified writable"
else
  say "storage paths" "FAIL — $storage_error"; FAIL=1
fi

echo ""
[ "$FAIL" = 0 ] && echo "PREFLIGHT: PASS" || echo "PREFLIGHT: FAIL (see above)"
exit $FAIL
