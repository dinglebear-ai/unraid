# Session: Unraid API Doc Consolidation and Mutation Validation

**Date:** 2026-04-05
**Branch:** main
**Commit:** c39b052
**Version:** 1.2.4

---

## Session Overview

Consolidated the Unraid API documentation into a canonical 2-doc + 2-artifact layout under `docs/unraid/`, expanded the generator so one run refreshes those files and emits a schema diff report, fixed a live schema drift in Docker queries, and validated selected new live mutations against the current Unraid API.

---

## Timeline

1. **Live introspection audit** — Queried the current Unraid GraphQL API and confirmed the committed docs were stale relative to the live schema
2. **Certificate inspection** — Verified the second server certificate was issued for `SHART.local`; used hostname-correct access for follow-up introspection
3. **Doc set consolidation** — Reduced the Unraid API docs to the canonical set under `docs/unraid/`
4. **Generator expansion** — Extended `scripts/generate_unraid_api_reference.py` to write the 4 canonical files plus a new `UNRAID-API-CHANGES.md` report
5. **Timestamping** — Added generation timestamps and source endpoint metadata to generated Markdown outputs
6. **Schema drift fix** — Removed obsolete `skipCache` arguments from Docker GraphQL queries after validating against the live schema
7. **Live mutation validation** — Executed low-risk new mutations against the current API and recorded results

---

## Key Findings

- The committed Unraid API docs were materially stale versus the live API
- Root schema counts changed from `46/22/11` (queries/mutations/subscriptions) to `57/45/16`
- New API areas appeared around cloud/connect, remote access, onboarding, Docker organizer/template management, system time, display, and plugin install tracking
- The live API no longer accepts `skipCache` on `docker.containers`, which caused schema validation failures until fixed
- The second Unraid server certificate is valid for `SHART.local`, not the raw Tailscale IP

---

## Technical Decisions

- **Canonical doc layout:** keep only:
  - `docs/unraid/UNRAID-API-SUMMARY.md`
  - `docs/unraid/UNRAID-API-COMPLETE-REFERENCE.md`
  - `docs/unraid/UNRAID-API-INTROSPECTION.json`
  - `docs/unraid/UNRAID-SCHEMA.graphql`
- **Add a diff report:** `docs/unraid/UNRAID-API-CHANGES.md` is generated automatically from the previous introspection snapshot
- **Single generator path:** extend the existing generator instead of adding a second wrapper script
- **Low-risk mutation testing only:** validated `notifyIfUnique` and `refreshDockerDigests`; did not probe remote access, system time, or identity-changing mutations casually

---

## API Changes Observed

### Added root queries

`assignableDisks`, `cloud`, `connect`, `display`, `installedUnraidPlugins`, `internalBootContext`, `isFreshInstall`, `network`, `pluginInstallOperation`, `pluginInstallOperations`, `remoteAccess`, `systemTime`, `timeZoneOptions`

### Removed root queries

`isInitialSetup`, `publicPartnerInfo`

### Added root mutations

`connectSignIn`, `connectSignOut`, `createDockerFolder`, `createDockerFolderWithItems`, `deleteDockerEntries`, `enableDynamicRemoteAccess`, `moveDockerEntriesToFolder`, `moveDockerItemsToPosition`, `notifyIfUnique`, `onboarding`, `refreshDockerDigests`, `renameDockerFolder`, `resetDockerTemplateMappings`, `setDockerFolderChildren`, `setupRemoteAccess`, `syncDockerTemplatePaths`, `unraidPlugins`, `updateApiSettings`, `updateDockerViewPreferences`, `updateServerIdentity`, `updateSshSettings`, `updateSystemTime`, `updateTemperatureConfig`

### Added root subscriptions

`displaySubscription`, `dockerContainerStats`, `notificationsWarningsAndAlerts`, `pluginInstallUpdates`, `systemMetricsTemperature`

---

## Files Modified

| File | Change | Purpose |
|------|--------|---------|
| `docs/unraid/UNRAID-API-SUMMARY.md` | Generated | Canonical condensed API summary |
| `docs/unraid/UNRAID-API-COMPLETE-REFERENCE.md` | Generated | Canonical full schema reference |
| `docs/unraid/UNRAID-API-INTROSPECTION.json` | Generated | Canonical raw introspection payload |
| `docs/unraid/UNRAID-SCHEMA.graphql` | Generated | Canonical SDL export |
| `docs/unraid/UNRAID-API-CHANGES.md` | Generated | Diff report against previous introspection snapshot |
| `scripts/generate_unraid_api_reference.py` | Modified | Generate all canonical outputs plus change report |
| `unraid_mcp/tools/_docker.py` | Modified | Removed obsolete `skipCache` args from Docker queries |
| `unraid_mcp/tools/_health.py` | Modified | Removed obsolete `skipCache` arg from health query |
| `tests/schema/test_query_validation.py` | Modified | Updated schema path and live query expectations |
| `tests/http_layer/test_request_construction.py` | Modified | Updated Docker resolution query expectations |
| `tests/test_generate_unraid_api_reference.py` | Created | Coverage for schema change report generation |
| `CLAUDE.md` | Modified | Updated canonical doc references |
| `docs/INVENTORY.md` | Modified | Updated script purpose |
| `docs/repo/REPO.md` | Modified | Updated canonical docs listing |
| `docs/repo/SCRIPTS.md` | Modified | Updated generator outputs |
| `docs/upstream/CLAUDE.md` | Modified | Updated Unraid schema doc references |

---

## Live Mutation Validation

### `notifyIfUnique(input: NotificationData!)`

- Executed successfully
- Returned a real notification record with a prefixed notification ID
- Follow-up archive attempt reported the notification was not present in unreads at archive time

### `refreshDockerDigests()`

- Executed successfully
- Returned `true`

### Mutations intentionally not probed live

- `updateSystemTime`
- `updateServerIdentity`
- `setupRemoteAccess`
- `enableDynamicRemoteAccess`
- Docker organizer/template mutations

These were left alone because they can change live system or UI state in non-trivial ways.

---

## Verification Evidence

| Command | Expected | Actual | Status |
|---------|----------|--------|--------|
| `uv run pytest tests/test_generate_unraid_api_reference.py -q` | Generator tests pass | `2 passed` | PASS |
| `uv run pytest tests/schema/test_query_validation.py tests/http_layer/test_request_construction.py -q` | Schema + HTTP-layer tests pass | `201 passed` | PASS |
| `rg -n "skipCache" unraid_mcp tests` | No active stale Docker arg usage | no matches | PASS |
| Live `notifyIfUnique` mutation | Returns notification object | succeeded | PASS |
| Live `refreshDockerDigests` mutation | Returns boolean success | `true` | PASS |

---

## Risks and Rollback

- **Low to moderate risk** — doc generation and schema updates are straightforward, but the canonical doc move deletes older duplicate files and changes path references across the repo
- **Rollback docs:** restore deleted legacy doc files and revert `docs/unraid/` additions plus updated references
- **Rollback code:** reintroduce `skipCache` only if the upstream API restores that argument

---

## Decisions Not Taken

- **Did not timestamp raw JSON/SDL artifacts** — left machine-readable outputs clean; only Markdown docs are timestamped
- **Did not probe high-risk new mutations live** — avoided system identity, time, and remote-access state changes
- **Did not keep duplicate operation/reference docs** — removed the extra user-facing docs in favor of the canonical set

---

## Open Questions

- Should high-risk new mutations get dedicated safe harnesses or mocked tests instead of ad hoc live probing?
- Should the generator be wired into CI to detect schema drift automatically?

---

## Next Steps

- Commit the canonical docs and generator changes
- Decide whether to add a CI job that regenerates or validates Unraid schema drift
- Add targeted tests around one or two additional new mutations using mocked GraphQL responses before probing more live behavior
