# Unraid tooling monorepo

This is [dinglebear-ai/unraid](https://github.com/dinglebear-ai/unraid), not
Unraid Core. The Python and Rust MCP servers, OS plugins, and client-agent
integrations share repository policy, not one application runtime. Read the
component's guide before changing its implementation.

## Component map

| Path | Responsibility | Guide |
| --- | --- | --- |
| `unraid-py/` | Python server; package `unraid-mcp`, import `unraid_mcp` | [AGENTS](unraid-py/AGENTS.md) |
| `unraid-rs/` | Rust server and CLI; crate `unraid-rmcp`, binary `runraid` | [AGENTS](unraid-rs/AGENTS.md) |
| `plugins/mcp/` | Native Unraid plugin packaging the Rust server and settings UI | [README](plugins/mcp/README.md) |
| `plugins/incus/` | Classic Incus OS plugin, NestJS backend, Vue frontends | [AGENTS](plugins/incus/AGENTS.md) |
| `plugins/codex/` | Classic Codex chathead plugin and React UI | [README](plugins/codex/README.md) |
| `agents/unraid-py/` | Client integration named `unraid-mcp` | [Plugin guide](unraid-py/docs/plugin/AGENTS.md) |
| `agents/unraid-rs/` | Client integration named `runraid` | [Rust guide](unraid-rs/AGENTS.md) |

## Cross-component contracts

Python routes the consolidated `unraid(action=..., subaction=...)` tool through
domain handlers. Rust's `src/mcp/schemas.rs::ACTIONS` owns action identity and
scope; `action_params.rs` owns parameter metadata. Its `legacy` (default),
`atomic`, and `both` projections share enabled actions, authorization,
confirmation guards, and dispatch. Do not create a second execution path.

Both servers can mutate Unraid. Keep outbound Unraid API credentials separate
from inbound MCP bearer/OAuth credentials. Live disk, array, VM, container,
and plugin tests require an explicitly selected disposable target.
The component guides own routing, scopes, TLS, and test-patching details;
[ARCHITECTURE.md](docs/ARCHITECTURE.md) maps execution and trust boundaries.

## Build roots

The root [Cargo.toml](Cargo.toml) is a zero-member policy mirror, **not** the
Rust build root. Run Cargo in `unraid-rs/`; its workspace contains the server,
`crates/lab-auth`, and `xtask`, and owns its lockfile. The frozen `lab-auth`
compatibility floor is separate from the main compiler policy.

[.mise.toml](.mise.toml) selects development tools. Keep its Rust selection,
both `rust-toolchain.toml` files, workspace metadata, and CI/build pins aligned.
Check the effective environment when a compiler differs from the manifests.

Run Python commands in `unraid-py/`, which owns `pyproject.toml` and `uv.lock`:
`uv sync --locked --group dev`. Python and Rust have component-local `Justfile`s;
Rust `just test` uses cargo-nextest. Each Node subproject owns its build root.

## Verification

Run shared documentation/policy gates from the repository root with its
toolchain active. In a noninteractive shell, use `mise exec -- <command>`.

```bash
python3 .github/scripts/check_documentation.py --check-index
python3 -m unittest discover -s .github/scripts/tests -p 'test_*.py'
python3 .github/scripts/release_contract.py
python3 .github/scripts/check-action-pin-comments.py
python3 .github/scripts/check-actions-allowlist.py
git diff --check
```

Stage reviewed changes before the index check. [DEVELOPMENT.md](docs/DEVELOPMENT.md)
owns component gates and platform limitations. Documentation-only changes do
not require a full Rust rebuild or live Unraid test. Git hooks are configured
by root `lefthook.yml`, not by separate per-component installations.

## Packaging and release

The repository was renamed from `unraid-mcp`; use its current repository URL
without renaming published packages. The Rust npm launcher is
`@dinglebear/unraid`, despite its `packages/unraid-rmcp` directory. Python's
image is `ghcr.io/dinglebear-ai/unraid-mcp`; Rust's is
`ghcr.io/dinglebear-ai/unraid-rmcp`.

`.claude-plugin/marketplace.json` and `.agents/plugins/marketplace.json` have
different schemas but must expose matching plugin sets. The marketplace name
remains `unraid-mcp`. Neither client integration ships Claude hooks; do not
restore `hooks` manifest keys or hook directories. Manual `plugin-setup.sh`
entry points remain for explicit setup.

Deployed `.plg`/updater URLs sometimes retain the old repository name.
Changing them is a compatibility/release change, not prose cleanup.
Plugin `.txz` payloads are release assets, never tracked source blobs.
Incus packaging requires its complete verified runtime payload and UI chunks.

release-please owns Python and Rust versions. Incus and Codex use fixed-width
`YYYYMMDD.NNN` CalVer; the native MCP plugin follows the Rust release.
[RELEASING.md](docs/RELEASING.md) owns release gates and rollback procedures.

External Actions require immutable SHA pins, matching version comments, and
both the repository and hosted allowlists. Preserve shared-file trigger
coverage in `meta-ci.yml` and workflow-policy coverage in `ci.yml`.
The [Repository Contract](.github/workflows/repository-contract.yml) adapter
retains the pinned fleet rules, substituting only its obsolete Claude-canonical
rule with this repository's instruction-layout validation.

## Documentation

[docs/README.md](docs/README.md) indexes maintained guides, including
instruction-layout setup. Keep explanations there rather than expanding this
entry point with global workflow policy or machine-specific instructions.

The Rust npm README is generated from `unraid-rs/README.md`; refresh it with
`node unraid-rs/packages/unraid-rmcp/scripts/sync-readme.js`. Historical session
records, changelogs, and imported upstream snapshots are not current contracts.
