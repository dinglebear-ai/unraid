# `scripts/`

Repo-maintenance scripts used by CI, git hooks, and the `Justfile` — **not**
shipped to plugin runtimes. (Plugin-runtime hook scripts live in
`agents/unraid-py/scripts/`, where they are discoverable via `${CLAUDE_PLUGIN_ROOT}`.)

## Contents

- `check-version-sync.sh` — verify the version is consistent across `pyproject.toml`
  and the three plugin manifests under `agents/unraid-py/`. Run by CI; also exposed as
  `just check-contract`.
- `validate-marketplace.sh` — validate the Claude Code marketplace
  (`.claude-plugin/marketplace.json`) and the plugin manifest/skill structure under
  `agents/unraid-py/`. Exposed as `just validate-marketplace`.
- `block-env-commits.sh` — lefthook pre-commit guard against committing `.env` files.
- `generate_unraid_api_reference.py` — regenerate the GraphQL API docs from live
  introspection (`uv run python scripts/generate_unraid_api_reference.py`). Requires
  `UNRAID_API_URL` + `UNRAID_API_KEY` in env; writes five files under `docs/unraid/`.

## Expectations

- Each executable has a shebang and clear exit codes.
- Prefer deterministic behavior; document required inputs near the consumer.
- These run from the repo root — reference paths relative to the repo root.
