"""Rclone domain handler for the Unraid MCP tool.

Covers: list_remotes, config_form, create_remote, delete_remote* (4 subactions).
"""

from typing import Any

from fastmcp import Context

from ..config.logging import logger
from ..core import client as _client
from ..core.exceptions import ToolError, tool_error_handler
from ..core.guards import gate_destructive_action
from ..core.pagination import cap_list
from ..core.utils import safe_get, validate_subaction
from ..core.validation import DANGEROUS_KEY_PATTERN, validate_scalar_mapping


# ===========================================================================
# RCLONE
# ===========================================================================

_RCLONE_QUERIES: dict[str, str] = {
    # List stays lean: full per-remote `parameters`/`config` (endpoints, secrets)
    # are intentionally omitted — they bloat the payload and leak config on a LIST.
    "list_remotes": "query ListRCloneRemotes { rclone { remotes { name type } } }",
    "config_form": "query GetRCloneConfigForm($formOptions: RCloneConfigFormInput) { rclone { configForm(formOptions: $formOptions) { id dataSchema uiSchema } } }",
}

_RCLONE_MUTATIONS: dict[str, str] = {
    "create_remote": "mutation CreateRCloneRemote($input: CreateRCloneRemoteInput!) { rclone { createRCloneRemote(input: $input) { name type parameters } } }",
    "delete_remote": "mutation DeleteRCloneRemote($input: DeleteRCloneRemoteInput!) { rclone { deleteRCloneRemote(input: $input) } }",
}

_RCLONE_SUBACTIONS: set[str] = set(_RCLONE_QUERIES) | set(_RCLONE_MUTATIONS)
_RCLONE_DESTRUCTIVE: set[str] = {"delete_remote"}
_MAX_CONFIG_KEYS = 50
_MAX_NAME_LENGTH = 128


def _validate_rclone_name(value: str, label: str) -> None:
    """Validate a top-level rclone field (name or provider_type)."""
    if len(value) > _MAX_NAME_LENGTH:
        raise ToolError(f"{label} exceeds max length ({len(value)} > {_MAX_NAME_LENGTH})")
    if DANGEROUS_KEY_PATTERN.search(value):
        raise ToolError(f"{label} contains disallowed characters")


async def _handle_rclone(
    subaction: str,
    name: str | None,
    provider_type: str | None,
    config_data: dict[str, Any] | None,
    ctx: Context | None,
    confirm: bool,
    limit: int = 20,
) -> dict[str, Any]:
    validate_subaction(subaction, _RCLONE_SUBACTIONS, "rclone")

    await gate_destructive_action(
        ctx,
        subaction,
        _RCLONE_DESTRUCTIVE,
        confirm,
        f"Delete rclone remote **{name}**. This cannot be undone.",
    )

    with tool_error_handler("rclone", subaction, logger):
        logger.info(f"Executing unraid action=rclone subaction={subaction}")

        if subaction == "list_remotes":
            data = await _client.make_graphql_request(_RCLONE_QUERIES["list_remotes"])
            remotes = safe_get(data, "rclone", "remotes", default=[])
            remotes = list(remotes) if isinstance(remotes, list) else []
            capped, page = cap_list(remotes, limit)
            # Full per-remote config (parameters/config) is intentionally dropped
            # here; a per-remote detail subaction could expose it if ever needed.
            return {"remotes": capped, "page": page}

        if subaction == "config_form":
            # Unscoped, configForm can return JSON-Schema blobs for every provider —
            # the single largest payload in the server. Require a provider_type so
            # the response stays bounded to one provider's schema.
            if not provider_type:
                raise ToolError(
                    "rclone/config_form requires provider_type (e.g. provider_type='s3'). "
                    "Pass the rclone backend type to scope the returned config schema."
                )
            _validate_rclone_name(provider_type, "provider_type")
            variables: dict[str, Any] = {"formOptions": {"providerType": provider_type}}
            data = await _client.make_graphql_request(_RCLONE_QUERIES["config_form"], variables)
            form = safe_get(data, "rclone", "configForm", default={})
            if not form:
                raise ToolError("No RClone config form data received")
            return dict(form)

        if subaction == "create_remote":
            if name is None or provider_type is None or config_data is None:
                raise ToolError("create_remote requires name, provider_type, and config_data")
            _validate_rclone_name(name, "name")
            _validate_rclone_name(provider_type, "provider_type")
            validated = validate_scalar_mapping(
                config_data, "config_data", max_keys=_MAX_CONFIG_KEYS, stringify=True
            )
            data = await _client.make_graphql_request(
                _RCLONE_MUTATIONS["create_remote"],
                {"input": {"name": name, "type": provider_type, "parameters": validated}},
            )
            remote = safe_get(data, "rclone", "createRCloneRemote")
            if not remote:
                raise ToolError(f"Failed to create remote '{name}': no confirmation from server")
            return {
                "success": True,
                "message": f"Remote '{name}' created successfully",
                "remote": remote,
            }

        if subaction == "delete_remote":
            if not name:
                raise ToolError("name is required for rclone/delete_remote")
            data = await _client.make_graphql_request(
                _RCLONE_MUTATIONS["delete_remote"], {"input": {"name": name}}
            )
            if not safe_get(data, "rclone", "deleteRCloneRemote", default=False):
                raise ToolError(f"Failed to delete remote '{name}'")
            return {"success": True, "message": f"Remote '{name}' deleted successfully"}

        raise ToolError(f"Unhandled rclone subaction '{subaction}' — this is a bug")
