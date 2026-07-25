Version 6.12.6 2023-12-01 | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
## Upgrade notes[​](#upgrade-notes)
This release includes bug fixes and an important patch release of OpenZFS. All users are encouraged to upgrade.
### Known issues[​](#known-issues)
#### Out of date plugins[​](#out-of-date-plugins)
Out of date plugins can cause problems, we recommend they be kept current.
#### Call traces and crashes related to macvlan[​](#call-traces-and-crashes-related-to-macvlan)
If you are getting call traces related to macvlan (or any unexplained crashes, really), as a first step we'd recommend navigating to ***Settings \> Docker***, switching to **advanced** view, and changing the **Docker custom network type** from **macvlan** to **ipvlan**. This is the default configuration that Unraid has shipped with since version 6.11.5 and should work for most systems.
Note that some users have reported issues with port forwarding from certain routers (Fritzbox) and reduced functionality with advanced network management tools (Ubiquity) when in ipvlan mode. If this affects you, see the alternate solution available since Unraid [6.12.4](/unraid-os/release-notes/6.12.4/#fix-for-macvlan-call-traces).
#### Network problems due to jumbo frames[​](#network-problems-due-to-jumbo-frames)
If you are having network issues of any kind, confirm that you haven't enabled jumbo frames. Navigate to ***Settings \> Network Settings \> eth0*** and confirm the **Desired MTU** is 1500. For more information see the [Fix Common Problems warning for jumbo frames](https://forums.unraid.net/topic/120220-fix-common-problems-more-information/page/2/#comment-1167702).
#### Problems due to Realtek network cards[​](#problems-due-to-realtek-network-cards)
Stock Realtek drivers in the latest Linux kernels are causing network and stability issues. If you are having issues and ***Tools \> System Devices*** shows that you have a Realtek ethernet controller, grab the part number shown and search Community Apps to see if there is a Realtek driver plugin for that device. For more information, see the [support page for Realtek driver plugins](https://forums.unraid.net/topic/141349-plugin-realtek-r8125-r8168-and-r81526-drivers/).
#### Adaptec 7 Series HBA not compatible[​](#adaptec-7-series-hba-not-compatible)
If you have an Adaptec 7 Series HBA that uses the aacraid driver, we'd recommend staying on 6.12.4 for now as there is a regression in the driver in the latest kernels. For more information see this [bug report in the Linux kernel](https://bugzilla.kernel.org/show_bug.cgi?id=217599)
#### Other issues?[​](#other-issues)
We highly recommend installing the **Fix Common Problems** plugin as it will warn you of common configuration problems.
Having other crashes or stability issues? Navigate to ***Settings \> Syslog Server*** and enable **Mirror syslog to flash**. This will cause additional wear and tear on the flash drive but is useful in the short term for gathering logs after a crash. After the next reboot, navigate to ***Tools \> Diagnostics*** and download your anonymized diagnostics (as of 6.12.5, diagnostics automatically include logs that were mirrored to the flash drive). Then start a new topic under [General Support](https://forums.unraid.net/forum/55-general-support/) and provide all the details of the issue. Once the issue is resolved, be sure to disable **Mirror syslog to flash**.
### Rolling back[​](#rolling-back)
If rolling back earlier than 6.12.4, also see the [6.12.4 release notes](/unraid-os/release-notes/6.12.4/#rolling-back).
## Changes vs. [6.12.5](/unraid-os/release-notes/6.12.5/)[​](#changes-vs-6125)
### Bug fixes and improvements[​](#bug-fixes-and-improvements)
* modprobe.d/zfs.conf: remove `zfs\_dmu\_offset\_next\_sync=0` mitigation - no longer needed
* network: Fix IPv6 static address assignment
* The workaround for [crashes related to the i915 driver on Rocket Lake systems](/unraid-os/release-notes/6.12.0/#crashes-related-to-i915-driver) is no longer needed.
After upgrading, feel free to open a webterminal and type this, then reboot:
`rm /boot/config/modprobe.d/i915.conf`
### Package updates[​](#package-updates)
* nvme-cli: version 2.6
* zfs: version 2.1.14
### Linux kernel[​](#linux-kernel)
* version 6.1.64
## Patches[​](#patches)
With the [Unraid Patch plugin](https://forums.unraid.net/topic/185560-unraid-patch-plugin/) installed, visit ***Tools → Unraid Patch*** to get the following patches / hot fixes:
* A subset of security updates, see [this blog post](https://unraid.net/blog/cvd) for details. We recommend upgrading to the latest stable release for additional security updates.
* [Upgrade notes](#upgrade-notes)
* [Known issues](#known-issues)
* [Rolling back](#rolling-back)
* [Changes vs. 6.12.5](#changes-vs-6125)
* [Bug fixes and improvements](#bug-fixes-and-improvements)
* [Package updates](#package-updates)
* [Linux kernel](#linux-kernel)
* [Patches](#patches)