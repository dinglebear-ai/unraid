# unraid-mcp — native Unraid plugin

Packages the Rust `runraid` MCP server as a classic Unraid plugin (`.plg` plus
Slackware `.txz`) with bearer/OAuth authentication, a webGUI settings page,
automatic credential bootstrap, service controls, and log rotation.

## Package layout

- `unraid-mcp.plg` is the manifest template. The package build substitutes the
  version and checksums. The plugin version is a fixed-width epoch-3 string
  derived from the runraid semver by `scripts/plugin-version.sh`
  (`0.3.1` → `3.000.003.001`) so it sorts after every legacy Python-lane
  `2.x` release under Unraid's raw-string version comparison.
- `source/usr/local/emhttp/plugins/unraid-mcp/` contains the webGUI, service
  scripts, updater, and array lifecycle hooks.
- `usr/local/unraid-mcp/bin/runraid` is staged at build time from the matching
  `unraid-rs-vX.Y.Z` release binary. No Python interpreter is bundled.
- `web/` is the Vite/Vue settings application.

## Runtime model

Persistent state lives under `/boot/config/plugins/unraid-mcp/` for the `.env`
and service-enable flag. OAuth state and self-updated binaries live directly under
`/mnt/user/appdata/unraid-mcp/` through the `UNRAID_HOME` override. The service
refuses to create or modify that tree unless `/mnt/user` is actually mounted,
and ignores overlay binaries that are symlinks or are not root-owned regular
executables. The RAM-rootfs runtime is restored by Unraid on every boot.

`rc.unraid-mcp` starts `runraid serve`, preferring a safe persistent overlay
binary when one has been installed through the settings page. Startup is not
reported successful until the public `/health` endpoint responds. Tailscale
Serve state remembers the published port so stop/restart also cleans stale
routes after a port change or an unexpected server exit.

The updater downloads the `runraid-linux-x86_64` asset and its SHA-256 file from
a Rust component release, verifies both the digest and reported version, then
atomically replaces the overlay. Public CLI `update` and `reset` commands commit
their change immediately. The settings controller uses internal staged commands
to snapshot the prior overlay; if the new runtime fails its health-checked
startup, it rolls back the binary and restores the previous service. Reset
returns to the plugin-bundled binary. Update checks occur only after an explicit
click.

Existing Python-era `UNRAID_MCP_*` settings are translated at launch and surfaced
through the new Rust settings UI. Saving a migrated field removes its old key.
Live settings changes are transactional: if runraid rejects the health-checked
restart, the previous env and service are restored automatically.
The settings page also exposes `UNRAID_RMCP_ENABLED_TOOLS` and
`UNRAID_RMCP_DISABLED_TOOLS` for granular action allow/deny policies; deny
selectors win.

## Upgrading from the Python plugin

- **Port**: upgraded boxes keep their existing port (the Python default was
  6970); only fresh installs get the Rust default 40010. Check firewall rules
  and MCP client URLs against whichever port your `.env` actually carries.
- **OAuth**: the Python server auto-enabled Google OAuth when client
  credentials were present. runraid does not — after upgrading, set
  `UNRAID_RMCP_AUTH_MODE=oauth` **and** `UNRAID_RMCP_AUTH_ADMIN_EMAIL` in
  Settings, or the server stays on bearer auth (a warning is logged).
- **Rollback**: the old Python server does not understand the `UNRAID_RMCP_*`
  keys this plugin writes. To roll back to the old Python `.plg`, delete
  `/boot/config/plugins/unraid-mcp/.env` first and let the Python plugin
  re-bootstrap its config.

## Build

```bash
cd unraid-rs
cargo build --release --locked --target x86_64-unknown-linux-gnu --bin runraid
cd ../plugins/mcp
./scripts/build-txz.sh 0.4.1 ../../unraid-rs/target/x86_64-unknown-linux-gnu/release/runraid
```

The builder verifies `runraid --version`, builds the web bundle, creates a
deterministic root-owned archive, checks the generated manifest, confirms the
embedded x86-64 ELF binary, rejects any retired Python runtime tree, and rejects
binaries requiring newer than glibc 2.40 (the library shipped by the minimum
supported Unraid 7.0.0).

## Release and Community Applications

The `rust-release` workflow builds the binary and plugin from the same
`unraid-rs-vX.Y.Z` source using the repository-pinned Rust 1.97.1 toolchain. It attaches the versioned `.txz` and `.plg` to that
release and refreshes the rolling `unraid-plugin-latest` release asset consumed
by Community Applications. The package manifest itself points back to the
versioned Rust release, so installs remain immutable and checksum-pinned.
