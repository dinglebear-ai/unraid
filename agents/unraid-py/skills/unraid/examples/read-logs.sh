#!/bin/bash
# Read Unraid system logs
# Usage: ./read-logs.sh [log-name] [lines]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
QUERY_SCRIPT="$SCRIPT_DIR/../scripts/unraid-query.sh"

if [[ ! -x "$QUERY_SCRIPT" ]]; then
    echo "Error: Query script not found or not executable: $QUERY_SCRIPT" >&2
    exit 1
fi

LOG_NAME="${1:-syslog}"
LINES="${2:-20}"

# Validate inputs to prevent GraphQL injection and path traversal
# Only allow simple log names: alphanumeric, dots, hyphens, underscores (no slashes/path traversal)
if ! [[ "$LOG_NAME" =~ ^[a-zA-Z0-9_.-]+$ ]]; then
    echo "Error: Invalid log name. Only alphanumeric characters, dots, hyphens, and underscores are allowed." >&2
    exit 1
fi
if ! [[ "$LINES" =~ ^[0-9]+$ ]] || [[ "$LINES" -eq 0 ]] || [[ "$LINES" -gt 10000 ]]; then
    echo "Error: Lines must be an integer between 1 and 10000." >&2
    exit 1
fi

echo "=== Reading $LOG_NAME (last $LINES lines) ==="
echo ""

QUERY="{ logFile(path: \"$LOG_NAME\", lines: $LINES) { path totalLines startLine content } }"

RESPONSE=$("$QUERY_SCRIPT" -q "$QUERY" -f raw) || {
    echo "Error: Query failed." >&2
    exit 1
}

if [[ -z "$RESPONSE" ]] || ! echo "$RESPONSE" | jq -e . > /dev/null 2>&1; then
    echo "Error: Invalid or empty response from query." >&2
    exit 1
fi

echo "$RESPONSE" | jq -r '.logFile.content'

echo ""
echo "---"
echo "Total lines in log: $(echo "$RESPONSE" | jq -r '.logFile.totalLines')"
echo "Showing from line: $(echo "$RESPONSE" | jq -r '.logFile.startLine')"
