Unraid Connect overview & setup | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
**Unraid Connect** is a cloud-enabled companion designed to enhance your Unraid OS server experience. It makes server management, monitoring, and maintenance easier than ever, bringing cloud convenience directly to your homelab or business setup.
Unraid Connect works seamlessly with Unraid OS, boosting your server experience without altering its core functions. You can think of Unraid Connect as your remote command center. It expands the capabilities of your Unraid server by providing secure, web-based access and advanced features, no matter where you are.
With Unraid Connect, you can:
* Monitor your server and manage supported Connect features from any device, anywhere in the world.
* Monitor real-time server health and resource usage, including storage, network, and Docker container status.
* Perform and schedule secure online flash backups to protect your configuration and licensing information.
* Receive notifications about server health, storage status, and critical events.
* Manage supported server actions through the Connect dashboard without exposing the full WebGUI to the internet.
* Use remote access links and server deep linking to navigate to specific management pages or troubleshoot issues quickly.
* Manage multiple servers from a single dashboard, making it perfect for users with more than one Unraid system.
Unraid Connect is more than just an add-on; it's an essential extension of the Unraid platform, designed to maximize the value, security, and convenience of your Unraid OS investment.
[**Click here to dive in to Unraid Connect!**](https://connect.myunraid.net)
## Data collection and privacy[​](#data-collection-and-privacy)
**Click to see what data is collected and how we handle it**
Unraid Connect prioritizes your privacy and transparency. Here’s what you need to know about how we handle your data:### What data is collected and why
When your server connects to Unraid.net, it establishes a secure connection to our infrastructure and transmits only the necessary data required for a seamless experience in the Unraid Connect Dashboard. This includes:
* Server hostname, description, and icon
* Keyfile details and flash GUID
* Local access URL and LAN IP (only if a certificate is installed)
* Remote access URL and WAN IP (if remote access is turned on)
* Installed Unraid version and uptime
* Unraid Connect plugin version and unraid-api version/uptime
* Array size and usage (only numbers, no file specifics)
* Number of Docker containers and VMs installed and running
We use this data solely to enable Unraid Connect features, such as remote monitoring, management, and notifications. It is not used for advertising or profiling.### Data retention policy
* We only keep the most recent update from your server; no past data is stored.
* Data is retained as long as your server is registered and using Unraid Connect.
* To delete your data, simply uninstall the plugin and remove any SSL certificates issued through Let's Encrypt.
### Data sharing
* Your data is **not shared with third parties** unless it is necessary for Unraid Connect services, such as certificate provisioning through Let's Encrypt.
* We do not collect or share any user content, file details, or personal information beyond what is specified above.
For more details, check out our [Policies](https://unraid.net/policies) page.
## Installation[​](#installation)
Unraid Connect is available as a plugin that requires Unraid OS 6.10 or later. Before you start, make sure your server is connected to the internet and you have the [Community Applications](/community-applications/) plugin installed.
To install Unraid Connect:
1. Navigate to the **Apps** tab in the Unraid WebGUI.
2. Search for **Unraid Connect** and proceed to install the plugin. Wait for the installation to fully complete before closing the dialog.
3. In the top right corner of your Unraid WebGUI, click on the Unraid logo and select **Sign In**.
1. Sign in with your Unraid.net credentials or create a new account if necessary.
2. Follow the on-screen instructions to register your server with Unraid Connect.
3. After registration, you can access the [Unraid Connect Dashboard](https://connect.myunraid.net) for centralized management.
note
Unraid Connect requires a myunraid.net certificate for secure remote management and access. To provision a certificate, go to ***Settings → Management Access*** in the WebGUI and click **Provision** under the Certificate section.
## Dashboard[​](#dashboard)
The **Unraid Connect Dashboard** offers a centralized, cloud-based view of all your registered Unraid servers, with features like:
* **My Servers:** All linked servers appear in a sidebar and as interactive tiles for easy selection.
* **Status (at a glance):** Quickly see which servers are online or offline, along with their Unraid OS version, license type, and recent activity.
* **Health and alerts:** Visual indicators show server health, notifications, and update status.
When you click **Details** on a server, you will see:
* **Online/Offline:** Real-time connectivity status.
* **License type:** Starter, Unleashed, or Lifetime.
* **Uptime:** Duration the server has been running.
* **Unraid OS version:** Current version and update availability.
* **Storage:** Total and free space on all arrays and pools.
* **Health metrics:** CPU usage, memory usage, and temperature (if supported).
* **Notifications:** Hardware/software alerts, warnings, and errors.
* **Flash backup:** Status and date of the last successful backup.
## Managing your server remotely[​](#managing-your-server-remotely)
tip
For full remote administration, prefer the official [Tailscale integration](/unraid-os/system-administration/secure-your-server/tailscale/). It gives you private remote access to the WebGUI and services without exposing them to the public internet.
Signing in to Unraid Connect gives you secure dashboard access without exposing the WebGUI directly to the internet. The server maintains a secure outbound connection that enables supported Connect features with restricted API access.
If you also enable **Unraid Connect Remote Access**, that separate feature exposes the full WebGUI through WAN port forwarding or UPnP. Use it only when you specifically need public browser access to the WebGUI.
Remote management features include:
* **Dashboard-based management:** Use supported Connect controls without opening the full WebGUI to the internet.
* **Optional Remote WebGUI access:** Access the full WebGUI from anywhere if you separately enable Unraid Connect Remote Access.
* **Array controls:** Start or stop arrays and manage storage pools through supported Connect actions.
* **Docker and VM management:** View, start, stop, and monitor containers and VMs.
* **Parity & Scrub:** Launch parity check or ZFS/BTRFS scrub jobs
* **Flash backup:** Trigger and monitor flash device backups to the cloud.
* **Diagnostics:** Download a diagnostics zip for support
* **Notifications:** Review and acknowledge system alerts.
* **Server controls:** Reboot or shut down your server remotely.
* **User management:** Manage Unraid.net account access and registration.
You can manage multiple servers from any device - phone, tablet, or computer - with a single browser window.
## Deep linking[​](#deep-linking)
Deep linking in Unraid Connect lets you jump directly to specific sections of your Unraid WebGUI with a single click. Simply click any of the circled link buttons (below) in the Connect interface to go straight to the relevant management page for your server.
## Customization[​](#customization)
Unraid Connect provides a flexible dashboard experience, allowing you to personalize your server view and appearance. The customization options are organized below for easy reference.
* Change banner image
* Rearrange dashboard tiles
* Switch themes
To display your server’s banner image on the Connect dashboard, upload or select a banner image from your WebGUI under ***Settings → Display Settings → Banner***. This banner will automatically appear in your Connect dashboard for that server.
## License management[​](#license-management)
Managing your licenses in Unraid Connect is easy. Under the **My Keys** section, you can:
* View or reissue a key to a new USB.
* Upgrade your license tier directly from the Connect UI.
* Download registration key files for backup or transfer.
* Review license status and expiration (if applicable).
You don’t need to leave the Connect interface to manage or upgrade your licenses.
## Language localization[​](#language-localization)
Unraid Connect supports multiple languages to cater to a global user base. You can change your language preference through the language selector in the Connect interface.
To change your language preference:
1. Open the Connect UI.
2. Go to the language selector.
1. Select your preferred language from the list.
The interface will update automatically to reflect your selection.
## Signing out[​](#signing-out)
You can sign out of Unraid Connect anytime from ***Settings → Management Access → Unraid Connect → Account Status*** by clicking the **Sign Out** button.
When you sign out:
* Your server remains listed on the Connect dashboard, but you lose access to remote management features.
* Remote access, cloud-based flash backups, and other Unraid Connect features will be disabled for that server.
* You can still download your registration keys, but you cannot manage or monitor the server remotely until you sign in again.
* Signing out does **not** disconnect your server from the local network or affect local access.
## Uninstalling the plugin[​](#uninstalling-the-plugin)
When you uninstall the Unraid Connect plugin:
* All flash backup files will be deactivated and deleted from your local flash drive.
* Cloud backups are marked for removal from Unraid servers; they will be retained for 30 days, after which they are permanently purged. For immediate deletion, [disable Flash Backup](/unraid-connect/automated-flash-backup/) before uninstalling.
* Remote access will be disabled. Ensure that you remove any related port forwarding rules from your router.
* Your server will be signed out of Unraid.net.
note
Uninstalling the plugin does **not** revert your server's URL from `https://yourpersonalhash.unraid.net` to `http://computername`. If you wish to change your access URL, refer to [Disabling SSL for local access](/unraid-os/system-administration/secure-your-server/securing-your-connection/#disabling-ssl-for-local-access).
## Connection errors[​](#connection-errors)
If you encounter connection errors in Unraid Connect, [open a terminal](/unraid-os/system-administration/advanced-tools/command-line-interface/) from the WebGUI and run:
```
`
unraid-api restart
`
```
* [Data collection and privacy](#data-collection-and-privacy)
* [Installation](#installation)
* [Dashboard](#dashboard)
* [Managing your server remotely](#managing-your-server-remotely)
* [Deep linking](#deep-linking)
* [Customization](#customization)
* [License management](#license-management)
* [Language localization](#language-localization)
* [Signing out](#signing-out)
* [Uninstalling the plugin](#uninstalling-the-plugin)
* [Connection errors](#connection-errors)