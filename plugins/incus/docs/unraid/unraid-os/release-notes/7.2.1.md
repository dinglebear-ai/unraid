Version 7.2.1 2025-11-19 | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
This is a small update with some great fixes and improvements.
## Upgrading[​](#upgrading)
For step-by-step instructions, see [Updating Unraid](/unraid-os/updating-unraid/). Questions about your [license](/unraid-os/troubleshooting/licensing-faq/#license-types--features)?
### Known issues[​](#known-issues)
For other known issues, see the [7.2.0 release notes](/unraid-os/release-notes/7.2.0/#known-issues).
### Rolling back[​](#rolling-back)
If rolling back earlier than 7.2.0, also see the [7.2.0 release notes](/unraid-os/release-notes/7.2.0/#rolling-back).
## Changes vs. [7.2.0](/unraid-os/release-notes/7.2.0/)[​](#changes-vs-720)
### webGUI[​](#webgui)
* Improvement: On ***Settings → Schedule → Mover Settings*** add a *Disable* option to *Mover schedule*
* Fix: Dashboard: Improved detection of newer Intel CPUs
* Fix: Notification Agents dropdown not working in tabbed mode
* Fix: Visual error displaying temperatures in notifications
* Fix: Improve search, language, and array usage on sidebar themes
* Fix: GUI Search results didn't update when plugins were uninstalled
* Fix: When editing a Share, on the *NFS Security Settings* tab, the *Write settings to* feature did not work for security modes Public and Secure
* Fix: *Show banner background color fade* works again
* Fix: Reduce header background flash going from black to white on page load
### Storage[​](#storage)
* Improvement: When a pool's File System Type is set to 'Auto', all pool slots must be populated
* Improvement: New Config with Preserve Assignments will reduce pool slots to match the number of disks present
* Fix: Remount dataset if 'zfs destroy' fails because dataset is busy
* Fix: If a share is created without a config file, ensure data is only stored on pools that are participating in user shares
* Fix: DeviceInfo: Only show 'Pool Device Status' section when pool is mounted
* Fix: Empty Disk feature: share data on target disk(s) now remains visible during operation, see [Converting to a new file system type](/unraid-os/using-unraid-to/manage-storage/file-systems/#converting-to-a-new-file-system-type) for usage details.
* Removed '-e' option from 'mover' script; use the webGUI now
* Fix: Reduce excess logging related to drive spin down and SMART self-tests
* Fix: Increase pool device limit from 120 to 200
* Fix: Suppress confusing "Share cache full" messages in syslog
* Fix: Correct /mnt/user permissions issue
### Misc[​](#misc)
* Fix: Improve WSD discovery on your local network (so Unraid appears in Windows Network, formerly Network Neighborhood)
* Generate unique /boot/config/machine-id and install to /etc/machine-id on boot
* Patch wsdd2 to work when "Host access to custom networks" is enabled
* Note: discovery typically does not work if clients are running Tailscale
* Fix: Update 'lshw' to support LEDs on Lincstation systems
* Fix: Re-add the 'Join' Notification Agent from Unraid 6.12
* Fix: Load br\_netfilter in rc.inet1 'start' function and set default IPv4/IPv6 forwarding policy to ACCEPT (should fix VM IPv6 issues)
* Fix: Starting Docker causes all IPv6 packets on br0 to be dropped
* Fix: When stopping Samba, terminate master smbd process first
* Fix: Add support for "Intel Corporation Alder Lake-N PCH CNVi WiFi" interface
### Unraid API[​](#unraid-api)
* Fix: Ensure Connect features are fully disabled unless Connect is installed
* dynamix.unraid.net 4.27.0 - [see changes](https://github.com/unraid/api/releases)
### Linux kernel[​](#linux-kernel)
* version 6.12.54-Unraid (no change)
### Base distro updates[​](#base-distro-updates)
* lshw: version B.02.20
* wsdd2-1.8.7-x86\_64-2\_SBo\_LT.tgz
* kernel-firmware: version 20251031\_04b323b
* intel-microcode: version 20251111
* [Upgrading](#upgrading)
* [Known issues](#known-issues)
* [Rolling back](#rolling-back)
* [Changes vs. 7.2.0](#changes-vs-720)
* [webGUI](#webgui)
* [Storage](#storage)
* [Misc](#misc)
* [Unraid API](#unraid-api)
* [Linux kernel](#linux-kernel)
* [Base distro updates](#base-distro-updates)