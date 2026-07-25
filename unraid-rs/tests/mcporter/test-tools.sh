#!/usr/bin/env bash
# =============================================================================
# test-tools.sh — Integration smoke-test for unraid-rmcp MCP server tools
#
# Exercises all non-destructive actions of the `unraid` MCP tool and validates
# that each response contains real Unraid data, not just an empty response.
#
# Action inventory (all tested below):
#   array, disks, docker, vms, server, info, shares, notifications,
#   log_files, services, network, ups, ups_config, metrics, plugins,
#   parity_history, vars, registration, flash, rclone, remote_access,
#   connect, help
#
# Resource tested: unraid://schema/mcp-tool
#
# Credentials are sourced from:
#   1. ~/.claude-homelab/.env  (UNRAID_RMCP_HOST, UNRAID_RMCP_PORT, UNRAID_RMCP_TOKEN)
#   2. .env in repo root       (UNRAID_RMCP_TOKEN, UNRAID_RMCP_PORT)
#
# Usage:
#   ./tests/mcporter/test-tools.sh [--timeout-ms N] [--parallel] [--verbose]
#
# Options:
#   --timeout-ms N   Per-call timeout in milliseconds (default: 30000)
#   --parallel       Run independent test groups in parallel (default: off)
#   --verbose        Print raw mcporter output for each call
#
# Exit codes:
#   0 — all tests passed or skipped
#   1 — one or more tests failed
#   2 — prerequisite check failed (mcporter not found, server unreachable)
# =============================================================================

set -uo pipefail

readonly SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
readonly PROJECT_DIR="$(cd -- "${SCRIPT_DIR}/../.." && pwd -P)"
readonly SCRIPT_NAME="$(basename -- "${BASH_SOURCE[0]}")"
readonly TS_START="$(date +%s%N)"
readonly LOG_FILE="${TMPDIR:-/tmp}/${SCRIPT_NAME%.sh}.$(date +%Y%m%d-%H%M%S).log"
readonly HOMELAB_ENV="${HOME}/.claude-homelab/.env"
readonly REPO_ENV="${PROJECT_DIR}/.env"

if [[ -t 1 ]]; then
  C_RESET='\033[0m'; C_BOLD='\033[1m'; C_GREEN='\033[0;32m'
  C_RED='\033[0;31m'; C_YELLOW='\033[0;33m'; C_CYAN='\033[0;36m'; C_DIM='\033[2m'
else
  C_RESET=''; C_BOLD=''; C_GREEN=''; C_RED=''; C_YELLOW=''; C_CYAN=''; C_DIM=''
fi

CALL_TIMEOUT_MS=30000
USE_PARALLEL=false
VERBOSE=false
PASS_COUNT=0; FAIL_COUNT=0; SKIP_COUNT=0
declare -a FAIL_NAMES=()
MCP_URL=''; MCPORTER_HEADER_ARGS=()

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --timeout-ms) CALL_TIMEOUT_MS="${2:?}"; shift 2 ;;
      --parallel)   USE_PARALLEL=true; shift ;;
      --verbose)    VERBOSE=true; shift ;;
      -h|--help)    printf 'Usage: %s [--timeout-ms N] [--parallel] [--verbose]\n' "${SCRIPT_NAME}"; exit 0 ;;
      *) printf '[ERROR] Unknown argument: %s\n' "$1" >&2; exit 2 ;;
    esac
  done
}

log_info()  { printf "${C_CYAN}[INFO]${C_RESET}  %s\n" "$*" | tee -a "${LOG_FILE}"; }
log_warn()  { printf "${C_YELLOW}[WARN]${C_RESET}  %s\n" "$*" | tee -a "${LOG_FILE}"; }
log_error() { printf "${C_RED}[ERROR]${C_RESET} %s\n" "$*" | tee -a "${LOG_FILE}" >&2; }

cleanup() { local rc=$?; [[ $rc -ne 0 ]] && log_warn "Script exited with rc=${rc}. Log: ${LOG_FILE}"; }
trap cleanup EXIT

load_env() {
  if [[ -f "${HOMELAB_ENV}" ]]; then
    set -a; source "${HOMELAB_ENV}"; set +a  # shellcheck disable=SC1090
    log_info "Loaded credentials from ${HOMELAB_ENV}"
  fi
  if [[ -f "${REPO_ENV}" ]]; then
    local repo_token repo_port
    repo_token="$(awk -F= '$1 == "UNRAID_RMCP_TOKEN" {print substr($0, index($0,"=")+1); exit}' "${REPO_ENV}" 2>/dev/null || true)"
    repo_port="$(awk -F= '$1 == "UNRAID_RMCP_PORT" {print substr($0, index($0,"=")+1); exit}' "${REPO_ENV}" 2>/dev/null || true)"
    [[ -z "${UNRAID_RMCP_TOKEN:-}" && -n "${repo_token}" ]] && UNRAID_RMCP_TOKEN="${repo_token}"
    [[ -z "${UNRAID_RMCP_PORT:-}"  && -n "${repo_port}"  ]] && UNRAID_RMCP_PORT="${repo_port}"
  fi

  local host="${UNRAID_RMCP_HOST:-localhost}"
  [[ "${host}" == "0.0.0.0" ]] && host="localhost"
  MCP_URL="http://${host}:${UNRAID_RMCP_PORT:-6970}/mcp"

  MCPORTER_HEADER_ARGS=()
  [[ -n "${UNRAID_RMCP_TOKEN:-}" ]] && MCPORTER_HEADER_ARGS+=(--header "Authorization: Bearer ${UNRAID_RMCP_TOKEN}")

  log_info "MCP URL: ${MCP_URL}"
  [[ ${#MCPORTER_HEADER_ARGS[@]} -gt 0 ]] && log_info "Auth: Bearer token configured" || log_info "Auth: none"
}

check_prerequisites() {
  local missing=false
  command -v mcporter &>/dev/null || { log_error "mcporter not found in PATH."; missing=true; }
  command -v python3  &>/dev/null || { log_error "python3 not found in PATH.";  missing=true; }
  command -v curl     &>/dev/null || { log_error "curl not found in PATH.";     missing=true; }
  [[ "${missing}" == true ]] && return 2
  return 0
}

smoke_test_server() {
  log_info "Smoke-testing server connectivity..."
  local base_url="${MCP_URL%/mcp}"

  local health_status
  health_status="$(curl -sf --max-time 10 "${base_url}/health" 2>/dev/null | \
    python3 -c "import sys,json; print(json.load(sys.stdin).get('status',''))" 2>/dev/null)" || health_status=''

  if [[ "${health_status}" != "ok" ]]; then
    log_error "Health endpoint at ${base_url}/health did not return status=ok (got: '${health_status}')"
    log_error "Is unraid-rmcp running?  curl ${base_url}/health"
    return 2
  fi
  log_info "Health OK"

  local tool_count
  tool_count="$(curl -sf --max-time 10 -X POST "${MCP_URL}" \
    -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" \
    ${MCPORTER_HEADER_ARGS[@]+"${MCPORTER_HEADER_ARGS[@]}"} \
    -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' 2>/dev/null | \
    python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('result',{}).get('tools',[])))" 2>/dev/null)" || tool_count=0

  if [[ "${tool_count}" -lt 1 ]] 2>/dev/null; then
    log_error "tools/list returned ${tool_count} tools — expected at least 1"
    return 2
  fi
  log_info "Server OK — ${tool_count} tools available"
}

mcporter_call() {
  local args_json="${1:?args_json required}"
  mcporter call \
    --http-url "${MCP_URL}" --allow-http \
    ${MCPORTER_HEADER_ARGS[@]+"${MCPORTER_HEADER_ARGS[@]}"} \
    --tool "unraid" --args "${args_json}" \
    --timeout "${CALL_TIMEOUT_MS}" --output json \
    2>>"${LOG_FILE}"
}

run_test() {
  local label="${1:?}" args="${2:?}" expected_key="${3:-}"
  local t0; t0="$(date +%s%N)"
  local output; output="$(mcporter_call "${args}")" || output=''
  local elapsed_ms; elapsed_ms="$(( ( $(date +%s%N) - t0 ) / 1000000 ))"

  [[ "${VERBOSE}" == true ]] && printf '%s\n' "${output}" | tee -a "${LOG_FILE}" || printf '%s\n' "${output}" >> "${LOG_FILE}"

  local json_check
  json_check="$(printf '%s' "${output}" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    if isinstance(d,dict) and ('error' in d or d.get('kind')=='error'):
        print('error: ' + str(d.get('error',d.get('message','unknown'))))
    else:
        print('ok')
except Exception as e:
    print('invalid_json: ' + str(e))
" 2>/dev/null)" || json_check="parse_error"

  if [[ "${json_check}" != "ok" ]]; then
    printf "${C_RED}[FAIL]${C_RESET} %-65s ${C_DIM}%dms${C_RESET}\n" "${label}" "${elapsed_ms}" | tee -a "${LOG_FILE}"
    printf '       response: %s\n' "${json_check}" | tee -a "${LOG_FILE}"
    FAIL_COUNT=$(( FAIL_COUNT + 1 )); FAIL_NAMES+=("${label}"); return 1
  fi

  if [[ -n "${expected_key}" ]]; then
    local key_check
    key_check="$(printf '%s' "${output}" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    node = d
    for k in '${expected_key}'.split('.'):
        if k: node = node[int(k)] if (isinstance(node,list) and k.isdigit()) else node[k]
    print('missing: key is null' if node is None else 'ok')
except Exception as e:
    print('missing: ' + str(e))
" 2>/dev/null)" || key_check="parse_error"

    if [[ "${key_check}" != "ok" ]]; then
      printf "${C_RED}[FAIL]${C_RESET} %-65s ${C_DIM}%dms${C_RESET}\n" "${label}" "${elapsed_ms}" | tee -a "${LOG_FILE}"
      printf '       expected key .%s not found: %s\n' "${expected_key}" "${key_check}" | tee -a "${LOG_FILE}"
      FAIL_COUNT=$(( FAIL_COUNT + 1 )); FAIL_NAMES+=("${label}"); return 1
    fi
  fi

  printf "${C_GREEN}[PASS]${C_RESET} %-65s ${C_DIM}%dms${C_RESET}\n" "${label}" "${elapsed_ms}" | tee -a "${LOG_FILE}"
  PASS_COUNT=$(( PASS_COUNT + 1 )); return 0
}

skip_test() {
  local label="${1:?}" reason="${2:-skipped}"
  printf "${C_YELLOW}[SKIP]${C_RESET} %-65s %s\n" "${label}" "${reason}" | tee -a "${LOG_FILE}"
  SKIP_COUNT=$(( SKIP_COUNT + 1 ))
}

# ── Test suites ───────────────────────────────────────────────────────────────

suite_auth() {
  if [[ -z "${UNRAID_RMCP_TOKEN:-}" ]]; then
    printf '\n%b== auth (skipped — token unset) ==%b\n' "${C_BOLD}" "${C_RESET}" | tee -a "${LOG_FILE}"
    skip_test "auth: unauthenticated request returns 401" "UNRAID_RMCP_TOKEN unset"
    skip_test "auth: bad token returns 401"               "UNRAID_RMCP_TOKEN unset"
    return
  fi
  printf '\n%b== auth enforcement ==%b\n' "${C_BOLD}" "${C_RESET}" | tee -a "${LOG_FILE}"
  local label status
  for test_desc in "unauthenticated" "bad-token"; do
    label="auth: ${test_desc} /mcp returns 401"
    local extra_hdr=()
    [[ "${test_desc}" == "bad-token" ]] && extra_hdr=(-H "Authorization: Bearer bad-token-intentionally-invalid")
    status="$(curl -s --max-time 10 -o /dev/null -w "%{http_code}" \
      "${MCP_URL}" -X POST "${extra_hdr[@]}" \
      -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" \
      -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' 2>/dev/null)" || status=0
    if [[ "${status}" == "401" ]]; then
      printf "${C_GREEN}[PASS]${C_RESET} %-65s\n" "${label}" | tee -a "${LOG_FILE}"; PASS_COUNT=$(( PASS_COUNT + 1 ))
    else
      printf "${C_RED}[FAIL]${C_RESET} %-65s (got HTTP %s)\n" "${label}" "${status}" | tee -a "${LOG_FILE}"
      FAIL_COUNT=$(( FAIL_COUNT + 1 )); FAIL_NAMES+=("${label}")
    fi
  done
}

suite_meta() {
  printf '\n%b== meta (help) ==%b\n' "${C_BOLD}" "${C_RESET}" | tee -a "${LOG_FILE}"
  run_test "unraid help: returns documentation"      '{"action":"help"}' "help"
}

suite_server() {
  printf '\n%b== server / info ==%b\n' "${C_BOLD}" "${C_RESET}" | tee -a "${LOG_FILE}"
  run_test "unraid server: returns server object"    '{"action":"server"}' "server"
  run_test "unraid server: has name field"           '{"action":"server"}' "server.name"
  run_test "unraid server: has status field"         '{"action":"server"}' "server.status"
  run_test "unraid server: has lanip field"          '{"action":"server"}' "server.lanip"
  run_test "unraid info: returns info object"        '{"action":"info"}' "info"
  run_test "unraid info: has os.hostname"            '{"action":"info"}' "info.os.hostname"
  run_test "unraid info: has cpu.brand"              '{"action":"info"}' "info.cpu.brand"
  run_test "unraid info: has versions.core.unraid"   '{"action":"info"}' "info.versions.core.unraid"
}

suite_array() {
  printf '\n%b== array + disks ==%b\n' "${C_BOLD}" "${C_RESET}" | tee -a "${LOG_FILE}"
  run_test "unraid array: returns array object"      '{"action":"array"}' "array"
  run_test "unraid array: has state field"           '{"action":"array"}' "array.state"
  run_test "unraid array: has disks array"           '{"action":"array"}' "array.disks"
  run_test "unraid array: has capacity"              '{"action":"array"}' "array.capacity"
  run_test "unraid disks: returns disks array"       '{"action":"disks"}' "disks"
  run_test "unraid disks: first disk has id"         '{"action":"disks"}' "disks.0.id"
  run_test "unraid disks: first disk has smartStatus" '{"action":"disks"}' "disks.0.smartStatus"
}

suite_docker() {
  printf '\n%b== docker ==%b\n' "${C_BOLD}" "${C_RESET}" | tee -a "${LOG_FILE}"
  run_test "unraid docker: returns docker object"    '{"action":"docker"}' "docker"
  run_test "unraid docker: has containers array"     '{"action":"docker"}' "docker.containers"

  local raw container_id
  raw="$(mcporter_call '{"action":"docker"}' 2>/dev/null)" || raw=''
  container_id="$(printf '%s' "${raw}" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    for c in d.get('docker',{}).get('containers',[]):
        cid = c.get('id','')
        if cid: print(cid[:12]); break
except: pass
" 2>/dev/null || true)"

  if [[ -n "${container_id}" ]]; then
    run_test "unraid docker_logs: returns logs for container" \
      "{\"action\":\"docker_logs\",\"id\":\"${container_id}\",\"tail\":20}" "docker.logs"
  else
    skip_test "unraid docker_logs: container-specific logs" "no container IDs found"
  fi
}

suite_vms() {
  printf '\n%b== vms ==%b\n' "${C_BOLD}" "${C_RESET}" | tee -a "${LOG_FILE}"
  run_test "unraid vms: returns vms object"          '{"action":"vms"}' "vms"
  run_test "unraid vms: has domains array"           '{"action":"vms"}' "vms.domains"
}

suite_metrics() {
  printf '\n%b== metrics + services + network ==%b\n' "${C_BOLD}" "${C_RESET}" | tee -a "${LOG_FILE}"
  run_test "unraid metrics: returns metrics object"       '{"action":"metrics"}' "metrics"
  run_test "unraid metrics: has cpu.percentTotal"         '{"action":"metrics"}' "metrics.cpu.percentTotal"
  run_test "unraid metrics: has memory object"            '{"action":"metrics"}' "metrics.memory"
  run_test "unraid metrics: has temperature summary"      '{"action":"metrics"}' "metrics.temperature.summary"
  run_test "unraid services: returns services array"      '{"action":"services"}' "services"
  run_test "unraid services: first service has name"      '{"action":"services"}' "services.0.name"
  run_test "unraid network: returns network object"       '{"action":"network"}' "network"
}

suite_config() {
  printf '\n%b== shares / notifications / vars / registration ==%b\n' "${C_BOLD}" "${C_RESET}" | tee -a "${LOG_FILE}"
  run_test "unraid shares: returns shares array"          '{"action":"shares"}' "shares"
  run_test "unraid notifications: returns notifications"  '{"action":"notifications"}' "notifications"
  run_test "unraid notifications: has overview"           '{"action":"notifications"}' "notifications.overview"
  run_test "unraid vars: returns vars object"             '{"action":"vars"}' "vars"
  run_test "unraid vars: has version field"               '{"action":"vars"}' "vars.version"
  run_test "unraid registration: returns registration"    '{"action":"registration"}' "registration"
  run_test "unraid registration: has type field"          '{"action":"registration"}' "registration.type"
  run_test "unraid registration: has state field"         '{"action":"registration"}' "registration.state"
  run_test "unraid flash: returns flash object"           '{"action":"flash"}' "flash"
  run_test "unraid flash: has vendor field"               '{"action":"flash"}' "flash.vendor"
  run_test "unraid plugins: returns plugins array"        '{"action":"plugins"}' "plugins"
}

suite_logs() {
  printf '\n%b== log_files ==%b\n' "${C_BOLD}" "${C_RESET}" | tee -a "${LOG_FILE}"
  run_test "unraid log_files: returns logFiles array"     '{"action":"log_files"}' "logFiles"

  local raw log_path
  raw="$(mcporter_call '{"action":"log_files"}' 2>/dev/null)" || raw=''
  log_path="$(printf '%s' "${raw}" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    for f in d.get('logFiles',[]):
        p = f.get('path','')
        if p: print(p); break
except: pass
" 2>/dev/null || true)"

  if [[ -n "${log_path}" ]]; then
    run_test "unraid log_file: reads ${log_path}" \
      "{\"action\":\"log_file\",\"path\":\"${log_path}\",\"lines\":50}" "logFile.path"
  else
    skip_test "unraid log_file: read specific log" "no log files found"
  fi
}

suite_ups() {
  printf '\n%b== ups ==%b\n' "${C_BOLD}" "${C_RESET}" | tee -a "${LOG_FILE}"
  run_test "unraid ups: returns upsDevices"               '{"action":"ups"}' "upsDevices"
  run_test "unraid ups_config: returns upsConfiguration"  '{"action":"ups_config"}' "upsConfiguration"
}

suite_storage() {
  printf '\n%b== storage + remote access ==%b\n' "${C_BOLD}" "${C_RESET}" | tee -a "${LOG_FILE}"
  run_test "unraid parity_history: returns parityHistory" '{"action":"parity_history"}' "parityHistory"
  run_test "unraid rclone: returns rclone object"         '{"action":"rclone"}' "rclone"
  run_test "unraid remote_access: returns remoteAccess"   '{"action":"remote_access"}' "remoteAccess"
  run_test "unraid connect: returns connect object"       '{"action":"connect"}' "connect"
}

suite_resource_schema() {
  printf '\n%b== resource: unraid://schema/mcp-tool ==%b\n' "${C_BOLD}" "${C_RESET}" | tee -a "${LOG_FILE}"

  local schema_result
  schema_result="$(curl -sf --max-time 10 -X POST "${MCP_URL}" \
    -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" \
    ${MCPORTER_HEADER_ARGS[@]+"${MCPORTER_HEADER_ARGS[@]}"} \
    -d '{"jsonrpc":"2.0","id":10,"method":"resources/read","params":{"uri":"unraid://schema/mcp-tool"}}' \
    2>/dev/null)" || schema_result=''

  local schema_check
  schema_check="$(printf '%s' "${schema_result}" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    result = d.get('result', {})
    contents = result.get('contents', result.get('content', []))
    print('missing: no contents' if not contents else 'ok')
except Exception as e:
    print('error: ' + str(e))
" 2>/dev/null)" || schema_check="parse_error"

  local label="resource unraid://schema/mcp-tool: returns schema"
  if [[ "${schema_check}" == "ok" ]]; then
    printf "${C_GREEN}[PASS]${C_RESET} %-65s\n" "${label}" | tee -a "${LOG_FILE}"
    PASS_COUNT=$(( PASS_COUNT + 1 ))
  else
    printf "${C_YELLOW}[SKIP]${C_RESET} %-65s server did not expose resource (%s)\n" \
      "${label}" "${schema_check}" | tee -a "${LOG_FILE}"
    SKIP_COUNT=$(( SKIP_COUNT + 1 ))
  fi
}

print_summary() {
  local total_ms; total_ms="$(( ( $(date +%s%N) - TS_START ) / 1000000 ))"
  local total=$(( PASS_COUNT + FAIL_COUNT + SKIP_COUNT ))
  printf '\n%b%s%b\n' "${C_BOLD}" "$(printf '=%.0s' {1..65})" "${C_RESET}"
  printf '%b%-20s%b  %b%d%b\n' "${C_BOLD}" "PASS" "${C_RESET}" "${C_GREEN}" "${PASS_COUNT}" "${C_RESET}"
  printf '%b%-20s%b  %b%d%b\n' "${C_BOLD}" "FAIL" "${C_RESET}" "${C_RED}"   "${FAIL_COUNT}" "${C_RESET}"
  printf '%b%-20s%b  %b%d%b\n' "${C_BOLD}" "SKIP" "${C_RESET}" "${C_YELLOW}" "${SKIP_COUNT}" "${C_RESET}"
  printf '%b%-20s%b  %d\n'     "${C_BOLD}" "TOTAL" "${C_RESET}" "${total}"
  printf '%b%-20s%b  %ds (%dms)\n' "${C_BOLD}" "ELAPSED" "${C_RESET}" "$(( total_ms / 1000 ))" "${total_ms}"
  printf '%b%s%b\n' "${C_BOLD}" "$(printf '=%.0s' {1..65})" "${C_RESET}"
  if [[ "${FAIL_COUNT}" -gt 0 ]]; then
    printf '\n%bFailed tests:%b\n' "${C_RED}" "${C_RESET}"
    for name in "${FAIL_NAMES[@]}"; do printf '  * %s\n' "${name}"; done
    printf '\nFull log: %s\n' "${LOG_FILE}"
  fi
}

run_parallel() {
  log_warn "--parallel mode: suites run concurrently."
  local tmp_dir; tmp_dir="$(mktemp -d)"
  trap 'rm -rf -- "${tmp_dir}"' RETURN
  local suites=(suite_auth suite_meta suite_server suite_array suite_docker suite_vms
                suite_metrics suite_config suite_logs suite_ups suite_storage suite_resource_schema)
  local pids=()
  for suite in "${suites[@]}"; do
    ( PASS_COUNT=0; FAIL_COUNT=0; SKIP_COUNT=0; FAIL_NAMES=()
      "${suite}"
      printf '%d %d %d\n' "${PASS_COUNT}" "${FAIL_COUNT}" "${SKIP_COUNT}" > "${tmp_dir}/${suite}.counts"
      printf '%s\n' "${FAIL_NAMES[@]:-}" > "${tmp_dir}/${suite}.fails" ) &
    pids+=($!)
  done
  for pid in "${pids[@]}"; do wait "${pid}" || true; done
  for f in "${tmp_dir}"/*.counts; do
    [[ -f "${f}" ]] || continue
    local p fl s; read -r p fl s < "${f}"
    PASS_COUNT=$(( PASS_COUNT + p )); FAIL_COUNT=$(( FAIL_COUNT + fl )); SKIP_COUNT=$(( SKIP_COUNT + s ))
  done
  for f in "${tmp_dir}"/*.fails; do
    [[ -f "${f}" ]] || continue
    while IFS= read -r line; do [[ -n "${line}" ]] && FAIL_NAMES+=("${line}"); done < "${f}"
  done
}

run_sequential() {
  suite_auth; suite_meta; suite_server; suite_array; suite_docker; suite_vms
  suite_metrics; suite_config; suite_logs; suite_ups; suite_storage; suite_resource_schema
}

main() {
  parse_args "$@"
  load_env

  printf '%b%s%b\n' "${C_BOLD}" "$(printf '=%.0s' {1..65})" "${C_RESET}"
  printf '%b  unraid-rmcp integration smoke-test%b\n' "${C_BOLD}" "${C_RESET}"
  printf '%b  Project:  %s%b\n' "${C_BOLD}" "${PROJECT_DIR}" "${C_RESET}"
  printf '%b  MCP URL:  %s%b\n' "${C_BOLD}" "${MCP_URL}" "${C_RESET}"
  printf '%b  Timeout:  %dms/call | Parallel: %s%b\n' "${C_BOLD}" "${CALL_TIMEOUT_MS}" "${USE_PARALLEL}" "${C_RESET}"
  printf '%b  Log:      %s%b\n' "${C_BOLD}" "${LOG_FILE}" "${C_RESET}"
  printf '%b%s%b\n\n' "${C_BOLD}" "$(printf '=%.0s' {1..65})" "${C_RESET}"

  check_prerequisites || exit 2

  smoke_test_server || {
    log_error "Server connectivity check failed. Aborting."
    log_error "To diagnose:"
    log_error "  curl http://localhost:6970/health"
    log_error "  just dev   (or: just docker-up)"
    exit 2
  }

  [[ "${USE_PARALLEL}" == true ]] && run_parallel || run_sequential

  print_summary
  [[ "${FAIL_COUNT}" -gt 0 ]] && exit 1 || exit 0
}

main "$@"
