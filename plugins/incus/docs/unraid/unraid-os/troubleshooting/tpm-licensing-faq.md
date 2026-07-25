TPM Licensing FAQ (7.3+) | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
This page contains frequently asked questions about TPM-based licensing in Unraid OS. For general licensing questions, see the [Licensing FAQ](/unraid-os/troubleshooting/licensing-faq/). For internal boot questions, see the [Internal Boot FAQ (7.3+)](/unraid-os/getting-started/set-up-unraid/internal-boot-faq/).
### How can I move from flash-based licensing to TPM-based licensing?[​](#tpm)
Unraid 7.3 and later
TPM-based licensing is available in Unraid 7.3 and later.
All new and replacement keys use TPM-based licensing when possible because it is more reliable than flash-based licensing.
To proactively switch to TPM-based licensing, navigate to ***Tools → Registration*** and click **Move License to TPM**. You are taken to the Unraid Account website, where you can approve the replacement request.
After clicking **Move License to TPM**, the Unraid Account flow shows the **Replace License Key** screen:
If the **Move License to TPM** button isn't available, Unraid could not detect your TPM 2.0 device. It may be disabled in your BIOS. Check settings related to **Trusted Computing**, and leave **Secure Boot** disabled.
### What are the benefits of moving to TPM-based licensing?[​](#tpm-benefits)
Traditional USB boot devices are becoming less reliable for some users. TPM-based licensing means your license remains valid even if you change boot hardware.
### What if I get a new motherboard?[​](#tpm-new-motherboard)
You can replace a TPM-based license on a new motherboard, similar to replacing a flash-based license on a new USB device. In this case, only the original license is blacklisted, not the entire motherboard.
### What happens if I update my BIOS? Do I need a new license?[​](#tpm-bios)
TPM should not be affected by BIOS updates. If somehow it is, you can replace your license as if you got a [new motherboard](#tpm-new-motherboard).
### What if my motherboard does not have a TPM device?[​](#tpm-missing)
Moving to TPM-based licensing is not a hard requirement, but many older motherboards include a header where a TPM add-on device can be installed. These devices are inexpensive and widely available.
### Can I switch to TPM-based licensing while booting from flash?[​](#tpm-flash-boot)
Yes, the licensing method is not tied to the boot method.
For internal boot-specific questions, see the [Internal Boot FAQ (7.3+)](/unraid-os/getting-started/set-up-unraid/internal-boot-faq/).
### Can I use TPM from within an Unraid VM?[​](#tpm-vm)
No, this is not supported.
### Can I move my license between TPM and USB if I need to recover from hardware failure?[​](#tpm-usb-replacement)
Yes.
Moving to TPM-based licensing blacklists the license on the original USB device. From there:
* You can move back to a USB device using the license replacement flow.
* You can move from one TPM-equipped motherboard to another using the TPM replacement flow.
If you run into a hardware failure that prevents the normal replacement flow, contact [Unraid support](https://support.unraid.net/support/home) for help.
### Will a TPM reset affect my Unraid license?[​](#tpm-reset)
No. The Unraid TPM license uses your TPM identifiers, so TPM resets should not affect your Unraid license.
* [How can I move from flash-based licensing to TPM-based licensing?](#tpm)
* [What are the benefits of moving to TPM-based licensing?](#tpm-benefits)
* [What if I get a new motherboard?](#tpm-new-motherboard)
* [What happens if I update my BIOS? Do I need a new license?](#tpm-bios)
* [What if my motherboard does not have a TPM device?](#tpm-missing)
* [Can I switch to TPM-based licensing while booting from flash?](#tpm-flash-boot)
* [Can I use TPM from within an Unraid VM?](#tpm-vm)
* [Can I move my license between TPM and USB if I need to recover from hardware failure?](#tpm-usb-replacement)
* [Will a TPM reset affect my Unraid license?](#tpm-reset)