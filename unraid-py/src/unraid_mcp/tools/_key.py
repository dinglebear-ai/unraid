"""Key domain handler for the Unraid MCP tool.

Covers: list, get, possible_roles, possible_permissions, permissions_for_roles,
preview_permissions, auth_actions, creation_form_schema, create, update, delete*,
add_role, remove_role (13 subactions).
"""

from typing import Any

from fastmcp import Context

from ..config.logging import logger
from ..core import client as _client
from ..core.exceptions import ToolError, tool_error_handler
from ..core.guards import gate_destructive_action
from ..core.pagination import cap_list
from ..core.utils import coerce_list, safe_get, validate_subaction
from ..core.validation import validate_input_mapping_list


# ===========================================================================
# KEY (API keys)
# ===========================================================================

_KEY_QUERIES: dict[str, str] = {
    "list": "query ListApiKeys { apiKeys { id name roles permissions { resource actions } createdAt } }",
    "get": "query GetApiKey($id: PrefixedID!) { apiKey(id: $id) { id name roles permissions { resource actions } createdAt } }",
    "possible_roles": "query GetPossibleRoles { apiKeyPossibleRoles }",
    "possible_permissions": "query GetPossiblePermissions { apiKeyPossiblePermissions { resource actions } }",
    "permissions_for_roles": "query GetPermissionsForRoles($roles: [Role!]!) { getPermissionsForRoles(roles: $roles) { resource actions } }",
    "preview_permissions": "query PreviewEffectivePermissions($roles: [Role!], $permissions: [AddPermissionInput!]) { previewEffectivePermissions(roles: $roles, permissions: $permissions) { resource actions } }",
    "auth_actions": "query GetAvailableAuthActions { getAvailableAuthActions }",
    "creation_form_schema": "query GetApiKeyCreationFormSchema { getApiKeyCreationFormSchema { id dataSchema uiSchema values } }",
}

_KEY_MUTATIONS: dict[str, str] = {
    "create": "mutation CreateApiKey($input: CreateApiKeyInput!) { apiKey { create(input: $input) { id name key roles } } }",
    "update": "mutation UpdateApiKey($input: UpdateApiKeyInput!) { apiKey { update(input: $input) { id name roles } } }",
    "delete": "mutation DeleteApiKey($input: DeleteApiKeyInput!) { apiKey { delete(input: $input) } }",
    "add_role": "mutation AddRole($input: AddRoleForApiKeyInput!) { apiKey { addRole(input: $input) } }",
    "remove_role": "mutation RemoveRole($input: RemoveRoleFromApiKeyInput!) { apiKey { removeRole(input: $input) } }",
}

_KEY_SUBACTIONS: set[str] = set(_KEY_QUERIES) | set(_KEY_MUTATIONS)
_KEY_DESTRUCTIVE: set[str] = {"delete"}


async def _handle_key(
    subaction: str,
    key_id: str | None,
    name: str | None,
    roles: list[str] | None,
    permissions: list[str] | None,
    ctx: Context | None,
    confirm: bool,
    limit: int = 20,
    permissions_input: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    validate_subaction(subaction, _KEY_SUBACTIONS, "key")

    await gate_destructive_action(
        ctx,
        subaction,
        _KEY_DESTRUCTIVE,
        confirm,
        {"delete": f"Delete API key **{key_id}**. Any clients using this key will lose access."},
    )

    with tool_error_handler("key", subaction, logger):
        logger.info(f"Executing unraid action=key subaction={subaction}")

        if subaction == "list":
            data = await _client.make_graphql_request(_KEY_QUERIES["list"])
            capped, page = cap_list(coerce_list(data.get("apiKeys")), limit)
            return {"keys": capped, "page": page}

        if subaction == "possible_roles":
            data = await _client.make_graphql_request(_KEY_QUERIES["possible_roles"])
            capped, page = cap_list(coerce_list(data.get("apiKeyPossibleRoles")), limit)
            return {"roles": capped, "page": page}

        if subaction == "possible_permissions":
            data = await _client.make_graphql_request(_KEY_QUERIES["possible_permissions"])
            capped, page = cap_list(coerce_list(data.get("apiKeyPossiblePermissions")), limit)
            return {"permissions": capped, "page": page}

        if subaction == "auth_actions":
            data = await _client.make_graphql_request(_KEY_QUERIES["auth_actions"])
            capped, page = cap_list(coerce_list(data.get("getAvailableAuthActions")), limit)
            return {"actions": capped, "page": page}

        if subaction == "creation_form_schema":
            data = await _client.make_graphql_request(_KEY_QUERIES["creation_form_schema"])
            return {"schema": data.get("getApiKeyCreationFormSchema")}

        if subaction == "permissions_for_roles":
            if not roles:
                raise ToolError(
                    "roles is required for key/permissions_for_roles (e.g. roles=['ADMIN'])"
                )
            data = await _client.make_graphql_request(
                _KEY_QUERIES["permissions_for_roles"], {"roles": roles}
            )
            capped, page = cap_list(coerce_list(data.get("getPermissionsForRoles")), limit)
            return {"permissions": capped, "page": page}

        if subaction == "preview_permissions":
            if not roles and not permissions_input:
                raise ToolError(
                    "key/preview_permissions requires roles and/or permissions_input "
                    "(permissions_input is a list of {resource, actions})"
                )
            variables: dict[str, Any] = {}
            if roles:
                variables["roles"] = roles
            if permissions_input:
                # Validate like every other structured input before it reaches GraphQL.
                variables["permissions"] = validate_input_mapping_list(
                    permissions_input, "permissions_input"
                )
            data = await _client.make_graphql_request(
                _KEY_QUERIES["preview_permissions"], variables
            )
            capped, page = cap_list(coerce_list(data.get("previewEffectivePermissions")), limit)
            return {"permissions": capped, "page": page}

        if subaction == "get":
            if not key_id:
                raise ToolError("key_id is required for key/get")
            data = await _client.make_graphql_request(_KEY_QUERIES["get"], {"id": key_id})
            return dict(data.get("apiKey") or {})

        if subaction == "create":
            if not name:
                raise ToolError("name is required for key/create")
            create_input: dict[str, Any] = {"name": name}
            if roles is not None:
                create_input["roles"] = roles
            if permissions is not None:
                create_input["permissions"] = permissions
            data = await _client.make_graphql_request(
                _KEY_MUTATIONS["create"], {"input": create_input}
            )
            created_key = safe_get(data, "apiKey", "create")
            if not created_key:
                raise ToolError("Failed to create API key: no data returned from server")
            return {"success": True, "key": created_key}

        if subaction == "update":
            if not key_id:
                raise ToolError("key_id is required for key/update")
            update_input: dict[str, Any] = {"id": key_id}
            if name:
                update_input["name"] = name
            if roles is not None:
                update_input["roles"] = roles
            if permissions is not None:
                update_input["permissions"] = permissions
            data = await _client.make_graphql_request(
                _KEY_MUTATIONS["update"], {"input": update_input}
            )
            updated_key = safe_get(data, "apiKey", "update")
            if not updated_key:
                raise ToolError("Failed to update API key: no data returned from server")
            return {"success": True, "key": updated_key}

        if subaction == "delete":
            if not key_id:
                raise ToolError("key_id is required for key/delete")
            data = await _client.make_graphql_request(
                _KEY_MUTATIONS["delete"], {"input": {"ids": [key_id]}}
            )
            if not safe_get(data, "apiKey", "delete"):
                raise ToolError(f"Failed to delete API key '{key_id}': no confirmation from server")
            return {"success": True, "message": f"API key '{key_id}' deleted"}

        if subaction in ("add_role", "remove_role"):
            if not key_id:
                raise ToolError(f"key_id is required for key/{subaction}")
            if not roles:
                raise ToolError(
                    f"roles is required for key/{subaction} (pass as roles=['ROLE_NAME'])"
                )
            data = await _client.make_graphql_request(
                _KEY_MUTATIONS[subaction], {"input": {"apiKeyId": key_id, "role": roles[0]}}
            )
            verb = "added to" if subaction == "add_role" else "removed from"
            return {"success": True, "message": f"Role '{roles[0]}' {verb} key '{key_id}'"}

        raise ToolError(f"Unhandled key subaction '{subaction}' — this is a bug")
