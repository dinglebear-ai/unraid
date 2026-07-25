6.9.2 | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
## Version 6.9.2 2021-04-07[​](#version-692-2021-04-07)
### **Failed Login Restrictions**[​](#failed-login-restrictions)
For WebGUI login you now get 3 login attempts per IP address before a
15-minute cool off is enforced. Further, the timestamp of the last three
failed login attempts per IP address are stored in files located in
`/var/log/pwfail/\<ip-address\>`. Note this only applies to
WebGUI login, not ssh or telnet.
### **Driver Updates**[​](#driver-updates)
We updated the Nvidia vendor GPU driver to version 465.19.01. Use this
[handy
plugin](https://raw.githubusercontent.com/ich777/unraid-nvidia-driver/master/nvidia-driver.plg)
by Community Developer
[@ich777](https://forums.unraid.net/profile/72388-ich777/) to
facilitate installing the correct driver.
## Change Log vs. Unraid OS 6.9.1[​](#change-log-vs-unraid-os-691)
#### Base distro[​](#base-distro)
* docker: version 20.10.5
* fuse3: version 3.10.2
* nginx: version 1.19.9
* samba: verson 4.12.14 (CVE-2020-27840 CVE-2020-27840)
#### Linux kernel[​](#linux-kernel)
* version 5.10.28
* include all CONFIG*NF*\* modules
* oot: realtek r8125: version 9.005.01
#### Management[​](#management)
* emhttpd: detect out-of-band device spin-up
* shfs: add 'copy\_file\_range()' support
* shfs: fix 'mknod' creating a fifo
* WebGUI: login: implement max 3 failed login attempts per 15 minute interval
* WebGUI: Fix links on notifications not being present if in summary display
* WebGUI: Plugins: Move incompatible plugins to ../plugins-error
* WebGUI: Fix missing CSRF when deleting pool
* WebGUI: Fix .sweet-alert color
* WebGUI: Translations adjustments
* WebGUI: Diagnostics: Prevent double clicks on download button
* WebGUI: Fix default usage thresholds not sending notification
* WebGUI: Fix CSS span.select background-color
* WebGUI: Make diagnostics messages left aligned
* WebGUI: Fixed javascript error in DeviceInfo.page preventing
settings to be saved
* WebGUI: Update DeviceInfo.page
* WebGUI: Prevent autofilling of passwords on containers
* WebGUI: Docker: Do not allow CPU pinning if no template present
* WebGUI: Fix .sweet-alert .sa-icon color, \* in the CSS
* [Version 6.9.2 2021-04-07](#version-692-2021-04-07)
* [**Failed Login Restrictions**](#failed-login-restrictions)
* [**Driver Updates**](#driver-updates)
* [Change Log vs. Unraid OS 6.9.1](#change-log-vs-unraid-os-691)