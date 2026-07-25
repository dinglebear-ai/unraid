Version 6.12.5 2023-11-27 | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
## Upgrade notes[​](#upgrade-notes)
This release includes bug fixes and security updates. All users are encouraged to upgrade.
### Known issues[​](#known-issues)
There is a mitigation included for a [ZFS Data Corruption](https://github.com/openzfs/zfs/issues/15526) issue. This is accomplished
by including this option in the default `/etc/modprobe.d/zfs.conf` file:
`zfs\_dmu\_offset\_next\_sync=0`
Please see the [6.12.0 release notes](/unraid-os/release-notes/6.12.0/#known-issues) for general known issues.
### Rolling back[​](#rolling-back)
If rolling back earlier than 6.12.4, also see the [6.12.4 release notes](/unraid-os/release-notes/6.12.4/#rolling-back).
## Changes vs. [6.12.4](/unraid-os/release-notes/6.12.4/)[​](#changes-vs-6124)
### Bug fixes and improvements[​](#bug-fixes-and-improvements)
* Replace very old 'MemTest86+' with Memtest86+ version: 6.20
* There are also [Boot Options](https://github.com/memtest86plus/memtest86plus#boot-options) available.
* When 'mirror syslog to flash' is enabled, view syslog-previous at Tools -\> Syslog, and in diagnostics
* Docker:
* Docker containers were not always stopping, preventing docker from unmounting
* Docker containers using IPv6 on custom networks were unable to start
* emhttpd: if User Shares not enabled, update\_cron was not called during array Start sequence
* rc.nginx stop - force nginx to stop
* shfs: Allocation method was not working correctly if 6 or more disks were specified in the 'include' mask
* webgui:
* Downgrade.php was not updated for 6.12
* always show ipvlan / macvlan setting
* ZFS: use 'zfs import -f' to ensure pools from other systems get imported
* prevent auto-spindown of unformatted devices
### Package updates[​](#package-updates)
* curl: version 8.4.0 (CVE-2023-38546 CVE-2023-38545 CVE-2023-38039)
* firefox: version 119.0.r20231106151204 (AppImage)
* intel-microcode: version 20231114
* kernel-firmware: 20231024\_4ee0175
* qemu: version 7.2.0
* samba: version 4.17.12 (CVE-2023-3961 CVE-2023-4091 CVE-2023-4154 CVE-2023-42669 CVE-2023-42670)
* smartmontools: version 7.4
* zfs: version 2.1.13
### Linux kernel[​](#linux-kernel)
* version 6.1.63
* CONFIG\_USB\_NET\_CDC\_NCM: CDC NCM support
* CONFIG\_NFS\_V4\_1: NFS client support for NFSv4.1
* CONFIG\_NFS\_V4\_1\_MIGRATION: NFSv4.1 client support for migration
* CONFIG\_NFS\_V4\_2: NFS client support for NFSv4.2
* CONFIG\_NFS\_V4\_2\_READ\_PLUS: NFS: Enable support for the NFSv4.2 READ\_PLUS operation
* CONFIG\_NFSD\_V4\_2\_INTER\_SSC: NFSv4.2 inter server to server COPY
## Patches[​](#patches)
With the [Unraid Patch plugin](https://forums.unraid.net/topic/185560-unraid-patch-plugin/) installed, visit ***Tools → Unraid Patch*** to get the following patches / hot fixes:
* A subset of security updates, see [this blog post](https://unraid.net/blog/cvd) for details. We recommend upgrading to the latest stable release for additional security updates.
* [Upgrade notes](#upgrade-notes)
* [Known issues](#known-issues)
* [Rolling back](#rolling-back)
* [Changes vs. 6.12.4](#changes-vs-6124)
* [Bug fixes and improvements](#bug-fixes-and-improvements)
* [Package updates](#package-updates)
* [Linux kernel](#linux-kernel)
* [Patches](#patches)