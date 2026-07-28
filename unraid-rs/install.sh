#!/usr/bin/env bash
# install.sh — One-line installer for unraid-rmcp
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/dinglebear-ai/unraid/main/unraid-rs/install.sh | bash
#
# What it does:
#   1. Runs pre-flight checks (OS/arch, tools, disk space, PATH, port)
#   2. Downloads the latest release binary to ~/.local/bin/runraid  OR
#      builds from source if cargo is available and no release binary found
#   3. Creates ~/.unraid/ data directory
#   4. Writes a starter ~/.unraid/.env if one doesn't already exist
#   5. Runs `runraid doctor` to validate the installation
#   6. Prints next steps

set -euo pipefail

REPO="dinglebear-ai/unraid"
BIN_NAME="runraid"
# The Rust server is one component of the unraid-mcp monorepo. Its releases are
# tagged `unraid-rs-v<semver>` and its crate lives in the `unraid-rs/` subtree —
# bare `v<semver>` tags and the repo root belong to the Python server.
TAG_PREFIX="unraid-rs-v"
CRATE_SUBDIR="unraid-rs"
SERVICE="unraid-rmcp"
INSTALL_DIR="${HOME}/.local/bin"
DATA_DIR="${HOME}/.unraid"

# ── Colour ────────────────────────────────────────────────────────────────────
if [[ -t 1 ]]; then
  C_RESET='\033[0m'; C_BOLD='\033[1m'; C_GREEN='\033[0;32m'
  C_RED='\033[0;31m'; C_YELLOW='\033[0;33m'; C_CYAN='\033[0;36m'
else
  C_RESET=''; C_BOLD=''; C_GREEN=''; C_RED=''; C_YELLOW=''; C_CYAN=''
fi

info()  { printf "${C_CYAN}[INFO]${C_RESET}  %s\n" "$*"; }
ok()    { printf "${C_GREEN}[OK]${C_RESET}    %s\n" "$*"; }
warn()  { printf "${C_YELLOW}[WARN]${C_RESET}  %s\n" "$*" >&2; }
error() { printf "${C_RED}[ERROR]${C_RESET} %s\n" "$*" >&2; }
die()   { error "$*"; exit 1; }

# ── Pre-flight checks (§49) ───────────────────────────────────────────────────
preflight() {
  local errors=0

  echo ""
  echo "Pre-flight checks..."
  echo ""

  # 1. OS / arch
  local os arch
  os="$(uname -s | tr '[:upper:]' '[:lower:]')"
  arch="$(uname -m)"
  case "${arch}" in
    x86_64|amd64)   arch="amd64" ;;
    aarch64|arm64)  arch="arm64" ;;
    *)
      echo "  ✗ Unsupported arch: ${arch} (need x86_64 or aarch64)"
      (( errors++ )) || true
      ;;
  esac
  case "${os}" in
    linux)  echo "  ✓ Platform: ${os}/${arch}" ;;
    darwin) echo "  ✓ Platform: ${os}/${arch} (macOS — will build from source)" ;;
    *)
      echo "  ✗ Unsupported OS: ${os} (only Linux and macOS are supported)"
      (( errors++ )) || true
      ;;
  esac

  # 2. Required tools
  for cmd in curl tar; do
    if command -v "${cmd}" >/dev/null 2>&1; then
      echo "  ✓ ${cmd}: $(command -v "${cmd}")"
    else
      echo "  ✗ ${cmd}: not found (required)"
      (( errors++ )) || true
    fi
  done

  # 3. Disk space (need at least 50 MB free in HOME)
  local free_mb
  free_mb="$(df -k "${HOME}" 2>/dev/null | awk 'NR==2{printf "%d", $4/1024}' || echo 0)"
  if (( free_mb < 50 )); then
    echo "  ✗ Disk space: only ${free_mb} MB free in ${HOME} (need at least 50 MB)"
    (( errors++ )) || true
  else
    echo "  ✓ Disk space: ${free_mb} MB free"
  fi

  # 4. Install dir writable (or can be created)
  if mkdir -p "${INSTALL_DIR}" 2>/dev/null && [[ -w "${INSTALL_DIR}" ]]; then
    echo "  ✓ Install dir: ${INSTALL_DIR} (writable)"
  else
    echo "  ✗ Install dir: ${INSTALL_DIR} (not writable or cannot create)"
    (( errors++ )) || true
  fi

  # 5. PATH check (warn only — not a hard failure)
  if echo "${PATH}" | tr ':' '\n' | grep -qx "${HOME}/.local/bin" 2>/dev/null; then
    echo "  ✓ PATH: ~/.local/bin is present"
  else
    echo "  ⚠  PATH: ~/.local/bin not in PATH — will print instructions after install"
  fi

  # 6. Required env vars (warn only — can be set post-install)
  if [[ -n "${UNRAID_API_URL:-}" ]]; then
    echo "  ✓ UNRAID_API_URL: set"
  else
    echo "  ⚠  UNRAID_API_URL: not set (required before running the server)"
  fi
  if [[ -n "${UNRAID_API_KEY:-}" ]]; then
    echo "  ✓ UNRAID_API_KEY: set"
  else
    echo "  ⚠  UNRAID_API_KEY: not set (required before running the server)"
  fi

  # 7. Port 40010 availability (warn only)
  local port="${UNRAID_RMCP_PORT:-40010}"
  if ss -tlnp 2>/dev/null | awk '{print $4}' | grep -q ":${port}$" 2>/dev/null; then
    echo "  ⚠  Port ${port}: already in use (change UNRAID_RMCP_PORT if needed)"
  else
    echo "  ✓ Port ${port}: available"
  fi

  echo ""
  if (( errors > 0 )); then
    echo "  ✗ Pre-flight failed with ${errors} error(s). Fix them and re-run."
    return 1
  fi
  echo "  ✓ Pre-flight passed — proceeding with install"
  return 0
}

# ── Detect OS and arch ────────────────────────────────────────────────────────
detect_platform() {
  local os arch
  os="$(uname -s | tr '[:upper:]' '[:lower:]')"
  arch="$(uname -m)"

  case "${os}" in
    linux)  OS="linux" ;;
    darwin) OS="macos" ;;
    *)      warn "Unsupported OS: ${os}. Will attempt build from source."; OS="unknown" ;;
  esac

  case "${arch}" in
    x86_64|amd64)  ARCH="x86_64" ;;
    aarch64|arm64) ARCH="aarch64" ;;
    *)             warn "Unsupported arch: ${arch}. Will attempt build from source."; ARCH="unknown" ;;
  esac
}

# ── Get latest release tag ────────────────────────────────────────────────────
# `/releases/latest` is repo-wide and would return the Python server's `v*` tag,
# so list releases and pick the newest `unraid-rs-v*` one instead.
latest_release_tag() {
  local releases=''
  if command -v curl &>/dev/null; then
    releases="$(curl -fsSL "https://api.github.com/repos/${REPO}/releases?per_page=100" 2>/dev/null || true)"
  elif command -v wget &>/dev/null; then
    releases="$(wget -qO- "https://api.github.com/repos/${REPO}/releases?per_page=100" 2>/dev/null || true)"
  fi
  [[ -z "${releases}" ]] && return 0
  printf '%s' "${releases}" \
    | grep -o "\"tag_name\": *\"${TAG_PREFIX}[^\"]*\"" \
    | head -n1 \
    | sed -E 's/.*"([^"]+)"$/\1/'
}

# ── Download binary ───────────────────────────────────────────────────────────
download_binary() {
  local tag="${1:?tag required}"
  local tmp_dir; tmp_dir="$(mktemp -d)"
  trap 'rm -rf -- "${tmp_dir}"' RETURN

  # rust-release.yml publishes exactly one pre-built target: linux/x86_64, as the
  # raw binary `runraid-linux-x86_64`. Anything else must build from source.
  if [[ "${OS}" != "linux" || "${ARCH}" != "x86_64" ]]; then
    info "No pre-built asset for ${OS}/${ARCH} — will build from source"
    return 1
  fi
  local asset="${BIN_NAME}-linux-x86_64"
  local url="https://github.com/${REPO}/releases/download/${tag}/${asset}"

  info "Downloading ${url} ..."
  local tmp_bin="${tmp_dir}/${BIN_NAME}"

  local dl_ok=false
  if command -v curl &>/dev/null; then
    curl -fsSL -o "${tmp_bin}" "${url}" 2>/dev/null && dl_ok=true || true
  elif command -v wget &>/dev/null; then
    wget -qO "${tmp_bin}" "${url}" 2>/dev/null && dl_ok=true || true
  fi

  if [[ "${dl_ok}" == false || ! -f "${tmp_bin}" ]]; then
    return 1
  fi

  chmod +x "${tmp_bin}"
  # Verify it at least runs (architecture match check)
  if ! "${tmp_bin}" --version &>/dev/null; then
    warn "Downloaded binary failed --version check (wrong architecture?)"
    return 1
  fi

  mkdir -p "${INSTALL_DIR}"
  cp "${tmp_bin}" "${INSTALL_DIR}/${BIN_NAME}"
  return 0
}

# ── Build from source ─────────────────────────────────────────────────────────
build_from_source() {
  if ! command -v cargo &>/dev/null; then
    return 1
  fi

  info "cargo found — building from source (this may take a few minutes)..."

  # If we're inside the repo, build here; otherwise clone to tmp
  if [[ -f "Cargo.toml" ]] && grep -q 'name = "unraid-rmcp"' Cargo.toml 2>/dev/null; then
    cargo build --release --quiet
    mkdir -p "${INSTALL_DIR}"
    cp "target/release/${BIN_NAME}" "${INSTALL_DIR}/${BIN_NAME}"
    ok "Built and installed from local source"
    return 0
  fi

  # Clone and build
  local tmp_src; tmp_src="$(mktemp -d)"
  trap 'rm -rf -- "${tmp_src}"' RETURN

  if command -v git &>/dev/null; then
    git clone --depth=1 "https://github.com/${REPO}.git" "${tmp_src}" 2>/dev/null || return 1
    # The crate is a subtree of the monorepo, not its root.
    local crate_dir="${tmp_src}/${CRATE_SUBDIR}"
    if [[ ! -f "${crate_dir}/Cargo.toml" ]]; then
      warn "Expected crate at ${CRATE_SUBDIR}/ in ${REPO} but found none"
      return 1
    fi
    (cd "${crate_dir}" && cargo build --release --quiet)
    mkdir -p "${INSTALL_DIR}"
    cp "${crate_dir}/target/release/${BIN_NAME}" "${INSTALL_DIR}/${BIN_NAME}"
    ok "Built and installed from GitHub source"
    return 0
  fi

  return 1
}

# ── Create data directory ─────────────────────────────────────────────────────
create_data_dir() {
  if mkdir -p "${DATA_DIR}" 2>/dev/null; then
    ok "Data directory: ${DATA_DIR}"
  else
    warn "Could not create ${DATA_DIR} — you may need to create it manually"
  fi
}

# ── Write starter .env ────────────────────────────────────────────────────────
write_starter_env() {
  local env_target="${DATA_DIR}/.env"

  if [[ -f "${env_target}" ]]; then
    info "${env_target} already exists — skipping"
    return
  fi

  cat > "${env_target}" << 'EOF'
# unraid-rmcp configuration
# Fill in your Unraid server details before running the server.

# Required: Unraid GraphQL API endpoint
UNRAID_API_URL=https://your-unraid-host:31337/graphql

# Required: Unraid API key (from Unraid Settings → API Manager)
UNRAID_API_KEY=your_unraid_api_key

# MCP server bearer token (generate with: openssl rand -hex 32)
UNRAID_RMCP_TOKEN=your_bearer_token

# Optional: bind host and port (default: 0.0.0.0:40010)
# UNRAID_RMCP_HOST=127.0.0.1
# UNRAID_RMCP_PORT=40010

# Optional: skip TLS verification for self-signed certs (not recommended)
# UNRAID_API_SKIP_TLS_VERIFY=true

# Docker Compose runtime
PUID=1000
PGID=1000
DOCKER_NETWORK=unrust
RUST_LOG=info
EOF

  chmod 600 "${env_target}"
  ok "Wrote starter config to ${env_target}"
  info "Edit it to set UNRAID_API_URL and UNRAID_API_KEY before running the server"
}

# ── Ensure ~/.local/bin is in PATH ────────────────────────────────────────────
ensure_path() {
  if ! echo "${PATH}" | tr ':' '\n' | grep -qx "${INSTALL_DIR}"; then
    warn "${INSTALL_DIR} is not in your PATH"
    warn "Add this line to your shell profile (~/.bashrc, ~/.zshrc, etc.):"
    warn "  export PATH=\"\${HOME}/.local/bin:\${PATH}\""
  fi
}

# ── Post-install (§49) ────────────────────────────────────────────────────────
post_install() {
  echo ""
  echo "Running doctor check..."
  if "${INSTALL_DIR}/${BIN_NAME}" doctor 2>/dev/null; then
    echo ""
    ok "Installation complete and verified."
  else
    echo ""
    warn "Installation complete but doctor found issues."
    warn "Fix the reported issues, then run: ${BIN_NAME} serve"
  fi

  printf '\n%b%s%b\n' "${C_BOLD}" "$(printf '=%.0s' {1..60})" "${C_RESET}"
  printf '%b  Next steps%b\n\n' "${C_BOLD}" "${C_RESET}"
  printf '  1. Edit %s/.env with your credentials\n' "${DATA_DIR}"
  printf '  2. Run: %s doctor       # validate config\n' "${BIN_NAME}"
  printf '  3. Run: %s serve        # start HTTP server\n' "${BIN_NAME}"
  printf '  4. Or:  %s mcp          # stdio for Claude Code\n' "${BIN_NAME}"
  printf '%b%s%b\n' "${C_BOLD}" "$(printf '=%.0s' {1..60})" "${C_RESET}"
}

# ── Main ──────────────────────────────────────────────────────────────────────
main() {
  printf '%b%s%b\n' "${C_BOLD}" "$(printf '=%.0s' {1..60})" "${C_RESET}"
  printf '%b  unraid-rmcp installer%b\n' "${C_BOLD}" "${C_RESET}"
  printf '%b%s%b\n' "${C_BOLD}" "$(printf '=%.0s' {1..60})" "${C_RESET}"

  # Run pre-flight first — abort if hard checks fail
  preflight || exit 1

  detect_platform

  local installed=false

  # 1. Try to download a pre-built release binary
  if [[ "${OS}" != "unknown" && "${ARCH}" != "unknown" ]]; then
    local tag
    tag="$(latest_release_tag)" || tag=''
    if [[ -n "${tag}" ]]; then
      info "Latest release: ${tag}"
      if download_binary "${tag}"; then
        ok "Downloaded ${BIN_NAME} ${tag} → ${INSTALL_DIR}/${BIN_NAME}"
        installed=true
      else
        warn "Binary download failed (release may not include pre-built assets yet)"
      fi
    else
      warn "Could not determine latest release tag (GitHub API unreachable?)"
    fi
  fi

  # 2. Fall back to building from source
  if [[ "${installed}" == false ]]; then
    if build_from_source; then
      installed=true
    else
      die "Could not install ${BIN_NAME}. Options:\n  1. Install Rust (https://rustup.rs) and re-run\n  2. Clone the repo and run: cargo build --release"
    fi
  fi

  # 3. Create data directory
  create_data_dir

  # 4. Write starter .env (in data dir, never overwrite)
  write_starter_env

  # 5. Ensure PATH
  ensure_path

  # 6. Run doctor and print next steps
  post_install
}

main "$@"
