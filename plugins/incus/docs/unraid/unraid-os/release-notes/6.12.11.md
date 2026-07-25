Version 6.12.11 2024-07-16 | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
## Upgrade notes[​](#upgrade-notes)
These release has some nice bug fixes backported from our work on Unraid 7, along with a security fix for OpenSSH and
updates to the Linux kernel and OpenZFS.
### Known issues[​](#known-issues)
#### Out of date plugins[​](#out-of-date-plugins)
Out of date plugins can cause problems, we recommend they be kept current.
#### Docker fork bomb[​](#docker-fork-bomb)
A broken or malicious Docker container can use all available Process IDs on the system, leading to instability. We are testing
a fix in Unraid 7 and will backport it to a future release (Note: this fix is in [6.12.12](/unraid-os/release-notes/6.12.12/)).
If you suspect you are affected by this, a workaround is to
limit the number of PIDs a container can use by adding `--pids-limit 2048` to the Docker template *Extra Parameters* setting.
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
If rolling back earlier than 6.12.10, also see the [6.12.10 release notes](/unraid-os/release-notes/6.12.10/#rolling-back).
## Changes vs. [6.12.10](/unraid-os/release-notes/6.12.10/)[​](#changes-vs-61210)
### Bug fixes and improvements[​](#bug-fixes-and-improvements)
* Fix Error 500 on login
* Dashboard
* Fix tile management showing a blank dialog
* Clean up visibility cookies left in malformed state
* VMs
* Fix changing from bridge value does not update VMs with more than one NIC and the VM Fails to start
* Fix removing gpu and adding virtual can result in no output
* Make trim consistent between "trim now" and cron job
### Linux kernel[​](#linux-kernel)
* version 6.1.99
* zfs: version 2.1.15
### Base distro[​](#base-distro)
* openssh: version 9.8p1 (CVE-2024-6387)
## Patches[​](#patches)
With the [Unraid Patch plugin](https://forums.unraid.net/topic/185560-unraid-patch-plugin/) installed, visit ***Tools → Unraid Patch*** to get the following patches / hot fixes:
* A subset of security updates, see [this blog post](https://unraid.net/blog/cvd) for details. We recommend upgrading to the latest stable release for additional security updates.
* [Upgrade notes](#upgrade-notes)
* [Known issues](#known-issues)
* [Rolling back](#rolling-back)
* [Changes vs. 6.12.10](#changes-vs-61210)
* [Bug fixes and improvements](#bug-fixes-and-improvements)
* [Linux kernel](#linux-kernel)
* [Base distro](#base-distro)
* [Patches](#patches)