# Incus plugin — agent and contributor instructions

This component belongs to the tooling monorepo. Follow [root AGENTS.md](../../AGENTS.md).
Edit this `AGENTS.md`; `CLAUDE.md` and `GEMINI.md` are relative symlinks to it.
Commands below run from `plugins/incus/` unless stated otherwise.

## What this is

An Unraid plugin that runs [Incus](https://linuxcontainers.org/incus/) system containers ("jails"/"dev containers") for isolated coding-agent and stdio-MCP workspaces. Each container gets a dedicated NAT bridge that is firewalled off from the LAN (egress deny-list) while keeping Internet access, so an agent — or a compromised dependency in its toolchain — can't reach the NAS, routers, or other internal services.

The component has three pieces that must be understood together:

1. **`incus.plg` + `source/usr/local/emhttp/plugins/incus/`** — the classic Unraid OS plugin (XML manifest + shell). Ships a private-prefixed, repackaged Incus runtime (from `packages/*.txz`), the daemon lifecycle (`rc.incus`), and array start/stop hooks. This is the only piece that can actually install/run `incusd` — the API plugin below has no way to do OS-level work.
2. **`source/.../scripts/incus-init.sh`** — config-driven, idempotent preseed run on every array start (and via the settings page's Apply button, see below). Reads `/boot/config/plugins/incus/incus.cfg` and ensures the storage pool, the `agent-block-lan` network ACL, the `agentbr0` bridge, and the `agent-jail` profile all exist and match config. Safe to re-run; never hardcodes policy.
3. **`unraid-api-plugin-incus/`** — a NestJS/GraphQL plugin for Unraid's newer `unraid-api` system, plus a `web/` Vue 3 frontend compiled to a custom element embedded in the classic settings page. Manages containers/images at runtime by speaking the Incus REST API directly over its unix socket — never shells out to the `incus` CLI for anything the API can do.

`incus.cfg` is the single source of truth for both the shell init and the API plugin; the API plugin mirrors it into `incus.json` and keeps both in sync (`config-sync.service.ts`).

## Build, test, and typecheck

The backend has a Vitest suite, and classic/package contract checks live under
`tests/`. Verification is: automated tests → typecheck/build → package
consistency → deploy to a disposable real Unraid box → live isolation/health
verification. Do all applicable steps before considering a release done.

**Backend** (`unraid-api-plugin-incus/`):
```bash
cd unraid-api-plugin-incus
npx tsc --noEmit   # typecheck
npm test           # backend unit tests
npx tsc            # build → dist/
```
The API package depends on modules supplied by its Unraid host. A developer
checkout may use symlinks to a separately prepared host dependency tree, but
this is not a clean-checkout guarantee. For reproducible setup, follow the
root `.github/workflows/incus-api-ci.yml` dependency installation, pinned host
package proxies, and `.ci-stubs/unraid-shared` fixture. Do not edit a sibling
repository or create ad hoc dependency symlinks merely to pass typechecking.
CI's proxies do not prove equivalence to every real host version.

**Frontend** (`unraid-api-plugin-incus/web/`):
```bash
cd unraid-api-plugin-incus/web
npx vue-tsc --noEmit   # typecheck
npm run build           # builds BOTH bundles (chains build:settings + build:dashboard):
                        #   ../dist-web/incus-settings.{js,css}     (full settings app)
                        #   ../dist-web-dashboard/incus-dashboard.js (small Main/Dashboard widget)
```
The settings app remains a Vue 3 custom element (`<incus-settings-app>`), but
it is not a single-file bundle: Vite emits the `incus-settings.js` ES-module
entry, CSS, shared hashed chunks, and an intentionally lazy-loaded Terminal
chunk. Ship every file in `dist-web/` together. It inherits Unraid's own CSS
variables (`--primary` etc., driven by the host page's light/dark mode) rather
than shipping its own palette; don't introduce a separate color system.

## CI

`.github/workflows/incus-api-ci.yml` tests/typechecks/builds the backend and
typechecks/builds both frontend bundles. Host-provided dependency proxies and
GitHub Actions are pinned. `.github/workflows/incus-classic-ci.yml` validates
the plugin XML, shell sources, checksums, required archive inventory, source vs
archive drift, shrinkage, and embedded manifest. The opt-in privileged live
boundary suite remains a disposable-Unraid release gate rather than hosted CI.

## Deploying to a real box

Release artifacts are coordinated by `release-manifest.json`. Use
`scripts/build-classic-package.sh NEW_BUILD PREVIOUS_TXZ` only after backend and
frontend builds: it carries forward the complete prior binary payload, overlays
tracked source, refreshes the embedded manifest, and stages the matching API
backend when `dist/` exists. Then update both checksum entities and run
`scripts/verify-classic-package.sh`.

- **Classic `.plg` / OS package**: every content change requires a new package build number. Never build from `source/` alone; the build helper overlays it onto the prior complete archive. The installer verifies SHA-256 before `upgradepkg` and retains one prior archive.
- **`unraid-api-plugin-incus` backend**: release packages stage `dist/`, metadata, and locked production dependencies under the classic plugin. `install-api-plugin.sh` atomically switches `/usr/local/unraid-api/node_modules/unraid-api-plugin-incus`, reloads, checks `/var/log/graphql-api.log`, and rolls back on failure. `uninstall-api-plugin.sh` removes and reloads it during classic uninstall.
- **Frontend**: the built `dist-web/incus-settings.{js,css}` get copied into `source/usr/local/emhttp/plugins/incus/web/` before repackaging the OS `.txz` — it ships as part of the classic plugin, not the API plugin.

Canonical release gates:

```bash
cd unraid-api-plugin-incus && npm test && npx tsc --noEmit && npx tsc
cd web && npx vue-tsc --noEmit && npm run build
cd ../../ && ./scripts/verify-classic-package.sh && ./tests/classic-contract.sh
# disposable Unraid only:
INCUS_LIVE_TEST=1 ./tests/classic-contract.sh
```

## Architecture notes that aren't obvious from reading one file

- **Incus REST API, not CLI.** All three services in `src/` (`incus.service.ts`, `incus-exec.service.ts`, `incus-image-builder.service.ts`'s image-store calls) talk to `$INCUS_DIR/unix.socket` directly via `node:http`. Async operations return a generic "Operation" envelope reused for every endpoint — the operation-type-specific payload is nested **two levels deep** (`response.metadata.metadata.<field>`, not `response.metadata.<field>`). Launching from a locally-built image needs `source: { type: "image", alias }` with **no** `protocol`/`server` fields; those fields are only for remote simplestreams references (`images:debian/trixie/cloud` etc.) and launching a local alias with them set makes Incus look for it on the public remote instead.
- **The GraphQL schema has two sources that must stay in sync.** Most types/resolvers are decorator-based (`@ObjectType`, `@Resolver`), but `index.ts` also hand-maintains a `graphqlSchemaExtension` SDL string for `extend type Query`/`Mutation` fields (and some object types). When adding a query/mutation, update both the resolver *and* this string, or the field won't resolve.
- **`class-validator` decorators are mandatory on every `@InputType` field.** `unraid-api`'s global `ValidationPipe` runs in whitelist mode — a GraphQL `@Field()` alone isn't enough; a field missing `@IsString()`/`@IsOptional()`/etc. gets silently stripped with a "property X should not exist" rejection at the whitelist layer, not a helpful type error.
- **The exec/terminal feature rides GraphQL subscriptions**, not a custom WebSocket gateway — `graph.module.ts` already wires `graphql-ws` on the same `/graphql` endpoint, and subscriptions go through the same `AuthenticationGuard` a custom gateway wouldn't at handshake time.
- **Package/tool imports are all client-side, best-effort translators**, not new backend surface: devcontainer.json, mise.toml, and `.tool-versions` import (in `web/src/App.vue`) parse the file, map what has a confident mapping onto the existing distro/package/post-install-command fields, and explicitly report what they couldn't map rather than guessing or dropping it silently. `mise.toml`/`.tool-versions` tool pins aren't OS packages — they're realized by baking `mise` itself into the image via its official installer as a post-install action, installed system-wide (not under the build's root user's home) so the container's actual runtime user can use it.
- **`incus-init.sh` and `rc.incus` must redirect stdin from `/dev/null`** on every bare `incus` CLI invocation — several subcommands (confirmed: `profile create`) hang forever waiting on stdin otherwise, even in a non-interactive script context.
- **`incusd` needs `nft` and `unsquashfs` on `PATH`, bundled or the ACL/build steps hang** (not fail — hang indefinitely) rather than erroring. `incus-preflight.sh` checks for these; if it's green but something still hangs, suspect a missing bundled binary a preflight check doesn't yet cover.
- **Terminology**: user-facing copy says "dev containers" / "container", not "jail" — but internal identifiers (GraphQL `Jail` type, `JailAction` enum, `jailBridge`/`JAIL_*` config keys, `launchJail`/`deleteJail` mutations) intentionally still say "jail" throughout the codebase. This is a deliberate scope decision — don't rename the internals to match the UI copy.

## Work tracking and completion

Use `bd prime` when configured; do not auto-migrate a shared Beads store.
Follow [root AGENTS.md](../../AGENTS.md) for validation and authorized pushes.
Preserve other work and never clear stashes as incidental cleanup. A release
still requires the disposable-host gates above; documentation checks do not
constitute a live deployment test.
