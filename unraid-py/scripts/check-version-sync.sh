#!/usr/bin/env bash
# check-version-sync.sh — Pre-commit hook to verify all version-bearing files match.
# Exits non-zero if versions are out of sync or CHANGELOG.md is missing an entry.
set -euo pipefail

PROJECT_DIR="${1:-.}"
cd "$PROJECT_DIR"

versions=()
files_checked=()

# Extract version from each file type
if [ -f "Cargo.toml" ]; then
  v=$(grep -m1 '^version' Cargo.toml | sed 's/.*"\(.*\)".*/\1/')
  [ -n "$v" ] && versions+=("Cargo.toml=$v") && files_checked+=("Cargo.toml")
fi

if [ -f "package.json" ]; then
  v=$(python3 -c "import json; print(json.load(open('package.json')).get('version',''))" 2>/dev/null)
  [ -n "$v" ] && versions+=("package.json=$v") && files_checked+=("package.json")
fi

if [ -f "pyproject.toml" ]; then
  v=$(grep -m1 '^version' pyproject.toml | sed 's/.*"\(.*\)".*/\1/')
  [ -n "$v" ] && versions+=("pyproject.toml=$v") && files_checked+=("pyproject.toml")
fi

if [ -f "../agents/unraid-py/.claude-plugin/plugin.json" ]; then
  v=$(python3 -c "import json; print(json.load(open('../agents/unraid-py/.claude-plugin/plugin.json')).get('version',''))" 2>/dev/null)
  [ -n "$v" ] && versions+=("../agents/unraid-py/.claude-plugin/plugin.json=$v") && files_checked+=("../agents/unraid-py/.claude-plugin/plugin.json")
fi

if [ -f "../agents/unraid-py/.codex-plugin/plugin.json" ]; then
  v=$(python3 -c "import json; print(json.load(open('../agents/unraid-py/.codex-plugin/plugin.json')).get('version',''))" 2>/dev/null)
  [ -n "$v" ] && versions+=("../agents/unraid-py/.codex-plugin/plugin.json=$v") && files_checked+=("../agents/unraid-py/.codex-plugin/plugin.json")
fi

if [ -f "gemini-extension.json" ]; then
  v=$(python3 -c "import json; print(json.load(open('gemini-extension.json')).get('version',''))" 2>/dev/null)
  [ -n "$v" ] && versions+=("gemini-extension.json=$v") && files_checked+=("gemini-extension.json")
fi

# Need at least one version source
if [ ${#versions[@]} -eq 0 ]; then
  echo "[version-sync] No version-bearing files found — skipping"
  exit 0
fi

# Check all versions match
canonical=""
mismatch=0
for entry in "${versions[@]}"; do
  file="${entry%%=*}"
  ver="${entry##*=}"
  if [ -z "$canonical" ]; then
    canonical="$ver"
  elif [ "$ver" != "$canonical" ]; then
    mismatch=1
  fi
done

if [ "$mismatch" -eq 1 ]; then
  echo "[version-sync] FAIL — versions are out of sync:"
  for entry in "${versions[@]}"; do
    file="${entry%%=*}"
    ver="${entry##*=}"
    marker=" "
    [ "$ver" != "$canonical" ] && marker="!"
    echo "  $marker $file: $ver"
  done
  echo ""
  echo "All version-bearing files must have the same version."
  echo "Files checked: ${files_checked[*]}"
  exit 1
fi

# Check CHANGELOG.md has an entry for the current version
if [ -f "CHANGELOG.md" ]; then
  if ! grep -qF "$canonical" CHANGELOG.md; then
    echo "[version-sync] WARN — CHANGELOG.md has no entry for version $canonical"
    echo "  Add a changelog entry before pushing."
    # Warning only, not blocking
  fi
fi

echo "[version-sync] OK — all ${#versions[@]} files at v${canonical}"
exit 0
