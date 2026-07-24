#!/usr/bin/env bash
set -euo pipefail
REPO="${UNRAID_RMCP_REPO:-dinglebear-ai/unraid-mcp}"
INSTALL_DIR="${INSTALL_DIR:-${HOME}/.local/bin}"
VERSION="${UNRAID_RMCP_VERSION:-latest}"
RELEASE_BASE_URL="${UNRAID_RMCP_RELEASE_BASE_URL:-}"
BINARY_NAME="runraid"
# Release tags in the unraid-mcp monorepo are component-prefixed. The Rust server
# publishes `unraid-rs-v<semver>`; bare `v<semver>` tags belong to the Python
# server, so `/releases/latest/` would resolve to the wrong component entirely.
TAG_PREFIX="unraid-rs-v"
usage() {
  cat <<'USAGE'
Install runraid from GitHub Releases.

Environment:
  INSTALL_DIR Destination directory (default: ~/.local/bin)
  UNRAID_RMCP_VERSION Release version such as 0.2.3, v0.2.3 or unraid-rs-v0.2.3 (default: latest unraid-rs release)
  UNRAID_RMCP_REPO GitHub repo owner/name (default: dinglebear-ai/unraid-mcp)
USAGE
}
if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then usage; exit 0; fi
# Normalise a bare/v-prefixed version to the component tag the monorepo creates.
resolve_tag() {
  case "$1" in
    "${TAG_PREFIX}"*) printf '%s' "$1" ;;
    v*)               printf '%s%s' "${TAG_PREFIX}" "${1#v}" ;;
    *)                printf '%s%s' "${TAG_PREFIX}" "$1" ;;
  esac
}
# `/releases/latest` is repo-wide, so resolve the newest unraid-rs tag explicitly.
latest_tag() {
  curl -fsSL "https://api.github.com/repos/${REPO}/releases?per_page=100" \
    | grep -o "\"tag_name\": *\"${TAG_PREFIX}[^\"]*\"" \
    | head -n1 \
    | sed 's/.*"\(.*\)"/\1/'
}
need() { command -v "$1" >/dev/null 2>&1 || { printf 'error: %s is required
' "$1" >&2; exit 1; }; }
target_asset() {
  local os arch
  os="$(uname -s | tr '[:upper:]' '[:lower:]')"
  arch="$(uname -m)"
  case "${os}:${arch}" in
    linux:x86_64|linux:amd64) printf '%s-x86_64.tar.gz' "${BINARY_NAME}" ;;
    mingw*:x86_64|msys*:x86_64|cygwin*:x86_64) printf '%s-windows-x86_64.tar.gz' "${BINARY_NAME}" ;;
    *) printf 'error: unsupported platform %s/%s
' "${os}" "${arch}" >&2; exit 1 ;;
  esac
}
need curl; need install; need mktemp; need tar
asset="$(target_asset)"
tmpdir="$(mktemp -d)"
trap 'rm -rf "${tmpdir}"' EXIT
if [[ -n "${RELEASE_BASE_URL}" ]]; then
  url="${RELEASE_BASE_URL%/}/$(resolve_tag "${VERSION}")/${asset}"
else
  if [[ "${VERSION}" == "latest" ]]; then
    tag="$(latest_tag)"
    if [[ -z "${tag}" ]]; then
      printf 'error: no %s* release found in %s\n' "${TAG_PREFIX}" "${REPO}" >&2
      exit 1
    fi
  else
    tag="$(resolve_tag "${VERSION}")"
  fi
  url="https://github.com/${REPO}/releases/download/${tag}/${asset}"
fi
mkdir -p "${INSTALL_DIR}"
if [[ ! -w "${INSTALL_DIR}" ]]; then printf 'error: install dir is not writable: %s
' "${INSTALL_DIR}" >&2; exit 1; fi
printf 'Downloading %s
' "${url}" >&2
curl -fsSL "${url}" -o "${tmpdir}/${asset}"
tar -xzf "${tmpdir}/${asset}" -C "${tmpdir}"
binary="${tmpdir}/${BINARY_NAME}"
if [[ ! -f "${binary}" && -f "${tmpdir}/${BINARY_NAME}.exe" ]]; then binary="${tmpdir}/${BINARY_NAME}.exe"; fi
if [[ ! -f "${binary}" ]]; then printf 'error: archive did not contain %s binary
' "${BINARY_NAME}" >&2; exit 1; fi
install -m 755 "${binary}" "${INSTALL_DIR}/${BINARY_NAME}"
printf 'Installed %s to %s/%s
' "${BINARY_NAME}" "${INSTALL_DIR}" "${BINARY_NAME}"
printf 'Run: %s --version
' "${BINARY_NAME}"
