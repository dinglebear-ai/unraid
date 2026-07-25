Version 7.1.4 2025-06-18 | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
This is a bugfix release mainly focused on networking issues.
## Upgrading[​](#upgrading)
### Known issues[​](#known-issues)
Please also see the [7.1.0 release notes](/unraid-os/release-notes/7.1.0/#known-issues).
### Rolling back[​](#rolling-back)
Please see the [7.1.0 release notes](/unraid-os/release-notes/7.1.0/#rolling-back).
## Changes vs. [7.1.3](/unraid-os/release-notes/7.1.3/)[​](#changes-vs-713)
### Networking[​](#networking)
* Fix: Reverted: Improved automatic metric assignments
* Fix: Prevent interface monitoring script from deleting the default route in certain circumstances
* Fix: Ensure disabled default routes are not used
### Docker[​](#docker)
* Fix: Don't limit Docker subnets to /25
* Fix: Don't show APIPA IP when a better one is available
* Note: If a Docker container with a static IP address doesn't start, edit the container and review the assigned IP address.
The IP must be included in one of the subnets listed. The subnets are defined on ***Settings → Docker Settings***.
### VMs[​](#vms)
* Fix: Custom virbr interfaces missing
* Fix: MAC assignment was regenerated each time a different interface was selected
### Storage[​](#storage)
* Fix: Respect **Autotrim** setting when mounting BTRFS and XFS drives
### webGUI[​](#webgui)
* Fix: File manager: fixed missing icon in footer when job is minimized
* Fix: File manager: respect **Overwrite existing files** setting when moving files
* Fix: Prevent changing pool Compression/Autotrim settings when array is started
### Linux kernel[​](#linux-kernel)
* version 6.12.24-Unraid (no change)
## Patches[​](#patches)
No patches are currently available for this release.
* [Upgrading](#upgrading)
* [Known issues](#known-issues)
* [Rolling back](#rolling-back)
* [Changes vs. 7.1.3](#changes-vs-713)
* [Networking](#networking)
* [Docker](#docker)
* [VMs](#vms)
* [Storage](#storage)
* [webGUI](#webgui)
* [Linux kernel](#linux-kernel)
* [Patches](#patches)