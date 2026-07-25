Adding disks to array | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
Adding data disks is a great way to increase your Unraid array's storage space. By adding more disks, you can keep more files, applications, and backups, while still protecting your data.
Important Note:
When adding a new data disk, it must be the same size or smaller than your current parity disks. If you want to use a larger disk, you'll need to replace the parity disks first with the larger one, then use the old parity disks as a data disk.
Hot-Swap Feature
If you're using modern Unraid-compatible hardware, you can change disks without shutting down your server. This feature, known as hot-swap, has been available in LimeTech servers since the beginning.
## Setting up new disks[​](#setting-up-new-disks)
1. Go to ***Main → Array Devices*** in the interface.
2. Pick the slot where you want to add the disk and select the disk from the dropdown list.
3. By default, new array drives will be formatted with XFS. If you want to use ZFS or BTRFS instead, select your preferred file system from the drop-down menu.
## Clear vs. Pre-Clear[​](#clear-vs-pre-clear)
Unraid requires disks to be in a cleared state - completely filled with zeros and marked with a special signature - before adding them to a parity-protected array. This process ensures parity integrity and keeps the array online during disk preparation.
Clearance is mandatory when adding a data disk to a parity-protected array. If you are adding a parity disk or working with an array that does not use parity, clearance is not required.
The built-in clear operation writes zeros to the disk in the background, allowing the array to remain available. Once the process is complete, the disk must be formatted before use. This method is efficient, requires no third-party tools, and is ideal for quick expansions.
For a more thorough approach, the pre-clear operation – available through plugins like [Unassigned Devices Preclear](<https://unraid.net/community/apps?q=unassigned+devices#r:~:text=enable destructive mode.-,Unassigned Devices Preclear,-dlandon>) – performs a pre-read to check for bad sectors, zeros the disk, and then verifies integrity with a post-read. This extra step helps detect early drive failures but takes significantly longer and requires manual plugin installation.
**Rule of thumb:** Use the built-in clear operation for fast additions to your array, or choose pre-clear if you want extensive testing of disk health before putting a drive into service.
### Clear vs. Pre-Clear Comparison
|ClearPre-Clear|**Purpose**Ensures basic disk compatibilityTests drive health and prepares for use|**Speed**FastSignificantly slower|**Array Impact**Background operationDisk offline required|**Best for**Quick expansionsPreparing/checking new drives
**Clear** quickly prepares a disk for use, making it compatible with your system and allowing you to add storage in just a few hours.
**Pre-Clear** takes longer but provides a thorough test, ensuring a new disk is reliable before it becomes part of your array.
Critical Note
Avoid formatting a pre-cleared disk before including it in the array, as this removes the clearance signature.
## Adding data disks[​](#adding-data-disks)
Adding a new data disk to your array expands storage capacity. The process varies slightly depending on whether you have parity protection enabled. Parity-protected arrays clear new disks before they become available, while arrays without parity can add disks more quickly.
### Adding to a parity-protected array[​](#adding-to-a-parity-protected-array)
1. Stop the array.
2. Power down your server.
3. Install the new hard drive(s) physically.
4. Power the server back on.
5. Assign the new disk(s) to available data slots.
6. Start the array. Unraid will automatically start a clear operation on the new disk, filling it with zeros to ensure it's ready for use while maintaining data integrity. The clear operation runs in the background, so you can still access your array. The disk won't be usable until the process is complete. If you've pre-cleared the disk, Unraid skips this step.
7. After clearing completes, the disk shows as unmountable. You'll be prompted to format it.
8. Check the confirmation box and click the **Format** button.
9. The formatting takes a few minutes. Once completed, the disk shows as mounted and ready for use.
important
Always double-check the serial number to make sure you're formatting the right disk. Formatting erases everything on that disk, and this action cannot be undone.
note
You can add multiple disks, but they won't be usable until all have been cleared and formatted.
### Adding to an array without parity protection[​](#adding-to-an-array-without-parity-protection)
1. Stop the array.
2. Power down your server.
3. Install the new hard drive(s) physically.
4. Power the server back on.
5. Assign the new disk(s) to available data slots.
6. Start the array. The clearing step is skipped entirely when there is no parity disk in the array.
7. The new disk shows as unmountable and you'll be prompted to format it.
important
Always double-check the serial number to make sure you're formatting the right disk. Formatting erases everything on that disk, and this action cannot be undone.
## Adding parity disks[​](#adding-parity-disks)
Parity disks are a helpful feature that provide an extra layer of protection for your data. They allow your storage system to recover information if a hard drive fails. While using parity disks is optional, it's highly recommended to keep your data safe.
Requirements
* **Single Parity:** The disk must be at least the same size as your largest data drive.
* **Dual Parity:** Both parity disks must also be at least the size of your largest data drive, but they can be different sizes from each other.
Adding a parity disk is similar to adding a data disk:
1. Select the parity disk and start the array. Unraid begins calculating parity.
2. You can still access your files during this process, but the system may run slower.
### Understanding parity[​](#understanding-parity)
**What is parity?** Parity in Unraid protects your data by ensuring that you can recover from a drive failure. With the use of a parity disk, any single missing disk can be reconstructed by combining the information from all other data drives along with the parity data.
**How it works:** Unraid uses a special bit called the *parity bit*, stored for each bit position across all data disks and managed by a dedicated parity disk. The parity is calculated such that the total number of bits in each position across all disks (including the parity disk) is always an even number (even parity). Unraid uses the XOR (exclusive OR) operation for this calculation.
**How data is reconstructed:** Unraid reconstructs a missing drive or repairs a bad sector by reading all remaining drives, including the parity disk, and applying even parity to solve for the missing data. The parity feature allows Unraid to "simulate" the missing disk so you can continue using the array as if the drive were still functional. Once you install a new drive in the failed slot, Unraid recreates all the missing data based on the current state of parity and the other disks.
**Parity disk size:** Your parity disk must be equal to or larger than your largest data disk. For instance, if your largest data disk is 10TB, your parity disk should be at least 10TB.
**Performance impact:** Writing to a parity-protected array involves four disk operations for each write: reading data, reading parity, writing data, and writing parity. This process requires a full rotation from each affected drive, so the overall write speed is limited by the slowest drive involved in the operation.
**Dual Parity:** Dual parity enables recovery from two simultaneous disk failures. The second parity disk doesn't simply mirror the first. Instead, Parity 1 uses standard XOR (even) parity calculations, while Parity 2 implements Q-parity using Galois-field syndrome calculations (Reed-Solomon–style), comparable to RAID 6. This allows Unraid to rebuild from any two simultaneous disk failures, significantly boosting resilience for larger arrays.
Remember
When setting up a new data storage system, add your data disks **first**, making sure they all use a compatible file system. **After** placing your data disks, you can add a parity disk to protect against drive failures.
Once your parity disk is added, remember that any new disk you want to include in the array must be cleared (zeroed) before it's integrated. This is to ensure that the parity remains valid and continues to protect your data.
## Upgrading parity disks[​](#upgrading-parity-disks)
You can upgrade your parity disk device(s) to a larger one(s) to use larger-sized disks in the array or add an additional parity disk.
caution
If you're planning to take the following steps and only have one parity disk, keep these points in mind:
* Your data will be unprotected until the parity rebuild is complete. If a data drive fails during this time, you could lose the information on that drive.
* If you already have a data drive that has failed, proceeding with these steps will prevent you from being able to rebuild that drive. In this case, you should follow the **Parity Swap** procedure instead.
To upgrade a parity drive:
1. Stop the array.
2. Power down your server (skip this and step 4 if your server supports hot-swap).
3. Install the new, larger parity disk into your server.
4. Power up your server.
5. Assign the new disk to the parity slot, replacing the old one.
6. Start the array.
Once the array is back up, Unraid starts building parity on the new disk. You can still access your data during this time, but it might be slower until the process completes.
Planning your parity upgrade
Keep the old parity disk installed until the new parity build completes. If a data disk fails during the upgrade, the old parity disk can help you recover your data. After the upgrade completes successfully, you can repurpose the old disk as a data disk if desired.
* [Setting up new disks](#setting-up-new-disks)
* [Clear vs. Pre-Clear](#clear-vs-pre-clear)
* [Adding data disks](#adding-data-disks)
* [Adding to a parity-protected array](#adding-to-a-parity-protected-array)
* [Adding to an array without parity protection](#adding-to-an-array-without-parity-protection)
* [Adding parity disks](#adding-parity-disks)
* [Understanding parity](#understanding-parity)
* [Upgrading parity disks](#upgrading-parity-disks)