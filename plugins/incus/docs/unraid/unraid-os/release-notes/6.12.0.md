Version 6.12.0 2023-06-14 | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
## Upgrade notes[​](#upgrade-notes)
Upon boot, if all PCI devices specified in `config/vfio-pci.cfg` do not properly bind, VM Autostart is prevented. You may still
start individual VMs. This is to prevent Unraid host crash if hardware PCI IDs changed because of a kernel update or physical hardware
change. To restore VM autostart, examine `/var/log/vfio-pci-errors` and remove offending PCI IDs from `config/vfio-pci.cfg` file and
reboot.
If you revert back from 6.12 to 6.11.5 or earlier, you have to force update all your Docker containers and start them
manually after downgrading. This is necessary because of the underlying change to cgroup v2 starting with 6.12.0-rc1.
Linux [Multi-Gen LRU](https://lwn.net/Articles/856931/) is a relatively new feature now included but not
enabled by default. You can enable by adding this line to your 'config/go' file:
`echo y \> /sys/kernel/mm/lru\_gen/enabled`
If you revert back from 6.12 to 6.11.5 or earlier, you may need to remove that line.
If you created any zpools using 6.12.0-beta5, please Erase those pools and recreate.
### Obsolete/Broken plugins[​](#obsoletebroken-plugins)
There are a few plugins which are known to be incompatible with Unraid 6.12, and upon boot will not be installed. You will get a notification for each plugin
that is affected and can review the list by going to **Plugins/Plugin File Install Errors**.
* disklocation-master version 2022.06.18 (`Disk Location` by olehj, breaks the dashboard)
* Update this plugin before upgrading the OS
* plexstreams version 2022.08.31 (`Plex Streams` by dorgan, breaks the dashboard)
* Update this plugin before upgrading the OS
* corsairpsu version 2021.10.05 (`Corsair PSU Statistics` by Fma965, breaks the dashboard)
* Update this plugin before upgrading the OS
* gpustat version 2022.11.30a (`GPU Statistics` by b3rs3rk, breaks the dashboard)
* Switch to `GPU Statistics` by SimonF
* ipmi version 2021.01.08 (`IPMI Tools` by dmacias72, breaks the dashboard)
* Switch to `IPMI Tools` by SimonF
* nut version 2022.03.20 (`NUT - Network UPS Tools` by dmacias72, breaks the dashboard)
* Switch to `NUT - Network UPS Tools` by SimonF
* NerdPack version 2021.08.11 (`Nerd Tools` by dmacias72)
* Switch to `NerdTools` by UnRAIDES
* upnp-monitor version 2020.01.04c (`UPnP Monitor` by ljm42, not PHP 8 compatible)
* ZFS-companion version 2021.08.24 (`ZFS-Companion` by campusantu, breaks the dashboard)
Some of the affected plugins have been taken over by different developers, we recommend that you go to the **Apps** page and search for replacements. Please ask
plugin-specific questions in the support thread for that plugin.
### Known issues[​](#known-issues)
#### Crashes related to i915 driver[​](#crashes-related-to-i915-driver)
Note: this is no longer an issue as of Unraid [6.12.6](/unraid-os/release-notes/6.12.6/#bug-fixes-and-improvements).
We are aware that some 11th gen Intel Rocket Lake systems are experiencing crashes related to the i915 iGPU. If your Rocket Lake system crashes under
Unraid 6.12.0-6.12.5, open a web terminal and type this, then reboot:
`echo "options i915 enable\_dc=0" \>\> /boot/config/modprobe.d/i915.conf`
Setting this option may result in higher power use but it may resolve this issue for these GPUs.
#### Call traces related to macvlan[​](#call-traces-related-to-macvlan)
If you are getting call traces related to macvlan, as a first step we'd recommend navigating to ***Settings \> Docker***, switching to advanced view, and changing the **Docker custom network type** from **macvlan** to **ipvlan**. This is the default configuration that Unraid has shipped with since version 6.11.5 and should work for most systems.
However, some users have reported issues with port forwarding from certain routers (Fritzbox) and reduced functionality with advanced network management tools (Ubiquity) when in ipvlan mode.
In 6.12.0, the [two-nic docker segmentation method](https://forums.unraid.net/topic/137048-guide-how-to-solve-macvlan-and-ipvlan-issues-with-containers-on-a-custom-network/) is a viable workaround, but our recommendation is to upgrade to Unraid [6.12.4](/unraid-os/release-notes/6.12.4/) which has a better solution.
#### Plex[​](#plex)
If Docker containers have issues starting after a while, and you are running Plex, go to your Plex Docker container settings,
switch to advanced view, and add this to the Extra Params: `--no-healthcheck`
### Rolling back[​](#rolling-back)
See the comments under [Upgrade Notes](#upgrade-notes)
## ZFS pools[​](#zfs-pools)
New in this release is the ability to create a ZFS file system in a user-defined pool. You may also format any data
device in the unRAID array with a single-device ZFS file system. For a good overview of ZFS,
see [this article](https://arstechnica.com/information-technology/2020/05/zfs-101-understanding-zfs-storage-and-performance/).
We are splitting full ZFS implementation across two Unraid OS releases. Initial support in this release includes:
* Support raid0, mirror, raidz1, raidz2 and raidz3 root profiles. Up to 4-way mirror in a mirror vdev. Multiple vdev groups.
* Support removing single device: if device is still present in server, 'wipefs' is used to clear the partition table.
* Support replacing single missing device with a new device of same or larger size.
* Support scheduled trimming of ZFS pools.
* Support pool rename.
* Pool names must begin with a lowercase letter and only contain lowercase letters, digits, the underscore,
and dash. Pool names must not end with a digit.
* Non-root vdev cannot be configured in this release, however, they can be imported. Note: imported hybrid pools may not be
expanded in this release.
* Pools created on other systems may or may not import depending on how the pool was created. A future update will permit
importing pools from any system.
A ZFS pool has three variables:
* profile - the root data organization: raid0, mirror (up to 4-way), raidz1, raidz2, raidz3
* width - the number of devices per root vdev
* groups - the number of root vdevs in the pool
At time of ZFS pool creation, the WebGUI will present all topology options based on the number of devices assigned to the pool.
Special treatment for root single-vdev mirrors:
* A single-device ZFS pool can be converted to multiple-device mirror by adding up to 3 additional devices in one operation.
* A 2-device mirror can be increased to 3-device by adding a single device; similarly, a 3-device mirror can be increased to
4-device mirror by adding a single device.
To add an additional root vdev, you must assign 'width' number of new devices to the pool at the same time. The new vdev will be
created with the same 'profile' as the existing vdevs. Additional flexibility in adding/expanding vdevs will be provided in a future update.
Pools created with the **steini84** plugin can be imported as follows: First create a new pool with the number
of slots corresponding to the number of devices in the pool to be imported. Next assign all the devices to
the new pool. Upon array Start the pool should be recognized, though certain zpool topologies may not be
recognized (please report). Please note that only pools using partition #1 can be imported in this release, e.g. this `lsblk` output:
```
`
# lsblk
NAME MAJ:MIN RM SIZE RO TYPE MOUNTPOINTS
sdb 8:16 0 7.3T 0 disk
├─sdb1 8:17 0 2G 0 part
└─sdb2 8:18 0 7.3T 0 part
`
```
indicates that the second (`sdb2`) partition of the disk is being used for data, and **cannot** be imported.
Mixed topologies are not supported. For example, a pool with both a mirror root vdev and a raidz root vdev is not
recognized.
Autotrim can be configured as **on** or **off** (except for single-device ZFS volumes in the unRAID array).
Compression can be configured as **on** or **off**, where **on** selects **lz4**. Future update will permit specifying other algorithms/levels.
When creating a new ZFS pool you may choose **zfs - encrypted**, which, like other encrypted volumes, applies device-level encryption
via LUKS. ZFS native encryption is not supported at this time.
During system boot, the file /etc/modprobe.d/zfs.conf is auto-generated to limit the ZFS ARC to 1/8 of installed memory. This can
be overridden if necessary by creating a custom 'config/modprobe.d/zfs.conf' file. Future update will include ability to configure
the ARC via WebGUI, including auto-adjust according to memory pressure, e.g., VM start/stop.
Top-level user shares in a ZFS pool are created as datasets instead of ordinary directories.
## Share storage conceptual change[​](#share-storage-conceptual-change)
New in this release is a conceptual change in the way storage is assigned to shares. The old concept of main storage being the unRAID array
with an optional "Cache" is confusing to many new users, especially since *cache* has a specific meaning in ZFS.
Also outlined below, we introduced the concept of an *exclusive share*. This is simply a share where all the data exists in a single named
pool. In this case, the FUSE-based User Share file system returns a **symlink** to the actual share directory in the pool. All operations within
the share, including data transfer, therefore bypass FUSE, resulting in greater performance. This feature is primarily aimed at maximizing
I/O for large fast ZFS pools accessed via a fast network
This is a front-end change only; existing shares will be viewed with this new structure automatically upon upgrading,
and will automatically revert to the previous style if you revert to an earlier version.
Configuring the storage options for a share is specified using two inputs:
* Primary storage
* Secondary storage
Primary storage is where **new** files/folders are created. If Primary storage is below the Minimum Free Space setting then new files
and folders will be created in Secondary storage, if configured.
Each input presents a drop-down which lists "array", "none", and each named pool as a selection according to some configuration rules:
For the Primary storage drop-down:
* the "none" option is omitted, ie, Primary storage must be selected
* any named pool can be selected
* "Array" can be selected (meaning the unRAID array)
For the Secondary storage drop-down:
* the "none" option is included, ie, Secondary storage is optional
* if Primary storage is a pool name, then the only options are "none" and "Array". In the future other pools will be listed here as well.
* if Primary storage is "Array", then only "none" appears as an option
When "Array" is selected for either Primary or Secondary storage, a set of additional settings slide in:
* Allocation method
* Included disk(s)
* Excluded disk(s)
* Split level
When a *btrfs* named pool is selected for either Primary or Secondary storage, an additional setting slides in:
* Enable Copy-on-write
When a *ZFS* named pool is selected for either Primary or Secondary storage, there are no additional settings at this time
but there could be some in the future. For example, since a share is created as a ZFS dataset, it could have a different
compression setting than the parent pool if we need to implement this.
### Mover action[​](#mover-action)
When there is Secondary storage configured for a share the "Mover action" setting becomes enabled, letting the user
select the transfer direction of the mover:
* Primary to Secondary (default)
* Secondary to Primary
### Exclusive shares[​](#exclusive-shares)
We added a new setting: "Settings/Global Share Settings/Permit exclusive shares" [Yes/No] default: No. If set to Yes
and if Primary storage for a share is a pool and Secondary storage is set to "none", then a symlink is created
in /mnt/user/*share* pointing directly to the pool share directory. (An additional check is made to ensure the share also does
not exist on any other volumes.)
There is a new status flag, 'Exclusive access' which is set to 'Yes' when a symlink is in place; and, 'No' otherwise.
Exclusive shares are also indicated on the Shares page.
The advantage of setting up symlinks is that I/O bypasses FUSE-based user share file system (shfs) which can significantly
increase performance.
There are some restrictions:
* Both the share Min Free Space and pool Min Free Space settings are ignored when creating new files on an exclusive share.
* If a share is NFS-exported it cannot be exclusive, i.e., the syslink is not created. This is because symlinks are resolved in
the NFS client, not the server. We hope to lift this restriction in a future update.
### Clean Up button[​](#clean-up-button)
Appearing on the Shares page, a button called CLEAN UP, when enabled indicates there are config/share/*share*.cfg files for
shares that do not exist. Clicking this button will remove those files.
## Other Improvements[​](#other-improvements)
### btrfs[​](#btrfs)
Autotrim can be configured as **on** or **off** when used in a pool.
Compression can be configured as **on** or **off**. **on** selects **zstd**. Future update to permit specifying other algorithms/levels.
### xfs[​](#xfs)
Autotrim can be configured as **on** or **off** when used as a single-slot pool.
### Docker[​](#docker)
It is possible to configure the **Docker data-root** to be placed in a directory on a ZFS storage pool. In this
case, Docker will use the 'zfs' storage driver. This driver creates a separate dataset for each image layer. Because
of this, here is our recommendation for setting up Docker using **directory**:
First, create a **docker** user share configured as follows:
* Share name: **docker**
* Primary storage: ***name of your ZFS pool***
* Secondary storage: **none**
Next, on **Docker settings** page:
* Enable docker: **Yes**
* Docker data-root: **directory**
* Docker directory: **/mnt/user/docker**
If you ever need to delete the docker persistent state, then bring up
the Docker settings page and set **Enable docker** to **No** and click **Apply**. After docker has shut down click
the **Delete directory** checkbox and then click **Delete**. This
will result in deleting not only the various files and directories, but also all layers stored as datasets.
Before enabling Docker again, be sure to first re-create the **docker** share as described above.
#### Other Docker changes[​](#other-docker-changes)
* CreateDocker: changed label **Docker Hub URL** to **Registry URL** because of GHCR and other new container
registries becoming more and more popular.
* Honor user setting of stop time-out.
* Accept images in OCI format.
* Add option to disable readmore-js on container table.
* Fix: Docker Containers console will not use bash if selected.
* Fix issue detecting proper shutdown of docker.
* rc.docker: give dockerd 30 sec instead of 15 to start up.
### VM Manager[​](#vm-manager)
If you enable copy/paste for virtual consoles you need to install additional software on the client in addition to the QEMU agent
if that has been installed. [Here is the location](https://www.spice-space.org/download.html) for spice-vdagent for both Windows and Linux.
Note copy/paste function will not work with web spice viewer you need to use virt-viewer.
#### Other VM changes[​](#other-vm-changes)
* Add Serial option to vdisk.
* Spice Bug fix for users with non standard GUI ports defined.
* OVMF for QEMU: version stable202302
* Fix for bus text.
* Enable copy paste option for virtual consoles.
* Update Memory Backup processing for Virtiofs.
* Fix lockup when no VMs are present.
* Add support for rtl8139 network model.
* fix translation omission.
* added lock/unlock for sortable items.
* Fix for Spice Mouse if Copy paste enabled.
* Let page load even when PCI devices appear missing or are misassigned.
* Make remote viewer and web console options selectable.
* Option to download .vv file and start remote viewer is browser set to open file .vv when downloaded.
* Add remote viewer console support.
* Remove-lock-posix='on'-flock='on'/-
* Fix VM marked as Autostart not starting following manual array Start.
* Fix for Max memory \> 1TB.
* Fix issues with VM page loads if users have removed vcpu pinning.
* ovmf-stable: version 202305 (build 3).
* fixed notification subject.
### Dashboard[​](#dashboard)
The WebGUI Dashboard has been redesigned and it is now possible to move elements (tiles) up and down and between columns. This allows
the user to organize the tiles in any way they desire. There is a small **lock** icon on the menu bar which must be clicked to enable
this function:
* Green is normal state (page is locked)
* Red is attention state (page is unlocked)
Note: The **lock** icon also appears on the Docker and VM pages and must be clicked to rearrange the startup order.
### Network improvements[​](#network-improvements)
We added a new section: Settings/Network Settings/Interface Extra
This new section allows the user to define which interfaces are used by the Unraid services. By default all regular interfaces with an
IP address are included in the list of listening interfaces.
The tunnels of the built-in WireGuard function of Unraid are automatically added or removed from the list when the Wireguard tunnels are
activated or deactivated. The user may exclude these tunnels from the list of listening interfaces.
To use the Tailscale or Zerotier interface, it is required to add the interface name or IP address of the communication to the list of
included listening interfaces. **Important:** It is imperative that Tailscale or Zerotier container is running before the interface is
added to the list. For more information,
refer to [this Community forum post](https://forums.unraid.net/bug-reports/prereleases/unraid-os-version-6120-rc7-available-r2427/?tab=comments#comment-24235).
#### Other Network changes[​](#other-network-changes)
* Support custom interfaces (e.g. Tailscale VPN tunnel or zerotier L2 tunnel)
* create\_network\_ini - restart smb when network changes are done
* rc.inet1 - add iptables processing to bridge interfaces to make them operate similarly as macvlan interfaces
* rc.avahidaemon - let service listen on regular interfaces only which have an IP address, this includes the primary interface + set ipv4 / ipv6 support
* rc.docker - suppress ipv6 link-local address for docker0 and shim interfaces when set as ipv4 only
* rc.samba - let smb, nmb service listen on regular interfaces only which have an IP address, this includes the primary interface + set ipv4 / ipv6 support (also for wsdd2)
* rc.ssh - listen on regular interfaces only which have an IP address, this includes the primary interface + set ipv4 / ipv6 support
* Fix issue where /etc/resolve.conf can get deleted when switching DNS Server between auto/static.
* Fix bug in handling description field.
* fix nginx recognizing IP address from slow dhcp servers
### Other Improvements/Bug fixes[​](#other-improvementsbug-fixes)
* Increased max number of devices per pool from 30 to 60. In a future release we will eliminate the upper maximum entirely.
* webTerminal: For better readability, changed background color on directory listings where 'w+o' is set. Also changed
renderer from webgl to canvas to mitigate issue with latest Chrome versions.
* Fixed ntp drift file save/restore from persistent USB flash 'config' directory.
* Removed extraneous /root/.config/remmina file
* Share Edit: warn when invalid ZFS name is used
* Share Edit: allow 1 letter names
* Add [Pushbits Agent](https://github.com/pushbits/server) for Matrix/Synapse integration.
* cgroup2 now the default
* loopback images no longer mounted using directio
* newperms script restricted to operate on /mnt/ only.
* upgradepkg patched to prevent replacing existing package with older version.
* current PCI bus/device information saved in file '/boot/previous/hardware' upon Unraid OS upgrade.
* NFS: enable UPD transport
* emhttp: fix cache pool (null) syslog strings
* emhttp: fix cache pool display wrong device size for selected replacement device
* mover: fix improper handling of symlinks
* mover: fix mover logging syslog entries format different from previous releases
* plugin: Display Run command retval in error message
* shfs: igonore top-level hidden directoris (names beginning with '.')
* terminal: OpenTerminal: change termination signal (hard stop)
* upgrade Unraid OS: check for earlier upgrade without reboot
* WebGUI: support PHP8, increase PHP max memory from 128M to 256M
* WebGUI: ManagementAccess: Disable Provision/Renew/Upgrade buttons when no IP on eth0
* WebGUI: ManagementAccess: Support wireguard local IP addresses in combination with myservers.unraid.net SSL cert
* WebGUI: Move "view" icon on Main and Shares page to the left
* WebGUI: Keep dismissed banners hidden for a month
* WebGUI: Dashboard: fix regression error in "select case"
* WebGUI: Dashboard: make items moveable between columns
* WebGUI: Dashboard: API for adding custom tiles
* WebGUI: Dashboard: rearrange processor information
* WebGUI: Dashboard: rearrange UPS info
* WebGUI: Dashboard: rearrange memory info
* WebGUI: Dashboard: VPN header rearrangement
* WebGUI: Dashboard: header rearrangements
* WebGUI: Add jqueryUI touch punch for mobile devices
* WebGUI: Changed ID to CLASS for elements occurring more than once
* WebGUI: Make header in white and black themes scrollable
* When more items are present than screen space, the user can now scroll through them (previously these items were invisible)
* WebGUI: Dashboard and Docker: introduce lock button for sortable items
* By default sortable items are locked, which allows mobile devices to scroll the page. Upon request items can be made sortable
* WebGUI: Users: add icon to title bar
* WebGUI: Tools: new function -\> PHP Settings
* View PHP info
* Configure error reporting
* Open LOG to see errors in real-time
* WebGUI: System info: fix reading inactive ports
* WebGUI: Plugin: Include the actual command being executed
* WebGUI: System info: cache enhancement
* WebGUI: System info: memory enhancement
* WebGUI: DeviceInfo: disable buttons when erase operation is running
* WebGUI: Docker: filetree corrections
* WebGUI: Dashboard: fixed show heat alarm per pool
* WebGUI: Notifications: revised operation
* Autoclose new notifications after 3 seconds
* Fix notifications reappearing after closure
* WebGUI: DeviceList: add FS type in offline state
* WebGUI: Add notification agent for Bark
* WebGUI: Main: hide browse icon when disk is not mounted
* WebGUI: Diagnostics: add additional btrfs and zfs info
* WebGUI: Dashboard: add ZFS memory usage
* WebGUI: Revised New Permissions
* Select either disks or shares (not both)
* WebGUI: Add testparm to diagnostics
* WebGUI: Support new UD reserved mount point of /mnt/addons
* WebGUI: fix issue displaying Attributes when temperature display set to Fahrenheit
* WebGUI: Dashboard changes:
* lock the Dashboard completely: Editing/moving only becomes possible when unlocking the page
* An empty column is refilled when the respective tiles are made visible again, no need to reset everything
* added a visual "move indicator" on the Docker and VM page, to make clearer that rows can be moved now.
* change cursor shape when moving is enabled
* use tile title as index
* WebGUI: fix: Local Firefox account pop-up postmessages not working
* WebGUI: SMART test cannot be run on a UD disk because there is no spin down delay selection
* WebGUI: status footer stuck on "Starting services" when applying share config setting changes.
* WebGUI: Fix table layout for orphan images
* WebGUI: Plugin: Do not show update button if incompatible
* WebGUI: Plugin: Make wget percentage detection more robust
* WebGUI: OpenTerminal: limit clients
* WebGUI: Context menu: automatic triangle placement
* WebGUI: Dashboard: fix pool warnings
* WebGUI: Allow SMART long test for UD
* WebGUI: Read processor type from /proc/cpuinfo
* WebGUI: CSS: solve scrollbar issue in firefox
* WebGUI: Add share: fix hidden share name check
* WebGUI: Display settings: add missing defaults
* WebGUI: Array Operation: prevent double clicking of Start button
* WebGUI: DeviceInfo: show shareFloor with units
* WebGUI: DeviceInfo: added automatic floor calculation
* WebGUI: Added autosize message
* WebGUI: Shares: added info icon
* WebGUI: Updated DeviceInfo and Shares page
* WebGUI: Fix network display aberration.
* WebGUI: Auto fill-in minimum free space for new shares
* WebGUI: feat(upc): update to v3 for connect
* WebGUI: Share/Pool size calculation: show and allow percentage values
* wireguard: add SSL support for WG tunnel IP addresses (myunraid.net wildcard certs only)
* wireguard: fix nginx issue when partial WireGuard config
### Release *bz* file differences[​](#release-bz-file-differences)
Unraid OS is comprised of a set of 5 so-called *bz* files in the root of the
USB Flash boot device:
* bzimage - the Linux kernel
* bzroot - the root file system, sans console desktop
* bzroot-gui - additional files needed for console desktop
* bzmodules - modules (drivers) associated with the Linux kernel
* bzfirmware - device firmware required by certain modules
Starting with 6.12 release, the content of these files has been rearranged:
* bzimage - the Linux kernel (same as before)
* bzroot - the root file system excluding the /usr directory tree
* bzroot-gui - a single file which auto-starts the console desktop (for compatibility)
* bzmodules - modules (drivers) associated with the Linux kernel and device firmware required by certain modules
* bzfirmware - the /usr directory and all files contained therein, including console desktop
These changes speed up the boot process and free up nearly 1G of RAM. It also permits
us to add more "stuff" to Unraid OS in the future without requiring more RAM. Finally, when booted in **non-GUI** mode,
the desktop can be started by logging in at the console and typig the 'slim' command.
#### Manual update[​](#manual-update)
Manual update refers to updating Unraid OS on your USB flash boot device without using the **Tools/Update OS** function.
Typically one would either:
* open a Terminal window, wget the release zip file, unzip the release, and then 'cp' the *bz* files to root of the boot device.
or
* export the 'flash' share on your network and drag the *bz* files from a PC directly to the flash.
Either method, starting with 6.12 **can fail** because the *bzfirmware* file will be overwritten while it is
still mounted - not good.
To get around this, you must first create a temp directory on the flash device and then 'mv' (or drag)
all the existing *bz* files into this temp directory. Now you can copy the new *bz* files to the root of
the flash device and reboot.
## Linux kernel[​](#linux-kernel)
* version 6.1.33
* md/unraid: version 2.9.27
* CONFIG\_FS\_DAX: File system based Direct Access (DAX) support
* CONFIG\_VIRTIO\_FS: Virtio Filesystem
* CONFIG\_ZONE\_DEVICE: Device memory (pmem, HMM, etc...) hotplug support
* CONFIG\_USBIP\_HOST: Host driver
* CONFIG\_INTEL\_MEI: Intel Management Engine Interface
* CONFIG\_INTEL\_MEI\_ME: ME Enabled Intel Chipsets
* CONFIG\_INTEL\_MEI\_GSC: Intel MEI GSC embedded device
* CONFIG\_INTEL\_MEI\_PXP: Intel PXP services of ME Interface
* CONFIG\_INTEL\_MEI\_HDCP: Intel HDCP2.2 services of ME Interface
* CONFIG\_INTEL\_PMC\_CORE: Intel PMC Core driver
* CONFIG\_DRM\_I915\_PXP: Enable Intel PXP support
* CONFIG\_SCSI\_FC\_ATTRS: FiberChannel Transport Attributes
* CONFIG\_FUSION\_SPI: Fusion MPT ScsiHost drivers for SPI
* CONFIG\_FUSION\_FC: Fusion MPT ScsiHost drivers for FC
* CONFIG\_FUSION\_CTL: Fusion MPT misc device (ioctl) driver
* CONFIG\_FUSION\_LOGGING: Fusion MPT logging facility
* CONFIG\_X86\_AMD\_PSTATE: AMD Processor P-State driver
* CONFIG\_LRU\_GEN: Multi-Gen LRU
* CONFIG\_SERIAL\_8250\_NR\_UARTS=32: Maximum number of 8250/16550 serial ports
* CONFIG\_SERIAL\_8250\_RUNTIME\_UARTS=4: Number of 8250/16550 serial ports to register at runtime
* CONFIG\_FANOTIFY: Filesystem wide access notification
## Base Distro updates[​](#base-distro-updates)
* aaa\_glibc-solibs: version 2.37
* adwaita-icon-theme: version 43
* at-spi2-core: version 2.46.0
* bash: version 5.2.015
* bash\_completion: version 2.11
* bind: version 9.18.12
* btrfs-progs: version 6.2.1
* ca-certificates: version 20221205
* cryptsetup: version 2.6.1
* curl: version 7.88.1
* dbus: version 1.14.6
* diffutils: version 3.9
* dnsmasq: version 2.89
* docker: version 23.0.6
* e2fsprogs: version 1.47.0
* encodings: version 1.0.7
* file: version 5.44
* firefox: version 111.0 (AppImage)
* freetype: version 2.13.0
* fuse3: version 3.12.0
* gawk: version 5.2.1
* git: version 2.39.2
* glib2: version 2.74.6
* glibc: version 2.37
* glibc-zoneinfo: version 2022g
* gnutls: version 3.7.9
* gptfdisk: version 1.0.9
* gtk+3: version 3.24.37
* harfbuzz: version 7.1.0
* htop: version 3.2.2
* iproute2: version 6.2.0
* iptables: version 1.8.9
* iputils: version 20221126
* kernel-firmware: 20230531\_fc90c59
* less: version 612
* libICE: version 1.1.1
* libSM: version 1.2.4
* libX11: version 1.8.4
* libXau: version 1.0.11
* libXcomposite: version 0.4.6
* libXdamage: version 1.1.6
* libXdmcp: version 1.1.4
* libXpm: version 3.5.15
* libXrandr: version 1.5.3
* libXres: version 1.2.2
* libXxf86dga: version 1.1.6
* libarchive: version 3.6.2
* libdrm: version 2.4.115
* libfontenc: version 1.1.7
* libglvnd: version 1.6.0
* libjpeg-turbo: version 2.1.5.1
* libpcap: version 1.10.3
* libpng: version 1.6.39
* libpsl: version 0.21.2
* liburcu: version 0.14.0
* libwebp: version 1.3.0
* libxkbcommon: version 1.5.0
* libxkbfile: version 1.1.2
* libxshmfence: version 1.3.2
* lmdb: version 0.9.30
* logrotate: version 3.21.0
* lsof: version 4.98.0
* lz4: version 1.9.4
* lzlib: version 1.13
* mc: version 4.8.29
* mcelog: version 191
* mpfr: version 4.2.0
* nano: version 7.2
* ncurses: version 6.4
* nginx: version 1.23.3
* nghttp2: version 1.52.0
* openssh: version 9.2p1
* openssl: version 1.1.1t
* openssl-solibs: version 1.1.1t
* openzfs: version 2.1.12
* pango: version 1.50.14
* pciutils: version 3.9.0
* pcre2: version 10.42
* php: version 8.2.4
* php-libvirt: version 0.5.7
* php-markdown: version 2.0.0
* samba: version 4.17.7
* sqlite: version 3.41.0
* sudo: version 1.9.13p2
* sysstat: version 12.7.2
* tdb: version 1.4.8
* tevent: version 0.14.1
* traceroute: version 2.1.2
* transset: version 1.0.3
* tree: version 2.1.0
* usbutils: version 015
* xcb-util: version 0.4.1
* xdriinfo: version 1.0.7
* xf86-video-vesa: version 2.6.0
* xfsprogs: version 6.1.1
* xhost: version 1.0.9
* xinit: version 1.4.2
* xkbcomp: version 1.4.6
* xkeyboard-config: version 2.38
* xorg-server: version 21.1.7
* xprop: version 1.2.6
* xrandr: version 1.5.2
* xset: version 1.2.5
* xterm: version 379
* xz: version 5.4.1
* zstd: version 1.5.4
## Patches[​](#patches)
With the [Unraid Patch plugin](https://forums.unraid.net/topic/185560-unraid-patch-plugin/) installed, visit ***Tools → Unraid Patch*** to get the following patches / hot fixes:
* A subset of security updates, see [this blog post](https://unraid.net/blog/cvd) for details. We recommend upgrading to the latest stable release for additional security updates.
* [Upgrade notes](#upgrade-notes)
* [Obsolete/Broken plugins](#obsoletebroken-plugins)
* [Known issues](#known-issues)
* [Rolling back](#rolling-back)
* [ZFS pools](#zfs-pools)
* [Share storage conceptual change](#share-storage-conceptual-change)
* [Mover action](#mover-action)
* [Exclusive shares](#exclusive-shares)
* [Clean Up button](#clean-up-button)
* [Other Improvements](#other-improvements)
* [btrfs](#btrfs)
* [xfs](#xfs)
* [Docker](#docker)
* [VM Manager](#vm-manager)
* [Dashboard](#dashboard)
* [Network improvements](#network-improvements)
* [Other Improvements/Bug fixes](#other-improvementsbug-fixes)
* [Release *bz* file differences](#release-bz-file-differences)
* [Linux kernel](#linux-kernel)
* [Base Distro updates](#base-distro-updates)
* [Patches](#patches)