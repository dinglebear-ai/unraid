---
title: Agent instruction layout reference
created: 2026-09-27
updated: 2026-09-27
---

# Agent instruction layout reference

This page explains the repository's instruction-file validation and local setup.
The root [AGENTS.md](../AGENTS.md) is a compact repository map and contract guide,
not a copy of a developer's global workflow policy.

## Separate the scopes

| Scope | Content | Publication |
| --- | --- | --- |
| Global `AGENTS.md` | Cross-project workflow, Git safety, tools, evidence, communication, instruction conventions | User configuration, outside this repo |
| Global `AGENTS.override.md` | Verified workstation facts and tool-resolution observations | Private user configuration |
| Repository/component `AGENTS.md` | Architecture, build roots, commands, contracts, component pitfalls | Tracked here |
| Repository/component `AGENTS.override.md` | Checkout paths, private service configuration, local prerequisites and caveats | Ignored here |

Host facts should be checked on the actual machine and dated. Configuration,
reachability, authentication, and successful execution are different facts.
Record names and locations, not credential values. Do not commit copies of
global instructions or private overrides merely to publish all dirty changes.

## Global entry points

The default global locations are Codex `~/.codex/AGENTS.md`, Claude Code
`~/.claude/CLAUDE.md`, and Gemini CLI `~/.gemini/GEMINI.md`. In an
AGENTS-canonical setup, the latter two can be relative symlinks to the first.
Check configured homes and existing content before changing this layout.
These are client entry points, not additional files for this repository.

Codex also selects a global `AGENTS.override.md` ahead of its base. Do not
assume Claude discovers a configuration-directory `CLAUDE.local.md` as a
global-local layer: use an explicit import from its global entry point when
needed. A global override imported by its base must guard its base-read
directive against recursive loading. Do not put a reciprocal `@` import in it.

See the official [Codex guide](https://developers.openai.com/codex/guides/agents-md/),
[Claude Code memory guide](https://code.claude.com/docs/en/memory), and
[Gemini CLI context guide](https://geminicli.com/docs/cli/gemini-md/).
The paths and precedence above were checked on 2026-09-27; desktop products
can differ. In particular, Claude's documented Cowork restrictions exclude
symlinked global memory files. This setup targets the CLIs, not a universal
desktop loading contract.

## Repository layout

| File | Required form | Git policy |
| --- | --- | --- |
| `AGENTS.md` | Regular canonical file | Tracked |
| `CLAUDE.md` | Relative symlink to `AGENTS.md` | Tracked symlink |
| `GEMINI.md` | Relative symlink to `AGENTS.md` | Tracked symlink |
| `AGENTS.override.md` | Optional regular local file | Ignored |
| `CLAUDE.local.md` | Relative symlink to `AGENTS.override.md` when present | Ignored |

Codex loads at most one instruction file per directory, preferring
`AGENTS.override.md` to `AGENTS.md`. A checkout override must therefore tell
it to read the matching base unless already loaded. Claude loads the local
file alongside its shared file and supports `@path` imports. The valid name
is `CLAUDE.local.md`, not `CLAUDE.md.local`. No default `GEMINI.local.md`
convention is assumed; clients without override discovery need an explicit
read instruction from their user-level guidance.

A repository override starts with:

```markdown
# Local checkout instructions

Before doing any work, read and follow the shared AGENTS.md in this directory
unless already loaded. Codex selects this override instead of that file.

@AGENTS.md

Add verified, nonsecret facts specific to this checkout here.
```

The plain-language directive is for Codex; it does not implement Claude's
import syntax. The import line is also required by the local checker. The
shared repository guide must not import an ignored private file.

Preserve existing notes before creating or repairing either local file. When
its alias is absent, create `CLAUDE.local.md -> AGENTS.override.md`, set the
override to mode 0600, and verify both names are ignored. Ignored files do not
arrive in new worktrees through Git. A nested override loads its matching
component guide rather than a different scope's file.

## Repository validation

From the root, after staging reviewed shared changes:

```bash
python3 .github/scripts/check_documentation.py --check-index
python3 -m unittest discover -s .github/scripts/tests -p 'test_*.py'
git check-ignore --no-index AGENTS.override.md CLAUDE.local.md
git ls-files 'AGENTS.override.md' '**/AGENTS.override.md' 'CLAUDE.local.md' '**/CLAUDE.local.md'
git diff --check
```

The `git ls-files` command must return no private instruction files. The checker
validates canonical files, shared aliases, ignore coverage, accidental staging
of local files, and any existing local alias/import pairs without printing
private contents. Clean clones do not need local overrides. `--check-index`
validates staged modes and targets so a repaired working tree cannot hide a
broken published layout.

`--repair-links` only repairs shared aliases after validating every scope. It
refuses to overwrite independent regular documents. Reconcile inverted
layouts and preserve their content before replacing aliases.

The [Repository Contract workflow](../.github/workflows/repository-contract.yml)
uses an immutable fleet-validator revision and a
[local adapter](../.github/scripts/check_repository_contract.py). The adapter
replaces only the upstream Claude-canonical rule with this repository's
AGENTS-canonical index/working-tree checks; all remaining fleet rules stay
fatal. The Codex plugin's `container/workspace-CLAUDE.md` remains a runtime
template, not an instruction triplet.

Filesystem checks establish the layout, not client compliance. Start a new
Codex session to check its loaded instruction chain; use Claude `/context` or
Gemini `/memory show` to inspect their loaded context.

See [DEVELOPMENT.md](DEVELOPMENT.md) for the other repository gates.
