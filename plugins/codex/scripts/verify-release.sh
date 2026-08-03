#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
plugin_dir="$(cd "${script_dir}/.." && pwd)"
manifest="${plugin_dir}/unraid-codex.plg"

read -r version build manifest_md5 manifest_sha < <(
  python3 - "$manifest" <<'PY'
import pathlib, re, sys
text = pathlib.Path(sys.argv[1]).read_text()
def capture(pattern: str) -> str:
    match = re.search(pattern, text)
    if not match:
        raise SystemExit(f"manifest field not found: {pattern}")
    return match.group(1)
version = capture(r'<!ENTITY version\s+"([^"]+)">')
txz = capture(r'<!ENTITY txz\s+"([^"]+)">')
match = re.fullmatch(r'unraid-codex-(.+)-x86_64-([0-9]+)\.txz', txz)
if not match:
    raise SystemExit(f"invalid txz entity: {txz}")
if match.group(1) != version:
    raise SystemExit(f"manifest version {version} does not match txz version {match.group(1)}")
md5 = capture(r'<!ENTITY md5\s+"([0-9a-f]{32})">')
sha = capture(r'<!ENTITY sha256\s+"([0-9a-f]{64})">')
print(version, match.group(2), md5, sha)
PY
)

[[ "$version" =~ ^[0-9]{8}\.[0-9]{3}$ ]]
[[ "$build" =~ ^[1-9][0-9]*$ ]]
if [[ -n "${TAG:-}" && "$TAG" != "codex-v$version" ]]; then
  echo "release tag $TAG does not match manifest version codex-v$version" >&2
  exit 1
fi

grep -Fq "unraid-codex.js?v=$build" \
  "$plugin_dir/source/usr/local/emhttp/plugins/unraid-codex/CodexButton.page"
grep -Fq "unraid-codex.css?v=$build" "$plugin_dir/web-src/src/main.tsx"
xmllint --noout "$manifest"

bundle_hash() {
  find "$plugin_dir/source/usr/local/emhttp/plugins/unraid-codex/web" -maxdepth 1 -type f -print0 |
    sort -z |
    xargs -0 sha256sum |
    sha256sum |
    awk '{print $1}'
}

before_bundle="$(bundle_hash)"
npm run typecheck --prefix "$plugin_dir/web-src"
npm run build --prefix "$plugin_dir/web-src"
after_bundle="$(bundle_hash)"
[[ "$before_bundle" = "$after_bundle" ]] || {
  echo "committed browser bundle is stale; rebuild and commit it" >&2
  exit 1
}

grep -Fq "unraid-codex.css?v=$build" \
  "$plugin_dir/source/usr/local/emhttp/plugins/unraid-codex/web/unraid-codex.js"

shellcheck \
  "$plugin_dir/scripts/"*.sh \
  "$plugin_dir/tests/"*.sh \
  "$plugin_dir/source/usr/local/emhttp/plugins/unraid-codex/scripts/"*.sh \
  "$plugin_dir/source/usr/local/emhttp/plugins/unraid-codex/event/"* \
  "$plugin_dir/source/usr/local/emhttp/plugins/unraid-codex/container/install-codex-cli.sh"
"$plugin_dir/tests/contract.sh"

package="$plugin_dir/dist/unraid-codex-$version-x86_64-$build.txz"
SOURCE_DATE_EPOCH=0 "$plugin_dir/scripts/build-package.sh" "$version" "$build" >/dev/null
first_copy="$(mktemp /tmp/unraid-codex-package.XXXXXX.txz)"
trap 'rm -f "$first_copy"' EXIT
cp "$package" "$first_copy"
SOURCE_DATE_EPOCH=0 "$plugin_dir/scripts/build-package.sh" "$version" "$build" >/dev/null
cmp -s "$first_copy" "$package" || {
  echo "Codex package build is not reproducible" >&2
  exit 1
}
"$plugin_dir/scripts/verify-package.sh" "$package" "$version" "$build"

actual_md5="$(md5sum "$package" | awk '{print $1}')"
actual_sha="$(sha256sum "$package" | awk '{print $1}')"
[[ "$actual_md5" = "$manifest_md5" ]] || {
  echo "manifest MD5 does not match package: $manifest_md5 != $actual_md5" >&2
  exit 1
}
[[ "$actual_sha" = "$manifest_sha" ]] || {
  echo "manifest SHA-256 does not match package: $manifest_sha != $actual_sha" >&2
  exit 1
}

printf 'version=%s\nbuild=%s\npackage=%s\nmd5=%s\nsha256=%s\n' \
  "$version" "$build" "$package" "$actual_md5" "$actual_sha"
echo 'Codex release verification passed'
