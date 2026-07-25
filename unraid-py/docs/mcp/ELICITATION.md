# MCP Elicitation (Destructive Action Confirmation)

Interactive confirmation of destructive operations via the MCP elicitation protocol.

> **Credential setup is not elicitation-based.** Credentials come from the plugin's
> `userConfig` form (persisted to `~/.unraid-mcp/.env` by the `setup plugin-hook`)
> or a hand-edited `.env`. See [../SETUP.md](../SETUP.md) and [ENV.md](ENV.md).

## What is elicitation

Elicitation is an MCP protocol capability that lets the server request explicit
confirmation from the user through the client before executing a destructive action.

## When elicitation is used

- **Destructive operation confirmation only**: the 26 destructive subactions (across 11
  domains) gate execution behind explicit user acknowledgment. See
  [../DESTRUCTIVE_ACTIONS.md](../DESTRUCTIVE_ACTIONS.md) for the full per-domain list.

## Destructive operation confirmation

### Implementation (`core/guards.py`)

The `gate_destructive_action()` function provides two-tier confirmation:

1. **Check**: Is the subaction in the domain's `_*_DESTRUCTIVE` set?
   - No: proceed immediately (non-destructive)
   - Yes: continue to confirmation

2. **Bypass check**: Is `confirm=True`?
   - Yes: proceed (logged as "bypassed via confirm=True")
   - No: continue to elicitation

3. **Elicitation**: Send `_ConfirmAction` form to client:
   ```
   Fields:
     confirmed: bool (default: False)  -- "Check the box to confirm and proceed"
   ```

4. **User response**:
   - Accepted + confirmed: proceed with operation
   - Accepted but not confirmed: `ToolError("Action was not confirmed")`
   - Cancelled/declined: `ToolError("Action was not confirmed")`

### Per-domain descriptions

Each domain provides human-readable descriptions for its destructive actions:

```python
# Example from _array.py
_ARRAY_DESTRUCTIVE = {"stop_array", "remove_disk", "clear_disk_stats"}
# Each has a description dict explaining the impact
```

## Client support

| Client | Elicitation support | Behavior |
|--------|-------------------|----------|
| Claude Code | Full | Interactive form rendering with checkboxes |
| Codex CLI | Partial | Text-based prompts |
| Gemini CLI | Partial | Text-based prompts |
| MCP Inspector | Full | Form rendering in web UI |
| Non-interactive | None | Falls back to `ToolError` instructing `confirm=True` |

## Fallback for unsupported clients

When the client does not support elicitation (`NotImplementedError`), destructive
actions return a `ToolError`:

```text
Action 'stop_array' was not confirmed. Re-run with confirm=True to bypass elicitation.
```

## See Also

- [../SETUP.md](../SETUP.md) -- credential setup (plugin userConfig + .env)
- [AUTH.md](AUTH.md) -- How credentials are used after setup
- [TOOLS.md](TOOLS.md) -- Destructive action list
- [../GUARDRAILS.md](../GUARDRAILS.md) -- Security patterns
