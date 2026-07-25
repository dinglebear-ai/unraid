Version 7.2.5 2026-04-30 | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
This security and bugfix release updates Docker, the Linux kernel, ZFS, and selected base packages for Unraid 7.2.x users. It also includes targeted fixes for Docker, Tailscale, storage, mover empty-disk workflows, WebGUI security, login-page custom case images, Unraid API startup, and registration state handling.
This release also includes a Linux kernel upgrade that addresses CVE-2026-31431, the Copy Fail local privilege escalation vulnerability. It addresses additional CVEs and security advisories in curl, GnuTLS, libpcap, libpng, libtasn1, libXpm, OpenSSL, p11-kit, xorg-server, xz, and related base packages. Several package changelogs also note security fixes without public CVE IDs.
The Docker update includes runc fixes for CVE-2025-31133, CVE-2025-52565, and CVE-2025-52881.
This release is recommended for all 7.2.x users.
## Upgrading[​](#upgrading)
For step-by-step instructions, see [Updating Unraid](/unraid-os/updating-unraid/). Questions about your [license](/unraid-os/troubleshooting/licensing-faq/)?
### Known issues[​](#known-issues)
For other known issues, see the [7.2.4 release notes](/unraid-os/release-notes/7.2.4/).
### Rolling back[​](#rolling-back)
If rolling back earlier than 7.2.4, also see the [7.2.4 release notes](/unraid-os/release-notes/7.2.4/).
## BREAKING CHANGES[​](#breaking-changes)
* Docker containers may receive a new dynamically generated MAC address each time they are created. If a container needs a stable network identity for DHCP reservations, router or firewall rules, switch ACLs, monitoring, or similar workflows, set a fixed value in the new **MAC Address** field on the Docker template. This follows Docker Engine 28+ behavior for bridge and macvlan network endpoints; see the [Docker Engine 28 release notes](https://docs.docker.com/engine/release-notes/28/).
## Changes vs. 7.2.4[​](#changes-vs-724)
### Security[​](#security)
* Fixed three WebGUI security issues that required a logged-in session to exploit. Users are encouraged to upgrade.
* Upgrade the Linux kernel to address CVE-2026-31431, the Copy Fail local privilege escalation vulnerability, and pick up upstream fixes for CVE-2026-31430, a Linux X.509 out-of-bounds access issue triggered by specially crafted certificates.
* Package CVE coverage as of Apr 30, 2026: 24 unique CVEs across 21 upstream advisories in 14 packages. Package-level details are listed in the base distro updates below.
### Containers / Docker[​](#containers--docker)
* Improvement: Update Docker to version 29 for 7.2.x systems.
* Security: Include runc fixes for CVE-2025-31133, CVE-2025-52565, and CVE-2025-52881.
* New: Add an optional **MAC Address** field to Docker templates for containers that need a stable network identity across restarts. This field preserves configured fixed MAC addresses through Docker restarts, full host reboots, container recreates, and delete/re-add from the saved template for bridge, custom macvlan/ipvlan, WireGuard, and user-defined Docker networks.
* Fix: Migrate legacy `--mac-address=` values from Extra Parameters into the new fixed MAC field where safe, while leaving templates unchanged when networking is still owned by Extra Parameters.
* Improvement: Show each running Docker container's actual MAC address in Docker Advanced View alongside the existing network and IP details.
* Fix: Hide stale dead or uninspectable "ghost" containers from the Docker page without deleting containers or mutating Docker state.
* Fix: Clear stale Tailscale Serve/Funnel state when a Docker container restarts, then reapply only the Serve/Funnel mode currently configured in the Docker template. This prevents a container changed from Funnel or Serve to No from keeping the old exposure active after restart.
### Storage[​](#storage)
* Fix: Keep the [mover empty-disk action](/unraid-os/using-unraid-to/manage-storage/file-systems/#converting-to-a-new-file-system-type) available on systems with user shares enabled but no pool devices assigned, while still disabling it during parity, mover, and BTRFS operations.
* Fix: Preserve an array disk's existing non-standard partition layout when the disk is unassigned and reassigned. This prevents Unraid from rewriting an unaligned sector-63 partition at sector 64 and making the existing filesystem unmountable.
### WebGUI[​](#webgui)
* Fix: Restore custom case-model images on the login page.
### Unraid API[​](#unraid-api)
* Update Unraid API to dynamix.unraid.net 4.32.3 - [see changes](https://github.com/unraid/api/releases).
* Fix: Resolve an API startup failure where the API could time out while bootstrapping and remain in a restart loop.
* Fix: Improve registration-state refresh after license updates so the WebGUI reflects the current license state more reliably.
### Linux kernel[​](#linux-kernel)
* version 6.12.85-Unraid
* Security: Addresses CVE-2026-31431, the Copy Fail local privilege escalation vulnerability.
### Base distro updates and CVEs[​](#base-distro-updates-and-cves)
* ↑ bind: 9.20.15 → 9.20.22 (security fix noted; no CVE IDs listed)
* ↑ curl: 8.16.0 → 8.19.0 (CVE-2026-1965, CVE-2026-3783, CVE-2026-3784, CVE-2026-3805)
* ↑ docker: 27.5.1-1\_LT → 29.3.1-1\_LT
* ↑ dynamix.unraid.net: 4.29.2 → 4.32.3-2
* ↑ gnutls: 3.8.10 → 3.8.12 (CVE-2025-14831, CVE-2026-1584)
* ↑ libXpm: 3.5.17 → 3.5.19 (CVE-2026-4367)
* ↑ libarchive: 3.8.2 → 3.8.7 (security fix noted; no CVE IDs listed)
* ↑ libpcap: 1.10.5 → 1.10.6 (CVE-2025-11961, CVE-2025-11964)
* ↑ libpng: 1.6.50 → 1.6.57 (CVE-2026-34757)
* ↑ libtasn1: 4.20.0 → 4.21.0 (CVE-2025-13151)
* ↑ libvirt-php: 0.5.8-8.3.26\_LT → 0.5.8-8.3.29\_LT
* ↑ libxml2: 2.14.6 → 2.15.3 (security fix noted; no CVE IDs listed)
* ↑ libxslt: 1.1.43-2 → 1.1.45
* ↑ openssl: 3.5.4 → 3.5.6-2 (CVE-2026-28387, CVE-2026-28388, CVE-2026-28389, CVE-2026-28390, CVE-2026-31789, CVE-2026-31790)
* ↑ p11-kit: 0.25.10 → 0.26.2 (CVE-2026-2100)
* ↑ php: 8.3.26-1\_LT → 8.3.29-1\_LT
* ↑ xorg-server: 21.1.18 → 21.1.22-2 (CVE-2026-33999, CVE-2026-34000, CVE-2026-34001, CVE-2026-34002, CVE-2026-34003)
* ↑ xz: 5.8.1 → 5.8.3 (CVE-2026-34743)
* ↑ zfs: 2.3.4\_6.12.54\_Unraid-2\_LT → 2.3.4\_6.12.82\_Unraid-2\_LT
* ↑ zlib: 1.3.1 → 1.3.2 (security fix noted; no CVE IDs listed)
* + ngtcp2: added 1.22.1
* [Upgrading](#upgrading)
* [Known issues](#known-issues)
* [Rolling back](#rolling-back)
* [BREAKING CHANGES](#breaking-changes)
* [Changes vs. 7.2.4](#changes-vs-724)
* [Security](#security)
* [Containers / Docker](#containers--docker)
* [Storage](#storage)
* [WebGUI](#webgui)
* [Unraid API](#unraid-api)
* [Linux kernel](#linux-kernel)
* [Base distro updates and CVEs](#base-distro-updates-and-cves)