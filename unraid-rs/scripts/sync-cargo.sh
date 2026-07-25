#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
DATA_ROOT="${CLAUDE_PLUGIN_DATA:-${REPO_ROOT}}"

SRC_LOCK="${REPO_ROOT}/Cargo.lock"
DST_LOCK="${DATA_ROOT}/Cargo.lock"

if [[ ! -f "${SRC_LOCK}" ]]; then
  echo "sync-cargo.sh: missing lockfile at ${SRC_LOCK}" >&2
  exit 1
fi

if diff -q "${SRC_LOCK}" "${DST_LOCK}" >/dev/null 2>&1; then
  exit 0
fi

mkdir -p "${DATA_ROOT}"

if ! cp "${SRC_LOCK}" "${DST_LOCK}" && cargo fetch --manifest-path "${REPO_ROOT}/Cargo.toml"; then
  rm -f "${DST_LOCK}"
  exit 1
fi
