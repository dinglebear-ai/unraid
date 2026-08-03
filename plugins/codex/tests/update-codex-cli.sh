#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
UPDATER="$ROOT/source/usr/local/emhttp/plugins/unraid-codex/scripts/update-codex-cli.sh"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
bin="$tmp/bin"
state="$tmp/state"
mkdir -p "$bin" "$state"
touch "$tmp/socket"

cat >"$tmp/incus.cfg" <<EOF
INCUS_DIR="$tmp/incus"
EOF
cat >"$tmp/incus-env.sh" <<EOF
export PATH="$bin:\$PATH"
export INCUS_DIR="$tmp/incus"
EOF
printf '#!/bin/sh\nexit 0\n' >"$tmp/installer.sh"

cat >"$tmp/smoke.py" <<'PY'
import os
from pathlib import Path
state=Path(os.environ['MOCK_STATE'])
count=int((state/'smoke-count').read_text() if (state/'smoke-count').exists() else '0')+1
(state/'smoke-count').write_text(str(count))
if os.environ.get('MOCK_SMOKE_FAIL_FIRST') == '1' and count == 1:
    raise SystemExit(1)
print('appserver_initialize=ok')
PY

cat >"$bin/incus" <<'EOF'
#!/bin/bash
set -euo pipefail
state="$MOCK_STATE"
printf '%q ' "$@" >>"$state/calls"
printf '\n' >>"$state/calls"
case "${1:-}" in
  info) echo 'Status: RUNNING' ;;
  file) exit 0 ;;
  exec)
    shift 2
    [[ "${1:-}" = -- ]] && shift
    case "${1:-}" in
      install|chown|chmod) exit 0 ;;
      env) printf '%s\n' "$MOCK_INSTALL_RESULT" ;;
      systemctl)
        case "${2:-}" in
          is-active) [[ -e "$state/service-active" ]] ;;
          restart) echo restart >>"$state/restarts"; touch "$state/service-active" ;;
          *) exit 0 ;;
        esac
        ;;
      test) [[ "${2:-}" = -x && -e "$state/previous" ]] ;;
      cp) echo rollback >>"$state/rollback" ;;
      *) exit 0 ;;
    esac
    ;;
  *) exit 0 ;;
esac
EOF

printf '#!/bin/sh\nexit 0\n' >"$bin/start-instance"
printf '#!/bin/sh\nexit 0\n' >"$bin/logger"
chmod 0755 "$bin"/* "$tmp/installer.sh"

run_update() {
  MOCK_STATE="$state" \
  PATH="$bin:$PATH" \
  INCUS_ENV="$tmp/incus-env.sh" \
  INCUS_CONFIG="$tmp/incus.cfg" \
  INCUS_START_HELPER="$bin/start-instance" \
  CODEX_INSTALLER_SOURCE="$tmp/installer.sh" \
  CODEX_SMOKE_SOURCE="$tmp/smoke.py" \
  CODEX_MAINTENANCE_LOCK="$tmp/maintenance.lock" \
  CODEX_SOCKET_PATH="$tmp/socket" \
  CODEX_TEST_SOCKET_READY=1 \
  "$UPDATER"
}

touch "$state/service-active"
MOCK_INSTALL_RESULT='codex_cli_version=9.9.9 installation=current check=latest' run_update >"$tmp/update-current.log"
[[ ! -e "$state/restarts" ]]

: >"$state/calls"
rm -f "$state/smoke-count"
MOCK_INSTALL_RESULT='codex_cli_version=9.9.10 installation=updated previous=9.9.9' run_update >"$tmp/update-success.log"
[[ "$(wc -l <"$state/restarts")" -eq 1 ]]
[[ "$(cat "$state/smoke-count")" -eq 1 ]]

: >"$state/restarts"
rm -f "$state/smoke-count" "$state/rollback"
touch "$state/previous"
set +e
MOCK_SMOKE_FAIL_FIRST=1 \
MOCK_INSTALL_RESULT='codex_cli_version=9.9.11 installation=updated previous=9.9.10' \
run_update >"$tmp/update-rollback.log" 2>&1
rc=$?
set -e
[[ "$rc" -ne 0 ]]
[[ "$(wc -l <"$state/restarts")" -eq 2 ]]
[[ "$(cat "$state/smoke-count")" -eq 2 ]]
[[ "$(wc -l <"$state/rollback")" -eq 1 ]]
grep -Fq 'rolled back' "$tmp/update-rollback.log"

echo 'Codex CLI service rollback tests passed'
