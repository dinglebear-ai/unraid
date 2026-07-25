Boot & startup failures | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
When your Unraid server fails to start correctly, it can be challenging to identify the cause without a clear understanding of the boot process. Following this guide lets you quickly diagnose and resolve most startup problems, ensuring that your array, WebGUI, and services are operational with minimal downtime.
## Preparing boot media[​](#preparing-boot-media)
This topic is covered in detail under the [Prepare your USB device](/unraid-os/getting-started/set-up-unraid/create-your-bootable-media/#prepare-your-usb-device) section.
caution
Always [back up your boot device](/unraid-os/system-administration/maintain-and-update/changing-the-flash-device/#backing-up-your-flash-device) before making changes. All user-specific settings, including your license key, are stored in the `config` folder. Restoring this folder after re-prepping your boot device will help preserve your current configuration.
## Enabling UEFI boot[​](#enabling-uefi-boot)
Modern systems typically require **UEFI boot mode** for enhanced security and faster startup times.
To configure UEFI boot in your system BIOS/UEFI settings:
1. Enter your motherboard's BIOS/UEFI setup during startup (usually by pressing F2, DEL, or ESC)
2. Locate the boot options or boot mode settings
3. Set the boot mode to **UEFI** or **UEFI with CSM disabled**
4. Ensure the Unraid boot device is selected as the UEFI boot target
5. Save your changes and exit
## Understanding the boot sequence[​](#understanding-the-boot-sequence)
The Unraid boot sequence has a number of stages:
**1. BIOS boot** - Click to expand/collapse
The BIOS/UEFI firmware initializes hardware and locates the bootable device. This is the foundation of the entire boot process.
* The motherboard BIOS recognizes the Unraid bootable device (typically a USB flash drive).
* Setting the boot device as the default startup target varies based on your BIOS; check your motherboard manual for guidance.
* The boot volume supports both **legacy (CSM)** and **UEFI** boot modes.
* For UEFI boot, ensure the `EFI` folder on the boot volume does not have a trailing hyphen (`-`).
**2. Syslinux loader** - Click to expand/collapse
The bootloader presents startup options and loads the Linux kernel into memory. This stage determines which operating system or diagnostic tool will run.
* Boot menu entries are defined in the `syslinux/syslinux.cfg` file on the boot volume.
* You can edit this file through the WebGUI under ***Main → Syslinux configuration***.
* **Memtest86+**, which ships with current builds of Unraid, works in both legacy and UEFI modes. For older Unraid versions, obtain a compatible version from [the official Memtest site](https://www.memtest86.com/) for UEFI.
* If no option is selected, the default boots after a timeout, which is useful for headless operation.
**3. Linux core** - Click to expand/collapse
The Linux kernel initializes and begins hardware detection. This is where the operating system takes control from the bootloader.
* **Syslinux** loads the Linux core from the boot volume into RAM.
* You’ll see console messages showing bz\* files loading.
* Errors at this stage often indicate issues with the boot device.
* Linux detects hardware during startup.
**4. Boot-volume dependent services** - Click to expand/collapse
The boot volume becomes accessible and essential services begin loading. This stage is critical for configuration and network access.
* The boot volume mounts at `/boot`.
* If it fails to mount, you may still see a login prompt, but this indicates an incomplete boot.
* Use the `df` command to check if `/boot` is mounted.
* The boot volume must be labeled **UNRAID** (all caps) for proper mounting.
* Additional drivers and firmware will become available at this stage.
* Configuration is loaded into RAM.
* Standard Linux services, including networking and WireGuard VPN (if enabled), start here.
**5. Plugins** - Click to expand/collapse
Third-party extensions and customizations are loaded to enhance system functionality. Plugin issues can prevent successful startup.
* Installed plugins are loaded during this step.
* **Safe boot** options can suppress plugin loading if needed.
**6. WebGUI** - Click to expand/collapse
The web-based management interface becomes available, allowing remote administration and configuration of your server.
* The WebGUI starts at this point.
* The `config/go` file on the boot volume can run user commands before or after the WebGUI starts.
**7. Array** - Click to expand/collapse
Storage devices are mounted and made available, completing the boot process. This is where your data becomes accessible.
* If auto-start is enabled, the array starts here; otherwise, a manual start will be required.
* Drives will be mounted as `/dev/diskX` and `/mnt/cache` (if present).
* Shares become available on the network as `/mnt/user/sharename`.
* Docker containers will start in the order specified on the Docker tab, with customizable delays.
* Auto-start virtual machines (VMs) will also launch.
At this point, the Unraid server is fully operational.
## Boot failure[​](#boot-failure)
When your server won't start, systematic troubleshooting helps identify and resolve the root cause quickly. Follow these steps in order to avoid missing critical issues or making unnecessary changes. Each step builds on the previous one, so don't skip ahead even if a step seems unrelated to your specific problem.
1. Use a USB 2.0 port for the boot device if possible (when booting from USB). It's generally more reliable and less prone to issues than USB 3.0.
2. Check your BIOS/UEFI settings to ensure that the Unraid boot device is set as the primary boot target.
3. Inspect the boot device for any physical or logical errors on a Windows or macOS computer.
4. Re-extract the Unraid release bz\* files onto the boot volume to prevent any potential corruption.
5. Rebuild boot media by starting with a clean Unraid copy, then restore your `config` folder.
6. Try booting in [Safe Mode](/unraid-os/using-unraid-to/customize-your-experience/plugins/#troubleshooting-with-safe-mode) to check for any plugin-related problems.
7. Test with new boot media and perform a clean Unraid installation. This helps determine if there are issues with the server hardware.
8. If necessary, transfer your license to a new boot device.
## Recovering from a lost boot drive and unknown parity drives[​](#recovering-from-a-lost-boot-drive-and-unknown-parity-drives)
important
This recovery process involves risk of data loss if drives are incorrectly assigned. Before proceeding:
1. **Do not start the array** until you're confident about drive assignments
2. **Document** which drives were previously parity vs. data drives
3. **Consider seeking help** on the [Unraid forums](https://forums.unraid.net/) if you're unsure
If you have any recent backups or documentation of your array configuration, review those first.
If your Unraid boot drive fails and you don’t have a recent backup or knowledge of which drives are parity, you can recover your system by using Unraid’s ability to recognize data drives by their file systems. Parity drives do not have a valid file system, which helps differentiate them.
Unraid identifies data drives by detecting existing valid file systems. Parity drives, which lack a file system, appear unmountable. This characteristic allows you to distinguish parity drives from data drives after booting with new boot media.
### Recovery procedure[​](#recovery-procedure)
This procedure helps you restore your array configuration when you've lost your boot drive and can't remember which drives were parity vs. data. Follow each step carefully to avoid data loss.
1. Create new Unraid boot media.
2. Boot the server from this new device (do not assign any drives yet).
3. Activate a license, using either a trial or transferring an existing one.
4. Identify parity drives using one of the methods outlined below.
5. Use ***Tools → New Config*** to reset the array while retaining previous assignments if possible.
6. Correct drive assignments on the ***Main*** tab, making sure to distinguish between parity and data drives.
7. Start the array to commit the drive assignments.
8. If the parity is valid, check the box for ***Parity is Already Valid***. If not, allow the parity to rebuild.
Multiple parity drives
If you have multiple parity drives and had to identify them based on which drives were unmountable, **do not** use the **Parity is Already Valid** option. There's a 50:50 chance of getting the assignments wrong, and if you do, your array may appear protected but actually isn't. Always allow parity to rebuild in this scenario to ensure proper protection.
1. Review and adjust any user share includes/excludes based on the new assignments.
2. Run a parity check to verify integrity, especially if parity wasn’t rebuilt.
### Identifying the parity drives[​](#identifying-the-parity-drives)
**Using Unraid’s built-in capability (preferred method)** - Click to expand/collapse
This method does not require plugins, but it will invalidate parity, necessitating a rebuild.
To use this method:
1. Assign all drives as data drives and start it.
2. Parity drives will show as unmountable since they lack a valid file system.
3. Confirm that the number of unmountable drives matches your parity count.
4. Take note of the serial numbers of these drives.
5. If relevant, you can check mounted data drives to confirm their order.
**Using the Unassigned Devices plugin** - Click to expand/collapse
This plugin-based method preserves the validity of parity by mounting drives in read-only mode.
To use this method:
1. Install the [**Unassigned Devices** plugin](<https://unraid.net/community/apps?q=unassigned+devices#r:~:text=don't be carefull!!!-,Unassigned Devices,-dlandon>) from the ***Apps*** tab.
2. Mount each disk read-only, one at a time.
3. Drives that fail to mount are likely parity drives (you cannot differentiate between parity1 and parity2).
4. Inspect mounted data drives to identify their order, if necessary.
For more information, see the [Unassigned Devices plugin thread](https://forums.unraid.net/topic/55481-unassigned-devices-managing-unassigned-devices-without-rebooting/) in the Unraid forums.
\* *"WireGuard" and the "WireGuard" logo are registered trademarks of Jason A. Donenfeld.*
* [Preparing boot media](#preparing-boot-media)
* [Enabling UEFI boot](#enabling-uefi-boot)
* [Understanding the boot sequence](#understanding-the-boot-sequence)
* [Boot failure](#boot-failure)
* [Recovering from a lost boot drive and unknown parity drives](#recovering-from-a-lost-boot-drive-and-unknown-parity-drives)
* [Recovery procedure](#recovery-procedure)
* [Identifying the parity drives](#identifying-the-parity-drives)