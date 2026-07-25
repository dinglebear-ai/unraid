# `hooks/`

This directory holds the plugin's hook configuration. `hooks.json` is the
**single source of truth**. Claude Code loads the standard `hooks/hooks.json`
path **automatically**, so the Claude plugin manifest
(`../.claude-plugin/plugin.json`) must **not** declare a `"hooks"` entry for it.
Adding `"hooks": "./hooks/hooks.json"` makes Claude Code load the same file
twice and fails hook loading with a "Duplicate hooks file detected" error
(the plugin's hooks then never run). `manifest.hooks` should only ever list
*additional* hook files that live outside the standard path.

Current wiring (both run the same idempotent credential-setup script):

- **SessionStart** → `${CLAUDE_PLUGIN_ROOT}/scripts/plugin-setup.sh`
- **ConfigChange** (`user_settings`) → `${CLAUDE_PLUGIN_ROOT}/scripts/plugin-setup.sh`

`plugin-setup.sh` lives in `../scripts/` and runs `uvx unraid-mcp setup
plugin-hook` to persist the plugin's userConfig credentials to
`~/.unraid-mcp/.env`. Because the server is launched with `uvx unraid-mcp`
(published PyPI package), there is no bundled uv project to sync — the old
`sync-uv.sh` hook was removed.

**Advisory contract — these hooks must never block the session.** Credential
persistence is a convenience; the server also receives credentials directly via the
plugin's `.mcp.json` env. So `plugin-setup.sh` is idempotent (rewriting identical
creds is a no-op) and **always exits 0** — a missing `uvx`, no network, or a setup
error warns to stderr (greppable `plugin-setup.sh:` prefix) and continues.

`ConfigChange` uses a `user_settings` matcher so it re-runs only when plugin settings
change, propagating updated credentials without a restart.

When changing hook wiring, edit `hooks.json` only; Claude Code auto-loads it.
Do not re-add a `"hooks"` reference to the manifest for this file.
