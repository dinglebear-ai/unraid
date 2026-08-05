#!/usr/bin/env bash
# Build the unraid-mcp Slackware package (.txz).
#
# Stages:
#   1. Build the settings web bundle (vite) into source/.../web/.
#   2. Stage the release-matched runraid binary under
#      usr/local/unraid-mcp/bin/runraid.
#   3. Assemble a deterministic root-owned .txz and verify the manifest,
#      archive, executable, and embedded server version.
#
# Usage: build-txz.sh <rust-version> <runraid-binary>
#   <rust-version>    e.g. 0.3.0 — must match `runraid --version`.
#   <runraid-binary>  release binary to embed in the package.
#
# The plugin version written into the manifest is NOT the rust semver: Unraid
# compares plugin versions as raw strings, so scripts/plugin-version.sh maps
# the rust semver to a fixed-width epoch-3 version (0.3.1 -> 3.000.003.001)
# that sorts after every legacy Python-lane 2.x release.

set -euo pipefail

VERSION="${1:?usage: build-txz.sh <rust-version> <runraid-binary>}"
RUNRAID="${2:?usage: build-txz.sh <rust-version> <runraid-binary>}"

if [[ ! "${VERSION}" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "ERROR: invalid rust version '${VERSION}'" >&2
    exit 1
fi

PLUGIN_VERSION="$("$(dirname "${BASH_SOURCE[0]}")/plugin-version.sh" "${VERSION}")"

RUNRAID="$(realpath "${RUNRAID}")"
if [ ! -x "${RUNRAID}" ]; then
    echo "ERROR: runraid binary is missing or not executable: ${RUNRAID}" >&2
    exit 1
fi

EXPECTED_VERSION="unraid-rmcp ${VERSION}"
ACTUAL_VERSION="$("${RUNRAID}" --version 2>/dev/null || true)"
if [ "${ACTUAL_VERSION}" != "${EXPECTED_VERSION}" ]; then
    echo "ERROR: runraid version mismatch" >&2
    echo "       expected: ${EXPECTED_VERSION}" >&2
    echo "       actual:   ${ACTUAL_VERSION:-<no output>}" >&2
    exit 1
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STAGE="$(mktemp -d)"
OUT_DIR="${ROOT}/packages"
PKG_NAME="unraid-mcp-${PLUGIN_VERSION}-x86_64-2.txz"

trap 'rm -rf "${STAGE}"' EXIT
mkdir -p "${OUT_DIR}"

if [ "${UNRAID_MCP_SKIP_WEB_BUILD:-false}" = "true" ]; then
    echo "==> [1/3] reusing previously built web bundle"
    test -s "${ROOT}/source/usr/local/emhttp/plugins/unraid-mcp/web/unraid-mcp-settings.js"
    test -s "${ROOT}/source/usr/local/emhttp/plugins/unraid-mcp/web/unraid-mcp-settings.css"
    test -s "${ROOT}/source/usr/local/emhttp/plugins/unraid-mcp/web/unraid-mcp-widget.js"
else
    echo "==> [1/3] building web bundle"
    (cd "${ROOT}/web" && npm ci --no-audit --no-fund && npm run build)
fi

echo "==> [2/3] staging runraid ${VERSION}"
cp -a "${ROOT}/source/." "${STAGE}/"
mkdir -p "${STAGE}/usr/local/unraid-mcp/bin"
install -m 0755 "${RUNRAID}" "${STAGE}/usr/local/unraid-mcp/bin/runraid"
"${STAGE}/usr/local/unraid-mcp/bin/runraid" --version

# Slackware package description (install/slack-desc is conventional).
mkdir -p "${STAGE}/install"
cat > "${STAGE}/install/slack-desc" <<EOF
unraid-mcp: unraid-mcp (Rust MCP server for the Unraid GraphQL API)
unraid-mcp:
unraid-mcp: Exposes Unraid system control to MCP clients (Claude et al.)
unraid-mcp: with the native runraid binary, bearer auth, and a webGUI.
unraid-mcp:
unraid-mcp: https://github.com/dinglebear-ai/unraid
EOF

find "${STAGE}" -type d -exec chmod 755 {} +
chmod +x "${STAGE}/usr/local/emhttp/plugins/unraid-mcp/scripts/"* \
         "${STAGE}/usr/local/emhttp/plugins/unraid-mcp/event/"* \
         "${STAGE}/usr/local/unraid-mcp/bin/runraid"

echo "==> [3/3] assembling ${PKG_NAME}"
# Deterministic archive: stable entry order and a fixed mtime, so rebuilding the
# same source and binary yields the same sha256.
SOURCE_DATE_EPOCH="${SOURCE_DATE_EPOCH:-$(git -C "${ROOT}" log -1 --format=%ct 2>/dev/null || echo 0)}"
tar -C "${STAGE}" --owner=0 --group=0 --numeric-owner \
    --sort=name --mtime="@${SOURCE_DATE_EPOCH}" \
    --transform='s|^\./||' -cJf "${OUT_DIR}/${PKG_NAME}" .

MD5="$(md5sum "${OUT_DIR}/${PKG_NAME}" | awk '{print $1}')"
SHA256="$(sha256sum "${OUT_DIR}/${PKG_NAME}" | awk '{print $1}')"
SIZE="$(stat -c%s "${OUT_DIR}/${PKG_NAME}")"

echo ""
echo "package: ${OUT_DIR}/${PKG_NAME}"
echo "size:    ${SIZE} bytes"
echo "md5:     ${MD5}"
echo "sha256:  ${SHA256}"
echo ""
echo "==> writing ${OUT_DIR}/unraid-mcp.plg (plugin ${PLUGIN_VERSION}, runraid ${VERSION})"
# RUST_VERSION_PLACEHOLDER must be substituted before VERSION_PLACEHOLDER —
# the latter is a substring of the former.
sed -e "s/RUST_VERSION_PLACEHOLDER/${VERSION}/g" \
    -e "s/VERSION_PLACEHOLDER/${PLUGIN_VERSION}/g" \
    -e "s/MD5_PLACEHOLDER/${MD5}/g" \
    -e "s/SHA256_PLACEHOLDER/${SHA256}/g" \
    "${ROOT}/unraid-mcp.plg" > "${OUT_DIR}/unraid-mcp.plg"
"${ROOT}/scripts/verify-package.sh" "${OUT_DIR}/unraid-mcp.plg" "${OUT_DIR}/${PKG_NAME}"
echo "done — upload both files to the GitHub release for unraid-rs-v${VERSION}"
