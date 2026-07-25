#!/usr/bin/env bash
# refresh-docs.sh — Refresh local reference documentation for unraid-rmcp
#
# Crawls the Unraid API/docs sites and packs relevant GitHub repos
# into docs/references/ for use as AI context during development.
#
# Pattern: adapted from agentcast/scripts/refresh-docs.sh
# Docs: see docs/PATTERNS.md §38
#
# Usage:
#   scripts/refresh-docs.sh [--dry-run] [--skip-crawl] [--skip-repomix]
#
# Exit codes:
#   0 — success
#   1 — prerequisite or runtime error
#   2 — bad arguments
set -Eeuo pipefail
IFS=$'\n\t'

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
ROOT_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd -P)"
REF_DIR="$ROOT_DIR/docs/references"
CHANGES_FILE="$REF_DIR/CHANGES.md"
AXON_OUTPUT_DIR="${AXON_OUTPUT_DIR:-$HOME/.axon/output}"

DRY_RUN=false
SKIP_CRAWL=false
SKIP_REPOMIX=false

usage() { cat <<'EOF'
Usage: scripts/refresh-docs.sh [OPTIONS]

Refresh docs/references/ with latest Unraid API docs and related repo packs.

  Crawled sites:
    https://docs.unraid.net          — Unraid official documentation
    https://unraid.net/blog          — Unraid release notes / API changes

  Repomix packs:
    jmagar/unraid-api                — GraphQL schema + TypeScript API source
    modelcontextprotocol/rust-sdk    — rmcp (Rust MCP SDK)
    modelcontextprotocol/registry    — MCP registry spec + server.json schema

Options:
  --dry-run        Print plan without writing.
  --skip-crawl     Skip Axon crawls; update Repomix packs only.
  --skip-repomix   Skip Repomix packs; run Axon crawls only.
  -h, --help       Show this help.

Environment:
  AXON_OUTPUT_DIR  Axon host output dir. Default: ~/.axon/output
  REPOMIX_BIN      Repomix executable. Default: repomix or npx --yes repomix
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)     DRY_RUN=true;      shift ;;
    --skip-crawl)  SKIP_CRAWL=true;   shift ;;
    --skip-repomix) SKIP_REPOMIX=true; shift ;;
    -h|--help)     usage; exit 0 ;;
    *) echo "ERROR: unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
done

[[ "$SKIP_CRAWL" == true && "$SKIP_REPOMIX" == true ]] && {
  echo "ERROR: --skip-crawl and --skip-repomix cannot both be set" >&2; exit 2
}

log() { printf '[refresh-docs] %s\n' "$*"; }

refresh_scope() {
  if   [[ "$SKIP_CRAWL"    == true ]]; then printf 'repomix-only'
  elif [[ "$SKIP_REPOMIX"  == true ]]; then printf 'crawl-only'
  else printf 'full'; fi
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || { echo "ERROR: required command not found: $1" >&2; exit 1; }
}

make_tmpdir() { mktemp -d "${TMPDIR:-/tmp}/unraid-refresh-docs.XXXXXX"; }

atomic_replace_dir() {
  local src="$1" dst="$2" parent backup
  parent="$(dirname -- "$dst")"; mkdir -p "$parent"
  backup="$(mktemp -d "$parent/.$(basename "$dst").backup.XXXXXX")"; rmdir "$backup"
  [[ -e "$dst" ]] && mv -- "$dst" "$backup"
  if mv -- "$src" "$dst"; then rm -rf -- "$backup"
  else [[ -e "$backup" ]] && mv -- "$backup" "$dst"; return 1; fi
}

copy_job_output_to_layout() {
  local source_dir="$1" target_dir="$2" tmp_target
  [[ -f "$source_dir/manifest.jsonl" ]] || { echo "ERROR: missing Axon manifest: $source_dir/manifest.jsonl" >&2; return 1; }
  [[ -d "$source_dir/markdown" ]]       || { echo "ERROR: missing Axon markdown dir: $source_dir/markdown" >&2; return 1; }
  tmp_target="$(make_tmpdir)"
  cp -a "$source_dir/." "$tmp_target/"
  atomic_replace_dir "$tmp_target" "$target_dir"
}

newest_domain_run() {
  local domain_dir="$AXON_OUTPUT_DIR/domains/$1"
  [[ -d "$domain_dir" ]] || return 1
  find "$domain_dir" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' \
    | sort -nr | awk 'NR==1{$1=""; sub(/^ /,""); print}'
}

crawl_docs() {
  local url="$1" domain="$2" target_rel="$3"
  local target_dir="$REF_DIR/$target_rel" output job_id source_dir
  log "crawl $url -> docs/references/$target_rel"
  [[ "$DRY_RUN" == true ]] && return 0
  require_cmd axon
  output="$(axon crawl "$url" --wait true --yes 2>&1)"; printf '%s\n' "$output"
  job_id="$(awk '/^Job ID:/{print $3}' <<<"$output" | tail -1)"
  if [[ -n "$job_id" && -d "$AXON_OUTPUT_DIR/domains/$domain/$job_id" ]]; then
    source_dir="$AXON_OUTPUT_DIR/domains/$domain/$job_id"
  else
    source_dir="$(newest_domain_run "$domain")"
  fi
  [[ -n "$source_dir" && -d "$source_dir" ]] || { echo "ERROR: could not locate Axon output for $domain" >&2; return 1; }
  copy_job_output_to_layout "$source_dir" "$target_dir"
}

repomix_command() {
  if   [[ -n "${REPOMIX_BIN:-}" ]]; then "$REPOMIX_BIN" "$@"
  elif command -v repomix >/dev/null 2>&1; then repomix "$@"
  else require_cmd npx; npx --yes repomix "$@"; fi
}

pack_repo() {
  local remote="$1" target_rel="$2" include_patterns="${3:-}" ignore_patterns="${4:-}"
  local target_file="$REF_DIR/$target_rel" tmp_dir tmp_file
  log "pack $remote -> docs/references/$target_rel"
  [[ -n "$include_patterns" ]] && log "  include: $include_patterns"
  [[ -n "$ignore_patterns"  ]] && log "  ignore:  $ignore_patterns"
  [[ "$DRY_RUN" == true ]] && return 0
  tmp_dir="$(make_tmpdir)"; tmp_file="$tmp_dir/repomix-output.xml"
  local args=(--remote "$remote" --style xml --output "$tmp_file" --top-files-len 10)
  [[ -n "$include_patterns" ]] && args+=(--include "$include_patterns")
  [[ -n "$ignore_patterns"  ]] && args+=(--ignore  "$ignore_patterns")
  repomix_command "${args[@]}"
  [[ -s "$tmp_file" ]] || { echo "ERROR: Repomix produced no output for $remote" >&2; rm -rf -- "$tmp_dir"; return 1; }
  mkdir -p "$(dirname -- "$target_file")"
  mv -- "$tmp_file" "$target_file"
  rm -rf -- "$tmp_dir"
}

write_index() {
  local unraid_docs=0 mcp_docs=0
  [[ -d "$REF_DIR/unraid/docs" ]] && unraid_docs="$(find "$REF_DIR/unraid/docs" -type f | wc -l | tr -d ' ')"
  [[ -d "$REF_DIR/mcp/docs"   ]] && mcp_docs="$(find "$REF_DIR/mcp/docs"   -type f | wc -l | tr -d ' ')"

  cat > "$REF_DIR/INDEX.md" <<EOF
# Reference Index — unraid-rmcp

| Path | Contents | Source |
| --- | --- | --- |
| \`unraid/docs/\`        | Axon-crawled Unraid documentation     | \`https://docs.unraid.net\` |
| \`unraid/repos/\`       | Repomix XML pack for unraid-api repo  | \`jmagar/unraid-api\` |
| \`mcp/docs/\`           | Axon-crawled MCP protocol docs        | \`https://modelcontextprotocol.io\` |
| \`mcp/repos/\`          | Repomix XML packs for MCP SDK + registry | \`modelcontextprotocol/*\` |

## Crawled Doc File Counts

| Path | Files |
| --- | ---: |
| \`unraid/docs/\` | $unraid_docs |
| \`mcp/docs/\`    | $mcp_docs |

_Updated: $(date -u +%Y-%m-%dT%H:%M:%SZ)_
EOF
}

snapshot_references() {
  local output_file="$1"
  [[ ! -d "$REF_DIR" ]] && { : > "$output_file"; return 0; }
  (cd "$REF_DIR"; find . -type f ! -path './CHANGES.md' -print0 | sort -z | xargs -0 -r sha256sum | sed 's#  \./#  #') > "$output_file"
}
snapshot_paths() { awk '{$1=""; sub(/^  /,""); print}' "$1"; }

ensure_changes_file() {
  mkdir -p "$REF_DIR"
  [[ -f "$CHANGES_FILE" ]] && return 0
  cat > "$CHANGES_FILE" <<EOF
---
title: Reference Refresh Change Log — unraid-rmcp
generated_by: scripts/refresh-docs.sh
created_at: $(date -u +%Y-%m-%dT%H:%M:%SZ)
---
EOF
}

append_changes_log() {
  ensure_changes_file
  local ts; ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  {
    printf '\n## %s\n\n' "$ts"
    printf -- '- scope: `%s`\n' "$(refresh_scope)"
    printf -- '- summary: `%s added, %s modified, %s removed`\n' "$4" "$5" "$6"
  } >> "$CHANGES_FILE"
}

summarize_reference_changes() {
  local before="$1" after="$2" tmp_dir; tmp_dir="$(make_tmpdir)"
  local bp="$tmp_dir/b.paths" ap="$tmp_dir/a.paths"
  local added="$tmp_dir/added" removed="$tmp_dir/removed" common="$tmp_dir/common" modified="$tmp_dir/modified"
  snapshot_paths "$before" | sort > "$bp"; snapshot_paths "$after" | sort > "$ap"
  comm -13 "$bp" "$ap" > "$added"; comm -23 "$bp" "$ap" > "$removed"; comm -12 "$bp" "$ap" > "$common"
  : > "$modified"
  while IFS= read -r p; do
    [[ "$(grep -F "  $p" "$before" | cut -d' ' -f1)" != "$(grep -F "  $p" "$after" | cut -d' ' -f1)" ]] && printf '%s\n' "$p" >> "$modified"
  done < "$common"
  local ac rc mc; ac="$(wc -l < "$added" | tr -d ' ')"; rc="$(wc -l < "$removed" | tr -d ' ')"; mc="$(wc -l < "$modified" | tr -d ' ')"
  log "change summary: $ac added, $mc modified, $rc removed"
  append_changes_log "$added" "$modified" "$removed" "$ac" "$mc" "$rc"
  rm -rf -- "$tmp_dir"
}

main() {
  local snapshot_dir before_snapshot after_snapshot
  if [[ "$DRY_RUN" != true ]]; then
    snapshot_dir="$(make_tmpdir)"
    before_snapshot="$snapshot_dir/before.sha256"
    after_snapshot="$snapshot_dir/after.sha256"
    snapshot_references "$before_snapshot"
  fi

  mkdir -p \
    "$REF_DIR/unraid/docs" "$REF_DIR/unraid/repos" \
    "$REF_DIR/mcp/docs"   "$REF_DIR/mcp/repos"

  if [[ "$SKIP_CRAWL" != true ]]; then
    crawl_docs "https://docs.unraid.net" || log "WARN: unraid docs crawl failed, continuing"       "docs.unraid.net"         "unraid/docs"
    crawl_docs "https://modelcontextprotocol.io" "modelcontextprotocol.io" "mcp/docs" || log "WARN: mcp docs crawl failed, continuing"
  fi

  if [[ "$SKIP_REPOMIX" != true ]]; then
    # Unraid API source — GraphQL schema + TypeScript resolvers
    pack_repo "unraid/api" "unraid/repos/unraid-api.xml" \
      "api/**,packages/**,src/**" "node_modules/**,*.lock"

    # MCP Rust SDK (rmcp crate used by this server)
    pack_repo "modelcontextprotocol/rust-sdk"  "mcp/repos/modelcontextprotocol-rust-sdk.xml"

    # MCP registry spec + server.json schema (for server.json authoring)
    pack_repo "modelcontextprotocol/registry"  "mcp/repos/modelcontextprotocol-registry.xml"
  fi

  if [[ "$DRY_RUN" != true ]]; then
    write_index
    snapshot_references "$after_snapshot"
    summarize_reference_changes "$before_snapshot" "$after_snapshot"
    rm -rf -- "$snapshot_dir"
  fi

  log "done"
}

main "$@"
