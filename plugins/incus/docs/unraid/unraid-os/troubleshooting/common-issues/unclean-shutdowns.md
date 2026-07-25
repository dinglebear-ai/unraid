Unclean shutdowns | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
An unclean shutdown happens when Unraid detects that the array was not properly stopped before the system powered off. This situation can trigger an automatic parity check during the next boot to ensure data integrity.
Recommendations to prevent unclean shutdowns
Taking some proactive steps can help you avoid or identify unclean shutdowns:
* **Use a UPS:** Keep your server connected to an Uninterruptible Power Supply (UPS) and set it up to initiate a controlled shutdown when battery power runs low.
* **Attempt a graceful shutdown:** If your server is unresponsive, briefly press the power button to trigger a safe shutdown. Do not hold the button down, as this will force a hard power off and lead to an unclean shutdown.
* **Enable persistent logging:** Go to ***Settings → Syslog Server*** to activate logging that persists after a reboot. See [Persistent logs (Syslog server)](/unraid-os/troubleshooting/diagnostics/capture-diagnostics-and-logs/#persistent-logs-syslog-server) for more details.
* **Attach diagnostics for support:** If an unclean shutdown occurs, Unraid will attempt to save diagnostics to `/log/diagnostics.zip` on your boot device. Attach this file to forum posts when you seek help.
UPS configuration best practices
A well-configured UPS is your best defense against unclean shutdowns caused by power loss.
* **Connect the UPS via USB** to your Unraid server.
* **Enable UPS support** in ***Settings → UPS Settings***.
* **Configure shutdown timeouts:** Set the UPS to trigger a controlled shutdown before the battery runs low. Adjust the "Battery runtime left" or "Battery charge level" thresholds to provide enough time for Unraid to [stop the array](/unraid-os/using-unraid-to/manage-storage/array/overview/#startstop-the-array) and power down safely.
* **Test your configuration:** Simulate a power loss to ensure the UPS and Unraid respond correctly.
Look into the [NUT plugin](<https://unraid.net/community/apps/c/plugins/p4?srsltid=AfmBOop675PrJQW4iqb4JBN3GyPpwDDiSmnZReq78t27XyxkFdMX8inO#:~:text=NUT - Network UPS Tools>) for broader compatibility with more advanced UPS models or unsupported hardware.
## Events that cause unclean shutdowns[​](#events-that-cause-unclean-shutdowns)
Understanding the main triggers for unclean shutdowns helps you prevent them. The following sections cover the most common scenarios and their solutions.
### Unexpected power loss[​](#unexpected-power-loss)
Power interruptions are one of the main reasons for unclean shutdowns. Protect your system with a properly configured UPS that can automatically shut down Unraid before the battery runs out.
note
Unraid supports most UPS units using the apcupsd Protocol protocol (APC and CyberPower are usually compatible). If your UPS isn't supported, consider using the Network UPS Tools (NUT) plugin from Community Applications.
### Boot device failure[​](#boot-device-failure)
The array status is stored on your boot device. If the boot device becomes unavailable or enters a read-only state, Unraid cannot update the shutdown status, even if the array stops correctly. This results in an unclean shutdown being detected at the next boot.
### Open terminal sessions[​](#open-terminal-sessions)
Unraid waits for all open terminal or SSH sessions to close during shutdown. If these sessions remain active and the shutdown timer expires, a forced shutdown occurs.
tip
The [Dynamix Stop Shell](<https://unraid.net/community/apps/c/tools-system/p2?srsltid=AfmBOoqBXyDNfHxRDCL7Fv9Gcfz8-8CdHmiJSX16PRZpZLLzgQtw2mVk#:~:text=the given interval.-,Dynamix Stop Shell,-Dynamix Repository>) plugin can automatically close lingering bash or SSH sessions, helping ensure a graceful shutdown. However, be cautious if there are ongoing write operations to the array.
## Configuring shutdown timeouts[​](#configuring-shutdown-timeouts)
Properly configuring shutdown timeouts is essential to ensure your Unraid server can stop all services effectively. This prevents unclean shutdowns, especially during power loss or maintenance. The most important step is to configure your VMs to hibernate instead of shutting down. This approach helps eliminate many timeout-related issues.
### VM hibernation setup[​](#vm-hibernation-setup)
Use VM hibernation
For the most reliable and fastest shutdowns, configure your VMs to hibernate instead of shutting down. This is especially important for Windows VMs but benefits all VM types.
We recommend using hibernation because it:
* **Saves VM state instantly** - No waiting for the guest OS to shut down.
* **Prevents data loss** - No risk of interrupting updates or unsaved work.
* **Avoids timeout issues** - Hibernation is nearly instantaneous.
* **Faster recovery** - VMs resume exactly where they left off.
Shutdown can be problematic because:
* Windows may display dialog boxes ("Save this document?") that halt the shutdown indefinitely.
* Windows updates can take 10+ minutes during shutdown.
* If the timeout expires, Unraid force-kills the VM, potentially corrupting in-progress Windows updates, unsaved documents, application data, and file systems in the guest OS.
**Critical requirement:** Ensure the QEMU Guest Agent is installed in the VM for hibernation to function correctly.
To enable VM hibernation:
* Windows VMs
* Linux VMs
* Appliance VMs
1. **Download QEMU Guest Agent:**
* Go to the [VirtIO drivers download page](https://fedorapeople.org/groups/virt/virtio-win/direct-downloads/).
* Download the latest `virtio-win.iso` file.
* **Install in Windows VM:**
* Mount the `virtio-win.iso` to your VM.
* Run the installer from the mounted ISO.
* Install both VirtIO drivers AND QEMU Guest Agent.
* Restart the VM.
* **Configure in Unraid:**
* Go to your VM settings in the ***VMs*** tab.
* Set **Shutdown Action** to **Hibernate**.
* Click **Apply**.
Now to verify your hibernation works, start your VM and open some applications. Then stop it from Unraid. When you start it again, it should resume with all applications still open.
Guest Agent is critical
Without the QEMU Guest Agent installed, hibernation may not work properly. In that case, the VM will revert to shutdown mode, consuming the full timeout period.
### Timeout configuration[​](#timeout-configuration)
In this section, we’ll cover how to configure timeouts for various systems and processes. This information is important to ensure that your VMs and Docker containers shut down gracefully without data loss.
|SettingDefaultWhen to increaseWhere to configure|VM shutdown timeout60s300s if not using hibernation and VMs crash***Settings → VM Manager → VM Shutdown (Advanced)***|Docker container stop timeout10s30s if any containers are crashing when stopped***Settings → Docker (Advanced)***|General shutdown timeout90s180s if you get unclean shutdowns, 300s+ with VMs***Settings → Disk Settings → Shutdown time-out***
When to increase timeouts
If you're experiencing unclean shutdowns or containers that crash during shutdown, consider increasing the general shutdown timeout to **180 seconds** (or **300+ seconds** if you have multiple VMs). This gives services more time to shut down gracefully.
### Shutdown sequence[​](#shutdown-sequence)
When shutting down, the process happens in the following order:
1. VM shutdown involves three stages, and each one can take up to the VM timeout:
* Stage 1: Resume any paused VMs
* Stage 2: Hibernate VMs that are set up for hibernation
* Stage 3: Shut down any remaining VMs
All VMs in each stage are processed at the same time, meaning the total shutdown time can be calculated as: VM timeout × 3.
* Docker containers stop simultaneously (total time = Docker timeout).
* Other services include tasks like LXC containers and third-party plugins, which usually take a few seconds.
* Array shutdown: drives need to be unmounted and data synced; this typically takes 15-30 seconds.
Calculate your general shutdown timeout
**Formula:** Your general shutdown timeout should be greater than:
```
`
(VM timeout × 3) + (Docker timeout) + (Other services) + 15-30 seconds
`
```
**Example:** If we follow the formula, it would look like this: `(300 × 3) + 30 + 10 + 30 = 970 seconds (over 16 minutes)`.
**Recommended:** At least **180 seconds (3 minutes)** at minimum and **300+ seconds (5+ minutes)** if you have multiple VMs or complex containers.
If all your VMs are set to hibernate rather than shutting down, then the VM timeout is less critical since hibernation is nearly immediate. You could use a lower VM timeout (for example, 60-120 seconds) as a backup for any VMs that don't support hibernation.
### Detailed configuration guide[​](#detailed-configuration-guide)
This section provides in-depth information about configuring timeouts for different system components. Each timeout setting works together to ensure your server shuts down gracefully without data loss.
#### VM timeouts[​](#vm-timeouts)
Configure VM shutdown timeouts in ***Settings → VM Manager → VM Shutdown*** (enable Advanced view).
**How it works:**
* VMs go through three shutdown stages, each consuming the full VM timeout
* All VMs in each stage are processed simultaneously
* Total VM shutdown time = VM timeout × 3
**Common issues:**
* **Windows update interruptions:** Updates during shutdown can be corrupted if timeout expires.
* **Unsaved work:** Dialog boxes asking to save documents can halt shutdown indefinitely.
* **Hibernation failures:** VMs without QEMU Guest Agent may fail to hibernate and use full timeout.
VM timeout recommendations
* **Primary recommendation:** Configure VMs to hibernate instead of shutting down (requires QEMU Guest Agent).
* **If VMs crash during shutdown:** Increase timeout to **300 seconds (5 minutes)** for Windows VMs.
* **Windows updates:** Set Windows to install updates at startup rather than during shutdown.
* **Test your setup:** Manually stop your VMs to confirm they shut down or hibernate within the timeout period.
No safe timeout without hibernation
Without hibernation and QEMU Guest Agent, there isn't a truly safe timeout for Windows VMs. Dialog boxes or ongoing update installations could render any timeout inadequate, leading to forced shutdowns and data corruption risk.
#### Docker timeouts[​](#docker-timeouts)
Configure Docker container stop timeouts in ***Settings → Docker*** (enable Advanced view).
**How it works:**
* Containers are stopped in parallel, so total time equals the Docker stop timeout.
* Most containers stop within 10 seconds, but some may need more time.
* Complex containers with large databases or ongoing operations might require additional time.
* If the timer expires, containers are force-stopped.
Docker timeout recommendations
* The **default 10 seconds** works well for most containers.
* **If containers are crashing when stopped:** Increase timeout to **30 seconds**.
* Monitor your containers during shutdown to identify any that consistently need more time.
#### General timeouts[​](#general-timeouts)
Configure the general shutdown timeout in ***Settings → Disk Settings → Shutdown time-out***.
**UPS considerations (most critical factor):**
* Your UPS must provide enough runtime to complete the full shutdown sequence before battery runs out.
* For **manual shutdown**, you can set longer timeouts since you control when shutdown starts.
* With **power outage shutdown**, your timeout is limited by UPS battery life.
* **Test your UPS** by simulating a power outage to ensure your server shuts down cleanly with time to spare.
General timeout recommendations
* **If you get unclean shutdowns:** Increase to **180 seconds (3 minutes)** for systems without VMs.
* **For systems with VMs:** Use **300+ seconds (5+ minutes)** if not using hibernation.
* **If using hibernation:** **180-300 seconds** is usually sufficient.
* Ensure timeouts are not longer than what your UPS can support during a power outage.
#### Third-party services[​](#third-party-services)
**LXC containers:**
The LXC plugin has its own timeout setting for stopping containers. Like Docker containers, LXC containers typically stop within a few seconds, but some may require more time. Check the LXC plugin settings for the container stop timeout and include this timeout in your general shutdown timeout calculation.
**Other services:**
Some plugins or custom services may have their own shutdown procedures. Refer to the plugin documentation for specific timeout settings and incorporate them into your calculations.
**Updated formula with third-party services:**
```
`
(VM timeout × 3) + (Docker timeout) + (LXC/other timeouts) + 15-30 seconds
`
```
**Dynamix Stop Shell plugin:**
If you frequently use SSH or terminal sessions, open sessions can prevent clean shutdowns because Unraid waits for them to close before proceeding.
The [Dynamix Stop Shell](<https://unraid.net/community/apps/c/tools-system/p2?srsltid=AfmBOoqBXyDNfHxRDCL7Fv9Gcfz8-8CdHmiJSX16PRZpZLLzgQtw2mVk#:~:text=the given interval.-,Dynamix Stop Shell,-Dynamix Repository>) plugin helps by automatically closing lingering bash or SSH sessions when the array is stopped, ensuring a timely shutdown.
You can install it from [Community Applications (search for "Dynamix Stop Shell")](<https://unraid.net/community/apps/c/tools-system/p2?srsltid=AfmBOoqBXyDNfHxRDCL7Fv9Gcfz8-8CdHmiJSX16PRZpZLLzgQtw2mVk#:~:text=the given interval.-,Dynamix Stop Shell,-Dynamix Repository>).
When to use the plugin
* If you regularly have terminal sessions open.
* To prevent forgotten SSH sessions from delaying shutdown.
* For automated cleanup during shutdown.
caution
* Be cautious if you have scripts or processes running in terminal sessions.
* Ensure no critical write operations are in progress before shutdown.
* The plugin will forcefully close sessions, which could interrupt work.
* [Events that cause unclean shutdowns](#events-that-cause-unclean-shutdowns)
* [Unexpected power loss](#unexpected-power-loss)
* [Boot device failure](#boot-device-failure)
* [Open terminal sessions](#open-terminal-sessions)
* [Configuring shutdown timeouts](#configuring-shutdown-timeouts)
* [VM hibernation setup](#vm-hibernation-setup)
* [Timeout configuration](#timeout-configuration)
* [Shutdown sequence](#shutdown-sequence)
* [Detailed configuration guide](#detailed-configuration-guide)