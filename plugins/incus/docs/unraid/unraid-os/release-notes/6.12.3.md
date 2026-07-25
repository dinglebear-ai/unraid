Version 6.12.3 2023-07-14 | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
Changes vs. [6.12.2](/unraid-os/release-notes/6.12.2/)
## Upgrade notes[​](#upgrade-notes)
### Known issues[​](#known-issues)
Please see the [6.12.0 release notes](/unraid-os/release-notes/6.12.0/#known-issues) for general known issues.
### Rolling back[​](#rolling-back)
If rolling back earlier than 6.12.0, also see the [6.12.0 release notes](/unraid-os/release-notes/6.12.0/#rolling-back).
## Networking[​](#networking)
This release has fixes for networking, particularly as it relates to IPv6. A side effect is that this should resolve
an issue where the WebGUI will not load in certain instances.
Note: If you have code in your 'go' script to disable IPv6, remove that and disable it via the 'Settings/Network Settings'
page instead. Manually disabling IPv6 will cause conflicts.
## Docker[​](#docker)
This release resolves an issue where Docker does not properly stop when the array Stops, which can result in an unclean shutdown.
If Docker containers have issues starting after a while, and you are running Plex, go to your Plex Docker container settings,
switch to advanced view, and add this to the Extra Params: `--no-healthcheck`
## Bug fixes and improvements[​](#bug-fixes-and-improvements)
* rc.docker:
* revised docker daemon running check
* rc.docker: change route metric of main interface as needed to avoid conflict with shim interface with shim interface
* rc.library:
* code optimization for ipv6 max/min
* support ipv4 mapped addresses
* rc.nginx: explicit ipv4/ipv6 selection on lo interface
* shfs: correct share size calculation when ZFS is one of the volumes
* WebGUI:
* VM settings page: fixed typo
* Share Edit page: make minimum free space settings always available
* Wireguard: fix typo in Ipv6 mask
* Routing table: fix display of metric value when zero
## Linux kernel[​](#linux-kernel)
* version 6.1.38
* Added support to monitor and also limit power on Intel Core (2nd Gen+) CPU models:
* CONFIG\_POWERCAP: Generic powercap sysfs driver
* CONFIG\_INTEL\_RAPL: Intel RAPL Support via MSR Interface
* CONFIG\_IDLE\_INJECT: Idle injection framework
## Base Distro[​](#base-distro)
* firefox: version 115.0.r20230710165010 (AppImage)
## Patches[​](#patches)
With the [Unraid Patch plugin](https://forums.unraid.net/topic/185560-unraid-patch-plugin/) installed, visit ***Tools → Unraid Patch*** to get the following patches / hot fixes:
* A subset of security updates, see [this blog post](https://unraid.net/blog/cvd) for details. We recommend upgrading to the latest stable release for additional security updates.
* [Upgrade notes](#upgrade-notes)
* [Known issues](#known-issues)
* [Rolling back](#rolling-back)
* [Networking](#networking)
* [Docker](#docker)
* [Bug fixes and improvements](#bug-fixes-and-improvements)
* [Linux kernel](#linux-kernel)
* [Base Distro](#base-distro)
* [Patches](#patches)