Customize Unraid settings | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
Unraid OS automatically functions but allows further customization of settings such as IP address, hostname, disk tunables, and more via the **Settings** tab in the Unraid **WebGUI**.
Tailscale integration
**Tailscale** is an optional plugin that you can install via the **Apps** tab by searching for "Tailscale". It provides secure remote access to your network and adds a **Tailscale** section to your **Settings** for enhanced remote management capabilities.
Don't forget - the WebGUI includes built-in help. To access help for a specific field, click the prompt next to it, or use the **Help** icon at the top right of the interface to toggle help for all fields.
## System settings[​](#system-settings)
**System Settings** enable you to configure key functionalities like network, share, VM, and disk settings.
### CPU pinning[​](#cpu-pinning)
CPU Pinning allows you to assign specific CPU cores to VMs (Virtual Machines) or Docker containers. This is particularly important for performance-sensitive workloads, such as gaming VMs. Even if you manually assign Docker containers to avoid conflicts with your gaming VM, the host operating system may still utilize those cores for tasks like managing the WebGUI, running a parity check, or performing BTRFS operations.
* When you pin a core to a VM or Docker container, that core is allocated to the VM or container. However, Unraid OS may still access it for routine tasks.
* When you isolate a core, it becomes dedicated to the VM or container and is no longer accessible to Unraid OS.
* You can pin cores without needing to restart your server, but applying CPU isolation changes does require a system restart.
### Date & time[​](#date--time)
On this page, you can set your time zone and toggle the use of up to four NTP servers. You should adjust Unraid to match your time zone for accurate timekeeping.
### Disk settings[​](#disk-settings)
You can modify additional settings for your disk devices on this page. Enable your array to start automatically on boot, adjust disk spin-down timers, and even change advanced driver settings like SMART polling frequency.
### Docker[​](#docker)
Docker containers allow you to integrate pre-configured Linux applications into your Unraid server. For more details, see the [Docker Management](/unraid-os/using-unraid-to/run-docker-containers/managing-and-customizing-containers/) page.
### Identification[​](#identification)
Unraid defaults to the hostname `tower`, but you can change it here. You can also add a description or model number for your system.
### Management access[​](#management-access)
You can configure various access settings for your Unraid server, including enabling Telnet or SSH, setting ports for SSL/TLS, HTTP, and HTTPS, and defining the default landing page for Unraid. For detailed information about securing your WebGUI with SSL certificates, see [Securing your connection](/unraid-os/system-administration/secure-your-server/securing-your-connection/).
### Network settings[​](#network-settings)
By default, Unraid tries to obtain an IP address from a DHCP server on your local network, usually provided by your router. On this page, you can configure a static IP address, set up bonding, bridging, or explore other options. While setting a static IP is recommended, it is not necessary to use Unraid.
#### WiFi setup[​](#wifi-setup)
Unraid supports WiFi connectivity for situations where a wired network connection isn't practical or available. While a wired connection is generally recommended for better stability and performance, a wireless setup can be a suitable alternative when running a cable isn't an option.
Initial setup requirements
For the initial WiFi setup, you'll need either:
* A local keyboard and monitor connected to your server (boot into GUI mode), or
* A temporary wired connection to access the WebGUI
Once WiFi is configured, you can remove the wired connection and manage your server wirelessly.
##### Setting up WiFi[​](#setting-up-wifi)
1. Access the WebGUI and go to ***Settings → Network Settings → Wireless wlan0***.
2. Enable WiFi by toggling the **Enable WiFi** option.
3. Configure the **Regulatory Region**:
* In most cases, it’s best to leave this set to **Automatic**.
* If your preferred network isn't appearing in the scan results, set it to your specific location (country/region).
* Scan for available networks:
* Available WiFi networks should be listed.
* Click the **Connect to WiFi network** (ᯤ) icon next to your preferred network.
* Enter your network credentials:
* Type your WiFi password.
* Review and adjust any additional settings if needed.
* Click **Join this network** to connect.
Docker containers and WiFi
If you plan to use Docker containers with WiFi, ensure to unplug any wired connections **before** starting the Docker service. This helps prevent network configuration conflicts that can occur when both interfaces are active simultaneously.
##### Supported WiFi features[​](#supported-wifi-features)
Unraid's WiFi implementation supports the following:
* **WPA2** and **WPA3 security protocols**, including WPA2/WPA3 Enterprise networks. If both WPA2 and WPA3 are available, Unraid will automatically use WPA3 for enhanced security.
* **Modern WiFi adapters** that have Linux in-kernel driver support. Older adapters may not be compatible.
USB WiFi adapters
If you're using a USB WiFi adapter, check this list of [USB WiFi adapters supported with Linux in-kernel drivers](https://github.com/morrownr/USB-WiFi/blob/main/home/USB_WiFi_Adapters_that_are_supported_with_Linux_in-kernel_drivers.md) to ensure compatibility.
If your WiFi adapter isn't detected, please start a new thread on the [Unraid forums](https://forums.unraid.net/) and provide your diagnostics for investigation.
##### WiFi limitations[​](#wifi-limitations)
WiFi has some limitations compared to wired networking:
* You can only connect to **one WiFi network** at a time.
* Only one wireless NIC is supported - `wlan0`. If your system has multiple wireless adapters (`wlan1`, `wlan2`, etc.), only `wlan0` will be used.
* Unlike wired connections, you **cannot combine multiple wireless connections** to improve reliability.
* **`wlan0` cannot participate in a bond**. You cannot combine WiFi and Ethernet connections in a bond configuration.
* It's best to use either a wired connection or WiFi, but **not both at the same time**. If you need to temporarily connect or disconnect a network cable while using WiFi, your server should automatically adjust to use the active connection within about a minute. For important information about Docker containers when switching between connection types, see the **Docker and virtual machine considerations** section below.
##### Docker and virtual machine considerations[​](#docker-and-virtual-machine-considerations)
When using WiFi, there are specific considerations for Docker containers and virtual machines:
###### Docker containers[​](#docker-containers)
* On ***Settings → Docker***, when WiFi is enabled, the system automatically uses **ipvlan** for custom networks (macvlan is not supported with WiFi).
* Host access to custom networks must be disabled in ***Settings → Docker***.
* Container **Network Type** cannot use `br0`, `bond0`, or `eth0`.
caution
Docker cannot participate in two networks sharing the same subnet. If you switch between wired and wireless connections, you will need to restart Docker and reconfigure all existing containers to use the new interface. This network configuration change requires container reconfiguration. It's strongly recommended to choose either wired or wireless and not switch between them.
###### Virtual machines[​](#virtual-machines)
It's recommended to set your VM **Network Source** to **virbr0** (Private NAT). This mode works with any number of VMs and provides network access through NAT. Note that mDNS does not work through NAT, so the VM will need to access other local network devices by IP address, not hostname. You can add IP addresses and hostnames to the hosts file on the VM operating system to allow access by hostname. The VMs won't be directly accessible from other devices on your LAN, but you can still access them via VNC through the host.
For more information about VM networking, see [Overview and system prep](/unraid-os/using-unraid-to/create-virtual-machines/overview-and-system-prep/).
### Power mode[​](#power-mode)
The **Power Mode** setting allows you to optimize your Unraid server for energy efficiency, balanced operation, or maximum performance. You can choose from available modes - **Best power efficiency**, **Balanced operation**, or **Best performance** - to match your workload and energy preferences. Adjusting Power Mode can help reduce power consumption, lower system temperatures, or provide additional resources for demanding tasks.
Changes take effect immediately and do not require a system restart.
### Global share settings[​](#global-share-settings)
User shares can greatly simplify the organization and access of content across multiple disks in the array. You have the option to specify which disks are allowed to participate in user shares through global inclusion or exclusion settings.
### UPS settings[​](#ups-settings)
Unraid can be connected to an APC (or compatible) UPS (Uninterruptible Power Supply) to allow the system to safely shut down during a power loss while still receiving battery power. You can configure the UPS connection and set policies for the shutdown command on this page.
### VM manager[​](#vm-manager)
**Virtual machines** can turn your server into a desktop or media player, and run applications not designed for Linux. For details on managing VMs on Unraid, see [VM setup](/unraid-os/using-unraid-to/create-virtual-machines/vm-setup/).
## Network services[​](#network-services)
**Network Services** let you configure network communication protocols on your Unraid server, which are essential for user and disk shares. You can also enable an FTP server, a logging server, and set up a VPN for secure remote access.
### NFS (Network file system)[​](#nfs-network-file-system)
NFSv4 support is available in Unraid. You can enable or disable it for user shares and adjust the `fuse\_remember` tunable to help resolve *NFS Stale File Handle* errors.
### SMB (Server message block)[​](#smb-server-message-block)
The SMB protocol is used by Microsoft Windows clients. From this page, you can enable it, define a workgroup, or join an Active Directory domain.
### FTP (File transfer protocol)[​](#ftp-file-transfer-protocol)
Users can connect via FTP only if they are added to the **FTP users** field on this page. If no users are added, the FTP service will not start.
### Syslog server[​](#syslog-server)
The Syslog server permanently stores your system log, which is useful for troubleshooting since Unraid clears the log after each reboot.
### Tailscale[​](#tailscale)
note
The Tailscale section is only available if you have installed the Tailscale plugin.
The Tailscale section allows for secure remote access via the Tailscale VPN. Here, you can log in to connect your Unraid server to your Tailnet, view the assigned IP address and hostname, and enable or disable Tailscale connectivity.
You can also configure your server as a Subnet Router for local devices or as an Exit Node to route internet traffic. This section enables management of advertised routes, exit node status, Docker container integration options, and connection status monitoring for troubleshooting.
### VPN manager[​](#vpn-manager)
You can establish a VPN connection to your Unraid server using [WireGuard](https://www.wireguard.com/) for secure internet connections.
## User preferences[​](#user-preferences)
User Preferences allow you to configure various aspects of your interactions with Unraid OS, including notifications, display settings, UI customization, and the Mover schedule.
### Confirmations[​](#confirmations)
You can enable/disable the requirement for confirmations when performing various tasks from this location.
### Console settings[​](#console-settings)
Allows you to customize the local system console. You can select the keyboard layout, adjust the screen blanking timeout, and enable or disable persistent Bash history across reboots. These options enhance your experience when using Unraid with a connected monitor and keyboard.
### Display settings[​](#display-settings)
Customize the Unraid WebGUI appearance on this page by adjusting the date and time format, number format, and toggling between tabbed and non-tabbed views. You can also select the temperature unit and choose from different themes for the user interface.
### Notification settings[​](#notification-settings)
Unraid can send you notifications about important system events, updates, and alerts through your browser, email, or third-party notification services. The Notification Settings page allows you to control how and when you receive these notifications.
To access Notification Settings, navigate to ***Settings → User Preferences → Notification Settings***.
#### Display and behavior settings[​](#display-and-behavior-settings)
Configure how notifications appear in your browser:
* **Notifications display**: Choose between *Detailed* or *Summarized* notification styles
* **Display position**: Set where notifications appear (*top-right*, *top-left*, *bottom-right*, *bottom-left*, or *center*)
* **Auto-close (seconds)**: How long notifications stay visible before automatically closing
* **Date format**: Choose your preferred date format for notification timestamps
* **Time format**: Choose between *12 hours* or *24 hours* time display
* **Store notifications to boot drive**: Save notification history to your boot device (requires available storage space on the boot device)
#### Notification types[​](#notification-types)
Control which events trigger notifications:
* **System notifications**: General system events and messages
* **Unraid OS update notification**: Alerts when new Unraid OS versions are available
* **Plugins update notification**: Alerts when plugin updates are available
* **Docker update notification**: Alerts when Docker container updates are available
* **Language update notification**: Alerts when language pack updates are available
* **Array status notification**: Alerts about array events and status changes
For each notification type, you're able to set the frequency to *Never check*, or checking daily, weekly, monthly, or, in some cases, even multiple times a day.
#### Delivery methods[​](#delivery-methods)
Choose how you want to receive notifications for each category (*Notices*, *Warnings*, and *Alerts*):
* **Browser**: Display notifications in the WebGUI when you're logged in
* **Email**: Send notifications via email (requires [SMTP configuration](#smtp-settings))
* **Agents**: Send notifications through configured third-party services
tip
Enable **Browser** notifications for immediate visibility when using the WebGUI, and **Email** for alerts when you're away from your server. Use **Agents** to integrate with mobile apps and services like Discord or Telegram.
#### SMTP settings[​](#smtp-settings)
To receive email notifications, you need to configure your email server settings. Unraid supports many email providers including Gmail, Outlook, and custom SMTP servers.
The SMTP settings can be found at ***Settings → User Preferences → Notification Settings → SMTP Settings***.
**Basic configuration:**
* **Preset service**: Select a preset configuration (*Gmail*, *Outlook/Hotmail*, or *Custom*) to auto-fill common settings
* **Sending email address**: The email address notifications will be sent from
* **Email recipients**: Comma-separated list of email addresses to receive notifications
* **Priority in header**: Mark emails as high priority (*Yes* or *No*)
* **Email subject prefix**: Text to prepend to all notification email subjects (default: *Unraid Status:*)
**Server settings:**
* **Mail server**: SMTP server address (e.g., `smtp.gmail.com`)
* **Mail server port**: SMTP port number (common ports: `465` for SSL/TLS, `587` for STARTTLS, `25` for unencrypted)
* **Use SSL/TLS**: Enable SSL/TLS encryption (*Yes* or *No*)
* **Use STARTTLS**: Use STARTTLS for encryption (*Yes* or *No*)
* **Define a TLS certificate**: Specify a custom TLS certificate if needed (*Yes* or *No*)
* **TLS certificate location**: Path to custom certificate file (only if *Define a TLS certificate* is enabled)
**Authentication:**
* **Authentication method**: Choose *None*, *CRAM-MD5*, or *Login* (username/password)
* **Username**: Your email account username (usually your full email address)
* **Password**: Your email account password or app-specific password
After configuring your settings, use the **TEST** button to verify your email configuration is working correctly.
##### Configuring Gmail with app passwords[​](#configuring-gmail-with-app-passwords)
Gmail requires app-specific passwords when using SMTP with accounts that have 2-step verification enabled (which is recommended for security).
**To set up Gmail notifications:**
1. In **Preset service**, select *Gmail* (this will auto-fill the **Mail server** and **Mail server port**)
2. Enter your Gmail address in **Sending email address**
3. Enter recipient email address(es) in **Email recipients**
4. Set **Username** to your full Gmail address (e.g., `yourname@gmail.com`)
5. For **Password**, you'll need to generate an app password:
* Go to your [Google Account settings](https://myaccount.google.com/)
* Navigate to **Security**
* Under "How you sign in to Google," ensure **2-Step Verification** is enabled (required for app passwords)
* In the same section, find and click **App passwords** (or search for "App passwords" in the search bar)
* You may need to verify your identity
* Enter a custom name for the App name, like "Unraid Server".
* Click **Create**
* Google will generate a 16-character password.
* Copy this password and paste it into the **Password** field in Unraid
* Click **TEST** to verify the configuration
* Click **DONE** to save your settings
Default Gmail settings
* **Mail server**: `smtp.gmail.com`
* **Mail server port**: `465`
* **Use SSL/TLS**: `Yes`
* **Use STARTTLS**: `No`
* **Authentication method**: `Login`
Security recommendation
Always use app passwords instead of your main Gmail password. App passwords can be revoked individually without changing your main account password, providing better security if your Unraid configuration is ever compromised.
#### Notification agents[​](#notification-agents)
Notification agents allow you to send alerts to third-party services and mobile apps. Unraid includes built-in support for many popular notification services.
To access Notification Agents, click the **Notification Agents** link on the Notification Settings page, or navigate to ***Settings → User Preferences → Notification Settings → Notification Agents***.
**Built-in agents include:**
* **Bark**: iOS notification app
* **Boxcar**: Push notification service
* **Discord**: Send notifications to Discord channels via webhook
* **Gotify**: Self-hosted notification server
* **ntfy.sh**: Simple HTTP-based notification service
* **Prowl**: iOS push notifications
* **Pushbits**: Self-hosted notification relay
* **Pushbullet**: Cross-platform notification service
* **Pushover**: Push notification service for iOS and Android
* **Pushplus**: Chinese push notification service
* **ServerChan**: Chinese server monitoring and notification service
* **Slack**: Send notifications to Slack channels via webhook
* **Telegram**: Send messages to Telegram bot
**Configuring an agent:**
1. Select the agent you want to configure from the list
2. Change **Agent function** from *Disabled* to *Enabled*
3. Fill in the required fields for that service:
* Most agents require a **webhook URL**, **API token**, or **access token**
* Some services require additional configuration like channel IDs or group codes
* Configure **Notification title** (usually set to *Subject* to use the notification subject)
* Configure **Notification message** (usually set to *Description* to use the full notification text)
* Click **DONE** to save
Each agent has different requirements - consult the documentation for your chosen service to obtain the necessary API keys, webhook URLs, or tokens.
tip
You can enable multiple agents simultaneously. For example, you might use Discord for team notifications and Pushover for personal mobile alerts. Note that **all notifications** are sent to **all enabled agents**, so using multiple agents may result in receiving duplicate notifications.
### Scheduler[​](#scheduler)
The Scheduler settings page allows you to easily configure the frequency for automated tasks including parity checks, the cache Mover, and TRIM/Discard operations for SSDs.
## User utilities[​](#user-utilities)
Third-party plugins are displayed here, enhancing Unraid’s functionality and giving you more control over your server. For example, the [Community Applications plugin](/community-applications/) is included. Other plugins offer features for system monitoring, maintenance, storage management, and `appdata` backups.
\* *"WireGuard" and the "WireGuard" logo are registered trademarks of Jason A. Donenfeld.*
* [System settings](#system-settings)
* [CPU pinning](#cpu-pinning)
* [Date & time](#date--time)
* [Disk settings](#disk-settings)
* [Docker](#docker)
* [Identification](#identification)
* [Management access](#management-access)
* [Network settings](#network-settings)
* [Power mode](#power-mode)
* [Global share settings](#global-share-settings)
* [UPS settings](#ups-settings)
* [VM manager](#vm-manager)
* [Network services](#network-services)
* [NFS (Network file system)](#nfs-network-file-system)
* [SMB (Server message block)](#smb-server-message-block)
* [FTP (File transfer protocol)](#ftp-file-transfer-protocol)
* [Syslog server](#syslog-server)
* [Tailscale](#tailscale)
* [VPN manager](#vpn-manager)
* [User preferences](#user-preferences)
* [Confirmations](#confirmations)
* [Console settings](#console-settings)
* [Display settings](#display-settings)
* [Notification settings](#notification-settings)
* [Scheduler](#scheduler)
* [User utilities](#user-utilities)