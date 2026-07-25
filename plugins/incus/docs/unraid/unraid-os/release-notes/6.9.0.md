6.9.0 | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
## Version 6.9.0 2021-02-27[​](#version-690-2021-02-27)
Summary of New Features
## Multiple Pools[​](#multiple-pools)
This feature permits you to define up to 35 named pools, of up to 30
storage devices per pool. Pools are created and managed via the Main
page.
* Note: A pre-6.9.0 cache disk/pool is now simply a pool named
"cache". When you upgrade a server which has a cache disk/pool
defined, a backup of `config/disk.cfg` will be saved to
`config/disk.cfg.bak`, and then cache device assignment settings are
moved out of `config/disk.cfg` and into a new file,
`config/pools/cache.cfg`. If later you revert back to a pre-6.9.0
Unraid OS release you will lose your cache device assignments and
you will have to manually re-assign devices to cache. As long as
you reassign the correct devices, data should remain intact.
When you create a user share or edit an existing user share, you can
specify which pool should be associated with that share. The assigned
pool functions identically to the current cache pool operation.
Something to be aware of: when a directory listing is obtained for a
share, the Unraid array disk volumes and all pools which contain that
share are merged in this order:
>
> pool assigned to share
>
> disk1
>
`> :
`
>
> disk28
>
> all the
*> other
*> pools in
[> strverscmp()
](https://man7.org/linux/man-pages/man3/strverscmp.3.html)> order.
>
A single-device pool may be formatted with either xfs, btrfs, or
(deprecated) reiserfs. A multiple-device pool may only be formatted
with btrfs. A future release will include support for multiple "Unraid
array" pools, as well as a number of other pool types.
* Note: Something else to be aware of: Let's say you have a 2-device
btrfs pool. This will be what btrfs calls "raid1" and what most
people would understand to be "mirrored disks". Well, this is
mostly true in that the same data exists on both disks but not
necessarily at the block-level. Now let's say you create another
pool, and what you do is un-assign one of the devices from the
existing 2-device btrfs pool and assign it to this pool. Now you
have x2 single-device btrfs pools. Upon array Start user might
understandably assume there are now x2 pools with exactly the same
data. However, **this is not the case**. Instead, when Unraid OS
sees that a btrfs device has been removed from an existing
multi-device pool, upon array Start it will do a `wipefs` on that
device so that upon mount it will not be included in the old pool.
This of course effectively deletes all the data on the moved device.
### Additional btrfs balance options[​](#additional-btrfs-balance-options)
Multiple device pools are still created using btrfs *raid1* profile by
default. If you have 3 or more devices in a pool you may now rebalance
to *raid1c3* profile (x3 copies of data on separate devices). If you
have 4 or more devices in a pool you now rebalance to *raid1c4* (x4
copies of data on separate devices). We also modified the *raid6*
balance operation to set meta-data to *raid1c3* (previously was
*raid1*).
However, we have noticed that applying one of these balance filters to a
completely empty volume leaves some data extents with the previous
profile. The solution is to simply run the same balance again. We
consider this to be a btrfs bug and if no solution is forthcoming we'll
add the second balance to the code by default. For now, it's left
as-is.
### SSD 1 MiB Partition Alignment[​](#ssd-1-mib-partition-alignment)
We have added another partition layout where the start of partition 1 is
aligned on a 1 MiB boundary. That is, for devices that present 512-byte
sectors, partition 1 will start in sector 2048; for devices with
4096-byte sectors, in sector 256. This partition type is now used when
formatting all unformatted non-rotational storage (only).
It is not clear what benefit 1 MiB alignment offers. For some SSD
devices, you won't see any difference; for others, perhaps big
performance difference. LimeTech does not recommend re-partitioning an
existing SSD device unless you have a compelling reason to do so (or
your OCD just won't let it be).
To re-partition a SSD it is necessary to first wipe out any existing
partition structure on the device. Of course, **this will erase all
data** on the device. Probably the easiest way to accomplish this is,
with array Stopped, identify the device(s) to be erased and use the
'blkdiscard' command:
`blkdiscard /dev/xxx # for example /dev/sdb or /dev/nvme0n1 etc`
WARNING: be sure you type the correct device identifier because
**all data will be lost on that device!**
Upon next array Start the device will appear Unformatted, and since
there is now no partition structure, Unraid OS will create it.
* Note: If you want to re-partition your SSD-based cache disk/pool and
preserve data, please consider posting on the [Unraid Community
Forum](https://forums.unraid.net/forum/55-general-support/) for
assistance with your particular configuration. Refer also to [this
post](https://forums.unraid.net/bug-reports/prereleases/unraid-os-version-690-beta29-available-r1066/)
in the Prerelease board.
### SMART handling and Storage Threshold Warnings[​](#smart-handling-and-storage-threshold-warnings)
There is a configuration file named `config/smart-one.cfg` which stores
information related to SMART, for example, the controller type to be
passed to `smartctl` for purposes of fetching SMART information. Also
stored in that file are volume warning and critical free space
thresholds. Starting with this release, these configuration settings
are handled differently.
In the case of SMART configuration, settings are saved by device-ID
instead of by slot-ID. This permits us to manage SMART for unassigned
devices. It also permits SMART configuration to "follow the device"
no matter which slot it's assigned to. The implication however, is
that you must manually reconfigure SMART configuration for all devices
which vary from default.
The volume warning and critical space threshold settings have been moved
out of this configuration file and instead are saved now in
`config/disk.cfg` (for the Unraid array) and in the pool configuration
files for each pool. The implication is that you must manually
reconfigure these settings for all volumes which vary from default.
After upgrading you may receiving a notification such as:
`Notice [TOWER] - Disk 1 returned to normal utilization level`. As
described above, all of your SMART configuration settings were reset to
default. Visit `Settings -\> Disk Settings` to review the defaults, and
override for individual drives on `Main -\> Disk X -\> Settings`.
## Better Module/Third Party Driver Support[​](#better-modulethird-party-driver-support)
Recall that we distribute Linux modules and firmware in separate
squashfs files which are read-only mounted at `/lib/modules` and
`/lib/firmware`. We now set up an overlayfs on each of these mount
points, making it possible to install 3rd party modules using the plugin
system, provided those modules are built against the currently running
kernel version. In addition, we define a new directory on the USB flash
boot device called `config/modprobe.d` the contents of which are copied
to `/etc/modprobe.d` early in the boot sequence before the Linux kernel
loads any modules.
This technique is used to install the Nvidia driver (see below) and may
be used by Community Developers to provide an easier way to add modules
not included in base Unraid OS: no need to build custom bzimage,
bzmodules, bzfirmware and, bzroot files!
### Passing Parameters to Modules[​](#passing-parameters-to-modules)
The use of `conf` files in `config/modprobe.d` may be used to specify
options and pass arguments to modules.
As an example: at present we do not have UI support for specifying which
network interface should be "primary" in a bond; the bonding driver
simply selects the first member by default. In some configurations, it
may be useful to specify an explicit preferred interface, for example,
if you have a bond with a 1Gbit/s (eth0) and 10Gbit/sec (eth1)
interface.
Since setting up the bond involves loading the bonding kernel module,
and you can specify which interface to set as primary using this method:
Create a file on the flash: `config/modprobe.d/bonding.conf` which
contains this single line, and then reboot:
`options bonding primary=eth1`
After reboot you can check if it worked by typing this command:
`cat /proc/net/bonding/bond0`
where you should see the selected interface show up as "Primary
Slave".
### Nvidia Driver[​](#nvidia-driver)
The goal of creating squashfs overlays mounted at `/lib/modules` and
`/lib/firmware`, along with providing a mechanism for defining custom
module parameters, is to provide a way of integrating third-party
drivers into Unraid OS without requiring custom builds of the bz\*
files. One of the most popular third-party drivers requested for Unraid
OS is Nvidia's GPU Linux driver. This driver is required for
transcoding capability in Docker containers. Providing this driver as a
plugin for Unraid OS has required a lot of work to set up a dev
environment, compile the driver and tools, and then unpack bzmodules,
add the driver, create new bzmodules, and then finally replace in USB
flash root directory. This work has been accomplished by Community
members [@chbmb](https://forums.unraid.net/profile/6219-chbmb/),
[@bass\_rock](https://forums.unraid.net/profile/78406-bass_rock/), and
others. Building on their work, along with member
[@ich777](https://forums.unraid.net/profile/72388-ich777/) we now
create separate Nvidia driver packages built against each new Unraid OS
release that uses a new kernel, but not directly included in the base
bz\* distribution.
A JSON file describing the driver version(s) supported with each kernel
can be downloaded here:
[https://s3.amazonaws.com/dnld.lime-technology.com/drivers/releases.json](https://s3.amazonaws.com/dnld.lime-technology.com/drivers/releases.json)
Each driver package includes the Nvidia Linux GPU driver along with a
set of container tools. The container tools include:
`nvidia-container-runtime`
`nvidia-container-toolkit`
`libnvidia-container`
These tools are useful in facilitating accelerated transcoding in Docker
containers. A big Thank You! to Community member
[@ich777](https://forums.unraid.net/profile/72388-ich777/) for help and
for providing the tools.
[@ich777](https://forums.unraid.net/profile/72388-ich777/) has also
provided a [handy
plugin](https://raw.githubusercontent.com/ich777/unraid-nvidia-driver/master/nvidia-driver.plg)
to facilitate installing the correct driver.
The inclusion of third-party modules into Unraid OS using the plugin
system is still a work-in-progress. For example, another candidate would
be to replace the Linux in-tree Intel ethernet drivers with Intel's
custom Linux drivers.
## Docker[​](#docker)
It's now possible to select different icons for multiple containers of
the same type. This change necessitates a re-download of the icons for
all your installed docker applications. A delay when initially loading
either the Dashboard or the Docker tab while this happens is to be
expected prior to the containers showing up.
We also made some changes to add flexibility in assigning storage for
the Docker engine. This is configured using the Settings/Docker
Settings/Docker data root setting. This lets you select how to keep the
Docker persistent state (image layers):
* In a btrfs-formatted vdisk loopback-mounted at /var/lib/docker. In
this case the name of the image file must be 'docker.img'.
* In an xfs-formatted vdisk loopback-mounted at /var/lib/docker. In
this case the name of the image file must be 'docker-xfs.img'.
* In a specified directory which is bind-mounted at /var/lib/docker.
Further, the file system where this directory is located must either
be btrfs or xfs.
Docker will use either the 'btrfs' storage driver in the case of
btrfs-formatted vdisk/directory, or the 'overlay2' storage driver in
the case of xfs-formatted vdisk/directory.
Implemented as follows: First, `rc.docker` will detect the type of file
system mounted at `/var/lib/docker`. We now support either btrfs or xfs
and the docker storage driver is set appropriately.
Next, `mount\_image` is modified to support a loopback file formatted
either with btrfs or xfs depending on the suffix of the loopback file
name. For example, the file name ends with `.img`, as in `docker.img`
then we use `mkfs.btrfs`. If file name ends with `-xfs.img`, as in
`docker-xfs.img` then we use `mkfs.xfs`.
In addition, we added the ability to bind-mount a directory instead of
using a loopback. If the file name does not end with `.img` then the
code assumes this is the name of a directory (presumably on a share)
that is bind-mounted onto `/var/lib/docker`. For example, if
`/mnt/user/system/docker/docker` then we first create, if necessary the
directory `/mnt/user/system/docker/docker`. If this path is on a user
share we then "de-reference" the path to get the disk path which is
then bind-mounted onto `/var/lib/docker`. For example, if
`/mnt/user/system/docker/docker` is on "disk1", then we would
bind-mount `/mnt/disk1/system/docker/docker`. Caution: the share should
be cache-only or cache-no so that 'mover' will not attempt to move the
directory, but the script does not check this.
## Virtualization[​](#virtualization)
We integrated changes to the Tools → System Devices page made by user
[@Skitals](https://forums.unraid.net/profile/97624-skitals/) with
refinements by user
[@ljm42](https://forums.unraid.net/profile/61877-ljm42/). You can now
select PCI devices to isolate from Linux upon boot simply by checking
some boxes. This makes it easier to reserve those devices for
assignment to VM's. This technique is known as *stubbing* (because a
stub or dummy driver is assigned to the device at boot preventing the
real Linux driver from being assigned).
One might wonder, if we can *blacklist* individual drivers why do we
need to stub those devices in order to assign to VM's? The answer is:
you can. But, if you have multiple devices of the same type, where some
need to be passed to a VM and some need to have the host Linux driver
installed, then you must use stubbing for the devices to pass to VM's.
Note: If you had the VFIO-PCI Config plugin installed, you should remove
it as that functionality is now built-in to Unraid OS 6.9. If you had
manually stubbed devices by modifying your Syslinux file, consider
switching to the new method as described in the [vfio-pci
guide](https://forums.unraid.net/topic/93781-guide-bind-devices-to-vfio-pci-for-easy-passthrough-to-vms/).
## Multi-Language Support[​](#multi-language-support)
Another exciting new feature in Unraid 6.9 is the ability to download
language packs and use the Unraid OS in a number of different languages.
A huge amount of work and effort has been implemented by
[@bonienl](https://forums.unraid.net/profile/2736-bonienl/) to provide
multiple-language support in the Unraid OS Management Utility, aka,
WebGUI. Currently, *English, Spanish, French, German, Dutch, Arabic,
Simplified Chinese, Portuguese and Polish* are available and several
others are in the works.
Thanks to [@Squid](https://forums.unraid.net/profile/10290-squid/),
language packs are installed via the Community Applications plugin -
look for a new category entitled Language.
* Note: Community Applications must be up to date to install
languages. For additional detail, [see
here.](https://forums.unraid.net/topic/38582-plug-in-community-applications/page/124/?tab=comments#comment-866710)
Each language pack exists in public [Unraid organization github
repos](https://github.com/unraid). Interested users are encouraged to
clone and issue Pull Requests to correct translation errors. Language
translations and PR merging is managed by
[@SpencerJ](https://forums.unraid.net/profile/88446-spencerj/).
*For more info on Multi-Language Support, [please check out our
guide.](https://unraid.net/blog/unraid-6-9-multi-language-support)*
We have also added an [Unraid Community Forum Multi-Language
Section](https://forums.unraid.net/forum/75-multi-language-section/).
## Other[​](#other)
### GPU Driver Integration[​](#gpu-driver-integration)
Unraid OS now includes selected in-tree GPU drivers: ast (Aspeed), i915
(Intel), amdgpu and radeon (AMD). For backward compatibility, these
drivers are blacklisted by default via corresponding `conf` files in
`/etc/modprobe.d`:
`/etc/modprobe.d/ast.conf`
`/etc/modprobe.d/i915.conf`
`/etc/modprobe.d/amdgpu.conf`
`/etc/modprobe.d/radeon.conf`
Each of these files has a single line that *blacklists* the driver,
preventing it from being loaded by the Linux kernel.
It is possible to override the settings in these files by creating a
custom `conf` file in the `config/modprobe.d` directory on your USB
flash boot device. For example, to un-blacklist the amdgpu driver
create an empty file by typing this command in a Terminal session:
`touch /boot/config/modprobe.d/amdgpu.conf`
This only needs to be done once, it does not need to be added to your go
script.
In 6.9.1, if your go script contains a modprobe command for your GPU
and/or a command to fix the permissions on `/dev/dri`, you should remove
them:
`modprobe amdgpu`
`chmod -R 777 /dev/dri`
In 6.9.0, if the docker you are using is unable to access the GPU,
add/keep this line to your go script:
`chmod -R 777 /dev/dri`
but remove this one:
`modprobe amdgpu`
### Linux Kernel[​](#linux-kernel)
We are using [LTS](https://www.kernel.org/) (Long Term Supported)
kernel: version 5.10.x.
New features enabled in the kernel:
* WireGuard module
* iScsi Target module
* USB/IP module
These out-of-tree drivers are included:
* QLogic QLGE 10Gb Ethernet Driver Support (from staging)
* RealTek r8125: version 9.003.05 (included for newer r8125)
* HighPoint rr272x\_1x: version v1.10.6-19\_12\_05 (per user request)
Note that as we update the Linux kernel, if an out-of-tree driver no
longer builds, it will be omitted.
These drivers are **omitted**:
* Highpoint RocketRaid r750 (does not build)
* Highpoint RocketRaid rr3740a (does not build)
* Tehuti Networks tn40xx (does not build)
If you require one of these drivers, please create a Bug Report and
we'll spend some time looking for alternatives. Better yet, pester the
manufacturer of the controller and get *them* to update their drivers.
### Base Packages[​](#base-packages)
All updated to latest versions. In addition, [Linux
PAM](https://en.wikipedia.org/wiki/Linux_PAM) has been integrated. This
will permit us to install 2-factor authentication packages in a future
release.
### SAS Spinning Control[​](#sas-spinning-control)
We should also now be able to properly support SAS device spin-up/down
(finally) and with extraordinary help from
[@doron](https://forums.unraid.net/profile/8006-doron/) we are almost
there. SAS devices are generally designed for enterprise environments
where device spin-down is rare, and many devices have inconsistent
behavior surrounding this functionality. This release itself does not
include SAS device spin handling built-in but
[@doron](https://forums.unraid.net/profile/8006-doron/) is providing a
plugin where we continue to address some nagging details.
### SSH Improvements[​](#ssh-improvements)
There are changes in `/etc/ssh/sshd\_conf` to improve security (thanks to
[@Mihai](https://forums.unraid.net/profile/89549-mihai/) and
[@ljm42](https://forums.unraid.net/profile/61877-ljm42/) for
suggestions):
* only root user is permitted to login via ssh (remember: no
traditional users in Unraid OS - just 'root')
* non-null password is now required. To set a password go to the Users
tab (or Settings -\> Users, depending on your configuration), then
choose the "root" user, type a complex password twice and press
CHANGE (not RESET)
* non-root tunneling is disabled
In addition, upon upgrade we ensure the `config/ssh/root` directory
exists on the USB flash boot device; and, we have set up a symlink:
`/root/.ssh` to this directory. This means any files you might put into
`/root/.ssh` will be persistent across reboots.
So, if you had previously added commands to your `go` script to copy
`authorized\_keys` and other files to `/root/.ssh`, you should remove
those commands and simply put the files in `config/ssh/root`, then
reboot.
Note: if you examine the sshd startup script `/etc/rc.d/rc.sshd`, upon
boot all files from the `config/ssh` directory are copied to `/etc/ssh`
(but not subdirs). The purpose is to restore the host ssh keys;
however, this mechanism can be used to define custom `ssh\_conf` and
`sshd\_conf` files.
### "unexpected GSO errors"[​](#unexpected-gso-errors)
If your system log is being flooded with errors such as:
`Feb 20 09:09:21 Tower kernel: tun: unexpected GSO type: 0x0, gso\_size 31, hdr\_len 66`
You need to edit each VM and change the model type for the Ethernet
bridge from `virtio` to `virtio-net`. In most cases this can be
accomplished simply by clicking Update in "Form View" on the VM Edit
page. For other network configs it may be necessary to directly edit
the xml. Example:
```
`
\<interface type='bridge'\>
\<mac address='xx:xx:xx:xx:xx:xx'/\>
\<source bridge='br0'/\>
\<model type='virtio-net'/\>
\<address type='pci' domain='0x0000' bus='0x00' slot='0x03' function='0x0'/\>
\</interface\>
`
```
### "noVNC encountered an error"[​](#novnc-encountered-an-error)
If you get a `noVNC encountered an error` message after upgrading,
please clear your browser cache.
### AFP support has been removed[​](#afp-support-has-been-removed)
Even Apple is [moving
away](https://www.macworld.com/article/3600899/using-afp-to-share-a-mac-drive-its-time-to-change.html)
from this protocol.
For best interoperability with macOS, and to export a share for Time
Machine purposes, please ensure "Settings/SMB Settings/Enhanced macOS
interoperability" is set to "Yes".
## Change Log[​](#change-log)
#### Base distro[​](#base-distro)
* aaa\_elflibs: version 15.0 build 27
* acl: version 2.2.53
* acpid: version 2.0.32
* apcupsd: version 3.14.14
* at-spi2-core: version 2.36.1
* at: version 3.2.1
* attr: version 2.4.48
* avahi: version 0.8
* bash: version 5.0.018
* beep: version 1.3
* bin: version 11.1
* bluez-firmware: version 1.2
* bridge-utils: version 1.7
* brotli: version 1.0.9 build 2
* btrfs-progs: version 5.10
* bzip2: version 1.0.8
* ca-certificates: version 20201219
* celt051: version 0.5.1.3
* cifs-utils: version 6.11
* coreutils: version 8.32
* cpio: version 2.13
* cpufrequtils: version 008
* cryptsetup: version 2.3.4
* curl: version 7.74.0 (CVE-2020-8231 CVE-2020-8286 CVE-2020-8285
CVE-2020-8284)
* cyrus-sasl: version 2.1.27
* db48: version 4.8.30
* dbus: version 1.12.20
* dcron: version 4.5
* devs: version 2.3.1 build 25
* dhcpcd: version 8.1.9
* diffutils: version 3.7
* dmidecode: version 3.3
* dnsmasq: version 2.84 (CVE-2020-25681 CVE-2020-25682 CVE-2020-25683
CVE-2020-25684 CVE-2020-25685 CVE-2020-25686 CVE-2020-25687)
* docker: version 19.03.14
* dosfstools: version 4.1
* e2fsprogs: version 1.45.6
* ebtables: version 2.0.11
* eject: version 2.1.5
* elvis: version 2.2\_0
* etc: version 15.0
* ethtool: version 5.9
* eudev: version 3.2.5
* file: version 5.39
* findutils: version 4.7.0
* flex: version 2.6.4
* floppy: version 5.5
* fontconfig: version 2.13.92
* freetype: version 2.10.4
* fribidi: version 1.0.10
* fuse3: version 3.10.0
* gawk: version 4.2.1
* gd: version 2.2.5
* gdbm: version 1.18.1
* genpower: version 1.0.5
* getty-ps: version 2.1.0b
* git: version 2.29.1
* glib2: version 2.66.2
* glibc-solibs: version 2.30 build 2
* glibc-zoneinfo: version 2020d
* glibc: version 2.30 build 2
* gmp: version 6.2.0
* gnutls: version 3.6.15
* gptfdisk: version 1.0.5
* grep: version 3.4
* gtk+3: version 3.24.23
* gzip: version 1.10
* harfbuzz: version 2.7.2
* haveged: version 1.9.13
* hdparm: version 9.60
* hostname: version 3.23
* htop: version 3.0.2
* icu4c: version 68.1
* inetd: version 1.79s
* infozip: version 6.0
* inotify-tools: version 3.20.2.2
* intel-microcode: version 20210216
* iproute2: version 5.9.0
* iptables: version 1.8.5
* iputils: version 20200821
* irqbalance: version 1.6.0
* jansson: version 2.13.1
* jasper: version 2.0.22
* jemalloc: version 5.2.1
* jq: version 1.6
* kernel-firmware: version 20210211\_f7915a0
* keyutils: version 1.6.1
* kmod: version 27
* krb5: version 1.18.2
* lbzip2: version 2.5
* lcms2: version 2.11
* less: version 563
* libX11: version 1.6.12
* libaio: version 0.3.112
* libarchive: version 3.4.3
* libcap-ng: version 0.8 build 2
* libcgroup: version 0.41
* libdaemon: version 0.14
* libdrm: version 2.4.102
* libedit: version 20191231\_3.1
* libestr: version 0.1.11
* libevdev: version 1.10.0
* libevent: version 2.1.12
* libfastjson: version 0.99.8
* libffi: version 3.3
* libgcrypt: version 1.8.7
* libglvnd: version 1.3.2
* libgpg-error: version 1.39
* libgudev: version 234
* libidn: version 1.36
* libjpeg-turbo: version 2.0.5
* liblogging: version 1.0.6
* libmnl: version 1.0.4
* libnetfilter\_conntrack: version 1.0.8
* libnfnetlink: version 1.0.1
* libnftnl: version 1.1.8
* libnl3: version 3.5.0
* libpcap: version 1.9.1
* libpciaccess: version 0.16
* libpng: version 1.6.37
* libpsl: version 0.21.1 build 2
* librsvg: version 2.50.1
* libseccomp: version 2.4.3
* libssh2: version 1.9.0
* libssh: version 0.9.5
* libtasn1: version 4.16.0
* libtirpc: version 1.2.6
* libunistring: version 0.9.10
* libusb-compat: version 0.1.5
* libusb: version 1.0.23
* libuv: version 1.34.0
* libvirt-php: version 0.5.5
* libvirt: version 6.6.0 (CVE-2020-14339)
* libwebp: version 1.1.0 build 3
* libwebsockets: version 3.2.2
* libx86: version 1.1
* libxkbcommon: version 1.0.1
* libxml2: version 2.9.10 build 3
* libxslt: version 1.1.34
* libzip: version 1.7.3
* lm\_sensors: version 3.6.0
* lmdb: version 0.9.27
* logrotate: version 3.17.0
* lshw: version B.02.17
* lsof: version 4.93.2
* lsscsi: version 0.31
* lvm2: version 2.03.10
* lz4: version 1.9.1
* lzip: version 1.21
* lzo: version 2.10
* mc: version 4.8.25
* miniupnpc: version 2.1
* mpfr: version 4.1.0
* nano: version 5.3
* ncompress: version 4.2.4.6
* ncurses: version 6.2\_20201024
* net-tools: version 20181103\_0eebece
* nettle: version 3.6
* network-scripts: version 15.0 build 9
* nfs-utils: version 2.1.1
* nghttp2: version 1.41.0
* nginx: version 1.19.5 (CVE-2019-9511, CVE-2019-9513, CVE-2019-9516)
* nodejs: version 13.12.0
* nss-mdns: version 0.14.1
* ntfs-3g: version 2017.3.23
* ntp: version 4.2.8p15 build 3
* numactl: version 2.0.11
* oniguruma: version 6.9.1
* openldap-client: version 2.4.49
* openssh: version 8.4p1 build 2
* openssl-solibs: version 1.1.1i
* openssl: version 1.1.1i
* p11-kit: version 0.23.22 (CVE-2020-29361 CVE-2020-29361
CVE-2020-29361)
* pam: version 1.5.1
* pango: version 1.46.2
* patch: version 2.7.6
* pciutils: version 3.7.0
* pcre2: version 10.35
* pcre: version 8.44
* php: version 7.4.15 (CVE-2019-11048 CVE-2020-7068 CVE-2020-7070
CVE-2020-7069)
* pixman: version 0.40.0
* pkgtools: version 15.0 build 33
* pm-utils: version 1.4.1
* procps-ng: version 3.3.16
* pv: version 1.6.6
* qemu: version 5.1.0 (CVE-2020-10717, CVE-2020-10761)
* qrencode: version 4.0.2
* reiserfsprogs: version 3.6.27
* rpcbind: version 1.2.5 build 2
* rsync: version 3.2.3
* rsyslog: version 8.2002.0
* samba: version 4.12.11 (CVE-2020-10700, CVE-2020-10704
CVE-2020-10730, CVE-2020-10745, CVE-2020-10760, CVE-2020-14303
CVE-2020-1472 CVE-2020-14318 CVE-2020-14318 CVE-2020-14318)
* sdparm: version 1.11
* sed: version 4.8
* sg3\_utils: version 1.45
* shadow: version 4.8.1
* shared-mime-info: version 2.0
* smartmontools: version 7.1
* spice: version 0.14.1
* sqlite: version 3.33.0
* ssmtp: version 2.64
* sudo: version: 1.9.3p2 (CVE-2021-23239 CVE-2021-23240)
* sysfsutils: version 2.1.0
* sysvinit-scripts: version 2.1 build 35
* sysvinit: version 2.97
* talloc: version 2.3.1 build 4
* tar: version 1.32
* tcp\_wrappers: version 7.6 build 3
* tdb: version 1.4.3 build 4
* telnet: version 0.17
* tevent: version 0.10.2 build 4
* traceroute: version 2.1.0
* tree: version 1.8.0
* ttyd: version 20200624
* usbredir: version 0.7.1
* usbutils: version 013
* utempter: version 1.2.0
* util-linux: version 2.36 build 2
* vbetool: version 1.2.2
* vsftpd: version 3.0.3 build 7
* wget: version 1.20.3
* which: version 2.21
* wireguard-tools: version 1.0.20210223
* wsdd: version 20180618
* xev: version 1.2.4
* xf86-video-vesa: version 2.5.0
* xfsprogs: version 5.9.0
* xinit: version 1.4.1
* xkeyboard-config: version 2.31
* xorg-server: version 1.20.9 build 3
* xterm: version 361
* xxHash: version 0.8.0
* xz: version 5.2.5
* yajl: version 2.1.0
* zlib: version 1.2.11
* zstd: version 1.4.5
#### Linux kernel[​](#linux-kernel-1)
* version 5.10.19
* CONFIG\_WIREGUARD: WireGuard secure network tunnel
* CONFIG\_IP\_SET: IP set support
* CONFIG\_SENSORS\_DRIVETEMP: Hard disk drives with temperature sensors
* md/Unraid: version 2.9.17
* removed spinup group spinup/spdindown support (functionality moved to emhttpd)
* added configurable sync start offset
* added iSCSI kernel support:
 - CONFIG\_ISCSI\_TARGET: Linux-iSCSI.org iSCSI Target Mode Stack
* CONFIG\_ISCSI\_TARGET\_CXGB4: Chelsio iSCSI target offload driver
* CONFIG\_LOOPBACK\_TARGET: TCM Virtual SAS target and Linux/SCSI LDD
fabric loopback module
* CONFIG\_NVME\_TARGET: NVMe Target support
* CONFIG\_NVME\_TARGET\_LOOP: NVMe loopback device support
* CONFIG\_NVME\_TARGET\_PASSTHRU: NVMe Target Passthrough support
* CONFIG\_TARGET\_CORE: Generic Target Core Mod (TCM) and ConfigFS
Infrastructure
* CONFIG\_TCM\_FILEIO: TCM/FILEIO Subsystem Plugin for Linux/VFS
* CONFIG\_TCM\_IBLOCK: TCM/IBLOCK Subsystem Plugin for Linux/BLOCK
* CONFIG\_TCM\_PSCSI: TCM/pSCSI Subsystem Plugin for Linux/SCSI
* CONFIG\_TCM\_USER2: TCM/USER Subsystem Plugin for Linux
* added USB/IP kernel support:
 - CONFIG\_USBIP\_CORE: USB/IP support
 - CONFIG\_USBIP\_VHCI\_HCD: VHCI hcd
* mpt3sas: added /etc/modprobe.d/mpt3sas-workaround.conf to set
"max\_queue\_depth=10000"
* oot: Realtek r8152: version 2.13.0
* oot: Tehuti tn40xx: version 0.3.6.17.3
* enabled additional hwmon native drivers
* enabled additional hyperv drivers
#### Management[​](#management)
* AFP support removed
* Multi-language support added
* Multiple pool support added
* at: suppress session open/close syslog messages
* avoid sending spinup/spindown to non-rotational devices
* btrfs: include 'discard=async' mount option
* bug fix: rename /etc/krb.conf to /etc/krb5.conf
* cleanup passwd, shadow
* dhcpcd: ipv6: use slaac hwaddr instead of slaac private
* docker: correct storage-driver assignemnt logic
* docker: support both btrfs and xfs backing filesystems
* emhtppd: wipefs encrypted device removed from multi-device pool
* emhtptd: track clean/unclean shutdown using file 'config/forcesync'
* emhttpd: added wipefs function (WebGUI 'Erase' button)
* emhttpd: avoid unnecessarily removing mover.cron file
* emhttpd: avoid using remount to set additional mount options
* emhttpd: bug fix: No Smartdata for non standard controller type
* emhttpd: bug fix: initial device temperatures not being displayed
* emhttpd: correct 'Erase' logic for Unraid array devices
* emhttpd: enable SMART on devices upon startup
* emhttpd: fix 'auto' setting where pools enabled for user shares
should not be exported
* emhttpd: fix disk "SMART controller type" not being honored when
reading temperatures
* emhttpd: fix external 'smartctl -n standby' causing device spinup
* emhttpd: get rid of poll\_attributes event
* emhttpd: implement spinup group spinup/spindown; add
spinup/spindown callouts
* emhttpd: permit Erase of 'DISK\_DSBL\_NEW' replacement devices
* emhttpd: restore 'poll\_attributes' event callout
* emhttpd: unassigned devices spin-down according to global default
* emhttpd: yet another btrfs 'free/used' calculation method
* fix emhttpd crash resulting from exporting NFS disk share(s)
* fix non-rotational device partitions were not actually being 1MiB
aligned
* get rid of 'system' plugin support (never used)
* integrate PAM
* integrate ljm42 vfio-pci script changes
* loopbacks: permit xfs or btrfs based on filename
* modprobe: blacklist GPU drivers by default, config/modprobe.d/\*
can override at boot
* mount all btrfs volumes using 'space\_cache=v2' option
* mount loopbacks with 'noatime' option; enable 'direct-io'
* mount\_image: suppport bind-mount
* non-rotational device partitions aligned on 1MiB boundary by default
* plugin: support sha256 file validation
* rsyslog: fix broken "Mirror syslog to flash"
* samba: disable aio by default
* shfs: move: preserve ioctl\_iflags when moving between same file system types
* shfs: move: support spares files
* smart-one.cfg keeps SMART info per-ID instead of per-slot; disk
warning/critical config moved to disk/pool cfg
* smb: fixed Ad join issue
* smb: remove setting 'aio' options in smb.conf, use samba defaults
* ssh: add /root/.ssh symlink to /boot/config/ssh/root directory
* ssh: allow only root user, require passwords, disable non-root tunneling
* ssh: require passwords, disable non-root tunneling
* startup: setup an overlayfs for /lib/modules and /lib/firmware
* syslog: configure to also listen on localhost udp port 514
* web terminal: inhibit warning pop-up when closing window
* wireguard support: rc.wireguard: add iptables rules
* WebGUI: Fix dockerupdate.php warnings
* WebGUI: Update statuscheck
* WebGUI: Add 'Portuguese (pt)' key map option for libvirt
* WebGUI: Add customizable timeout when stopping containers
* WebGUI: Add log viewer for vfio-pci
* WebGUI: Add notification agent for Discord
* WebGUI: Add pools information to diagnostics
* WebGUI: Add raid1c3 and raid1c4 btrfs pool balance options.
* WebGUI: Add update dialog to docker context menu
* WebGUI: Added "safe mode" one-shot safemode reboot option
* WebGUI: Added btrfs info for all pools in diagnostics
* WebGUI: Added new display setting: show normalized or raw device identifiers
* WebGUI: Added new setting "Enable user share assignment" to cache pool
* WebGUI: Added support for private docker registries with basic auth
or no auth, and improvements for token based authentication
* WebGUI: Allow different image types to upload with 512K max
* WebGUI: Allow duplicate containers different icons
* WebGUI: Allow markdown within container descriptions
* WebGUI: Change Icon for Motherboard Info from cog (settings) to info
* WebGUI: Changed: Consistency between dashboard and docker on accessing logs
* WebGUI: Dashboard: fix stats of missing interface
* WebGUI: Dashboard: style adjustment for server icon
* WebGUI: Detect invalid session and logout current tab
* WebGUI: Diagnostics: Remove SHA256 Hashes
* WebGUI: Disallow "?" in share names
* WebGUI: Display settings: colors should be 3 or 6 character hex digits
* WebGUI: Do not show CA profiles in Add Container list
* WebGUI: Docker: allow BTRFS or XFS vdisk, or folder location
* WebGUI: Docker: more intuitive handling of images
* WebGUI: Fix ' appearing
* WebGUI: Fix Azure / Gray Switch Language being cut-off
* WebGUI: Fix Banner Warnings Not Dismissing without reload of page
* WebGUI: Fix Started VMs not appearing in dashboard
* WebGUI: Fix crash when reading very large log files (limiting output to 1000 lines).
* WebGUI: Fix dismiss all notification
* WebGUI: Fix not able to change parity check schedule if no cache pool present
* WebGUI: Fix notifications continually reappearing
* WebGUI: Fix unable to use top right icons if notifications present
* WebGUI: Fix wrong docker run URL reference
* WebGUI: Fix: Dashboard / Docker scrolling on iPad devices
* WebGUI: Fix: properly set samesite cookie (fix login issue with Safari)
* WebGUI: For raid6 btrfs pool data profile use raid1c3 metadata profile.
* WebGUI: Icon buttons re-arrangement
* WebGUI: Main page: hide Move button when user shares are not enabled
* WebGUI: Multi-language: Fixed regression error: missing indicator for required fields
* WebGUI: Multilanguage: Fix unable to delete / edit users
* WebGUI: Network settings: show first DNSv6 server
* WebGUI: Network: allow metric value of zero to set no default gateway
* WebGUI: Network: fix privacy extensions not set
* WebGUI: New Perms: Support multi-cache pools
* WebGUI: Notifications: Fix gap on white / black
* WebGUI: Permit file system configuration when array Started for Unmountable volumes.
* WebGUI: Prevent "Add" reverting to English when adding a new user with an invalid username
* WebGUI: Prevent bonded nics from being bound to vfio-pci too
* WebGUI: Remove WG from Dashboard if no tunnels defined
* WebGUI: Show message when too many files for browsing
* WebGUI: Support links on notifications
* WebGUI: Suppress Autofan link on Dashboard if plugin not installed
* WebGUI: Suppress WG on Dashboard if no tunnels defined
* WebGUI: Switch Diagnostics to web socket
* WebGUI: SysDevs - warn if leave page without saving
* WebGUI: SysDevs overhaul with vfio-pci.cfg binding
* WebGUI: Tabbed case select window
* WebGUI: Task Plugins: Providing Ability to define Display\_Name
* WebGUI: Update Feedback.php
* WebGUI: Update jGrowl to version 1.4.7
* WebGUI: Update noVNC to v1.2.0
* WebGUI: Updated case icons
* WebGUI: Use update image dialog for update entry in docker context menu
* WebGUI: VM Manager: add 'virtio-win-0.1.189-1' to VirtIO-ISOs list
* WebGUI: VM manager: Fix: Changing from VM VNC graphics to GPU passthrough
* WebGUI: VM manager: add virtio-win-0.1.190-1
* WebGUI: VM manager: new setting "Network Model"
* WebGUI: VMs: Fixed: Adding NICs or VirtFS mounts to a VM is limited
* WebGUI: VMs: Fixed: rare cases vdisk defaults to Auto when it should be Manual
* WebGUI: VMs: change default network model to virtio-net
* WebGUI: VMs: more intuitive handling of image selection
* WebGUI: avoid php syntax error if autov() source file does not exist
* WebGUI: better handling of multiple nics with vfio-pci
* WebGUI: correct login form wrong default case icon displayed
* WebGUI: do not try to display SMART info that causes spin-up for devices that are spun-down
* WebGUI: dockerMan: Allow readmore in advanced view
* WebGUI: dockerMan: Only allow name compatible with docker
* WebGUI: dockerMan: Selectable start upon install
* WebGUI: fix: jGrowl covering buttons
* WebGUI: fix: login prompt when switching between servers
* WebGUI: other misc. improvements
* WebGUI: pools not enabled for user shares should not be selectable for cache
* WebGUI: sanitize input on tail\_log
* WebGUI: set 'mid-tower' default case icon
* WebGUI: support spin-up/down and temperature monitoring of unassigned devices
* WebGUI: turn off username autocomplete in login form
* WebGUI: vm manager: Preserve VNC port settings
* WebGUI: vnc: add browser cache busting
["WireGuard" and the "WireGuard" logo are registered trademarks of Jason A. Donenfeld.](https://www.wireguard.com/)
* [Version 6.9.0 2021-02-27](#version-690-2021-02-27)
* [Multiple Pools](#multiple-pools)
* [Additional btrfs balance options](#additional-btrfs-balance-options)
* [SSD 1 MiB Partition Alignment](#ssd-1-mib-partition-alignment)
* [SMART handling and Storage Threshold Warnings](#smart-handling-and-storage-threshold-warnings)
* [Better Module/Third Party Driver Support](#better-modulethird-party-driver-support)
* [Passing Parameters to Modules](#passing-parameters-to-modules)
* [Nvidia Driver](#nvidia-driver)
* [Docker](#docker)
* [Virtualization](#virtualization)
* [Multi-Language Support](#multi-language-support)
* [Other](#other)
* [GPU Driver Integration](#gpu-driver-integration)
* [Linux Kernel](#linux-kernel)
* [Base Packages](#base-packages)
* [SAS Spinning Control](#sas-spinning-control)
* [SSH Improvements](#ssh-improvements)
* ["unexpected GSO errors"](#unexpected-gso-errors)
* ["noVNC encountered an error"](#novnc-encountered-an-error)
* [AFP support has been removed](#afp-support-has-been-removed)
* [Change Log](#change-log)