# Unraid MCP — Troubleshooting Guide

## Credentials Not Configured

**Error:** `CredentialsNotConfiguredError` or message containing `~/.unraid-mcp/.env`

**Fix:** Set credentials, then restart the server (they are read once at startup):

1. **Claude Code plugin:** set *Unraid GraphQL API URL* and *Unraid API Key* in the plugin's
   configuration form. The setup hook writes them to `~/.unraid-mcp/.env` on the next session.
2. **Manual / Docker:** create `~/.unraid-mcp/.env` with `UNRAID_API_URL` and `UNRAID_API_KEY`.

Check status any time (read-only — does not prompt or write):

```python
unraid(action="health", subaction="setup")
```

---

## Connection Failed / API Unreachable

**Symptoms:** Timeout, connection refused, network error

**Diagnostic steps:**

1. Test basic connectivity:

```python
unraid(action="health", subaction="test_connection")
```

1. Full diagnostic report:

```python
unraid(action="health", subaction="diagnose")
```

1. Check that `UNRAID_API_URL` in `~/.unraid-mcp/.env` points to the correct Unraid GraphQL endpoint.

1. Verify the API key has the required roles. Get a new key: **Unraid UI → Settings → Management Access → API Keys → Create** (select "Viewer" role for read-only, or appropriate roles for mutations).

---

## Invalid Action / Subaction

**Error:** `Invalid action 'X'` or `Invalid subaction 'X' for action 'Y'`

**Fix:** Check the domain table in `SKILL.md` for the exact `action=` and `subaction=` strings. Common mistakes:

| Wrong | Correct |
|-------|---------|
| `action="info"` | `action="system"` |
| `action="notifications"` | `action="notification"` |
| `action="keys"` | `action="key"` |
| `action="plugins"` | `action="plugin"` |
| `action="settings"` | `action="setting"` |
| `subaction="unread"` | `subaction="mark_unread"` |

---

## Destructive Action Blocked

**Error:** `Action 'X' was not confirmed. Re-run with confirm=True to bypass elicitation.`

**Fix:** Add `confirm=True` to the call:

```python
unraid(action="array", subaction="stop_array", confirm=True)
unraid(action="vm",    subaction="force_stop", vm_id="<id>", confirm=True)
```

See the Destructive Actions table in `SKILL.md` for the full list.

---

## Live Subscription Returns "Connecting"

**Symptoms:** `unraid(action="live", ...)` returns `{"status": "connecting"}`

**Explanation:** The persistent WebSocket subscription has not yet received its first event. Retry in a moment.

**Known issue:** `live/array_state` uses `arraySubscription` which has a known Unraid API bug (returns null for a non-nullable field). This subscription may show "connecting" indefinitely.

**Event-driven subscriptions** (`live/parity_progress`, `live/notifications_overview`, `live/owner`, `live/server_status`, `live/ups_status`) only populate when the server emits a change event. If the server is idle, these may never populate during a session.

**Workaround for array state:** Use `unraid(action="system", subaction="array")` for a synchronous snapshot instead.

---

## Rate Limit Exceeded

**Limit:** 100 requests / 10 seconds

**Symptoms:** HTTP 429 or rate limit error

**Fix:** Space out requests. Avoid polling in tight loops. Use `live/` subscriptions for real-time data instead of polling `system/metrics` repeatedly.

---

## Log Path Rejected

**Error:** `Invalid log path`

**Valid log path prefixes:** `/var/log/`, `/boot/logs/`, `/mnt/`

Use `unraid(action="disk", subaction="log_files")` to list available logs before reading.

---

## Container Logs Not Available

Docker container stdout/stderr are **not accessible via the Unraid API**. SSH to the Unraid server and use `docker logs <container>` directly.
