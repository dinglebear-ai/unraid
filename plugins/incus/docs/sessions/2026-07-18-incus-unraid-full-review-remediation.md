---
date: 2026-07-18 21:19:56 EST
repo: git@github.com:jmagar/incus-unraid.git
branch: main
head: 2ae8aeb57c552cfe5fd2bd41134ab39466c12d85
session id: a16bb1e2-c32c-4cd3-af1f-6d1c28f914b9
transcript: /home/jmagar/.claude/projects/-home-jmagar-workspace-incus-unraid/a16bb1e2-c32c-4cd3-af1f-6d1c28f914b9.jsonl
working directory: /home/jmagar/workspace/incus-unraid
worktree: /home/jmagar/workspace/incus-unraid
pr: "#6 Full-repository review remediation (https://github.com/jmagar/incus-unraid/pull/6), merged"
beads: >-
  codex-full-review-20260718-2es, codex-full-review-20260718-2es.1,
  codex-full-review-20260718-2es.2, codex-full-review-20260718-2es.3,
  codex-full-review-20260718-pwd, codex-full-review-20260718-vxw,
  codex-full-review-20260718-5za, codex-full-review-20260718-lq1,
  codex-full-review-20260718-fp5, codex-full-review-20260718-m0o,
  codex-full-review-20260718-65q, codex-full-review-20260718-s2w,
  codex-full-review-20260718-0zt, codex-full-review-20260718-67f,
  codex-full-review-20260718-7jk, codex-full-review-20260718-kne,
  codex-full-review-20260718-384, codex-full-review-20260718-1n3,
  codex-full-review-20260718-2s4, codex-full-review-20260718-3vk,
  codex-full-review-20260718-9yl, codex-full-review-20260718-6np,
  codex-full-review-20260718-der, codex-full-review-20260718-fjc,
  codex-full-review-20260718-k49, codex-full-review-20260718-neu,
  codex-full-review-20260718-dnl, codex-full-review-20260718-jo7,
  codex-full-review-20260718-2od, codex-full-review-20260718-35g,
  codex-full-review-20260718-8d1, codex-full-review-20260718-4ix,
  codex-full-review-20260718-7bf, codex-full-review-20260718-nmm,
  codex-full-review-20260718-1q4, codex-full-review-20260718-48k,
  codex-full-review-20260718-gr4, codex-full-review-20260718-jt1,
  codex-full-review-20260718-0qj, codex-full-review-20260718-2gr,
  codex-full-review-20260718-iug, codex-full-review-20260718-tzs,
  codex-full-review-20260718-18g, codex-full-review-20260718-2ok,
  codex-full-review-20260718-bme, codex-full-review-20260718-5dv,
  codex-full-review-20260718-exp, codex-full-review-20260718-myl,
  codex-full-review-20260718-4rs, codex-full-review-20260718-2xg,
  codex-full-review-20260718-xhc, codex-full-review-20260718-4b8,
  codex-full-review-20260718-714
---

# Full repository review, remediation, and merge

## User Request

Create and enter a new worktree, remove stale `.full-review` state, run the exact
`comprehensive-review:full-review` workflow against the entire repository without
stopping after phase 2, fix every P0 through P3 finding in parallel, open a PR,
run Lavra review, address every follow-up finding, merge to `main`, sync, clean
stale state, report all fixes, and save the session.

## Session Overview

The full five-phase review covered all 204 tracked files and reported 69 initial
findings: 1 P0, 23 P1, 33 P2, and 12 P3. Parallel backend, frontend, and classic
plugin lanes fixed every source-addressable finding, then repeated Lavra and PR
review passes found and closed additional security, lifecycle, concurrency,
packaging, accessibility, and CI gaps. PR #6 merged as `2ae8aeb`; final `main` is
clean, synchronized, and passed both post-merge workflows.

The only review item requiring owner action is anonymous publication. The
repository remains private, so the raw GitHub installer URLs cannot serve
unauthenticated users. That limitation is documented and tracked rather than
being hidden or resolved through an unauthorized visibility change.

## Sequence of Events

1. Created `/home/jmagar/workspace/incus-unraid/.worktrees/codex-full-review-20260718` on `codex/full-review-20260718` and removed prior `.full-review` state.
2. Ran the cached comprehensive-review 1.3.1 workflow through all phases, using the user's advance approval to continue beyond the phase-2 checkpoint.
3. Recorded the 69-finding report and split remediation into backend, frontend, and classic/package lanes handled by parallel agents.
4. Integrated the fixes, ran backend/frontend/classic gates, rebuilt classic package build 46, committed, pushed, and opened PR #6.
5. Fixed initial CI portability and executable-mode failures, then ran Lavra security/operations, backend/architecture, and frontend/UX reviews in parallel.
6. Repeated the review/fix cycle until all three lenses reported no actionable P0-P3 findings; also addressed external PR comments and late CodeRabbit findings.
7. Rebuilt and rehashed the coordinated `.txz` after every payload-changing pass and added CI proof that the embedded backend matches freshly compiled source.
8. Merged PR #6, fast-forwarded `main`, waited for post-merge backend and classic CI, and removed the feature worktree plus local/remote feature branches.
9. Closed stale PR #4 because it conflicted with current `main` and contradicted the retained internal `Jail` naming contract; closed stale generated-doc PR #5 because its text predated the review and claimed there were no automated tests.
10. Ran `vibin:repo-status`: one clean `main` worktree, no extra branches, no open PRs, and both current workflows green.
11. Ran the save-to-md maintenance pass, updated Beads state, and created follow-up issues for publication, development advisories, stale agent guidance, Dolt reconciliation, and OpenWiki validation.

## Key Findings

- The original ACL allowed containers to reach the Incus host through the bridge gateway. The final policy blocks the bridge subnet and Tailscale CGNAT while retaining narrow DNS exceptions; IPv6 fails closed (`source/usr/local/emhttp/plugins/incus/scripts/incus-init.sh:35`).
- User-configurable bind sources and workspace roots needed canonical containment checks in both the API and classic apply/init paths. Shared classic validation now rejects unsafe disabled configurations before they can become known-good (`source/usr/local/emhttp/plugins/incus/scripts/config-validation.sh:1`).
- Terminal sessions needed pre-await capacity reservation, input limits, idle/lifetime cleanup, and both socket channels closed on every path (`unraid-api-plugin-incus/src/incus-exec.service.ts:54`).
- Frontend polling could overlap, continue after unmount, or accept stale responses. The shared controller now serializes calls, aborts on stop, respects visibility, and uses an explicit 2-second job interval (`unraid-api-plugin-incus/web/src/lib/polling.ts:6`).
- A passing source build did not prove the committed classic archive contained that build. CI now extracts the `.txz` and byte-compares its API payload and metadata to fresh output, and package/manifests trigger that workflow (`.github/workflows/api-plugin-ci.yml:3`, `.github/workflows/api-plugin-ci.yml:68`).
- Build 46 is verifiable but not reproducible from original upstream inputs because immutable Debian source/package inputs are absent (`MANIFEST.md:6`, `MANIFEST.md:13`).
- The injected Claude transcript is a 52,858,941-byte historical repo transcript beginning July 6, not a transcript of this Codex review session. It was consulted only for repository history; current-session facts came from live Git, PR, Beads, and command evidence.

## Technical Decisions

- Kept internal `Jail` GraphQL/config identifiers while using “dev container” in user-facing copy, matching the repository's explicit compatibility boundary.
- Used a versioned fail-closed migration for containment changes and forced `JAIL_IPV6=none` in backend, classic, loaded UI state, and submitted payloads rather than exposing unsupported IPv6 security.
- Kept bind mounts read-only by default; writable mounts are accepted only beneath the configured workspace root.
- Preserved canonical config files during two-file transactions, used atomic replacements and rollback, and ensured fresh config creation precedes API activation.
- Killed image-builder process groups instead of only the parent and added independent hard settlement after `SIGKILL` so a missing close event cannot hang a job forever.
- Added a truncating Unix-client response path so oversized exec logs return bounded evidence and are still deleted instead of failing the entire job.
- Kept `.full-review` as ignored disposable evidence while committing reproducible tests, CI, manifests, and source changes.
- Did not change repository visibility, force-push Beads/Dolt, or deploy to a real Unraid host without explicit authorization and environment selection.

## Files Changed

Evidence for every row is `git diff --name-status 61a9543..19ce359`; the merged
scope is 95 files, 23,883 insertions, and 2,634 deletions.

| Status | Path | Previous path | Purpose | Evidence |
|---|---|---|---|---|
| modified | `.github/workflows/api-plugin-ci.yml` | — | Backend/frontend tests, coverage, pinned actions, coordinated payload comparison, and path filters | `M` |
| created | `.github/workflows/classic-plugin-ci.yml` | — | Hosted classic XML/shell/package verification | `A` |
| modified | `.github/workflows/openwiki-update.yml` | — | Hardened scheduled documentation workflow | `M` |
| modified | `.gitignore` | — | Ignored disposable review/build state | `M` |
| modified | `CLAUDE.md` | — | Updated repository architecture, test, release, and operational guidance | `M` |
| modified | `MANIFEST.md` | — | Package inventory, provenance, safety, rollback, and publication boundary | `M` |
| modified | `README.md` | — | Installation, containment, compatibility, verification, and rollback documentation | `M` |
| modified | `incus.plg` | — | Verified install, migration, API coordination, rollback, and fresh-config ordering | `M` |
| created | `packages/incus-unraid-7.0.0-46-x86_64-1.txz` | — | Coordinated classic/runtime/API/frontend artifact | `A` |
| created | `release-manifest.json` | — | Machine-readable release compatibility and package hash | `A` |
| created | `scripts/build-classic-package.sh` | — | Safe overlay build from the prior complete runtime archive | `A` |
| created | `scripts/verify-classic-package.sh` | — | Exact inventory, checksum, source-drift, ownership, and dependency verification | `A` |
| modified | `source/usr/local/emhttp/plugins/incus/event/disks_mounted` | — | Reliable startup hook behavior and status handling | `M` |
| modified | `source/usr/local/emhttp/plugins/incus/event/unmounting_disks` | — | Aggregated shutdown failures and lifecycle cleanup | `M` |
| modified | `source/usr/local/emhttp/plugins/incus/incus.cfg` | — | Safe defaults, CGNAT containment, bind policy, and fail-closed IPv6 | `M` |
| modified | `source/usr/local/emhttp/plugins/incus/scripts/apply-settings.sh` | — | Pre-promotion validation and known-good rollback | `M` |
| created | `source/usr/local/emhttp/plugins/incus/scripts/config-validation.sh` | — | Shared canonical workspace/bind containment validation | `A` |
| modified | `source/usr/local/emhttp/plugins/incus/scripts/incus-env.sh` | — | Scoped private runtime environment | `M` |
| modified | `source/usr/local/emhttp/plugins/incus/scripts/incus-init.sh` | — | Idempotent preseed, ACL migration, DNS exception, bind rendering, and validation | `M` |
| modified | `source/usr/local/emhttp/plugins/incus/scripts/incus-preflight.sh` | — | Required binary/runtime readiness checks | `M` |
| created | `source/usr/local/emhttp/plugins/incus/scripts/incus-watchdog.sh` | — | Bounded health monitoring and verified restart behavior | `A` |
| created | `source/usr/local/emhttp/plugins/incus/scripts/install-api-plugin.sh` | — | Atomic API activation, fresh log evidence, and rollback | `A` |
| created | `source/usr/local/emhttp/plugins/incus/scripts/migrate-config.sh` | — | Versioned containment/config migration | `A` |
| modified | `source/usr/local/emhttp/plugins/incus/scripts/rc.incus` | — | Transactional startup/shutdown, PID validation, log rotation, and watchdog lifecycle | `M` |
| created | `source/usr/local/emhttp/plugins/incus/scripts/uninstall-api-plugin.sh` | — | Coordinated API removal and reload | `A` |
| modified | `source/usr/local/emhttp/plugins/incus/templates/agent-jail-profile.yaml.tmpl` | — | Host/subnet isolation and safer profile defaults | `M` |
| modified | `source/usr/local/emhttp/plugins/incus/web/incus-dashboard.js` | — | Rebuilt verified dashboard bundle | `M` |
| created | `source/usr/local/emhttp/plugins/incus/web/incus-settings-Terminal-DDk6hy6k.js` | — | Lazy terminal production chunk | `A` |
| created | `source/usr/local/emhttp/plugins/incus/web/incus-settings-__vite-browser-external-2447137e-DYxpcVy9.js` | — | Vite browser-external production shim | `A` |
| created | `source/usr/local/emhttp/plugins/incus/web/incus-settings-index-D8Q71tKU.js` | — | Shared settings production chunk | `A` |
| created | `source/usr/local/emhttp/plugins/incus/web/incus-settings-main-B6fO6oqV.js` | — | Main settings production chunk | `A` |
| modified | `source/usr/local/emhttp/plugins/incus/web/incus-settings.css` | — | Rebuilt host-theme-scoped styles | `M` |
| modified | `source/usr/local/emhttp/plugins/incus/web/incus-settings.js` | — | Rebuilt settings entry and chunk references | `M` |
| created | `tests/classic-contract.sh` | — | Classic config, lifecycle, install-order, CI, and package contracts | `A` |
| created | `tests/live-isolation.sh` | — | Opt-in disposable-host isolation boundary verification | `A` |
| created | `unraid-api-plugin-incus/.ci-stubs/unraid-shared/use-permissions.directive.d.ts` | — | CI type contract for Unraid permission directive | `A` |
| created | `unraid-api-plugin-incus/.ci-stubs/unraid-shared/use-permissions.directive.js` | — | CI runtime stub for permission directive | `A` |
| modified | `unraid-api-plugin-incus/index.ts` | — | GraphQL SDL/schema alignment and module exports | `M` |
| modified | `unraid-api-plugin-incus/package-lock.json` | — | Locked test/build/runtime dependency graph | `M` |
| modified | `unraid-api-plugin-incus/package.json` | — | Test, coverage, mutation, and production dependency scripts | `M` |
| modified | `unraid-api-plugin-incus/src/config-sync.service.test.ts` | — | Config transaction, rollback, and DI regressions | `M` |
| modified | `unraid-api-plugin-incus/src/config-sync.service.ts` | — | Atomic cfg/JSON synchronization without a missing-canonical window | `M` |
| created | `unraid-api-plugin-incus/src/config.entity.test.ts` | — | Workspace, bind, and IPv6 validation regressions | `A` |
| modified | `unraid-api-plugin-incus/src/config.entity.ts` | — | Strict containment and fail-closed config validators | `M` |
| modified | `unraid-api-plugin-incus/src/incus-builder-presets.service.ts` | — | Safer preset persistence and refresh behavior | `M` |
| created | `unraid-api-plugin-incus/src/incus-exec.service.test.ts` | — | Session races, log limits, recording, and cleanup regressions | `A` |
| modified | `unraid-api-plugin-incus/src/incus-exec.service.ts` | — | Bounded terminal/job lifecycle, cleanup, and output handling | `M` |
| modified | `unraid-api-plugin-incus/src/incus-image-builder.service.ts` | — | Timeout, process-group cancellation, stream errors, hard settlement, and retention | `M` |
| modified | `unraid-api-plugin-incus/src/incus-package-search.service.test.ts` | — | Stale search and early rejection regressions | `M` |
| modified | `unraid-api-plugin-incus/src/incus-package-search.service.ts` | — | Worker-backed catalogs and immediately handled source failures | `M` |
| created | `unraid-api-plugin-incus/src/incus-unix-client.service.test.ts` | — | Payload limits, truncation, and structured-error regressions | `A` |
| created | `unraid-api-plugin-incus/src/incus-unix-client.service.ts` | — | Shared bounded, typed Incus Unix-socket transport | `A` |
| created | `unraid-api-plugin-incus/src/incus.resolver.test.ts` | — | Resolver authorization metadata contract | `A` |
| modified | `unraid-api-plugin-incus/src/incus.resolver.ts` | — | Permission enforcement and mutation snapshot invalidation | `M` |
| created | `unraid-api-plugin-incus/src/incus.service.test.ts` | — | Incus operation, cache, and error regressions | `A` |
| modified | `unraid-api-plugin-incus/src/incus.service.ts` | — | Typed requests, structured errors, bounded snapshots, and invalidation | `M` |
| created | `unraid-api-plugin-incus/src/json-store.test.ts` | — | Concurrent mutation and atomic-write regressions | `A` |
| created | `unraid-api-plugin-incus/src/json-store.ts` | — | Serialized atomic private JSON persistence | `A` |
| created | `unraid-api-plugin-incus/src/package-catalog.worker.ts` | — | Off-request-thread package catalog parsing | `A` |
| created | `unraid-api-plugin-incus/src/schema-contract.test.ts` | — | SDL/decorator names, arguments, returns, and nullability contract | `A` |
| created | `unraid-api-plugin-incus/stryker.config.mjs` | — | Focused mutation-test configuration | `A` |
| modified | `unraid-api-plugin-incus/test-stubs/@nestjs/config/index.js` | — | More faithful ConfigService test behavior | `M` |
| modified | `unraid-api-plugin-incus/test-stubs/@nestjs/graphql/index.js` | — | Decorator metadata needed by schema tests | `M` |
| created | `unraid-api-plugin-incus/test-stubs/@unraid/shared/use-permissions.directive.d.ts` | — | Test type stub for authorization directive | `A` |
| created | `unraid-api-plugin-incus/test-stubs/@unraid/shared/use-permissions.directive.js` | — | Test runtime stub for authorization directive | `A` |
| modified | `unraid-api-plugin-incus/test-stubs/class-validator/index.js` | — | Validator test support for new constraints | `M` |
| modified | `unraid-api-plugin-incus/vitest.config.ts` | — | Backend coverage floors and test configuration | `M` |
| modified | `unraid-api-plugin-incus/web/package-lock.json` | — | Locked frontend test/build graph | `M` |
| modified | `unraid-api-plugin-incus/web/package.json` | — | Frontend tests and coverage scripts | `M` |
| created | `unraid-api-plugin-incus/web/src/App.test.ts` | — | Settings integration, lifecycle, IPv6, master, and accessibility regressions | `A` |
| modified | `unraid-api-plugin-incus/web/src/App.vue` | — | Race-safe state, fail-closed payloads, accessibility, and scoped UI behavior | `M` |
| created | `unraid-api-plugin-incus/web/src/DashboardWidget.test.ts` | — | Dashboard state and metric regressions | `A` |
| modified | `unraid-api-plugin-incus/web/src/DashboardWidget.vue` | — | Correct dashboard loading/error/resource behavior | `M` |
| created | `unraid-api-plugin-incus/web/src/components/TabNavigation.vue` | — | Keyboard-operable ARIA tab navigation | `A` |
| created | `unraid-api-plugin-incus/web/src/components/Terminal.test.ts` | — | Terminal dialog/start/stop regressions | `A` |
| modified | `unraid-api-plugin-incus/web/src/components/Terminal.vue` | — | Accessible dialog and cancellation-safe terminal startup | `M` |
| modified | `unraid-api-plugin-incus/web/src/components/ui/Select.vue` | — | Form labeling and disabled/read-only semantics | `M` |
| modified | `unraid-api-plugin-incus/web/src/components/ui/Switch.vue` | — | Accessible switch semantics | `M` |
| created | `unraid-api-plugin-incus/web/src/components/ui/form-controls.test.ts` | — | Select/switch accessibility regressions | `A` |
| created | `unraid-api-plugin-incus/web/src/composables/useJailDetail.test.ts` | — | Stale detail response regression | `A` |
| created | `unraid-api-plugin-incus/web/src/composables/useJailDetail.ts` | — | Generation-safe jail detail loading | `A` |
| created | `unraid-api-plugin-incus/web/src/composables/useResourceMetrics.test.ts` | — | Metrics cancellation and freshness regressions | `A` |
| created | `unraid-api-plugin-incus/web/src/composables/useResourceMetrics.ts` | — | Shared bounded resource polling | `A` |
| created | `unraid-api-plugin-incus/web/src/graphql-client.test.ts` | — | GraphQL error and abort behavior regressions | `A` |
| modified | `unraid-api-plugin-incus/web/src/graphql-client.ts` | — | Abort-signal propagation and structured client errors | `M` |
| created | `unraid-api-plugin-incus/web/src/graphql/operations.ts` | — | Centralized typed query/mutation/subscription documents | `A` |
| created | `unraid-api-plugin-incus/web/src/lib/configPayload.test.ts` | — | Secret and legacy IPv6 payload regressions | `A` |
| created | `unraid-api-plugin-incus/web/src/lib/configPayload.ts` | — | Safe config payload normalization | `A` |
| created | `unraid-api-plugin-incus/web/src/lib/polling.test.ts` | — | Non-overlap, interval, cancellation, and visibility regressions | `A` |
| created | `unraid-api-plugin-incus/web/src/lib/polling.ts` | — | Shared abortable polling controller | `A` |
| modified | `unraid-api-plugin-incus/web/src/main.ts` | — | Entry cleanup for host-scoped styles and lazy chunks | `M` |
| deleted | `unraid-api-plugin-incus/web/src/styles/aurora-tokens.css` | — | Removed global token leakage into the Unraid host page | `D` |
| modified | `unraid-api-plugin-incus/web/src/types.ts` | — | Config/job/resource contract alignment | `M` |
| modified | `unraid-api-plugin-incus/web/vite.config.ts` | — | Deterministic production chunks and build behavior | `M` |
| created | `unraid-api-plugin-incus/web/vitest.config.ts` | — | Frontend test environment and coverage floors | `A` |

## Beads Activity

All 48 review-era issues were observed. The parent and public-publication item
remain open by design; 46 implementation/review issues are closed.

| ID | Title | Actions | Final status | Why it mattered |
|---|---|---|---|---|
| `codex-full-review-20260718-2es` | Remediate full-repository comprehensive review | Created, claimed, noted, dependency added | in progress | Parent for the full 69-finding workflow; now blocked only by publication decision |
| `codex-full-review-20260718-2es.1` | Backend security API persistence performance and tests | Created, claimed, closed | closed | Owned the initial backend remediation lane |
| `codex-full-review-20260718-2es.2` | Frontend client polling UX accessibility and tests | Created, claimed, closed | closed | Owned the initial frontend remediation lane |
| `codex-full-review-20260718-2es.3` | Classic plugin isolation lifecycle package CI docs and operations | Created, claimed, closed | closed | Owned the initial classic/package lane |
| `codex-full-review-20260718-pwd` | Block container access to the Incus host gateway | Created, fixed, closed | closed | Closed the Lavra P0 containment bypass |
| `codex-full-review-20260718-vxw` | Cancel terminal sessions closed during startup | Created, fixed, closed | closed | Prevented orphan startup sessions |
| `codex-full-review-20260718-5za` | Prevent stale container detail responses | Created, fixed, closed | closed | Prevented old responses overwriting current UI state |
| `codex-full-review-20260718-lq1` | Make default image selection failure-atomic | Created, fixed, closed | closed | Prevented no-default intermediate state |
| `codex-full-review-20260718-fp5` | Keep Aurora tokens scoped to the Incus UI | Created, fixed, closed | closed | Prevented host-page CSS pollution |
| `codex-full-review-20260718-m0o` | Invalidate in-flight polling callbacks on stop | Created, fixed, closed | closed | Closed post-stop async mutation races |
| `codex-full-review-20260718-65q` | Invalidate stale package searches immediately | Created, fixed, closed | closed | Prevented stale search results |
| `codex-full-review-20260718-s2w` | Add component-level settings dashboard terminal tests | Created, fixed, closed | closed | Added UI regression coverage |
| `codex-full-review-20260718-0zt` | Split coupled App feature ownership | Created, fixed, closed | closed | Extracted polling/detail/metrics/config concerns |
| `codex-full-review-20260718-67f` | Complete form and switch accessibility | Created, fixed, closed | closed | Added labels and correct control semantics |
| `codex-full-review-20260718-7jk` | Implement accessible terminal dialog behavior | Created, fixed, closed | closed | Added dialog keyboard/focus semantics |
| `codex-full-review-20260718-kne` | Implement ARIA tab keyboard behavior | Created, fixed, closed | closed | Added keyboard-operable tabs |
| `codex-full-review-20260718-384` | Handle post-build image refresh failure | Created, fixed, closed | closed | Preserved completed build result if refresh failed |
| `codex-full-review-20260718-1n3` | Remove half-supported IPv6 configuration contract | Created, fixed, closed | closed | Enforced fail-closed IPv6 behavior |
| `codex-full-review-20260718-2s4` | Invalidate jail snapshots after mutations | Created, fixed, closed | closed | Prevented stale backend cache responses |
| `codex-full-review-20260718-3vk` | Recompute Tailscale secret configured state | Created, fixed, closed | closed | Corrected secret-presence reporting |
| `codex-full-review-20260718-9yl` | Correct Tailscale ACL help text | Created, fixed, closed | closed | Aligned UI copy with actual policy |
| `codex-full-review-20260718-6np` | Enforce full resolver and SDL schema contract | Created, fixed, closed | closed | Prevented decorator/SDL drift |
| `codex-full-review-20260718-der` | Remove or wire dead validation DTOs | Created, fixed, closed | closed | Removed misleading validation surface |
| `codex-full-review-20260718-fjc` | Type Incus boundary and preserve structured errors | Created, fixed, closed | closed | Kept upstream failure semantics |
| `codex-full-review-20260718-k49` | Constrain bind mounts and default them read-only | Created, fixed, closed | closed | Closed host filesystem takeover paths |
| `codex-full-review-20260718-neu` | Migrate existing ACLs to block Tailscale CGNAT | Created, fixed, closed | closed | Applied new containment to upgrades |
| `codex-full-review-20260718-dnl` | Stop unhealthy daemon before watchdog restart | Created, fixed, closed | closed | Prevented overlapping daemon instances |
| `codex-full-review-20260718-jo7` | Add image build timeout and cancellation cleanup | Created, fixed, closed | closed | Bounded stuck builds |
| `codex-full-review-20260718-2od` | Roll back classic package when API activation fails | Created, fixed, closed | closed | Kept classic/API layers coordinated |
| `codex-full-review-20260718-35g` | Fix fatal ShellCheck findings in classic CI | Created, fixed, closed | closed | Made classic static analysis enforceable |
| `codex-full-review-20260718-8d1` | Verify API activation from fresh evidence | Created, fixed, closed | closed | Avoided stale log false positives |
| `codex-full-review-20260718-4ix` | Close exec sockets and expire idle sessions | Created, fixed, closed | closed | Bounded terminal resources |
| `codex-full-review-20260718-7bf` | Expire and delete persistent build logs | Created, fixed, closed | closed | Bounded disk retention |
| `codex-full-review-20260718-nmm` | Transact cfg and JSON persistence together | Created, fixed, closed | closed | Prevented split-brain config state |
| `codex-full-review-20260718-1q4` | PR review: make config-sync test paths safe for Nest DI | Created, fixed, closed | closed | Prevented runtime provider resolution failure |
| `codex-full-review-20260718-48k` | PR review: add intervals to background job polling | Created, verified, closed | closed | Confirmed explicit bounded polling intervals |
| `codex-full-review-20260718-gr4` | PR review: truncate oversized exec logs without job failure | Created, fixed, closed | closed | Kept jobs successful and logs deletable |
| `codex-full-review-20260718-jt1` | Prevent unsetting launch default without replacement | Created, fixed, closed | closed | Preserved a valid launch default |
| `codex-full-review-20260718-0qj` | Prevent post-unmount initial polling | Created, fixed, closed | closed | Closed async initialization lifecycle race |
| `codex-full-review-20260718-2gr` | Reject unsafe disabled workspace and bind config | Created, fixed, closed | closed | Protected known-good config promotion |
| `codex-full-review-20260718-iug` | Terminate full image build process groups | Created, fixed, closed | closed | Prevented child-process leaks |
| `codex-full-review-20260718-tzs` | Remove config-sync Nest DI test seams | Created, fixed, closed | closed | Kept constructor injectable in production |
| `codex-full-review-20260718-18g` | Eliminate missing-canonical config crash window | Created, fixed, closed | closed | Kept canonical cfg/JSON paths continuously present |
| `codex-full-review-20260718-2ok` | Handle build log failures and force settlement | Created, fixed, closed | closed | Ensured build jobs always settle |
| `codex-full-review-20260718-bme` | Make fail-closed IPv6 UI consistent | Created, fixed, closed | closed | Prevented editable/hidden invalid IPv6 state |
| `codex-full-review-20260718-5dv` | Reserve concurrent terminal session starts | Created, fixed, closed | closed | Enforced capacity across concurrent awaits |
| `codex-full-review-20260718-exp` | Verify resolver argument and return signatures | Created, fixed, closed | closed | Extended schema tests beyond field names |
| `codex-full-review-20260718-myl` | Publish install artifacts on anonymous endpoint | Created, dependency target | open | Requires owner choice of public repository or immutable public host |
| `codex-full-review-20260718-4rs` | Save full-review remediation session log | Created, claimed, and closed after push verification | closed | Tracked this session artifact through publication on `main` |
| `codex-full-review-20260718-2xg` | Refresh stale frontend build guidance in CLAUDE.md | Created | open | Tracks incorrect “no code-splitting” source-of-truth text |
| `codex-full-review-20260718-xhc` | Remediate open development dependency advisories | Created | open | Tracks five Dependabot lockfile alerts |
| `codex-full-review-20260718-4b8` | Reconcile divergent Beads Dolt histories | Created | open | Tracks blocked tracker synchronization |
| `codex-full-review-20260718-714` | Validate next OpenWiki update run on merged workflow | Created | open | Tracks the unverified post-merge scheduled workflow |

## Repository Maintenance

### Plans

- `find docs/plans -maxdepth 2 -type f` returned no files, so no completed plan was moved and no ambiguous plan was hidden.

### Beads

- Read all open, in-progress, closed-on-July-18 issues and the interaction log before changing tracker state.
- Added `codex-full-review-20260718-myl` as a blocker of the review parent and noted that implementation/merge work is complete.
- Created, claimed, and closed the session-log issue after its first path-only commit reached `main`; also created four evidence-backed follow-ups listed above.
- `bd dolt push` previously failed because local and remote histories have no common ancestor. No `bd bootstrap`, database deletion, or force-push was attempted; `codex-full-review-20260718-4b8` tracks resolution.

### Worktrees, branches, and PRs

- Before merge: clean `main` plus the feature worktree, whose only dirt was an untracked generated `dist` cache.
- Merged PR #6, pulled `main` to `2ae8aeb`, removed the feature worktree first, then deleted its local and remote branch and pruned worktree/remote metadata.
- Closed PR #4 and deleted `claude/elegant-ardinghelli-ebed37` because it conflicted and contradicted the retained internal naming contract.
- Closed PR #5 and deleted `openwiki/update` because it was generated from pre-review `main` and contained stale testing/workflow claims.
- Final evidence: one worktree, one local/remote branch (`main`), zero open PRs, clean status, ahead 0/behind 0.

### Stale documentation

- `MANIFEST.md` and `README.md` correctly disclose private publication and package provenance boundaries.
- `CLAUDE.md:41` incorrectly says the frontend has no code splitting even though the merged build lazy-loads Terminal. This source-of-truth edit was not mixed into the path-limited session-log commit; follow-up `codex-full-review-20260718-2xg` owns it.
- The last OpenWiki run failed on pre-review `main`; its stale generated PR was closed. Follow-up `codex-full-review-20260718-714` requires a fresh run of the merged workflow.

## Tools and Skills Used

- **Comprehensive-review workflow.** Ran the exact cached full-review phases and persisted disposable `.full-review` state; the user's pre-approval was used at the phase-2 checkpoint.
- **Lavra review.** Repeated security/operations, backend/architecture, and frontend/UX lenses until every reviewer reported no P0-P3 findings at the final SHA.
- **Parallel agents.** Three shared-worktree agents implemented and independently re-reviewed backend, frontend, and classic/package lanes; coordination required waiting for agents before package rebuilds.
- **Shell and file tools.** Used Git, npm/npx, Vite/Vitest, TypeScript, Stryker, ShellCheck, Actionlint, xmllint, tar/hash utilities, and patch-based file edits. No browser automation was used.
- **GitHub CLI.** Created, inspected, reviewed, merged, and cleaned PRs/branches; watched CI and read review comments, workflow logs, and Dependabot alerts.
- **Beads CLI.** Created/claimed/closed review issues and recorded remaining work. Remote Dolt synchronization remained degraded because histories diverged.
- **`vibin:repo-status`.** Collected structured live Git/worktree/PR/CI evidence before and after merge and cleanup.
- **`vibin:save-to-md`.** Performed the maintenance pass and generated this path-limited artifact.
- **Gateway/MCP state.** Labby setup reported `http://localhost:8765` unreachable, but no task step required gateway tools; shell and GitHub access were sufficient.

## Commands Executed

| Command | Result |
|---|---|
| `git worktree add ... codex/full-review-20260718` | Created isolated review checkout |
| exact `comprehensive-review:full-review` workflow | Completed phases 1-5 across 204 files |
| `npx tsc --noEmit && npm test && npm run test:coverage && npm run test:mutation && npm run build && npm audit --omit=dev` | Final backend pass: 71 tests, coverage pass, 82.14% mutation score, build pass, zero production vulnerabilities |
| `npx vue-tsc --noEmit && npm test && npm run test:coverage && npm run build && npm audit --omit=dev` | Final frontend pass: 22 tests, coverage/build pass, zero production vulnerabilities |
| `actionlint`, `bash -n`, `shellcheck`, `xmllint`, `./tests/classic-contract.sh` | Classic static/contract checks passed |
| `./scripts/build-classic-package.sh 46 packages/incus-unraid-7.0.0-45-x86_64-1.txz` | Built final 309-entry coordinated archive |
| `./scripts/verify-classic-package.sh` | Hash, inventory, mode, ownership, dependency, and source-parity checks passed |
| manual archive extraction plus `diff -qr`/`cmp` | Embedded API `dist`, package metadata, and lockfile matched current build |
| `gh pr create`, `gh pr checks --watch`, `gh pr merge 6 --merge` | PR #6 opened, verified, and merged |
| `git pull --ff-only origin main` | Fast-forwarded local `main` to merge commit `2ae8aeb` |
| `git worktree remove --force ...`, branch deletion, `git fetch --all --prune` | Removed merged review worktree/cache and local/remote feature refs |
| `gh pr close 4 --delete-branch`, `gh pr close 5 --delete-branch` | Removed superseded/conflicting and stale generated-doc PRs |
| repo-status collector with `--include-gh --json` | Final state: one clean synchronized branch/worktree, zero open PRs, current CI green |

## Errors Encountered

- The first `gh pr merge 6 --merge --delete-branch` merged successfully but returned nonzero because the local feature branch was still checked out in its worktree. Resolution: verify the PR merge, pull `main`, remove the worktree, then delete the branch.
- An initial frontend asset comparison used the wrong dashboard path. Resolution: locate the tracked bundle and rerun `cmp`/`diff` with `source/usr/local/emhttp/plugins/incus/web/incus-dashboard.js`.
- Initial CI exposed executable-mode and portability gaps. Resolution: preserve executable index modes and make gates operate in the hosted environment; later PR and post-merge runs passed.
- `bd dolt push` failed with “no common ancestor.” It remains intentionally unresolved because bootstrap or force-push would discard/overwrite history without an authoritative-history decision.
- Package verification temporarily failed during review iterations whenever source/generated assets changed after a build. Resolution: rebuild build 46, update all hashes/manifests, stage exact file transitions, and rerun verification.
- The most recent injected Claude transcript is historical and very large, not the current Codex transcript. Resolution: use it only as historical context and document current work from live evidence.

## Behavior Changes (Before/After)

| Area | Before | After |
|---|---|---|
| Network containment | Containers could reach the host bridge; CGNAT and IPv6 boundaries were incomplete | Bridge subnet and CGNAT blocked, DNS narrowly allowed, IPv6 fails closed |
| Bind mounts | Sources and write access could escape intended workspace policy | Canonical approved roots, read-only default, writable only below workspace |
| Config persistence | cfg/JSON and classic/API activation could split or lose canonical files | Validated atomic transaction, known-good restore, activation rollback |
| Daemon health | Partial startup and watchdog restarts could leave overlapping/unhealthy state | Verified stop/restart, PID/health evidence, bounded watchdog and rollback |
| Terminal/exec | Races, unbounded sessions/logs, socket leaks, and oversized failures | Capacity reservation, limits, expiry, truncation, and deterministic cleanup |
| Image builds | Parent-only cancellation and missing close/log events could hang | Process-group termination, timeout, stream handling, and hard settlement |
| Frontend async work | Overlapping/stale polling and post-unmount callbacks | Abortable serialized polling and generation-safe state updates |
| Frontend accessibility | Incomplete labels, dialog behavior, switch semantics, and tab keyboard support | Component-level accessible controls and regression tests |
| Release package | Artifact provenance and source/payload coordination were weak | 309-entry verified archive with coordinated embedded API and CI comparison |
| Repository hygiene | Review branch/worktree and two stale PR branches existed | Only clean synchronized `main`; no open PRs or extra worktrees/branches |

## Verification Evidence

| Command | Expected | Actual | Status |
|---|---|---|---|
| Backend Vitest | All tests pass | 9 files, 71 tests passed | pass |
| Backend coverage | Meet configured floors | 43.48% statements, 42.35% branches, 24.16% functions, 45.04% lines | pass |
| Stryker mutation | Score at least 50% | 82.14% | pass |
| Backend typecheck/build | No TypeScript errors | `tsc --noEmit` and build passed | pass |
| Backend production audit | No production vulnerabilities | 0 vulnerabilities | pass |
| Frontend Vitest | All tests pass | 9 files, 22 tests passed | pass |
| Frontend coverage | Meet configured floors | 45.79% statements, 39.67% branches, 44.6% functions, 47.9% lines | pass |
| Frontend typecheck/build | Both bundles compile | Vue typecheck plus settings/dashboard builds passed | pass |
| Frontend production audit | No production vulnerabilities | 0 vulnerabilities | pass |
| Generated asset comparison | Built files equal tracked source payload | `diff -qr`/`cmp` passed | pass |
| Classic static checks | No action/XML/shell findings | Actionlint, xmllint, syntax, and ShellCheck passed | pass |
| Classic contract | All repository contracts hold | Passed | pass |
| Package verification | Exact verified coordinated archive | 309 entries; MD5 `72cb385808a212abb9aa59246fe070c6`; SHA-256 `44c03afe8130a3f718c05e34d38972b6e518682ac12503c70026461043923867` | pass |
| Embedded backend comparison | Archive API payload equals fresh build | `dist`, `package.json`, and `package-lock.json` byte-match | pass |
| Final Lavra reviews | No actionable P0-P3 | Security, backend, and frontend lenses clean at `19ce359` | pass |
| PR checks | All required checks green | Backend, frontend, two classic runs, CodeRabbit, GitGuardian passed | pass |
| Post-merge workflows | Current `main` green | API and classic workflows succeeded at `2ae8aeb` | pass |
| Final Git state | Clean/synchronized, no stale refs | one worktree/branch, zero open PRs, ahead 0/behind 0 | pass |
| Disposable Unraid live suite | Release should pass on real host | Not run in this session | warn |

## Risks and Rollback

- The package changes host networking, daemon lifecycle, API activation, and bundled runtime payload. The installer retains the prior `.txz` and API directory and rolls both layers back if activation fails (`MANIFEST.md:69`).
- The exact archive is hash/inventory verified but not reproducible from upstream sources; rollback uses the retained prior artifact, not a from-source rebuild (`MANIFEST.md:13`).
- A real disposable-Unraid deployment was not performed in this session. Before calling this a deployed release, run the documented live status and isolation gates (`MANIFEST.md:43`).
- Dependency lockfiles still have five GitHub development/build advisories; production-only npm audits were clean.

## Decisions Not Taken

- Did not make the private repository public or publish artifacts to a new host because that is an owner-controlled external release action.
- Did not force-push or delete/rebootstrap the Beads database because local and remote Dolt histories have no common ancestor.
- Did not merge stale PR #4; it conflicts and attempts an internal naming migration explicitly rejected by current project guidance.
- Did not merge stale OpenWiki PR #5; it was generated from pre-review `main` and included false test/workflow claims.
- Did not mix the stale `CLAUDE.md` correction or dependency upgrades into this session-only documentation commit.

## References

- PR #6: https://github.com/jmagar/incus-unraid/pull/6
- Merge commit: https://github.com/jmagar/incus-unraid/commit/2ae8aeb57c552cfe5fd2bd41134ab39466c12d85
- Package manifest: `MANIFEST.md`
- Machine-readable release metadata: `release-manifest.json`
- Backend CI: `.github/workflows/api-plugin-ci.yml`
- Classic CI: `.github/workflows/classic-plugin-ci.yml`
- Project source of truth: `CLAUDE.md`

## Open Questions

- Should the repository become public, or should build 46 be published to a separate immutable public artifact host?
- Which Beads/Dolt history is authoritative, and should reconciliation preserve local or remote history?
- When will a disposable Unraid host be selected for the opt-in live isolation and activation gate?
- Should the five development/build dependency alerts be fixed in one lockfile update or split by package family?

## Next Steps

### Unfinished from this review

1. Resolve `codex-full-review-20260718-myl` by choosing public repository visibility or an immutable public artifact endpoint; then close the parent `codex-full-review-20260718-2es`.
2. Run the disposable-host release gate: deploy the coordinated package, verify `/var/log/graphql-api.log`, run `/etc/rc.d/rc.incus status`, and execute `INCUS_LIVE_TEST=1 ./tests/classic-contract.sh`.

### Follow-on work not started

1. Fix `codex-full-review-20260718-xhc` and rerun backend/frontend tests, production audits, and package coordination checks.
2. Fix `codex-full-review-20260718-2xg` by updating `CLAUDE.md` to describe lazy Terminal chunks and confirm `AGENTS.md`/`GEMINI.md` are symlinks to it.
3. Validate the next OpenWiki workflow under `codex-full-review-20260718-714` and regenerate documentation from current `main`.

### Blocked

1. Resolve `codex-full-review-20260718-4b8` only after identifying the authoritative Dolt history; do not use `bd bootstrap` or `bd dolt push --force` blindly.
