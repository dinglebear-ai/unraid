# Scheduled Tasks -- unraid-mcp

## Status

unraid-mcp does not currently define scheduled tasks. The server runs continuously and maintains persistent WebSocket subscriptions for real-time data.

## Built-in auto-start

While not a scheduled task in the plugin sense, the server lazily initializes enabled
WebSocket subscriptions on the first MCP resource or subscription-diagnostic access when
`UNRAID_AUTO_START_SUBSCRIPTIONS=true` (default). The first read can return `connecting`;
retry after the cache warms.

## Future considerations

Scheduled tasks could enable:
- Periodic health check reports
- Scheduled parity check initiation
- Automated notification archival
- Regular backup triggers

## See Also

- [../mcp/RESOURCES.md](../mcp/RESOURCES.md) -- Live subscription data
- [../mcp/ENV.md](../mcp/ENV.md) -- Auto-start configuration
