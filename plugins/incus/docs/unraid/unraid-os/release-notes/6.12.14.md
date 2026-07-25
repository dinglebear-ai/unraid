Version 6.12.14 2024-11-26 | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
## Upgrade notes[​](#upgrade-notes)
This release includes important bug fixes and security updates.
***ALL USERS ARE STRONGLY ENCOURAGED TO UPGRADE***
### Known issues[​](#known-issues)
#### New Windows changes may result in loss of access to Public shares[​](#new-windows-changes-may-result-in-loss-of-access-to-public-shares)
Due to recent security changes in Windows 11 24H2, "guest" access of Unraid public shares may not work. The easiest
way around this is to create a user in Unraid with the same name as the Windows account you are using to connect. If the Unraid
user password is not the same as the Windows account password, Windows will prompt for credentials.
If you are using a Microsoft account, it may be better to create a user in Unraid with a simple username, set a password,
then in Windows go to ***Control Panel → Credential Manager → Windows credentials → Add a Windows Credential*** and add the
correct Unraid server name and credentials.
Alternately you can [re-enable Windows guest fallback](https://techcommunity.microsoft.com/blog/filecab/accessing-a-third-party-nas-with-smb-in-windows-11-24h2-may-fail/4154300)
(not recommended).
#### Problems due to Realtek network cards[​](#problems-due-to-realtek-network-cards)
There have been multiple reports of issues with the Realtek driver plugin after upgrading to recent kernels. You may want to preemptively uninstall it before upgrading, or remove it afterwards if you have networking issues.
For other known issues, see the [6.12.12 release notes](/unraid-os/release-notes/6.12.12/#known-issues).
### Rolling back[​](#rolling-back)
If rolling back earlier than 6.12.13, also see the [6.12.13 release notes](/unraid-os/release-notes/6.12.13/#rolling-back).
## Changes vs. [6.12.13](/unraid-os/release-notes/6.12.13/)[​](#changes-vs-61213)
### Bug fixes and improvements[​](#bug-fixes-and-improvements)
* emhttpd: Fix swap-disable operation not properly clearing remaining space on target
* ShareList: present indicator when a share primary pool is invalid, for example, has been renamed or deleted.
* ShareEdit: warn user that renaming a pool could affect shares which use that pool.
* DiskSettings: clarify that "default file system" applies to unRAID array disks.
* Remove ps.txt from diagnostics so as not to expose container VPN credentials.
* Add help text about public share access from Windows 11 24H2.
* Update Feedback form and require email address
* Fixed link to apcupsd manual on ***Settings → UPS Settings*** page
* Fixed link to btrfs man-page in Help text
* rc.docker - Make sure that custom interfaces with a higher index then 0 are properly rebuilt
* rc.rsyslogd: use pgrep, killall with PID namespace.
* webGUI: improved handling of http query parameters
* kernel: resolved performance degradation issues related to Windows VMs and the VirtIO network driver that were introduced in [6.12.13](/unraid-os/release-notes/6.12.13/)
### Linux kernel[​](#linux-kernel)
* version 6.1.118
### Base distro[​](#base-distro)
* firefox: version 132.0.r20241110231641 (AppImage) (CVE-2024-11691 - 11699)
* intel-microcode: version 20241112
* libssh: version 0.10.6
* libssh2: version 1.11.1 (CVE-2023-48795)
* openssl: version 1.1.1zb (CVE-2024-9143)
* php: version 8.2.26 [Multiple CVE](https://www.php.net/ChangeLog-8.php#8.2.26)
* samba: version 4.19.9 (CVE-2018-14628)
* wget: version 1.25.0 (CVE-2024-10524)
## Patches[​](#patches)
No patches are currently available for this release, but we recommend installing the
[Unraid Patch plugin](https://forums.unraid.net/topic/185560-unraid-patch-plugin/)
so you get any patches when they become available.
Note that additional security updates are available in newer releases,
see [this blog post](https://unraid.net/blog/cvd) for details.
* [Upgrade notes](#upgrade-notes)
* [Known issues](#known-issues)
* [Rolling back](#rolling-back)
* [Changes vs. 6.12.13](#changes-vs-61213)
* [Bug fixes and improvements](#bug-fixes-and-improvements)
* [Linux kernel](#linux-kernel)
* [Base distro](#base-distro)
* [Patches](#patches)