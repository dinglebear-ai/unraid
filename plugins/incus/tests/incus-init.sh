#!/bin/bash
# incus-init.sh contract with a mocked incus CLI: full and first-run
# reconciliation succeed cleanly, a busy bridge query never deletes the live
# bridge, a failed render never reaches `profile edit`, configuration errors
# exit 78, and every unexpected failure names its line and command.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PLUGIN="$ROOT/source/usr/local/emhttp/plugins/incus"
INIT="$PLUGIN/scripts/incus-init.sh"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
bin="$tmp/bin"
emhttp="$tmp/emhttp"
mkdir -p "$bin" "$emhttp/scripts"
: >"$emhttp/scripts/incus-env.sh"
ln -s "$PLUGIN/templates" "$emhttp/templates"
# Real containment validation. Storage probes are covered by classic-contract.sh
# and depend on the host's /tmp filesystem type, so they are stubbed here.
cat >"$emhttp/scripts/config-validation.sh" <<STUB
. "$PLUGIN/scripts/config-validation.sh"
prepare_storage_config() { return 0; }
STUB

# MOCK_MODE: existing (default) | first-run | bridge-busy | bridge-other |
# bridge-unmanaged
# MOCK_FAIL_ON: acl-edit | network-set ; MOCK_HANG=1 hangs every call.
cat >"$bin/incus" <<'EOF'
#!/bin/bash
args="$*"
printf '%s\n' "$args" >>"$MOCK_DIR/calls"
[[ "${MOCK_HANG:-0}" = 1 ]] && command -p sleep 10
mode="${MOCK_MODE:-existing}"
body() { cat >"$MOCK_DIR/body-$1"; }
case "$args" in
  "storage show default"|"network acl show agent-block-lan"|"profile show agent-jail")
    [[ "$mode" = first-run ]] && { echo "Error: not found" >&2; exit 1; }
    exit 0
    ;;
  "admin init --preseed") body preseed ;;
  "network acl create agent-block-lan"|"profile create agent-jail") exit 0 ;;
  "network acl edit agent-block-lan")
    body acl
    [[ "${MOCK_FAIL_ON:-}" = acl-edit ]] && { echo "Error: database is locked" >&2; exit 1; }
    exit 0
    ;;
  "network show agentbr0")
    case "$mode" in
      first-run) echo "Error: Network not found" >&2; exit 1 ;;
      bridge-busy) echo "Error: database is locked" >&2; exit 1 ;;
      bridge-other) echo "Error: Project not found" >&2; exit 1 ;;
      bridge-unmanaged) echo "managed: false" ;;
      *) echo "managed: true" ;;
    esac
    ;;
  "network create agentbr0 "*) exit 0 ;;
  "network set agentbr0 security.acls=agent-block-lan")
    [[ "${MOCK_FAIL_ON:-}" = network-set ]] && { echo "Error: network busy" >&2; exit 1; }
    exit 0
    ;;
  "network set agentbr0 "*) exit 0 ;;
  "profile edit agent-jail") body profile ;;
  *) echo "unexpected incus call: $args" >&2; exit 2 ;;
esac
EOF

cat >"$bin/ip" <<'EOF'
#!/bin/bash
printf 'ip %s\n' "$*" >>"$MOCK_DIR/calls"
EOF

# Report a persistent filesystem for workspace checks on tmpfs /tmp hosts.
cat >"$bin/stat" <<'EOF'
#!/bin/bash
if [[ "$1" = -f ]]; then echo ext2/ext3; exit 0; fi
exec /usr/bin/stat "$@"
EOF

cat >"$bin/logger" <<'EOF'
#!/bin/bash
[[ "${1:-}" = -t ]] && shift 2
printf '%s\n' "$*" >>"$MOCK_DIR/log"
EOF
chmod 0755 "$bin"/*

fail() { echo "incus-init test failed: $*" >&2; exit 1; }

# run_init <case> [VAR=value... [command...]]; extra cfg lines come from CFG_EXTRA.
run_init() {
  local case_dir="$tmp/$1"; shift
  mkdir -p "$case_dir/workspaces"
  : >"$case_dir/log"; : >"$case_dir/calls"
  {
    printf 'INCUS_DIR="%s"\nJAIL_WORKSPACE_ROOT="%s"\nSTORAGE_DRIVER=dir\n' \
      "$case_dir/state" "$case_dir/workspaces"
    printf 'JAIL_AGENT_UID=%s\nJAIL_AGENT_GID=%s\n' "$(id -u)" "$(id -g)"
    printf '%s\n' "${CFG_EXTRA:-}"
  } >"$case_dir/incus.cfg"
  env MOCK_DIR="$case_dir" PATH="$bin:$PATH" INCUS_TEST_ALLOW_TMP=1 \
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

no_trap_lines() {
  ! grep -q 'FAILED (exit' "$tmp/$1/log" || { cat "$tmp/$1/log" >&2; fail "$1: unexpected ERR trap line"; }
}

# Reconciling an existing environment succeeds with no trap noise and applies
# non-empty ACL and profile bodies.
run_init ok || { cat "$tmp/ok/stderr" >&2; fail "existing environment should reconcile"; }
grep -Fq 'environment ready' "$tmp/ok/log" || fail "missing ready log"
no_trap_lines ok
grep -Fq 'name: agent-jail' "$tmp/ok/body-profile" || fail "profile body not rendered"
grep -Fq 'Blocked LAN ranges' "$tmp/ok/body-acl" || fail "ACL body not rendered"
! grep -q '^ip ' "$tmp/ok/calls" || fail "managed bridge touched at the OS level"

# A first run creates every object, and the bridge carries its ACL from creation.
run_init first MOCK_MODE=first-run || { cat "$tmp/first/stderr" >&2; fail "first run should succeed"; }
no_trap_lines first
grep -Fq 'name: default' "$tmp/first/body-preseed" || fail "storage preseed not sent"
grep -Eq '^network create agentbr0 .*security\.acls=agent-block-lan( |$)' "$tmp/first/calls" ||
  fail "bridge created without its ACL"
grep -Fq 'security.acls.default.egress.action=allow' "$tmp/first/calls" || fail "bridge created without default egress"
! grep -q '^ip link delete' "$tmp/first/calls" || fail "first run deleted an interface"

# A failed bridge query (busy database under boot load) never deletes the live
# bridge; it fails the run for the caller to retry.
if run_init busy MOCK_MODE=bridge-busy; then fail "busy bridge query should fail"; fi
! grep -q '^ip link delete' "$tmp/busy/calls" || fail "busy query deleted the live bridge"
! grep -q '^network create' "$tmp/busy/calls" || fail "busy query recreated the bridge"
grep -Fq 'cannot query bridge agentbr0: Error: database is locked' "$tmp/busy/log" || fail "busy query not logged"
# Only Incus's exact missing-network error means the bridge does not exist.
if run_init other MOCK_MODE=bridge-other; then fail "unrelated not-found error should fail"; fi
! grep -q '^network create' "$tmp/other/calls" || fail "unrelated not-found error created the bridge"

# A same-named interface Incus reports as unmanaged is replaced.
run_init unmanaged MOCK_MODE=bridge-unmanaged || fail "unmanaged interface should be replaced"
grep -Fxq 'ip link delete agentbr0' "$tmp/unmanaged/calls" || fail "unmanaged interface not removed"
grep -q '^network create agentbr0 ' "$tmp/unmanaged/calls" || fail "managed bridge not created"

# A failing pipeline names its line and command once, on stderr and syslog only.
if run_init acl MOCK_FAIL_ON=acl-edit; then fail "acl edit failure should exit non-zero"; fi
# shellcheck disable=SC2016 # literal script text, not an expansion
line="$(line_of '"$INCUS" network acl edit "$ACL_NAME"')"
# shellcheck disable=SC2016 # literal script text, not an expansion
grep -Fq "FAILED (exit 1) at line ${line}: \"\$INCUS\" network acl edit" "$tmp/acl/log" ||
  { cat "$tmp/acl/log" >&2; fail "missing ERR trap log for acl edit"; }
grep -Fq "incus-init: FAILED (exit 1) at line ${line}:" "$tmp/acl/stderr" || fail "ERR trap did not report on stderr"
! grep -q 'FAILED' "$tmp/acl/stdout" || fail "ERR trap wrote to stdout"
[[ "$(grep -c 'FAILED (exit' "$tmp/acl/log")" = 1 ]] || fail "ERR trap logged more than once"
grep -Fxq 'exiting with status 1' "$tmp/acl/log" || fail "exit status not logged"

# A failing simple command names its line and command.
if run_init set MOCK_FAIL_ON=network-set; then fail "network set failure should exit non-zero"; fi
# shellcheck disable=SC2016 # literal script text, not an expansion
line="$(line_of '"$INCUS" network set "$JAIL_BRIDGE" security.acls="$ACL_NAME" </dev/null')"
# shellcheck disable=SC2016 # literal script text, not an expansion
grep -Fq "FAILED (exit 1) at line ${line}: \"\$INCUS\" network set \"\$JAIL_BRIDGE\" security.acls=" "$tmp/set/log" ||
  { cat "$tmp/set/log" >&2; fail "missing ERR trap log for network set"; }

# A failed render inside a function stops before `profile edit`, so the profile
# is never replaced with an empty body.
if CFG_EXTRA='JAIL_CPU="2|x"' run_init render; then fail "render failure should exit non-zero"; fi
grep -Fq 'FATAL: could not render profile agent-jail' "$tmp/render/log" || fail "render failure not logged"
! grep -Fq 'profile edit' "$tmp/render/calls" || fail "profile edit ran after a failed render"
no_trap_lines render

# Every ACL address form Incus accepts still passes validation.
CFG_EXTRA='ACL_ALLOW="192.168.1.50, 10.0.0.1-10.0.0.5,fd00::/8"' run_init acl-forms ||
  { cat "$tmp/acl-forms/log" >&2; fail "valid ACL address forms were rejected"; }

# Configuration errors exit 78 so the array-start hook does not retry them.
for cfg in 'JAIL_IPV6=auto' 'ACL_BLOCK="10.0.0.0/8;reboot"' 'ACL_ALLOW="example.com"'; do
  status=0
  CFG_EXTRA="$cfg" run_init config || status=$?
  [[ "$status" = 78 ]] || fail "'$cfg' should exit 78, got $status"
  grep -q 'FATAL: ' "$tmp/config/log" || fail "'$cfg' rejection not logged"
  no_trap_lines config
  ! grep -Fq 'network acl edit' "$tmp/config/calls" || fail "'$cfg' reached the ACL step"
done

# A run that cannot get the lock exits 75 instead of reporting success.
mkdir -p "$tmp/locked"
exec 9>"$tmp/locked/lock"
flock 9
status=0
run_init locked INCUS_INIT_LOCK_TIMEOUT=1 || status=$?
exec 9>&-
[[ "$status" = 75 ]] || fail "held lock should exit 75, got $status"
grep -Fq 'held the lock for 1s; not reconciled' "$tmp/locked/log" || fail "lock timeout not logged"
[[ ! -s "$tmp/locked/calls" ]] || fail "locked run called incus"

# Exits that bypass ERR are still logged: a broken incus.cfg and a signal.
if CFG_EXTRA='SERVICE=(' run_init syntax; then fail "broken incus.cfg should exit non-zero"; fi
grep -q '^exiting with status [1-9]' "$tmp/syntax/log" || fail "broken incus.cfg exit not logged"
status=0
run_init signal MOCK_HANG=1 timeout 1 || status=$?
[[ "$status" = 124 ]] || fail "signal case should time out, got $status"
grep -Fxq 'exiting with status 143' "$tmp/signal/log" || { cat "$tmp/signal/log" >&2; fail "TERM exit not logged"; }

printf 'incus-init tests passed\n'
