#!/bin/bash
# Watchdog contract: one slow health check must not restart the daemon (a
# restart tears down the managed bridges), a failed reconciliation after a
# restart is recorded as degraded, and a degraded environment is retried until
# incus-init.sh succeeds.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PLUGIN="$ROOT/source/usr/local/emhttp/plugins/incus"
WATCHDOG="$PLUGIN/scripts/incus-watchdog.sh"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
bin="$tmp/bin"
emhttp="$tmp/emhttp"
mkdir -p "$bin" "$emhttp/scripts"
ln -s "$PLUGIN/scripts/incus-health.sh" "$emhttp/scripts/incus-health.sh"
printf 'test-build\n' >"$emhttp/build-id"

# `incus info` answers per line of $MOCK_DIR/info: "ok" or "down"; the last
# line repeats.
cat >"$bin/incus" <<'EOF'
#!/bin/bash
[[ "$1" = info ]] || exit 2
n=0; [[ -r "$MOCK_DIR/info-n" ]] && n="$(cat "$MOCK_DIR/info-n")"
n=$((n + 1)); echo "$n" >"$MOCK_DIR/info-n"
answer="$(sed -n "${n}p" "$MOCK_DIR/info")"; [[ -n "$answer" ]] || answer="$(tail -n 1 "$MOCK_DIR/info")"
printf 'info-%s\n' "$answer" >>"$MOCK_DIR/events"
[[ "$answer" = ok ]]
EOF

cat >"$bin/rc.incus" <<'EOF'
#!/bin/bash
printf 'rc-%s\n' "$1" >>"$MOCK_DIR/events"
EOF

# Fails MOCK_INIT_FAILS times with MOCK_INIT_EXIT, then succeeds and clears
# degraded the way the real script does.
cat >"$emhttp/scripts/incus-init.sh" <<'EOF'
#!/bin/bash
count=0; [[ -r "$MOCK_DIR/init-count" ]] && count="$(cat "$MOCK_DIR/init-count")"
count=$((count + 1)); echo "$count" >"$MOCK_DIR/init-count"
printf 'init-%s\n' "$count" >>"$MOCK_DIR/events"
if [[ "${MOCK_INIT_HANG:-0}" = 1 ]]; then
  echo "$$" >"$MOCK_DIR/init-pid"
  command -p sleep 30
fi
if [[ "$count" -le "${MOCK_INIT_FAILS:-0}" ]]; then
  echo "incus-init: FAILED (exit 1) at line 9: attempt ${count}" >&2
  exit "${MOCK_INIT_EXIT:-1}"
fi
. "$INCUS_CONFIG"
. "$INCUS_EMHTTP/scripts/incus-health.sh"
incus_health_write ready "environment reconciled" reconciled
EOF

cat >"$bin/logger" <<'EOF'
#!/bin/bash
tag=logger
[[ "${1:-}" = -t ]] && { tag="$2"; shift 2; }
if [[ $# -gt 0 ]]; then printf '%s: %s\n' "$tag" "$*" >>"$MOCK_DIR/log"
else while IFS= read -r line; do printf '%s: %s\n' "$tag" "$line" >>"$MOCK_DIR/log"; done; fi
EOF

cat >"$bin/sleep" <<'EOF'
#!/bin/bash
exit 0
EOF
chmod 0755 "$bin"/* "$emhttp/scripts/incus-init.sh"

fail() { echo "incus-watchdog test failed: $*" >&2; exit 1; }

# run_watchdog <case> <loops> <info answers...>; env from the caller.
run_watchdog() {
  local case_dir="$tmp/$1" loops="$2"; shift 2
  mkdir -p "$case_dir/incus"
  printf '%s\n' "$@" >"$case_dir/info"
  printf 'SERVICE=enabled\nINCUS_DIR="%s"\n' "$case_dir/incus" >"$case_dir/incus.cfg"
  if [[ -n "${MOCK_HEALTH:-}" ]]; then
    printf 'status=%s\ntime=t\nbuild=b\nmessage=seeded\n' "$MOCK_HEALTH" >"$case_dir/incus/plugin-health"
    [[ "$MOCK_HEALTH" != degraded ]] || printf 'unreconciled=seeded\n' >>"$case_dir/incus/plugin-health"
  fi
  env MOCK_DIR="$case_dir" PATH="$bin:$PATH" INCUS_CONFIG="$case_dir/incus.cfg" \
    INCUS_EMHTTP="$emhttp" INCUS_BIN="$bin/incus" INCUS_RC="$bin/rc.incus" \
    INCUS_WATCHDOG_MAX_LOOPS="$loops" INCUS_WATCHDOG_RECONCILE_DELAY=0 \
    "$WATCHDOG" 2>"$case_dir/stderr"
}
health_of() { sed -n 's/^status=//p' "$tmp/$1/incus/plugin-health"; }

# Two slow checks between healthy ones do not restart the daemon.
run_watchdog blip 5 ok down down ok ok || fail "blip run failed"
! grep -q '^rc-' "$tmp/blip/events" || fail "daemon restarted after a transient blip"
grep -Fq 'incusd did not answer (2/3 consecutive checks)' "$tmp/blip/log" || fail "slow checks not logged"

# Three consecutive failures restart it, and a failed reconciliation after the
# restart is recorded as degraded.
MOCK_INIT_FAILS=1 run_watchdog restart 3 down down down || fail "restart run failed"
grep -Fxq 'rc-stop' "$tmp/restart/events" || fail "daemon not stopped after 3 failures"
grep -Fxq 'rc-start' "$tmp/restart/events" || fail "daemon not started after 3 failures"
[[ "$(health_of restart)" = degraded ]] || fail "failed reconciliation after restart not recorded"
grep -Fq 'message=watchdog restarted incusd but reconciliation failed: incus-init: FAILED (exit 1) at line 9: attempt 1' \
  "$tmp/restart/incus/plugin-health" || fail "degraded reason missing"

# A degraded environment is retried until reconciliation succeeds, which
# clears it.
MOCK_HEALTH=degraded MOCK_INIT_FAILS=1 run_watchdog retry 3 ok || fail "retry run failed"
[[ "$(cat "$tmp/retry/init-count")" = 2 ]] || fail "expected a failed then a successful reconciliation"
[[ "$(health_of retry)" = ready ]] || fail "successful reconciliation did not clear degraded"
grep -Fq 'degraded environment reconciled' "$tmp/retry/log" || fail "recovery not logged"
! grep -q '^rc-' "$tmp/retry/events" || fail "reconciliation retry restarted the daemon"

# A rejected config is not retried until incus.cfg changes.
MOCK_HEALTH=degraded MOCK_INIT_FAILS=99 MOCK_INIT_EXIT=78 run_watchdog rejected 4 ok || fail "rejected run failed"
[[ "$(cat "$tmp/rejected/init-count")" = 1 ]] || fail "rejected config was retried"
[[ "$(health_of rejected)" = degraded ]] || fail "rejected config cleared degraded"

# A healthy, reconciled environment is left alone.
MOCK_HEALTH=ready run_watchdog quiet 3 ok || fail "quiet run failed"
[[ ! -e "$tmp/quiet/init-count" ]] || fail "watchdog reconciled a ready environment"

# The restart limit still records failure and stops supervising.
status=0
run_watchdog limit 20 down || status=$?
[[ "$status" = 1 ]] || fail "restart limit should exit 1, got $status"
[[ "$(grep -c '^rc-stop$' "$tmp/limit/events")" = 3 ]] || fail "expected 3 restarts before giving up"
[[ "$(health_of limit)" = failed ]] || fail "restart limit not recorded"

# The limit applies per incident: recoveries separated by healthy checks do
# not add up to a permanent give-up.
answers=()
for _ in 1 2 3 4; do answers+=(down down down ok ok); done
INCUS_WATCHDOG_HEALTHY_RESET=2 run_watchdog incidents 20 "${answers[@]}" || fail "separate incidents hit the restart limit"
[[ "$(grep -c '^rc-stop$' "$tmp/incidents/events")" = 4 ]] || fail "expected one restart per incident"
[[ "$(health_of incidents)" != failed ]] || fail "separate incidents recorded failure"

# Stopping the watchdog mid-reconciliation also stops that reconciliation, so
# no orphan keeps the init lock or runs against a restarted daemon.
case_dir="$tmp/term"
mkdir -p "$case_dir/incus"
printf 'ok\n' >"$case_dir/info"
printf 'SERVICE=enabled\nINCUS_DIR="%s"\n' "$case_dir/incus" >"$case_dir/incus.cfg"
printf 'status=degraded\ntime=t\nbuild=b\nmessage=seeded\nunreconciled=seeded\n' >"$case_dir/incus/plugin-health"
env MOCK_DIR="$case_dir" MOCK_INIT_HANG=1 PATH="$bin:$PATH" INCUS_CONFIG="$case_dir/incus.cfg" \
  INCUS_EMHTTP="$emhttp" INCUS_BIN="$bin/incus" INCUS_RC="$bin/rc.incus" \
  INCUS_WATCHDOG_RECONCILE_DELAY=0 "$WATCHDOG" 2>"$case_dir/stderr" &
watchdog_pid=$!
for _ in $(seq 1 100); do [[ -s "$case_dir/init-pid" ]] && break; command -p sleep 0.1; done
[[ -s "$case_dir/init-pid" ]] || { kill "$watchdog_pid"; fail "reconciliation never started"; }
init_pid="$(cat "$case_dir/init-pid")"
term_sent=$SECONDS
kill -TERM "$watchdog_pid"
status=0
wait "$watchdog_pid" || status=$?
[[ "$status" = 143 ]] || fail "TERM should exit 143, got $status"
[[ $((SECONDS - term_sent)) -lt 10 ]] || fail "TERM waited for the reconciliation to finish on its own"
for _ in $(seq 1 50); do kill -0 "$init_pid" 2>/dev/null || break; command -p sleep 0.1; done
! kill -0 "$init_pid" 2>/dev/null || { kill "$init_pid"; fail "reconciliation survived the watchdog"; }
[[ -z "$(find "${TMPDIR:-/tmp}" -maxdepth 1 -name 'incus-watchdog.*' -newer "$case_dir/incus.cfg" 2>/dev/null)" ]] ||
  fail "watchdog left its output file behind"

printf 'incus-watchdog tests passed\n'
