# Live Unraid introspection diff

- Captured: 2026-07-23T20:14:58Z
- Source: production Unraid API used by `runraid`
- Snapshot: `schema/live-introspection.json`
- Compared with: `schema/unraid-schema.graphql`
- Comparison: normalized structural contract
- Result: published Unraid SDL remains compatible; the live schema has 17
  additional types and plugin-provided fields

The compatibility comparison covers operation roots, named types, field return
types, field arguments, input fields, enum values, implemented interfaces, and
union member types. Every published SDL element exists unchanged in the live
schema. Descriptions, ordering, default values, and applied directive locations
are excluded because standard introspection cannot reproduce the complete SDL
source representation.

The live-only surface comes from the installed Incus integration and includes
jail lifecycle and exec operations, image building, builder presets, package
search, Homebrew installation status, and Incus configuration. These extensions
are retained in the live snapshot so future live drift remains visible, but
they are not copied into `schema/unraid-schema.graphql`: that file remains an
exact vendored copy of Unraid's published SDL so the upstream drift check stays
meaningful.

The four deprecated Docker `skipCache` arguments on `containers`, `networks`,
`organizer`, and `portConflicts` are present in both the live API and vendored
SDL. An earlier diff incorrectly reported them as removed because its
introspection query did not request deprecated arguments. The committed capture
uses `includeDeprecated: true`.

Refresh and check:

```bash
just schema-live-capture
just schema-live-diff
```

The daily `.github/workflows/schema-drift.yml` job runs the same live check when
the repository has dedicated `UNRAID_API_URL` and `UNRAID_API_KEY` secrets.
It emits a warning and continues the published-SDL check when those credentials
are not configured; do not reuse an administrative production key for CI.
