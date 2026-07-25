# Destructive Actions

**Total destructive actions:** 26 across 11 domains (single `unraid` tool)

All destructive actions require `confirm=True` at the call site. There is no additional
environment variable gate — `confirm` is the sole guard. (Exception: `plugin install` /
`install_language` additionally pass through an SSRF guard before forwarding — see that
domain below.)

| Domain (`action=`) | Destructive subactions |
|--------------------|------------------------|
| `array` | `stop_array`, `remove_disk`, `clear_disk_stats` |
| `vm` | `force_stop`, `reset` |
| `notification` | `delete`, `delete_archived` |
| `rclone` | `delete_remote` |
| `key` | `delete` |
| `disk` | `flash_backup` |
| `setting` | `configure_ups`, `update_ssh`, `update_system_time` |
| `plugin` | `remove`, `install`, `install_language` |
| `docker` | `remove_container`, `reset_template_mappings`, `delete_entries` |
| `connect` | `sign_in`, `sign_out`, `update_api_settings`, `setup_remote_access`, `enable_dynamic_remote_access` |
| `onboarding` | `reset`, `create_internal_boot_pool` |

> **mcporter commands below** use stdio transport. Run `test-tools.sh` for automated non-destructive coverage; destructive actions are always skipped there and tested manually per the strategies below.
>
> **Calling convention (v1.0.0+):** All operations use the single `unraid` tool with `action` (domain) + `subaction` (operation). For example:
> `mcporter call --stdio-cmd "uv run unraid-mcp-server" --tool unraid --args '{"action":"docker","subaction":"list"}'`

---

## `array`

### `stop_array` — Stop the Unraid array

**Strategy: mock/safety audit only.**
Stopping the array unmounts all shares and can interrupt running containers and VMs accessing array data. Test via `tests/safety/` confirming the `confirm=False` guard raises `ToolError`. Do not run live unless all containers and VMs are shut down first.

---

### `remove_disk` — Remove a disk from the array

```bash
# Prerequisite: array must already be stopped; use a disk you intend to remove

mcporter call --stdio-cmd "uv run unraid-mcp-server" --tool unraid \
  --args '{"action":"array","subaction":"remove_disk","disk_id":"<DISK_ID>","confirm":true}' --output json
```

---

### `clear_disk_stats` — Clear I/O statistics for a disk (irreversible)

```bash
# Discover disk IDs
mcporter call --stdio-cmd "uv run unraid-mcp-server" --tool unraid \
  --args '{"action":"disk","subaction":"disks"}' --output json

# Clear stats for a specific disk
mcporter call --stdio-cmd "uv run unraid-mcp-server" --tool unraid \
  --args '{"action":"array","subaction":"clear_disk_stats","disk_id":"<DISK_ID>","confirm":true}' --output json
```

---

## `vm`

### `force_stop` — Hard power-off a VM (potential data corruption)

```bash
# Prerequisite: create a minimal Alpine test VM in Unraid VM manager
# (Alpine ISO, 512MB RAM, no persistent disk, name contains "mcp-test")

VID=$(mcporter call --stdio-cmd "uv run unraid-mcp-server" --tool unraid \
  --args '{"action":"vm","subaction":"list"}' --output json \
  | python3 -c "import json,sys; vms=json.load(sys.stdin).get('vms',[]); print(next(v.get('uuid',v.get('id','')) for v in vms if 'mcp-test' in v.get('name','')))")

mcporter call --stdio-cmd "uv run unraid-mcp-server" --tool unraid \
  --args "{\"action\":\"vm\",\"subaction\":\"force_stop\",\"vm_id\":\"$VID\",\"confirm\":true}" --output json

# Verify: VM state should return to stopped
mcporter call --stdio-cmd "uv run unraid-mcp-server" --tool unraid \
  --args "{\"action\":\"vm\",\"subaction\":\"details\",\"vm_id\":\"$VID\"}" --output json
```

---

### `reset` — Hard reset a VM (power cycle without graceful shutdown)

```bash
# Same minimal Alpine test VM as above
VID=$(mcporter call --stdio-cmd "uv run unraid-mcp-server" --tool unraid \
  --args '{"action":"vm","subaction":"list"}' --output json \
  | python3 -c "import json,sys; vms=json.load(sys.stdin).get('vms',[]); print(next(v.get('uuid',v.get('id','')) for v in vms if 'mcp-test' in v.get('name','')))")

mcporter call --stdio-cmd "uv run unraid-mcp-server" --tool unraid \
  --args "{\"action\":\"vm\",\"subaction\":\"reset\",\"vm_id\":\"$VID\",\"confirm\":true}" --output json
```

---

## `notification`

### `delete` — Permanently delete a notification

```bash
# 1. Create a test notification, then list to get the real stored ID (create response
#    ID is ULID-based; stored filename uses a unix timestamp, so IDs differ)
mcporter call --stdio-cmd "uv run unraid-mcp-server" --tool unraid \
  --args '{"action":"notification","subaction":"create","title":"mcp-test-delete","subject":"safe to delete","description":"MCP destructive action test","importance":"INFO"}' --output json
NID=$(mcporter call --stdio-cmd "uv run unraid-mcp-server" --tool unraid \
  --args '{"action":"notification","subaction":"list","notification_type":"UNREAD"}' --output json \
  | python3 -c "
import json,sys
notifs=json.load(sys.stdin).get('notifications',[])
matches=[n['id'] for n in reversed(notifs) if n.get('title')=='mcp-test-delete']
print(matches[0] if matches else '')")

# 2. Delete it (notification_type required)
mcporter call --stdio-cmd "uv run unraid-mcp-server" --tool unraid \
  --args "{\"action\":\"notification\",\"subaction\":\"delete\",\"notification_id\":\"$NID\",\"notification_type\":\"UNREAD\",\"confirm\":true}" --output json

# 3. Verify
mcporter call --stdio-cmd "uv run unraid-mcp-server" --tool unraid \
  --args '{"action":"notification","subaction":"list"}' --output json | python3 -c \
  "import json,sys; ns=[n for n in json.load(sys.stdin).get('notifications',[]) if 'mcp-test' in n.get('title','')]; print('clean' if not ns else ns)"
```

---

### `delete_archived` — Wipe all archived notifications (bulk, irreversible)

```bash
# 1. Create and archive a test notification
mcporter call --stdio-cmd "uv run unraid-mcp-server" --tool unraid \
  --args '{"action":"notification","subaction":"create","title":"mcp-test-archive-wipe","subject":"archive me","description":"safe to delete","importance":"INFO"}' --output json
AID=$(mcporter call --stdio-cmd "uv run unraid-mcp-server" --tool unraid \
  --args '{"action":"notification","subaction":"list","notification_type":"UNREAD"}' --output json \
  | python3 -c "
import json,sys
notifs=json.load(sys.stdin).get('notifications',[])
matches=[n['id'] for n in reversed(notifs) if n.get('title')=='mcp-test-archive-wipe']
print(matches[0] if matches else '')")
mcporter call --stdio-cmd "uv run unraid-mcp-server" --tool unraid \
  --args "{\"action\":\"notification\",\"subaction\":\"archive\",\"notification_id\":\"$AID\"}" --output json

# 2. Wipe all archived
# NOTE: this deletes ALL archived notifications, not just the test one
mcporter call --stdio-cmd "uv run unraid-mcp-server" --tool unraid \
  --args '{"action":"notification","subaction":"delete_archived","confirm":true}' --output json
```

> Run on `shart` if archival history on `tootie` matters.

---

## `rclone`

### `delete_remote` — Remove an rclone remote configuration

```bash
# 1. Create a throwaway local remote (points to /tmp — no real data)
#    Parameters: name (str), provider_type (str), config_data (dict)
mcporter call --stdio-cmd "uv run unraid-mcp-server" --tool unraid \
  --args '{"action":"rclone","subaction":"create_remote","name":"mcp-test-remote","provider_type":"local","config_data":{"root":"/tmp"}}' --output json

# 2. Delete it
mcporter call --stdio-cmd "uv run unraid-mcp-server" --tool unraid \
  --args '{"action":"rclone","subaction":"delete_remote","name":"mcp-test-remote","confirm":true}' --output json

# 3. Verify
mcporter call --stdio-cmd "uv run unraid-mcp-server" --tool unraid \
  --args '{"action":"rclone","subaction":"list_remotes"}' --output json | python3 -c \
  "import json,sys; remotes=json.load(sys.stdin).get('remotes',[]); print('clean' if 'mcp-test-remote' not in remotes else 'FOUND — cleanup failed')"
```

> Note: `delete_remote` removes the config only — it does NOT delete data in the remote storage.

---

## `key`

### `delete` — Delete an API key (immediately revokes access)

```bash
# 1. Create a test key (names cannot contain hyphens; ID is at key.id)
KID=$(mcporter call --stdio-cmd "uv run unraid-mcp-server" --tool unraid \
  --args '{"action":"key","subaction":"create","name":"mcp test key","roles":["VIEWER"]}' --output json \
  | python3 -c "import json,sys; print(json.load(sys.stdin).get('key',{}).get('id',''))")

# 2. Delete it
mcporter call --stdio-cmd "uv run unraid-mcp-server" --tool unraid \
  --args "{\"action\":\"key\",\"subaction\":\"delete\",\"key_id\":\"$KID\",\"confirm\":true}" --output json

# 3. Verify
mcporter call --stdio-cmd "uv run unraid-mcp-server" --tool unraid \
  --args '{"action":"key","subaction":"list"}' --output json | python3 -c \
  "import json,sys; ks=json.load(sys.stdin).get('keys',[]); print('clean' if not any('mcp test key' in k.get('name','') for k in ks) else 'FOUND — cleanup failed')"
```

---

## `disk`

### `flash_backup` — Rclone backup of flash drive (overwrites destination)

```bash
# Prerequisite: create a dedicated test remote pointing away from real backup destination
# (use rclone create_remote first, or configure mcp-test-remote manually)

mcporter call --stdio-cmd "uv run unraid-mcp-server" --tool unraid \
  --args '{"action":"disk","subaction":"flash_backup","remote_name":"mcp-test-remote","source_path":"/boot","destination_path":"/flash-backup-test","confirm":true}' --output json
```

> Never point at the same destination as your real flash backup. Create a dedicated `mcp-test-remote` (see `rclone: delete_remote` above for provisioning pattern).

---

## `setting`

### `configure_ups` — Overwrite UPS monitoring configuration

**Strategy: mock/safety audit only.**
Wrong config can break UPS integration. If live testing is required: read current config via `unraid(action="system", subaction="ups_config")`, save values, re-apply identical values (no-op), verify response matches. Test via `tests/safety/` for guard behavior.

---

## `plugin`

> **⚠️ Highest blast radius in the entire server.** `plugin install` /
> `install_language` make the Unraid host **fetch a caller-supplied `.plg` URL and run it
> as root**. Beyond the `confirm=True` gate, `_validate_plugin_url()` in `tools/_plugin.py`
> applies an SSRF guard (rejects non-`http(s)`, hostless, and
> private/loopback/link-local/reserved targets, blocking pivots like
> `http://169.254.169.254/`). That guard is defence-in-depth, not a complete mitigation —
> the Unraid host re-resolves the URL at fetch time (TOCTOU), and the `.plg` still runs as
> root. **For shared / multi-tenant deployments, disable `plugin install` and
> `plugin install_language` at the gateway.**

### `remove` — Uninstall a plugin (irreversible without re-install)

**Strategy: mock/safety audit only.**
Removing a plugin cannot be undone without a full re-install. Test via `tests/safety/` confirming the `confirm=False` guard raises `ToolError`. Do not run live unless the plugin is intentionally being uninstalled.

```bash
# If live testing is necessary (intentional removal only):
mcporter call --stdio-cmd "uv run unraid-mcp-server" --tool unraid \
  --args '{"action":"plugin","subaction":"remove","names":["<plugin-name>"],"confirm":true}' --output json
```

---

### `install` / `install_language` — Fetch and run a `.plg` as root (highest risk)

**Strategy: mock/safety audit only — never run against a shared or production host.**
Confirm the `confirm=False` guard raises `ToolError` in `tests/safety/`, and that
`_validate_plugin_url()` rejects private/loopback/`file://` URLs. Only run live against a
disposable test host you fully control, with a `.plg` URL you authored.

```bash
# Only on a disposable, fully-trusted host:
mcporter call --stdio-cmd "uv run unraid-mcp-server" --tool unraid \
  --args '{"action":"plugin","subaction":"install","url":"https://<trusted-host>/test.plg","confirm":true}' --output json
```

---

## `setting`

### `update_ssh` — Overwrite SSH server configuration

**Strategy: mock/safety audit only.**
Bad SSH config can lock you out of the host. Confirm the `confirm=False` guard raises
`ToolError` in `tests/safety/`. If live testing is required, read the current config first,
re-apply identical values (no-op), and verify.

### `update_system_time` — Change the host clock / NTP configuration

**Strategy: mock/safety audit only.**
Clock changes can break TLS, scheduled jobs, and log ordering. Confirm the guard in
`tests/safety/`; do not run live unless intentionally adjusting time.

---

## `docker`

### `remove_container` — Delete a container

```bash
# Use a throwaway container you intend to delete
mcporter call --stdio-cmd "uv run unraid-mcp-server" --tool unraid \
  --args '{"action":"docker","subaction":"remove_container","id":"<CONTAINER_ID>","confirm":true}' --output json
```

### `delete_entries` — Delete docker organizer folder/entry definitions

**Strategy: safety audit; live only on a test view.**
Removes organizer entries (not the containers themselves) and is irreversible. Confirm the
`confirm=False` guard in `tests/safety/`.

### `reset_template_mappings` — Reset stored template path mappings

**Strategy: mock/safety audit only.**
Clears template path mappings; confirm the guard in `tests/safety/`.

---

## `connect`

All five `connect` mutations are destructive — they change Unraid Connect / remote-access
state (and in the `sign_in`/`sign_out` case, the cloud session itself). They are
**mock/safety audit only** unless you are intentionally reconfiguring Unraid Connect on a
host you own. Confirm each `confirm=False` guard in `tests/safety/`.

| Subaction | Effect |
|-----------|--------|
| `sign_in` | Sign the host into Unraid Connect (cloud session) |
| `sign_out` | Sign the host out of Unraid Connect |
| `update_api_settings` | Overwrite Connect API settings |
| `setup_remote_access` | Configure remote access |
| `enable_dynamic_remote_access` | Enable dynamic remote access |

> Run live only on `shart` (a host you fully control), never on a production tower.

---

## `onboarding`

### `reset` — Reset onboarding state

**Strategy: mock/safety audit only.** Confirm the `confirm=False` guard in `tests/safety/`.

### `create_internal_boot_pool` — Create an internal boot pool

**Strategy: mock/safety audit only.** Pool creation is destructive to existing layout;
confirm the guard in `tests/safety/` and never run live except during intentional
onboarding.

---

## Safety Audit (Automated)

The `tests/safety/` directory contains pytest tests that verify:
- Every destructive action raises `ToolError` when called with `confirm=False`
- Every destructive action raises `ToolError` when called without the `confirm` parameter
- Each runtime `_*_DESTRUCTIVE` set (re-exported from the domain modules via
  `src/unraid_mcp/tools/unraid.py`) matches the in-test `KNOWN_DESTRUCTIVE` audit dict in
  `tests/safety/test_destructive_guards.py`. **No test parses this Markdown file** — keep
  this document in sync with `KNOWN_DESTRUCTIVE` and the domain `_*_DESTRUCTIVE` sets by hand.
- No GraphQL request reaches the network layer when confirmation is missing (`TestNoGraphQLCallsWhenUnconfirmed`)
- Non-destructive actions never require `confirm` (`TestNonDestructiveActionsNeverRequireConfirm`)

These run as part of the standard test suite:

```bash
uv run pytest tests/safety/ -v
```

---

## Summary Table

| Domain (`action=`) | Subaction | Strategy | Target Server |
|--------------------|-----------|----------|---------------|
| `array` | `stop_array` | Mock/safety audit only | — |
| `array` | `remove_disk` | Array must be stopped; use intended disk | either |
| `array` | `clear_disk_stats` | Discover disk ID → clear | either |
| `vm` | `force_stop` | Minimal Alpine test VM | either |
| `vm` | `reset` | Minimal Alpine test VM | either |
| `notification` | `delete` | Create notification → destroy | either |
| `notification` | `delete_archived` | Create → archive → wipe | shart preferred |
| `rclone` | `delete_remote` | Create local:/tmp remote → destroy | either |
| `key` | `delete` | Create test key → destroy | either |
| `disk` | `flash_backup` | Dedicated test remote, isolated path | either |
| `setting` | `configure_ups` | Mock/safety audit only | — |
| `setting` | `update_ssh` | Mock/safety audit only (lockout risk) | — |
| `setting` | `update_system_time` | Mock/safety audit only | — |
| `plugin` | `remove` | Mock/safety audit only | — |
| `plugin` | `install` | Mock/safety audit only (root code exec) | disposable host only |
| `plugin` | `install_language` | Mock/safety audit only (root code exec) | disposable host only |
| `docker` | `remove_container` | Throwaway container → delete | either |
| `docker` | `delete_entries` | Test organizer view only | either |
| `docker` | `reset_template_mappings` | Mock/safety audit only | — |
| `connect` | `sign_in` | Mock/safety audit only | shart only |
| `connect` | `sign_out` | Mock/safety audit only | shart only |
| `connect` | `update_api_settings` | Mock/safety audit only | shart only |
| `connect` | `setup_remote_access` | Mock/safety audit only | shart only |
| `connect` | `enable_dynamic_remote_access` | Mock/safety audit only | shart only |
| `onboarding` | `reset` | Mock/safety audit only | — |
| `onboarding` | `create_internal_boot_pool` | Mock/safety audit only | — |
