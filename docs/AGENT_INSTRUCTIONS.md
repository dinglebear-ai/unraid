# Shared and local agent instructions

## Ownership and layout

Keep portable repository policy in [AGENTS.md](../AGENTS.md). Each component's
`AGENTS.md` adds instructions for that scope. Edit the canonical file, not an
independent assistant-specific copy.

| File | Ownership | Git policy |
| --- | --- | --- |
| `AGENTS.md` | Shared repository or component guidance | Tracked, regular file |
| `CLAUDE.md` | Relative symlink to `AGENTS.md` | Tracked symlink |
| `GEMINI.md` | Relative symlink to `AGENTS.md` | Tracked symlink |
| `AGENTS.override.md` | Canonical personal instructions for this checkout/scope | Ignored, regular file |
| `CLAUDE.local.md` | Relative symlink to `AGENTS.override.md` | Ignored symlink |

Shared guidance includes project architecture, supported toolchains, product
default paths, build commands, safety rules, and release contracts. Local
guidance includes a developer's hostnames, usernames, checkout paths, private
service endpoints, and personal tool preferences. Product defaults such as a
credential directory are not the same as one developer's actual credentials.
Never put secret values in either instruction file.

## Confirmed client behavior

The official [Codex instruction guide](https://developers.openai.com/codex/guides/agents-md)
specifies `AGENTS.override.md`, then `AGENTS.md`, then configured fallback names.
Codex chooses at most one nonempty instruction file per directory and combines
scopes from the project root down to the working directory. Consequently, a
root override does **not** automatically supplement the root `AGENTS.md`.

The official [Claude Code memory guide](https://code.claude.com/docs/en/memory)
specifies `CLAUDE.local.md` for private project instructions and loads it
alongside `CLAUDE.md`. Claude supports `@path` imports. The filename is
**not** `CLAUDE.md.local`; retain the legacy ignore rule only to prevent
accidental publication during migration.

Our local template explicitly tells Codex to read the shared file and uses
`@AGENTS.md` for Claude's import mechanism. The explicit reading instruction is
a repository convention, not a claim that Codex implements Claude's `@` imports.
Do not copy the entire shared guide into the override: that creates another
version to maintain. The shared guide must not import the local override, which
would create a cycle and make private instructions a dependency of the repo.

## Create a local override

From the instruction scope, first inspect existing files and symlink targets.
Preserve and reconcile any existing content before changing its location.
Create `AGENTS.override.md` as a regular file with this baseline:

```markdown
# Local agent instructions

Before doing any work, read and follow the shared AGENTS.md in this directory.
Codex selects this override instead of that file; the notes below supplement
the shared policy rather than replace it.

@AGENTS.md

## Local environment

Add this checkout's non-secret machine and workflow details here.
```

Then create the alias only when neither a regular file nor a symlink already
occupies its name:

```bash
test ! -e CLAUDE.local.md && test ! -L CLAUDE.local.md &&
  ln -s AGENTS.override.md CLAUDE.local.md
chmod 600 AGENTS.override.md
git check-ignore --no-index AGENTS.override.md CLAUDE.local.md
```

Both filenames are ignored at every depth. Do not force-add them, including
when a task authorizes publishing all existing dirty changes. A local override
is specific to its checkout; a new worktree does not receive ignored files
automatically. Recreate or deliberately copy local guidance into the intended
worktree rather than following a link into a different checkout.

Keep root overrides at the root unless a component genuinely needs additional
local instructions. A nested override must load that directory's `AGENTS.md`.
This layout establishes no unsupported Gemini local filename.

## Migration and verification

For inverted layouts, preserve the old canonical content, move it into a regular
`AGENTS.md`, and replace only the reconciled aliases with relative symlinks.
For `CLAUDE.md.local`, move the reconciled personal content into
`AGENTS.override.md`, include the baseline above, and use `CLAUDE.local.md`.
Do not silently overwrite an independent local document.

From the repository root:

```bash
python3 .github/scripts/check_documentation.py
python3 -m unittest discover -s .github/scripts/tests -p 'test_*.py'
git ls-files 'AGENTS.override.md' '**/AGENTS.override.md' \
  'CLAUDE.local.md' '**/CLAUDE.local.md'
git diff --check
```

The `git ls-files` command must return no local instruction files. The checker
validates shared instruction triplets, ignore coverage, accidental publication
of private instruction names, and the local alias/import contract in each
discovered instruction scope that contains a local pair. A clean CI checkout is not required to contain local files.
The checker never prints their contents. `--repair-links` repairs shared aliases
only; it neither creates nor overwrites local instructions.

For client-level confirmation, start a new Codex session in the intended scope
and ask it to identify the active instruction files and read `AGENTS.md`. In
Claude Code, use `/context` to inspect loaded memory files. Filesystem and unit
tests establish the layout, not a guarantee that an agent follows every rule.

See [DEVELOPMENT.md](DEVELOPMENT.md) for the remaining validation gates.
