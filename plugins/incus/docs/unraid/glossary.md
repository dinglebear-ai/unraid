Glossary | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
**Advanced Host Controller Interface**
A standard interface mode for disk controllers that allows storage devices to communicate with your computer. In Unraid, AHCI mode is typically recommended for better compatibility.
See [Advanced Host Controller Interface (AHCI) - Intel Specification](https://www.intel.com/content/www/us/en/io/serial-ata/ahci.html)
**Allocation Method**
A setting that controls how Unraid chooses which array disk to place new files on when using user shares. Options include High-Water (balanced distribution), Fill-Up (sequential filling), and Most-Free (prioritizes emptiest disk).
**AMD Virtualization**
A feature in AMD processors that enables virtualization support. This feature must be enabled in your computer's BIOS settings before you can create virtual machines in Unraid.
See [X86 virtualization | Wikiwand](https://www.wikiwand.com/en/articles/X86_virtualization)
**apcupsd Protocol**
Protocol used by Unraid to communicate with UPS devices. Enables graceful shutdowns during power failures.
See [apcupsd - Official Project Documentation](http://www.apcupsd.org/)
**Apollo Sandbox**
A development tool for testing and exploring GraphQL APIs used in Unraid's development environment.
See [Apollo Sandbox - Official Documentation](https://www.apollographql.com/docs/graphos/platform/sandbox)
**Apple Filing Protocol**
A network protocol for macOS file sharing in Unraid. No longer used by Apple, and support was removed in Unraid 6.9. Instead, see "SMB" for modern macOS compatibility.
See [Server Message Block - Wikipedia](https://en.wikipedia.org/wiki/Server_Message_Block)
**Application Server**
One of Unraid’s core functions where it can run containerized applications (like Plex, Sonarr, etc.) directly on the system without requiring a full virtual machine.
See [Application server | Wikiwand](https://www.wikiwand.com/en/articles/Application_server)
**Array**
The collection of data disks managed by Unraid, which can include parity protection. The array is Unraid's main storage system, storing data across multiple devices.
**AWS Cognito OAuth Server**
An Amazon Web Services authentication service that Unraid Connect uses to manage user identities and access securely.
See [Amazon Cognito - AWS Documentation](https://docs.aws.amazon.com/cognito/latest/developerguide/what-is-amazon-cognito.html)
**Bit Rot**
The theoretical degradation of disk data over time. File systems like BTRFS and ZFS can detect errors, but practical occurrence rates are debated.
See [Data Degradation - Wikipedia](https://en.wikipedia.org/wiki/Data_degradation)
**BTRFS**
“B-Tree File System,” a modern file system option in Unraid that supports features like snapshots and checksumming. Often used for cache pools due to its ability to detect corruption.
See [BTRFS File System - Official Documentation](https://btrfs.readthedocs.io/)
**Cache**
A feature in Unraid that temporarily stores newly written data on faster drives (typically SSDs) before moving it to the array, improving write performance.
See [Cache Memory - Computer Science Principles](https://www.britannica.com/technology/cache-memory)
**Cache Pool**
High-speed storage for temporary data. Pools can be single-disk or multi-disk. The Mover process transfers data to/from array periodically.
See [RAID - Wikipedia](https://en.wikipedia.org/wiki/RAID)
**Checksum**
A small piece of data generated from a larger block of data, used to detect errors during storage or transmission. BTRFS and ZFS file systems use checksums to verify data integrity.
See [Checksum - Wikipedia](https://en.wikipedia.org/wiki/Checksum)
**CPU Pinning**
The process of assigning specific CPU cores to VMs or Docker containers. This improves performance by ensuring that critical applications have dedicated processing resources.
See [CPU Affinity - Computer Architecture Principles](https://www.britannica.com/technology/computer-architecture)
**CRC**
“Cyclic Redundancy Check,” an error-detecting code used to identify data corruption during storage or transmission.
See [Cyclic Redundancy Check - Wikipedia](https://en.wikipedia.org/wiki/Cyclic_redundancy_check)
**CRC Errors**
Error messages generated when a CRC check fails. Cyclic Redundancy Check errors often indicate cabling issues rather than disk failures, so be sure to check your SATA cable connections.
See [CRC Errors | Cisco](https://documentation.meraki.com/MS/Other_Topics/CRC_Errors)
**Deep Linking**
A feature in Unraid Connect that allows direct navigation to specific pages within your Unraid server’s webGUI.
See [Deep Linking - Wikipedia](https://en.wikipedia.org/wiki/Deep_linking)
**DMI**
“Desktop Management Interface,” a framework that provides system information about hardware components. Unraid uses this to identify system specifications.
See [Desktop Management Interface - Wikipedia](https://en.wikipedia.org/wiki/Desktop_Management_Interface)
**DNS name resolution**
Process of converting domain names (e.g., www.wikipedia.com) to IP addresses. Configured via router or custom DNS settings.
See [What is DNS Resolution? How DNS Works & Challenges](https://www.datadoghq.com/knowledge-center/dns-resolution/)
**DNS rebinding**
Security feature that must be disabled in your browser/DNS server for your server to work with myunraid.net URLs.
**Emulated disk**
Virtual disk created when a physical drive fails. Uses parity + remaining array drives to emulate the missing drive. The failed drive must be replaced before another one fails.
**FTP**
“File Transfer Protocol,” an unencrypted file transfer protocol. Not recommended - use SFTP or SMB for secure transfers.
See [File Transfer Protocol - Wikipedia](https://en.wikipedia.org/wiki/File_Transfer_Protocol)
**Go Link**
A permanent, short URL format used in Unraid documentation that redirects to current content locations, ensuring links remain valid even as documentation is reorganized.
See [URL Shortening - Wikipedia](https://en.wikipedia.org/wiki/URL_shortening)
**GPU passthrough**
A technique that gives a virtual machine direct control over a physical graphics card, providing near-native performance for graphics-intensive applications like gaming.
See [Hyper-V GPU Passthrough - An Essential Guide for Beginners](https://www.nakivo.com/blog/hyper-v-gpu-passthrough/)
**GraphQL**
A query language and runtime for APIs used in Unraid Connect, allowing efficient data retrieval with a single request.
See [GraphQL Official Documentation](https://hygraph.com/learn/graphql)
**Guest agent**
A software component installed inside a virtual machine that enables better communication between the VM and the Unraid host system.
See [QEMU Guest Agent | Libvirt](https://wiki.libvirt.org/Qemu_guest_agent.html)
**GUID**
“Globally Unique Identifier,” a unique reference number used to identify hardware devices or software components. In Unraid, licensing can be bound either to a USB flash device GUID or to TPM-based hardware identity.
See [GUID - Wikipedia](https://en.wikipedia.org/wiki/Universally_unique_identifier)
**Hash**
A mathematical function that converts data into a fixed-size string of characters, used in Unraid for password storage and file integrity verification.
See [Cryptographic Hash Function - Wikipedia](https://en.wikipedia.org/wiki/Cryptographic_hash_function)
**Hashed passwords**
Passwords processed through a cryptographic hash function for secure storage in Unraid, making them difficult to reverse engineer.
See [Password Hashing - OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
**HBA mode**
A configuration setting for storage controllers where they function as direct pass-through devices rather than RAID controllers, recommended for optimal Unraid performance.
See [Host Bus Adapter - Wikipedia](https://en.wikipedia.org/wiki/Host_adapter)
**HVM**
“Hardware Virtual Machine,” a virtualization approach that uses CPU hardware capabilities to run unmodified guest operating systems. Required for virtual machines in Unraid.
See [Hardware Virtualization - Wikipedia](https://en.wikipedia.org/wiki/Hardware_virtualization)
**Hypervisor**
Software that creates and manages virtual machines. Unraid functions as a type 2 hypervisor, running on top of the Linux kernel.
See [Hypervisor - Nutanix](https://www.nutanix.com/info/hypervisor)
**I440fx**
A legacy chipset emulation for virtual machines. Generally used for older operating systems and compatibility scenarios when Q35 isn’t suitable.
See [Intel 440FX | Wikipedia](https://en.wikipedia.org/wiki/Intel_440FX)
**Included or excluded disks**
Disks explicitly added to or removed from a share. Included disks are an active part of the share, while excluded disks are excluded from automatic file allocation.
See [Logical Volume Management - Wikipedia](https://en.wikipedia.org/wiki/Logical_volume_management)
**Intel VT-X**
“Intel Virtualization Technology for Directed I/O,” Intel’s hardware virtualization capability enabling VMs to run operating systems directly on the CPU. Essential for VM performance in Unraid on Intel platforms. (AMD equivalent - AMD-V)
See [Intel® Virtualization Technology](https://www.intel.com/content/www/us/en/support/articles/000005486/processors.html)
**IOMMU**
“Input/Output Memory Management Unit,” a security feature that isolates virtual machines (VMs) from direct hardware access, preventing unauthorized data access. Ensures VMs only interact with assigned hardware.
See [IOMMU - Wikipedia](https://en.wikipedia.org/wiki/Input–output_memory_management_unit)
**JBOD**
“Just a Bunch Of Disks,” disks configured as standalone devices without RAID. Each disk operates independently, with no redundancy.
See [JBOD - Wikipedia](https://en.wikipedia.org/wiki/Non-RAID_drive_architectures)
**Keypair**
A pair of cryptographic keys (public/private) used for secure SSH access. The public key is shared, while the private key remains confidential.
See [Key-based authentication in OpenSSH - Microsoft Learn](https://learn.microsoft.com/en-us/windows-server/administration/openssh/openssh_keymanagement)
**KVM**
“Kernel-based Virtual Machine,” Linux’s native virtualization solution used by Unraid to run VMs. Provides direct hardware access for high performance.
See [KVM (Kernel-based Virtual Machine) - Official Project](https://linux-kvm.org/page/Main_Page)
**libvirt**
The virtualization API and management tool that Unraid uses to create and manage virtual machines.
See [libvirt - Official Project](https://libvirt.org)
**Linux FUSE**
“Filesystem in Userspace,” a framework for directly mounting virtual file systems (e.g., SSHFS) in user space, enabling flexible file access.
See [FUSE - The Linux Kernel documentation](https://www.kernel.org/doc./html/next/filesystems/fuse.html)
**LUKS**
“Linux Unified Key Setup,” a disk encryption system for securing data on Unraid. Encrypts entire drives to protect against unauthorized access.
See [Linux Unified Key Setup | Wikipedia](https://en.wikipedia.org/wiki/Linux_Unified_Key_Setup)
**MagicDNS**
A Tailscale-specific dynamic DNS service that automatically updates your Unraid server’s domain name with its current IP address. To demonstrate, it would allow a computer at "desktop.yourtailnet.ts.net" to find another machine, "tower.yourtailnet.ts.net", even if they were in different physical locations.
See [MagicDNS - Tailscale Documentation](https://tailscale.com/kb/1081/magicdns)
**MAID**
“Massive Array of Idle Disks,” an energy-saving strategy where drives spin down when idle. Requires careful configuration to avoid data loss.
See [MAID (Massive Array of Idle Disks) - Wikipedia](https://en.wikipedia.org/wiki/MAID_(storage))
**Maintenance mode**
Feature that starts the array without mounting drives. Enables disk repair, re-assignment, or parity rebuilds without affecting the array's active data.
See [Maintenance Mode - Wikipedia](https://en.wikipedia.org/wiki/Maintenance_mode)
**mDNS**
A networking protocol that allows your local computer to resolve "tower.local" even though there is no actual DNS server configured to resolve that name. Only works on the ".local" top-level domain, which is why Unraid uses it by default. Only resolves successfully when the client and server are on the same subnet.
See [Multicast DNS](https://en.wikipedia.org/wiki/Multicast_DNS)
**Memory ballooning**
A VM feature that dynamically adjusts allocated RAM based on host system needs. Prevents VMs from monopolizing memory.
See [Memory ballooning - Wikipedia](https://en.wikipedia.org/wiki/Memory_ballooning)
**Mirror (root profile)**
A RAID 1 configuration for the root partition, providing redundancy for critical system files.
See [Overview of RAID 1 (Mirror) Volumes - Oracle Docs](https://docs.oracle.com/cd/E19683-01/817-5776/about-metadevices-9/index.html)
**Mover**
Transfers data between the primary and secondary storage defined for a share in either direction during scheduled runs.
See [UnRAID - Data, Cache, and the Mover - An Englishman in Boston](https://morsepacific.co.uk/2020/11/15/unraid-data-cache-and-the-mover/)
**MTU**
“Maximum Transmission Unit,” the largest size of data packet that can be transmitted over a network interface. Recommended to keep default and avoid jumbo frames.
See /termlink/ and [Maximum Transmission Unit - Wikipedia](https://en.wikipedia.org/wiki/Maximum_transmission_unit)
**Multi-device pool**
A cache configuration using multiple drives (often in RAID 1/10) to balance speed and redundancy.
**Multiple-device mirror**
A RAID 10 setup for the cache pool, combining mirroring and striping for optimal performance and redundancy.
See [Intelligent Mirroring and Enhanced RAID 10 - Dell](https://www.dell.com/support/kbdoc/en-in/000136987/intelligent-mirroring-and-enhanced-raid-10-aka-raid-10e)
**Myunraid.net certificate**
A security certificate issued by Unraid Connect for secure access to your server's webGUI.
**NAT**
“Network Address Translation,” a network technique that allows multiple devices on a private network to share a single public IP address.
See [Network Address Translation - Wikipedia](https://en.wikipedia.org/wiki/Network_address_translation)
**NFS**
“Network File System,” a protocol for sharing files across a network, enabling remote systems to access files as if they were local.
See [Network File System - IBM Documentation](https://www.ibm.com/docs/en/aix/7.1?topic=management-network-file-system)
**NIC bonding**
(Advanced) Combines network interfaces for redundancy/bandwidth. Requires compatible switch configuration. (Avoid triggering if unfamiliar.)
See [Interface (NICs) Bonding in Linux using nmcli | GeeksforGeeks](https://www.geeksforgeeks.org/interface-nics-bonding-in-linux-using-nmcli/)
**NIC bridging**
A VM networking mode where the VM shares the host’s physical network interface for direct internet access.
See [How to set up a network bridge for virtual machine communication | Red Hat Blog](https://www.redhat.com/en/blog/setup-network-bridge-VM)
**OpenVPN**
A secure VPN protocol used to create encrypted connections to your Unraid server from remote locations.
See [What is OpenVPN, and how does it work? - Surfshark](https://surfshark.com/blog/what-is-openvpn)
**OVMF**
“Open Virtual Machine Firmware,” firmware for UEFI-based VMs, enabling features like Secure Boot. Required for modern OS installations.
See [UEFI/OVMF - Ubuntu Wiki](https://wiki.ubuntu.com/UEFI/OVMF)
**Parity**
A redundancy mechanism that protects data against disk failures by storing a checksum across the array.
See [Parity data in RAID arrays | Wikipedia](https://en.wikipedia.org/wiki/Parity_bit#RAID_array)
**Parity check**
A background process that verifies data integrity across the array, ensuring parity is up-to-date.
**Parity drives**
Redundant drives in the array that maintain parity information to recover data during disk failures.
**Parity Swap**
Three-drive procedure for when you must replace a data drive while upgrading your parity drive to one with a larger capacity.
**PME Event**
“Power Management Event,” a system log entry indicating a hardware power-related issue (e.g., USB disconnection).
**Primary storage**
The main location where data is initially written (cache) before Mover moves it to secondary storage (array).
**Public bridge**
A VM networking mode where the VM obtains its own IP address on the host’s network, visible to other devices.
**PuTTY**
A free SSH client for Windows used to access Unraid’s terminal interface remotely.
See [PuTTY - Wikipedia](https://en.wikipedia.org/wiki/PuTTY)
**Q35**
A modern chipset emulation mode for VMs, offering better compatibility with newer operating systems.
See [Intel Chipsets - Wikiwand](https://www.wikiwand.com/en/articles/List_of_Intel_chipsets#Core_2_chipsets)
**QEMU**
A hardware emulator used by Unraid to run x86/x64 VMs. Handles CPU, memory, and I/O virtualization.
See [QEMU - Wikipedia](https://en.wikipedia.org/wiki/QEMU)
**RAID**
“Redundant Array of Independent Disks,” a storage technology combining multiple drives for performance, redundancy, or both.
See [Standard RAID Levels - Wikipedia](https://en.wikipedia.org/wiki/Standard_RAID_levels)
**RAID 0**
Striping – A RAID configuration that splits data across drives for faster read/write speeds but offers no redundancy.
See [RAID 0 - Wikipedia](https://en.wikipedia.org/wiki/Standard_RAID_levels#RAID_0)
**RAID 1**
Mirroring – A redundancy method that duplicates all data across two or more drives. If one drive fails, another contains an exact copy of the data.
See [RAID 1 - Wikipedia](https://en.wikipedia.org/wiki/Standard_RAID_levels#RAID_1)
**RAID 10**
Striped Mirrors – A combination of RAID 1 (mirroring) and RAID 0 (striping) that balances speed and redundancy. Data is striped across mirrored pairs, providing performance and protection against drive failures.
See [RAID 10 - Wikipedia](https://en.wikipedia.org/wiki/Standard_RAID_levels#RAID_10)
**RAID 5**
A storage method that distributes data and parity information across three or more drives. Traditional RAID 5 stripes data across all drives, unlike Unraid which keeps complete files on individual disks.
See [RAID 5 - Wikipedia](https://en.wikipedia.org/wiki/Standard_RAID_levels#RAID_5)
**RAID 6**
Similar to RAID 5 but with dual parity, allowing the array to survive two simultaneous drive failures.
See [RAID 6 - Wikipedia](https://en.wikipedia.org/wiki/Standard_RAID_levels#RAID_6)
**RAIDZ1**
ZFS’s implementation of RAID 5, offering single-parity protection with data checksumming for corruption detection.
See [RAIDZ - OpenZFS Documentation](<https://openzfs.github.io/openzfs-docs/Basic Concepts/RAIDZ.html>)
**RAIDZ2**
ZFS’s implementation of RAID 6, providing dual-parity protection with data checksumming, allowing survival of two simultaneous drive failures.
See [RAIDZ - OpenZFS Documentation](<https://openzfs.github.io/openzfs-docs/Basic Concepts/RAIDZ.html>)
**RAIDZ3**
ZFS’s triple-parity implementation, allowing the array to survive three simultaneous drive failures. Useful for very large arrays.
See [RAIDZ - OpenZFS Documentation](<https://openzfs.github.io/openzfs-docs/Basic Concepts/RAIDZ.html>)
**Read check**
A process that verifies data can be read from a drive without comparing it to parity. Useful for testing drive health without full parity check overhead.
See [Data Scrubbing - Wikipedia](https://en.wikipedia.org/wiki/Data_scrubbing)
**Reallocated sectors**
Bad sectors on a drive that have been replaced with spare sectors. A rising count in SMART reports indicates drive degradation and potential failure.
See [What is a reallocated sectors count? | how.dev](https://how.dev/answers/what-is-a-reallocated-sectors-count)
**Root profile**
The vdev (virtual device) configuration for the root pool in ZFS, typically set as a mirror for redundancy of system files.
See [ZFS Concepts - OpenZFS Documentation](<https://openzfs.github.io/openzfs-docs/Basic Concepts/>)
**Root user**
The administrator account in Unraid with full system access and permissions. Similar to the Administrator account in Windows.
See [Superuser - Wikipedia](https://en.wikipedia.org/wiki/Superuser)
**Root vDev**
The primary virtual device in a ZFS pool configuration, defining how data is distributed and protected across physical drives.
See [ZFS Concepts - OpenZFS Documentation](<https://openzfs.github.io/openzfs-docs/Basic Concepts/>)
**SAMBA**
An implementation of the SMB protocol that allows Unraid to share files with Windows, macOS, and Linux systems.
See [SMB Protocol - IBM Documentation](https://www.ibm.com/docs/en/aix/7.1?topic=management-network-file-system)
**Scheduled Mover process**
An automated task that transfers files from a pool to another array or pool in either direction, balancing performance with data protection.
**Scrub**
A background maintenance process that checks file system integrity, verifies checksums, and repairs corrupted data when possible (used with BTRFS and ZFS).
See [Data Scrubbing - Wikipedia](https://en.wikipedia.org/wiki/Data_scrubbing)
**SeaBIOS**
A legacy BIOS implementation used for virtual machines in Unraid. Generally used for older operating systems that don’t support UEFI.
See [SeaBIOS - Wikipedia](https://en.wikipedia.org/wiki/SeaBIOS)
**SMART**
“Self-Monitoring, Analysis, and Reporting Technology,” a monitoring system built into hard drives that reports on various reliability indicators to help predict drive failures.
See [SMART (Self-Monitoring, Analysis, and Reporting Technology) - Wikipedia](https://en.wikipedia.org/wiki/Self-Monitoring,_Analysis_and_Reporting_Technology)
**SMART polling**
The frequency at which Unraid checks the SMART status of drives. More frequent polling provides earlier warning of potential drive issues.
See [SMART (Self-Monitoring, Analysis, and Reporting Technology) - Wikipedia](https://en.wikipedia.org/wiki/Self-Monitoring,_Analysis_and_Reporting_Technology)
**SMART report**
A detailed health status overview of a drive, showing reliability metrics and potential warning signs of impending failure.
See [SMART (Self-Monitoring, Analysis, and Reporting Technology) - Wikipedia](https://en.wikipedia.org/wiki/Self-Monitoring,_Analysis_and_Reporting_Technology)
**Snapshot**
A point-in-time image of a file system, used by BTRFS and ZFS to enable quick rollbacks, backups, or recovery of previous states.
See [Snapshot (computer storage) - Wikipedia](https://en.wikipedia.org/wiki/Snapshot_(computer_storage))
**Spin state**
The current rotation status of a hard drive—either spinning (active) or spun down (idle). Managing spin states helps reduce power consumption and drive wear.
**Spin-down timers**
Settings determining how long a drive remains idle before Unraid spins it down to save power and extend drive life.
**Split level**
An advanced share setting that controls whether files are split across multiple disks. Affects how Unraid organizes data within a share. Most users can keep the default setting.
**SSH**
“Secure Shell,” an encrypted protocol for securely accessing and managing your Unraid server remotely through a command-line interface.
See [Secure Shell (SSH) - 1Kosmos Security Glossary](https://www.1kosmos.com/security-glossary/secure-shell-ssh/)
**SSL**
“Secure Sockets Layer,” a security protocol for establishing encrypted connections between your browser and the Unraid webGUI, protecting sensitive information.
See [What is SSL?](https://www.cloudflare.com/learning/ssl/what-is-ssl/)
**SSO**
“Single Sign-On,” a login method that allows you to use one set of credentials to access multiple services like Unraid Connect.
See [Single Sign-On - Wikipedia](https://en.wikipedia.org/wiki/Single_sign-on)
**Standby mode**
A low-power state for solid-state drives when they're not actively being used; similar to spinning down a mechanical drive but for SSDs.
**Subnet routing**
In the context of Unraid, a Tailscale-specific feature that securely connects devices across different networks using encrypted tunnels and subnet routers.
**Syslog**
The system logging service in Unraid that records system events, errors, and activity for troubleshooting and monitoring.
See [Syslog - Wikipedia](https://en.wikipedia.org/wiki/Syslog)
**Syslog server**
A centralized server that collects and stores log messages from Unraid, allowing for persistent storage of diagnostic information.
See [Syslog - Wikipedia](https://en.wikipedia.org/wiki/Syslog)
**Tailnet**
A private, secure network created by Tailscale that connects all your devices running Tailscale, regardless of their physical location. Enables secure remote access to your Unraid server.
See [Tailnet - Tailscale Documentation](https://tailscale.com/kb/1217/tailnet-name)
**Tailscale**
A VPN service built on WireGuard that simplifies secure remote access to your Unraid server. Creates an encrypted mesh network between all your devices.
See [Tailscale · VPN Service for Secure Networks](https://tailscale.com/)
**TLD**
“Top-Level Domain,” the last segment of a domain name, such as .com or .net. Unraid's default ".local" works for most networks.
See [Domain Name System - Wikipedia](https://en.wikipedia.org/wiki/Domain_Name_System)
**TLS**
“Transport Layer Security,” the successor to SSL, providing encrypted communication between your browser and the Unraid webGUI for secure administration.
See [Transport Layer Security - Wikipedia](https://en.wikipedia.org/wiki/Transport_Layer_Security)
**Topology**
The structural arrangement of drives in a ZFS pool. Common topologies include mirror, RAIDZ1/2/3, and stripe, each providing different levels of performance and redundancy.
See [ZFS Pool Configuration - OpenZFS Documentation](<https://openzfs.github.io/openzfs-docs/Basic Concepts/>)
**TRIM/Discard**
A command that allows the operating system to inform an SSD of which blocks of data are no longer in use, improving the performance and longevity of the drive.
**UDMA**
“Ultra Direct Memory Access,” a data transfer protocol between the CPU and storage devices. UDMA errors in SMART reports can indicate connection problems with the drive cable or port.
See [UDMA - Wikipedia](https://en.wikipedia.org/wiki/UDMA)
**UEFI**
“Unified Extensible Firmware Interface,” a modern replacement for BIOS that provides more features and better security. Required for some VMs and for booting from drives larger than 2TB.
See [UEFI - Wikipedia](https://en.wikipedia.org/wiki/UEFI)
**UPnP**
“Universal Plug and Play,” a network protocol that allows devices to discover each other on a network. Used by Unraid to automatically configure port forwarding on compatible routers.
See [Universal Plug and Play - Wikipedia](https://en.wikipedia.org/wiki/Universal_Plug_and_Play)
**User share**
Logical view which combines folders from array drives and pools. Files remain on individual disks; can span zero or more array drives and zero or more pools.
**vDisk**
A virtual disk file used by a VM as storage. Acts as a virtual hard drive for the guest operating system.
See [Logical disk - Wikipedia](http://en.wikipedia.org/wiki/Logical_disk)
**vDisk allocation**
The method used to provision storage space for a virtual disk—thin provisioning (allocated as needed) or thick provisioning (allocated at creation).
See [Logical disk - Wikipedia](http://en.wikipedia.org/wiki/Logical_disk)
**VFIO**
“Virtual Function I/O,” a technology that enables direct assignment of PCIe devices (like graphics cards) to virtual machines, providing near-native performance for GPU-intensive tasks.
See [VFIO - Linux Kernel Documentation](https://docs.kernel.org/driver-api/vfio.html)
**Virt**
Short for virtualization, referring to Unraid’s capabilities for running virtual machines.
See [Virtualization - Red Hat Documentation](https://www.redhat.com/en/topics/virtualization/what-is-a-virtual-machine)
**VirtFS**
A file-sharing mechanism between the Unraid host and virtual machines, allowing files to be accessed directly from the host system.
See [VirtFS | KVM](https://www.linux-kvm.org/page/VirtFS)
**VirtIO**
A set of efficient drivers for virtual machines that improve performance by enabling direct communication between the VM and the host. Recommended for most VM devices.
See [VirtIO - OSDev Wiki](http://wiki.osdev.org/Virtio)
**Virtual disk images**
Files that represent physical hard drives in virtual machines. Common formats include qcow2, raw, and vhd.
See [Virtual Disk Images - Home](https://virtualdiskimages.weebly.com/)
**VM**
“Virtual Machine,” a software emulation of a computer that runs its own operating system inside Unraid. Functions as if it were a separate physical computer.
See [Virtual Machine - Red Hat Documentation](https://www.redhat.com/en/topics/virtualization/what-is-a-virtual-machine)
**VM XML templates**
Preconfigured setups for creating specific types of virtual machines in Unraid. Simplify the process of creating optimized VMs for different operating systems.
**VNC session**
A remote desktop protocol used to access a virtual machine’s graphical interface directly through the Unraid webGUI.
See [Virtual Network Computing - Wikipedia](https://en.wikipedia.org/wiki/VNC)
**VPN Tunnel**
An encrypted connection between your device and your Unraid server, allowing secure remote access over the internet.
See [Virtual Private Network - Wikipedia](https://en.wikipedia.org/wiki/Virtual_private_network)
**VT-d**
“Virtualization Technology for Directed I/O,” Intel’s technology for passing through physical devices to virtual machines. Required for GPU passthrough and other device assignments on Intel platforms.
See [Intel® Virtualization Technology for Directed I/O](https://www.intel.com/content/www/us/en/content-details/774206/intel-virtualization-technology-for-directed-i-o-architecture-specification.html)
**Wake-on-LAN (WOL)**
A network standard that allows a computer to be turned on remotely by sending a special network packet. Used to power on your Unraid server without physical access.
See [Wake-on-LAN - Wikipedia](https://en.wikipedia.org/wiki/Wake-on-LAN)
**WebGUI**
The web-based graphical user interface for managing your Unraid server through a browser. The primary way most users interact with Unraid.
**WireGuard**
A modern, secure VPN protocol integrated into Unraid that provides encrypted access to your server from the internet. Known for being faster and more straightforward than OpenVPN.
See [WireGuard - Official Documentation](https://www.wireguard.com)
**Xen HVM**
“Hardware Virtual Machine,” a virtualization mode that uses hardware assistance for full virtualization. Less commonly used in Unraid since the adoption of KVM.
See [Xen HVM - Xen Project Wiki](https://wiki.xenproject.org/wiki/Xen_Project_Beginners_Guide)
**Xen PV**
“Paravirtualization,” a legacy virtualization method where the guest OS is modified to work with the hypervisor. Largely superseded by hardware virtualization in modern systems.
See [Xen PV - Xen Project Wiki](https://wiki.xenproject.org/wiki/Xen_Project_Beginners_Guide)
**Xen virtual disk**
A disk format used with Xen virtualization. Most Unraid VMs now use QEMU disk formats instead.
See [Xen Project - Open Source Virtualization](https://xenproject.org/)
**XFS**
A high-performance filesystem used as the default for array drives in Unraid. Optimized for large files and good handling of random read/write operations.
See [XFS File System - Red Hat Documentation](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/7/html/storage_administration_guide/ch-xfs)
**ZFS**
“Z File System,” an advanced file system and volume manager with built-in features like snapshots, checksumming, and compression. Available for pools in Unraid.
See [ZFS - Wikipedia](https://en.wikipedia.org/wiki/ZFS)
**ZFS ARC**
“Adaptive Replacement Cache,” ZFS’s memory-based read cache that intelligently keeps frequently accessed data in RAM. Improves performance but requires adequate memory allocation.
See [Adaptive Replacement Cache - Wikipedia](https://en.wikipedia.org/wiki/Adaptive_replacement_cache)
**Zpool topologies**
The various ways drives can be organized in a ZFS pool, such as mirrors, RAIDZ arrays, or combinations. Determines redundancy, performance, and storage efficiency.
See [ZFS Pool Configuration - OpenZFS Documentation](<https://openzfs.github.io/openzfs-docs/Basic Concepts/>)