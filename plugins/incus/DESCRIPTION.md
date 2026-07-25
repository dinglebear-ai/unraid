# Incus Dev Containers — Community Applications copy

## One-liner

Run coding agents and stdio MCP workspaces in Incus system containers with Internet access and default LAN blocking.

## Plugin overview

Install and manage Incus system containers for coding agents and stdio MCP workspaces on Unraid. Containers use a dedicated IPv4 NAT bridge that blocks common LAN, link-local, and Tailscale ranges while preserving public Internet access. This is deny-list containment, not a complete security boundary: review allow-holes and bind mounts, test your actual networks, and add stronger controls before running hostile workloads.

> **Security:** The plugin installs and controls a host-level Incus daemon, creates network and firewall policy, and can bind-mount persistent host paths into containers. Explicit allow-holes and writable bind mounts reduce isolation. The default IPv4 deny-list cannot prove that every private service is unreachable, and IPv6 is disabled until equivalent policy exists.

## Draft forum support-thread post

```bbcode
[b]Incus Dev Containers[/b] runs coding agents and stdio MCP workspaces in Incus system containers on Unraid.

[b]What you get[/b]
[list]
[*]A private-prefixed Incus runtime with lifecycle integration for Unraid
[*]A settings UI for building images, launching containers, managing resources, and opening terminal sessions
[*]A dedicated IPv4 NAT bridge whose default ACL blocks common LAN, link-local, and Tailscale ranges while retaining public Internet access
[/list]

[b]Requirements[/b]
[list]
[*]An x86_64 Unraid host with glibc 2.38 or newer and user namespaces
[*]Persistent storage for the Incus data directory and container workspaces
[*]A Node.js 22-compatible unraid-api runtime for the full settings, builder, terminal, and dashboard integration
[/list]

[b]Security — read before use[/b]
This plugin controls a host-level Incus daemon, firewall policy, and optional host bind mounts. Its default IPv4 policy is deny-list containment, not a complete security boundary. Review every allow-hole and bind mount, test access to your actual NAS, router, tailnet, and internal services, and add stronger controls before running hostile workloads. IPv6 is disabled until equivalent isolation policy exists.

[b]Source &amp; issues:[/b] https://github.com/dinglebear-ai/unraid-mcp
```

## Categories

`Tools:System`

## Support and listing screenshots

- Support: https://github.com/dinglebear-ai/unraid-mcp/issues
- No listing screenshots are included in this draft. Capture sanitized settings, builder, and container-management views before portal submission.

## Preparation status

Prepared against plugin release `2026.07.23` and classic package build `53`.

- Local XML and artifact-only CA preflight: passed on 2026-07-23.
- Classic package verification and contract tests: passed on 2026-07-23.
- Existing public URLs: anonymously reachable; the plugin wrapper URL exactly matches the fetched manifest's `pluginURL`.
- New icon URL: expected to become reachable after this draft is merged to `main`.
- Dedicated Unraid forum support thread: not created; the draft uses the public GitHub Issues page.
- Clean-system install, configuration, update, and removal: still required on a disposable supported Unraid host, with the exact Unraid version recorded.
- Portal Validate, Scan, and listing preview: still required after the final XML and icon are public.
- Community Applications submission: intentionally not performed.
