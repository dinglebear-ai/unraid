# unraid-mcp — native unRAID plugin

Packages the MCP server as a classic unRAID plugin (`.plg` + Slackware `.txz`)
with a bundled relocatable Python, bearer-token auth, and a webGUI settings
page. Community Applications metadata, release assets, source, documentation,
and support are maintained in the public `dinglebear-ai/unraid` monorepo.

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
- `runtime-requirements.in` and `runtime-requirements.txt` — version input and
  hash-locked binary dependency closure for the bundled Python runtime.
- `scripts/update-runtime-lock.sh` — regenerates that lock for Python 3.12 on
  x86-64 Linux.
- `scripts/build-txz.sh <version> <wheel>` — builds the web bundle, vendors
  Python 3.12, installs hash-locked dependencies plus the explicit wheel, and
  emits `packages/unraid-mcp-<v>-x86_64-2.txz` with its filled manifest.

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
./scripts/update-runtime-lock.sh
./scripts/build-txz.sh 2.9.0 ../../unraid-py/dist/unraid_mcp-2.9.0-py3-none-any.whl
```

The build fails closed when the input version and lock disagree, when a locked
dependency hash does not match, or when the generated archive fails its package
verifier. Release builds use the exact wheel attached to the matching `v*`
release; the builder never resolves `unraid-mcp` itself from an unpinned index.

Install on a test box: copy `packages/unraid-mcp.plg` URL (or file) into
Plugins → Install Plugin, with the `.txz` uploaded to the matching GitHub
release (or adjust `txzURL` for a local test).

## Community Applications publication

The repository profile is `/ca_profile.xml` and the Unraid MCP wrapper is
`plugins/mcp/ca/unraid-mcp.xml`. The wrapper uses the stable repository-level
latest-release URL for `unraid-mcp.plg`; component release workflows must not
claim the repository-wide **Latest** designation, while each primary `v*` MCP
release claims it only after the verified `.plg` and `.txz` assets are attached.
Run Validate and Scan for `https://github.com/dinglebear-ai/unraid` before
requesting manual plugin review.
