6.9.1 | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
## Version 6.9.1 2021-03-08[​](#version-691-2021-03-08)
## Notable Bug Fixes and Improvements[​](#notable-bug-fixes-and-improvements)
Fixed issue where code outside the Unraid OS Management Utility calling
`smartctl` would set up conditions where devices would never spin down.
Note: you still need
[@doron](https://forums.unraid.net/profile/8006-doron/)'s [SAS
Spindown
plugin](https://forums.unraid.net/topic/97351-plugin-spin-down-sas-drives/)
to properly support SAS device spindown.
For Docker: if an in-tree GPU driver is loaded which results in creating
`/dev/dri/\*` device nodes, we set permissions for these nodes to `0777`
in order to ease integration of containers using GPU for transcoding.
Typing 'exit' in a Terminal window will now close the window (yay!).
We added a 'no-cache' header to NoVNC web access so that future Unraid
OS releases will no longer have stale web components.
Updated the openssl package to version 1.1.1j which has security
updates.
Updated the Linux kernel to 5.10.21, a patch release to 5.10 LTS kernel.
Included kernel config settings necessary to include certain hardware
monitoring devices and added support for new devices.
### Driver Updates[​](#driver-updates)
The Nvidia GPU driver has been updated to 460.56 and should work with
this kernel 5.10.21. Please install
[@ich777](https://forums.unraid.net/profile/72388-ich777/)'s
[Nvidia-Driver
plugin](https://forums.unraid.net/topic/98978-plugin-nvidia-driver/) to
download and install this driver.
## Change Log vs. Unraid OS 6.9.0[​](#change-log-vs-unraid-os-690)
#### Base distro[​](#base-distro)
* openssl: version 1.1.1j (CVE-2021-23841 CVE-2021-23840)
* openssl-solibs: version 1.1.1j
* ttyd: version 1.6.3
#### Linux kernel[​](#linux-kernel)
* version 5.10.21
* CONFIG\_WATCHDOG: Watchdog Timer Support
* added several new hwmon drivers
#### Management[​](#management)
* emhttp: monitor partition statistics instead of device statistics in
spindown/spinup logic
* rc.local: ensure required directories exist on USB flash boot device
* rc.local: for Docker containers: grant access to graphics device
nodes /dev/dri/\*
* rc.nginx: add Cache-Control:nocache header to novnc
* WebGUI: Increase syslog buffer from 1000 to 3000 lines
* WebGUI: SysDevs fix display aberration
* WebGUI: Diagnostics: include modprobe.d files
* WebGUI: Diagnostics: include go as go.txt
* WebGUI: Update share security helptext
* WebGUI: Deprecate donation links in templates in lieu of links in CA
profiles
* WebGUI: Protect GUI from invalid .page files
* WebGUI: Suppress ipv6 multicast entries in route table display
* WebGUI: synchronize helptext.txt with lang-en\_US repo
* WebGUI: user management - disable password autocomplete
* WebGUI: Dashboard: Fix color for utilization of disk
* [Version 6.9.1 2021-03-08](#version-691-2021-03-08)
* [Notable Bug Fixes and Improvements](#notable-bug-fixes-and-improvements)
* [Driver Updates](#driver-updates)
* [Change Log vs. Unraid OS 6.9.0](#change-log-vs-unraid-os-690)