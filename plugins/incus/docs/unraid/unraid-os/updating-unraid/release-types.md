Unraid OS release types | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
Unraid OS releases are published at different levels of readiness. Understanding the difference helps you decide whether to update a production server, test a future release, or wait for a later build.
For most servers, use the latest **Stable** release. Use **Beta** or **Release Candidate (RC)** releases only when you are comfortable testing pre-release software and reading release notes carefully.
## Release types at a glance[​](#release-types-at-a-glance)
|Release typeExample versionBest forWhat to expect|**Stable**`7.2.0`, then `7.2.1`, `7.2.2`, and later patchesProduction serversGeneral availability release recommended for normal use. A stable series often begins with a `.0` minor release, then receives patch releases with fixes and compatibility updates.|**Release Candidate (RC)**`7.3.0-rc.1`Final validation on test systemsA pre-release that is expected to be close to stable, but may still include unresolved issues or last-minute changes.|**Beta**`7.3.0-beta.2`Early testing and feedbackA pre-release used to test new features, platform changes, fixes, and upgrade paths before the release is ready for stable use.|**Withdrawn pre-release**VariesMoving off an unavailable test buildA beta or RC that is no longer enabled for regular use. Update to the latest stable release unless the release notes say otherwise.
## Supported minor series and EOL[​](#supported-minor-series-and-eol)
Unraid supports two public minor series at a time:
* The **current public minor series**, such as `7.3.x` once any `7.3` beta, RC, or stable release is public.
* The **previous public minor series**, such as `7.2.x` while `7.3.x` is the current public series.
A public beta or RC counts as a public minor series for support-policy purposes. This does not mean beta or RC releases are recommended for production use; it only means the support window moves forward when the next minor series becomes public.
Within a supported minor series, use the latest available patch or pre-release build for that series. Older patch builds in the same series are superseded and remain available only for archive, rollback, and release-note reference.
Older minor series are **End of Life (EOL)**. EOL releases are not supported and no longer include bug fixes or security updates.
To check the current status of a release, see the [Version Archive](/unraid-os/download_list/).
## Stable releases[​](#stable-releases)
A stable release is the version most users should install. Stable releases are intended for regular use and are the safest choice for servers that store important data, host services, or need predictable uptime.
Stable release notes explain major changes, upgrade warnings, known issues, and rollback notes. Before updating, read the release notes for the version you plan to install, then follow the [standard update process](/unraid-os/updating-unraid/).
Stable releases can include:
* **Minor releases**, such as `7.2.0`, which start a new stable series.
* **Patch releases**, such as `7.2.5`, which update an existing stable series.
At Unraid, minor releases usually contain the larger stable changes for a series. These can include new or changed WebGUI behavior, storage, Docker, VM, networking, security, driver, kernel, and package updates, plus upgrade-path changes that need broader validation before the stable release is published.
After a typical `.0` stable release, later patch releases in the same series may follow. For example, `7.2.1`, `7.2.2`, and `7.2.5` are all patch releases in the `7.2` series. Patch releases are still stable releases, but they usually focus on resolving defects, addressing security issues, improving hardware or plugin compatibility, updating bundled components, and backporting important fixes without starting a new feature series.
## Beta releases[​](#beta-releases)
Beta releases are public pre-releases for users who want to help test upcoming Unraid OS changes. They can include new features, larger platform changes, dependency updates, and fixes that need broader hardware and workflow coverage before stable release.
Install beta releases only on test or non-production systems where you can tolerate downtime, rollback work, and troubleshooting. A beta can contain regressions that are not present in the current stable release.
Before installing a beta:
* Back up your boot device.
* Read the full release notes, especially known issues and rollback notes.
* Confirm that your plugins and critical containers are compatible.
* Be prepared to report issues with diagnostics and reproduction steps.
* Avoid making irreversible storage or pool-format changes unless the release notes say the rollback path is safe.
## Release candidate releases[​](#release-candidate-releases)
A release candidate is a pre-release that is closer to the intended stable version than a beta. RC builds are used to validate final fixes, packaging, upgrade behavior, and regressions before stable release.
An RC is still pre-release software. Treat it with the same caution as a beta unless the release notes for that specific version say otherwise.
RC releases are useful when:
* You want to test whether a beta issue is fixed before stable release.
* You rely on hardware or plugins that need validation against the next stable version.
* You can provide useful feedback if something breaks.
## Release branches and the Update OS tool[​](#release-branches-and-the-update-os-tool)
In the WebGUI, open ***Tools -\> Update OS*** or use **Check for Update** from the top-right menu.
The Update OS tool shows updates for the release branch your server is already using. To change release branches, open the top-right account menu and choose **Manage Unraid.net Account** to manage the server in the [Unraid account app](/unraid-account/server-management/). You cannot switch release branches directly from inside the OS.
* Use the **Stable** branch for stable releases.
* Use the **Next** branch for available beta and RC releases.
The available branches and releases can change over time. If a pre-release is available on your selected branch, review the pre-release disclaimer, changelog, and release notes before continuing.
## License and update eligibility[​](#license-and-update-eligibility)
Your license remains valid even if your update eligibility expires. Update eligibility only affects access to new OS updates.
For pre-releases:
* Beta and RC versions are for testing and may contain bugs.
* Public beta and RC versions count when identifying the current public minor series.
* Support for a specific pre-release build ends when it is superseded by a newer pre-release or the corresponding stable release.
* Your license must be eligible for OS updates on the stable release date to receive that stable version.
* If your update eligibility expires before the stable release, you must extend your license to upgrade to that stable version or roll back to a supported stable version that your license allows.
For more detail, see [What happens with pre-releases](/unraid-os/troubleshooting/licensing-faq/#pre-release-policy) in the licensing FAQ.
## Choosing the right release[​](#choosing-the-right-release)
Use this general rule:
* Use **Stable** for production systems, important data, remote servers, and systems you do not want to troubleshoot.
* Use **RC** when you want to validate the next stable release and can handle pre-release risk.
* Use **Beta** when you want early access to new work and are prepared to test, report issues, and potentially roll back.
* Do not remain on old beta or RC releases. When a newer pre-release or stable release is available, update or roll back to a supported stable version.
If you are unsure, stay on the latest stable release.
## Reporting issues and feature requests[​](#reporting-issues-and-feature-requests)
Good feedback helps turn beta and RC builds into better stable releases and helps improve stable releases over time. When reporting an issue, include:
* The exact Unraid OS version.
* Whether the issue started after updating.
* Diagnostics from ***Tools -\> Diagnostics***.
* Steps to reproduce the issue.
* Any relevant plugin, Docker, VM, network, or storage configuration details.
Use the relevant Product Unraid tracker:
* For stable-release bugs, use [Unraid OS Bug Reports](https://product.unraid.net/b/unraid-os-bugs).
* For beta or RC feedback, use [Unraid OS Pre-release (Bugs & Feedback)](https://product.unraid.net/b/unraid-os-prerelease-bugs-feedback).
* For product ideas and enhancements, use [Unraid OS Feature Requests](https://product.unraid.net/b/unraid-os-feature-requests).
For stable release discussions and announcements, see the [Unraid announcements forum](https://forums.unraid.net/forum/7-announcements/).
* [Release types at a glance](#release-types-at-a-glance)
* [Supported minor series and EOL](#supported-minor-series-and-eol)
* [Stable releases](#stable-releases)
* [Beta releases](#beta-releases)
* [Release candidate releases](#release-candidate-releases)
* [Release branches and the Update OS tool](#release-branches-and-the-update-os-tool)
* [License and update eligibility](#license-and-update-eligibility)
* [Choosing the right release](#choosing-the-right-release)
* [Reporting issues and feature requests](#reporting-issues-and-feature-requests)