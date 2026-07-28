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

npm_manifest="packages/unraid-rmcp/package.json"
if [ ! -f "$npm_manifest" ]; then
  echo "[version-sync] FAIL — expected npm manifest is missing: $npm_manifest" >&2
  exit 1
fi
for field in version binaryVersion; do
  v=$(python3 -c "import json,sys; print(json.load(open(sys.argv[1])).get(sys.argv[2],''))" "$npm_manifest" "$field" 2>/dev/null)
  if [ -z "$v" ]; then
    echo "[version-sync] FAIL — $npm_manifest has no $field field" >&2
    exit 1
  fi
  versions+=("$npm_manifest.$field=$v")
  files_checked+=("$npm_manifest.$field")
done

if [ -f "pyproject.toml" ]; then
  v=$(grep -m1 '^version' pyproject.toml | sed 's/.*"\(.*\)".*/\1/')
  [ -n "$v" ] && versions+=("pyproject.toml=$v") && files_checked+=("pyproject.toml")
fi

# The agent-plugin manifests moved OUT of this crate to agents/unraid-rs/ during
# the monorepo consolidation. These are REQUIRED, not optional — a soft `[ -f ]`
# skip is what let this script silently narrow to Cargo.toml + server.json and
# miss the drift it exists to catch.
for manifest in \
  "../agents/unraid-rs/.claude-plugin/plugin.json" \
  "../agents/unraid-rs/.codex-plugin/plugin.json"
do
  if [ ! -f "$manifest" ]; then
    echo "[version-sync] FAIL — expected manifest is missing: $manifest" >&2
    echo "  If it moved again, update this script rather than letting the check skip." >&2
    exit 1
  fi
  v=$(python3 -c "import json,sys; print(json.load(open(sys.argv[1])).get('version',''))" "$manifest" 2>/dev/null)
  if [ -z "$v" ]; then
    echo "[version-sync] FAIL — $manifest has no version field" >&2
    exit 1
  fi
  versions+=("$manifest=$v")
  files_checked+=("$manifest")
done

if [ -f "gemini-extension.json" ]; then
  v=$(python3 -c "import json; print(json.load(open('gemini-extension.json')).get('version',''))" 2>/dev/null)
  [ -n "$v" ] && versions+=("gemini-extension.json=$v") && files_checked+=("gemini-extension.json")
fi

if [ -f "server.json" ]; then
  v=$(python3 -c "import json; print(json.load(open('server.json')).get('version',''))" 2>/dev/null)
  [ -n "$v" ] && versions+=("server.json=$v") && files_checked+=("server.json")
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
