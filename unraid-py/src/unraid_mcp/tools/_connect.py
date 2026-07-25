"""Connect domain handler for the Unraid MCP tool.

Covers Unraid Connect / remote-access state and control:
remote_access, cloud, update_api_settings, sign_in, sign_out*,
setup_remote_access*, enable_dynamic_remote_access*, status (8 subactions).
"""

from typing import Any

from fastmcp import Context

from ..config.logging import logger
from ..core import client as _client
from ..core.exceptions import ToolError, tool_error_handler
from ..core.guards import gate_destructive_action
from ..core.utils import mutation_success, validate_subaction
from ..core.validation import validate_input_mapping


# ===========================================================================
# CONNECT (Unraid Connect / remote access)
# ===========================================================================

_CONNECT_QUERIES: dict[str, str] = {
    "remote_access": "query GetRemoteAccess { remoteAccess { accessType forwardType port } }",
    "cloud": "query GetCloud { cloud { error apiKey { valid error } relay { status timeout error } minigraphql { status timeout error } cloud { status ip error } allowedOrigins } }",
    "status": """
        query GetConnectStatus {
          connect {
            id
            dynamicRemoteAccess { enabledType runningType error }
            settings { id }
          }
        }
    """,
}

_CONNECT_MUTATIONS: dict[str, str] = {
    "update_api_settings": "mutation UpdateApiSettings($input: ConnectSettingsInput!) { updateApiSettings(input: $input) { accessType forwardType port } }",
    "sign_in": "mutation ConnectSignIn($input: ConnectSignInInput!) { connectSignIn(input: $input) }",
    "sign_out": "mutation ConnectSignOut { connectSignOut }",
    "setup_remote_access": "mutation SetupRemoteAccess($input: SetupRemoteAccessInput!) { setupRemoteAccess(input: $input) }",
    "enable_dynamic_remote_access": "mutation EnableDynamicRemoteAccess($input: EnableDynamicRemoteAccessInput!) { enableDynamicRemoteAccess(input: $input) }",
}

_CONNECT_SUBACTIONS: set[str] = set(_CONNECT_QUERIES) | set(_CONNECT_MUTATIONS)
# Every Connect mutation changes the server's remote-access / cloud security
# posture (signing in/out, registering with the cloud, or changing internet
# reachability), so all are gated behind explicit confirmation.
_CONNECT_DESTRUCTIVE: set[str] = {
    "sign_in",
    "sign_out",
    "update_api_settings",
    "setup_remote_access",
    "enable_dynamic_remote_access",
}

# Mutations whose input is supplied via the shared `connect_input` dict.
_CONNECT_INPUT_MUTATIONS: set[str] = {
    "update_api_settings",
    "sign_in",
    "setup_remote_access",
    "enable_dynamic_remote_access",
}

# Mutations that return a bare Boolean (false => operation did not take effect);
# the rest (update_api_settings) return an object.
_CONNECT_BOOL_MUTATIONS: set[str] = {
    "sign_in",
    "setup_remote_access",
    "enable_dynamic_remote_access",
}

_CONNECT_RESULT_FIELD: dict[str, str] = {
    "update_api_settings": "updateApiSettings",
    "sign_in": "connectSignIn",
    "setup_remote_access": "setupRemoteAccess",
    "enable_dynamic_remote_access": "enableDynamicRemoteAccess",
}

_CONNECT_QUERY_OUTPUTS: dict[str, str] = {
    "remote_access": "remoteAccess",
    "cloud": "cloud",
    "status": "connect",
}


def _required_query_root(data: dict[str, Any], response_key: str, subaction: str) -> dict[str, Any]:
    root = data.get(response_key)
    if root is None:
        raise ToolError(
            f"Unraid API returned no {response_key!r} root for connect/{subaction}. "
            "Check API version, permissions, and server logs."
        )
    if not isinstance(root, dict):
        raise ToolError(
            f"Unraid API returned unexpected {response_key!r} payload for connect/{subaction}"
        )
    return root


async def _handle_connect(
    subaction: str,
    ctx: Context | None,
    confirm: bool,
    connect_input: dict[str, Any] | None = None,
) -> dict[str, Any]:
    validate_subaction(subaction, _CONNECT_SUBACTIONS, "connect")

    await gate_destructive_action(
        ctx,
        subaction,
        _CONNECT_DESTRUCTIVE,
        confirm,
        {
            "sign_in": "Sign this server in to Unraid Connect. This registers the server "
            "with the cloud service and enables remote management.",
            "sign_out": "Sign this server out of Unraid Connect. Remote access via "
            "Connect will stop working until you sign back in.",
            "update_api_settings": "Change the Unraid Connect remote-access configuration "
            "(access type / forward type / port). This affects internet reachability.",
            "setup_remote_access": "Reconfigure Unraid Connect remote access. This can "
            "expose the server to the internet (UPnP/port forwarding).",
            "enable_dynamic_remote_access": "Toggle dynamic remote access for Unraid "
            "Connect, changing how/whether the server is reachable remotely.",
        },
    )

    with tool_error_handler("connect", subaction, logger):
        logger.info(f"Executing unraid action=connect subaction={subaction}")

        if subaction in _CONNECT_QUERY_OUTPUTS:
            response_key = _CONNECT_QUERY_OUTPUTS[subaction]
            data = await _client.make_graphql_request(_CONNECT_QUERIES[subaction])
            return {
                "success": True,
                "subaction": subaction,
                response_key: _required_query_root(data, response_key, subaction),
            }

        if subaction == "sign_out":
            data = await _client.make_graphql_request(_CONNECT_MUTATIONS["sign_out"])
            return {"success": bool(data.get("connectSignOut")), "subaction": subaction}

        if subaction in _CONNECT_INPUT_MUTATIONS:
            if connect_input is None:
                raise ToolError(f"connect_input is required for connect/{subaction}")
            validated = validate_input_mapping(connect_input, "connect_input")
            data = await _client.make_graphql_request(
                _CONNECT_MUTATIONS[subaction], {"input": validated}
            )
            result = data.get(_CONNECT_RESULT_FIELD[subaction])
            success = mutation_success(result, boolean=subaction in _CONNECT_BOOL_MUTATIONS)
            return {"success": success, "subaction": subaction, "result": result}

        raise ToolError(f"Unhandled connect subaction '{subaction}' — this is a bug")
