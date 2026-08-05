# CLAUDE.md

Guidance for Claude Code (claude.ai/code) working in this repository.

## What this is

A monorepo of Unraid tooling — four release units plus two agent-plugin
integrations. The canonical remote is **`git@github.com:dinglebear-ai/unraid.git`**.

### Identity and history (read before touching any URL)

Consolidated on **2026-07-27**. Two formerly standalone repos — `runraid` and
`incus-unraid` — were merged in and then **deleted upstream**. This repo is now the
only home for that code; do not go looking for those repos, and do not "restore" a
reference to them.

On the same date both the local directory and the GitHub repo were renamed
`unraid-mcp` → **`unraid`**. GitHub's transfer redirect still resolves the old name
(verified, including `raw.githubusercontent.com/...` paths), so **already-deployed
`.plg` install/update URLs keep working**.

Docs, manifests, `server.json`, `Cargo.toml`, the npm launcher and the curl-able
install scripts were repointed to `dinglebear-ai/unraid`. **Four files were
deliberately left on the old URL** — the three `plugins/*/*.plg` and
`plugins/mcp/source/.../unraid-mcp-update.sh`. Installed plugins poll their own
`pluginURL` and resolve `txzURL`/`REPO` at runtime, so editing those ships a
behavioural change to live Unraid boxes; that needs a deliberate release and a test
install, not a drive-by rename. They work today via the redirect and break the day
anyone creates a new `dinglebear-ai/unraid-mcp` — load-bearing on a redirect, and
tracked follow-up work.

New in-repo references must use `dinglebear-ai/unraid`.

### "unraid-mcp" means five different things

Most `unraid-mcp` strings in this tree are **correct** and must not be swept into a
rename. Only *GitHub repo URLs* are stale.

| Occurrence | Still correct? |
|---|---|
| PyPI distribution `unraid-mcp` (import `unraid_mcp`) | ✅ unchanged |
| Claude/Codex plugin `name: unraid-mcp` (`agents/unraid-py`) | ✅ unchanged |
| Unraid OS plugin dir `plugins/mcp/source/.../unraid-mcp/` and `unraid-mcp.plg` | ✅ unchanged |
| Container image `ghcr.io/dinglebear-ai/unraid-mcp` | ✅ unchanged |
| GitHub URL `github.com/dinglebear-ai/unraid-mcp` | ⚠️ stale — redirect only |

The Rust side has its own naming split: crates.io package **`unraid-rmcp`**, binary
**`runraid`**, plugin name **`runraid`**. Service port is **40010**.

## Agent plugins ship no Claude Code hooks

`agents/unraid-py/` and `agents/unraid-rs/` previously registered `SessionStart` +
`ConfigChange` hooks (`hooks/hooks.json`) that ran `scripts/plugin-setup.sh` to
persist plugin `userConfig` credentials. **Those hooks were removed on 2026-07-27.**

- Neither `.claude-plugin/plugin.json` nor `.codex-plugin/plugin.json` may declare a
  `"hooks"` key, and no `hooks/` directory may exist. Both invariants are asserted by
  `unraid-rs/tests/setup_contract.rs` and `unraid-rs/scripts/validate-plugin-layout.sh`.
- `scripts/plugin-setup.sh` is **kept** in both plugins as the manual entry point.
- **Both plugins now carry the config in `.mcp.json`.** `agents/unraid-rs` maps 10
  `userConfig` keys (`${user_config.unraid_api_url}` → `UNRAID_API_URL`, plus the
  key, TLS skip, bearer token and four OAuth vars); `agents/unraid-py` maps
  `UNRAID_API_URL` / `UNRAID_API_KEY`. No hook and no manual step are needed for
  credentials.
- **`${user_config.*}` is the correct form in `.mcp.json` — `${CLAUDE_PLUGIN_OPTION_*}`
  is not.** The latter is what Claude Code exports to plugin *subprocesses* (hook
  scripts); it is not substituted inside `.mcp.json`. `unraid-py` used that form from
  v1.5.0 (2026-06-19) on the strength of claude-code #51573, but **that issue was
  closed 2026-04-22, two months earlier** — so the workaround targeted an
  already-fixed bug and silently broke config instead. Corrected 2026-07-28.
- **Still unwired on `unraid-py`:** `unraid_verify_ssl` → `UNRAID_VERIFY_SSL` and
  `unraid_allow_insecure_tls` → `UNRAID_ALLOW_INSECURE_TLS` reach the server through
  no path. Wire them **as a pair** — `settings.py` does a module-level `sys.exit(1)`
  when `UNRAID_VERIFY_SSL=false` without `UNRAID_ALLOW_INSECURE_TLS=true`, so wiring
  only the first lets a user hard-kill the server from the settings UI.
- `scripts/plugin-setup.sh` and `runraid setup plugin-hook` remain useful for
  non-plugin (systemd/Docker) installs that need `~/.unraid/.env` written.

## Repository layout

| Path | Component | Toolchain | Build / test from repo root |
|------|-----------|-----------|------------------------------|
| `unraid-py/` | Python MCP server (**unraid-mcp** on PyPI, import `unraid_mcp`). Self-contained: its own `pyproject.toml`, `uv.lock`, `Dockerfile`, `docs/`, `openwiki/`, `scripts/`, and tests. | Python / uv / hatchling | `cd unraid-py && uv sync && uv run pytest && uv build --wheel` (run `npm --prefix tests/mock install` once to un-skip the 9 mock-server tests) |
| `unraid-rs/` | Rust MCP server + CLI (crates.io package `unraid-rmcp`, binary `runraid`), frozen `lab-auth` compatibility crate, CRGX metadata, and a legacy npm wrapper. Toolchain pinned to the MSRV by `rust-toolchain.toml`. | Rust / cargo | `cd unraid-rs && cargo fmt --check && cargo clippy --all-targets --features test-support -- -D warnings && cargo test` (CI additionally packages both crates exactly as crates.io will receive them) |
| `plugins/mcp/` | Unraid OS `.plg` shipping the Rust `runraid` server (was `unraid/`). | shell + Rust + Node (Vite settings bundle) | `bash plugins/mcp/scripts/build-txz.sh <ver> <runraid-binary>` — the binary version must exactly match `<ver>` |
| `plugins/incus/` | Unraid OS `.plg` for Incus dev-containers + nested `unraid-api-plugin-incus/` (NestJS/Vue). Build gotchas: see `plugins/incus/CLAUDE.md`. | shell + NestJS/Vue | `cd plugins/incus && ./scripts/verify-classic-package.sh && ./tests/classic-contract.sh` |
| `plugins/codex/` | Unraid OS `.plg` for the Codex chathead (was `unraid-codex/`). | shell + React | `cd plugins/codex && ./tests/contract.sh` |
| `agents/unraid-py/` | Claude/Codex plugin, `name: unraid-mcp`. No hooks. | — | listed in **both** `.claude-plugin/marketplace.json` and `.agents/plugins/marketplace.json` |
| `agents/unraid-rs/` | Claude/Codex plugin, `name: runraid`. No hooks. Version is release-please-managed under the `unraid-rs` package and **must equal `unraid-rs/Cargo.toml`'s `version`** (`validate-plugin-layout.sh` enforces it). | — | listed in **both** `.claude-plugin/marketplace.json` and `.agents/plugins/marketplace.json` |
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
- **Release management has two explicit lanes.** release-please manages only
  `unraid-py` and `unraid-rs`; its `bootstrap-sha` pins history to the monorepo
  consolidation boundary so imported `Release-As:` directives cannot poison new
  release PRs. Python uses unprefixed `vX.Y.Z` tags and Rust uses
  `unraid-rs-vX.Y.Z`. Rust release-please must update both `version` and
  `binaryVersion` in the npm launcher. `.github/workflows/crates-publish.yml`
  publishes `lab-auth` before `unraid-rmcp`, then smokes `cargo install` and
  CRGX; it runs automatically only when `CRATES_IO_PUBLISHING_ENABLED=true`.
  `rust-release.yml` keeps npm as a gated compatibility path and publishes the
  Rust image as `ghcr.io/dinglebear-ai/unraid-rmcp`. Incus and Codex use
  `.github/scripts/plugin_calver.py` and
  fixed-width `YYYYMMDD.NNN` versions with `incus-v*` / `codex-v*` tags. Unraid
  compares plugin versions as raw strings, so fixed width is mandatory.
  `.github/scripts/release_contract.py` and `check-plg-version-ordering.sh` run in
  `meta-ci.yml` to reject manager drift, tag drift, and lexical regressions.
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
`unraid-rs`'s MSRV (1.97.1) so local `clippy` reproduces CI; the root and
`unraid-rs/rust-toolchain.toml` files carry the same pin for contributors who
use rustup instead of mise. Keep `.mise.toml`, both `rust-toolchain.toml` files,
`unraid-rs/Cargo.toml` (`rust-version`), and `rust-ci.yml` in sync.

The root `Cargo.toml` is a zero-member policy mirror for fleet validation. The
real, independently buildable Rust workspace remains rooted at `unraid-rs/` so
its component-scoped Docker and release contexts keep using
`unraid-rs/Cargo.lock`.

Git hooks come from the **root** `lefthook.yml` (`lefthook install`). Hooks are
per-repository, not per-directory — component-level lefthook configs do not run.
(These are *git* hooks — unrelated to the retired Claude Code plugin hooks above.)

## Gotchas

- **`unraid-rs` is not read-only.** `ACTIONS` in `src/mcp/schemas.rs` currently holds
  **146 actions: 62 `Scope::Read` and 86 `Scope::Write`** (VM start/stop/force-stop,
  Docker start/stop/remove, array start/stop, notification create/delete, …). Any doc
  or manifest claiming "read-only", "24 actions", or "nothing is modified" is stale —
  fix it rather than propagating it. Writes require `unraid:admin`; `unraid:admin`
  satisfies `unraid:read`.
- **`unraid-rs` declares `rmcp = "1.6.0"` but builds 1.8.0.** The caret range already
  drifted. `Cargo.lock` is the truth; do not quote the `Cargo.toml` value as the
  effective version. Same shape of trap as a pin that silently stopped pinning.
- **`unraid-rs` is a 3-member workspace** (root `unraid-rmcp` + `crates/lab-auth` +
  `xtask`), edition 2021, MSRV 1.90. `crates/lab-auth` is a *frozen local copy* of the
  shared auth crate — not the `dinglebear-ai/labby` git dependency the other rmcp
  services use.
- **Do not run a full `cargo build`/`cargo test` casually here.** The Rust tree is
  large and CI already covers it; prefer targeted `cargo check -p` or the contract
  scripts.
