"""Docker domain handler for the Unraid MCP tool.

Covers: list, details, ports, start, stop, restart, unpause, networks,
network_details, remove_container*, update_container, update_containers,
update_all_containers, update_autostart, refresh_digests, sync_template_paths,
reset_template_mappings*, create_folder, create_folder_with_items, rename_folder,
set_folder_children, delete_entries*, move_entries_to_folder,
move_items_to_position, update_view_preferences (25 subactions, plus a deprecated
`logs` stub that returns an informative ToolError — not counted).
"""

import re
from collections.abc import Sequence
from typing import Any, TypedDict

from fastmcp import Context

from ..config.logging import logger
from ..core import client as _client
from ..core.exceptions import ToolError, tool_error_handler
from ..core.guards import gate_destructive_action
from ..core.pagination import cap_list
from ..core.utils import mutation_success, safe_get, validate_subaction
from ..core.validation import validate_input_mapping, validate_input_mapping_list


# ===========================================================================
# DOCKER
# ===========================================================================

_DOCKER_QUERIES: dict[str, str] = {
    "list": "query ListDockerContainers { docker { containers { id names image state status autoStart } } }",
    # Fetch a single container by id rather than the full list — avoids
    # over-fetching heavy fields (networkSettings, mounts, labels, command)
    # for every container on the host just to return one.
    "details": "query GetContainerDetails($id: PrefixedID!) { docker { container(id: $id) { id names image imageId command created ports { ip privatePort publicPort type } sizeRootFs labels state status hostConfig { networkMode } networkSettings mounts autoStart } } }",
    # The "ports" subaction still needs every running container's bindings, so
    # it keeps a list-based query (trimmed to just ports + state + names).
    "ports": "query GetContainerPorts { docker { containers { id names state ports { ip privatePort publicPort type } } } }",
    "networks": "query GetDockerNetworks { docker { networks { id name driver scope } } }",
    "network_details": "query GetDockerNetwork { docker { networks { id name driver scope enableIPv6 internal attachable containers options labels } } }",
}

# Internal query used only for container ID resolution — not a public subaction.
_DOCKER_RESOLVE_QUERY = "query ResolveContainerID { docker { containers { id names } } }"

_DOCKER_MUTATIONS: dict[str, str] = {
    "start": "mutation StartContainer($id: PrefixedID!) { docker { start(id: $id) { id names state status } } }",
    "stop": "mutation StopContainer($id: PrefixedID!) { docker { stop(id: $id) { id names state status } } }",
    "restart": "mutation RestartContainer($id: PrefixedID!) { docker { restart(id: $id) { id names state status } } }",
    "unpause": "mutation UnpauseContainer($id: PrefixedID!) { docker { unpause(id: $id) { id names state status } } }",
    "update_container": "mutation UpdateContainer($id: PrefixedID!) { docker { updateContainer(id: $id) { id names image state status } } }",
}

# Lifecycle mutations not handled by the single-id path: a Boolean-returning
# remove, the image-update bulk ops (one/many/all containers), and the autostart
# config mutation. Each is routed by a bespoke branch in _handle_docker.
_DOCKER_BULK_MUTATIONS: dict[str, str] = {
    "remove_container": "mutation RemoveContainer($id: PrefixedID!, $withImage: Boolean) { docker { removeContainer(id: $id, withImage: $withImage) } }",
    "update_containers": "mutation UpdateContainers($ids: [PrefixedID!]!) { docker { updateContainers(ids: $ids) { id names image state status } } }",
    "update_all_containers": "mutation UpdateAllContainers { docker { updateAllContainers { id names image state status } } }",
    "update_autostart": "mutation UpdateAutostart($entries: [DockerAutostartEntryInput!]!, $persist: Boolean) { docker { updateAutostartConfiguration(entries: $entries, persistUserPreferences: $persist) } }",
}

# Root-level Docker mutations (not namespaced under the `docker` mutation field).
_DOCKER_ROOT_MUTATIONS: dict[str, str] = {
    "refresh_digests": "mutation RefreshDockerDigests { refreshDockerDigests }",
    "sync_template_paths": "mutation SyncDockerTemplatePaths { syncDockerTemplatePaths { scanned matched skipped errors } }",
    "reset_template_mappings": "mutation ResetDockerTemplateMappings { resetDockerTemplateMappings }",
}

# subaction -> GraphQL response field, kept beside the mutation dicts they mirror.
_DOCKER_ROOT_RESULT_FIELD: dict[str, str] = {
    "refresh_digests": "refreshDockerDigests",
    "sync_template_paths": "syncDockerTemplatePaths",
    "reset_template_mappings": "resetDockerTemplateMappings",
}
_DOCKER_LIFECYCLE_RESULT_FIELD: dict[str, str] = {
    "start": "start",
    "stop": "stop",
    "restart": "restart",
    "unpause": "unpause",
    "update_container": "updateContainer",
}


# Docker "organizer" (folder/view) mutations. Each spec lists the required and
# optional GraphQL variables (sourced from the `organizer_input` dict), the
# mutation string, and the response field to read back. The return selection is
# trimmed to `version` — enough to confirm the layout changed without serialising
# the full resolved organizer tree. Using a TypedDict lets `ty` catch a missing or
# misspelled spec key at check time rather than at runtime.
class _OrganizerSpec(TypedDict):
    mutation: str
    required: Sequence[str]  # read-only lookup tables — not meant to be mutated
    optional: Sequence[str]
    result_field: str


_DOCKER_ORGANIZER: dict[str, _OrganizerSpec] = {
    "create_folder": {
        "mutation": "mutation CreateDockerFolder($name: String!, $parentId: String, $childrenIds: [String!]) { createDockerFolder(name: $name, parentId: $parentId, childrenIds: $childrenIds) { version } }",
        "required": ["name"],
        "optional": ["parentId", "childrenIds"],
        "result_field": "createDockerFolder",
    },
    "create_folder_with_items": {
        "mutation": "mutation CreateDockerFolderWithItems($name: String!, $parentId: String, $sourceEntryIds: [String!], $position: Float) { createDockerFolderWithItems(name: $name, parentId: $parentId, sourceEntryIds: $sourceEntryIds, position: $position) { version } }",
        "required": ["name"],
        "optional": ["parentId", "sourceEntryIds", "position"],
        "result_field": "createDockerFolderWithItems",
    },
    "rename_folder": {
        "mutation": "mutation RenameDockerFolder($folderId: String!, $newName: String!) { renameDockerFolder(folderId: $folderId, newName: $newName) { version } }",
        "required": ["folderId", "newName"],
        "optional": [],
        "result_field": "renameDockerFolder",
    },
    "set_folder_children": {
        "mutation": "mutation SetDockerFolderChildren($folderId: String, $childrenIds: [String!]!) { setDockerFolderChildren(folderId: $folderId, childrenIds: $childrenIds) { version } }",
        "required": ["childrenIds"],
        "optional": ["folderId"],
        "result_field": "setDockerFolderChildren",
    },
    "delete_entries": {
        "mutation": "mutation DeleteDockerEntries($entryIds: [String!]!) { deleteDockerEntries(entryIds: $entryIds) { version } }",
        "required": ["entryIds"],
        "optional": [],
        "result_field": "deleteDockerEntries",
    },
    "move_entries_to_folder": {
        "mutation": "mutation MoveDockerEntries($sourceEntryIds: [String!]!, $destinationFolderId: String!) { moveDockerEntriesToFolder(sourceEntryIds: $sourceEntryIds, destinationFolderId: $destinationFolderId) { version } }",
        "required": ["sourceEntryIds", "destinationFolderId"],
        "optional": [],
        "result_field": "moveDockerEntriesToFolder",
    },
    "move_items_to_position": {
        "mutation": "mutation MoveDockerItems($sourceEntryIds: [String!]!, $destinationFolderId: String!, $position: Float!) { moveDockerItemsToPosition(sourceEntryIds: $sourceEntryIds, destinationFolderId: $destinationFolderId, position: $position) { version } }",
        "required": ["sourceEntryIds", "destinationFolderId", "position"],
        "optional": [],
        "result_field": "moveDockerItemsToPosition",
    },
    "update_view_preferences": {
        "mutation": "mutation UpdateDockerViewPreferences($viewId: String, $prefs: JSON!) { updateDockerViewPreferences(viewId: $viewId, prefs: $prefs) { version } }",
        "required": ["prefs"],
        "optional": ["viewId"],
        "result_field": "updateDockerViewPreferences",
    },
}

# "logs" has no GraphQL query (field removed in Unraid 7.2.x) but is still a
# recognised subaction so validation passes and the informative ToolError below
# is returned rather than a generic "Invalid action" message.
# "ports" has a dedicated list query and aggregates host port bindings client-side.
_DOCKER_SUBACTIONS: set[str] = (
    set(_DOCKER_QUERIES)
    | set(_DOCKER_MUTATIONS)
    | set(_DOCKER_BULK_MUTATIONS)
    | set(_DOCKER_ROOT_MUTATIONS)
    | set(_DOCKER_ORGANIZER)
    | {"logs"}
)
_DOCKER_NEEDS_CONTAINER_ID = {"start", "stop", "details", "restart", "unpause", "update_container"}
# remove_container deletes the container (and optionally its image); reset_template_mappings
# wipes user template path overrides; delete_entries removes organizer entries.
_DOCKER_DESTRUCTIVE: set[str] = {"remove_container", "reset_template_mappings", "delete_entries"}
_DOCKER_ID_PATTERN = re.compile(r"^[a-f0-9]{64}(:[a-z0-9]+)?$", re.IGNORECASE)
_DOCKER_SHORT_ID_PATTERN = re.compile(r"^[a-f0-9]{12,63}$", re.IGNORECASE)


def _container_names(c: dict[str, Any]) -> list[str]:
    """Return a container's name list, defensively dropping null/non-string entries.

    The GraphQL ``names`` field is nominally a ``[String!]`` but malformed or partial
    responses can return ``null`` for the whole list or ``[null]`` for an element.
    Filtering here keeps every name-matching path (``.lower()``, ``startswith``,
    ``', '.join(...)``) from raising on a ``None``.
    """
    return [n for n in (c.get("names") or []) if isinstance(n, str)]


def _find_container(
    identifier: str, containers: list[dict[str, Any]], *, strict: bool = False
) -> dict[str, Any] | None:
    for c in containers:
        if c.get("id") == identifier or identifier in _container_names(c):
            return c
    if strict:
        return None
    id_lower = identifier.lower()
    # Collect prefix matches first, then fall back to substring matches.
    # _container_names() filters out null/non-string names so .lower() is safe.
    prefix_matches = [
        c for c in containers if any(n.lower().startswith(id_lower) for n in _container_names(c))
    ]
    candidates = prefix_matches or [
        c for c in containers if any(id_lower in n.lower() for n in _container_names(c))
    ]
    if not candidates:
        return None
    if len(candidates) == 1:
        return candidates[0]
    names = [n for c in candidates for n in _container_names(c)]
    raise ToolError(
        f"Container identifier '{identifier}' is ambiguous — matches: {', '.join(names[:10])}. "
        "Use a more specific name or the full container ID."
    )


async def _resolve_container_id(
    container_id: str,
    *,
    strict: bool = False,
    containers: list[dict[str, Any]] | None = None,
) -> str:
    if _DOCKER_ID_PATTERN.match(container_id):
        return container_id
    # Callers resolving several ids can pass a pre-fetched container list to avoid
    # re-fetching the full list once per id (see docker/update_containers).
    if containers is None:
        data = await _client.make_graphql_request(_DOCKER_RESOLVE_QUERY)
        containers = safe_get(data, "docker", "containers", default=[])
    if _DOCKER_SHORT_ID_PATTERN.match(container_id):
        id_lower = container_id.lower()
        matches = [
            c for c in containers if (c.get("id") or "").lower().split(":")[0].startswith(id_lower)
        ]
        if len(matches) == 1:
            return str(matches[0].get("id", ""))
        if len(matches) > 1:
            raise ToolError(
                f"Short ID prefix '{container_id}' is ambiguous. Matches: {', '.join(str(c.get('id', '')) for c in matches[:5])}."
            )
    resolved = _find_container(container_id, containers, strict=strict)
    if resolved:
        return str(resolved.get("id", ""))
    names: list[str] = []
    for c in containers:
        names.extend(_container_names(c))
    msg = (
        f"Container '{container_id}' not found by exact match. Mutations require exact name or full ID."
        if strict
        else f"Container '{container_id}' not found."
    )
    if names:
        msg += f" Available: {', '.join(names[:10])}"
    raise ToolError(msg)


async def _handle_docker(
    subaction: str,
    container_id: str | None,
    network_id: str | None,
    limit: int | None = None,
    ctx: Context | None = None,
    confirm: bool = False,
    container_ids: list[str] | None = None,
    with_image: bool = False,
    autostart_entries: list[dict[str, Any]] | None = None,
    organizer_input: dict[str, Any] | None = None,
) -> dict[str, Any]:
    validate_subaction(subaction, _DOCKER_SUBACTIONS, "docker")
    if subaction in _DOCKER_NEEDS_CONTAINER_ID and not container_id:
        raise ToolError(f"container_id is required for docker/{subaction}")
    if subaction == "network_details" and not network_id:
        raise ToolError("network_id is required for docker/network_details")

    await gate_destructive_action(
        ctx,
        subaction,
        _DOCKER_DESTRUCTIVE,
        confirm,
        {
            "remove_container": f"Remove container **{container_id}**"
            + (" and its image" if with_image else "")
            + ". This cannot be undone.",
            "reset_template_mappings": "Reset all Docker template path mappings to defaults. "
            "Custom template path overrides will be lost.",
            "delete_entries": "Delete the specified Docker organizer entries "
            "(folders/items) from the layout.",
        },
    )

    with tool_error_handler("docker", subaction, logger):
        logger.info(f"Executing unraid action=docker subaction={subaction}")

        if subaction == "list":
            data = await _client.make_graphql_request(_DOCKER_QUERIES["list"])
            containers = safe_get(data, "docker", "containers", default=[])
            capped, meta = cap_list(containers, limit)
            return {"containers": capped, "page": meta}

        if subaction == "details":
            actual_id = await _resolve_container_id(container_id or "")
            data = await _client.make_graphql_request(_DOCKER_QUERIES["details"], {"id": actual_id})
            container = safe_get(data, "docker", "container", default=None)
            if container:
                return container
            raise ToolError(f"Container '{container_id}' not found in details response.")

        if subaction == "ports":
            data = await _client.make_graphql_request(_DOCKER_QUERIES["ports"])
            containers = safe_get(data, "docker", "containers", default=[])
            bindings: list[dict[str, Any]] = []
            for container in containers:
                # Case-insensitive state check — matches the defensive pattern in _health.py
                # since Docker state values appear in both upper- and lower-case across the API.
                if (container.get("state") or "").upper() != "RUNNING":
                    continue
                names = _container_names(container)
                container_name = names[0].lstrip("/") if names else "<unnamed>"
                for port in container.get("ports") or []:
                    public_port = port.get("publicPort")
                    if public_port is None:
                        continue
                    bindings.append(
                        {
                            "host_port": public_port,
                            "host_ip": port.get("ip") or "0.0.0.0",  # noqa: S104 — Docker reports "0.0.0.0" for any-interface bindings
                            "container": container_name,
                            "container_port": port.get("privatePort"),
                            "protocol": port.get("type"),
                        }
                    )
            bindings.sort(key=lambda b: (b["host_port"], b.get("protocol") or ""))
            capped, page = cap_list(bindings, limit)
            return {"bindings": capped, "count": len(capped), "page": page}

        if subaction == "networks":
            data = await _client.make_graphql_request(_DOCKER_QUERIES["networks"])
            networks = safe_get(data, "docker", "networks", default=[])
            capped, page = cap_list(networks, limit)
            return {"networks": capped, "page": page}

        if subaction == "network_details":
            data = await _client.make_graphql_request(_DOCKER_QUERIES["network_details"])
            for net in safe_get(data, "docker", "networks", default=[]):
                if net.get("id") == network_id or net.get("name") == network_id:
                    return dict(net)
            raise ToolError(f"Network '{network_id}' not found.")

        if subaction == "logs":
            raise ToolError(
                "Container logs are not available via the Unraid GraphQL API. "
                "Use the Unraid terminal or SSH to run: "
                f"`docker logs {container_id or '<container_id>'} --tail 100`"
            )

        # Root-level no-arg mutations (refresh digests / template sync + reset).
        if subaction in _DOCKER_ROOT_MUTATIONS:
            data = await _client.make_graphql_request(_DOCKER_ROOT_MUTATIONS[subaction])
            result = data.get(_DOCKER_ROOT_RESULT_FIELD[subaction])
            if subaction == "sync_template_paths":
                # Returns {scanned, matched, skipped, errors}; surface a non-empty
                # errors list rather than reporting a partial sync as a clean success.
                errors = (result or {}).get("errors") or []
                return {
                    "success": not errors,
                    "subaction": subaction,
                    "result": result,
                    "errors": errors,
                }
            # refresh_digests / reset_template_mappings return a bare Boolean —
            # `false` means the operation did not take effect.
            return {
                "success": mutation_success(result, boolean=True),
                "subaction": subaction,
                "result": result,
            }

        # Organizer (folder/view) mutations driven by organizer_input.
        if subaction in _DOCKER_ORGANIZER:
            spec = _DOCKER_ORGANIZER[subaction]
            supplied = validate_input_mapping(organizer_input or {}, "organizer_input")
            missing = [k for k in spec["required"] if supplied.get(k) is None]
            if missing:
                raise ToolError(
                    f"organizer_input is missing required field(s) for docker/{subaction}: "
                    f"{', '.join(missing)}"
                )
            allowed = set(spec["required"]) | set(spec["optional"])
            # Reject unknown keys rather than silently dropping them — a typo'd
            # field name would otherwise vanish and the mutation run with defaults.
            unknown = set(supplied) - allowed
            if unknown:
                raise ToolError(
                    f"organizer_input has unknown field(s) for docker/{subaction}: "
                    f"{', '.join(sorted(unknown))}. Allowed: {', '.join(sorted(allowed))}"
                )
            variables = {k: v for k, v in supplied.items() if v is not None}
            data = await _client.make_graphql_request(spec["mutation"], variables)
            organizer = data.get(spec["result_field"])
            return {
                "success": mutation_success(organizer, boolean=False),
                "subaction": subaction,
                "organizer": organizer,
            }

        # Bulk / image-update lifecycle mutations.
        if subaction == "remove_container":
            actual_id = await _resolve_container_id(container_id or "", strict=True)
            data = await _client.make_graphql_request(
                _DOCKER_BULK_MUTATIONS["remove_container"],
                {"id": actual_id, "withImage": with_image},
            )
            return {
                "success": bool(safe_get(data, "docker", "removeContainer")),
                "subaction": subaction,
                "container_id": actual_id,
                "with_image": with_image,
            }

        if subaction == "update_containers":
            if not container_ids:
                raise ToolError("container_ids is required for docker/update_containers")
            # Resolve every id against a single container-list fetch rather than
            # re-fetching the full list once per id.
            containers: list[dict[str, Any]] = []
            if any(not _DOCKER_ID_PATTERN.match(c) for c in container_ids):
                resolve_data = await _client.make_graphql_request(_DOCKER_RESOLVE_QUERY)
                containers = safe_get(resolve_data, "docker", "containers", default=[])
            resolved = [
                await _resolve_container_id(c, strict=True, containers=containers)
                for c in container_ids
            ]
            data = await _client.make_graphql_request(
                _DOCKER_BULK_MUTATIONS["update_containers"], {"ids": resolved}
            )
            return {
                "success": True,
                "subaction": subaction,
                "containers": safe_get(data, "docker", "updateContainers", default=[]),
            }

        if subaction == "update_all_containers":
            data = await _client.make_graphql_request(
                _DOCKER_BULK_MUTATIONS["update_all_containers"]
            )
            return {
                "success": True,
                "subaction": subaction,
                "containers": safe_get(data, "docker", "updateAllContainers", default=[]),
            }

        if subaction == "update_autostart":
            if not autostart_entries:
                raise ToolError(
                    "autostart_entries is required for docker/update_autostart "
                    "(list of {id, autoStart, wait?})"
                )
            entries = validate_input_mapping_list(autostart_entries, "autostart_entries")
            data = await _client.make_graphql_request(
                _DOCKER_BULK_MUTATIONS["update_autostart"],
                {"entries": entries, "persist": True},
            )
            return {
                "success": bool(safe_get(data, "docker", "updateAutostartConfiguration")),
                "subaction": subaction,
                "entry_count": len(entries),
            }

        # Single-id namespaced lifecycle mutations: start, stop, unpause, update_container.
        if subaction not in _DOCKER_MUTATIONS:
            raise ToolError(f"Unhandled docker subaction '{subaction}' — this is a bug")
        actual_id = await _resolve_container_id(container_id or "", strict=True)
        data = await _client.make_graphql_request(
            _DOCKER_MUTATIONS[subaction],
            {"id": actual_id},
            operation_context={"operation": subaction},
        )
        if data.get("idempotent_success"):
            return {
                "success": True,
                "subaction": subaction,
                "idempotent": True,
                "message": f"Container already in desired state for '{subaction}'",
            }
        container = (data.get("docker") or {}).get(_DOCKER_LIFECYCLE_RESULT_FIELD[subaction])
        return {
            "success": mutation_success(container, boolean=False),
            "subaction": subaction,
            "container": container,
        }
