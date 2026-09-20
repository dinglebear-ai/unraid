# Rollback / Yank Runbook -- unraid-mcp

What to do when a bad release ships. Merging the release-please PR fires a chain:

1. **PyPI publish** -- `publish-pypi.yml` on the GitHub Release (`release: published`).
2. **Docker publish** -- `docker-publish.yml` on the `v*` tag push.
3. **MCP Registry publish** -- its independent job stamps `server.json` from the tag.
4. **GitHub Release assets** -- the exact attested wheel, sdist, and `SHA256SUMS`.

The published tool surface includes **destructive Unraid actions** (`array stop_array`,
`array remove_disk`, `docker remove_container`, `vm force_stop`, `key delete`, ...). A bad
release has real blast radius, so treat rollback as an incident, not housekeeping.

> **First rule of releases:** versions are immutable. You cannot un-publish and re-use a
> version number on any immutable channel. Recovery is always **yank/re-pin the bad
> version + ship a forward-fix patch**, never "re-upload the same version with the fix."

---

## Partial release recovery

A channel failure after another channel succeeds is not a rollback. Keep the existing tag
and source SHA, then rerun only the failed job in `Release Artifacts` or `Container Artifact`.
The jobs reuse the internal artifact and reconcile existing channel state.

1. Download the workflow artifact and run `(cd dist && sha256sum --check SHA256SUMS)`.
2. Inspect PyPI JSON, GitHub Release assets, the exact MCP Registry version endpoint,
   and the GHCR semver digest to identify the missing channel.
3. Rerun the failed channel job for the same `vX.Y.Z` tag.
4. Rerun `Release Reconciliation`; completion requires matching checksums, versions,
   and GHCR `X.Y.Z`/`latest` digests.

If the internal artifact is gone, do not rebuild under the same version. Yank/deprecate
the partial release and ship a forward-fix version.

---

## 1. PyPI -- yank + forward-fix

PyPI does **not** allow re-uploading files for a version, even after you delete or yank it.
You cannot "fix `X.Y.Z` in place." Recovery is two independent actions:

**Yank the bad version** (hides it from new resolves; existing pins that request it exactly
still install it, so in-flight deployments don't break):

```bash
# Via twine (preferred, scriptable)
uv run twine yank unraid-mcp X.Y.Z --reason "broken release: <short reason>"

# Or via the web UI: pypi.org/manage/project/unraid-mcp/release/X.Y.Z/ -> "Yank"
```

**Ship a forward-fix patch.** release-please makes this fast -- land a `fix:` commit on
`main`, merge the release PR it opens, and the chain republishes a clean `X.Y.(Z+1)`:

```bash
git commit -m "fix: <what was broken in X.Y.Z>"
# push -> merge the release-please PR -> publish-pypi.yml ships X.Y.(Z+1)
```

Tell consumers to upgrade (`uvx unraid-mcp-server@X.Y.(Z+1)`, `uv add unraid-mcp@>=X.Y.(Z+1)`).
Yanking alone does not move anyone forward; the patch is what fixes them.

---

## 2. Docker -- re-pin to a prior immutable tag/digest

The GHCR image is at `ghcr.io/<owner>/unraid-mcp`. You cannot delete a tag and expect
consumers to recover -- you tell them to **re-pin to a known-good prior image by digest**.

`docker/metadata-action` tags every build addressably, so a prior good build is always
reachable even if the moving tags (`latest`, `X`, `X.Y`) now point at the bad release:

- `type=semver` -> `X.Y.Z`, `X.Y`, `X` (immutable version tags)
- `type=sha` -> `sha-<commit>` (immutable per-commit tag)
- every build is also addressable by `@sha256:<digest>`

**Recovery -- pin consumers to the prior digest:**

```bash
# Find the last-good version's digest (use the prior X.Y.Z tag)
docker buildx imagetools inspect ghcr.io/<owner>/unraid-mcp:<prior-version>
# -> copy the Digest: sha256:... line

# Pin deployments to that immutable digest (compose / run)
image: ghcr.io/<owner>/unraid-mcp@sha256:<prior-digest>
```

Pinning by `@sha256:...` (not a moving tag) guarantees the rolled-back deploy can't drift
back onto the bad image. Then ship the forward-fix patch (section 1) so `latest`/`X.Y` move
to a clean build, and consumers can return to tag-based pins.

To list available tags/digests when you don't know the prior version:

```bash
gh api /users/<owner>/packages/container/unraid-mcp/versions \
  --jq '.[] | {tags: .metadata.container.tags, created: .created_at}'
```

---

## 3. MCP Registry -- republish the prior version

The registry entry is driven by `server.json`, whose version is stamped from the git tag at
publish time. Recovery is the same forward pattern: **republish the last-good version**, then
let the forward-fix patch publish a clean newer one.

```bash
# Re-stamp server.json to the known-good prior version and republish
jq --arg v "<prior-version>" '
  .version = $v |
  .packages = [.packages[] | if .registryType == "pypi" then .version = $v else . end]
' server.json > server.tmp && mv server.tmp server.json

./mcp-publisher login dns --domain tootie.tv --private-key "$MCP_PRIVATE_KEY"
./mcp-publisher publish
```

In normal operation `server.json` is a `0.0.0` placeholder in-repo and is set from the tag by
`publish-pypi.yml` -- only stamp it by hand for an out-of-band rollback republish. The forward-
fix patch will publish the clean `X.Y.(Z+1)` through the normal chain.

---

## Prevention

These guards exist to catch a bad release before (or just after) it ships -- keep them green:

- **Version-sync guard.** Both `publish-pypi.yml` and `docker-publish.yml` assert the git tag
  matches `pyproject.toml` before publishing, so a tag<->source drift fails the build instead
  of shipping a mismatched version. `ci.yml`'s version-sync job checks the manifests on PRs.
- **Trivy scan (advisory).** `docker-publish.yml` runs Trivy on the built image and uploads
  SARIF to GitHub Security. It is **advisory** -- it surfaces CRITICAL/HIGH CVEs but does not
  block the publish. Review the Security tab after a release; a flagged image is a candidate
  for a forward-fix rebuild.
- **Don't hand-edit versions.** Let release-please own the bump (see `docs/PUBLISHING.md` and
  `docs/CHECKLIST.md`). Forward-fixing via a `fix:` commit is the supported fast path back to a
  clean release.
