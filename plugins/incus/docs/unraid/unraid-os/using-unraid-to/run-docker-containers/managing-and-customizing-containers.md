Managing & customizing containers | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
Disclaimer
This page is written to help users of all skill levels make the most out of Docker containers on Unraid OS. The tips and best practices come from the Unraid team, who ensure they are tailored to most users' needs. However, keep in mind that Docker is constantly evolving, so for the most up-to-date features, advanced configurations, or troubleshooting issues that go beyond what Unraid covers, it's always a good idea to check the [official Docker documentation](https://docs.docker.com/).
Before customizing a Docker container in Unraid, it’s helpful to understand the basic configuration options. Each [container template](/community-applications/) provides a user-friendly interface for setting up networking, storage, and environment variables, allowing you to tailor the container's behavior to your needs without using complex command-line tools.
* Network type
* Volume mappings
* Port mappings
* Environment variables
Unraid supports several Docker network modes. The network type you choose determines how your container communicates with other devices and containers:
* **Bridge (default):** The container is placed on an internal Docker network. Only ports you explicitly map will be accessible from your Unraid server or LAN. This is the safest and most common option for most applications.
* **Host:** The container shares the Unraid server’s network stack. It can use any available port, but you must ensure no port conflicts with other services. Use this mode only if the application requires direct network access.
* **None:** The container has no network access. Use this for isolated workloads that do not require any network connectivity.
* **Custom (macvlan/ipvlan):** The container is assigned its own IP address on your LAN, making it appear as a separate device. This is useful for advanced scenarios but may require additional configuration in your network environment.
tip
The default network type specified in the container’s template is recommended for most users.
Wi-Fi and Docker Networking Limitations
Docker has a limitation that prevents it from participating in two networks that share the same subnet. If you switch between a wired and a wireless connection, you will need to restart Docker and reconfigure all existing containers to use the new interface. This [network configuration](/unraid-os/system-administration/secure-your-server/securing-your-connection/) change requires container reconfiguration.
## Creating and starting containers[​](#creating-and-starting-containers)
Once you've configured your container’s network, volume mappings, port mappings, and environment variables, you're ready to create and launch your Docker container. This section will guide you through the creation process, explain how to manage startup order and dependencies, and provide tips for advanced startup customization.
### Creating a container[​](#creating-a-container)
After reviewing your configuration settings in the container template:
1. Click **Create** to begin downloading and setting up the container.
* Avoid closing your browser window or navigating away until the process completes.
* The initial download for a new repository may take longer than subsequent downloads.
* Once the process is finished, click **Done** to return to the Docker page, where you can manage or add more containers.
### Planning your startup sequence[​](#planning-your-startup-sequence)
Some containers depend on others to function correctly. For example, an application might need a database container running first, or a service might require a [VPN container](/unraid-os/system-administration/secure-your-server/tailscale/) to be active before it starts.
Plan your startup
* Identify containers that provide core services (like databases, VPNs, or storage gateways).
* Ensure dependent containers are started only after their prerequisites are running and ready.
* Review documentation for each container to understand any specific startup requirements.
## Advanced container startup[​](#advanced-container-startup)
Unraid gives you flexible control over which containers start automatically and in what order. This is especially useful if you have containers that depend on others (such as a database or VPN service).
To ensure a container starts automatically when the array starts:
1. Go to the **Docker** tab in the WebGUI.
2. Toggle the **Auto-Start** switch to **ON** for each container you want to launch automatically.
### Customize startup order and delays[​](#customize-startup-order-and-delays)
By default, Unraid starts all auto-start containers as quickly as possible, in the order they appear on the Docker tab. You can customize this order and add wait times between container startups:
1. On the **Docker** tab, unlock the container list using the padlock icon.
2. Drag and drop containers to rearrange their order.
3. Switch to **Advanced View** using the toggle at the top right.
4. In the **AutoStart** column, enter a wait time (in seconds) in the **wait** field for any container that needs extra time before the next one starts.
* Use trial and error to determine the best wait times for your setup.
tip
Setting the correct order and wait times is especially important for containers that depend on services provided by others (for example, starting a database before an app that uses it, or a VPN before dependent apps).
### Testing your startup sequence[​](#testing-your-startup-sequence)
While Unraid does not have a dedicated "test startup sequence" feature, you can simulate and verify your startup order:
1. Stop all containers from the **Docker** tab.
2. Start each container manually, in your planned order, using the **Start** button.
3. Monitor container logs and application behavior to ensure dependencies are met and services initialize as expected.
4. Adjust the startup order or wait times as needed.
important
Test your startup sequence after changing container dependencies or adding new services, especially if your setup relies on specific startup timing.
## Controlling your containers[​](#controlling-your-containers)
Once you've created and started your Docker container, managing it is easy through the WebGUI. This guide will walk you through using the context menu, understanding container health indicators, and accessing volume mappings within your container.
To access the container's context menu, go to the **Docker** or **Dashboard** tab and click on the container icon you want to manage. This menu offers straightforward access to common actions:
|OptionDescription|**WebUI**Opens the container's web interface in a new browser tab (if available).|**Console**Opens a command-line interface to interact with the container directly.|**Stop**Stops the running container.|**Pause**Pauses the container, temporarily halting all processes.|**Restart**Restarts the container, applying any configuration changes.|**Logs**Shows the container's log output for troubleshooting.|**Edit**Change container settings, such as port or volume mappings. Changes apply immediately after saving.|**Remove**Deletes the container. You can choose to remove just the container or also delete its image.|**Project Page**Opens the container's project page for documentation and support.|**Support**Provides access to support resources and help for the container.|**More Info**Displays additional information about the container and its configuration.
### Health indicator[​](#health-indicator)
You will find a colored health indicator next to each container’s icon:
* 🟢 **Healthy**: Indicates that the container is running and responding as expected.
* 🟡 **Unhealthy**: The container is running but has failed its health check. Investigate the logs or container settings for more information.
* ⚪ **No health check**: This means no health check is configured for the container. It's common for many apps, and not necessarily a problem.
note
Health checks are defined by the container author and may not be present for all images.
## Volume mappings inside a container[​](#volume-mappings-inside-a-container)
When configuring your application through its web interface, reference the **container path** you set up during configuration - not the host path.
For instance, if you mapped `/mnt/user/media` on the host to `/unraid\_media` in the container, you should use `/unraid\_media` in the application’s settings.
### Example scenarios
Here are some examples showing common path mapping configurations that users frequently need when setting up Docker containers. They demonstrate how to translate between Unraid's host file system paths and the container's internal paths, helping you configure applications correctly.
* **Media server:**
Host path: `/mnt/user/media`
Container path: `/unraid\_media`
In the app, set your media library location to `/unraid\_media`.
* **Appdata storage:**
Host path: `/mnt/user/appdata/myapp`
Container path: `/config`
In the app, use `/config` for configuration storage.
* **Multiple user shares:**
Host path: `/mnt/user/media` → Container path: `/media`
Host path: `/mnt/user/data` → Container path: `/data`
Reference `/media` or `/data` in the application as needed.
Best practice
Always use the most restrictive [access mode](/unraid-os/using-unraid-to/manage-storage/shares/) (read-only or read/write) that allows your container to function properly.
## Scheduling start and stop[​](#scheduling-start-and-stop)
Unraid does not natively support scheduled start or stop actions for **Docker containers**, but you can easily automate this process using the [**User Scripts plugin**](/unraid-os/using-unraid-to/customize-your-experience/plugins/). This powerful tool allows you to run custom scripts on a schedule, enabling automatic control of your containers.
### User Scripts plugin[​](#user-scripts-plugin)
The **User Scripts plugin** allows you to create, manage, and schedule custom shell scripts directly from the WebGUI. You can use it for various automation tasks, such as starting or stopping containers, backing up data, or running maintenance routines.
* Install the plugin from the **Apps** tab if you haven’t done so already.
* Access it via ***Settings → User Scripts*** to create and manage your scripts.
To learn more about plugins, check out [Plugins](/unraid-os/using-unraid-to/customize-your-experience/plugins/).
### Scheduling container actions[​](#scheduling-container-actions)
To automate the start or stop of your containers on a schedule:
1. Install the **User Scripts plugin** from the **Apps** tab.
2. Navigate to ***Settings → User Scripts***.
3. Create a new script for each unique schedule. You can include commands for multiple containers in a single script if they share the same schedule.
4. Set the schedule using the dropdown menu or use a custom `cron` expression for more advanced timing options.
5. Click **Apply** to save and activate your script.
tip
Cron expressions enable flexible scheduling beyond the built-in options. For example, `0 3 \* \* 1` runs your script at 3:00 AM every Monday.
### Command examples[​](#command-examples)
* Start container
* Stop container
* Restart container
* Check container status
* Show container logs
To start a container, use the command:
```
`
docker start "container-name"
`
```
Replace `"container-name"` with the actual name as shown on the Docker tab.
tip
You can find the container name on the Docker tab or by viewing the `docker run` command in the container's configuration screen.
* [Creating and starting containers](#creating-and-starting-containers)
* [Creating a container](#creating-a-container)
* [Planning your startup sequence](#planning-your-startup-sequence)
* [Advanced container startup](#advanced-container-startup)
* [Customize startup order and delays](#customize-startup-order-and-delays)
* [Testing your startup sequence](#testing-your-startup-sequence)
* [Controlling your containers](#controlling-your-containers)
* [Health indicator](#health-indicator)
* [Volume mappings inside a container](#volume-mappings-inside-a-container)
* [Scheduling start and stop](#scheduling-start-and-stop)
* [User Scripts plugin](#user-scripts-plugin)
* [Scheduling container actions](#scheduling-container-actions)
* [Command examples](#command-examples)