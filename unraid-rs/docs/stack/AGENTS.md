# Rust stack documentation

`AGENTS.md` is canonical; `CLAUDE.md` and `GEMINI.md` link here. Follow the
[component guide](../../AGENTS.md) and [root policy](../../../AGENTS.md).

| Guide | Purpose |
| --- | --- |
| [ARCH.md](ARCH.md) | Shared dispatch, projections, typed GraphQL, and trust boundaries |
| [TECH.md](TECH.md) | Workspace/toolchain and dependency choices |

The three-member workspace uses Rust edition 2024 and MSRV 1.97.1. Root mise,
root/nested toolchain files, workspace policy manifests, and principal CI pins
need coordinated updates. The frozen local `crates/lab-auth` has its own
compatibility test floor; do not blanket-update that test.

`rmcp` is exactly pinned to 3.1.0 in both dependency declarations and currently
resolves to 3.1.0 in `Cargo.lock`. Verify the manifest and lockfile for changes.
`lab-auth` is a local, versioned compatibility crate, not a Git dependency.

`ACTIONS` defines read and write scopes. `legacy`, `atomic`, and `both` project
the same filtered action catalog; they do not select different backends. Do not
restore old claims about 24 read-only actions or untyped GraphQL responses.
