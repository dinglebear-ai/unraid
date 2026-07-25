SMART reports & disk health | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
**Self-Monitoring, Analysis, and Reporting Technology (SMART)** is a helpful feature in most modern hard drives and SSDs. It keeps an eye on the health and reliability of your drives. In Unraid, SMART monitoring acts as an early warning system, alerting you to possible drive failures before you lose any data.
## Why SMART monitoring is important[​](#why-smart-monitoring-is-important)
SMART monitoring helps you catch subtle changes in your drive's health, like rising error counts or bad sectors, before they lead to serious problems, such as read or write errors. By paying attention to these warnings, you can replace or back up a failing drive, keeping your precious data safe. To stay informed, enable [notifications](/unraid-os/getting-started/set-up-unraid/customize-unraid-settings/#notification-settings) to receive alerts even when you're not logged into the Unraid WebGUI.
note
SMART monitoring works for SATA drives but is not available for SAS drives.
## How Unraid uses SMART[​](#how-unraid-uses-smart)
Unraid constantly checks key SMART attributes for each connected drive. If any of these attributes change, you'll see an orange icon next to the affected drive on the Dashboard. Clicking on the icon brings up a menu that lets you acknowledge the change. After that, Unraid will only notify you again if there are further updates to that attribute.
For a closer look at a drive's SMART data, click its name on the **Main** tab in the Unraid WebGUI.
Some SMART attributes Unraid monitors by default include:
|**ID****Attribute****What it means****When to be concerned / Action(s) to take**|**5**Reallocated sectors countThis shows how many bad areas on the drive have been replaced with backup sectors.If it's above 0, your drive is starting to fail. If this number grows, [back up your data](/unraid-os/getting-started/set-up-unraid/complete-your-post-setup-essentials/#back-up-your-flash-device) and get a new drive soon.|**187**Reported uncorrected errorsThese are errors that the drive couldn't fix.If this shows any number greater than 0, it's a serious sign. Replace the drive as soon as you can.|**188**Command timeoutThis counts how often operations took too long, pointing to possible drive or cable issues.Occasional timeouts can happen due to power problems. If this is frequently above 0, check your cables and power connections.|**197**Current/Pending sector countThis indicates unstable sectors that might fail soon.Any number above 0 means the drive can't read some areas properly. If it doesn't go back to 0 after a few days, replace the drive.|**198**Uncorrectable Sector countThese sectors can't be read or written even after multiple attempts.If you see that this number is greater than 0, it means you've lost data. Replace the drive right away.|**199**UDMACRC error countThis shows errors in the data transfer between the drive and the computer, often caused by bad cables.If this number goes up, check and reconnect the SATA cables. If it stops increasing after that, it should be fine.
## What to do if you get a SMART warning[​](#what-to-do-if-you-get-a-smart-warning)
If you receive a SMART warning, here's what you should do:
* Check the affected attribute(s) in the table above.
* If you see that the counts for reallocated, pending, or uncorrectable sectors are rising, it's time to plan on replacing the drive soon.
* For CRC errors, inspect your data cables and make sure they're securely seated.
* If you're uncertain about a warning, don't hesitate to utilize the [Unraid forums](https://forums.unraid.net/) or consult your drive manufacturer's documentation.
warning
SMART warnings are early signals that shouldn't be ignored. Take action to back up your data and consider replacing the drive before it fails.
* [Why SMART monitoring is important](#why-smart-monitoring-is-important)
* [How Unraid uses SMART](#how-unraid-uses-smart)
* [What to do if you get a SMART warning](#what-to-do-if-you-get-a-smart-warning)