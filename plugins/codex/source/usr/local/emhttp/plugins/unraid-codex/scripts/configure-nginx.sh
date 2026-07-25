#!/bin/bash
set -euo pipefail

LOCATIONS=/etc/nginx/conf.d/locations.conf
BEGIN_MARKER='# BEGIN unraid-codex app-server route'
END_MARKER='# END unraid-codex app-server route'
MODE="${1:-install}"

if [[ ! -f "$LOCATIONS" ]]; then
  logger -t unraid-codex "Unraid nginx locations file is unavailable"
  exit 1
fi

case "$MODE" in
  install|--remove) ;;
  *)
    echo "usage: $0 [install|--remove]" >&2
    exit 2
    ;;
esac

candidate="$(mktemp /etc/nginx/conf.d/locations.conf.unraid-codex.XXXXXX)"
backup="$(mktemp /etc/nginx/conf.d/locations.conf.unraid-codex-backup.XXXXXX)"

cleanup() {
  rm -f "$candidate" "$backup"
}
trap cleanup EXIT

cp -p "$LOCATIONS" "$backup"
awk -v begin="$BEGIN_MARKER" -v end="$END_MARKER" '
  $0 == begin { skipping = 1; next }
  $0 == end { skipping = 0; next }
  !skipping { print }
' "$LOCATIONS" >"$candidate"

if [[ "$MODE" == install ]]; then
  cat >>"$candidate" <<'NGINX'
# BEGIN unraid-codex app-server route
#
# Codex app-server currently closes browser handshakes that advertise
# permessage-deflate. Keep this override exact and strip the extension only for
# the plugin endpoint; every other Unraid websocket keeps the stock behavior.
location = /webterminal/unraid-codex-appserver/ws {
    proxy_read_timeout 864000;
    proxy_pass http://unix:/var/run/unraid-codex-appserver.sock:/ws;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_set_header Sec-WebSocket-Extensions "";
}
# END unraid-codex app-server route
NGINX
fi

chmod --reference="$LOCATIONS" "$candidate"
chown --reference="$LOCATIONS" "$candidate"

if cmp -s "$LOCATIONS" "$candidate"; then
  exit 0
fi

mv "$candidate" "$LOCATIONS"
if ! nginx -t; then
  cp -p "$backup" "$LOCATIONS"
  logger -t unraid-codex "Rejected invalid nginx route configuration"
  exit 1
fi

nginx -s reload
if [[ "$MODE" == install ]]; then
  logger -t unraid-codex "Installed Unraid nginx app-server route"
else
  logger -t unraid-codex "Removed Unraid nginx app-server route"
fi
