# Claude Schema Drift Automation Session

## Metadata

- Date: 2026-06-25 07:44:38 EST
- Repository: `git@github.com:jmagar/unraid-mcp.git`
- Working directory: `/home/jmagar/workspace/unraid-mcp`
- Branch: `main`
- Starting HEAD: `3a6b8dd fix: require Claude drift local gates`
- Transcript: `/home/jmagar/.claude/projects/-home-jmagar-workspace-unraid-mcp/efd5e628-e286-451e-8799-bb5038ff3180.jsonl`
- Primary issue: [#107 Unraid GraphQL schema drift detected](https://github.com/jmagar/unraid-mcp/issues/107)
- Active implementation PR: [#122 feat: support Unraid GraphQL schema drift (SDL hash ae82121)](https://github.com/jmagar/unraid-mcp/pull/122)
- Beads: no active beads workspace found in this checkout

## Summary

This session turned the schema drift alert into a working closed-loop automation flow:

1. The schema drift workflow opens or updates issue #107 with structured drift details.
2. The Claude dispatch workflow creates a branch and PR from that issue.
3. Claude reads the issue, updates the code for the drift, pushes changes, and is required to run local quality gates before pushing.
4. The workflow waits for PR checks, invokes repair when checks fail, and comments success or failure back on the issue.

The final live run created PR #122. Claude pushed a real implementation commit and all required PR checks passed. The only non-green item was `MCP Integration Tests`, which was skipped rather than failed.

## What Changed On `main`

Recent workflow-hardening commits on `main`:

- `3a6b8dd fix: require Claude drift local gates`
- `fed4c12 fix: raise Claude drift implementation budget`
- `c2fe9a2 fix: prepare Claude drift runner tooling`
- `13f417c fix: raise Claude drift turn budget`
- `0300283 fix: allow dispatched Claude drift debug runs`
- `1a82dbc fix: expose Claude drift action failures`
- `e0e6d03 fix: bound Claude drift workflow steps`
- `346d6b4 fix: keep drift CI waiting in workflow`
- `11f332a fix: let Claude repair failing drift CI`
- `2d3d136 fix: require green CI for Claude drift PRs`

The main files touched by those commits were:

- `.github/workflows/claude-schema-drift.yml`
- `.github/workflows/claude-code-review.yml`
- `.github/workflows/schema-drift.yml`
- `tests/test_schema_drift_workflow.py`

Behavior added or hardened:

- Dispatch Claude from GitHub Actions instead of relying on an issue `@claude` mention.
- Keep the workflow bounded with explicit step timeouts and max-turn budgets.
- Capture failing PR check output for the repair prompt.
- Let Claude repair failing drift PR CI once, then re-check the PR.
- Require Claude to run local gates before pushing implementation or repair commits:
  - `uv run ruff check .`
  - `uv run ruff format --check .`
  - `uv run ty check unraid_mcp/`
  - focused schema drift pytest commands
- Ensure the issue receives a success or failure comment instead of leaving silent broken runs.

## Live Workflow Runs

Several real dispatches were used to prove the loop.

### PR #120

- Workflow run: `28158117633`
- Result: failed
- Finding: the initial Claude invocation hit the 40-turn budget immediately after beginning edits.
- Action taken: closed PR #120 as stale and increased the implementation budget.

### PR #121

- Workflow run: `28158708383`
- Result: failed, but proved repair mechanics
- Claude pushed implementation commit `ba68f61`.
- CI failed.
- Workflow collected failure logs and invoked Claude repair.
- Claude pushed repair commit `536f5da`.
- Final PR checks still failed immediately on lint/format.
- Action taken: closed PR #121 as stale and tightened the prompt so Claude must run local gates before pushing.

### PR #122

- Workflow run: `28160020862`
- Result: success
- Claude implementation commit: `a353e3998847a34bae2b6bf1aa667e82d313b0bf`
- PR state: open and ready for review
- Issue #107 received the success comment:
  - Claude pushed schema drift changes to PR #122.
  - All PR checks were passing.

## PR #122 Details

Title: `feat: support Unraid GraphQL schema drift (SDL hash ae82121)`

Changed files:

- `docs/unraid/UNRAID-SCHEMA.graphql`
- `tests/http_layer/test_request_construction.py`
- `tests/schema/test_query_validation.py`
- `tests/test_docker.py`
- `unraid_mcp/subscriptions/queries.py`
- `unraid_mcp/tools/__init__.py`
- `unraid_mcp/tools/_docker.py`
- `unraid_mcp/tools/_onboarding.py`
- `unraid_mcp/tools/_system.py`
- `unraid_mcp/tools/unraid.py`

Checks observed passing:

- `build-and-push`
- `Lint & Format`
- `claude-review`
- `CodeQL Analyze (actions)`
- `CodeQL Analyze (javascript)`
- `CodeQL Analyze (python)`
- `Type Check`
- `Test py3.12`
- `Test py3.13`
- `Integration & Mock Roundtrip`
- `Version Sync Check`
- `Security Audit`
- `Secret Scan`
- `CodeQL`
- `GitGuardian`

Skipped:

- `MCP Integration Tests`

The PR body reported local validation by Claude:

```bash
uv run ruff check .
uv run ruff format --check .
uv run ty check unraid_mcp/
uv run pytest tests/schema/test_api_parity.py tests/test_schema_diff_summary.py -q
uv run pytest tests/schema/ tests/test_docker.py tests/http_layer/ tests/safety/ -q
```

Reported result: `609 tests pass, 0 failures`.

## Local Verification

Commands run locally during the hardening work:

```bash
uv run pytest tests/test_schema_drift_workflow.py tests/test_schema_diff_summary.py tests/schema/test_api_parity.py -q
actionlint .github/workflows/*.yml
uv run ruff check tests/test_schema_drift_workflow.py
git diff --check
```

Observed results:

- Targeted workflow/schema tests passed: `9 passed`.
- `actionlint` passed.
- Ruff passed for the edited workflow test.
- `git diff --check` passed.

## Issues Encountered

- Claude was not being triggered by the issue because the issue body did not contain an `@claude` mention. The approach was changed to direct GitHub Actions dispatch.
- Early Claude workflow attempts used unsupported or unsuitable action configuration, including `track_progress`.
- Earlier turn budgets were too small for schema drift implementation work.
- One repair-capable run proved Claude could respond to CI failures, but it still left a lint failure because local gates were not strict enough before push.
- `bd list` and `bd where` both reported no active beads workspace, despite repository docs containing beads instructions.
- `docs/plans` was not present, so no completed plan cleanup was possible.

## Repository Maintenance

Working tree and branch state before writing this artifact:

- Branch: `main`
- Remote: `origin/main`
- Status: clean
- Local worktrees: only `/home/jmagar/workspace/unraid-mcp`
- Local branches: only `main`

Remote Claude schema-drift branches still existed, including stale branches for earlier PRs and the active PR #122 branch. They were left alone because the active/stale mapping was not fully cleaned up during this session, and PR #122 is still open.

No beads state was updated because there is no active beads database in this checkout.

## Decisions

- Use direct workflow dispatch for Claude instead of issue mentions.
- Keep Claude automation bounded with explicit max-turn and timeout settings.
- Require local gates in the prompt before Claude pushes changes.
- Let the workflow perform one repair pass when PR checks fail.
- Leave stale remote Claude branches untouched until branch ownership and closed-PR mapping are reviewed deliberately.
- Do not initialize or repair beads in this session; document the mismatch instead.

## Remaining Work

- Review and merge PR #122 if the generated schema drift changes look good.
- After #122 lands, monitor the next schema drift run to ensure the loop still works from a fresh drift event.
- Optionally clean stale `origin/claude/schema-drift-*` branches after confirming they are only tied to closed PRs.
- Decide whether to reconcile the repository beads docs with the current `bd where` behavior.

## Tools And References

- Skill: `vibin:save-to-md`
- GitHub CLI: issue, PR, workflow, and check inspection
- `uv`, `pytest`, `ruff`, `ty`, `actionlint`
- `bd` for beads status checks
- Official Claude GitHub Actions documentation was used earlier in the workflow-hardening session to confirm v1 action argument placement and supported behavior.

