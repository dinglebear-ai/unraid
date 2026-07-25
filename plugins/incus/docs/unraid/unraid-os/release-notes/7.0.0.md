Version 7.0.0 2025-01-09 | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
This version of Unraid OS includes significant improvements across all subsystems, while attempting to
maintain backward compatibility as much as possible.
Special thanks to:
* @bonienl, @dlandon, @ich777, @JorgeB, @SimonF, and @Squid for their direction, support, and development
work on this release
* @bonienl for merging their **Dynamix File Manager** plugin into the webgui
* @Squid for merging their **GUI Search** and **Unlimited Width Plugin** plugins into the webgui
* @ludoux (**Proxy Editor** plugin) and @Squid (**Community Applications** plugin) for pioneering
the work on http proxy support, of which several ideas have been incorporated into the webgui
* @ich777 for maintaining third-party driver plugins, and for the [Tailscale Docker integration](#tailscale-integration)
* @SimonF for significant new features in the Unraid OS VM Manager
* @EDACerton for development of the Tailscale plugin
View the [contributors to Unraid on GitHub](https://github.com/unraid/webgui/graphs/contributors?from=2023-09-08&to=2025-01-08&type=c)
with shoutouts to these community members who have contributed PRs (these are GitHub ids):
* almightyYantao
* baumerdev
* Commifreak
* desertwitch
* dkaser
* donbuehl
* FunkeCoder23
* Garbee
* jbtwo
* jski
* Leseratte10
* Mainfrezzer
* mtongnz
* othyn
* serisman
* suzukua
* thecode
And sincere thanks to everyone who has requested features, reported bugs, and tested pre-releases!
## Upgrading[​](#upgrading)
### Known issues[​](#known-issues)
#### ZFS pools[​](#zfs-pools)
If you are using ZFS pools, please take note of the following:
* You will see a warning about unsupported features in your existing ZFS pools. This is because the
version of ZFS in 7.0 is upgraded vs. 6.12 and contains new features. This warning is harmless, meaning
your pool will still function normally. A button will appear letting you upgrade a pool to support the new ZFS features;
however, Unraid OS does not make use of these new features, and once upgraded previous versions of Unraid OS will not be able to mount the pool.
* Similarly, new pools created in 7.0 will not mount in 6.12 due to ZFS not supporting downgrades. There is no way
around this.
* If you decide to downgrade from 7.0 to 6.12 any previously existing hybrid pools will not
be recognized upon reboot into 6.12. To work around this, first click Tools/New Config in 7.0, preserving
all slots, then reboot into 6.12 and your hybrid pools should import correctly.
* ZFS spares are not supported in this release. If you have created a hybrid pool in 6.12 which includes spares,
please remove the 'spares' vdev before upgrading to v7.0. This will be fixed in a future release.
* Currently unable to import TrueNAS pools. This will be fixed in a future release.
* If you are using **Docker data-root=directory** on a ZFS volume, see [Add support for overlay2 storage driver](#add-support-for-overlay2-storage-driver).
* We check that VM names do not include characters that are not valid for ZFS. Existing VMs are not modified
but will throw an error and disable update if invalid characters are found.
#### General pool issues[​](#general-pool-issues)
If your existing pools fail to import with *Wrong Pool State, invalid expansion* or *Wrong pool State. Too many wrong or missing devices*, see this [forum post](https://forums.unraid.net/topic/184435-unraid-os-version-700-available/#findComment-1508012).
#### Drive spindown issues[​](#drive-spindown-issues)
Drives may not spin down when connected to older Marvell drive controllers that use the sata\_mv driver (i.e. Supermicro SASLP and SAS2LP) or to older Intel controllers (i.e. ICH7-ICH10). This may be resolved by a future kernel update.
#### Excessive flash drive activity slows the system down[​](#excessive-flash-drive-activity-slows-the-system-down)
If the system is running slowly, check the Main page and see if it shows significant continuous reads from the flash drive during normal operation. If so, the system may be experiencing sufficient memory pressure to push the OS out of RAM and cause it to be re-read from the flash drive. From the web terminal type:
```
`
touch /boot/config/fastusr
`
```
and then reboot. This will use around 500 MB of RAM to ensure the OS files always stay in memory. Please let us know if this helps.
#### New Windows changes may result in loss of access to Public shares[​](#new-windows-changes-may-result-in-loss-of-access-to-public-shares)
Due to recent security changes in Windows 11 24H2, "guest" access of Unraid public shares may not work. The easiest
way around this is to create a user in Unraid with the same name as the Windows account you are using to connect. If the Unraid
user password is not the same as the Windows account password, Windows will prompt for credentials.
If you are using a Microsoft account, it may be better to create a user in Unraid with a simple username, set a password,
then in Windows go to ***Control Panel → Credential Manager → Windows credentials → Add a Windows Credential*** and add the
correct Unraid server name and credentials.
Alternately you can [re-enable Windows guest fallback](https://techcommunity.microsoft.com/blog/filecab/accessing-a-third-party-nas-with-smb-in-windows-11-24h2-may-fail/4154300)
(not recommended).
#### Problems due to Realtek network cards[​](#problems-due-to-realtek-network-cards)
There have been multiple reports of issues with the Realtek driver plugin after upgrading to recent kernels. You may want to preemptively uninstall it before upgrading, or remove it afterwards if you have networking issues.
#### A virtual NIC is being assigned to eth0 on certain systems[​](#a-virtual-nic-is-being-assigned-to-eth0-on-certain-systems)
On some systems with IPMI KVM, a virtual NIC is being assigned to eth0 instead of the expected NIC. See this [forum post](https://forums.unraid.net/bug-reports/stable-releases/61214-no-network-after-updating-eth0-assigned-to-virtual-usb-nic-cdc-ethernet-device-with-169-ip-instead-of-mellanox-10gbe-nic-r3407/) for options.
#### Issues using Docker custom networks[​](#issues-using-docker-custom-networks)
If certain custom Docker networks are not available for use by your Docker containers, navigate to ***Settings → Docker*** and fix the CIDR definitions for the
subnet mask and DHCP pool on those custom networks. The underlying systems have gotten more strict and invalid CIDR definitions which worked in earlier releases no longer work.
### Rolling back[​](#rolling-back)
See the warnings under **Known Issues** above.
The Dynamix File Manager, GUI Search, and Unlimited Width Plugin plugins are now built into Unraid. If you rollback to an earlier version
you will need to reinstall those plugins to retain their functionality.
If you disabled the unRAID array we recommend enabling it again before rolling back.
If you previously had Outgoing Proxies set up using the Proxy Editor plugin or some other mechanism, you will need to re-enable that mechanism after rolling back.
If you roll back after enabling the [overlay2 storage driver](#add-support-for-overlay2-storage-driver) you will need
to delete the Docker directory and let Docker re-download the image layers.
If you roll back after installing [Tailscale in a Docker container](#tailscale-integration), you will need to edit the container, make a dummy change, and **Apply** to rebuild the container without the Tailscale integration.
After rolling back, make a dummy change to each WireGuard config to get the settings appropriate for that version of Unraid.
If rolling back earlier than 6.12.14, also see the [6.12.14 release notes](/unraid-os/release-notes/6.12.14/#rolling-back).
## Storage[​](#storage)
### unRAID array optional[​](#unraid-array-optional)
You can now set the number of unRAID array slots to 'none'. This will allow the array to Start without any
devices assigned to the unRAID array itself.
If you are running an all-SSD/NMVe server, we recommend assigning all devices
to one or more ZFS/BTRFS pools, since Trim/Discard is not supported with unRAID array devices.
To unassign the unRAID array from an existing server, first unassign all Array slots on the Main page, and then
set the Slots to 'none'.
For new installs, the default number of slots to reserve for the unRAID array is now 'none'.
### Share secondary storage may be assigned to a pool[​](#share-secondary-storage-may-be-assigned-to-a-pool)
Shares can now be configured with pools for both primary and secondary storage, and mover will move
files between those pools.
As a result of this change, the maximum number of supported pools is now 34 (previously 35).
### ReiserFS file system option has been disabled[​](#reiserfs-file-system-option-has-been-disabled)
Since ReiserFS is scheduled to be removed from the Linux kernel, the option to format a device with ReiserFS
has also been disabled. You may use this mover function to empty an array disk prior to reformatting with
another file system, see below. We will add a webGUI button for this in a future release.
### Using 'mover' to empty an array disk[​](#using-mover-to-empty-an-array-disk)
Removed in Unraid 7.2.1
This command line option was removed in Unraid 7.2.1. On newer releases, use the WebGUI method instead. See [Converting to a new file system type](/unraid-os/using-unraid-to/manage-storage/file-systems/#converting-to-a-new-file-system-type) for details.
Mover can now be used to empty an array disk. With the array started, run this at a web terminal:
```
`
mover start -e diskN |& logger & # where N is [1..28]
`
```
Mover will look at each top-level director (share) and then move files one-by-one to other disks
in the array, following the usual config settings (include/exclude, split-level, alloc method). Move
targets are restricted to just the unRAID array.
Watch the syslog for status. When the mover process ends, the syslog will show a list of files which
could not be moved:
* maybe file was in-use
* maybe file is at the top-level of /mnt/diskN
* maybe we ran out of space
### Predefined shares handling[​](#predefined-shares-handling)
The Unraid OS Docker Manager is configured by default to use these predefined shares:
* system - used to store Docker image layers in a loopback image stored in system/docker.
* appdata - used by Docker applications to store application data.
The Unraid OS VM Manager is configured by default to use these predefined shares:
* system - used to store libvirt loopback image stored in system/libvirt
* domains - used to store VM vdisk images
* isos - used to store ISO boot images
When either Docker or VMs are enabled, the required predefined shares are created if necessary
according to these rules:
* if a pool named 'cache' is present, predefined shares are created with 'cache' as the Primary
storage with no Secondary storage.
* if no pool named 'cache' is present, the predefined shares are created with the first
alphabetically present pool as Primary with no Secondary storage.
* if no pools are present, the predefined shares are created on the unRAID array as Primary with no
Secondary storage.
### ZFS implementation[​](#zfs-implementation)
* Support Hybrid ZFS pools aka subpools (except 'spares')
* Support recovery from multiple drive failures in a ZFS pool with sufficient protection
* Support LUKS encryption on ZFS pools and drives
* Set reasonable default profiles for new ZFS pools and subpools
* Support upgrading ZFS pools when viewing the pool status. Note: after upgrading, the volume may not be mountable in previous versions of Unraid
### Allocation profiles for btrfs, zfs, and zfs subpools[​](#allocation-profiles-for-btrfs-zfs-and-zfs-subpools)
When a btrfs or zfs pool/subpool is created, the default storage allocation is determined by
the number of slots (devices) initially assigned to the pool:
* for zfs main (root) pool:
* slots == 1 =\> single
* slots == 2 =\> mirror (1 group of 2 devices)
* slots \>= 3 =\> raidz1 (1 group of 'slots' devices)
* for zfs special, logs, and dedup subpools:
* slots == 1 =\> single
* slots%2 == 0 =\> mirror (slots/2 groups of 2 devices)
* slots%3 == 0 =\> mirror (slots/3 groups of 3 devices)
* otherwise =\> stripe (1 group of 'slots' devices)
* for zfs cache and spare subpools:
* slots == 1 =\> single
* slots \>= 2 =\> stripe (1 group of 'slots' devices)
* for btrfs pools:
* slots == 1 =\> single
* slots \>= 2 =\> raid1 (ie, what btrfs called "raid1")
### Pool considerations[​](#pool-considerations)
When adding devices to (expanding) a single-slot pool, these rules apply:
For btrfs: adding one or more devices to a single-slot pool will result in converting the
pool to raid1 (that is, what btrfs defines as raid1). Adding any number of devices to an
existing multiple-slot btrfs pool increases the storage capacity of the pool and does not
change the storage profile.
For zfs: adding one, two, or three devices to a single-slot pool will result in converting
the pool to 2-way, 3-way, or 4-way mirror. Adding a single device to an
existing 2-way or 3-way mirror converts the pool to a 3-way or 4-way mirror.
Changing the file system type of a pool:
For all single-slot pools, the file system type can be changed when array is Stopped.
For btrfs/zfs multi-slot pools, the file system type cannot be changed. To repurpose the devices
you must click the Erase pool buton.
### Other features[​](#other-features)
* Add Spin up/down devices of a pool in parallel
* Add "Delete Pool" button, which unassigns all devices of a pool and then removes the pool. The devices
themselves are not modified. This is useful when physically removing devices from a server.
* Add ability to change encryption phrase/keyfile for LUKS encrypted disks
* Introduce 'config/share.cfg' variable 'shareNOFILE' which sets maximum open file descriptors for shfs process (see the Known Issues)
## VM Manager[​](#vm-manager)
### Improvements[​](#improvements)
Added support for VM clones, snapshots, and evdev passthru.
The VM editor now has a new read-only inline XML mode for advanced users, making it clear how the
GUI choices affect the underlying XML used by the VM.
Big thanks to @SimonF for his ongoing enhancements to VMs.
### Other changes[​](#other-changes)
* **VM Tab**
* Show all graphics cards and IP addresses assigned to VMs
* noVNC version: 1.5
* **VM Manager Settings**
* Added VM autostart disable option
* **Add/edit VM template**
* Added "inline xml view" option
* Support user-created VM templates
* Add qemu ppc64 target
* Add qemu:override support
* Add "QEMU command-line passthrough" feature
* Add VM multifunction support, including "PCI Other"
* VM template enhancements for Windows VMs, including hypervclock support
* Add "migratable" on/off option for emulated CPU
* Add offset and timer support
* Add no keymap option and set Virtual GPU default keyboard to use it
* Add nogpu option
* Add SR-IOV support for Intel iGPU
* Add storage override to specify where images are created at add VM
* Add SSD flag for vdisks
* Add Unmap Support
* Check that VM name does not include characters that are not valid for ZFS.
* **Dashboard**
* Add VM usage statistics to the dashboard, enable on ***Settings → VM Manager → Show VM Usage***
## Docker[​](#docker)
### Docker fork bomb prevention[​](#docker-fork-bomb-prevention)
To prevent "Docker fork bombs" we introduced a new setting, ***Settings → Docker → Docker PID Limit***, which
specifies the maximum number of Process ID's which any container may have active (with default 2048).
If you have a container that requires more PID's you may either increase this setting or you may override
for a specific container by adding, for example, `--pids-limit 3000` to the Docker
template *Extra Parameters* setting.
### Add support for overlay2 storage driver[​](#add-support-for-overlay2-storage-driver)
If you are using **Docker data-root=directory** on a ZFS volume, we recommend that you navigate to
***Settings → Docker*** and switch the **Docker storage driver** to **overlay2**,
then delete the directory contents and let Docker re-download the image layers.
The legacy **native** setting causes significant stability issues on ZFS volumes.
If retaining the ability to downgrade to earlier releases is important, then switch to **Docker data-root=xfs vDisk** instead.
### Other changes[​](#other-changes-1)
* See [Tailscale integration](#tailscale-integration)
* Allow custom registry with a port specification
* Use "lazy unmount" unmount of docker image to prevent blocking array stop
* Updated to address multiple security issues (CVE-2024-21626, CVE-2024-24557)
* Docker Manager:
* Allow users to select Container networks in the WebUI
* Correctly identify/show non dockerman Managed containers
* rc.docker:
* Only stop Unraid managed containers
* Honor restart policy from 3rd party containers
* Set MTU of Docker Wireguard bridge to match Wireguard default MTU
## Networking[​](#networking)
### Tailscale integration[​](#tailscale-integration)
Unraid OS supports [Tailscale](https://tailscale.com/) through the use of a plugin created by Community
Developer EDACerton. When this plugin is installed, Tailscale certificates are supported for https webGUI access,
and the Tailnet URLs will be displayed on the ***Settings → Management Access*** page.
And in Unraid natively, you can optionally install Tailscale in almost any Docker container,
giving you the ability to share containers with specific people, access them using valid https certificates,
and give them alternate routes to the Internet via Exit Nodes.
For more details see [the docs](/unraid-os/system-administration/secure-your-server/tailscale/)
### Support iframing the webGUI[​](#support-iframing-the-webgui)
Added "Content-Security-Policy frame-ancestors" support to automatically allow the webGUI to be iframed by domains it
has certificates for. It isn't exactly supported, but additional customization is possible by using a script to modify
NGINX\_CUSTOMFA in `/etc/defaults/nginx`
### Other changes[​](#other-changes-2)
* Upgraded to OpenSSL 3
* Allow ALL IPv4/IPv6 addresses as listener. This solves the issue when IPv4 or IPv6 addresses change dynamically
* Samba:
* Add ipv6 listening address only when NetBIOS is disabled
* Fix MacOS unable to write 'flash' share and restore Time Machine compatibility (fruit changes)
* The VPN manager now adds all interfaces to WireGuard tunnels, make a dummy change to the tunnel after
upgrading or changing network settings to update WireGuard tunnel configs.
## webGUI[​](#webgui)
### Integrated Dynamix File Manager plugin[​](#integrated-dynamix-file-manager-plugin)
Click the file manager icon and navigate through your directory structure with the ability to perform
common operations such as copy, move, delete, and rename files and directories.
### Integrated GUI Search plugin[​](#integrated-gui-search-plugin)
Click the search icon on the Menu bar and type the name of the setting you are looking for.
### Outgoing Proxy Manager[​](#outgoing-proxy-manager)
If you previously used the Proxy Editor plugin or had an outgoing proxy setup for CA,
those will automatically be removed/imported. You can then adjust
them on ***Settings → Outgoing Proxy Manager***.
For more details, see the [manual](/unraid-os/system-administration/secure-your-server/secure-your-outgoing-comms/).
Note: this feature is completely unrelated to any reverse proxies you may be using.
### Notification Agents[​](#notification-agents)
Notification agents xml are now stored as individual xml files, making it easier to
add notification agents via plugin.
See this [sample plugin](https://github.com/Squidly271/Wxwork-sample) by @Squid
* fix: Agent notifications do not work if there is a problem with email notifications
### NTP Configuration[​](#ntp-configuration)
For new installs, a single default NTP server is set to 'time.google.com'.
If your server is using our previous NTP defaults of time1.google.com, time2.google.com etc,
you may notice some confusing NTP-related messages in your syslog. To avoid this, consider changing
to our new defaults: navigate to ***Settings → Date & Time*** and configure **NTP server 1** to
be time.google.com, leaving all the others blank.
Of course, you are welcome to use any time servers you prefer, this is just to let you know that we have
tweaked our defaults.
### NFS Shares[​](#nfs-shares)
We have added a few new settings to help resolve issues with NFS shares. On ***Settings → Global Share Settings*** you can adjust the number of fuse file descriptors and on ***Settings → NFS*** you can adjust the NFS protocol version and number of threads it uses. See the inline help for details.
* Added support for NFS 4.1 and 4.2, and permit NFSv4 mounts by default
* Add a text box to configure multi-line NFS rules
* Bug fix: nfsd doesn't restart properly
### Dashboard[​](#dashboard)
* Add server date and time to the Dashboard; click the time to edit related settings
* Rework the **System** tile to clarify what is being shown, including tooltips
* Show useful content when dashboard tiles are minimized
* Show Docker RAM usage on Dashboard
* Add Docker RAM usage to the Dashboard
* Rename 'Services' to 'System'
* Fix memory leak on the Dashboard, VM Manager and Docker Manager pages
### SMART improvements[​](#smart-improvements)
* Display KB/MB/GB/TB written in SMART Attributes for SSDs
* Add 'SSD endurance remaining' SMART Attribute.
### Diagnostics[​](#diagnostics)
* Add gpujson from gpu\_statistics to diagnostics
* Improved anonymization of LXC logs
* If the FCP plugin is installed, run scan during diagnostics
* Add phplog to identify PHP errors
* Improved anonymization of IPv6 addresses
* Removed ps.txt because it exposed passwords in the process list
### Other changes[​](#other-changes-3)
* Support different warning/critical temperature thresholds for HDD/SSD/NVMe drives. NVMe thresholds are set automatically by the drive itself,
see ***Settings → Disk Settings*** to set the thresholds for HDDs and SSDs. All can still be overridden for individual drives.
* Add ***Settings → Local Console Settings*** page with options for keyboard layout, screen blank time, and persistent Bash history
* Add ***Settings → Power Mode*** to optimize the system for power efficiency, balanced, or performance
* Hover over an entry on **Tools** and **Settings** to favorite an item, and quickly get back to it on the new top-level **Favorites** page.
Or disable Favorites functionality on \***Settings → Display Settings**.
* Enhanced shutdown/restart screen showing more details of the process
* Simplify notifications by removing submenus - View, History, and Acknowledge now apply to all notification types
* Move date & time settings from **Display Settings** to ***Settings → Date & Time Settings***
* ***Settings → Display settings***: new setting "width" to take advantage of larger screens
* Optionally display NVMe power usage; see ***Settings → Disk Settings***
* Web component enhancements – downgrades, updates, and registration
* Prevent formatting new drives as ReiserFS
* Use atomic writes for updates of config files
* ZFS pool settings changes:
* Create meaningful ZFS subpool descriptions
* Change ZFS profile text 'raid0' to 'stripe'
* Add additional USB device passthrough smartmontools options to webgui (thanks to GitHub user jski)
* UPS Settings page (thanks to @othyn):
* Add the ability to set a manual UPS capacity override.
* UserEdit: in addition to Ed25519, FIDO/U2F Ed25519, and RSA, support SSH key types DSA, ECDSA, and FIDO/U2F ECDSA
* OpenTerminal: use shell defined for root user in /etc/passwd file
* Always display the "delete share" option, but disable it when the share is not empty
## Misc[​](#misc)
### Other changes[​](#other-changes-4)
* Replace very old 'memtest' with Memtest86+ version 6.20
* There are also [Boot Options](https://github.com/memtest86plus/memtest86plus#boot-options) available
* Remove support for legacy unraid.net certs
* Remove "UpdateDNS" functionality since no longer using legacy non-wildcard 'unraid.net' SSL certs
* Strip proxy info and '&' from go script
* passwd file handling correction
* When avahidaemon running, add name.local to hosts file
* Remove keys.lime-technology.com from hosts file
* rc.S: remove wsync from XFS mount to prevent WebGUI from freezing during heavy I/O on /boot
* make\_bootable\_linux: version 1.4
* detect if mtools is installed
* ntp.conf: set 'logconfig' to ignore LOG\_INFO
* Speed things up: use AVAHI reload instead of restart
* Linux kernel: force all buggy Seagate external USB enclosures to bind to usb-storage instead of UAS driver
* Startup improvements in rc.S script:
* Automatically repair boot sector backup
* Explicitly unmount all file systems if cannot continue boot
* Detect bad root value in syslinux.cfg
* reboot should not invoke shutdown
* Clean up empty cgroups
* Samba smb.conf: set "nmbd bind explicit broadcast = no" if NetBIOS enabled
* Add fastcgi\_path\_info to default nginx configuration
* Ensure calls to pgrep or killall are restricted to the current namespace
* (Advanced) Added ability to apply custom udev rules from `/boot/config/udev/` upon boot
* Bug fix: Correct handling of empty Trial.key when download fails
* Bug fix: Fix PHP warning for UPS status
* Create meaningful /etc/os-release file
* Misc translation fixes
* Bug fix: JavaScript console logging functionality restored
* Clicking Unraid version number loads release notes from Unraid Docs website
## Linux kernel[​](#linux-kernel)
* version 6.6.68
* CONFIG\_MISC\_RTSX\_PCI: Realtek PCI-E card reader
* CONFIG\_MISC\_RTSX\_USB: Realtek USB card reader
* CONFIG\_DRM\_XE: Intel Xe Graphics
* CONFIG\_DRM\_XE\_DISPLAY: Enable display support
* CONFIG\_AUDIT: Auditing support
* CONFIG\_USB\_SERIAL\_OPTION: USB driver for GSM and CDMA modems
* CONFIG\_USB\_SERIAL\_SIMPLE: USB Serial Simple Driver
* CONFIG\_USB\_UAS: USB Attached SCSI
* CONFIG\_NFS\_V4\_1: NFS client support for NFSv4.1
* CONFIG\_NFS\_V4\_1\_MIGRATION: NFSv4.1 client support for migration
* CONFIG\_NFS\_V4\_2: NFS client support for NFSv4.2
* CONFIG\_NFS\_V4\_2\_READ\_PLUS: NFS: Enable support for the NFSv4.2 READ\_PLUS operation
* CONFIG\_NFSD\_V4\_2\_INTER\_SSC: NFSv4.2 inter server to server COPY
* CONFIG\_USB\_NET\_CDC\_EEM: CDC EEM support
* CONFIG\_USB\_NET\_CDC\_NCM: CDC NCM support
* CONFIG\_USB\_SERIAL\_XR: USB MaxLinear/Exar USB to Serial driver
* CONFIG\_CAN: CAN bus subsystem support
* CONFIG\_CAN\_NETLINK: CAN device drivers with Netlink support
* CONFIG\_CAN\_GS\_USB: Geschwister Schneider UG and candleLight compatible interfaces
* CONFIG\_SCSI\_LPFC: Emulex LightPulse Fibre Channel Support
* CONFIG\_DRM\_VIRTIO\_GPU: Virtio GPU driver
* CONFIG\_DRM\_VIRTIO\_GPU\_KMS: Virtio GPU driver modesetting support
* CONFIG\_LEDS\_TRIGGERS: LED Trigger support
* CONFIG\_LEDS\_TRIGGER\_ONESHOT: LED One-shot Trigger
* CONFIG\_LEDS\_TRIGGER\_NETDEV: LED Netdev Trigger
* CONFIG\_QED: QLogic QED 25/40/100Gb core driver
* CONFIG\_QED\_SRIOV: QLogic QED 25/40/100Gb SR-IOV support
* CONFIG\_QEDE: QLogic QED 25/40/100Gb Ethernet NIC
* CONFIG\_SCSI\_UFSHCD: Universal Flash Storage Controller
* CONFIG\_SCSI\_UFS\_BSG: Universal Flash Storage BSG device node
* CONFIG\_SCSI\_UFS\_HWMON: UFS Temperature Notification
* CONFIG\_SCSI\_UFSHCD\_PCI: PCI bus based UFS Controller support
* CONFIG\_SCSI\_UFS\_DWC\_TC\_PCI: DesignWare pci support using a G210 Test Chip
* CONFIG\_SCSI\_UFSHCD\_PLATFORM: Platform bus based UFS Controller support
* CONFIG\_SCSI\_UFS\_CDNS\_PLATFORM: Cadence UFS Controller platform driver
* CONFIG\_SCSI\_QLA\_FC: QLogic QLA2XXX Fibre Channel Support
* CONFIG\_LIQUIDIO: Cavium LiquidIO support
* CONFIG\_LIQUIDIO\_VF: Cavium LiquidIO VF support
* CONFIG\_NTFS\_FS: NTFS file system support [removed - this is the old read-only vfs module]
* CONFIG\_NTFS3\_FS: NTFS Read-Write file system support
* CONFIG\_NTFS3\_LZX\_XPRESS: activate support of external compressions lzx/xpress
* CONFIG\_NTFS3\_FS\_POSIX\_ACL: NTFS POSIX Access Control Lists
* CONFIG\_UHID: User-space I/O driver support for HID subsystem
* md/unraid: version 2.9.33
* fix regression: empty slots before first occupied slot returns NO\_DEVICES
* fix handling of device failure during rebuild/sync
* removed XEN support
## Base distro[​](#base-distro)
* aaa\_base: version 15.1
* aaa\_glibc-solibs: version 2.40
* aaa\_libraries: version 15.1
* acl: version 2.3.2
* acpid: version 2.0.34
* adwaita-icon-theme: version 47.0
* apcupsd: version 3.14.14
* appres: version 1.0.7
* at: version 3.2.5
* at-spi2-atk: version 2.38.0
* at-spi2-core: version 2.54.0
* atk: version 2.38.0
* attr: version 2.5.2
* avahi: version 0.8
* bash: version 5.2.037
* bash-completion: version 2.16.0
* beep: version 1.3
* bin: version 11.1
* bind: version 9.20.4
* bluez-firmware: version 1.2
* bridge-utils: version 1.7.1
* brotli: version 1.1.0
* btrfs-progs: version 6.12
* bzip2: version 1.0.8
* ca-certificates: version 20241120
* cairo: version 1.18.2
* celt051: version 0.5.1.3
* cifs-utils: version 7.1
* coreutils: version 9.5
* cpio: version 2.15
* cpufrequtils: version 008
* cracklib: version 2.10.3
* cryptsetup: version 2.7.5
* curl: version 8.11.1
* cyrus-sasl: version 2.1.28
* db48: version 4.8.30
* dbus: version 1.16.0
* dbus-glib: version 0.112
* dcron: version 4.5
* dejavu-fonts-ttf: version 2.37
* devs: version 2.3.1
* dhcpcd: version 10.0.10
* diffutils: version 3.10
* dmidecode: version 3.6
* dnsmasq: version 2.90
* docker: version 27.0.3
* dosfstools: version 4.2
* e2fsprogs: version 1.47.1
* ebtables: version 2.0.11
* editres: version 1.0.9
* elfutils: version 0.192
* elogind: version 255.5
* elvis: version 2.2\_0
* encodings: version 1.1.0
* etc: version 15.1
* ethtool: version 5.19
* eudev: version 3.2.14
* file: version 5.46
* findutils: version 4.10.0
* flex: version 2.6.4
* floppy: version 5.5
* fluxbox: version 1.3.7
* fontconfig: version 2.15.0
* freeglut: version 3.6.0
* freetype: version 2.13.3
* fribidi: version 1.0.16
* fuse3: version 3.16.2
* gawk: version 5.3.1
* gd: version 2.3.3
* gdbm: version 1.24
* gdk-pixbuf2: version 2.42.12
* genpower: version 1.0.5
* git: version 2.47.1
* glew: version 2.2.0
* glib2: version 2.82.4
* glibc: version 2.40
* glibc-zoneinfo: version 2024b
* glu: version 9.0.3
* gmp: version 6.3.0
* gnutls: version 3.8.8
* gptfdisk: version 1.0.10
* graphite2: version 1.3.14
* grep: version 3.11
* gtk+3: version 3.24.43
* gzip: version 1.13
* harfbuzz: version 10.1.0
* hdparm: version 9.65
* hicolor-icon-theme: version 0.18
* hostname: version 3.25
* htop: version 3.3.0
* hwloc: version 2.2.0
* icu4c: version 76.1
* imlib2: version 1.7.1
* inetd: version 1.79s
* infozip: version 6.0
* inih: version 58
* inotify-tools: version 4.23.9.0
* intel-microcode: version 20241112
* iperf3: version 3.17.1
* iproute2: version 6.12.0
* iptables: version 1.8.11
* iputils: version 20240905
* irqbalance: version 1.7.0
* jansson: version 2.14
* jemalloc: version 5.3.0
* jq: version 1.6
* json-c: version 0.18\_20240915
* json-glib: version 1.10.6
* kbd: version 2.7.1
* kernel-firmware: version 20241220\_9e1d9ae
* keyutils: version 1.6.3
* kmod: version 33
* krb5: version 1.21.3
* lbzip2: version 2.5
* less: version 668
* libICE: version 1.1.2
* libSM: version 1.2.5
* libX11: version 1.8.10
* libXau: version 1.0.12
* libXaw: version 1.0.16
* libXcomposite: version 0.4.6
* libXcursor: version 1.2.3
* libXdamage: version 1.1.6
* libXdmcp: version 1.1.5
* libXevie: version 1.0.3
* libXext: version 1.3.6
* libXfixes: version 6.0.1
* libXfont2: version 2.0.7
* libXfontcache: version 1.0.5
* libXft: version 2.3.8
* libXi: version 1.8.2
* libXinerama: version 1.1.5
* libXmu: version 1.2.1
* libXpm: version 3.5.17
* libXrandr: version 1.5.4
* libXrender: version 0.9.12
* libXres: version 1.2.2
* libXt: version 1.3.1
* libXtst: version 1.2.5
* libXxf86dga: version 1.1.6
* libXxf86misc: version 1.0.4
* libXxf86vm: version 1.1.6
* libaio: version 0.3.113
* libarchive: version 3.7.7
* libcap-ng: version 0.8.5
* libcgroup: version 0.41
* libdaemon: version 0.14
* libdeflate: version 1.23
* libdmx: version 1.1.5
* libdrm: version 2.4.124
* libedit: version 20240808\_3.1
* libepoxy: version 1.5.10
* libestr: version 0.1.9
* libevdev: version 1.13.3
* libevent: version 2.1.12
* libfastjson: version 0.99.9
* libffi: version 3.4.6
* libfontenc: version 1.1.8
* libgcrypt: version 1.11.0
* libglvnd: version 1.7.0
* libgpg-error: version 1.51
* libgudev: version 238
* libidn: version 1.42
* libjpeg-turbo: version 3.1.0
* liblogging: version 1.0.6
* libmnl: version 1.0.5
* libnetfilter\_conntrack: version 1.1.0
* libnfnetlink: version 1.0.2
* libnftnl: version 1.2.8
* libnl3: version 3.11.0
* libnvme: version 1.11.1
* libpcap: version 1.10.5
* libpciaccess: version 0.18.1
* libpng: version 1.6.44
* libpsl: version 0.21.5
* libpthread-stubs: version 0.5
* libseccomp: version 2.5.5
* libssh: version 0.11.1
* libssh2: version 1.11.1
* libtasn1: version 4.19.0
* libtiff: version 4.7.0
* libtirpc: version 1.3.6
* libtpms: version 0.9.0
* libunistring: version 1.3
* libunwind: version 1.8.1
* libusb: version 1.0.27
* libusb-compat: version 0.1.8
* libuv: version 1.49.2
* libvirt: version 10.7.0
* libvirt-php: version 0.5.8
* libwebp: version 1.5.0
* libwebsockets: version 4.3.2
* libx86: version 1.1
* libxcb: version 1.17.0
* libxcvt: version 0.1.3
* libxkbcommon: version 1.7.0
* libxkbfile: version 1.1.3
* libxml2: version 2.13.5
* libxshmfence: version 1.3.3
* libxslt: version 1.1.42
* libzip: version 1.11.2
* listres: version 1.0.6
* lm\_sensors: version 3.6.0
* lmdb: version 0.9.33
* logrotate: version 3.22.0
* lshw: version B.02.19.2
* lsof: version 4.99.4
* lsscsi: version 0.32
* lvm2: version 2.03.29
* lz4: version 1.10.0
* lzip: version 1.24.1
* lzlib: version 1.14
* lzo: version 2.10
* mbuffer: version 20240107
* mc: version 4.8.31
* mcelog: version 202
* mesa: version 24.2.8
* miniupnpc: version 2.1
* mkfontscale: version 1.2.3
* mpfr: version 4.2.1
* mtdev: version 1.1.7
* nano: version 8.3
* ncompress: version 5.0
* ncurses: version 6.5
* net-tools: version 20181103\_0eebece
* nettle: version 3.10
* network-scripts: version 15.1
* nfs-utils: version 2.8.2
* nghttp2: version 1.64.0
* nghttp3: version 1.7.0
* nginx: version 1.27.2
* noto-fonts-ttf: version 2024.12.01
* nss-mdns: version 0.14.1
* ntfs-3g: version 2022.10.3
* ntp: version 4.2.8p18
* numactl: version 2.0.13
* nvme-cli: version 2.11
* oniguruma: version 6.9.9
* openssh: version 9.9p1
* openssl: version 3.4.0
* ovmf: version stable202411
* p11-kit: version 0.25.5
* pam: version 1.6.1
* pango: version 1.54.0
* patch: version 2.7.6
* pciutils: version 3.13.0
* pcre: version 8.45
* pcre2: version 10.44
* perl: version 5.40.0
* php: version 8.3.8
* pixman: version 0.44.2
* pkgtools: version 15.1
* procps-ng: version 4.0.4
* pv: version 1.6.6
* qemu: version 9.1.0
* qrencode: version 4.1.1
* readline: version 8.2.013
* reiserfsprogs: version 3.6.27
* rpcbind: version 1.2.6
* rsync: version 3.3.0
* rsyslog: version 8.2102.0
* sakura: version 3.5.0
* samba: version 4.21.1
* sdparm: version 1.12
* sed: version 4.9
* sessreg: version 1.1.3
* setxkbmap: version 1.3.4
* sg3\_utils: version 1.48
* shadow: version 4.16.0
* shared-mime-info: version 2.4
* slim: version 1.3.6
* smartmontools: version 7.4
* spice: version 0.15.0
* spirv-llvm-translator: version 19.1.2
* sqlite: version 3.46.1
* ssmtp: version 2.64
* startup-notification: version 0.12
* sudo: version 1.9.16p2
* swtpm: version 0.7.3
* sysfsutils: version 2.1.1
* sysstat: version 12.7.6
* sysvinit: version 3.12
* sysvinit-scripts: version 15.1
* talloc: version 2.4.2
* tar: version 1.35
* tcp\_wrappers: version 7.6
* tdb: version 1.4.12
* telnet: version 0.17
* tevent: version 0.16.1
* traceroute: version 2.1.6
* transset: version 1.0.4
* tree: version 2.1.1
* usbredir: version 0.8.0
* usbutils: version 018
* userspace-rcu: version 0.15.0
* utempter: version 1.2.1
* util-linux: version 2.40.2
* vbetool: version 1.2.2
* virtiofsd: version 1.11.1
* vsftpd: version 3.0.5
* vte3: version 0.50.2
* wayland: version 1.23.1
* wget: version 1.25.0
* which: version 2.21
* wireguard-tools: version 1.0.20210914
* wqy-zenhei-font-ttf: version 0.8.38\_1
* wsdd2: version 1.8.7
* xauth: version 1.1.3
* xcb-util: version 0.4.1
* xcb-util-keysyms: version 0.4.1
* xclock: version 1.1.1
* xdpyinfo: version 1.3.4
* xdriinfo: version 1.0.7
* xev: version 1.2.6
* xf86-input-evdev: version 2.11.0
* xf86-input-keyboard: version 1.9.0
* xf86-input-mouse: version 1.9.3
* xf86-input-synaptics: version 1.9.2
* xf86-video-ast: version 1.1.5
* xf86-video-mga: version 2.1.0
* xf86-video-vesa: version 2.6.0
* xfsprogs: version 6.12.0
* xhost: version 1.0.9
* xinit: version 1.4.2
* xkbcomp: version 1.4.7
* xkbevd: version 1.1.6
* xkbutils: version 1.0.6
* xkeyboard-config: version 2.43
* xkill: version 1.0.6
* xload: version 1.2.0
* xlsatoms: version 1.1.4
* xlsclients: version 1.1.5
* xmessage: version 1.0.7
* xmodmap: version 1.0.11
* xorg-server: version 21.1.15
* xprop: version 1.2.8
* xrandr: version 1.5.3
* xrdb: version 1.2.2
* xrefresh: version 1.1.0
* xset: version 1.2.5
* xsetroot: version 1.1.3
* xsm: version 1.0.6
* xterm: version 396
* xtrans: version 1.5.2
* xwd: version 1.0.9
* xwininfo: version 1.1.6
* xwud: version 1.0.7
* xxHash: version 0.8.3
* xz: version 5.6.3
* yajl: version 2.1.0
* zfs: version 2.2.7\_6.6.68\_Unraid
* zlib: version 1.3.1
* zstd: version 1.5.6
## Patches[​](#patches)
With the [Unraid Patch plugin](https://forums.unraid.net/topic/185560-unraid-patch-plugin/) installed, visit ***Tools → Unraid Patch*** to get the following patches / hot fixes:
* mover was not moving shares with spaces in the name from array to pool
* File Manager: allow access to UD remote shares
* Share Listing: tool tip showed `%20` instead of a space
* VM Manager: fix issue with blank Discard field on vDisk
* Include installed patches in diagnostics
Note: if you have the Mover Tuning plugin installed, you will be prompted to reboot in order to apply these patches.
* [Upgrading](#upgrading)
* [Known issues](#known-issues)
* [Rolling back](#rolling-back)
* [Storage](#storage)
* [unRAID array optional](#unraid-array-optional)
* [Share secondary storage may be assigned to a pool](#share-secondary-storage-may-be-assigned-to-a-pool)
* [ReiserFS file system option has been disabled](#reiserfs-file-system-option-has-been-disabled)
* [Using 'mover' to empty an array disk](#using-mover-to-empty-an-array-disk)
* [Predefined shares handling](#predefined-shares-handling)
* [ZFS implementation](#zfs-implementation)
* [Allocation profiles for btrfs, zfs, and zfs subpools](#allocation-profiles-for-btrfs-zfs-and-zfs-subpools)
* [Pool considerations](#pool-considerations)
* [Other features](#other-features)
* [VM Manager](#vm-manager)
* [Improvements](#improvements)
* [Other changes](#other-changes)
* [Docker](#docker)
* [Docker fork bomb prevention](#docker-fork-bomb-prevention)
* [Add support for overlay2 storage driver](#add-support-for-overlay2-storage-driver)
* [Other changes](#other-changes-1)
* [Networking](#networking)
* [Tailscale integration](#tailscale-integration)
* [Support iframing the webGUI](#support-iframing-the-webgui)
* [Other changes](#other-changes-2)
* [webGUI](#webgui)
* [Integrated Dynamix File Manager plugin](#integrated-dynamix-file-manager-plugin)
* [Integrated GUI Search plugin](#integrated-gui-search-plugin)
* [Outgoing Proxy Manager](#outgoing-proxy-manager)
* [Notification Agents](#notification-agents)
* [NTP Configuration](#ntp-configuration)
* [NFS Shares](#nfs-shares)
* [Dashboard](#dashboard)
* [SMART improvements](#smart-improvements)
* [Diagnostics](#diagnostics)
* [Other changes](#other-changes-3)
* [Misc](#misc)
* [Other changes](#other-changes-4)
* [Linux kernel](#linux-kernel)
* [Base distro](#base-distro)
* [Patches](#patches)