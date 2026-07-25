# Logging and Error Handling

Logging and error handling patterns for unraid-mcp.

## Log Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `UNRAID_MCP_LOG_LEVEL` | `INFO` | Log verbosity: DEBUG, INFO, WARNING, ERROR, CRITICAL |
| `UNRAID_MCP_LOG_FILE` | `unraid-mcp.log` | Log filename |

### Log locations

- **Local**: `<project-root>/logs/unraid-mcp.log`
- **Docker**: `/app/logs/unraid-mcp.log`
- **Fallback**: `<project-root>/.cache/logs/unraid-mcp.log` (if primary logs dir creation fails)

### Log rotation

Log files are capped at 10 MB and overwritten to prevent disk space issues. The cap is enforced at the application level.

## Structured Logging

The `config/logging.py` module provides:

- Structured log format with timestamps, module names, and log levels
- Console output (stderr) for immediate visibility
- File output for persistent history
- Configuration summary logged at startup

### Middleware logging

The `LoggingMiddleware` (outermost MCP middleware) logs:
- Every `tools/call` invocation with action, subaction, and duration
- Every `resources/read` invocation with URI and duration
- Errors after they've been processed by ErrorHandlingMiddleware

## Error Handling

### Exception hierarchy

```
Exception
  +-- ToolError (FastMCP)
  |     +-- ToolError (unraid_mcp) -- user-facing MCP errors
  +-- CredentialsNotConfiguredError -- surfaces setup instructions
```

### Error handling chain

1. **tool_error_handler** context manager (per-domain):
   - Re-raises `ToolError` as-is
   - Converts `CredentialsNotConfiguredError` to setup instructions
   - Wraps `TimeoutError` with descriptive message
   - Catches all other exceptions, logs full traceback, wraps in `ToolError`

2. **ErrorHandlingMiddleware** (MCP-level):
   - Catches any unhandled exceptions that escape tool handlers
   - Converts to proper MCP error responses
   - Tracks `error_counts` per `(exception_type, method)` for health diagnostics
   - Includes traceback only when `LOG_LEVEL=DEBUG`

### Error stats

The `ErrorHandlingMiddleware` exposes error statistics via `get_error_stats()`, accessible through `health/diagnose`:

```python
unraid(action="health", subaction="diagnose")
# Returns: { "errors": { "ToolError:tools/call": 3, ... } }
```

## Sensitive Value Protection

### Redaction

The `redact_sensitive()` function processes all debug log output:
- Exact key match: `key`, `pin`
- Substring match: `password`, `secret`, `token`, `apikey`, `authorization`, `credential`, `passphrase`, `jwt`, `cookie`, `session`
- Normalizes keys by stripping underscores and hyphens before matching

> **Caveat — avoid `DEBUG` in production.** Redaction is **best-effort** and keyed on
> recognised names. DEBUG-level logging may include full GraphQL request payloads, and a
> sensitive value carried under an unrecognised key (or embedded inside a larger string)
> can slip past the redactor. Run at `INFO` or above in production; enable `DEBUG` only for
> short, supervised troubleshooting and treat any DEBUG log file as potentially containing
> secrets.

### URL display

The `safe_display_url()` function masks sensitive parts of URLs for logging:
- Shows scheme and host
- Masks path components that might contain tokens
- Used in configuration summaries and error messages

### Bearer token isolation

- Removed from `os.environ` immediately after startup
- Stored only in module globals (not accessible by subprocesses)
- Never logged, even at DEBUG level

## Subscription Logging

WebSocket subscription events are logged with `[STARTUP]`, `[AUTOSTART]`, `[RESOURCE]` prefixes for easy filtering:

```
[STARTUP] First async operation detected, starting subscriptions...
[AUTOSTART] Initiating subscription auto-start process...
[RESOURCE] Capped log content from 8000 to 5000 lines
```

## Viewing Logs

```bash
# Tail application logs
just logs

# Docker container logs
docker compose logs -f unraid-mcp

# Direct file access
tail -f logs/unraid-mcp.log
```

## See Also

- [ENV.md](ENV.md) -- Log-related environment variables
- [TESTS.md](TESTS.md) -- Testing error handling
- [../GUARDRAILS.md](../GUARDRAILS.md) -- Security logging patterns
