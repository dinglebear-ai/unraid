#!/bin/bash
# Versioned, idempotent security migrations for preserved incus.cfg files.
set -euo pipefail

CFG="${INCUS_CFG_PATH:-/boot/config/plugins/incus/incus.cfg}"
ROLLBACK="${CFG}.known-good"
MARKER="$(dirname "$CFG")/.migration-2026.07.18-cgnat"
CGNAT="100.64.0.0/10"

[ -f "$CFG" ] || exit 0
[ ! -e "$MARKER" ] || exit 0

migrate_file() {
  local file="$1" acl updated tmp found=0
  [ -f "$file" ] || return 0
  unset ACL_BLOCK
  # The config is root-owned plugin state and is sourced by the lifecycle
  # scripts already. This migration only reads the existing ACL value.
  # shellcheck disable=SC1090
  . "$file"
  acl="${ACL_BLOCK:-10.0.0.0/8,172.16.0.0/12,192.168.0.0/16,169.254.0.0/16}"
  case ",$acl," in
    *,"$CGNAT",*) return 0 ;;
  esac
  updated="${acl:+${acl},}${CGNAT}"
  tmp="${file}.migration.$$"
  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in
      ACL_BLOCK=*)
        printf 'ACL_BLOCK=%q\n' "$updated" >>"$tmp"
        found=1
        ;;
      *) printf '%s\n' "$line" >>"$tmp" ;;
    esac
  done <"$file"
  [ "$found" -eq 1 ] || printf 'ACL_BLOCK=%q\n' "$updated" >>"$tmp"
  chmod 600 "$tmp"
  mv -f "$tmp" "$file"
}

trap 'rm -f "${CFG}.migration.$$" "${ROLLBACK}.migration.$$" "${MARKER}.tmp.$$"' EXIT
migrate_file "$CFG"
migrate_file "$ROLLBACK"
: >"${MARKER}.tmp.$$"
chmod 600 "${MARKER}.tmp.$$"
mv -f "${MARKER}.tmp.$$" "$MARKER"
logger -t incus "migrated preserved ACL policy to block Tailscale CGNAT"
