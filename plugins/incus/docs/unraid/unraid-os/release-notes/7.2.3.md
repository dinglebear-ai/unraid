Version 7.2.3 2025-12-18 | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
This is a security and bugfix release, recommended for all users.
## Upgrading[​](#upgrading)
For step-by-step instructions, see [Updating Unraid](/unraid-os/updating-unraid/). Questions about your [license](/unraid-os/troubleshooting/licensing-faq/#license-types--features)?
### Known issues[​](#known-issues)
For other known issues, see the [7.2.2 release notes](/unraid-os/release-notes/7.2.2/#known-issues).
### Rolling back[​](#rolling-back)
If rolling back earlier than 7.2.2, also see the [7.2.2 release notes](/unraid-os/release-notes/7.2.2/#rolling-back).
## Changes vs. [7.2.2](/unraid-os/release-notes/7.2.2/)[​](#changes-vs-722)
### Storage[​](#storage)
* Fix: Upgraded Samba to resolve issues with Time Machine
* Fix: Precleared disk signature only detected after a reboot
### webGUI[​](#webgui)
* Fix: Regression in how gradients are applied over background images in header
* Fix: Notification text is sometimes shown in wrong colors, making it hard to read
* Fix: Potential XSS issue when testing SMTP config on ***Settings → Notification Settings → SMTP Settings***
### Misc[​](#misc)
* Fix: DNS settings could be overwritten by other devices on the network (disable avahidnsconfd)
* Fix: Readme not populating on Docker XML templates
* Fix: Missing novnc files causing warnings in syslog
### Unraid API[​](#unraid-api)
* dynamix.unraid.net 4.28.2 - [see changes](https://github.com/unraid/api/releases)
### Linux kernel[​](#linux-kernel)
* version 6.12.54-Unraid (no change)
### Base distro updates[​](#base-distro-updates)
* samba: version 4.23.4
* [Upgrading](#upgrading)
* [Known issues](#known-issues)
* [Rolling back](#rolling-back)
* [Changes vs. 7.2.2](#changes-vs-722)
* [Storage](#storage)
* [webGUI](#webgui)
* [Misc](#misc)
* [Unraid API](#unraid-api)
* [Linux kernel](#linux-kernel)
* [Base distro updates](#base-distro-updates)