Wake-on-LAN (WoL) | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
Wake-on-LAN (WOL) lets you remotely wake your Unraid server from a shutdown or sleep state by sending a "magic packet" over the network. This page will help you set up WoL for your local network.
## Requirements[​](#requirements)
For WoL to work properly, make sure you meet the following requirements:
* **NIC support**: Your network interface controller should support WoL; most modern NICs do.
* **BIOS/UEFI settings**: Enable WoL in your motherboard's BIOS/UEFI under power management. Here are some common setting names:
|Setting nameDescription|Wake on LANGeneric WoL setting|PME event wake-upFor PCIe wake events|Power on by PCI/PCIe devicesAlternate name for WoL|ErP readyMust be *disabled* for WoL to work
* **Power connection**: Ensure your server is plugged into a power source.
* **Network connection**: Connect your server to your LAN with an Ethernet cable (WiFi WoL is not supported).
Hardware compatibility
Not all hardware supports S3 sleep or WoL reliably. Some systems may experience issues entering sleep, fail to wake up correctly, or require additional BIOS/UEFI settings. Always test these features thoroughly before relying on them.
## Putting an Unraid server to sleep[​](#putting-an-unraid-server-to-sleep)
The preferred and user-friendly way to manage sleep on Unraid is by using the [**Dynamix S3 Sleep plugin**](<https://unraid.net/community/apps/c/plugins/p3?srsltid=AfmBOorpfP2Psw_bCorklf-QVCUHvADYGsdbsAH-4CldU4V2hWgoO-09#r:~:text=>>-,Dynamix S3 Sleep,-Dynamix Repository>). This plugin offers a graphical interface to help schedule sleep, wake, and idle behavior, while also addressing common issues that may arise with various hardware configurations.
To install and configure:
1. Open the ***Apps tab*** in the Unraid WebGUI.
2. Search for "Dynamix S3 Sleep" and install the plugin.
3. Navigate to ***Settings → Sleep Settings*** to set up your sleep and wake options.
The plugin manages most sleep configuration options.
**Alternative manual method** - Click to expand/collapse
If you want more control or need advanced customization, you can configure sleep and WoL settings through the command line. This method is recommended for advanced users.
To configure sleep manually:
1. Connect to your server using the WebGUI terminal or [SSH](/unraid-os/system-administration/advanced-tools/command-line-interface/#accessing-the-terminal).
2. Identify your primary network interface (usually `eth0`) by running the following command:
```
`
ifconfig
`
```
Note the MAC address (labelled as `ether`).
3. Enable WoL on the interface with this command:
```
`
ethtool -s eth0 wol g
`
```
4. Put the server to sleep by entering this command:
```
`
echo -n mem \> /sys/power/state
`
```
Persistence
WoL settings configured manually are **not persistent** across reboots by default. To make them permanent:
1. Create a `go` file on your boot drive at `/boot/config/go`.
2. Add this line:
```
`
/usr/sbin/ethtool -s eth0 wol g
`
```
## Wake your Unraid server[​](#wake-your-unraid-server)
To wake your Unraid server remotely, you need to send a special "magic packet" over your local network. This packet includes your server's MAC address and instructs the network interface to power on the system from a sleep or shutdown state. Different operating systems provide various tools and methods for sending this packet. Below are specific instructions for Windows, macOS, and Linux.
* Windows
* macOS
* Linux
#### Using WakeOnLan CMD
1. Download [wolcmd.exe](https://www.depicus.com/wake-on-lan/wake-on-lan-cmd).
2. Run it in Command Prompt:
```
`
wolcmd.exe \<MAC\_ADDRESS\> \<SERVER\_IP\> 255.255.255.255
`
```
* [Requirements](#requirements)
* [Putting an Unraid server to sleep](#putting-an-unraid-server-to-sleep)
* [Wake your Unraid server](#wake-your-unraid-server)