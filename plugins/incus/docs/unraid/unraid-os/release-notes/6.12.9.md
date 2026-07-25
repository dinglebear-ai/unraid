Version 6.12.9 2024-03-26 | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
## Upgrade notes[​](#upgrade-notes)
This is a bug fix release, resolving a nice collection of problems reported by the community, details below.
We highly recommend that all users upgrade to this release.
### Known issues[​](#known-issues)
#### Out of date plugins[​](#out-of-date-plugins)
Out of date plugins can cause problems, we recommend they be kept current.
#### Call traces and crashes related to macvlan[​](#call-traces-and-crashes-related-to-macvlan)
If you are getting call traces related to macvlan (or any unexplained crashes, really), as a first step
we recommend navigating to ***Settings \> Docker***, switching to **advanced** view, and changing
the **Docker custom network type** from **macvlan** to **ipvlan**. This is the default configuration
that Unraid has shipped with since version 6.11.5 and should work for most systems.
Note that some users have reported issues with port forwarding from certain routers (Fritzbox) and reduced
functionality with advanced network management tools (Ubiquity) when in ipvlan mode. If this affects you,
see the alternate solution available since Unraid [6.12.4](/unraid-os/release-notes/6.12.4/#fix-for-macvlan-call-traces).
#### Network problems due to jumbo frames[​](#network-problems-due-to-jumbo-frames)
If you are having network issues of any kind, confirm that you have not enabled jumbo frames.
Navigate to ***Settings \> Network Settings \> eth0*** and confirm the **Desired MTU** is 1500.
For more information see the [Fix Common Problems warning for jumbo frames](https://forums.unraid.net/topic/120220-fix-common-problems-more-information/page/2/#comment-1167702).
#### Problems due to Realtek network cards[​](#problems-due-to-realtek-network-cards)
Upgraded kernel fixes the deadlock issue with jumbo frames and the in-tree Realtek 8125 driver. However, we
still recommend following the advice above regarding jumbo frames.
If you continue to have network stability issues and ***Tools \> System Devices*** shows that you have a Realtek ethernet controller,
grab the part number shown and search Community Apps to see if there is a Realtek vendor-supplied driver plugin for that device.
For more information, see the [support page for Realtek driver plugins](https://forums.unraid.net/topic/141349-plugin-realtek-r8125-r8168-and-r81526-drivers/).
#### Other issues?[​](#other-issues)
We highly recommend installing the **Fix Common Problems** plugin as it will warn you of common configuration problems.
If you are having other crashes or stability issues, navigate to ***Settings \> Syslog Server*** and
enable **Mirror syslog to flash**. This will cause additional wear and tear on you USB flash boot device but is
useful in the short term for gathering logs after a crash.
After the next reboot, navigate to ***Tools \> Diagnostics*** and download your anonymized diagnostics (as of 6.12.5,
diagnostics automatically include logs that were mirrored to the flash drive).
Finally, start a new topic under [General Support](https://forums.unraid.net/forum/55-general-support/) and provide all the
details of the issue. Once the issue is resolved, be sure to disable **Mirror syslog to flash**.
### Rolling back[​](#rolling-back)
The functionality of "Docker Patch 6.12.8" is now built in to Unraid. If you rollback to 6.12.8 you may want to reinstall that plugin.
If rolling back earlier than 6.12.8, also see the [6.12.8 release notes](/unraid-os/release-notes/6.12.8/#rolling-back).
## Changes vs. [6.12.8](/unraid-os/release-notes/6.12.8/)[​](#changes-vs-6128)
### Bug fixes and improvements[​](#bug-fixes-and-improvements)
* Docker
* Ignore empty paths in config file when adding or updating containers
* Resolve certain issues updating containers
* Fix notifications when container updates are available
* Management Access page
* Resolve issue displaying IPv6 urls
* Remove support for legacy 'unraid.net' SSL certificates, and remove "UpdateDNS"
* Diagnostics: include php error log to help with troubleshooting
* System Drivers: resolve issue with translations that prevented the page from displaying
* UPC:
* Resolve issues with single or double quotes in the server description
* Don't try to start unraid-api if it isn't installed
* Fix redirect error when changing server description or model in http only mode, or
when changing server name in either http or https mode
* Increased /run tmpfs size limit from 32M to 128M
* Introduce delay between creating GPT partition table and telling kernel to re-read
to prevent "device or resource busy" error
* shfs: fix highwater allocation method in association with zfs volumes
* nfs: ensure NFSv4 mounts enabled by default
* Resolve various PHP warnings
* Change default time server for new installs to "time.google.com"
### Linux kernel[​](#linux-kernel)
* version 6.1.82
## Patches[​](#patches)
With the [Unraid Patch plugin](https://forums.unraid.net/topic/185560-unraid-patch-plugin/) installed, visit ***Tools → Unraid Patch*** to get the following patches / hot fixes:
* A subset of security updates, see [this blog post](https://unraid.net/blog/cvd) for details. We recommend upgrading to the latest stable release for additional security updates.
* [Upgrade notes](#upgrade-notes)
* [Known issues](#known-issues)
* [Rolling back](#rolling-back)
* [Changes vs. 6.12.8](#changes-vs-6128)
* [Bug fixes and improvements](#bug-fixes-and-improvements)
* [Linux kernel](#linux-kernel)
* [Patches](#patches)