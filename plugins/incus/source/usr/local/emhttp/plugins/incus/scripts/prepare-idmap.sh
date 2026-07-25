#!/bin/bash
# Create root's subordinate ID ranges before incusd starts. Incus reads this
# system mapping once during daemon startup, so running this from incus-init.sh
# after the daemon is already ready is too late for that boot.
set -eu

SUBUID_FILE="${SUBUID_FILE:-/etc/subuid}"
SUBGID_FILE="${SUBGID_FILE:-/etc/subgid}"
ROOT_SUBID_RANGE="root:1000000:1000000000"

umask 022
for file in "$SUBUID_FILE" "$SUBGID_FILE"; do
  if [ ! -e "$file" ]; then
    : >"$file"
  fi
  if [ ! -f "$file" ]; then
    echo "subordinate ID path is not a regular file: $file" >&2
    exit 1
  fi
  grep -q '^root:' "$file" || printf '%s\n' "$ROOT_SUBID_RANGE" >>"$file"
done
