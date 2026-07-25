---
date: 2026-07-10 00:45:48 EST
repo: git@github.com:jmagar/runraid.git
branch: main
head: ad3c743
working directory: /home/jmagar/workspace/unraid-rmcp
worktree: /home/jmagar/workspace/unraid-rmcp ad3c743 [main]
beads: unrust-ycf
---

# Unraid MCP OAuth debug session

## User Request

Debug the OAuth issue with `https://unraid.tootie.tv/mcp`, then clarify whether the fix was merged, released, and present in Docker images.

## Session Overview

The live OAuth failure was traced to dynamic client registration rejecting Labby's callback URI. The deployed allowlist accepted `https://lab.tootie.tv/auth/upstream/callback` but rejected `https://labby.tootie.tv/auth/upstream/callback`, so the MCP client could not complete OAuth registration.

The live deployment was updated, rebuilt, and verified. A tracked compose default bump was committed and pushed, and later checks confirmed GHCR `latest`/`main` includes the fix while versioned release binaries remain at `v0.2.2`.

## Sequence of Events

1. Checked the public MCP endpoint and OAuth metadata. `/mcp` returned the expected 401 challenge, `/health` returned OK, and OAuth metadata/JWKS routes were available.
2. Probed registration and authorize behavior. Loopback registration worked, and registered clients could reach the Google authorization redirect path.
3. Inspected the live Docker runtime on `dookie`. The running container was `unraid-mcp` from image `unrust:dev`, reporting app version `0.1.1` while the repo was at `v0.2.2`.
4. Read live container logs. The decisive log entry was `oauth register rejected: redirect URI is not in the allowlist or loopback set` for `https://labby.tootie.tv/auth/upstream/callback`.
5. Created and claimed bead `unrust-ycf`, updated the live ignored `.env` allowlist, bumped the tracked compose default to `0.2.2`, rebuilt the image, removed the stale orphan container, and started `unraid-rmcp`.
6. Verified the previously failing Labby callback registration returned `200`, authorize returned `302` to Google, and public `/health` reported version `0.2.2`.
7. Answered follow-up release/image questions by checking GitHub releases, workflow runs, and GHCR package tags.

## Key Findings

- Root cause: deployed `UNRAID_RMCP_AUTH_ALLOWED_REDIRECT_URIS` allowed `lab.tootie.tv` but not `labby.tootie.tv`; live logs showed the rejected Labby URI.
- The old container name `unraid-mcp` was an orphan from stale compose metadata and held port `40010`; the current compose service is `unraid-rmcp`.
- Public `/health` initially reported version `0.1.1`; after rebuild/recreate it reported `0.2.2`.
- [docker-compose.prod.yml](/home/jmagar/workspace/unraid-rmcp/docker-compose.prod.yml:25) now defaults the production image to `ghcr.io/jmagar/runraid:${VERSION:-0.2.2}`.
- No new GitHub release was cut during this session; latest release remained `v0.2.2` from `2026-07-09T23:40:57Z`.

## Technical Decisions

- Fixed the live allowlist rather than weakening OAuth validation because the failure was a specific allowed callback mismatch.
- Rebuilt from the current checkout and removed the old orphan container because the public route was serving a stale binary and the old container owned port `40010`.
- Committed only the tracked compose default bump; the live `.env` contains secrets and remains intentionally untracked.
- Treated GHCR `latest`/`main` and versioned release artifacts separately, because the Docker publish workflow can build main without cutting release binaries.

## Files Changed

| status | path | previous path | purpose | evidence |
|---|---|---|---|---|
| modified | `.env` | - | Added `https://labby.tootie.tv/auth/upstream/callback` to the live OAuth redirect allowlist; this file is secret/ignored and was not committed. | `docker compose config` showed both callback URLs in `UNRAID_RMCP_AUTH_ALLOWED_REDIRECT_URIS`. |
| modified | `docker-compose.prod.yml` | - | Updated default production image version from `0.1.1` to `0.2.2`. | Commit `27b5973`; [docker-compose.prod.yml](/home/jmagar/workspace/unraid-rmcp/docker-compose.prod.yml:25). |
| modified | `docs/QUICKSTART.md` | - | Updated by follow-up automation commit. | Commit `ad3c743`. |
| modified | `examples/mock_unraid.rs` | - | Updated by follow-up automation commit. | Commit `ad3c743`. |
| modified | `openwiki/operations/configuration.md` | - | Updated by follow-up automation commit. | Commit `ad3c743`. |
| modified | `openwiki/operations/deployment.md` | - | Updated by follow-up automation commit. | Commit `ad3c743`. |
| modified | `openwiki/operations/development.md` | - | Updated by follow-up automation commit. | Commit `ad3c743`. |
| modified | `openwiki/operations/testing.md` | - | Updated by follow-up automation commit. | Commit `ad3c743`. |
| modified | `src/mcp/host_filter.rs` | - | Updated by follow-up automation commit. | Commit `ad3c743`. |
| modified | `tests/auth_modes.rs` | - | Updated by follow-up automation commit. | Commit `ad3c743`. |
| modified | `tests/cynic_spike.rs` | - | Updated by follow-up automation commit. | Commit `ad3c743`. |
| modified | `tests/dispatch.rs` | - | Updated by follow-up automation commit. | Commit `ad3c743`. |
| modified | `tests/host_filter.rs` | - | Updated by follow-up automation commit. | Commit `ad3c743`. |
| modified | `tests/oauth_flow.rs` | - | Updated by follow-up automation commit. | Commit `ad3c743`. |
| modified | `tests/paginate.rs` | - | Updated by follow-up automation commit. | Commit `ad3c743`. |
| modified | `tests/real_binary.rs` | - | Updated by follow-up automation commit. | Commit `ad3c743`. |
| modified | `tests/scenarios.rs` | - | Updated by follow-up automation commit. | Commit `ad3c743`. |
| modified | `tests/schema_contract.rs` | - | Updated by follow-up automation commit. | Commit `ad3c743`. |
| modified | `tests/upstream.rs` | - | Updated by follow-up automation commit. | Commit `ad3c743`. |
| created | `docs/sessions/2026-07-10-unraid-mcp-oauth-debug.md` | - | Session log generated by `vibin:save-to-md`. | This artifact. |

## Beads Activity

| bead | title | actions | final status | why it mattered |
|---|---|---|---|---|
| `unrust-ycf` | Allow Labby OAuth callback for unraid MCP | Created, claimed, closed. | closed | Tracked the live OAuth registration failure and its verified fix. |

## Repository Maintenance

### Plans

No plan files were found under `docs/plans/`; no completed plans were moved.

### Beads

`bd list --all --sort updated --reverse --limit 100 --json` and `.beads/interactions.jsonl` were checked. `unrust-ycf` was the session-relevant bead and was already closed with verification evidence. Existing open bead `unrust-0rs` remains open because it covers a separate `/health` probe hardening follow-up.

### Worktrees and branches

`git worktree list --porcelain` showed one worktree: `/home/jmagar/workspace/unraid-rmcp` on `main`. Local branches were `main` and `fix/health-probe-timeout`; remote branches included `origin/main`, `origin/fix/health-probe-timeout`, `origin/marketplace-no-mcp`, and `origin/release-please--branches--main--components--unraid-mcp`. No branches were deleted because the non-main branches were not proven obsolete in this session.

### Stale docs

The only stale tracked deployment setting directly contradicted by the session was the production compose default image version, fixed in `docker-compose.prod.yml`. Broader docs churn was handled by follow-up automation commit `ad3c743`; no additional stale-doc edits were made manually.

### Transparency

The ignored `.env` was intentionally not staged or committed. The session artifact commit stages only this generated file per the save workflow.

## Tools and Skills Used

- **Skill.** `superpowers:systematic-debugging` guided the initial root-cause-first OAuth investigation; `vibin:save-to-md` generated this session log.
- **Shell commands.** Used `curl`, `docker`, `git`, `gh`, `bd`, `ssh`, and standard shell inspection commands for live runtime, GitHub, GHCR, and tracker evidence.
- **Remote host access.** Used SSH to inspect `dookie`, `tootie`, and `squirts` while locating the actual service host and reverse-proxy path.
- **Docker.** Used `docker inspect`, `docker logs`, `docker compose config`, `docker compose up -d --build`, and `docker rm -f` to diagnose, rebuild, and replace the running service.
- **GitHub CLI.** Used `gh release list`, `gh run list`, `gh run view`, and `gh api` to verify release state, workflow state, and GHCR tags.
- **MCP/tooling issue.** The requested `mcp__lumen__semantic_search` tool was not exposed in this Codex tool surface, so discovery used targeted shell commands instead.

## Commands Executed

| command | result |
|---|---|
| `curl -i https://unraid.tootie.tv/mcp` | Returned 401 with `www-authenticate` bearer challenge, proving the app was reachable and auth-gated. |
| `curl -i https://unraid.tootie.tv/.well-known/oauth-authorization-server` | Returned OAuth authorization-server metadata. |
| `curl -i https://unraid.tootie.tv/mcp/.well-known/oauth-protected-resource` | Returned protected-resource metadata. |
| `curl -X POST https://unraid.tootie.tv/register ... labby.tootie.tv ...` | Initially rejected in logs with allowlist error; after fix returned 200 with a client ID. |
| `ssh dookie 'docker ps ...'` | Located the running `unraid-mcp` container on port `40010`. |
| `docker logs --tail 220 unraid-mcp` | Showed the failing Labby redirect URI rejection. |
| `docker compose config` | Confirmed the fixed allowlist and service environment before recreate. |
| `docker compose up -d --build unraid-rmcp` | Built the new image; first start failed because orphan `unraid-mcp` still owned port `40010`. |
| `docker rm -f unraid-mcp && docker compose up -d unraid-rmcp` | Removed stale container and started `unraid-rmcp`. |
| `curl -sS https://unraid.tootie.tv/health` | Returned `{"status":"ok","version":"0.2.2"}` after deployment. |
| `gh release list --limit 5` | Confirmed latest release was still `v0.2.2`. |
| `gh api /user/packages/container/unraid-rmcp/versions ...` | Confirmed GHCR tags `latest`, `main`, and `sha-ad3c743` point at the current main image. |

## Errors Encountered

- `mcp__lumen__semantic_search` was requested by developer instruction but not available through `tool_search`; investigation continued with targeted shell commands.
- A broad remote search on `squirts` was stopped because it was too slow and not necessary after Docker labels/runtime inspection identified `dookie`.
- `docker compose up -d --build unraid-rmcp` built successfully but failed to start because old orphan container `unraid-mcp` held port `40010`; removing the orphan and restarting fixed it.
- GitHub package API lookup under `/repos/jmagar/runraid/packages/container/unraid-rmcp/versions` returned 404; querying `/user/packages/container/unraid-rmcp/versions` returned the GHCR tag data.

## Behavior Changes (Before/After)

| area | before | after |
|---|---|---|
| OAuth dynamic registration | Labby callback `https://labby.tootie.tv/auth/upstream/callback` was rejected with allowlist validation. | Same callback returns 200 from `/register`. |
| OAuth authorize | Labby could not get past registration. | Registered Labby callback reaches Google authorization via 302. |
| Public service version | `/health` reported `0.1.1`. | `/health` reports `0.2.2`. |
| Docker runtime | Stale orphan `unraid-mcp` owned port `40010`. | Current `unraid-rmcp` container is running and healthy on port `40010`. |
| Release/image state | Latest versioned release was `v0.2.2`; main had newer unreleased work. | GHCR `latest`/`main` contains current `origin/main`; versioned release binaries remain `v0.2.2`. |

## Verification Evidence

| command | expected | actual | status |
|---|---|---|---|
| `curl -i -X POST https://unraid.tootie.tv/register ... https://labby.tootie.tv/auth/upstream/callback ...` | HTTP 200 with client registration. | HTTP 200 with `client_id` and Labby redirect URI. | pass |
| `curl -i 'https://unraid.tootie.tv/authorize?...redirect_uri=https%3A%2F%2Flabby.tootie.tv%2Fauth%2Fupstream%2Fcallback...'` | Redirect to Google provider. | HTTP 302 to `accounts.google.com/o/oauth2/v2/auth`. | pass |
| `curl -sS https://unraid.tootie.tv/health` | Public service healthy on current deployment. | `status":"ok"`, upstream reachable, `version":"0.2.2"`. | pass |
| `docker ps --format ...` | Current container healthy on port `40010`. | `unraid-rmcp` using `unrust:dev`, healthy, published `0.0.0.0:40010->40010/tcp`. | pass |
| `gh release list --limit 5` | Determine whether a new release was cut. | Latest remained `unraid-rmcp v0.2.2`. | pass |
| `gh api /user/packages/container/unraid-rmcp/versions ...` | Determine whether Docker image contains latest main. | Latest tags included `sha-ad3c743`, `latest`, and `main`. | pass |

## Risks and Rollback

- Risk: the live `.env` allowlist change is untracked because the file contains secrets. Rollback is to remove `https://labby.tootie.tv/auth/upstream/callback` from the deployed `.env` and recreate the container.
- Risk: the running container uses locally built `unrust:dev`; GHCR `latest` now also contains current `main`, but the versioned release image remains `0.2.2`.
- Rollback for the tracked compose default is `git revert 27b5973` if the default image pin needs to return to `0.1.1`.

## Decisions Not Taken

- Did not cut a new release because the user asked whether one existed, not to create one.
- Did not remove `fix/health-probe-timeout` or release-please branches because they were not proven stale.
- Did not commit `.env` because it contains secrets and is intentionally ignored.
- Did not disable OAuth validation or broaden redirect matching beyond the two observed Lab/Labby callback URLs.

## References

- GitHub release list for `jmagar/runraid`.
- GHCR package metadata for `unraid-rmcp`.
- Live service URLs: `https://unraid.tootie.tv/mcp`, `https://unraid.tootie.tv/health`, `https://unraid.tootie.tv/register`, and `https://unraid.tootie.tv/authorize`.
- Bead `unrust-ycf`.

## Open Questions

- Whether to cut a formal release after the OAuth allowlist/deployment fix remains a product/release decision.
- Whether production should deploy `ghcr.io/jmagar/runraid:latest`/`:main` instead of locally built `unrust:dev` was not decided in this session.

## Next Steps

- If a release binary is desired, run the repo's release process instead of relying only on the Docker `latest`/`main` image.
- If deployment should track GHCR rather than local builds, update the deployment workflow and recreate the container from the chosen GHCR tag.
- Keep `unrust-0rs` open for the separate `/health` probe hardening work.
