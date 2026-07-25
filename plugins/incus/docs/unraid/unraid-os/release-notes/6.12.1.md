Version 6.12.1 2023-06-20 | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
Changes vs. [6.12.0](/unraid-os/release-notes/6.12.0/)
## Upgrade notes[​](#upgrade-notes)
### Known issues[​](#known-issues)
Please see the [6.12.0 release notes](/unraid-os/release-notes/6.12.0/#known-issues) for general known issues.
### Rolling back[​](#rolling-back)
If rolling back earlier than 6.12.0, also see the [6.12.0 release notes](/unraid-os/release-notes/6.12.0/#rolling-back).
## Bug fixes[​](#bug-fixes)
* emhttpd: remove "unraid" from reserved names list
* emhttpd: properly handle "ERROR" strings in 'btrfs filesystem show' command output
* emhttpd: prevent cmdStart if already Started
* network: Revised service reload functionality: ensures the services are only reloaded once
* network: rc.library: read IP addresses directly from interfaces instead of file
* network: NTP: fix listening interfaces
* network: NTP: exclude WG tunnels and user defined interfaces
* network: NTP: add interface name in config
* network: SSH: add interface name in config
* WebGUI: fix PHP8 warning in UPS Settings page
* WebGUI: Dashboard: show ZFS percentage based on c\_max value
* WebGUI: Dashboard: suppress coloring of ZFS utilization bar
* WebGUI: Dashboard: other misc fixes
## Linux kernel[​](#linux-kernel)
* version 6.1.34
## Base Distro[​](#base-distro)
* ttyd: version 1.7.3 (fixes issue of invisible underbar characters with certain FireFox versions)
### Security updates[​](#security-updates)
* ca-certificates: version 20230506
* curl: version 8.1.2 (CVE-2023-28322 CVE-2023-28321 CVE-2023-28320 CVE-2023-28319)
* git: version 2.35.8 (CVE-2023-25652 CVE-2023-25815 CVE-2023-29007)
* ntp: version 4.2.8p17 (CVE-2023-26551 CVE-2023-26552 CVE-2023-26553 CVE-2023-26554 CVE-2023-26555)
* openssl: version 1.1.1u (CVE-2023-2650)
* openssh: version 9.3p1
* php: version 8.2.7
* libX11: version 1.8.6 (CVE-2023-3138)
* libssh: version 0.10.5 (CVE-2023-1667 CVE-2023-2283)
* zstd: version 1.5.5
## Patches[​](#patches)
With the [Unraid Patch plugin](https://forums.unraid.net/topic/185560-unraid-patch-plugin/) installed, visit ***Tools → Unraid Patch*** to get the following patches / hot fixes:
* A subset of security updates, see [this blog post](https://unraid.net/blog/cvd) for details. We recommend upgrading to the latest stable release for additional security updates.
* [Upgrade notes](#upgrade-notes)
* [Known issues](#known-issues)
* [Rolling back](#rolling-back)
* [Bug fixes](#bug-fixes)
* [Linux kernel](#linux-kernel)
* [Base Distro](#base-distro)
* [Security updates](#security-updates)
* [Patches](#patches)