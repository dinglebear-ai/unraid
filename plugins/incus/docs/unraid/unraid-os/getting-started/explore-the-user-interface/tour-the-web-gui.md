Tour the WebGUI | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
The WebGUI is the primary interface for managing and configuring your Unraid server. It provides access to all system features, monitoring tools, and configuration options through an organized navigation bar and user-friendly screens. This layout is designed to help you efficiently manage storage, users, applications, and system settings from any web browser.
## The Navigation Bar[​](#the-navigation-bar)
The horizontal navigation bar gives users access to the main functional areas of the Unraid system. You can customize it with plugins to add extra menus and options, available in the [Community Applications section](/community-applications/).
### 1. Dashboard[​](#1-dashboard)
The **Dashboard** tab provides real-time monitoring of hardware and software components on your Unraid server. It displays various aspects of management - such as system identification, CPU, RAM, storage, network information, Containers, VMs, users, and shares - in a grid of tiles.
You can enhance the Dashboard with plugins from [Community Applications](/community-applications/)
### 2. Main[​](#2-main)
The **Main** screen enables efficient management of your Unraid storage and disk operations. You can configure your array, cache pools, and boot devices, as well as manage USB storage and unassigned devices, including remote shares. It displays key information about each storage device, such as health, capacity, and file systems.
At the bottom, the Array Operation section provides maintenance options to keep your array running smoothly.
### 3. Shares[​](#3-shares)
The **Shares** tab is divided into [User Shares](/unraid-os/using-unraid-to/manage-storage/shares/#user-shares) and [Disk Shares](/unraid-os/using-unraid-to/manage-storage/shares/#disk-shares).
You can access detailed information and management options for each share by selecting its name.
### 4. Users[​](#4-users)
The **Users** screen allows management of all user accounts on the Unraid server, as detailed in the [User Management section](/unraid-os/system-administration/secure-your-server/user-management/).
### 5. Settings[​](#5-settings)
The **Settings** screen allows you to manage all system settings on your Unraid server, including:
* **System Settings**: Configure parameters and behaviors for the core components of Unraid.
* **Network Services**: Set up various communication protocols and configure your Wireguard VPN.
* **User Preferences**: Adjust individual user preferences, such as notifications and display settings.
* **User Utilities**: Manage individual utilities that you have added through plugins.
### 6. Plugins[​](#6-plugins)
The **Plugins** screen shows all the plugins installed on your Unraid server.
note
For plugin installation steps, see [Community Applications](/community-applications/).
### 7. Docker[​](#7-docker)
The **Docker** screen displays all containers installed from [Community Applications](/community-applications/). You can launch, stop, and configure each container, including their auto-start settings.
note
For details on running Docker containers, see [Run Docker containers](/unraid-os/using-unraid-to/run-docker-containers/overview/).
### 8. VMs[​](#8-vms)
The **VMs** screen lets you manage virtual machines (VMs) on your Unraid server. It displays all your created VMs along with their main attributes, such as CPU assignments, vDisk allocation, and graphics card settings.
note
This option will **only** appear in the Navigation Bar if your Unraid server meets the hardware virtualization requirements.
### 9. Apps[​](#9-apps)
The **Apps** screen, or "Community Applications," is the official source for Unraid apps.
It provides community-sourced plugins and Docker containers that enhance Unraid’s functionality beyond a basic NAS. For more details, check the [Community Applications section](/community-applications/).
### 10. Tools[​](#10-tools)
The **Tools** screen offers various tools for managing Unraid OS, customizing the look of the WebGUI, and system updates.
### 11. System Shortcuts[​](#11-system-shortcuts)
The **System Shortcuts** section provides quick access to essential Unraid features and tools directly from the navigation bar.
The Navigation bar displays shortcuts to Unraid features, such as:
* **Logout :** Log out of the Unraid server.
* **Terminal:** Open a terminal window.
* **File Manager:** Access the built-in file manager.
* **Feedback:** Submit feedback, report issues, or leave comments.
* **Info:** View a summary of your server’s attributes.
* **Log:** See a list of system events.
* **Help:** Enable help for the current screen.
* **Notifications:** View system alerts, warnings, and notices.
### 12. Account Options[​](#12-account-options)
In the top-right corner of the WebGUI, next to your server name, is the hamburger (☰) menu for **Account Options**. This menu allows you to manage your Unraid account, access [Unraid Connect](/unraid-connect/overview-and-setup/), upgrade your license key, and log out.
If you're in trial mode, you can also redeem your license key here to activate Unraid as Starter, Unleashed, or Lifetime.
### 13. Status Bar[​](#13-status-bar)
The **Status Bar** at the bottom of the WebGUI shows the current state of your array and the status of ongoing operations like Mover or parity checks. Some plugins also display important information, like system temperatures.
\* *"WireGuard" and the "WireGuard" logo are registered trademarks of Jason A. Donenfeld.*
* [The Navigation Bar](#the-navigation-bar)
* [1. Dashboard](#1-dashboard)
* [2. Main](#2-main)
* [3. Shares](#3-shares)
* [4. Users](#4-users)
* [5. Settings](#5-settings)
* [6. Plugins](#6-plugins)
* [7. Docker](#7-docker)
* [8. VMs](#8-vms)
* [9. Apps](#9-apps)
* [10. Tools](#10-tools)
* [11. System Shortcuts](#11-system-shortcuts)
* [12. Account Options](#12-account-options)
* [13. Status Bar](#13-status-bar)