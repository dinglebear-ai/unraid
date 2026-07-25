Version 6.12.2 2023-06-29 | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
Changes vs. [6.12.1](/unraid-os/release-notes/6.12.1/)
## Upgrade notes[​](#upgrade-notes)
### Known issues[​](#known-issues)
Please see the [6.12.0 release notes](/unraid-os/release-notes/6.12.0/#known-issues) for general known issues.
### Rolling back[​](#rolling-back)
If rolling back earlier than 6.12.0, also see the [6.12.0 release notes](/unraid-os/release-notes/6.12.0/#rolling-back).
## Highlights[​](#highlights)
This is mainly a bug fix release, including also a minor security update. Other highlights:
* We reverted **docker** from v23.0.6, introduced during Unraid OS 6.12 development, to v20.10.24, which is the latest patch
release of **docker** used in Unraid OS 6.11. This to address increased memory usage and other issues
discovered with **docker**.
* A small necessary change to invoke our 'update\_services' script whenever a WireGuard tunnel starts or stops
is automatically applied to all 'config/wireguard/\*.conf' files when you update via Update OS page. For
manual update or if you downgrade, it is necessary to make a "dummy change" in a setting on the Settings/VPN Manager page and
then click Apply.
## Bug fixes and improvements[​](#bug-fixes-and-improvements)
* email notifications: add line in /etc/php.ini: 'mail.mixed\_lf\_and\_crlf=On' to workaround change in PHP8 CRLF handling
* emhttpd: Fix regression: emulated ZFS volumes not recognized
* emhttpd: Fix regression: format fails if diskFsType==auto and defaultFsType specifies encryption
* emhtptd: Fix regression: mount fails if diskFsType==auto
* htop: remove predefined /root/.config/htop/htoprc file
* network: RC services update:
* NFS - fix service reload
* RPC - fix service reload
* NGINX - remove HTTPS port in FQDN redirect when default 443
* All services - register IPv4 Link local assignment (169.254.xxx.xxx)
* All services - make lock file programmable
* WireGuard: delayed service update to avoid race condition
* rc.library: do not allow duplicates in bind list
* WebGUI: Dashboard updates:
* Re-introduce show/hide tile content
* Add new icon function to show/hide all content at once
* Reduce gap between columns
* description -\> model
* ZFS: fix percentage value to max 100%
* Use prototype function: This makes it easier for 3rd party developers to automatically hide dynamic content
* Handle duplicate IP assignments and give warning
* change header MEMORY to SYSTEM
* WebGUI: OS Update: add checkbox to confirm reading release notes before upgrading
* WebGUI: diagnostics: include list of duplicate assignments
* WebGUI: NFS: for Security/Private increase Rule field from 256 to 512 characters.
## Linux kernel[​](#linux-kernel)
* version 6.1.36
## Base Distro[​](#base-distro)
* bind: version -9.16.42 (CVE-2023-2911)
* docker: 20.10.24 (revert from v23.0.6)
## Patches[​](#patches)
With the [Unraid Patch plugin](https://forums.unraid.net/topic/185560-unraid-patch-plugin/) installed, visit ***Tools → Unraid Patch*** to get the following patches / hot fixes:
* A subset of security updates, see [this blog post](https://unraid.net/blog/cvd) for details. We recommend upgrading to the latest stable release for additional security updates.
* [Upgrade notes](#upgrade-notes)
* [Known issues](#known-issues)
* [Rolling back](#rolling-back)
* [Highlights](#highlights)
* [Bug fixes and improvements](#bug-fixes-and-improvements)
* [Linux kernel](#linux-kernel)
* [Base Distro](#base-distro)
* [Patches](#patches)