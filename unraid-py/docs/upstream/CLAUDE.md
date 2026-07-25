# Upstream Service Integration -- unraid-mcp

## Unraid GraphQL API

unraid-mcp communicates with the Unraid server via its GraphQL API over HTTP and WebSocket.

### Endpoint

The Unraid GraphQL endpoint is typically:
```
https://<unraid-ip-or-hostname>/graphql
```

For MyUnraid.net remote access:
```
https://10-1-0-2.xxx.myunraid.net:31337
```

### Authentication

All requests include the `x-api-key` header:
```
x-api-key: <UNRAID_API_KEY>
```

API keys are generated in: Unraid > Settings > Management Access > API Keys.

### HTTP queries and mutations

The `core/client.py` module sends async HTTP POST requests via httpx:

```python
async with httpx.AsyncClient(verify=UNRAID_VERIFY_SSL) as client:
    response = await client.post(
        UNRAID_API_URL,
        json={"query": query_string, "variables": variables},
        headers={"x-api-key": UNRAID_API_KEY, "User-Agent": f"unraid-mcp/{VERSION}"},
        timeout=timeout,
    )
```

### WebSocket subscriptions

Live data uses the `graphql-transport-ws` WebSocket protocol:

1. Connect to `wss://<unraid-host>/graphql` (or `ws://` for non-SSL)
2. Send `connection_init` with `{"x-api-key": "<key>"}` payload
3. Receive `connection_ack`
4. Send `subscribe` with query and variables
5. Receive `next` messages with subscription data
6. Handle `complete` and `error` messages

The `subscriptions/utils.py` module handles:
- URL scheme conversion (http/https to ws/wss)
- SSL context building for self-signed certificates
- `connection_init` message construction with API key

### Rate limits

The Unraid API enforces approximately 100 requests per 10 seconds. The MCP server's rate limiter is set to 540 requests per 60-second sliding window to stay under this ceiling.

### Known API issues

- **arraySubscription**: May not emit data reliably. The `live/array_state` subaction may show "connecting" indefinitely.
- **Event-driven subscriptions**: `notifications_overview`, `owner`, `server_status`, `ups_status`, and `parity_progress` only emit when state changes. A timeout is normal and does not indicate an error.
- **Type overflow**: Some complex queries can trigger GraphQL type resolution issues. The server uses selective field queries to avoid this.

## GraphQL schema reference

The full Unraid GraphQL schema is available in:
- `docs/unraid/UNRAID-API-SUMMARY.md` -- Condensed overview
- `docs/unraid/UNRAID-API-CHANGES.md` -- Diff against the prior introspection snapshot
- `docs/unraid/UNRAID-SCHEMA.graphql` -- Complete schema definition
- `docs/unraid/UNRAID-API-INTROSPECTION.json` -- Introspection result
- `docs/unraid/UNRAID-API-COMPLETE-REFERENCE.md` -- Human-readable reference

### Regenerating the schema docs

All schema docs are generated from live introspection by `scripts/generate_unraid_api_reference.py`. Run it whenever the Unraid API changes:

```bash
uv run python scripts/generate_unraid_api_reference.py
```

Requires `UNRAID_API_URL` and `UNRAID_API_KEY` in the environment (or pass `--api-url` / `--api-key`). The script writes all five output files under `docs/unraid/` and prints each path on success. It also computes a diff against the previous introspection snapshot and writes it to `UNRAID-API-CHANGES.md`.

Additional flags:
```
--verify-ssl                    Enable SSL cert verification (disabled by default for self-signed certs)
--include-introspection-types   Include __Schema/__Type etc. in generated output
--timeout-seconds N             HTTP timeout (default: 90)
```

### Query organization

Queries are organized into domain dicts in each `tools/_<domain>.py` module:

| Domain | Queries dict | Mutations dict |
|--------|-------------|----------------|
| system | `_SYSTEM_QUERIES` (20 entries) | -- |
| array | `_ARRAY_QUERIES` | `_ARRAY_MUTATIONS` |
| disk | `_DISK_QUERIES` | `_DISK_MUTATIONS` |
| docker | `_DOCKER_QUERIES` | `_DOCKER_MUTATIONS` |
| vm | `_VM_QUERIES` | `_VM_MUTATIONS` |
| notification | `_NOTIFICATION_QUERIES` | `_NOTIFICATION_MUTATIONS` |
| key | `_KEY_QUERIES` | `_KEY_MUTATIONS` |
| plugin | `_PLUGIN_QUERIES` | `_PLUGIN_MUTATIONS` |
| rclone | `_RCLONE_QUERIES` | `_RCLONE_MUTATIONS` |
| setting | -- | `_SETTING_MUTATIONS` |
| connect | `_CONNECT_QUERIES` | `_CONNECT_MUTATIONS` |
| onboarding | `_ONBOARDING_QUERIES` | -- |
| customization | `_CUSTOMIZATION_QUERIES` | `_CUSTOMIZATION_MUTATIONS` |
| oidc | `_OIDC_QUERIES` | -- |
| user | `_USER_QUERIES` | -- |

### Subscription queries

Defined in `subscriptions/queries.py`:

**Snapshot subscriptions** (continuous data):
- `systemMetricsCpu` -- CPU utilization per core
- `systemMetricsMemory` -- Memory, swap, buffer/cache
- `systemMetricsCpuTelemetry` -- CPU power and temperature
- `arraySubscription` -- Array state, capacity, parity status

**Event-driven subscriptions** (state changes only):
- `parityHistorySubscription` -- Parity check events
- `upsUpdates` -- UPS status changes
- `notificationsOverview` -- Notification count changes
- `ownerSubscription` -- Owner info changes
- `serversSubscription` -- Server status changes

**Collect subscriptions** (accumulate over time):
- `notificationAdded` -- New notification events
- `logFile` -- Log file tail (requires `path` variable)

## See Also

- [../mcp/TOOLS.md](../mcp/TOOLS.md) -- How queries map to tool actions
- [../mcp/RESOURCES.md](../mcp/RESOURCES.md) -- How subscriptions map to resources
- [../mcp/SCHEMA.md](../mcp/SCHEMA.md) -- Query dict organization
