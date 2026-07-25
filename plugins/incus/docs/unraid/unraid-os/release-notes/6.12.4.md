Version 6.12.4 2023-08-31 | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
## Upgrade notes[​](#upgrade-notes)
### Known issues[​](#known-issues)
Please see the [6.12.0 release notes](/unraid-os/release-notes/6.12.0/#known-issues) for general known issues.
### Rolling back[​](#rolling-back)
Before rolling back to an earlier version, it is important to ensure Bridging is enabled:
* ***Settings \> Network Settings \> eth0 \> Enable Bridging*** = Yes
Then Start the array (along with the Docker and VM services) to update your Docker containers, VMs, and
WireGuard tunnels back to their previous settings which should work in older releases.
Once in the older version, confirm these settings are correct for your setup:
* ***Settings \> Docker \> Host access to custom networks***
* ***Settings \> Docker \> Docker custom network type***
If rolling back earlier than 6.12.0, also see the [6.12.0 release notes](/unraid-os/release-notes/6.12.0/#rolling-back).
## Fix for macvlan call traces[​](#fix-for-macvlan-call-traces)
The big news in this release is that we have resolved issues related to macvlan call traces and crashes!
The root of the problem is that macvlan used for custom Docker networks is unreliable when the parent interface is a
bridge (like br0), it works best on a physical interface (like eth0) or a bond (like bond0). We believe this to be a longstanding kernel
issue and have posted a [bug report](https://bugzilla.kernel.org/show_bug.cgi?id=217777).
If you are getting call traces related to macvlan, as a first step we recommend navigating to ***Settings \> Docker***,
switch to advanced view, and change the "Docker custom network type" from macvlan to ipvlan. This is the default
configuration that Unraid has shipped with since version 6.11.5 and should work for most systems.
If you are happy with this setting, then you are done! You will have no more call traces related to macvlan
and can skip ahead to [the next section](#system-drivers-page).
However, some users have reported issues with port forwarding from certain routers (Fritzbox) and reduced functionality
with advanced network management tools (Ubiquity) when in ipvlan mode.
For those users, we have a new method that reworks networking to avoid issues with macvlan. Tweak a few settings and your
Docker containers, VMs, and WireGuard tunnels should automatically adjust to use them:
* ***Settings \> Network Settings \> eth0 \> Enable Bonding*** = Yes or No, either work with this solution
* ***Settings \> Network Settings \> eth0 \> Enable Bridging*** = No (this will automatically enable macvlan)
* ***Settings \> Docker \> Host access to custom networks*** = Enabled
Note: if you previously used the [2-nic docker segmentation method](https://forums.unraid.net/topic/137048-guide-how-to-solve-macvlan-and-ipvlan-issues-with-containers-on-a-custom-network/),
you will also want to revert that:
* ***Settings \> Docker \> custom network on interface eth0 or bond0*** (i.e. make sure eth0/bond0 is configured for the custom network, not eth1/bond1)
When you Start the array, the host, VMs, and Docker containers will all be able to communicate, and there should be no more call traces!
### Troubleshooting[​](#troubleshooting)
* If your Docker containers with custom IPs are not starting, edit them and change the "Network type" to "Custom: eth0" or "Custom: bond0". We attempted
to do this automatically, but depending on how things were customized you may need to do it manually.
* If your VMs are having network issues, edit them and set the Network Source to "vhost0". Also, ensure there is a MAC address assigned.
* If your WireGuard tunnels will not start, make a dummy change to each tunnel and save.
* If you are having issues port forwarding to Docker containers (particularly with a Fritzbox router) delete and recreate the port
forward in your router.
### To get a little more technical…[​](#to-get-a-little-more-technical)
After upgrading to this release, if bridging remains enabled on eth0 then everything works as it used to. You can attempt to work
around the call traces by disabling the custom Docker network, or using ipvlan instead of macvlan, or using the 2-nic Docker
segmentation method with containers on eth1.
Starting with this release, when you disable bridging on eth0 we create a new macvtap network for Docker containers and VMs to use.
It has a parent of eth0 instead of br0, which is how we avoid the call traces.
A side benefit is that macvtap networks are reported to be faster than bridged networks, so you may see speed improvements when
communicating with Docker containers and VMs.
FYI: With bridging disabled for the main interface (eth0), then the Docker custom network type will be set to macvlan and hidden
unless there are other interfaces on your system that have bridging enabled, in which case the legacy ipvlan option is available.
To use the new fix being discussed here you will want to keep that set to macvlan.
## System Drivers page[​](#system-drivers-page)
Navigate to ***Tools \> System Drivers*** for visibility into the drivers available/in use on your system. 3rd party drivers installed
by plugins (such as NVIDIA and Realtek) have an icon that links to the support page for that driver. You can also
now add/modify/delete the modeprobe.d config file for any driver without having to find that file on your flash drive.
## Other bug fixes and improvements[​](#other-bug-fixes-and-improvements)
* This release resolves corner cases in networking, Libvirt, Docker, WireGuard, NTP, NGINX, NFS and RPC. And includes an improvement
to the VM Manager so it retains the VNC password during an update.
* The shutdown process was modified to allow the NUT plugin to properly shut the system down.
* The notification display time before auto-closing is now configugurable (see ***Settings \> Notification Settings***).
* A small change is that packages in /boot/extra are now treated more like packages installed by plugins, and the installation is
logged to syslog rather than to the console.
* The Update OS process will automatically update the Plugin-Update-Helper script if necessary.
## Changes vs. [6.12.3](/unraid-os/release-notes/6.12.3/)[​](#changes-vs-6123)
### Base distro[​](#base-distro)
* create\_network\_ini:
* fixed dhcp hook
* improved IP address collection
* diagnostics:
* Add previous Unraid version to diagnostics version txt file.
* Add ntp.conf, sshd.config, and servers.conf (with anonymized URLs)
* anonymize IP addresses
* docker:
* add routing when shim or macvtap network is used
* fix routing when "host access" is enabled
* remove IPv6 from shim/vhost interface (some routers are incompatible)
* libvirt, nginx, nfs, rpc: changed running process detection
* nfsclient: start negotiation with v4, turn off atime modification
* rc.6: leave /usr and /lib mounted during shutdown
* rc.docker:
* create same IPv6 network for containers and services
* add more logging when stopping dockerd
* rc.inet1:
* do not use promiscuous mode for bridging
* add persistent option to dhcpcd
* rc.library: interfaces always listed in the same order, fix show ipv6
* rc.libvirt: remove 'itco' watchdog from XML if present
* rc.local: annotate auto-generated /etc/modprobe.d/zfs.conf file
* rc.services:
* add logging
* exclude WireGuard "VPN tunneled access for docker" tunnels from services
* exclude WireGuard tunnels for ntp (code optimization)
#### Package updates[​](#package-updates)
* btrfs-progs: 6.3.3
* curl: version 8.2.0 (CVE-2023-32001)
* firefox: version 117.0.r20230824132758 (AppImage)
* kernel-firmware: version 20230724\_59fbffa
* krb5: version 1.19.2 (CVE-2023-36054)
* openssh: version 9.3p2 (CVE-2023-38408)
* openssl: version 1.1.1v (CVE-2023-3817 CVE-2023-3446)
* samba: version 4.17.10 (CVE-2023-3496 CVE-2022-2127 CVE-2023-34968 CVE-2023-3496 CVE-2023-3347)
### Linux kernel[​](#linux-kernel)
* version 6.1.49 (CVE-2023-20593)
* CONFIG\_SCSI\_MPI3MR: Broadcom MPI3 Storage Controller Device Driver
### WebGUI[​](#webgui)
* Dashboard: hide ZFS bar when no ZFS is used
* Docker settings: fix subnet sizes
* Feedback: refactor feedback script
* Network settings: fix DNS settings sometimes disappear
* Notifications: new notification option: auto-closure time, default is 5 seconds
* Pools: minimum free space: only enabled when array is stopped
* Shares and Pools: show "Minimum free space" as absolute number instead of percentage
* System Drivers: new page
* Translations: trim key and value in language files
* VM Manager: Retain VNC password during update.
* VM Manager: Remove downloaded '.vv' files.
* CSS: set overflow-x to 'auto'
* update monitor\_nchan
## Patches[​](#patches)
With the [Unraid Patch plugin](https://forums.unraid.net/topic/185560-unraid-patch-plugin/) installed, visit ***Tools → Unraid Patch*** to get the following patches / hot fixes:
* A subset of security updates, see [this blog post](https://unraid.net/blog/cvd) for details. We recommend upgrading to the latest stable release for additional security updates.
* [Upgrade notes](#upgrade-notes)
* [Known issues](#known-issues)
* [Rolling back](#rolling-back)
* [Fix for macvlan call traces](#fix-for-macvlan-call-traces)
* [Troubleshooting](#troubleshooting)
* [To get a little more technical…](#to-get-a-little-more-technical)
* [System Drivers page](#system-drivers-page)
* [Other bug fixes and improvements](#other-bug-fixes-and-improvements)
* [Changes vs. 6.12.3](#changes-vs-6123)
* [Base distro](#base-distro)
* [Linux kernel](#linux-kernel)
* [WebGUI](#webgui)
* [Patches](#patches)