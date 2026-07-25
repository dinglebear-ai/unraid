User management | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
Unraid makes managing users on your NAS simple and secure, catering to everyone from beginners to experienced users. The streamlined approach helps reduce confusion while ensuring that security and access control remain strong.
Simplified approach
Unlike traditional Linux systems, Unraid offers a straightforward user model:
* **Single Administrator (root)**: There’s only one main user, which simplifies permissions and enhances security.
* **Share-Centric Access**: The focus is on sharing data, making it less complicated for users who don’t need the intricacies of multiple user environments.
This way, even if you're not familiar with Linux, you can easily manage your NAS safely.
## Overview[​](#overview)
### Root User[​](#root-user)
Unraid operates with a single superuser, known as root, who has complete control over everything.
Root users...
* Have full access to the WebGUI, SSH, and Telnet interfaces.
* Are responsible for managing all user accounts and settings.
* Cannot directly access file shares through **SMB**, **NFS**, or **FTP** for security reasons.
* Allow for [SSH key-based authentication](/unraid-os/system-administration/advanced-tools/command-line-interface/#accessing-the-terminal) to log in without a password.
important
The root user is vital for maintaining security. Always ensure a [strong password](/unraid-os/system-administration/secure-your-server/security-fundamentals/#set-a-strong-root-password) is set and limit SSH access to keep your system safe.
### Share Users[​](#share-users)
These accounts are designed for accessing specific shares, without any system-level controls.
Share users...
* Can only be created and managed by the root user.
* Can access shares via **SMB**, **NFS**, or **FTP** (if enabled).
* Don't have access to the **WebGUI**, **SSH**, or **Telnet**.
## Add users[​](#add-users)
To connect to shared files on Unraid from another device, you'll need a username and password. These credentials are separate from the ones you might use for specific applications running in containers, which have their own login information.
To add a user:
1. **Access User Management**
* Go to ***Users → Shares Access*** (or ***Settings → Users → Shares Access***).
* Click on **Add User**.
* **Set up user credentials**
* **User Name**: Choose a unique name (like `john\_media`). Use only lowercase letters to avoid conflicts, and keep it under 30 characters due to Windows limits.
* **Password**: Create a strong password using a mix of letters, numbers, and symbols. Follow the password strength meter for guidance.
Optionally
* **Add a description**: Write a note like "Media Library Access."
* **Custom image**: Upload a PNG image (like a user avatar) for visual identification.
1. Select **Add** to create the user.
## Delete users[​](#delete-users)
You can easily remove a user account in Unraid when it is no longer needed.
caution
Removing a user account is permanent and immediately removes access to shares and shared resources.
To remove a user:
1. Go to the **Users** menu and click on the name of the user account you want to delete.
2. Check the box labeled **Delete**. The **Apply** button will change to a **Delete** button.
3. Click **Delete** to remove the user. A confirmation message will appear to confirm the deletion.
4. Select **Done**.
## Modify a user[​](#modify-a-user)
You can change a user account in Unraid if the user forgot their password or needs different access to shared folders.
To modify a user account:
1. Go to ***Users → Shares Access*** (or ***Settings → Users → Shares Access***), and click on the user account you want to change.
2. *(Optional)* In the **Edit User** screen, you can update any information except the **User name**. To set a new **Password**, just type it in and confirm it by retyping it.
3. *(Optional)* At the bottom, you’ll see a list of folders (shares) the user can access. You can adjust their access settings for any of these shares, but you can’t add new ones.
4. Click **Apply** to save your changes.
## Reset your password[​](#reset-your-password)
If you've forgotten your root password, don't worry! Here are two simple methods to regain access to your Unraid server. You'll need physical access to your **[boot device](/unraid-os/system-administration/maintain-and-update/changing-the-flash-device/)** (for example the USB drive) and another computer.
* Basic
* Advanced
This method clears **all user passwords**, including\*root and share users.
For the simplest way to reset your password:
1. **Shut down** your Unraid server.
2. **Connect the USB boot device** to a computer (Windows or Mac).
3. Delete these files from the USB drive:
* `/config/shadow`
* `/config/smbpasswd`
* **Disconnect the USB boot device** and reconnect it to your Unraid server, then start it up.
* **Create a new root password** when prompted at startup.
Be aware
Anyone with physical access to the USB can use these methods to reset your root password and gain full administrative access. Always keep your USB secure!
* [Overview](#overview)
* [Root User](#root-user)
* [Share Users](#share-users)
* [Add users](#add-users)
* [Delete users](#delete-users)
* [Modify a user](#modify-a-user)
* [Reset your password](#reset-your-password)