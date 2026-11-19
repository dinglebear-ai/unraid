#!/bin/bash
# plugin-health writer contract: daemon-level writes (including a restart's
# stop and start) never hide an unreconciled environment; only a successful
# reconciliation clears it.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
fail() { echo "incus-health test failed: $*" >&2; exit 1; }

INCUS_DIR="$tmp/incus"
# shellcheck disable=SC2034 # read by incus-health.sh
PLUGIN_BUILD=test-build
# shellcheck source=/dev/null
. "$ROOT/source/usr/local/emhttp/plugins/incus/scripts/incus-health.sh"
file="$INCUS_DIR/plugin-health"
field() { sed -n "s/^$1=//p" "$file"; }

incus_health_write ready "daemon socket healthy"
[[ "$(field status)" = ready && "$(field build)" = test-build ]] || fail "ready not written"

incus_health_write degraded $'reconciliation failed:\nsecond line'
[[ "$(field status)" = degraded ]] || fail "degraded not written"
[[ "$(field message)" = 'reconciliation failed: second line' ]] || fail "message not kept on one line"
[[ "$(field unreconciled)" = 'reconciliation failed: second line' ]] || fail "unreconciled reason not kept"
[[ "$(wc -l <"$file")" = 5 ]] || fail "degraded health file must be five lines"

incus_health_write ready "status check passed"
[[ "$(field status)" = degraded ]] || fail "daemon-level ready replaced degraded"
[[ "$(field message)" = 'reconciliation failed: second line' ]] || fail "daemon-level ready replaced the reason"
[[ "$(incus_health_status)" = degraded ]] || fail "incus_health_status misread the file"

# A restart reports the daemon state, then reports degraded again once the
# daemon answers.
for status in stopped failed; do
  incus_health_write "$status" "daemon down"
  [[ "$(field status)" = "$status" ]] || fail "$status not reported"
  [[ -n "$(field unreconciled)" ]] || fail "$status dropped the unreconciled reason"
  incus_health_write ready "daemon socket healthy"
  [[ "$(field status)" = degraded ]] || fail "restart through $status hid the unreconciled environment"
done

incus_health_write ready "environment reconciled" reconciled
[[ "$(field status)" = ready && "$(field message)" = 'environment reconciled' ]] ||
  fail "successful reconciliation did not clear degraded"
[[ -z "$(field unreconciled)" && "$(wc -l <"$file")" = 4 ]] || fail "reconciliation left the unreconciled line"
incus_health_write stopped "daemon and lxcfs stopped"
incus_health_write ready "daemon socket healthy"
[[ "$(field status)" = ready ]] || fail "reconciled environment reported degraded after a restart"

: >"$tmp/not-a-dir"
INCUS_DIR="$tmp/not-a-dir/incus"
if error="$(incus_health_write ready "x" 2>&1)"; then fail "unwritable location reported success"; fi
[[ "$error" = "could not write $tmp/not-a-dir/incus/plugin-health: "* ]] || fail "unexpected write error: $error"
[[ ! -e "$tmp/not-a-dir/incus/plugin-health.tmp" ]] || fail "temp file left behind"

printf 'incus-health tests passed\n'
