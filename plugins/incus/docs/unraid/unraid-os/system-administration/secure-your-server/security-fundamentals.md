Security fundamentals | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
Principle of least privilege
The principle of least privilege means granting users and devices only the minimum access necessary to perform their tasks, never more. This approach limits potential damage from compromised accounts or accidental actions and is a core concept in modern security, including zero trust models. Apply this principle throughout your Unraid configuration, especially when creating share users and assigning permissions.
## Controlling access to shared folders[​](#controlling-access-to-shared-folders)
### Choosing a network file sharing protocol[​](#choosing-a-network-file-sharing-protocol)
When sharing files with your Unraid server over your home or office network, you have some choices about how to connect. Unraid supports popular methods, known as communication protocols, that help devices talk to each other.
|ProtocolPrimary UseAdvantageDisadvantageRecommended Use Cases|SMB (Server Message Block)Native Windows/macOS integrationBuilt-in Windows support; supports printers and VM storage; fast with large filesOlder versions (SMBv1) insecure; slower with small filesWindows and Mac networks; mixed resource environments (printers, VMs)|NFS (Network File System)Native Unix/Linux integrationOptimized for Linux/Unix; efficient with small files; low overheadRequires extra tools for Windows; network reliability critical; limited lockingLinux and Unix environments; small file operations; static data workloads|FTP (File Transfer Protocol)Cross-platform compatibilityUniversal client support; simple setup; batch file transfersPlaintext protocol with no encryption; credentials sent unencrypted; outdated securityNon-sensitive or legacy transfers only; use FTPS (FTP over TLS) or SFTP (FTP over SSH) for secure file transfer
important
Starting with Unraid version 6.9, support for **AFP (Apple Filing Protocol)** has been removed. To ensure that your Mac computers work well with your Unraid server, including features like Time Machine backups, go to ***Settings → SMB*** and turn on **Enhanced macOS interoperability**.
Deciding which protocol to use depends on the types of devices you have and what you need to do with your files. By default, Unraid enables SMB because it's widely supported by modern Windows and macOS systems. NFS and FTP are turned off but can be enabled if needed.
For instance, if you use an FTP client to connect to your Unraid server, you can easily transfer large files and even pause and resume your uploads or downloads if needed.
### Managing network visibility of shares[​](#managing-network-visibility-of-shares)
You can set up different access permissions for your network folders (shares) in Unraid by:
1. **Go to the Shares Tab**: Start by clicking on the **Shares** tab in the WebGUI.
2. **Select a Share**: Choose an existing share that you want to adjust.
3. **Scroll to Security Settings**: At the bottom of the share settings page, you’ll see a section for security options for each network protocol that is enabled.
4. **Adjust the Export Setting**: This setting controls how the share appears on the network. You have three options:
* **Yes**: The share is visible and anyone browsing the network can access it.
* **Yes (Hidden)**: The share won’t show up in the network browse lists, but if someone knows the name of the share, they can still access it.
* **No**: The share is completely hidden and not accessible through that specific protocol.
By tweaking these options, you can manage who can see and access each share, making it easier to keep everything secure while ensuring the right people have the access they need, whether they are using SMB, NFS, or FTP connections.
### Setting user permissions for shares[​](#setting-user-permissions-for-shares)
Share security controls how users access shared files on your system. You can set up a share to require a username and password for accessing files, limit access to read-only, or make it completely public with no credentials needed.
Example
If you create a `movies` share on your Unraid server, you can choose whether to require a valid username and password just for reading data or allow public access. If you need to add users, a root user can create share users by following the process in [**User management**](/unraid-os/system-administration/secure-your-server/user-management/#add-users).
When you go to the **Shares** tab and select a share, you'll see its settings, including a security section where you can manage [access permissions](#managing-network-visibility-of-shares) based on the protocols you have enabled. This way, you can tailor who has access to your files depending on their needs.
The **Security** setting has the following options:
|TypeExplanationCommon Use Case|**Public**Open access: Everyone can read and write to this folder.Suitable for non-sensitive information, like shared media or public downloads.|**Secure**Limited access: Everyone can read, but only certain users can write.Good for shared projects where collaboration is needed, like team folders.|**Private**Restricted access: Only specific users can read or write.Ideal for sensitive information, such as financial records or personal documents.
Windows SMB access
Modern versions of Windows (Windows 10 1709+, Windows 11, Server 2019+) block access to **Public** (guest/anonymous) SMB shares by default, due to stricter security policies. Attempting to connect to a public share will usually fail unless you manually enable insecure guest logons in Windows settings - which is not recommended for security reasons.
**Best Practice:** Set up user accounts and passwords for your Unraid shares and connect using those credentials for reliable access from Windows.
**Credential Limitation:** Windows only allows one set of login credentials per server at a time. If you try to connect to different shares on the same server with different credentials, the connection will fail.
**Workaround:** If you encounter credential issues, try connecting to one share using the server's name and another using its IP address. Windows treats these as separate servers.
For more details, see [Microsoft's documentation on SMB guest access](https://learn.microsoft.com/en-us/windows-server/storage/file-server/enable-insecure-guest-logons-smb2-and-smb3).
## Network security[​](#network-security)
### Set a strong root password[​](#set-a-strong-root-password)
When you first access the WebGUI after install, you are required to set a password for the root user. However, Unraid does not enforce password complexity requirements - it's up to you as the user to set the degree of password security for your server.
* Go to the **Users** tab, select the root user, and set a password.
* Consider using the **Dynamix Password Validator** plugin from [Community Apps](/community-applications/) for real-time strength feedback.
* For additional guidance, check out the [Bitwarden password strength tool](https://bitwarden.com/) provided online.
### Review and minimize port forwarding[​](#review-and-minimize-port-forwarding)
Forwarding ports from your router to your Unraid server can be necessary for remote access to services, but it exposes your network to significant risks. Only forward ports that you fully understand and need.
|Port(s)Typical useSecurity riskSafer alternative|80 / 443WebGUI (HTTP/HTTPS)Exposes management interface; risk of interception or brute force if password is weakUse Unraid Connect or VPN for remote access, noting Unraid Connect requires WAN port forwarding or UPnP (not an always-on cloud relay)|445SMB (file shares)Exposes shares to the internet; risk of data theft or deletionUse VPN for secure remote file access|111 / 2049NFSExposes NFS shares; similar risks as SMBUse VPN for remote access|22 / 23SSH/TelnetExposes console access; risk of brute force or credential theftUse SSH keys or VPN; never forward Telnet|57xxVNC for VMsExposes VM consoles; risk of unauthorized remote accessUse Unraid Connect or VPN
tip
If you see a port forwarding rule you don’t understand, remove it and monitor for issues. You can always re-add it if necessary.
caution
Never put your server in your network's DMZ. Placing your Unraid server in the DMZ exposes all ports to the internet, dramatically increasing the risk of a compromise. Even with strong passwords, this is never recommended.
## Share access security[​](#share-access-security)
### Control share visibility and permissions[​](#control-share-visibility-and-permissions)
* Use the **Shares** tab in the WebGUI to set each share’s export and security settings.
* Prefer Private or Secure shares for sensitive data. Public shares are accessible by anyone on the network and are blocked by default in modern Windows versions for security reasons.
* Assign user accounts with only the permissions needed for their role (least privilege).
* Limit share access to specific users whenever possible.
### Assign user permissions carefully[​](#assign-user-permissions-carefully)
* Assign users to shares using Read-only or Read/Write access as required.
* The root user account is for system administration and can't access network shares. Create dedicated user accounts for network share access.
* Regularly review user permissions and remove unused accounts.
### Restrict share access to private or read-only[​](#restrict-share-access-to-private-or-read-only)
While passwordless access to shares is convenient, it can also put your data at risk if devices on your local network become compromised. This includes PCs, Macs, mobile devices, and IoT devices. By default, Unraid shares are set to be publicly readable and writable, meaning any device on your network could potentially steal, delete, or encrypt your files if it gets compromised. Additionally, malicious users can upload unwanted data to your server.
* Set sensitive shares to **Private** in the **shares** tab of the WebGUI.
* If a **Public** share is necessary, set it to **Read-only** whenever possible.
* Only give write access to authorized users who have strong passwords.
### Avoid exposing the boot device share - or make it private[​](#avoid-exposing-the-boot-device-share---or-make-it-private)
The Unraid boot device contains critical system and configuration files. While it may be convenient to expose its SMB share (often still named **`flash`** on disk, even when the WebGUI labels the volume **Boot device** on 7.3.0+) for advanced configuration, this introduces significant risk if left public.
* Only expose that share if absolutely necessary and set it to **Private**.
* Require a username and strong password for access.
* Remove or disable the share when not in use to reduce risk.
### Keep your server up to date[​](#keep-your-server-up-to-date)
Regular updates are essential for security. New vulnerabilities (CVEs) are discovered frequently, and Lime Technology actively issues patches for Unraid OS. Updating is only effective if you actually apply the updates.
* Check for updates in ***Tools → Update OS*** in the WebGUI.
* Enable notifications in ***Settings → Notifications*** to be alerted when updates are available.
* Update plugins and Docker containers via the **Apps** tab to ensure all components are secure and compatible.
* Apply updates promptly to ensure your server is protected against known threats.
### Use secure methods for remote administration[​](#use-secure-methods-for-remote-administration)
Never expose the WebGUI directly to the internet. Instead, use secure remote access solutions:
* **Tailscale** is a recommended option, with a dedicated plugin for Unraid. It creates a secure private network (tailnet) for accessing your server and services from anywhere, without the need to expose ports or configure complex firewall rules.
* **WireGuard VPN** is built into Unraid and provides a secure, encrypted tunnel for remote management.
* **OpenVPN** is available as a plugin or Docker container.
* Many modern routers offer built-in VPN support - check your router documentation for setup.
* Signing in to [Unraid Connect](/unraid-connect/overview-and-setup/) allows supported dashboard management without directly exposing the WebGUI to the internet, but the separate Unraid Connect Remote Access feature does require WAN port forwarding or UPnP. Prefer Tailscale when you need full remote WebGUI access.
\* *"WireGuard" and the "WireGuard" logo are registered trademarks of Jason A. Donenfeld.*
* [Controlling access to shared folders](#controlling-access-to-shared-folders)
* [Choosing a network file sharing protocol](#choosing-a-network-file-sharing-protocol)
* [Managing network visibility of shares](#managing-network-visibility-of-shares)
* [Setting user permissions for shares](#setting-user-permissions-for-shares)
* [Network security](#network-security)
* [Set a strong root password](#set-a-strong-root-password)
* [Review and minimize port forwarding](#review-and-minimize-port-forwarding)
* [Share access security](#share-access-security)
* [Control share visibility and permissions](#control-share-visibility-and-permissions)
* [Assign user permissions carefully](#assign-user-permissions-carefully)
* [Restrict share access to private or read-only](#restrict-share-access-to-private-or-read-only)
* [Avoid exposing the boot device share - or make it private](#avoid-exposing-the-boot-device-share---or-make-it-private)
* [Keep your server up to date](#keep-your-server-up-to-date)
* [Use secure methods for remote administration](#use-secure-methods-for-remote-administration)