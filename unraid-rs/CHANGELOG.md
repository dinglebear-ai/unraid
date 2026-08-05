# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.2](https://github.com/dinglebear-ai/unraid/compare/unraid-rs-v0.4.1...unraid-rs-v0.4.2) (2026-08-05)


### Bug Fixes

* **mcp:** harden rust plugin runtime ([#352](https://github.com/dinglebear-ai/unraid/issues/352)) ([746d892](https://github.com/dinglebear-ai/unraid/commit/746d892a52e485928dad78c3732af4909c8af584))

## [0.4.1](https://github.com/dinglebear-ai/unraid/compare/unraid-rs-v0.4.0...unraid-rs-v0.4.1) (2026-08-05)


### Bug Fixes

* **docker:** repair the Rust image build (broken since [#262](https://github.com/dinglebear-ai/unraid/issues/262)) ([#350](https://github.com/dinglebear-ai/unraid/issues/350)) ([c077cf3](https://github.com/dinglebear-ai/unraid/commit/c077cf3a47b1896654017c0a110d574abc89407e))

## [0.4.0](https://github.com/dinglebear-ai/unraid/compare/unraid-rs-v0.3.1...unraid-rs-v0.4.0) (2026-08-05)


### Features

* **unraid-rs:** add granular MCP tool and action controls ([#342](https://github.com/dinglebear-ai/unraid/issues/342)) ([18c429f](https://github.com/dinglebear-ai/unraid/commit/18c429fa9fedfd0e6cf03d05bceda431c92554d8))

## [0.3.1](https://github.com/dinglebear-ai/unraid/compare/unraid-rs-v0.3.0...unraid-rs-v0.3.1) (2026-08-05)


### Bug Fixes

* **unraid-rs:** bind MCP to trusted interfaces ([#338](https://github.com/dinglebear-ai/unraid/issues/338)) ([060fa1c](https://github.com/dinglebear-ai/unraid/commit/060fa1c502e16e29ef691664ac5a6f0056a57609))

## [Unreleased]

### Changed

- Bind the production MCP port only to DOOKIE's Tailscale and LAN addresses instead of every host interface.

## [0.3.0](https://github.com/dinglebear-ai/unraid/compare/unraid-rs-v0.2.5...unraid-rs-v0.3.0) (2026-08-02)


### Features

* **unraid-rs:** publish unraid-rmcp and lab-auth to crates.io via CRGX ([#262](https://github.com/dinglebear-ai/unraid/issues/262)) ([42bc569](https://github.com/dinglebear-ai/unraid/commit/42bc569b4a2ccd37f25a8d6c8639a633e1a4e469))


### Bug Fixes

* normalize npm release archive binary ([1a0b172](https://github.com/dinglebear-ai/unraid/commit/1a0b172546e9ba37a2873c355c4733ea35a6e137))
* publish npm launcher as @dinglebear/unraid ([c7938d1](https://github.com/dinglebear-ai/unraid/commit/c7938d1a1999f8a69c30f3c7ba538239ec3ad017))


### Dependencies

* **deps-dev:** bump happy-dom in /plugins/mcp/web ([#226](https://github.com/dinglebear-ai/unraid/issues/226)) ([ad237e2](https://github.com/dinglebear-ai/unraid/commit/ad237e22166888cc173e2fe16d9aba4e8b82fd3d))
* **deps:** bump anyhow from 1.0.103 to 1.0.104 in /unraid-rs ([#248](https://github.com/dinglebear-ai/unraid/issues/248)) ([c0b581e](https://github.com/dinglebear-ai/unraid/commit/c0b581e2613ca6291428c6edb8ed7ab846630d8d))
* **deps:** bump graphql-ws from 6.0.8 to 6.2.0 in /unraid-py/tests/mock ([#230](https://github.com/dinglebear-ai/unraid/issues/230)) ([9a934b5](https://github.com/dinglebear-ai/unraid/commit/9a934b5ae1dae132dd8231d46ffa1d16babd0cbd))
* **deps:** bump rmcp from 1.8.0 to 2.2.0 in /unraid-rs ([#237](https://github.com/dinglebear-ai/unraid/issues/237)) ([ab53dbc](https://github.com/dinglebear-ai/unraid/commit/ab53dbc7db4a54661e93c48ee01dace950fb386b))
* **deps:** bump rust in /unraid-rs/config ([#216](https://github.com/dinglebear-ai/unraid/issues/216)) ([6e6c652](https://github.com/dinglebear-ai/unraid/commit/6e6c65266b6269e6bb331e1a614b275f1e096164))
* **deps:** bump serde_json from 1.0.150 to 1.0.151 in /unraid-rs ([#245](https://github.com/dinglebear-ai/unraid/issues/245)) ([5165e9e](https://github.com/dinglebear-ai/unraid/commit/5165e9e46c27241a92474008214e98bbeb44e6da))
* **deps:** bump the major group across 1 directory with 3 updates ([#309](https://github.com/dinglebear-ai/unraid/issues/309)) ([b9fcca4](https://github.com/dinglebear-ai/unraid/commit/b9fcca4412949773b583b11987065ab6308a720f))
* **deps:** bump the minor-and-patch group across 1 directory with 7 updates ([#303](https://github.com/dinglebear-ai/unraid/issues/303)) ([009de5b](https://github.com/dinglebear-ai/unraid/commit/009de5b915731d8948f0356816a46e03d640a0b5))
* **deps:** bump toml from 0.8.23 to 1.1.3+spec-1.1.0 in /unraid-rs ([#250](https://github.com/dinglebear-ai/unraid/issues/250)) ([260009e](https://github.com/dinglebear-ai/unraid/commit/260009e2622d10b3600e4786c17b86d7092498ca))
* **deps:** bump tower-http from 0.6.11 to 0.7.0 in /unraid-rs ([#251](https://github.com/dinglebear-ai/unraid/issues/251)) ([a1f993e](https://github.com/dinglebear-ai/unraid/commit/a1f993e51c6409607bc18fa74a9438ae6c2a0cde))
* **deps:** bump ws from 8.21.0 to 8.21.1 in /unraid-py/tests/mock ([#228](https://github.com/dinglebear-ai/unraid/issues/228)) ([a987d25](https://github.com/dinglebear-ai/unraid/commit/a987d25abe0af8e5137ca09081935157c7e4e9a1))

## [0.2.5](https://github.com/dinglebear-ai/unraid-mcp/compare/unraid-rs-v0.2.4...unraid-rs-v0.2.5) (2026-07-27)


### Bug Fixes

* repair npm release contract ([dc7b05b](https://github.com/dinglebear-ai/unraid-mcp/commit/dc7b05bdffc5a412a1a907ef9ea523a1b65239fd))
* repair Rust container publication ([30836dc](https://github.com/dinglebear-ai/unraid-mcp/commit/30836dcdf14e5e0067793884ee95c5d65b880f99))

## [0.2.4](https://github.com/dinglebear-ai/unraid-mcp/compare/unraid-rs-v0.2.3...unraid-rs-v0.2.4) (2026-07-27)


### Bug Fixes

* stabilize releases and destructive elicitation ([941d445](https://github.com/dinglebear-ai/unraid-mcp/commit/941d445a4662db6c822140ed5073a5929c2075e4))


### Documentation

* sync npm launcher README ([734c6c5](https://github.com/dinglebear-ai/unraid-mcp/commit/734c6c52953ff9e0216af75fba4a1c483e9e04ae))

## [0.2.3](https://github.com/dinglebear-ai/runraid/compare/v0.2.2...v0.2.3) (2026-07-23)


### Fixed

* accept numeric BigInt responses ([a377767](https://github.com/dinglebear-ai/runraid/commit/a3777677e5fe7d6346ac51c3d18ff27d85cf3fc6))
* deploy from renamed runraid image ([92176cb](https://github.com/dinglebear-ai/runraid/commit/92176cbc12139fdbfdd6d81d3e4612b3ba72c87d))
* route rust builds through sccache wrapper ([be6b2ab](https://github.com/dinglebear-ai/runraid/commit/be6b2ab505ac7db9744b2655ec1f6c2a0090e97a))

## [Unreleased]

## [0.2.0] - 2026-07-06

### Changed

- Renamed the binary `unraid` → `runraid` (package remains `unraid-rmcp`; env vars and
  the `~/.unraid` data dir are unchanged — only the executable name moved).
- Default MCP port is now **40010** (`config.rs` `default_mcp_port()` and `config.toml`
  agree). Earlier docs referencing 3100/6970 were incorrect.
- The binary loads `~/.unraid/.env` (or `/data/.env` in a container) at startup via
  `dotenvy` before `Config::load`, so it can find its credentials without a process
  manager. The loader is symlink-guarded (a symlinked `.env` is refused) and never
  overrides already-set env vars.
- CI and release builds are now **linux/amd64 only** — the arm64 leg (QEMU-emulated,
  taking 50+ minutes per build) has been dropped from both the Docker image build and
  the release binary matrix. Documented in the README prerequisites.

### Added

- `status` MCP action — a server reachability/health observability action
  (requires `unraid:read`). MCP-only; no CLI command.
- `setup install` and `doctor` CLI commands (CLI-only; not exposed as MCP actions).
- Pagination/filtering on list actions (`limit`/`offset`, plus `state`/`name` filters
  where relevant), returning a `{items, total, limit, offset, has_more, next_offset}`
  envelope (MCP surface).
- ~40 KB truncation cap on MCP tool responses.
- `docker_restart` action (`unraid:admin`), added after re-vendoring
  `schema/unraid-schema.graphql` from `unraid/api@2679fda1` picked up a new
  `DockerMutations.restart` mutation.
- `array_set_state` accepts optional `decryption_password`/`decryption_keyfile`
  (MCP-only — not exposed via the CLI, to avoid putting secrets in shell
  history/process listings), so an encrypted array can be started without the
  web UI unlock step. Also picked up from the same schema re-vendor.
- Full coverage of the remaining Unraid GraphQL surface found via the same
  schema re-vendor (~142 total operations now implemented, up from 111): the
  Docker Organizer subsystem (`docker_create_folder`,
  `docker_create_folder_with_items`, `docker_set_folder_children`,
  `docker_delete_entries`, `docker_move_entries_to_folder`,
  `docker_move_items_to_position`, `docker_rename_folder`; CLI parity for all
  of these), plus `docker_update_view_preferences` /
  `docker_update_autostart_configuration` / `refresh_docker_digests` /
  `reset_docker_template_mappings` / `sync_docker_template_paths` (MCP-only
  for the two JSON-blob ones); `customization_set_locale` /
  `customization_set_theme`; the full Onboarding lifecycle
  (`onboarding_bypass_onboarding`, `onboarding_clear_onboarding_override`,
  `onboarding_close_onboarding`, `onboarding_open_onboarding`,
  `onboarding_resume_onboarding`, `onboarding_refresh_internal_boot_context`,
  `onboarding_create_internal_boot_pool`, `onboarding_set_onboarding_override`
  — the last MCP-only, its input tree is deeply nested); `connect_sign_in`,
  `setup_remote_access`, `enable_dynamic_remote_access` (MCP-only, nested
  input), `update_api_settings`, `update_settings` (MCP-only, raw JSON),
  `update_ssh_settings`, `initiate_flash_backup`, `notify_if_unique`; and the
  `preview_effective_permissions` query.

### Fixed

- GraphQL injection: queries now pass arguments as GraphQL variables instead of
  interpolating them into the query string.
- UTF-8 truncation panic: response truncation no longer splits a multi-byte character.
- `/status` info leak: the endpoint no longer returns server details to unauthenticated
  callers.
- Widened the `/health` upstream reachability probe timeout to 5s and log the
  underlying error cause on failure (was too tight, causing false-negative
  "unreachable" reports under normal upstream latency).
- `quinn-proto` bumped to 0.11.15 for RUSTSEC-2026-0185 (remote memory
  exhaustion via unbounded out-of-order stream reassembly); pulled in
  transitively via `lab-auth` → `reqwest` 0.13.
- Stale plugin-hook contract test (`tests/setup_contract.rs`) that still
  asserted the pre-`e2c22d0` binary-direct hook command instead of the
  current `scripts/plugin-setup.sh` wrapper.

## [0.1.1] - 2026-06-01

### Changed

- Plugin `SessionStart`/`ConfigChange` hooks now call `${CLAUDE_PLUGIN_ROOT}/bin/runraid setup plugin-hook` directly instead of going through the `plugin-setup.sh` shell wrapper. The env-var mapping the script performed (`CLAUDE_PLUGIN_OPTION_*` → `UNRAID_*`) now lives in `apply_plugin_options()` in `src/cli/setup.rs`, hoisted in `run_cli` before `Config::load()` (unraid is template-style: the setup check validates the pre-loaded config). The `CLAUDE_PLUGIN_DATA` → `UNRAID_HOME` re-export was dropped (redundant: `setup_data_dir()` reads `CLAUDE_PLUGIN_DATA` natively).

### Removed

- `plugins/unraid/hooks/plugin-setup.sh` — the wrapper was a pure env-mapping middleman now handled by the binary's `setup plugin-hook` command.

## [0.1.0] - 2026-05-13

### Added

- Initial release of unraid-rmcp
- 24 read-only MCP actions via the Unraid GraphQL API
- RMCP Streamable HTTP transport on port 6970
- stdio MCP transport (`unraid mcp`)
- CLI with human-readable and `--json` output for all 24 actions
- Static bearer token auth and OAuth (Google) auth via lab-auth
- `LoopbackDev` auth bypass when bound to 127.x or `UNRAID_RMCP_DISABLE_HTTP_AUTH=true`
- `unraid://schema/mcp-tool` MCP resource exposing the tool JSON Schema
- `server_summary` MCP prompt
- Integration tests: auth modes, CLI help, OAuth flow, RMCP compat, stdio transport
