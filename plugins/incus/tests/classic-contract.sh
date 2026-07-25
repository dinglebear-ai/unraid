#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CFG="$ROOT/source/usr/local/emhttp/plugins/incus/incus.cfg"
INIT="$ROOT/source/usr/local/emhttp/plugins/incus/scripts/incus-init.sh"
MIGRATE="$ROOT/source/usr/local/emhttp/plugins/incus/scripts/migrate-config.sh"
VALIDATE="$ROOT/source/usr/local/emhttp/plugins/incus/scripts/config-validation.sh"
APPLY="$ROOT/source/usr/local/emhttp/plugins/incus/scripts/apply-settings.sh"
PREPARE_IDMAP="$ROOT/source/usr/local/emhttp/plugins/incus/scripts/prepare-idmap.sh"
API_REGISTRATION="$ROOT/source/usr/local/emhttp/plugins/incus/scripts/api-plugin-registration.sh"
INSTALL_API="$ROOT/source/usr/local/emhttp/plugins/incus/scripts/install-api-plugin.sh"
UNINSTALL_API="$ROOT/source/usr/local/emhttp/plugins/incus/scripts/uninstall-api-plugin.sh"
PLG="$ROOT/incus.plg"
BUILD_CLASSIC="$ROOT/scripts/build-classic-package.sh"
VERIFY_CLASSIC="$ROOT/scripts/verify-classic-package.sh"

for unsafe_build in 48 49 50 51 52; do
  unsafe_archive="$ROOT/packages/incus-unraid-7.0.0-${unsafe_build}-x86_64-1.txz"
  [ ! -e "$unsafe_archive" ] || {
    echo "unsafe package build remains published: ${unsafe_archive#"$ROOT"/}" >&2
    exit 1
  }
done
"$ROOT/tests/package-directory-modes.sh"

grep -Eq 'ACL_BLOCK=.*100\.64\.0\.0/10' "$CFG"
grep -Fq 'Block host bridge and peer containers' "$INIT"
grep -Fq 'destination_port: \"53\"' "$INIT"
grep -Fq 'JAIL_IPV6 must remain' "$INIT"
grep -Fq 'render_bind_mounts' "$INIT"
# Literal implementation contract, not a shell expression in this test.
# shellcheck disable=SC2016
grep -Fq 'mode="${mode:-ro}"' "$INIT"
grep -Fq 'config bind mounts must be read-only' "$INIT"
grep -Fq 'readonly: "true"' "$INIT"
grep -Fq 'validate_containment_config' "$APPLY"
grep -Fq 'prepare_storage_config' "$APPLY"
grep -Fq 'prepare_storage_config' "$ROOT/source/usr/local/emhttp/plugins/incus/scripts/incus-preflight.sh"
grep -Fq 'chown "${JAIL_AGENT_UID}:${JAIL_AGENT_GID}" "${JAIL_WORKSPACE_ROOT}/default-workspace"' "$INIT"
grep -Fq 'chmod 0750 "${JAIL_WORKSPACE_ROOT}/default-workspace"' "$INIT"
env_source_line="$(grep -n '\. "${EMHTTP}/scripts/incus-env.sh"' "$ROOT/source/usr/local/emhttp/plugins/incus/scripts/incus-preflight.sh" | cut -d: -f1)"
tool_check_line="$(grep -n 'command -v unsquashfs' "$ROOT/source/usr/local/emhttp/plugins/incus/scripts/incus-preflight.sh" | cut -d: -f1)"
[ -n "$env_source_line" ]
[ "$env_source_line" -lt "$tool_check_line" ]
grep -Fq 'PLUGIN_BUILD="$(head -n 1 "$BUILD_ID_FILE"' "$ROOT/source/usr/local/emhttp/plugins/incus/scripts/rc.incus"
grep -Fq 'PLUGIN_BUILD="$(head -n 1 "$BUILD_ID_FILE"' "$ROOT/source/usr/local/emhttp/plugins/incus/scripts/incus-watchdog.sh"
! grep -Eq 'build=2026\.[0-9]{2}\.[0-9]{2}' "$ROOT/source/usr/local/emhttp/plugins/incus/scripts/"{rc.incus,incus-watchdog.sh}
grep -Fq 'release="$(jq -er '\''.release'\'' "$ROOT/release-manifest.json")"' "$BUILD_CLASSIC"
grep -Fq '>"$stage/usr/local/emhttp/plugins/incus/build-id"' "$BUILD_CLASSIC"
# Fresh installs must create the persistent config before API activation. The
# backend chooses its config path once in its constructor during that restart.
config_bootstrap_line="$(grep -n 'cp "&emhttp;/incus.cfg" "&plugin;/incus.cfg" || exit 1' "$PLG" | cut -d: -f1)"
api_activation_line="$(grep -n 'if ! &emhttp;/scripts/install-api-plugin.sh' "$PLG" | cut -d: -f1)"
[ -n "$config_bootstrap_line" ]
[ -n "$api_activation_line" ]
[ "$config_bootstrap_line" -lt "$api_activation_line" ]
grep -Fq '"$REGISTRATION" register' "$INSTALL_API"
grep -Fq '"$REGISTRATION" unregister' "$UNINSTALL_API"
grep -Fq 'removepkg &txz;' "$PLG"
# Literal workflow contract, not a shell expression in this test.
# shellcheck disable=SC2016
# The incus API CI workflow now lives at the monorepo root (path-scoped to the
# plugins/incus subtree) after the consolidation; its filters are re-pathed.
API_CI="$(cd "$ROOT/../.." && pwd)/.github/workflows/incus-api-ci.yml"
grep -Fq 'diff -qr dist "$payload/dist"' "$API_CI"
[ "$(grep -Fc '      - "plugins/incus/packages/**"' "$API_CI")" -eq 2 ]
[ "$(grep -Fc '      - "plugins/incus/incus.plg"' "$API_CI")" -eq 2 ]
grep -Fq 'archive entry count differs from release manifest' "$ROOT/scripts/verify-classic-package.sh"
grep -Fq 'find "$stage" -type d -exec chmod 0755 {} +' "$BUILD_CLASSIC"
grep -Fq 'archive must not contain a root directory entry' "$VERIFY_CLASSIC"
grep -Fq 'required executable is not executable in archive' "$VERIFY_CLASSIC"
grep -Fq 'required helper smoke invocation failed' "$VERIFY_CLASSIC"
grep -Fq 'unresolved shared libraries for' "$VERIFY_CLASSIC"
for executable in distrobuilder debootstrap ar mksquashfs zstd zstdcat unzstd; do
  [ -x "$ROOT/source/usr/local/incus/bin/$executable" ] || {
    echo "tracked helper is not executable: usr/local/incus/bin/$executable" >&2
    exit 1
  }
done
plugin_name="$(sed -n 's/.*<!ENTITY name[[:space:]]*"\([^"]*\)".*/\1/p' "$PLG")"
txz="$(sed -n 's/.*<!ENTITY txz[[:space:]]*"\([^"]*\)".*/\1/p' "$PLG")"
txz="${txz//&name;/$plugin_name}"
archive="$ROOT/packages/$txz"
# The .txz plugin payload is a GitHub release asset (not tracked in git after the
# monorepo consolidation). Run the archive-shape checks only when it is present
# (post-build / release CI); otherwise the source-level checks below are the gate.
if [ -f "$archive" ]; then
  root_entries="$(tar -tJf "$archive" | awk '$0 == "./" { count++ } END { print count+0 }')"
  [ "$root_entries" -eq 0 ]
  bad_directory_mode="$(
    tar -tvJf "$archive" |
      awk '$1 ~ /^d/ && $1 != "drwxr-xr-x" && bad == "" { bad=$NF } END { print bad }'
  )"
  [ -z "$bad_directory_mode" ]
fi
for script in "$ROOT"/source/usr/local/emhttp/plugins/incus/scripts/*.sh "$ROOT"/source/usr/local/emhttp/plugins/incus/event/*; do
  bash -n "$script"
done

# Disabled candidates are validated before apply-settings can promote them to
# known-good. Exercise the shared side-effect-free validator directly so this
# safety boundary remains testable without an Incus daemon.
validate_config() (
  export JAIL_WORKSPACE_ROOT="$1"
  export JAIL_BIND_MOUNTS="$2"
  # shellcheck source=/dev/null
  . "$VALIDATE"
  validate_containment_config
)
validate_config "/srv/agent-jails" ""
if validate_config "/etc" ""; then
  echo "unsafe workspace root unexpectedly passed validation" >&2
  exit 1
fi
if validate_config "/srv/agent-jails" "/etc:/host:rw"; then
  echo "unsafe bind source unexpectedly passed validation" >&2
  exit 1
fi

# Storage preparation creates missing directories and performs a real
# write/rename/delete probe. Test-only /tmp allowance keeps this host-neutral;
# production accepts only /srv and /mnt.
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

# incusd reads the system idmap only at daemon startup. The preflight path
# therefore has to create root's subordinate ranges before rc.incus launches
# the daemon, and repeated boots must not duplicate existing mappings.
subuid="$tmp/subuid"
subgid="$tmp/subgid"
printf 'podman:200000:65536\n' >"$subuid"
: >"$subgid"
SUBUID_FILE="$subuid" SUBGID_FILE="$subgid" "$PREPARE_IDMAP"
SUBUID_FILE="$subuid" SUBGID_FILE="$subgid" "$PREPARE_IDMAP"
[ "$(grep -c '^root:1000000:1000000000$' "$subuid")" -eq 1 ]
[ "$(grep -c '^root:1000000:1000000000$' "$subgid")" -eq 1 ]
grep -Fqx 'podman:200000:65536' "$subuid"
grep -Fq '"${EMHTTP}/scripts/prepare-idmap.sh"' \
  "$ROOT/source/usr/local/emhttp/plugins/incus/scripts/incus-preflight.sh"

storage_root="$tmp/storage-paths"
storage_config() (
  # shellcheck source=/dev/null
  . "$VALIDATE"
  prepare_storage_config
)
INCUS_TEST_ALLOW_TMP=1 INCUS_DIR="$storage_root/state" \
  JAIL_WORKSPACE_ROOT="$storage_root/workspaces" STORAGE_DRIVER=dir \
  storage_config
[ -d "$storage_root/state" ]
[ -d "$storage_root/workspaces" ]
[ -z "$(find "$storage_root" -name '.incus-write-test.*' -print -quit)" ]
printf 'not-a-directory\n' >"$storage_root/file"
if INCUS_TEST_ALLOW_TMP=1 INCUS_DIR="$storage_root/file" \
   JAIL_WORKSPACE_ROOT="$storage_root/workspaces" STORAGE_DRIVER=dir \
   storage_config; then
  echo "non-directory INCUS_DIR unexpectedly passed validation" >&2
  exit 1
fi
if (
  mktemp() { return 1; }
  export INCUS_TEST_ALLOW_TMP=1 INCUS_DIR="$storage_root/state"
  export JAIL_WORKSPACE_ROOT="$storage_root/workspaces" STORAGE_DRIVER=dir
  # shellcheck source=/dev/null
  . "$VALIDATE"
  prepare_storage_config
); then
  echo "unwritable storage path unexpectedly passed validation" >&2
  exit 1
fi

# ZFS preparation creates a missing dataset and proves it accepts and removes
# a disposable snapshot. Functions provide a deterministic fake ZFS host.
zfs_log="$tmp/zfs.log"
(
  dataset_exists=0
  zpool() { [ "$1" = list ] && [ "$2" = cache ]; }
  zfs() {
    case "$1" in
      list)
        if [ "${2:-}" = "-H" ]; then printf 'filesystem\n'; return 0; fi
        [ "$dataset_exists" = 1 ]
        ;;
      create) dataset_exists=1; printf '%s\n' "$*" >>"$zfs_log" ;;
      snapshot|destroy) printf '%s\n' "$*" >>"$zfs_log" ;;
      *) return 1 ;;
    esac
  }
  # shellcheck source=/dev/null
  . "$VALIDATE"
  prepare_zfs_storage_source cache/incus/storage
)
grep -Fqx 'create -p cache/incus/storage' "$zfs_log"
grep -Eq '^snapshot cache/incus/storage@incus-write-test-[0-9]+$' "$zfs_log"
grep -Eq '^destroy cache/incus/storage@incus-write-test-[0-9]+$' "$zfs_log"

# A preserved pre-hardening config and its rollback copy must both gain the
# CGNAT block exactly once; a second run is a no-op via the version marker.
cat >"$tmp/incus.cfg" <<'EOF'
SERVICE="disabled"
ACL_BLOCK="10.0.0.0/8,172.16.0.0/12,192.168.0.0/16,169.254.0.0/16"
EOF
cp "$tmp/incus.cfg" "$tmp/incus.cfg.known-good"
INCUS_CFG_PATH="$tmp/incus.cfg" "$MIGRATE"
INCUS_CFG_PATH="$tmp/incus.cfg" "$MIGRATE"
for migrated in "$tmp/incus.cfg" "$tmp/incus.cfg.known-good"; do
  [ "$(grep -o '100\.64\.0\.0/10' "$migrated" | wc -l)" -eq 1 ]
done

# Current unraid-api releases discover third-party modules only when the
# package is present in node_modules, named in api.json, and declared in the
# API root package.json. Registration must be idempotent and preserve other
# plugins and package metadata.
cat >"$tmp/package.json" <<'EOF'
{"name":"@unraid/api","dependencies":{"unraid-api-plugin-connect":"file:connect.tgz"},"private":true}
EOF
cat >"$tmp/api.json" <<'EOF'
{"version":"test","sandbox":true,"plugins":["unraid-api-plugin-connect"]}
EOF
API_PACKAGE_JSON="$tmp/package.json" API_CONFIG_JSON="$tmp/api.json" "$API_REGISTRATION" register
API_PACKAGE_JSON="$tmp/package.json" API_CONFIG_JSON="$tmp/api.json" "$API_REGISTRATION" register
[ "$(jq -r '.peerDependencies["unraid-api-plugin-incus"]' "$tmp/package.json")" = "*" ]
[ "$(jq '[.plugins[] | select(. == "unraid-api-plugin-incus")] | length' "$tmp/api.json")" -eq 1 ]
[ "$(jq -r '.dependencies["unraid-api-plugin-connect"]' "$tmp/package.json")" = "file:connect.tgz" ]
[ "$(jq -r '.sandbox' "$tmp/api.json")" = "true" ]
API_PACKAGE_JSON="$tmp/package.json" API_CONFIG_JSON="$tmp/api.json" "$API_REGISTRATION" unregister
[ "$(jq -r '.peerDependencies["unraid-api-plugin-incus"] // "missing"' "$tmp/package.json")" = "missing" ]
[ "$(jq '[.plugins[] | select(. == "unraid-api-plugin-incus")] | length' "$tmp/api.json")" -eq 0 ]
[ "$(jq -r '.dependencies["unraid-api-plugin-connect"]' "$tmp/package.json")" = "file:connect.tgz" ]

# The live boundary suite is deliberately opt-in because it needs Incus and
# network privileges on a disposable Unraid host.
if [ "${INCUS_LIVE_TEST:-0}" = "1" ]; then
  "$ROOT/tests/live-isolation.sh"
fi

echo "classic contract checks passed"
