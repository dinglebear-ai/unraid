"""VM domain handler for the Unraid MCP tool.

Covers: list, details, start, stop, pause, resume, force_stop*, reboot, reset* (9 subactions).
"""

from typing import Any

from fastmcp import Context

from ..config.logging import logger
from ..core import client as _client
from ..core.exceptions import ToolError, tool_error_handler
from ..core.guards import gate_destructive_action
from ..core.pagination import cap_list
from ..core.utils import validate_subaction


# ===========================================================================
# VM
# ===========================================================================

# VmDomain only exposes id/name/state/uuid — no richer detail query exists in the
# Unraid GraphQL schema, so "details" reuses the same query and filters client-side.
_VM_LIST_QUERY = "query ListVMs { vms { id domains { id name state uuid } } }"

_VM_QUERIES: dict[str, str] = {
    "list": _VM_LIST_QUERY,
}

_VM_MUTATIONS: dict[str, str] = {
    "start": "mutation StartVM($id: PrefixedID!) { vm { start(id: $id) } }",
    "stop": "mutation StopVM($id: PrefixedID!) { vm { stop(id: $id) } }",
    "pause": "mutation PauseVM($id: PrefixedID!) { vm { pause(id: $id) } }",
    "resume": "mutation ResumeVM($id: PrefixedID!) { vm { resume(id: $id) } }",
    "force_stop": "mutation ForceStopVM($id: PrefixedID!) { vm { forceStop(id: $id) } }",
    "reboot": "mutation RebootVM($id: PrefixedID!) { vm { reboot(id: $id) } }",
    "reset": "mutation ResetVM($id: PrefixedID!) { vm { reset(id: $id) } }",
}

_VM_SUBACTIONS: set[str] = set(_VM_QUERIES) | set(_VM_MUTATIONS) | {"details"}
_VM_DESTRUCTIVE: set[str] = {"force_stop", "reset"}
_VM_MUTATION_FIELDS: dict[str, str] = {"force_stop": "forceStop"}


async def _handle_vm(
    subaction: str, vm_id: str | None, ctx: Context | None, confirm: bool, limit: int = 20
) -> dict[str, Any]:
    validate_subaction(subaction, _VM_SUBACTIONS, "vm")
    if subaction != "list" and not vm_id:
        raise ToolError(f"vm_id is required for vm/{subaction}")

    await gate_destructive_action(
        ctx,
        subaction,
        _VM_DESTRUCTIVE,
        confirm,
        {
            "force_stop": f"Force stop VM **{vm_id}**. Unsaved data may be lost.",
            "reset": f"Reset VM **{vm_id}**. This is a hard reset — unsaved data may be lost.",
        },
    )

    with tool_error_handler("vm", subaction, logger):
        logger.info(f"Executing unraid action=vm subaction={subaction}")

        if subaction == "list":
            data = await _client.make_graphql_request(_VM_QUERIES["list"])
            if data.get("vms"):
                vms = data["vms"].get("domains") or data["vms"].get("domain") or []
                if isinstance(vms, dict):
                    vms = [vms]
                capped, page = cap_list(vms, limit)
                return {"vms": capped, "page": page}
            capped, page = cap_list([], limit)
            return {"vms": capped, "page": page}

        if subaction == "details":
            # VmDomain has no richer fields than list — reuse the same query, filter client-side.
            data = await _client.make_graphql_request(_VM_LIST_QUERY)
            if not data.get("vms"):
                raise ToolError("No VM data returned from server")
            vms = data["vms"].get("domains") or data["vms"].get("domain") or []
            if isinstance(vms, dict):
                vms = [vms]
            for vm in vms:
                if vm.get("uuid") == vm_id or vm.get("id") == vm_id or vm.get("name") == vm_id:
                    return dict(vm)
            available = [f"{v.get('name')} (UUID: {v.get('uuid')})" for v in vms]
            raise ToolError(f"VM '{vm_id}' not found. Available: {', '.join(available)}")

        data = await _client.make_graphql_request(_VM_MUTATIONS[subaction], {"id": vm_id})
        field = _VM_MUTATION_FIELDS.get(subaction, subaction)
        if data.get("vm") and field in data["vm"]:
            return {"success": data["vm"][field], "subaction": subaction, "vm_id": vm_id}
        raise ToolError(f"Failed to {subaction} VM or unexpected response")
