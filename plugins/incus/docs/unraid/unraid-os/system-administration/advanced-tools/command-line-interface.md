Command line interface | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
While most tasks in Unraid can be performed through the WebGUI, certain operations - especially those related to diagnostics, drive management, or scripting - require using the system console or SSH terminal. This page offers Unraid-specific command-line tools and examples that can be used without needing extensive Linux knowledge.
Device paths
Many disk-level Unraid operations depend on Linux device names, like `/dev/sdX`. You can find the device identifier for any drive in the **Main** tab of the WebGUI. Look for the three-letter label `sdX` or `nvmeX` next to each disk. Use the appropriate identifier in all commands, replacing `sdX` with your specific disk.
## Accessing the terminal[​](#accessing-the-terminal)
Unraid includes a built-in web terminal that you can access directly from the WebGUI. Simply use the top-right dropdown menu and select "\>\_". This opens a command-line session as the root user, giving you full administrative access to your system.
You can also connect to your Unraid server externally using SSH (secure shell) with a client like PuTTY.
When should I use the terminal?
Terminal access is useful for:
* Running diagnostics and command-line tools like `smartctl`, `xfs\_repair`, `tail`, or `top`
* Executing plugin scripts or tools that don't require a user interface
* Troubleshooting issues related to connectivity, system services, or user shares
### Using PuTTY (Windows only)[​](#using-putty-windows-only)
If you're using Windows, you might prefer PuTTY for SSH access instead of the built-in terminal. It's lightweight, free, and allows you to save sessions for easy access later.
**How to install and use PuTTY** - Click to expand/collapse
**View drive information:**
```
`
hdparm -I /dev/sdX
`
```
This displays the model, firmware, cache size, and supported features, which helps verify disk type and controller behavior.
### `smartctl`[​](#smartctl)
This command runs SMART diagnostics and monitors drive health.
**View smartctl options** - Click to expand/collapse
**Basic SMART report:**
```
`
smartctl -a /dev/sdX
`
```
If this command returns an error, try specifying the device type: `smartctl -a -d ata /dev/sdX` (use `-d nvme` for NVMe drives).
**Start SMART self-tests:**
Short test (takes a few minutes)
```
`
smartctl -t short /dev/sdX
`
```
Extended test (may take hours)
```
`
smartctl -t long /dev/sdX
`
```
**Save SMART report to a file:**
```
`
smartctl -a /dev/sdX \> /boot/smart\_report.txt
`
```
This saves the report to your Unraid boot drive for later review or sharing on the [forums](https://forums.unraid.net/).
### `diskspeed.sh`[​](#diskspeedsh)
This script allows for comprehensive surface-level performance testing with visual reports.
**View diskspeed.sh usage** - Click to expand/collapse
This used to be a script you would download from the Unraid forums. DiskSpeed is available now in a more refined package:
Install DiskSpeed from [Community Applications](/community-applications/) (***Apps tab***) by searching for "DiskSpeed", or visit the [GitHub repository](https://github.com/jbartlett777/DiskSpeed) for manual installation instructions.
## System monitoring[​](#system-monitoring)
Use these commands to monitor memory, processes, and system performance when the WebGUI is unavailable or for more detailed diagnostics.
### `top`[​](#top)
This command provides a real-time process and resource monitor.
**View top usage** - Click to expand/collapse
```
`
top
`
```
* Displays CPU and memory usage for each process in real-time.
* Press `q` to exit.
* Use arrow keys to scroll, and `k` to terminate processes.
tip
Consider using `htop` for a more user-friendly interface with enhanced controls.
### `free`[​](#free)
This command shows memory usage statistics.
**View free usage** - Click to expand/collapse
```
`
free -h
`
```
This displays RAM usage in a human-readable format. The `-h` flag means sizes will show in KB, MB, or GB instead of bytes.
Understand the output
A low "available" memory reading doesn't necessarily indicate a problem—Linux aggressively caches data for performance.
### `ps`[​](#ps)
Use this command to display running processes with detailed information.
**View ps options** - Click to expand/collapse
**List all processes with full details:**
```
`
ps aux
`
```
**Sort by memory usage:**
```
`
ps aux --sort=-%mem | head -20
`
```
**Sort by CPU usage:**
```
`
ps aux --sort=-%cpu | head -20
`
```
## Storage utilities[​](#storage-utilities)
These commands help check disk usage, partition info, and identify storage devices.
### `df`[​](#df)
This command displays filesystem disk space usage.
**View df usage** - Click to expand/collapse
```
`
df -h
`
```
This command displays the used and available space on all mounted file systems. It’s convenient for checking `/var/log` (which utilizes RAM-based logging) in Unraid. For more information on [system logging](/unraid-os/troubleshooting/diagnostics/capture-diagnostics-and-logs/).
### `fdisk`[​](#fdisk)
View disk partition tables and geometry.
**View fdisk usage** - Click to expand/collapse
```
`
fdisk -l /dev/sdX
`
```
This command displays the partition layout, sizes, and disk geometry. It helps troubleshoot mismatched disk sizes, especially when [replacing disks](/unraid-os/using-unraid-to/manage-storage/array/replacing-disks-in-array/).
### `lsblk`[​](#lsblk)
List all block devices in tree format.
**View lsblk usage** - Click to expand/collapse
```
`
lsblk
`
```
This command displays all storage devices, along with their mount points, in a straightforward tree structure. It’s great for getting an overview of your storage layout.
### `blockdev -getsz`[​](#blockdev--getsz)
Helps determine if a replacement drive has enough space before rebuild.
**View blockdev usage** - Click to expand/collapse
**Syntax:**
```
`
blockdev --getsz /dev/sdX
`
```
Returns the raw number of 512-byte sectors on a device - handy for confirming that a replacement drive is large enough before rebuilding.
### `blkid`[​](#blkid)
Identify filesystem labels.
**View blkid usage** - Click to expand/collapse
**Syntax:**
```
`
blkid /dev/sdX1
`
```
Outputs the filesystem type and label. Use this instead of the deprecated `vol\_id` command when verifying that the Unraid boot volume is labeled `UNRAID`.
## Network diagnostics[​](#network-diagnostics)
Tools for troubleshooting network connectivity and interface configuration.
### `ss`[​](#ss)
Display socket statistics and network connections. This is the modern replacement for `netstat`.
**View ss options** - Click to expand/collapse
**Show all listening ports:**
```
`
ss -tuln
`
```
* `-t`: TCP sockets
* `-u`: UDP sockets
* `-l`: Only show listening sockets
* `-n`: Show port numbers instead of service names
**Show established connections:**
```
`
ss -tup
`
```
This command shows active connections along with process information.
### `ip`[​](#ip)
Configure and display network interface information. This is the modern replacement for `ifconfig`.
**View ip options** - Click to expand/collapse
**Show all network interfaces:**
```
`
ip addr show
`
```
**Show network interfaces with colors:**
```
`
ip -c addr show
`
```
**Show routing table:**
```
`
ip route show
`
```
### `ping`[​](#ping)
Test network connectivity.
**View ping usage** - Click to expand/collapse
**Test connectivity by sending a limited number of packets:**
```
`
ping -c 4 google.com
`
```
This command sends four packets to the destination and stops, making it suitable for basic connectivity testing without continuous output.
### `ethtool`[​](#ethtool)
Handy tool for querying and adjusting network interface card (NIC) parameters, such as link speed, offload features, and statistics.
**View ethtool usage** - Click to expand/collapse
**Basic driver and firmware info:**
Use this command to get information about the driver and firmware for your network interface:
```
`
ethtool -i eth0
`
```
**Show current link speed and settings:**
To check the current link speed and settings of your interface, run:
```
`
ethtool eth0
`
```
**Display extended interface statistics:**
For extended statistics related to the interface, use the following command:
```
`
ethtool -S eth0
`
```
These commands can help you confirm the negotiation speeds for gigabit, 2.5 GbE, or 10 GbE connections, diagnose issues with cables, or identify dropped packets that might arise from offload mismatches.
## System information[​](#system-information)
Get detailed information about hardware, kernel, and overall system configuration.
* CPU info
* Memory info
* Storage info
**CPU architecture summary:**
```
`
lscpu
`
```
This command displays information about cores, threads, virtualization support, and cache details.
**Feature detection:**
```
`
grep -E 'lm|vmx|svm' /proc/cpuinfo
`
```
* `lm`: Indicates 64-bit support
* `vmx`: Intel VT-x virtualization
* `svm`: AMD-V virtualization
## System maintenance[​](#system-maintenance)
Commands for system shutdown, log monitoring, and service management.
### `tail`[​](#tail)
Monitor log files in real-time.
**View tail usage** - Click to expand/collapse
```
`
tail -f /var/log/syslog
`
```
This command shows live updates from the system log. To exit, use `Ctrl+C`.
**Show a specific number of lines:**
```
`
tail -n 50 /var/log/syslog
`
```
### `powerdown`[​](#powerdown)
Safely shut down the system.
**View powerdown usage** - Click to expand/collapse
```
`
powerdown
`
```
This command utilizes Unraid's built-in shutdown process to stop the array and power down the system safely. It's preferred over manual shutdown methods.
## File transfer operations[​](#file-transfer-operations)
These methods help you transfer files from external network shares (Windows or Linux SMB/CIFS shares) to your Unraid server using command-line tools and built-in utilities.
### Using Midnight Commander (built-in)[​](#using-midnight-commander-built-in)
Unraid includes **Midnight Commander** (`mc`), a text-based, dual-pane file manager accessible through the web terminal.
1. Open the web terminal. You can find this option in the top-right menu of the Unraid WebGUI.
2. Launch Midnight Commander:
```
`
mc
`
```
This interface offers drag-and-drop navigation between local shares and mounted network paths.
3. Mount a network share (if it's not already mounted):
```
`
# Create a temporary mount point
mkdir /work
`
```
```
`
# 1) Interactive prompt (recommended for one-off mounts)
mount -t cifs //workstation/share /work -o username=youruser,iocharset=utf8
# You will be prompted for the password interactively.
`
```
```
`
# 2) Use a credentials file (recommended for scripts/automation)
# Create /root/.cifscredentials with the following content:
# username=youruser
# password=yourpassword
# Then protect the file and mount using:
chmod 600 /root/.cifscredentials
mount -t cifs //workstation/share /work -o credentials=/root/.cifscredentials,iocharset=utf8
`
```
* Replace `workstation`, `share`, and `youruser` with the appropriate values.
* The `iocharset=utf8` option helps maintain international filenames.
**Security note:** Do not pass passwords on the command line (e.g. `password=...`).
Command arguments can be recorded in shell history and are visible to other local
users via process listings; prefer interactive prompts or a credentials file
protected with `chmod 600`.
* Use the MC panes to transfer files between `/work` (the network share) and any `/mnt/user/` or `/mnt/diskX` share.
* Clean up afterward:
```
`
umount /work
rmdir /work
`
```
Midnight Commander runs entirely within the built-in system, requiring no additional installation. It's suitable for most transfer needs, including those involving Unicode filenames, and it preserves file attributes when both source and destination support them.
### Using Krusader[​](#using-krusader)
If you prefer a graphical user interface, you can use Docker containers like [Krusader](<https://unraid.net/community/apps?q=krusader#r:~:text=batch renaming, etc.-,Krusader,-Productivity, Tools>) as a third-party solution.
1. Install Krusader:
* Navigate to the **Apps** tab (Community Applications).
* Search for and install the **Krusader** Docker container.
* Start the container and access its WebUI from the **Docker** tab.
* Connect to remote shares within Krusader, and use drag-and-drop or copy-paste to transfer files between the network share and your Unraid array.
info
Other popular file manager containers include [**Double Commander**](<https://unraid.net/community/apps?q=double+commander#r:~:text=of 1 App-,doublecommander,-Tools / Utilities,>) and [**CloudCommander**](<https://unraid.net/community/apps?q=cloudcommander#r:~:text=of 1 App-,CloudCommander,-Tools / Utilities,>), both available through Community Applications.
### Command-line methods[​](#command-line-methods)
For advanced users or those using automation, you can also utilize command-line transfer methods.
**View command-line transfer instructions** - Click to expand/collapse
1. Open the terminal (Web Terminal or SSH as `root`).
2. Create and mount a network share:
```
`
mkdir /work
`
```
```
`
# 1) Interactive prompt (recommended for one-off mounts)
mount -t cifs //workstation/share /work -o username=youruser,iocharset=utf8
# You will be prompted for the password interactively.
`
```
```
`
# 2) Use a credentials file (recommended for scripts/automation)
# Create /root/.cifscredentials with the following content:
# username=youruser
# password=yourpassword
# Then protect the file and mount using:
chmod 600 /root/.cifscredentials
mount -t cifs //workstation/share /work -o credentials=/root/.cifscredentials,iocharset=utf8
`
```
**Security note:** Do not pass passwords on the command line. Use an
interactive prompt or a credentials file with strict permissions instead.
1. Copy files:
* You can use `cp`:
```
`
cp -r /work/\* /mnt/disk1
`
```
* Or, use `rsync` for detailed progress:
```
`
rsync -av --progress /work/ /mnt/disk1/
`
```
* Unmount and remove the temporary directory:
```
`
umount /work
rmdir /work
`
```
caution
When transferring files with special or international characters, always mount the share with the `iocharset=utf8` option. Failing to do so may result in incorrect filenames or unreadable files on other platforms.
Also, if you copy files as `root` via terminal, they may have restrictive permissions. If this occurs, use the **New Permissions** tool from the **Tools** menu in the WebGUI or the **Docker Safe New Perms** if you're dealing with Docker-involved shares to reset permissions, ensuring all users have network access.
* [Accessing the terminal](#accessing-the-terminal)
* [Using PuTTY (Windows only)](#using-putty-windows-only)
* [`smartctl`](#smartctl)
* [`diskspeed.sh`](#diskspeedsh)
* [System monitoring](#system-monitoring)
* [`top`](#top)
* [`free`](#free)
* [`ps`](#ps)
* [Storage utilities](#storage-utilities)
* [`df`](#df)
* [`fdisk`](#fdisk)
* [`lsblk`](#lsblk)
* [`blockdev -getsz`](#blockdev--getsz)
* [`blkid`](#blkid)
* [Network diagnostics](#network-diagnostics)
* [`ss`](#ss)
* [`ip`](#ip)
* [`ping`](#ping)
* [`ethtool`](#ethtool)
* [System information](#system-information)
* [System maintenance](#system-maintenance)
* [`tail`](#tail)
* [`powerdown`](#powerdown)
* [File transfer operations](#file-transfer-operations)
* [Using Midnight Commander (built-in)](#using-midnight-commander-built-in)
* [Using Krusader](#using-krusader)
* [Command-line methods](#command-line-methods)