Encrypting your data | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
Encrypting your drives in Unraid adds a strong layer of protection for sensitive data, helping to prevent unauthorized access if a drive is lost or stolen. Encryption is available for the array and the cache pool. However, be aware that encryption can complicate data recovery, so it should be used only when you require a specific level of data confidentiality, such as when storing sensitive personal, business, or regulated information.
caution
Encryption increases your data security, but can complicate recovery from hardware failure. **Only enable encryption if you have a genuine need and a reliable backup system.** If you lose your encryption key or key file, your data will be permanently inaccessible.
**When should you consider encrypting your drives?** - Click to expand/collapse
* You store confidential, regulated, or sensitive data on your Unraid server.
* You are concerned about data theft if a drive is physically removed or stolen.
* You need to comply with organizational or legal data protection requirements.
If you use Unraid mainly for home media or non-sensitive files, encryption may not be necessary and can complicate troubleshooting and recovery.
## How to encrypt a drive in Unraid[​](#how-to-encrypt-a-drive-in-unraid)
warning
Encrypting a drive will erase all existing data on that drive.
Before encrypting
Move all data off the drive you want to encrypt to another location (another drive in your array, a cache pool, or external backup). For details on safely moving your data, see [Converting to a new file system type](/unraid-os/using-unraid-to/manage-storage/file-systems/#converting-to-a-new-file-system-type).
To encrypt a drive:
1. Go to the **Main** tab in the WebGUI.
2. Stop the array.
3. Select the drive you want to encrypt.
4. In **File system type**, choose the encrypted version of your desired file system (e.g., `xfs-encrypted`, `btrfs-encrypted`).
5. Click **Apply** to commit the change.
6. Click **Done** to return to the **Main** tab. The drive will now appear unmountable, and you'll have the option to format unmountable drives.
7. Double-check that you have selected the correct drive, then [format it](/unraid-os/using-unraid-to/manage-storage/file-systems/#creating-a-file-system-formatting) to complete the encryption setup.
After enabling encryption, you must provide the encryption key or key file each time you start the array. Once unlocked, encrypted drives function just like any other volume in Unraid.
## Encryption key management[​](#encryption-key-management)
Unraid requires the same encryption key or key file for all encrypted drives in your system.
* You can use a passphrase or a key file (like a random image file).
* Store your encryption key or key file in a secure, offline location. Do not rely solely on your Unraid server for key storage.
* If you lose the key or key file, your encrypted data cannot be recovered—no exceptions.
Encrypted drives use the industry-standard LUKS format, which can be unlocked on any modern Linux system with the correct key.
* [How to encrypt a drive in Unraid](#how-to-encrypt-a-drive-in-unraid)
* [Encryption key management](#encryption-key-management)