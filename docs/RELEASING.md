---
title: Release and packaging guide
created: 2026-09-27
updated: 2026-09-27
---

# Release and packaging guide

Release policy is shared across the monorepo; build contexts and artifacts are
component-specific. The executable contracts are
[release-please-config.json](../release-please-config.json),
[release_contract.py](../.github/scripts/release_contract.py),
[plugin_calver.py](../.github/scripts/plugin_calver.py), and the
[workflow directory](../.github/workflows/). Consult them before changing a
version, tag, installer URL, or publication target.

## Ownership and naming

| Release unit | Version owner | Tag/artifact identity |
| --- | --- | --- |
| Python server | release-please package `unraid-py` | `vX.Y.Z`; PyPI `unraid-mcp`; Python container `unraid-mcp` |
| Rust server | release-please package `unraid-rs` | `unraid-rs-vX.Y.Z`; crate `unraid-rmcp`; binary `runraid`; container `unraid-rmcp`; compatibility npm launcher `@dinglebear/unraid` |
| Native MCP OS plugin | Matching Rust release | Rust-tag build; rolling `unraid-plugin-latest` manifest for Community Applications |
| Incus OS plugin | `plugin_calver.py` | Fixed-width `YYYYMMDD.NNN`, tag `incus-v*` |
| Codex OS plugin | `plugin_calver.py` | Fixed-width `YYYYMMDD.NNN`, tag `codex-v*` |

Agent plugin versions follow their corresponding server. They are not an
independent release lane. Both marketplace catalogs must expose the same
plugin set. Do not rename package identities to match the repository name.

## Python and Rust release-please lane

Use Conventional Commits and allow the configured release manager to compute
versions. Do not hand-edit manifest versions, lockfile package versions, or
changelogs during a feature/documentation change. Review the release PR's
actual diff and gates before an authorized merge; not every commit type
automatically warrants a release.

`release-please-config.json` explicitly owns each extra version field,
including client manifests and `server.json` metadata. Do not describe these
files as permanently unversioned placeholders. For Rust, npm `version` and
`binaryVersion` must remain synchronized with the crate and agent manifests.
Python lock metadata must match the release bump so locked CI installation
continues to work.

Publishing is not guaranteed merely because a tag exists. Inspect the matching
workflow run, repository-variable gates, credentials, and uploaded artifacts.
`crates-publish.yml` gates automated crates.io publication on
`CRATES_IO_PUBLISHING_ENABLED`; it publishes the compatibility `lab-auth` crate
before `unraid-rmcp` and performs installation/discovery checks. The Rust npm
publication path is separately gated. A documentation audit must not toggle
these gates or publish packages.

## Classic OS plugin lane

Incus and Codex do not use release-please. Their numeric date/build versions
are fixed-width because Unraid compares plugin versions lexically. Use the
existing CalVer helper and release workflows instead of ad hoc string bumps.
Check both the `.plg` manifest and release metadata.

Plugin `.txz` archives belong in GitHub release assets, never in Git history.
The native MCP archive must use a Rust binary whose reported version exactly
matches the package version.

Incus packaging is an overlay onto a complete, verified previous runtime
archive, not an archive of tracked `source/` alone. Build the backend and both
frontend bundles first; ship all settings chunks, the dashboard bundle,
backend metadata/dependencies, and matching release manifest. Verify checksums
and required archive contents. See [Incus AGENTS](../plugins/incus/AGENTS.md).

Installer/updater URLs are runtime contracts. Some deployed payloads still
reference the old `unraid-mcp` repository name. A migration needs an intentional
release and an install/update test; do not silently rewrite them while cleaning
up prose or rely indefinitely on redirects.

## Preflight and evidence

From the repository root, run shared release checks before changing metadata:

```bash
python3 .github/scripts/release_contract.py
python3 -m unittest discover -s .github/scripts/tests -p 'test_*.py'
bash .github/scripts/check-plg-version-ordering.sh
```

Version-ordering checks require relevant tag history. Also run the component
gates in [DEVELOPMENT.md](DEVELOPMENT.md), both marketplace/version-sync checks
where affected, and the package's real build/install gates.

For a release, record the source commit, tag/version, artifact filenames and
checksums, workflow results, and the exact disposable Unraid target used for
install/update/restart verification. Offline source contracts do not establish
live installability, network isolation, or array lifecycle behavior.

Keep a known-good version and configuration backup before a deployment.
Exercise the component's existing rollback/reinstall path on the disposable
target; do not infer that every plugin has the same rollback behavior. Never
reset production state to complete a release checklist.

## CI policy failures

Every external Action must be SHA-pinned with a consistent version comment.
The repository's checked-in action allowlist and its live setting must agree.
A disallowed action may produce a workflow startup failure with no normal
check-run; missing checks are not green checks.

Run `check-action-pin-comments.py`, `check-actions-allowlist.py`, and actionlint
when editing workflows. Keep shared-file path filters comprehensive, and keep
`.github/workflows/**` in Python CI's trigger set so its policy tests execute.
