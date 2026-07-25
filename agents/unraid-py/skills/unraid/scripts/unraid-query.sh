#!/bin/bash
# Unraid GraphQL API Query Helper
# Makes it easy to query the Unraid API from the command line.
#
# Credentials default to UNRAID_API_URL / UNRAID_API_KEY, loaded from
# ~/.unraid-mcp/.env via the co-located load-env.sh (which parses the file) when
# not already in the environment. Override per-call with -u/-k.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
_LOAD_ENV="$SCRIPT_DIR/../load-env.sh"
# shellcheck source=/dev/null
[[ -f "$_LOAD_ENV" ]] && source "$_LOAD_ENV"

# Usage function
usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Query the Unraid GraphQL API

OPTIONS:
    -u, --url URL          Unraid server URL (required)
    -k, --key KEY          API key (required)
    -q, --query QUERY      GraphQL query (required)
    -f, --format FORMAT    Output format: json (default), raw, pretty
    --ignore-errors        Continue if GraphQL returns data alongside errors
    --insecure             Disable TLS certificate verification
    -h, --help             Show this help message

ENVIRONMENT VARIABLES:
    UNRAID_API_URL         Default Unraid GraphQL URL (from ~/.unraid-mcp/.env)
    UNRAID_API_KEY         Default API key (from ~/.unraid-mcp/.env)
    UNRAID_URL             Legacy alias for UNRAID_API_URL

EXAMPLES:
    # Use credentials from ~/.unraid-mcp/.env (loaded automatically)
    $0 -q "{ online }"

    # Override credentials per-call
    $0 -u https://unraid.local/graphql -k YOUR_KEY -q "{ online }"

    # Pretty print output
    $0 -q "{ array { state } }" -f pretty

EOF
    exit 1
}

# Default values — prefer canonical UNRAID_API_URL, accept legacy UNRAID_URL.
URL="${UNRAID_API_URL:-${UNRAID_URL:-}}"
API_KEY="${UNRAID_API_KEY:-}"
QUERY=""
FORMAT="json"
IGNORE_ERRORS="${IGNORE_ERRORS:-false}"
INSECURE="false"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -u|--url)
            URL="$2"
            shift 2
            ;;
        -k|--key)
            API_KEY="$2"
            shift 2
            ;;
        -q|--query)
            QUERY="$2"
            shift 2
            ;;
        -f|--format)
            FORMAT="$2"
            shift 2
            ;;
        --ignore-errors)
            IGNORE_ERRORS="true"
            shift
            ;;
        --insecure)
            INSECURE="true"
            shift
            ;;
        -h|--help)
            usage
            ;;
        *)
            echo "Unknown option: $1"
            usage
            ;;
    esac
done

# If credentials weren't supplied via flags or environment, load them from
# ~/.unraid-mcp/.env (load_env_file is provided by load-env.sh). Capture its
# diagnostics so we can surface the specific reason if creds are still missing.
LOAD_ERR=""
if [[ -z "$URL" || -z "$API_KEY" ]] && declare -f load_env_file >/dev/null; then
    LOAD_ERR="$(load_env_file 2>&1)" || true
    URL="${URL:-${UNRAID_API_URL:-${UNRAID_URL:-}}}"
    API_KEY="${API_KEY:-${UNRAID_API_KEY:-}}"
fi

# Validate required arguments
if [[ -z "$URL" || -z "$API_KEY" ]]; then
    [[ -n "$LOAD_ERR" ]] && echo "$LOAD_ERR" >&2
    [[ -z "$URL" ]] && echo "Error: Unraid URL is required (use -u, set UNRAID_API_URL, or configure ~/.unraid-mcp/.env)" >&2
    [[ -z "$API_KEY" ]] && echo "Error: API key is required (use -k, set UNRAID_API_KEY, or configure ~/.unraid-mcp/.env)" >&2
    exit 1
fi

if [[ -z "$QUERY" ]]; then
    echo "Error: GraphQL query is required (use -q)"
    exit 1
fi

# Build JSON payload with proper escaping
PAYLOAD=$(jq -n --arg q "$QUERY" '{"query": $q}')

# Build curl flags
CURL_FLAGS=("-sL" "-X" "POST")
[[ "$INSECURE" == "true" ]] && CURL_FLAGS+=("-k")

# Make the request
RESPONSE=$(curl "${CURL_FLAGS[@]}" "$URL" \
    -H "Content-Type: application/json" \
    -H "x-api-key: $API_KEY" \
    -d "$PAYLOAD") || {
    echo "Error: curl request failed (exit code $?). Check URL and network connectivity." >&2
    exit 1
}

if [[ -z "$RESPONSE" ]]; then
    echo "Error: Empty response from server." >&2
    exit 1
fi

if ! echo "$RESPONSE" | jq -e . > /dev/null 2>&1; then
    echo "Error: Server returned invalid JSON. Response:" >&2
    echo "$RESPONSE" | head -c 500 >&2
    exit 1
fi

# Check for errors
if echo "$RESPONSE" | jq -e '.errors' > /dev/null 2>&1; then
    # If we have data despite errors and --ignore-errors was passed, continue
    if [[ "$IGNORE_ERRORS" == "true" ]] && echo "$RESPONSE" | jq -e '.data' > /dev/null 2>&1; then
        echo "GraphQL Warning:" >&2
        echo "$RESPONSE" | jq -r '.errors[0].message' >&2
    else
        echo "GraphQL Error:" >&2
        echo "$RESPONSE" | jq -r '.errors[0].message' >&2
        exit 1
    fi
fi

# Output based on format
case "$FORMAT" in
    json)
        echo "$RESPONSE"
        ;;
    raw)
        echo "$RESPONSE" | jq -r '.data'
        ;;
    pretty)
        echo "$RESPONSE" | jq '.'
        ;;
    *)
        echo "Unknown format: $FORMAT" >&2
        exit 1
        ;;
esac
