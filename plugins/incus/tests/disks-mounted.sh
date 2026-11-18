#!/bin/bash
# Array-start hook contract: a reconciliation failure must never tear down a
# running daemon, because instances and Docker containers attached to its
# managed bridges would keep running without DNS or egress.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOOK="$ROOT/source/usr/local/emhttp/plugins/incus/event/disks_mounted"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
bin="$tmp/bin"
emhttp="$tmp/emhttp"
mkdir -p "$bin" "$emhttp/scripts"
: >"$emhttp/scripts/incus-env.sh"
printf 'test-build\n' >"$emhttp/build-id"

cat >"$bin/rc.incus" <<'EOF'
#!/bin/bash
set -euo pipefail
printf 'rc-%s\n' "$1" >>"$MOCK_STATE/events"
if [[ "$1" = start && "${MOCK_RC_START_FAILS:-0}" = 1 ]]; then exit 1; fi
exit 0
EOF

cat >"$emhttp/scripts/incus-init.sh" <<'EOF'
#!/bin/bash
set -euo pipefail
count=0; [[ -r "$MOCK_STATE/init-count" ]] && count="$(cat "$MOCK_STATE/init-count")"
count=$((count + 1)); echo "$count" >"$MOCK_STATE/init-count"
printf 'init-%s\n' "$count" >>"$MOCK_STATE/events"
if [[ "$count" -le "${MOCK_INIT_FAILS:-0}" ]]; then
  echo "incus-init: progress before failure"
  echo "incus-init: FAILED (exit 1) at line 191: network acl edit attempt ${count}" >&2
  exit 1
fi
echo "incus-init: environment ready"
EOF

cat >"$bin/logger" <<'EOF'
#!/bin/bash
printf '%s\n' "$*" >>"$MOCK_STATE/log"
EOF

cat >"$bin/sleep" <<'EOF'
#!/bin/bash
printf 'sleep-%s\n' "$1" >>"$MOCK_STATE/events"
EOF
chmod 0755 "$bin"/* "$emhttp/scripts/incus-init.sh"

run_hook() {
  local state="$1"; shift
  rm -rf "$state" "$tmp/incus"
  mkdir -p "$state"
  printf 'SERVICE="%s"\nINCUS_DIR="%s"\n' "${MOCK_SERVICE:-enabled}" "$tmp/incus" >"$tmp/incus.cfg"
  env MOCK_STATE="$state" PATH="$bin:$PATH" INCUS_CONFIG="$tmp/incus.cfg" \
    INCUS_RC="$bin/rc.incus" INCUS_EMHTTP="$emhttp" "$@" "$HOOK"
}

fail() { echo "disks_mounted test failed: $*" >&2; exit 1; }

# A transient reconciliation failure is retried with doubling backoff.
state="$tmp/transient"
run_hook "$state" MOCK_INIT_FAILS=2 || fail "transient init failure was not recovered"
[[ "$(cat "$state/init-count")" = 3 ]] || fail "expected 3 init attempts"
[[ "$(grep -c '^sleep-' "$state/events")" = 2 ]] || fail "expected 2 backoff sleeps"
grep -Fxq 'sleep-5' "$state/events" || fail "first backoff should be 5s"
grep -Fxq 'sleep-10' "$state/events" || fail "second backoff should be 10s"
! grep -Fxq 'rc-stop' "$state/events" || fail "daemon was stopped during recovery"
grep -Fq 'daemon and containment environment ready' "$state/log" || fail "missing ready log"
[[ ! -e "$tmp/incus/plugin-health" ]] || fail "recovered start must not record degraded health"

# A persistent reconciliation failure leaves the daemon and instances running
# and records why the plugin is degraded.
state="$tmp/persistent"
if run_hook "$state" MOCK_INIT_FAILS=99; then
  fail "persistent init failure should exit non-zero"
fi
[[ "$(cat "$state/init-count")" = 4 ]] || fail "expected the default 4 init attempts"
grep -Fxq 'sleep-20' "$state/events" || fail "third backoff should be 20s"
! grep -Fxq 'sleep-40' "$state/events" || fail "no backoff after the final attempt"
! grep -Fxq 'rc-stop' "$state/events" || fail "daemon was stopped after init failure"
health="$tmp/incus/plugin-health"
[[ -f "$health" ]] || fail "degraded health file missing"
grep -Fxq 'status=degraded' "$health" || fail "health status is not degraded"
grep -Fxq 'build=test-build' "$health" || fail "health build id missing"
grep -Eq '^time=.+' "$health" || fail "health time missing"
grep -Fq 'message=environment reconciliation failed after 4 attempts' "$health" ||
  fail "health message missing attempt count"
grep -Fq 'network acl edit attempt 4' "$health" || fail "health message missing final reason"
[[ "$(wc -l <"$health")" = 4 ]] || fail "health file must stay four key=value lines"
grep -Fq 'degraded' "$state/log" || fail "degraded state not logged"
grep -Fq 'network acl edit attempt 4' "$state/log" || fail "final reason not logged"

# Attempts and backoff stay tunable for the event and its tests.
state="$tmp/tuned"
if run_hook "$state" MOCK_INIT_FAILS=99 INCUS_INIT_ATTEMPTS=2 INCUS_INIT_BACKOFF=1; then
  fail "tuned persistent failure should exit non-zero"
fi
[[ "$(cat "$state/init-count")" = 2 ]] || fail "INCUS_INIT_ATTEMPTS not honoured"
grep -Fxq 'sleep-1' "$state/events" || fail "INCUS_INIT_BACKOFF not honoured"

# A daemon that never starts is still reported without running init.
state="$tmp/daemon-down"
if run_hook "$state" MOCK_RC_START_FAILS=1; then
  fail "daemon start failure should exit non-zero"
fi
[[ "$(grep -c '^rc-start$' "$state/events")" = 3 ]] || fail "expected 3 daemon start attempts"
[[ ! -e "$state/init-count" ]] || fail "init ran without a daemon"

# A disabled service does nothing.
state="$tmp/disabled"
MOCK_SERVICE=disabled run_hook "$state" || fail "disabled service should exit zero"
[[ ! -e "$state/events" ]] || fail "disabled service touched the daemon"

printf 'disks_mounted recovery tests passed\n'
