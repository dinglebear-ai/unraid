# Unraid

<!-- mcp-name: tv.tootie/unraid-mcp -->

[![PyPI](https://img.shields.io/pypi/v/unraid-mcp)](https://pypi.org/project/unraid-mcp/) [![ghcr.io](https://img.shields.io/badge/ghcr.io-dinglebear--ai%2Funraid--mcp-blue?logo=docker)](https://github.com/dinglebear-ai/unraid/pkgs/container/unraid-mcp)

A monorepo of Unraid tooling: two MCP servers (Python and Rust) and three Unraid
OS plugins, plus the Claude/Codex agent integrations that surface them.

> **Repo name.** This repo was renamed `unraid-mcp` → `unraid` on 2026-07-27, and
> the former standalone `runraid` and `incus-unraid` repos were merged in here. The
> old GitHub name still redirects, so existing plugin install/update URLs keep
> working. The **PyPI package, the container image, the Claude plugin, and the
> Unraid `.plg`** are all still named `unraid-mcp` — only the repo changed.

## Components

| Path | What it is | Toolchain | Build / test |
|------|-----------|-----------|--------------|
| [`unraid-py/`](unraid-py/) | **unraid-mcp** — Python MCP server (GraphQL), the flagship. Published to PyPI as `unraid-mcp`. | Python / uv / hatchling | `cd unraid-py && uv run pytest && uv build --wheel` |
| [`unraid-rs/`](unraid-rs/) | **runraid** — Rust MCP server + CLI (single static binary). Crate `unraid-rmcp` on crates.io, plus a legacy npm wrapper of the same name. | Rust / cargo | `cd unraid-rs && cargo fmt --check && cargo clippy --all-targets --features test-support -- -D warnings && cargo test` |
| [`plugins/mcp/`](plugins/mcp/) | Unraid OS plugin that ships the Python MCP server onto an Unraid box. | shell `.plg` + Python | `bash plugins/mcp/scripts/build-txz.sh <ver> <wheel>` |
| [`plugins/incus/`](plugins/incus/) | Unraid OS plugin running Incus system containers ("dev containers") firewalled off the LAN. Includes a NestJS/GraphQL `unraid-api` backend. | shell `.plg` + NestJS/Vue | `cd plugins/incus && ./scripts/verify-classic-package.sh && ./tests/classic-contract.sh` |
| [`plugins/codex/`](plugins/codex/) | Unraid OS plugin embedding a Codex chathead app-server. | shell `.plg` + React | `cd plugins/codex && ./tests/contract.sh` |
| [`agents/unraid-py/`](agents/unraid-py/) | Claude Code / Codex plugin (`name: unraid-mcp`) for the Python server. | — | — |
| [`agents/unraid-rs/`](agents/unraid-rs/) | Claude Code / Codex plugin (`name: runraid`) for the Rust server. | — | — |

## Install the agent plugins (one marketplace command, two manifests)

```text
/plugin marketplace add dinglebear-ai/unraid
/plugin install unraid-mcp@unraid-mcp   # Python server
/plugin install runraid@unraid-mcp      # Rust server
```

The `@unraid-mcp` suffix is the **marketplace name** declared in
`.claude-plugin/marketplace.json`, not the repo name — it stays `unraid-mcp` even
though the repo is now `dinglebear-ai/unraid`.

Both plugins are published from a single repo. Claude reads
`.claude-plugin/marketplace.json`; Codex reads `.agents/plugins/marketplace.json`.
`meta-ci.yml` asserts the two list the same plugin set, so they cannot drift.

`marketplace add` accepts the `owner/repo` shorthand (or a full git URL / local
path). After install, Claude Code prompts for the connection settings (the
plugin's `userConfig`).

### One manual step after installing `runraid`

The agent plugins ship **no Claude Code hooks**. `agents/unraid-py` needs nothing —
its `.mcp.json` injects `UNRAID_API_URL` / `UNRAID_API_KEY` straight from your
plugin settings. `agents/unraid-rs` passes no env, so provision its credentials once:

```bash
runraid setup plugin-hook          # or: crgx unraid-rmcp -- setup plugin-hook
```

That writes `~/.unraid/.env`, which the server loads at startup. Skip it and the
Rust server starts with no Unraid endpoint configured.

## unraid-py quickstart (Python MCP server)

The Python server is the flagship. Full documentation — installation, Claude
Code / Codex / Gemini setup, configuration, authentication, guardrails, and the
tool surface — lives in **[`unraid-py/README.md`](unraid-py/README.md)** and
[`unraid-py/docs/`](unraid-py/docs/). It publishes to PyPI as `unraid-mcp` (import
package `unraid_mcp`) and launches with `uvx unraid-mcp`.

## unraid-rs quickstart (Rust MCP server + CLI)

```bash
cd unraid-rs && cargo build --release      # → target/release/runraid
runraid setup plugin-hook                  # writes ~/.unraid/.env
runraid array                              # CLI
runraid serve mcp                          # MCP over HTTP on :40010
```

| Env var | Purpose |
|---|---|
| `UNRAID_API_URL` | Unraid GraphQL endpoint (required) |
| `UNRAID_API_KEY` | `x-api-key` for the Unraid API (required) |
| `UNRAID_API_SKIP_TLS_VERIFY` | Accept a self-signed Unraid cert (default `false`) |
| `UNRAID_RMCP_HOST` / `UNRAID_RMCP_PORT` | MCP bind address (default `0.0.0.0:40010`) |
| `UNRAID_RMCP_TOKEN` | Static bearer token for `/mcp` |
| `UNRAID_RMCP_AUTH_MODE` | `bearer` (default) or `oauth` |

Full list and the OAuth variables: [`unraid-rs/CLAUDE.md`](unraid-rs/CLAUDE.md).

**Not read-only.** The Rust server exposes both queries and mutations. Read actions
need the `unraid:read` scope; mutating actions (VM and Docker lifecycle, array
start/stop, notification writes) need `unraid:admin`.

## Releases

There are two release lanes. **release-please manages only `unraid-py` and
`unraid-rs`** — the Python server keeps unprefixed `vX.Y.Z` tags (the existing
audience's scheme) and Rust uses `unraid-rs-vX.Y.Z`. The **Incus and Codex plugins
do not use release-please**: they are versioned by
`.github/scripts/plugin_calver.py` with fixed-width `YYYYMMDD.NNN` versions and
`incus-v*` / `codex-v*` tags (Unraid compares plugin versions as raw strings, so the
fixed width is mandatory).

Plugin `.txz` payloads ship as GitHub **release assets**, never tracked in git.

## License

MIT — see [LICENSE](LICENSE).
