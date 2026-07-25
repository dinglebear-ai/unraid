# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
