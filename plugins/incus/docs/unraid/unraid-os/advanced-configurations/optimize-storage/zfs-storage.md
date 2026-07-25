ZFS storage | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
Special thanks
We’d like to express our thanks to Ed Rawlings ([Spaceinvader One](https://www.youtube.com/c/SpaceinvaderOne)) for the expertise and guidance that this ZFS storage documentation has been adapted from. His tutorials and insights have assisted countless Unraid users in mastering advanced storage techniques. We appreciate his continued contributions to the Unraid community.
ZFS brings advanced data integrity, flexible storage configurations, and high performance to your Unraid system. This guide explains ZFS core concepts and walks you through managing ZFS pools directly from the Unraid WebGUI. Whether you're setting up new ZFS storage or integrating an existing pool, you’ll find the steps and context you need to get started confidently.
## Why ZFS?[​](#why-zfs)
ZFS is a modern file system and volume manager designed to protect your data, prevent corruption, and simplify storage management.
With ZFS, you gain:
* Automatic data integrity checks and self-healing
* Built-in RAID support (mirrors, RAIDZ)
* Snapshots and clones for easy backups and rollbacks
* ZFS send/receive for efficient replication
* On-the-fly compression
Unraid supports ZFS for any storage pool. You can create a new ZFS pool, import one from another system, or use Unraid’s unique hybrid ZFS setup: add a ZFS-formatted disk directly to the Unraid array (not a pool) and combine ZFS features with Unraid’s parity protection.
Example
You can use ZFS snapshots and replication on a single disk as a backup target, or replicate a fast SSD ZFS pool to a ZFS disk in the array protected by Unraid parity - getting the best of both worlds.
note
The hybrid ZFS-in-array approach is helpful for specific backup or replication scenarios but is not a replacement for a full ZFS pool. ZFS disks in the array are managed individually; you do not get the combined performance, redundancy, or self-healing of a true multi-disk ZFS pool. For full ZFS functionality, always use dedicated ZFS pools.
### Pools, vdevs, and redundancy[​](#pools-vdevs-and-redundancy)
A ZFS pool (called a "zpool") is made up of one or more vdevs (virtual devices). Each vdev is a group of physical disks with its own redundancy level. ZFS writes data across vdevs, but each vdev is responsible for its fault tolerance.
caution
Redundancy is always per vdev. If any vdev fails, the entire pool fails, even if other vdevs are healthy. Plan your vdevs with care!
## Creating a ZFS pool[​](#creating-a-zfs-pool)
To create a ZFS pool using the WebGUI:
1. Stop the array.
2. Click **Add Pool**.
1. Choose a name for your pool (for example, `raptor`).
2. Set the number of slots to match the number of disks you want in your primary data vdev(s).
note
This initial slot count is for data vdevs only. Support vdevs (such as log or cache drives) can be added separately after creating the pool.
1. Assign disks to the pool (disk order does not matter).
1. Click the pool name (e.g., `raptor`) to open its configuration screen.
2. Set the file system type to `zfs` or `zfs-encrypted` (for LUKS encryption).
1. Choose your allocation profile - this determines your pool's redundancy and performance.
tip
Before finalizing, review the sections on allocation profiles and topology to make an informed choice.
1. Enable compression if desired (recommended for most workloads).
2. Click **Done**, then start the array.
## Adding a ZFS disk to the array (Hybrid setup)[​](#adding-a-zfs-disk-to-the-array-hybrid-setup)
You can add a standalone ZFS disk to your Unraid array (not a ZFS pool) to combine ZFS features with Unraid's parity protection.
What this enables
* **Parity protection:** The ZFS disk is protected by Unraid’s array parity, ensuring your data is safe from single (or multiple, depending on your parity drives) disk failures.
* **Data integrity:** ZFS provides block-level integrity checks (checksums). While a single disk can’t self-heal bit rot, ZFS will detect corruption and alert you, allowing you to restore from backup before silent data loss occurs.
* **ZFS features:** You can utilize ZFS snapshots and replication on this disk, making it ideal for backup targets, specific datasets, or scenarios where you want ZFS features alongside traditional Unraid storage.
To add a ZFS disk to the array:
1. Go to the **Main** tab in the WebGUI.
2. Stop the array.
3. Click on an empty slot under **Array Devices**.
4. Select the disk you want to add.
1. Under **File system**, choose `zfs` or `zfs-encrypted`.
1. Click **Apply**.
2. Start the array and let the disk be formatted if needed.
## Choosing an allocation profile[​](#choosing-an-allocation-profile)
When you set up a ZFS pool, your allocation profile determines how your data is protected, how your pool performs, and how you can expand it. Here’s a simple comparison to help you decide which profile fits your needs:
|ProfileRedundancyPerformanceExpansionSpace EfficiencyTypical Use CaseRecommended Drive Count Per vdev|StripeNoneFast, but riskyAdd more disks100%Temporary/scratch storageAny number|Mirror1:1 (RAID 1 style)Excellent for random I/OAdd more mirrors50%High performance, easy expansion2 drives (can add more mirrors)|RAIDZ11 disk per vdevFast for big files. Not ideal for small or random writes.Add new vdevsHighGeneral use, 1-disk fault tolerance3-6 drives (max 8)|RAIDZ22 disks per vdevLike Z1 but slightly slower writes (extra parity)Add new vdevsModerateImportant data, 2-disk fault tolerance6-12 drives (max 14)|RAIDZ33 disks per vdevLike Z2, with more write overhead (for maximum safety)Add new vdevsLowerMission-critical, 3-disk fault tolerance10-16 drives (max 20)
Optimizing drive counts
The recommended drive counts in the table above work well for most users. For even better performance, you can optimize within those ranges by choosing configurations where the number of data disks (total disks minus parity disks) is a **power of 2** (e.g., 2, 4, 8, 16). This helps align data stripes correctly, preventing wasted space and uneven I/O.
**Examples of optimized configurations:**
* **RAIDZ1**: 3, 5, or 9 drives (data disks = 2, 4, or 8)
* **RAIDZ2**: 4, 6, or 10 drives (data disks = 2, 4, or 8)
* **RAIDZ3**: 5, 9, or 17 drives (data disks = 2, 6, or 14)
Note that these optimizations are optional - the recommendations above should work well for most use cases.
How to choose
* Use **Mirror** if you want the best performance and easy, flexible expansion, and are okay with using more disk space for redundancy.
* Choose **RAIDZ1/2/3** if you want to maximize usable space and store large files, but keep in mind that expansion is less flexible, and random write performance is lower.
* **Stripe** is only suitable for non-critical, temporary data - if any disk fails, you lose everything.
## Topology and expansion[​](#topology-and-expansion)
How you group disks into vdevs affects both data safety and speed.
* If you put all your disks into a large RAIDZ2 vdev, you can lose any two disks without losing data. However, expansion means adding another full vdev.
* You'll gain better parallel performance if you split disks into multiple smaller RAIDZ1 vdevs. Be cautious; if two disks fail in the same vdev, you will lose the whole pool.
* ZFS stripes data across vdevs, not individual disks, so more vdevs can lead to better performance for workloads with many small files or random I/O.
* Expanding a ZFS pool usually means adding a new vdev of the same layout, not just a single disk.
tip
Plan your pool’s layout to fit your needs and future growth. Unlike the Unraid array, you can’t add a single disk to an existing vdev using the WebGUI.
## Compression and RAM[​](#compression-and-ram)
ZFS offers advanced features that can significantly improve Unraid's storage efficiency and performance. Two common topics of interest are compression and memory requirements.
ZFS compression is transparent - it operates in the background, shrinking data before it reaches the disk.
This offers two major benefits:
* **Reduced disk usage:** Less storage space is consumed.
* **Improved performance:** Writing and reading less data can lead to faster operations, especially on modern CPUs.
tip
Enable ZFS compression for most Unraid ZFS pools. It's safe, efficient, and rarely impacts compatibility or stability.
**The ZFS RAM Myth** - Click to expand/collapse
You might have come across the outdated advice: “ZFS requires 1 GB of RAM per 1 TB of storage.” This is no longer applicable for most users. ZFS utilizes RAM for its Adaptive Replacement Cache (ARC), which speeds up frequently accessed reads.
Unraid automatically limits ZFS to using a reasonable portion of your system's RAM (usually 1/8th of total RAM). This allows ZFS to perform well without affecting Docker containers, VMs, or the Unraid OS.
info
ZFS scales well with available memory. More RAM can enhance cache performance, but ZFS functions reliably with modest hardware. Don’t let old recommendations prevent you from using ZFS on Unraid.
## Importing ZFS pools created on other systems[​](#importing-zfs-pools-created-on-other-systems)
Unraid can import ZFS pools created on other platforms with minimal hassle.
**How to import a ZFS pool** - Click to expand/collapse
1. **Stop the array:** Ensure your Unraid array is stopped.
2. **Add new pool:** Click **Add Pool**.
3. **Assign all drives:**
* Set **Number of Data Slots** to the total number of drives in your ZFS pool (including data vdevs and support vdevs).
* Assign each drive to the correct slot.
* *Example:* For a pool with a 4-drive mirrored vdev and a 2-drive L2ARC vdev, set 6 slots and assign all six drives.
* **Set file system to "Auto":** Click the pool name (e.g., `raptor`) and set **File System** to **Auto**.
* **Finish and start array:** Click **Done**, then start the array.
Automatic detection
Unraid will automatically detect and import the ZFS pool. Support vdevs (like log, cache/L2ARC, special/dedup) are listed under **Subpools** in the WebGUI. There is no need to add subpools separately after initiating the import. Unraid will automatically import them alongside the main data disks when all required drives are assigned.
After importing, running a scrub is highly recommended to verify data integrity.
* Click the pool name (e.g., `raptor`) to open its configuration.
* Under **Pool Status**, check the status and click **Scrub**.
## Support vdevs (subpools)[​](#support-vdevs-subpools)
Unraid refers to ZFS support vdevs as subpools. Most users do **not** need these, but advanced users may encounter them:
|Support vdev (subpool)PurposeRisk/Notes|Special vdevStores metadata and small filesThe pool becomes unreadable if lost.|Dedup vdevEnables deduplicationRequires vast amounts of RAM; risky for most users. Avoid unless you have expert needs.|Log vdev (SLOG)Improves sync write performanceOptional. Only beneficial for certain workloads.|Cache vdev (L2ARC)Provides SSD-based read cacheOptional. Can improve read speeds for large working sets.|Spare vdevNot supported in Unraid (as of 7.1.2)
caution
Most Unraid users should avoid support vdevs/subpools unless you have a specific and well-understood need. They are designed for specialized workloads and can introduce complexity or risk if misused.
## Critical support vdev drives not assigned during import[​](#critical-support-vdev-drives-not-assigned-during-import)
When you import a ZFS pool into Unraid, you need to assign every drive from your original pool, including those used for support vdevs, to the pool slots. Unraid will automatically recognize each drive’s role (data, log, cache, special, or dedup) once the array starts. You don’t need to specify which drive serves what purpose manually.
If you forget to include a drive that was part of a support vdev during the import, the outcome will depend on the vdev’s function:
|Vdev typeIf drive is missing during importResult|Special vdev or dedup vdevPool will not import or will be unusableThese vdevs store critical metadata or deduplication tables. Without them, ZFS cannot safely mount the pool.|Log (SLOG) vdevPool imports, but sync write performance drops.The pool remains accessible, but you may notice slower performance for workloads that rely on sync writes.|Cache (L2ARC) vdevPool imports, but read cache is lostThe pool works normally, but you lose the performance boost from the L2ARC cache. No data is lost.
tip
Always assign every physical drive from your original ZFS pool, including all support vdevs, when importing into Unraid. This ensures smooth detection and integration. For new pools created in Unraid, support vdevs are optional and generally not needed for most users.
## Expanding storage[​](#expanding-storage)
ZFS is powerful, but it's important to understand how its storage expansion works - especially if you’re planning for future growth.
Historically, ZFS vdevs have a fixed width. You can’t add a disk to an existing RAIDZ vdev to make it larger.
Ways to expand your pool include:
* **Adding a new vdev:** Grow your pool by adding another vdev (like a new mirror or RAIDZ group). This increases capacity, but you must add disks in sets that match the vdev’s configuration.
* **Replacing drives with larger ones:** Swap each drive in a vdev, one at a time, for a larger disk. See [drive replacement](/unraid-os/using-unraid-to/manage-storage/array/replacing-disks-in-array/#replacing-faileddisabled-disks) for detailed procedures. After all drives are replaced and the pool resolves, the vdev's capacity increases.
* **Creating a new pool:** Starting a new ZFS pool keeps things organized and independent for different data types or workloads.
Planning ahead
Before building your pool, consider how much storage you’ll need - not just today, but in the future. ZFS rewards good planning, especially if you want to avoid disruptive upgrades later.
## Using ZFS pools on an existing Unraid server[​](#using-zfs-pools-on-an-existing-unraid-server)
If you're running a traditional Unraid array and want to add ZFS pools, here are some effective ways to integrate them:
|Use caseDescriptionDetails / Examples|Fast SSD/NVMe pool for appdata & DockerStore the appdata share for fast, responsive containers and databases. This supports snapshots for easy rollbacks and can also host VMs for high I/O.Many users choose a 2-drive ZFS mirror for this. It's easy to expand and delivers strong performance.|ZFS pool for important dataUse a ZFS mirror or RAIDZ2 pool for irreplaceable files like photos, tax records, and user share data. ZFS checks for corruption and self-heals with redundancy.This setup protects critical data with automatic integrity checks and self-healing capabilities.|Daily backup or replication targetUse a ZFS disk (even within the Unraid array) as a replication target. You can replicate other pools locally or from another Unraid server.Utilize `zfs send/receive` or tools like Syncoid for fast and reliable backups and restores.|Snapshot-based recovery poolKeep point-in-time snapshots of critical data or containers. snapshots can be auto-scheduled and are space-efficient.This feature enables quick recovery from accidental deletions or misconfigurations.
## Avoiding common ZFS mistakes[​](#avoiding-common-zfs-mistakes)
ZFS is a powerful file system, but there are several common pitfalls that can undermine its benefits. It’s important to keep the following points in mind before configuring your pool for a smoother experience:
* **Drive size mismatch in RAIDZ:** ZFS treats all disks in a RAIDZ vdev as the size of the smallest one. To ensure the best efficiency, always use identically sized drives within each vdev.
* **Expanding RAIDZ vdevs via the WebGUI:** RAIDZ expansion is available via the WebGUI in Unraid 7.2 and later. Earlier versions (7.1.x) supported expansion via CLI only. For step-by-step instructions, see [RAIDZ expansion](/unraid-os/using-unraid-to/manage-storage/cache-pools/#raidz-expansion).
* **ZFS disk vs. full zpool:** A single ZFS-formatted disk in the Unraid array does not offer the redundancy or features of a dedicated ZFS pool. To leverage advanced functionality, use standalone pools.
* **Deduplication without adequate RAM:** Deduplication requires significant memory, and enabling it without enough RAM can severely impact performance. Only enable deduplication if you fully understand the requirements.
* **Vdev redundancy is local:** Redundancy in ZFS is local to each vdev and not shared across the pool. Make sure to plan your vdev layout to achieve the level of resilience you need.
* [Why ZFS?](#why-zfs)
* [Pools, vdevs, and redundancy](#pools-vdevs-and-redundancy)
* [Creating a ZFS pool](#creating-a-zfs-pool)
* [Adding a ZFS disk to the array (Hybrid setup)](#adding-a-zfs-disk-to-the-array-hybrid-setup)
* [Choosing an allocation profile](#choosing-an-allocation-profile)
* [Topology and expansion](#topology-and-expansion)
* [Compression and RAM](#compression-and-ram)
* [Importing ZFS pools created on other systems](#importing-zfs-pools-created-on-other-systems)
* [Support vdevs (subpools)](#support-vdevs-subpools)
* [Critical support vdev drives not assigned during import](#critical-support-vdev-drives-not-assigned-during-import)
* [Expanding storage](#expanding-storage)
* [Using ZFS pools on an existing Unraid server](#using-zfs-pools-on-an-existing-unraid-server)
* [Avoiding common ZFS mistakes](#avoiding-common-zfs-mistakes)