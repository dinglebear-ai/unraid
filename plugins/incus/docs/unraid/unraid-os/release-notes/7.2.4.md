Version 7.2.4 2026-02-24 | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
This release includes critical security updates and bug fixes.
***ALL USERS ARE STRONGLY ENCOURAGED TO UPGRADE***
## Upgrading[​](#upgrading)
For step-by-step instructions, see [Updating Unraid](/unraid-os/updating-unraid/). Questions about your [license](/unraid-os/troubleshooting/licensing-faq/)?
### Known issues[​](#known-issues)
For other known issues, see the [7.2.3 release notes](/unraid-os/release-notes/7.2.3/).
### Rolling back[​](#rolling-back)
If rolling back earlier than 7.2.3, also see the [7.2.3 release notes](/unraid-os/release-notes/7.2.3/).
## Changes vs. [7.2.3](/unraid-os/release-notes/7.2.3/)[​](#changes-vs-723)
### Misc[​](#misc)
* Fix: Downgrade samba to fix issues with Time Machine
* Fix: Auto-restart SSH daemon after network recovery, thanks to [mgutt](https://github.com/mgutt)
* Fix: Issues parsing ip addr output when interface contains peer information, thanks to [ap-wtioit](https://github.com/ap-wtioit)
### Unraid API[​](#unraid-api)
* dynamix.unraid.net 4.29.2 - [see changes](https://github.com/unraid/api/releases)
### Linux kernel[​](#linux-kernel)
* version 6.12.54-Unraid (no change)
### Base distro updates[​](#base-distro-updates)
* samba: version 4.22.8 (downgrade)
* libssh: version 0.12.0 (CVE-2026-0964, CVE-2026-0965, CVE-2026-0966, CVE-2026-0967, CVE-2026-0968, CVE-2025-14821)
* [Upgrading](#upgrading)
* [Known issues](#known-issues)
* [Rolling back](#rolling-back)
* [Changes vs. 7.2.3](#changes-vs-723)
* [Misc](#misc)
* [Unraid API](#unraid-api)
* [Linux kernel](#linux-kernel)
* [Base distro updates](#base-distro-updates)