---
date: 2026-07-23 16:18:35 EST
repo: git@github.com:dinglebear-ai/unraid-mcp.git
branch: refactor/src-layout
head: ab3d9a0e6466723738c86c046fbe4932be8c0658
session id: 019f8d88-83b4-7e91-8d63-8b97c6dfdf79
transcript: /home/jmagar/.codex/sessions/2026/07/23/rollout-2026-07-23T01-52-41-019f8d88-83b4-7e91-8d63-8b97c6dfdf79.jsonl
working directory: /home/jmagar/workspace/unraid-mcp
worktree: /home/jmagar/workspace/unraid-mcp
beads: unraid-mcp-str
---

# Python Unraid credentials and adapter investigation

## User Request

Investigate the reported Unraid shares response-schema mismatch in the Python MCP, then install the same upstream credentials used by the Rust service.

## Session Overview

The Python adapter was isolated from the Rust route and proved healthy against the live GraphQL payload. The deployed Python service was missing upstream credentials and self-signed TLS settings; those were added to the canonical runtime file and the service was restarted and verified.

## Sequence of Events

1. Traced the reported failure through LABBY and direct MCP calls.
2. Proved LABBY's failing contract was the Rust `action="shares"` route, while Python uses `action="disk", subaction="shares"`.
3. Ran an isolated Python server with working credentials; raw GraphQL, handler, and MCP output-schema validation all passed with 14 shares.
4. Added the upstream URL/key and TLS parity settings to `~/.unraid-mcp/.env`, restarted `unraid-python-mcp.service`, and verified the public endpoint.
5. Audited the wider Rust service configuration fleet and recorded the completed audit as `unraid-mcp-str`.

## Key Findings

- The Python shares handler correctly accepts numeric share size fields; no Python response-schema defect was reproduced.
- Production Python failure was `Credentials not configured`, followed by a self-signed certificate error after credentials were supplied.
- LABBY's original schema error belonged to the Rust Unraid typed decoder, not this repository.

## Technical Decisions

- Reused the already-working Rust runtime's upstream URL/key without printing their values.
- Kept credentials in the documented canonical file `~/.unraid-mcp/.env` with mode `0600`.
- Made no Python source change because the isolated protocol-level reproduction passed.

## Files Changed

| status | path | previous path | purpose | evidence |
|---|---|---|---|---|
| modified | `/home/jmagar/.unraid-mcp/.env` | — | Add upstream URL/key and self-signed TLS parity settings | Authenticated health and shares calls passed |
| created | `docs/sessions/2026-07-23-python-unraid-credentials-and-adapter-investigation.md` | — | Persist this repo-scoped session record | This file |

## Beads Activity

| id | title | actions | final status | why |
|---|---|---|---|---|
| `unraid-mcp-str` | Audit and normalize Rust service appdata configuration | created, closed, synced | closed | Tracks the completed cross-service configuration audit initiated from this repo |

## Repository Maintenance

- Plans: no session-specific plan file was found to move.
- Beads: `unraid-mcp-str` was read and remained correctly closed.
- Worktrees/branches: fetched with prune and pruned stale worktree metadata; the dirty `refactor/src-layout` worktree was preserved.
- Stale docs: no Python documentation contradicted the observed canonical credential path.
- Cleanup: no unrelated dirty source file was staged or committed.

## Tools and Skills Used

- `superpowers:systematic-debugging`: traced the reported mismatch across routing, GraphQL, handler, and MCP serialization boundaries.
- `testing:mcporter`: exercised direct HTTP MCP schemas and calls.
- Shell/runtime tools: `uv`, `systemctl`, `journalctl`, `curl`, `mcporter`, and redacted dotenv inspection.
- `vibin:save-to-md`: produced and landed this path-limited session artifact.

## Commands Executed

| command | result |
|---|---|
| `uv run python -m unraid_mcp.main` with temporary credentials | Isolated server started and returned 14 shares |
| `systemctl --user restart unraid-python-mcp.service` | Service returned active |
| `mcporter call ... health/test_connection` | Connected successfully |
| `mcporter call ... disk/shares` | 14 shares, valid page metadata, `isError: false` |

## Errors Encountered

- The production service initially lacked `UNRAID_API_URL` and `UNRAID_API_KEY`.
- The first post-credential call failed TLS verification; matching the Rust service's explicit insecure-TLS settings resolved the self-signed endpoint.
- LABBY's host-side local stub was unreachable and not the live Incus gateway; live routing evidence was used instead.

## Behavior Changes (Before/After)

| area | before | after |
|---|---|---|
| Python upstream connectivity | Credentials not configured | Connected |
| Python shares MCP call | Could not reach upstream | Returns 14 shares |
| Source code | Unchanged | Unchanged |

## Verification Evidence

| command | expected | actual | status |
|---|---|---|---|
| Python raw shares query | Numeric live response decodes | 14 shares decoded | pass |
| Python MCP `tools/call` | Output schema accepts response | Valid wrapped structured content | pass |
| Public health call | Connected | Connected, approximately 21 ms | pass |
| Public shares call | Non-error result | 14 shares, page metadata present | pass |

## Risks and Rollback

The runtime now trusts a self-signed upstream certificate. Roll back by restoring the prior canonical env backup or removing the four added upstream/TLS keys, then restart `unraid-python-mcp.service`.

## Decisions Not Taken

- No adapter code was changed because the Python handler and MCP schema passed with the live payload.
- No unrelated `refactor/src-layout` changes were included in this closeout.

## References

- `src/unraid_mcp/tools/_disk.py`
- `src/unraid_mcp/config/settings.py`
- `~/.unraid-mcp/.env`

## Open Questions

- The Rust numeric `BigInt` bug remains tracked separately in the `runraid` repository.

## Next Steps

- Keep the Python service on the canonical credential file.
- Address the Rust `unrust-hyg` bug separately; it was not implemented in this session.
