# incus-unraid — LAN-Banned Agent Dev Containers for Unraid

Run coding agents and stdio MCP servers inside Incus system containers on
Unraid. Each container gets a dedicated IPv4 NAT bridge whose default egress
ACL rejects RFC1918, link-local, and Tailscale CGNAT ranges while preserving
public Internet access. IPv6 is deliberately disabled until equivalent IPv6
policy exists. This is deny-list containment, not a general security boundary:
operators must test their actual NAS/router/service addresses and any explicit
allow-holes before placing untrusted workloads inside it.

Modeled on the pattern from [weisser-zwerg.dev's Incus Codex Jail](https://weisser-zwerg.dev/posts/incus-codex-jail/), adapted for Unraid's plugin system and RAM-booted Slackware environment.

User-facing copy says "dev containers"; internal identifiers (GraphQL `Jail`
type, `JAIL_*` config keys, `launchJail`/`deleteJail` mutations) still say
"jail" throughout the codebase — a deliberate naming split, not drift.

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                     Unraid Host                      │
│                                                      │
│  incus.plg ─── installs ──→ /usr/local/incus/        │
│       │                     (binaries + bundled libs) │
│       │                                              │
│       ├── rc.incus ─────→ start/stop incusd          │
│       │                                              │
│       ├── incus-init.sh ─→ storage pool              │
│       │                    agent-block-lan ACL        │
│       │                    agentbr0 bridge            │
│       │                    agent-jail profile         │
│       │                                              │
│  unraid-api-plugin-incus                             │
│       ├── NestJS module ──→ Incus REST API           │
│       │                     (unix socket, no CLI)    │
│       └── web/ (Vue 3 custom element) ──→ embedded in │
│                    the classic settings page         │
│                                                      │
│  ┌─── agentbr0 (198.18.0.1/24) ───┐                 │
│  │  agent1   agent2   agent3  ...  │                 │
│  │  ✓ Internet  ✗ LAN/NAS/tailnet │                 │
│  └─────────────────────────────────┘                │
└──────────────────────────────────────────────────────┘
```

## The Three Pieces

1. **`incus.plg` + `source/`** — Classic Unraid plugin (XML manifest + shell).
   Lays down the repackaged Incus runtime (`packages/*.txz`) at
   `/usr/local/incus/` (private-prefixed, no system-path pollution), the
   daemon lifecycle (`rc.incus`), and array start/stop hooks. This is the
   only piece that can actually install/run `incusd` — the API plugin has no
   way to do OS-level work.

2. **`incus-init.sh` (config-driven preseed)** — Runs on every array start
   (and via the settings page's Apply button). Reads `incus.cfg` and
   idempotently ensures the storage pool, the `agent-block-lan` network ACL,
   the `agentbr0` bridge, and the `agent-jail` profile all exist and match
   config. Safe to re-run (check-then-create); never hardcodes policy.

3. **`unraid-api-plugin-incus/`** — NestJS/GraphQL plugin for Unraid's newer
   `unraid-api` system, plus a `web/` Vue 3 frontend compiled to a custom
   element (`<incus-settings-app>`) embedded in the classic settings page.
   Manages containers and images at runtime by speaking the **Incus REST API
   directly over its unix socket** — never shells out to the `incus` CLI for
   anything the API can do. `incus.cfg` is the single source of truth for
   both the shell init and the API plugin; the API plugin mirrors it into
   `incus.json` and keeps both in sync.

## Configuration (`/boot/config/plugins/incus/incus.cfg`)

Single source of truth for both the shell init and the API plugin. Current defaults:

| Key | Default | Notes |
|---|---|---|
| `SERVICE` | `disabled` | Set to `enabled` to autostart on array start |
| `INCUS_DIR` | `/mnt/user/appdata/incus` | Persistent daemon state — must be on the array |
| `STORAGE_DRIVER` | `dir` | `dir` needs no existing pool and always works — the default. `zfs` is opt-in (site-specific pool layout, no safe auto-detect) |
| `STORAGE_SOURCE` | `nvme/incus` | Only used when `STORAGE_DRIVER=zfs`; ignored for `dir` |
| `STORAGE_POOL_NAME` | `default` | Incus storage pool name |
| `JAIL_BRIDGE` / `JAIL_SUBNET` | `agentbr0` / `198.18.0.1/24` | RFC 2544 benchmark range, won't collide with home LANs |
| `JAIL_NAT` / `JAIL_IPV6` | `true` / `none` | IPv6 must remain `none`; initialization fails closed otherwise |
| `ACL_BLOCK` | `10.0.0.0/8,172.16.0.0/12,192.168.0.0/16,169.254.0.0/16,100.64.0.0/10` | LAN, link-local, and Tailscale CGNAT egress reject list |
| `ACL_ALLOW` | *(empty)* | Allow-holes punched before the block rules (e.g. a local LLM / Axon) |
| `ACL_DEFAULT_EGRESS` / `ACL_DEFAULT_INGRESS` | `allow` / `drop` | Deny-list model — Internet allowed by default, block rules still apply |
| `JAIL_IMAGE` | `images:debian/trixie/cloud` | Must be a `/cloud` variant for cloud-init |
| `JAIL_NESTING` | `false` | `true` = nested docker/incus inside the container |
| `JAIL_CPU` / `JAIL_MEMORY` | `2` / `4GiB` | Empty = no cap |
| `JAIL_WORKSPACE_ROOT` | `/srv/agent-jails` | Host dir holding per-container workspaces, bind-mounted with idmap shifting. It must resolve beneath `/srv` or `/mnt`, use real persistent storage rather than tmpfs, and ideally use a real device mount rather than `/mnt/user` (FUSE doesn't support idmapped mounts). |
| `JAIL_AGENT_UID` / `JAIL_AGENT_GID` | `1000` / `1000` | In-container agent user uid/gid |
| `JAIL_BIND_MOUNTS` | *(empty)* | Comma-separated `host:container[:ro|rw]` triples. Sources must resolve beneath `/srv` or `/mnt`, or beneath `/boot/config/plugins/incus/bind-mounts`; mode defaults to `ro`, and sources in the plugin bind directory must remain `ro`. Copy curated agent config there rather than exposing host home/system paths. |
| `TS_AUTHKEY` | *(empty)* | When set, newly launched containers run `tailscale up --authkey=...` on launch — best-effort, silently skipped if the image lacks `tailscale` |

## Features

- **Settings UI** — a tabbed Vue 3 page (Builder / Dev containers / Config)
  embedded in Unraid's classic settings, talking to the API plugin over
  GraphQL.
- **Containers tab** — live dashboard of running containers with resource
  usage, a Launch form (pick any tracked built image or the configured
  default), and a per-container **Details** panel showing the config Incus
  actually merges from profile + instance overrides (image, profiles,
  storage pool, bridge, effective CPU/memory limits, `/workspace` host path)
  — CPU limit, memory limit, and workspace path can each be overridden or
  reset back to the profile default independently. Every container gets its
  own workspace subdirectory by default, so concurrent containers don't
  share writes.
- **Builder tab** — builds custom container images with `distrobuilder`
  (bundled under the same private prefix as `incusd`), tracked in an image
  registry with master/variant support (one "golden master" image is
  exclusive and becomes the default new containers launch from). Package
  selection is a single unified search box hitting apt/npm/PyPI/Homebrew
  concurrently and merging results into one relevance-ranked list — apt
  results become OS packages, npm/PyPI results become post-install commands.
  Starting points include saveable presets, previously built images, and
  best-effort imports from `devcontainer.json` (maps base image + recognized
  features), `mise.toml` / `.tool-versions` (bakes `mise` itself into the
  image system-wide via its official installer, pinning the declared tool
  versions), and dotfiles-repo bootstrap via `mise bootstrap`. Imports report
  what they couldn't map rather than guessing or dropping it silently.
- **Config tab** — edits every `incus.cfg` key above through the UI,
  including chip-based CIDR editors for Blocked CIDRs / Allow-holes
  (type-a-CIDR-and-press-Add/Enter, validated, duplicates rejected) instead
  of a raw comma-separated text field.
- **Exec/terminal** — in-container shell access over GraphQL subscriptions
  (`graphql-ws` on the same `/graphql` endpoint as the rest of the API).

## Install and compatibility

The classic `.plg` and the `unraid-api-plugin-incus` backend are separate host
integration points. A release package may carry the matching API payload and
install it transactionally; older/classic-only artifacts do not. Requirements:

- x86_64 Unraid host with glibc 2.38 or newer and user namespaces;
- a real persistent `INCUS_DIR` and workspace root;
- Node.js 22-compatible `unraid-api` when using the settings/backend features;
- release values matching `release-manifest.json`.

1. Install the `.plg` from Community Apps or the anonymous direct URL
   `https://raw.githubusercontent.com/dinglebear-ai/unraid-mcp/main/plugins/incus/incus.plg` — it lays down
   the repackaged Incus runtime under `/usr/local/incus/` and a default
   `incus.cfg` (never overwriting an existing one).
2. Check `/var/log/syslog` for either `API plugin installed and verified` or
   the explicit `classic-only mode` message. In classic-only mode, the Incus
   CLI/lifecycle works but the Settings tabs, builder registry, GraphQL launch,
   dashboard widget, and browser terminal require deployment of the API plugin.
3. For a development/manual API deployment, build `unraid-api-plugin-incus`,
   stage its `dist/`, `package.json`, and locked production `node_modules` as
   `/usr/local/emhttp/plugins/incus/api-plugin/`, then run:

   ```bash
   /usr/local/emhttp/plugins/incus/scripts/install-api-plugin.sh
   tail -f /var/log/graphql-api.log
   ```

   The installer verifies a fresh post-restart module-init log entry, keeps
   `/usr/local/unraid-api/node_modules/unraid-api-plugin-incus.rollback`, and
   restores it if reload verification fails.
4. Edit `/boot/config/plugins/incus/incus.cfg` (or use the Config tab after
   API verification): set `SERVICE=enabled`, adjust
   `JAIL_WORKSPACE_ROOT` to a real device mount, and `STORAGE_SOURCE` if
   using `zfs`.
5. Start the array (or manually: `/etc/rc.d/rc.incus start &&
   /usr/local/emhttp/plugins/incus/scripts/incus-init.sh`).
6. Preflight gates the daemon. Check `/var/log/incusd.log` and
   `$INCUS_DIR/plugin-health`; failed startup rolls back partial daemon/lxcfs
   state. Config Apply restores `incus.cfg.known-good` on reconciliation failure.

To uninstall, use the Unraid plugin manager. It stops Incus, removes the API
backend and reloads `unraid-api`, then removes the classic package while leaving
`INCUS_DIR` and flash configuration for recovery. Back up those paths before
manually deleting persistent data.

## Launch a Container

```bash
# CLI (uses the private-prefixed incus binary)
/usr/local/incus/bin/incus launch images:debian/trixie/cloud agent1 \
  --profile default --profile agent-jail

# Verify representative policy paths (also run tests/live-isolation.sh on a
# disposable host and test your actual NAS/router/service addresses)
incus exec agent1 -- nc -vz -w2 1.1.1.1 443        # ✓ Internet
incus exec agent1 -- nc -vz -w2 192.168.1.1 22     # ✗ BLOCKED
incus exec agent1 -- nc -vz -w2 100.64.0.1 443     # ✗ tailnet BLOCKED
incus exec agent1 -- ip -6 route                    # no IPv6 default route
```

Or via GraphQL once the API plugin is loaded (or from the settings page's
Containers tab):
```graphql
mutation { launchJail(name: "agent1") }
```

## Safety Model

- **No system-lib pollution** — Incus runs from `/usr/local/incus/` with a
  scoped `LD_LIBRARY_PATH`; nothing else on the box sees its libraries.
- **Transactional lifecycle** — Preflight runs before startup; later readiness
  failure cleans up incusd/lxcfs/PID state. `incusd` also needs `nft` and `unsquashfs` on `PATH` or the
  ACL/build steps hang rather than error.
- **RAM-boot escape hatch** — Reboot restores a pristine OS; only
  `INCUS_DIR` (on the array) persists.
- **Container egress is deny-listed** via Incus network ACLs (nftables under
  the hood). Default blocked IPv4 ranges are listed above; explicit allow-holes
  reduce containment and must be reviewed and tested.

## Release, verification, and rollback

`MANIFEST.md` documents the exact artifact hash, provenance limits, build
procedure, and payload boundary. Maintainers must run backend tests/typechecks,
frontend typecheck/build, `scripts/verify-classic-package.sh`, and the live
isolation suite before release. The installer verifies SHA-256 before privileged
installation and retains one previous `.txz`; API deployment retains one prior
backend directory. A failed coordinated API activation automatically restores
both layers (or removes a partial fresh install). The repository and direct
plugin manifest are public; Community Apps availability still depends on
successful portal validation, scan, clean-system testing, and manual review.

## Repository Structure

```
incus-unraid/
├── incus.plg                         # Unraid plugin manifest (XML)
├── packages/
│   └── incus-unraid-*.txz            # Repackaged Incus binaries + emhttp tree
├── source/usr/local/emhttp/plugins/incus/
│   ├── IncusSettings.page             # Classic settings page entry point
│   ├── incus.cfg                      # Default config
│   ├── scripts/
│   │   ├── rc.incus                   # Daemon lifecycle
│   │   ├── incus-env.sh               # LD_LIBRARY_PATH scoping
│   │   ├── incus-preflight.sh         # Host capability check
│   │   ├── incus-init.sh              # Config-driven preseed
│   │   └── apply-settings.sh          # Settings page "Apply" handler
│   ├── event/
│   │   ├── disks_mounted              # Array-start hook
│   │   └── unmounting_disks           # Array-stop hook
│   ├── templates/
│   │   └── agent-jail-profile.yaml.tmpl
│   └── web/
│       └── incus-settings.{js,css}    # Built Vue 3 custom element (from web/)
└── unraid-api-plugin-incus/          # NestJS/GraphQL API plugin
    ├── index.ts                       # Plugin entry point + GraphQL SDL extension
    ├── src/
    │   ├── incus.service.ts           # Incus REST API client
    │   ├── incus-exec.service.ts      # Exec/terminal over GraphQL subscriptions
    │   ├── incus-image-builder.service.ts   # distrobuilder image builds
    │   ├── incus-package-search.service.ts  # apt/npm/PyPI/Homebrew search
    │   ├── incus-builder-presets.service.ts # Saveable builder presets
    │   ├── incus.resolver.ts          # GraphQL resolvers
    │   ├── config.entity.ts           # Config entity
    │   └── config-sync.service.ts     # incus.cfg <-> incus.json sync
    ├── web/                            # Vue 3 frontend source (builds to dist-web/)
    ├── package.json
    └── tsconfig.json
```

## License

MIT — see [LICENSE](../../LICENSE).

Not affiliated with the LinuxContainers/Incus project or Unraid.
