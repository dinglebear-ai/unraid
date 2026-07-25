#!/usr/bin/env bash
# Validate Claude Code marketplace and plugin structure

set -uo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Counters
CHECKS=0
PASSED=0
FAILED=0

check() {
    local test_name="$1"
    local test_cmd="$2"

    CHECKS=$((CHECKS + 1))
    echo -n "Checking: $test_name... "

    if eval "$test_cmd" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}✗${NC}"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

echo "=== Validating Claude Code Marketplace Structure ==="
echo ""

# Resolve paths from this script's own location so it works regardless of cwd.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PKG_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"   # unraid-py/ (holds pyproject.toml)
REPO_ROOT="$(cd "$PKG_ROOT/.." && pwd)"    # monorepo root (holds .claude-plugin/, agents/)
cd "$REPO_ROOT"

# Marketplace manifest lives at the monorepo root; the Python agent plugin lives under agents/unraid-py/.
MARKETPLACE=".claude-plugin/marketplace.json"
PLUGIN_DIR="agents/unraid-py"
PLUGIN_JSON="$PLUGIN_DIR/.claude-plugin/plugin.json"
SKILLS_DIR="$PLUGIN_DIR/skills/unraid"

# Check marketplace manifest
check "Marketplace manifest exists" "test -f $MARKETPLACE"
check "Marketplace manifest is valid JSON" "jq empty $MARKETPLACE"
check "Marketplace has name" "jq -e '.name' $MARKETPLACE"
check "Marketplace has plugins array" "jq -e '.plugins | type == \"array\"' $MARKETPLACE"

# Check plugin manifest
check "Plugin manifest exists" "test -f $PLUGIN_JSON"
check "Plugin manifest is valid JSON" "jq empty $PLUGIN_JSON"
check "Plugin has name" "jq -e '.name' $PLUGIN_JSON"
check "Plugin has version" "jq -e '.version' $PLUGIN_JSON"

# Check plugin structure
check "Plugin has SKILL.md" "test -f $SKILLS_DIR/SKILL.md"
check "Plugin has README.md" "test -f $SKILLS_DIR/README.md"
check "Plugin has scripts directory" "test -d $SKILLS_DIR/scripts"
check "Plugin has examples directory" "test -d $SKILLS_DIR/examples"
check "Plugin has references directory" "test -d $SKILLS_DIR/references"

# Validate plugin is listed in marketplace
check "Plugin listed in marketplace" "jq -e '.plugins[] | select(.name == \"unraid-mcp\")' $MARKETPLACE"

# Check marketplace metadata
check "Marketplace has owner" "jq -e '.owner' $MARKETPLACE"

# Verify source path
PLUGIN_SOURCE=$(jq -r '.plugins[]? | select(.name == "unraid-mcp") | .source // empty' $MARKETPLACE 2>/dev/null || true)
if [ -n "$PLUGIN_SOURCE" ]; then
    check "Plugin source path is valid" "test -d \"$PLUGIN_SOURCE\""
else
    CHECKS=$((CHECKS + 1))
    FAILED=$((FAILED + 1))
    echo -e "Checking: Plugin source path is valid... ${RED}✗${NC} (plugin not found in marketplace)"
fi

# Check version sync between pyproject.toml and plugin.json
echo "Checking version sync..."
TOML_VER=$(grep -m1 "^version = " "$PKG_ROOT/pyproject.toml" | sed 's/version = "//;s/"//')
PLUGIN_VER=$(python3 -c "import json; print(json.load(open('$PLUGIN_JSON'))['version'])" 2>/dev/null || echo "ERROR_READING")
if [ "$TOML_VER" != "$PLUGIN_VER" ]; then
    echo -e "${RED}FAIL: Version mismatch — pyproject.toml=$TOML_VER, plugin.json=$PLUGIN_VER${NC}"
    CHECKS=$((CHECKS + 1))
    FAILED=$((FAILED + 1))
else
    echo -e "${GREEN}PASS: Versions in sync ($TOML_VER)${NC}"
    CHECKS=$((CHECKS + 1))
    PASSED=$((PASSED + 1))
fi

echo ""
echo "=== Results ==="
echo -e "Total checks: $CHECKS"
echo -e "${GREEN}Passed: $PASSED${NC}"
if [ $FAILED -gt 0 ]; then
    echo -e "${RED}Failed: $FAILED${NC}"
    exit 1
else
    echo -e "${GREEN}All checks passed!${NC}"
    echo ""
    echo "Marketplace is ready for distribution at:"
    echo "  $(jq -r '.plugins[0].repository // .plugins[0].homepage // "n/a"' "$MARKETPLACE")"
fi
