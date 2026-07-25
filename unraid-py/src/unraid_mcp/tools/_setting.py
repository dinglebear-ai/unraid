"""Setting domain handler for the Unraid MCP tool.

Covers: update, configure_ups*, update_ssh*, update_temperature, update_system_time,
update_server_identity (6 subactions).
"""

from typing import Any

from fastmcp import Context

from ..config.logging import logger
from ..core import client as _client
from ..core.exceptions import ToolError, tool_error_handler
from ..core.guards import gate_destructive_action
from ..core.utils import mutation_success, validate_subaction
from ..core.validation import (
    DANGEROUS_KEY_PATTERN,
    validate_input_mapping,
    validate_scalar_mapping,
    validate_str_param,
)


# ===========================================================================
# SETTING
# ===========================================================================

_MAX_SETTINGS_KEYS = 100


def _validate_json_settings_input(settings_input: dict[str, Any]) -> dict[str, Any]:
    """Validate JSON-typed settings input without narrowing valid JSON members."""
    if len(settings_input) > _MAX_SETTINGS_KEYS:
        raise ToolError(f"settings_input has {len(settings_input)} keys (max {_MAX_SETTINGS_KEYS})")
    validated: dict[str, Any] = {}
    for key, value in settings_input.items():
        if not isinstance(key, str) or not key.strip():
            raise ToolError(
                f"settings_input keys must be non-empty strings, got: {type(key).__name__}"
            )
        if DANGEROUS_KEY_PATTERN.search(key):
            raise ToolError(f"settings_input key '{key}' contains disallowed characters")
        validated[key] = value
    return validated


_SETTING_MUTATIONS: dict[str, str] = {
    "update": "mutation UpdateSettings($input: JSON!) { updateSettings(input: $input) { restartRequired values warnings } }",
    "configure_ups": "mutation ConfigureUps($config: UPSConfigInput!) { configureUps(config: $config) }",
    "update_ssh": "mutation UpdateSsh($input: UpdateSshInput!) { updateSshSettings(input: $input) { id version } }",
    "update_temperature": "mutation UpdateTemperatureConfig($input: TemperatureConfigInput!) { updateTemperatureConfig(input: $input) }",
    "update_system_time": "mutation UpdateSystemTime($input: UpdateSystemTimeInput!) { updateSystemTime(input: $input) { currentTime timeZone useNtp ntpServers } }",
    "update_server_identity": "mutation UpdateServerIdentity($name: String!, $comment: String, $sysModel: String) { updateServerIdentity(name: $name, comment: $comment, sysModel: $sysModel) { id name comment } }",
}

_SETTING_SUBACTIONS: set[str] = set(_SETTING_MUTATIONS)
# update_ssh can lock out remote shell access; update_system_time can invalidate
# TLS certificates and disrupt time-sensitive services.
_SETTING_DESTRUCTIVE: set[str] = {"configure_ups", "update_ssh", "update_system_time"}

# Response field per config mutation. update_temperature returns a bare Boolean;
# update_ssh (Vars) and update_system_time (SystemTime) return objects.
_SETTING_CONFIG_RESULT_FIELD: dict[str, str] = {
    "update_ssh": "updateSshSettings",
    "update_temperature": "updateTemperatureConfig",
    "update_system_time": "updateSystemTime",
}


async def _handle_setting(
    subaction: str,
    settings_input: dict[str, Any] | None,
    ups_config: dict[str, Any] | None,
    ctx: Context | None,
    confirm: bool,
    config_input: dict[str, Any] | None = None,
    name: str | None = None,
    comment: str | None = None,
    sys_model: str | None = None,
) -> dict[str, Any]:
    validate_subaction(subaction, _SETTING_SUBACTIONS, "setting")

    await gate_destructive_action(
        ctx,
        subaction,
        _SETTING_DESTRUCTIVE,
        confirm,
        {
            "configure_ups": "Configure UPS monitoring. This will overwrite the current "
            "UPS daemon settings.",
            "update_ssh": "Update the server's SSH daemon settings. Disabling SSH or "
            "changing the port can cut off remote shell access.",
            "update_system_time": "Update the server's system time / NTP configuration. "
            "Clock changes can invalidate TLS certificates and break time-sensitive services.",
        },
    )

    with tool_error_handler("setting", subaction, logger):
        logger.info(f"Executing unraid action=setting subaction={subaction}")

        if subaction == "update":
            if settings_input is None:
                raise ToolError("settings_input is required for setting/update")
            validated_input = _validate_json_settings_input(settings_input)
            data = await _client.make_graphql_request(
                _SETTING_MUTATIONS["update"], {"input": validated_input}
            )
            return {"success": True, "subaction": "update", "data": data.get("updateSettings")}

        if subaction == "configure_ups":
            if ups_config is None:
                raise ToolError("ups_config is required for setting/configure_ups")
            # Validate ups_config with the same rules as settings_input — key count
            # cap, scalar-only values, MAX_VALUE_LENGTH — to prevent unvalidated bulk
            # input from reaching the GraphQL mutation.
            validated_ups = validate_scalar_mapping(
                ups_config, "ups_config", max_keys=_MAX_SETTINGS_KEYS
            )
            data = await _client.make_graphql_request(
                _SETTING_MUTATIONS["configure_ups"], {"config": validated_ups}
            )
            return {
                "success": True,
                "subaction": "configure_ups",
                "result": data.get("configureUps"),
            }

        if subaction in ("update_ssh", "update_temperature", "update_system_time"):
            if config_input is None:
                raise ToolError(f"config_input is required for setting/{subaction}")
            validated = validate_input_mapping(config_input, "config_input")
            data = await _client.make_graphql_request(
                _SETTING_MUTATIONS[subaction], {"input": validated}
            )
            result = data.get(_SETTING_CONFIG_RESULT_FIELD[subaction])
            success = mutation_success(result, boolean=subaction == "update_temperature")
            return {"success": success, "subaction": subaction, "result": result}

        if subaction == "update_server_identity":
            if not name:
                raise ToolError("name is required for setting/update_server_identity")
            variables: dict[str, Any] = {"name": validate_str_param(name, "name")}
            if comment is not None:
                variables["comment"] = validate_str_param(comment, "comment")
            if sys_model is not None:
                variables["sysModel"] = validate_str_param(sys_model, "sys_model")
            data = await _client.make_graphql_request(
                _SETTING_MUTATIONS["update_server_identity"], variables
            )
            server = data.get("updateServerIdentity")
            return {
                "success": mutation_success(server, boolean=False),
                "subaction": "update_server_identity",
                "server": server,
            }

        raise ToolError(f"Unhandled setting subaction '{subaction}' — this is a bug")
