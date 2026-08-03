#!/bin/bash
set -euo pipefail

plugin_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
script="$plugin_dir/source/usr/local/emhttp/plugins/unraid-codex/scripts/configure-nginx.sh"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
bin="$tmp/bin"
snippet_dir="$tmp/locations"
locations="$tmp/locations.conf"
mkdir -p "$bin" "$snippet_dir"
printf 'location /existing { return 204; }\n' >"$locations"

cat >"$bin/nginx" <<'EOF'
#!/bin/bash
set -euo pipefail
if [[ "${1:-}" = -t ]]; then
  [[ "${MOCK_NGINX_TEST:-ok}" != fail ]]
  exit
fi
if [[ "${1:-}" = -s && "${2:-}" = reload ]]; then
  printf 'reload\n' >>"$MOCK_NGINX_LOG"
  exit
fi
exit 2
EOF
cat >"$bin/logger" <<'EOF'
#!/bin/sh
exit 0
EOF
chmod 0755 "$bin/nginx" "$bin/logger"

run_configure() {
  PATH="$bin:$PATH" \
    MOCK_NGINX_LOG="$tmp/nginx.log" \
    UNRAID_NGINX_LOCATIONS="$locations" \
    UNRAID_NGINX_LOCATION_DIR="$snippet_dir" \
    UNRAID_CODEX_NGINX_LOCK="$tmp/nginx.lock" \
    "$script" "$@"
}

run_configure install
grep -Fq '# BEGIN unraid-codex location include' "$locations"
grep -Fq "include $snippet_dir/unraid-codex.conf;" "$locations"
grep -Fq 'location = /webterminal/unraid-codex-appserver/ws {' "$snippet_dir/unraid-codex.conf"
[[ "$(grep -c '# BEGIN unraid-codex location include' "$locations")" -eq 1 ]]

run_configure install
[[ "$(grep -c '# BEGIN unraid-codex location include' "$locations")" -eq 1 ]]
[[ "$(grep -c '^reload$' "$tmp/nginx.log")" -eq 2 ]]

run_configure remove
if grep -Fq '# BEGIN unraid-codex location include' "$locations"; then
  echo 'nginx include marker remained after removal' >&2
  exit 1
fi
[[ ! -e "$snippet_dir/unraid-codex.conf" ]]

run_configure install
cp "$locations" "$tmp/locations.before"
cp "$snippet_dir/unraid-codex.conf" "$tmp/snippet.before"
if MOCK_NGINX_TEST=fail run_configure remove >/dev/null 2>&1; then
  echo 'invalid nginx configuration unexpectedly passed' >&2
  exit 1
fi
cmp -s "$tmp/locations.before" "$locations"
cmp -s "$tmp/snippet.before" "$snippet_dir/unraid-codex.conf"

echo 'Codex nginx lifecycle tests passed'
