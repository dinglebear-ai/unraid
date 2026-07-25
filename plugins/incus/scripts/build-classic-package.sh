#!/bin/bash
# Rebuild by carrying forward the complete prior binary payload and overlaying
# tracked source. This prevents the historical destructive source-only rebuild.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
build="${1:?usage: $0 NEW_BUILD_NUMBER [previous.txz]}"
previous="${2:-$(find "$ROOT/packages" -maxdepth 1 -type f -name 'incus-unraid-*.txz' -print | sort -V | tail -1)}"
version="7.0.0-${build}-x86_64-1"
output="$ROOT/packages/incus-unraid-${version}.txz"
release="$(jq -er '.release' "$ROOT/release-manifest.json")"
release_date="${release//./-}"
if [ -n "${SOURCE_DATE_EPOCH:-}" ]; then
  source_date_epoch="$SOURCE_DATE_EPOCH"
else
  source_date_epoch="$(date -u -d "$release_date 00:00:00" +%s 2>/dev/null || printf '0')"
fi
stage="$(mktemp -d)"
trap 'rm -rf "$stage"' EXIT

tar -xJf "$previous" -C "$stage"
cp -a "$ROOT/source/." "$stage/"

# Carry-forward archives may contain helpers from a historically broken build
# where regular files were mode 0600. Restore the runtime contract explicitly
# instead of depending on the previous package or the builder's umask.
required_executables=(
  usr/local/incus/libexec/incus/incusd
  usr/local/incus/bin/incus
  usr/local/incus/bin/lxcfs
  usr/local/incus/bin/nft
  usr/local/incus/bin/distrobuilder
  usr/local/incus/bin/debootstrap
  usr/local/incus/bin/ar
  usr/local/incus/bin/mksquashfs
  usr/local/incus/bin/unsquashfs
  usr/local/incus/bin/zstd
  usr/local/incus/bin/zstdcat
  usr/local/incus/bin/unzstd
)
for path in "${required_executables[@]}"; do
  if [ -e "$stage/$path" ]; then
    chmod 0755 "$stage/$path"
  fi
done

printf '%s+%s\n' "$release" "$build" \
  >"$stage/usr/local/emhttp/plugins/incus/build-id"
chmod 0644 "$stage/usr/local/emhttp/plugins/incus/build-id"
# Avoid a circular self-hash: the embedded copy names the package but points to
# the external signed/checksummed release metadata for final archive hashes.
sed \
  -e "s|^- File: .*|- File: \`packages/incus-unraid-${version}.txz\`|" \
  -e 's|^- Size: .*|- Size: see external release-manifest.json|' \
  -e 's|^- Entries: .*|- Entries: see external release-manifest.json|' \
  -e 's|^- MD5 .*|- MD5: see external release-manifest.json (legacy only)|' \
  -e 's|^- SHA-256: .*|- SHA-256: see external release-manifest.json|' \
  "$ROOT/MANIFEST.md" >"$stage/usr/local/incus/MANIFEST.md"
chmod 0644 "$stage/usr/local/incus/MANIFEST.md"

# A release can carry the backend in the same versioned payload, eliminating
# frontend/backend skew. CI builds dist first; local classic-only builds omit it.
if [ -d "$ROOT/unraid-api-plugin-incus/dist" ]; then
  api="$stage/usr/local/emhttp/plugins/incus/api-plugin"
  mkdir -p "$api"
  # Worktree setup may provide dist as a warm-cache symlink. Dereference it so
  # the release contains compiled files, never a machine-local absolute link.
  cp -aL "$ROOT/unraid-api-plugin-incus/dist" "$api/"
  cp -a "$ROOT/unraid-api-plugin-incus/package.json" \
    "$ROOT/unraid-api-plugin-incus/package-lock.json" "$api/"
  # Install only locked runtime dependencies. Host-provided Nest/GraphQL peers
  # remain peers; --legacy-peer-deps prevents npm from materializing them here.
  (cd "$api" && npm ci --omit=dev --ignore-scripts --legacy-peer-deps)
fi

# upgradepkg applies directory metadata from the archive to the live rootfs.
# Normalize every shipped directory and omit the staging root itself so a
# package can never change / ownership or mode.
find "$stage" -type d -exec chmod 0755 {} +
# Normalize all archive mtimes and ordering. npm and archive extraction assign
# current timestamps to generated/vendor metadata, which otherwise changes the
# txz hash even when the staged content is identical.
find "$stage" -exec touch -h -d "@$source_date_epoch" {} +
mapfile -d '' package_roots < <(
  find "$stage" -mindepth 1 -maxdepth 1 -printf '%f\0' | LC_ALL=C sort -z
)
[ "${#package_roots[@]}" -gt 0 ] || {
  echo "refusing to build an empty classic package" >&2
  exit 1
}
(
  cd "$stage"
  tar --sort=name --mtime="@$source_date_epoch" \
    --owner=0 --group=0 --numeric-owner -cJf "$output" "${package_roots[@]}"
)
echo "built $output"
echo "md5=$(md5sum "$output" | awk '{print $1}')"
echo "sha256=$(sha256sum "$output" | awk '{print $1}')"
echo "entries=$(tar -tJf "$output" | wc -l)"
echo "Update incus.plg entities and MANIFEST.md, then run scripts/verify-classic-package.sh."
