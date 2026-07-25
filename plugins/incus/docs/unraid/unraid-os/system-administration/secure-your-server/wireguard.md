WireGuard | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
While Tailscale provides a user-friendly experience for most, [WireGuard](https://www.wireguard.com/) is a robust built-in VPN solution in Unraid that shines in specific advanced networking scenarios. It’s particularly useful when you need detailed control over VPN routing or require server-to-server or LAN-to-LAN connections without relying on third-party services. Below are key scenarios where WireGuard excels.
#### When to choose WireGuard
|ScenarioWhy choose WireGuard?|**Advanced configuration**Allows for custom VPN Tunnel setups and integration with existing network infrastructure|**Server-to-server tunnels**Lets you create persistent encrypted links between Unraid servers|**LAN-to-LAN integration**Connects entire networks without involving intermediary services|**Bandwidth-intensive tasks**Offers minimal protocol overhead for maximum throughput
info
For most users, [**Tailscale**](/unraid-os/system-administration/secure-your-server/tailscale/) can accomplish everything that WireGuard can do, often more easily. It typically doesn’t require port forwarding or manual configuration. However, if you need advanced, custom VPN setups or have specific compatibility requirements, choosing WireGuard may be a better option for some.
#### Connection types and use cases
Knowing the connection types in WireGuard can help you decide if it's right for you:
|Connection typeReal-world use case|Remote access to serverAccess Unraid WebGUI, Docker containers, VMs, and network shares remotely.|Remote access to LANAccess all devices on your LAN remotely as if you were on the local network.|Server to server accessSecurely connect two Unraid servers for data sharing or backup.|LAN to LAN accessSeamlessly connect two entire LANs for smooth communication between networks.|Server hub & spoke accessAllow multiple VPN clients to connect to each other through the server.|LAN hub & spoke accessEnable communication between multiple LANs through a central server.|VPN tunneled accessRoute specific Docker containers and VMs through a commercial WireGuard VPN provider.|Remote tunneled accessSecurely route all your internet traffic through your Unraid server when on untrusted networks.
## Setting up WireGuard on Unraid[​](#setting-up-wireguard-on-unraid)
Prerequisites
* **Dynamic DNS:** Set up DDNS for reliable access if your public IP changes. Popular options include [Cloudflare](https://www.cloudflare.com/) (requires domain ownership), [No-IP](https://www.noip.com/), or [DuckDNS](https://www.duckdns.org/) (free but may experience occasional outages).
* **Router configuration:**
* Enable UPnP in ***Settings → Management Access*** for automatic port forwarding.
* If UPnP is unavailable, manually forward UDP port 51820 to your Unraid server's IP.
* **Client software:** Install WireGuard on your devices ([Windows](https://www.wireguard.com/install/), [macOS](https://apps.apple.com/us/app/wireguard/id1451685025), [iOS](https://apps.apple.com/us/app/wireguard/id1441195209), [Android](https://play.google.com/store/apps/details?id=com.wireguard.android)).
#### Step 1: Generate keys
1. Go to ***Settings → VPN Manager***.
1. Name your tunnel (e.g., "Home VPN").
2. Click **Generate Keypair** to create public/private keys.
warning
Store the private key securely since it provides full network access.
#### Step 2: Configure your endpoint
* **For DDNS users:** Replace the IP in **Local endpoint** with your DDNS URL (e.g., `myhome.duckdns.org`).
* Keep the default port (`51820`) unless it conflicts with existing services.
#### Step 3: Set up port forwarding
* **UPnP users:** Unraid will automatically forward ports if enabled in ***Settings → Management Access***.
* **Manual setup:** If UPnP is unavailable:
1. Log into your router.
2. Forward UDP port `51820` to your Unraid server's LAN IP.
3. Use the same port for external and internal settings.
#### Step 4: Activate your tunnel
1. Toggle **Active** to enable WireGuard.
2. Enable **Autostart** to run WireGuard at boot.
Security best practices
* **Trusted access only:** VPN access is similar to physical network access, so only authorize trusted devices.
* **Key management:** Never share private keys; treat them like passwords.
* **Network segmentation:** For complex setups (custom Docker/VMs), isolate VPN traffic using VLANs or separate subnets.
* **Regular audits:** Review connected devices and access permissions quarterly.
### Defining a peer (client)[​](#defining-a-peer-client)
A peer is a client device - such as a phone, laptop, or another server - that connects to your Unraid WireGuard VPN. Defining a peer means creating a unique identity and securing keys for that device.
1. Select **Add Peer**.
1. Name the peer (e.g., *MyAndroid*).
2. Choose the initial connection type for full network access, typically *Remote access to LAN*.
3. Click **Generate Keypair** to create public and private keys. Keep the private key secure.
4. Optionally, generate a preshared key for extra security.
5. Click **Apply**.
note
While peers can generate their own keys, letting Unraid generate keys simplifies setup by providing complete config files.
caution
Adding a new peer can temporarily disable the WireGuard tunnel, which may interrupt your connection. Ensure you have local access to your server before making changes.
### Configuring a peer (client)[​](#configuring-a-peer-client)
* Mobile device
* Other devices
1. Select the eye icon to view the peer configuration.
1. In the WireGuard mobile app, choose **Create from QR code** and scan the QR code.
2. Name the connection and connect. The VPN tunnel should start quickly.
3. Keep the QR code private - anyone with it can access your VPN.
### Configuring your DNS[​](#configuring-your-dns)
1. Access devices using IP addresses or fully qualified domain names (e.g., `yourpersonalhash.unraid.net`).
note
Short names like "tower" or router-managed DNS entries may not work over the VPN.
1. To enable short name resolution:
* Go to ***Settings → VPN Manager*** in Unraid.
* Switch from **Basic** to **Advanced** mode.
* Enter the IP address of your preferred DNS server in the **Peer DNS Server** field.
* Save changes and update the client configuration file.
* Recommended DNS servers:
* Your LAN router’s IP address.
* Public DNS servers like `8.8.8.8`.
This setup is especially important for **Remote tunneled access** mode, where the client’s original DNS server may be inaccessible.
note
mDNS addresses (e.g., `tower.local`) only work on the local network and not over WireGuard VPN.
### Complex networks[​](#complex-networks)
For most users, the default **Use NAT** setting works out of the box and allows access to Unraid and most LAN devices. However, if you use Docker containers with custom IPs or VMs with strict networking requirements:
1. In your WireGuard tunnel configuration, set **Use NAT** to **No**.
2. On your router, add a static route for the WireGuard tunnel network (e.g., `10.253.0.0/24`) pointing to your Unraid server’s IP.
3. In ***Settings → Docker Settings***, set **Host access to custom networks** to **Enabled**.
### Configurations to avoid[​](#configurations-to-avoid)
|Use NAT settingHost access to custom networksServer & Dockers (Bridge/Host)VMs & other LAN systemsDockers with custom IPNotes|YesDisabled (Static route optional)AccessibleAccessibleNot accessibleSimple network setup; recommended for most users|YesEnabled (Static route optional)AccessibleNot accessibleNot accessibleAvoid this configuration|NoDisabled (No static route)AccessibleNot accessibleNot accessibleAvoid; requires static route to function properly|NoDisabled (With static route)AccessibleAccessibleNot accessibleAlmost correct; enable host access to custom networks|NoEnabled (With static route)AccessibleAccessibleAccessibleRecommended setup for complex networks
## Troubleshooting WireGuard[​](#troubleshooting-wireguard)
WireGuard is designed to be unobtrusive - if something isn’t working, it won’t provide error messages. To troubleshoot effectively, you should systematically check each aspect of your setup.
#### Connection checklist[​](#connection-checklist)
* ✅ The tunnel is active on both Unraid and client devices. *("Active" means the tunnel has started but is not necessarily connected.)*
* ✅ DDNS URL points to your current public IP and is set in **Local endpoint**.
* ✅ Correct UDP port is forwarded from your router to Unraid, matching the **Local endpoint** port.
* ✅ Clients have the latest configuration files after any server-side changes.
* ✅ Changes are saved before viewing or distributing peer configs (QR codes/files).
#### Additional troubleshooting ideas[​](#additional-troubleshooting-ideas)
**First-time setup tips** - Click to expand/collapse
If you’re setting up WireGuard for the first time, these tips can help you avoid common pitfalls:
* Set up your first client using a mobile device on cellular data (not Wi-Fi) to rule out local network issues.
* Use the QR code method for the easiest configuration transfer.
**Handshake and connectivity issues** - Click to expand/collapse
If you’re not seeing a handshake or can’t connect, try these targeted checks:
* If you don’t see a handshake, try generating traffic (for example, pinging the server) to trigger the connection.
* Disable energy-saving, data saver, or battery saver features on mobile clients, as these may interfere with VPN operation.
* Ensure that the client and server networks use different subnets (for example, avoid both using `192.168.1.0/24`).
* If using Cloudflare for DDNS, set **Proxy status** to **DNS only** (not **Proxied**). Allow time for DNS changes to propagate.
* If you can connect from some locations but not others, the remote network may block UDP traffic. WireGuard currently does not support TCP as a fallback.
**Advanced network conflicts** - Click to expand/collapse
If your network setup is more complex, or you suspect an IP conflict, review these advanced troubleshooting steps:
* In **Advanced** mode, confirm that your **Local tunnel network pool** does not overlap with any existing network on either side. If there’s a conflict, change to a different private subnet (for example, `10.10.10.0/24`).
* For Docker containers with custom IPs or VMs with strict requirements, see the [Complex networks](#complex-networks) section.
**Emergency recovery** - Click to expand/collapse
If you lose access to the Unraid WebGUI and need to disable WireGuard auto-start
* Delete `/boot/config/wireguard/autostart` from your boot drive and reboot.
\* *"WireGuard" and the "WireGuard" logo are registered trademarks of Jason A. Donenfeld.*
* [Setting up WireGuard on Unraid](#setting-up-wireguard-on-unraid)
* [Defining a peer (client)](#defining-a-peer-client)
* [Configuring a peer (client)](#configuring-a-peer-client)
* [Configuring your DNS](#configuring-your-dns)
* [Complex networks](#complex-networks)
* [Configurations to avoid](#configurations-to-avoid)
* [Troubleshooting WireGuard](#troubleshooting-wireguard)