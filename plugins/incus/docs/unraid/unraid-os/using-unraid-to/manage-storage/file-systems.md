File systems | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
## Selecting a file system type[​](#selecting-a-file-system-type)
Selecting the right file system for your Unraid array or cache pool is crucial. It helps you achieve a balance between performance, data protection, and advanced features. Unraid supports several modern Linux file systems, each with its own unique strengths and specific use cases:
|File SystemData ProtectionSpace EfficiencyAdvanced FeaturesBest Use Case|XFSNo built-in redundancy100%Robust against corruptionDefault for array drives; high reliability|EXT4No built-in redundancy100%Mature, stable, journaledArray drives or single-drive pools; alternative to XFS|ZFSRAIDZ1/RAIDZ2/RAIDZ3, mirrors, etc.Varies by RAID levelChecksums, Snapshots, RAIDMulti-device pools, VMs, Docker, advanced users|BTRFSRAID 0/RAID 1/10/5/6, mirrorsVaries by RAID levelChecksums, Snapshots, RAIDMulti-device pools, mixed SSD/HDD, flexible pools|NTFSNo built-in redundancy100%Windows compatibilityAdding existing Windows drives without data migration|exFATNo built-in redundancy100%Cross-platform compatibilityAdding existing exFAT drives without data migration
### XFS[​](#xfs)
XFS is the default file system for array drives in Unraid. It's known for its robustness and ability to recover from corruption after unexpected shutdowns or crashes. Each drive formatted with XFS acts as a self-contained file system, making data recovery straightforward on any Linux system.
* **Data protection:** No built-in redundancy; relies on Unraid's parity for protection.
* **Performance:** Consistent and reliable.
* **Best for:** Array drives, especially when stability and ease of data recovery are priorities.
### EXT4[​](#ext4)
EXT4 is a mature and stable file system that offers excellent compatibility and reliability. It is fully supported and stands on par with XFS, BTRFS, and ZFS, making it a strong choice for array drives or single-drive pools.
* **Data protection:** It does not have built-in redundancy and relies on Unraid's parity for protection.
* **Performance:** It provides consistent and reliable performance with journaling to ensure data integrity.
* **Best for:** Array drives or single-drive pools when you are looking for an alternative to XFS.
### ZFS[​](#zfs)
ZFS is a modern file system that comes with advanced features such as checksums to detect bit rot, snapshots for backups, and native RAID support options like RAIDZ1/RAIDZ2/RAIDZ3 and mirrors. ZFS can be utilized for both single-device and multi-device pools.
* **Data protection:** Supports various RAID levels for redundancy.
* **Performance:** Excellent, particularly for multi-device pools.
* **Best for:** High-performance environments, virtual machines, Docker, or when advanced features like snapshots are required.
For comprehensive guidance on ZFS features, configuration, and best practices, see the dedicated [ZFS storage](/unraid-os/advanced-configurations/optimize-storage/zfs-storage/) page.
### BTRFS[​](#btrfs)
BTRFS provides flexible RAID support, checksums for data integrity, and efficient management of mixed-size drives in pools. It serves as the default file system for cache pools and supports both single-device and multi-device configurations.
* **Data protection:** Supports RAID 0/1/10/5/6 (note that RAID 5/6 are still experimental).
* **Performance:** Good, with flexibility for expansion and contraction.
* **Best for:** Cache pools, especially if you plan to mix SSDs and HDDs or need an easy way to expand.
### NTFS and exFAT (limited support)[​](#ntfs-and-exfat-limited-support)
NTFS and exFAT file systems are supported with some limitations. This is mainly to help you add existing drives with data to your Unraid system without needing to transfer the data elsewhere first.
warning
Drives formatted with NTFS or exFAT must be added to the array **before** you add any parity drives. Once a parity drive has been added to your array, any new data drives you add will be zeroed out, regardless of their file system format.
If you want to use existing NTFS or exFAT drives:
* Add them to the array first (or run ***Tools → New Config*** to reset your array configuration).
* After adding your NTFS/exFAT data drives, you can then add parity drives.
* The existing data on these drives will be preserved and protected by parity.
* **Data protection:** These drives do not offer built-in redundancy; they rely on Unraid's parity for protection once parity is added.
* **Performance:** Adequate for basic storage needs.
* **Best for:** Adding existing Windows-formatted drives (NTFS) or cross-platform formatted drives (exFAT) without the need for data migration. They can also be used for single-drive pools.
* **Limitations:** These file systems are not recommended for regular use; they are intended primarily for migrating existing drives. For new drives, consider using XFS, EXT4, BTRFS, or ZFS instead.
For more details on adding existing drives, see the [release notes](/unraid-os/release-notes/7.2.0/#ext234-ntfs-and-exfat-support).
Additional Notes
* Mixing different file system types in your Unraid system is perfectly acceptable; the Unraid parity system works independently of the file system used.
* Always format and partition drives within Unraid to ensure compatibility.
* Linux systems can read these file systems natively; however, Windows and macOS will require additional software for access.
* You can **encrypt** drives for enhanced security, but keep in mind that encrypted drives might pose challenges for recovery if corruption occurs.
* For transfer drives or external devices, it's recommended to use the **[Unassigned Devices](#using-the-unassigned-devices-plugins)** plugin, which supports additional file systems.
Still need help choosing?
* **For array drives:** XFS is generally the best choice for most users. EXT4 is also a solid option if you prefer a more traditional Linux file system.
* **For high-performance or advanced features:** Choose ZFS or BTRFS for cache pools or multi-device setups. See the [ZFS storage](/unraid-os/advanced-configurations/optimize-storage/zfs-storage/) page for detailed ZFS guidance.
* **For mixed or expanding pools:** BTRFS is ideal if you want to use different drive sizes or easily add or remove devices. See [BTRFS pools](/unraid-os/using-unraid-to/manage-storage/cache-pools/#btrfs-pools) for details on adding disks to BTRFS pools.
* **For existing drives:** Use NTFS or exFAT only when adding existing drives with data; add them before adding parity.
If you're uncertain, starting with the defaults is a good approach: use XFS for array drives and BTRFS for cache pools.
## Setting a file system type[​](#setting-a-file-system-type)
When adding a new drive to Unraid, you can select the file system type that works best for your needs. The file system determines how data is organized and protected on the disk.
To set the file system type globally, navigate to ***Settings → Disk Settings*** to set the default file system for new array drives only. Unraid defaults to XFS for array drives.
note
There is currently no global default setting for cache pools. They will always default to BTRFS if left to "auto".
important
If you're adding drives with existing NTFS or exFAT data, they must be added to the array before any parity drives are added. Once parity is present, all newly added data drives will be zeroed out regardless of their file system type.
To set the file system for an individual drive:
1. Stop the array before making changes.
2. In the **Main** tab, click the drive you want to configure.
3. Select the desired file system type from the drop-down menu.
4. (Optional) If you select **auto**, Unraid uses the global default.
5. For multi-device cache pools, only BTRFS or ZFS are supported.
6. If adding existing NTFS or exFAT data drives to the array, add them before adding any parity drives.
## Creating a file system (formatting)[​](#creating-a-file-system-formatting)
Before using a new disk in Unraid, you must format it with the selected file system.
warning
Formatting will erase all existing content on the drive. Make sure you've backed up any important data before proceeding.
To format a drive:
1. Start the array.
2. Identify unmountable drives (they appear as **unmountable**).
3. Verify that all unmountable drives are the ones you want to format.
4. Check the confirmation box, read the warning dialog, and click **Format**.
5. Monitor the process. For new disks, Unraid first rewrites the partition table.
6. Wait for completion. If progress stalls, refresh the **Main** tab.
Once formatting is complete, the drive is ready to store files.
## Changing a file system type[​](#changing-a-file-system-type)
You may want to change the file system type on a specific drive to take advantage of new features or to ensure compatibility with your other drives.
warning
Changing the file system type will **erase all existing data** on the drive. Always back up any important files before proceeding.
To change the file system type on a particular drive:
1. Stop the array.
2. In the **Main** tab, click the drive you want to change.
3. Choose the new file system from the drop-down (repeat for multiple drives as needed).
4. Start the array.
5. In the **Main** tab, review the unmountable drives list and ensure only the intended drives are included.
6. Check the confirmation box and click **Format**.
7. Wait for completion. If status doesn’t update, refresh the **Main** tab.
If you encounter any issues, feel free to visit the [Unraid forums](https://forums.unraid.net/). Attach your system diagnostics zip file (found under ***Tools → Diagnostics***) for assistance.
## Converting to a new file system type[​](#converting-to-a-new-file-system-type)
important
The ***Main*** page will warn if any array or pool drives are formatted in legacy filesystems:
* Any drives formatted in ReiserFS need to be migrated to another filesystem ASAP as they will not be usable in future releases of Unraid.
* Any drives formatted in older XFS versions need to be migrated before 2030.
To change the file system type on a drive but keep its data, you must migrate the contents before reformatting. This process is especially common for users moving away from the deprecated ReiserFS (used in older Unraid versions) to XFS or BTRFS, but it applies to any file system conversion.
important
This process requires temporarily moving your data to another location. Make sure you have enough free space elsewhere in your array or on an external device before you begin.
To safely convert to a new file system type:
1. Move all data off the drive to another location (another array drive, cache pool, or external backup). Use one of these methods:
**Via the WebGUI (Unraid 7.2+):**
* Navigate to ***Main → Array Operation*** and stop the array
* Navigate to ***Settings → Global Share Settings***. In the **Emptying disk(s)** area, select the disk(s) to empty and **Apply**. Note: this status will automatically be removed when the array is stopped.
* In Unraid 7.2.0, any data on this disk will be hidden from user shares until this status is removed.
* Starting with Unraid 7.2.1, the data remains available to user shares but new files will not be written to the disk until this status is removed.
* Navigate to ***Main → Array Operation*** and start the array
* On ***Main → Array Operation*** click **Move** (or wait until mover runs via its normal schedule)
* Mover will empty the disk, moving files to other array drives according to your Share settings. Note that files at the root of the drive are outside of any Shares and will not be moved.
* Check ***Tools → System Log*** for messages about any files that could not be moved due to being in use or a lack of free space
**Or via the command line (Unraid 7.0 and 7.1 only):**
* Move files [using 'mover' to empty an array disk](/unraid-os/release-notes/7.0.0/#using-mover-to-empty-an-array-disk) to other array drives
**Or manually:**
* Move files manually to another location
Once completed, navigate to ***Main → Array Devices*** and browse the disk to confirm it is empty. Proceed only when you are certain the disk is empty.
* Follow the procedure for [changing a file system type](#changing-a-file-system-type). This formats the drive and erases all content, leaving a blank drive in the new format.
* (Optional) Move your data back to the newly formatted drive, depending on where you moved the files.
* If you have multiple drives to convert, repeat these steps for each drive.
Timing
The process can take several hours, depending on the amount of data and the speed of your drives. Most of the time is spent copying files, which can run unattended.
## Reformatting a drive[​](#reformatting-a-drive)
Reformatting a drive in Unraid will erase all of your data and create a new, empty file system. This process is useful for resolving persistent file system errors or starting fresh with a new format.
warning
Reformatting will permanently erase all data on the drive. Always back up any important files before you begin.
To **safely** reformat your drive:
1. **Stop the array**.
2. **Change the file system type**:
* Go to the **Main** tab and click on the drive you want to reformat.
* Select a different file system type (for example, change from XFS to BTRFS).
* Start the array, and the drive will show as **unmountable**.
* When prompted, format the drive.
* **(Optional) Change back to your original file system type**:
* Stop the array again.
* Change the file system back to your preferred type.
* Start the array and format the drive once more.
This simple process ensures that the drive is fully wiped and formatted as you desire. The formatting process usually takes just a few minutes.
### Reformatting a cache drive[​](#reformatting-a-cache-drive)
Sometimes, you'll need to reformat a cache drive for the following reasons:
* To change the file system type (for example, from BTRFS to XFS or vice versa)
* To fix persistent file system errors
* To start fresh for new workloads
#### Preparation[​](#preparation)
Before reformatting, prepare the system:
1. Stop the array.
2. Go to **Settings** and disable Docker and VM services (this prevents their tabs from appearing during the process).
3. Start the array again.
#### Move data off the cache[​](#move-data-off-the-cache)
To move data off the cache:
1. Set share storage and Mover action (cache → array):
* Go to the **Shares** tab.
* For each share with files in the cache, set **Primary storage** to the source cache pool and **Secondary storage** to the array.
* Set **Mover action** to **cache → array**.
* Note the shares you changed and their original settings.
* In the **Main** tab, click **Move Now** and wait for completion. Ensure the cache is empty.
* If files remain, stop and check the forums for help.
#### Reformat the cache drive[​](#reformat-the-cache-drive)
To reformat the cache drive:
1. Stop the array.
2. Set the cache drive format:
* In the **Main** tab, click the cache drive.
* Choose between XFS, EXT4, or BTRFS.
* For a single-drive cache, XFS or EXT4 are recommended.
* Note that XFS and EXT4 are only available with one cache slot.
* Start the array.
* Format the cache drive:
* Confirm only the cache drive is listed as unmountable.
* Check the confirmation box and click **Format**.
#### Restore data and settings[​](#restore-data-and-settings)
To restore data and settings:
1. For each share you changed, set **Primary storage** and **Secondary storage** back to their original values.
2. Move data back (array → cache):
* For each share you changed, set **Primary storage** to the destination cache pool and **Secondary storage** to the array.
* Set **Mover action** to **array → cache**.
* In the **Main** tab, click **Move Now** to move data back to the cache.
* Stop the array.
* Go to **Settings** and re-enable Docker and VM services.
* Start the array to complete the process.
Timing
The time it takes to move data with the Mover and format the drive can vary from several minutes to several hours, depending on the amount of data and the speed of the drive.
## BTRFS operations[​](#btrfs-operations)
Maintaining your BTRFS pools in Unraid is essential for keeping them running well and ensuring your data stays safe. Two key tools you’ll want to use regularly are **Balance** and **Scrub**. These operations help solve space allocation problems, optimize your storage use, and protect your data from hidden corruption.
Let's break down what each operation does and when to use them:
### Balance[​](#balance)
The **Balance** operation redistributes data and metadata chunks across your BTRFS pool. This process helps free up space, resolves allocation issues, and can fix "no space left on device" errors even when space seems available.
#### When to run Balance[​](#when-to-run-balance)
* When you encounter "no space left on device" errors but have free space.
* After adding or removing drives in a pool.
* To optimize space usage and improve performance.
#### How to run Balance[​](#how-to-run-balance)
1. In the WebGUI, click the pool in the **Main** tab and select **Balance**.
2. (Optional) Add parameters for advanced use (refer to Unraid Help for details).
3. Click **Start** to begin.
Timing
Balance operations can take a few minutes to several hours, depending on the pool size and amount of data.
### Scrub[​](#scrub)
The **Scrub** operation reads all data and metadata, checks the integrity of checksums, and repairs any corrupt blocks using available redundant copies. Scrubbing helps identify and fix silent data corruption, known as "bit rot," before it becomes a significant issue.
#### When to run Scrub[​](#when-to-run-scrub)
* As part of routine maintenance (see recommended schedule below).
* After unclean shutdowns or if you suspect corruption.
* More frequently on high-usage pools.
#### Recommended schedule[​](#recommended-schedule)
* High-usage pools: **Once a week**
* All other pools: **Once a month**
#### How to run Scrub[​](#how-to-run-scrub)
1. In the WebGUI, click the pool in the **Main** tab and select **Scrub**.
2. Click **Start** to initiate.
Timing
Scrub operations are usually quicker than a full disk scan because they only check allocated data. Based on pool size and usage, expect this to take anywhere from a few minutes to a few hours.
tip
Both **Balance** and **Scrub** can be performed while the system is online, but keep in mind that performance may be affected during these operations. You can monitor the progress in the WebGUI.
For more details on advanced BTRFS features, check out the [official BTRFS documentation](https://btrfs.readthedocs.io/en/latest/Introduction.html).
## Unassigned drives[​](#unassigned-drives)
Unassigned drives are storage devices connected to your Unraid server that aren't part of the main array or any cache pool. You can use these drives to transfer files, create backups, or provide fast storage for virtual machines.
note
All drives connected to your server when the array starts count toward your Unraid Attached Devices license limit, even if they aren't assigned to the array or a pool.
### Common uses for unassigned drives[​](#common-uses-for-unassigned-drives)
* Connect removable drives for easy file transfers or backups.
* Use dedicated drives for high-performance tasks like running virtual machines or temporary data storage.
### Using the Unassigned Devices plugins[​](#using-the-unassigned-devices-plugins)
To make the most of your unassigned drives, consider installing the following plugins from the **Apps** tab:
* **[Unassigned Devices](<https://unraid.net/community/apps?q=dlandon&r=0#:~:text=and iso files.-,Unassigned Devices,-dlandon>):** This plugin allows you to mount, share, and manage drives with file systems that Unraid supports, like XFS, BTRFS, or NTFS.
* **[Unassigned Devices Plus](<https://unraid.net/community/apps?q=dlandon&r=0#:~:text=and iso files.-,Unassigned Devices Plus,-(Addon)>):** This extension broadens your options by supporting additional file systems, including ExFAT and HFS+.
These plugins enable:
* Easily mounting and unmounting drives from the Unraid web interface.
* Sharing your unassigned drives over the network.
* Automating the mounting process when the server boots up.
* Formatting or erasing drives for future use.
* Safely disconnecting USB or external drives without hassle.
For more details on installing and managing plugins, check out [Plugins](/unraid-os/using-unraid-to/customize-your-experience/plugins/).
## Troubleshooting[​](#troubleshooting)
### Drive shows as unmountable[​](#drive-shows-as-unmountable)
If you see that a drive in Unraid is **unmountable**, it could be due to one of two main reasons:
1. If you just added a new drive to your setup, it will show as unmountable until you format it. Formatting creates a file system that allows the drive to store files. You can find the steps to format a drive [here](#creating-a-file-system-formatting).
2. If a drive that was previously working suddenly shows as unmountable, it likely has a file system issue. This can happen due to unexpected shutdowns, problems while writing data, or if the drive has been marked as disabled (which appears as a red 'x' in the WebGUI).
important
Do not format an unmountable drive unless you are okay with losing all the data on it. Formatting will erase everything and update the parity information, making recovery impossible. Always try to fix the file system first.
If your drive is unmountable:
1. Determine if it's a new drive or a previously working drive.
2. For new drives: Format the drive to create a new file system (see [formatting steps](#creating-a-file-system-formatting)).
3. For previously working drives: Perform a file system check or repair (see [Checking a file system](#checking-a-file-system)). Avoid formatting if you want to keep the data.
note
If a drive is both unmountable and disabled (red 'x'), first run the file system check/repair on the **emulated** drive. If the emulated drive is also unmountable and you attempt to rebuild it, the new drive will also be unmountable.
Fixing the file system typically takes less time than rebuilding the drive, allowing you to access your data without losing anything. Remember, rebuilding a drive does **not** fix file system issues; it merely ensures that the physical drive matches the emulated one, carrying over any existing problems.
Why is parity not enough?
While parity helps recover a failed drive, it cannot fix file system problems. If the file system is corrupted, parity will simply replicate that corruption to the new drive.
If you’re unsure:
* Download your system logs by navigating to ***Tools → Diagnostics***.
* For expert help, post your issue along with the diagnostics on the [Unraid forums](https://forums.unraid.net/).
Just to reiterate
* Only format unmountable drives if they are brand new or if you want to erase all data.
* Use the file system check/repair for fixing corrupt files; don’t rely on parity to solve these issues.
* For cache pools with multiple drives, consider using either BTRFS or ZFS.
* Always double-check before formatting or repairing drives to avoid accidental loss of data.
### Checking a file system[​](#checking-a-file-system)
If a disk that previously mounted without issues now shows as **unmountable**, it typically indicates file system corruption. This may result from an unclean shutdown, a failed write operation, or the disk being marked as disabled in the WebGUI. Checking and repairing the file system is generally quicker and safer than performing a rebuild, so it's advisable to try this before formatting or rebuilding the disk.
important
If the WebGUI suggests formatting an unmountable drive, **do not format** unless you intend to erase all data. Formatting will destroy the contents of the drive and update parity, making recovery impossible.
#### Preparing to check or repair[​](#preparing-to-check-or-repair)
1. Identify the file system type:
* In the **Main** tab, select your disk (e.g., Disk 3, Cache).
* Find the **File system type** (should be XFS, EXT4, BTRFS, or ZFS).
* Start the array in the correct mode:
* For **XFS** or **EXT4**, start the array in **Maintenance Mode**.
* For **BTRFS**, start the array in **Normal mode** for a scrub or **Maintenance Mode** for a repair.
* For **ZFS**, refer to the ZFS section below.
* If the disk is disabled and being emulated, run the check/repair on the emulated disk before attempting a rebuild. If the emulated disk is unmountable, the rebuilt disk will also be unmountable.
#### Common error messages[​](#common-error-messages)
|MessageMeaning / Action|**Superblock has bad magic number**Severe corruption; attempt a file system repair.|**Filesystem is dirty**Unclean shutdown; execute a file system check.|**Metadata corruption detected**File system structures are damaged; initiate a repair.|**No valid BTRFS found**Disk may not belong to a valid pool; check pool assignments.|**Mount: wrong fs type, bad option, etc.**Incorrect file system selection or disk is unformatted.|**Cannot mount /dev/mdX: Structure needs cleaning**File system is corrupted; perform a repair.
#### Checking via the WebGUI[​](#checking-via-the-webgui)
1. Start the array in the correct mode (refer to the steps above).
2. In the **Main** tab, select the disk you wish to check.
3. Scroll to **Check Filesystem Status**.
4. For XFS: You will see a **CHECK** button without any options to enter. The system automatically determines the necessary actions based on the check results.
5. For other file systems: Enter any necessary options (for details, see **Help** in the upper right).
6. Click **Check** to initiate the process.
7. Monitor progress in the output box. Use **Refresh** if required.
8. Review results. If uncertain, copy the output and post it on the [forums](https://forums.unraid.net/) for advice.
#### XFS automatic repair workflow[​](#xfs-automatic-repair-workflow)
XFS file system repair is fully automated through the WebGUI:
1. Click the **CHECK** button (no options to enter)
2. Check results:
* **No corruption detected**: Shows "no filesystem corruption detected" and the **CHECK** button remains
* **Corruption detected**: Shows "filesystem corruption detected" and a **FIX** button appears
* Click **FIX** to automatically repair the file system
* If needed, a **ZERO LOG** button may appear
* Shows "filesystem repaired" when the process is complete
This automated system eliminates the need for users to manually enter repair options and ensures the correct repair sequence is followed.
#### Checking via the command line[​](#checking-via-the-command-line)
* XFS
* BTRFS
* ZFS
To check an XFS file system via command line:
* Start the array in **Maintenance Mode**.
* Run the following command: `xfs\_repair -v /dev/mdXp1`
* Replace `X` with the disk number (e.g., `/dev/md1p1`).
* For encrypted XFS, use `/dev/mapper/mdXp1`.
* For drives not in the array: `xfs\_repair -v /dev/sdX1`
* Ensure you are using the correct device identifier.
warning
Running this command on an array disk outside of **Maintenance Mode** will invalidate parity.
tip
* File system repairs are generally faster than a complete rebuild and can restore access without data loss.
* Rebuilding a disk does **not** resolve file system corruption; always run a check or repair first.
* If you have doubts, post your diagnostics and error messages on the Unraid [forums](https://forums.unraid.net/) for expert assistance.
### Repairing a file system[​](#repairing-a-file-system)
If a check of your file system finds errors, you might need to run a repair to get access to your data again. Repairs typically take less time than a full rebuild, but it's important to read the output carefully and reach out for help on the [forums](https://forums.unraid.net/) if you're unsure about anything.
Timing
Repairs can take anywhere from several minutes to several hours, especially for larger or heavily corrupted file systems. Progress might seem slow, but you can check on the activity by looking at the read/write statistics on the Main page.
#### Preparing to repair[​](#preparing-to-repair)
1. In the **Main** tab, click the disk and identify the file system type (XFS, EXT4, BTRFS, or ZFS).
2. Start the array in the correct mode:
* **For XFS or EXT4:** Use **Maintenance Mode**.
* **For BTRFS:** Use **Normal mode** for a scrub; use **Maintenance Mode** for a repair.
* **For ZFS:** Use **Normal mode** and run a scrub to check for errors. See the [ZFS storage page](/unraid-os/advanced-configurations/optimize-storage/zfs-storage/) for guidance on ZFS pool maintenance and repair procedures.
* If the disk is disabled and being emulated, run the repair on the emulated disk before trying to do a rebuild.
#### Repairing via the WebGUI[​](#repairing-via-the-webgui)
1. Start the array in the correct mode (refer to the section above).
2. In the **Main** tab, click the disk you want to repair.
3. Scroll down to **Check Filesystem Status**.
4. For XFS: The repair process is fully automated. Click **CHECK**, then **FIX** if corruption is detected, and **ZERO LOG** if prompted.
5. For other file systems: Remove any options that would run the process in check-only mode (like `--readonly` for BTRFS).
6. If prompted, add the suggested options as indicated in the check output.
7. Click **Check** to begin the repair.
8. Monitor progress in the output box. Use **Refresh** if needed.
9. If you notice a `lost+found` folder after the repair, it may contain files or folders that couldn't be fully recovered. Use backups or the Linux `file` command to identify the contents if necessary.
info
If you're uncertain about the output, copy and share it on the [Unraid forums](https://forums.unraid.net/) for expert help. Use the code formatting option to keep it readable.
#### Repairing via the command line[​](#repairing-via-the-command-line)
* XFS
* BTRFS
* ZFS
* Start the array in **Maintenance Mode**.
* Run the following command: `xfs\_repair /dev/mdXp1`. Replace `X` with the disk number (e.g., `/dev/md1p1`).
* For encrypted XFS, use: `/dev/mapper/mdXp1`.
* If you're prompted to use `-L`, re-run the command like this: `xfs\_repair -L /dev/mdXp1`. This is usually safe and necessary to complete the repair.
* For drives that are not part of the array: `xfs\_repair /dev/sdX1`.
caution
Running this command on an array disk outside of **Maintenance Mode** will invalidate parity.
After the repair
* Stop and restart the array in **Normal mode**.
* The drive should now mount and be accessible.
* If you see a `lost+found` folder, check its contents for any important files.
If you don't understand the repair output or if the process fails, share your diagnostics and repair log on the [Unraid forums](https://forums.unraid.net/) for further assistance.
* [Selecting a file system type](#selecting-a-file-system-type)
* [XFS](#xfs)
* [EXT4](#ext4)
* [ZFS](#zfs)
* [BTRFS](#btrfs)
* [NTFS and exFAT (limited support)](#ntfs-and-exfat-limited-support)
* [Setting a file system type](#setting-a-file-system-type)
* [Creating a file system (formatting)](#creating-a-file-system-formatting)
* [Changing a file system type](#changing-a-file-system-type)
* [Converting to a new file system type](#converting-to-a-new-file-system-type)
* [Reformatting a drive](#reformatting-a-drive)
* [Reformatting a cache drive](#reformatting-a-cache-drive)
* [BTRFS operations](#btrfs-operations)
* [Balance](#balance)
* [Scrub](#scrub)
* [Unassigned drives](#unassigned-drives)
* [Common uses for unassigned drives](#common-uses-for-unassigned-drives)
* [Using the Unassigned Devices plugins](#using-the-unassigned-devices-plugins)
* [Troubleshooting](#troubleshooting)
* [Drive shows as unmountable](#drive-shows-as-unmountable)
* [Checking a file system](#checking-a-file-system)
* [Repairing a file system](#repairing-a-file-system)