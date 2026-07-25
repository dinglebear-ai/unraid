Arrays | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
Unraid's storage system combines flexibility with data protection through its array and cache architecture. The array manages your primary storage with optional parity protection, while cache pools accelerate performance.
## Driving principles[​](#driving-principles)
1. **Use your largest drives for parity** - Data disks can't be larger than your parity disks, so use your biggest drives for parity to avoid future expansion limits. If you use dual parity, both drives should be at least the size of your largest data disk, but they can be different sizes from each other. No disk can be larger than your smallest parity drive.
2. **Save SSDs for cache pools** - Unraid doesn't support TRIM/Discard for SSDs in the main array, which causes performance degradation over time. Use SSDs in cache pools or as unassigned devices instead, where these features work properly.
3. **Add a cache for better write performance** - A cache dramatically speeds up writes by temporarily storing data on fast drives before the Mover transfers it to the array (typically at 3:40 AM). Cached data still appears in your shares, so access feels instant while the transfer happens in the background.
4. **Use a cache pool for data protection** - A single cache device puts your cached data at risk until the Mover runs. Multiple devices in a cache pool provide redundancy and protect your data from cache device failures.
5. **SSDs excel for apps and VMs** - Applications and virtual machines benefit significantly from SSD speed. A cache pool with SSDs provides the perfect balance of speed, efficiency, and data protection for these workloads.
6. **Encryption is optional** - Encryption is disabled by default and requires reformatting drives (which erases data). If you need it, move data off the disk, change to an encrypted file system, format, then move data back. See [How to encrypt a drive in Unraid](/unraid-os/system-administration/secure-your-server/securing-your-data/#how-to-encrypt-a-drive-in-unraid) for details. Be aware that encryption complicates data recovery if something goes wrong.
Disk Recognition and Port Flexibility
Unraid identifies disks based on their serial numbers and sizes, not the specific SATA ports they're connected to. This means you can switch drives between different SATA ports without affecting their assignments in Unraid. This feature is particularly useful for troubleshooting hardware problems, like finding a faulty port or replacing unreliable power or SATA cables.
caution
Your array will not start if you assign or attach more devices than your license key allows.
## Start/Stop the array[​](#startstop-the-array)
When your system starts up, it usually powers up the array of disks automatically. However, if you've recently changed the disk setup, such as adding a new disk, the array will remain off to allow you to check your configuration.
caution
Keep in mind that you'll need to stop the array first to make any adjustments. Stopping it will fully stop all Docker containers and network shares, shut down or hibernate VMs, and your storage devices will be unmounted, making your data and applications inaccessible until you restart the array.
To start or stop the array:
1. Click on the **Main** tab.
2. Navigate to the **Array Operation** section.
3. Click **Start** or **Stop**. You may need to check the box that says "Yes, I want to do this" before proceeding.
## File system selection[​](#file-system-selection)
By default, new array drives will be formatted with XFS. If you want to use ZFS or BTRFS instead, select your preferred file system from the drop-down menu.
For detailed information about file system options, see [File systems](/unraid-os/using-unraid-to/manage-storage/file-systems/).
## Array operations[​](#array-operations)
Unraid provides several maintenance and configuration options for your storage array. Operations include:
* [Adding disks to array](/unraid-os/using-unraid-to/manage-storage/array/adding-disks-to-array/) - Expand storage capacity
* [Replacing disks in array](/unraid-os/using-unraid-to/manage-storage/array/replacing-disks-in-array/) - Upgrade or swap failed drives
* [Removing disks from array](/unraid-os/using-unraid-to/manage-storage/array/removing-disks-from-array/) - Decommission or reduce array size
* [Array health and maintenance](/unraid-os/using-unraid-to/manage-storage/array/array-health-and-maintenance/) - Monitor and maintain your array
## Array write modes[​](#array-write-modes)
Unraid provides various write modes for managing array operations, each with its own pros and cons regarding speed, power consumption, and drive wear. Knowing how these modes work, along with the role of a cache drive or pool, can help you fine-tune your server to best suit your needs.
**Write modes at a glance**
|Write ModeSpeed (Typical)Power usageWhen drives spin upData protectionBest use case|Read/Modify/Write20–40 MB/sLowOnly parity and target driveYesMost workloads, energy savings, small writes|Turbo Write (Reconstruct)40–120 MB/sHighAll drivesYesLarge file transfers, array rebuilds, parity checks|Cache Write (SSD/NVMe)50–110 MB/s (SSD), 250–900 MB/s (NVMe)\*VariesCache drives onlyNo (until moved)Apps, VMs, frequent writes, maximizing speed
### Read/Modify/Write[​](#readmodifywrite)
This is the default write mode. It reads the existing data and the parity, calculates the new parity, and then writes the updated data. Only the parity drive and the target data drive spin up, which results in lower power usage and less wear on the drives. However, it can be slower due to the additional read/write cycles.
Use this mode anytime, especially if you want energy savings and idle drives to spin down. It's great for small or infrequent writes.
### Turbo Write (Reconstruct write)[​](#turbo-write-reconstruct-write)
Turbo write, also known as reconstruct write, is a feature designed to boost the writing speed of your Unraid array. It works by reading all data drives and updating the parity simultaneously. This process eliminates the delays caused by waiting for the platters to rotate, as seen in the default write mode. However, all array drives need to be spinning and functioning properly for this to work effectively.
**How it works:** When you write new data, Unraid reads from all the other data drives and recalculates the parity at the same time. Both the new data and the updated parity get written together. All drives in the array must be operational and actively spinning.
**When to use:** Transferring large, sequential files to the array. During array rebuilds or parity checks, as all drives are already spinning. When minimizing write time is a priority and you can confirm all drives are healthy.
**When to avoid:** If you want your drives to spin down during idle times to conserve energy. For small or infrequent write operations since it causes all drives to spin up for every write, increasing power usage and wear. If you suspect any drive is failing or unreliable, since it relies on every drive being operational.
info
Turbo write is best suited for bulk operations and scenarios requiring high throughput. However, it might not be the best choice for everyday tasks if you're focused on energy savings and minimizing drive wear.
### Cache Write[​](#cache-write)
Data is written first to a fast SSD or NVMe cache and can then be moved to the main array later by a process called the Mover. The speeds vary: SSD: 50–110 MB/s; NVMe: 250–900 MB/s (which can utilize 10GbE networks). Once data is moved to the array, it is protected by parity.
**When to use:** For shares with frequent write operations like applications, virtual machines, or downloads. To enhance performance and reduce perceived write latency.
**Performance expectations:**
* Without a cache drive: Average 20–30 MB/s, with peaks up to 40 MB/s
* With SSD cache: 50–110 MB/s
* With NVMe cache: 250–900 MB/s depending on network or drive constraints
tip
Consider using a cache pool (multiple devices) for added redundancy and data protection before the Mover runs.
Automated Solutions
* The **Auto** mode (a future feature) will engage turbo write only when all drives are already spinning.
* Community plugins (search for "Turbo Write" in the Apps tab) may offer enhanced automation or scheduling options.
To change Write Mode:
1. Navigate to ***Settings → Disk Settings***.
2. Locate **Tunable (md\_write\_method)**.
3. Choose your preferred mode:
* **Read/Modify/Write** (default)
* **Reconstruct Write** (Turbo Write)
* **Auto** (future feature)
* Click **Apply** to confirm your choice.
Quick recap
* Use **Turbo Write** when you need speed, but be aware of increased power consumption and drive spin-up.
* Utilize **Cache Write** for optimal performance, particularly with SSD or NVMe drives.
* For most users, the default write mode offers the best balance unless you specifically need higher speeds.
## Read modes[​](#read-modes)
When using Unraid, the speed at which you can read files is mainly determined by the individual drive that holds each file. Unlike traditional RAID systems, which combine multiple drives to improve performance, Unraid stores each file on a single disk. This means read speeds won't be boosted by the combined speeds of multiple drives.
### Performance expectations[​](#performance-expectations)
* **Typical single HDD:** 70–250 MB/s (depends on drive model, age, and data location)
* **Typical SATA SSD:** 400–550 MB/s
* **NVMe SSD (in a pool):** 250–7,000 MB/s (PCIe generation and network/PCIe limitations apply; e.g., 10GbE network caps at \~1,100 MB/s)
Special cases
* If a disk is disabled and its data is being reconstructed, Unraid will use the remaining drives along with parity information to recreate the data. During this process, the read speed may slow down to 30–60 MB/s or even lower, depending on the slowest drive in your system.
* Any ongoing operations in the array, such as a parity check or rebuilding a drive, can also affect read performance. This is due to increased movement of the drive heads and overall contention for resources.
## Cache pools[​](#cache-pools)
Cache pools in Unraid provide significant advantages, particularly for write-heavy tasks, virtual machines (VMs), and Docker containers. These pools operate separately from the main array and can be set up with multiple drives using either the BTRFS or ZFS file system, supporting various RAID configurations for speed and data protection.
### Cache pools vs. the main array[​](#cache-pools-vs-the-main-array)
|FeatureCache pool (BTRFS)Cache pool (ZFS)Main array (Unraid)|**Read speed**SSD: 400–550 MB/s, NVMe: 250–7,000 MB/s\*SSD: 400–550 MB/s, NVMe: 250–7,000 MB/s\*HDD: 70–250 MB/s (per disk)|**Write speed**SSD: 400–550 MB/s, NVMe: 250–7,000 MB/s\*SSD: 400–550 MB/s, NVMe: 250–7,000 MB/s\*20–120 MB/s (parity mode dependent)|**Data protection**RAID 1/RAID 10; RAID 5/RAID 6 (experimental, not for critical data)RAID 1/RAID 10; RAIDZ1/RAIDZ2/RAIDZ3 (stable, production-ready)Parity-based, file system agnostic|**Expansion**Mix drive sizes; add/remove devices dynamicallyLimited add/remove device support; cannot remove from RAIDZ; single-device add to expand single-vdev RAIDZ in Unraid 7.2 (see [RAIDZ expansion](/unraid-os/using-unraid-to/manage-storage/cache-pools/#raidz-expansion))Add drives, but no striping or performance scaling|**Recovery complexity**Higher risk of data loss; BTRFS tools requiredHigher risk of data loss; ZFS tools requiredEasier parity-based rebuilds|**Best for**Apps, VMs, frequent writesApps, VMs, frequent writes, enterprise workloadsBulk storage, media libraries
\**Actual NVMe speeds depend on PCIe generation, cooling, and network bandwidth (e.g., 10GbE caps at \~1,100 MB/s).*
### Pros of cache pools[​](#pros-of-cache-pools)
* **Higher performance:** NVMe pools can saturate 10GbE/40GbE networks (1,100–3,500 MB/s).
* **Flexible RAID:** Both BTRFS and ZFS support RAID 1/RAID 10 for redundancy without matching drive sizes.
* **Low latency:** Ideal for databases, VMs, and Docker containers.
* **ZFS advantages:** ZFS provides enterprise-grade features like data integrity checking, compression, and snapshots.
### Cons of cache pools[​](#cons-of-cache-pools)
* **No parity protection:** Data is unprotected until moved to the array.
* **Recovery risks:** BTRFS RAID 5/RAID 6 is unstable; single-drive pools lack redundancy.
* **ZFS considerations:** ZFS requires more RAM and has stricter hardware requirements than BTRFS.
For more detailed information about cache pools, including how to set them up, manage them, and advanced features, check the [Cache pools](/unraid-os/using-unraid-to/manage-storage/cache-pools/) page.
* [Driving principles](#driving-principles)
* [Start/Stop the array](#startstop-the-array)
* [File system selection](#file-system-selection)
* [Array operations](#array-operations)
* [Array write modes](#array-write-modes)
* [Read/Modify/Write](#readmodifywrite)
* [Turbo Write (Reconstruct write)](#turbo-write-reconstruct-write)
* [Cache Write](#cache-write)
* [Read modes](#read-modes)
* [Performance expectations](#performance-expectations)
* [Cache pools](#cache-pools)
* [Cache pools vs. the main array](#cache-pools-vs-the-main-array)
* [Pros of cache pools](#pros-of-cache-pools)
* [Cons of cache pools](#cons-of-cache-pools)