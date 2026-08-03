#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROVISION="$ROOT/source/usr/local/emhttp/plugins/unraid-codex/scripts/provision-container.sh"
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
bin="$tmp/bin"; state="$tmp/state"; workspace="$tmp/workspaces"; mkdir -p "$bin" "$state" "$workspace"
cat >"$tmp/incus.cfg" <<EOF
INCUS_DIR="$tmp/incus"
JAIL_PROFILE="agent-jail"
JAIL_IMAGE="images:debian/trixie/cloud"
JAIL_WORKSPACE_ROOT="$workspace"
JAIL_AGENT_UID="$(id -u)"
JAIL_AGENT_GID="$(id -g)"
STORAGE_POOL_NAME="default"
EOF
cat >"$tmp/incus-env.sh" <<EOF
export PATH="$bin:$PATH"
export INCUS_DIR="$tmp/incus"
EOF
printf '#!/bin/sh
exit 0
' >"$tmp/installer.sh"; chmod 0755 "$tmp/installer.sh"
cat >"$bin/incus" <<'EOF'
#!/bin/bash
set -euo pipefail
state="$MOCK_STATE"; printf '%q ' "$@" >>"$state/calls"; printf '
' >>"$state/calls"
case "${1:-}" in
 query) exit 0 ;;
 storage) [[ "${2:-}" = show ]] ;;
 profile) [[ "${2:-}" = show && "${MOCK_PROFILE_OK:-1}" = 1 ]] ;;
 info) [[ -e "$state/exists" ]] || exit 1; [[ -e "$state/running" ]] && echo 'Status: RUNNING' || echo 'Status: STOPPED' ;;
 init) touch "$state/exists" ;;
 config|file) exit 0 ;;
 delete) rm -f "$state/exists" "$state/running" "$state/codex" ;;
 exec)
   shift 2; [[ "${1:-}" = -- ]] && shift
   case "${1:-}" in
     test)
       if [[ "${2:-}" = -x ]]; then [[ -e "$state/codex" ]]; else exit 0; fi
       ;;
     id|install|chown|chmod) exit 0 ;;
     sh) exit 0 ;;
     env) touch "$state/codex"; echo 'codex_cli_version=9.9.9 installation=updated'; echo installer >>"$state/installer" ;;
     su) echo 'codex-cli 9.9.9' ;;
     cloud-init) echo 'status: done' ;;
     *) exit 0 ;;
   esac ;;
 *) exit 2 ;;
esac
EOF
cat >"$bin/start-instance" <<'EOF'
#!/bin/bash
set -euo pipefail
touch "$MOCK_STATE/running"; printf 'start %s
' "$1" >>"$MOCK_STATE/start"
EOF
printf '#!/bin/sh
exit 0
' >"$bin/logger"; chmod 0755 "$bin"/*
run_provision(){ MOCK_STATE="$state" MOCK_PROFILE_OK="${MOCK_PROFILE_OK:-1}" PATH="$bin:$PATH" INCUS_ENV="$tmp/incus-env.sh" INCUS_CONFIG="$tmp/incus.cfg" INCUS_START_HELPER="$bin/start-instance" CODEX_INSTALLER_SOURCE="$tmp/installer.sh" CODEX_PROVISION_LOCK="$tmp/provision.lock" CODEX_PROVISION_TIMEOUT=5 CODEX_TEST_ALLOW_TMP=1 "$PROVISION"; }
first="$(run_provision)"; grep -Fq 'ready with Codex 9.9.9' <<<"$first"
[[ -e "$state/exists" && -e "$state/running" && -e "$state/codex" ]]
[[ "$(wc -l <"$state/installer")" -eq 1 ]]
: >"$state/calls"
second="$(run_provision)"; grep -Fq 'ready with Codex 9.9.9' <<<"$second"
[[ "$(wc -l <"$state/installer")" -eq 1 ]]
if grep -q '^init ' "$state/calls"; then echo 'idempotent provision initialized container again' >&2; exit 1; fi
rm -f "$state/exists" "$state/running" "$state/codex"
if MOCK_PROFILE_OK=0 run_provision >/dev/null 2>&1; then echo 'missing profile unexpectedly passed' >&2; exit 1; fi
[[ ! -e "$state/exists" ]]
echo 'Codex container provisioner tests passed'
