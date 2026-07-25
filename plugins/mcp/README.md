# unraid-mcp — native unRAID plugin

Packages the MCP server as a classic unRAID plugin (`.plg` + Slackware `.txz`)
with a bundled relocatable Python, bearer-token auth, and a webGUI settings
page. Personal-use distribution for now (no Community Apps).

## Layout

- `unraid-mcp.plg` — manifest template. `VERSION/MD5/SHA256_PLACEHOLDER` are
  substituted by `scripts/build-txz.sh`; the final `.plg` + `.txz` get attached
  to the GitHub release.
- `source/` — the txz payload root (extracts onto `/` on Unraid):
  - `usr/local/emhttp/plugins/unraid-mcp/` — webGUI tree: `UnraidMCP.page`
    (thin shell), `include/config.php` (settings endpoint), `scripts/`
    (`rc.unraid-mcp`, `unraid-mcp-env.sh`), `event/` (array up/down hooks),
    `web/` (built Vue bundle — generated, not committed).
  - `usr/local/unraid-mcp/python/` — vendored python-build-standalone CPython
    with unraid-mcp installed (staged at build time, not committed).
- `web/` — Vite + Vue 3 settings app compiled to a light-DOM custom element.
  UI kit (components/ui, styles) is vendored from Unraid's `@unraid/ui` via
  incus-unraid — native webGUI look, all four Unraid themes supported.
- `scripts/build-txz.sh <version> [wheel]` — builds web bundle, vendors
  Python 3.12, installs the wheel, emits `packages/unraid-mcp-<v>-x86_64-1.txz`
  plus the hash-filled `packages/unraid-mcp.plg`.

## Runtime model (RAM rootfs rules)

- Persistent: `/boot/config/plugins/unraid-mcp/` — `.env` (all server config,
  chmod 600 attempted; the FAT32 mount umask is the real gate) and
  `unraid-mcp.cfg` (`SERVICE=enabled|disabled`).
- Ephemeral, re-laid every boot by the `.plg`: `/usr/local/unraid-mcp`,
  `/usr/local/emhttp/plugins/unraid-mcp`, the `/etc/rc.d/rc.unraid-mcp`
  symlink.
- Service starts from `event/disks_mounted` (array up) when
  `SERVICE=enabled`; stops in `event/unmounting_disks`. Logs:
  `/var/log/unraid-mcp/server.log` (5 MB rotation).
- Install auto-generates `UNRAID_MCP_BEARER_TOKEN` and, when the
  `unraid-api` CLI is present, auto-provisions `UNRAID_API_KEY` via
  `unraid-api apikey --create --name unraidmcp -r admin --json` — zero-paste
  setup.

## Settings page

`Settings → Unraid MCP`. Vue custom element (`<unraid-mcp-settings-app>`)
talking to `include/config.php` (webGUI session + `window.csrf_token`).
Secrets are write-only: the endpoint returns `<KEY>_configured` booleans,
never values; saving restarts the service when it's running. Env keys not
managed by the form are preserved on save and listed read-only.

## Build

```bash
./scripts/build-txz.sh 2.5.0            # pulls unraid-mcp==2.5.0 from PyPI
./scripts/build-txz.sh 2.5.0 ../../unraid-py/dist/unraid_mcp-2.5.0-py3-none-any.whl
```

Install on a test box: copy `packages/unraid-mcp.plg` URL (or file) into
Plugins → Install Plugin, with the `.txz` uploaded to the matching GitHub
release (or adjust `txzURL` for a local test).
