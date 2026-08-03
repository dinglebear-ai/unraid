#!/bin/bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
input="$root/runtime-requirements.in"
output="$root/runtime-requirements.txt"
command="./scripts/update-runtime-lock.sh"

command -v uv >/dev/null || { echo "uv is required to update the runtime lock" >&2; exit 1; }
[[ -s "$input" ]] || { echo "missing runtime input: $input" >&2; exit 1; }

uv pip compile "$input"   --generate-hashes   --no-emit-package unraid-mcp   --python-version 3.12   --python-platform x86_64-unknown-linux-gnu   --custom-compile-command "$command"   --output-file "$output"

echo "updated $output"
