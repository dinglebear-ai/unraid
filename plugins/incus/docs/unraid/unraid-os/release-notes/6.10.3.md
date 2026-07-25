6.10.3 | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
## Version 6.10.3 2022-06-14[​](#version-6103-2022-06-14)
### Improvements[​](#improvements)
Fixed data corruption issue which could occur on some platforms, notably HP Microserver Gen8/9, when Intel VT-d was enabled.
This was fixed by changing the Linux kernel default IOMMU operation mode from "DMA Translation" to "Pass-through".
* Also removed 'tg3' blacklisting when Intel VT-d was enabled. This was added in abundance of caution because all early
reports of data corruption involved platforms which also (coincidentally) used 'tg3' network driver. If you created a
blank 'config/modprobe.d/tg3.conf' file you may remove it.
**Plugin authors:** A plugin file may include an `\<ALERT\>` tag which displays a markdown formatted message when a new version is available.
Use this to give instructions or warnings to users before the upgrade is done.
Brought back color-coding in logging windows.
### Bug fixes[​](#bug-fixes)
Fix issue detecting Mellanox NIC.
Misc. WebGUI bug fixes
## Change Log vs. Unraid OS 6.10.2[​](#change-log-vs-unraid-os-6102)
### Base distro[​](#base-distro)
* no changes
### Linux kernel[​](#linux-kernel)
* version 5.15.46-Unraid
* CONFIG\_IOMMU\_DEFAULT\_PASSTHROUGH: Passthrough
### Management[​](#management)
* startup: improve network device detection
* WebGUI: Added color coding in log files
* WebGUI: In case of flash corruption try the test again
* WebGUI: Improved syslog reading
* WebGUI: Added log size setting when viewing syslog
* WebGUI: Plugin manager: add ALERT message function
* WebGUI: Add INFO icon to banner
* WebGUI: Added translations to PageMap page
* WebGUI: Fix: non-correcting parity check actually correcting if non-English language pack installed
* WebGUI: Updated azure/gray themes
* Better support for Firefox
* Move utilization and notification indicators to the right
## Patches[​](#patches)
With the [Unraid Patch plugin](https://forums.unraid.net/topic/185560-unraid-patch-plugin/) installed, visit ***Tools → Unraid Patch*** to get the following patches / hot fixes:
* A subset of security updates, see [this blog post](https://unraid.net/blog/cvd) for details. We recommend upgrading to the latest stable release for additional security updates.
* [Version 6.10.3 2022-06-14](#version-6103-2022-06-14)
* [Improvements](#improvements)
* [Bug fixes](#bug-fixes)
* [Change Log vs. Unraid OS 6.10.2](#change-log-vs-unraid-os-6102)
* [Base distro](#base-distro)
* [Linux kernel](#linux-kernel)
* [Management](#management)
* [Patches](#patches)