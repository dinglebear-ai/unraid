#!/usr/bin/env bash
# bump-version.sh — update version in all version-bearing files atomically.
#
# Usage:
#   ./scripts/bump-version.sh 1.3.5
#   ./scripts/bump-version.sh patch   # auto-increment patch
#   ./scripts/bump-version.sh minor   # auto-increment minor
#   ./scripts/bump-version.sh major   # auto-increment major

set -euo pipefail

REPO_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"

VERSION_FILES=(
    "${REPO_ROOT}/Cargo.toml"
    "${REPO_ROOT}/pyproject.toml"
    "${REPO_ROOT}/.claude-plugin/plugin.json"
    "${REPO_ROOT}/.codex-plugin/plugin.json"
    "${REPO_ROOT}/.gemini-extension.json"
)

# Resolve gemini path (handles both naming conventions)
if [ -f "${REPO_ROOT}/gemini-extension.json" ]; then
    VERSION_FILES[3]="${REPO_ROOT}/gemini-extension.json"
fi

current_version() {
    grep -m1 '"version"' "${REPO_ROOT}/.claude-plugin/plugin.json" \
        | sed 's/.*"version": "\(.*\)".*/\1/'
}

bump() {
    local version="$1" part="$2"
    local major minor patch
    IFS='.' read -r major minor patch <<< "$version"
    case "$part" in
        major) echo "$((major + 1)).0.0" ;;
        minor) echo "${major}.$((minor + 1)).0" ;;
        patch) echo "${major}.${minor}.$((patch + 1))" ;;
    esac
}

# Resolve new version
ARG="${1:-}"
CURRENT="$(current_version)"

case "$ARG" in
    major|minor|patch) NEW="$(bump "$CURRENT" "$ARG")" ;;
    "") echo "Usage: $0 <version|major|minor|patch>"; exit 1 ;;
    *) NEW="$ARG" ;;
esac

echo "Bumping $CURRENT → $NEW"

for file in "${VERSION_FILES[@]}"; do
    [ -f "$file" ] || { echo "  skip (not found): $file"; continue; }
    sed -i "s/\"version\": \"${CURRENT}\"/\"version\": \"${NEW}\"/" "$file"
    sed -i "s/^version = \"${CURRENT}\"/version = \"${NEW}\"/" "$file"
    echo "  updated: ${file#"${REPO_ROOT}/"}"
done

echo "Done. Don't forget to add a CHANGELOG.md entry for ${NEW}."
