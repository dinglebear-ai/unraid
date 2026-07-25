Array health and maintenance | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
Regularly checking your Unraid array is crucial for maintaining data integrity and identifying potential issues before they result in data loss. This page covers monitoring tools and troubleshooting procedures for your array.
## Checking array devices[​](#checking-array-devices)
You can initiate a check using the **Check** button under ***Array Operations***. Depending on your array's configuration, this button allows you to conduct either a parity check or a read check.
For convenience, you can schedule these checks to run automatically at intervals that suit you by navigating to ***Settings → Scheduler***. It's advisable to perform automated, correcting checks on a monthly or quarterly basis to ensure the ongoing health of your data and fix any sync errors found.
### Parity checks[​](#parity-checks)
A parity check is essential when your array includes at least one assigned parity device. During this process, all data disks are read simultaneously. The system recalculates the parity and compares it to the information stored on your parity disk(s).
**In-depth: Parity sync vs. Parity check - What's the difference?** - Click to expand/collapse
A parity sync reads all data disks and creates parity from scratch, saving the results on the parity drives. This process typically happens when you add or replace a parity drives or after significant configuration changes.
A parity check reads all data disks along with the parity drives. It recalculates the parity values and compares them to the stored values. There are two modes for running a parity check:
* **Correcting (CORRECT):** If it finds a mismatch, it updates the parity disk and logs the event.
* **Non-correcting (NOCORRECT):** Only logs any errors found without updating the parity.
To avoid excessive logging, only the first 100 addresses with errors are reported during a parity check. These mismatches are referred to as **sync errors** and indicate where the parity does not align with the data, typically due to issues such as sudden power losses or hardware problems. Each sync error is counted in 4KiB blocks - this is the system's I/O unit size (known as the Linux page size).
**In-depth: What does "valid" mean for parity and array disks?** - Click to expand/collapse
A **valid parity disk** indicates that after the last successful parity sync, Unraid recognized the parity as "good," meaning it's suitable for data recovery if a disk fails. The "valid" status applies to every disk in the array, not just the parity one. If all disks except one are valid, Unraid can reconstruct the missing or failed disk's data using parity.
Unraid maintains the parity disk's "valid" status even when some sync errors occur following a non-correcting check. This ensures that you can still recover a failed disk. If the parity were marked as invalid, you would risk having two invalid disks after just one additional failure, leading to potential data loss.
While a parity check is in progress, you can still use the array. However, be aware that performance may slow down due to drive contention, as both file operations and the check will compete for resources.
Normally, if the parity check identifies errors, Unraid will update the parity disk to align with the computed data and increment the Sync Errors counter.
tip
If you prefer to run a check without making corrections, simply uncheck **Write corrections to parity** before starting. This way, errors will be reported but not fixed.
important
After an "Unsafe Shutdown" - when the array is restarted without being properly stopped - Unraid automatically initiates a parity check using the mode configured under **Settings → Scheduler → Parity Check** (non-correcting by default). To change how the automatic check runs, open **Settings → Scheduler → Parity Check** and adjust the options there. Unexpected power loss is the most common trigger for an unsafe shutdown, so using an uninterruptible power supply (UPS) is strongly recommended to protect your data.
#### What are parity errors?
Parity errors happen when the parity information your system calculates doesn't match what's stored on your parity drives. This mismatch can arise from several issues, including:
* Sudden power loss or unsafe shutdowns
* Failing drives or disk errors
* Problems with cables or connections
* Unclean shutdowns or unexpected system crashes
When parity errors occur, either the parity drives or the data disks could be out of sync. Ideally, a parity check should report zero errors so everything functions correctly.
#### What to do if you encounter parity errors
If your parity check reveals errors:
1. **Investigate the problem:** Start by checking SMART reports, which provide detailed information about your drives' health. Look for any signs of disk or connection problems.
2. **Seek help from our forums:** If you cannot resolve the issue on your own, consider reaching out for advice on the Unraid forums. The community can offer valuable insights and suggestions based on their experiences.
3. **Run another check:** After you've addressed any hardware issues, running another parity check is a good idea to ensure everything is back in order.
Rebuild Time
Remember that parity checks can take several hours, depending on the size of your disks and the activity level of your system. For the best results, schedule these checks during times of low system usage.
### Read checks[​](#read-checks)
A read check is an important task you should perform under certain conditions to ensure the health of your storage array. This check is necessary **if your array does not have any parity devices assigned** or **if you have more disabled drives than available parity drives**.
During a read check, every sector of every disk in the array is examined. The goal is to verify that all data can be accessed and to identify any unrecoverable read errors.
#### Why read checks matter
Read checks are essential for monitoring the health of your disks, especially in configurations without parity protection. If a disk encounters an unrecoverable read error during the check, the affected data cannot be retrieved, which could lead to data loss. Therefore, keeping an eye on the results of these checks is crucial, and taking action when errors are reported is necessary.
You can also review the history of read check operations in the Unraid interface, which helps you spot trends or recurring issues over time.
#### When to use a read check
Consider running a read check in the following situations:
* **No parity devices assigned:** When your array lacks parity protection.
* **Verifying disk integrity:** To confirm the integrity of each disk without making any corrections.
* **Post-hardware issue resolution:** After fixing hardware issues, to ensure all disks are healthy.
#### What to do if errors are found
If your read check reports errors, here are some steps to follow:
1. **Review SMART reports:** Check the SMART reports for the affected disks to understand their health status.
2. **Inspect connections:** Ensure that physical connections and cables are secure.
3. **Consider replacements:** If a disk shows persistent errors, think about replacing it.
4. **Backup critical data:** Move important data off any disks reporting errors as soon as possible to prevent data loss.
warning
Without parity protection, any unrecoverable read error will lead to permanent data loss for the affected files or sectors.
tip
To maintain the health of your disks, it's wise to **schedule regular read checks**, especially if your array does not have parity protection. This proactive measure will help you catch potential issues early and safeguard your data.
### Check history[​](#check-history)
Whenever the system performs a parity check or a read check, it keeps a record of what happened. You can view these details easily by clicking the **History** button found under ***Array Operations*** in the interface.
For those who want to dive deeper, all these records are saved in a text file located in the `config` directory on your Unraid boot device.
## Spinning disks down or up[​](#spinning-disks-down-or-up)
Unraid allows you to control the power states of your hard drives. You can easily spin them up or down, and manage SSDs to be active or in standby. This helps save energy, extend the life of your drives, and reduce noise when the disks are not being used.
### Why spin down or up?[​](#why-spin-down-or-up)
Spinning down drives that aren't used often saves energy and helps them last longer. Spinning up disks ahead of time cuts down wait times when you need files soon.
### How to control spin states[​](#how-to-control-spin-states)
Control disk spin states through the **Main** tab:
1. Go to the **Main** tab and locate your array devices.
2. Each disk shows spin control buttons:
* 🔘 button - **Spin Up** (if currently spun down)
* 🟢 button - **Spin Down** (if currently spinning)
* Click the appropriate button for the action you want.
Remember that if a disk is being accessed (like if you're opening a file), it will stay active and ignore any spin-down request.
When a disk is spun down, its temperature won't show in the WebGUI. However, once any application or user accesses it, it will automatically spin up.
tip
Use the spin controls to save power and reduce wear on your drives. Remember that disks that are actively being used will stay on until all tasks are finished.
## Reset the array configuration[​](#reset-the-array-configuration)
Resetting your array configuration is an important step that should be undertaken carefully. This process is usually necessary when removing a disk, starting fresh with a new array layout, or fixing disk assignment issues. Please note that this action can impact data protection and parity, so ensure you only proceed when truly needed.
Reset your array when:
* Removing or replacing disks
* Starting fresh with a new array layout
* Fixing disk assignment errors
* Recovering from configuration problems
To reset your array configuration:
1. Go to **Tools → New Config**.
2. Optionally keep some existing disk assignments for minor adjustments.
3. Check the confirmation box and click **Apply**.
4. Return to the **Main** tab.
5. Assign or unassign disks as needed.
6. Start the array in Normal or Maintenance Mode.
important
* Unraid attempts to recognize previously used drives and preserve data where possible
* Removing a data drive invalidates parity unless that drive was zeroed before removal
* Changing disk order won't affect parity1, but it can invalidate parity2
caution
When you see the **Start** button, there is a checkbox labeled **Parity is Valid**. Only check this box if you are certain it is correct or if an experienced Unraid user has advised you to do so during recovery. Incorrectly checking this option can lead to data loss.
Do not use **New Config** if your goal is to rebuild a disk. Performing a New Config clears the array history required for a rebuild, and Unraid will not offer to rebuild the disk afterward. Follow the disk rebuild procedure instead.
### Undoing a reset[​](#undoing-a-reset)
To reverse a reset:
1. Access your boot device over the network (SMB).
2. Open the `config` folder.
3. Rename `super.old` to `super.dat`.
4. Reboot your server to restore the prior configuration.
## Status reports[​](#status-reports)
Unraid provides status reports that help you keep track of the health of your storage array. These reports are a quick way to check if any of your disks are disabled or having issues with reading or writing data.
* **Current status:** Status reports show the current condition of your array. It's important to note that this information resets after you restart your system, so that it won't keep a history of past issues.
* **No historical data:** If you want to see what has happened before a reboot, you'll need to look elsewhere, as these reports don't save past states.
important
Remember that the status reports don't include SMART data. SMART reports give you a more detailed view of individual disk health. So, even if your status report shows everything is fine, checking the SMART reports regularly is still a good idea to catch any potential problems early.
## Troubleshooting array start failures[​](#troubleshooting-array-start-failures)
If your array won't start, follow these steps to identify and fix common problems. Look for error messages under ***Main → Array Operation***.
### Missing disks[​](#missing-disks)
**Message:**
`Too many wrong and/or missing disks!`
With **one parity drive**, you can only have **one** missing disk. With two parity drives, **two** disks can be missing and you can still start the array, and so on. Parity helps until you can replace the missing disk.
**What to Do:**
Replace the missing disk. For dual-parity configurations, replace the missing disks one at a time.
If you can't recover the data (or if more than 2 disks fail in a dual-parity setup), go to ***Tools → New Config*** to perform the New Config procedure.
### Device limit[​](#device-limit)
**Message:**
`Too many attached devices. Please consider upgrading your registration key.`
The rules for connecting storage apply only before starting the array. After the array is started, you can add more storage, including USB drives for virtual machines. However, be aware that Unraid currently only limits the number of attached storage devices on the [**Starter license tier**](https://unraid.net/pricing)
(6 device limit).
tip
The maximum applies to all devices except the boot USB.
To resolve this error:
1. Stop the array.
2. Remove any unneeded storage devices.
3. Start the array.
4. Reconnect devices afterwards for **Unassigned Devices** use.
### License issues[​](#license-issues)
**Message:**
`Invalid or missing registration key.`
A valid registration key is required in order to start the array. To purchase or get a trial key:
1. Go to ***Tools → Registration***.
2. Click **Get Trial Key** or **Purchase Key**.
3. Install the key by returning to **Registration**, pasting in the field, and clicking the **Install Key** button.
Trial vs. Paid Licenses
* **Trial License:** Full Unraid access for 30 days, just like the higher license tiers. You can use unlimited storage devices, but you'll need an internet connection to start it up. [Start a new trial here.](https://unraid.net/getting-started)
* **Paid License:** This is yours to keep forever! However, there are limits on the number of devices based on the plan you choose (**Starter**, **Unleashed**, or **Lifetime**). After you activate it, you don't have to connect to the internet anymore.
tip
If you see an "invalid key" error, it might mean your trial has **expired**. To keep using Unraid, you can [purchase a license here](https://unraid.net/pricing).
Blacklisted USB boot devices
If your server is online and your trial hasn't run out, your USB flash drive might have a GUID that can't register a key. This can happen if the GUID isn't unique or has already been registered by someone else (common with counterfeits or some well-known brands). Using an SD card reader via USB can also cause this issue since it often has a generic GUID. If your USB flash drive is **blacklisted**, it can't be used anymore. See [Create your bootable media](/unraid-os/getting-started/set-up-unraid/create-your-bootable-media/) and [Selecting a replacement device](/unraid-os/system-administration/maintain-and-update/changing-the-flash-device/#selecting-a-replacement-device) for guidance on choosing a compatible boot device.
### Key server connection[​](#key-server-connection)
**Message:**
`Cannot contact key-server`
If you have a Trial license, you'll see a message indicating that you need to contact the Unraid license server to start your array. However, if you have a paid license, you can start the array without any extra steps.
For Trial users, your server tries to connect to the license key server to check your license when it first boots up. If it can't connect within 30 seconds, the array won't start. But don't worry! Each time you refresh or navigate the WebGUI, it will try again to validate your license quickly. Once it successfully validates, your server won't need to check again unless you reboot.
### Withdrawn release[​](#withdrawn-release)
**Message:** `This Unraid release has been withdrawn.`
If you see this message, it means you're using a beta or release candidate version of Unraid that isn't enabled for regular use.
To resolve this:
1. Open Unraid.
2. Go to ***Tools → Update OS***.
3. Install the latest stable version.
Once the update is complete, restart your server to start your array.
## Disk failure during a rebuild[​](#disk-failure-during-a-rebuild)
If a second disk fails while you're rebuilding another one, what you can do will depend on your parity setup.
### Single parity disk[​](#single-parity-disk)
If one disk fails during the rebuild of another, the rebuild will stop because the data can't be accurately restored. Unfortunately, you won't be able to recover your data in this situation.
### Dual parity disk[​](#dual-parity-disk)
If you have two parity drives, you have more options:
* You can wait for the first rebuild to finish and then deal with the second failed disk.
* Or, you can stop the current rebuild, replace the second failed disk, and then start the array to rebuild both disks at the same time.
If the first rebuild is almost done, it's usually better to let it finish. If it just started, it might be faster to rebuild both together.
warning
Rebuilding disks puts a lot of stress on all drives, which increases the chance of new failures. Always check drive health using SMART reports before starting a rebuild.
Rebuild Time
Be prepared for the rebuild process to take several hours. The time can vary based on disk size and how busy your system is. Larger disks and busy systems may take longer.
* [Checking array devices](#checking-array-devices)
* [Parity checks](#parity-checks)
* [Read checks](#read-checks)
* [Check history](#check-history)
* [Spinning disks down or up](#spinning-disks-down-or-up)
* [Why spin down or up?](#why-spin-down-or-up)
* [How to control spin states](#how-to-control-spin-states)
* [Reset the array configuration](#reset-the-array-configuration)
* [Undoing a reset](#undoing-a-reset)
* [Status reports](#status-reports)
* [Troubleshooting array start failures](#troubleshooting-array-start-failures)
* [Missing disks](#missing-disks)
* [Device limit](#device-limit)
* [License issues](#license-issues)
* [Key server connection](#key-server-connection)
* [Withdrawn release](#withdrawn-release)
* [Disk failure during a rebuild](#disk-failure-during-a-rebuild)
* [Single parity disk](#single-parity-disk)
* [Dual parity disk](#dual-parity-disk)