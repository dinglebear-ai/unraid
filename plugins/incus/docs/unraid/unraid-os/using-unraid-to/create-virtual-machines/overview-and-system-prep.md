Overview & system prep | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
Virtual machines (VMs) allow you to run full operating systems, such as Windows, macOS, or Linux, on your Unraid server, side-by-side with Docker containers.
VMs are ideal for:
* Running applications that require a full OS or are unavailable as containers.
* Assigning dedicated hardware to guest systems, such as GPUs or USB devices.
* Testing, development, gaming, or running legacy software.
* Hosting multiple isolated environments for different workloads.
For a list of operating systems tested with Unraid, see the [VM Setup](/unraid-os/using-unraid-to/create-virtual-machines/vm-setup/) page.
**Under the hood:** Expand to learn more about the technology stack behind Unraid virtualization
Unraid’s virtualization stack is designed to be flexible and high-performing, utilizing several open-source technologies to support effective virtual machine (VM) management. This overview explains the key components and their interaction in a user-friendly manner.#### Core technologies
|TechnologyWhat it doesWhy it matters|KVMActs as the hypervisor built into the Linux kernel.Allows Unraid to run VMs smoothly with hardware acceleration and minimal overhead.|QEMUEmulates the essential hardware (like motherboard, CPU, and controllers) for VMs.Works alongside KVM to create a complete virtual environment for the guest operating systems.|LibvirtManages VM definitions, as well as storage and network interfaces.Stores VM configurations in `libvirt.img` and provides a consistent management API.|VNCOffers remote graphical access to VMs.Enables interaction with VMs from any device using a browser or VNC client.|VirtIOProvides high-performance paravirtualized drivers for network and disk devices.Enhances VM speed and efficiency, requiring VirtIO drivers installed in the guest OS.|VirtFS (`9p`)Facilitates file system sharing between the host and Linux-based guests.Useful for development and advanced file sharing needs.|HVMSupports hardware-assisted virtualization (Intel VT-x, AMD-V).Necessary for running VMs with full hardware acceleration.|VFIO & IOMMUAllow direct PCI device passthrough to VMs (such as GPU and USB devices).Essential for achieving near-native performance and maintaining security isolation.#### How Unraid implements VM support
* KVM/QEMU: Unraid’s virtualization is fundamentally based on KVM and QEMU, providing robust VM hosting capabilities.
* Libvirt: VM definitions are stored as XML files in `libvirt.img` (typically found in the `system` share).
* **Default shares**:
* `domains`: Holds VM virtual disk images.
* `isos`: Contains installation ISOs and driver images.
* `system`: Stores `libvirt.img` and other critical system files.
* All default to **Use Cache: Prefer** for optimal performance.
* VNC: Unraid features a built-in NoVNC client for easy browser-based access to VMs, with the option to use external VNC clients as needed.
tip
Most users don’t need to interact directly with these technologies, but understanding what goes on “under the hood” can be incredibly useful for advanced troubleshooting and customization. For more detailed information, check out the official documentation for [KVM](https://www.linux-kvm.org/page/Main_Page), [QEMU](https://www.qemu.org/), [Libvirt](https://libvirt.org/), and [VirtIO](https://www.linux-kvm.org/page/Virtio).
## Requirements[​](#requirements)
To run VMs on Unraid, your system must meet the following requirements:
|ComponentMinimum requirementRecommended for VMs & GPU passthrough|CPU64-bit, 4 cores, 2.4 GHz+ (Intel/AMD)8+ cores, 3.0 GHz+ (Intel Core i7/i9, AMD Ryzen 7/9, or newer)|VirtualizationHVM (Intel VT-x or AMD-V)HVM + IOMMU (Intel VT-d or AMD-Vi)|RAM8 GB16 GB or more (add RAM for each active VM)|StorageSSD/NVMe for VM disksHigh-end NVMe for best performance|NetworkGigabit Ethernet (PCIe recommended)2.5G/10G Ethernet for demanding workloads|GPU (optional)Modern NVIDIA RTX (recommended) or AMD Radeon RXRTX 3000/4000 series (NVIDIA recommended for better passthrough compatibility)
GPU passthrough compatibility
NVIDIA GPUs are **generally recommended** for VM passthrough due to better compatibility and reliability. AMD GPUs can be more challenging to pass through, and some newer models (including RX 7000/9000 series) may not work reliably or at all with VMs. If you're planning to use GPU passthrough, consider NVIDIA options for the best experience.
note
Your motherboard BIOS must enable Hardware-assisted virtualization and IOMMU support. Look for settings labeled “Intel VT-x,” “Intel VT-d,” “AMD-V,” or “AMD-Vi.”
### VM resources[​](#vm-resources)
|VM typeRAM per VMvCPUs per VMUse case examples|Virtual server1–2 GB1–2Lightweight Linux, utility VMs|Virtual desktop4–8 GB2–4Windows 11, Ubuntu desktop, RDP|Hybrid/gaming VM8–16 GB+4–8+GPU passthrough, gaming, ML
* Memory and CPU are only consumed while VMs are running.
* Plan for peak usage if running multiple VMs simultaneously.
* Always allocate resources based on guest OS and workload requirements.
### HVM & IOMMU: What they enable[​](#hvm--iommu-what-they-enable)
* HVM support
* IOMMU support
HVM (Hardware Virtual Machine), also known as Intel VT-x or AMD-V, enables your CPU to run virtual machines with hardware acceleration.
* Required for creating and running any VM on Unraid.
* Provides efficient CPU virtualization and better performance compared to software-only virtualization.
* Most modern CPUs (2015 and newer) include this feature.
How to check support
In the WebGUI, click **Info** in the top menu.
* **HVM support:** Shows if hardware virtualization is present and enabled.
* **IOMMU support:** Shows if device passthrough is available and enabled.
### Graphics device passthrough[​](#graphics-device-passthrough)
Passing a GPU to a VM allows for near-native graphics performance, making it ideal for gaming, creative work, or machine learning.
* NVIDIA
* AMD
* All modern RTX (3000/4000 series) support passthrough and are recommended for the best performance.
* Quadro and some older GTX cards are also supported, but it's important to check for current driver compatibility.
General tips
* Use OVMF (UEFI) for VMs with modern GPUs.
* Always use the latest Unraid version for improved hardware support.
* Technologies like NVIDIA Optimus may allow GPU passthrough for laptops or advanced setups, but results vary.
Always changing
Hardware and driver compatibility changes rapidly. Before purchasing a GPU for passthrough, check the [Unraid forums](https://forums.unraid.net/) and vendor documentation for up-to-date reports and user experiences.
## System preparation[​](#system-preparation)
Before you create virtual machines, complete these essential setup tasks to ensure your system is ready.
### Adjust BIOS settings[​](#adjust-bios-settings)
To fully utilize Unraid's virtualization capabilities, your BIOS must enable hardware-assisted virtualization and I/O memory management. Look for settings labeled **Virtualization**, Intel VT-x, **Intel VT-d**, AMD-V, or **AMD-Vi** and set them to **Enabled**.
note
BIOS interfaces vary by manufacturer. Check your motherboard manual for the exact location of these settings.
### Configure a network bridge[​](#configure-a-network-bridge)
Virtual machines can connect to your network using one of two bridge types. Choose the one that best fits your needs:
|Bridge typeDescriptionUse case|**Private NAT (virbr0)**Managed by libvirt. This option provides an internal DHCP server and an isolated subnet. VMs can access the internet and host file shares, but are isolated from other network devices.Ideal for isolated VMs needing internet and host access but no LAN visibility.|**Public bridge (br0)**Managed by Unraid. This option connects VMs directly to your LAN, with IPs assigned by your router. MAC addresses are preserved for consistent IP assignment.Best for VMs that should function as regular devices on your network, accessible from other devices.
important
If your Unraid server is connected to Wi-Fi, using the **Private NAT (virbr0)** network bridge for your virtual machines is recommended. This is because Wi-Fi interfaces support only a single MAC address, which restricts the use of public bridges and custom network types. By utilizing the **virbr0** bridge, your VMs will have complete network access through NAT, although they will not be directly accessible from other devices on your local area network (LAN). However, you can still access the VMs via VNC through the host.
* Enable the public bridge in ***Network settings → Enable bridging***.
* Set your preferred bridge as the **Default network bridge** in VM settings. You may need to enable advanced view to see this option.
### User shares for virtualization[​](#user-shares-for-virtualization)
Unraid creates two default user shares for virtualization:
* `isos`: This share stores installation media files for your VMs.
* `domains`: This share holds virtual machine virtual disk images and configuration files.
Consider creating a separate share for VM backups to protect your data.
#### Share configuration recommendations
* Store active VM virtual disk images on a cache-only share for the best performance.
* Using SSDs in your cache pool significantly improves VM responsiveness.
* Cache usage for the `isos` share is optional.
important
Do not store active virtual machines on a share with **Use cache** set to **Yes**. This can cause VMs to be moved to the array during the Mover process, leading to degraded performance.
## Set up virtualization preferences[​](#set-up-virtualization-preferences)
Before you begin, ensure your system is ready for virtualization (see [System preparation](#system-preparation)). Setting your virtualization preferences in Unraid helps ensure your virtual machines (VMs) are configured for optimal performance and compatibility.
To set your virtualization preferences:
1. In the WebGUI, go to ***Settings → VM Manager***.
2. **For Windows VMs:**
* Download the latest stable VirtIO Windows drivers ISO from the [official repository](https://github.com/virtio-win/virtio-win-pkg-scripts/blob/master/README.md).
* Copy the VirtIO ISO file to your **isos** share.
* In **VM Manager**, use the file picker for **VirtIO Windows Drivers ISO** to select the ISO you just copied.
* (Optional) Override the default driver ISO for individual VMs in **Advanced View**.
* **Select a default network bridge:**
* Choose `virbr0` for a private network bridge, or select a public bridge (e.g., `br0`) created in **Network Settings**.
* (Optional) Override the default network bridge for each VM in **Advanced View**.
* **PCIe ACS override (Advanced):**
* Toggle **PCIe ACS Override** to **On** if you need to assign multiple PCI devices (like GPUs or USB controllers) to different VMs.
* This option breaks apart IOMMU groups, allowing more flexible device passthrough.
warning
This setting is experimental and may affect system stability. Use with caution.
5. Click **Apply** to save your settings.
* [Requirements](#requirements)
* [VM resources](#vm-resources)
* [HVM & IOMMU: What they enable](#hvm--iommu-what-they-enable)
* [Graphics device passthrough](#graphics-device-passthrough)
* [System preparation](#system-preparation)
* [Adjust BIOS settings](#adjust-bios-settings)
* [Configure a network bridge](#configure-a-network-bridge)
* [User shares for virtualization](#user-shares-for-virtualization)
* [Set up virtualization preferences](#set-up-virtualization-preferences)