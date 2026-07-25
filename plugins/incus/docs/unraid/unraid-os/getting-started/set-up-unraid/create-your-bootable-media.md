Create your bootable media | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
Unraid OS is installed on a USB flash drive, which acts as the boot device for your server. You can create this bootable media using our recommended [Automated install method](/unraid-os/getting-started/set-up-unraid/create-your-bootable-media/#automated-install-method) with our [USB Flash Creator](https://unraid.net/download) tool or by following the [Manual installation method](/unraid-os/getting-started/set-up-unraid/create-your-bootable-media/#manual-install-method). In both cases, you will need a high-quality USB flash drive (between 4 and 32 GB) that has a unique GUID.
Choosing reliable boot media
For typical USB installs, that means a quality USB flash drive; licensing depends on a unique GUID on the boot device. See [Choosing a boot device](#choosing-a-usb-flash-drive) in the manual install section for brand guidance and how to avoid counterfeits.
## Automated install method[​](#automated-install-method)
The automated installation method is the best way to set up Unraid OS. It simplifies the process, reduces errors, and ensures your USB flash drive is ready for most hardware configurations. This method offers the quickest and most reliable path to a successful installation for most users.
1. **Prepare your USB Device:**
Insert a high-quality USB flash drive into your computer.
2. **Download the Unraid USB Flash Creator and install Unraid OS onto the drive.**
[Windows](https://releases.unraid.net/dl/stable/usb-creator.exe) | [Mac](https://releases.unraid.net/dl/stable/usb-creator.dmg) | [Linux](https://releases.unraid.net/dl/stable/usb-creator.appimage)
3. **Complete Setup:**
Customize your server name and network settings.
4. **Eject and Install:**
Safely remove the USB drive and insert it into your server.
5. **Configure your server's BIOS settings**
* Set the boot device to the USB flash drive.
* Enable hardware virtualization features, including IOMMU. (See [HVM & IOMMU configuration](/unraid-os/using-unraid-to/create-virtual-machines/overview-and-system-prep/#hvm--iommu-what-they-enable) for details.)
* **Boot into Unraid OS:**
Save your BIOS configuration, then exit to boot into Unraid OS.
## Manual install method[​](#manual-install-method)
The manual installation method is designed for situations where the USB Flash Creator tool is either unavailable or incompatible with your hardware. This approach provides complete control over the formatting and setup process, making it ideal for advanced users or for troubleshooting specific issues with a USB device.
### Choosing a boot device[​](#choosing-a-usb-flash-drive)
Unraid requires boot media with a unique hardware GUID. For USB boot, this is typically a USB flash drive. Drives that lack a unique GUID or reuse a GUID already registered to another user cannot be used with Unraid and may be blacklisted if they cause registration problems.
The most widely recognized brands, such as SanDisk, Kingston, and Samsung, are often counterfeited. Counterfeit drives frequently do not have a unique GUID, and some legitimate models from these brands have been reported to use non-unique identifiers. If you are unsure whether you are buying an authentic product from an authorized retailer, choosing a less-popular brand may actually be a safer option. These brands usually offer good-quality products but are less targeted by counterfeiters.
Brands often considered reliable by the community for having unique GUIDs (and generally less prone to counterfeiting) include:
* TeamGroup
* Transcend
* PNY
Purchase from **reputable** retailers and avoid auction sites, unknown sellers, and second-hand or gray-market drives. For more information about SanDisk, see the [forum PSA on counterfeit SanDisk USB drives](https://forums.unraid.net/topic/119052-psa-on-sandisk-usbs/).
### Prepare your USB device[​](#prepare-your-usb-device)
1. Plug in the USB drive you are preparing as the boot device.
2. Format it to FAT32 (**not** ex-FAT or NTFS).
3. Set the volume label to `UNRAID` (case-sensitive, all caps).
important
On Windows, drives larger than 32 GB cannot be formatted as FAT32 using the built-in formatting tools (they default to exFAT). For drives larger than 32 GB, you'll need to use a third-party tool like [Rufus](https://rufus.ie/en/) to format as FAT32.
### Download and extract[​](#download-and-extract)
1. Go to the [Unraid Download Archive](/unraid-os/download_list/) and download the ZIP file of your chosen release.
2. Extract the ZIP contents to the USB device.
3. Confirm that the files have been copied.
### Make the USB device bootable[​](#make-the-usb-device-bootable)
note
This section is only needed to enable Legacy boot. If setting up for UEFI boot, there is no need to run these scripts.
Run the appropriate script for your OS:
**Windows 7 or later:**
* Right-click `make\_bootable` and select **Run as administrator**.
**Mac:**
* Double-click `make\_bootable\_mac` and enter your admin password.
**Linux:**
* Copy `make\_bootable\_linux` to your hard drive.
* Unmount the USB drive.
* In the terminal, run:
```
`
sudo bash ./make\_bootable\_linux
`
```
note
The USB drive may briefly disappear and reappear a few times during this process. This is normal.
* [Automated install method](#automated-install-method)
* [Manual install method](#manual-install-method)
* [Choosing a boot device](#choosing-a-usb-flash-drive)
* [Prepare your USB device](#prepare-your-usb-device)
* [Download and extract](#download-and-extract)
* [Make the USB device bootable](#make-the-usb-device-bootable)