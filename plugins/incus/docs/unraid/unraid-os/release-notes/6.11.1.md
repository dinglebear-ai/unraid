6.11.1 | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
## Version 6.11.1 2022-10-06[​](#version-6111-2022-10-06)
### Improvements[​](#improvements)
Updated both qemu and libvirt to latest versions:
* Added ppc, riscv32/riscv64, and aarch64 support.
Updated docker to v20.10.18 and improved networking:
* When DHCP is used, wait for IPv4 assignment before proceeding on system startup, this avoids a
possible race-condition at boot time when host access to custom networks is enabled.
* Allow user defined networks to be reconnected at docker service start. Now all defined networks
will be automatically reconnected.
VM Manager improvements:
* Implemented option to use Virtiofs for mapping of Unraid host shares into a VM.
* Added Spice html client for Virtual Machines (experimental).
### Notable Bug fixes[​](#notable-bug-fixes)
* Fixed issue where opening certain pages, eg, Dashboard, needlessly causes writes to the USB Flash boot device.
* Fixed the issue of docker containers can reach the Internet when the WG tunnel is not autostarted
at system boot up. **Users are advised to regenerate the WG configs.** This can be done, e.g., by
clicking in a field to change a value and then change it back in order to get the Apply button to light
up. Then click Apply.
* Fixed issue where empty popup windows gets displayed with certain browsers and devices.
* Restored "NTLMv1 authenication" for incoming SMB connections.
## Change Log vs. Unraid OS 6.11.0[​](#change-log-vs-unraid-os-6110)
#### Base distro[​](#base-distro)
* acpid: version 2.0.34
* bash: version 5.2.000
* bind: version 9.18.7
* ca-certificates: version 20220922
* dbus: version 1.14.2
* dnsmasq: version 2.87
* docker: version 20.10.18 (CVE-2022-27664 CVE-2022-32190 CVE-2022-36109)
* git: version 2.38.0
* glib2: version 2.72.4
* glibc-zoneinfo: version 2022d
* gnutls: version 3.7.8
* harfbuzz: version 5.2.0
* intel-microcode: version 20220809
* libXtst: version 1.2.4
* libXxf86vm: version 1.1.5
* libffi: version 3.4.3
* libvirt: version 8.7.0
* libvirt-php: version 0.5.6
* lsof: version 4.96.3
* nghttp2: version 1.50.0
* pango: version 1.50.11
* qemu: version 7.1.0 (built adding ppc, riscv32/64 support, replace arm with aarch64)
* sqlite: version 3.39.4
* xterm: version 373
* xz: version 5.2.7
#### Linux kernel[​](#linux-kernel)
* version 5.19.14
* CONFIG\_DRM\_MGAG200: Matrox G200
* CONFIG\_X86\_SGX: Software Guard eXtensions (SGX)
* CONFIG\_X86\_SGX\_KVM: Software Guard eXtensions (SGX) Virtualization
* CONFIG\_CRYPTO\_ZSTD: Zstd compression algorithm
* md/unraid: version 2.9.25
* patch: silence EDID "block all zeros" and "has corrupt header" notices
* patch: add NVMe quirks for non-compliant devices reported by users
#### Management[​](#management)
* WebGUI: VM Manager: Update GUI Options
* Include 9P and Virtiofs
* Remove 9P option for Windows.
* Update XML if virtiofs and Windows in addition to Linux.
* Update VM Share GUI Options
* WebGUI: Fixed: wrong feedback display on VM page
* WebGUI: Dashboard: store graph data in file instead of cookie
* WebGUI: Ask user to provide diagnostics before downgrading the OS
* WebGUI: Spice html client in addition to VNC
* WebGUI: improve handling of windows-style config files
* WebGUI: WireGuard: add explicit interface name in routing
* WebGUI: SWAL: intercept "esc" button to stop nchan upon window closing
* WebGUI: nchan: delayed command execution
* This prevents an empty popup window in certain browsers and devices
["WireGuard" and the "WireGuard" logo are registered trademarks of Jason A. Donenfeld.](https://www.wireguard.com/)
## Patches[​](#patches)
With the [Unraid Patch plugin](https://forums.unraid.net/topic/185560-unraid-patch-plugin/) installed, visit ***Tools → Unraid Patch*** to get the following patches / hot fixes:
* A subset of security updates, see [this blog post](https://unraid.net/blog/cvd) for details. We recommend upgrading to the latest stable release for additional security updates.
* [Version 6.11.1 2022-10-06](#version-6111-2022-10-06)
* [Improvements](#improvements)
* [Notable Bug fixes](#notable-bug-fixes)
* [Change Log vs. Unraid OS 6.11.0](#change-log-vs-unraid-os-6110)
* [Patches](#patches)