# Unraid MCP — Quick Reference

All operations use: `unraid(action="<domain>", subaction="<operation>", [params])`

## Most Common Operations

### Health & Status

```python
unraid(action="health",  subaction="setup")            # Credential status + instructions (read-only)
unraid(action="health",  subaction="check")            # Full health check
unraid(action="health",  subaction="test_connection")  # Quick connectivity test
unraid(action="system",  subaction="overview")         # Complete server summary
unraid(action="system",  subaction="metrics")          # CPU / RAM / I/O usage
unraid(action="system",  subaction="online")           # Online status
unraid(action="system",  subaction="server_details")   # Direct server root; API key omitted
unraid(action="system",  subaction="network_access_urls")  # Direct network access URLs
unraid(action="connect", subaction="status")           # Connect status; settings values omitted
unraid(action="customization", subaction="details")    # Onboarding/languages; activation codes omitted
```

### Array & Disks

```python
unraid(action="system",  subaction="array")             # Array status overview
unraid(action="disk",    subaction="disks")             # All disks with temps & health
unraid(action="array",   subaction="parity_status")     # Current parity check
unraid(action="array",   subaction="parity_history")    # Past parity results
unraid(action="array",   subaction="parity_start", correct=False)  # Start parity check
unraid(action="array",   subaction="stop_array",  confirm=True)   # ⚠️ Stop array
```

### Logs

```python
unraid(action="disk", subaction="log_files")                                          # List available logs
unraid(action="disk", subaction="logs", log_path="/var/log/syslog", tail_lines=50)    # Read syslog
unraid(action="live", subaction="log_tail", path="/var/log/syslog")                   # Live tail
```

### Docker Containers

```python
unraid(action="docker", subaction="list")
unraid(action="docker", subaction="details",  container_id="plex")
unraid(action="docker", subaction="start",    container_id="nginx")
unraid(action="docker", subaction="stop",     container_id="nginx")
unraid(action="docker", subaction="restart",  container_id="sonarr")
unraid(action="docker", subaction="networks")
```

### Virtual Machines

```python
unraid(action="vm", subaction="list")
unraid(action="vm", subaction="details",    vm_id="<id>")
unraid(action="vm", subaction="start",      vm_id="<id>")
unraid(action="vm", subaction="stop",       vm_id="<id>")
unraid(action="vm", subaction="reboot",     vm_id="<id>")
unraid(action="vm", subaction="force_stop", vm_id="<id>", confirm=True)   # ⚠️
```

### Notifications

```python
unraid(action="notification", subaction="overview")
unraid(action="notification", subaction="list",    list_type="UNREAD", limit=10)
unraid(action="notification", subaction="archive", notification_id="<id>")
unraid(action="notification", subaction="create",  title="Test", subject="Subject",
                                                   description="Body", importance="INFO")
```

### API Keys

```python
unraid(action="key", subaction="list")
unraid(action="key", subaction="create", name="my-key", roles=["viewer"])
unraid(action="key", subaction="delete", key_id="<id>", confirm=True)   # ⚠️
```

### Plugins

```python
unraid(action="plugin", subaction="list")
unraid(action="plugin", subaction="add",    names=["community.applications"])
unraid(action="plugin", subaction="remove", names=["old.plugin"], confirm=True)   # ⚠️
```

### rclone

```python
unraid(action="rclone", subaction="list_remotes")
unraid(action="rclone", subaction="delete_remote", name="<remote>", confirm=True)   # ⚠️
```

### Live Subscriptions (real-time)

```python
unraid(action="live", subaction="cpu")
unraid(action="live", subaction="memory")
unraid(action="live", subaction="parity_progress")
unraid(action="live", subaction="log_tail")
unraid(action="live", subaction="notification_feed")
unraid(action="live", subaction="ups_status")
```

> Returns `{"status": "connecting"}` on first call — retry momentarily.

---

## Domain → action= Mapping

| Old tool name (pre-v1.0) | New `action=` |
|--------------------------|---------------|
| `unraid_info` | `system` |
| `unraid_health` | `health` |
| `unraid_array` | `array` |
| `unraid_storage` | `disk` |
| `unraid_docker` | `docker` |
| `unraid_vm` | `vm` |
| `unraid_notifications` | `notification` |
| `unraid_keys` | `key` |
| `unraid_plugins` | `plugin` |
| `unraid_rclone` | `rclone` |
| `unraid_settings` | `setting` |
| `unraid_connect` | `connect` |
| `unraid_customization` | `customization` |
| `unraid_oidc` | `oidc` |
| `unraid_users` | `user` |
| `unraid_live` | `live` |
