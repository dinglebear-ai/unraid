Remote access | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
This page covers **Unraid Connect Remote Access**, which publishes your WebGUI to the internet by using either UPnP or a manual port forwarding rule on your router. If you want full remote management without exposing the WebGUI to WAN traffic, prefer the official [Tailscale integration](/unraid-os/system-administration/secure-your-server/tailscale/). For more advanced needs, such as connecting to Docker containers or accessing network drives, a VPN Tunnel remains the recommended solution.
Security reminder
Before enabling remote access, ensure your root password is strong and unique. Update it on the **Users** page if required. Additionally, keep your Unraid OS updated to the latest version to protect against security vulnerabilities. [Learn more about updating Unraid here](/unraid-os/updating-unraid/).
Connect dashboard access is different
Signing in to the [Unraid Connect dashboard](https://connect.myunraid.net/) does **not** by itself expose your WebGUI to the internet. Dashboard access uses a server-initiated connection with restricted API access for supported Connect features. **Unraid Connect Remote Access** is a separate feature that exposes the full WebGUI through WAN port forwarding or UPnP.
Remote access through Unraid Connect provides:
* **Convenience** - Quickly access your server’s management interface from anywhere, using a trusted Unraid Connect URL.
* **Security** - Your WebGUI traffic is encrypted when SSL/TLS is configured correctly.
* **Simplicity** - UPnP can create the required port mapping automatically when your router supports it.
Preferred approach
For most users, the official [Tailscale integration](/unraid-os/system-administration/secure-your-server/tailscale/) is the better choice for remote administration because it avoids exposing the WebGUI to the public internet. Use Unraid Connect Remote Access only when you specifically need browser access to the public-facing WebGUI URL.
## Initial setup[​](#initial-setup)
To enable remote access:
1. In the Unraid WebGUI, navigate to ***Settings → Management Access***.
2. Check the **HTTPS port** (default: 443). If this port is in use (e.g., by Docker), select an unused port above 1000 (like 3443, 4443, or 5443).
3. Click **Apply** if you changed any settings.
4. Under **CA-signed certificate file**, click **Provision** to generate a trusted certificate.
Your Unraid server will be ready to accept secure remote connections via the WebGUI, using the configured port and a trusted certificate.
## Choosing a remote access configuration[​](#choosing-a-remote-access-configuration)
In current Unraid 7.2.x releases, the Unraid API settings page exposes these remote access controls:
* **Allow Remote Access** - Choose whether remote access is **Disabled** or **Always** available.
* **Remote Access Forward Type** - Choose **Static** for manual port forwarding, or **UPnP** to let your router create the port mapping automatically.
* **Remote Access WAN Port** - Choose the WAN port to forward when using **Static** forwarding.
When remote access is set to **Always**, your WebGUI is continuously reachable from the internet on the configured WAN port. Both **Static** and **UPnP** remote access publish the WebGUI to WAN traffic. Use a strong root password, keep Unraid OS updated, and disable remote access when you do not need it.
Dynamic, on-demand remote access is not currently exposed in the Unraid API settings page. If you need remote management without keeping the WebGUI exposed through port forwarding, prefer [Tailscale](/unraid-os/system-administration/secure-your-server/tailscale/) or another VPN Tunnel.
## Enable remote access[​](#enable-remote-access)
To enable remote access:
1. In the Unraid WebGUI, navigate to ***Settings → Management Access*** and open the **Unraid API Settings** tab.
2. Set **Allow Remote Access** to **Always**.
3. Choose a **Remote Access Forward Type**:
* **UPnP:** Lets Unraid ask your router to create the WAN port mapping automatically. This requires UPnP support and UPnP enabled on your router.
* **Static:** Requires you to create the port forwarding rule manually on your router.
* If you choose **Static**, enter the **Remote Access WAN Port** you want to use.
* Click **Apply**.
* Log in to [Unraid Connect](https://connect.myunraid.net/) and click the **Manage** link to connect to your server remotely.
If the **Manage** link does not work, use the relevant forwarding section below to verify that the WAN port reaches your server's HTTPS port.
## Using UPnP (Universal Plug and Play)[​](#using-upnp-universal-plug-and-play)
UPnP automates port forwarding, simplifying remote access without requiring manual router configuration.
To configure UPnP:
1. **Enable UPnP on your router.**
Ensure that your router supports UPnP and verify that it is enabled in the router settings.
2. **Enable UPnP in Unraid.**
Navigate to ***Settings → Management Access*** and change **Use UPnP** to **Yes**.
3. **Select UPnP in Unraid Connect.**
On the Unraid API settings page, set **Allow Remote Access** to **Always**, set **Remote Access Forward Type** to **UPnP**, and then click **Apply**.
4. **Verify port forwarding.**
Click the **Check** button. If successful, you'll see the message, "Your Unraid Server is reachable from the Internet."
Troubleshooting
If the setting changes from UPnP to Manual Port Forward upon reloading, Unraid might not be able to communicate with your router. Double-check that UPnP is enabled and consider updating your router's firmware.
## Using manual port forwarding[​](#using-manual-port-forwarding)
Manual port forwarding provides greater control and is compatible with most routers.
To configure manual port forwarding:
1. **Choose a WAN port:** Pick a random port number above 1000 (for example, 13856 or 48653), rather than using the default 443.
2. **Apply settings in Unraid:** Click **Apply** to save the port you selected.
3. **Configure your router:** Set up a port forwarding rule on your router, directing your chosen WAN port to your server’s HTTPS port. The Unraid interface provides the correct ports and IP address.
Some routers may require the WAN port and HTTPS port to match. If so, use the same high random number for both.
4. **Verify port forwarding:** Press the **Check** button. If everything is correct, you’ll see “Your Unraid Server is reachable from the Internet.”
5. **Access your server:** Log in to [Unraid Connect](https://connect.myunraid.net/) and click the **Manage** link to connect to your server remotely.
## Enabling secure local access[​](#enabling-secure-local-access)
Secure local access ensures that all connections to your Unraid WebGUI, even within your home or office network, are encrypted using HTTPS, thereby safeguarding any sensitive information, such as login credentials and configuration data.
Benefits of secure local access include:
* **Encryption** - All data exchanged between your browser and the server is protected.
* **Consistency** - Use the same secure URL for both local and remote access.
* **Compliance** - Adheres to security best practices for protecting administrative interfaces.
To enable secure local access:
1. Go to ***Settings → Management Access***.
2. In the **CA-signed certificate** section, check for DNS Rebinding warnings.
* If no warnings show, set **Use SSL/TLS** to **Strict**.
* If warnings are present, review [DNS Rebinding Protection](/unraid-os/system-administration/secure-your-server/securing-your-connection/#dns-rebinding-protection).
important
With SSL/TLS set to Strict, client devices must resolve your server’s DNS name. If your Internet connection fails, access to the WebGUI may be lost. See [Accessing your server when DNS is down](/unraid-os/system-administration/secure-your-server/securing-your-connection/#accessing-your-server-when-dns-is-down) for recovery steps.
* [Initial setup](#initial-setup)
* [Choosing a remote access configuration](#choosing-a-remote-access-configuration)
* [Enable remote access](#enable-remote-access)
* [Using UPnP (Universal Plug and Play)](#using-upnp-universal-plug-and-play)
* [Using manual port forwarding](#using-manual-port-forwarding)
* [Enabling secure local access](#enabling-secure-local-access)