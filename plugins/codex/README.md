# Unraid Codex

Unraid Codex adds a persistent Codex chathead to authenticated stock Unraid
webGUI pages without replacing or patching Unraid core UI files.

The browser speaks Codex app-server JSON-RPC over WebSocket through Unraid's
existing authenticated `/webterminal/` Unix-socket proxy. Codex runs as the
non-root `agent` user in a dedicated, unprivileged Incus container. No Codex
TCP listener is exposed on the host or LAN.

## Requirements

- Unraid OS 7.0.0 or newer on x86-64 hardware.
- The Incus Dev Containers plugin installed, enabled, initialized, and healthy.
  Its configured storage pool and `agent-jail` profile must exist before the
  Codex plugin is installed.
- Internet access from the managed container to GitHub and OpenAI.
- An OpenAI account for the Codex device-login flow.

The Incus profile blocks common LAN, link-local, and Tailscale ranges by
default. That policy is deny-list containment, not a complete security
boundary. Review the Incus network ACL, workspace mounts, and any allow-holes
for the actual network before running untrusted workloads.

## Clean install behavior

On the first array-mounted start, the plugin:

1. Verifies that Incus is running and its configured profile and storage pool
   exist.
2. Creates the dedicated `unraid-codex` container when it is absent.
3. Gives the container an isolated workspace beneath the Incus
   `JAIL_WORKSPACE_ROOT`.
4. Resolves the latest stable official Codex static Linux release, validates
   its canonical GitHub URL and published SHA-256 digest, installs it atomically,
   records the installed version, and exercises the exact CLI features used by
   the plugin.
5. Creates and mounts the persistent `unraid-codex-state` Incus volume at
   `/home/agent/.codex`.
6. Installs the hardened app-server service and connects its Unix socket to the
   authenticated Unraid webGUI proxy.

Provisioning is idempotent. Re-running it preserves the container and workspace,
skips the download when the latest compatible Codex release is already healthy,
and repairs managed runtime files and services.

A daily update check follows the same verified release path. It keeps the
current binary when GitHub is temporarily unavailable, rejects incompatible or
non-canonical assets, smoke-tests app-server after an update, and restores the
previous binary and version ledger if runtime health fails.

## User experience

- Aurora-styled chathead and responsive side drawer in an isolated shadow root.
- ChatGPT device-code login.
- New-thread creation and saved-thread resume across page navigation.
- Streamed assistant deltas, command approvals, file-change approvals, and MCP
  form elicitation.
- Configurable global keyboard shortcut.
- Connection, authentication, and app-server diagnostics.
- Array mount and unmount lifecycle hooks.

Open **Settings > Unraid Codex** after installation. The floating launcher also
appears on authenticated webGUI pages.

## Persistence and backups

Codex state lives in the `unraid-codex-state` Incus storage volume, not the
container root filesystem. A daily maintenance job snapshots the volume and
writes an encrypted export to:

`/mnt/cache_appdata/appdata/unraid-codex/backups`

The encryption and HMAC key is stored with mode `0600` at:

`/boot/config/plugins/unraid-codex/backup.key`

Uninstall removes the webGUI integration, service schedule, package, and proxy
configuration. It intentionally leaves the Incus container, persistent state,
backups, and flash configuration intact so a reinstall or manual recovery does
not destroy user data.

## Troubleshooting

Plugin and provisioning messages use the `unraid-codex` syslog tag. Check the
Unraid system log first, then inspect the `unraid-codex` container and its
`codex-appserver.service` journal through Incus.

A failed prerequisite check is deliberate. Enable and initialize the Incus
plugin before retrying the Codex installation.

## Development

Install frontend dependencies once:

`npm ci --no-audit --no-fund --prefix web-src`

Run the complete source contract:

`./tests/contract.sh`

Prepare a coherent release candidate, including cache-busters, deterministic
package, checksums, and all verification gates:

`./scripts/prepare-release.sh 20260802.001 34`

Reverify an already prepared tree:

`./scripts/verify-release.sh`

The package builder requires explicit fixed-width CalVer and build arguments:

`./scripts/build-package.sh 20260802.001 34`

## Community Applications publication

Community Applications publishes this plugin directly from the public
`dinglebear-ai/unraid` monorepo. Repository-level metadata lives at
`/ca_profile.xml`, while the Codex wrapper is
`plugins/codex/ca/unraid-codex.xml` and points to the plugin manifest, icon,
README, support page, and release assets in this repository.

Submit `https://github.com/dinglebear-ai/unraid` through the Community
Applications portal, then run Validate and Scan before requesting review.
