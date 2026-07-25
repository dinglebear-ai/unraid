Secure your outgoing communications | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
The outgoing proxy manager and Tailscale exit nodes provide a way to route Unraid's outgoing communications through secure channels. These tools are useful for bypassing restrictive firewalls, adhering to network policies, or safeguarding your outgoing traffic. While these solutions mainly focus on Unraid's system traffic, there are configuration options to extend their coverage to your broader network.
There are three main methods to secure your outgoing communications:
1. [**Outgoing Proxy Manager**](#setting-up-a-proxy-server) - This tool routes HTTP traffic through a proxy server, allowing you to manage and direct your web requests securely.
2. [**Tailscale exit nodes**](#tailscale-exit-nodes) - With Tailscale exit nodes, all your traffic can be routed through Tailscale's mesh network, ensuring a secure connection across your devices.
3. [**WireGuard VPN**](#outgoing-vpn-connections) - You can also use WireGuard VPN to route your traffic through commercial VPN providers, adding an extra layer of privacy and security.
### Outgoing Proxy Manager vs. Tailscale/WireGuard/VPN[​](#outgoing-proxy-manager-vs-tailscalewireguardvpn)
|Use caseRecommended toolWhy|Bypass firewall for Unraid system updatesOutgoing Proxy ManagerRoutes only Unraid's system traffic through a proxy; simple and minimal configuration.|Secure all outgoing traffic with mesh networkingTailscale exit nodesEncrypts traffic through Tailscale's mesh network; easy setup with existing Tailscale infrastructure.|Secure all outgoing traffic (system-wide)WireGuardVPNEncrypts and tunnels all traffic from Unraid (including Docker/VMs) to commercial VPN providers.|Isolate Docker or VM trafficVPN or container proxyConfigure VPN at the container/VM level for granular control.|Access home network from anywhereTailscale exit nodesRoute traffic through your home network for consistent IP and geo-location.
For most users, solutions like [Tailscale](/unraid-os/system-administration/secure-your-server/tailscale/) or [WireGuard](/unraid-os/system-administration/secure-your-server/wireguard/) are preferred for full-system security and privacy. Use Outgoing Proxy Manager when you only need to proxy Unraid's own HTTP requests.
### Setting up a proxy server[​](#setting-up-a-proxy-server)
To set up a proxy server:
1. Navigate to ***Settings → Outgoing Proxy Manager*** in the WebGUI.
1. Add your proxy's name, URL, and (if required) username/password.
2. Click **Apply**.
3. Select your new proxy from the list and click **Apply** again.
The WebGUI will automatically use the selected proxy for outgoing system traffic. If you have open web terminals or SSH sessions, close and reopen them to apply the new proxy settings. This usage is transparent—monitor proxy server logs to verify activity.
### Choosing an HTTP proxy server[​](#choosing-an-http-proxy-server)
* **If your organization provides a proxy:** Use the address and credentials supplied by your network administrator.
* **If you need to set up your own:**
* The [Proxy Server Docker container by @ich777](https://forums.unraid.net/profile/72388-ich777/) is tested and works well with Unraid.
* You can configure this container to route traffic through a commercial VPN using Unraid's [WireGuard VPN](/unraid-os/system-administration/secure-your-server/wireguard/) or connect it to another Docker-based VPN service.
* For reliability, host the proxy server on a separate system from Unraid to ensure network availability during boot.
To monitor proxy traffic, go to the **Docker** tab on the proxy host system, select the **Proxy Server** container, and view **Logs**.
### Automatic import and plugin compatibility[​](#automatic-import-and-plugin-compatibility)
* If you previously used the **Proxy Editor** plugin, it will be automatically removed upon upgrading to Unraid 7.0+ with built-in proxy support.
* Legacy proxy settings in your `config/go` script or in `community.applications/proxy.cfg` will be imported automatically, and the old files will be renamed for safety.
### Plugin compatibility[​](#plugin-compatibility)
* Plugins using PHP’s `curl\_init()` function will automatically use the outgoing proxy.
* Plugins using `file\_get\_contents()` should migrate to `curl\_init()` for proxy compatibility.
* For command-line processes, prefer `curl` over `wget` for proxy support.
For additional information about plugin development and compatibility, visit the [Plugins section of the documentation](/unraid-os/using-unraid-to/customize-your-experience/plugins/).
## Tailscale exit nodes[​](#tailscale-exit-nodes)
Tailscale exit nodes offer a secure and modern way to route your Unraid server's outgoing traffic through another device on your Tailnet. This setup provides the security of a VPN while leveraging Tailscale's easy-to-use mesh networking, making it ideal for users who want encrypted outgoing traffic without the complexity of traditional VPNs.
When to use Tailscale exit nodes
Consider using Tailscale exit nodes for:
* Securing outgoing traffic from your home network while traveling
* Maintaining consistent IP addresses for services that block VPN traffic
* Integrating seamlessly with existing Tailscale infrastructure
### Configuring Tailscale exit nodes[​](#configuring-tailscale-exit-nodes)
To set up a Tailscale exit node for your server's outgoing traffic:
1. **Install the [Tailscale plugin](<https://unraid.net/community/apps/c/plugins?q=tailscale#r:~:text=Plugins-,Tailscale (Plugin),-Derek Kaser>)** from Community Applications if it’s not already installed.
2. **Set up an exit node** on your Tailnet. This can be another Unraid server, a Docker container, or any device running Tailscale.
3. **Configure your Unraid server** to use the exit node:
* Navigate to ***Settings → Tailscale***.
* In the **Use Exit Node** field, select your available exit node.
* Click **Apply**.
### Mullvad integration[​](#mullvad-integration)
Tailscale has teamed up with Mullvad VPN to provide commercial exit nodes. You can purchase [Mullvad VPN through Tailscale](https://tailscale.com/mullvad), gaining access to their global network of servers as exit nodes. This combination offers Tailscale's mesh networking along with Mullvad's privacy-focused infrastructure.
### Docker container exit nodes[​](#docker-container-exit-nodes)
You can also set up a Docker container to function as a Tailscale exit node on your Unraid server.
1. **Deploy a Tailscale container** using the [official Tailscale Docker image](https://hub.docker.com/r/tailscale/tailscale).
2. **Configure the container** by adding the `--advertise-exit-node` flag.
3. **Approve the exit node** in your Tailscale admin console.
4. **Select the container** as an exit node for your other devices on the Tailnet.
## Outgoing VPN connections[​](#outgoing-vpn-connections)
Unraid supports outgoing WireGuard VPN connections to commercial providers, allowing you to route Docker containers or your entire server’s traffic through a secure tunnel. This is useful for privacy, bypassing geo-restrictions, or securing outbound data. For community insights and troubleshooting, see the [WireGuard VPN tunneled access forum thread](https://forums.unraid.net/topic/84316-wireguard-vpn-tunneled-access/).
### Choosing a VPN provider[​](#choosing-a-vpn-provider)
Selecting the right VPN provider depends on your priorities - speed, privacy, ease of use, and support. The following providers are well-supported by Unraid and offer strong WireGuard integration:
|ProviderBest forKey featuresSupport in UnraidNotes|[NordVPN](https://nordvpn.com/)Speed, privacy, valueDouble NAT, no-logs, global networkExcellentNordLynx protocol, fast|[Surfshark](https://surfshark.com/)Budget, unlimited devicesNo-logs, unlimited connections, fast speedsExcellentGreat value, easy setup|[ProtonVPN](https://protonvpn.com/)Privacy, open-sourceDouble NAT, Secure Core, no-logsExcellentOpen-source, strong privacy|[Mullvad](https://mullvad.net/en)Anonymity, simplicityNo personal info, flat pricing, open-sourceExcellentPay with cash, no email|[PureVPN](https://www.purevpn.com/)Streaming, flexibilityLarge network, easy Unraid integrationGoodGood support, fast speeds|[CyberGhost](https://www.cyberghostvpn.com/)Streaming, ease of useOptimized servers, fast speedsGoodUser-friendly apps|[IVPN](https://www.ivpn.net/en/), [OVPN](https://www.ovpn.com/en), [Windscribe](https://windscribe.com/)Niche needsAdvanced privacy, regional optionsGoodCommunity-supported
tip
Choose a provider with native WireGuard support and strong privacy policies. Avoid providers that require custom clients or proprietary protocols.
### Configuring VPN tunneled access for Docker[​](#configuring-vpn-tunneled-access-for-docker)
You can route specific Docker containers through a commercial VPN tunnel - no router changes required.
1. Download the WireGuard config file from your chosen provider.
2. In ***Settings → VPN Manager***, select **Import Config** and upload the file. This creates a new tunnel.
3. The **Peer type of access** defaults to *VPN tunneled access for Docker*. Optionally, give it a local name.
4. Click **Apply**.
5. Set the tunnel toggle to **Active**.
tip
Note the tunnel name (e.g., `wg0`, `wg1`, `wg2`). You’ll need it when configuring Docker containers.
If your provider specifies a DNS server in their config, record it for later use. If not, use a public DNS like `8.8.8.8`.
### Testing the Docker tunnel[​](#testing-the-docker-tunnel)
To verify your Docker tunnel is working and not leaking DNS or IP information:
1. Install a [Firefox](https://unraid.net/community/apps?q=Firefox) Docker container via Community Applications.
2. Set its **Network Type** to **Custom: wgX** (replace X with your tunnel name).
3. Switch to **Advanced** view and add your DNS provider to **Extra Parameters** (e.g., `--dns=8.8.8.8`).
4. Apply changes and start the container.
5. Launch Firefox and visit [whatismyipaddress.com](https://whatismyipaddress.com/) to verify your IP address matches the VPN server’s country.
6. Visit [dnsleaktest.com](https://www.dnsleaktest.com/) and confirm only your VPN’s DNS servers are detected.
You can assign additional containers to this tunnel or create multiple tunnels.
### Configuring VPN tunneled access for the system[​](#configuring-vpn-tunneled-access-for-the-system)
To route all Unraid traffic through a commercial VPN:
1. Download the WireGuard config from your provider.
2. In ***Settings → VPN Manager***, select **Import Config** and upload the file.
3. Optionally, rename the tunnel.
4. Click **Apply**.
5. Set the tunnel toggle to **Active**.
note
* You may need to disable the tunnel temporarily for Unraid updates or plugin installations.
* Only one system-wide tunnel can be active at a time.
* Unraid ignores DNS settings from the imported config. Set Unraid’s DNS to a reliable public server (e.g., `8.8.8.8`, `8.8.4.4`).
### Testing the system tunnel[​](#testing-the-system-tunnel)
1. Install the [Firefox](https://unraid.net/community/apps?q=Firefox) Docker container.
2. Accept all defaults.
3. Launch Firefox and visit [whatismyipaddress.com](https://whatismyipaddress.com/). Your IP address should match your VPN provider’s location.
### Support and Community Resources[​](#support-and-community-resources)
For the most up-to-date guidance, troubleshooting assistance, and community tips, visit the following resources on the [Unraid forums](https://forums.unraid.net/):
* **[WireGuard VPN Tunneled Access](https://forums.unraid.net/topic/84316-wireguard-vpn-tunneled-access/)** - This community discussion focuses on routing Docker containers or system-wide traffic through commercial WireGuard VPN providers. It includes real-world setup examples, DNS leak testing tips, and troubleshooting advice for outbound tunnels.
* **[Dynamix WireGuard Plugin Thread](https://forums.unraid.net/topic/84229-dynamix-wireguard-vpn/)** - This is the official thread for the Dynamix WireGuard plugin. It covers plugin updates, feature requests, bug reports, and general questions and answers related to Unraid’s built-in WireGuard support.
* **[WireGuard Quickstart](https://forums.unraid.net/topic/84226-wireguard-quickstart/)** - A step-by-step guide for setting up inbound WireGuard VPN connections to Unraid. This resource includes configuration walkthroughs, peer setup instructions, and tips for remote access.
\* *"WireGuard" and the "WireGuard" logo are registered trademarks of Jason A. Donenfeld.*
* [Outgoing Proxy Manager vs. Tailscale/WireGuard/VPN](#outgoing-proxy-manager-vs-tailscalewireguardvpn)
* [Setting up a proxy server](#setting-up-a-proxy-server)
* [Choosing an HTTP proxy server](#choosing-an-http-proxy-server)
* [Automatic import and plugin compatibility](#automatic-import-and-plugin-compatibility)
* [Plugin compatibility](#plugin-compatibility)
* [Tailscale exit nodes](#tailscale-exit-nodes)
* [Configuring Tailscale exit nodes](#configuring-tailscale-exit-nodes)
* [Mullvad integration](#mullvad-integration)
* [Docker container exit nodes](#docker-container-exit-nodes)
* [Outgoing VPN connections](#outgoing-vpn-connections)
* [Choosing a VPN provider](#choosing-a-vpn-provider)
* [Configuring VPN tunneled access for Docker](#configuring-vpn-tunneled-access-for-docker)
* [Testing the Docker tunnel](#testing-the-docker-tunnel)
* [Configuring VPN tunneled access for the system](#configuring-vpn-tunneled-access-for-the-system)
* [Testing the system tunnel](#testing-the-system-tunnel)
* [Support and Community Resources](#support-and-community-resources)