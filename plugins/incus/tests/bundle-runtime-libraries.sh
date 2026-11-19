#!/bin/bash
# Pinned runtime libraries: the build installs each locked Debian library into
# the private runtime, verifying the .deb and the library checksums, ships its
# copyright file, and refuses anything that does not match the lock.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUNDLE="$ROOT/scripts/bundle-runtime-libraries.sh"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
fail() { echo "bundle-runtime-libraries test failed: $*" >&2; exit 1; }

# A minimal Debian binary package holding one library and its copyright.
make_deb() {
  local out="$1" content="$2" work="$tmp/deb-build"
  rm -rf "$work"; mkdir -p "$work/data/usr/lib/x86_64-linux-gnu" "$work/data/usr/share/doc/libfake0"
  printf '%s' "$content" >"$work/data/usr/lib/x86_64-linux-gnu/libfake.so.0.1.0"
  ln -s libfake.so.0.1.0 "$work/data/usr/lib/x86_64-linux-gnu/libfake.so.0"
  printf 'Fake License\n' >"$work/data/usr/share/doc/libfake0/copyright"
  printf '2.0\n' >"$work/debian-binary"
  tar -C "$work/data" -cJf "$work/data.tar.xz" .
  printf 'Package: libfake0\n' >"$work/control"
  tar -C "$work" -cJf "$work/control.tar.xz" control
  (cd "$work" && ar rc "$out" debian-binary control.tar.xz data.tar.xz)
}

make_deb "$tmp/libfake0.deb" "fake library v1"
deb_sha="$(sha256sum "$tmp/libfake0.deb" | cut -d' ' -f1)"
lib_sha="$(printf 'fake library v1' | sha256sum | cut -d' ' -f1)"
lock="$tmp/runtime-libraries.lock"
printf '# package version url deb_sha256 member soname lib_sha256\n' >"$lock"
printf 'libfake0 0.1.0-1 file://%s %s usr/lib/x86_64-linux-gnu/libfake.so.0.1.0 libfake.so.0 %s\n' \
  "$tmp/libfake0.deb" "$deb_sha" "$lib_sha" >>"$lock"

run_bundle() { INCUS_RUNTIME_LOCK="$lock" INCUS_DEB_CACHE="$tmp/cache" "$BUNDLE" "$1"; }
stage="$tmp/stage"
installed="$stage/usr/local/incus/lib/libfake.so.0"
copyright="$stage/usr/local/incus/share/doc/libfake0/copyright"

# A missing library is installed under its soname with its copyright file.
mkdir -p "$stage/usr/local/incus/lib"
run_bundle "$stage" >"$tmp/out" || { cat "$tmp/out" >&2; fail "first bundle failed"; }
[[ -f "$installed" && ! -L "$installed" ]] || fail "library not installed as a regular file"
[[ "$(sha256sum "$installed" | cut -d' ' -f1)" = "$lib_sha" ]] || fail "installed library does not match the lock"
[[ "$(stat -c %a "$installed")" = 644 ]] || fail "library mode should be 0644"
grep -Fxq 'Fake License' "$copyright" || fail "copyright not shipped"

# A matching library and copyright need no download.
sed -i "s|file://$tmp/libfake0.deb|file://$tmp/missing.deb|" "$lock"
rm -rf "$tmp/cache"
run_bundle "$stage" >"$tmp/out" || { cat "$tmp/out" >&2; fail "idempotent run downloaded again"; }
sed -i "s|file://$tmp/missing.deb|file://$tmp/libfake0.deb|" "$lock"

# A carried-forward library that differs from the lock is replaced, and said so.
printf 'unknown build' >"$installed"
run_bundle "$stage" >"$tmp/out" || fail "replacing a drifted library failed"
grep -Fq 'replacing libfake.so.0' "$tmp/out" || fail "replacement not reported"
[[ "$(sha256sum "$installed" | cut -d' ' -f1)" = "$lib_sha" ]] || fail "drifted library not replaced"

# A .deb that does not match the lock is refused and nothing is installed.
rm -f "$installed"; rm -rf "$tmp/cache"
make_deb "$tmp/libfake0.deb" "tampered library"
if run_bundle "$stage" >"$tmp/out" 2>&1; then fail "tampered .deb accepted"; fi
grep -Fq 'checksum mismatch for libfake0' "$tmp/out" || { cat "$tmp/out" >&2; fail "deb mismatch not reported"; }
[[ ! -e "$installed" ]] || fail "library installed from a tampered .deb"

# A .deb that matches but holds a different library than the lock is refused.
deb_sha="$(sha256sum "$tmp/libfake0.deb" | cut -d' ' -f1)"
sed -i "s|^\(libfake0 [^ ]* [^ ]*\) [0-9a-f]*|\1 $deb_sha|" "$lock"
rm -rf "$tmp/cache"
if run_bundle "$stage" >"$tmp/out" 2>&1; then fail "library checksum mismatch accepted"; fi
grep -Fq 'library checksum mismatch for libfake.so.0' "$tmp/out" || { cat "$tmp/out" >&2; fail "library mismatch not reported"; }
[[ ! -e "$installed" ]] || fail "mismatched library installed"

# The real lock pins libbsd and its libmd dependency to immutable Debian
# snapshot files.
real_lock="$ROOT/runtime-libraries.lock"
for soname in libbsd.so.0 libmd.so.0; do
  grep -Eq "^[a-z0-9]+ [^ ]+ https://snapshot\.debian\.org/file/[0-9a-f]{40} [0-9a-f]{64} usr/lib/x86_64-linux-gnu/[^ ]+ ${soname//./\\.} [0-9a-f]{64}$" "$real_lock" ||
    fail "$soname is not pinned in runtime-libraries.lock"
done

printf 'bundle-runtime-libraries tests passed\n'
