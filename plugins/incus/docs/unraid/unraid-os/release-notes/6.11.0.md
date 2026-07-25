6.11.0 | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
## Version 6.11.0 2022-09-23[​](#version-6110-2022-09-23)
### Improvements[​](#improvements)
* With this release there have been many base package updates including several CVE mitigations.
* The Linux kernel update includes mitigation for [Processor MMIO stale-data vulnerabilities](https://lwn.net/Articles/898011/).
* The plugin system has been refactored so that 'plugin install' can proceed in the background. This alleviates
issue where a user may think installation has crashed and closes the window, when actually it has not crashed.
* Many other WebGUI improvements.
* Added support for specifying custom VNC ports in VM manager form editor. Custom port number specified
using XML editor will be preserved when switching to forms-based editor.
* Spin down for non-rotational devices now places those devices in standby mode if supported by the device. Similarly,
spin up, or any I/O to the device will restore normal operation.
* Display NVMe device capabilities obtained from SMART info.
* Added necessary kernel CONFIG options to support Sr-iov with mellanox connectx4+ cards
* Merged Dynamix SSD Trim plugin into Unraid OS WebGUI.
* Preliminary support for cgroup2. Pass 'unraidcgroup2' on syslinux append line to activate.
* Included perl in base distro.
### Bug fixes[​](#bug-fixes)
* Fixed issue in VM manager where VM log can not open when VM name has an embedded '#' character.
* Fixed issue where Parity check pause/resume on schedule was broken.
* Fixed issue installing registration keys.
* Updated 'samba' to address security mitigations. Also should get rid of kernel message
complaining about "Attempt to set a LOCK\_MAND lock via flock(2)."
* Fixed issue switching from 'test' branch to 'next'.
* Quit trying to spin down devices which do not support standby mode.
* Fixed AD join issued caused by outdated cyras-sasl library
* Do not start mcelog daemon if CPU is unsupported (most AMD processors).
* Fix nginx not recognizing SSL certificate renewal.
* wireguard: check the reachability of the gateway (next-hop) before starting the WG tunnel.
* Ignore "ERROR:" strings mixed in "btrfs filesystem show" command output.
This solves problem where libblkid could tag a parity disk as having btrfs file system
because the place it looks for the "magic number" happens to matches btrfs. Subsequent
"btrfs fi" commands will attempt to read btrfs metadata from this device which fails
because there really is not a btrfs filesystem there.
* Fixed bug in mover that prevented files from being moved from unRAID array to a cache pool (mode Prefer)
if the share name contains a space.
## Change Log vs. Unraid OS 6.10.3[​](#change-log-vs-unraid-os-6103)
#### Management[​](#management)
* Add sha256 checks of un-zipped files in unRAIDServer.plg.
* bash: in /etc/profile omit "." (current directory) from PATH
* docker: do not call 'docker stop' if there are no running containers
* emhttpd: improve standby (spinning) support
* mover: fixed issue preventing moving filed from array to cache if share name contains a space
* rc.nginx: enable OCSP stapling on certs which include an OCSP responder URL
* rc.nginx: compress 'woff' font files and instruct browser to cache
* rc.wireguard: add better troubleshooting for WireGuard autostart
* rc.S: support early load of plugin driver modules
* SMB: fixed 'fruit' settings for the USB Flash boot device
* SMB: remove NTLMv1 support since removed from Linux kernel
* SMB: (temporarily) move vfs\_fruit settings into separate /etc/samba/smb-fruit.conf file
* SMB: (temporarily) get rid of Samba 'idmap\_hash is deprecated' nag lines
* startup: Prevent installing downgraded versions of packages which might exist in /boot/extra
* upc: version v1.3.0
* WebGUI: Plugin system update
* Detach frontend and backend operation
* Use nchan as communication channel
* Allow window to be closed while backend continues
* Use SWAL as window manager
* Added multi remove ability on Plugins page
* Added update all plugins with details
* WebGUI: docker: use docker label as primary source for WebUI
* This makes the 'net.unraid.docker.webui' docker label the primary source when parsing the web UI address. If the docker label is missing, the template value will be used instead.
* WebGUI: Update Credits.page
* WebGUI: VM manager: Fix VM log can not open when VM name has an embedded '#'
* WebGUI: Management Access page: add details for self-signed certs
* WebGUI: Parity check: fix regression error
* WebGUI: Remove session creation in scripts
* WebGUI: Update ssh key regex
* Add support for ed25519/sk-ed25519
* Remove support for ecdsa (insecure)
* Use proper regex to check for valid key types
* WebGUI: misc. style updates
* WebGUI: Management access: HTTP port setting should always be enabled
* WebGUI: Fix: preserve vnc port settings
* WebGUI: Fix regression error in plugin system
* WebGUI: Fix issue installing registration keys
* WebGUI: Highlight case selection when custom image is selected
* WebGUI: fix(upc): v1.4.2 apiVersion check regression
* WebGUI: Update Disk Capabilities pages for NVME drives
* WebGUI: chore(upc): v1.6.0
* WebGUI: Plugin system and docker update
* WebGUI: System info - style update
* WebGUI: Plugins: keep header buttons in same position
* WebGUI: Prevent overflow in container size for low resolutions
* WebGUI: VM Manager: Add boot order to GUI and CD hot plug function
* WebGUI: Docker Manager: add ability to specify shell with container label.
* WebGUI: fix: Discord notification agent url
* WebGUI: Suppress info icon in banner message when no info is available
* WebGUI: Add Spindown message and use -n for identity if scsi drive.
* WebGUI: Fix SAS Selftest
* WebGUI: Fix plugin multi updates
* WebGUI: UPS display enhancements:
* Add icon for each category
* Add translation in UPS section on dashboard
* Add Output voltage / frequency value
* Add coloring depending on settings
* Normalize units
* Make updates near real-time
* Added UPS model field
* WebGUI: JQuery: version 3.6.1
* WebGUI: JQueryUI: version 1.13.2
* WebGUI: improved 'cache busting' on font file urls
* WebGUI: Fixed: text color in docker popup window sometimes wrong
* WebGUI: Fixed: show read errors during Read Check
* WebGUI: VM Manager: Add USB Startup policy; add Missing USB support
* WebGUI: Docker: fixed javascript error when no containers exist
* WebGUI: added 3rd party system diagnostics
* added diagnostics for third party plugin packages
* added diagnostics for /dev/dri devices
* added diagnostics for /dev/dvb devices
* added diagnostics for nvidia devices
#### Linux kernel[​](#linux-kernel)
* version 5.19.9 (CVE-2022-21123 (CVE-2022-21123 CVE-2022-21125 CVE-2022-21166)
* md/unraid: version 2.9.24
* CONFIG\_IOMMU\_DEFAULT\_PASSTHROUGH: Passthrough
* CONFIG\_VIRTIO\_IOMMU: Virtio IOMMU driver
* CONFIG\_X86\_AMD\_PSTATE: AMD Processor P-State driver
* CONFIG\_FIREWIRE: FireWire driver stack
* CONFIG\_FIREWIRE\_OHCI: OHCI-1394 controllers
* CONFIG\_FIREWIRE\_SBP2: Storage devices (SBP-2 protocol)
* CONFIG\_FIREWIRE\_NET: IP networking over 1394
* CONFIG\_INPUT\_UINPUT: User level driver support
* CONFIG\_INPUT\_JOYDEV: Joystick interface
* CONFIG\_INPUT\_JOYSTICK: Joysticks/Gamepads
* CONFIG\_JOYSTICK\_XPAD: X-Box gamepad support
* CONFIG\_JOYSTICK\_XPAD\_FF: X-Box gamepad rumble support
* CONFIG\_JOYSTICK\_XPAD\_LEDS: LED Support for Xbox360 controller 'BigX' LED
* CONFIG\_MLX5\_TLS: Mellanox Technologies TLS Connect-X support
* CONFIG\_MLX5\_ESWITCH: Mellanox Technologies MLX5 SRIOV E-Switch suppor
* CONFIG\_MLX5\_CLS\_ACT: MLX5 TC classifier action support
* CONFIG\_MLX5\_TC\_SAMPLE: MLX5 TC sample offload support
* CONFIG\_MLXSW\_SPECTRUM: Mellanox Technologies Spectrum family support
* CONFIG\_NET\_SWITCHDEV: Switch (and switch-ish) device support
* CONFIG\_TLS: Transport Layer Security support
* CONFIG\_TLS\_DEVICE: Transport Layer Security HW offload
* CONFIG\_TLS\_TOE: Transport Layer Security TCP stack bypass
* CONFIG\_VMD: Intel Volume Management Device Driver
* added additional sensor drivers:
* CONFIG\_AMD\_SFH\_HID: AMD Sensor Fusion Hub
* CONFIG\_SENSORS\_AQUACOMPUTER\_D5NEXT: Aquacomputer D5 Next watercooling pump
* CONFIG\_SENSORS\_MAX6620: Maxim MAX6620 fan controller
* CONFIG\_SENSORS\_NZXT\_SMART2: NZXT RGB & Fan Controller/Smart Device v2
* CONFIG\_SENSORS\_SBRMI: Emulated SB-RMI sensor
* CONFIG\_SENSORS\_SHT4x: Sensiron humidity and temperature sensors. SHT4x and compat.
* CONFIG\_SENSORS\_SY7636A: Silergy SY7636A
* CONFIG\_SENSORS\_INA238: Texas Instruments INA238
* CONFIG\_SENSORS\_TMP464: Texas Instruments TMP464 and compatible
* CONFIG\_SENSORS\_ASUS\_WMI: ASUS WMI X370/X470/B450/X399
* CONFIG\_SENSORS\_ASUS\_WMI\_EC: ASUS WMI B550/X570
* CONFIG\_SENSORS\_ASUS\_EC: ASUS EC Sensors
* patch: add reference to missing firmware in drivers/bluetooth/btrtl.c
* rtl8723d\_fw.bin
* rtl8761b\_fw.bin
* rtl8761bu\_fw.bin
* rtl8821c\_fw.bin
* rtl8822cs\_fw.bin
* rtl8822cu\_fw.bin
* CONFIG\_BPF\_UNPRIV\_DEFAULT\_OFF: Disable unprivileged BPF by default
* patch: quirk for Team Group MP33 M.2 2280 1TB NVMe (globally duplicate IDs for nsid)
* turn on all IPv6 kernel options:
* CONFIG*INET6*\*
* CONFIG*IPV6*\*
* CONFIG\_RC\_CORE: Remote Controller support
* CONFIG\_SFC\_SIENA: Solarflare SFC9000 support
* CONFIG\_SFC\_SIENA\_MCDI\_LOGGING: Solarflare SFC9000-family MCDI logging support
* CONFIG\_SFC\_SIENA\_MCDI\_MON: Solarflare SFC9000-family hwmon support
* CONFIG\_SFC\_SIENA\_SRIOV: Solarflare SFC9000-family SR-IOV support
* CONFIG\_ZRAM: Compressed RAM block device support
* CONFIG\_ZRAM\_DEF\_COMP\_LZ4: Default ram compressor (lz4)
* turn on all EDAC kernel options
* CONFIG\_EDAC: EDAC (Error Detection And Correction) reporting
* CONFIG*EDAC*\*
#### Base distro[​](#base-distro)
* aaa\_base: version 15.1
* aaa\_glibc-solibs: version 2.36
* aaa\_libraries: version 15.1
* at: version 3.2.3
* bind: version 9.18.6
* btrfs-progs: version 5.19.1
* ca-certificates: version 20220622
* cifs-utils: version 7.0
* coreutils: version 9.1
* cracklib: version 2.9.8
* cryptsetup: version 2.5.0
* curl: version 7.85.0
* cyrus-sasl: version 2.1.28
* dbus: version 1.14.0
* dhcpcd: version 9.4.1
* dmidecode: version 3.4
* docker: version 20.10.17 (CVE-2022-29526 CVE-2022-30634 CVE-2022-30629 CVE-2022-30580 CVE-2022-29804 CVE-2022-29162 CVE-2022-31030)
* etc: version 15.1
* ethtool: version 5.19
* eudev: version 3.2.11
* file: version 5.43
* findutils: version 4.9.0
* firefox: version 105.0.r20220922151854-x86\_64 (AppImage)
* fuse3: version 3.12.0
* gawk: version 5.2.0
* gdbm: version 1.23
* git: version 2.37.3
* glib2: version 2.72.3
* glibc: version 2.36
* glibc-zoneinfo: version 2022c
* gnutls: version 3.7.7
* gptfdisk: version 1.0.9
* grep: version 3.8
* gzip: version 1.12
* hdparm: version 9.65
* htop: version 3.2.1
* icu4c: version 71.1
* inotify-tools: version 3.22.6.0
* iperf3: version 3.11
* iproute2: version 5.19.0
* iptables: version 1.8.8
* jemalloc: version 5.3.0
* json-c: version 0.16\_20220414
* json-glib: version 1.6.6
* kmod: version 30
* krb5: version 1.20
* libaio: version 0.3.113
* libarchive: version 3.6.1
* libcap-ng: version 0.8.3
* libcgroup: version 3.0.0
* libdrm: version 2.4.113
* libepoxy: version 1.5.10
* libffi: version 3.4.2
* libgcrypt: version 1.10.1
* libgpg-error: version 1.45
* libidn: version 1.41
* libjpeg-turbo: version 2.1.4
* libmnl: version 1.0.5
* libnetfilter\_conntrack: version 1.0.9
* libnfnetlink: version 1.0.2
* libnftnl: version 1.2.3
* libnl3: version 3.7.0
* libpng: version 1.6.38
* libssh: version 0.10.4
* libtasn1: version 4.19.0
* libtirpc: version 1.3.3
* liburcu: version 0.13.1
* libusb: version 1.0.26
* libwebp: version 1.2.4
* libxml2: version 2.9.14
* libxslt: version 1.1.36
* libzip: version 1.9.2
* logrotate: version 3.20.1
* lsof: version 4.95.0
* lzip: version 1.23
* mc: version 4.8.28
* mcelog: version 189
* nano: version 6.4
* nfs-utils: version 2.6.2
* nghttp2: version 1.49.0
* nginx: version 1.22.0
* ntfs-3g: version 2022.5.17
* ntp: version 4.2.8p15
* oniguruma: version 6.9.8
* openssh: version 9.0p1
* openssl: version 1.1.1q (CVE-2022-1292 CVE-2022-2097 CVE-2022-2274)
* openssl-solibs: version 1.1.1q (CVE-2022-1292)
* p11-kit: version 0.24.1
* pciutils: version 3.8.0
* pcre2: version 10.40
* perl: version 5.36.0
* php: version 7.4.30 (CVE-2022-31625 CVE-2022-31626)
* pkgtools: version 15.1
* rpcbind: version 1.2.6
* rsync: version 3.2.6
* samba: version 4.17.0 (CVE-2022-2031 CVE-2022-32744 CVE-2022-32745 CVE-2022-32746 CVE-2022-32742)
* sqlite: version 3.39.3
* sudo: version 1.9.11p3
* sysfsutils: version 2.1.1
* sysstat: version 12.6.0
* sysvinit-scripts: version 15.1
* talloc: version 2.3.4
* tar: version 1.34
* tevent: version 0.13.0
* tree: version 2.0.2
* util-linux: version 2.38.1
* wayland: version 1.21.0
* wget: version 1.21.3
* xfsprogs: version 5.18.0
* xz: version 5.2.6
* zlib: version 1.2.12
["WireGuard" and the "WireGuard" logo are registered trademarks of Jason A. Donenfeld.](https://www.wireguard.com/)
## Patches[​](#patches)
With the [Unraid Patch plugin](https://forums.unraid.net/topic/185560-unraid-patch-plugin/) installed, visit ***Tools → Unraid Patch*** to get the following patches / hot fixes:
* A subset of security updates, see [this blog post](https://unraid.net/blog/cvd) for details. We recommend upgrading to the latest stable release for additional security updates.
* [Version 6.11.0 2022-09-23](#version-6110-2022-09-23)
* [Improvements](#improvements)
* [Bug fixes](#bug-fixes)
* [Change Log vs. Unraid OS 6.10.3](#change-log-vs-unraid-os-6103)
* [Patches](#patches)