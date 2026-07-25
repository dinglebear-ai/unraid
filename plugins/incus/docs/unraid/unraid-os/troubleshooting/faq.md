FAQ | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
If you need help with Unraid OS, you have several support options:
* **Unraid Forums:** [General Support](https://forums.unraid.net/forum/55-general-support/), [Compulsive Design](https://forums.unraid.net/forum/35-unraid-compulsive-design/)
* **Official Documentation:** [Unraid Docs](/)
* **Discord:** [Unraid Discord Community](https://discord.unraid.net)
* **Support Portal:** [Unraid Support](https://unraid.net/support)
## Build & Hardware[​](#build--hardware)
### I need help with a build or system configuration. Where do I go?[​](#build-help)
For guidance on building or upgrading your Unraid server, visit the [Compulsive Design forum](https://forums.unraid.net/forum/35-unraid-compulsive-design/) or join the [Unraid Discord](https://discord.unraid.net). The community is active and ready to assist you, no matter your level of experience.
### What controllers are recommended for Unraid?[​](#hardware-raid-support)
Unraid performs best with non-RAID Host Bus Adapters (HBAs). It's best to avoid hardware RAID controllers, which can obscure drive health information and complicate maintenance.
Always check for firmware updates and ensure the controller is set to HBA/IT mode, not RAID mode. You can refer to the [Recommended Controllers thread](https://forums.unraid.net/topic/102010-recommended-controllers-for-unraid/) for models that the community has tested successfully.
### What's the best way to add more storage if my built-in controller is full?[​](#add-more-storage)
Unraid allows for the expansion of storage across multiple controllers. You can add a compatible HBA (as mentioned above). Ensure the controller operates in standard HBA (non-RAID) mode and supports AHCI/SATA. Avoid using RAID-only cards, as Unraid requires direct disk access for parity and monitoring.
### Does Unraid have an allocation feature that remembers bad sectors on drives to prevent writes to them?[​](#bad-sector-allocation)
Unraid utilizes SMART data from your drives to monitor their health and detect issues such as bad sectors. SMART is built into modern hard drives and SSDs, tracking attributes such as reallocated and pending sectors.
While Unraid doesn't have a specific allocation feature to avoid bad sectors, it does use SMART data to notify you if a drive displays signs of failure or has an increasing number of bad sectors. This information can be found in the WebGUI under the drive's health status and SMART attributes.
If a drive shows a high count of reallocated or pending sectors, consider replacing it soon to prevent data loss.
If you're uncertain about a drive's health, you can share your SMART data in the [General Support forum](https://forums.unraid.net/forum/55-general-support/) for assistance from the community.
## OS & Configuration[​](#os--configuration)
### Can I use a HASP key within a VM on Unraid? How does that work with multiple VMs?[​](#hasp-key-vm)
If your HASP key is a USB dongle, you can assign it to only one VM at a time. Note that two VMs cannot use the same key simultaneously. You might need to pass through an entire USB controller for better compatibility. Always run tests with a Trial license to confirm that your hardware performs as expected.
### My boot device has failed, and I don't have a backup. How do I restore my configuration?[​](#usb-failed-restore)
If you had [Unraid Connect](/unraid-connect/overview-and-setup/) enabled for automated boot backups, you can use it to restore. If not, get new, high-quality boot media (for most users a USB flash drive), install Unraid on it, and use the registration key you received via email. Reassign your drives as they were. If you can't recall the assignments, post for assistance in the [General Support forum](https://forums.unraid.net/forum/55-general-support/).
### What should I do if I have forgotten my root password?[​](#forgot-root-password)
Refer to [Reset your password](/unraid-os/system-administration/secure-your-server/user-management/#reset-your-password).
note
If you're using encrypted drives and forget the encryption password, data recovery isn't possible - there is no backdoor.
### How do I completely start Unraid OS from scratch? (Factory reset procedure)[​](#factory-reset)
1. Backup any data you wish to keep.
2. Stop the array and shut down your server.
3. Remove the boot device.
4. Use the Unraid USB Flash Creator tool to reformat and reinstall Unraid onto the drive.
5. Reinsert the boot device and boot your server.
6. In the WebGUI, open a terminal and run `lsblk` to list all drives (excluding the boot device).
7. Wipe existing filesystems from each data drive:
Critical: Destructive Operation
**This step will permanently erase ALL data on the specified drive(s) and is IRREVERSIBLE!**
* **Verify you have backups** of any data you need before proceeding
* **Double-check the device identifier** in the WebGUI or with `lsblk` before running this command
* **Ensure you're targeting the correct drive** - data loss from the wrong drive cannot be recovered
For each data drive, run:
```
`
wipefs /dev/sdX
`
```
Replace `X` with the correct drive letter (e.g., sda, sdb, sdc)
1. Continue with the normal Unraid setup and configuration.
### How do I change the hostname of my server?[​](#change-hostname)
To change your Unraid server's hostname, navigate the WebGUI to ***Settings → System Settings → Identification***.
**Effects of changing your hostname:**
* The new hostname will be used for network identification (e.g., access via `http://newname`).
* You might need to reconnect any mapped network drives or shortcuts using the new hostname.
* Some devices or services may cache the old name; a full device reboot may be required to recognize the new name.
### My boot device is reporting an invalid GUID. What do I do?[​](#invalid-guid)
Unraid requires a boot device with a unique hardware GUID (for USB boot, this is usually a USB flash drive). Some manufacturers may reuse GUIDs or use generic values, and counterfeit drives, especially of well-known brands like SanDisk and Samsung—often lack unique GUIDs. For guidance on choosing a compatible drive (including brand and retailer advice), see [Create your bootable media](/unraid-os/getting-started/set-up-unraid/create-your-bootable-media/) and [Selecting a replacement device](/unraid-os/system-administration/maintain-and-update/changing-the-flash-device/#selecting-a-replacement-device).
In short: Prefer drives from reputable retailers. Consider second-tier brands (e.g., TeamGroup, Transcend, PNY), which are less often counterfeited. Avoid generic or unbranded drives, SSDs, USB card readers, and SD card adapters; they often lack unique GUIDs and may not be supported for booting Unraid.
## Virtualization & Devices[​](#virtualization--devices)
### Whenever I shut down my Windows VM with an AMD GPU assigned, it fails to restart. What can I do?[​](#amd-gpu-vm-restart)
Many AMD GPUs experience issues with function-level resets, which contribute to this problem. Workarounds include ejecting the GPU from within Windows before shutting down or using an NVIDIA GPU, which generally avoids this issue.
### How do I pass through my primary GPU to a VM if my CPU has no integrated graphics?[​](#primary-gpu-passthrough)
This is feasible but requires additional steps. Check out [SpaceInvaderOne's video guide](https://forums.unraid.net/topic/51230-video-guidehow-to-pass-through-an-nvidia-gpu-as-primary-or-only-gpu-in-unraid/) for detailed instructions on how to do this properly.
## Storage & RAID[​](#storage--raid)
### Does Unraid support various RAID types such as RAID1/5/6/10?[​](#raid-types-support)
Unraid features a unique storage architecture that distinguishes it from traditional RAID systems. Here's a comparison of different storage options:
|Feature / CapabilityUnraid parityarray (md)BTRFS pool (cache)**ZFS pool (7.x+)**Traditional RAID 1/RAID 5/RAID 6/RAID 10|Parity / redundancy modelDedicated parity disk(s)Software RAID 1/RAID 10/RAID 5/RAID 6 via BTRFSRAID 1-Z1/Z2/Z3 or mirrorsStriped parity (RAID 5/RAID 6) or mirrors (RAID 10)|Data stripingNoYes (except RAID 1)YesYes|Disk size flexibilityMix any sizesBest when similar sizesBest when similar per vdevRequires matched sizes|Expand one disk at a timeYesYes (add or replace devices)Yes (per vdev\*)Typically no|File system per diskYesNoNoNo|Single-disk read speedNative disk speedAggregate (multi-disk)Aggregate (multi-disk)Aggregate|Write degradation during rebuildMinimal (only failed drive)Depends on levelDepends on vdev layoutSignificant|Bit rot detectionOptional (BTRFS/ZFSchecksum)✅ Built-in✅ End-to-end checksums❌ Not inherent|Snapshot / send-receive❌✅ (BTRFS)✅ Native❌|Recommended production useGeneral media storageRAID 1/RAID 10 (avoid RAID 5/RAID 6)\*\*✅ All levels stableEnterprise arrays
\* ZFS vdevs must be expanded by replacing **all** drives in the vdev or adding a new vdev.
\* BTRFS RAID 5/RAID 6 remains flagged as "experimental" upstream; use with caution.
* **Unraid parity array** is excellent for incremental expansion, allowing mismatched drive sizes with minimal rebuild stress.
* **ZFS pools** (available in 7.x) provide enterprise-class redundancy, snapshots, and checksums, making them ideal for VMs and databases.
* **BTRFS pools** excel for fast SSD caches, especially in mirrored RAID 1/RAID 10 mode.
* Traditional hardware RAID cards are *not* necessary; you can use simple HBAs to allow Unraid to manage drives directly.
### I currently have an array of devices formatted with an MBR-style partition table and want to convert to GPT. How do I do that?[​](#mbr-to-gpt-conversion)
Why convert from MBR to GPT?
MBR (Master Boot Record) partitioning supports disks up to 2TB and only allows a maximum of four primary partitions. On the other hand, GPT (GUID Partition Table) can handle much larger disks and nearly unlimited partitions. Converting to GPT is advisable if you work with larger drives or want better partition management.
Use **Maintenance Mode**
Before starting the conversion process, put your array into **Maintenance Mode**. This step ensures no writes occur during the conversion, protecting your data.
Conversion process
1. Ensure you have a valid parity and a current backup of your boot device.
2. Enter **Maintenance Mode** from the ***Main*** tab.
3. Replace and rebuild your parity drive first.
4. Swap out each data drive one at a time, rebuilding the array after each replacement.
5. The new drive will be formatted with the appropriate partitioning style based on its size:
* **2TB or smaller**: Uses MBR partitioning
* **Larger than 2TB**: Uses GPT partitioning
* Once all drives are replaced and rebuilt, exit **Maintenance Mode**.
This process keeps your data safe while changing the partitioning style.
Additional notes
* **Partitioning is automatic**: Unraid automatically chooses the partitioning style based on drive size:
* **2TB or smaller**: Always uses MBR partitioning
* **Larger than 2TB**: Always uses GPT partitioning
* Starting with Unraid OS 6.9, partition 1 starts at 32KiB for rotational devices and 1MiB for non-rotational devices, regardless of the partition style.
-- Always [back up your boot device](/unraid-os/system-administration/secure-your-server/secure-your-boot-drive/#backups) before starting this conversion process.
## Networking[​](#networking)
### Is there any way to disable the br0 bridge?[​](#disable-br0-bridge)
Yes. The **br0** bridge is a Linux network bridge allowing Docker containers and VMs to connect directly to your local area network (LAN) with their IP addresses. It acts as a virtual network switch that connects your physical network interface to the virtual interfaces used by containers and VMs.
note
Disabling br0 means that VMs and Docker containers will not have direct access to the LAN and may lose some advanced networking features.
### I can't seem to connect to the WebGUI using `http://tower` or `http://tower.local`. What do I do?[​](#webgui-connection)
If you're having trouble connecting to the WebGUI by hostname, the issue might be with your local DNS not resolving the server name. Instead, try connecting directly using the IP address.
**How to find your server's IP address:**
* Check your router or switch's DHCP client list for a device listed as "Tower" or something similar.
* If you assigned a static IP while creating boot media with the USB Flash Creator, use that address.
* Plug in a monitor and keyboard to your server; the IP address will appear on the local console after it boots.
**Common causes for this issue:**
* Your computer and server might be on different subnets or VLANs.
* Your router may not support local hostname resolution.
* The Unraid server might not be connected to the network or have a misconfigured network setting.
* Firewall or security software may be blocking access.
If you are unable to connect, try rebooting your server and network equipment, and ensure that all cables are securely connected.
## Installation[​](#installation)
### I can't get the USB Flash Creator to install Unraid on my boot media. What do I do?[​](#usb-creator-issue)
If the USB Flash Creator isn't working for your system or USB drive, you can use the [manual installation method](/unraid-os/getting-started/set-up-unraid/create-your-bootable-media/#manual-install-method) to prepare your Unraid boot device. This method is compatible with Windows, macOS, and Debian/Ubuntu Linux.
### I need to configure my system to boot using UEFI. How do I do this?[​](#uefi-boot-config)
You can set up UEFI boot mode in a few different ways:
#### Option 1: During boot media creation[​](#option-1-during-boot-media-creation)
When using the USB Flash Creator, select the option to enable UEFI boot mode before writing Unraid to the USB drive.
#### Option 2: After booting in Legacy Mode[​](#option-2-after-booting-in-legacy-mode)
In the WebGUI, open ***Settings → Boot device*** (on Unraid **7.3.0**+). On earlier releases, the same page is under ***Settings → Flash device***.
Enable UEFI boot mode and reboot your server.
#### Option 3: Manual folder rename[​](#option-3-manual-folder-rename)
On the boot volume (USB drive), rename the `EFI\~` folder to `EFI` (remove the tilde `\~`).
Insert the boot device into your server, then enter your motherboard BIOS/UEFI settings.
Set the Unraid boot device (USB, when applicable) as the primary boot target and enable UEFI boot mode (be sure to disable CSM/Legacy/Compatibility mode, if available).
### I'm having issues using my web browser with the WebGUI. What can I do?[​](#webgui-browser-issues)
If you're encountering display or functionality issues with the WebGUI, consider the following:
* **Ad-blockers and content blockers:** These browser extensions may interfere with the WebGUI. Try adding your Unraid server to your ad-blocker's whitelist or disabling the blocker for your server's address.
* **Browser extensions:** Some extensions could block scripts or alter page content. Disable extensions or try using a private/incognito window.
* **Outdated browsers:** Ensure you use a modern, up-to-date browser (like Chrome, Firefox, or Edge). Older browsers may not fully support the WebGUI.
* **Cache issues:** Clear your browser cache or try a hard refresh (Ctrl+F5 or Cmd+Shift+R).
* **Network issues:** Ensure that your computer and server are connected to the same network and subnet.
If problems persist, try accessing the WebGUI from another browser or device.
### How do I extend my Unraid trial?[​](#extend-trial)
If you need more time with your [30-day free trial](https://unraid.net/download) of Unraid, you can extend it. Once your original trial expires, stop the array and go to the **Registration** page. You should see a button that allows you to request a 15-day extension. You can do this twice for a total of 60 days before you need to purchase a license.
important
You must use the same boot device to continue your trial. Changing boot media will require starting a new trial from scratch.
* [Build & Hardware](#build--hardware)
* [I need help with a build or system configuration. Where do I go?](#build-help)
* [What controllers are recommended for Unraid?](#hardware-raid-support)
* [What's the best way to add more storage if my built-in controller is full?](#add-more-storage)
* [Does Unraid have an allocation feature that remembers bad sectors on drives to prevent writes to them?](#bad-sector-allocation)
* [OS & Configuration](#os--configuration)
* [Can I use a HASP key within a VM on Unraid? How does that work with multiple VMs?](#hasp-key-vm)
* [My boot device has failed, and I don't have a backup. How do I restore my configuration?](#usb-failed-restore)
* [What should I do if I have forgotten my root password?](#forgot-root-password)
* [How do I completely start Unraid OS from scratch? (Factory reset procedure)](#factory-reset)
* [How do I change the hostname of my server?](#change-hostname)
* [My boot device is reporting an invalid GUID. What do I do?](#invalid-guid)
* [Virtualization & Devices](#virtualization--devices)
* [Whenever I shut down my Windows VM with an AMD GPU assigned, it fails to restart. What can I do?](#amd-gpu-vm-restart)
* [How do I pass through my primary GPU to a VM if my CPU has no integrated graphics?](#primary-gpu-passthrough)
* [Storage & RAID](#storage--raid)
* [Does Unraid support various RAID types such as RAID1/5/6/10?](#raid-types-support)
* [I currently have an array of devices formatted with an MBR-style partition table and want to convert to GPT. How do I do that?](#mbr-to-gpt-conversion)
* [Networking](#networking)
* [Is there any way to disable the br0 bridge?](#disable-br0-bridge)
* [I can't seem to connect to the WebGUI using `http://tower` or `http://tower.local`. What do I do?](#webgui-connection)
* [Installation](#installation)
* [I can't get the USB Flash Creator to install Unraid on my boot media. What do I do?](#usb-creator-issue)
* [I need to configure my system to boot using UEFI. How do I do this?](#uefi-boot-config)
* [I'm having issues using my web browser with the WebGUI. What can I do?](#webgui-browser-issues)
* [How do I extend my Unraid trial?](#extend-trial)