# incus-unraid package and provenance manifest

Release metadata is machine-readable in `release-manifest.json`. The currently
tracked classic artifact is:

- File: `packages/incus-unraid-7.0.0-55-x86_64-1.txz`
- Size: 36,081,952 bytes
- Entries: 313
- MD5 (legacy Unraid downloader field only): `fe0ac455ac84bc928f9bdadf57c518b7`
- SHA-256: `ae3615b26aa980f2331812fa7f8e881d16ed70f03bb0370a21ccb4de6307f157`
- Target: x86_64, glibc 2.38 or newer

The Incus 7.0 runtime was repackaged from Debian trixie packages and has been
carried forward by overlaying tracked plugin source onto the previous complete
archive. The repository does not yet contain the original Debian `.deb` files,
their source-package checksums, or a from-source binary build recipe. Therefore
this artifact is verifiable against the repository hash and inventory but is
not reproducible from upstream sources. Do not describe it as reproducible or
independently attestable until those inputs are checked in or fetched from an
immutable, checksummed lock manifest.

## Payload boundaries

- `/usr/local/incus/`: private Incus/lxcfs/distrobuilder runtime, helpers,
  bundled libraries, debootstrap scripts, and this manifest.
- `/usr/local/emhttp/plugins/incus/`: classic pages, lifecycle/init scripts,
  default configuration, templates, events, frontend bundles, and optionally
  the matching API-plugin release payload.
- `/usr/lib/x86_64-linux-gnu/lxcfs/liblxcfs.so`: lxcfs module required at the
  host loader path.
- `/etc/rc.d/rc.incus`: created as a symlink by `incus.plg`, not shipped as an
  independent mutable implementation.

Required executable inventory includes `incus`, `incusd`, `lxcfs`, `nft`,
`distrobuilder`, `debootstrap`, `ar`, `mksquashfs`, `unsquashfs`, and `zstd`.
The authoritative full inventory is the archive itself:

```bash
tar -tvJf packages/incus-unraid-7.0.0-55-x86_64-1.txz
./scripts/verify-classic-package.sh
```

## Build and release procedure

1. Build and test the API and both frontend bundles.
2. Run `scripts/build-classic-package.sh NEW_BUILD PREVIOUS_TXZ`. It extracts
   the previous complete binary payload, overlays tracked `source/`, embeds
   this manifest, and includes the built API payload when `dist/` is present.
3. Update `incus.plg` and `release-manifest.json` with the new filename, MD5,
   SHA-256, version, and compatibility values.
4. Run `scripts/verify-classic-package.sh`. It checks XML, shell syntax/static
   analysis, both checksums, required files, source/archive drift, build
   metadata, normalized directory modes, absence of an archive root entry,
   and the minimum entry-count shrinkage guard.
5. Deploy all layers together, confirm `/var/log/graphql-api.log`, run
   `/etc/rc.d/rc.incus status`, then run the opt-in live containment suite on a
   disposable host: `INCUS_LIVE_TEST=1 tests/classic-contract.sh`.
6. Retain the previous archive and API directory as rollback candidates until
   the release passes live verification.

## Runtime safety and operations

- `LD_LIBRARY_PATH` is scoped by `incus-env.sh`; bundled libraries are not
  installed into the global loader configuration.
- The default ACL blocks RFC1918, link-local, Tailscale CGNAT, and the Incus
  bridge subnet itself (with narrow TCP/UDP DNS exceptions to its gateway).
  IPv6 is rejected until an equivalent IPv6 containment policy exists.
- Optional profile bind mounts default read-only and are confined to `/srv`,
  `/mnt`, or the plugin's dedicated curated-config directory.
- `rc.incus` rolls back partial startup, rotates `/var/log/incusd.log`, records
  health in `$INCUS_DIR/plugin-health`, validates PIDs, and starts a bounded
  watchdog. Array shutdown aggregates instance and daemon stop failures.
- Config Apply uses `/boot/config/plugins/incus/incus.cfg.known-good` and
  restores it if reconciliation fails.
- The installer verifies SHA-256 before `upgradepkg`, retains one previous
  `.txz`, and restores the prior classic payload if coordinated API activation
  fails; MD5 is not treated as a security boundary.

## Remaining provenance limitation

Publication is public. Anonymous Community Apps/direct-URL installation can
fetch both `incus.plg` and its manifest-derived package URL; release validation
must still verify the downloaded package against the SHA-256 recorded above.
