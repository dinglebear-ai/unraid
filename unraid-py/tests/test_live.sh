#!/usr/bin/env bash
# =============================================================================
# tests/test_live.sh — Canonical live integration test for unraid-mcp
#
# Exercises the full HTTP stack and optionally docker/stdio modes.
# Gold-standard approach: direct JSON-RPC (no mcporter dependency for HTTP).
#
# Usage:
#   ./tests/test_live.sh
#   ./tests/test_live.sh --mode http
#   ./tests/test_live.sh --mode docker
#   ./tests/test_live.sh --mode stdio
#   ./tests/test_live.sh --mode all
#   ./tests/test_live.sh --url http://localhost:6970/mcp --token <tok>
#   ./tests/test_live.sh --skip-auth
#   ./tests/test_live.sh --skip-tools
#   ./tests/test_live.sh --verbose
#
# Options:
#   --mode MODE     Test mode: http|docker|stdio|all (default: all)
#   --url URL       MCP endpoint for http mode (default: http://localhost:6970/mcp)
#   --token TOK     Bearer token (auto-read from ~/.unraid-mcp/.env if omitted)
#   --skip-auth     Skip Phase 2 auth tests (for OAuth gateway deployments)
#   --skip-tools    Skip Phase 4 tool smoke-tests (no live Unraid API needed)
#   --verbose       Print raw response bodies
#
# Environment variables:
#   UNRAID_API_URL              Unraid API URL (required for docker/stdio modes)
#   UNRAID_API_KEY              Unraid API key (required for docker/stdio modes)
#   UNRAID_MCP_BEARER_TOKEN     MCP bearer token (or use TOKEN)
#   TOKEN                       Alias for UNRAID_MCP_BEARER_TOKEN
#   PORT                        Override server port (default: 6970)
#
# Exit codes:
#   0 — all tests passed (or skipped)
#   1 — one or more tests failed
#   2 — prerequisite check failed
# =============================================================================

set -uo pipefail

# ---------------------------------------------------------------------------
# Script metadata
# ---------------------------------------------------------------------------
readonly SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
readonly REPO_DIR="$(cd -- "${SCRIPT_DIR}/.." && pwd -P)"
readonly ENTRY_POINT="unraid-mcp-server"

# ---------------------------------------------------------------------------
# Defaults
# ---------------------------------------------------------------------------
MODE="all"
MCP_PORT="${PORT:-6970}"
MCP_URL="http://localhost:${MCP_PORT}/mcp"
TOKEN="${UNRAID_MCP_BEARER_TOKEN:-${TOKEN:-}}"
SKIP_AUTH=false
SKIP_TOOLS=false
VERBOSE=false

# ---------------------------------------------------------------------------
# Colours
# ---------------------------------------------------------------------------
if [[ -t 1 ]]; then
  R='\033[0;31m' G='\033[0;32m' Y='\033[0;33m' C='\033[0;36m'
  B='\033[1m' D='\033[2m' N='\033[0m'
else
  R='' G='' Y='' C='' B='' D='' N=''
fi

# ---------------------------------------------------------------------------
# Counters
# ---------------------------------------------------------------------------
PASS=0; FAIL=0; SKIP=0
declare -a FAILED=()

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --mode)        MODE="${2:?--mode requires a value}";   shift 2 ;;
    --url)         MCP_URL="${2:?--url requires a value}"; shift 2 ;;
    --token)       TOKEN="${2:?--token requires a value}"; shift 2 ;;
    --skip-auth)   SKIP_AUTH=true;                         shift ;;
    --skip-tools)  SKIP_TOOLS=true;                        shift ;;
    --verbose)     VERBOSE=true;                           shift ;;
    -h|--help)
      sed -n '3,26p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *) printf '[ERROR] Unknown argument: %s\n' "$1" >&2; exit 2 ;;
  esac
done

# Validate mode
case "$MODE" in
  http|docker|stdio|all) ;;
  *) printf '[ERROR] Invalid --mode: %s (must be http|docker|stdio|all)\n' "$MODE" >&2; exit 2 ;;
esac

# ---------------------------------------------------------------------------
# Helpers — display
# ---------------------------------------------------------------------------
section() { printf "\n${C}${B}━━━ %s ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${N}\n" "$1"; }
pass()    { printf "  %-62s${G}PASS${N}\n" "$1"; (( PASS++ )); }
fail()    { printf "  %-62s${R}FAIL${N}\n" "$1"; (( FAIL++ )); FAILED+=("$1"); }
skip()    { printf "  %-62s${Y}SKIP${N}${D} (%s)${N}\n" "$1" "${2:-}"; (( SKIP++ )); }
verbose() { [[ "$VERBOSE" == true ]] && printf "${D}    %s${N}\n" "$1" || true; }

# ---------------------------------------------------------------------------
# Helpers — HTTP / JSON-RPC
# ---------------------------------------------------------------------------

# http_get URL [extra_curl_args...]
# Sets: HTTP_STATUS, HTTP_BODY
http_get() {
  local url="$1"; shift
  local tmp; tmp="$(mktemp)"
  HTTP_STATUS="$(curl -sk --max-time 10 -w '%{http_code}' -o "$tmp" "$@" "$url")"
  HTTP_BODY="$(cat "$tmp")"; rm -f "$tmp"
  verbose "$HTTP_BODY"
}

# mcp_post METHOD [PARAMS_JSON]
# Posts a JSON-RPC request to MCP_URL with the configured token.
# Sets: HTTP_STATUS, HTTP_BODY, MCP_RESULT, MCP_ERROR
_MCP_ID=0
MCP_SESSION_ID=""

mcp_post() {
  local method="$1"
  local params="${2:-null}"
  (( _MCP_ID++ ))
  local payload; payload="$(jq -cn --arg m "$method" --argjson p "$params" \
    --argjson id "$_MCP_ID" \
    '{"jsonrpc":"2.0","id":$id,"method":$m,"params":$p}')"

  local args=(-sk --max-time 15
    -X POST
    -H "Content-Type: application/json"
    -H "Accept: application/json, text/event-stream"
  )
  [[ -n "$TOKEN" ]] && args+=(-H "Authorization: Bearer $TOKEN")
  [[ -n "${MCP_SESSION_ID:-}" ]] && args+=(-H "Mcp-Session-Id: $MCP_SESSION_ID")

  local tmp; tmp="$(mktemp)"
  HTTP_STATUS="$(curl "${args[@]}" -D "$tmp.hdr" -w '%{http_code}' \
    -o "$tmp.body" "$MCP_URL" -d "$payload")"
  HTTP_BODY="$(cat "$tmp.body" 2>/dev/null)"

  # Extract session ID if present
  local sid; sid="$(grep -i '^mcp-session-id:' "$tmp.hdr" 2>/dev/null \
    | head -1 | awk '{print $2}' | tr -d '\r')"
  [[ -n "$sid" ]] && MCP_SESSION_ID="$sid"

  rm -f "$tmp" "$tmp.hdr" "$tmp.body"
  verbose "$HTTP_BODY"

  # For SSE responses, extract the JSON data line
  if printf '%s' "$HTTP_BODY" | grep -q '^data:'; then
    HTTP_BODY="$(printf '%s' "$HTTP_BODY" | grep '^data:' | head -1 | sed 's/^data: //')"
  fi

  MCP_RESULT="$(printf '%s' "$HTTP_BODY" | jq -r '.result // empty' 2>/dev/null)"
  MCP_ERROR="$(printf '%s' "$HTTP_BODY" | jq -r '.error // empty' 2>/dev/null)"
}

# assert_jq LABEL JSON_INPUT JQ_FILTER
# Passes if jq filter returns a non-empty, non-null, non-false value.
assert_jq() {
  local label="$1" body="$2" filter="$3"
  local val; val="$(printf '%s' "$body" | jq -r "$filter" 2>/dev/null)"
  if [[ -n "$val" && "$val" != "null" && "$val" != "false" ]]; then
    pass "$label"
  else
    fail "$label"
    verbose "  filter: $filter"
    verbose "  body:   $(printf '%s' "$body" | head -c 300)"
  fi
}

# call_unraid LABEL ACTION SUBACTION [EXTRA_ARGS_JSON]
# Calls the unraid tool via mcp_post and checks for no tool error.
call_unraid() {
  local label="$1" action="$2" subaction="$3"
  local extra_params="${4:-}"
  local params; params="$(jq -cn \
    --arg a "$action" --arg s "$subaction" \
    '{"name":"unraid","arguments":{"action":$a,"subaction":$s}}')"
  if [[ -n "$extra_params" ]]; then
    params="$(printf '%s' "$params" | jq --argjson x "$extra_params" '.arguments += $x')"
  fi
  mcp_post "tools/call" "$params"

  if [[ "$HTTP_STATUS" == "200" ]]; then
    if printf '%s' "$HTTP_BODY" | jq -e '.result.isError == true' &>/dev/null; then
      local errmsg; errmsg="$(printf '%s' "$HTTP_BODY" | jq -r '.result.content[0].text' 2>/dev/null | head -c 100)"
      fail "$label  (tool error: $errmsg)"
    else
      pass "$label"
    fi
  else
    local detail; detail="$(printf '%s' "$HTTP_BODY" | jq -r \
      '.error.message // .result.content[0].text // empty' 2>/dev/null | head -c 120)"
    fail "$label  (HTTP $HTTP_STATUS${detail:+: $detail})"
  fi
}

# call_unraid_optional LABEL ACTION SUBACTION SKIP_REGEX SKIP_REASON [EXTRA_ARGS_JSON]
# Calls the unraid tool and passes on success. Tool errors matching SKIP_REGEX are
# treated as an environment/API-version skip, which keeps live smoke-tests useful
# against older or feature-disabled Unraid installs while still surfacing the
# skipped coverage explicitly.
call_unraid_optional() {
  local label="$1" action="$2" subaction="$3" skip_regex="$4" skip_reason="$5"
  local extra_params="${6:-}"
  local params; params="$(jq -cn \
    --arg a "$action" --arg s "$subaction" \
    '{"name":"unraid","arguments":{"action":$a,"subaction":$s}}')"
  if [[ -n "$extra_params" ]]; then
    params="$(printf '%s' "$params" | jq --argjson x "$extra_params" '.arguments += $x')"
  fi
  mcp_post "tools/call" "$params"

  if [[ "$HTTP_STATUS" == "200" ]]; then
    if printf '%s' "$HTTP_BODY" | jq -e '.result.isError == true' &>/dev/null; then
      local errmsg; errmsg="$(printf '%s' "$HTTP_BODY" | jq -r '.result.content[0].text' 2>/dev/null | head -c 220)"
      if printf '%s' "$errmsg" | grep -qiE "$skip_regex"; then
        skip "$label" "$skip_reason: $errmsg"
      else
        fail "$label  (tool error: $(printf '%s' "$errmsg" | head -c 100))"
      fi
    else
      pass "$label"
    fi
  else
    local detail; detail="$(printf '%s' "$HTTP_BODY" | jq -r \
      '.error.message // .result.content[0].text // empty' 2>/dev/null | head -c 120)"
    if printf '%s\n%s' "$HTTP_STATUS" "$detail" | grep -qiE "$skip_regex"; then
      skip "$label" "$skip_reason: HTTP $HTTP_STATUS${detail:+: $detail}"
    else
      fail "$label  (HTTP $HTTP_STATUS${detail:+: $detail})"
    fi
  fi
}

# ---------------------------------------------------------------------------
# Token auto-detect
# ---------------------------------------------------------------------------
_resolve_token() {
  if [[ -z "$TOKEN" ]]; then
    local env_file="$HOME/.unraid-mcp/.env"
    if [[ -f "$env_file" ]]; then
      TOKEN="$(grep -E '^UNRAID_MCP_BEARER_TOKEN=' "$env_file" 2>/dev/null \
               | head -1 | cut -d= -f2- | tr -d '"'"'" | xargs)"
    fi
  fi
}

# ---------------------------------------------------------------------------
# Prerequisite check
# ---------------------------------------------------------------------------
_check_prereqs() {
  local missing=false
  for cmd in curl jq; do
    command -v "$cmd" &>/dev/null || { printf '[ERROR] %s not found in PATH\n' "$cmd" >&2; missing=true; }
  done
  [[ "$missing" == true ]] && exit 2
}

# ---------------------------------------------------------------------------
# Phase 1 — Middleware (no auth)
# ---------------------------------------------------------------------------
run_phase1() {
  local base_url="$1"
  section "Phase 1 · Middleware (no auth)"

  http_get "$base_url/health"
  if [[ "$HTTP_STATUS" == "200" ]] && printf '%s' "$HTTP_BODY" | jq -e '.status == "ok"' &>/dev/null; then
    pass "/health → 200 {status:ok}"
  else
    fail "/health → 200 {status:ok}  (got $HTTP_STATUS)"
  fi

  http_get "$base_url/.well-known/oauth-protected-resource"
  if [[ "$HTTP_STATUS" == "200" ]]; then
    pass "/.well-known/oauth-protected-resource → 200"
    assert_jq "  bearer_methods_supported present" \
      "$HTTP_BODY" '.bearer_methods_supported | length > 0'
    assert_jq "  resource field present" \
      "$HTTP_BODY" '.resource | length > 0'
  else
    fail "/.well-known/oauth-protected-resource → 200  (got $HTTP_STATUS)"
    skip "  bearer_methods_supported present" "parent failed"
    skip "  resource field present"           "parent failed"
  fi

  http_get "$base_url/.well-known/oauth-protected-resource/mcp"
  if [[ "$HTTP_STATUS" == "200" ]]; then
    pass "/.well-known/oauth-protected-resource/mcp → 200"
  else
    fail "/.well-known/oauth-protected-resource/mcp → 200  (got $HTTP_STATUS)"
  fi
}

# ---------------------------------------------------------------------------
# Phase 2 — Auth enforcement
# ---------------------------------------------------------------------------
run_phase2() {
  section "Phase 2 · Auth enforcement"

  if [[ "$SKIP_AUTH" == true ]]; then
    skip "no-token → 401"    "--skip-auth"
    skip "bad-token → 401"   "--skip-auth"
    skip "good-token → pass" "--skip-auth"
    return
  fi

  if [[ -z "$TOKEN" ]]; then
    skip "no-token → 401"    "no token configured, likely auth disabled"
    skip "bad-token → 401"   "no token configured, likely auth disabled"
    skip "good-token → pass" "no token configured, likely auth disabled"
    return
  fi

  local tmp; tmp="$(mktemp)"

  # No token — expect 401
  local no_status
  no_status="$(curl -sk --max-time 10 -w '%{http_code}' -o "$tmp" \
    -X POST -H "Content-Type: application/json" \
    -H "Accept: application/json, text/event-stream" \
    -d '{"jsonrpc":"2.0","id":99,"method":"ping","params":null}' \
    "$MCP_URL")"
  rm -f "$tmp"
  [[ "$no_status" == "401" ]] \
    && pass "no-token → 401" \
    || fail "no-token → 401  (got $no_status)"

  # Wrong token — expect 401
  tmp="$(mktemp)"
  local bad_status bad_body
  bad_status="$(curl -sk --max-time 10 -w '%{http_code}' -o "$tmp" \
    -X POST -H "Content-Type: application/json" \
    -H "Accept: application/json, text/event-stream" \
    -H "Authorization: Bearer this-is-the-wrong-token-intentionally" \
    -d '{"jsonrpc":"2.0","id":99,"method":"ping","params":null}' \
    "$MCP_URL")"
  bad_body="$(cat "$tmp")"; rm -f "$tmp"
  if [[ "$bad_status" == "401" ]]; then
    local err_field; err_field="$(printf '%s' "$bad_body" | jq -r '.error // empty' 2>/dev/null)"
    if [[ "$err_field" == "invalid_token" ]]; then
      pass "bad-token → 401 invalid_token"
    else
      pass "bad-token → 401  (error field: ${err_field:-absent})"
    fi
  else
    fail "bad-token → 401  (got $bad_status)"
  fi

  # Good token — should not be 401/403
  tmp="$(mktemp)"
  local good_status
  good_status="$(curl -sk --max-time 10 -w '%{http_code}' -o "$tmp" \
    -X POST -H "Content-Type: application/json" \
    -H "Accept: application/json, text/event-stream" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test_live","version":"0"}}}' \
    "$MCP_URL")"
  rm -f "$tmp"
  if [[ "$good_status" != "401" && "$good_status" != "403" ]]; then
    pass "good-token → not 401/403  (got $good_status)"
  else
    fail "good-token → not 401/403  (got $good_status)"
  fi
}

# ---------------------------------------------------------------------------
# Phase 3 — MCP Protocol
# ---------------------------------------------------------------------------
run_phase3() {
  section "Phase 3 · MCP protocol"

  mcp_post "initialize" '{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test_live","version":"0"}}'
  if [[ "$HTTP_STATUS" == "200" ]]; then
    pass "initialize → 200"
    assert_jq "  serverInfo.name present" "$HTTP_BODY" '.result.serverInfo.name | length > 0'
    assert_jq "  protocolVersion present" "$HTTP_BODY" '.result.protocolVersion | length > 0'
  else
    fail "initialize → 200  (got $HTTP_STATUS: $(printf '%s' "$HTTP_BODY" | head -c 120))"
    skip "  serverInfo.name present" "initialize failed"
    skip "  protocolVersion present" "initialize failed"
  fi

  mcp_post "tools/list" 'null'
  if [[ "$HTTP_STATUS" == "200" ]]; then
    local tool_count; tool_count="$(printf '%s' "$HTTP_BODY" | jq '.result.tools | length' 2>/dev/null)"
    pass "tools/list → 200  ($tool_count tools)"
    assert_jq "  unraid tool present" \
      "$HTTP_BODY" '.result.tools[] | select(.name == "unraid") | .name'
  else
    fail "tools/list → 200  (got $HTTP_STATUS)"
    skip "  unraid tool present"                 "tools/list failed"
  fi

  mcp_post "ping" 'null'
  if [[ "$HTTP_STATUS" == "200" ]]; then
    pass "ping → 200"
  else
    skip "ping → 200" "not implemented (got $HTTP_STATUS)"
  fi
}

# ---------------------------------------------------------------------------
# Phase 4 — Tool smoke-tests (non-destructive)
# ---------------------------------------------------------------------------
run_phase4() {
  section "Phase 4 · Tool smoke-tests (non-destructive)"

  if [[ "$SKIP_TOOLS" == true ]]; then
    skip "Phase 4 tool calls"           "--skip-tools (no live Unraid API)"
    skip "Phase 4b guard bypass tests"  "--skip-tools"
    return
  fi

  local metrics_network_schema_re='Cannot query field "network" on type "Metrics"|Cannot query field '\''network'\'' on type '\''Metrics'\'''
  local network_interfaces_schema_re='Cannot query field "networkInterfaces" on type "Query"|Cannot query field '\''networkInterfaces'\'' on type '\''Query'\'''
  local system_metrics_network_schema_re='Cannot query field "systemMetricsNetwork" on type "Subscription"|Cannot query field '\''systemMetricsNetwork'\'' on type '\''Subscription'\'''

  call_unraid "unraid health/check"           "health"       "check"
  call_unraid "unraid health/test_connection" "health"       "test_connection"
  call_unraid "unraid health/diagnose"        "health"       "diagnose"
  call_unraid "unraid system/overview"        "system"       "overview"
  call_unraid "unraid system/network"         "system"       "network"
  call_unraid "unraid system/array"           "system"       "array"
  call_unraid "unraid system/registration"    "system"       "registration"
  call_unraid "unraid system/variables"       "system"       "variables"
  call_unraid "unraid system/metrics"         "system"       "metrics"
  call_unraid_optional "unraid system/network_metrics" "system" "network_metrics" \
    "$metrics_network_schema_re" \
    "metrics.network requires newer/compatible Unraid API schema"
  call_unraid "unraid system/services"        "system"       "services"
  call_unraid "unraid system/display"         "system"       "display"
  call_unraid "unraid system/config"          "system"       "config"
  call_unraid "unraid system/online"          "system"       "online"
  call_unraid_optional "unraid system/owner"  "system"       "owner" \
    'Cannot return null for non-nullable field Owner\.url' \
    "upstream owner profile has null url"
  call_unraid "unraid system/settings"        "system"       "settings"
  call_unraid "unraid system/server"          "system"       "server"
  call_unraid "unraid system/servers"         "system"       "servers"
  call_unraid "unraid system/flash"           "system"       "flash"
  call_unraid_optional "unraid system/ups_devices" "system"  "ups_devices" \
    'No UPS data returned from apcaccess' \
    "UPS service has no data on this appliance"
  call_unraid_optional "unraid system/network_interfaces" "system" "network_interfaces" \
    "$network_interfaces_schema_re" \
    "networkInterfaces requires newer/compatible Unraid API schema"
  call_unraid "unraid array/parity_status"    "array"        "parity_status"
  call_unraid "unraid array/parity_history"   "array"        "parity_history"
  call_unraid "unraid disk/shares"            "disk"         "shares"
  call_unraid "unraid disk/disks"             "disk"         "disks"
  call_unraid "unraid disk/log_files"         "disk"         "log_files"
  call_unraid "unraid docker/list"            "docker"       "list"
  call_unraid "unraid docker/networks"        "docker"       "networks"
  call_unraid "unraid vm/list"                "vm"           "list"
  call_unraid "unraid notification/overview"  "notification" "overview"
  call_unraid "unraid notification/list"      "notification" "list"
  call_unraid "unraid notification/recalculate" "notification" "recalculate"
  call_unraid "unraid user/me"                "user"         "me"
  call_unraid "unraid key/list"               "key"          "list"
  call_unraid "unraid rclone/list_remotes"    "rclone"       "list_remotes"
  call_unraid_optional "unraid rclone/config_form" "rclone"  "config_form" \
    '`url` must not start with a slash' \
    "rclone plugin endpoint rejected local config-form URL" \
    '{"provider_type":"s3"}'
  call_unraid "unraid plugin/list"            "plugin"       "list"
  call_unraid "unraid customization/public_theme" "customization" "public_theme"
  call_unraid "unraid customization/sso_enabled"  "customization" "sso_enabled"
  call_unraid "unraid customization/is_initial_setup" "customization" "is_initial_setup"
  call_unraid "unraid oidc/providers"         "oidc"         "providers"
  call_unraid "unraid oidc/public_providers"  "oidc"         "public_providers"
  call_unraid "unraid oidc/configuration"     "oidc"         "configuration"
  call_unraid "unraid onboarding/internal_boot_context" "onboarding" "internal_boot_context"
  call_unraid "unraid live/cpu"               "live"         "cpu"
  call_unraid "unraid live/memory"            "live"         "memory"
  call_unraid "unraid live/cpu_telemetry"     "live"         "cpu_telemetry"
  call_unraid "unraid live/notifications_overview" "live"    "notifications_overview"
  call_unraid_optional "unraid live/network_metrics" "live"  "network_metrics" \
    "$system_metrics_network_schema_re" \
    "systemMetricsNetwork requires newer/compatible Unraid API schema"
  call_unraid_optional "unraid subscriptions/test_query systemMetricsNetwork" \
    "subscriptions" "test_query" \
    "$system_metrics_network_schema_re" \
    "systemMetricsNetwork requires newer/compatible Unraid API schema" \
    '{"subscription_query":"subscription { systemMetricsNetwork { id name bytesReceived bytesSent rxSec txSec } }"}'

  # Phase 4b — Destructive guard bypass (confirm=True)
  section "Phase 4b · Destructive action guards (confirm=True bypass)"

  _guard_bypass_test() {
    local label="$1" action="$2" subaction="$3"
    local args_json="${4:-{\}}"
    local params; params="$(jq -cn \
      --arg a "$action" --arg s "$subaction" --argjson x "$args_json" \
      '{"name":"unraid","arguments":({"action":$a,"subaction":$s,"confirm":true} + $x)}')"
    mcp_post "tools/call" "$params"
    local body_text; body_text="$(printf '%s' "$HTTP_BODY" | jq -r \
      '.result.content[0].text // empty' 2>/dev/null | head -c 200)"
    if printf '%s' "$body_text" | grep -qiE 're-run with confirm'; then
      fail "$label  guard rejected confirm=True — should not happen"
    elif [[ "$HTTP_STATUS" == "200" ]]; then
      pass "$label  guard bypassed (confirm=True accepted)"
    else
      fail "$label  unexpected HTTP $HTTP_STATUS"
    fi
  }

  _guard_bypass_test "notification/delete guard bypass" "notification" "delete" \
    '{"notification_id":"test-guard-check-nonexistent"}'
  _guard_bypass_test "vm/force_stop guard bypass" "vm" "force_stop"
}

# ---------------------------------------------------------------------------
# Print summary
# ---------------------------------------------------------------------------
print_summary() {
  local total=$(( PASS + FAIL + SKIP ))
  printf '\n%s━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%s\n' "$C$B" "$N"
  printf 'Results: %s%d passed%s  %s%d failed%s  %s%d skipped%s  (%d total)\n' \
    "$G" "$PASS" "$N" \
    "$([[ $FAIL -gt 0 ]] && printf '%s' "$R" || printf '%s' "$D")" "$FAIL" "$N" \
    "$D" "$SKIP" "$N" \
    "$total"

  if [[ ${#FAILED[@]} -gt 0 ]]; then
    printf '\n%sFailed tests:%s\n' "$R$B" "$N"
    local t; for t in "${FAILED[@]}"; do
      printf '  • %s\n' "$t"
    done
  fi
  printf '\n'
}

# ---------------------------------------------------------------------------
# HTTP mode — run all phases against a live server at MCP_URL
# ---------------------------------------------------------------------------
run_http_mode() {
  local base_url
  local _stripped="${MCP_URL%/}"
  if [[ "$_stripped" == */mcp ]]; then
    base_url="${_stripped%/mcp}"
  else
    base_url="$_stripped"
  fi

  printf '\n%s%sUnraid MCP — HTTP mode%s\n' "$B" "$C" "$N"
  printf '  URL:  %s\n' "$MCP_URL"
  printf '  Auth: %s\n' "$([[ -n "$TOKEN" ]] && printf 'token configured' || printf 'none (auth disabled or gateway)')"

  # Check server is reachable
  if ! curl -sk --max-time 5 -o /dev/null "$base_url/health" 2>/dev/null; then
    printf '%s[ERROR] Server unreachable at %s%s\n' "$R" "$base_url" "$N" >&2
    (( FAIL++ )); FAILED+=("/health reachability check")
    return 1
  fi

  MCP_SESSION_ID=""
  run_phase1 "$base_url"
  run_phase2
  run_phase3
  run_phase4
}

# ---------------------------------------------------------------------------
# Docker mode — build image, start container, test, tear down
# ---------------------------------------------------------------------------
run_docker_mode() {
  printf '\n%s%sUnraid MCP — Docker mode%s\n' "$B" "$C" "$N"

  local image="unraid-mcp-test"
  local container="unraid-mcp-test-$$"
  local port="${MCP_PORT}"

  # Check docker is available
  if ! command -v docker &>/dev/null; then
    skip "docker mode" "docker not found in PATH"
    return 0
  fi

  section "Docker · Build"
  if docker build -t "$image" "$REPO_DIR" >/dev/null 2>&1; then
    pass "docker build $image"
  else
    fail "docker build $image"
    return 1
  fi

  section "Docker · Start"
  docker run -d \
    --name "$container" \
    -p "${port}:6970" \
    -e UNRAID_MCP_TRANSPORT=streamable-http \
    -e UNRAID_MCP_BEARER_TOKEN="ci-integration-token" \
    -e UNRAID_MCP_DISABLE_HTTP_AUTH=false \
    -e UNRAID_API_URL="${UNRAID_API_URL:-http://127.0.0.1:1}" \
    -e UNRAID_API_KEY="${UNRAID_API_KEY:-ci-fake-key}" \
    "$image" >/dev/null 2>&1
  pass "docker run $container"

  # Set token for subsequent phases
  TOKEN="ci-integration-token"
  MCP_URL="http://localhost:${port}/mcp"

  # Health poll 30x/1s
  section "Docker · Health poll"
  local ready=false
  local i
  for i in $(seq 1 30); do
    if curl -sf \
         -H "Accept: application/json, text/event-stream" \
         "http://localhost:${port}/health" >/dev/null 2>&1; then
      pass "server healthy after ${i}s"
      ready=true
      break
    fi
    sleep 1
  done

  if [[ "$ready" == false ]]; then
    fail "server did not become healthy in 30s"
    printf '%s[Docker logs]%s\n' "$D" "$N"
    docker logs "$container" 2>&1 | tail -20
    docker rm -f "$container" >/dev/null 2>&1 || true
    return 1
  fi

  # Run test phases
  MCP_SESSION_ID=""
  local base="http://localhost:${port}"
  run_phase1 "$base"
  run_phase2
  run_phase3
  run_phase4

  # Tear down (always)
  section "Docker · Teardown"
  if docker rm -f "$container" >/dev/null 2>&1; then
    pass "container $container removed"
  else
    skip "container $container removed" "already gone"
  fi
}

# ---------------------------------------------------------------------------
# Stdio mode — launch via uvx, send JSON-RPC over stdin, read from stdout
# ---------------------------------------------------------------------------
run_stdio_mode() {
  printf '\n%s%sUnraid MCP — stdio mode%s\n' "$B" "$C" "$N"

  # Check prereqs
  if ! command -v uv &>/dev/null; then
    skip "stdio mode" "uv not found in PATH"
    return 0
  fi

  section "Stdio · Protocol handshake"

  # Build the initialize request
  local init_req; init_req="$(jq -cn \
    '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test_live_stdio","version":"0"}}}')"
  local initialized_req; initialized_req="$(jq -cn \
    '{"jsonrpc":"2.0","method":"notifications/initialized","params":{}}')"
  local list_req; list_req="$(jq -cn \
    '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":null}')"

  # Launch the server, send two requests, collect output
  local stdio_out
  stdio_out="$(
    { printf '%s\n%s\n%s\n' "$init_req" "$initialized_req" "$list_req"; sleep 3; } \
    | UNRAID_MCP_TRANSPORT=stdio \
      UNRAID_API_URL="${UNRAID_API_URL:-http://127.0.0.1:1}" \
      UNRAID_API_KEY="${UNRAID_API_KEY:-ci-fake-key}" \
      uv run --directory "$REPO_DIR" "$ENTRY_POINT" \
      2>/dev/null \
    | head -c 1048576
  )" || true

  if [[ -z "$stdio_out" ]]; then
    fail "stdio: no output from server"
    return 1
  fi

  # Parse the first line as the initialize response
  local init_resp; init_resp="$(printf '%s' "$stdio_out" | head -1)"
  if printf '%s' "$init_resp" | jq -e '.result.serverInfo.name | length > 0' &>/dev/null; then
    pass "stdio: initialize response received"
    local sname; sname="$(printf '%s' "$init_resp" | jq -r '.result.serverInfo.name')"
    pass "stdio: serverInfo.name = $sname"
  else
    fail "stdio: initialize response invalid"
    verbose "$init_resp"
  fi

  # Parse the second line as tools/list response
  local list_resp; list_resp="$(printf '%s' "$stdio_out" | sed -n '2p')"
  if printf '%s' "$list_resp" | jq -e '.result.tools | length > 0' &>/dev/null; then
    local tool_count; tool_count="$(printf '%s' "$list_resp" | jq '.result.tools | length')"
    pass "stdio: tools/list response ($tool_count tools)"
    if printf '%s' "$list_resp" | jq -e '.result.tools[] | select(.name == "unraid")' &>/dev/null; then
      pass "stdio: unraid tool present"
    else
      fail "stdio: unraid tool not found"
    fi
  else
    fail "stdio: tools/list response invalid"
    verbose "$list_resp"
  fi
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
main() {
  _check_prereqs
  _resolve_token

  local modes=()
  case "$MODE" in
    all)    modes=(http docker stdio) ;;
    http)   modes=(http) ;;
    docker) modes=(docker) ;;
    stdio)  modes=(stdio) ;;
  esac

  printf '%s%s%s\n' "$B$C" "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" "$N"
  printf '%s  Unraid MCP · canonical integration test%s\n' "$B" "$N"
  printf '%s  Mode: %-10s  skip-auth: %-5s  skip-tools: %s%s\n' \
    "$B" "$MODE" "$SKIP_AUTH" "$SKIP_TOOLS" "$N"
  printf '%s%s%s\n' "$B$C" "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" "$N"

  local m
  for m in "${modes[@]}"; do
    case "$m" in
      http)   run_http_mode   ;;
      docker) run_docker_mode ;;
      stdio)  run_stdio_mode  ;;
    esac
  done

  print_summary

  [[ $FAIL -eq 0 ]]
}

main "$@"
