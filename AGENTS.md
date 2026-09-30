# Unraid tooling monorepo

This is [dinglebear-ai/unraid](https://github.com/dinglebear-ai/unraid), not
Unraid Core. The servers, OS plugins, and client integrations share repository policy,
not one runtime. Read the component guide before changing its implementation.

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
[ARCHITECTURE.md](docs/ARCHITECTURE.md) maps execution and trust boundaries.

## Implementation seams

Python mutation handlers must return before their domain query-dictionary lookup.
Patch `unraid_mcp.core.client.make_graphql_request` in tests; per-tool aliases
are not the call target. Keep list/event bounds and the response-size backstop;
never cache the consolidated tool wholesale because it also mutates state.

Rust operations normally use typed cynic definitions in `src/gql_typed.rs`.
Keep schema-capability probes and cross-version fallbacks in `src/graphql.rs`,
using the shared transport. Extend catalog, parameters, dispatcher, fixtures,
and scope/confirmation tests together. MCP pagination/selectors are not CLI
policy; do not promise identical surfaces or complete upstream API coverage.

## Configuration boundaries

Both client `.mcp.json` files pass settings into the launched process. They do
not automatically persist credentials for unrelated shells or Docker instances.
Python's loader uses the first eligible env file, not a merge of every file;
nonempty process values win. Its home is `~/.unraid-mcp` unless overridden.
Rust uses `UNRAID_HOME`, container `/data`, or `~/.unraid`; its loader fills
empty placeholders from the selected env file but rejects malformed files.

Rust `UNRAID_NOAUTH` only acknowledges an unauthenticated non-loopback bind;
it does not disable authentication. Prefer `UNRAID_API_CA_BUNDLE` for Rust or
a CA path in Python's `UNRAID_VERIFY_SSL` over disabling TLS verification.

## Build roots

The root [Cargo.toml](Cargo.toml) is a zero-member policy mirror, **not** the
Rust build root. Run Cargo in `unraid-rs/`; its workspace contains the server,
`crates/lab-auth`, and `xtask`, and owns its lockfile. The frozen `lab-auth`
compatibility floor is separate from the main compiler policy.

[.mise.toml](.mise.toml) selects development tools. Keep its Rust selection,
both `rust-toolchain.toml` files, workspace metadata, and CI/build pins aligned.
Check the effective environment when compiler versions differ.

Run Python commands in `unraid-py/`, which owns `pyproject.toml` and `uv.lock`:
`uv sync --locked --group dev`. Python and Rust have component-local `Justfile`s;
Rust `just test` uses cargo-nextest. Node build roots are `plugins/mcp/web/`,
`plugins/codex/web-src/`, and `plugins/incus/unraid-api-plugin-incus/` plus its
`web/` child. Incus changes may require both resolver decorators and the SDL
in `src/index.ts`; ship both frontend bundles and every emitted settings chunk.

## Verification

Run shared gates from the repository root with its toolchain active. In a noninteractive shell, use `mise exec -- <command>`.

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
Its configured bridge uses deny-list containment, not a complete sandbox.
Codex state lives in an Incus volume, separately from its container rootfs.

release-please owns Python and Rust versions. Incus and Codex use fixed-width
`YYYYMMDD.NNN` CalVer. The native MCP builder executes the Linux x64 binary
and derives its epoch-prefixed plugin version from matching Rust semver.
The Rust `just publish` recipe is legacy and uses the wrong tag lane; do not
use it instead of release-please.
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
