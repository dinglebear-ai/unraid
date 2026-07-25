#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
plugin_dir="$(cd "${script_dir}/.." && pwd)"
repo_dir="$(cd "${plugin_dir}/.." && pwd)"
version="${1:-2026.07.23}"
build="${2:-1}"
package_name="unraid-codex-${version}-x86_64-${build}.txz"
output_dir="${plugin_dir}/dist"
stage_dir="$(mktemp -d)"

cleanup() {
  rm -rf "${stage_dir}"
}
trap cleanup EXIT

cp -a "${plugin_dir}/source/." "${stage_dir}/"
install -d "${stage_dir}/install"
cp "${plugin_dir}/package/install/slack-desc" "${stage_dir}/install/slack-desc"
find "${stage_dir}" -type d -exec chmod 0755 {} +
find "${stage_dir}" -type f -exec chmod 0644 {} +
chmod 0755 \
  "${stage_dir}/usr/local/emhttp/plugins/unraid-codex/scripts/"*.sh \
  "${stage_dir}/usr/local/emhttp/plugins/unraid-codex/event/"*

mkdir -p "${output_dir}"
(
  cd "${stage_dir}"
  if command -v makepkg >/dev/null 2>&1; then
    makepkg -l y -c n "${output_dir}/${package_name}"
  else
    # A Slackware .txz is a root-relative tar.xz archive. Keep the non-Unraid
    # development path reproducible so UI-only releases do not depend on a
    # round-trip to an Unraid host merely to assemble the package.
    tar \
      --sort=name \
      --mtime="@${SOURCE_DATE_EPOCH:-0}" \
      --owner=0 \
      --group=0 \
      --numeric-owner \
      -cJf "${output_dir}/${package_name}" \
      .
  fi
)

sha256sum "${output_dir}/${package_name}"
printf '%s\n' "${output_dir}/${package_name}"
