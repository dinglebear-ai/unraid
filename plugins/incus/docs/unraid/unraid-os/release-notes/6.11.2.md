6.11.2 | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
## Version 6.11.2 2022-11-04[​](#version-6112-2022-11-04)
This release is focused on bug fixes and minor improvements. Please note there are important
security mitigations in Samba, all uses are encouraged to update.
### VM Manager[​](#vm-manager)
If you boot a VM from a passed physical USB device there is a new setting called **Enable USB boot** which
must be set to **Yes**. This is due to feature change in the latest OVMF component.
Changes:
* Add boot order for USB and USB Boot option. Using 'boot order' field VM can boot from
a passed-through NVMe controller/device.
* Add virtiofs/9p Unraid share mapping.
* CD Hotplug bug fix.
* Fix Hotplug within Templates.
* Fix changing from passthru to custom CPU.
* Test for guest agent to suppress error message in libvirt log, and
show text for guest not running or guest agent is not installed.
* Fix unable to change HyperV settings.
* Add 'start with console' option.
* OVMF for QEMU: version edk2-stable202208
### WireGuard[​](#wireguard)
Changes:
* Fixed problem setting up tunnels if using default network.cfg settings.
* Fix typo setting up routes.
### Plugin manager[​](#plugin-manager)
Changes:
* If plugin files cannot be read from CDN URL, fall back to non-CDN URL.
* Enforce plugin files must end in '.plg'.
* Fix post hook failing when plugin download fails.
* Adjust the wget parameters to keep it from indefinitely hanging.
### Scheduler[​](#scheduler)
For scheduled Parity Checks, change default mode to Non-correcting. In case there are disk
issues during a parity check it would be safer to have the default be non-correct. If sync errors
are detected then the user can analyze the log and act accordingly.
### Misc. WebGUI[​](#misc-webgui)
Changes:
* DashStats: The inbound networkstats is out of place when numeric value is xxx.x.
* Docker: Add/clarify Help to Docker Custom Network settings.
* Docker: Fix display aberration on orphan images
* SMART attributes: clarify message: "Can not read attributes" to "Attributes not available"
* ShareEdit/ShareList: show pool not defined when share pool is not a defined pool
### Linux kernel[​](#linux-kernel)
* version 5.19.17
* patch: additional NVMe BOGUS\_NID quirks for non-compliant devices reported by users
* sound support:
* CONFIG\_SOUND: Sound card support
* CONFIG\_SND: Advanced Linux Sound Architecture
* CONFIG\_SND\_OSSEMUL: Enable OSS Emulation
* CONFIG\_SND\_PCM\_OSS: OSS PCM (digital audio) API
* CONFIG\_SND\_HRTIMER: HR-timer backend support
* CONFIG\_SND\_SUPPORT\_OLD\_API: Support old ALSA API
* CONFIG\_SND\_PROC\_FS: Sound Proc FS Support
* CONFIG\_IPV6: The IPv6 protocol (change from module to built-in)
### Base Distro[​](#base-distro)
Package updates including CVE mitigations:
* bash: version 5.2.002
* bind: version 9.18.8 (CVE-2022-38178 CVE-2022-38178 CVE-2022-3080 CVE-2022-2795)
* btrfs-progs: version 6.0
* curl: version 7.86.0
* dbus: version 1.14.4
* freeglut: version 3.4.0
* git: version 2.38.1 (CVE-2022-39253 CVE-2022-39260)
* glibc-zoneinfo: version 2022e
* harfbuzz: version 5.3.1
* icu4c: version 72.1
* iproute2: version 6.0.0
* kernel-firmware: version 20221017\_48407ff
* less: version 608
* libXmu: version 1.1.4
* libXrender: version 0.9.11
* libedit: version 20221009\_3.1
* libffi: version 3.4.4
* libgpg-error: version 1.46
* libpciaccess: version 0.17
* libunistring: version 1.1
* libxkbfile: version 1.1.1
* libxshmfence: version 1.3.1
* lsof: version 4.96.4
* nginx: version 1.22.1
* openssh: version 9.1p1
* php: version 7.4.32
* pixman: version 0.42.0
* rsync: version 3.2.7
* samba: version 4.17.2 (CVE-2021-20251 CVE-2022-3437 CVE-2022-3592)
* sudo: version 1.9.12
* tree: version 2.0.4
* xkeyboard-config: version 2.37
* xterm: version 375
* zlib: version 1.2.13 (CVE-2022-37434)
["WireGuard" and the "WireGuard" logo are registered trademarks of Jason A. Donenfeld.](https://www.wireguard.com/)
## Patches[​](#patches)
With the [Unraid Patch plugin](https://forums.unraid.net/topic/185560-unraid-patch-plugin/) installed, visit ***Tools → Unraid Patch*** to get the following patches / hot fixes:
* A subset of security updates, see [this blog post](https://unraid.net/blog/cvd) for details. We recommend upgrading to the latest stable release for additional security updates.
* [Version 6.11.2 2022-11-04](#version-6112-2022-11-04)
* [VM Manager](#vm-manager)
* [WireGuard](#wireguard)
* [Plugin manager](#plugin-manager)
* [Scheduler](#scheduler)
* [Misc. WebGUI](#misc-webgui)
* [Linux kernel](#linux-kernel)
* [Base Distro](#base-distro)
* [Patches](#patches)