# Technology choices — unraid-rmcp

## Workspace and compiler

The build root is `unraid-rs/`, not the policy-only Cargo workspace above it.
Its members are the server/CLI package `unraid-rmcp`, frozen compatibility crate
`crates/lab-auth`, and automation crate `xtask`. The server binary is `runraid`.
The workspace uses edition 2024 and MSRV 1.97.1; the selected build toolchain
is also 1.97.1. See [Cargo.toml](../../Cargo.toml),
[Cargo.lock](../../Cargo.lock), and [root mise](../../../.mise.toml).

## Runtime and protocol

Tokio supplies the asynchronous runtime. The manifest explicitly enables
`rt-multi-thread`, `macros`, `net`, and `signal`, rather than the `full` feature.
Axum and Tower compose HTTP routing and middleware. RMCP owns the protocol
lifecycle, Streamable HTTP, stdio, schemas, and elicitation. The current exact
RMCP requirement and lock resolution are 3.1.0; inspect both when upgrading.

MCP projection is application policy: `legacy` exposes `unraid(action=...)`,
`atomic` exposes `unraid_<action>`, and `both` provides both surfaces. All route
to the same canonical action execution and authorization.

## Typed GraphQL with flexible presentation

Cynic operations in `src/gql_typed.rs` are compile-time checked against the
vendored SDL through `build.rs`. The existing reqwest 0.12 client supplies
HTTP transport using JSON and rustls, without cynic's `http-reqwest` feature.
Typed results are serialized to `serde_json::Value` for the service, CLI, and
MCP boundary. This is not an untyped-query architecture.

The trade-off is deliberate: schema/type errors surface earlier, while output
formatters retain flexible JSON handling. Compile-time validation cannot prove
a deployed server honors its schema. Scenario fixtures, runtime compatibility
fallbacks, and explicit live validation cover different parts of that gap.
BigInt fields often arrive as strings; preserve defensive string/number
handling in formatters instead of silently substituting zero.

## Authentication and configuration

`crates/lab-auth` is a frozen, local compatibility crate consumed by version
and path. It supplies bearer/OAuth middleware and state. It is not a private
Git dependency. MCP reads require `unraid:read`; mutations require
`unraid:admin`; admin satisfies read. Destructive-operation confirmation is
an additional gate. CLI/stdio local execution has a different trust boundary
from authenticated HTTP.

TOML and environment settings are loaded by `src/config.rs`. Follow that
loader and [component AGENTS](../../AGENTS.md) for precedence and persisted
credentials. `UNRAID_API_CA_BUNDLE` supports a trusted PEM bundle; do not
recommend disabling TLS verification as the default certificate fix.

## Observability and testing

Tracing sends diagnostics to stderr so stdio stdout stays protocol-safe.
`anyhow` carries contextual errors across the client/service boundary;
structured MCP error handling is at the server edge. The process exposes a
health endpoint and action counters, not an ingestion database.

Tests use the `test-support` feature, scenario fixtures, wiremock, and
apollo-compiler schema validation. Cargo-nextest drives `just test` and the
main test CI lane. The small `xtask` package has focused automation tests.
See [development gates](../../../docs/DEVELOPMENT.md).

## Trade-offs and non-goals

The server is a live API proxy, not a local copy of the NAS state. Scope and
confirmation policy permit both reads and writes; it is not monitoring-only.
Projection changes the client-visible schema, not storage, transport, or the
execution backend. Keep these boundaries distinct when adding operations.

See [ARCH.md](ARCH.md) for request flow and [README](../../README.md) for usage.
