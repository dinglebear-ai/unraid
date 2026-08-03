#!/bin/bash
set -euo pipefail

RELEASE_API="${CODEX_RELEASE_API:-https://api.github.com/repos/openai/codex/releases/latest}"
ASSET_NAME="${CODEX_ASSET_NAME:-codex-x86_64-unknown-linux-musl.tar.gz}"
BINARY_NAME="${CODEX_BINARY_NAME:-codex-x86_64-unknown-linux-musl}"
CODEX_USER="${CODEX_USER:-agent}"
CODEX_GROUP="${CODEX_GROUP:-agent}"
CODEX_HOME="${CODEX_HOME:-/home/agent}"
CODEX_DEST="${CODEX_DEST:-$CODEX_HOME/.local/bin/codex}"
CODEX_PREVIOUS="${CODEX_PREVIOUS:-$CODEX_DEST.previous}"
CACHE_DIR="${CODEX_CACHE_DIR:-/var/cache/unraid-codex}"
STATE_DIR="${CODEX_INSTALL_STATE_DIR:-/var/lib/unraid-codex}"
OFFLINE_OK="${CODEX_OFFLINE_OK:-1}"
FORCE_UPDATE="${CODEX_FORCE_UPDATE:-0}"

fail() {
  echo "unraid-codex updater: $*" >&2
  exit 1
}

verify_binary() {
  local binary="$1" expected="${2:-}" actual
  [[ -x "$binary" ]] || return 1
  actual="$(HOME="$CODEX_HOME" "$binary" --version 2>/dev/null | awk '{print $NF}')"
  [[ "$actual" =~ ^[0-9]+.[0-9]+.[0-9]+([.-][A-Za-z0-9.]+)?$ ]] || return 1
  [[ -z "$expected" || "$actual" = "$expected" ]] || return 1
  HOME="$CODEX_HOME" "$binary" --strict-config --version >/dev/null 2>&1 || return 1
  HOME="$CODEX_HOME" "$binary" app-server --help >/dev/null 2>&1 || return 1
  HOME="$CODEX_HOME" "$binary" exec --help >/dev/null 2>&1 || return 1
  printf '%s
' "$actual"
}

[[ "$RELEASE_API" = "https://api.github.com/repos/openai/codex/releases/latest" ]] ||
  fail "release API must be the official openai/codex latest-release endpoint"
[[ "$ASSET_NAME" =~ ^[A-Za-z0-9._-]+$ ]] || fail "invalid asset name"
[[ "$BINARY_NAME" =~ ^[A-Za-z0-9._-]+$ ]] || fail "invalid binary name"
[[ "$OFFLINE_OK" = 0 || "$OFFLINE_OK" = 1 ]] || fail "CODEX_OFFLINE_OK must be 0 or 1"
[[ "$FORCE_UPDATE" = 0 || "$FORCE_UPDATE" = 1 ]] || fail "CODEX_FORCE_UPDATE must be 0 or 1"
getent passwd "$CODEX_USER" >/dev/null || fail "user does not exist: $CODEX_USER"
getent group "$CODEX_GROUP" >/dev/null || fail "group does not exist: $CODEX_GROUP"

install -d -m 0755 "$CACHE_DIR" "$STATE_DIR"
install -d -o "$CODEX_USER" -g "$CODEX_GROUP" -m 0755 "$(dirname "$CODEX_DEST")"
metadata="$(mktemp "$STATE_DIR/.release.XXXXXX.json")"
cleanup_metadata() { rm -f "$metadata"; }
trap cleanup_metadata EXIT INT TERM

if ! curl -fsSL --retry 3 --retry-all-errors --connect-timeout 20   -H 'Accept: application/vnd.github+json'   -H 'User-Agent: unraid-codex-updater'   -o "$metadata" "$RELEASE_API"; then
  current="$(verify_binary "$CODEX_DEST" 2>/dev/null || true)"
  if [[ "$OFFLINE_OK" = 1 && -n "$current" ]]; then
    printf 'codex_cli_version=%s installation=current check=deferred
' "$current"
    exit 0
  fi
  fail "could not fetch the latest official Codex release metadata"
fi

read -r version tag asset_url sha256 < <(
  python3 - "$metadata" "$ASSET_NAME" <<'PY'
import json
import re
import sys

path, asset_name = sys.argv[1:3]
with open(path, encoding="utf-8") as handle:
    data = json.load(handle)
tag = data.get("tag_name", "")
if not re.fullmatch(r"rust-v[0-9]+.[0-9]+.[0-9]+(?:[-.][A-Za-z0-9.]+)?", tag):
    raise SystemExit("invalid official Codex release tag")
asset = next((item for item in data.get("assets", []) if item.get("name") == asset_name), None)
if not asset:
    raise SystemExit(f"missing release asset: {asset_name}")
url = asset.get("browser_download_url", "")
expected = f"https://github.com/openai/codex/releases/download/{tag}/{asset_name}"
if url != expected:
    raise SystemExit("release asset URL is not the canonical OpenAI URL")
digest = asset.get("digest", "")
if not re.fullmatch(r"sha256:[0-9a-f]{64}", digest):
    raise SystemExit("release asset is missing a valid SHA-256 digest")
print(tag.removeprefix("rust-v"), tag, url, digest.removeprefix("sha256:"))
PY
) || fail "latest release metadata failed validation"
[[ "$version" =~ ^[0-9]+.[0-9]+.[0-9]+([.-][A-Za-z0-9.]+)?$ ]] ||
  fail "invalid discovered version"
[[ "$sha256" =~ ^[0-9a-f]{64}$ ]] || fail "invalid discovered SHA-256"

current="$(verify_binary "$CODEX_DEST" 2>/dev/null || true)"
if [[ -n "$current" && "$FORCE_UPDATE" != 1 ]]; then
  if [[ "$current" = "$version" ]]; then
    printf 'codex_cli_version=%s installation=current check=latest
' "$current"
    exit 0
  fi
  newest="$(printf '%s
%s
' "$current" "$version" | sort -V | tail -n1)"
  if [[ "$newest" = "$current" ]]; then
    printf 'codex_cli_version=%s installation=current check=newer-than-latest
' "$current"
    exit 0
  fi
fi

archive="$CACHE_DIR/$tag-$ASSET_NAME"
if [[ -f "$archive" ]] && [[ "$(sha256sum "$archive" | awk '{print $1}')" != "$sha256" ]]; then
  rm -f "$archive"
fi
if [[ ! -f "$archive" ]]; then
  archive_tmp="$(mktemp "$CACHE_DIR/.codex-download.XXXXXX")"
  if ! curl -fL --retry 3 --retry-all-errors --connect-timeout 20     --output "$archive_tmp" "$asset_url"; then
    rm -f "$archive_tmp"
    fail "could not download Codex $version"
  fi
  printf '%s  %s
' "$sha256" "$archive_tmp" | sha256sum -c - >/dev/null || {
    rm -f "$archive_tmp"
    fail "downloaded Codex archive failed SHA-256 verification"
  }
  chmod 0644 "$archive_tmp"
  mv -f "$archive_tmp" "$archive"
fi
printf '%s  %s
' "$sha256" "$archive" | sha256sum -c - >/dev/null ||
  fail "cached Codex archive failed SHA-256 verification"

extract_dir="$(mktemp -d /tmp/unraid-codex-install.XXXXXX)"
dest_tmp="$(dirname "$CODEX_DEST")/.codex.new.$$"
cleanup_install() { rm -rf "$extract_dir" "$dest_tmp"; }
trap 'cleanup_install; cleanup_metadata' EXIT INT TERM

tar -xzf "$archive" -C "$extract_dir" -- "$BINARY_NAME"
[[ -f "$extract_dir/$BINARY_NAME" ]] || fail "Codex archive did not contain $BINARY_NAME"
install -o "$CODEX_USER" -g "$CODEX_GROUP" -m 0755   "$extract_dir/$BINARY_NAME" "$dest_tmp"
verify_binary "$dest_tmp" "$version" >/dev/null ||
  fail "candidate Codex CLI failed compatibility checks"

if [[ -x "$CODEX_DEST" ]]; then
  cp -af "$CODEX_DEST" "$CODEX_PREVIOUS"
  chown "$CODEX_USER:$CODEX_GROUP" "$CODEX_PREVIOUS"
  chmod 0755 "$CODEX_PREVIOUS"
fi
mv -f "$dest_tmp" "$CODEX_DEST"
if ! verify_binary "$CODEX_DEST" "$version" >/dev/null; then
  if [[ -x "$CODEX_PREVIOUS" ]]; then
    cp -af "$CODEX_PREVIOUS" "$CODEX_DEST"
    chown "$CODEX_USER:$CODEX_GROUP" "$CODEX_DEST"
    chmod 0755 "$CODEX_DEST"
  fi
  fail "installed Codex CLI failed post-install verification"
fi

printf 'version=%s
tag=%s
asset=%s
sha256=%s
checked_at=%s
'   "$version" "$tag" "$ASSET_NAME" "$sha256" "$(date -u +%FT%TZ)"   > "$STATE_DIR/last-release.env"
chmod 0644 "$STATE_DIR/last-release.env"
find "$CACHE_DIR" -maxdepth 1 -type f -name 'rust-v*-codex-*.tar.gz'   -printf '%T@ %p
' 2>/dev/null |
  sort -nr | awk 'NR>2 {sub(/^[^ ]+ /,""); print}' | xargs -r rm -f
printf 'codex_cli_version=%s installation=updated previous=%s
'   "$version" "${current:-none}"
