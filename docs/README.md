# Documentation index

Start with the [repository README](../README.md) for components and installation,
and [AGENTS.md](../AGENTS.md) for authoritative contributor instructions.

## Maintained guides

| Guide | Use it for |
| --- | --- |
| [DEVELOPMENT.md](DEVELOPMENT.md) | Toolchains, build roots, offline checks, and safe verification |
| [AGENT_INSTRUCTIONS.md](AGENT_INSTRUCTIONS.md) | Shared instruction symlinks, private overrides, precedence, and migration |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Component boundaries, execution paths, configuration, and trust |
| [RELEASING.md](RELEASING.md) | Release ownership, tags, packaging gates, and rollback evidence |
| [Python docs](../unraid-py/docs/README.md) | Python installation, auth, configuration, tools, and subscriptions |
| [Rust README](../unraid-rs/README.md) | Rust CLI/MCP usage, projection modes, and configuration |
| [Incus guide](../plugins/incus/AGENTS.md) | Classic packaging, API backend, Vue UI, and isolation gates |
| [Native MCP plugin](../plugins/mcp/README.md) | Installing and operating the native Rust server on Unraid |
| [Codex plugin](../plugins/codex/README.md) | Chathead packaging and runtime integration |

## Source-of-truth rules

`AGENTS.md` is the editable instruction file at every scope. `CLAUDE.md` and
`GEMINI.md` must be relative symlinks to it, not independently maintained copies.
The root guide owns shared policy; nested guides add component-specific details.
Personal host and checkout details belong only in the ignored local override
pair described in [AGENT_INSTRUCTIONS.md](AGENT_INSTRUCTIONS.md), not in shared
guides or copied assistant-specific files.

Code, manifests, lockfiles, and executable tests establish current behavior.
Avoid copying action counts or dependency versions into multiple pages; link
to their source whenever possible. When changing a public interface, update
the corresponding user guide and contract tests in the same change.

The Rust npm README is generated from `unraid-rs/README.md`; synchronize it with
`node unraid-rs/packages/unraid-rmcp/scripts/sync-readme.js`.

## Historical and external-reference material

`docs/sessions/` and component `docs/sessions/` directories record what happened
in a particular session. Changelogs, `unraid-py/docs/review/`, and issue plans
are historical evidence, not promises about the current tree.

`plugins/incus/docs/unraid/` is an imported upstream documentation snapshot,
not a live mirror. `unraid-py/docs/unraid/` contains captured/generated schema
references; Rust's `schema/` similarly contains a vendored contract and live
capture evidence. Regenerate only from an explicitly selected source or target;
do not rewrite old evidence during a general documentation cleanup.

The offline documentation checker excludes historical session/review records,
changelogs, and imported/generated upstream documentation from link validation.
It validates instruction triplets everywhere and local links in maintained
Markdown. It does not verify external URLs, anchor text, or live API behavior.

To repair missing or incorrect aliases, run
`python3 .github/scripts/check_documentation.py --repair-links` (also available
as `cargo xtask symlink-docs` from `unraid-rs/`). The helper validates all scopes
first and refuses to overwrite any regular alias file or reverse an unreviewed
legacy layout. Preserve and reconcile independent content before repairing.
Python 3.10+ is required; the repository development toolchain provides 3.12.

```bash
python3 .github/scripts/check_documentation.py
python3 -m unittest discover -s .github/scripts/tests -p 'test_*.py'
```
