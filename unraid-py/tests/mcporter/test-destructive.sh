#!/usr/bin/env bash
# test-destructive.sh — Safe destructive action tests for unraid-mcp
#
# Tests all 15 destructive actions using create→destroy and no-op patterns.
# Actions with global blast radius (no safe isolation) are skipped.
#
# Transport: stdio — spawns uv run unraid-mcp-server per call; no running server needed.
#
# Usage:
#   ./tests/mcporter/test-destructive.sh [--confirm]
#
# Options:
#   --confirm   REQUIRED to execute destructive tests; without it, dry-runs only
#
# Exit codes:
#   0 — all executable tests passed (or dry-run)
#   1 — one or more tests failed
#   2 — prerequisite check failed

set -uo pipefail

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
readonly SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
readonly SCRIPT_NAME="$(basename -- "${BASH_SOURCE[0]}")"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

# ---------------------------------------------------------------------------
# Defaults
# ---------------------------------------------------------------------------
readonly PROJECT_DIR="$(cd -- "${SCRIPT_DIR}/../.." && pwd -P)"
CONFIRM=false

PASS=0; FAIL=0; SKIP=0
declare -a FAILED_TESTS=()

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --confirm) CONFIRM=true; shift ;;
    -h|--help)
      printf 'Usage: %s [--confirm]\n' "${SCRIPT_NAME}"
      exit 0
      ;;
    *) printf '[ERROR] Unknown argument: %s\n' "$1" >&2; exit 2 ;;
  esac
done

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
section() { echo ""; echo -e "${CYAN}${BOLD}━━━ $1 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; }

pass_test() {
  printf "  %-60s${GREEN}PASS${NC}\n" "$1"
  ((PASS++)) || true
}

fail_test() {
  local label="$1" reason="$2"
  printf "  %-60s${RED}FAIL${NC}\n" "${label}"
  printf "      %s\n" "${reason}"
  ((FAIL++)) || true
  FAILED_TESTS+=("${label}")
}

skip_test() {
  printf "  %-60s${YELLOW}SKIP${NC} (%s)\n" "$1" "$2"
  ((SKIP++)) || true
}

dry_run() {
  printf "  %-60s${CYAN}DRY-RUN${NC}\n" "$1"
  ((SKIP++)) || true
}

mcall() {
  local tool="$1" args="$2"
  mcporter call \
    --stdio "uv run --project ${PROJECT_DIR} unraid-mcp-server" \
    --tool "$tool" \
    --args "$args" \
    --output json \
    2>/dev/null
}

extract() {
  # extract <json> <python-expression>
  python3 -c "import json,sys; d=json.loads('''$1'''); print($2)" 2>/dev/null || true
}

# ---------------------------------------------------------------------------
# Connectivity check
# ---------------------------------------------------------------------------
echo ""
echo -e "${BOLD}Unraid MCP Destructive Action Test Suite${NC}"
echo -e "Transport: ${CYAN}stdio (uv run unraid-mcp-server)${NC}"
echo -e "Mode:    $(${CONFIRM} && echo "${RED}LIVE — destructive actions will execute${NC}" || echo "${YELLOW}DRY-RUN — pass --confirm to execute${NC}")"
echo ""

# ---------------------------------------------------------------------------
# docker: remove — skipped (two-machine problem)
# ---------------------------------------------------------------------------
section "docker: remove"
skip_test "docker: remove" "requires a pre-existing stopped container on the Unraid server — can't provision via local docker"

# ---------------------------------------------------------------------------
# docker: delete_entries — create folder → delete via MCP
# ---------------------------------------------------------------------------
section "docker: delete_entries"
skip_test "docker: delete_entries" "createDockerFolder mutation not available in this Unraid API version (HTTP 400)"

# ---------------------------------------------------------------------------
# docker: update_all — mock/safety audit only
# ---------------------------------------------------------------------------
section "docker: update_all"
skip_test "docker: update_all" "global blast radius — restarts all containers; safety audit only"

# ---------------------------------------------------------------------------
# docker: reset_template_mappings — mock/safety audit only
# ---------------------------------------------------------------------------
section "docker: reset_template_mappings"
skip_test "docker: reset_template_mappings" "wipes all template mappings globally; safety audit only"

# ---------------------------------------------------------------------------
# vm: force_stop — requires manual test VM setup
# ---------------------------------------------------------------------------
section "vm: force_stop"
skip_test "vm: force_stop" "requires pre-created Alpine test VM (no persistent disk)"

# ---------------------------------------------------------------------------
# vm: reset — requires manual test VM setup
# ---------------------------------------------------------------------------
section "vm: reset"
skip_test "vm: reset" "requires pre-created Alpine test VM (no persistent disk)"

# ---------------------------------------------------------------------------
# notifications: delete — create notification → delete via MCP
# ---------------------------------------------------------------------------
section "notifications: delete"

test_notifications_delete() {
  local label="notifications: delete"

  # Create the notification
  local create_raw
  create_raw="$(mcall unraid \
    '{"action":"notification","subaction":"create","title":"mcp-test-delete","subject":"MCP destructive test","description":"Safe to delete","importance":"INFO"}')"
  local create_ok
  create_ok="$(python3 -c "import json,sys; d=json.loads('''${create_raw}'''); print(d.get('success', False))" 2>/dev/null)"
  if [[ "${create_ok}" != "True" ]]; then
    fail_test "${label}" "create notification failed: ${create_raw}"
    return
  fi

  # The create response ID doesn't match the stored filename — list and find by title.
  # Use the LAST match so a stale notification with the same title is bypassed.
  local list_raw nid
  list_raw="$(mcall unraid '{"action":"notification","subaction":"list","notification_type":"UNREAD"}')"
  nid="$(python3 -c "
import json,sys
d = json.loads('''${list_raw}''')
notifs = d.get('notifications', [])
# Reverse so the most-recent match wins over any stale leftover
matches = [n['id'] for n in reversed(notifs) if n.get('title') == 'mcp-test-delete']
print(matches[0] if matches else '')
" 2>/dev/null)"

  if [[ -z "${nid}" ]]; then
    fail_test "${label}" "created notification not found in UNREAD list"
    return
  fi

  local del_raw
  del_raw="$(mcall unraid \
    "{\"action\":\"notification\",\"subaction\":\"delete\",\"notification_id\":\"${nid}\",\"notification_type\":\"UNREAD\",\"confirm\":true}")"
  # success=true OR deleteNotification key present (raw GraphQL response) both indicate success
  local success
  success="$(python3 -c "
import json,sys
d=json.loads('''${del_raw}''')
ok = d.get('success', False) or ('deleteNotification' in d)
print(ok)
" 2>/dev/null)"

  if [[ "${success}" != "True" ]]; then
    # Leak: notification created but not deleted — archive it so it doesn't clutter the feed
    mcall unraid "{\"action\":\"notification\",\"subaction\":\"archive\",\"notification_id\":\"${nid}\"}" &>/dev/null || true
    fail_test "${label}" "delete did not return success=true: ${del_raw} (notification archived as fallback cleanup)"
    return
  fi

  pass_test "${label}"
}

if ${CONFIRM}; then
  test_notifications_delete
else
  dry_run "notifications: delete  [create notification → mcall unraid action=notification subaction=delete]"
fi

# ---------------------------------------------------------------------------
# notifications: delete_archived — bulk wipe; skip (hard to isolate)
# ---------------------------------------------------------------------------
section "notifications: delete_archived"
skip_test "notifications: delete_archived" "bulk wipe of ALL archived notifications; run manually on shart if needed"

# ---------------------------------------------------------------------------
# rclone: delete_remote — create local:/tmp remote → delete via MCP
# ---------------------------------------------------------------------------
section "rclone: delete_remote"
skip_test "rclone: delete_remote" "createRCloneRemote broken server-side on this Unraid version (url slash error)"

# ---------------------------------------------------------------------------
# keys: delete — create test key → delete via MCP
# ---------------------------------------------------------------------------
section "keys: delete"

test_keys_delete() {
  local label="keys: delete"

  # Guard: abort if test key already exists (don't delete a real key)
  # Note: API key names cannot contain hyphens — use "mcp test key"
  local existing_keys
  existing_keys="$(mcall unraid '{"action":"key","subaction":"list"}')"
  if python3 -c "
import json,sys
d = json.loads('''${existing_keys}''')
keys = d.get('keys', d.get('apiKeys', []))
sys.exit(1 if any(k.get('name') == 'mcp test key' for k in keys) else 0)
" 2>/dev/null; then
    : # not found, safe to proceed
  else
    fail_test "${label}" "a key named 'mcp test key' already exists — refusing to proceed"
    return
  fi

  local create_raw
  create_raw="$(mcall unraid \
    '{"action":"key","subaction":"create","name":"mcp test key","roles":["VIEWER"]}')"
  local kid
  kid="$(python3 -c "import json,sys; d=json.loads('''${create_raw}'''); print(d.get('key',{}).get('id',''))" 2>/dev/null)"

  if [[ -z "${kid}" ]]; then
    fail_test "${label}" "create key did not return an ID"
    return
  fi

  local del_raw
  del_raw="$(mcall unraid "{\"action\":\"key\",\"subaction\":\"delete\",\"key_id\":\"${kid}\",\"confirm\":true}")"
  local success
  success="$(python3 -c "import json,sys; d=json.loads('''${del_raw}'''); print(d.get('success', False))" 2>/dev/null)"

  if [[ "${success}" != "True" ]]; then
    # Cleanup: attempt to delete the leaked key so future runs are not blocked
    mcall unraid "{\"action\":\"key\",\"subaction\":\"delete\",\"key_id\":\"${kid}\",\"confirm\":true}" &>/dev/null || true
    fail_test "${label}" "delete did not return success=true: ${del_raw} (key delete re-attempted as fallback cleanup)"
    return
  fi

  # Verify gone
  local list_raw
  list_raw="$(mcall unraid '{"action":"key","subaction":"list"}')"
  if python3 -c "
import json,sys
d = json.loads('''${list_raw}''')
keys = d.get('keys', d.get('apiKeys', []))
sys.exit(0 if not any(k.get('id') == '${kid}' for k in keys) else 1)
" 2>/dev/null; then
    pass_test "${label}"
  else
    fail_test "${label}" "key still present in list after delete"
  fi
}

if ${CONFIRM}; then
  test_keys_delete
else
  dry_run "keys: delete  [create test key → mcall unraid action=key subaction=delete]"
fi

# ---------------------------------------------------------------------------
# storage: flash_backup — requires dedicated test remote
# ---------------------------------------------------------------------------
section "storage: flash_backup"
skip_test "storage: flash_backup" "requires dedicated test remote pre-configured and isolated destination"

# ---------------------------------------------------------------------------
# settings: configure_ups — mock/safety audit only
# ---------------------------------------------------------------------------
section "settings: configure_ups"
skip_test "settings: configure_ups" "wrong config breaks UPS monitoring; safety audit only"

# ---------------------------------------------------------------------------
# settings: setup_remote_access — mock/safety audit only
# ---------------------------------------------------------------------------
section "settings: setup_remote_access"
skip_test "settings: setup_remote_access" "misconfiguration can lock out remote access; safety audit only"

# ---------------------------------------------------------------------------
# settings: enable_dynamic_remote_access — shart only, toggle false → restore
# ---------------------------------------------------------------------------
section "settings: enable_dynamic_remote_access"
skip_test "settings: enable_dynamic_remote_access" "run manually on shart (10.1.0.3) only — see docs/DESTRUCTIVE_ACTIONS.md"

# ---------------------------------------------------------------------------
# info: update_ssh — read current values, re-apply same (no-op)
# ---------------------------------------------------------------------------
section "info: update_ssh"
skip_test "info: update_ssh" "updateSshSettings mutation not available in this Unraid API version (HTTP 400)"

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
TOTAL=$((PASS + FAIL + SKIP))
echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Results: ${GREEN}${PASS} passed${NC}  ${RED}${FAIL} failed${NC}  ${YELLOW}${SKIP} skipped${NC}  (${TOTAL} total)"

if [[ ${#FAILED_TESTS[@]} -gt 0 ]]; then
  echo ""
  echo -e "${RED}${BOLD}Failed tests:${NC}"
  for t in "${FAILED_TESTS[@]}"; do
    echo -e "  ${RED}✗${NC} ${t}"
  done
fi

echo ""
if ! ${CONFIRM}; then
  echo -e "${YELLOW}Dry-run complete. Pass --confirm to execute destructive tests.${NC}"
fi

[[ ${FAIL} -eq 0 ]] && exit 0 || exit 1
