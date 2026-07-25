6.10.2 | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
## Version 6.10.2 2022-05-27[​](#version-6102-2022-05-27)
### Data Corruption possible with tg3 driver when Intel VT-d is enabled[​](#data-corruption-possible-with-tg3-driver-when-intel-vt-d-is-enabled)
The combination of Linux 5.15 kernel, tg3 driver, and Intel VT-d enabled
appears to be causing data corruption. This has been verified on
several platforms which include a Broadcom NetXtreme Gigabit Ethernet
NIC (note: there may be others). This release includes the following
workaround:
Very early in server startup (rc.S) if Intel VT-d is detected enabled,
then the script will unconditionally create the file:
`/etc/modprobe.d/tg3.conf`
with following content:
`blacklist tg3`
Hence by default if VT-d is enabled, which is to say, it has not been
disabled in either bios or via kernel "intel*iommu=off", then we are
going to blacklist the tg3 driver on all platforms. What if someone has
a platform where tg3 does not give them any trouble with VT-d enabled?
In this case they must create an \_empty* file on their flash device:
`config/modprobe.d/tg3.conf`
When the startup sequence continues it will get to the point where it
executes:
`install -p -m 0644 /boot/config/modprobe.d/\* /etc/modprobe.d`
A *blank* tg3.conf file stored on the flash then effectively
un-blacklists it.
There will be users who will lose network connectivity because their NIC
is blacklisted. If you are running on a problematic platform you should
go into your bios and disable VT-d. If this is a platform without issue,
then you will need to create the blank tg3.conf file on your flash
config/modprobe.d directory.
It may take some time to identify and integrate a proper fix for this
issue, at which point we will remove the auto-blacklisting code.
#### How to Disable Intel VT-d on HP MicroServer Gen 8 with a E3-1265LV2[​](#how-to-disable-intel-vt-d-on-hp-microserver-gen-8-with-a-e3-1265lv2)
Reboot the server, then:
* During bootup press F9 to enter the bios.
* Once the bios is loaded enter the menu System Options → Processor
Options → Intel(R) VT-d
* Set it to disabled
* Press Esc to get to the top menu again
* Press F10 to exit the bios and save
The server should now boot again as normal. Hat tip to Community member
[Oceanic for the
instructions](https://forums.unraid.net/topic/124108-unraid-os-version-6102-available/#comment-1132042).
### Security-related Changes[​](#security-related-changes)
* The Firefox browser and has been updated to version 100.0.2 to
address a very nasty security vulnerability. If you use Firefox we
also suggest upgrading on all platforms.
* We fixed an issue where WebGUI login could accept a password from a
user other than 'root', if that username included the string
'root'.
* The Linux kernel was updated to 5.15.43 to address a "security
bypass" vulnerability.
### Other Changes[​](#other-changes)
* On Management Access page, for the "Use SSL/TLS" setting we
changed the word "Auto" to "Strict" in the drop-down menu. This
better describes the action of this setting.
* Docker manager now uses Docker label for icons as fallback.
* VM manager now gives the option of using LibVirt networks in
addition to bridges without having to edit the VM's XML.
* Improved handling of custom SSL certificates.
* [6.10.1] Fix regression: support USB flash boot from other than
partition 1
* other misc. bug fixes
## Change Log vs. Unraid OS 6.10.1[​](#change-log-vs-unraid-os-6101)
#### Base distro[​](#base-distro)
* firefox AppImage: version: 100.0.r20220519220738 (CVE-2022-1802
CVE-2022-1529)
#### Linux kernel[​](#linux-kernel)
* version 5.15.43-Unraid (CVE-2022-21499)
#### Management[​](#management)
* nginx: avoid appending default port number to redirect URLs
* nginx: self-signed cert file: accept common name and all alternate
names
* startup: fix multiple network interfaces being assigned the same MAC
address
* startup: blacklist tg3 by default if Intel VT-d is enabled
* WebGUI: Management Access: Use SSL/TLS setting: change the word
'Auto' to 'Strict'
* WebGUI: Fixed: smGlue not included when selecting a controller
* WebGUI: Fixed: allow share names with embedded ampersand
* WebGUI: add LXC terminal support (for LXC Plugin)
* WebGUI: Docker Web UI to use Docker label for icons as fallback
* WebGUI: VM Manager: support libvirt networks (make libvirt networks
accessible via gui)
* WebGUI: fix issue where 'root' login works with password from
another username which includes string 'root'
* WebGUI: Update OS page spelling corrction: warninging → warning
* WebGUI: helptext review: minor corrections
## Patches[​](#patches)
With the [Unraid Patch plugin](https://forums.unraid.net/topic/185560-unraid-patch-plugin/) installed, visit ***Tools → Unraid Patch*** to get the following patches / hot fixes:
* A subset of security updates, see [this blog post](https://unraid.net/blog/cvd) for details. We recommend upgrading to the latest stable release for additional security updates.
* [Version 6.10.2 2022-05-27](#version-6102-2022-05-27)
* [Data Corruption possible with tg3 driver when Intel VT-d is enabled](#data-corruption-possible-with-tg3-driver-when-intel-vt-d-is-enabled)
* [Security-related Changes](#security-related-changes)
* [Other Changes](#other-changes)
* [Change Log vs. Unraid OS 6.10.1](#change-log-vs-unraid-os-6101)
* [Patches](#patches)