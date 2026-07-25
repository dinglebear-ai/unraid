---
title: "Rust Build Setup"
doc_type: "guide"
status: "active"
owner: "unrust"
audience:
  - "contributors"
  - "agents"
scope: "service"
source_of_truth: false
upstream_refs:
  - "https://github.com/jmagar/soma/blob/main/docs/RUST.md"
last_reviewed: "2026-07-13"
---

# Rust Build Setup

This repo follows the build conventions of the rmcp server family.
The canonical reference is [soma/docs/RUST.md](https://github.com/jmagar/soma/blob/main/docs/RUST.md).

## System prerequisites

- Rust stable ≥ 1.90 (`rustup update stable`)
- `clang` and `mold` for fast Linux builds: `apt install clang mold`
- `just` command runner (optional): `cargo install just`

## Global Cargo config

Build performance depends on `~/.cargo/config.toml` on the developer's machine.
See [soma/docs/RUST.md](https://github.com/jmagar/soma/blob/main/docs/RUST.md)
for the expected config (global sccache wrapper, mold linker, profile settings,
and dynamic Cargo job allocation).

## Local `.cargo/config.toml`

This repo's `.cargo/config.toml` contains only the xtask alias:

```toml
[alias]
xtask = "run --package xtask --"
```

No other per-repo overrides are needed. Profile settings, sccache, dynamic jobs,
and the mold linker are inherited from the global config. Refresh repo/plugin
binaries explicitly with `just sync-bin`.
