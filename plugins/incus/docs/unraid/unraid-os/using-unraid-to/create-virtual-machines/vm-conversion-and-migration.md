VM conversion and migration | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
When consolidating hardware, preserving legacy systems, or testing upgrades in a virtual environment, you may need to convert a physical disk or migrate an existing system into a virtual machine on Unraid. This process applies to both Linux and Windows systems, enabling you to run your installation as a VM within your Unraid server.
Prerequisites
* Your Unraid server should meet the minimum [hardware requirements for virtualization](/unraid-os/using-unraid-to/create-virtual-machines/overview-and-system-prep/#requirements) (see table below).
* The source disk must be connected to your Unraid server (via SATA, USB, or as an unassigned device).
* Ensure you have enough free space in your **array** or **cache pool** to accommodate the new virtual disk image.
* Backup any critical data before starting the conversion or migration process.
## Hardware requirements[​](#hardware-requirements)
|ComponentMinimum requirementRecommended for best performance|**CPU**64-bit with hardware virtualization (Intel VT-X/AMD-V)Multi-core CPU with VT-d/AMD-Vi for passthrough|**RAM**8 GB16 GB or more|**Storage**SSD or NVMe cache pool with sufficient spaceDedicated NVMe cache pool for VM storage|**Motherboard/BIOS**UEFI with virtualization enabledUEFI with IOMMU/VT-d/AMD-Vi enabled
## Convert a physical disk to a VM[​](#convert-a-physical-disk-to-a-vm)
Migrating an existing Linux or Windows system into a virtual machine on your Unraid server can be a great way to save hardware space, keep legacy systems running, or test new upgrades safely.
To convert a physical disk to a VM:
* Linux
* Windows
#### Step 1: Prepare the physical disk
1. Connect the source disk to your Unraid server (using SATA or USB).
2. Log in to the WebGUI (`http://tower` or `http://tower.local`).
3. Click on the **Main** tab.
4. Start the **array** if it isn’t already running.
5. Find your disk under **Unassigned Devices**.
6. Take note of the device letter (e.g., `sdb`, `sdc`) and disk size. You’ll need at least this free space on your **array** or **cache pool** for the new virtual disk.
#### Step 2: Create a new virtual machine
Refer to the [Creating your own virtual machines](/unraid-os/using-unraid-to/create-virtual-machines/vm-setup/#creating-your-own-virtual-machines) guide, with the following exceptions:
* Set the **BIOS** to **OVMF**.
Make sure to specify the **VirtIO Drivers ISO** for [optimal performance](/unraid-os/using-unraid-to/create-virtual-machines/overview-and-system-prep/#set-up-virtualization-preferences).
* Store VM images on a **cache pool** instead of an array for the [best performance](/unraid-os/using-unraid-to/create-virtual-machines/overview-and-system-prep/#user-shares-for-virtualization).
#### Step 3: Convert the physical disk to a virtual disk image
Open a terminal ([SSH](/unraid-os/system-administration/advanced-tools/command-line-interface/) or local console) and log in as `root`.
Use the following command to convert the physical disk into a virtual disk image:
```
`
qemu-img convert -p -O raw /dev/sdX /mnt/user/[vdisk\_share]/[vmname]/vdisk1.img
`
```
* **/dev/sdX**: Replace with the device letter from step 1 (e.g., `/dev/sdb`)
* **[vdisk\_share]**: The share where you save your VM images
* **[vmname]**: The name you want for your VM
**Command breakdown:**
* `qemu-img convert`: This tool is used for disk image conversion.
* `-p`: Shows progress as a percentage.
* `-O raw`: Sets the output format to raw (Unraid's default).
* `/dev/sdX`: Source is your physical disk.
* `/mnt/user/[vdisk\_share]/[vmname]/vdisk1.img`: Destination for the virtual disk image.
Wait for the operation to complete. The resulting `.img` file will be the primary disk for your VM.
## Migrating a physical disk to a VM[​](#migrating-a-physical-disk-to-a-vm)
You can run a Windows installation directly from a physical disk in an Unraid virtual machine (VM). This method helps migrate an existing Windows system without converting it to a virtual disk image. For a visual walkthrough, check out Spaceinvader One’s tutorial:
[How to pass through hard drives, convert disks, and test performance in Unraid VMs (YouTube)](https://www.youtube.com/watch?v=QaB9HhpbDAI).
Choosing your migration approach
There are two common ways to migrate a Windows installation to a VM in Unraid:
**Physical disk passthrough:** This uses the original disk directly in the VM.
* Pros: Fastest method, no image conversion required.
* Cons: Takes up a SATA port; Unraid cannot use the disk for other purposes when it's attached to the VM.
**Disk image conversion:** This converts the physical disk to a virtual disk image (`.img`) for use in the VM.
* Pros: More flexibility, allows the disk to be used as an Unraid share or for [VM snapshots](/unraid-os/using-unraid-to/create-virtual-machines/vm-setup/#vm-snapshots).
* Cons: Requires time and free space for the conversion process.
Choose passthrough if you want a simple migration or plan to dual-boot the disk. Opt for image conversion for better portability and backup options.
Prerequisites
* Back up your Windows installation before starting.
* Have a spare USB flash drive ready for recovery tools.
* Select a hardware preparation tool that enables Windows to boot on virtualized hardware by modifying drivers and the hardware abstraction layer (HAL):
* **Microsoft Sysprep** (free and built into Windows 8.1 and later)
* **Acronis True Image 2025** (commercial solution with advanced migration capabilities)
* Ensure your Unraid server has a free SATA or NVMe port for the physical disk.
#### Step 1: Prepare the Windows disk for migration
Moving a Windows installation to new hardware, whether physical or virtual, can result in boot failures due to hardware differences. Follow one of the methods below to prepare your Windows system:
##### Option A: Microsoft sysprep (recommended - free)
Sysprep is built into Windows and eliminates unique system information, preparing Windows for different hardware.
Before running sysprep
* Temporarily disable any antivirus software.
* Clean up unnecessary user profiles and temporary files.
* Fix or remove any problematic Microsoft Store apps that may block sysprep from running.
1. **Run sysprep:**
* Open Command Prompt as an administrator.
* Navigate to the sysprep directory:
```
`
cd C:\\Windows\\System32\\Sysprep
`
```
* Execute sysprep with generalization:
```
`
sysprep.exe /generalize /shutdown /oobe
`
```
* The system will generalize the installation and then shut down.
* **Install the disk in your Unraid server** after the shutdown.
##### Option B: Acronis True Image 2025 (commercial)
Acronis True Image 2025 features Universal Restore, which assists with hardware migration.
1. Download and install [Acronis True Image 2025](https://www.acronis.com/en-us/products/true-image/).
2. Create bootable recovery media using the included tools:
* Choose the Windows-like interface.
* Select the architecture that matches your Windows (32-bit or 64-bit).
* Boot your Windows system from the Acronis recovery media.
* Follow the on-screen instructions to apply Universal Restore to your Windows disk. This will update drivers and the HAL for better compatibility with virtualized hardware.
* Shut down the system and install the disk in your Unraid server.
#### Step 2: Identify the physical disk in Unraid
1. Log in to the WebGUI (`http://tower` or `http://tower.local`).
2. Go to the **Main** tab.
3. Start the array if it’s not already running.
4. Locate your disk under **Unassigned Devices**.
5. Note the device letter (for example, `sdb`, `sdc`) for use in the VM configuration.
#### Step 3: Create a new virtual machine
1. Go to the **VMs** tab in the WebGUI. If the tab is missing, ensure that virtualization is enabled and that hardware requirements are met.
2. Click **Add VM**.
3. Follow the [Creating your own virtual machines](/unraid-os/using-unraid-to/create-virtual-machines/vm-setup/#creating-your-own-virtual-machines) guide, using these settings:
* Set **BIOS** to SeaBIOS (try OVMF if SeaBIOS fails to boot).
* Leave **OS Install ISO** blank.
* Specify the **VirtIO Drivers ISO** for optimal performance after boot.
* For the primary virtual disk, select any location and size (this will be replaced in the next step).
* Uncheck **Start VM after creation**.
#### Step 4: Edit the XML for your virtual machine
You'll need to modify the VM's XML configuration to connect your physical disk to the virtual machine.
1. From the **VMs** tab, click the VM icon, then select **Edit XML** from the context menu.
2. Scroll down in the XML and find the existing `\<disk\>` entry for your primary virtual disk. This usually points to a `.img` file and will look something like this:
```
`
\<disk type='file' device='disk'\>
\<driver name='qemu' type='raw' cache='writeback'/\>
\<source file='/mnt/user/[vdisk\_share]/[vmname]/vdisk1.img'/\>
\<backingStore/\>
\<target dev='hda' bus='virtio'/\>
\<boot order='1'/\>
\<alias name='virtio-disk0'/\>
\<address type='pci' domain='0x0000' bus='0x00' slot='0x05' function='0x0'/\>
\</disk\>
`
```
Replace this block with the following, where `sdX` is the device letter or, better yet, use `/dev/disk/by-id/[your-disk-id]` for a more reliable device assignment (refer to the [Unraid Docs: Using a physical disk in a VM]):
```
`
\<disk type='block' device='disk'\>
\<driver name='qemu' type='raw' cache='writeback'/\>
\<source dev='/dev/disk/by-id/[your-disk-id]'/\>
\<target dev='hdd' bus='sata'/\>
\</disk\>
`
```
If your disk is IDE, change the bus from "SATA" to "IDE" and the target device from "hdd" to "hda".
Using `/dev/disk/by-id/` is preferred over `/dev/sdX` to ensure the disk assignment stays consistent after reboots or hardware changes.
3. Click **Update** to save your XML changes.
#### Step 5: Install drivers
1. Start your VM.
2. Once in Windows, open Device Manager by right-clicking the Start menu and selecting **Device Manager**.
3. Look for devices marked with a yellow exclamation mark (indicating missing drivers). Right-click on each and select **Update driver**.
4. Choose **Browse my computer for drivers**.
5. Direct it to the drive where the VirtIO Drivers ISO is mounted (usually D: or E:).
6. Make sure **Include subfolders** is checked, then click **Next**.
7. Repeat this process for each device with missing drivers, commonly including: SCSI Controller, Ethernet, Balloon, and Serial devices.
Remember to reinstall those applications after migration if you use software that installs its own drivers (such as antivirus programs).
tip
If you are stuck at SeaBIOS with a "Booting from Hard Disk" message, it’s likely because your Windows OS was installed using UEFI instead of the traditional BIOS. In this case, recreate the VM using OVMF as the BIOS type rather than SeaBIOS. Most modern Windows installations (Windows 8.1, 10, and 11) support UEFI and may need OVMF to boot successfully. The rest of the conversion process will remain the same.
## Xen to KVM migration[​](#xen-to-kvm-migration)
Historical Context
Unraid supported Xen from early 6.x versions until it was deprecated in 6.2 (September 2016) and later removed entirely. This migration guide is relevant for users upgrading from very old Unraid installations (pre-2017) to modern versions.
A Xen hypervisor is a virtualization platform that allows multiple operating systems to run on the same hardware. In Unraid, Xen was historically used for virtual machines, but KVM is now the standard. Migrating from Xen to KVM is essential for utilizing modern Unraid features, enabling hardware passthrough, and ensuring compatibility with current releases.
The process of migrating a VM from Xen to KVM varies depending on whether your VM is set up as a paravirtualized (PV) or hardware-virtualized (HVM) guest. This guide focuses specifically on converting Windows VMs that utilize Xen’s GPLPV drivers, as they require special handling.
Always create a backup of your Xen virtual disk before starting this process. And test your migration on the backup to prevent data loss.
Why migrate?
Unraid no longer supports Xen from version 6.2 onward. KVM is now mandatory for VM management, hardware passthrough, and ongoing updates. Migrating ensures your VMs remain secure and compatible with new features.
### Windows conversion procedure[​](#windows-conversion-procedure)
To convert a Windows VM from Xen to KVM, follow these steps. Remember to **remove any PCI device passthrough from your Xen domain configuration** before you begin. These devices can be added back after the migration is complete.
**Step 1: Determine if your VM uses Xen's GPLPV drivers** - Click to expand/collapse
1. Inside your Xen VM, open **Windows Device Manager** (press *Windows key + X*, then select **Device Manager**).
2. Expand **Network adapters** and check the device name.
* If the name contains "Xen," you are using GPLPV drivers.
* If it doesn't, skip to the step about rebooting into KVM mode.
tip
If you are not using GPLPV drivers, you can skip the next several steps and continue from the rebooting into KVM mode section.
**Step 2: Prepare Windows for GPLPV driver removal** - Click to expand/collapse
1. Open a command prompt as Administrator (**Start menu** → type `cmd` → right-click **Command Prompt** → select **Run as administrator**).
2. Enter the following command:
```
`
bcdedit -set loadoptions nogplpv
`
```
3. Reboot your VM.
**Step 3: Uninstall GPLPV drivers** - Click to expand/collapse
After the reboot, purge all Xen GPLPV drivers from your system using the comprehensive manual removal process documented in the [Xen Project Wiki](https://wiki.xenproject.org/wiki/Xen_Windows_GPLPV).
caution
GPLPV removal requires extensive registry editing and manual file deletion. Follow the Xen Project Wiki instructions **exactly** as written, as errors can cause system instability or boot failures.
**Step 4: Create a new KVM virtual machine** - Click to expand/collapse
1. Ensure the **VM manager** is enabled:
* Go to ***Settings → VM manager***.
* Set **Enable VMs** to **Yes**.
* Download the latest **VirtIO drivers ISO** for Windows by selecting it from the dropdown menu and clicking **Download**.
* Navigate to the **VMs** tab and click **Add VM**.
* Select the Windows version that matches your original Xen virtual machine.
* Configure the basic settings:
* **Name**: Assign a descriptive name to your VM.
* **VirtIO drivers ISO**: Choose the version you just downloaded.
* Under **Primary vDisk Location**:
* Browse and select your existing Xen virtual disk.
* Add a **temporary secondary vDisk**:
* Click the green plus sign.
* Set the size to **1M** (this will enforce IDE bus compatibility during the initial boot).
* Choose any temporary directory for the location (this will be removed later).
* Leave the other settings for graphics and sound at their default values, then click **Create**.
* If the VM started automatically, stop it:
* Prefer **Stop** (avoid **Force stop** unless the VM is unresponsive).
* Alternatively, uncheck **Start VM after creation** when creating the VM.
* Edit the VM configuration:
* Click the VM icon and select **Edit**.
* Switch to **XML view** using the toggle in the top-right corner.
* Modify the primary disk XML:
* Locate the `\<disk\>` section for your primary virtual disk.
* Remove the entire `\<address\>` line.
* Change `bus='virtio'` to `bus='ide'` in the `\<target\>` tag.
* Click **Update**.
Why the temporary disk?
The 1MB temporary disk forces Unraid to assign the primary disk as `hda` (IDE) instead of `vda` (VirtIO), allowing Windows to boot without VirtIO drivers initially. This temporary disk will be removed after the driver installation.
**Step 5: Install VirtIO drivers** - Click to expand/collapse
1. Start the VM from the **VMs** tab.
2. Connect via VNC by clicking the VM icon and select **Start with console (VNC)**.
3. During boot:
* Windows will detect new hardware but might fail to install drivers.
* Choose **Reboot later** when prompted.
* Open **Device Manager** (press Win+X and choose Device Manager):
* Install drivers for each device listed under **Other devices** (like Ethernet Controller, PCI Device, etc.):
1. Right-click the device and select **Update driver**.
2. Choose **Browse my computer for drivers**.
3. Point to the VirtIO ISO drive (for example, `D:\\`).
4. Check **Include subfolders**.
5. If prompted, accept **Always trust Red Hat**.
6. Install the QEMU guest agent:
* Open File Explorer and navigate to `D:\\guest-agent\\`.
* Double-click `qemu-ga-x64.msi`.
* Shut down the VM.
**Step 6: Finalize the VM configuration** - Click to expand/collapse
1. Edit the VM:
* Remove the temporary secondary vDisk by clicking the red minus icon.
* Confirm that the primary vDisk points to your original Xen disk.
* Update the VM:
* Click **Update** to save your changes.
* Start the VM normally.
* Verify in **Device Manager** that:
* No warning icons appear.
* All devices utilize VirtIO drivers (for example, "Red Hat VirtIO Ethernet Adapter").
* (Optional) Enable VirtIO for better performance:
* Edit the VM and switch to XML view.
* Change the primary disk's `bus` from `ide` to `virtio`.
* Click **Update** and reboot the VM.
Driver troubleshooting
If you notice errors on devices after migration:
1. Reinstall the VirtIO drivers from the ISO.
2. Check for Windows updates, which may provide newer drivers.
3. Visit the [Red Hat VirtIO Drivers](https://docs.fedoraproject.org/en-US/quick-docs/creating-windows-virtual-machines-using-virtio-drivers/) page for the latest versions.
* [Hardware requirements](#hardware-requirements)
* [Convert a physical disk to a VM](#convert-a-physical-disk-to-a-vm)
* [Migrating a physical disk to a VM](#migrating-a-physical-disk-to-a-vm)
* [Xen to KVM migration](#xen-to-kvm-migration)
* [Windows conversion procedure](#windows-conversion-procedure)