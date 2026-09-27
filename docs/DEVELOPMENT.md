---
title: Development and verification
created: 2026-09-27
updated: 2026-09-27
---

# Development and verification

Commands below state their working directory. The repository root is the clone
of `dinglebear-ai/unraid`; it is not an Unraid Core checkout. See
[AGENTS.md](../AGENTS.md) for safety and contributor policy.

## Bootstrap

From the repository root, inspect `git status --short --branch` and
`git remote -v` before installing tools or editing files. Preserve existing
work. Root `.mise.toml` selects Python 3.12, Node 22, uv, and Rust 1.97.1.
`mise install` installs those selections; verify the activated versions with
`python3 --version`, `node --version`, and `rustc --version`.

`just`, `lefthook`, cargo-nextest, and shell validation tools are separate
utilities, not all supplied by `.mise.toml`. Install the ones required by your
selected gate. Run `lefthook install` at the root to enable shared git hooks.

The root Cargo manifest is a policy mirror with no members. The actual Rust
workspace is `unraid-rs/`. Both servers own component-local `Justfile`s.

## Shared metadata and documentation

From the repository root:

```bash
python3 .github/scripts/check_documentation.py
python3 -m unittest discover -s .github/scripts/tests -p 'test_*.py'
python3 .github/scripts/release_contract.py
python3 .github/scripts/check-action-pin-comments.py
python3 .github/scripts/check-actions-allowlist.py
git diff --check
```

`meta-ci.yml` also parses workflow YAML, checks both marketplaces, validates
Community Applications metadata, compares plugin version ordering against tag
history, and runs actionlint. Its YAML checks need PyYAML; XML checks need
`xmllint`. See the workflow for exact CI dependencies and pinned tooling.
The shared unit suite uses Python's standard library.

## Python MCP server

From `unraid-py/`:

```bash
uv sync --locked --group dev
uv run ruff check src/ tests/
uv run ruff format --check src/ tests/
uv run ty check src/
uv run pytest -m 'not slow and not integration' --tb=short -q
```

Use a focused file/directory while iterating. `uv run pytest` is the full suite,
not a replacement for explaining which slow/live dependencies were available.
The Node mock GraphQL server has its own dependencies under `tests/mock/`;
install them before claiming mock-server coverage. `ci.yml` separates unit and
integration/mock-server jobs and shows their exact setup.

Local launch is `uv run unraid-mcp` or `uv run python -m unraid_mcp`. Configure
credentials privately; importing the server can initialize configuration. Do
not point tests at a real NAS merely to satisfy required environment variables.
See [Python AGENTS](../unraid-py/AGENTS.md) for test patch targets, confirmation
guards, and schema validation.

## Rust MCP server and CLI

From `unraid-rs/`:

```bash
cargo fmt -- --check
cargo clippy --locked --all-targets --features test-support -- -D warnings
cargo test --locked --test setup_contract
cargo test --locked --test schema_contract
```

Run only relevant targets during iteration. Full CI uses cargo-nextest;
`just test` invokes `cargo nextest run` and `just test-ci` uses its CI profile.
`cargo test --locked` remains an alternative full test invocation. The
`test-support` feature provides an offline scenario-driven GraphQL mock.
For documentation-helper changes, `cargo test --locked -p xtask` avoids
building the server test suite.

Client-plugin and wrapper checks from the repository root:

```bash
(cd unraid-rs && bash scripts/validate-plugin-layout.sh)
node unraid-rs/packages/unraid-rmcp/scripts/sync-readme.js
npm test --prefix unraid-rs/packages/unraid-rmcp
# Linux x64 only: packed-install and executable-wrapper smoke test
npm run check --prefix unraid-rs/packages/unraid-rmcp
```

The current npm binary distribution supports Linux x64. Its full `check`
command invokes the installed wrapper and therefore rejects unsupported hosts,
including macOS ARM64. Report that limitation rather than bypassing platform
detection or treating the seven portable wrapper tests as an install test.

For an intentionally requested local binary build, run `cargo build --release
--locked` inside `unraid-rs/`, then invoke `./target/release/runraid`. Building
does not put `runraid` on PATH. `cargo install --path . --locked` installs it.
Use the configured `CARGO_TARGET_DIR` when overriding Cargo's output directory.

## Unraid OS plugins

| Component | Offline checks and preparation |
| --- | --- |
| Native MCP | From root: `bash plugins/mcp/tests/runtime-contract.sh`; install `plugins/mcp/web` dependencies, then run its `typecheck`, `test`, and `build` scripts. Packaging needs a matching Rust binary. |
| Codex | From `plugins/codex/`: `npm ci --no-audit --no-fund --prefix web-src`, then `./tests/contract.sh`; use `codex-ci.yml` for the full web/shell gates. |
| Incus classic | From `plugins/incus/`: `./scripts/verify-classic-package.sh` and `./tests/classic-contract.sh`. Archive checks require the complete release payload; its absence is not a passing package check. |
| Incus API/UI | Follow `incus-api-ci.yml` for host-dependency proxies, backend tests/typecheck/build, and the frontend's tests/typecheck/two bundles. A clean checkout does not inherit a developer's sibling dependency symlinks. |

The Incus API package cannot install the OS daemon by itself. A classic release
must preserve the verified binary payload and ship all frontend chunks. See
[Incus AGENTS](../plugins/incus/AGENTS.md) before building or deploying.

## Live testing and completion evidence

Live tests are separate, explicit operations. Record the disposable target,
version, authentication mode, exact commands, results, and any mutation/reset.
Never use production disk, array, VM, Docker, or plugin operations for a
documentation audit. No live smoke test is implied by the offline checks above.

Before committing, inspect `git diff`, `git diff --cached`, and untracked files,
then stage the authorized changes. Do not force-add ignored credentials,
archives, caches, or logs under an instruction to include dirty work.
Run the staged environment-file guard and an available redacted secret scan.
After an authorized push, verify local HEAD equals the remote branch and
report failures/skips rather than claiming all checks passed.
