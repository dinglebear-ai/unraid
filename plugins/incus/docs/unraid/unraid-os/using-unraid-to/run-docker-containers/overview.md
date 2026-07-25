Overview | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
Docker allows you to run Linux applications in isolated environments known as "containers." On Unraid, Docker is the ideal method for deploying and managing a wide variety of applications without concerns about compatibility or system conflicts. This approach transforms your Unraid server into a flexible application server, enabling you to run popular apps like **Plex**, **Home Assistant**, and many more directly on your system.
If you want to learn more about Docker's foundational technology or explore advanced usage, check out the [official Docker documentation](https://docs.docker.com/).
## How Unraid uses Docker[​](#how-unraid-uses-docker)
Unraid’s Docker integration is designed to be user-friendly for everyone. Each application runs in its own container, ensuring that updates or changes don’t affect your Unraid OS or other applications. Unraid utilizes a dedicated `appdata` share to store each container’s settings and working files. This keeps your application data organized and makes backups and migrations simple.
**Under the hood:** Expand to learn more about Docker container implementation in Unraid
Unraid uses Docker to create separate environments for running Linux-based applications. Each Docker container operates independently from the Unraid operating system and other containers, which enhances both stability and compatibility.#### Implementation details
* **Storage:** All the data and programs for each container are stored in a single virtual disk image file called `docker.img`. By default, this file is found in the `system` user share, which usually utilizes the cache pool for better speed.
* **File system:** The `docker.img` file uses the BTRFS file system and is mounted internally by Unraid. For more information on file systems, see [File systems](/unraid-os/using-unraid-to/manage-storage/file-systems/).
* **Configuration:** When you set up a container, Unraid saves your configuration as a VM XML template on the boot device. This makes it easy to reinstall or restore containers with your preferred settings.
* **Templates:** Many popular containers come with ready-made templates, making the initial setup less complicated.
* **Performance:** It’s a good idea to store `docker.img` on the cache pool (if you have one) for the best performance.
* **Limitations:** Unraid does not natively support Docker Compose. For more complex setups, check out the [official Docker Compose documentation](https://docs.docker.com/compose/).
tip
Most users won’t need to interact with the `docker.img` file directly. However, knowing its role can be helpful for troubleshooting or understanding log messages.
## Community Applications (Plugin)[​](#community-applications-plugin)
The Community Applications plugin is the easiest and most popular way to discover, install, and manage both Docker containers and plugins on your Unraid server. It provides an app store-like experience directly in the Unraid WebGUI, making it simple to browse and deploy a wide range of community-maintained applications.
For a complete guide to installing and using the Community Applications plugin, including advanced features and troubleshooting, check out [Community Applications](/community-applications/).
Notes and Support
* Most containers in Community Applications are maintained by the broader Unraid and Docker communities.
* For assistance with a specific container, check its documentation or support thread linked in the **Apps** tab.
* Lime Technology provides support for the Docker subsystem itself but does not support individual community containers.
* [How Unraid uses Docker](#how-unraid-uses-docker)
* [Community Applications (Plugin)](#community-applications-plugin)