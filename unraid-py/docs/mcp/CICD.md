# Python CI and release workflows

Workflows live in the **monorepo-root** `.github/workflows/`, not a Python-local
`.github/` directory. The executable workflow definitions are authoritative
for triggers, jobs, secrets, and publication gates. See the
[shared development guide](../../../docs/DEVELOPMENT.md) and
[release guide](../../../docs/RELEASING.md).

## Validation

[`ci.yml`](../../../.github/workflows/ci.yml) runs locked dependency setup,
Ruff lint/format, Ty typechecking, unit coverage, and separate
integration/mock-server checks. Live schema/API checks are separate from
offline unit coverage; do not claim they passed without a configured target
and an actual run. Preserve `.github/workflows/**` in its path trigger so
the Python workflow-policy tests also gate shared workflow edits.

[`meta-ci.yml`](../../../.github/workflows/meta-ci.yml) checks shared release
metadata, marketplace parity, action pins/allowlist, YAML, Community
Applications metadata, instruction symlinks, maintained local documentation
links, and the shared tooling unit suite. Missing workflow checks are not
equivalent to successful checks.

Root [`lefthook.yml`](../../../lefthook.yml) supplies staged environment-file
protection and component-scoped local hooks. `.gitleaks.toml` is retained for
manual scanning; do not restore a retired secret-scanning job based on old
documentation. Verify the current hosted security settings before changing policy.

## Publication

[`release-please.yml`](../../../.github/workflows/release-please.yml) owns the
Python/Rust release-please lane. Python tags remain `vX.Y.Z`.
[`publish-pypi.yml`](../../../.github/workflows/publish-pypi.yml),
[`docker-publish.yml`](../../../.github/workflows/docker-publish.yml), and
[`mcp-registry.yml`](../../../.github/workflows/mcp-registry.yml) define the
package, container, and registry release paths. Check their actual conditions
and results rather than assuming every main push publishes everything.

Release-managed fields include `unraid-py/pyproject.toml`, the two
`agents/unraid-py/` client manifests, `unraid-py/gemini-extension.json`, and
configured `server.json` fields. They are listed in the root release-please
configuration. `server.json` is not a permanently unversioned placeholder.

No production credentials or real Unraid mutations are required for a
documentation-only change. Do not enable live jobs, change publication gates,
or alter repository secrets merely to complete this checklist.

## Local checks

From `unraid-py/`:

```bash
uv sync --locked --group dev
uv run ruff check src/ tests/
uv run ruff format --check src/ tests/
uv run ty check src/
uv run pytest -m 'not slow and not integration' --tb=short -q
just check-contract
```

Select narrower tests during iteration. `just fmt` modifies formatting; it is
not the read-only CI formatting check. See [TESTS.md](TESTS.md) and
[PRE-COMMIT.md](PRE-COMMIT.md) for details.
