#!/bin/bash
# Complete Unraid Monitoring Dashboard (Multi-Server)
# Gets system status, disk health, and resource usage for all configured servers

set -euo pipefail

SCRIPT_DIR="$(cd -P "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/../load-env.sh"

QUERY_SCRIPT="$SCRIPT_DIR/unraid-query.sh"
# Output path is overridable; defaults to the current directory (no hardcoded personal path).
OUTPUT_FILE="${UNRAID_DASHBOARD_OUTPUT:-$PWD/unraid-inventory.md}"

# Load credentials. Single-server installs use ~/.unraid-mcp/.env (UNRAID_API_URL /
# UNRAID_API_KEY). Multi-server (fleet) installs additionally export UNRAID_<NAME>_URL /
# UNRAID_<NAME>_API_KEY pairs in that file, one per server.
load_env_file || exit 1

# Discover configured servers dynamically from UNRAID_<NAME>_URL env vars.
# Falls back to a single "default" server using UNRAID_API_URL / UNRAID_API_KEY.
SERVERS=()
while IFS='=' read -r var_name _; do
    # Discover fleet pairs UNRAID_<NAME>_URL, but exclude the canonical single-server
    # UNRAID_API_URL (whose "API" capture is not a fleet instance).
    if [[ "$var_name" =~ ^UNRAID_(.+)_URL$ && "${BASH_REMATCH[1]}" != "API" ]]; then
        SERVERS+=("${BASH_REMATCH[1]}")
    fi
done < <(env)

if [ ${#SERVERS[@]} -eq 0 ]; then
    # No multi-server pairs — fall back to the single default server.
    if [ -n "${UNRAID_API_URL:-}" ] && [ -n "${UNRAID_API_KEY:-}" ]; then
        UNRAID_DEFAULT_URL="$UNRAID_API_URL"
        UNRAID_DEFAULT_API_KEY="$UNRAID_API_KEY"
        UNRAID_DEFAULT_NAME="${UNRAID_DEFAULT_NAME:-unraid}"
        export UNRAID_DEFAULT_URL UNRAID_DEFAULT_API_KEY UNRAID_DEFAULT_NAME
        SERVERS=("DEFAULT")
    else
        echo "Error: No servers found. Configure ~/.unraid-mcp/.env (UNRAID_API_URL /" >&2
        echo "UNRAID_API_KEY), or set UNRAID_<NAME>_URL / UNRAID_<NAME>_API_KEY pairs for a fleet." >&2
        exit 1
    fi
fi

# Drop servers missing their API key (warn, don't abort the whole fleet).
VALID_SERVERS=()
for server in "${SERVERS[@]}"; do
    if validate_env_vars "UNRAID_${server}_URL" "UNRAID_${server}_API_KEY" 2>/dev/null; then
        VALID_SERVERS+=("$server")
    else
        echo "Skipping $server: missing UNRAID_${server}_URL or UNRAID_${server}_API_KEY" >&2
    fi
done
SERVERS=("${VALID_SERVERS[@]}")
if [ ${#SERVERS[@]} -eq 0 ]; then
    echo "Error: no fully-configured servers to query." >&2
    exit 1
fi

# Ensure output directory exists
mkdir -p "$(dirname "$OUTPUT_FILE")"

# Start the report
echo "# Unraid Fleet Dashboard" > "$OUTPUT_FILE"
echo "Generated at: $(date)" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Function to process a single server
process_server() {
    local NAME="$1"
    local URL="$2"
    local API_KEY="$3"

    echo "Querying server: $NAME..."
    
    # Set the canonical names so unraid-query.sh targets THIS server (a stale
    # UNRAID_API_URL from the initial load would otherwise win the fallback chain).
    UNRAID_API_URL="$URL"
    UNRAID_API_KEY="$API_KEY"
    IGNORE_ERRORS="true"
    export UNRAID_API_URL UNRAID_API_KEY IGNORE_ERRORS

    QUERY='query Dashboard {
      info {
        time
        cpu { model cores threads }
        os { platform distro release arch }
        system { manufacturer model version uuid }
      }
      metrics {
        cpu { percentTotal }
        memory { total used free percentTotal }
      }
      array {
        state
        capacity { kilobytes { total free used } }
        disks { name device temp status fsSize fsFree fsUsed isSpinning numErrors }
        caches { name device temp status fsSize fsFree fsUsed fsType type }
        parityCheckStatus { status progress errors }
      }
      disks { id name device size status temp numErrors }
      shares { name comment free }
      docker {
        containers { names image state status }
      }
      vms { domains { id name state } }
      vars { timeZone regTy regTo }
      notifications { id title subject description importance timestamp }
      recentLog: logFile(path: \"syslog\", lines: 50) { content }
      online
      isSSOEnabled
    }'

    # Don't let one server's failure abort the whole fleet (script runs under set -e).
    if ! RESPONSE=$("$QUERY_SCRIPT" -q "$QUERY" -f json 2>"/tmp/${NAME}_query.err"); then
        echo "Error querying $NAME (details in /tmp/${NAME}_query.err)"
        {
            echo "## Server: $NAME (⚠️ Error)"
            echo "Query failed:"
            echo '```'
            cat "/tmp/${NAME}_query.err"
            echo '```'
            echo ""
            echo "---"
            echo ""
        } >> "$OUTPUT_FILE"
        return 0
    fi

    # Debug output (only when DEBUG is set)
    if [ "${DEBUG:-}" = "true" ]; then
        echo "$RESPONSE" > "/tmp/${NAME}_debug.json"
    fi

    # Check if response is valid JSON
    if ! echo "$RESPONSE" | jq -e . >/dev/null 2>&1; then
        echo "Error querying $NAME: Invalid response"
        echo "$RESPONSE" > "/tmp/${NAME}_debug.json"
        echo "Response saved to /tmp/${NAME}_debug.json"
        echo "## Server: $NAME (⚠️ Error)" >> "$OUTPUT_FILE"
        echo "Failed to retrieve data." >> "$OUTPUT_FILE"
        return
    fi

    # Append to report
    echo "## Server: $NAME" >> "$OUTPUT_FILE"
    
    # System Info
    CPU_MODEL=$(echo "$RESPONSE" | jq -r '.data.info.cpu.model')
    CPU_CORES=$(echo "$RESPONSE" | jq -r '.data.info.cpu.cores')
    CPU_THREADS=$(echo "$RESPONSE" | jq -r '.data.info.cpu.threads')
    OS_REL=$(echo "$RESPONSE" | jq -r '.data.info.os.release')
    OS_ARCH=$(echo "$RESPONSE" | jq -r '.data.info.os.arch // "x64"')
    SYS_MFG=$(echo "$RESPONSE" | jq -r '.data.info.system.manufacturer // "Unknown"')
    SYS_MODEL=$(echo "$RESPONSE" | jq -r '.data.info.system.model // "Unknown"')
    TIMEZONE=$(echo "$RESPONSE" | jq -r '.data.vars.timeZone // "N/A"')
    LICENSE=$(echo "$RESPONSE" | jq -r '.data.vars.regTy // "Unknown"')
    REG_TO=$(echo "$RESPONSE" | jq -r '.data.vars.regTo // "N/A"')
    CPU_LOAD=$(echo "$RESPONSE" | jq -r '.data.metrics.cpu.percentTotal // 0')
    TOTAL_MEM=$(echo "$RESPONSE" | jq -r '.data.metrics.memory.total // 0')
    MEM_USED_PCT=$(echo "$RESPONSE" | jq -r '.data.metrics.memory.percentTotal // 0')
    TOTAL_MEM_GB=$((TOTAL_MEM / 1024 / 1024 / 1024))
    
    echo "### System" >> "$OUTPUT_FILE"
    echo "- **Hardware:** $SYS_MFG $SYS_MODEL" >> "$OUTPUT_FILE"
    echo "- **OS:** Unraid $OS_REL ($OS_ARCH)" >> "$OUTPUT_FILE"
    echo "- **License:** $LICENSE (Registered to: $REG_TO)" >> "$OUTPUT_FILE"
    echo "- **Timezone:** $TIMEZONE" >> "$OUTPUT_FILE"
    echo "- **CPU:** Model $CPU_MODEL ($CPU_CORES cores / $CPU_THREADS threads) - **${CPU_LOAD}% load**" >> "$OUTPUT_FILE"
    echo "- **Memory:** ${TOTAL_MEM_GB}GB - **${MEM_USED_PCT}% used**" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"

    # Array capacity
    ARRAY_TOTAL=$(echo "$RESPONSE" | jq -r '.data.array.capacity.kilobytes.total')
    ARRAY_USED=$(echo "$RESPONSE" | jq -r '.data.array.capacity.kilobytes.used')
    
    if [ "$ARRAY_TOTAL" != "null" ] && [ "$ARRAY_TOTAL" -gt 0 ]; then
        ARRAY_TOTAL_GB=$((ARRAY_TOTAL / 1024 / 1024))
        ARRAY_USED_GB=$((ARRAY_USED / 1024 / 1024))
        ARRAY_USED_PCT=$((ARRAY_USED * 100 / ARRAY_TOTAL))
        echo "### Storage" >> "$OUTPUT_FILE"
        echo "- **Array:** ${ARRAY_USED_GB}GB / ${ARRAY_TOTAL_GB}GB used (${ARRAY_USED_PCT}%)" >> "$OUTPUT_FILE"

        # Cache pools
        echo "- **Cache Pools:**" >> "$OUTPUT_FILE"
        echo "$RESPONSE" | jq -r '(.data.array.caches // [])[] | "  - \(.name) (\(.device)): \(.temp)°C - \(.status) - \(if .fsSize then "\((.fsUsed / 1024 / 1024 | floor))GB / \((.fsSize / 1024 / 1024 | floor))GB used" else "N/A" end)"' >> "$OUTPUT_FILE"
    fi
    
    # Docker
    TOTAL_CONTAINERS=$(echo "$RESPONSE" | jq '[(.data.docker.containers // [])[]] | length')
    RUNNING_CONTAINERS=$(echo "$RESPONSE" | jq '[(.data.docker.containers // [])[] | select(.state == "RUNNING")] | length')
    
    echo "" >> "$OUTPUT_FILE"
    echo "### Workloads" >> "$OUTPUT_FILE"
    echo "- **Docker:** ${TOTAL_CONTAINERS} containers (${RUNNING_CONTAINERS} running)" >> "$OUTPUT_FILE"
    
    # Unhealthy containers
    UNHEALTHY=$(echo "$RESPONSE" | jq -r '(.data.docker.containers // [])[] | select(.status | test("unhealthy|restarting"; "i")) | "  - ⚠️  \(.names[0]): \(.status)"')
    if [ -n "$UNHEALTHY" ]; then
        echo "$UNHEALTHY" >> "$OUTPUT_FILE"
    fi

    # VMs
    if [ "$(echo "$RESPONSE" | jq -r '.data.vms.domains')" != "null" ]; then
        TOTAL_VMS=$(echo "$RESPONSE" | jq '[.data.vms.domains[]] | length')
        RUNNING_VMS=$(echo "$RESPONSE" | jq '[.data.vms.domains[] | select(.state == "RUNNING")] | length')
        echo "- **VMs:** ${TOTAL_VMS} VMs (${RUNNING_VMS} running)" >> "$OUTPUT_FILE"
    else
        echo "- **VMs:** Service disabled or no data" >> "$OUTPUT_FILE"
    fi
    
    # Disk Health
    echo "" >> "$OUTPUT_FILE"
    echo "### Health" >> "$OUTPUT_FILE"
    
    HOT_DISKS=$(echo "$RESPONSE" | jq -r '(.data.array.disks // [])[] | select(.temp > 45) | "- ⚠️  \(.name): \(.temp)°C (HIGH)"')
    DISK_ERRORS=$(echo "$RESPONSE" | jq -r '(.data.array.disks // [])[] | select(.numErrors > 0) | "- ❌ \(.name): \(.numErrors) errors"')
    
    if [ -z "$HOT_DISKS" ] && [ -z "$DISK_ERRORS" ]; then
        echo "- ✅ All disks healthy" >> "$OUTPUT_FILE"
    else
        [ -n "$HOT_DISKS" ] && echo "$HOT_DISKS" >> "$OUTPUT_FILE"
        [ -n "$DISK_ERRORS" ] && echo "$DISK_ERRORS" >> "$OUTPUT_FILE"
    fi
    
    # Notifications (Alerts)
    echo "" >> "$OUTPUT_FILE"
    echo "### Notifications" >> "$OUTPUT_FILE"
    
    NOTIF_COUNT=$(echo "$RESPONSE" | jq '[.data.notifications[]] | length' 2>/dev/null || echo "0")
    if [ "$NOTIF_COUNT" != "null" ] && [ -n "$NOTIF_COUNT" ] && [ "$NOTIF_COUNT" -gt 0 ]; then
        # Show recent notifications (last 10)
        ALERT_NOTIFS=$(echo "$RESPONSE" | jq -r '.data.notifications | sort_by(.timestamp) | reverse | .[0:10][] | "- [\(.importance // "info")] \(.title // .subject): \(.description // "No description") (\(.timestamp | split("T")[0]))"' 2>/dev/null)
        if [ -n "$ALERT_NOTIFS" ]; then
            echo "$ALERT_NOTIFS" >> "$OUTPUT_FILE"
        else
            echo "- ✅ No recent notifications" >> "$OUTPUT_FILE"
        fi
        
        # Count by importance
        ALERT_COUNT=$(echo "$RESPONSE" | jq '[.data.notifications[] | select(.importance == "alert" or .importance == "warning")] | length' 2>/dev/null || echo "0")
        if [ "$ALERT_COUNT" -gt 0 ]; then
            echo "" >> "$OUTPUT_FILE"
            echo "**⚠️ $ALERT_COUNT alert/warning notifications**" >> "$OUTPUT_FILE"
        fi
    else
        echo "- ✅ No notifications" >> "$OUTPUT_FILE"
    fi
    
    echo "" >> "$OUTPUT_FILE"
    echo "---" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
}

# Main loop - process each server from environment variables
for server in "${SERVERS[@]}"; do
    name_var="UNRAID_${server}_NAME"
    url_var="UNRAID_${server}_URL"
    key_var="UNRAID_${server}_API_KEY"

    NAME="${!name_var:-$server}"
    URL="${!url_var}"
    KEY="${!key_var}"

    process_server "$NAME" "$URL" "$KEY"
done

echo "Dashboard saved to: $OUTPUT_FILE"
cat "$OUTPUT_FILE"
