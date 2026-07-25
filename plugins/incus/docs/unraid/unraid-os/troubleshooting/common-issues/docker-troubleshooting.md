Docker troubleshooting | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
info
This page offers troubleshooting guidance specifically for Docker containers on Unraid, managed by the Unraid team. For advanced troubleshooting, in-depth technical details, or topics beyond the Unraid-specific implementation, please refer to the [official Docker documentation](https://docs.docker.com/).
Docker makes it easy to run a variety of applications on your Unraid server, but issues can arise, such as containers not starting, corrupted Docker image files, or network problems. This page addresses some common issues related to Docker on Unraid and offers best practices for effectively resolving them.
## Re-creating the Docker image file[​](#re-creating-the-docker-image-file)
A corrupted Docker image file (`docker.img`) is a common issue, often caused by the cache pool running out of space or an unclean shutdown. Luckily, a well-configured container stores all variable data outside the image file (usually in the `appdata` share), so you can safely recreate the image without losing your application settings or data.
To recreate the Docker image file:
1. Go to ***Settings → Docker*** in the WebGUI.
2. Set **Enable Docker** to **No** and click **Apply** to stop the Docker service.
3. Select the option to delete the Docker vdisk file, then click **Apply**. You can also manually delete the file if needed.
4. Confirm the location and filename for the new Docker vdisk file. This setting includes both the folder path and the filename.
5. Set the desired size for the new image file. The default size is typically sufficient for most users.
6. Set **Enable Docker** to **Yes** and click **Apply**. Unraid will create and format a new `docker.img` file using BTRFS.
Now you’re ready to reinstall your containers using their saved settings.
## Reinstalling Docker applications[​](#reinstalling-docker-applications)
Unraid automatically saves a template for each installed container on your boot device. These templates store your configuration, making it easy to restore containers after recreating the Docker image file.
To reinstall your containers:
1. Go to the **Apps** tab in the WebGUI.
2. Open the **Previous Apps** section.
3. Select the containers you want to reinstall.
4. Proceed with the installation. Unraid will re-download each container and apply your previous settings automatically.
important
This process restores your containers to their previous state, provided all variable data was mapped outside the Docker image file (for example, in the `appdata` share).
tip
If a container fails to start after reinstalling, check its logs from the context menu in the **Docker** tab for error messages and troubleshooting clues.
note
Verify that all mapped host paths exist and have the correct permissions after restoring your containers. Incorrect mappings or permissions are a common cause of startup issues.
## Restoring Docker custom networks[​](#restoring-docker-custom-networks)
Custom Docker networks do not persist if the Docker image file is deleted. Before removing the image, document your custom network names by opening a terminal and running:
```
`
docker network ls
`
```
Note the names of any networks you created (excluding the default `bridge`, `host`, and `none` networks).
To restore custom networks:
1. After recreating the Docker image file, recreate each custom network using:
```
`
docker network create \<network-name\>
`
```
Replace `\<network-name\>` with the exact name you recorded earlier.
2. Update your containers to use the restored networks as needed.
note
You can enable host access to custom networks under ***Settings → Docker*** by setting **Host access to custom networks** to **Enabled** if your setup requires it.
tip
If containers cannot communicate as expected after restoration, inspect your Docker network settings for conflicts or connectivity issues.
* [Re-creating the Docker image file](#re-creating-the-docker-image-file)
* [Reinstalling Docker applications](#reinstalling-docker-applications)
* [Restoring Docker custom networks](#restoring-docker-custom-networks)