#!/usr/bin/env bash
set -euo pipefail

plugin_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
hook="$plugin_dir/source/usr/local/emhttp/plugins/unraid-codex/event/disks_mounted"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

cat >"$tmp/start-appserver" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
attempts_file="${CODEX_TEST_ATTEMPTS:?}"
attempts="$(wc -l <"$attempts_file")"
printf 'attempt\n' >>"$attempts_file"
[[ "$attempts" -ge "${CODEX_TEST_FAILURES:-0}" ]]
EOF
chmod 0755 "$tmp/start-appserver"

: >"$tmp/attempts"
CODEX_START_APPSERVER="$tmp/start-appserver" \
  CODEX_START_RETRY_DELAY_SECONDS=0 \
  CODEX_TEST_ATTEMPTS="$tmp/attempts" \
  CODEX_TEST_FAILURES=2 \
  "$hook"
[[ "$(wc -l <"$tmp/attempts")" -eq 3 ]]

: >"$tmp/attempts"
if CODEX_START_APPSERVER="$tmp/start-appserver" \
  CODEX_START_RETRY_DELAY_SECONDS=0 \
  CODEX_START_MAX_ATTEMPTS=4 \
  CODEX_TEST_ATTEMPTS="$tmp/attempts" \
  CODEX_TEST_FAILURES=10 \
  "$hook"; then
  echo 'disks_mounted unexpectedly succeeded after retry exhaustion' >&2
  exit 1
fi
[[ "$(wc -l <"$tmp/attempts")" -eq 4 ]]

echo 'Codex disks_mounted retry tests passed'
