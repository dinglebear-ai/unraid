# Technology Stack Documentation -- unraid-rmcp

## Files

| File | Description |
|------|-------------|
| [ARCH.md](ARCH.md) | Architecture overview: GraphQL proxy layering, MCP + CLI surfaces |
| [TECH.md](TECH.md) | Technology choices and crate-selection rationale |

## Stack summary

- **Language**: Rust, edition 2021, MSRV **1.90** (pinned in `rust-toolchain.toml`,
  root `.mise.toml`, and `Cargo.toml`'s `rust-version` — keep all three in sync)
- **Workspace**: 3 members — root `unraid-rmcp` + `crates/lab-auth` + `xtask`
- **Crate / binary**: package `unraid-rmcp`, binary **`runraid`**
- **MCP framework**: `rmcp` — declared `1.6.0` in `Cargo.toml`, but the caret range
  resolves to **1.8.0** in `Cargo.lock`. Trust the lockfile, not the manifest.
- **GraphQL**: `cynic` typed operations checked against the vendored SDL at compile
  time (`build.rs` + `schema/unraid-schema.graphql`)
- **HTTP**: `reqwest` 0.12 (not cynic's `http-reqwest`, which wants 0.13) + `axum`
- **Auth**: `crates/lab-auth` — a *frozen local copy*, not the `dinglebear-ai/labby`
  git dependency the other rmcp services pull
- **Async**: Tokio
- **Default port**: **40010**
- **Testing**: `cargo test` + scenario-driven offline mock behind the `test-support`
  feature; `tests/schema_contract.rs` validates every query and fixture against the SDL

## Surface note

`unraid-rmcp` is **not** read-only. `ACTIONS` in `src/mcp/schemas.rs` is the single
source of truth and currently carries both `Scope::Read` queries and `Scope::Write`
mutations (Docker/VM lifecycle, array start/stop, parity control, notification
writes). Reads need `unraid:read`; writes need `unraid:admin`.

## Cross-References

- [../../CLAUDE.md](../../CLAUDE.md) -- Component dev guide (module map, adding an action)
- [../RUST.md](../RUST.md) -- Rust conventions
- [../QUICKSTART.md](../QUICKSTART.md) -- Getting running
