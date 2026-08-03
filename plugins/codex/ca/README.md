# Unraid Codex

Unraid Codex adds a persistent Codex chathead to authenticated stock Unraid
webGUI pages without replacing or patching Unraid core UI files.

Codex runs as the non-root `agent` user in a dedicated, unprivileged Incus
container. The browser connects to Codex app-server through Unraid's existing
authenticated Unix-socket webterminal proxy. No standalone Codex TCP listener is
exposed on the host or LAN.

## Requirements

- Unraid OS 7.0.0 or newer on x86-64 hardware.
- The **Incus Dev Containers** plugin installed, enabled, initialized, and
  healthy before installing Unraid Codex.
- Internet access from the managed container to GitHub and OpenAI.
- An OpenAI account for the Codex device-login flow.

The Incus profile blocks common LAN, link-local, and Tailscale ranges by
default. That is deny-list containment, not a complete security boundary.
Review the Incus network ACL, workspace mounts, and any allow-holes for the
actual network before running untrusted workloads.

## Installation

Install **Unraid Codex** through Community Applications after the Incus plugin
is healthy. The first start automatically:

1. Creates the dedicated `unraid-codex` container when it is absent.
2. Assigns an isolated workspace beneath the configured Incus workspace root.
3. Resolves the latest stable official Codex Linux release, validates its
   canonical GitHub URL and published SHA-256 digest, and installs it atomically.
4. Records the installed version and exercises the exact Codex CLI capabilities
   used by the plugin.
5. Creates and mounts persistent Codex state storage.
6. Installs the hardened app-server service and authenticated webGUI proxy.

A daily verified update check keeps Codex current. Every candidate must pass
CLI compatibility checks and an app-server smoke test; a failed update restores
the previous binary automatically.

Open **Settings > Unraid Codex** after installation. A floating launcher also
appears on authenticated webGUI pages.

## Persistence and backups

Codex state lives in the `unraid-codex-state` Incus storage volume. A daily
maintenance job snapshots the volume and writes an encrypted export to:

`/mnt/cache_appdata/appdata/unraid-codex/backups`

The encryption and HMAC key is stored with mode `0600` at:

`/boot/config/plugins/unraid-codex/backup.key`

Uninstall removes the webGUI integration, schedule, package, and proxy
configuration. It intentionally leaves the Incus container, persistent state,
backups, and flash configuration intact.

## Troubleshooting

Plugin and provisioning messages use the `unraid-codex` syslog tag. Check the
Unraid system log first, then inspect `codex-appserver.service` inside the
`unraid-codex` container.

A failed prerequisite check is deliberate. Enable and initialize the Incus
plugin, then retry the Codex installation.

## Source and support

The maintained source is the Codex plugin directory in the
`dinglebear-ai/unraid-mcp` repository. Use this publication repository's
Issues tab for support and bug reports.
