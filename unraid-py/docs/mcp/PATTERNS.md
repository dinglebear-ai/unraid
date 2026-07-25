# Common MCP Code Patterns

Reusable patterns across the unraid-mcp server implementation.

## Action routing pattern

The consolidated `unraid` tool uses a flat `if action == "..."` dispatch:

```python
async def unraid(action: UNRAID_ACTIONS, subaction: str, ...):
    if action == "system":
        return await _handle_system(subaction, device_id)
    if action == "docker":
        return await _handle_docker(subaction, container_id, network_id)
    # ... one branch per domain
    raise ToolError(f"Invalid action '{action}'")
```

Each handler is in its own `_<domain>.py` module.

## Query dict pattern

Each domain organizes GraphQL operations into dicts:

```python
_DOCKER_QUERIES = {
    "list": """{ docker { containers { names state status image } } }""",
    "details": """query ($id: String!) { docker { container(id: $id) { ... } } }""",
}

_DOCKER_MUTATIONS = {
    "start": """mutation ($id: String!) { dockerContainerStart(id: $id) { ... } }""",
}
```

### Critical: Mutation handler ordering

Mutation handlers MUST return before the query dict lookup. Mutations are not in `_*_QUERIES` dicts -- reaching the lookup line causes a `KeyError`:

```python
async def _handle_docker(subaction, container_id, ...):
    # Mutations first -- early return before query dict lookup
    if subaction == "start":
        return await _client.make_graphql_request(
            _DOCKER_MUTATIONS["start"], {"id": container_id}
        )

    # Query dict lookup -- only reached for read operations
    query = _DOCKER_QUERIES.get(subaction)
    if query is None:
        raise ToolError(f"Invalid subaction '{subaction}'")
    return await _client.make_graphql_request(query, variables)
```

## Destructive action gate pattern

```python
_VM_DESTRUCTIVE = {"force_stop", "reset"}

async def _handle_vm(subaction, vm_id, ctx, confirm):
    await gate_destructive_action(
        ctx, subaction, _VM_DESTRUCTIVE, confirm,
        description={
            "force_stop": "Force stop VM without graceful shutdown",
            "reset": "Hard reset VM, may cause data loss",
        }
    )
    # If we get here, action is either non-destructive or confirmed
```

## Error handling pattern

All domain handlers use the `tool_error_handler` context manager:

```python
async def _handle_system(subaction, device_id):
    with tool_error_handler("system", subaction, logger):
        # ToolError re-raised as-is
        # CredentialsNotConfiguredError -> setup instructions
        # TimeoutError -> descriptive message
        # Other exceptions -> logged + wrapped in ToolError
        ...
```

## GraphQL client pattern

```python
from ..core import client as _client

# Simple query
data = await _client.make_graphql_request(query_string)

# Query with variables
data = await _client.make_graphql_request(query_string, {"id": item_id})

# Custom timeout (disk operations)
data = await _client.make_graphql_request(query_string, timeout=90)
```

## Subscription resource pattern

Resources are auto-registered from `SNAPSHOT_ACTIONS`:

```python
for _action in SNAPSHOT_ACTIONS:
    mcp.resource(f"unraid://live/{_action}")(_make_resource_fn(_action))
```

The factory function handles:
- Ensuring subscriptions are started
- Returning cached data with `_fetched_at` timestamp
- Falling back to `subscribe_once` when auto-start is disabled
- Surfacing terminal errors

## Elicitation pattern (destructive confirmation only)

Elicitation is used solely to confirm destructive operations (`core/guards.py`).
Credential setup is **not** elicitation-based — see [../SETUP.md](../SETUP.md).

```python
# Boolean confirmation for a destructive action
result = await ctx.elicit(
    message="Are you sure?",
    response_type=_ConfirmAction,  # dataclass with a `confirmed: bool` field
)
if result.action != "accept":
    return  # User cancelled
```

## See Also

- [SCHEMA.md](SCHEMA.md) -- Schema definitions
- [TOOLS.md](TOOLS.md) -- Full tool reference
- [DEV.md](DEV.md) -- Adding new domains
