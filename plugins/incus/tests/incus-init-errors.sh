#!/bin/bash
# incus-init.sh runs under set -e. Any unexpected failure must name the failing
# line and command, or a boot-time failure leaves no trace in syslog.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPTS="$ROOT/source/usr/local/emhttp/plugins/incus/scripts"
INIT="$SCRIPTS/incus-init.sh"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
bin="$tmp/bin"
emhttp="$tmp/emhttp"
mkdir -p "$bin" "$emhttp/scripts"
: >"$emhttp/scripts/incus-env.sh"
# Real containment validation. Storage probes are covered by classic-contract.sh
# and depend on the host's /tmp filesystem type, so they are stubbed here.
cat >"$emhttp/scripts/config-validation.sh" <<STUB
. "$SCRIPTS/config-validation.sh"
prepare_storage_config() { return 0; }
STUB

cat >"$bin/incus" <<'EOF'
#!/bin/bash
args="$*"
case "$args" in
  "storage show default"|"network acl show agent-block-lan") exit 0 ;;
  "network acl edit agent-block-lan")
    cat >/dev/null
    [[ "${MOCK_FAIL_ON:-}" = acl-edit ]] && { echo "Error: database is locked" >&2; exit 1; }
    exit 0
    ;;
  "network show agentbr0") echo "managed: true" ;;
  "network set agentbr0 security.acls=agent-block-lan")
    [[ "${MOCK_FAIL_ON:-}" = network-set ]] && { echo "Error: network busy" >&2; exit 1; }
    exit 0
    ;;
  "network set agentbr0 "*) exit 0 ;;
  *) echo "unexpected incus call: $args" >&2; exit 2 ;;
esac
EOF

cat >"$bin/logger" <<'EOF'
#!/bin/bash
[[ "${1:-}" = -t ]] && shift 2
printf '%s\n' "$*" >>"$MOCK_LOG"
EOF
chmod 0755 "$bin"/*

fail() { echo "incus-init error test failed: $*" >&2; exit 1; }

run_init() {
  local case_dir="$1"; shift
  mkdir -p "$case_dir"
  : >"$case_dir/log"
  printf 'INCUS_DIR="%s"\nJAIL_WORKSPACE_ROOT="%s"\nSTORAGE_DRIVER=dir\n' \
    "$case_dir/state" "$case_dir/workspaces" >"$case_dir/incus.cfg"
  env MOCK_LOG="$case_dir/log" PATH="$bin:$PATH" INCUS_TEST_ALLOW_TMP=1 \
    INCUS_CONFIG="$case_dir/incus.cfg" INCUS_EMHTTP="$emhttp" INCUS_BIN="$bin/incus" \
    INCUS_INIT_LOCK_FILE="$case_dir/lock" INCUS_LXC_ROOTFS_DIR="$case_dir/lxc-rootfs" \
    "$@" "$INIT" >"$case_dir/stdout" 2>"$case_dir/stderr"
}

line_of() {
  local line
  line="$(grep -nF -- "$1" "$INIT" | cut -d: -f1)"
  [[ "$(wc -l <<<"$line")" = 1 && -n "$line" ]] || fail "expected one line matching: $1"
  echo "$line"
}

# A failing pipeline names its line and command.
case_dir="$tmp/acl-edit"
if run_init "$case_dir" MOCK_FAIL_ON=acl-edit; then fail "acl edit failure should exit non-zero"; fi
# shellcheck disable=SC2016 # literal script text, not an expansion
line="$(line_of 'acl_yaml | "$INCUS" network acl edit "$ACL_NAME"')"
# shellcheck disable=SC2016 # literal command text from the script under test
expected="FAILED (exit 1) at line ${line}: \"\$INCUS\" network acl edit \"\$ACL_NAME\""
grep -Fxq "$expected" "$case_dir/log" || {
  cat "$case_dir/log" >&2
  fail "missing ERR trap log for acl edit"
}
grep -Fq "incus-init: $expected" "$case_dir/stderr" || fail "ERR trap did not report on stderr"
[[ "$(grep -c '^FAILED' "$case_dir/log")" = 1 ]] || fail "ERR trap logged more than once"

# A failing simple command names its line and command.
case_dir="$tmp/network-set"
if run_init "$case_dir" MOCK_FAIL_ON=network-set; then fail "network set failure should exit non-zero"; fi
# shellcheck disable=SC2016 # literal script text, not an expansion
line="$(line_of '"$INCUS" network set "$JAIL_BRIDGE" security.acls="$ACL_NAME" </dev/null')"
# shellcheck disable=SC2016 # literal command text from the script under test
expected="FAILED (exit 1) at line ${line}: \"\$INCUS\" network set \"\$JAIL_BRIDGE\" security.acls=\"\$ACL_NAME\" < /dev/null"
grep -Fxq "$expected" "$case_dir/log" || {
  cat "$case_dir/log" >&2
  fail "missing ERR trap log for network set"
}

# Checked conditions and deliberate FATAL exits do not produce trap noise.
# This run passes every daemon step and stops at the production-only
# workspace-root check, which rejects temporary test paths.
case_dir="$tmp/fatal"
if run_init "$case_dir"; then fail "temporary workspace root should be rejected"; fi
grep -Fq 'FATAL: JAIL_WORKSPACE_ROOT must be beneath /srv or /mnt' "$case_dir/log" ||
  fail "expected the workspace-root FATAL"
! grep -q '^FAILED' "$case_dir/log" || {
  cat "$case_dir/log" >&2
  fail "ERR trap fired on a checked condition or deliberate exit"
}

printf 'incus-init error trap tests passed\n'
