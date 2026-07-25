Linear release note template | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
Use this template when asking a Linear agent to draft Unraid OS release notes from a release project, milestone, or issue list.
## Linear agent prompt[​](#linear-agent-prompt)
Copy this prompt into Linear, then replace the bracketed values before running it.
```
`
Draft Unraid OS release notes for [VERSION] using the linked Linear issues, pull requests, package diff, and security notes.
Release context:
- Version: [VERSION]
- Release date: [YYYY-MM-DD]
- Previous release: [PREVIOUS\_VERSION]
- Release type: [stable / bugfix / security / beta / release candidate]
- Audience: Unraid OS users upgrading from [PREVIOUS\_VERSION]
- Source scope: [Linear project, milestone, label, or issue list]
Output only the final release note Markdown. Do not include process notes, issue IDs, internal-only implementation details, or unsupported claims.
Follow this structure:
# Version [VERSION] [YYYY-MM-DD]
[One short summary paragraph. Mention the most important user-facing themes: security, kernel, Docker, storage, WebGUI, virtualization, licensing, hardware support, API, or package updates.]
[Optional recommendation sentence for security or important bugfix releases.]
## Upgrading
For step-by-step instructions, see [Updating Unraid](/unraid-os/updating-unraid/). Questions about your [license](/unraid-os/troubleshooting/licensing-faq/)?
### Known issues
[List release-specific known issues. If there are no new release-specific known issues, refer to the previous relevant release notes.]
### Notes
[Optional operational notes that are important but not bugs, warnings, or rollback blockers.]
### Rolling back
[List rollback warnings and compatibility limits. Include prior-release links when users need to read earlier rollback notes.]
## BREAKING CHANGES
[Include only when the release changes behavior, configuration, compatibility, data format, upgrade safety, rollback safety, or user workflows in a way users must act on.]
## Changes vs. [PREVIOUS\_VERSION\_LINK\_TEXT]([PREVIOUS\_VERSION\_LINK])
### Security
- Security: [User-facing security fix, CVE coverage, or hardening change.]
### Containers / Docker
- New: [New Docker or container capability.]
- Improvement: [Improved Docker or container behavior.]
- Fix: [Corrected Docker or container issue.]
### Storage
- New: [New storage capability.]
- Improvement: [Improved storage behavior.]
- Fix: [Corrected storage issue.]
### WebGUI / System
- New: [New WebGUI or system capability.]
- Improvement: [Improved WebGUI or system behavior.]
- Fix: [Corrected WebGUI or system issue.]
### File Manager
- Improvement: [Improved File Manager behavior.]
- Fix: [Corrected File Manager issue.]
### Networking / Hardware
- New: [New networking or hardware support.]
- Improvement: [Improved networking or hardware behavior.]
- Fix: [Corrected networking or hardware issue.]
### Virtualization
- New: [New VM capability.]
- Improvement: [Improved VM behavior.]
- Fix: [Corrected VM issue.]
### Unraid API
- Update Unraid API to dynamix.unraid.net [VERSION] - [see changes](https://github.com/unraid/api/releases).
- Fix: [Corrected API issue.]
### Linux kernel
- Linux kernel: update to `[KERNEL\_VERSION]-Unraid`.
- Security: [Kernel CVE coverage, when applicable.]
### Base distro updates
#### Removed packages ([COUNT])
- [package]: version [VERSION] removed
#### Downgraded packages ([COUNT])
- [package]: version [OLD\_VERSION] -\> [NEW\_VERSION]
#### Added packages ([COUNT])
- [package]: version [VERSION]
#### Updated packages ([COUNT])
- [package]: version [OLD\_VERSION] -\> [NEW\_VERSION] [(CVE list, when applicable)]
`
```
## Drafting rules[​](#drafting-rules)
* Lead with user impact. Convert engineering notes into what changed for users, administrators, or upgrade safety.
* Keep bullets concise and factual. Do not include internal project names, issue IDs, branch names, commit hashes, or implementation details unless they matter to users.
* Use the prefixes `New:`, `Improvement:`, `Fix:`, and `Security:` consistently in change sections.
* Group related items under the most specific heading. Use `WebGUI / System` for broad UI, settings, system-service, licensing-state, and notification changes.
* Include a `BREAKING CHANGES` section only when users must change behavior or when rollback, compatibility, networking, storage, data, or configuration behavior changes.
* Do not invent CVEs, affected packages, package versions, rollback warnings, known issues, or upgrade recommendations. If the source material is unclear, write `[NEEDS CONFIRMATION: ...]`.
* Preserve public source links when they help users verify details, such as upstream release notes, user reports, or related docs.
* Prefer docs links in this format: `/unraid-os/release-notes/[VERSION]/`.
* Use **bold** for UI labels and ***bold italics*** for navigation paths, such as ***Settings → Disk Settings***.
* Use inline code for package names, commands, config keys, paths, versions, kernel config symbols, and error strings.
* Remove unused optional sections before publishing.
## Release-note checklist[​](#release-note-checklist)
Before publishing, confirm that:
* The heading is `# Version [VERSION] [YYYY-MM-DD]`.
* The summary mentions the most important changes without repeating every section.
* Upgrade, known issue, and rollback notes are accurate for this release.
* Security claims match confirmed advisories or package changelogs.
* Package counts match the package lists.
* Previous-release links point to the correct version.
* Optional sections with placeholders have been removed.
* [Linear agent prompt](#linear-agent-prompt)
* [Drafting rules](#drafting-rules)
* [Release-note checklist](#release-note-checklist)