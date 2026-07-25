# Tool Schema Documentation

## Overview

Tool schemas in unraid-mcp are defined using Python type hints and Pydantic models, validated at runtime by FastMCP. The primary `unraid` tool uses `Literal` types for action routing and optional typed parameters for domain-specific operations.

## Action Type

```python
UNRAID_ACTIONS = Literal[
    "array", "customization", "disk", "docker", "health",
    "key", "live", "notification", "oidc", "plugin",
    "rclone", "setting", "system", "user", "vm",
]
```

This `Literal` type is registered as an enum in the MCP tool schema, ensuring clients can only pass valid action values.

## Tool Function Signature

The `unraid` tool accepts all possible parameters as optional keyword arguments:

```python
async def unraid(
    action: UNRAID_ACTIONS,           # Required: domain selector
    subaction: str,                    # Required: operation within domain
    ctx: Context | None = None,       # MCP context for elicitation
    confirm: bool = False,            # Destructive action bypass
    # system
    device_id: str | None = None,
    # array + disk
    disk_id: str | None = None,
    correct: bool | None = None,
    slot: int | None = None,
    # disk
    log_path: str | None = None,
    tail_lines: int = 100,
    remote_name: str | None = None,
    source_path: str | None = None,
    destination_path: str | None = None,
    backup_options: dict[str, Any] | None = None,
    # docker
    container_id: str | None = None,
    network_id: str | None = None,
    # vm
    vm_id: str | None = None,
    # notification
    notification_id: str | None = None,
    notification_ids: list[str] | None = None,
    notification_type: str | None = None,
    importance: str | None = None,
    offset: int = 0,
    limit: int = 20,
    list_type: str = "UNREAD",
    title: str | None = None,
    subject: str | None = None,
    description: str | None = None,
    # key
    key_id: str | None = None,
    name: str | None = None,
    roles: list[str] | None = None,
    permissions: list[str] | None = None,
    # plugin
    names: list[str] | None = None,
    bundled: bool = False,
    restart: bool = True,
    # rclone
    provider_type: str | None = None,
    config_data: dict[str, Any] | None = None,
    # setting
    settings_input: dict[str, Any] | None = None,
    ups_config: dict[str, Any] | None = None,
    # customization
    theme_name: str | None = None,
    # oidc
    provider_id: str | None = None,
    token: str | None = None,
    # live
    path: str | None = None,
    collect_for: float = 5.0,
    timeout: float = 10.0,
) -> dict[str, Any] | str:
```

## Elicitation Models

Elicitation is used only for destructive action confirmation. Credential setup is
handled by the plugin's `userConfig` form + `setup plugin-hook` (no elicitation model).

### Destructive action confirmation

```python
class _ConfirmAction(BaseModel):
    confirmed: bool = Field(False, description="Check the box to confirm and proceed")
```

Used by `elicit_destructive_confirmation()` to gate destructive operations.

## GraphQL Query Organization

Each domain module defines query dicts:

```python
# Example from _docker.py
_DOCKER_QUERIES = {
    "list": "{ docker { containers { ... } } }",
    "details": "query ($id: String!) { docker { container(id: $id) { ... } } }",
    "networks": "{ docker { networks { ... } } }",
}

_DOCKER_MUTATIONS = {
    "start": "mutation ($id: String!) { dockerContainerStart(id: $id) { ... } }",
}
```

Mutations are handled with early-return blocks before the query dict lookup to prevent `KeyError`.

## Destructive Action Sets

Each domain with destructive operations defines a frozenset:

```python
_ARRAY_DESTRUCTIVE = {"stop_array", "remove_disk", "clear_disk_stats"}
_VM_DESTRUCTIVE = {"force_stop", "reset"}
_NOTIFICATION_DESTRUCTIVE = {"delete", "delete_archived"}
```

## See Also

- [TOOLS.md](TOOLS.md) -- Full action/subaction reference
- [PATTERNS.md](PATTERNS.md) -- Code patterns for query dict and handler organization
- [../upstream/CLAUDE.md](../upstream/CLAUDE.md) -- GraphQL schema reference
