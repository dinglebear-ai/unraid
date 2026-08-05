# syntax=docker/dockerfile:1.7

# Builder Rust version MUST stay >= the `rust-version` (MSRV) declared in Cargo.toml
# (currently 1.90). 1.90 matches the MSRV exactly and is intentionally chosen here. Do NOT downgrade
# below the MSRV, and bump deliberately — CI uses floating `stable`, so this pin is
# the one fixed Rust version in the build matrix.
# TODO: digest-pin (rust:1.90-slim-bookworm@sha256:...) for fully reproducible builds.
FROM rust:1.97-slim-bookworm AS builder

WORKDIR /app
RUN apt-get update && apt-get install -y pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*

# There is deliberately NO stub-binary "cache deps" layer here. Building a stub
# first ran build.rs — which is what registers the cynic schema — and cargo then
# considered build.rs fresh for the real build, so the schema module generated
# against the stub was reused. Enum-typed fields (VmDomain.state,
# UnraidArray.state, Registration.state) came out inaccessible and the lib failed
# to compile. The cargo cache mounts below already cache dependency compilation
# across builds, so the stub layer bought nothing. Do not reintroduce it.
COPY Cargo.toml Cargo.lock ./
# build.rs + the vendored SDL must be present before any `cargo build`: build.rs
# calls cynic_codegen::register_schema(...).from_sdl_file("schema/unraid-schema.graphql"),
# and without them the cynic `#[cynic::schema("unraid")]` derives fail to compile with
# "you requested a schema named unraid but it doesn't look like you've registered any".
COPY build.rs ./
COPY schema/ schema/
# Strip xtask workspace member — not needed in Docker build context
RUN sed -i 's/, \"xtask\"//g; s/\"xtask\", //g; s/\"xtask\"//g' Cargo.toml

# crates/ must be copied: crates/lab-auth is a workspace member and a path
# dependency of unraid-rmcp, so cargo refuses to load the workspace without it.
# It was missing entirely, which is why the image build failed with
# "failed to load manifest for workspace member /app/crates/lab-auth".
COPY crates/ crates/
COPY src/ src/
RUN --mount=type=cache,id=unraid-cargo-registry,target=/usr/local/cargo/registry,sharing=locked \
    --mount=type=cache,id=unraid-cargo-git,target=/usr/local/cargo/git,sharing=locked \
    --mount=type=cache,id=unraid-cargo-target,target=/app/target,sharing=locked \
    cargo build --release --locked -p unraid-rmcp && cp target/release/runraid /usr/local/bin/runraid

# Runtime image — minimal Debian with TLS certs and curl for healthcheck
# TODO: digest-pin (debian:bookworm-slim@sha256:...) for fully reproducible builds.
FROM debian:bookworm-slim
# curl is intentionally installed: the Docker HEALTHCHECK below (and the compose
# healthcheck) probe http://localhost:40010/health, and the runraid binary has no
# self-probe subcommand. ca-certificates is needed for outbound TLS to the Unraid
# GraphQL API; gosu is used by entrypoint.sh to drop from root to 1000:1000.
# --no-install-recommends + cleaning apt lists in the same layer keeps the image lean.
RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates curl gosu && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /usr/local/bin/runraid /usr/local/bin/runraid
COPY entrypoint.sh /entrypoint.sh

RUN groupadd --gid 1000 unraid && \
    useradd --uid 1000 --gid unraid --no-create-home --shell /sbin/nologin unraid && \
    mkdir -p /data && chown unraid:unraid /data && \
    chmod +x /entrypoint.sh

ENV RUST_LOG=info

VOLUME ["/data"]

EXPOSE 40010/tcp

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -sf http://localhost:40010/health || exit 1

LABEL io.modelcontextprotocol.server.name="tv.tootie/unraid-rmcp"

# entrypoint validates env, sets up /data, then drops to 1000:1000
ENTRYPOINT ["/entrypoint.sh"]
CMD ["serve", "mcp"]
