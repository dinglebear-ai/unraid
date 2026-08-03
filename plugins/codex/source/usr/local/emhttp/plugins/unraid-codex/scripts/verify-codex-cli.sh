#!/bin/bash
set -euo pipefail
CODEX_BIN="${CODEX_BIN:-/home/agent/.local/bin/codex}"
CODEX_HOME="${CODEX_HOME:-/home/agent}"
[[ -x "$CODEX_BIN" ]] || { echo "Codex binary is not executable: $CODEX_BIN" >&2; exit 1; }
actual="$(HOME="$CODEX_HOME" "$CODEX_BIN" --version | awk '{print $NF}')"
[[ "$actual" =~ ^[0-9]+.[0-9]+.[0-9]+([.-][A-Za-z0-9.]+)?$ ]] || {
  echo "Codex CLI did not report a valid semantic version" >&2
  exit 1
}
HOME="$CODEX_HOME" "$CODEX_BIN" --strict-config --version >/dev/null
HOME="$CODEX_HOME" "$CODEX_BIN" app-server --help >/dev/null
HOME="$CODEX_HOME" "$CODEX_BIN" exec --help >/dev/null
printf 'codex_cli_version=%s compatibility=ok
' "$actual"
