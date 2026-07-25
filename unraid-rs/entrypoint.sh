#!/bin/sh
# entrypoint.sh — Docker container entrypoint for unraid-rmcp
# Runs as root, then drops to service user (1000:1000).
# Defense in numbers: validate every assumption before exec'ing the service.
set -e

DATA_DIR="${DATA_DIR:-/data}"
SERVICE_NAME="runraid"
BINARY="/usr/local/bin/${SERVICE_NAME}"

# ── 1. Binary exists and is executable ───────────────────────────────────────
if [ ! -x "${BINARY}" ]; then
    echo "FATAL: ${BINARY} is missing or not executable" >&2
    echo "  Rebuild the Docker image or check the COPY step in the Dockerfile." >&2
    exit 1
fi

# ── 2. Required env vars ──────────────────────────────────────────────────────
# Fail fast with a clear message rather than a cryptic runtime error.
missing_vars=""
for var in UNRAID_API_URL UNRAID_API_KEY; do
    # POSIX-safe indirect variable expansion
    eval "val=\${${var}:-}"
    if [ -z "${val}" ]; then
        missing_vars="${missing_vars} ${var}"
    fi
done
if [ -n "${missing_vars}" ]; then
    echo "FATAL: required environment variables not set:${missing_vars}" >&2
    echo "  Set them in your .env file or with docker run -e flags." >&2
    echo "  Example: docker run -e UNRAID_API_URL=https://... -e UNRAID_API_KEY=..." >&2
    exit 1
fi

# ── 3. Data directory ─────────────────────────────────────────────────────────
mkdir -p "${DATA_DIR}/logs"

# Fix ownership — the volume may have been created by a different UID.
if ! chown -R 1000:1000 "${DATA_DIR}" 2>/dev/null; then
    echo "WARN: could not chown ${DATA_DIR} to 1000:1000 — permissions may be wrong" >&2
fi

# Verify data dir is actually writable by UID 1000 before starting.
if ! gosu 1000:1000 sh -c "touch '${DATA_DIR}/.write_test' 2>/dev/null && rm -f '${DATA_DIR}/.write_test'"; then
    echo "FATAL: ${DATA_DIR} is not writable by UID 1000" >&2
    echo "  Check the volume mount permissions on the host." >&2
    exit 1
fi

# ── 4. Secure secret files ────────────────────────────────────────────────────
for f in "${DATA_DIR}/.env" "${DATA_DIR}/auth-jwt.pem" "${DATA_DIR}/auth.db"; do
    [ -f "${f}" ] && chmod 600 "${f}" 2>/dev/null || true
done
[ -f "${DATA_DIR}/config.toml" ] && chmod 640 "${DATA_DIR}/config.toml" 2>/dev/null || true

# ── 5. Log startup info (redact secrets) ─────────────────────────────────────
echo "[entrypoint] Starting ${SERVICE_NAME}-mcp"
echo "[entrypoint] Binary:   ${BINARY}"
echo "[entrypoint] Data dir: ${DATA_DIR}"
echo "[entrypoint] User:     1000:1000"
# Log non-secret config values only
[ -n "${UNRAID_RMCP_PORT:-}" ]  && echo "[entrypoint] MCP port: ${UNRAID_RMCP_PORT}"
[ -n "${UNRAID_RMCP_HOST:-}" ]  && echo "[entrypoint] MCP host: ${UNRAID_RMCP_HOST}"
# Confirm required vars are set without printing their values
echo "[entrypoint] UNRAID_API_URL: set"
echo "[entrypoint] UNRAID_API_KEY: set"

# ── 6. Signal handling ────────────────────────────────────────────────────────
# Do NOT trap signals here — pass them through to the child process via exec.

# ── 7. Drop privileges and exec ──────────────────────────────────────────────
# exec replaces this shell so PID 1 is the actual service binary.
# Signals (SIGTERM, SIGINT) go directly to the service for graceful shutdown.
exec gosu 1000:1000 "${BINARY}" "$@"
