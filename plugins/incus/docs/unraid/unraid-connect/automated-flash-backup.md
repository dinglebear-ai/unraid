Automated flash backup | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
Backing up your Unraid flash drive is crucial for a quick recovery from issues like hardware failure, accidental deletions, or data corruption. While local backups (such as copying your flash drive to another USB device or network share) allow for easy access and control, they can be vulnerable to theft, fire, or hardware failures that may affect your entire setup. On the other hand, cloud backups provide secure off-site storage for your configuration, safeguarding against local disasters and allowing recovery from anywhere.
Unlike traditional backups that focus on user data, VMs, or Docker containers, flash backups specifically preserve your Unraid OS configuration, licensing, and system settings. This focus enables you to restore your server’s operations swiftly without having to start from scratch. Unraid Connect allows automatic, cloud-based backups of your OS configuration. If your flash device fails, you can quickly restore your latest backup with the [Unraid USB Flash Creator tool](https://unraid.net/download).
Flash backup is fully optional when using Unraid Connect.
tip
Use both local and cloud backup methods for maximum protection. Cloud backups provide an additional layer of resilience that local-only solutions cannot offer.
## Data collection and privacy[​](#data-collection-and-privacy)
**Click to see what data is collected and how we handle it**
Unraid Connect takes your privacy and data seriously when using flash backup:#### Purpose
Flash backup keeps only the configuration files needed to restore your Unraid OS environment. This helps you recover quickly and maintain service continuity in the event that your flash device encounters a failure.#### Data collected
The backup includes only configuration files, ensuring that sensitive information, such as passwords and WireGuard keys, is excluded. Docker template XML files might be part of the backup and could contain application-specific credentials.#### Data retention
Only the latest backup is kept. If a backup exceeds certain limits—specifically, if individual files exceed 10 MB or the total repository size exceeds 100 MB—it will be deleted and recreated. Backups are also removed when you deactivate the flash backup feature or after a specific period of inactivity.#### Data sharing
Flash backup data is never shared with third parties. It's stored exclusively to provide you with backup and restore services.
## Enabling flash backup[​](#enabling-flash-backup)
Unraid Connect excludes sensitive data - like account passwords and WireGuard keys - from backups until full encryption is available. However, Docker template XML files (which might contain application credentials) are included. Encryption solutions are in development.
To activate flash backup:
1. Go to ***Settings → Management Access → Unraid API***.
1. Under **Flash backup**, click **Activate**.
2. Wait for activation and the initial backup to complete. The status will show **Activated: Up-to-date** when finished.
After activation, any configuration changes are automatically backed up to the cloud within 1–2 minutes.
important
Backups do not include `config/shadow` or `config/smbpasswd` files. User accounts are preserved, but passwords are not. You will need to reset all user passwords, including the root password, after restoration. WireGuard keys are also excluded.
Flash backup is designed to store essential configuration files, not a full copy of your flash drive. It does not back up transient files (such as logs) or application binaries. Plugin configurations are included, but application files will need to be redownloaded at boot. Individual files up to 10 MB are backed up; if the total backup exceeds 100 MB, it will be deleted and recreated.
## Restoring a flash backup[​](#restoring-a-flash-backup)
To restore your configuration:
1. Log in to Unraid Connect.
2. Select **Details** on the Dashboard.
3. Click **Generate flash backup** from the Flash backup tile.
4. The system creates a zip file containing your OS configuration and release version.
5. Click **Download flash backup** to get the zip file.
6. Use the [Unraid USB Flash Creator](https://unraid.net/download) to restore the backup to a new flash drive.
### Restoring to internal boot[​](#restoring-to-internal-boot)
If your server uses internal boot, restore the flash backup to a USB flash drive first.
Then:
1. Boot the server from that restored USB flash drive.
2. Go to ***Settings → Onboarding Wizard***.
3. Choose **internal boot**, select the target device(s), and complete the switch.
Unraid copies the restored boot configuration to the new internal boot device as part of the internal boot setup flow. You do not manually extract the flash backup zip into the internal boot partition.
For more details about internal boot, see the [Internal Boot FAQ (7.3+)](/unraid-os/getting-started/set-up-unraid/internal-boot-faq/).
### Post-restoration steps[​](#post-restoration-steps)
After booting with the restored flash drive:
* Re-activate flash backup in ***Settings → Management Access → Unraid API***.
* Reset passwords for all users (including root) on the Users page.
* For each VPN Tunnel and peer in ***Settings → VPN Manager***, generate new keys and download updated client configurations.
* If Internet access is not available immediately after booting, reinstall plugins via ***Apps → Previous Apps*** once connectivity is restored. Configuration files will be ready for use.
## Disabling flash backup[​](#disabling-flash-backup)
To turn off flash backup:
1. In ***Settings → Management Access → Unraid API***, click **Deactivate** for Flash Backup.
2. In the confirmation dialog, check **Also delete cloud backup** if you want to remove your backup immediately. Otherwise, backups will be automatically deleted after a period of inactivity.
## Privacy and security[​](#privacy-and-security)
### Backup encryption[​](#backup-encryption)
Currently, flash backups are stored in the cloud without encryption. As a precaution, sensitive data - including all user and root passwords, as well as all WireGuard keys - is never included in the backup.
### Sensitive data policy[​](#sensitive-data-policy)
To protect your privacy, the following are **never** stored in cloud backups:
* Unraid root or user account passwords
* Public, private, or shared WireGuard keys
Reminder
Flash backup is for configuration recovery only. Always incorporate additional backup strategies for your data and critical secrets.
\* *"WireGuard" and the "WireGuard" logo are registered trademarks of Jason A. Donenfeld.*
* [Data collection and privacy](#data-collection-and-privacy)
* [Enabling flash backup](#enabling-flash-backup)
* [Restoring a flash backup](#restoring-a-flash-backup)
* [Restoring to internal boot](#restoring-to-internal-boot)
* [Post-restoration steps](#post-restoration-steps)
* [Disabling flash backup](#disabling-flash-backup)
* [Privacy and security](#privacy-and-security)
* [Backup encryption](#backup-encryption)
* [Sensitive data policy](#sensitive-data-policy)