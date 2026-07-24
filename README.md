# Unraid

<!-- mcp-name: tv.tootie/unraid-mcp -->

[![PyPI](https://img.shields.io/pypi/v/unraid-mcp)](https://pypi.org/project/unraid-mcp/) [![ghcr.io](https://img.shields.io/badge/ghcr.io-dinglebear--ai%2Funraid--mcp-blue?logo=docker)](https://github.com/dinglebear-ai/unraid-mcp/pkgs/container/unraid-mcp)

A monorepo of Unraid tooling: two MCP servers (Python and Rust) and three Unraid
OS plugins, plus the Claude/Codex agent integrations that surface them.

## Components

| Path | What it is | Toolchain | Build / test |
|------|-----------|-----------|--------------|
| [`unraid-py/`](unraid-py/) | **unraid-mcp** — Python MCP server (GraphQL), the flagship. Published to PyPI as `unraid-mcp`. | Python / uv / hatchling | `cd unraid-py && uv run pytest && uv build --wheel` |
| [`unraid-rs/`](unraid-rs/) | **runraid** — Rust MCP server + CLI (single static binary), `unraid-rmcp` on npm. | Rust / cargo | `cd unraid-rs && cargo fmt --check && cargo clippy --all-targets -- -D warnings && cargo test` |
| [`plugins/mcp/`](plugins/mcp/) | Unraid OS plugin that ships the Python MCP server onto an Unraid box. | shell `.plg` + Python | `bash plugins/mcp/scripts/build-txz.sh <ver> <wheel>` |
| [`plugins/incus/`](plugins/incus/) | Unraid OS plugin running Incus system containers ("dev containers") firewalled off the LAN. Includes a NestJS/GraphQL `unraid-api` backend. | shell `.plg` + NestJS/Vue | `cd plugins/incus && ./scripts/verify-classic-package.sh && ./tests/classic-contract.sh` |
| [`plugins/codex/`](plugins/codex/) | Unraid OS plugin embedding a Codex chathead app-server. | shell `.plg` + React | `cd plugins/codex && ./tests/contract.sh` |
| [`agents/unraid-py/`](agents/unraid-py/) | Claude Code / Codex plugin (`name: unraid-mcp`) for the Python server. | — | — |
| [`agents/unraid-rs/`](agents/unraid-rs/) | Claude Code / Codex plugin (`name: runraid`) for the Rust server. | — | — |

## Install the agent plugins (one marketplace command, two manifests)

```text
/plugin marketplace add dinglebear-ai/unraid-mcp
/plugin install unraid-mcp@unraid-mcp   # Python server
/plugin install runraid@unraid-mcp      # Rust server
```

Both plugins are published from a single repo. Claude reads
`.claude-plugin/marketplace.json`; Codex reads `.agents/plugins/marketplace.json`.
`meta-ci.yml` asserts the two list the same plugin set, so they cannot drift.

`marketplace add` accepts the `owner/repo` shorthand (or a full git URL / local
path). After install, Claude Code prompts for the connection settings (the
plugin's `userConfig`) and persists them to `~/.unraid-mcp/.env`.

## unraid-py quickstart (Python MCP server)

The Python server is the flagship. Full documentation — installation, Claude
Code / Codex / Gemini setup, configuration, authentication, guardrails, and the
tool surface — lives in **[`unraid-py/README.md`](unraid-py/README.md)** and
[`unraid-py/docs/`](unraid-py/docs/). It publishes to PyPI as `unraid-mcp` (import
package `unraid_mcp`) and launches with `uvx unraid-mcp`.

## Releases

Versioning is driven by release-please across all four release units. The Python
server keeps unprefixed `vX.Y.Z` tags (the existing audience's scheme); the other
components use prefixed tags: `unraid-rs-vX.Y.Z`, `incus-vX.Y.Z`, `codex-vX.Y.Z`.
Plugin `.txz` payloads ship as GitHub **release assets**, not tracked in git.

## License

MIT — see [LICENSE](LICENSE).
