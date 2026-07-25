Version 6.12.8 2024-02-15 | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
## Upgrade notes[​](#upgrade-notes)
This release has two very important fixes. First, we updated Docker to incorporate fixes for their
[recent security advisory](https://www.docker.com/blog/docker-security-advisory-multiple-vulnerabilities-in-runc-buildkit-and-moby/).
Second, we fixed a corner case bug which can lead to data loss if a newly added array drive has a non-standard partition
layout. If you add one of these drives, the second time you start the array the drive will show as unformatted. If this happens
please contact support and we can help you with data recovery. Even if you have not encountered this issue, we recommend upgrading
so that you will not be affected when adding drives in the future.
This release also includes some nice fixes in networking, Docker containers, Time Machine support, and VMs as well as fix for a
slowdown some systems were having on the Dashboard. We have also improved the SMART attribute handling for NVME and SSD drives.
Details below.
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
Be aware that rolling back to an earlier release will make your system vulnerable to the Docker security issues and potential data loss scenario mentioned in [Upgrade notes](#upgrade-notes).
If rolling back earlier than 6.12.6, also see the [6.12.6 release notes](/unraid-os/release-notes/6.12.6/#rolling-back).
## Changes vs. 6.12.7[​](#changes-vs-6127)
Fixed an issue related to upgrading from rc releases.
## Changes vs. [6.12.6](/unraid-os/release-notes/6.12.6/)[​](#changes-vs-6126)
### Bug fixes and improvements[​](#bug-fixes-and-improvements)
* Docker:
* Fix WG routes added to the correct interface (br0 or eth0 or bond0)
* Use "lazy unmount" unmount of docker image to prevent blocking array stop
* Updated to address multiple security issues (CVE-2024-21626, CVE-2024-24557)
* Networking improvements:
* Boot faster by checking for carrier before assigning DHCP addresses
* Remove leading zeros from IPv4 and IPv6 addresses
* New '/etc/rc.d/rc.inet1 status' and '/etc/rc.d/rc.inet1 status ip' commands to aid with network troubleshooting from the command line
* Notifications: Add ntfy.sh to notification agents
* SMART improvements:
* Fix NVME Selftest
* Fix display of 'Accumulated power on time, hours:minutes xxxxx:yy' SMART attribute
* Display KB/MB/GB/TB written in SMART Attributes for SSDs
* Add 'SSD endurance remaining' SMART Attribute
* System logging:
* By default, syslog is copied to USB boot flash on shutdown, see ***Settings \> Syslog Server*** to disable
* Logs from the above and **Mirror syslog to flash** are now available the next boot on ***Tools \> Syslog*** and in diagnostics
* VM Manager: Fix for downgrade: if the VM template has been updated to the latest QEMU machine type it will not be
found upon downgrade. This change finds latest current version for a given machine type.
* ZFS: Use zpool import "-f" flag to permit import of foreign pools
* Other:
* Enable EFI boot by default for fresh installations
* Fix slowdown on Dashboard and Docker pages (and reduces flash device writes)
* Formatting: do not initialize device partition layout if already valid.
* Update OS: redesigned Update OS and Downgrade OS pages, refer to [blog post](https://unraid.net/blog/new-update-os-tool)
* Fix MacOS unable to write 'flash' share and restore Time Machine compatibility (fruit changes)
* Allow Community Apps (if installed) to automatically start containers when doing a multi-install
* Feedback form: change DONE button to CANCEL
### Package updates[​](#package-updates)
* docker: version 24.0.9
* kernel-firmware: version 20231226\_abfcad8
### Linux kernel[​](#linux-kernel)
* version 6.1.74
* CONFIG\_USB\_SERIAL\_XR: USB MaxLinear/Exar USB to Serial driver
* CONFIG\_CAN: CAN bus subsystem support
* CONFIG\_CAN\_NETLINK: CAN device drivers with Netlink support
* CONFIG\_CAN\_GS\_USB: Geschwister Schneider UG and candleLight compatible interfaces
* CONFIG\_SCSI\_LPFC: Emulex LightPulse Fibre Channel Support
## Patches[​](#patches)
With the [Unraid Patch plugin](https://forums.unraid.net/topic/185560-unraid-patch-plugin/) installed, visit ***Tools → Unraid Patch*** to get the following patches / hot fixes:
* A subset of security updates, see [this blog post](https://unraid.net/blog/cvd) for details. We recommend upgrading to the latest stable release for additional security updates.
* [Upgrade notes](#upgrade-notes)
* [Known issues](#known-issues)
* [Rolling back](#rolling-back)
* [Changes vs. 6.12.7](#changes-vs-6127)
* [Changes vs. 6.12.6](#changes-vs-6126)
* [Bug fixes and improvements](#bug-fixes-and-improvements)
* [Package updates](#package-updates)
* [Linux kernel](#linux-kernel)
* [Patches](#patches)