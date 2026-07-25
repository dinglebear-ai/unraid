6.10.1 | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
## Version 6.10.1 2022-05-21[​](#version-6101-2022-05-21)
Some users boot from USB flash partition other than "1". That is,
instead of /dev/sda1 some users have /dev/sda2 set as volume label
UNRAID and there are even users who have no partitions at all on the
flash. In this case it boots from and mounts /dev/sda onto /boot.
A change in 6.10.0 in detecting the boot device with label UNRAID
introduced a regression where only partition 1 was considered, leaving
those users unable to complete the boot sequence.
This is fixed in 6.10.1 - and this is the only functional change in
6.10.1 vs. 6.10.0.
## Change Log vs. Unraid OS 6.10.0[​](#change-log-vs-unraid-os-6100)
#### Management[​](#management)
* startup: fix regression: support USB flash boot from other than partition 1
## Patches[​](#patches)
With the [Unraid Patch plugin](https://forums.unraid.net/topic/185560-unraid-patch-plugin/) installed, visit ***Tools → Unraid Patch*** to get the following patches / hot fixes:
* A subset of security updates, see [this blog post](https://unraid.net/blog/cvd) for details. We recommend upgrading to the latest stable release for additional security updates.
* [Version 6.10.1 2022-05-21](#version-6101-2022-05-21)
* [Change Log vs. Unraid OS 6.10.0](#change-log-vs-unraid-os-6100)
* [Patches](#patches)