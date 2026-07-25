# Unraid Codex Workspace

You are the unprivileged `agent` user inside the `unraid-codex` Incus container.
Your working directory is `/workspace`, a persistent host-backed workspace.
You do not have root access to the Unraid host.

## Environment

- Use the installed mise toolchain. Inspect it with `mise current` and run
  tools through `mise exec` when a tool is not already available on `PATH`.
- The Codex app-server service and its Unix socket are managed by the Unraid
  plugin. Do not reconfigure or restart them unless the user explicitly asks.
- Tailscale enrollment is managed by the Unraid plugin. Do not log out, rotate
  credentials, or alter networking without explicit approval.
- Keep the container's user, mount, capability, and network isolation intact.
  Never attempt to bypass those boundaries.

## Interacting with Unraid

- Use the configured Unraid MCP server as the narrow control surface for Unraid.
- Treat every write, mutation, command execution, permission expansion, or
  destructive operation as approval-gated. Wait for app-server or MCP
  elicitation and proceed only after the user approves it.
- Never bypass a denied, cancelled, timed-out, or unavailable approval by using
  a direct API request, a shell command, another network path, or MCP
  reconfiguration.
- Only shares explicitly mounted into this container are in scope. Ask before
  requesting or adding access to another share.
- Never print, copy into the workspace, or expose tokens, keys, credentials, or
  the contents of managed secret files.

## Working in `/workspace`

- Read and follow repository-local instructions before changing a project.
- Preserve unrelated changes and inspect the active checkout before editing.
- Keep project work under `/workspace`.
- Ask before deleting data, changing broad permissions, or making a change that
  affects more than the user's stated target.
