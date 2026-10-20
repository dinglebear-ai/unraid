---
title: MCP Registry publication
created: 2026-10-19
updated: 2026-10-20
---

# MCP Registry publication

This repository declares two separate MCP Registry entries:

| Component | Registry name | Distribution |
| --- | --- | --- |
| Python | `ai.dinglebear/unraid-mcp` | PyPI `unraid-mcp` |
| Rust | `ai.dinglebear/unraid` | npm `@dinglebear/unraid` |

The component `server.json` files own these identities. A search of a limited
number of public Registry pages cannot establish that either entry is absent.
Query each exact name and version, and check pagination before drawing that
conclusion. See [issue #447](https://github.com/dinglebear-ai/unraid/issues/447).

## Publication order

Rust Registry publication runs in
[rust-release.yml](../.github/workflows/rust-release.yml) after its npm job
succeeds. Skipped or failed npm publication prevents automatic Registry
publication. The existing `NPM_TRUSTED_PUBLISHING_ENABLED` repository variable
and npm trusted-publisher configuration still control automatic npm publication.
An uploaded GitHub release does not prove that its npm package exists.

Python publication and explicit manual reconciliation use
[mcp-registry.yml](../.github/workflows/mcp-registry.yml). The shared publisher
validates the referenced package before publishing an entry.

## Recover a missing entry

1. Check the component release's package-publication job and exact package version.
2. If the package is missing, correct its publication prerequisites before retrying.
3. For Rust, run the existing release workflow with the intended tag, source ref,
   and `publish_npm` enabled. A successful npm job then invokes Registry publication.
4. If the package already exists, use the Registry workflow's manual reconciliation
   with the component, source ref, and exact expected version.
5. Verify the publisher's public Registry check and read back the exact entry.

Use a source ref whose manifest matches the intended release version. Do not
publish a newer manifest under an older release tag or infer success from the
overall workflow when the package job was skipped.

As checked on October 19, 2026, Python's
[2.10.2 publication](https://github.com/dinglebear-ai/unraid/actions/runs/36500266537)
passed public Registry verification. Rust's
[0.6.1 Registry attempt](https://github.com/dinglebear-ai/unraid/actions/runs/36501514131)
failed its package-visibility check, and its npm publication job had been skipped.
These are historical results, not confirmation of current Registry availability.
