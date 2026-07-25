#!/bin/bash
# apply-settings.sh — invoked by the Settings page's Apply button after
# incus.cfg has been rewritten. A plain `rc.incus restart` alone is not
# enough: it only brings the raw daemon up, it does not re-apply the
# storage pool/ACL/bridge/profile environment for the (possibly new)
# INCUS_DIR/config — that's incus-init.sh's job. Mirrors the same
# start-then-init sequence the array-start event script uses.
set -uo pipefail

CFG="/boot/config/plugins/incus/incus.cfg"
ROLLBACK="${CFG}.known-good"
HEALTH="/var/log/incus-apply.log"
[ -f "$CFG" ] || exit 0
. "$CFG"
. /usr/local/emhttp/plugins/incus/scripts/config-validation.sh

record() { printf '%s %s\n' "$(date -Is)" "$*" >>"$HEALTH"; logger -t incus-apply "$*"; }
restore_known_good() {
  local reconcile="${1:-true}"
  [ -f "$ROLLBACK" ] || { record "apply failed and no known-good config exists"; return 1; }
  cp -p "$ROLLBACK" "${CFG}.restore"
  mv -f "${CFG}.restore" "$CFG"
  . "$CFG"
  record "restored known-good config after failed apply"
  [ "$reconcile" = "true" ] || return 0
  if [ "${SERVICE:-disabled}" = "enabled" ]; then
    /etc/rc.d/rc.incus restart && /usr/local/emhttp/plugins/incus/scripts/incus-init.sh
  else
    /etc/rc.d/rc.incus stop
  fi
}

# Validate the candidate before disrupting the active daemon. Full host/runtime
# validation remains in rc.incus preflight and incus-init's fail-closed checks.
case "${SERVICE:-disabled}" in enabled|disabled) ;; *) record "invalid SERVICE"; restore_known_good false; exit 1 ;; esac
case "${STORAGE_DRIVER:-dir}" in dir|zfs) ;; *) record "invalid STORAGE_DRIVER"; restore_known_good false; exit 1 ;; esac
case "${JAIL_IPV6:-none}" in none) ;; *) record "IPv6 rejected: containment policy is IPv4-only"; restore_known_good false; exit 1 ;; esac
if ! validation_error="$(validate_containment_config 2>&1)"; then
  record "invalid containment config: ${validation_error}"
  restore_known_good false
  exit 1
fi
if ! storage_error="$(prepare_storage_config 2>&1)"; then
  record "invalid storage config: ${storage_error}"
  restore_known_good false
  exit 1
fi

if [ "${SERVICE:-disabled}" != "enabled" ]; then
  /etc/rc.d/rc.incus stop || { restore_known_good; exit 1; }
  cp -p "$CFG" "$ROLLBACK"
  chmod 600 "$ROLLBACK"
  record "disabled configuration applied successfully"
  exit 0
fi

if /etc/rc.d/rc.incus restart && /usr/local/emhttp/plugins/incus/scripts/incus-init.sh; then
  cp -p "$CFG" "$ROLLBACK"
  chmod 600 "$ROLLBACK"
  record "configuration applied and reconciled successfully"
  exit 0
fi

record "candidate configuration failed; attempting rollback"
restore_known_good || true
exit 1
