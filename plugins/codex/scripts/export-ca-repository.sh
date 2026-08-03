#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "usage: $0 <empty-destination-directory>" >&2
  exit 2
fi
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
plugin_dir="$(cd "${script_dir}/.." && pwd)"
repo_dir="$(cd "${plugin_dir}/../.." && pwd)"
dest="$1"
[[ "$dest" = /* ]] || { echo "destination must be an absolute path" >&2; exit 2; }
mkdir -p "$dest"
if find "$dest" -mindepth 1 -print -quit | grep -q .; then
  echo "destination must be empty: $dest" >&2
  exit 1
fi

install -m 0644 "$repo_dir/LICENSE" "$dest/LICENSE"
install -m 0644 "$plugin_dir/ca/README.md" "$dest/README.md"
install -m 0644 "$plugin_dir/ca/ca_profile.xml" "$dest/ca_profile.xml"
install -m 0644 "$plugin_dir/ca/unraid-codex.xml" "$dest/unraid-codex.xml"
install -m 0644 "$plugin_dir/source/usr/local/emhttp/plugins/unraid-codex/codex-icon.svg" "$dest/icon.svg"
install -m 0644 "$plugin_dir/unraid-codex.plg" "$dest/unraid-codex.plg"
python3 - "$dest/unraid-codex.plg" <<'PY'
import pathlib, re, sys
path = pathlib.Path(sys.argv[1])
text = path.read_text()
text, count = re.subn(
    r'<!ENTITY gitURL\s+"[^"]+">',
    '<!ENTITY gitURL    "https://raw.githubusercontent.com/dinglebear-ai/unraid-codex/main">',
    text,
)
if count != 1:
    raise SystemExit(f"expected one gitURL entity, found {count}")
path.write_text(text)
PY

xmllint --noout "$dest/ca_profile.xml" "$dest/unraid-codex.xml" "$dest/unraid-codex.plg"
printf 'CA publication export created at %s\n' "$dest"
find "$dest" -maxdepth 1 -type f -printf '%f\n' | sort
