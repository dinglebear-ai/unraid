"""System domain handler for the Unraid MCP tool.

Covers: overview, array, network, registration, variables, metrics, network_metrics, services,
display, display_details, config, online, owner, settings, server,
server_details, servers, network_access_urls, flash, ups_devices, ups_device,
ups_config, server_time, timezones, network_interfaces (25 subactions).
"""

from typing import Any

from ..config.logging import logger
from ..core import client as _client
from ..core.exceptions import ToolError, tool_error_handler
from ..core.pagination import cap_list
from ..core.utils import format_kb, safe_get, validate_subaction


# ===========================================================================
# SYSTEM (info)
# ===========================================================================

_SYSTEM_QUERIES: dict[str, str] = {
    "overview": """
        query GetSystemInfo {
          info {
            os { platform distro release codename kernel arch hostname logofile serial build uptime }
            cpu { manufacturer brand vendor family model stepping revision voltage speed speedmin speedmax threads cores processors socket cache }
            memory { layout { bank type clockSpeed formFactor manufacturer partNum serialNum } }
            baseboard { manufacturer model version serial assetTag }
            system { manufacturer model version serial uuid sku }
            versions { core { unraid api kernel } packages { openssl node npm pm2 git nginx php docker } }
            machineId time
          }
        }
    """,
    "array": """
        query GetArrayStatus {
          array {
            id state
            capacity { kilobytes { free used total } disks { free used total } }
            boot { id idx name device size status rotational temp numReads numWrites numErrors fsSize fsFree fsUsed exportable type warning critical fsType comment format transport color }
            parities { id idx name device size status rotational temp numReads numWrites numErrors fsSize fsFree fsUsed exportable type warning critical fsType comment format transport color }
            disks { id idx name device size status rotational temp numReads numWrites numErrors fsSize fsFree fsUsed exportable type warning critical fsType comment format transport color }
            caches { id idx name device size status rotational temp numReads numWrites numErrors fsSize fsFree fsUsed exportable type warning critical fsType comment format transport color }
          }
        }
    """,
    # Uses the vars root field — returns only the network-access subset
    # (port, portssl, localTld, useSsl) alongside servers for URL construction.
    "network": """
        query GetNetworkInfo {
          servers { id name status wanip lanip localurl remoteurl }
          vars { id port portssl localTld useSsl }
        }
    """,
    "registration": """
        query GetRegistrationInfo {
          registration { id type keyFile { location } state expiration updateExpiration }
        }
    """,
    # Uses the vars root field — returns a broad subset of system variables.
    # Shares the same GraphQL root as "network" but requests a different field
    # set; no overlap occurs because GraphQL returns only the requested subfields.
    "variables": """
        query GetSelectiveUnraidVariables {
          vars {
            id version name timeZone comment security workgroup domain domainShort
            hideDotFiles localMaster enableFruit useNtp domainLogin sysModel
            sysFlashSlots useSsl port portssl localTld bindMgt useTelnet porttelnet
            useSsh portssh startPage startArray shutdownTimeout
            shareSmbEnabled shareNfsEnabled shareAfpEnabled shareCacheEnabled
            shareAvahiEnabled safeMode startMode configValid configError joinStatus
            deviceCount flashGuid flashProduct flashVendor mdState mdVersion
            shareCount shareSmbCount shareNfsCount shareAfpCount shareMoverActive
          }
        }
    """,
    "metrics": "query GetMetrics { metrics { cpu { percentTotal } memory { total used free available buffcache percentTotal } } }",
    "network_metrics": "query GetNetworkMetrics { metrics { network { id name operstate bytesReceived bytesSent packetsReceived packetsSent receiveErrors transmitErrors receiveDropped transmitDropped rxSec txSec utilizationPercent lastUpdated } } }",
    "services": "query GetServices { services { name online version } }",
    "display": "query GetDisplay { info { display { theme } } }",
    "display_details": """
        query GetDisplayDetails {
          display {
            id
            case { id url icon error }
            theme
            unit
            scale
            tabs
            resize
            wwn
            total
            usage
            text
            warning
            critical
            hot
            max
            locale
          }
        }
    """,
    "config": "query GetConfig { config { valid error } }",
    "online": "query GetOnline { online }",
    "owner": "query GetOwner { owner { username avatar url } }",
    # settings.unified.values is an opaque JSON! scalar in the GraphQL schema
    # (no selectable subfields), so field-level narrowing is not possible here.
    "settings": "query GetSettings { settings { unified { values } } }",
    "server": """
        query GetServer {
          info { os { hostname uptime } versions { core { unraid } } machineId time }
          array { state }
          online
        }
    """,
    "servers": "query GetServers { servers { id name status wanip lanip localurl remoteurl } }",
    "network_access_urls": """
        query GetNetworkAccessUrls {
          network {
            id
            accessUrls { type name ipv4 ipv6 }
          }
        }
    """,
    "server_details": """
        query GetServerDetails {
          server {
            id
            owner { id username url avatar }
            guid
            name
            comment
            status
            wanip
            lanip
            localurl
            remoteurl
          }
        }
    """,
    "flash": "query GetFlash { flash { id vendor product } }",
    "ups_devices": "query GetUpsDevices { upsDevices { id name model status battery { chargeLevel estimatedRuntime health } power { loadPercentage inputVoltage outputVoltage } } }",
    "ups_device": "query GetUpsDevice($id: String!) { upsDeviceById(id: $id) { id name model status battery { chargeLevel estimatedRuntime health } power { loadPercentage inputVoltage outputVoltage } } }",
    "ups_config": "query GetUpsConfig { upsConfiguration { service upsCable upsType device batteryLevel minutes timeout killUps upsName } }",
    "server_time": "query GetSystemTime { systemTime { currentTime timeZone useNtp ntpServers } }",
    "timezones": "query GetTimeZones { timeZoneOptions { value label } }",
    "network_interfaces": """
        query GetNetworkInterfaces {
          networkInterfaces {
            id
            name
            description
            macAddress
            status
            protocol
            ipAddress
            netmask
            gateway
            useDhcp
            ipv6Address
            ipv6Netmask
            ipv6Gateway
            useDhcp6
            speed
            duplex
            mtu
            operstate
            type
            virtual
            vlanId
            internal
            ipv4Addresses { address netmask }
            ipv6Addresses { address prefixLength }
          }
        }
    """,
}

_SYSTEM_SUBACTIONS: set[str] = set(_SYSTEM_QUERIES)

# Subactions whose response is a single object echoed back under a stable key.
# Hoisted to module scope so the dispatch table isn't rebuilt on every call.
_SYSTEM_SIMPLE_KEYS: dict[str, str] = {
    "registration": "registration",
    "variables": "vars",
    "metrics": "metrics",
    "config": "config",
    "owner": "owner",
    "flash": "flash",
    "ups_config": "upsConfiguration",
    "server_time": "systemTime",
}

# Subactions returning a list: maps subaction -> (response_key, output_key).
# Hoisted to module scope (see above).
_SYSTEM_LIST_ACTIONS: dict[str, tuple[str, str]] = {
    "services": ("services", "services"),
    "servers": ("servers", "servers"),
    "ups_devices": ("upsDevices", "ups_devices"),
    "timezones": ("timeZoneOptions", "timezones"),
    "network_interfaces": ("networkInterfaces", "network_interfaces"),
}

_SYSTEM_DIRECT_ROOTS: dict[str, str] = {
    "display_details": "display",
    "network_access_urls": "network",
    "server_details": "server",
}


def _required_direct_root(data: dict[str, Any], subaction: str) -> dict[str, Any]:
    root_name = _SYSTEM_DIRECT_ROOTS[subaction]
    root = data.get(root_name)
    if root is None:
        raise ToolError(
            f"Unraid API returned no {root_name!r} root for system/{subaction}. "
            "Check API version, permissions, and server logs."
        )
    if not isinstance(root, dict):
        raise ToolError(
            f"Unraid API returned unexpected {root_name!r} payload for system/{subaction}"
        )
    return root


def _analyze_disk_health(disks: list[dict[str, Any]]) -> dict[str, int]:
    counts = {
        "healthy": 0,
        "failed": 0,
        "missing": 0,
        "new": 0,
        "warning": 0,
        "critical": 0,
        "unknown": 0,
    }
    for disk in disks:
        status = disk.get("status", "").upper()
        warning = disk.get("warning")
        critical = disk.get("critical")
        if status == "DISK_OK":
            counts["critical" if critical else "warning" if warning else "healthy"] += 1
        elif status in ("DISK_DSBL", "DISK_INVALID"):
            counts["failed"] += 1
        elif status == "DISK_NP":
            counts["missing"] += 1
        elif status == "DISK_NEW":
            counts["new"] += 1
        else:
            counts["unknown"] += 1
    return counts


async def _handle_system(subaction: str, device_id: str | None, limit: int = 20) -> dict[str, Any]:
    validate_subaction(subaction, _SYSTEM_SUBACTIONS, "system")

    if subaction == "ups_device" and not device_id:
        raise ToolError("device_id is required for system/ups_device")

    # Guard the lookup so an in-set-but-unhandled subaction raises a clean error
    # instead of a raw KeyError (#5). Every real system subaction is a query.
    query = _SYSTEM_QUERIES.get(subaction)
    if query is None:
        raise ToolError(f"Unhandled system subaction '{subaction}' — this is a bug")
    variables: dict[str, Any] | None = {"id": device_id} if subaction == "ups_device" else None

    with tool_error_handler("system", subaction, logger):
        logger.info(f"Executing unraid action=system subaction={subaction}")
        data = await _client.make_graphql_request(query, variables)

        if subaction == "overview":
            raw = data.get("info") or {}
            if not raw:
                raise ToolError("No system info returned from Unraid API")
            summary: dict[str, Any] = {}
            if raw.get("os"):
                os_info = raw["os"]
                summary["os"] = (
                    f"{os_info.get('distro')} {os_info.get('release')} ({os_info.get('platform')}, {os_info.get('arch')})"
                )
                summary["hostname"] = os_info.get("hostname")
                summary["uptime"] = os_info.get("uptime")
            if raw.get("cpu"):
                cpu = raw["cpu"]
                summary["cpu"] = (
                    f"{cpu.get('manufacturer')} {cpu.get('brand')} ({cpu.get('cores')} cores, {cpu.get('threads')} threads)"
                )
            if raw.get("memory") and raw["memory"].get("layout"):
                summary["memory_layout_details"] = [
                    f"Bank {s.get('bank')}: {s.get('type')}, {s.get('clockSpeed')}MHz, {s.get('manufacturer')}, {s.get('partNum')}"
                    for s in raw["memory"]["layout"]
                ]
            # Fold the genuinely-useful scalar fields that only appear in the raw
            # object into the summary rather than echoing the entire raw payload.
            if raw.get("baseboard"):
                bb = raw["baseboard"]
                summary["baseboard"] = (
                    f"{bb.get('manufacturer')} {bb.get('model')} ({bb.get('version')})"
                )
            if raw.get("system"):
                sysinfo = raw["system"]
                summary["system"] = (
                    f"{sysinfo.get('manufacturer')} {sysinfo.get('model')} ({sysinfo.get('version')})"
                )
            if raw.get("versions") and raw["versions"].get("core"):
                summary["versions"] = raw["versions"]["core"]
            if raw.get("machineId"):
                summary["machine_id"] = raw["machineId"]
            if raw.get("time"):
                summary["time"] = raw["time"]
            return {"summary": summary}

        if subaction == "array":
            raw = data.get("array") or {}
            if not raw:
                raise ToolError("No array information returned from Unraid API")
            summary = {"state": raw.get("state")}
            if raw.get("capacity") and raw["capacity"].get("kilobytes"):
                kb = raw["capacity"]["kilobytes"]
                summary["capacity_total"] = format_kb(kb.get("total"))
                summary["capacity_used"] = format_kb(kb.get("used"))
                summary["capacity_free"] = format_kb(kb.get("free"))
            summary["num_parity_disks"] = len(raw.get("parities", []))
            summary["num_data_disks"] = len(raw.get("disks", []))
            summary["num_cache_pools"] = len(raw.get("caches", []))
            health: dict[str, Any] = {}
            for key, label in [
                ("parities", "parity_health"),
                ("disks", "data_health"),
                ("caches", "cache_health"),
            ]:
                if raw.get(key):
                    health[label] = _analyze_disk_health(raw[key])
            total_failed = sum(h.get("failed", 0) for h in health.values())
            total_critical = sum(h.get("critical", 0) for h in health.values())
            total_missing = sum(h.get("missing", 0) for h in health.values())
            total_warning = sum(h.get("warning", 0) for h in health.values())
            summary["overall_health"] = (
                "CRITICAL"
                if total_failed or total_critical
                else "DEGRADED"
                if total_missing
                else "WARNING"
                if total_warning
                else "HEALTHY"
            )
            summary["health_summary"] = health
            return {"summary": summary}

        if subaction == "display":
            return dict(safe_get(data, "info", "display", default={}))
        if subaction in _SYSTEM_DIRECT_ROOTS:
            root_name = _SYSTEM_DIRECT_ROOTS[subaction]
            return {root_name: _required_direct_root(data, subaction)}
        if subaction == "online":
            return {"online": data.get("online")}
        if subaction == "settings":
            settings = data.get("settings") or {}
            if not settings or not settings.get("unified"):
                raise ToolError("No settings data returned or unexpected structure")
            values = settings["unified"].get("values") or {}
            return dict(values) if isinstance(values, dict) else {"raw": values}
        if subaction == "network_metrics":
            network = safe_get(data, "metrics", "network", default=None)
            if not isinstance(network, list):
                raise ToolError(
                    "Unraid API returned no metrics.network payload for "
                    "system/network_metrics. Check API version, permissions, and server logs."
                )
            capped, meta = cap_list(network, limit)
            return {"network": capped, "page": meta}
        if subaction == "server":
            info = data.get("info") or {}
            summary: dict[str, Any] = {}
            if info.get("os"):
                summary["hostname"] = info["os"].get("hostname")
                summary["uptime"] = info["os"].get("uptime")
            if info.get("versions") and info["versions"].get("core"):
                summary["unraid_version"] = info["versions"]["core"].get("unraid")
            summary["machine_id"] = info.get("machineId")
            summary["time"] = info.get("time")
            array = data.get("array") or {}
            summary["array_state"] = array.get("state")
            summary["online"] = data.get("online")
            return summary
        if subaction == "network":
            servers_data = data.get("servers") or []
            vars_data = data.get("vars") or {}
            access_urls = []
            for srv in servers_data:
                if srv.get("lanip"):
                    access_urls.append(
                        {"type": "LAN", "ipv4": srv["lanip"], "url": srv.get("localurl")}
                    )
                if srv.get("wanip"):
                    access_urls.append(
                        {"type": "WAN", "ipv4": srv["wanip"], "url": srv.get("remoteurl")}
                    )
            return {
                "accessUrls": access_urls,
                "httpPort": vars_data.get("port"),
                "httpsPort": vars_data.get("portssl"),
                "localTld": vars_data.get("localTld"),
                "useSsl": vars_data.get("useSsl"),
            }
        if subaction == "ups_device":
            result = data.get("upsDeviceById")
            if result is None:
                raise ToolError(f"UPS device '{device_id}' not found")
            return dict(result)

        if subaction in _SYSTEM_SIMPLE_KEYS:
            result = data.get(_SYSTEM_SIMPLE_KEYS[subaction])
            if result is None:
                if subaction == "registration":
                    raise ToolError(
                        "No registration data returned — server may be unlicensed or API unavailable"
                    )
                logger.warning("system/%s returned null from API", subaction)
                return {}
            return dict(result)

        if subaction in _SYSTEM_LIST_ACTIONS:
            response_key, output_key = _SYSTEM_LIST_ACTIONS[subaction]
            raw_items = data.get(response_key) or []
            items = list(raw_items) if isinstance(raw_items, list) else []
            # timezones returns 400+ unbounded IANA entries, and network_interfaces
            # can grow on VLAN-heavy hosts. Cap both and surface truncation meta so
            # callers can widen the window when needed.
            capped, meta = cap_list(items, limit)
            return {output_key: capped, "page": meta}

        raise ToolError(f"Unhandled system subaction '{subaction}' — this is a bug")
