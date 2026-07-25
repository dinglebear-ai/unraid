Licensing FAQ | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
This page contains frequently asked questions about Unraid OS licensing. For general troubleshooting questions, see the [main FAQ](/unraid-os/troubleshooting/faq/).
## License Ownership[​](#license-ownership)
### Do I own my software license?[​](#own-license)
When you [purchase an Unraid OS license](https://unraid.net/pricing), you own a perpetual copy of the software. Your license is valid forever and does not expire, even if you choose not to pay for future updates.
## Purchasing[​](#purchasing)
### How do I purchase Unraid?[​](#purchase-unraid)
You have two options for purchasing Unraid:
1. **From the WebGUI:** If you have started a trial, you can purchase a license or upgrade directly from the top-right menu in the WebGUI.
2. **With an activation code:** Purchase an Unraid license activation code from the [Unraid website](https://unraid.net/pricing). Activation codes do not expire and can be redeemed at any time.
All licenses are per server. Use the free 30-day trial to ensure Unraid meets your needs before purchasing, as all sales are final.
### How do I redeem a license activation code?[​](#redeem-activation-code)
See [Redeem Activation Code](/unraid-account/redeem-activation-code/)
### I'm a reseller/OEM needing to purchase a license on behalf of my customer. What should I do?[​](#oem-purchase)
You can purchase a license through the WebGUI or by obtaining an activation code from the [Unraid website](https://unraid.net/pricing).
At checkout, select the "OEM" option and enter your purchase details, including your customer's name and email address. The license key will be issued in your customer's name and sent directly to them. You'll also find an invoice download link after checkout.
For bulk OEM/reseller pricing (10 licenses or more), [contact Unraid](https://unraid.net/contact) for special pricing.
## License Management[​](#license-management)
### How do I upgrade my Unraid license?[​](#upgrade-license)
You can upgrade your license at any time from within the WebGUI (***Tools → Registration***) or [via the account portal](https://account.unraid.net/keys) (by clicking **••• More** and selecting **Upgrade Key**).
|Upgrade PathOne-Time Upgrade FeeNew Device Limit¹|Starter → Unleashed$69 USDUnlimited²|Starter → Lifetime$209 USDUnlimited²|Unleashed → Lifetime$149 USDUnlimited²|Basic → Unleashed$49 USDUnlimited²|Plus → Unleashed$19 USDUnlimited²|Basic → Plus$89 USDUp to 12 devices¹|Basic → Pro$139 USDUnlimited²|Plus → Pro$109 USDUnlimited²
**Annual extension fee** (Starter & Unleashed only): $36 USD
1 Attached storage devices include all devices present before array
start, except one eMMC device and one USB device.
2 "Unlimited" means you are not limited by the license, but by
hardware and OS constraints. Additional storage devices can be used for
VMs, unassigned devices, or other Unraid features.\*
### How do I manually install my license keyfile to my boot device?[​](#manual-keyfile-install)
#### Install via WebGUI download[​](#install-via-webgui-download)
1. Navigate to [account.unraid.net/keys](https://account.unraid.net/keys), select **View options** next to your key, then click **Copy Key URL**.
2. Navigate to your server's ***Tools → Registration***.
3. Scroll to the bottom of the Registration page, to the **Install Key** section.
4. Paste the URL into the **Key file URL** field, and click **Install**.
#### Install via network share[​](#install-via-network-share)
1. If your server is running and the boot volume is shared on your network, open the `flash` share (boot device; same share name on most installs) under **Network**.
2. Drag and drop the registration key file into the `config` directory.
3. In the WebGUI, **Stop** the array, then **Start** the array again to apply the new key.
#### Install via USB boot media[​](#install-via-usb-boot-media)
This does not apply if you have configured internal boot.
1. Ensure you have a recent backup of your USB drive. Use [Unraid Connect](/unraid-connect/overview-and-setup/) (recommended) or the local backup option at ***Main → Boot Device → Boot Device Backup*** (on releases before 7.3.0, use ***Main → Flash device → FLASH BACKUP***).
2. Shut down your Unraid server and remove the USB boot device.
3. Insert the USB drive into another computer.
4. Open the USB drive and copy your `.key` file into the `/config` folder.
*Make sure this is the only `.key` file present - delete any others.*
5. Safely eject the USB drive, reinstall it in your server, and reboot.
### How can I determine my registration type?[​](#registration-type)
Navigate to ***Tools → Registration*** in the WebGUI. Here, you can find your current license type and registration details.
For internal boot questions, including flash licensing USB label requirements, see the [Internal Boot FAQ (7.3+)](/unraid-os/getting-started/set-up-unraid/internal-boot-faq/#internal-boot-flash-license).
For TPM-based licensing questions, see the [TPM Licensing FAQ (7.3+)](/unraid-os/troubleshooting/tpm-licensing-faq/).
## License Types & Features[​](#license-types--features)
### Is Unraid OS a subscription?[​](#subscription)
No. Unraid OS is a **perpetual license**:
* **Starter** and **Unleashed** include one year of updates, after which you may pay a $36 USD annual extension fee (optional).
* **Lifetime** includes updates for the life of the product.
* If you choose not to pay the extension fee, you retain your existing version indefinitely; you simply won't receive new major updates.
You continue to own your license even if you stop paying for updates.
### What happens if I don't extend my Starter or Unleashed license?[​](#no-extension)
* You keep your license and can use your current version of Unraid OS indefinitely.
* You won't receive new feature updates or major version upgrades.
* You remain eligible for updates to the latest patch release within your minor version (e.g., if your license lapsed at 7.1.0, you can install any 7.1.x release while 7.1 is a supported minor version).
* Lime Technology supports the two most recent publicly released minor versions at any given time. A "public" release includes Stable, Release Candidate (RC), and Beta builds.
* When a newer minor or major version becomes public — including a public Beta or RC — the oldest currently supported minor version reaches end-of-life (EOL) and no further updates are issued for it.
* Once your minor version is EOL, you can continue running it indefinitely, but you will no longer receive security patches or bug fixes. To receive updates again, extend your license at [unraid.net/pricing](https://unraid.net/pricing) and update to a supported version.
* You can see the current support status of each release in the [Version Archive](https://docs.unraid.net/unraid-os/download_list/).
### What happens with pre-releases (Beta/RC versions)?[​](#pre-release-policy)
* Pre-release (Beta and Release Candidate) versions are for testing and may contain bugs.
* Only install pre-releases on non-production systems.
* A public pre-release counts as the current public minor series when determining which minor series are supported.
* Support for a specific pre-release build ends when it is superseded by a newer pre-release or the corresponding stable release.
* Your license must be eligible for OS updates on the stable release date to receive the stable version.
* If your license expires before the stable release, you must extend your license to upgrade or roll back to a supported stable version.
* Your license remains valid after expiration; you only need an active license for new updates.
### What does "unlimited" mean for attached storage devices?[​](#unlimited-storage)
"Unlimited" refers to the maximum number of storage devices you can attach to your Unraid server, based on your license tier.
Here are the current limits:
|License TierParity-Protected ArrayNamed PoolsDevices per PoolTotal Attached Storage Devices|StarterUp to 6 (including parity)Up to 6Up to 6Up to 6¹|UnleashedUp to 30 (28 data + 2 parity)Up to 34Up to 200Unlimited²|LifetimeUp to 30 (28 data + 2 parity)Up to 34Up to 200Unlimited²
1 Attached storage devices include all devices present before
array start, except one eMMC device and one USB device.
2 "Unlimited" means you are not limited by the license, but by
hardware and OS constraints. Additional storage devices can be used for
VMs, unassigned devices, or other Unraid features.\*
## Troubleshooting[​](#troubleshooting)
### What happens if my boot device fails? Do I have to repurchase a license?[​](#usb-failure-license)
No, you do not need to repurchase your license if your boot device fails (for typical setups, the USB drive that holds Unraid).
To transfer your license:
1. Prepare new, high-quality [boot media](/unraid-os/getting-started/set-up-unraid/create-your-bootable-media/) (for example a USB flash drive).
2. Install Unraid OS on the new device using the USB Flash Creator or a manual method.
3. Boot your server with the new boot device.
4. Go to ***Tools → Registration*** in the WebGUI.
5. Click **Replace Key** and follow the prompts to transfer your license to the new device.
The first transfer can be done at any time, while subsequent transfers are allowed once every 12 months using the automated system. If you need to transfer your license again before the 12-month period, contact Unraid support with your old and new USB GUIDs for manual assistance.
tip
Routinely back up your boot device using [Unraid Connect](/unraid-connect/overview-and-setup/) to simplify recovery and avoid data loss.
### What should I do if I get an error registering my boot device: '####-####-####-#############' is already registered to another user?[​](#guid-error)
This error indicates that your boot device does not have a unique hardware ID (GUID), which prevents it from being registered with Unraid OS. Use a different USB flash drive. For guidance on choosing a drive (including counterfeits and brand recommendations), see [Create your bootable media](/unraid-os/getting-started/set-up-unraid/create-your-bootable-media/) and [Selecting a replacement device](/unraid-os/system-administration/maintain-and-update/changing-the-flash-device/#selecting-a-replacement-device).
## Trial Licenses[​](#trial-licenses)
### How do Unraid trials work?[​](#trial-license)
* Trial licenses last 30 days and provide full Unraid functionality without a storage device limit.
* You'll need quality USB boot media (typically a USB flash drive) and the Unraid USB Flash Creator tool.
* Consult the [Getting Started guide](/unraid-os/getting-started/set-up-unraid/create-your-bootable-media/) for server setup instructions.
* Trial licenses require an internet connection at boot for initial validation.
* When your trial expires, the array will stop. You may then purchase a license key or request a trial extension.
* You can extend your trial for 15 more days if you need more time to evaluate Unraid. You can do this twice for a total of 60 days (details below).
### How do I extend my trial?[​](#extend-trial)
Unraid trial registration keys last for 30 days and can be extended twice for 15 additional days each time. After two trial extensions, no additional extensions can be granted. To request an extension, you must stop the array, navigate to the **Tools \> Registration** page, and click "Request Extension."
If the two additional extensions were not used and this option does not appear for you, or if it's not working for any reason, please send us the boot device GUID from **Tools \> Registration** to [contact@unraid.net](mailto:contact@unraid.net) or via our support portal at [support.unraid.net](https://support.unraid.net/support/home) and we will be happy to assist.
### Can I transfer my trial key to a new boot device?[​](#trial-key-transfer)
No, trial registrations are only valid on the original boot device. If you want to purchase a license, you can transfer your configuration to new boot media and then purchase a registration key; however, the trial cannot be continued on a new device.
* [License Ownership](#license-ownership)
* [Do I own my software license?](#own-license)
* [Purchasing](#purchasing)
* [How do I purchase Unraid?](#purchase-unraid)
* [How do I redeem a license activation code?](#redeem-activation-code)
* [I'm a reseller/OEM needing to purchase a license on behalf of my customer. What should I do?](#oem-purchase)
* [License Management](#license-management)
* [How do I upgrade my Unraid license?](#upgrade-license)
* [How do I manually install my license keyfile to my boot device?](#manual-keyfile-install)
* [How can I determine my registration type?](#registration-type)
* [License Types & Features](#license-types--features)
* [Is Unraid OS a subscription?](#subscription)
* [What happens if I don't extend my Starter or Unleashed license?](#no-extension)
* [What happens with pre-releases (Beta/RC versions)?](#pre-release-policy)
* [What does "unlimited" mean for attached storage devices?](#unlimited-storage)
* [Troubleshooting](#troubleshooting)
* [What happens if my boot device fails? Do I have to repurchase a license?](#usb-failure-license)
* [What should I do if I get an error registering my boot device: '####-####-####-#############' is already registered to another user?](#guid-error)
* [Trial Licenses](#trial-licenses)
* [How do Unraid trials work?](#trial-license)
* [How do I extend my trial?](#extend-trial)
* [Can I transfer my trial key to a new boot device?](#trial-key-transfer)