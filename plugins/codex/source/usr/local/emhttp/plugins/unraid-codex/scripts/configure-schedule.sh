#!/bin/bash
set -euo pipefail
MODE="${1:-install}"
CRON_FILE=/etc/cron.d/unraid-codex
LOCK_FILE=/var/run/unraid-codex-schedule.lock
exec 9>"$LOCK_FILE"
flock -w 30 9
case "$MODE" in
  install)
    tmp="$(mktemp /etc/cron.d/unraid-codex.XXXXXX)"
    cat >"$tmp" <<'EOF'
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
11 2 * * * root /usr/local/emhttp/plugins/unraid-codex/scripts/update-codex-cli.sh >/dev/null 2>&1
17 3 * * * root /usr/local/emhttp/plugins/unraid-codex/scripts/backup-state.sh >/dev/null 2>&1
EOF
    chmod 0644 "$tmp"; mv "$tmp" "$CRON_FILE"
    ;;
  remove|--remove) rm -f "$CRON_FILE" ;;
  *) echo "usage: $0 [install|remove]" >&2; exit 2 ;;
esac
