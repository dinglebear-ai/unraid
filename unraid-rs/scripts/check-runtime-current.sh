#!/usr/bin/env bash
# Check whether the running systemd unit or Docker container uses the current artifact.
set -euo pipefail

MODE="auto"
PULL="false"
UNIT="${EXAMPLE_MCP_SYSTEMD_UNIT:-example-mcp.service}"
SERVICE="${EXAMPLE_MCP_DOCKER_SERVICE:-example-mcp}"
COMPOSE_DIR="${EXAMPLE_MCP_COMPOSE_DIR:-$(pwd)}"
EXPECTED_BINARY="${EXAMPLE_MCP_EXPECTED_BINARY:-}"

usage() {
  cat <<'EOF'
Usage: scripts/check-runtime-current.sh [OPTIONS]

Checks:
  systemd: running /proc/<pid>/exe hash == unit ExecStart binary hash
  docker:  running container image ID == local compose image ID

Options:
  --mode auto|systemd|docker  Runtime to check. Default: auto.
  --pull                      Docker only: pull compose image before comparing.
  --unit NAME                 Systemd user unit. Default: example-mcp.service.
  --service NAME              Docker Compose service/container. Default: example-mcp.
  --compose-dir DIR           Docker Compose project dir. Default: current directory.
  --expected-binary PATH      Systemd: also compare running binary to this path.
  -h, --help                  Show this help.

TEMPLATE:
  Replace EXAMPLE_* env vars, example-mcp, and example binary names when adapting.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --mode)
      MODE="${2:?--mode requires a value}"
      case "$MODE" in
        auto|systemd|docker) ;;
        *) echo "invalid mode: $MODE" >&2; exit 2 ;;
      esac
      shift 2
      ;;
    --pull)
      PULL="true"
      shift
      ;;
    --unit)
      UNIT="${2:?--unit requires a value}"
      shift 2
      ;;
    --service)
      SERVICE="${2:?--service requires a value}"
      shift 2
      ;;
    --compose-dir)
      COMPOSE_DIR="${2:?--compose-dir requires a value}"
      shift 2
      ;;
    --expected-binary)
      EXPECTED_BINARY="${2:?--expected-binary requires a value}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

sha() {
  sha256sum "$1" | awk '{print $1}'
}

version_of() {
  local bin="$1"
  if [[ -x "$bin" ]]; then
    "$bin" --version 2>/dev/null || true
  fi
}

status_line() {
  printf '%-18s %s\n' "$1" "$2"
}

detect_mode() {
  if systemctl --user is-active --quiet "$UNIT" 2>/dev/null; then
    echo systemd
    return
  fi
  if command -v docker >/dev/null 2>&1; then
    if [[ -d "$COMPOSE_DIR" ]] && (cd "$COMPOSE_DIR" && docker compose ps -q "$SERVICE" 2>/dev/null | grep -q .); then
      echo docker
      return
    fi
    if docker ps --filter "name=^/${SERVICE}$" --format '{{.ID}}' 2>/dev/null | grep -q .; then
      echo docker
      return
    fi
  fi
  echo none
}

check_systemd() {
  local pid exe unit_exec running_sha unit_sha expected_sha active
  active="$(systemctl --user is-active "$UNIT" 2>/dev/null || true)"
  status_line mode systemd
  status_line unit "$UNIT"
  status_line state "$active"
  if [[ "$active" != "active" ]]; then
    echo "FAIL: systemd unit is not active"
    return 1
  fi

  pid="$(systemctl --user show "$UNIT" -p MainPID --value)"
  if [[ -z "$pid" || "$pid" == "0" || ! -e "/proc/$pid/exe" ]]; then
    echo "FAIL: cannot resolve running process for $UNIT"
    return 1
  fi

  exe="$(readlink -f "/proc/$pid/exe")"
  unit_exec="$(systemctl --user show "$UNIT" -p ExecStart --value \
    | sed -n 's/.*path=\([^ ;]*\).*/\1/p' \
    | head -1)"
  if [[ -z "$unit_exec" ]]; then
    echo "FAIL: cannot parse ExecStart for $UNIT"
    return 1
  fi
  unit_exec="$(readlink -f "$unit_exec")"

  running_sha="$(sha "/proc/$pid/exe")"
  unit_sha="$(sha "$unit_exec")"
  status_line pid "$pid"
  status_line running_exe "$exe"
  status_line unit_exec "$unit_exec"
  status_line running_version "$(version_of "$exe")"
  status_line unit_version "$(version_of "$unit_exec")"
  status_line running_sha "$running_sha"
  status_line unit_sha "$unit_sha"

  if [[ "$running_sha" != "$unit_sha" ]]; then
    echo "STALE: running process does not match unit ExecStart binary"
    echo "fix: systemctl --user restart $UNIT"
    return 1
  fi

  if [[ -n "$EXPECTED_BINARY" ]]; then
    EXPECTED_BINARY="$(readlink -f "$EXPECTED_BINARY")"
    expected_sha="$(sha "$EXPECTED_BINARY")"
    status_line expected_binary "$EXPECTED_BINARY"
    status_line expected_version "$(version_of "$EXPECTED_BINARY")"
    status_line expected_sha "$expected_sha"
    if [[ "$running_sha" != "$expected_sha" ]]; then
      echo "STALE: running process does not match expected binary"
      echo "fix: install $EXPECTED_BINARY to $unit_exec and restart $UNIT"
      return 1
    fi
  fi

  echo "CURRENT: running systemd service matches installed binary"
}

compose_image() {
  if [[ -d "$COMPOSE_DIR" ]]; then
    (cd "$COMPOSE_DIR" && docker compose config --images 2>/dev/null | head -1) || true
  fi
}

check_docker() {
  local cid running_image image local_image repo_digests
  status_line mode docker
  status_line compose_dir "$COMPOSE_DIR"
  status_line service "$SERVICE"

  if [[ -d "$COMPOSE_DIR" ]]; then
    cid="$(cd "$COMPOSE_DIR" && docker compose ps -q "$SERVICE" 2>/dev/null || true)"
  else
    cid=""
  fi
  if [[ -z "$cid" ]]; then
    cid="$(docker ps --filter "name=^/${SERVICE}$" --format '{{.ID}}' 2>/dev/null | head -1)"
  fi
  if [[ -z "$cid" ]]; then
    echo "FAIL: $SERVICE container is not running"
    return 1
  fi

  image="$(compose_image)"
  [[ -n "$image" ]] || image="$(docker inspect "$cid" --format '{{.Config.Image}}')"

  if [[ "$PULL" == "true" && -d "$COMPOSE_DIR" ]]; then
    (cd "$COMPOSE_DIR" && docker compose pull --quiet "$SERVICE")
  fi

  running_image="$(docker inspect "$cid" --format '{{.Image}}')"
  local_image="$(docker image inspect "$image" --format '{{.Id}}' 2>/dev/null || true)"
  repo_digests="$(docker image inspect "$image" --format '{{join .RepoDigests ", "}}' 2>/dev/null || true)"

  status_line container "$cid"
  status_line image "$image"
  status_line running_image_id "$running_image"
  status_line local_image_id "${local_image:-missing}"
  [[ -n "$repo_digests" ]] && status_line repo_digests "$repo_digests"

  if [[ -z "$local_image" ]]; then
    echo "FAIL: compose image is not present locally"
    echo "fix: cd $COMPOSE_DIR && docker compose pull $SERVICE"
    return 1
  fi
  if [[ "$running_image" != "$local_image" ]]; then
    echo "STALE: running container image differs from local compose image"
    echo "fix: cd $COMPOSE_DIR && docker compose up -d --force-recreate --no-build $SERVICE"
    return 1
  fi

  echo "CURRENT: running container matches local compose image"
}

if [[ "$MODE" == "auto" ]]; then
  MODE="$(detect_mode)"
fi

case "$MODE" in
  systemd) check_systemd ;;
  docker) check_docker ;;
  none)
    echo "FAIL: no running $UNIT systemd unit or $SERVICE container detected"
    exit 1
    ;;
  *)
    echo "invalid mode: $MODE" >&2
    exit 2
    ;;
esac
