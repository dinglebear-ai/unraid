Windows on a VM | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
Windows is one of the most popular guest operating systems for Unraid users, especially for gaming, productivity, and support for legacy applications. Here are essential considerations for running Windows VM.
Before you begin
* Microsoft ended support for Windows 7 in Jan. 2020, Windows 8.1 in January 2023, and Windows 10 in October 2025. Use Windows 11 (or later) or Server 2022 (or later) for ongoing security updates.
* Always test VM stability before activating your Windows license.
* For GPU passthrough, use OVMF (UEFI) BIOS with Windows 11 or newer.
### Supported configurations[​](#supported-configurations)
|Windows editionRecommended BIOSMachine typeNotes|Windows 11OVMF TPMQ35Requires TPM 2.0 emulation|Windows Server 2022OVMFQ35Ideal for enterprise workloads|Windows 10OVMFQ35Deprecated (EOL Oct 2025)|Windows Server 2019OVMFi440fx/Q35Compatible but not recommended
### VirtIO driver management[​](#virtio-driver-management)
Windows requires paravirtualized drivers for optimal performance with Unraid’s virtualization stack.
To install or update drivers:
* Automatic installation
* Manual update
1. In ***Settings → VM Manager***, set a default VirtIO ISO path (e.g., `/mnt/user/isos/virtio-win.iso`).
2. When creating a Windows VM, the ISO will auto-attach as a virtual CD-ROM.
3. During Windows setup, load drivers from the VirtIO ISO when prompted for storage controllers.
tip
Using Unraid 7 or later, you can automatically inject VirtIO drivers during the Windows installation. Enable this in ***VM Settings → Advanced Options***.
### Setting up hibernation[​](#setting-up-hibernation)
Hibernation lets you save your entire Windows VM state - including open applications and documents - to disk. This allows you to power off the VM without losing any work. When you resume, Windows restores everything exactly as you left it, skipping the normal boot process. This feature is handy when you need to reboot or power down your Unraid host or want to save energy while keeping your VM's state intact.
Benefits of hibernation
* Save energy by powering down idle VM without losing progress
* Quickly resume work after host maintenance or updates
* Reduce wear on SSDs compared to frequent complete shutdowns and reboots
To use hibernation reliably, you must install the QEMU Guest Agent in your Windows VM. This agent allows Unraid to communicate with the VM for advanced operations like hibernation, shutdown, and live statistics reporting.
**How to install the QEMU Guest Agent** - Click to expand/collapse
1. Start your Windows VM with the VirtIO drivers ISO mounted.
2. Open **File Explorer** and navigate to the VirtIO drivers media.
3. Open the `guest-agent` folder.
4. Run `qemu-ga-x64.msi` to install the agent. (You may briefly see a command box; no confirmation dialog will appear.)
**How to enable hibernation in Windows** - Click to expand/collapse
1. Open **Control Panel** and search for **Power Options**.
2. Click on **Choose what the power buttons do**.
3. Click **Change settings that are currently unavailable** to unlock shutdown settings.
4. Check the **Hibernate** option.
5. Click **Save changes**.
The **Hibernate** option will now appear in the Windows Power menu.
What if hibernation fails?
If your VM fails to hibernate or resume properly, you may lose unsaved work or face a failed restore. Always save important data before hibernating. If issues persist, ensure the QEMU Guest Agent is installed and updated, and check the Windows event log for errors.
### Performance tuning[​](#performance-tuning)
Optimizing your Windows VM can improve responsiveness, reduce disk usage, and avoid common issues with device passthrough or shutdown. These adjustments are optional and can be applied as needed.
#### Disable fast startup[​](#disable-fast-startup)
Disabling fast startup can help prevent issues with device passthrough. It ensures your VM hardware initializes correctly every time it boots. While this setting is designed for physical PCs, in a virtual environment, it can often cause more problems than benefits.
**How to disable Fast Startup** - Click to expand/collapse
1. Open **Control Panel** and search for **Power**.
2. Click on **Choose what the power buttons do**.
3. Click **Change settings that are currently unavailable**.
4. Uncheck **Turn on fast startup** under **Shutdown settings**.
5. Click **Save changes**.
#### Disable hiberfil.sys[​](#disable-hiberfilsys)
Hibernation in Windows creates a large hidden file called `hiberfil.sys`. This file can consume significant disk space and increase disk activity in your VM. If you don't rely on hibernation, disabling it will free up storage and reduce unnecessary I/O activity.
**How to disable hibernation and remove hiberfil.sys** - Click to expand/collapse
1. Right-click the **Start** button and select **Windows Terminal (Admin)** or **Command Prompt (Admin)**.
2. Type: `powercfg /h off`
3. Press Enter and reboot your VM. The `hiberfil.sys` file will be removed from your C:\\ drive.
#### Disable Windows indexing[​](#disable-windows-indexing)
Windows Search indexing continuously scans your virtual machine's storage to catalog files for faster search results. However, on a virtual machine, this can cause unnecessary disk I/O, slow down performance, and increase wear on your physical storage, especially SSDs in your [cache pool](/unraid-os/using-unraid-to/manage-storage/cache-pools/).
**How to disable Windows indexing** - Click to expand/collapse
1. Press **Windows + R** to open the Run dialog, type `services.msc`, and press Enter.
2. In the Services window, scroll down and right-click **Windows Search**, then select **Stop**.
3. Double-click **Windows Search**, change **Startup type** to **Disabled**, and click **OK**.
#### Disable automatic disk defragmenting[​](#disable-automatic-disk-defragmenting)
Windows is designed to defrag physical hard drives on a regular schedule automatically. On a VM - especially when using SSD storage or thin-provisioned vDisks - automatic defragmenting is unnecessary and can also reduce disk lifespan and degrade performance.
**How to disable automatic disk defragmenting** - Click to expand/collapse
1. Open **File Explorer**, right-click the C: drive, and select **Properties**.
2. Go to the **Tools** tab and click **Optimize**.
3. Click **Change settings**.
4. Uncheck **Run on a schedule** and click **OK**.
#### Enable high-performance power mode[​](#enable-high-performance-power-mode)
Power management features in Windows are designed for laptops and desktops to save energy. In a VM environment, these features can unnecessarily throttle performance or suspend your VM, making it less responsive and harder to manage.
Enabling **High Performance** mode ensures your VM always runs at full speed and is less likely to pause or suspend unexpectedly.
**How to enable high performance power mode** - Click to expand/collapse
1. Open **Control Panel** and search for "power."
2. Click **Choose a power plan**.
3. Select **High performance** under **Preferred plans**.
#### Enable remote desktop access[​](#enable-remote-desktop-access)
Remote desktop protocol (RDP) allows you to access your Windows VM from another device. It offers better performance and compatibility compared to VNC. Note that RDP is supported only on Windows Professional and Enterprise editions. Also, your Windows user account **must** have a password set.
caution
RDP is not available on Windows Home editions. Always set a secure password for your Windows user account before enabling RDP.
**How to enable remote desktop (RDP) access** - Click to expand/collapse
To enable RDP access, follow these steps:
1. Press **Windows + I** to open Settings, then navigate to ***System → About*** and click **Advanced system settings**.
2. In the System Properties window, click the **Remote** tab, then select **Enable Remote Desktop**.
3. Click **OK** to confirm the changes.
4. From your client device, use a Microsoft RDP client to connect to the **IP address of the VM** (not the Unraid server).
tip
Official Microsoft RDP clients are available for Windows, Mac, Android, and iOS. Make sure your VM is on a network bridge that allows LAN access.
#### Fix HDMI audio with MSI interrupts[​](#fix-hdmi-audio-with-msi-interrupts)
If you're having trouble with HDMI audio in a Windows VM that uses GPU passthrough (which often occurs with NVIDIA graphics cards), enabling Message Signaled Interrupts (MSI) might help. MSI enhances the way interrupts are managed for passed-through devices.
**How to enable MSI interrupts** - Click to expand/collapse
caution
Back up your VM before making any registry changes. Incorrect modifications can cause system instability.
1. **Verify MSI capability:**
* Start your VM with GPU passthrough enabled.
* Access Unraid via [WebTerminal or SSH](/unraid-os/system-administration/advanced-tools/command-line-interface/).
* Run the command `lspci -v -s 01:00.0` (replace `01:00.0` with your GPU's PCI address).
* Look for the line: `Capabilities: [68] MSI: Enable+ Count=1/1 Maskable- 64bit+`.
* **Enable MSI in Windows:**
* If MSI shows `Enable-`, follow [Microsoft's guide](https://learn.microsoft.com/en-us/windows-hardware/drivers/kernel/enabling-message-signaled-interrupts-in-the-registry) or use the [MSI Mode Utility](https://forums.guru3d.com/threads/windows-line-based-vs-message-signaled-based-interrupts-msi-tool.378044/) to modify your Windows registry settings.
* Reboot the VM after making the changes.
For more technical details, see [VFIO interrupts explained](https://vfio.blogspot.com/2014/09/vfio-interrupts-and-how-to-coax-windows.html).
### Upgrading to Windows 11[​](#upgrading-to-windows-11)
Windows 11 requires TPM 2.0 and Secure Boot. Unraid's **OVMF-TPM** BIOS provides the virtual TPM support needed for these requirements.
Before upgrading
* Create a complete backup of your VM.
* Ensure that Unraid is running version 6.10 or later.
* Verify that your Windows 10 VM meets the [Windows 11 system requirements](https://www.microsoft.com/en-us/windows/windows-11-specifications).
To add TPM support:
1. Shut down your Windows 10 VM.
2. Edit the VM settings.
3. Change **BIOS** from *OVMF* to *OVMF-TPM*.
4. Save the changes and start the VM.
#### Upgrade methods[​](#upgrade-methods)
* In-place upgrade
* Clean install
1. Download the [Windows 11 Installation Assistant](https://www.microsoft.com/en-us/software-download/windows11).
2. Run the installer and follow the on-screen instructions.
3. Reboot when prompted.
## Expanding Windows VM vDisk partitions[​](#expanding-windows-vm-vdisk-partitions)
Data loss risk
Expanding or modifying vDisk and partition layouts can lead to irreversible data loss if not done carefully. Always create a full backup or [snapshot](/unraid-os/using-unraid-to/create-virtual-machines/vm-setup/#vm-snapshots) of your VM before proceeding.
After you expand your vDisk following the steps in [Expand a vDisk](/unraid-os/using-unraid-to/create-virtual-machines/vm-setup/#expand-a-vdisk), you may encounter an issue where Windows’ default recovery partition blocks you from easily expanding your system (C:) partition to utilize the new space. To resolve this issue, you need to delete the recovery partition and then use Windows Disk Management to expand the partition.
After you complete the initial vDisk expansion:
1. Start your Windows VM.
2. **Open command prompt:** Press the Windows key, type `cmd`, and hit Enter.
3. **Launch diskpart:** Type `diskpart` and press Enter.
4. **List disks:** Type `list disk` and press Enter.
5. **Select the expanded disk:** Type `select disk #`, replacing `#` with the correct disk number.
6. **List partitions:** Type `list partition` and press Enter.
7. **Identify the recovery partition:** Look for the recovery partition that comes after your primary partition.
8. **Select and delete the recovery partition:**
* Type `select partition #`, replacing `#` with the number of the recovery partition.
* Type `delete partition override` and press Enter.
* Expand the C: partition:
* Right-click the Start menu and select **Disk Management**.
* Right-click the partition you want to extend (usually C:) and choose **Extend Volume...**.
* Follow the prompts to use the unallocated space.
tip
You only need to remove the recovery partition if it blocks access to adjacent free space. If the unallocated space is already next to your C: partition, you can extend it without deleting anything.
warning
Changes made to disk partitions are permanent and cannot be undone. Ensure that your data is securely backed up before deleting any partitions.
* [Supported configurations](#supported-configurations)
* [VirtIO driver management](#virtio-driver-management)
* [Setting up hibernation](#setting-up-hibernation)
* [Performance tuning](#performance-tuning)
* [Upgrading to Windows 11](#upgrading-to-windows-11)
* [Expanding Windows VM vDisk partitions](#expanding-windows-vm-vdisk-partitions)