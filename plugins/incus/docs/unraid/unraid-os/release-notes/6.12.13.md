Version 6.12.13 2024-08-22 | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
## Upgrade notes[​](#upgrade-notes)
This is a quick release that updates the Linux kernel to correct
a [regression](https://lore.kernel.org/lkml/45cdf1c2-9056-4ac2-8e4d-4f07996a9267@kernel.org/T/) where some HDD devices could not
be spun-down.
For more details on recent changes, see the [6.12.12 release notes](/unraid-os/release-notes/6.12.12/).
### Known issues[​](#known-issues)
#### Windows VMs should use the VirtIO-net driver[​](#windows-vms-should-use-the-virtio-net-driver)
Due to a kernel regression, there is significant performance degradation for any outgoing transfer from a Windows VM using the VirtIO network driver. The workaround is to switch to the VirtIO-net driver. (Note: this was resolved in [6.12.14](/unraid-os/release-notes/6.12.14/)).
For other known issues, see the [6.12.12 release notes](/unraid-os/release-notes/6.12.12/#known-issues).
### Rolling back[​](#rolling-back)
If rolling back earlier than 6.12.12, also see the [6.12.12 release notes](/unraid-os/release-notes/6.12.12/#rolling-back).
## Changes vs. [6.12.12](/unraid-os/release-notes/6.12.12/)[​](#changes-vs-61212)
### Bug fixes and improvements[​](#bug-fixes-and-improvements)
* Updated kernel to resolve issues spinning down hard drives
### Linux kernel[​](#linux-kernel)
* version 6.1.106
## Patches[​](#patches)
With the [Unraid Patch plugin](https://forums.unraid.net/topic/185560-unraid-patch-plugin/) installed, visit ***Tools → Unraid Patch*** to get the following patches / hot fixes:
* A subset of security updates, see [this blog post](https://unraid.net/blog/cvd) for details. We recommend upgrading to the latest stable release for additional security updates.
* [Upgrade notes](#upgrade-notes)
* [Known issues](#known-issues)
* [Rolling back](#rolling-back)
* [Changes vs. 6.12.12](#changes-vs-61212)
* [Bug fixes and improvements](#bug-fixes-and-improvements)
* [Linux kernel](#linux-kernel)
* [Patches](#patches)