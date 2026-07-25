6.10.0 | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
## Version 6.10.0 2022-05-07[​](#version-6100-2022-05-07)
Summary of Changes and New Features
### UPC and My Servers Plugin[​](#upc-and-my-servers-plugin)
The most visible new feature is located in the upper right corner of the
WebGUI header. We call this the *User Profile Component*, or UPC. The
UPC allows a user to better manage their registration keys and install
the optional *My Servers* plugin.
*My Servers* is what we call our set of
cloud-based services and features that integrate with your Unraid
server(s). After installing the *My Servers* plugin, you will be
prompted to sign-in to your server with an existing Unraid.net account
or create a new Unraid.net account. Once installed here are some of the
features of *My Servers*:
* *Real-time Status* - with the plugin installed each server tile on
the *My Servers Dashboard* will display real-time status such as
whether the server is online or offline, storage utilization, and
other information.
* Local Access link - this is a direct link to the server WebGUI on
your LAN.
* Remote Access link - **if enabled**, a link is displayed on the *My
Servers Dashboard* to bring up a server WebGUI remotely and over the
Internet.
* Automatic Flash Backup - every registered server is provided with a
private git repo initially populated with the contents of your USB
flash boot device (except for certain files which contain private
information such as passwords). Thereafter, configuration changes
are automatically committed. A link is provided to download a
custom zip file that can be fed as input to the USB Flash Creator
tool to move your configuration to a new USB flash device.
* Notification of critical security-related updates. In the event a
serious security vulnerability has been discovered and patched, we
will send out a notification to all email addresses associated with
registered servers.
* Posting privilege in a new set of My Servers forum boards.
Signed-in servers maintain a websocket connection to a cloud-based Lime
Technology proxy server for the purpose of relaying real-time status.
Refer to the My Servers Privacy section for more
information.
### Security Changes[​](#security-changes)
It is now **mandatory** to define a *root* password and changing the
*root* user password will log out all WebGUI browser sessions.
We also created a division in the Users page to distinguish *root* from
other user names. The *root* UserEdit page includes a text box for
pasting SSH authorized keys.
For new configurations, the *flash* share default export setting is No.
For new configurations, SMBv1 is disabled by default.
For new configurations, telnet and ssh are disabled by default.
For all new user shares, the default export setting is No.
We removed certain strings from Diagnostics such as passwords found in the 'go' file.
#### Moving to Let's Encrypt wildcard SSL certificates[​](#moving-to-lets-encrypt-wildcard-ssl-certificates)
Starting with this release, **we no longer issue new single-host SSL
certificates** (which we're calling legacy certificates). Instead, all
new Unraid.net SSL certificates are **wildcard certificates** (still
provided by Let's Encrypt).
The URL used to access your server making use of a wildcard certificate
has this form:
* `https://[lan-ip].[hash].myunraid.net`
where,
* `[lan-ip]` is your servers LAN IP address with dots changed to
dashes
* `[hash]` is a 40-character hex string (160 bits) unique to this
server (and different from similar `[hash]` in legacy certificates)
example:
* `https://192-168-100-1.af01305221921f93aabae93f13800dcea41dc681e.myunraid.net`
We added a new DDNS server that listens at "myunraid.net". This
server extracts `[lan-ip]` from the domain name and returns the IP
address where the dashes are changed back into dots. There are several
benefits to this approach for both our users and us:
* Eliminates DNS propagation delays when you first *provision* a
certificate or when a server LAN IP address (or WAN IP address)
changes. Since the domain name includes the IP address, any IP
address change also changes the domain name, hence will not be
contained in any intermediate DNS cache. We also changed the TTL
from 1 hour to 7 days further reducing overhead and alleviating
issues where someone's internet goes down for brief periods.
* There is no longer a requirement for the server to actively update a
DDNS server.
* Improves privacy because your remote access WAN IP address can't be
determined by simply prepending "www" to your local access URL.
* Moves DNS functionality off the 'unraid.net' domain and isolates
it on the 'myunraid.net' domain.
In previous releases code that *provisions* (allocates and downloads) an
Unraid.net SSL certificate would first test if *DNS Rebinding
Protection* was enforced on the user's LAN; and, if so, would not
provision the certificate. Since there are other uses for a LE
certificate we changed the code so that *provision* would always
proceed. Next, we changed the logic behind the *Auto* selection of
"Use SSL/TLS" setting on the Management Access page. Now it is only
possible to select Auto if both a LE certificate has been provisioned
and DNS Rebinding Protection is not enforced. This is a subtle change
but permits certain *My Servers* features such as Remote Access.
Upon upgrading, you will need to modify any server bookmarks with the
new URL. Alternately, if you have installed the *My Servers* plugin, a
local access link is included for each server on your Dashboard. If you
have not installed the My Servers plugin, since there is no DDNS update
daemon, we recommend setting up either a static DHCP lease, or assigning
a static IP address for your server. Finally, we have set up nginx such
that the URL's:
* `http://\<server-name\>.\<local-tld\>/`
or
* `https://\<server-name\>.\<local-tld\>/`
will redirect to `https://[lan-ip].[hash].myunraid.net`
More information including use cases may be found in Documentation [here](/unraid-os/system-administration/secure-your-server/securing-your-connection/).
### Virtualization[​](#virtualization)
Both libvirt and qemu have been updated. In addition, qemu has been
compiled with OpenGL support, and ARM emulation (experimental).
#### Windows 11 Support[​](#windows-11-support)
To support Windows 11 which requires TPM and Secure boot, we have added
TPM emulation; and, added a "Windows 11" VM template which
automatically selects TPM-aware OVMF bios. Also, here are instructions
for upgrading a Windows 10 VM to Windows 11. Special thanks to [@ich777](https://forums.unraid.net/profile/72388-ich777/)
who researched and determined what changes and components were necessary
to provide this functionality.
### Docker[​](#docker)
#### Docker labels[​](#docker-labels)
* Docker labels are added to allow people using Docker compose to make
use of icons and GUI access
* Look at a Docker 'run' command output to see exactly what labels
are used
#### Docker custom networks[​](#docker-custom-networks)
* A new setting for custom networks is available. Originally custom
networks are created using the macvlan mode, and this mode is kept
when upgrading to version 6.10
* The new ipvlan mode is introduced to battle the crashes some people
experience when using macvlan mode. If that is your case, change to
ipvlan mode and test. Changing of mode does not require
reconfiguring anything on the Docker level, internally everything is
being taken care of.
#### Docker bridge network (docker0)[​](#docker-bridge-network-docker0)
* docker0 now supports IPv6. This is implemented by assigning docker0
a private IPv6 subnet (fd17::/64), similar to what is done for IPv4
and using network translation to communicate with the outside world
* Containers connected to the bridge network now have both IPv4 and
IPv6 connectivity (of course the system must have IPv6 configured in
the network configuration)
* In addition, several enhancements are made in the IPv6
implementation to better deal with the use (or non-use) of IPv6
### WireGuard[​](#wireguard)
The WireGuard plugin has been integrated into WebGUI, that is, no need
for the plugin. If you had the plugin installed previously, it will be
uninstalled and moved to the "Plugins/Plugin File Install Errors"
page. No action is needed unless you want to press the Delete button to
remove it from that page. Your WireGuard tunnels and settings will be
preserved. [See this post to get started with
WireGuard](https://forums.unraid.net/topic/84226-wireguard-quickstart/).
Resident network guru [@bonienl](https://forums.unraid.net/profile/2736-bonienl/) has added the capability to bind a
WireGuard virtual network interface to a docker container. One use of
this feature is to configure a WireGuard-enabled VPN which may then be
exclusively used by that container, while your main server makes use of
the normal LAN network interface. [Please refer to this post for
additional
details.](https://forums.unraid.net/topic/84316-wireguard-vpn-tunneled-access-to-a-commercial-vpn-provider/#comment-781381)
### Linux Kernel[​](#linux-kernel)
Upgraded to Linux 5.15.x LTS kernel which includes so-called *Sequoia*
and *Dirty Pipe* vulnerability mitigations.
**In-tree GPU drivers** are now loaded by default if corresponding
hardware is detected:
* amdgpu
* ast
* i915
* radeon
These drivers are required mostly for motherboard on-board graphics used
in *GUI boot* mode. Loading of a driver can be prohibited by creating
the appropriate file named after the driver:
`echo "blacklist i915" \> /boot/config/modprobe.d/i915.conf`
Alternately, the device can be isolated from Linux entirely via the
System Devices page. Note that in Unraid OS 6.9 releases the in-tree
GPU drivers are blacklisted by default and to enable loading a driver
you need to create an empty "conf" file. After upgrading to Unraid OS
6.10 you may delete those files, or leave them as-is. This change was
made to greatly improve the *Desktop GUI* experience for new users.
**Other kernel changes:**
* Added support for Intel GVT-g, which lets you split your Intel i915
iGPU into multiple virtual GPUs and pass them through to multiple
VMs, using [@ich777](https://forums.unraid.net/profile/72388-ich777/)'s *Intel-GVT-g* plugin.
* Added support for gnif/vendor-reset. This simplifies [@ich777](https://forums.unraid.net/profile/72388-ich777/)'s
*AMD Vendor Reset* plugin which permits users to get their AMD video
cards to reset properly.
* Added so-called "add-relaxable-rmrr-5\_8\_and\_up.patch" modified for
our kernel:
[https://github.com/kiler129/relax-intel-rmrr/blob/master/patches/add-relaxable-rmrr-5\_8\_and\_up.patch](https://github.com/kiler129/relax-intel-rmrr/blob/master/patches/add-relaxable-rmrr-5_8_and_up.patch)
Thanks to [@ich777](https://forums.unraid.net/profile/72388-ich777/) for pointing this out.
* Enabled additional ACPI kernel options
* Enabled TPM kernel modules (not utilized yet) - note this is for
Unraid host utilizing physical TPM, not emulated TPM support for
virtual machines.
* Support Realtek RTL8152/RTL8153 Based USB Ethernet Adapters
* Enabled NFSv4 support.
### Base Packages[​](#base-packages)
Virtually the entire base package set has been updated.
For SMB: Samba version 4.15 SMB3 multi-channel is no longer marked
"experimental", however, is **disabled** by default. This may be
enabled on the Settings/SMB Settings page. Some users have reported
issues with SMB3 multi-channel in conjunction with certain network bond
configurations.
Per request, we added the mcelog package. With the inclusion of this
package, if you have an AMD processor you may see this error message in
the system log:
`mcelog: ERROR: AMD Processor family 23: mcelog does not support this processor. Please use the edac\_mce\_amd module instead.`
We're not sure what to make of this. It appears mcelog is being
deprecated in favor of rasdaemon. This is something we need to research
further.
### Other Improvements[​](#other-improvements)
Other improvements which are maybe not so obvious to spot from the
release notes and some of these improvements are internal and not really
visible:
**Event-driven model** to obtain server information and update the
WebGUI in real-time
* The advantage of this model is its scalability. Multiple browsers
can be opened simultaneously to the WebGUI without much impact
* In addition, stale browser sessions won't create any CSRF errors
anymore
* People who keep their browser open 24/7 will find the WebGUI stays
responsive at all times
* Consistent state information is maintained across all browser
instances open to a particular server
**Plugins page**
* The plugins page now loads information in two steps. First, the list
of plugins is created and next the more time-consuming plugin status
field is retrieved in the background. The result is a faster loading
plugins page, especially when you have a lot of plugins installed
**Dashboard graphs**
* The dashboard has now two graphs available. The CPU graph is
displayed by default, while the NETWORK graph is a new option under
Interface (see the 'General Info' selection)
* The CPU graph may be hidden as well in case it is not desired
* Both graphs have a configurable timeline, which is by default 30
seconds and can be changed independently for each graph to see a
longer or shorter history.
* Graphs are updated in real-time and are useful to observe the
behavior of the server under different circumstances
**Scheduler Improvements**
* You can now split a parity check into smaller pieces and let it run
over multiple days or weeks. For example, a check can be performed
in a time frame of 01:00am to 06:00am for several days in a row
until it is completed. This way a long parity check won't interfere
with the normal daily activities, like watching a movie.
* Added ability to schedule pool 'balance' and 'scrub' operations
and calculate whether a full balance is recommended.
**The built-in Firefox browser** available in *GUI-mode* boot is built
as an AppImage and located in the *bzfirmware* compressed file system
image. This saves approximately 60MB of RAM.
**Simplified installation of the Community Apps plugin.** The WebGUI
automatically includes the Apps menu item, and if CA is not already
installed, the page offers an Install button. No need to hunt for the
plugin link.
**We increased the font size in Terminal** and fixed the issue with
macOS *Monterey*. Terminal font size is configurable via the
Settings/Display Settings page.
**Mover** will create '.partial' file and then rename it upon
completion.
**System start-up** will check bz file sha256sums at boot time to verify
no corruption.
**For cookies managed by WebGUI**, changed sameSite cookie attribute
from 'strict' to 'lax'. This change was made to solve an issue with
the Terminal window not opening in Safari.
**Added ServerChan and Pushplus** notification agents, thanks to
[@ludoux](https://forums.unraid.net/profile/168579-ludoux/)
**Template Repositories** were removed, see [this post for info on their
replacements](https://forums.unraid.net/topic/112170-allow-template-repositories-to-be-hosted-from-other-sources/page/2/#comment-1126265)
### Other Bug Fixes[​](#other-bug-fixes)
* We switched to a better-maintained version of the WSD server component called wsdd2 in an effort to eliminate instances where the wsd daemon would start consuming 100% of a CPU core.
* Fixed issue where you couldn't create a docker image on a share name that contains a space.
* Fixed issue where 'mover' would not move to a pool name that contains a space.
* Fixed issue in [User Share](/unraid-os/using-unraid-to/manage-storage/shares/#user-shares) file system where permissions were not being honored.
* Fixed jumbo frames not working.
* sysctl: handle net.netfilter.nf\_conntrack\_count max exceeded (increase setting to 131072) - hattip to Community Member [@DieFalse](https://forums.unraid.net/profile/77686-diefalse/)
* Fixed bug found by [@thohell](https://forums.unraid.net/profile/12113-thohell/) where md\_sync\_limit was not being honored to limit stripe\_head cache usage when other I/O is active.
The effect of this fix is to drastically slow down parity operations if other I/O is happening (such as streaming a video). Throttling of parity sync operations can be adjusted by changing the 'Settings/Disk Settings/Tunable (md\_sync\_limit)' value.
* Fixed btrfs pool device replace corner cases. Important note: if you 'unassign' a device from a btrfs multiple-device pool, and that device is still physically present, upon array Start we will **erase** the LUKS header on the device if present, and **delete** the partition structure, thereby effectively erasing all the data contained on the device. This is necessary in order to convince btrfs to no longer use the device and to free it for assignment to another pool.
* Fixed a bug where replacing a device in a multiple-device btrfs pool would still tag the old device as missing.
* Fixed an issue where hot-plugging a device in a server with spun-down SAS drive(s) could cause the SAS drive(s) to appear unassigned.
* Fixed an issue where the server would disappear from Windows Network after docker and/or VM startup.
* Fixed md/unraid driver regression which would confuse XFS, making it think an online shrink had occurred.
* Fixed: Prevent Unraid from hanging when the array is stopped, while VMs are in paused or suspended state.
* Numerous other small bug fixes and improvements.
## Change Log vs. Unraid OS 6.9.2[​](#change-log-vs-unraid-os-692)
#### Base distro[​](#base-distro)
* aaa\_base: version 15.0
* aaa\_glibc-solibs: version 2.33
* aaa\_libraries: version 15.0
* acl: version 2.3.1
* acpid: version 2.0.33
* apcupsd: version 3.14.14
* at: version 3.2.3
* attr: version 2.5.1
* avahi: version 0.8
* bash: version 5.1.016
* beep: version 1.3
* bin: version 11.1
* bind: version 9.16.27
* bluez-firmware: version 1.2
* bridge-utils: version 1.7.1
* brotli: version 1.0.9
* btrfs-progs: version 5.16
* bzip2: version 1.0.8
* ca-certificates: version 20220403
* celt051: version 0.5.1.3
* cifs-utils: version 6.14
* coreutils: version 9.0
* cpio: version 2.13
* cpufrequtils: version 008
* cracklib: version 2.9.7
* cryptsetup: version 2.4.3
* curl: version 7.83.1 (CVE-2022-22576 CVE-2022-27774 CVE-2022-27775
CVE-2022-27776 CVE-2022-27778 CVE-2022-27779 CVE-2022-27780
CVE-2022-27781 CVE-2022-27782 CVE-2022-30115)
* cyrus-sasl: version 2.1.27
* db48: version 4.8.30
* dbus: version 1.12.20
* dcron: version 4.5
* devs: version 2.3.1
* dhcpcd: version 9.4.1
* diffutils: version 3.8
* dmidecode: version 3.3
* dnsmasq: version 2.86
* docker: version 20.10.14 (CVE-2022-24769)
* dosfstools: version 4.2
* e2fsprogs: version 1.46.5
* ebtables: version 2.0.11
* eject: version 2.1.5
* elogind: version 246.10
* elvis: version 2.2\_0
* etc: version 15.0
* ethtool: version 5.16
* eudev: version 3.2.11
* file: version 5.41
* findutils: version 4.8.0
* flex: version 2.6.4
* floppy: version 5.5
* fuse3: version 3.10.5
* gawk: version 5.1.1
* gdbm: version 1.22
* genpower: version 1.0.5
* getty-ps: version 2.1.0b
* git: version 2.35.3 (CVE-2022-24765)
* glib2: version 2.70.3
* glibc: version 2.33
* glibc-zoneinfo: version 2022a
* gmp: version 6.2.1
* gnutls: version 3.7.2
* gptfdisk: version 1.0.8
* grep: version 3.7
* gzip: version 1.12 (CVE-2022-1271)
* hdparm: version 9.63
* hostname: version 3.23
* htop: version 3.1.2
* icu4c: version 69.1
* inetd: version 1.79s
* infozip: version 6.0
* inih: version 53
* inotify-tools: version 3.20.11.0
* iproute2: version 5.16.0
* iptables: version 1.8.7
* iputils: version 20211215
* irqbalance: version 1.7.0
* jansson: version 2.14
* jemalloc: version 5.2.1
* jq: version 1.6
* json-c: version 0.15\_20200726
* json-glib: version 1.6.6
* kbd: version 1.15.3
* keyutils: version 1.6.3
* kmod: version 29
* krb5: version 1.19.2
* lbzip2: version 2.5
* less: version 590
* libaio: version 0.3.112
* libarchive: version 3.6.1
* libcap-ng: version 0.8.2
* libcgroup: version 0.41
* libdaemon: version 0.14
* libdrm: version 2.4.109
* libedit: version 20210910\_3.1
* libepoxy: version 1.5.9
* libestr: version 0.1.9
* libevent: version 2.1.12
* libfastjson: version 0.99.9
* libffi: version 3.3
* libgcrypt: version 1.9.4
* libgpg-error: version 1.44
* libgudev: version 237
* libidn: version 1.38
* libjpeg-turbo: version 2.1.2
* liblogging: version 1.0.6
* libmnl: version 1.0.4
* libnetfilter\_conntrack: version 1.0.8
* libnfnetlink: version 1.0.1
* libnftnl: version 1.2.1
* libnl3: version 3.5.0
* libpcap: version 1.10.1
* libpciaccess: version 0.16
* libpng: version 1.6.37
* libpsl: version 0.21.1
* libseccomp: version 2.5.1
* libssh: version 0.9.6
* libssh2: version 1.10.0
* libtasn1: version 4.18.0
* libtirpc: version 1.3.2
* libtpms: version 0.9.0
* libunistring: version 0.9.10
* libunwind: version 1.6.2
* libusb: version 1.0.24
* libusb-compat: version 0.1.7
* libuv: version 1.41.0
* libvirt: version 8.2.0
* libvirt-php: version 0.5.6a
* libwebp: version 1.2.2
* libwebsockets: version 4.2.0
* libx86: version 1.1
* libxml2: version 2.9.14 (CVE-2022-29824)
* libxslt: version 1.1.35
* libzip: version 1.8.0
* lm\_sensors: version 3.6.0
* lmdb: version 0.9.29
* logrotate: version 3.18.1
* lshw: version B.02.19.2
* lsof: version 4.94.0
* lsscsi: version 0.32
* lvm2: version 2.03.13
* lz4: version 1.9.3
* lzip: version 1.22
* lzo: version 2.10
* mc: version 4.8.27
* mcelog: version 180
* miniupnpc: version 2.1
* mpfr: version 4.1.0
* nano: version 6.0
* ncompress: version 5.0
* ncurses: version 6.3
* net-tools: version 20181103\_0eebece
* nettle: version 3.7.3
* network-scripts: version 15.0
* nfs-utils: version 2.5.4
* nghttp2: version 1.46.0
* nginx: version 1.21.6
* nss-mdns: version 0.14.1
* ntfs-3g: version 2021.8.22
* ntp: version 4.2.8p15
* numactl: version 2.0.13
* oniguruma: version 6.9.7.1
* openssh: version 8.8p1
* openssl: version 1.1.1o (CVE-2022-1292)
* openssl-solibs: version 1.1.1o (CVE-2022-1292)
* p11-kit: version 0.24.1
* pam: version 1.5.2
* patch: version 2.7.6
* pciutils: version 3.7.0
* pcre: version 8.45
* pcre2: version 10.39
* php: version 7.4.29 (CVE-2021-21708)
* pixman: version 0.40.0
* pkgtools: version 15.0
* procps-ng: version 3.3.17
* pv: version 1.6.6
* qemu: version 6.2.0
* qrencode: version 4.1.1
* reiserfsprogs: version 3.6.27
* rpcbind: version 1.2.5
* rsync: version 3.2.3
* rsyslog: version 8.2102.0
* samba: version 4.15.7 (CVE-2021-44141 CVE-2021-44142 CVE-2022-0336
CVE-2021-44141 CVE-2021-441412 CVE-2022-0336)
* sdparm: version 1.12
* sed: version 4.8
* sg3\_utils: version 1.47
* shadow: version 4.8.1
* smartmontools: version 7.3
* spice: version 0.15.0
* sqlite: version 3.37.2
* ssmtp: version 2.64
* sudo: version 1.9.9
* swtpm: version 0.7.3 (CVE-2022-23645)
* sysfsutils: version 2.1.0
* sysvinit: version 2.99
* sysvinit-scripts: version 15.0
* talloc: version 2.3.2
* tar: version 1.34
* tcp\_wrappers: version 7.6
* tdb: version 1.4.6
* telnet: version 0.17
* tevent: version 0.11.0
* traceroute: version 2.1.0
* tree: version 1.8.0
* ttyd: version 20211023
* usbredir: version 0.8.0
* usbutils: version 014
* utempter: version 1.2.0
* util-linux: version 2.37.4
* vbetool: version 1.2.2
* vsftpd: version 3.0.5
* wayland: version 1.20.0
* wget: version 1.21.2
* which: version 2.21
* wireguard-tools: version 1.0.20210914
* wsdd2: version 20111022
* xfsprogs: version 5.13.0
* xxHash: version 0.8.1
* xz: version 5.2.5 (CVE-2022-1271)
* yajl: version 2.1.0
* zlib: version 1.2.12
* zstd: version 1.5.2
#### Included with GUI-mode[​](#included-with-gui-mode)
* adwaita-icon-theme: version 40.1.1
* at-spi2-atk: version 2.38.0
* at-spi2-core: version 2.42.0
* atk: version 2.36.0
* cairo: version 1.16.0
* dbus-glib: version 0.112
* freetype: version 2.11.1
* fribidi: version 1.0.11
* gd: version 2.3.3
* gdk-pixbuf2: version 2.42.6
* graphite2: version 1.3.14
* gtk+3: version 3.24.31
* harfbuzz: version 3.2.0
* hicolor-icon-theme: version 0.17
* libtiff: version 4.3.0
* libxkbcommon: version 1.3.1
* pango: version 1.48.11
* shared-mime-info: version 2.1
* startup-notification: version 0.12
* appres: version 1.0.5
* dejavu-fonts-ttf: version 2.37
* editres: version 1.0.7
* encodings: version 1.0.5
* fontconfig: version 2.13.92
* freeglut: version 3.2.1
* glew: version 2.2.0
* glu: version 9.0.2
* libICE: version 1.0.10
* libSM: version 1.2.3
* libX11: version 1.7.3.1
* libXau: version 1.0.9
* libXaw: version 1.0.14
* libXcomposite: version 0.4.5
* libXcursor: version 1.2.0
* libXdamage: version 1.1.5
* libXdmcp: version 1.1.3
* libXevie: version 1.0.3
* libXext: version 1.3.4
* libXfixes: version 6.0.0
* libXfont: version 1.5.2
* libXfont2: version 2.0.5
* libXfontcache: version 1.0.5
* libXft: version 2.3.4
* libXi: version 1.8
* libXinerama: version 1.1.4
* libXmu: version 1.1.3
* libXpm: version 3.5.13
* libXrandr: version 1.5.2
* libXrender: version 0.9.10
* libXres: version 1.2.1
* libXt: version 1.2.1
* libXtst: version 1.2.3
* libXxf86dga: version 1.1.5
* libXxf86misc: version 1.0.4
* libXxf86vm: version 1.1.4
* libdmx: version 1.1.4
* libevdev: version 1.12.0
* libfontenc: version 1.1.4
* libglvnd: version 1.3.3
* libpthread-stubs: version 0.4
* libxcb: version 1.14
* libxkbfile: version 1.1.0
* libxshmfence: version 1.3
* listres: version 1.0.4
* mkfontscale: version 1.2.1
* mtdev: version 1.1.6
* sessreg: version 1.1.2
* setxkbmap: version 1.3.2
* transset: version 1.0.2
* xauth: version 1.1.1
* xcb-util: version 0.4.0
* xdpyinfo: version 1.3.2
* xdriinfo: version 1.0.6
* xev: version 1.2.4
* xf86-input-evdev: version 2.10.6
* xf86-input-keyboard: version 1.9.0
* xf86-input-mouse: version 1.9.3
* xf86-input-synaptics: version 1.9.1
* xf86-video-ast: version 1.1.5
* xf86-video-mga: version 2.0.0
* xf86-video-vesa: version 2.5.0
* xhost: version 1.0.8
* xinit: version 1.4.1
* xkbcomp: version 1.4.5
* xkbevd: version 1.1.4
* xkbutils: version 1.0.4
* xkeyboard-config: version 2.34
* xkill: version 1.0.5
* xload: version 1.1.3
* xlsatoms: version 1.1.3
* xlsclients: version 1.1.4
* xmessage: version 1.0.5
* xmodmap: version 1.0.10
* xorg-server: version 1.20.14
* xprop: version 1.2.5
* xrandr: version 1.5.1
* xrdb: version 1.2.1
* xrefresh: version 1.0.6
* xset: version 1.2.4
* xsetroot: version 1.1.2
* xsm: version 1.0.4
* xtrans: version 1.4.0
* xwd: version 1.0.8
* xwininfo: version 1.1.5
* xwud: version 1.0.5
* imlib2: version 1.7.1
* fluxbox: version 1.3.7
* slim: version 1.3.6
* vte3: version 0.50.2
* sakura: version 3.5.0
* xclock: version 1.0.9
* xterm: version 370
* hwloc: version 2.2.0
#### Linux kernel[​](#linux-kernel-1)
* version: 5.15.40-Unraid (CVE-2021-33909 CVE-2021-33910
CVE-2022-0847)
* patch: "drm/i915/gen11: Moving WAs to icl\_gt\_workarounds\_init()"
* patch: "add-relaxable-rmrr-5\_8\_and\_up.patch" modified for this
kernel
* added features:
* several ACPI-related CONFIG settings
* CONFIG\_TCG\_TPM and associated TPM chip drivers
* CONFIG\_NFS\_V4: NFS client support for NFS version 4
* CONFIG\_NFSD\_V4: NFS server support for NFS version 4
* CONFIG\_USB\_RTL8152: Realtek RTL8152/RTL8153 Based USB Ethernet
Adapters
* CONFIG\_USB\_NET\_AQC111: Aquantia AQtion USB to 5/2.5GbE
Controllers support
* CONFIG\_USB4: Unified support for USB4 and Thunderbolt
* CONFIG\_USB4\_NET: Networking over USB4 and Thunderbolt cables
* CONFIG\_DRM\_I915\_GVT: Enable Intel GVT-g graphics virtualization
host support
* CONFIG\_DRM\_I915\_GVT\_KVMGT: Enable KVM/VFIO support for Intel
GVT-g
* CONFIG\_VFIO\_MDEV: Mediated device driver framework
* CONFIG\_VFIO\_MDEV\_DEVICE: VFIO driver for Mediated devices
* CONFIG\_FTRACE: Tracers
* CONFIG\_FUNCTION\_TRACER: Kernel Function Tracer
* CONFIG\_KPROBES: Kprobes
* CONFIG\_DEBUG\_KERNEL: Kernel debugging
* CONFIG\_KALLSYMS\_ALL: Include all symbols in kallsyms
* CONFIG\_ISCSI\_TCP: iSCSI Initiator over TCP/IP (per Community
Member [@ich777](https://forums.unraid.net/profile/72388-ich777/))
* CONFIG\_GIGABYTE\_WMI: Gigabyte WMI temperature driver
* BPF kernel options (user request):
* CONFIG\_BPF\_SYSCALL: Enable bpf() system call
* CONFIG\_BPF\_JIT: Enable BPF Just In Time compiler
* CONFIG\_BPF\_JIT\_ALWAYS\_ON: Permanently enable BPF JIT and remove
BPF interpreter
* CONFIG\_NET\_CLS\_BPF: BPF-based classifier
* CONFIG\_NET\_CLS\_ACT: Actions
* CONFIG\_NET\_ACT\_BPF: BPF based action
* CONFIG\_IKHEADERS: Enable kernel headers through
/sys/kernel/kheaders.tar.xz
* CONFIG\_NET\_SCH\_SFQ: Stochastic Fairness Queueing (SFQ)
* CONFIG\_NET\_ACT\_POLICE: Traffic Policing
* CONFIG\_NET\_ACT\_GACT: Generic actions
* CONFIG\_GACT\_PROB: Probability support
* CONFIG\_NET\_SCH\_INGRESS: Ingress/classifier-action Qdisc
* CONFIG\_CGROUP\_BPF: Support for eBPF programs attached to cgroups
* md/unriad: version 2.9.22
* fix: md\_sync\_limit was being ignored
#### Management[​](#management)
* better IPv6 support
* diagnostics: add bz\*.sha256 values
* diagnostics: Improved anonymization
* diagnostics: Anonymize mover
* diagnostics: better package listings in folders.txt
* diagnostics: do not anonymize 169.254.x.x addresses
* emhttp new defaults:
* root password required
* newly created shares not exported by default
* predefined 'flash' share not exported by default
* ssh, telnet: disabled by default
* NetBIOS disabled by default
* WSD enabled by default (and using newer 'wsdd2' package)
* Enhanced macOS interoperability enabled by default
* for 'domains' and 'system' shares, change 'Enable
Copy-on-write' default setting from 'No' to 'Auto'
* change poll\_attributes tunable default value from 30 min to 30
sec.
* emhttpd: add 'rootshare' reserved name
* emhttpd: fix regression: user shares should be enabled by default
* emhttpd: minimize information transmitted by UpdateDNS function
* emhttpd: use shfs ioctl to invalidate shfs cached share info when
share cfg changes
* emhttpd: fix incorrect handling of unassigned device read/write
counters
* emhttpd: fix sometimes wrong device name assigned to hotplugged
unassigned devices
* emhttpd: fix btrfs-replace case
* emhttpd: fix btrfs pool device replace still showing 'missing'
* emhttpd: delete all PHP sessions when root password is changed (logs
everyone out)
* emhttpd: correct device status handling for single-slot pools
* emhttpd: collapse multiple underscores within nvme /dev/disk/by-id
symlinks to single underscore
* firefox: version 91.0.r20210823123856 (AppImage)
* mover: fix bug not moving shares with embedded spaces
* mover: append '.partial' suffix to filename when move in-progress
* rc.docker: fix startup network race condition
* rc.libvirt: Prevent Unraid from hanging when the array is stopped,
while VMs are in paused or suspended state
* rc.libvirt: test the existence of a VM before adding it to the NAMES
list
* rc.mcelog: mcelog added to base distro
* rc.nginx: change fastcgi\_read\_timeout from 120s to 640s
* rc.nginx: remove ttyd side-loading
* rc.nginx: support Lets Encrypt wildcard certs
* rc.nginx: support custom wildcard self-signed certs
* rc.nginx: self-signed cert subject OU change from "unRAID" to
"Unraid"
* rc.nginx: ignore case in processing Subject field for custom
certificates
* rc.nginx: remove default server block returning 404 for https if
USE\_SSL==no and no CA-signed cert
* rc.samba: disable SMB Multi Channel by default; add control to
Settings/SMB Settings page
* rc.S: check bz file sha256 during initial boot
* shfs: fix bug where permissions being ignored
('default\_permissions' was missing in mount command)
* sysctl: handle net.netfilter.nf\_conntrack\_count max exceeded
(increase setting to 131072)
* ttyd: fix garbled text in local Firefox Terminal windows
* upgradepkg: do not upgrade if existing package is newer
* wsdd2: listen only on active interface by default (br0, bond0, or
eth0)
* WebGUI: Integrate header UPC
* WebGUI: Add Apps link to install CA
* WebGUI: Add internal container reference
* WebGUI: Add new setting "Terminal font size"
* WebGUI: Add notification agent for Pushplus
* WebGUI: Add notification agent for ServerChan
* WebGUI: Add 'root' folder protection to filetree
* WebGUI: Add tracking after system shutdown
* WebGUI: Add vmxnet3 and e1000 into available NICs for VMs
* WebGUI: Added "User 'root'" reference on Management Access page
* WebGUI: Added notify when plugin fails to install
* WebGUI: Added: Cumulative parity check. This allows a parity check
to be divided over multiple time windows.
* WebGUI: Adjusted row highlighting on main and shares page to better
suit people with color impairment
* WebGUI: Allow CA to get all docker info without having to download
icons if not present
* WebGUI: Allow all notification agents to send links
* WebGUI: Allow ruleset for local rules in rsyslog.conf
* WebGUI: Allow simultaneous log and console windows for containers
* WebGUI: Always show "WebUI" for user specified URLs
* WebGUI: BTRFS balance and scrub scheduler
* WebGUI: BTRFS balance: fix recommendation message when volume is
empty
* WebGUI: Better array sync when multiple sessions are opened
* WebGUI: Better translation of docker container variables
* WebGUI: CSS minor corrections
* WebGUI: Change Dashboard Parity status to be invalid and not
emulated.
* WebGUI: Change page switching to better suit Safari on mobile
devices
* WebGUI: Change parity sync notification from error to notice level
* WebGUI: Changed header selection for better support of Android
* WebGUI: Check for flash offline / quick check on if it is corrupted
* WebGUI: Cleanup styles folder
* WebGUI: Compress too long share names in dropdown menus
* WebGUI: ContextMenu: added option "button": defaults to "left"
(current behavior), other options are "right" and "both"
* WebGUI: Convert notify polling to Nchan
* WebGUI: Create favicon.ico
* WebGUI: Create syslog entry when user logs out
* WebGUI: Dashboard: add CPU and NETWORK chart
* WebGUI: Dashboard: fix bar color when disk thresholds are disabled
* WebGUI: Dashboard: separate cpu details and graph view
* WebGUI: Delete DockerRepositories.page see [this post for info on
their
replacements](https://forums.unraid.net/topic/112170-allow-template-repositories-to-be-hosted-from-other-sources/page/2/#comment-1126265)
* WebGUI: Device\_list replace .png icon with font icon
* WebGUI: Diagnostics fix plugin deprecated max version error
* WebGUI: Diagnostics: Add share summary
* WebGUI: Diagnostics: Include current plugin versions
* WebGUI: Diagnostics: Remove lines from go containing passwords etc
* WebGUI: Diagnostics: Revamp anonymization
* WebGUI: Diagnostics: add DHCP log
* WebGUI: Diagnostics: add check for DNS Rebinding Protection
* WebGUI: Diagnostics: add url details
* WebGUI: Diagnostics: privatize routable IPs
* WebGUI: DisplaySettings: add "showBannerGradient"
* WebGUI: Do not highlight false positive ERST error
* WebGUI: Docker page loading improvements
* WebGUI: Docker settings: suppress browser presets
* WebGUI: Docker utilization warning only when image file
* WebGUI: Docker: Add Network / Privacy Category
* WebGUI: Docker: Add crypto as a category
* WebGUI: Docker: Do not update installed user templates
* WebGUI: Docker: Fix incorrect caching when deleting / recreating
image
* WebGUI: Docker: Handle edge case involving browser back button when
within CA in certain unlikely circumstances
* WebGUI: Docker: Ignore icon references to default question mark
* WebGUI: Docker: Only save templates as v2
* WebGUI: Docker: Silence PHP errors when editing a template if
corruption exists
* WebGUI: Docker: Support CA tag
* WebGUI: Docker: Support ReadMe in context menus
* WebGUI: Docker: add description to all custom networks
* WebGUI: Docker: add route for remote WireGuard access:
* "Host access to custom networks" must be enabled to allow
access
* Containers with network 'br0' can be remotely accessed by
WireGuard without the need to configure static routes on the
home router (gateway)
* WebGUI: Docker: add time unit in settings
* WebGUI: Docker: add WireGuard description in network selection
* WebGUI: Docker: compress too long author names
* WebGUI: Docker: fix GUI may hang when multiple screens are opened
* WebGUI: Docker: fix overlapping container ID display
* WebGUI: Docker: fix spinner will not disappear after attempting to
uninstall a non-existent container
* WebGUI: Docker: fixed filetree sometimes not visible
* WebGUI: Docker: fixed header display causes gap
* WebGUI: Docker: fixed list display in fixed view mode
* WebGUI: Docker: fixed template removal when no containers exist
* WebGUI: Docker: make popup window fit in browser window
* WebGUI: Docker: optimized contextmenu
* WebGUI: Docker: process bash ANSI colors in web log display
* WebGUI: Docker: remove close button in popup window
* WebGUI: Docker: translation optimization
* WebGUI: Docker: update window uses color of selected theme
* WebGUI: Edit/Add Container: Fix browser console error
* WebGUI: Enable/Disable SMART extended test depending on spin down
delay setting
* WebGUI: Error checking etc on ports for syslog server
* WebGUI: Escape double quotes in text input submit
* WebGUI: Expand file type icon selection
* WebGUI: Expand ipaddr() with protocol: protocol defaults to ipv4 in
case of ipv4 + ipv6
* WebGUI: Fix CPU model sometimes not present
* WebGUI: Fix PHP error when calculating balance level
* WebGUI: Fix corruption check after a New Config is issued
* WebGUI: Fix missing csrf-token in Notify
* WebGUI: Fix monitor false positives
* WebGUI: Fix network bonding display
* WebGUI: Fix pools display on Main page when empty pool exists
* WebGUI: Fix regression error for themes auzre & gray
* WebGUI: Fix side bar of themes azure/gray in Firefox
* WebGUI: Fix: Improved DNS Rebinding checks
* WebGUI: Fixed PHP errors for share and disk calculations
* WebGUI: Fixed balance/scrub schedule not saved when device name has
"-" in it
* WebGUI: Fixed comments field only for selected disks
* WebGUI: Fixed parity duration + speed when paused/resumed
* WebGUI: Fixed smart temperature settings sometimes not possible
* WebGUI: Fixed: VM 9p add share issue
* WebGUI: Fixed: buttons not working in device info when no device is
present
* WebGUI: Fixed: missing samesite attribute in cookies
* WebGUI: Fixed: parity history sometimes wrongly processed
* WebGUI: Fixed: race condition when array is stopped and device
assignments are changed
* WebGUI: Fixed: specific disk settings for pool devices only
* WebGUI: Fixed: speed calculation of parity check
* WebGUI: Fixed: spinner stays visible after docker command
* WebGUI: Fixes and enhancements in Browse function
* WebGUI: Font files update:
* Adjust css settings
* Cleanup font files, use only woff format
* Restore clear-sans font
* Update bitstream font
* bitstream → source code pro
* clear-sans → source sans pro
* WebGUI: Force creation of root password
* WebGUI: Highlight selected row when hovering over array or shares
* WebGUI: Improved background process detection and handling
* WebGUI: Improved format of stale and error plugin pages
* WebGUI: Include links in email and Discord agent notifications
* WebGUI: Let setting "showBannerGradient" default to "yes"
* WebGUI: Limit popup window width on ultrawide monitors
* WebGUI: Log docker icon download failures
* WebGUI: Lower update frequency of monitor function to better suit
mobile devices
* WebGUI: Main page - lower table update frequency for better
responsiveness of links
* WebGUI: Make WireGuard trademark visible on "full" page
* WebGUI: Make links in help text standout (red)
* WebGUI: Management: fix ports in use check
* WebGUI: Miscellaneous updates and fixes
* WebGUI: Move Start button below encryption field
* WebGUI: NFS: fix copying of hostList after READ operation
* WebGUI: Nchan: Use multiplexed channels and add error reporting
* WebGUI: Only allow png files to be uploaded as user image
* WebGUI: Open terminal window with dynamic size
* WebGUI: Parity check: allow spinup/spindown when operation is paused
* WebGUI: Parity check: re-introduce Done button when finished
* WebGUI: Parity operation enhancements:
* Add disk clear action
* Add parity operation action to history view
* Added "size" column to parity history
* CSS adjustment in SMART attributes
* Correct calculations for data-rebuild smaller than parity
* Separate Parity-Sync and Data-Rebuild as individual actions
* Show additional buttons in Array Stopped state
* Textual enhancements
* Use Nchan updates for copying/clearing progress
* WebGUI: Parity: shown duration time excluding idle time
* WebGUI: Plugin manager: fix branch select gets unnecessary disabled
* WebGUI: Plugins page loading improvements
* WebGUI: Proactive script security hardening
* WebGUI: Relax SMART detection logic
* WebGUI: Relax update frequency a bit
* WebGUI: Remove Nchan error detection (Rely on the automatic
reconnect of Nchan to re-establish connections when communication is
slow)
* WebGUI: Remove deprecated font extensions: eot, svg, ttf
* WebGUI: Replace polling scripts with event driven Nchan interface
* WebGUI: Revert back to default capitalization of device names
* WebGUI: Revised filedrop.js
* WebGUI: Right-clicking or long-clicking a menu item should open the
selected menu
* WebGUI: SSH authorized keys UI
* WebGUI: Set Main page update frequency to 1s for better support of
mobile devices
* WebGUI: Shares: fix wrong size computation
* WebGUI: Show IP on VM Manager VM Page
* WebGUI: Show management access and shares access groups for users
* WebGUI: Show warning when javascript is disabled
* WebGUI: Sign-in required to provision/renew Unraid LE SSL
certificate
* WebGUI: Silence PHP error on syslinux page if flash drive is missing
* WebGUI: Support future T2FA
* WebGUI: Support multi-language in filetree display
* WebGUI: Suppress IPv6 anycast addresses in routing table
* WebGUI: Suppress non-relevant IPv6 routes in routing table
* WebGUI: System devices additions
* WebGUI: System info: fix translation
* WebGUI: Translation support (Unraid.net)
* WebGUI: Translations: fix creation of empty sessions
* WebGUI: Update Credits.page
* WebGUI: Update DashStats.page
* WebGUI: Update FileTree.php
* WebGUI: Update GUI with latest helptext
* WebGUI: Update Outlook/Hotmail smtp settings
* WebGUI: Update alert text
* WebGUI: Update css files to use woff and woff2 formats only
* WebGUI: UpdateDNS to prefer IPv4 first and then IPv6
* WebGUI: Updated bitstream font to support more languages
* WebGUI: Updated help text for Display settings and Docker
* WebGUI: Use background checking for flash corruption
* WebGUI: Use https for internet connectivity check
* WebGUI: Use tabbed view for device information page
* WebGUI: Use ttyd for logging windows
* WebGUI: VM Manager: add virtio-win-0.1.208.iso download link
* WebGUI: VM Manager: added Windows 11 template and OVMF TPM
* WebGUI: VM editor style update
* WebGUI: VM: fix missing path selection (for GPU firmware file)
* WebGUI: VMs: automatically update virtio-win iso list
* WebGUI: VMs: optimized contextmenu
* WebGUI: Validate WebGUI ports before applying
* WebGUI: Validate destination of VirtIO ISO downloads
* WebGUI: When viewing source, identify which .page file is
responsible
* WebGUI: WireGuard integrated
* WebGUI: WireGuard updates:
* Add tunnel routing for docker containers
* Automatically make the WG tunnel available to containers (custom
network)
* Make import config file of VPN providers more robust.
* VPN tunneled access for docker
* VPN tunneled access for system
* WebGUI: WireGuard: Add warning when tunnel deletion fails
* WebGUI: WireGuard: Introduce new network modes:
* WebGUI: WireGuard: add logic to recreate networks after reboot
* WebGUI: WireGuard: fixed proper handling of ipv4 + ipv6 tunnels
* WebGUI: WireGuard: preset peer DNS server with "Remote tunneled
access"
* WebGUI: WireGuard: use kill switch when tunnel inactive
* WebGUI: WireGuard: user nginx settings and unraid.net api
* WebGUI: WireGuard: warn when directly connected with public IP
* WebGUI: WireGuard: fix import function to accept all keys
* WebGUI: WireGuard: make management interface selectable:
* WebGUI: WireGuard: make management interface selectable:
* Defaults to eth0 - future expansion
* WebGUI: WireGuard: strip ListenPort from file input:
* ListenPort must be unique, let WG generate a random local port
instead
* WebGUI: css scrollbar enhancements
* WebGUI: diagnostics: fix: anonymize myunraid.net urls
* WebGUI: dockerMan Security: Remove HTML tags from Config elements
* WebGUI: dockerMan: remove HTML from descriptions
* WebGUI: fix: password lockouts not being cleared properly
* WebGUI: fix: remove reauthentication msg from email notifications
* WebGUI: improve: Highlight selected row when hovering over array or
shares
* WebGUI: jQuery: version 3.6.0
* WebGUI: present CA-signed certificate subject as a link
* WebGUI: privatize host in diagnostics
* WebGUI: refactor UpdateDNS.php: anonymize verbose output by default,
other improvements
* WebGUI: remove 'My Servers' skeleton page
* WebGUI: require sign in to provision cert
* WebGUI: support simultaneous LAN SSL with self-signed cert and
DNS-based SSL with Lets Encrypt cert
* WebGUI: various Multi-language corrections
["WireGuard" and the "WireGuard" logo are registered trademarks of Jason A. Donenfeld.](https://www.wireguard.com/)
## Patches[​](#patches)
With the [Unraid Patch plugin](https://forums.unraid.net/topic/185560-unraid-patch-plugin/) installed, visit ***Tools → Unraid Patch*** to get the following patches / hot fixes:
* A subset of security updates, see [this blog post](https://unraid.net/blog/cvd) for details. We recommend upgrading to the latest stable release for additional security updates.
* [Version 6.10.0 2022-05-07](#version-6100-2022-05-07)
* [UPC and My Servers Plugin](#upc-and-my-servers-plugin)
* [Security Changes](#security-changes)
* [Virtualization](#virtualization)
* [Docker](#docker)
* [WireGuard](#wireguard)
* [Linux Kernel](#linux-kernel)
* [Base Packages](#base-packages)
* [Other Improvements](#other-improvements)
* [Other Bug Fixes](#other-bug-fixes)
* [Change Log vs. Unraid OS 6.9.2](#change-log-vs-unraid-os-692)
* [Patches](#patches)