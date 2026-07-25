Replacing disks in array | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
You may need to replace disks in your array for two main reasons:
1. **Capacity upgrade**: Your storage is nearly full, and you want to use larger disks.
2. **Failure or retirement**: A disk has failed or is no longer supported.
While the process for replacing disks is similar in both cases, be cautious, as there is a risk of data loss during the replacement. Parity devices help protect your data; one parity device can safeguard against a single disk failure, while two can protect against losing data if two disks fail. Always be aware of your protection level during disk replacements.
## Upgrading capacity[​](#upgrading-capacity)
When upgrading your data drive to a larger one, here are some points to keep in mind:
* **Unmountable disks:** Fix any unmountable disks before upgrading. An unmountable status won't be resolved during the rebuild.
* **Single parity risks:** If you have single parity, you're at risk of data loss if another drive fails during the upgrade. Seek advice in forums if this happens.
* **Dual parity protection:** With dual parity, you're safe from losing data if one drive fails while upgrading a single drive. You can also upgrade two drives at once, but note that this increases the risk since you won't have protection against another drive failing.
* **Backup the old disk:** Keep the original disk intact until the upgrade is confirmed successful. This provides a fallback option if anything goes wrong.
warning
Replacing drives always involves some risk. If another drive fails during the upgrade, especially with only single parity, you may experience data loss. Always check the health of your drives before beginning the process, and ensure that you keep the old drive intact until the upgrade is complete and your data is confirmed to be safe.
To upgrade an existing data disk:
1. Run a parity check and ensure there are zero errors. If parity isn't valid, rebuilding the disk will corrupt its file system.
2. Stop the array.
3. Unassign the target disk.
4. Start the array. Unraid emulates the missing disk using the existing parity and data disks. You have two modes to choose from:
* Maintenance Mode - Prevents any writes to the emulated disk
* Normal Mode - Allows read/write access to the emulated disk
note
Starting in Normal Mode is optional. You can use it to verify that the emulated disk mounts and the data looks correct before proceeding.
1. Stop the array again.
2. Assign the replacement disk to the vacant slot.
3. Start the array to begin the rebuild. Unraid rebuilds the contents onto the new disk, and the file system automatically adjusts to the larger disk's capacity.
## Replacing failed/disabled disks[​](#replacing-faileddisabled-disks)
### What is a failed/disabled disk?[​](#what-is-a-faileddisabled-disk)
A failed or disabled disk is one that Unraid has stopped using for writing data, usually because it encountered a write error. A failed drive isn't always broken; it might be due to bad connections, power issues, or a temporary glitch.
Indications include a red "X" on the disk indicator and failure notification alerts.
|Failure ScenarioNo ParitySingle ParityDual Parity|**1 Disk Failure**Data LostRebuildableRebuildable|**2 Disk Failures**Data LostData LostRebuildable
Tips for Safe Rebuilds
* **For Single Parity:** You can only replace one disk at a time. If another disk fails during the rebuild, you could lose data.
* **For Dual Parity:** You can replace one or two disks at the same time, but be cautious if more than two disks fail.
important
If more disks fail than your parity can protect:
1. Immediately halt all write operations to prevent further data loss.
2. Seek help by posting your issue in the [Unraid forums](https://forums.unraid.net/) along with diagnostics.
3. Do not attempt a rebuild until you've received advice—focus on salvaging your data first.
### How to diagnose the issue[​](#how-to-diagnose-the-issue)
Check the syslog and SMART reports:
* If the syslog shows that the drive has reset, there might be a problem with the connection or cables.
* SMART reports can help assess the drive's health, but the best way to check is by running a SMART extended test. If it completes without errors, the drive is likely fine.
* If you see CRC errors, it usually points to issues with the cabling. These errors accumulate over time and don't reset.
tip
To stay informed about drive issues, enable notifications in Unraid by going to **Settings → Notification Settings**. This way, you're alerted right away if something goes wrong, reducing the risk to your data.
### What is emulation?[​](#what-is-emulation)
When a drive is disabled, Unraid uses its parity and other working drives to emulate the failed drive. The system continues to operate, and you can still access the data stored on the emulated drive.
* Unraid stops writing to the physical drive, and any updates are saved in parity and the emulation instead.
* Before replacing the failed drive, you can check and recover data from the emulated drive, which keeps the physical drive intact for potential recovery.
* If you can't access the emulated drive, repairing the file system is essential before any rebuild since fixing the file system is quicker and more effective than a rebuild.
### Preparing for drive replacement[​](#preparing-for-drive-replacement)
Make sure the new drive is at least as large as the failed drive but not larger than your smallest parity drive. If you have to use a larger drive, follow the Parity Swap procedure.
While it's not mandatory, many users choose to pre-clear new drives to test them and help prevent early failure. You can do this with the Preclear plugin, a SMART extended test, or manufacturer tools.
caution
If you try to rebuild using an unmountable emulated drive, the new drive will also become unmountable. Always repair the file system before attempting a rebuild.
To replace and rebuild a disk, follow the size requirements described in the "Preparing for drive replacement" section above.
important
Before you start, check for any disk errors or warnings. Unraid must be able to read all the remaining disks without any issues for the rebuild to work correctly. If another disk is failing, it could lead to data loss.
1. Stop the array.
tip
If your server supports hot-swap, you can skip step 2.
1. Power down your server.
2. Remove the old, failed disk and install the new disk. Ensure the replacement meets the size requirements described above.
3. Power up your server.
4. Assign the new disk to the failed disk's slot.
5. Check **Yes, I want to do this** and confirm.
6. Optionally select Maintenance Mode to speed up the rebuild (the array won't be accessible during this time).
7. Click **Start** to start the array. In Normal Mode, the rebuild begins automatically. If the new disk is larger, Unraid manages the extra space.
8. If you started in Maintenance Mode, go to the **Main** tab and manually click **Sync** to start the data rebuild.
warning
If Unraid prompts you to format the new disk during the rebuild, **do not do it**. Formatting will wipe all data and make recovery impossible.
### What to expect during the rebuild[​](#what-to-expect-during-the-rebuild)
* The array will still be available to use during the rebuilding process (unless you're in Maintenance Mode), but it might run slower.
* Rebuilding can take several hours, depending on your disk sizes and system usage.
* The new disk will have the same file system as the original.
* If the old disk was unmountable due to file system issues, the new disk will also not be mountable. Please fix any file system issues before starting the rebuild.
Additional notes
* The rebuild process won't change the file format of the disk; it simply restores its previous form.
* Always check the health of every disk before you start a rebuild to avoid any potential issues.
## Re-enabling a disabled disk (rebuilding onto itself)[​](#re-enabling-a-disabled-disk-rebuilding-onto-itself)
Sometimes, a disk may be disabled not because it's actually faulty, but due to issues such as loose cables, power problems, or temporary glitches. If that's the case, you can try to re-enable the disabled disk by rebuilding it onto itself instead of replacing it.
When to use this procedure
Only use this procedure when:
* The disk was disabled due to external factors (like cables or power issues).
* You've checked the disk's health using [SMART reports](/unraid-os/system-administration/monitor-performance/smart-reports-and-disk-health/).
* You've fixed any external problems that caused the disk to be disabled.
* The disk seems to be functioning normally.
Important considerations
* If you are rebuilding a data drive, make sure that the emulated disk shows the right content before you proceed. The rebuild process will ensure that the physical drive matches the emulated one exactly.
* The emulated disk may show as 'unmountable' in some cases. A rebuild will not necessarily fix an unmountable emulated disk, so verify the situation first. If the emulated disk shows 'unmountable' or the content doesn't look right, ask for help in the [Unraid forums](https://forums.unraid.net/) before proceeding with the rebuild.
* Always run a [SMART extended test](/unraid-os/system-administration/advanced-tools/command-line-interface/#smartctl) on the disabled drive to double-check that it's healthy before starting this process.
* If the emulated disk shows any file system issues, use the [automated XFS repair feature](/unraid-os/troubleshooting/common-issues/data-recovery/#running-the-repair) for XFS‑formatted disks, or the respective file system repair options for other file systems in the WebGUI before beginning the rebuild.
* While the rebuild process should preserve your data, it's a good idea to back up important files if you can.
To re-enable a disabled disk by rebuilding it onto itself:
1. Verify disk health by running a [SMART extended test](/unraid-os/system-administration/advanced-tools/command-line-interface/#smartctl) and acknowledging any warning icons in the dashboard.
2. Stop the array.
3. Unassign the disabled disk.
4. Start the array so Unraid can register the missing disk. The array displays the disk as "Not installed."
5. For data drives only, verify that the emulated disk shows the content you expect.
6. Stop the array.
7. Reassign the disabled disk to its original slot.
8. Optionally select Maintenance Mode to speed up the rebuild process.
9. Click **Start** to begin the rebuild. Unraid takes the contents from the emulated disk and reconstructs them onto the physical drive.
Rebuild time expectations
Rebuilding a disk onto itself can take several hours to more than a day for larger drives, depending on the size of the disk and system activity. Factors that can affect rebuild time include drive capacity, disk speed, and system load. You can keep an eye on the progress in the WebGUI.
This procedure works for both data drives and parity drives that have been disabled.
## Parity swap[​](#parity-swap)
Parity swap is a special procedure used when you need to replace a data disk with a disk that is larger than your current parity disk. The process installs a new, larger disk as the new parity disk, then installs your previous parity disk to the data slot. This ensures your array remains protected and allows for larger data drives in the future.
Use a parity swap when your replacement data drive is larger than your current parity disk. This isn't necessary if your new data drive is the same size or smaller than your parity disk.
**Example scenario:** You have an Unraid setup with a **2TB parity drive** and a **1TB data drive** and want to replace the 1TB drive with a **4TB drive**. First, assign the new 4TB drive as the parity drive, which will replace the 2TB drive. Then move the original 2TB drive to the data slot, and remove the 1TB drive entirely. After these changes, you'll have a 4TB drive as your new parity, ensuring you can add future data drives up to 4TB. The 2TB drive will now hold your existing data, while the 1TB drive can be repurposed. This swap keeps your data secure and your array protected, allowing for future upgrades.
Prerequisites
* Before starting, ensure the data drive you want to replace is disabled. If the drive has failed (shows a red indicator), it is already disabled. If the drive is healthy but you want to replace it, unassign the drive and start the array once without it to force Unraid to mark it as disabled.
* If your replacement data drive is not larger than your parity drive, use the standard [Replacing failed/disabled disks](#replacing-faileddisabled-disks) procedure instead.
* This procedure is only needed for replacing data drives in an Unraid array with a disk larger than the current parity drive. If you only need to upgrade your parity drive, simply remove the old parity drive, add the new one, and start the array. Parity will rebuild automatically.
Warnings
* Always verify the health of all drives using SMART reports before starting a parity swap. Attempting this procedure with another failing or unhealthy disk increases the risk of data loss.
* Preclear the new disk if possible. While not required, preclearing stress-tests the drive and reduces the risk of early failure.
* Correctly identify all drives before beginning. Note the model numbers and last four characters of each serial number to avoid mistakes during assignment.
To carry out a parity swap:
note
If the drive to be replaced is already disabled, you can skip steps 1–4. If you've already installed the new replacement drive, you can skip steps 5–8.
1. Stop the array.
2. Unassign the old data drive if it's still assigned.
3. Start the array. The data drive should now show as "Not installed."
4. Stop the array again.
5. Power down the server.
tip
If your system supports hot-swap, you don't need to power down. Make sure the array is stopped before making any hardware changes.
1. Optionally remove the old drive.
2. Install the new drive. Pre-clearing is strongly recommended, but formatting is not needed.
3. Power on the server.
4. Stop the array if it started automatically.
5. Unassign the parity drive.
6. Assign the new drive to the parity slot.
7. Assign the old parity drive to the data slot of the drive being replaced.
8. You should see a **Copy** button with a message stating "Copy will copy the parity information to the new parity disk."
9. Check the confirmation box and click **Copy**. The array isn't available during this operation, which can take many hours depending on disk size.
10. Start the array to begin the data rebuild. You can use the array during the rebuild, but limit usage for best performance. The rebuild process also takes several hours.
warning
Never format a drive during this process. Formatting will erase all data and update parity, making recovery impossible.
After completion, you will have a larger parity disk and a replaced data disk. Many users run a parity check afterward for extra confidence, though this is optional.
* [Upgrading capacity](#upgrading-capacity)
* [Replacing failed/disabled disks](#replacing-faileddisabled-disks)
* [What is a failed/disabled disk?](#what-is-a-faileddisabled-disk)
* [How to diagnose the issue](#how-to-diagnose-the-issue)
* [What is emulation?](#what-is-emulation)
* [Preparing for drive replacement](#preparing-for-drive-replacement)
* [What to expect during the rebuild](#what-to-expect-during-the-rebuild)
* [Re-enabling a disabled disk (rebuilding onto itself)](#re-enabling-a-disabled-disk-rebuilding-onto-itself)
* [Parity swap](#parity-swap)