Internal Boot FAQ (7.3+) | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
This page contains frequently asked questions about internal boot in Unraid OS. For general licensing questions, see the [Licensing FAQ](/unraid-os/troubleshooting/licensing-faq/). For TPM-based licensing questions, see the [TPM Licensing FAQ (7.3+)](/unraid-os/troubleshooting/tpm-licensing-faq/).
If you'd rather watch a step-by-step walkthrough, these videos cover both common internal boot paths.
* [Set up a new server with internal boot](https://www.youtube.com/watch?v=NMHaMaa8iV0)
* [Convert an existing server to internal boot](https://www.youtube.com/watch?v=sruWM1PqjVo)
**New server setup**
**Existing server conversion**
### I switched from flash boot to internal boot, but the system still boots from flash. What should I do?[​](#internal-boot-bios-order)
### Why would I use internal boot instead of a USB flash drive?[​](#internal-boot-benefits)
Internal boot is optional. If your USB flash boot setup is reliable and fits your server, you do not need to switch just because internal boot exists.
Internal boot solves a few practical problems:
* It reduces reliance on USB flash media. Internal SSD, NVMe, or eMMC devices are generally more durable than inexpensive USB flash drives and are less likely to be bumped, removed, or damaged.
* It supports mirrored boot devices. With two internal boot devices, Unraid can continue booting if one device fails.
* It works better for systems where USB boot is awkward, exposed, unreliable, or not preferred by the hardware design.
* It lets you choose a dedicated boot pool for boot-only devices, or a boot + data pool when you want to reserve part of a larger device for boot and use the remaining capacity as a normal pool.
Internal boot does not make the array faster during normal operation, and it is not required for servers that are already booting reliably from USB.
### I switched from flash boot to internal boot, but the system still boots from flash. What should I do?[​](#internal-boot-bios-order)
Unraid attempts to update the UEFI boot order automatically. If that does not take effect, manually move your internal boot device(s) to the top of your BIOS/UEFI boot order, save changes, and reboot.
### What should I do if I see "prohibited by secure boot policy" after enabling internal boot?[​](#internal-boot-secure-boot)
Disable **Secure Boot** in your BIOS/UEFI settings, then reboot.
### Does an internal boot SSD or NVMe device count toward my attached storage device limit?[​](#internal-boot-drive-count)
Yes. Internal boot SSD/NVMe devices count toward your attached device limit.
Unraid does not currently exclude internal boot drives from the attached device count. If you use mirrored internal boot, both boot devices count.
Specifically, attached storage devices include all devices present before array start, except one eMMC device and one USB device. See [Licensing FAQ](/unraid-os/troubleshooting/licensing-faq/).
### Can I configure internal boot with two SSDs in a mirrored setup for redundancy?[​](#internal-boot-mirror)
Yes. Mirrored internal boot is supported by default.
Internal boot uses ZFS, and a mirrored setup uses a ZFS mirror for redundancy. If one boot drive fails, Unraid continues running in a degraded state. Replace the failed device through the normal Unraid drive assignment flow to restore the mirror.
### Can I enable internal boot and still license from flash?[​](#internal-boot-flash-license)
Yes. The licensing method is independent of the boot method.
When you use internal boot with a separate USB flash device for licensing, the licensing USB must be discoverable by its FAT volume label. Use the default label `UNRAID` unless your boot configuration sets a matching `unraidlabel=` kernel parameter.
For example, if the licensing USB is labeled `MYLABEL`, the boot configuration must include:
```
`
unraidlabel=MYLABEL
`
```
Custom labels must use 11 characters or fewer. Use uppercase letters `A-Z`, numbers `0-9`, hyphens (`-`), or underscores (`\_`).
For TPM-based licensing details, see the [TPM Licensing FAQ (7.3+)](/unraid-os/troubleshooting/tpm-licensing-faq/).
### How does flash backup work if I use internal boot?[​](#internal-boot-flash-backup)
Restore the backup to a USB flash drive first using the [Unraid USB Flash Creator](https://unraid.net/download), then boot from that restored USB device.
After the server starts, go to ***Settings → Onboarding Wizard***, choose **internal boot**, and complete the switch. Unraid copies the restored boot configuration to the selected internal boot device(s) during that process.
You do not manually place the flash backup files into the internal boot partition.
For the full backup and restore steps, see [Automated flash backup](/unraid-connect/automated-flash-backup/).
* [I switched from flash boot to internal boot, but the system still boots from flash. What should I do?](#internal-boot-bios-order)
* [Why would I use internal boot instead of a USB flash drive?](#internal-boot-benefits)
* [I switched from flash boot to internal boot, but the system still boots from flash. What should I do?](#internal-boot-bios-order)
* [What should I do if I see "prohibited by secure boot policy" after enabling internal boot?](#internal-boot-secure-boot)
* [Does an internal boot SSD or NVMe device count toward my attached storage device limit?](#internal-boot-drive-count)
* [Can I configure internal boot with two SSDs in a mirrored setup for redundancy?](#internal-boot-mirror)
* [Can I enable internal boot and still license from flash?](#internal-boot-flash-license)
* [How does flash backup work if I use internal boot?](#internal-boot-flash-backup)