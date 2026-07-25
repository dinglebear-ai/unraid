#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

plugin_name="$(sed -n 's/.*<!ENTITY name[[:space:]]*"\([^"]*\)".*/\1/p' incus.plg)"
txz="$(sed -n 's/.*<!ENTITY txz[[:space:]]*"\([^"]*\)".*/\1/p' incus.plg)"
txz="${txz//&name;/$plugin_name}"
md5="$(sed -n 's/.*<!ENTITY md5[[:space:]]*"\([^"]*\)".*/\1/p' incus.plg)"
sha256="$(sed -n 's/.*<!ENTITY sha256[[:space:]]*"\([^"]*\)".*/\1/p' incus.plg)"
archive="packages/$txz"

# --- Static source-level checks (always run; independent of the built archive) ---
xmllint --noout incus.plg
find source/usr/local/emhttp/plugins/incus -type f \( -name '*.sh' -o -path '*/event/*' \) -print0 |
  xargs -0 -r -n1 bash -n
shellcheck -x -e SC1090,SC1091,SC2001 source/usr/local/emhttp/plugins/incus/scripts/*.sh source/usr/local/emhttp/plugins/incus/event/*

# --- Archive-dependent verification ---
# The .txz plugin payload is a GitHub *release asset*, not tracked in git (its
# history was scrubbed during the monorepo consolidation to avoid ~746 MB of
# committed binaries). When the archive is absent (fresh checkout / release-asset
# model) the source-only checks above are the full local gate; when the archive
# IS present (after build-classic-package.sh, or in the release CI that fetches
# the prior asset) the deep package verification below runs in full.
if [ ! -f "$archive" ]; then
  echo "classic/package source verification passed (archive '$txz' is a release asset, not in-tree; build-classic-package.sh or fetch the release asset for full package verification)"
  exit 0
fi

archive_list="$(mktemp)"
archive_tree="$(mktemp -d)"
trap 'rm -f "$archive_list"; rm -rf "$archive_tree"' EXIT
tar -tJf "$archive" >"$archive_list"
tar -xJf "$archive" -C "$archive_tree"
echo "$md5  $archive" | md5sum -c -
echo "$sha256  $archive" | sha256sum -c -

if awk '$0 == "./" { found=1 } END { exit !found }' "$archive_list"; then
  echo "archive must not contain a root directory entry" >&2
  exit 1
fi
bad_directory_mode="$(
  tar --numeric-owner -tvJf "$archive" |
    awk '$1 ~ /^d/ && ($1 != "drwxr-xr-x" || $2 != "0/0") { print $NF; exit }'
)"
[ -z "$bad_directory_mode" ] || {
  echo "archive contains unsafe directory metadata: $bad_directory_mode" >&2
  exit 1
}

entries="$(wc -l <"$archive_list")"
expected_entries="$(sed -n 's/^- Entries: \([0-9][0-9]*\)$/\1/p' MANIFEST.md)"
[ -n "$expected_entries" ] || { echo "MANIFEST.md has no numeric package entry count" >&2; exit 1; }
[ "$entries" -eq "$expected_entries" ] || {
  echo "archive entry count differs from release manifest: $entries != $expected_entries" >&2
  exit 1
}
required_executables=(
  usr/local/incus/libexec/incus/incusd \
  usr/local/incus/bin/incus \
  usr/local/incus/bin/lxcfs \
  usr/local/incus/bin/nft \
  usr/local/incus/bin/distrobuilder \
  usr/local/incus/bin/debootstrap \
  usr/local/incus/bin/ar \
  usr/local/incus/bin/mksquashfs \
  usr/local/incus/bin/unsquashfs \
  usr/local/incus/bin/zstd \
  usr/local/incus/bin/zstdcat \
  usr/local/incus/bin/unzstd
)

required_files=(
  usr/local/emhttp/plugins/incus/api-plugin/dist/index.js \
  usr/local/emhttp/plugins/incus/api-plugin/node_modules/ws/package.json \
  usr/local/emhttp/plugins/incus/api-plugin/node_modules/graphql-subscriptions/package.json \
  usr/local/emhttp/plugins/incus/scripts/rc.incus \
  usr/local/emhttp/plugins/incus/build-id \
  usr/local/emhttp/plugins/incus/web/incus-settings.js \
  usr/local/emhttp/plugins/incus/web/incus-dashboard.js
)

for path in "${required_executables[@]}" "${required_files[@]}"; do
  grep -Fxq "$path" "$archive_list" || { echo "archive missing $path" >&2; exit 1; }
done

for path in "${required_executables[@]}"; do
  [ -x "$archive_tree/$path" ] || {
    echo "required executable is not executable in archive: $path" >&2
    exit 1
  }
done

[ "$(readlink "$archive_tree/usr/local/incus/bin/zstdcat")" = zstd ] || {
  echo "zstdcat must be a relative symlink to the bundled zstd" >&2
  exit 1
}
[ "$(readlink "$archive_tree/usr/local/incus/bin/unzstd")" = zstd ] || {
  echo "unzstd must be a relative symlink to the bundled zstd" >&2
  exit 1
}

runtime_root="$archive_tree/usr/local/incus"
runtime_env=(
  env
  "DEBOOTSTRAP_DIR=$runtime_root/share/debootstrap"
  "LD_LIBRARY_PATH=$runtime_root/lib"
  "PATH=$runtime_root/bin:$runtime_root/libexec/incus:/usr/bin:/bin"
)

smoke_helper() {
  local expected="$1"
  shift
  local output rc=0
  output="$(timeout 10 "${runtime_env[@]}" "$@" 2>&1)" || rc=$?
  if [ "$rc" -eq 124 ] || [ "$rc" -eq 126 ] || [ "$rc" -eq 127 ] || ! grep -Eiq "$expected" <<<"$output"; then
    echo "required helper smoke invocation failed (rc=$rc): $*" >&2
    printf '%s\n' "$output" >&2
    exit 1
  fi
}

smoke_helper '^7\.0\.0$' "$runtime_root/libexec/incus/incusd" --version
smoke_helper '^7\.0\.0$' "$runtime_root/bin/incus" --version
smoke_helper '7\.0\.0' "$runtime_root/bin/lxcfs" --version
smoke_helper 'nftables' "$runtime_root/bin/nft" --version
smoke_helper 'Usage:.*distrobuilder|System container and VM image builder' "$runtime_root/bin/distrobuilder" --help
smoke_helper 'debootstrap [0-9]' "$runtime_root/bin/debootstrap" --version
smoke_helper 'GNU ar' "$runtime_root/bin/ar" --version
smoke_helper 'mksquashfs version' "$runtime_root/bin/mksquashfs" -version
smoke_helper 'unsquashfs version' "$runtime_root/bin/unsquashfs" -version
smoke_helper 'Zstandard CLI' "$runtime_root/bin/zstd" --version
smoke_helper '^[0-9]+\.[0-9]+\.[0-9]+$' "$runtime_root/bin/zstdcat" --version
smoke_helper 'Zstandard CLI' "$runtime_root/bin/unzstd" --version

for path in "${required_executables[@]}" usr/lib/x86_64-linux-gnu/lxcfs/liblxcfs.so; do
  if file "$archive_tree/$path" | grep -q 'dynamically linked'; then
    unresolved="$("${runtime_env[@]}" ldd "$archive_tree/$path" 2>/dev/null | awk '/not found/{print $1}')"
    [ -z "$unresolved" ] || {
      echo "unresolved shared libraries for $path: $unresolved" >&2
      exit 1
    }
  fi
done

release="$(jq -er '.release' release-manifest.json)"
package_build="$(sed -n 's/.*<!ENTITY txz[[:space:]]*"&name;-unraid-7\.0\.0-\([0-9][0-9]*\)-x86_64-1\.txz".*/\1/p' incus.plg)"
[ "$(cat "$archive_tree/usr/local/emhttp/plugins/incus/build-id")" = "${release}+${package_build}" ] || {
  echo "embedded build-id differs from coordinated release metadata" >&2
  exit 1
}

if tar -tvJf "$archive" usr/local/emhttp/plugins/incus/api-plugin/dist | grep -q '^l'; then
  echo "API dist must contain files, not symlinks" >&2
  exit 1
fi

# Every tracked classic source must be present in the release payload.
while IFS= read -r path; do
  member="${path#source/}"
  grep -Fxq "$member" "$archive_list" || { echo "archive/source drift: $member missing" >&2; exit 1; }
  cmp -s "$path" "$archive_tree/$member" || { echo "archive/source drift: $member content differs" >&2; exit 1; }
done < <(git ls-files source)

bad_owner="$(tar --numeric-owner -tvJf "$archive" | awk '$2 != "0/0" && bad == "" { bad=$2 } END { print bad }')"
[ -z "$bad_owner" ] || { echo "archive contains non-root ownership: $bad_owner" >&2; exit 1; }

embedded_manifest="$(tar -xOJf "$archive" usr/local/incus/MANIFEST.md)"
grep -Fq "$txz" <<<"$embedded_manifest" || { echo "embedded manifest build drift" >&2; exit 1; }

echo "classic/package verification passed ($entries entries)"
