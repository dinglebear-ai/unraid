#!/bin/bash
# The jq programs intentionally use single quotes so their $name variables are
# evaluated by jq rather than expanded by the shell.
# shellcheck disable=SC2016
set -euo pipefail

PLUGIN_NAME="unraid-api-plugin-incus"
API_PACKAGE_JSON="${API_PACKAGE_JSON:-/usr/local/unraid-api/package.json}"
API_CONFIG_JSON="${API_CONFIG_JSON:-/boot/config/plugins/dynamix.my.servers/configs/api.json}"

update_json() {
  local path="$1" filter="$2" tmp
  [ -f "$path" ] || { echo "missing JSON file: $path" >&2; return 1; }
  tmp="$(mktemp "${path}.tmp.XXXXXX")"
  trap 'rm -f "$tmp"' RETURN
  jq --arg name "$PLUGIN_NAME" "$filter" "$path" >"$tmp"
  chmod --reference="$path" "$tmp"
  chown --reference="$path" "$tmp"
  mv -f "$tmp" "$path"
  trap - RETURN
}

register_plugin() {
  update_json "$API_PACKAGE_JSON" \
    '.peerDependencies = ((.peerDependencies // {}) + {($name): "*"})'
  update_json "$API_CONFIG_JSON" \
    '.plugins = ((.plugins // []) | if index($name) then . else . + [$name] end)'
}

unregister_plugin() {
  update_json "$API_PACKAGE_JSON" \
    'del(.peerDependencies[$name]) | if ((.peerDependencies // {}) | length) == 0 then del(.peerDependencies) else . end'
  update_json "$API_CONFIG_JSON" \
    '.plugins = ((.plugins // []) | map(select(. != $name and (startswith($name + "@") | not))))'
}

case "${1:-}" in
  register) register_plugin ;;
  unregister) unregister_plugin ;;
  *) echo "usage: $0 {register|unregister}" >&2; exit 2 ;;
esac
