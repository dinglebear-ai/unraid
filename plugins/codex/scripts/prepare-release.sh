#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "usage: $0 <YYYYMMDD.NNN> <build>" >&2
  exit 2
fi
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

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
plugin_dir="$(cd "${script_dir}/.." && pwd)"
manifest="$plugin_dir/unraid-codex.plg"
button="$plugin_dir/source/usr/local/emhttp/plugins/unraid-codex/CodexButton.page"
main_tsx="$plugin_dir/web-src/src/main.tsx"
date_header="${version:0:4}.${version:4:2}.${version:6:2}"

grep -Fq "###$date_header" "$manifest" || {
  echo "manifest changelog is missing date header ###$date_header" >&2
  exit 1
}
grep -Fq "Build $build" "$manifest" || {
  echo "manifest changelog is missing Build $build notes" >&2
  exit 1
}

python3 - "$manifest" "$button" "$main_tsx" "$version" "$build" <<'PY'
import pathlib, re, sys
manifest_path, button_path, main_path = map(pathlib.Path, sys.argv[1:4])
version, build = sys.argv[4:6]

def replace_once(text: str, pattern: str, replacement: str, label: str) -> str:
    updated, count = re.subn(pattern, replacement, text)
    if count != 1:
        raise SystemExit(f"expected one {label}, found {count}")
    return updated

manifest = manifest_path.read_text()
manifest = replace_once(
    manifest,
    r'<!ENTITY version\s+"[^"]+">',
    f'<!ENTITY version   "{version}">',
    'version entity',
)
manifest = replace_once(
    manifest,
    r'<!ENTITY txz\s+"[^"]+">',
    f'<!ENTITY txz       "unraid-codex-{version}-x86_64-{build}.txz">',
    'txz entity',
)
manifest_path.write_text(manifest)

button = replace_once(
    button_path.read_text(),
    r'(unraid-codex\.js\?v=)[0-9]+',
    rf'\g<1>{build}',
    'button cache-buster',
)
button_path.write_text(button)
main = replace_once(
    main_path.read_text(),
    r'(unraid-codex\.css\?v=)[0-9]+',
    rf'\g<1>{build}',
    'stylesheet cache-buster',
)
main_path.write_text(main)
PY

npm run build --prefix "$plugin_dir/web-src"

package="$plugin_dir/dist/unraid-codex-$version-x86_64-$build.txz"
SOURCE_DATE_EPOCH=0 "$plugin_dir/scripts/build-package.sh" "$version" "$build" >/dev/null
md5="$(md5sum "$package" | awk '{print $1}')"
sha="$(sha256sum "$package" | awk '{print $1}')"

python3 - "$manifest" "$md5" "$sha" <<'PY'
import pathlib, re, sys
path = pathlib.Path(sys.argv[1])
md5, sha = sys.argv[2:4]
text = path.read_text()
text, md5_count = re.subn(r'<!ENTITY md5\s+"[0-9a-f]+">', f'<!ENTITY md5       "{md5}">', text)
text, sha_count = re.subn(r'<!ENTITY sha256\s+"[0-9a-f]+">', f'<!ENTITY sha256    "{sha}">', text)
if md5_count != 1 or sha_count != 1:
    raise SystemExit(f"checksum entity mismatch: md5={md5_count}, sha256={sha_count}")
path.write_text(text)
PY

"$plugin_dir/scripts/verify-release.sh"
printf 'prepared_tag=codex-v%s\nprepared_package=%s\n' "$version" "$package"
