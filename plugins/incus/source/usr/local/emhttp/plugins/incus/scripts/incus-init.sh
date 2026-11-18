#!/bin/bash
# incus-init.sh — apply the jail environment from incus.cfg.
# Runs on every array start (after incusd is up) and is intended to be re-run:
# objects are created when missing, and the ACL and profile bodies are
# re-applied from incus.cfg on every run. It deletes a same-named host
# interface that Incus reports as unmanaged before creating the managed bridge.
#
# Exit status: 0 ready; 78 configuration rejected (retrying cannot help);
# 75 another run held the lock too long; any other non-zero status may be
# transient and is safe to retry.
set -euo pipefail

# Name the failing line and command. Without this, an unexpected failure under
# set -e exits with no log line and no way to tell which step failed. Steps
# inside functions run only in checked contexts, where bash suppresses ERR, so
# this fires once per failure at the top level.
on_error() {
  local status="$1" line="$2" command="$3" message
  message="FAILED (exit ${status}) at line ${line}: ${command}"
  logger -t incus-init "$message" 2>/dev/null || true
  echo "incus-init: ${message}" >&2
}
trap 'on_error "$?" "$LINENO" "$BASH_COMMAND"' ERR
# ERR does not fire for unbound variables, syntax errors in sourced files, or
# signals. Record every non-zero exit so none of those is silent.
on_exit() {
  local status="$1"
  [ "$status" -eq 0 ] && return 0
  logger -t incus-init "exiting with status ${status}" 2>/dev/null || true
  echo "incus-init: exiting with status ${status}" >&2
}
trap 'on_exit "$?"' EXIT
trap 'exit 143' TERM
trap 'exit 130' INT
EX_LOCKED=75
EX_CONFIG=78

CFG="${INCUS_CONFIG:-/boot/config/plugins/incus/incus.cfg}"
PREFIX="/usr/local/incus"
EMHTTP="${INCUS_EMHTTP:-/usr/local/emhttp/plugins/incus}"
if [ ! -f "${EMHTTP}/scripts/incus-env.sh" ]; then
  echo "incus-init: FATAL — ${EMHTTP}/scripts/incus-env.sh not found" >&2; exit 1
fi
. "${EMHTTP}/scripts/incus-env.sh"   # exports PATH/LD_LIBRARY_PATH/INCUS_DIR
if [ ! -f "$CFG" ]; then
  echo "incus-init: FATAL — $CFG not found" >&2; exit 1
fi
. "$CFG"
INCUS="${INCUS_BIN:-${PREFIX}/bin/incus}"
log() { logger -t incus-init "$*"; echo "incus-init: $*"; }
# A configuration error fails the same way on every attempt.
fatal_config() { log "FATAL: $*"; exit "$EX_CONFIG"; }

# ---------- L6: Prevent concurrent execution ----------
# Wait for a concurrent run (Settings Apply, the watchdog, the installer)
# instead of reporting success for work this run did not do.
LOCKFILE="${INCUS_INIT_LOCK_FILE:-/var/run/incus-init.lock}"
LOCK_TIMEOUT="${INCUS_INIT_LOCK_TIMEOUT:-120}"
exec 200>"$LOCKFILE"
if ! flock -w "$LOCK_TIMEOUT" 200; then
  log "another incus-init.sh run held the lock for ${LOCK_TIMEOUT}s; not reconciled"
  exit "$EX_LOCKED"
fi

# ---------- H1: Ensure default values for all config variables ----------
STORAGE_DRIVER="${STORAGE_DRIVER:-dir}"
STORAGE_SOURCE="${STORAGE_SOURCE:-nvme/incus}"
STORAGE_POOL_NAME="${STORAGE_POOL_NAME:-default}"
JAIL_BRIDGE="${JAIL_BRIDGE:-agentbr0}"
JAIL_SUBNET="${JAIL_SUBNET:-198.18.0.1/24}"
JAIL_NAT="${JAIL_NAT:-true}"
JAIL_IPV6="${JAIL_IPV6:-none}"
ACL_NAME="${ACL_NAME:-agent-block-lan}"
ACL_BLOCK="${ACL_BLOCK:-10.0.0.0/8,172.16.0.0/12,192.168.0.0/16,169.254.0.0/16,100.64.0.0/10}"
ACL_ALLOW="${ACL_ALLOW:-}"
ACL_DEFAULT_EGRESS="${ACL_DEFAULT_EGRESS:-allow}"
ACL_DEFAULT_INGRESS="${ACL_DEFAULT_INGRESS:-drop}"
JAIL_PROFILE="${JAIL_PROFILE:-agent-jail}"
JAIL_IMAGE="${JAIL_IMAGE:-images:debian/trixie/cloud}"
JAIL_NESTING="${JAIL_NESTING:-false}"
JAIL_CPU="${JAIL_CPU:-2}"
JAIL_MEMORY="${JAIL_MEMORY:-4GiB}"
JAIL_WORKSPACE_ROOT="${JAIL_WORKSPACE_ROOT:-/srv/agent-jails}"
JAIL_AGENT_UID="${JAIL_AGENT_UID:-1000}"
JAIL_AGENT_GID="${JAIL_AGENT_GID:-1000}"
JAIL_BIND_MOUNTS="${JAIL_BIND_MOUNTS:-}"
. "${EMHTTP}/scripts/config-validation.sh"

# The ACL rendered below currently covers IPv4 only. Fail closed instead of
# accepting an IPv6 bridge address that bypasses the advertised containment.
if [ "$JAIL_IPV6" != "none" ]; then
  fatal_config "JAIL_IPV6 must remain 'none' until an IPv6 containment ACL is configured"
fi
if ! validation_error="$(validate_containment_config 2>&1)"; then
  fatal_config "${validation_error}"
fi
if ! storage_error="$(prepare_storage_config 2>&1)"; then
  log "FATAL: ${storage_error}"
  exit 1
fi

# liblxc hardcodes this exact path as a private mount-namespace target for
# pivoting a container's rootfs — it must exist (can be empty) or every
# container start fails with "Failed to prepare rootfs storage". Real
# Debian/Ubuntu lxc packages ship it via liblxc-common; we don't package
# liblxc through apt, so it never gets created otherwise.
mkdir -p "${INCUS_LXC_ROOTFS_DIR:-/usr/lib/x86_64-linux-gnu/lxc/rootfs}"

# ---------- 1. daemon first-run init (storage pool + core), guarded ----------
# Gate on the storage pool actually existing, not on database/global/db.bin —
# incusd creates db.bin during its own normal startup bootstrap regardless of
# whether admin init ever runs or succeeds, so db.bin's presence says nothing
# about whether our storage pool was actually created. If a prior admin init
# attempt failed partway (e.g. source dir missing), db.bin would already
# exist and this gate must still retry, or the pool never gets created.
if ! "$INCUS" storage show "$STORAGE_POOL_NAME" </dev/null >/dev/null 2>&1; then
  log "first-run: incus admin init (storage=${STORAGE_DRIVER})"
  if [ "$STORAGE_DRIVER" = "zfs" ]; then
    POOL_NAME="${STORAGE_SOURCE%%/*}"
    if ! command -v zfs >/dev/null; then
      log "FATAL: STORAGE_DRIVER=zfs but no zfs command found on this host"; exit 1
    fi
    if ! zpool list "$POOL_NAME" >/dev/null 2>&1; then
      log "FATAL: zfs pool '${POOL_NAME}' (from STORAGE_SOURCE=${STORAGE_SOURCE}) does not exist."
      AVAILABLE="$(zpool list -H -o name 2>/dev/null | tr '\n' ' ')"
      log "Available zfs pools on this host: ${AVAILABLE:-none}"
      log "Set STORAGE_SOURCE to an existing pool/dataset, or switch STORAGE_DRIVER=dir."
      exit 1
    fi
    # prepare_storage_config already created and write-probed the dataset.
    cat <<EOF | "$INCUS" admin init --preseed
config: {}
storage_pools:
  - name: ${STORAGE_POOL_NAME}
    driver: zfs
    config:
      source: ${STORAGE_SOURCE}
networks: []
profiles:
  - name: default
    devices:
      root:
        type: disk
        path: /
        pool: ${STORAGE_POOL_NAME}
EOF
  else
    # Incus refuses a dir-driver source nested inside INCUS_DIR itself, so
    # this lives in a sibling directory, not underneath it.
    DIR_STORAGE_SOURCE="$(dirname "$INCUS_DIR")/incus-storage-${STORAGE_POOL_NAME}"
    mkdir -p "$DIR_STORAGE_SOURCE"
    cat <<EOF | "$INCUS" admin init --preseed
config: {}
storage_pools:
  - name: ${STORAGE_POOL_NAME}
    driver: dir
    config:
      source: ${DIR_STORAGE_SOURCE}
networks: []
profiles:
  - name: default
    devices:
      root:
        type: disk
        path: /
        pool: ${STORAGE_POOL_NAME}
EOF
  fi
fi

# NOTE: every un-piped `$INCUS` call below is explicitly given `</dev/null`.
# Some subcommands (confirmed: `profile create`) block waiting for stdin
# input whenever stdin isn't a closed/empty fd, instead of assuming an empty
# body — that includes a plain terminal session as well as a script invoked
# with an inherited, never-EOF'd pipe (e.g. from a process manager). Without
# this, `incus-init.sh` can hang indefinitely with zero error output.

# ---------- 2. LAN-ban ACL (deny-list egress; Internet allowed) ----------
if [ -z "${ACL_BLOCK// /}" ]; then
  fatal_config "ACL_BLOCK is empty — refusing to start with the LAN-ban egress filter disabled"
fi

# Build egress rules: mandatory bridge protections first, then optional
# allow-holes and the configurable LAN block list.
acl_yaml() {
  local bridge_gateway
  bridge_gateway="${JAIL_SUBNET%/*}"
  echo "name: ${ACL_NAME}"
  echo "description: \"Deny agent egress to LAN ranges; allow Internet.\""
  echo "egress:"
  # Incus provides DNS on the bridge gateway. Permit only DNS there, then
  # reject the entire bridge subnet so host services bound to agentbr0 cannot
  # be reached from a compromised container. DHCP uses broadcast traffic and
  # does not require a unicast gateway exception.
  echo "  - action: allow"
  echo "    state: enabled"
  echo "    description: \"Bridge DNS (UDP)\""
  echo "    protocol: udp"
  echo "    destination: ${bridge_gateway}"
  echo "    destination_port: \"53\""
  echo "  - action: allow"
  echo "    state: enabled"
  echo "    description: \"Bridge DNS (TCP)\""
  echo "    protocol: tcp"
  echo "    destination: ${bridge_gateway}"
  echo "    destination_port: \"53\""
  echo "  - action: reject"
  echo "    state: enabled"
  echo "    description: \"Block host bridge and peer containers\""
  echo "    destination: ${JAIL_SUBNET}"
  if [ -n "${ACL_ALLOW:-}" ]; then
    echo "  - action: allow"
    echo "    state: enabled"
    echo "    description: \"Allowlisted destinations\""
    echo "    destination: ${ACL_ALLOW}"
  fi
  echo "  - action: reject"
  echo "    state: enabled"
  echo "    description: \"Blocked LAN ranges\""
  echo "    destination: ${ACL_BLOCK}"
  echo "ingress: []"
  echo "config: {}"
}
if ! "$INCUS" network acl show "$ACL_NAME" </dev/null >/dev/null 2>&1; then
  log "creating ACL ${ACL_NAME}"
  "$INCUS" network acl create "$ACL_NAME" </dev/null
fi
# Always re-apply the rule body so config edits take effect on restart.
ACL_BODY="$(acl_yaml)"
printf '%s\n' "$ACL_BODY" | "$INCUS" network acl edit "$ACL_NAME"

# ---------- 3. jail bridge ----------
# `network show` succeeds even for a host interface Incus doesn't manage
# (e.g. a same-named bridge left over from a prior daemon incarnation
# pointed at a different INCUS_DIR) — only "managed: true" means it's
# actually ours. An unmanaged same-named interface can't be reconfigured
# (network set fails with "Only managed networks can be modified"), so
# tear it down at the OS level and recreate it properly managed.
# Delete only on that positive answer. A failed query (e.g. a busy database
# under boot load) must not remove the live managed bridge, so it fails the
# run and leaves the next attempt to retry.
create_bridge=false
if bridge_info="$("$INCUS" network show "$JAIL_BRIDGE" </dev/null 2>&1)"; then
  if ! grep -q '^managed: true' <<<"$bridge_info"; then
    log "removing stale unmanaged interface ${JAIL_BRIDGE} before recreating it as managed"
    ip link delete "$JAIL_BRIDGE" 2>/dev/null || true
    create_bridge=true
  fi
elif grep -qi 'not found' <<<"$bridge_info"; then
  create_bridge=true
else
  log "cannot query bridge ${JAIL_BRIDGE}: ${bridge_info//$'\n'/ }"
  exit 1
fi
if [ "$create_bridge" = true ]; then
  log "creating bridge ${JAIL_BRIDGE} (${JAIL_SUBNET})"
  # Attach the ACL in the create call so the bridge never exists unfiltered.
  "$INCUS" network create "$JAIL_BRIDGE" --type=bridge \
    ipv4.address="$JAIL_SUBNET" ipv4.nat="$JAIL_NAT" \
    ipv6.address="$JAIL_IPV6" ipv6.nat=false \
    security.acls="$ACL_NAME" \
    security.acls.default.egress.action="$ACL_DEFAULT_EGRESS" \
    security.acls.default.ingress.action="$ACL_DEFAULT_INGRESS" </dev/null
fi
"$INCUS" network set "$JAIL_BRIDGE" security.acls="$ACL_NAME" </dev/null
"$INCUS" network set "$JAIL_BRIDGE" security.acls.default.egress.action="$ACL_DEFAULT_EGRESS" </dev/null
"$INCUS" network set "$JAIL_BRIDGE" security.acls.default.ingress.action="$ACL_DEFAULT_INGRESS" </dev/null

# ---------- 4. agent-jail profile (from template) ----------
path_is_safe_storage "$JAIL_WORKSPACE_ROOT" ||
  fatal_config "JAIL_WORKSPACE_ROOT must be beneath /srv or /mnt, not ${JAIL_WORKSPACE_ROOT}"
# prepare_storage_config already created and write-probed this directory.
CANONICAL_WORKSPACE_ROOT="$(readlink -f "$JAIL_WORKSPACE_ROOT")" || {
  log "FATAL: cannot resolve workspace root ${JAIL_WORKSPACE_ROOT}"
  exit 1
}
path_is_safe_storage "$CANONICAL_WORKSPACE_ROOT" ||
  fatal_config "workspace root resolves outside /srv or /mnt: ${CANONICAL_WORKSPACE_ROOT}"
JAIL_WORKSPACE_ROOT="$CANONICAL_WORKSPACE_ROOT"
mkdir -p "${JAIL_WORKSPACE_ROOT}/default-workspace"
chown "${JAIL_AGENT_UID}:${JAIL_AGENT_GID}" "${JAIL_WORKSPACE_ROOT}/default-workspace"
chmod 0750 "${JAIL_WORKSPACE_ROOT}/default-workspace"
# JAIL_WORKSPACE_ROOT gets bind-mounted with idmap shifting (shift: "true")
# into every jail — it MUST be real persistent storage. tmpfs (Unraid's
# RAM-based root fs) would silently discard all workspace data on every
# reboot, which is a much worse failure mode than refusing to start.
WS_FSTYPE="$(stat -f -c '%T' "${JAIL_WORKSPACE_ROOT}" 2>/dev/null || echo unknown)"
if [ "$WS_FSTYPE" = "tmpfs" ] || [ "$WS_FSTYPE" = "ramfs" ]; then
  log "Point it at a real array/cache path, e.g. /mnt/cache/appdata/agent-jails."
  fatal_config "JAIL_WORKSPACE_ROOT (${JAIL_WORKSPACE_ROOT}) is on ${WS_FSTYPE} — not persistent."
fi
TMPL="${EMHTTP}/templates/agent-jail-profile.yaml.tmpl"
if [ ! -f "$TMPL" ]; then
  log "ERROR: profile template not found at ${TMPL}"
  exit 1
fi
# render runs in a checked command substitution, where set -e is suspended, so
# every step returns its own failure.
render() {
  local out bind_yaml
  out=$(sed -e "s|@PROFILE@|${JAIL_PROFILE}|g" \
            -e "s|@BRIDGE@|${JAIL_BRIDGE}|g" \
            -e "s|@NESTING@|${JAIL_NESTING}|g" \
            -e "s|@UID@|${JAIL_AGENT_UID}|g" \
            -e "s|@GID@|${JAIL_AGENT_GID}|g" \
            -e "s|@WSROOT@|${JAIL_WORKSPACE_ROOT}|g" "$TMPL") || return 1
  # Handle empty CPU/MEMORY (= no cap): remove the limits line entirely
  if [ -n "${JAIL_CPU}" ]; then
    out=$(echo "$out" | sed "s|@CPU@|${JAIL_CPU}|g") || return 1
  else
    out=$(echo "$out" | grep -v '@CPU@') || return 1
  fi
  if [ -n "${JAIL_MEMORY}" ]; then
    out=$(echo "$out" | sed "s|@MEMORY@|${JAIL_MEMORY}|g") || return 1
  else
    out=$(echo "$out" | grep -v '@MEMORY@') || return 1
  fi
  bind_yaml="$(render_bind_mounts)" || return 1
  [ -z "$bind_yaml" ] || out="${out}
${bind_yaml}"
  echo "$out"
}

# Convert comma-separated host:container[:ro|rw] entries into profile disk
# devices. Manual incus.cfg edits are validated here as well as in GraphQL so
# malformed paths cannot become YAML or arbitrary host mounts.
render_bind_mounts() {
  local item host target mode extra index=0 old_ifs canonical_host config_root
  [ -z "${JAIL_BIND_MOUNTS// /}" ] && return 0
  config_root="/boot/config/plugins/incus/bind-mounts"
  mkdir -p "$config_root" || return 1
  config_root="$(readlink -f "$config_root")" || return 1
  old_ifs="$IFS"
  IFS=,
  for item in $JAIL_BIND_MOUNTS; do
    IFS=: read -r host target mode extra <<<"$item"
    IFS="$old_ifs"
    if [ -z "$host" ] || [ -z "$target" ] || [ -n "$extra" ]; then
      log "FATAL: invalid JAIL_BIND_MOUNTS entry '$item' (expected host:container[:ro|rw])" >&2
      return 1
    fi
    mode="${mode:-ro}"
    case "$host" in /*) ;; *) log "FATAL: bind source must be absolute: $host" >&2; return 1 ;; esac
    case "$target" in /*) ;; *) log "FATAL: bind target must be absolute: $target" >&2; return 1 ;; esac
    case "$host:$target" in *[!A-Za-z0-9_./:-]*) log "FATAL: unsupported character in bind mount '$item'" >&2; return 1 ;; esac
    [ -e "$host" ] || { log "FATAL: bind source does not exist: $host" >&2; return 1; }
    [ "$mode" = "rw" ] || [ "$mode" = "ro" ] || {
      log "FATAL: bind mode must be ro or rw: $item" >&2; return 1
    }
    canonical_host="$(readlink -f "$host")" || {
      log "FATAL: cannot resolve bind source: $host" >&2
      return 1
    }
    case "$canonical_host" in
      /srv/*|/mnt/*) ;;
      "$config_root"|"$config_root"/*)
        if [ "$mode" != "ro" ]; then
          log "FATAL: config bind mounts must be read-only: $item" >&2
          return 1
        fi
        ;;
      *)
        log "FATAL: bind source must resolve beneath /srv, /mnt, or ${config_root}: $host" >&2
        return 1
        ;;
    esac
    printf '  config-bind-%s:\n' "$index"
    printf '    type: disk\n    source: "%s"\n    path: "%s"\n    shift: "true"\n' "$canonical_host" "$target"
    [ "$mode" = "ro" ] && printf '    readonly: "true"\n'
    index=$((index + 1))
    IFS=,
  done
  IFS="$old_ifs"
}
if ! "$INCUS" profile show "$JAIL_PROFILE" </dev/null >/dev/null 2>&1; then
  log "creating profile ${JAIL_PROFILE}"
  "$INCUS" profile create "$JAIL_PROFILE" </dev/null
fi
# Render before editing: a failed render piped straight into `profile edit`
# would replace the profile with an empty one.
if ! PROFILE_BODY="$(render)" || [ -z "$PROFILE_BODY" ]; then
  log "FATAL: could not render profile ${JAIL_PROFILE} from ${TMPL}"
  exit 1
fi
printf '%s\n' "$PROFILE_BODY" | "$INCUS" profile edit "$JAIL_PROFILE"

log "environment ready (bridge=${JAIL_BRIDGE} acl=${ACL_NAME} pool=${STORAGE_POOL_NAME})"
