Plugins | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
Plugins are software extensions that integrate directly with Unraid OS. They allow you to enhance your system features or add advanced functionality.
tip
Whenever you can, use [Docker containers](/unraid-os/using-unraid-to/run-docker-containers/overview/) for applications or services. Reserve plugins for features that require direct integration with Unraid OS.
## When to use plugins[​](#when-to-use-plugins)
Plugins are suitable for the following situations:
* System-level services or enhancements that need direct access to Unraid OS or the WebGUI.
* Features that cannot be provided as Docker containers.
It’s advisable to avoid using plugins for general-purpose applications that can run safely in isolated containers.
## Plugin considerations[​](#plugin-considerations)
Before you install a plugin, think about these aspects:
|ProsCons|Deep integration with Unraid OS and the WebGUICan cause system instability, especially after OS updates|Enables hardware-level and storage featuresFull filesystem access increases security risks|Often open source for transparencyRequires manual maintenance and compatibility checks|Necessary for some advanced storage or network features
Security considerations
* Only install plugins from trusted sources or well-known developers.
* Research each plugin before installation; check community feedback and update history.
* Keep plugins updated, and regularly review installed plugins for compatibility.
## Managing plugins[​](#managing-plugins)
You can manage plugins from the **Plugins** tab in the Unraid **WebGUI**.
If a plugin is available in **[Community Applications](/community-applications/)**, installing it from the **Apps** tab is recommended for extra vetting and compatibility checks.
note
As Unraid continues to evolve, some plugin features may be added to the base OS. Community Applications will only offer plugins believed to be compatible with your current release, but they won't automatically remove incompatible plugins already installed. Before upgrading Unraid, read the Release Notes for the target version to check for any special notes related to your installed plugins.
## Troubleshooting with safe mode[​](#troubleshooting-with-safe-mode)
If your system becomes unstable after installing or updating plugins, you can troubleshoot issues using **Safe Mode**. Safe Mode loads only the essential components and disables all plugins.
To boot into safe mode:
* Preferred method
* Alternative method
Preferred, as it doesn't even require a display connected to your server.
1. In the **WebGUI**, go to ***Main → Array Operation***.
2. Check the **Reboot in safe mode** box.
3. Click **Reboot** to restart your server directly into Safe Mode - no keyboard or monitor required.
* [When to use plugins](#when-to-use-plugins)
* [Plugin considerations](#plugin-considerations)
* [Managing plugins](#managing-plugins)
* [Troubleshooting with safe mode](#troubleshooting-with-safe-mode)