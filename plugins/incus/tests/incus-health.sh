#!/bin/bash
# plugin-health writer contract: a daemon-level "ready" never hides a
# degraded environment; only a successful reconciliation clears it.
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
[[ "$(wc -l <"$file")" = 4 ]] || fail "health file must stay four lines"

incus_health_write ready "status check passed"
[[ "$(field status)" = degraded ]] || fail "daemon-level ready replaced degraded"
[[ "$(incus_health_status)" = degraded ]] || fail "incus_health_status misread the file"

incus_health_write ready "environment reconciled" reconciled
[[ "$(field status)" = ready && "$(field message)" = 'environment reconciled' ]] ||
  fail "successful reconciliation did not clear degraded"

for status in failed stopped; do
  incus_health_write degraded "x"
  incus_health_write "$status" "daemon down"
  [[ "$(field status)" = "$status" ]] || fail "$status did not replace degraded"
done

: >"$tmp/not-a-dir"
INCUS_DIR="$tmp/not-a-dir/incus"
if error="$(incus_health_write ready "x" 2>&1)"; then fail "unwritable location reported success"; fi
[[ "$error" = "could not write $tmp/not-a-dir/incus/plugin-health: "* ]] || fail "unexpected write error: $error"
[[ ! -e "$tmp/not-a-dir/incus/plugin-health.tmp" ]] || fail "temp file left behind"

printf 'incus-health tests passed\n'
