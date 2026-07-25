# syntax=docker/dockerfile:1
# ── Stage 1: Build ──────────────────────────────────────────────────────────────
FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim@sha256:e5b65587bce7de595f299855d7385fe7fca39b8a74baa261ba1b7147afa78e58 AS builder
# Tag in the ref pins Dependabot to the python3.12-bookworm-slim variant (has a shell
# for `RUN uv sync`). Without the tag, Dependabot tracks :latest — a FROM-scratch,
# binary-only image with no /bin/sh — and the build breaks. Digest pinned for reproducibility.

WORKDIR /app

# Install dependencies first (cached layer)
COPY pyproject.toml uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-install-project --no-dev

# Copy source and install project
COPY src/ src/
RUN touch README.md LICENSE
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev

# ── Stage 2: Runtime ────────────────────────────────────────────────────────────
FROM python:3.12.11-slim-bookworm@sha256:519591d6871b7bc437060736b9f7456b8731f1499a57e22e6c285135ae657bf7 AS runtime
# Runtime Python must match the builder's Python 3.12 virtualenv layout.
# The digest remains reproducible, while the explicit upgrade closes Debian security
# fixes published after that immutable base was built. CI scans the resulting image.

RUN apt-get update && \
    apt-get upgrade --yes && \
    rm -rf /var/lib/apt/lists/* && \
    groupadd --gid 1000 mcp && \
    useradd --uid 1000 --gid mcp --create-home mcp

WORKDIR /app

# Copy the virtual environment from builder
COPY --from=builder /app/.venv /app/.venv
COPY --from=builder /app/src /app/src

# Ensure .venv/bin is on PATH
ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Create directories with correct ownership.
# /home/mcp/.unraid-mcp is pre-created so Docker named volume mounts inherit mcp ownership.
RUN mkdir -p /app/logs /app/backups /home/mcp/.unraid-mcp && \
    chown -R mcp:mcp /app/logs /app/backups /home/mcp/.unraid-mcp && \
    chmod 700 /home/mcp/.unraid-mcp && \
    rm -rf \
      /usr/local/bin/pip \
      /usr/local/bin/pip3 \
      /usr/local/bin/pip3.12 \
      /usr/local/lib/python3.12/ensurepip \
      /usr/local/lib/python3.12/site-packages/pip* \
      /usr/local/lib/python3.12/site-packages/setuptools* \
      /usr/local/lib/python3.12/site-packages/wheel* \
      /app/.venv/lib/python3.12/site-packages/pip* \
      /app/.venv/lib/python3.12/site-packages/setuptools* \
      /app/.venv/lib/python3.12/site-packages/wheel*

# UNRAID_MCP_HOST is the only var that genuinely needs a container-specific value
# (the package default 127.0.0.1 would make the server unreachable from outside the
# container network namespace). UNRAID_MCP_TRANSPORT/_PORT/_LOG_LEVEL are deliberately
# NOT baked in here even though they used to match this image's intended defaults:
# _load_env_files() loads ~/.unraid-mcp/.env with load_dotenv(override=False), so a
# value already present in the process env (as these would be, coming from an image
# ENV) permanently shadows the same var configured in that .env file. Package
# defaults (streamable-http / 6970 / INFO — see src/unraid_mcp/config/settings.py) apply
# identically when unset, so baking them in here would only ever silently block a
# user's own configuration, never add real value (see issue #137).
ENV UNRAID_MCP_HOST=0.0.0.0

EXPOSE 6970

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

USER mcp

# Shell-form CMD: /bin/sh expands ${UNRAID_MCP_PORT:-6970} before python runs.
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://localhost:${UNRAID_MCP_PORT:-6970}/ready', timeout=5).status==200 else 1)" || exit 1

ENTRYPOINT ["/entrypoint.sh"]
