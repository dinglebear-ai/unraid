6.11.4 | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
## Version 6.11.4 2022-11-18[​](#version-6114-2022-11-18)
This release is focused on bug fixes and minor improvements.
### Diagnostics[​](#diagnostics)
* Fix share information in Diagnostics.
### Docker[​](#docker)
* docker: version 20.10.21 (CVE-2022-39253 CVE-2022-2879 CVE-2022-2880 CVE-2022-41715)
* Fix: "please wait" message after removing orphan image.
* Set IPVLAN as default for new installations.
### Samba[​](#samba)
* samba: version 4.17.3 (CVE-2022-42898)
* Set the default "max open files" to the value of 'ulimit -n' which is currently set to 40960.
### VM Manager[​](#vm-manager)
* Allow Network PCI devices to have boot order.
* Change to use libvirt\_domain\_interface\_addresses which has been available for a long
time but was not documented in the API manual. Using this function stops tainted warnings
being written to the log, ex: "Domain id=4 is tainted: custom-ga-command".
* Fix for VM Rename.
### Misc[​](#misc)
* Fixed issue which prevented array Autostart with a Trial key.
* Fixed encoding issue when passwords contain multi-byte UTF-8 characters.
* Parity History: add day of week to date.
* Shares: Fix: do not allow creation of hidden share names.
* Main page: reinitialize disk transfer statistics upon opening new broswer session.
* Management Access page: improved messaging for SSL
* Firefox: version 107.0.r20221110173214 (AppImage)
* When all browser sessions close, stop unnecessary background processes.
### Base Distro[​](#base-distro)
* bash: version 5.2.009
* btrfs-progs: version 6.0.1
* gdk-pixbuf2: version 2.42.10
* glibc-zoneinfo: version 2022f
* intel-microcode: version 20221108
* libX11: version 1.8.2
* libnftnl: version 1.2.4
* nghttp2: version 1.51.0
* php: version 7.4.33 (CVE-2022-31630 CVE-2022-37454)
* sed: version 4.9
* sysstat: version 12.7.1
* xkbevd: version 1.1.5
* xkill: version 1.0.6
* xlsatoms: version 1.1.4
* xlsclients: version 1.1.5
* xz: version 5.2.8
## Patches[​](#patches)
With the [Unraid Patch plugin](https://forums.unraid.net/topic/185560-unraid-patch-plugin/) installed, visit ***Tools → Unraid Patch*** to get the following patches / hot fixes:
* A subset of security updates, see [this blog post](https://unraid.net/blog/cvd) for details. We recommend upgrading to the latest stable release for additional security updates.
* [Version 6.11.4 2022-11-18](#version-6114-2022-11-18)
* [Diagnostics](#diagnostics)
* [Docker](#docker)
* [Samba](#samba)
* [VM Manager](#vm-manager)
* [Misc](#misc)
* [Base Distro](#base-distro)
* [Patches](#patches)