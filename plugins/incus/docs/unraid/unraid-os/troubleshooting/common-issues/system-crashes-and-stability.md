System crashes & stability | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
System crashes and stability issues can be tough to diagnose and resolve. They often come from hardware failures, configuration mistakes, or conflicts within software. This section will guide you through common causes, diagnostic steps, and best practices to help keep your Unraid server stable.
## RAM issues[​](#ram-issues)
Memory problems are among the most common causes of system instability and data corruption. RAM can wear out over time, leading to unpredictable errors that are often difficult to diagnose. This section covers how to identify and resolve memory-related stability issues.
Common symptoms of RAM problems include:
* Unexplained system crashes or freezes
* Data corruption in files or array
* Random application errors
* System instability under load
* Failed parity checks
### Testing RAM[​](#testing-ram)
Memory testing is essential for diagnosing stability issues. The Unraid boot menu includes Memtest86+ for comprehensive RAM testing, which works on both Legacy and UEFI systems.
To test your RAM:
1. Restart your server and select **Memtest86+** from the boot menu.
2. Let the test run for at least 2-4 hours for thorough coverage.
3. Monitor for any error messages or failed tests.
Other RAM testing tools
* [**MemTest86+**](https://www.memtest.org/): Open source tool included with Unraid
* [**MemTest86**](https://www.memtest86.com/): Commercial tool with support for modern hardware
* [**Karhu RAM Test**](https://www.karhusoftware.com/): A paid but highly effective Windows-based tool that can detect errors faster than traditional methods, with detection rates of 95.67% within 30 minutes (ideal for DDR5 systems)
* [**HCI MemTest**](https://hcidesign.com/memtest/): Popular, free Windows-based tester
* [**Prime95**](https://prime95.net/): Validates RAM and CPU stability simultaneously
If you find RAM errors
If Memtest86+ shows errors, try reseating the RAM modules and rerunning the test. Test each RAM stick individually to pinpoint faulty modules. Refer to your motherboard documentation for supported RAM speeds and configurations, and avoid mixing different RAM brands or speeds to minimize compatibility issues.
### Overclocking RAM[​](#overclocking-ram)
RAM overclocking can significantly impact system stability. Many users want to run their RAM at the highest speed specified by the manufacturer, but motherboard and CPU combinations often have maximum reliable RAM speeds that are lower than what the RAM is rated for.
RAM overclocking risks and recommendations
**Purchasing:** When possible, always purchase RAM that is listed on your motherboard's QVL (Qualified Vendor List), not from the RAM manufacturer's QVL. This ensures better compatibility and stability.
**Intel XMP and AMD AMP profiles are overclocks.** For the best stability, always run RAM at SPD speeds, not XMP/AMP speeds.
**Risks of overclocking:**
* System instability and random crashes
* Data corruption and file system errors
* Reduced hardware lifespan
* Incompatibility with other components
**Troubleshooting:** If Memtest86+ passes but you're still experiencing issues, disable XMP/AMP and try again. The performance difference is usually minimal, but the stability improvement can be significant.
#### Best practices
1. Always check your motherboard and CPU specifications before attempting to overclock.
2. **For maximum stability:** Disable XMP/AMP profiles and run RAM at default SPD speeds.
3. Start with conservative settings and gradually increase.
4. Test stability with Memtest86+ after any changes.
5. If you notice instability, immediately revert to default or lower speeds.
6. Consider the trade-off between performance and stability for server environments.
## Critical stability factors[​](#critical-stability-factors)
System stability relies on more than just RAM or CPU performance. Multiple hardware and software components work together to maintain reliable operation. This section covers the key areas that influence your Unraid server's stability and provides actionable steps to prevent and resolve issues.
System stability typically depends on:
* Power supply quality and reliability
* Proper thermal management
* Disk health and I/O performance
* Plugin and application compatibility
* Current firmware and BIOS versions
* Proactive monitoring and maintenance
### Power supply reliability[​](#power-supply-reliability)
**Click to expand/collapse**
A stable and sufficient power supply is crucial for uninterrupted server operation. Power issues are often overlooked but can cause the most frustrating stability problems.
Common power-related issues include:
* Random system crashes or freezes
* Data corruption during writes
* Sudden shutdowns without warning
* Hardware component failures
* Inconsistent performance
#### Prevention and maintenance
Proactive power supply maintenance prevents the most common stability issues. Regular checks and proper component selection can avoid costly downtime and data loss.
1. Always use a high-quality, appropriately rated PSU for your hardware.
2. **Critical:** Ensure your power supply can handle simultaneous spin-up of ALL attached storage devices. The 12V rail current rating must account for the spin-up current of all drives at once, not staggered.
3. Avoid power splitters whenever possible. They can cause voltage drops and instability, especially during high-current events like drive spin-up.
4. Consider redundant power supplies for enterprise and multi-bay systems.
5. Ensure each PSU unit is properly seated and connected.
6. Monitor PSU health indicators (like AC OK LEDs) if available.
7. Replace failed units immediately to avoid downtime.
8. Regularly check that all power cords are secure.
9. Verify circuits are not overloaded.
### Thermal management and overheating[​](#thermal-management-and-overheating)
**Click to expand/collapse**
Overheating is one of the leading causes of hardware failure and erratic server behavior. Thermal issues can cause components to throttle performance or fail completely.
Signs of thermal problems include:
* System throttling or reduced performance
* Random crashes during high load
* Fan noise or unusual cooling behavior
* Hardware component failures
* Inconsistent system behavior
#### Cooling solutions and best practices
Proper cooling is essential for maintaining system stability and preventing thermal throttling. These practices help ensure your server operates within safe temperature ranges.
1. Ensure your server is located in a well-ventilated area.
2. Maintain controlled ambient temperatures (ideally 18-24°C/64-75°F).
3. Utilize adequate cooling solutions (high-quality fans, rack-mounted air conditioning).
4. Monitor system temperatures using hardware sensors.
5. Clean dust and debris from cooling components regularly.
6. Avoid placing servers in confined or poorly ventilated spaces.
7. Consider additional cooling for high-performance systems.
Monitoring temperatures proactively helps identify cooling issues before they cause system instability. Use Unraid's built-in temperature sensors or hardware monitoring tools compatible with your system.
### Disk health and I/O errors[​](#disk-health-and-io-errors)
**Click to expand/collapse**
Disk errors, whether due to aging drives or sudden failures, can disrupt system stability and compromise data. I/O issues often manifest as performance problems before causing complete failures.
Symptoms of disk problems include:
* High server load or slow performance
* Failed parity checks
* Data corruption or read/write errors
* Unusual disk activity or noise
* System freezes during disk operations
#### Preventive maintenance
Regular maintenance helps catch disk issues before they cause data loss or system instability. These proactive steps can significantly extend drive lifespan and maintain performance.
1. Regularly monitor drive SMART data using Unraid's built-in [disk health tools](/unraid-os/system-administration/monitor-performance/smart-reports-and-disk-health/).
2. Run periodic [parity checks](/unraid-os/using-unraid-to/manage-storage/array/array-health-and-maintenance/#parity-checks) to ensure data integrity.
3. Monitor disk temperatures and performance metrics.
4. Keep drives properly ventilated and cooled.
#### When problems occur
Quick response to disk issues can prevent data loss and minimize downtime. Follow these steps systematically to identify and resolve problems.
1. Promptly replace failing drives to prevent data loss.
2. Investigate cabling, power supply, and drive controller health.
3. Check for loose connections or damaged cables.
4. Consider running extended SMART tests for suspect drives.
5. Monitor system logs for I/O error patterns.
### Application and plugin stability[​](#application-and-plugin-stability)
**Click to expand/collapse**
Unraid’s flexibility comes from its support for plugins and Docker containers. However, third-party plugins can introduce instability, especially if they are outdated or incompatible with your current Unraid version.
When troubleshooting...
* Use [Safe Mode](/unraid-os/using-unraid-to/customize-your-experience/plugins/#troubleshooting-with-safe-mode) to temporarily disable plugins and identify the source of issues.
* Prefer Docker containers over plugins for added features since containers provide better isolation from the core operating system and are less likely to cause system-wide problems.
* Regularly update or remove unused or unsupported plugins to maintain stability.
### Firmware and BIOS updates[​](#firmware-and-bios-updates)
**Click to expand/collapse**
Outdated firmware or BIOS can lead to instability, security vulnerabilities, and hardware compatibility issues. Regular updates are essential for maintaining system stability and security.
* Schedule regular checks for firmware and BIOS updates for your motherboard and critical components.
* Always back up your configuration before updating, and if possible, test updates in a controlled environment.
* Document your update process and review it from time to time to ensure you’re following best practices.
Keeping your system firmware current helps prevent unexpected crashes and unlocks new hardware features.
Recommendations
* Use manufacturer utilities for risk-free updates, such as [ASUS Armoury Crate](<https://www.asus.com/supportonly/armoury crate/helpdesk_download/>), [Gigabyte @BIOS](https://www.gigabyte.com/Support/Consumer/Download), or [MSI Center](https://www.msi.com/Landing/MSI-Center).
* Check your motherboard's BIOS settings for automatic update options if available.
### Proactive system monitoring[​](#proactive-system-monitoring)
**Click to expand/collapse**
Consistent monitoring is essential for early problem detection.
* Enable [persistent logging](/unraid-os/troubleshooting/diagnostics/capture-diagnostics-and-logs/) in Unraid to retain logs across reboots.
* Utilize system monitoring tools to track temperatures, voltages, and drive health. Set up alerts for critical thresholds to take action before minor issues escalate.
* Regularly reviewing system logs allows you to spot patterns and address underlying causes before they lead to downtime.
* [RAM issues](#ram-issues)
* [Testing RAM](#testing-ram)
* [Overclocking RAM](#overclocking-ram)
* [Critical stability factors](#critical-stability-factors)
* [Power supply reliability](#power-supply-reliability)
* [Thermal management and overheating](#thermal-management-and-overheating)
* [Disk health and I/O errors](#disk-health-and-io-errors)
* [Application and plugin stability](#application-and-plugin-stability)
* [Firmware and BIOS updates](#firmware-and-bios-updates)
* [Proactive system monitoring](#proactive-system-monitoring)