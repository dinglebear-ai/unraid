Version 6.12.15 2025-01-21 | Unraid Docs
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
If rolling back earlier than 6.12.14, also see the [6.12.14 release notes](/unraid-os/release-notes/6.12.14/#rolling-back).
## Changes vs. [6.12.14](/unraid-os/release-notes/6.12.14/)[​](#changes-vs-61214)
### Bug fixes and improvements[​](#bug-fixes-and-improvements)
* webgui: Fix memory leak on the Dashboard, VM Manager and Docker Manager pages
* webgui: Bug fix: JavaScript console logging functionality restored
* webgui: Clicking Unraid version number loads release notes from Unraid Docs website
* webgui: Switch CA install URL to new repository
* fix: Set MTU of Docker Wireguard bridge to match Wireguard default MTU
* fix: Correct handling of empty Trial.key when download fails
* fix: Agent notifications do not work if there is a problem with email notifications
* fix: nfsd does not restart properly
* fix: Erase pool dialog does not show the pool name
* Create meaningful /etc/os-release file
* make\_bootable\_linux: version 1.4
* detect if mtools is installed
### Linux kernel[​](#linux-kernel)
* version 6.1.126
* md/unraid: fix handling of device failure during rebuild/sync
### Base distro[​](#base-distro)
* git: version 2.46.3 (CVE-2024-50349 CVE-2024-52006)
* php: version 8.2.27
* rsync: version 3.4.1 (CVE-2024-12084 CVE-2024-12085 CVE-2024-12086 CVE-2024-12087 CVE-2024-12088 CVE-2024-12747)
## Patches[​](#patches)
No patches are currently available for this release, but we recommend installing the
[Unraid Patch plugin](https://forums.unraid.net/topic/185560-unraid-patch-plugin/)
so you get any patches when they become available.
* [Upgrade notes](#upgrade-notes)
* [Known issues](#known-issues)
* [Rolling back](#rolling-back)
* [Changes vs. 6.12.14](#changes-vs-61214)
* [Bug fixes and improvements](#bug-fixes-and-improvements)
* [Linux kernel](#linux-kernel)
* [Base distro](#base-distro)
* [Patches](#patches)