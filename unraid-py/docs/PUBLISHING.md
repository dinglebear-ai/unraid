# Publishing

The canonical release procedure is [mcp/PUBLISH.md](mcp/PUBLISH.md).

Releases are automated by release-please. Maintainers do not edit version strings,
create tags, build distributions, or upload distributions by hand. Merge Conventional
Commits to `main`; release-please maintains the release PR and creates the tag and
GitHub Release when that PR merges.

The automated release publishes one attested Python artifact set independently to PyPI,
the GitHub Release, and the MCP Registry; the container workflow publishes the same source
revision to GHCR. A final reconciliation gate verifies every channel. See
[ROLLBACK.md](ROLLBACK.md) for partial-publication recovery and rollback.
