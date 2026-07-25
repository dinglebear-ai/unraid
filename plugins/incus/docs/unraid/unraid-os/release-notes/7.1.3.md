Version 7.1.3 2025-06-04 | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
This is a small bugfix and security update release.
## Upgrading[​](#upgrading)
### Known issues[​](#known-issues)
* Some users are having networking issues in this release, please upgrade to [7.1.4](/unraid-os/release-notes/7.1.4/)
* Please also see the [7.1.0 release notes](/unraid-os/release-notes/7.1.0/#known-issues).
### Rolling back[​](#rolling-back)
Please see the [7.1.0 release notes](/unraid-os/release-notes/7.1.0/#rolling-back).
## Changes vs. [7.1.2](/unraid-os/release-notes/7.1.2/)[​](#changes-vs-712)
### Networking[​](#networking)
* Fix: Allow static IP assignments to co-exist with wireless
* Fix: Improved automatic metric assignments
* Fix: Improved IP selection on interfaces
### Docker[​](#docker)
* Fix: Allow docker host access on wireless interface
* Fix: Fix shim-br0 interface sometimes not created, which could cause problems with host access to custom networks on br0
### Storage[​](#storage)
* Fix: mover: remove empty dirs that may remain after emptying a disk containing hardlinks
* Fix: Get partition number and partitioning scheme directly instead of using 'lsblk' command
* Fix: /mnt/user0/sharename sometimes does not respect share allocation methods
### webGUI[​](#webgui)
* Fix: Encryption passphrase sometimes incorrect
* Fix: Revert allow docker context menus above or below
### Linux kernel[​](#linux-kernel)
* version 6.12.24-Unraid (no change)
### Base distro updates[​](#base-distro-updates)
* curl-8.14.0-x86\_64-1 (CVE-2025-5025 CVE-2025-4947)
## Patches[​](#patches)
No patches are currently available for this release.
* [Upgrading](#upgrading)
* [Known issues](#known-issues)
* [Rolling back](#rolling-back)
* [Changes vs. 7.1.2](#changes-vs-712)
* [Networking](#networking)
* [Docker](#docker)
* [Storage](#storage)
* [webGUI](#webgui)
* [Linux kernel](#linux-kernel)
* [Base distro updates](#base-distro-updates)
* [Patches](#patches)