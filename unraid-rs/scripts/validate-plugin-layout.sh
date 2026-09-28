#!/usr/bin/env bash
# Validate plugin manifests, MCP config, and skills for this repo.
#
# Claude Code hooks were removed from the agent plugins (2026-07-27). There is no
# `hooks/hooks.json` to validate any more; credential setup is manual via
# `runraid setup plugin-hook`. Do not re-add a hooks assertion here.
set -euo pipefail

plugin_root="${PLUGIN_ROOT:-}"
if [[ -z "${plugin_root}" ]]; then
    # The agent plugin moved out of this crate to agents/unraid-rs/ during the
  # monorepo consolidation. The old default globbed a `plugins/` directory that no
  # longer exists here, so under `set -e` this script aborted instead of running.
  plugin_root="../agents/unraid-rs"
fi

[[ -n "${plugin_root}" ]] || { echo "MISSING: plugin root"; exit 1; }
[[ -d "${plugin_root}" ]] || { echo "MISSING: ${plugin_root} (set PLUGIN_ROOT to override)"; exit 1; }
command -v jq >/dev/null 2>&1 || { echo "MISSING: jq"; exit 1; }

claude_manifest="${plugin_root}/.claude-plugin/plugin.json"
codex_manifest="${plugin_root}/.codex-plugin/plugin.json"
mcp_json="${plugin_root}/.mcp.json"
skills_dir="${plugin_root}/skills"

for file in "${claude_manifest}" "${codex_manifest}" "${mcp_json}"; do
  [[ -f "${file}" ]] || { echo "MISSING: ${file}"; exit 1; }
  jq empty "${file}"
done

# The standalone runraid repo forbade a `version` here. The monorepo inverts that:
# agents/unraid-py's manifests carry a release-please-managed version, and the
# runraid plugin now does too (release-please-config.json bumps both under the
# unraid-rs package). An unversioned marketplace plugin gives users no upgrade
# signal, so require it AND require it to match the crate.
crate_version="$(grep -m1 '^version' Cargo.toml | sed 's/.*"\(.*\)".*/\1/')"
[[ -n "${crate_version}" ]] || { echo "MISSING: version in Cargo.toml"; exit 1; }
for file in "${claude_manifest}" "${codex_manifest}"; do
  manifest_version="$(jq -er '.version // empty' "${file}")" || true
  [[ -n "${manifest_version}" ]] || {
    echo "MISSING: ${file} has no version (release-please manages it — see release-please-config.json)"
    exit 1
  }
  [[ "${manifest_version}" == "${crate_version}" ]] || {
    echo "MISMATCH: ${file} version ${manifest_version} != Cargo.toml ${crate_version}"
    exit 1
  }
done

jq -er '.mcpServers | type == "object" and length > 0' "${mcp_json}" >/dev/null
jq -er '.mcpServers.unraid.command == "npx" and .mcpServers.unraid.args == ["-y", "@dinglebear/unraid", "mcp"]' "${mcp_json}" >/dev/null

# Neither manifest may declare a `hooks` key — Claude Code hooks are retired here.
for file in "${claude_manifest}" "${codex_manifest}"; do
  jq -er 'has("hooks") | not' "${file}" >/dev/null || {
    echo "UNEXPECTED: ${file} declares a \"hooks\" key (Claude Code hooks are retired)"
    exit 1
  }
done

[[ -d "${skills_dir}" ]] || { echo "MISSING: ${skills_dir}"; exit 1; }
skill_count=0
while IFS= read -r skill_file; do
  skill_count=$((skill_count + 1))
  grep -q '^name:' "${skill_file}" || { echo "MISSING name: ${skill_file}"; exit 1; }
  grep -q '^description:' "${skill_file}" || { echo "MISSING description: ${skill_file}"; exit 1; }
done < <(find "${skills_dir}" -mindepth 2 -maxdepth 2 -name SKILL.md | sort)
(( skill_count > 0 )) || { echo "MISSING: ${skills_dir}/*/SKILL.md"; exit 1; }

echo "OK"
