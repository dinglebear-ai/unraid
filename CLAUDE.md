# CLAUDE.md

Guidance for Claude Code (claude.ai/code) working in this repository.

## What this is

A monorepo of Unraid tooling. It keeps the `dinglebear-ai/unraid-mcp` GitHub
identity and the `unraid-mcp` PyPI name, but internally hosts four release units
plus two agent-plugin integrations.

## Repository layout

| Path | Component | Toolchain | Build / test from repo root |
|------|-----------|-----------|------------------------------|
| `unraid-py/` | Python MCP server (**unraid-mcp** on PyPI, import `unraid_mcp`). Self-contained: its own `pyproject.toml`, `uv.lock`, `Dockerfile`, `docs/`, `openwiki/`, `scripts/`, and tests. | Python / uv / hatchling | `cd unraid-py && uv sync && uv run pytest && uv build --wheel` (run `npm --prefix tests/mock install` once to un-skip the 9 mock-server tests) |
| `unraid-rs/` | Rust MCP server + CLI (crate `unraid-rmcp`, binary `runraid`) and the `unraid-rmcp` npx wrapper. Toolchain pinned to the MSRV by `rust-toolchain.toml`. | Rust / cargo | `cd unraid-rs && cargo fmt --check && cargo clippy --all-targets --features test-support -- -D warnings && cargo test` (CI additionally runs `cargo nextest run --profile ci`, `taplo check`, and the npm launcher tests) |
| `plugins/mcp/` | Unraid OS `.plg` shipping the Python server (was `unraid/`). | shell + Python + Node (vite settings bundle) | `bash plugins/mcp/scripts/build-txz.sh <ver> <wheel>` — build `<wheel>` first with `cd unraid-py && uv build --wheel`, otherwise the script silently pulls that version from PyPI instead of your local tree |
| `plugins/incus/` | Unraid OS `.plg` for Incus dev-containers + nested `unraid-api-plugin-incus/` (NestJS/Vue). Build gotchas: see `plugins/incus/CLAUDE.md`. | shell + NestJS/Vue | `cd plugins/incus && ./scripts/verify-classic-package.sh && ./tests/classic-contract.sh` |
| `plugins/codex/` | Unraid OS `.plg` for the Codex chathead (was `unraid-codex/`). | shell + React | `cd plugins/codex && ./tests/contract.sh` |
| `agents/unraid-py/` | Claude/Codex plugin, `name: unraid-mcp`. | — | listed in **both** `.claude-plugin/marketplace.json` and `.agents/plugins/marketplace.json` |
| `agents/unraid-rs/` | Claude/Codex plugin, `name: runraid`. Version is release-please-managed under the `unraid-rs` package. | — | listed in **both** `.claude-plugin/marketplace.json` and `.agents/plugins/marketplace.json` |
| Root | Orchestration only: **two** marketplace manifests (`.claude-plugin/marketplace.json` for Claude, `.agents/plugins/marketplace.json` for Codex — `meta-ci.yml` asserts they list the same plugins), merged path-scoped `.github/workflows/`, unified `release-please-config.json` + `.release-please-manifest.json`, root `lefthook.yml`, umbrella README/CHANGELOG. | — | — |

Per-component guidance lives in each component's own `CLAUDE.md` / `README.md`.
The Python server's detailed dev guide is `unraid-py/CLAUDE.md`.

## Conventions that span the monorepo

- **`.txz` plugin payloads are GitHub release assets, never tracked in git.** A
  `no-large-blobs.yml` CI guard blocks re-committing them; the incus history was
  scrubbed of ~746 MB of committed `.txz`.
- **Every CI action must be SHA-pinned** (`test_every_external_action_is_immutable`
  in `unraid-py/tests/` globs *all* root workflows). Copy an existing pinned SHA
  from another workflow rather than using a floating `@vN` tag, and keep the
  trailing `# vX.Y.Z` comment accurate — `meta-ci.yml` fails if the same SHA is
  annotated with two different versions, or if a pin has no comment at all.
  **`ci.yml` must keep `.github/workflows/**` in its `paths:` filter**, because
  that test only runs when `ci.yml` runs; narrowing the filter silently disables
  SHA-pin enforcement for every other component's workflow.
- **release-please drives versioning** for all four units. `unraid-py` is the
  primary package with an empty component (unprefixed `vX.Y.Z` tags); the others
  use `unraid-rs-v*`, `incus-v*`, `codex-v*`. The incus/codex `.plg` version
  entities are annotated `x-release-please-version` so the plugin string version
  stays in sync. **Unraid compares plugin versions as STRINGS**, which disagrees
  with release-please's semver bumps on a date-shaped version: `2026.10.0` sorts
  *before* `2026.9.0`, and every installed plugin would silently stop updating.
  `.github/scripts/check-plg-version-ordering.sh` (run by `meta-ci.yml` and the
  pre-commit hook) fails the build on such a regression.
- **This repo restricts which Actions may run** (`allowed_actions: selected`).
  A non-allowlisted action is rejected by GitHub at *compile* time: the run ends
  as `startup_failure` with no jobs, no logs and **no check-run**, so it appears
  as a *missing* check that branch protection cannot see — not a red one. Adding a
  new third-party action therefore takes **two** steps: list it in
  `.github/allowed-actions.txt` *and* apply the same change to the repo setting
  (`gh api -X PUT repos/<owner>/<repo>/actions/permissions/selected-actions`).
  `meta-ci.yml` fails the PR if a workflow uses something the mirror doesn't list.
  `actions/*` and `github/*` are always permitted and need no entry.
  This is not hypothetical: `rust-ci` was silently dead from 2026-07-24 to
  2026-07-25 because the consolidation imported Rust CI from a repo with
  `allowed_actions: all` and never allowlisted `dtolnay/rust-toolchain`,
  `Swatinem/rust-cache` or `taiki-e/install-action`.

- **`secret-scan.yml` is genuinely unfiltered** (no `paths:` at all) so a
  path-scoped workflow can never gate it off. **`meta-ci.yml` is broadly scoped**
  to the shared root files — its filter must stay exhaustive, since a root file
  listed in no filter has no gate whatsoever.
- **CI workflows are path-scoped per component**; a change under one component's
  subtree only runs that component's jobs.

## Toolchain

The root `.mise.toml` is polyglot (python + rust + node) so every component's
toolchain is available from a single `mise install`. Rust is pinned to
`unraid-rs`'s MSRV (1.90) so local `clippy` reproduces CI; `unraid-rs/rust-toolchain.toml`
carries the same pin for contributors who use rustup instead of mise. Keep
`.mise.toml`, `rust-toolchain.toml`, `unraid-rs/Cargo.toml` (`rust-version`), and
`rust-ci.yml` in sync.

Git hooks come from the **root** `lefthook.yml` (`lefthook install`). Hooks are
per-repository, not per-directory — component-level lefthook configs do not run.
