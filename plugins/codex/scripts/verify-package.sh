#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 3 ]]; then
  echo "usage: $0 <package.txz> <YYYYMMDD.NNN> <build>" >&2
  exit 2
fi

package="$1"
version="$2"
build="$3"
expected="unraid-codex-${version}-x86_64-${build}.txz"
[[ -f "$package" ]] || { echo "package not found: $package" >&2; exit 1; }
[[ "$(basename "$package")" = "$expected" ]] || {
  echo "unexpected package filename: $(basename "$package")" >&2
  exit 1
}
file "$package" | grep -Fq 'XZ compressed data'

stage="$(mktemp -d)"
trap 'rm -rf "$stage"' EXIT

while IFS= read -r member; do
  clean="${member#./}"
  case "$clean" in
    /*|../*|*/../*|*/..) echo "unsafe package member: $member" >&2; exit 1 ;;
  esac
done < <(tar -tJf "$package")

if tar --numeric-owner -tvJf "$package" | awk '$2 != "0/0" { bad = 1 } END { exit bad ? 0 : 1 }'; then
  echo "package contains non-root archive ownership" >&2
  exit 1
fi

tar -xJf "$package" -C "$stage"
if find "$stage" -type l -print -quit | grep -q .; then
  echo "package must not contain symbolic links" >&2
  exit 1
fi
if find "$stage" -type f -perm /022 -print -quit | grep -q .; then
  echo "package contains a group/world-writable file" >&2
  exit 1
fi
if find "$stage" -type f -name '*.map' -print -quit | grep -q . ||
   find "$stage" -type f -name '*.pyc' -print -quit | grep -q .; then
  echo "package contains development-only artifacts" >&2
  exit 1
fi
if find "$stage" -type d -name node_modules -print -quit | grep -q . ||
   find "$stage" -type d -name __pycache__ -print -quit | grep -q .; then
  echo "package contains development-only directories" >&2
  exit 1
fi

required=(
  install/slack-desc
  usr/local/emhttp/plugins/unraid-codex/CodexButton.page
  usr/local/emhttp/plugins/unraid-codex/CodexSettings.page
  usr/local/emhttp/plugins/unraid-codex/codex.png
  usr/local/emhttp/plugins/unraid-codex/web/unraid-codex.js
  usr/local/emhttp/plugins/unraid-codex/web/unraid-codex.css
  usr/local/emhttp/plugins/unraid-codex/scripts/start-appserver.sh
  usr/local/emhttp/plugins/unraid-codex/scripts/provision-container.sh
  usr/local/emhttp/plugins/unraid-codex/scripts/update-codex-cli.sh
  usr/local/emhttp/plugins/unraid-codex/scripts/verify-codex-cli.sh
  usr/local/emhttp/plugins/unraid-codex/scripts/appserver-smoke.py
  usr/local/emhttp/plugins/unraid-codex/container/install-codex-cli.sh
  usr/local/emhttp/plugins/unraid-codex/container/codex-appserver.service
)
for path in "${required[@]}"; do
  [[ -f "$stage/$path" ]] || { echo "missing package member: $path" >&2; exit 1; }
done

while IFS= read -r -d '' path; do
  [[ "$(stat -c '%a' "$path")" = 755 ]] || {
    echo "package executable must be mode 0755: ${path#"$stage"/}" >&2
    exit 1
  }
done < <(
  find "$stage/usr/local/emhttp/plugins/unraid-codex/scripts" -type f -name '*.sh' -print0
  find "$stage/usr/local/emhttp/plugins/unraid-codex/event" -type f -print0
)
[[ "$(stat -c '%a' "$stage/usr/local/emhttp/plugins/unraid-codex/container/install-codex-cli.sh")" = 755 ]]
for path in \
  "$stage/usr/local/emhttp/plugins/unraid-codex/scripts/appserver-smoke.py" \
  "$stage/usr/local/emhttp/plugins/unraid-codex/container/codex-appserver.service"; do
  [[ "$(stat -c '%a' "$path")" = 644 ]] || {
    echo "package data file must be mode 0644: ${path#"$stage"/}" >&2
    exit 1
  }
done

grep -Fq 'unraid-codex (persistent Codex chathead for Unraid)' "$stage/install/slack-desc"
if grep -R -n -E 'tskey-[A-Za-z0-9_-]+' "$stage" >/dev/null; then
  echo "credential-like data found in package" >&2
  exit 1
fi

printf 'package=%s\n' "$package"
md5sum "$package"
sha256sum "$package"
echo 'Codex package verification passed'
