Version 7.0.1 2025-02-25 | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
## Upgrade notes[​](#upgrade-notes)
This is a security and bug fix release. It includes all the patches that were made available for 7.0.0.
This resolves a security issue when the Tailscale integration is enabled on a container running in Host mode and then shared with other users. As of this release, starting such containers has been disabled. To proceed, disable the Tailscale integration for containers in Host mode or change the Network Type to Bridge or "Custom: eth0/bond0/br0."
### Known issues[​](#known-issues)
For known issues, see the [7.0.0 release notes](/unraid-os/release-notes/7.0.0/#known-issues).
### Rolling back[​](#rolling-back)
If rolling back earlier than 7.0.0, also see the [7.0.0 release notes](/unraid-os/release-notes/7.0.0/#rolling-back).
## Changes vs. [7.0.0](/unraid-os/release-notes/7.0.0/)[​](#changes-vs-700)
### Bug fixes and improvements[​](#bug-fixes-and-improvements)
* Tailscale Docker integration
* Prevent containers with Network Type "Host" from using the Tailscale integration, disable the ability to start existing containers in this configuration (security)
* Prevent new containers with Network Type "Container" from using the Tailscale integration (the sidecar container should have Tailscale, not the main container)
* Accept default Tailscale state directory from Community Apps
* Install ca\_certificates if needed
* Improved handling of **post arguments** when the Tailscale integration is enabled, everything before the first `;` is passed to the container, everything after it is executed on the host
* Note: additional enhancements are underway, specifically the ability to manage the official Tailscale sidecar container using this integration
* Docker: hide the update status for containers managed by 3rd parties
* Fix a possible cause of nchan memory leak
* File Manager: allow access to UD remote shares
* Increased number of sd devices detected during early boot from 8 to 16
* Resolved *Wrong Pool State, invalid expansion* that users were seeing when upgrading certain btrfs pools from 6.12
* Prevent the import of existing vfat partitions
* Resolved issue attempting to start the array with a pool defined but not assigned
* Fix mc not preserving cwd upon F10 exit
* mover
* mover was not moving shares with spaces in the name from array to pool
* mover was not handling hard links properly
* VMs
* fix: Cannot start/stop a VM with single quotation marks in the name
* fix: In certain conditions, creating a VM creates a new share with the VM name
* fix issue with blank Discard field on vDisk
* Blacklist the `cdc\_ether` driver prevent issues with IPMI NICs on certain motherboards
To re-enable this driver, `touch /boot/config/modprobe.d/cdc\_ether.conf`
* Downgrade to an earlier version of dhcpcd to try and resolve DHCP issues some users are having
* Share Listing: tool tip showed `%20` instead of a space
* Include installed patches in diagnostics
### Linux kernel[​](#linux-kernel)
* version 6.6.78
* fix: md/unraid permits Start if only 2 parity and no data disks
### Base distro[​](#base-distro)
* bind: version 9.20.5 (CVE-2024-12705 CVE-2024-11187)
* curl: version 8.12.1 (CVE-2025-0725 CVE-2025-0665 CVE-2025-0167)
* dhcpcd: version 9.5.3 (revert from v10.0.10)
* git: version 2.48.1 (CVE-2024-50349 CVE-2024-52006)
* gnutls: version 3.8.9 (CVE-2024-12243)
* libtasn1: version 4.20.0 (CVE-2024-12133)
* libxml2: 2.13.6 (CVE-2025-24928 CVE-2024-56171)
* mariadb: version 11.4.5 (CVE-2025-21490)
* mc: version 4.8.33
* openssh: version 9.9p2 (CVE-2025-26465 CVE-2025-26466)
* openssl: version 3.4.1
* rsync: version 3.4.1 (CVE-2024-12084 CVE-2024-12085 CVE-2024-12086 CVE-2024-12087 CVE-2024-12088 CVE-2024-12084)
* ttyd: version 20250129
## Patches[​](#patches)
No patches are currently available for this release.
* [Upgrade notes](#upgrade-notes)
* [Known issues](#known-issues)
* [Rolling back](#rolling-back)
* [Changes vs. 7.0.0](#changes-vs-700)
* [Bug fixes and improvements](#bug-fixes-and-improvements)
* [Linux kernel](#linux-kernel)
* [Base distro](#base-distro)
* [Patches](#patches)