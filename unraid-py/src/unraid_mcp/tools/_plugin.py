"""Plugin domain handler for the Unraid MCP tool.

Covers: list, installed_unraid, install_operations, install_operation, add,
remove*, install, install_language (8 subactions).
"""

import ipaddress
import socket
from typing import Any
from urllib.parse import urlparse

from fastmcp import Context

from ..config.logging import logger
from ..core import client as _client
from ..core.exceptions import ToolError, tool_error_handler
from ..core.guards import gate_destructive_action
from ..core.pagination import cap_list
from ..core.utils import coerce_list, mutation_success, validate_subaction


# ===========================================================================
# PLUGIN
# ===========================================================================

_PLUGIN_QUERIES: dict[str, str] = {
    "list": "query ListPlugins { plugins { name version hasApiModule hasCliModule } }",
    # Raw installed .plg filenames — distinct from the structured `plugins` list.
    "installed_unraid": "query InstalledUnraidPlugins { installedUnraidPlugins }",
    "install_operations": "query PluginInstallOperations { pluginInstallOperations { id url name status createdAt updatedAt finishedAt } }",
    "install_operation": "query PluginInstallOperation($operationId: ID!) { pluginInstallOperation(operationId: $operationId) { id url name status createdAt updatedAt finishedAt output } }",
}

_PLUGIN_MUTATIONS: dict[str, str] = {
    "add": "mutation AddPlugin($input: PluginManagementInput!) { addPlugin(input: $input) }",
    "remove": "mutation RemovePlugin($input: PluginManagementInput!) { removePlugin(input: $input) }",
    # Async .plg install group (returns an operation to poll via install_operation).
    "install": "mutation InstallPlugin($input: InstallPluginInput!) { unraidPlugins { installPlugin(input: $input) { id url name status createdAt } } }",
    "install_language": "mutation InstallLanguage($input: InstallPluginInput!) { unraidPlugins { installLanguage(input: $input) { id url name status createdAt } } }",
}

_PLUGIN_SUBACTIONS: set[str] = set(_PLUGIN_QUERIES) | set(_PLUGIN_MUTATIONS)
# install / install_language fetch and run a .plg from a caller-supplied URL as
# root — gated like remove.
_PLUGIN_DESTRUCTIVE: set[str] = {"remove", "install", "install_language"}


def _validate_plugin_url(url: str) -> str:
    """Reject non-http(s) / hostless / SSRF-prone plugin URLs before forwarding.

    Defence-in-depth against a delegated-SSRF / `file://` install vector — the
    Unraid API performs the actual fetch (and runs the resulting .plg as root),
    but the MCP layer should not pass obviously-abusive schemes or URLs that
    resolve to internal/cloud-metadata endpoints through.

    The host is resolved via ``socket.getaddrinfo`` and rejected if *any*
    resolved address is private/loopback/link-local/reserved/unspecified, which
    blocks pivots like ``http://169.254.169.254/`` (cloud metadata), RFC1918,
    ``127.0.0.1``/``::1``, and so on.

    CAVEAT — DNS rebinding: a hostname that resolves to a public address here can
    re-resolve to a private one when the Unraid host later fetches it (TOCTOU).
    This is a best-effort, defence-in-depth check at the MCP layer; it is not a
    complete SSRF mitigation. The Unraid host does its own (re-)resolution.
    """
    try:
        parsed = urlparse(url)
    except ValueError as exc:
        raise ToolError(f"plugin url is not a valid URL: {exc}") from exc
    if parsed.scheme not in ("http", "https"):
        raise ToolError(f"plugin url must use http or https, got '{parsed.scheme or '(none)'}'")
    if not parsed.netloc:
        raise ToolError("plugin url must include a hostname")

    hostname = parsed.hostname
    if not hostname:
        raise ToolError("plugin url must include a hostname")

    try:
        addrinfo = socket.getaddrinfo(hostname, parsed.port or None, proto=socket.IPPROTO_TCP)
    except socket.gaierror as exc:
        raise ToolError(f"plugin url host '{hostname}' could not be resolved: {exc}") from exc

    for _family, _type, _proto, _canon, sockaddr in addrinfo:
        try:
            ip = ipaddress.ip_address(sockaddr[0])
        except ValueError:
            # Unparseable sockaddr — fail closed rather than forward an unknown host.
            raise ToolError(
                f"plugin url host '{hostname}' resolved to an unparseable address"
            ) from None
        if (
            ip.is_private
            or ip.is_loopback
            or ip.is_link_local
            or ip.is_reserved
            or ip.is_unspecified
        ):
            raise ToolError(
                f"plugin url host '{hostname}' resolves to a non-public address ({ip}); "
                "refusing to forward (SSRF guard)"
            )

    return url


async def _handle_plugin(
    subaction: str,
    names: list[str] | None,
    bundled: bool,
    restart: bool,
    ctx: Context | None,
    confirm: bool,
    limit: int = 20,
    url: str | None = None,
    plugin_name: str | None = None,
    forced: bool = False,
    operation_id: str | None = None,
) -> dict[str, Any]:
    validate_subaction(subaction, _PLUGIN_SUBACTIONS, "plugin")

    await gate_destructive_action(
        ctx,
        subaction,
        _PLUGIN_DESTRUCTIVE,
        confirm,
        {
            "remove": f"Remove plugin(s) **{names}** from the Unraid API. This cannot be "
            "undone without re-installing.",
            "install": f"Install a plugin from **{url}**. This fetches and runs a .plg file "
            "as root on the Unraid host.",
            "install_language": f"Install a language pack from **{url}**. This fetches and runs "
            "a .plg file as root on the Unraid host.",
        },
    )

    with tool_error_handler("plugin", subaction, logger):
        logger.info(f"Executing unraid action=plugin subaction={subaction}")

        if subaction == "list":
            data = await _client.make_graphql_request(_PLUGIN_QUERIES["list"])
            capped, page = cap_list(coerce_list(data.get("plugins")), limit)
            return {
                "success": True,
                "subaction": subaction,
                "plugins": capped,
                "page": page,
            }

        if subaction == "installed_unraid":
            data = await _client.make_graphql_request(_PLUGIN_QUERIES["installed_unraid"])
            capped, page = cap_list(coerce_list(data.get("installedUnraidPlugins")), limit)
            return {
                "success": True,
                "subaction": subaction,
                "plugins": capped,
                "page": page,
            }

        if subaction == "install_operations":
            data = await _client.make_graphql_request(_PLUGIN_QUERIES["install_operations"])
            capped, page = cap_list(coerce_list(data.get("pluginInstallOperations")), limit)
            return {
                "success": True,
                "subaction": subaction,
                "operations": capped,
                "page": page,
            }

        if subaction == "install_operation":
            if not operation_id:
                raise ToolError("operation_id is required for plugin/install_operation")
            data = await _client.make_graphql_request(
                _PLUGIN_QUERIES["install_operation"], {"operationId": operation_id}
            )
            return {
                "success": True,
                "subaction": subaction,
                "operation": data.get("pluginInstallOperation"),
            }

        if subaction in ("install", "install_language"):
            if not url:
                raise ToolError(f"url is required for plugin/{subaction}")
            input_data: dict[str, Any] = {"url": _validate_plugin_url(url), "forced": forced}
            if plugin_name:
                input_data["name"] = plugin_name
            data = await _client.make_graphql_request(
                _PLUGIN_MUTATIONS[subaction], {"input": input_data}
            )
            result_key = "installPlugin" if subaction == "install" else "installLanguage"
            operation = (data.get("unraidPlugins") or {}).get(result_key)
            return {
                "success": mutation_success(operation, boolean=False),
                "subaction": subaction,
                "operation": operation,
            }

        if subaction in ("add", "remove"):
            if not names:
                raise ToolError(f"names is required for plugin/{subaction}")
            data = await _client.make_graphql_request(
                _PLUGIN_MUTATIONS[subaction],
                {"input": {"names": names, "bundled": bundled, "restart": restart}},
            )
            result_key = "addPlugin" if subaction == "add" else "removePlugin"
            return {
                "success": True,
                "subaction": subaction,
                "names": names,
                "manual_restart_required": data.get(result_key),
            }

        raise ToolError(f"Unhandled plugin subaction '{subaction}' — this is a bug")
