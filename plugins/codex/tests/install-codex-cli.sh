#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
INSTALLER="$ROOT/source/usr/local/emhttp/plugins/unraid-codex/container/install-codex-cli.sh"
VERIFIER="$ROOT/source/usr/local/emhttp/plugins/unraid-codex/scripts/verify-codex-cli.sh"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
bin="$tmp/bin"; mkdir -p "$bin" "$tmp/payload" "$tmp/home" "$tmp/cache" "$tmp/state"
user="$(id -un)"; group="$(id -gn)"
make_archive(){
  local version="$1" compatible="$2" name="codex-x86_64-unknown-linux-musl"
  cat >"$tmp/payload/$name" <<EOF
#!/bin/bash
set -euo pipefail
case "\${1:-}" in
  --version) echo 'codex-cli $version' ;;
  --strict-config) [[ "\${2:-}" = --version ]] && echo 'codex-cli $version' ;;
  app-server) [[ "\${2:-}" = --help && "$compatible" = 1 ]] ;;
  exec) [[ "\${2:-}" = --help ]] ;;
  *) exit 2 ;;
esac
EOF
  chmod 0755 "$tmp/payload/$name"
  tar -czf "$tmp/codex-$version.tar.gz" -C "$tmp/payload" "$name"
}
make_metadata(){
  local version="$1" archive="$2" url_version="${3:-$1}"
  local sha; sha="$(sha256sum "$archive" | awk '{print $1}')"
  cat >"$tmp/release.json" <<EOF
{"tag_name":"rust-v$version","assets":[{"name":"codex-x86_64-unknown-linux-musl.tar.gz","browser_download_url":"https://github.com/openai/codex/releases/download/rust-v$url_version/codex-x86_64-unknown-linux-musl.tar.gz","digest":"sha256:$sha"}]}
EOF
}
make_archive 9.9.9 1
make_metadata 9.9.9 "$tmp/codex-9.9.9.tar.gz"
cat >"$bin/curl" <<'EOF'
#!/bin/bash
set -euo pipefail
out=""; url=""
while (($#)); do
  case "$1" in
    -o|--output) out="$2"; shift 2 ;;
    http*) url="$1"; shift ;;
    *) shift ;;
  esac
done
[[ -n "$out" && -n "$url" ]]
if [[ "$url" == https://api.github.com/repos/openai/codex/releases/latest ]]; then
  [[ "${MOCK_API_FAIL:-0}" = 0 ]] || exit 22
  cp "$MOCK_METADATA" "$out"; echo api >>"$MOCK_LOG"
else
  cp "$MOCK_ARCHIVE" "$out"; echo asset >>"$MOCK_LOG"
fi
EOF
chmod 0755 "$bin/curl"
run_installer(){
  PATH="$bin:$PATH" MOCK_METADATA="$tmp/release.json" MOCK_ARCHIVE="$1" MOCK_LOG="$tmp/curl.log" \
    CODEX_USER="$user" CODEX_GROUP="$group" CODEX_HOME="$tmp/home" \
    CODEX_DEST="$tmp/home/.local/bin/codex" CODEX_PREVIOUS="$tmp/home/.local/bin/codex.previous" \
    CODEX_CACHE_DIR="$tmp/cache" CODEX_INSTALL_STATE_DIR="$tmp/state" "$INSTALLER"
}
first="$(run_installer "$tmp/codex-9.9.9.tar.gz")"
grep -Fq 'installation=updated' <<<"$first"
[[ "$("$tmp/home/.local/bin/codex" --version)" = 'codex-cli 9.9.9' ]]
CODEX_BIN="$tmp/home/.local/bin/codex" CODEX_HOME="$tmp/home" \
  "$VERIFIER" >/dev/null
[[ "$(grep -c '^asset$' "$tmp/curl.log")" -eq 1 ]]
second="$(run_installer "$tmp/codex-9.9.9.tar.gz")"
grep -Fq 'installation=current check=latest' <<<"$second"
[[ "$(grep -c '^asset$' "$tmp/curl.log")" -eq 1 ]]
offline="$(PATH="$bin:$PATH" MOCK_API_FAIL=1 MOCK_METADATA="$tmp/release.json" \
  MOCK_ARCHIVE="$tmp/codex-9.9.9.tar.gz" MOCK_LOG="$tmp/curl.log" \
  CODEX_USER="$user" CODEX_GROUP="$group" CODEX_HOME="$tmp/home" \
  CODEX_DEST="$tmp/home/.local/bin/codex" CODEX_PREVIOUS="$tmp/home/.local/bin/codex.previous" \
  CODEX_CACHE_DIR="$tmp/cache" CODEX_INSTALL_STATE_DIR="$tmp/state" "$INSTALLER")"
grep -Fq 'check=deferred' <<<"$offline"
make_archive 9.9.10 0
make_metadata 9.9.10 "$tmp/codex-9.9.10.tar.gz"
if run_installer "$tmp/codex-9.9.10.tar.gz" >/dev/null 2>&1; then echo 'incompatible candidate unexpectedly installed' >&2; exit 1; fi
[[ "$("$tmp/home/.local/bin/codex" --version)" = 'codex-cli 9.9.9' ]]
make_metadata 9.9.10 "$tmp/codex-9.9.10.tar.gz" 9.9.11
if run_installer "$tmp/codex-9.9.10.tar.gz" >/dev/null 2>&1; then echo 'non-canonical asset URL unexpectedly passed' >&2; exit 1; fi
echo 'Codex CLI latest-release updater tests passed'
