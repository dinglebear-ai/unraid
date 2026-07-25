Unraid as a VM | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
Running Unraid as a virtual machine on your primary Unraid server can be very helpful for development, testing, and evaluation. This configuration allows you to:
* Develop and test plugins or Docker containers without putting your production server at risk.
* Evaluate new Unraid releases before upgrading your main system.
* Create isolated environments for troubleshooting or training.
Important considerations
* Lime Technology does not officially support this configuration for production data.
* Virtualization introduces some overhead; expect reduced performance compared to running directly on hardware.
* You need a separate, valid license key for the VM.
Prerequisites
* A valid Unraid license key for the VM
* A dedicated USB flash drive (use a different manufacturer than your host's boot drive)
* Unraid version 6.4.0 or higher for the VM (older versions require manual setup)
To get Unraid up and running as a VM:
**1. Prepare the flash drive for the VM** - Click to expand/collapse
Getting your flash drive ready is crucial for a seamless and dependable VM boot process. Here's how to set up your VM environment with a unique and properly configured boot device.
1. Use the [Unraid USB Creator](https://unraid.net/download) tool on your desktop to prepare the flash drive:
* Select **Allow EFI boot**.
* Set a unique server name (like `TowerVM` if your host is `Tower`).
* Write the image to the flash drive.
* Modify configuration files:
* Rename the flash drive label from `UNRAID` to a unique name (e.g., `UNRAID-VM`).
* Edit the `syslinux/syslinux.cfg` file on the flash drive:
```
`
label Unraid OS
menu default
kernel /bzimage
append unraidlabel=UNRAID-VM initrd=/bzroot
`
```
* Make this change in all boot modes (GUI/Safe Mode) within the file.
* Copy the updated `syslinux.cfg` file to `EFI/boot/syslinux.cfg`
* Create a file named `startup.nsh` in the root of the flash drive with this content:
```
`
\\EFI\\boot\\bootx64.efi
`
```
* Note the manufacturer of the flash drive (you'll need this for VM setup later).
**2. Set up the VM on the host** - Click to expand/collapse
Configuring the Unraid VM requires some specific settings to ensure proper operation.
To create the VM template:
1. On the host Unraid server, go to ***Settings → VM Manager*** and ensure that VM are enabled.
2. Navigate to the **VMs** tab and click **Add VM**.
3. Select the **Slackware** template, as it's the closest match to Unraid.
4. (Optional) If available, replace the Slackware icon with the Unraid icon.
5. Name the VM (e.g., `UNRAID-VM`).
6. (Optional) Add a description, such as *"Unraid test environment - vX.XX.X."*
7. Assign resources:
* CPUs: 2-4 cores
* RAM: 4-8 GB (set Initial and Max to the same value)
* Set **Machine type** to **Q35 (latest)**.
* Set **BIOS** to **OVMF** and **USB controller** to **3.0 (QEMU XHCI)**.
* Configure virtual disks:
* Add vDisks for cache/data using **RAW** format and **SATA** bus.
* Size disks differently for easy identification (e.g., parity \> data \> cache).
* Leave graphics, sound, and network at their default settings.
* Under **USB devices**, select the flash drive by **manufacturer**, not label.
important
The VM's flash drive must be from a different manufacturer than the host's boot drive. If they match, the VM drive won't be visible.
**3. Create and start the VM** - Click to expand/collapse
To launch the VM after configuration:
1. Uncheck **Start VM after creation** if you want manual control.
2. Click **Create**.
3. On the **VMs** tab, click the Unraid VM icon and select **Start with console (VNC)**.
4. Watch the boot process in the VNC console and note the VM's IP address displayed before login.
**4. Configure the VM** - Click to expand/collapse
Once the VM is running, set it up like a physical Unraid server:
1. Access the VM's **WebGUI** at `http://[VM-IP]`.
2. Go to ***Settings → Identification***:
* Set a unique **Server name** (e.g., `Unraid-VM`).
* Add a description like "Development instance."
* (Optional) Go to ***Settings → Display settings*** and choose a different color theme to distinguish it from the host.
* Go to ***Settings → SMB settings → Workgroup settings*** and set **Local master** to *No* to avoid conflicts.
* For UPS passthrough (if the host has UPS):
* Go to ***Settings → UPS*** on the VM.
* Set **UPS cable** to *Ether*.
* Set **UPS type** to *net*.
* Enter the host's IP in **Device**.
* Configure **Runtime** to shut down the VM before the host.
* Start the array with your configured devices.
* Install [**Community Applications**](https://unraid.net/community/apps) for plugin/Docker testing.
* Update the VM via ***Tools → Update OS***, just like a physical server.
### Troubleshooting[​](#troubleshooting)
If you encounter an *Execution Error* related to the USB flash device after editing VM settings:
1. Edit the VM and switch to **XML view**.
2. Locate the `\<hostdev\>` node that defines the flash device (usually near the end).
3. Delete the entire `\<hostdev\>...\</hostdev\>` block.
4. Click **Update**.
5. Re-edit the VM in **Form view**.
6. Re-select the flash drive under **USB devices**.
7. Click **Update** again. The VM should now start normally.
* [Troubleshooting](#troubleshooting)