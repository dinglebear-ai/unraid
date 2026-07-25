# Output Style Definitions -- unraid-mcp

## Status

unraid-mcp does not currently define custom output styles. Tool responses use standard MCP text content blocks with markdown formatting for tables and structured data.

## Response patterns

Tool responses follow these conventions:

- **Health check**: Structured dict with severity levels (`OK`, `WARNING`, `ERROR`) and recommendations
- **List operations**: Array of dicts with relevant fields for the domain
- **Detail operations**: Single dict with comprehensive field data
- **Mutations**: Confirmation message with operation result
- **Live data**: JSON with subscription data and `_fetched_at` timestamp

## See Also

- [../mcp/TOOLS.md](../mcp/TOOLS.md) -- Tool response formats
- [../mcp/MCPUI.md](../mcp/MCPUI.md) -- UI rendering patterns
