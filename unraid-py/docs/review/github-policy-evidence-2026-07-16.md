# GitHub policy evidence — 2026-07-16

Repository: `jmagar/unraid-mcp` (`main`). Evidence was read and changed through the
GitHub REST API during the full-project review remediation.

## Before

- `GET /branches/main/protection`: `strict=false`; required contexts were only
  `Lint & Format`, `Type Check`, `Version Sync Check`, `Test (py3.12)`, and
  `Test (py3.13)`; admin enforcement was disabled; no pull-request review rule,
  linear-history rule, or conversation-resolution rule was present.
- `GET /rulesets`: no repository rulesets.
- `GET /environments/release`: no protection rules, no deployment-branch policy,
  and `can_admins_bypass=true`.
- `GET /actions/permissions`: all actions allowed and SHA pinning not required.
- `GET /actions/permissions/workflow`: default token permission was `write` and the
  token could approve pull-request reviews.

## Applied

- Required the exact workflow job contexts defined by the remediated workflows:
  `Lint & Format`, `Type Check`, `Version Sync Check`, `Test (py3.12)`,
  `Test (py3.13)`, `Integration & Mock Roundtrip`, `Security Audit`, `Secret Scan`,
  `Package Artifact Smoke`, and `Container Artifact Smoke & Scan`.
- Enabled strict/up-to-date status checks, admin enforcement, pull-request gating,
  stale-review dismissal, linear history, and conversation resolution. Force pushes
  and deletions remain disabled. The repository has one collaborator (`jmagar`), who
  is also its sole CODEOWNER, so approval, CODEOWNER-review, and last-push-approval
  counts remain zero: GitHub forbids self-approval and enabling those controls would
  make every maintainer-authored pull request permanently unmergeable.
- Protected the `release` environment with required reviewer `jmagar`, disabled admin
  bypass, and allowed deployments only from tag policy `v*`.
- Changed Actions to `selected`, required full-SHA pinning, retained GitHub-owned and
  verified actions, and allowlisted only the third-party owners used by this repository.
- Changed the default workflow token to read-only and disabled its ability to approve
  pull-request reviews.

## After

- `GET /branches/main/protection`: `strict=true`, all ten contexts above present,
  `enforce_admins=true`, pull requests required with
  `required_approving_review_count=0`, `require_code_owner_reviews=false`, and
  `require_last_push_approval=false` for the documented sole-maintainer constraint,
  `required_linear_history=true`, and `required_conversation_resolution=true`.
- `GET /environments/release`: required-reviewer and branch-policy rules present,
  `can_admins_bypass=false`, custom deployment policy `v*` with type `tag`.
- `GET /actions/permissions`: `allowed_actions=selected`,
  `sha_pinning_required=true`.
- `GET /actions/permissions/workflow`: `default_workflow_permissions=read`,
  `can_approve_pull_request_reviews=false`.
- `GET /actions/permissions/selected-actions`: GitHub-owned and verified actions allowed;
  third-party patterns are limited to Anthropic, Aqua Security, Astral, Docker,
  Gitleaks, Google release-please, Peter Evans create-pull-request, PyPA publisher,
  and Tailscale. Workflow policy tests independently require every actual `uses:`
  reference to be a 40-character commit SHA.
