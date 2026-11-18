#!/bin/bash
# Array-start hook contract: a reconciliation failure must never stop the
# running daemon, because workloads attached to its managed bridges would lose
# DNS and egress. The failure must instead be retried, then recorded.
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

# Fails MOCK_INIT_FAILS times with MOCK_INIT_EXIT, then succeeds.
cat >"$emhttp/scripts/incus-init.sh" <<'EOF'
#!/bin/bash
set -euo pipefail
count=0; [[ -r "$MOCK_STATE/init-count" ]] && count="$(cat "$MOCK_STATE/init-count")"
count=$((count + 1)); echo "$count" >"$MOCK_STATE/init-count"
printf 'init-%s\n' "$count" >>"$MOCK_STATE/events"
if [[ "${MOCK_INIT_HANG:-0}" = 1 ]]; then
  echo "incus-init: waiting on incusd"
  command -p sleep 10
fi
if [[ "$count" -le "${MOCK_INIT_FAILS:-0}" ]]; then
  if [[ "${MOCK_INIT_SILENT:-0}" = 1 ]]; then exit 1; fi
  echo "incus-init: progress before failure"
  echo "Error: database is locked" >&2
  printf 'incus-init: FAILED (exit 1) at line 191: network acl edit attempt %s\r\n' "$count" >&2
  echo "incus-init: exiting with status ${MOCK_INIT_EXIT:-1}" >&2
  exit "${MOCK_INIT_EXIT:-1}"
fi
echo "incus-init: environment ready"
EOF

# Records "tag: message", or one "tag: line" per stdin line.
cat >"$bin/logger" <<'EOF'
#!/bin/bash
tag=logger
[[ "${1:-}" = -t ]] && { tag="$2"; shift 2; }
if [[ $# -gt 0 ]]; then
  printf '%s: %s\n' "$tag" "$*" >>"$MOCK_STATE/log"
else
  while IFS= read -r line; do printf '%s: %s\n' "$tag" "$line" >>"$MOCK_STATE/log"; done
fi
EOF

cat >"$bin/sleep" <<'EOF'
#!/bin/bash
printf 'sleep-%s\n' "$1" >>"$MOCK_STATE/events"
EOF

cat >"$bin/notify" <<'EOF'
#!/bin/bash
printf '%s\n' "$*" >>"$MOCK_STATE/notify"
EOF
chmod 0755 "$bin"/* "$emhttp/scripts/incus-init.sh"

run_hook() {
  local state="$1"; shift
  rm -rf "$state" "$tmp/incus"
  mkdir -p "$state"
  printf 'SERVICE="%s"\nINCUS_DIR="%s"\n' "${MOCK_SERVICE:-enabled}" "${MOCK_INCUS_DIR:-$tmp/incus}" >"$tmp/incus.cfg"
  env MOCK_STATE="$state" PATH="$bin:$PATH" INCUS_CONFIG="$tmp/incus.cfg" \
    INCUS_RC="$bin/rc.incus" INCUS_EMHTTP="$emhttp" INCUS_NOTIFY="$bin/notify" "$@" \
    "$HOOK" 2>"$state/stderr"
}

fail() { echo "disks_mounted test failed: $*" >&2; exit 1; }
health="$tmp/incus/plugin-health"

# The hook has no stop path at all; the event-level tests below can only see
# stops made through the overridable rc.incus.
! grep -Eq '(rc\.incus|RC_INCUS)"? +stop|admin shutdown' "$HOOK" || fail "hook can stop the daemon"

# A transient reconciliation failure is retried with doubling backoff.
state="$tmp/transient"
run_hook "$state" MOCK_INIT_FAILS=2 || fail "transient init failure was not recovered"
[[ "$(cat "$state/init-count")" = 3 ]] || fail "expected 3 init attempts"
[[ "$(grep -c '^sleep-' "$state/events")" = 2 ]] || fail "expected 2 backoff sleeps"
grep -Fxq 'sleep-5' "$state/events" || fail "first backoff should be 5s"
grep -Fxq 'sleep-10' "$state/events" || fail "second backoff should be 10s"
! grep -Fxq 'rc-stop' "$state/events" || fail "daemon was stopped during recovery"
grep -Fq 'daemon and containment environment ready' "$state/log" || fail "missing ready log"
[[ ! -e "$health" ]] || fail "recovered start must not record degraded health"
[[ ! -e "$state/notify" ]] || fail "recovered start must not notify"

# A persistent reconciliation failure does not stop the daemon and records why
# the plugin is degraded, including the Incus error text behind the trap line.
state="$tmp/persistent"
if run_hook "$state" MOCK_INIT_FAILS=99; then
  fail "persistent init failure should exit non-zero"
fi
[[ "$(cat "$state/init-count")" = 4 ]] || fail "expected the default 4 init attempts"
grep -Fxq 'sleep-20' "$state/events" || fail "third backoff should be 20s"
! grep -Fxq 'sleep-40' "$state/events" || fail "no backoff after the final attempt"
! grep -Fxq 'rc-stop' "$state/events" || fail "daemon was stopped after init failure"
[[ -f "$health" ]] || fail "degraded health file missing"
[[ ! -e "$health.tmp" ]] || fail "health temp file left behind"
grep -Fxq 'status=degraded' "$health" || fail "health status is not degraded"
grep -Fxq 'build=test-build' "$health" || fail "health build id missing"
grep -Eq '^time=.+' "$health" || fail "health time missing"
expected='message=environment reconciliation failed after 4 attempts: incus-init: FAILED (exit 1) at line 191: network acl edit attempt 4 (Error: database is locked)'
grep -Fxq "$expected" "$health" || { cat "$health" >&2; fail "unexpected health message"; }
[[ "$(wc -l <"$health")" = 4 ]] || fail "health file must stay four key=value lines"
! grep -q $'\r' "$health" || fail "carriage return kept in health message"
grep -Fq 'incus: array up: daemon left running in degraded state' "$state/log" || fail "degraded state not logged"
grep -Fxq 'incus-init-output: Error: database is locked' "$state/log" || fail "Incus error text not logged"
grep -Fxq 'incus-init-output: incus-init: progress before failure' "$state/log" || fail "full init output not logged"
grep -Fq -- '-i alert' "$state/notify" || fail "degraded state did not raise an alert"
grep -Fq 'Error: database is locked' "$state/notify" || fail "alert lacks the reason"
[[ ! -s "$state/stderr" ]] || { cat "$state/stderr" >&2; fail "hook wrote to stderr"; }

# A rejected configuration is not retried.
state="$tmp/config"
if run_hook "$state" MOCK_INIT_FAILS=99 MOCK_INIT_EXIT=78; then
  fail "config rejection should exit non-zero"
fi
[[ "$(cat "$state/init-count")" = 1 ]] || fail "config rejection was retried"
! grep -q '^sleep-' "$state/events" || fail "config rejection slept"
grep -Fq 'message=incus.cfg rejected: ' "$health" || fail "config rejection not recorded"

# A lock held by another run is retried and never reported as ready.
state="$tmp/locked"
if run_hook "$state" MOCK_INIT_FAILS=99 MOCK_INIT_EXIT=75; then
  fail "lock timeout should exit non-zero"
fi
[[ "$(cat "$state/init-count")" = 4 ]] || fail "lock timeout should be retried"
grep -Fq 'another incus-init.sh run held the lock' "$health" || fail "lock timeout not recorded"
! grep -Fq 'environment ready' "$state/log" || fail "lock timeout reported as ready"

# A hung init is killed, recorded and not retried, so it cannot hold up the
# rest of array start for several timeouts.
state="$tmp/hung"
if run_hook "$state" MOCK_INIT_HANG=1 INCUS_INIT_TIMEOUT=1; then
  fail "hung init should exit non-zero"
fi
[[ "$(cat "$state/init-count")" = 1 ]] || fail "hung init was retried"
grep -Fq 'message=environment reconciliation failed after 1 attempts: timed out after 1s; last output: incus-init: waiting on incusd' "$health" ||
  { cat "$health" >&2; fail "timeout not recorded"; }

# Silent failures still produce a reason.
state="$tmp/silent"
if run_hook "$state" MOCK_INIT_FAILS=99 MOCK_INIT_SILENT=1 INCUS_INIT_ATTEMPTS=1; then
  fail "silent failure should exit non-zero"
fi
grep -Fq 'incus-init.sh exited with status 1 and no output' "$health" || fail "silent failure has no reason"

# Attempts and backoff stay tunable, and invalid values fall back to defaults
# instead of looping forever.
state="$tmp/tuned"
if run_hook "$state" MOCK_INIT_FAILS=99 INCUS_INIT_ATTEMPTS=2 INCUS_INIT_BACKOFF=1; then
  fail "tuned persistent failure should exit non-zero"
fi
[[ "$(cat "$state/init-count")" = 2 ]] || fail "INCUS_INIT_ATTEMPTS not honoured"
grep -Fxq 'sleep-1' "$state/events" || fail "INCUS_INIT_BACKOFF not honoured"
state="$tmp/invalid"
if run_hook "$state" MOCK_INIT_FAILS=99 INCUS_INIT_ATTEMPTS=abc INCUS_INIT_BACKOFF='a[0]'; then
  fail "invalid tunables should still end in failure"
fi
[[ "$(cat "$state/init-count")" = 4 ]] || fail "invalid INCUS_INIT_ATTEMPTS did not fall back to 4"
grep -Fxq 'sleep-5' "$state/events" || fail "invalid INCUS_INIT_BACKOFF did not fall back to 5"
grep -Fq "ignoring invalid INCUS_INIT_ATTEMPTS='abc'" "$state/log" || fail "invalid tunable not logged"

# An unwritable health location is logged, not hidden.
state="$tmp/unwritable"
: >"$tmp/not-a-dir"
if MOCK_INCUS_DIR="$tmp/not-a-dir/incus" run_hook "$state" MOCK_INIT_FAILS=99 INCUS_INIT_ATTEMPTS=1; then
  fail "unwritable health should still exit non-zero"
fi
grep -Fq "incus: could not write $tmp/not-a-dir/incus/plugin-health" "$state/log" || fail "health write failure not logged"
[[ ! -s "$state/stderr" ]] || { cat "$state/stderr" >&2; fail "health write error leaked to stderr"; }

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
