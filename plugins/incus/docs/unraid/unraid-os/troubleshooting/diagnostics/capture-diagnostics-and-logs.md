Capturing diagnostic information | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
When you have issues with your Unraid server, gathering detailed information is crucial for effective troubleshooting. This information helps others provide accurate and timely assistance, especially when you post in forums.
Diagnostics include...
The diagnostics zip file contains several anonymized text files that create a detailed snapshot of your Unraid system, including:
* **System configuration**: Information about your array, shares, network settings, and installed plugins.
* **System logs**: Logs from the kernel, WebGUI, and system services, documenting events that may have led to the issue.
* **Hardware information**: Details about connected drives, controllers, and other hardware components.
* **Docker and VM info**: Overall configuration for Docker and virtual machines (no information about your individual containers or VMs is included).
## System diagnostics[​](#system-diagnostics)
Unraid provides a **Diagnostics** tool located under ***Tools → Diagnostics*** in the WebGUI to capture comprehensive system information for troubleshooting. This tool will generate a zip file you can download and attach to forum posts for support. All diagnostics files are text-based, and users can review them to understand what information is included.
|ScenarioHow to captureNotes|WebGUI availableUse ***Tools → Diagnostics*** in the **WebGUI** to generate and download the diagnostics zip file.Diagnostics are anonymized by default to protect sensitive data.|WebGUI not availableAccess via **SSH**, telnet, or direct console to run the `diagnostics` command. The zip file saves to `/boot/logs`.Always capture diagnostics before rebooting to keep logs intact.|Array started in normal modeThis is the preferred method for capturing diagnostics, as it provides the most complete information, especially about drive status.If this isn't possible, see the [Persistent logs section](#persistent-logs-syslog-server) for alternative capture methods.
important
Attach the single diagnostics zip file when posting on forums - avoid uploading the extracted files individually.
### Anonymization of diagnostic data[​](#anonymization-of-diagnostic-data)
By default, diagnostics are automatically anonymized. If you enable Mover logging under ***Settings → Scheduler → Mover Settings***, the syslog will include details about files the Mover processes. It's best to allow Mover logging only when troubleshooting specific Mover-related issues, as it may reveal file paths and names.
When your system shuts down gracefully, the session log is saved automatically to the boot device. You can access it after rebooting by going to ***Tools → Syslog → syslog-previous***. This log is also included in diagnostics on the next boot. However, if the system crashes, the system log will be lost. In these cases, enabling syslog mirroring to the boot device or using a remote syslog server is recommended to preserve logs for troubleshooting.
## Testing drive read performance[​](#testing-drive-read-performance)
You can use built-in Linux tools to evaluate the read performance of your hard drives. This is helpful when diagnosing slow parity syncs, sluggish disk responses, or mismatched speeds among drives in an array or cache.
When and why to test drive speed
Consider running disk read benchmarks if you experience:
* Extremely slow parity builds or parity checks
* Suspiciously slow file transfers from a specific disk
* Drive mismatches after adding or replacing disks, particularly when mixing SSDs and HDDs
* Reallocated sectors or UDMA CRC errors, which may indicate failing drives
While these tests won’t give you exact real-world file transfer speeds, they can point out underperforming disks and any controller bottlenecks.
### Quick test (hdparm)[​](#quick-test-hdparm)
The `hdparm` tool measures both cached and buffered read speeds of a disk.
To run the test, replace `X` with your disk device (like `sdb` or `sdg`) and enter the following command:
```
`
hdparm -tT /dev/sdX
`
```
* The `-T` result shows the cache read speed.
* The `-t` result shows the buffered (sequential) disk read performance.
tip
Run this test multiple times to get a more reliable benchmark. For example, you can use the following one-liner to run the test 12 times:
```
`
for ((i=0;i\<12;i++)); do hdparm -tT /dev/sdX; done
`
```
note
Make sure to replace `/dev/sdX` with a valid physical device. Avoid logical Unraid devices, such as `/dev/md1`, which include parity processes that may distort the raw performance readings.
### Comprehensive test (DiskSpeed)[​](#comprehensive-test-diskspeed)
For a more detailed assessment of all attached drives, including parity and data drives, consider using DiskSpeed.
DiskSpeed:
* Tests read speeds at multiple linear offsets across the disk surface
* Generates CSV data and performance heat maps (images)
* Can identify zones of poor performance, which might be a sign of failing hardware or problematic SMR drives
To get started with DiskSpeed:
1. Install DiskSpeed from [Community Applications](/community-applications/) (***Apps tab***) by searching for "DiskSpeed".
2. For manual installation instructions, visit the [DiskSpeed GitHub repository](https://github.com/jbartlett777/DiskSpeed).
note
DiskSpeed performs read-only tests for hard drive benchmarks. SSD benchmarks may write temporary benchmark files, so review DiskSpeed's guidance before testing SSDs. Schedule benchmarks during idle periods, as they may affect disk I/O and interfere with array performance.
## Persistent logs (syslog server)[​](#persistent-logs-syslog-server)
Persistent logs are essential for keeping a record of system events between reboots. Unlike standard logs that reset when the system restarts, persistent logs use Unraid's built-in syslog server to ensure you can diagnose crashes or intermittent issues that arise over time.
### Choosing the right logging method[​](#choosing-the-right-logging-method)
Go to ***Settings → Syslog Server*** to set up persistent logging. Each method has advantages and disadvantages:
|MethodProsConsBest for|**Mirror syslog to boot drive**Captures boot process eventsCan wear out the boot device quicklyShort-term diagnostics (a few days)|**Remote syslog**Logs are stored on another deviceNeeds a separate always-on serverLong-term monitoring (weeks to months)|**Local syslog**Keeps logs on the array or cache, reducing wear on the boot deviceLess accessible if there's a system crashContinuous logging without external devices
tip
For detailed configuration help, check the **Help** icon in the WebGUI toolbar.
### Enabling the syslog server[​](#enabling-the-syslog-server)
* Mirror syslog to boot drive
* Remote syslog server
* Local syslog server
1. Select **Yes** under **Mirror syslog to boot drive**.
2. Click **Apply**. Logs will be saved to `/boot/logs/syslog` on your boot device
On the next reboot, this file will be renamed to `/boot/logs/syslog-previous`. You can view this file through **Tools → Syslog → syslog-previous**, and it will also be included (anonymized) in diagnostics.
#### How it works
* By default, Unraid copies the syslog to the boot device during every graceful shutdown. This is managed through the "Copy syslog to boot drive on shutdown" setting, which is enabled by default.
* If you're troubleshooting crashes, you can enable "Mirror syslog to boot drive." This will write the syslog to both `/var/log/syslog` and `/boot/logs/syslog` in real time. If a crash happens, any syslog entries recorded to the boot device before the crash will be preserved.
Both methods result in the creation of a `/boot/logs/syslog-previous` file after the next boot, which you can access via the syslog viewer and will be included in diagnostics.
caution
The **Copy syslog to boot drive on shutdown** setting is safe for your boot device. However, enabling **Mirror syslog to boot drive** can lead to excessive writes if left on for an extended period. For long-term logging needs, consider using a local or remote syslog server instead.
## Accessing Docker container logs[​](#accessing-docker-container-logs)
While standard diagnostics only provide limited data for Docker and VM, you can access container logs directly for more detailed troubleshooting.
To retrieve Docker logs:
* Via WebGUI
* Via Command Line
* Persistent logging
* Navigate to ***Docker \> Containers***
* Click the **Logs** icon for the desired container
### Virtual machine logs[​](#virtual-machine-logs)
VM logs can be accessed through their respective hypervisors (for example, QEMU logs are located in `/var/log/libvirt/`). Check your VM platform's documentation for more details.
important
Remember to attach the relevant container or VM logs separately when seeking support for application-specific issues.
* [System diagnostics](#system-diagnostics)
* [Anonymization of diagnostic data](#anonymization-of-diagnostic-data)
* [Testing drive read performance](#testing-drive-read-performance)
* [Quick test (hdparm)](#quick-test-hdparm)
* [Comprehensive test (DiskSpeed)](#comprehensive-test-diskspeed)
* [Persistent logs (syslog server)](#persistent-logs-syslog-server)
* [Choosing the right logging method](#choosing-the-right-logging-method)
* [Enabling the syslog server](#enabling-the-syslog-server)
* [Accessing Docker container logs](#accessing-docker-container-logs)
* [Virtual machine logs](#virtual-machine-logs)