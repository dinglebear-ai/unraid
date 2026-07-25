Version 7.1.1 2025-05-08 | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
This is a small release, containing an updated version of OVMF firmware
which reverts a [commit](https://github.com/tianocore/edk2/commit/efaa102d00)
to resolve an issue that prevents certain VMs (Fedora, Debian, Rocky, other CentOS based distros)
from starting. See also [this discussion](https://github.com/tianocore/edk2/issues/10883).
## Upgrading[​](#upgrading)
### Known issues[​](#known-issues)
This release has a potential data-loss issue where the recent "mover empty disk" feature does not handle split levels on shares correctly. Resolved in 7.1.2.
For other known issues, see the [7.1.0 release notes](/unraid-os/release-notes/7.1.0/#known-issues).
### Rolling back[​](#rolling-back)
Please see the [7.1.0 release notes](/unraid-os/release-notes/7.1.0/#rolling-back).
## Changes vs. [7.1.0](/unraid-os/release-notes/7.1.0/)[​](#changes-vs-710)
### VM Manager[​](#vm-manager)
* Fix: includes updated OVMF firmware to resolve an issue that prevents certain VMs from starting
### Linux kernel[​](#linux-kernel)
* version 6.12.24-Unraid (no change)
### Base distro updates[​](#base-distro-updates)
* ovmf: version unraid202502
## Patches[​](#patches)
No patches are currently available for this release.
* [Upgrading](#upgrading)
* [Known issues](#known-issues)
* [Rolling back](#rolling-back)
* [Changes vs. 7.1.0](#changes-vs-710)
* [VM Manager](#vm-manager)
* [Linux kernel](#linux-kernel)
* [Base distro updates](#base-distro-updates)
* [Patches](#patches)