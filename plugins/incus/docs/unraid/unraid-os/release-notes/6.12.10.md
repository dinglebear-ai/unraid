Version 6.12.10 2024-04-03 | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
## Upgrade notes[​](#upgrade-notes)
This release reverts to an earlier version of the Linux kernel to resolve two issues being reported
in 6.12.9. It also includes a 'curl' security update and corner case bug fix.
Note: Unraid OS v6.12.x and all earlier versions are **not** vulnerable to the xz backdoor [CVE-2024-3094](https://nvd.nist.gov/vuln/detail/CVE-2024-3094).
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
If rolling back earlier than 6.12.9, also see the [6.12.9 release notes](/unraid-os/release-notes/6.12.9/#rolling-back).
## Changes vs. [6.12.9](/unraid-os/release-notes/6.12.9/)[​](#changes-vs-6129)
### Bug fixes and improvements[​](#bug-fixes-and-improvements)
* Resolve issues mounting remote SMB shares via the Unassigned Devices plugin.
* Resolve issues with certain Asmedia controllers not seeing all the attached devices.
* nfs: (revert) NFSv4 mounts by default
* zfs: Detect if insufficient pools slots are defined for an imported pool with a missing device.
* Fix translations issue with SystemDrivers
### Linux kernel[​](#linux-kernel)
* version 6.1.79
### Base distro[​](#base-distro)
* curl: version: 8.7.1 (CVE-2024-2466 CVE-2024-2398 CVE-2024-2379 CVE-2024-2004)
## Patches[​](#patches)
With the [Unraid Patch plugin](https://forums.unraid.net/topic/185560-unraid-patch-plugin/) installed, visit ***Tools → Unraid Patch*** to get the following patches / hot fixes:
* A subset of security updates, see [this blog post](https://unraid.net/blog/cvd) for details. We recommend upgrading to the latest stable release for additional security updates.
* [Upgrade notes](#upgrade-notes)
* [Known issues](#known-issues)
* [Rolling back](#rolling-back)
* [Changes vs. 6.12.9](#changes-vs-6129)
* [Bug fixes and improvements](#bug-fixes-and-improvements)
* [Linux kernel](#linux-kernel)
* [Base distro](#base-distro)
* [Patches](#patches)