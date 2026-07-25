# Publishing Strategy

Versioning and release workflow for unraid-mcp.

## Versioning

Semantic versioning (MAJOR.MINOR.PATCH):

- **MAJOR** (X.0.0): Breaking changes to the MCP tool interface
- **MINOR** (1.X.0): New actions, subactions, or features (backward compatible)
- **PATCH** (1.0.X): Bug fixes, documentation updates

## Version files

**Do not edit version strings by hand** — release-please keeps these in sync from
Conventional Commits (configured in `release-please-config.json`):

| File | Format | Managed by |
|------|--------|------------|
| `pyproject.toml` | `version = "X.Y.Z"` in `[project]` | release-please |
| `.claude-plugin/plugin.json` | `"version": "X.Y.Z"` | release-please (`extra-files`) |
| `.codex-plugin/plugin.json` | `"version": "X.Y.Z"` | release-please (`extra-files`) |
| `gemini-extension.json` | `"version": "X.Y.Z"` | release-please (`extra-files`) |
| `CHANGELOG.md` | Entry generated from commits | release-please |
| `server.json` | `0.0.0` placeholder in-repo; set from the tag at publish time | `publish-pypi.yml` |
| `src/unraid_mcp/version.py` | reads `importlib.metadata` at runtime | not a file (auto) |

`.release-please-manifest.json` tracks the last released version. The CI `version-sync`
job is a safety net asserting the first four files agree.

## Release workflow

Releases are driven by **release-please** + Conventional Commits — there is no manual
`just publish`. Bump type is inferred from commit messages: `fix:` → patch, `feat:` →
minor, `feat!:` / `BREAKING CHANGE` → major.

1. Land changes on `main` with Conventional Commit messages.
2. `release-please.yml` opens/updates a `chore(main): release X.Y.Z` PR that bumps every
   version file and updates `CHANGELOG.md`.
3. **Merge the release PR.** release-please creates the `vX.Y.Z` tag and GitHub Release.

> The release-please action authenticates with the `RELEASE_PLEASE_TOKEN` secret (a PAT or
> GitHub App token). The default `GITHUB_TOKEN` cannot trigger the downstream publish
> workflows, so this token is required for PyPI/Docker/registry publishing to fire.

### What happens after the release PR merges

The new tag + Release trigger two independently retryable workflows:

**`publish-pypi.yml`** (on `release: published`):
1. Builds the wheel and sdist once in an unprivileged job using uv `0.9.25` with caches disabled.
2. Validates metadata and contents, installs only the built wheel in a clean environment,
   and completes MCP stdio initialization and `tools/list`.
3. Generates `SHA256SUMS`, stores one immutable internal artifact, and emits GitHub
   build-provenance attestations for those exact files.
4. Publishes PyPI, GitHub Release, and MCP Registry in separate retryable jobs with
   channel-state checks; no credentialed job rebuilds the package.
5. Downloads MCP publisher v1.8.0 from an immutable URL and verifies its upstream
   SHA-256 before the job receives the registry private key.
6. Reconciles checksums, versions, and the GHCR release digest across all channels.

**`docker-publish.yml`** (on pull request, `main`, and tag `v*`):
1. Pull requests load and execute the built image against the mock upstream, validate
   liveness/readiness and MCP discovery, assert runtime package managers are absent, and
   run a blocking fixable High/Critical scan.
2. `main` publishes only `edge` and SHA tags; it never moves `latest`.
3. Semver tags publish the multi-architecture image (amd64, arm64) with semver, SHA,
   and `latest` tags plus SBOM/provenance attestations.

## Distribution channels

| Channel | Package | Install command |
|---------|---------|----------------|
| PyPI | `unraid-mcp` | `pip install unraid-mcp` or `uvx unraid-mcp` |
| GHCR release | `ghcr.io/jmagar/unraid-mcp` | `docker pull ghcr.io/jmagar/unraid-mcp:latest` |
| GHCR prerelease | `ghcr.io/jmagar/unraid-mcp:edge` | `docker pull ghcr.io/jmagar/unraid-mcp:edge` |
| MCP Registry | `tv.tootie/unraid-mcp` | MCP client auto-discovery |
| Claude Plugin | `jmagar/unraid-mcp` | `/plugin install unraid-mcp` |
| GitHub Release | Source + wheel | Download from releases page |

## MCP Registry

Published as `tv.tootie/unraid-mcp` using DNS authentication via `tootie.tv`.

The `server.json` defines the registry entry:
- Package type: `pypi`
- Runtime hint: `uvx`
- Transport: `stdio`
- Required env vars: `UNRAID_API_URL`, `UNRAID_API_KEY`

## Artifact verification

```bash
gh release download vX.Y.Z --repo jmagar/unraid-mcp
sha256sum --check SHA256SUMS
gh attestation verify unraid_mcp-X.Y.Z-py3-none-any.whl --repo jmagar/unraid-mcp
docker buildx imagetools inspect ghcr.io/jmagar/unraid-mcp:X.Y.Z
```

Pin production containers to the reported digest when immutability is required.

## Release automation liveness

The daily `release-liveness.yml` monitor opens a `Release automation liveness failure`
issue when releasable commits exist but no release PR has updated for 48 hours. Rotate
`RELEASE_PLEASE_TOKEN` or replace the expiring PAT with a repository-scoped GitHub App
credential, then rerun release-please.

## Partial publication recovery

Do not rebuild, retag another commit, or repeat a completed immutable upload. Rerun the
failed channel job for the existing tag; its state check skips completed publication.
The reconciliation job stays red until PyPI, GitHub Release, MCP Registry, and GHCR agree.
See [../ROLLBACK.md](../ROLLBACK.md#partial-release-recovery).

## See Also

- [CICD.md](CICD.md) -- Workflow configuration details
- [../CHECKLIST.md](../CHECKLIST.md) -- Pre-release checklist
