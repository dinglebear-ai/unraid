Updating Unraid | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
Updating Unraid OS ensures that you have the latest features, security updates, and hardware support. This page outlines the standard update process, along with troubleshooting tips and manual update options.
For help deciding between Stable, Beta, and Release Candidate (RC) builds, see [Unraid OS release types](/unraid-os/updating-unraid/release-types/).
Prerequisites
Before you start updating, make sure to create a complete backup of your boot device. For more details, refer to [Backing up your boot device](/unraid-os/system-administration/maintain-and-update/changing-the-flash-device/#backing-up-your-flash-device).
Best practices before updating
1. **Make a backup** of your boot device and any important data.
2. **Read the Release Notes** for the version you plan to install.
3. **Update all plugins** to their latest versions.
4. **Optionally, stop the array** before proceeding.
5. **Update Unraid OS** using the ***Tools → Update OS*** page.
6. **Reboot** your server to complete the upgrade.
## Standard update process[​](#standard-update-process)
* Unraid 7.x and later
* Unraid 6.11 to 6.12
Updating Unraid is done using the new **Update OS tool** with a user-friendly interface:
1. In the WebGUI, click the top-right dropdown menu and select **Check for Update** or navigate to ***Tools → Update OS***.
2. Review the update shown for your server's current release branch.
3. Click **View Changelog to Start Update**. The Changelog will appear for you to review before hitting **Continue**.
4. Click **Confirm and start update** to apply the selected release.
5. When prompted, reboot your server to complete the upgrade.
note
To change between the **Stable** and **Next** release branches, open the top-right account menu and choose **Manage Unraid.net Account**. Release branches are managed in the Unraid account app, not directly in the OS.
ZFS pool upgrade warnings
When upgrading to Unraid 7.x, you may see warnings about [ZFS](/unraid-os/advanced-configurations/optimize-storage/zfs-storage/) pool feature upgrades during boot or in the WebGUI. These warnings are not a sign of a problem; they simply indicate that your ZFS pool is using features from an older version of ZFS.
Upgrading your pool isn't urgent, but if you do decide to upgrade, keep in mind that it may not work with previous versions of Unraid. This means you may not be able to revert to a previous Unraid version after making the upgrade.
As always, remember to back up your data before upgrading your ZFS pools.
## Troubleshooting upgrade issues[​](#troubleshooting-upgrade-issues)
If you run into problems after upgrading, check the relevant section below for assistance.
**Array or docker containers are slow to start after upgrade** - Click to expand/collapse
A one-time migration may be necessary for Docker containers after certain upgrades. This process can take time, especially if you have many images. Be patient during this process; performance should normalize after the initial start.
**Docker containers are not working correctly after upgrade** - Click to expand/collapse
If you encounter errors like *"layers from manifest don't match image configuration,"* you may need to rebuild your Docker image file. Here’s how:
1. Go to ***Settings → Docker*** and stop the Docker service.
2. Check the box to delete the Docker image and click the delete button.
3. Restart Docker to recreate the image.
4. Navigate to the **Apps** tab, **Previous Apps** and check off what you wish to reinstall and click **"Install xx Applications"**.
**VMs show "cannot get interface MTU" or network errors** - Click to expand/collapse
If you've used a custom bridge name for VM networking, update all VMs to use the default `br0` bridge by following these steps:
1. Go to the **VMs** tab and edit each VM (make sure to enable **Advanced View**).
2. Set the network bridge to `br0` and click **Apply**.
3. Navigate to ***Settings → VM Manager*** (in **Advanced View**) and set the default bridge to `br0`.
**VNC access to VMs is not working or is slow** - Click to expand/collapse
For older VMs, you may need to update the VNC video driver:
1. Edit the VM from the **VMs** tab (select **Advanced View**).
2. Set the **VNC Video Driver** to **QXL** (recommended). Try **Cirrus** or **vmvga** if you have limited success with QXL.
3. Click **Apply** to save the changes.
**VM will not boot (EFI shell appears)** - Click to expand/collapse
If you have OVMF-based VMs created in older Unraid versions, you might encounter an EFI shell. You can boot the VM by entering the following commands:
1. Type `fs0:`.
2. Then type `cd efi/boot`.
3. Finally, type `bootx64.efi`.
If `fs0:` doesn't work, you can try `fs1:` instead. If you continue to have issues, please visit the [Unraid forums](https://forums.unraid.net/) for assistance.
**Trying to start my VM gives an "Invalid machine type" error** - Click to expand/collapse
To resolve this, edit the VM in the WebGUI and click **Apply** without making any changes. This action will update the machine type to the latest supported version.
**Poor VM performance after upgrading** - Click to expand/collapse
If your VM is slow after an upgrade, go to the VM settings (in **Advanced View**) and update the **Machine** type version to the latest revision (e.g., change from `i440fx-2.5` to `i440fx-2.7`). Make sure not to change the prefix (for example, don't switch from `i440fx` to `Q35`).
## Downgrading Unraid[​](#downgrading-unraid)
Before downgrading, be sure to read the release notes for the version you are downgrading from. Look for the section titled "Rolling back," as it contains any important steps you need to take.
If you have access to the WebGUI, you can go to **Tools → Downgrade OS.** This option allows you to downgrade to your previously installed version without downloading a zip file from the Version History page.
If you don't see the option to downgrade under **Tools → Downgrade OS**, use the manual method described below. This usually means that the files for the previous version are not on your boot device.
### Manual downgrade or upgrade[​](#manual-downgrade-or-upgrade)
Manual downgrades are only needed if you can't access the WebGUI or if the downgrade option isn't available. Before proceeding, it's important to back up your boot device. For more details, see [Backing up your boot device](/unraid-os/system-administration/maintain-and-update/changing-the-flash-device/#backing-up-your-flash-device).
* Simplest method
* Command line method
1. Download the Unraid version ZIP file from the [Version History](/unraid-os/download_list/).
2. Unzip the file on your computer.
3. Access the `flash` network share (your boot volume; the share name may still be `flash` even when the UI says **Boot device**) or connect the USB boot device to your computer.
4. Create a `previous` directory if it doesn't already exist.
5. Move all `bz\*` and `changes.txt` files into the `previous` directory.
6. Copy the new `bz\*` and `changes.txt` files to the root of the boot drive.
7. Reboot your server.
* [Standard update process](#standard-update-process)
* [Troubleshooting upgrade issues](#troubleshooting-upgrade-issues)
* [Downgrading Unraid](#downgrading-unraid)
* [Manual downgrade or upgrade](#manual-downgrade-or-upgrade)