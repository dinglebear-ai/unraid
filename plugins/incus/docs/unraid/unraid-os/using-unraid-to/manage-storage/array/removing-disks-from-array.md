Removing disks from array | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
There may come a time when you want to remove a disk from your Unraid array. Whether you're looking to save on power, retire an old or unreliable drive, or repurpose hardware for a different use, the process is fairly straightforward.
## Removing parity disks[​](#removing-parity-disks)
If you find that you no longer need the level of parity protection in your setup, you can remove a parity disk whenever you want.
To remove a parity drive:
1. Stop the array.
2. Unassign the parity drive slot and set it to "Unassigned."
3. Start the array to commit the changes.
warning
Before you make any changes, please keep this in mind: If you already have any failed data drives in your array, removing a parity disk can decrease the number of failures Unraid can handle without risking data loss.
* With dual parity, you can recover from a single failed drive, but be aware that you won't be able to survive another failure during the rebuild process.
* With single parity, you lose all redundancy, meaning that any additional drive failures could result in data loss.
## Removing data disks[​](#removing-data-disks)
Removing a data disk requires a parity sync afterward. Until this sync completes, there's a risk of data loss if another disk fails.
### Standard method (Recommended)[​](#standard-method-recommended)
1. Stop the array.
2. Optionally document your disk assignments with a screenshot.
3. Reset the array configuration using **Tools → New Config**, choosing the option to preserve all current assignments.
4. Unassign the disk you want to remove.
5. Start the array, but do not check the "Parity is valid" box.
A parity sync starts if you have a parity disk assigned. The array is vulnerable to data loss until this sync completes.
tip
Move important data off the disk before removal. The parity sync process may take several hours depending on disk size and system activity.
### Parity-preserve method (Advanced)[​](#parity-preserve-method-advanced)
This method allows you to remove a data disk while keeping your parity valid. It zeros out the data disk, allowing you to keep your parity intact. This is only recommended for advanced users.
warning
This method erases all data on the selected disk. Verify that all important data has been moved before proceeding. There is no official support from LimeTech for this process.
To use the parity-preserve method:
1. Start the array in maintenance mode, click on the disk you want to remove, and then click **Erase**. This erases the file system from the device while maintaining parity, then stop the array.
2. Start the array in normal mode. The disk won't mount, but the remaining disks are online.
3. Record array assignments, especially the parity drive.
4. Optionally enable Reconstruct Write ("Turbo Write") in **Settings → Disk Settings** for faster zeroing, but only if all drives are healthy.
5. Unmount the disk: `umount /mnt/diskX`
6. Zero out the disk:
* For Unraid 6.12 or later: `dd bs=1M if=/dev/zero of=/dev/mdXp1 status=progress`
* For Unraid 6.11 and earlier: `dd bs=1M if=/dev/zero of=/dev/mdX status=progress`
Replace `X` with the specific number of the data disk you're removing.
* Stop the array once clearing is complete.
* Reset array configuration, retaining all current assignments.
* Unassign the disk you want to remove, double-checking all assignments, especially the parity drive.
* Check the box indicating "Parity is already valid."
* Start the array to finish the removal.
* Optionally run a correcting parity check afterward to ensure parity integrity.
* [Removing parity disks](#removing-parity-disks)
* [Removing data disks](#removing-data-disks)
* [Standard method (Recommended)](#standard-method-recommended)
* [Parity-preserve method (Advanced)](#parity-preserve-method-advanced)