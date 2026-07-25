#!/usr/bin/env bash
set -euo pipefail

agent_user="${MISE_IMAGE_AGENT_USER:-agent}"
agent_home="$(getent passwd "${agent_user}" | cut -d: -f6)"
mise_bin="${agent_home}/.local/bin/mise"
mise_config="${agent_home}/.config/mise/config.toml"

if [[ -z "${agent_home}" || ! -d "${agent_home}" ]]; then
  echo "Agent user ${agent_user} does not have a valid home directory" >&2
  exit 1
fi

if [[ ! -f "${mise_config}" ]]; then
  echo "Missing canonical mise config at ${mise_config}" >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y --no-install-recommends \
  autoconf \
  automake \
  bash \
  binutils \
  build-essential \
  bzip2 \
  ca-certificates \
  clang \
  cmake \
  curl \
  file \
  git \
  gnupg \
  libbz2-dev \
  libffi-dev \
  liblzma-dev \
  libncurses-dev \
  libreadline-dev \
  libsqlite3-dev \
  libssl-dev \
  libtool \
  libxml2-dev \
  libxmlsec1-dev \
  libyaml-dev \
  llvm \
  make \
  musl-tools \
  patch \
  perl \
  pkg-config \
  protobuf-compiler \
  python3 \
  python3-venv \
  sudo \
  tk-dev \
  tmux \
  unzip \
  uuid-dev \
  xz-utils \
  zip \
  zstd
rm -rf /var/lib/apt/lists/*

# ACCEPTED RISK (reviewed, unpinned vendor installers):
# The three `curl … | sh` installers in this script (tailscale below, mise and
# codex further down) execute whatever their vendor serves at build time, as root.
# They are deliberately NOT pinned, unlike the nvm/rustup installers used by the
# jail profile, because these vendors do not publish stable per-version install
# scripts with checksums, and pinning to a release artifact would have to be
# re-derived per architecture on every bump.
# Blast radius is bounded: this builds the *jailed agent container image*, not the
# Unraid host, and the resulting image is not published. A compromised vendor
# script would run in the image build, not on the NAS.
# If you tighten one of these, tighten all three, and validate by rebuilding the
# image end-to-end — a wrong pin silently breaks image provisioning.
if ! command -v tailscale >/dev/null 2>&1; then
  curl -fsSL https://tailscale.com/install.sh | sh
fi

install -d -m 0755 "${agent_home}/.local/bin" "${agent_home}/.config/mise"
chown -R "${agent_user}:${agent_user}" "${agent_home}/.local" "${agent_home}/.config"

if [[ ! -x "${mise_bin}" ]]; then
  su - "${agent_user}" -c \
    'curl -fsSL https://mise.run | env MISE_INSTALL_PATH="$HOME/.local/bin/mise" sh'
fi

runuser -u "${agent_user}" -- env \
  HOME="${agent_home}" \
  USER="${agent_user}" \
  LOGNAME="${agent_user}" \
  GITHUB_TOKEN="${GITHUB_TOKEN:-}" \
  MISE_BIN="${mise_bin}" \
  bash -lc '
  set -e
  export PATH="$HOME/.local/bin:$HOME/.local/share/mise/shims:$PATH"
  export MISE_YES=1
  export MISE_JOBS="${MISE_JOBS:-4}"
  "$MISE_BIN" trust "$HOME/.config/mise/config.toml"
  # Bootstrap Node/npm before the full parallel pass. Current mise defaults to
  # aube for npm tools, but packages such as soldr ship a native binary through
  # lifecycle scripts and must use npm with those scripts explicitly enabled.
  "$MISE_BIN" install --yes node
  export MISE_NPM_PACKAGE_MANAGER=npm
  export MISE_NPM_SHELL_OUT=1
  # npm_args is a per-tool option, not a global setting. Temporarily add it to
  # the soldr entry so its reviewed native-binary lifecycle hook runs, then
  # restore the byte-for-byte canonical config before the image is published.
  config_backup="$(mktemp)"
  cp "$HOME/.config/mise/config.toml" "$config_backup"
  trap '\''cp "$config_backup" "$HOME/.config/mise/config.toml"; rm -f "$config_backup"'\'' EXIT
  sed -i '\''/npm:@zackees\/soldr/s/postinstall = /npm_args = "--ignore-scripts=false", postinstall = /'\'' \
    "$HOME/.config/mise/config.toml"
  "$MISE_BIN" install --yes
  "$MISE_BIN" reshim
'

if ! su - "${agent_user}" -c 'test -x "$HOME/.local/bin/codex"'; then
  su - "${agent_user}" -c \
    'curl -fsSL https://chatgpt.com/codex/install.sh | env CODEX_NON_INTERACTIVE=1 sh'
fi

profile_marker="# incus-mise-agent-image"
for profile_file in "${agent_home}/.profile" "${agent_home}/.bashrc"; do
  touch "${profile_file}"
  if ! grep -Fq "${profile_marker}" "${profile_file}"; then
    {
      echo
      echo "${profile_marker}"
      echo 'export PATH="$HOME/.local/bin:$HOME/.local/share/mise/shims:$PATH"'
      echo 'eval "$("$HOME/.local/bin/mise" activate bash)"'
    } >>"${profile_file}"
  fi
done

if [[ -x /usr/local/bin/agent-env ]] &&
   ! grep -Fq '.local/share/mise/shims' /usr/local/bin/agent-env; then
  sed -i \
    's|export PATH="$HOME/.local/bin:$HOME/.cargo/bin:$PATH"|export PATH="$HOME/.local/bin:$HOME/.local/share/mise/shims:$HOME/.cargo/bin:$PATH"|' \
    /usr/local/bin/agent-env
fi

chown "${agent_user}:${agent_user}" "${agent_home}/.profile" "${agent_home}/.bashrc"

su - "${agent_user}" -c '
  set -e
  export PATH="$HOME/.local/bin:$HOME/.local/share/mise/shims:$PATH"
  mise current
  codex --version
  codex app-server generate-json-schema --out /tmp/codex-app-server-schema
  tailscale version
'

echo "mise agent image provisioning completed"
