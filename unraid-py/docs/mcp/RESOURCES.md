# MCP Resources Reference

## Overview

MCP resources expose real-time subscription data via URI-based access. Unlike tools, resources do not perform mutations -- they return the latest cached data from persistent WebSocket subscriptions to the Unraid GraphQL API.

Use resources when:
- Reading live telemetry (CPU, memory, array state)
- Monitoring ongoing events (notifications, parity progress)
- Providing real-time context to the LLM without tool invocation overhead

Use the `live` action on the `unraid` tool when:
- You need a one-shot snapshot with a specific collection duration
- You want to control the `collect_for` parameter
- The resource data shows "connecting" (subscription not yet initialized)

## URI Scheme

All resources use the `unraid://` scheme:

```
unraid://logs/stream
unraid://live/<subscription-name>
```

## Available Resources

### Log stream

| URI | Description | Source subscription |
|-----|-------------|---------------------|
| `unraid://logs/stream` | Real-time log file stream | `logFileSubscription` |

Returns log file content with path, total lines, start line, and content. It initializes
lazily on the first resource/diagnostic access if `UNRAID_AUTOSTART_LOG_PATH` is set or
`/var/log/syslog` exists.

### Live telemetry (snapshot subscriptions)

These subscriptions emit data continuously. The resource returns the latest cached value.

| URI | Description | Source subscription |
|-----|-------------|---------------------|
| `unraid://live/cpu` | CPU utilization per core and total | `systemMetricsCpu` |
| `unraid://live/memory` | Memory usage, swap, available, buffer/cache | `systemMetricsMemory` |
| `unraid://live/cpu_telemetry` | CPU power draw and temperature | `systemMetricsCpuTelemetry` |
| `unraid://live/array_state` | Array state, capacity, parity check status | `arraySubscription` |
| `unraid://live/docker_container_stats` | Per-container CPU/memory/IO stats | `dockerContainerStats` |
| `unraid://live/temperature` | Temperature sensor readings and summary | `systemMetricsTemperature` |

### Live telemetry (event-driven subscriptions)

These subscriptions only emit when state changes. A timeout does not indicate an error -- it means no recent change occurred.

| URI | Description | Source subscription |
|-----|-------------|---------------------|
| `unraid://live/parity_progress` | Parity check progress, speed, errors | `parityHistorySubscription` |
| `unraid://live/ups_status` | UPS battery, power, model, status | `upsUpdates` |
| `unraid://live/notifications_overview` | Unread/archive notification counts by type | `notificationsOverview` |
| `unraid://live/notifications_warnings` | Live warnings/alerts feed (filtered) | `notificationsWarningsAndAlerts` |
| `unraid://live/owner` | Server owner username, URL, avatar | `ownerSubscription` |
| `unraid://live/server_status` | Server name, status, GUID, WAN/LAN IPs | `serversSubscription` |
| `unraid://live/display` | Theme/display changes | `displaySubscription` |

## Response Format

Fresh cached resource responses return JSON:

```json
{
  "systemMetricsCpu": {
    "id": "...",
    "percentTotal": 12.5,
    "cpus": [
      {"percentTotal": 15.0, "percentUser": 10.0, "percentSystem": 5.0, "percentIdle": 85.0}
    ]
  },
  "_fetched_at": "2026-04-04T12:00:00.000000+00:00",
  "_subscription": {
    "state": "subscribed",
    "active": true,
    "fresh": true,
    "stale": false,
    "age_seconds": 1.25
  }
}
```

`_fetched_at` is when the frame arrived. A cache is usable only while its owning task is
active, its state is `subscribed`, and `age_seconds` is no greater than
`UNRAID_SUBSCRIPTION_CACHE_MAX_AGE_SECONDS` (300 seconds by default). The `live` tool's
warm-cache response carries the same contract under `cache`, with fields `fetched_at`,
`age_seconds`, `state`, `fresh`, and `stale`.

Stale or terminal cache is never returned as successful live data. Stop, authentication
failure, invalid configuration, retry exhaustion, completion, or age expiry invalidates
the usable cache. A resource attempts a bounded on-demand fetch when appropriate; if that
fails, it returns an explicit error without including the old payload. A successful
reconnection and new frame creates a new fresh timestamp.

### Connecting state

When a subscription has not yet received data:

```json
{
  "status": "connecting",
  "message": "Subscription 'cpu' is starting. Retry in a moment."
}
```

### Error state

When a subscription has permanently failed:

```json
{
  "status": "error",
  "message": "Subscription 'cpu' failed: WebSocket authentication error"
}
```

Terminal failure states: `failed`, `auth_failed`, `max_retries_exceeded`. Explicit stop
and upstream completion also invalidate the cache even when no terminal error message is
present.

## Lazy initialization behavior

When `UNRAID_AUTO_START_SUBSCRIPTIONS=true` (default):
- Enabled snapshot subscriptions initialize on the first MCP resource or subscription-diagnostic access
- The log file subscription initializes then if `UNRAID_AUTOSTART_LOG_PATH` is set or `/var/log/syslog` exists
- The first read can return `connecting`; retry after the first WebSocket message arrives
- Resources serve cached data immediately after the first WebSocket message arrives

When `UNRAID_AUTO_START_SUBSCRIPTIONS=false`:
- Persistent subscriptions are not initialized
- Resources fall back to `subscribe_once` -- a one-shot WebSocket query
- This is useful for low-resource environments or when real-time data is not needed

## Subscription Manager

The `SubscriptionManager` singleton manages persistent WebSocket connections:

- Maintains one WebSocket per subscription type
- Automatic reconnection with exponential backoff (up to `UNRAID_MAX_RECONNECT_ATTEMPTS`)
- Resets reconnect counter after 30 seconds of stable connection
- Log content capped at 1 MB / 5,000 lines to prevent memory growth
- GraphQL-over-WebSocket protocol with `connection_init` and `subscribe` messages

## Diagnostic Subactions

Two `subscriptions`-action subactions of the `unraid` tool help troubleshoot subscription issues:

| Call | Purpose |
|------|---------|
| `unraid(action="subscriptions", subaction="diagnose")` | Shows connection states, errors, WebSocket URLs, and data availability for all subscriptions |
| `unraid(action="subscriptions", subaction="test_query", subscription_query=...)` | Sends a test subscription query (allowlisted fields: `containerStats`, `cpu`, `memory`, `array`, `network`, `docker`, `vm`) |

## See Also

- [TOOLS.md](TOOLS.md) -- For the `live` action that provides on-demand snapshots
- [SCHEMA.md](SCHEMA.md) -- GraphQL subscription query definitions
- [../upstream/CLAUDE.md](../upstream/CLAUDE.md) -- Unraid GraphQL subscription schema
