#!/usr/bin/env bash
set -euo pipefail
umask 022

if [[ $# -ne 2 ]]; then
  echo "usage: $0 <YYYYMMDD.NNN> <build>" >&2
  exit 2
fi

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
plugin_dir="$(cd "${script_dir}/.." && pwd)"
version="$1"
build="$2"
[[ "$version" =~ ^[0-9]{8}\.[0-9]{3}$ ]] || {
  echo "version must use fixed-width CalVer YYYYMMDD.NNN" >&2
  exit 2
}
[[ "$build" =~ ^[1-9][0-9]*$ ]] || {
  echo "build must be a positive integer" >&2
  exit 2
}
[[ "${SOURCE_DATE_EPOCH:-0}" =~ ^[0-9]+$ ]] || {
  echo "SOURCE_DATE_EPOCH must be a non-negative integer" >&2
  exit 2
}

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
  "${stage_dir}/usr/local/emhttp/plugins/unraid-codex/event/"* \
  "${stage_dir}/usr/local/emhttp/plugins/unraid-codex/container/install-codex-cli.sh"

mkdir -p "${output_dir}"
rm -f "${output_dir}/${package_name}"
(
  cd "${stage_dir}"
  XZ_OPT="${XZ_OPT:--9e -T1}" tar \
    --sort=name \
    --mtime="@${SOURCE_DATE_EPOCH:-0}" \
    --owner=0 \
    --group=0 \
    --numeric-owner \
    -cJf "${output_dir}/${package_name}" \
    .
)

sha256sum "${output_dir}/${package_name}"
printf '%s\n' "${output_dir}/${package_name}"
