# AGENTS.md

Canonical contributor and agent instructions for **`dinglebear-ai/unraid`**.
`CLAUDE.md` and `GEMINI.md` are relative symlinks to this file. Edit `AGENTS.md`,
never an independent copy. A component's `AGENTS.md` adds local guidance; this
file owns repository identity, safety, shared tooling, and release policy.

Keep hostnames, usernames, private endpoints, personal tooling preferences, and
checkout-specific paths out of shared instructions. Put them in the ignored
`AGENTS.override.md`, with `CLAUDE.local.md -> AGENTS.override.md` as its relative
symlink. The override must explicitly load the shared `AGENTS.md`: Codex chooses
only one instruction file per directory. Setup and verification are documented
in [docs/AGENT_INSTRUCTIONS.md](docs/AGENT_INSTRUCTIONS.md).

## Start here

1. Confirm the checkout with `git rev-parse --show-toplevel`, `git remote -v`, and
   `git status --short --branch`. This is the tooling monorepo, **not**
   an Unraid Core checkout or any other repository.
2. Read the component's `AGENTS.md` and README before editing it. Read
   [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for working directories and gates.
3. Inspect pre-existing staged, unstaged, and untracked changes. Preserve them;
   include them in a commit only when authorized. Never reset, clean, discard
   stashes, or edit another repository as incidental cleanup.
4. Use source, manifests, lockfiles, tests, and workflow definitions to verify
   claims. Historical session notes and imported upstream docs are evidence of
   their capture date, not current instructions.

## Repository identity and components

The former `runraid` and `incus-unraid` repositories were consolidated here; the
repository was renamed from `unraid-mcp` to `unraid`. New repository URLs must
use `dinglebear-ai/unraid`. Do not rename package names to match the repository.

| Path | Responsibility | Local guidance |
| --- | --- | --- |
| `unraid-py/` | Python MCP server; PyPI `unraid-mcp`, import `unraid_mcp` | [AGENTS.md](unraid-py/AGENTS.md), [README](unraid-py/README.md) |
| `unraid-rs/` | Rust MCP server and CLI; crate `unraid-rmcp`, binary `runraid` | [AGENTS.md](unraid-rs/AGENTS.md), [README](unraid-rs/README.md) |
| `plugins/mcp/` | Native Unraid plugin packaging the Rust server and settings UI | [README](plugins/mcp/README.md) |
| `plugins/incus/` | Classic Incus OS plugin, NestJS API backend, Vue frontends | [AGENTS.md](plugins/incus/AGENTS.md), [README](plugins/incus/README.md) |
| `plugins/codex/` | Classic Codex chathead plugin and React UI | [README](plugins/codex/README.md) |
| `agents/unraid-py/` | Claude/Codex integration named `unraid-mcp` | [plugin docs](unraid-py/docs/plugin/AGENTS.md) |
| `agents/unraid-rs/` | Claude/Codex integration named `runraid` | [Rust guide](unraid-rs/AGENTS.md) |
| `.github/` | Shared CI, release tooling, and repository policy | [release guide](docs/RELEASING.md) |

The two marketplace manifests are `.claude-plugin/marketplace.json` and
`.agents/plugins/marketplace.json`. Their schemas differ, but the plugin sets
must agree. The marketplace remains named `unraid-mcp`. The Rust npm launcher
is **`@dinglebear/unraid`** despite its directory `packages/unraid-rmcp`.
The Python container is `ghcr.io/dinglebear-ai/unraid-mcp`; the Rust image is
`ghcr.io/dinglebear-ai/unraid-rmcp`.

Some deployed `.plg`/updater URLs deliberately retain the old repository name.
Do not rewrite installer URLs as documentation cleanup: changes affect live
updates and need a deliberate release and disposable-host test. Do not assume
GitHub redirects are a permanent compatibility contract.

## Architecture and safety boundaries

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the cross-component map.

- **Python:** one `unraid(action=..., subaction=...)` tool routes to domain
  handlers. Mutations must return before a domain query-dictionary lookup.
  Patch `unraid_mcp.core.client.make_graphql_request` in tests, not an unbound
  per-tool alias. Destructive actions require the existing confirmation guard.
- **Rust:** `src/mcp/schemas.rs::ACTIONS` is the canonical action/scope catalog.
  `legacy` (default), `atomic`, and `both` are projections over the same enabled
  actions, authorization, destructive-action gating, and dispatcher. Configure
  `UNRAID_RMCP_PROJECTION`; do not introduce a second execution path. Parameter
  metadata belongs in `src/mcp/action_params.rs`.
- **Rust is not read-only.** `Scope::Read` requires `unraid:read`;
  `Scope::Write` requires `unraid:admin`; admin satisfies read; `help` has
  `Scope::None`. Unknown actions must remain unreachable. Do not teach the
  retired `ActionSpec.read_only` API or hard-code action counts in new prose.
- **GraphQL:** Rust uses typed cynic operations against its vendored SDL, then
  serializes results to `serde_json::Value`. Python uses maintained query and
  mutation documents with schema/parity tests. Offline fixtures do not prove
  behavior on every deployed Unraid version.
- **Real systems:** never use a production array, VM, container, plugin install,
  credential store, or network setting as a documentation smoke test. Live and
  destructive tests require an explicitly selected disposable target.
- **Credentials:** distinguish upstream Unraid API keys from inbound MCP
  bearer/OAuth credentials. Never commit `.env`, tokens, private keys, generated
  authenticated CLIs, or credential-bearing logs. Keep TLS verification enabled;
  the Python insecure-TLS path requires both `UNRAID_VERIFY_SSL=false` and
  `UNRAID_ALLOW_INSECURE_TLS=true`. Prefer the Rust CA-bundle option over skipping
  verification. Do not disable auth to make a test pass.

## Agent-plugin configuration

Neither client plugin ships Claude Code hooks. Do not add a `hooks` key to
agent plugin manifests or recreate `hooks/` directories. The manual
`agents/*/scripts/plugin-setup.sh` entry points remain for explicit setup.

Both `.mcp.json` files map plugin settings using `${user_config.*}`. Read the
actual manifest rather than repeating a key count. The Rust plugin includes
auth and tool-selector settings; its server also supports projection via
`UNRAID_RMCP_PROJECTION`/TOML. Python currently forwards the endpoint and API key
plus stdio transport, **not** its two TLS settings. Any future TLS wiring must
wire verification and insecure-TLS acknowledgement together.

## Toolchains and build roots

Root `.mise.toml` selects Python 3.12, Node 22, uv, and Rust **1.97.1**.
The Rust workspace uses edition **2024** and MSRV **1.97.1**. Keep the root
policy mirror, both `rust-toolchain.toml` files, `.mise.toml`, the nested
workspace manifest, and main Rust CI/build pins aligned when changing these.
The frozen `lab-auth` crate has a separately tested compatibility floor; do
not blanket-replace every older compiler mention in the repository.

The root `Cargo.toml` is a **zero-member policy mirror**, not the build root.
Run Cargo from `unraid-rs/`, whose workspace contains `unraid-rmcp`,
`crates/lab-auth`, and `xtask`. Its own `Cargo.lock` is authoritative. `rmcp`
is currently exactly pinned to `=3.1.0` and resolves to 3.1.0 in that lockfile;
verify both rather than reviving the old 1.x drift notes.

The Python package owns `pyproject.toml` and `uv.lock`; use
`uv sync --locked --group dev` from `unraid-py/`. Its `Justfile` and the Rust
`Justfile` are component-local. Rust `just test` uses **cargo-nextest**, not
plain `cargo test`. Node subprojects each own their manifests and build roots.

## Validation

For documentation/shared-policy changes, run from the repository root:

```bash
python3 .github/scripts/check_documentation.py
python3 -m unittest discover -s .github/scripts/tests -p 'test_*.py'
python3 .github/scripts/release_contract.py
python3 .github/scripts/check-action-pin-comments.py
python3 .github/scripts/check-actions-allowlist.py
git diff --check
```

Use [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for component gates. Prefer
focused offline tests. Do not run an expensive full Rust build/test merely
to validate prose; do test automation code changed alongside documentation.
Report skipped, unavailable, or failing gates explicitly. Never equate a static
check with a live Unraid validation.

Install git hooks from **root `lefthook.yml`** (`lefthook install`); component
configs are not separate per-directory hooks. These git hooks are unrelated
to the removed Claude plugin hooks.

## CI, release, and repository policy

- All external GitHub Actions must use immutable SHA pins and consistent
  trailing version comments. New third-party actions must also be added to
  `.github/allowed-actions.txt` and the matching live repository allowlist by
  an authorized maintainer. A rejected action can cause startup failure with
  no jobs; absence of a check is not success.
- Workflows are path-scoped. `meta-ci.yml` covers shared metadata and Markdown
  changes; `ci.yml` must continue to include `.github/workflows/**` so the
  Python workflow-policy tests run on workflow changes.
- release-please owns Python and Rust versions. Incus and Codex use the
  fixed-width `YYYYMMDD.NNN` CalVer lane. The native MCP plugin follows the
  Rust release. Details and gates: [docs/RELEASING.md](docs/RELEASING.md).
- Plugin `.txz` payloads are release assets, never tracked Git blobs. Do not
  package an incomplete Incus source-only archive; preserve its complete
  verified runtime payload and release manifest.
- `.gitleaks.toml` supports local scanning. Inspect current repository security
  settings before changing secret-scanning policy; a prose claim is not proof
  that a hosted setting is enabled.

## Documentation maintenance and completion

Every repository instruction triplet must be a real `AGENTS.md` plus relative
`CLAUDE.md -> AGENTS.md` and `GEMINI.md -> AGENTS.md` symlinks. The shared checker
enforces this and maintained Markdown links. Do not replace symlinks with
copies. The Codex plugin's `container/workspace-CLAUDE.md` is a **runtime
template**, not a repository instruction triplet; changing its deployment
behavior is a separate feature/release task.

Keep operational explanations in [docs/](docs/README.md), and link to source
for fast-changing versions, counts, and inventories. Historical session logs,
changelogs, and imported upstream snapshots remain historical; do not rewrite
them to manufacture current evidence.

When Beads is configured, use `bd prime` and its current task-tracking profile.
It does not grant permission to push, sync other stores, discard stashes, or
modify neighboring repositories. At completion, run the relevant gates,
review the diff and staged files for secrets, then commit/push only within
the user's authorized scope. Never force-push to bypass a divergence or
protection rule. Verify local HEAD equals the remote branch after pushing and
report the commit, validation results, and any remaining work.
