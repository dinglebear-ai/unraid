# CI/CD Workflows

GitHub Actions configuration for unraid-mcp.

## Workflows

### `ci.yml` -- Continuous Integration

**Triggers**: Push to `main`, `feat/**`, `fix/**`; PRs to `main`.

| Job | Purpose | Tools |
|-----|---------|-------|
| `lint` | Ruff check and format verification | `ruff check`, `ruff format --check` |
| `typecheck` | Static type analysis | `ty check` |
| `test` | Unit tests with coverage | `pytest -m "not slow and not integration" --cov` |
| `version-sync` | Verify all version files match | Shell script comparing pyproject.toml, plugin.json (x3), gemini-extension.json |
| `mcp-integration` | Live MCP integration tests | `test_live.sh` with secrets (push/same-repo PRs only) |
| `audit` | Dependency security audit | `uv audit` |

### `docker-publish.yml` -- Docker Image Build

**Triggers**: Push to `main`, tags `v*`, PRs to `main`, manual dispatch.

| Step | Purpose |
|------|---------|
| Docker Buildx setup | Multi-platform build support |
| GHCR login | Authenticate to GitHub Container Registry |
| Metadata extraction | Generate image tags (semver, branch, SHA, latest) |
| Build and push | Multi-arch (amd64, arm64), layer caching (GHA), SBOM, provenance |
| Trivy scan | Vulnerability scan for CRITICAL and HIGH severity |

**Image tags**: `latest` (main branch), `v1.2.3`, `v1.2`, `v1`, `main`, `pr-N`, `sha-<hex>`.

**Registry**: `ghcr.io/jmagar/unraid-mcp`.

### `release-please.yml` -- Versioning and Changelog

**Triggers**: Push to `main`.

Runs [release-please](https://github.com/googleapis/release-please), which maintains a
"release PR" that bumps the version in `pyproject.toml` + the three plugin manifests and
updates `CHANGELOG.md` from Conventional Commit messages. Merging that PR creates the
`vX.Y.Z` tag and a GitHub Release. Config lives in `release-please-config.json` and
`.release-please-manifest.json`.

> Uses the `RELEASE_PLEASE_TOKEN` secret (PAT or GitHub App token). The default
> `GITHUB_TOKEN` cannot trigger downstream workflows, so the tag/release it creates would
> never reach `publish-pypi.yml` or `docker-publish.yml` without this token.

### `publish-pypi.yml` -- PyPI and Registry Release

**Triggers**: `release: published` (the Release that `release-please` creates on merge).

| Step | Purpose |
|------|---------|
| Version verification | Tag must match `pyproject.toml` version |
| Build | `uv build` produces sdist and wheel |
| PyPI publish | Trusted publisher with attestations |
| Upload artifacts | Attaches sdist/wheel to the existing release |
| MCP Registry publish | Sets `server.json` version from the tag, then DNS-authenticated publish to `tv.tootie/unraid-mcp` via `mcp-publisher` |

## Version sync enforcement

Versions are bumped automatically by `release-please.yml`. The CI `version-sync` job is a
safety net that fails if these files drift apart:
- `pyproject.toml`
- `.claude-plugin/plugin.json`
- `.codex-plugin/plugin.json`
- `gemini-extension.json`

`server.json` is a `0.0.0` placeholder in-repo (set from the tag at publish time) and is
not checked here.

## Secrets required

| Secret | Used by | Purpose |
|--------|---------|---------|
| `GITHUB_TOKEN` | Most workflows | GHCR login, artifact upload |
| `RELEASE_PLEASE_TOKEN` | `release-please` | PAT/App token so tags + releases trigger downstream publish workflows |
| `UNRAID_API_URL` | `mcp-integration` | Live test target |
| `UNRAID_API_KEY` | `mcp-integration` | Live test auth |
| `MCP_PRIVATE_KEY` | `publish-pypi` | DNS-authenticated MCP registry publish |

## Local equivalents

| CI Job | Local command |
|--------|--------------|
| lint | `just lint` or `uv run ruff check .` |
| format | `just fmt` or `uv run ruff format .` |
| typecheck | `just typecheck` or `uv run ty check src/` |
| test | `just test` or `uv run pytest` |
| build | `just build` or `docker build -t unraid-mcp .` |

## See Also

- [TESTS.md](TESTS.md) -- Test suite details
- [PUBLISH.md](PUBLISH.md) -- Versioning and release strategy
- [PRE-COMMIT.md](PRE-COMMIT.md) -- Local git hook checks
