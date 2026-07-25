Community Applications | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
Community Applications provides a curated catalog of over 2,000 free Docker containers and plugins maintained by the Unraid community. Each container or plugin lets your server take on new roles, such as running a media server, dynamic DNS client, or backup solution.
* **Docker containers** are lightweight packages that include everything needed to run an application, keeping it isolated from the rest of your array and cache pool. Learn more about [array configuration](/unraid-os/using-unraid-to/manage-storage/array/overview/) and [cache pools](/unraid-os/using-unraid-to/manage-storage/cache-pools/).
* **Plugins** enhance Unraid OS itself. For more information about plugins, visit the [Plugins](/unraid-os/using-unraid-to/customize-your-experience/plugins/) page.
caution
The Community Applications team provides basic vetting and moderation, but it's important to review documentation and support resources for each application before installation.
## How Community Applications works[​](#how-community-applications-works)
The Community Applications plugin adds an **Apps** tab to the Unraid WebGUI, which provides an app store-like interface. You can browse, search, and filter applications by category or keyword. Each listing clearly indicates whether it is a Docker container or a plugin.
Listings include labels such as:
* **Beta:** The application is in active development and may have bugs.
* **Installed:** The application is currently installed on your server.
* **Updated:** A newer version is available.
* **Monthly CA Spotlight:** Featured by the moderation team for quality or popularity.
Clicking on an app provides more details, support links, and installation options.
## Installing the plugin[​](#installing-the-plugin)
To install the Community Applications plugin:
1. Open the WebGUI and navigate to the **Apps** tab.
2. Click on **Install**.
1. Once the installation is complete, refresh the page. The screen will automatically open the **Apps** tab and introduce you to Community Applications.
## Managing applications[​](#managing-applications)
* Installing applications
* Removing applications
* Reinstalling applications
To install a Docker container or plugin, simply click the **Install** button from the application's tile or information panel located in the **Apps** tab of the WebGUI. This will start the installation process.
Keep the installation window open until the process is fully completed.
Security tip
Before you install, take a moment to read the application's description. Check the developer's reputation and ensure the source repository is trustworthy. It’s best to choose applications from well-known developers or those with active support threads. Always be cautious about granting access to your array, cache pool, or any sensitive data. Learn more about [security fundamentals](/unraid-os/system-administration/secure-your-server/security-fundamentals/).
## Support for Applications[​](#support-for-applications)
If you’re using Docker containers and plugins, you'll find that most come with dedicated support resources to help you out. There are several easy ways to access these support options:
* **Apps Tab**: Click on the **Apps** tab, then filter to **Installed Apps**. From there, locate the App and select **Support**.
* **Dashboard or Docker Tabs**: Navigate to the **Dashboard** or **Docker** tabs, click on the icon of the container you're using, and select **Support**.
* **Plugins Tab**: On the **Plugins** tab, each plugin will have a **Support Thread** link right in its summary for quick access.
Support preferences
When accessing support options, look for these dropdown options:
* **Discord**: If available, Discord is typically maintainers' preferred support venue instead of the forum.
* **Project**: Questions about the application itself are best answered via the project's official channels.
These resources will connect you to community forums and developer discussions where you can find help, troubleshoot issues, and stay updated.
## Updating applications (Action Center)[​](#updating-applications-action-center)
The **Action Center** is located within the **Apps** tab in the WebGUI and serves as your central hub for managing application status. It provides information about:
* **Updates available**: Applications that have newer versions ready for installation
* **Deprecated applications**: Applications that are no longer maintained or recommended
* **Incompatible applications**: Applications that may not work with your current Unraid version
* **Blacklisted applications**: Applications that have been removed from the catalog for security or compatibility reasons
When you access the Action Center, you'll see alerts for any applications requiring attention. To update an application, click on Actions for the app that needs updating, and then select **Update** to run the update script. Regular updates are essential for maintaining the security, stability, and compatibility of your Unraid installation. See [Updating Unraid](/unraid-os/updating-unraid/) for more information.
## Contributing your own applications[​](#contributing-your-own-applications)
The **Community Applications** ecosystem thrives on contributions from the Unraid community. Whether you’re developing applications or plugins, your work can help others enhance their Unraid servers. The [Community Apps submission portal](https://ca.unraid.net/submit) is the source of truth for submission requirements, repository XML guidance, supported fields, and the current publishing workflow.
[
Submit a Community App
](https://ca.unraid.net/submit)
### Maintenance expectations[​](#maintenance-expectations)
Developers who publish applications in Community Applications are expected to maintain their projects to ensure compatibility and reliability for the Unraid community. This section outlines the ongoing responsibilities that help maintain the quality of available applications.
Once published, developers are expected to:
* Regularly update applications to maintain compatibility with new Unraid releases.
* Respond to support requests in their forum threads.
* Clearly label beta or experimental versions.
* Notify the moderation team if discontinuing support for an application.
note
The moderation team reserves the right to remove applications that become incompatible with current Unraid versions or lack ongoing support. For time-sensitive security updates, they may temporarily take over maintenance of abandoned projects.
### Publishing workflow[​](#publishing-workflow)
If you're a developer interested in publishing an application, the submission portal guides you through repository preparation, validation, scanning, and review.
1. Review the [submission help](https://ca.unraid.net/submit/help).
2. Submit your application at [ca.unraid.net/submit](https://ca.unraid.net/submit).
Questions or issues with Community Applications?
[
Post Here
](https://product.unraid.net/b/community-apps)
* [How Community Applications works](#how-community-applications-works)
* [Installing the plugin](#installing-the-plugin)
* [Managing applications](#managing-applications)
* [Support for Applications](#support-for-applications)
* [Updating applications (Action Center)](#updating-applications-action-center)
* [Contributing your own applications](#contributing-your-own-applications)
* [Maintenance expectations](#maintenance-expectations)
* [Publishing workflow](#publishing-workflow)