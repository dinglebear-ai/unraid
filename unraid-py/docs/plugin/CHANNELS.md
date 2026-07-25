# Channel Integration -- unraid-mcp

## Status

unraid-mcp does not currently define any channel integrations. The server communicates exclusively through MCP protocol (stdio or HTTP transports).

## Future considerations

Channel integrations could enable:
- Real-time Unraid alerts forwarded to Discord or Slack
- Subscription data (parity progress, disk failures) pushed to messaging platforms
- Interactive Unraid management from chat interfaces

These would require the plugin to define channel configurations in the plugin manifest.

## See Also

- [../mcp/RESOURCES.md](../mcp/RESOURCES.md) -- Live subscription data that could feed channels
- [../mcp/TRANSPORT.md](../mcp/TRANSPORT.md) -- Current transport methods
