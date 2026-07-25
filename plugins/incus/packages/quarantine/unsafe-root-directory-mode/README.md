# Quarantined classic packages

These packages must not be published or installed. Their tar root entry (`./`)
and other directory entries were stored as mode `0777`. Unraid's `upgradepkg`
applied that metadata to the live root filesystem, causing OpenSSH
`StrictModes` to reject new public-key logins.

Build 54 supersedes these artifacts, omits the archive root, normalizes every
packaged directory to `root:root 0755`, and restores executable modes on all
private runtime helpers.

| Build | SHA-256 |
|---|---|
| 48 | `684efa146b86707666d5191303941bfabcad7e4f10ea714f9c3fda3b0540d315` |
| 49 | `cdb39b5fcb99b4074c10c093679178253c6aa47bc8e6a56ace9380fa6bbf69d4` |
| 50 | `44546b3562f183e28b3eac166260896635cf7606561f4b2ce5667e08922bdaa6` |
| 51 | `71e69f77e8af3aa5d561bd296acdb15625525561af834f3f86b67fbd616b0c8f` |
| 52 | `08ace6310036e29e31a03e9fd02a94807e8b0adef2a5fb2e0c617a8d9345e5af` |

The release contract rejects builds 48 through 52 at the active
`packages/` root. Keeping the known artifacts under this quarantine path
preserves forensic evidence without allowing the build helper or plugin URL
to select them.
