6.11.3 | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
## Version 6.11.3 2022-11-08[​](#version-6113-2022-11-08)
This release is focused on bug fixes and minor improvements. In particular, we need to revert a base library due to a bug which
prevents formatting devices \>2TB in size.
### Management[​](#management)
* Reverted 'libpopt.so.0.0.1' to workaround 'sgdisk' bug used to format devices larger than 2TB.
* Fixed issue where description setting for 'root' user was not preserved across reboots.
* Fix issue that sometimes information window opens empty.
### VM Manager[​](#vm-manager)
* Set correct values when edit for USB Boot and correct Share Selection.
* Add Nic boot order.
### Base Distro[​](#base-distro)
* gptfdisk: version 1.0.8 (revert from version 1.0.9)
* libXext: version 1.3.5
* libXinerama: version 1.1.5
* libdrm: version 2.4.114
* libedit: version 20221030\_3.1
* mcelog: version 190
* ntfs-3g: version 2022.10.3
* openssl: version 1.1.1s
* openssl-solibs: version 1.1.1s
* pixman: version 0.42.2
* sessreg: version 1.1.3
* sudo: version 1.9.12p1
* xsetroot: version 1.1.3
## Patches[​](#patches)
With the [Unraid Patch plugin](https://forums.unraid.net/topic/185560-unraid-patch-plugin/) installed, visit ***Tools → Unraid Patch*** to get the following patches / hot fixes:
* A subset of security updates, see [this blog post](https://unraid.net/blog/cvd) for details. We recommend upgrading to the latest stable release for additional security updates.
* [Version 6.11.3 2022-11-08](#version-6113-2022-11-08)
* [Management](#management)
* [VM Manager](#vm-manager)
* [Base Distro](#base-distro)
* [Patches](#patches)