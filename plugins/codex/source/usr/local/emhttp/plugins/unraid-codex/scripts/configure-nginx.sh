#!/bin/bash
set -euo pipefail

LOCATIONS="${UNRAID_NGINX_LOCATIONS:-/etc/nginx/conf.d/locations.conf}"
SNIPPET_DIR="${UNRAID_NGINX_LOCATION_DIR:-/etc/nginx/conf.d/locations}"
SNIPPET="$SNIPPET_DIR/unraid-codex.conf"
BEGIN_MARKER='# BEGIN unraid-codex location include'
END_MARKER='# END unraid-codex location include'
INCLUDE_LINE="include $SNIPPET;"
LOCK_FILE="${UNRAID_CODEX_NGINX_LOCK:-/var/run/unraid-codex-nginx.lock}"
MODE="${1:-install}"

case "$MODE" in
  install|remove|--remove) ;;
  *) echo "usage: $0 [install|remove]" >&2; exit 2 ;;
esac
[[ -f "$LOCATIONS" ]] || {
  logger -t unraid-codex "Unraid nginx locations file is unavailable"
  exit 1
}

exec 9>"$LOCK_FILE"
flock -w 60 9
install -d -m 0755 "$SNIPPET_DIR"
candidate="$(mktemp "$LOCATIONS.unraid-codex.XXXXXX")"
backup="$(mktemp "$LOCATIONS.unraid-codex-backup.XXXXXX")"
snippet_tmp="$(mktemp "$SNIPPET_DIR/.unraid-codex.XXXXXX")"
old_snippet=""
cleanup() { rm -f "$candidate" "$backup" "$snippet_tmp" "$old_snippet"; }
trap cleanup EXIT
cp -p "$LOCATIONS" "$backup"

awk -v begin="$BEGIN_MARKER" -v end="$END_MARKER" '
  $0 == begin { skipping = 1; next }
  $0 == end { skipping = 0; next }
  !skipping { print }
' "$LOCATIONS" >"$candidate"

if [[ "$MODE" = install ]]; then
  cat >"$snippet_tmp" <<'NGINX'
# Managed by the Unraid Codex plugin.
location = /webterminal/unraid-codex-appserver/ws {
    proxy_read_timeout 864000;
    proxy_pass http://unix:/var/run/unraid-codex-appserver.sock:/ws;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_set_header Sec-WebSocket-Extensions "";
}
NGINX
  chmod 0644 "$snippet_tmp"
  cat >>"$candidate" <<EOF
$BEGIN_MARKER
$INCLUDE_LINE
$END_MARKER
EOF
else
  : >"$snippet_tmp"
fi

chmod --reference="$LOCATIONS" "$candidate"
chown --reference="$LOCATIONS" "$candidate"
if [[ -f "$SNIPPET" ]]; then
  old_snippet="$(mktemp "$SNIPPET_DIR/.unraid-codex-backup.XXXXXX")"
  cp -p "$SNIPPET" "$old_snippet"
fi

if [[ "$MODE" = install ]]; then
  mv "$snippet_tmp" "$SNIPPET"
else
  rm -f "$SNIPPET"
fi
mv "$candidate" "$LOCATIONS"
if ! nginx -t; then
  cp -p "$backup" "$LOCATIONS"
  if [[ -n "$old_snippet" ]]; then mv "$old_snippet" "$SNIPPET"; else rm -f "$SNIPPET"; fi
  logger -t unraid-codex "Rejected invalid nginx route configuration"
  exit 1
fi
rm -f "$old_snippet"
nginx -s reload
logger -t unraid-codex "Configured dedicated Unraid Codex nginx location include ($MODE)"
