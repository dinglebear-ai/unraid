"""Tests for system subactions of the consolidated unraid tool."""

from collections.abc import Generator
from unittest.mock import AsyncMock, patch

import pytest
from conftest import make_tool_fn

from unraid_mcp.core.exceptions import ToolError
from unraid_mcp.tools.unraid import _analyze_disk_health


# --- Unit tests for helper functions ---


class TestAnalyzeDiskHealth:
    def test_counts_healthy_disks(self) -> None:
        disks = [{"status": "DISK_OK"}, {"status": "DISK_OK"}]
        result = _analyze_disk_health(disks)
        assert result["healthy"] == 2

    def test_counts_failed_disks(self) -> None:
        disks = [{"status": "DISK_DSBL"}, {"status": "DISK_INVALID"}]
        result = _analyze_disk_health(disks)
        assert result["failed"] == 2

    def test_counts_warning_disks(self) -> None:
        disks = [{"status": "DISK_OK", "warning": 45}]
        result = _analyze_disk_health(disks)
        assert result["warning"] == 1
        assert result["critical"] == 0

    def test_counts_critical_disks(self) -> None:
        disks = [{"status": "DISK_OK", "critical": 55}]
        result = _analyze_disk_health(disks)
        assert result["critical"] == 1
        assert result["warning"] == 0
        assert result["healthy"] == 0

    def test_critical_takes_precedence_over_warning(self) -> None:
        disks = [{"status": "DISK_OK", "warning": 45, "critical": 55}]
        result = _analyze_disk_health(disks)
        assert result["critical"] == 1
        assert result["warning"] == 0

    def test_counts_missing_disks(self) -> None:
        disks = [{"status": "DISK_NP"}]
        result = _analyze_disk_health(disks)
        assert result["missing"] == 1

    def test_empty_list(self) -> None:
        result = _analyze_disk_health([])
        assert result["healthy"] == 0


# --- Integration tests for the tool function ---


@pytest.fixture
def _mock_graphql() -> Generator[AsyncMock, None, None]:
    with patch("unraid_mcp.core.client.make_graphql_request", new_callable=AsyncMock) as mock:
        yield mock


def _make_tool():
    return make_tool_fn("unraid_mcp.tools.unraid", "register_unraid_tool", "unraid")


class TestUnraidInfoTool:
    async def test_overview_action(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {
            "info": {
                "os": {
                    "distro": "Unraid",
                    "release": "7.2",
                    "platform": "linux",
                    "arch": "x86_64",
                    "hostname": "test",
                },
                "cpu": {"manufacturer": "Intel", "brand": "i7", "cores": 4, "threads": 8},
            }
        }
        tool_fn = _make_tool()
        result = await tool_fn(action="system", subaction="overview")
        assert "summary" in result
        _mock_graphql.assert_called_once()

    async def test_overview_omits_raw_details(self, _mock_graphql: AsyncMock) -> None:
        """overview no longer echoes the full raw info object as `details`."""
        _mock_graphql.return_value = {
            "info": {
                "os": {"distro": "Unraid", "release": "7.2", "hostname": "t"},
                "cpu": {"manufacturer": "Intel", "brand": "i7", "cores": 4, "threads": 8},
                "baseboard": {"manufacturer": "ASUS", "model": "X", "version": "1"},
                "versions": {"core": {"unraid": "7.2.0"}},
                "machineId": "mid-1",
                "time": "2026-01-01T00:00:00Z",
            }
        }
        tool_fn = _make_tool()
        result = await tool_fn(action="system", subaction="overview")
        assert "details" not in result
        assert result["summary"]["machine_id"] == "mid-1"
        assert result["summary"]["versions"] == {"unraid": "7.2.0"}

    async def test_array_omits_raw_details(self, _mock_graphql: AsyncMock) -> None:
        """array returns the computed summary without the raw disk object echo."""
        _mock_graphql.return_value = {
            "array": {
                "state": "STARTED",
                "capacity": {"kilobytes": {"free": 1000, "used": 500, "total": 1500}},
                "parities": [{"id": "p1", "status": "DISK_OK"}],
                "disks": [{"id": "d1", "status": "DISK_OK"}],
                "caches": [],
            }
        }
        tool_fn = _make_tool()
        result = await tool_fn(action="system", subaction="array")
        assert "details" not in result
        assert result["summary"]["state"] == "STARTED"
        assert result["summary"]["overall_health"] == "HEALTHY"

    async def test_timezones_capped_with_meta(self, _mock_graphql: AsyncMock) -> None:
        """timezones is capped to the limit and surfaces truncation meta."""
        opts = [{"value": f"Zone/{i}", "label": f"Zone {i}"} for i in range(100)]
        _mock_graphql.return_value = {"timeZoneOptions": opts}
        tool_fn = _make_tool()
        result = await tool_fn(action="system", subaction="timezones", limit=5)
        assert len(result["timezones"]) == 5
        assert result["page"]["returned"] == 5
        assert result["page"]["total"] == 100
        assert result["page"]["truncated"] is True

    async def test_timezones_limit_zero_returns_all(self, _mock_graphql: AsyncMock) -> None:
        """limit=0 disables capping (give-me-all escape hatch)."""
        opts = [{"value": f"Zone/{i}", "label": f"Zone {i}"} for i in range(30)]
        _mock_graphql.return_value = {"timeZoneOptions": opts}
        tool_fn = _make_tool()
        result = await tool_fn(action="system", subaction="timezones", limit=0)
        assert len(result["timezones"]) == 30
        assert result["page"]["truncated"] is False

    async def test_ups_device_requires_device_id(self, _mock_graphql: AsyncMock) -> None:
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="device_id is required"):
            await tool_fn(action="system", subaction="ups_device")

    async def test_network_action(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {
            "servers": [
                {
                    "id": "s:1",
                    "name": "tootie",
                    "status": "ONLINE",
                    "lanip": "10.1.0.2",
                    "wanip": "",
                    "localurl": "http://10.1.0.2:6969",
                    "remoteurl": "",
                }
            ],
            "vars": {
                "id": "v:1",
                "port": 6969,
                "portssl": 31337,
                "localTld": "local",
                "useSsl": None,
            },
        }
        tool_fn = _make_tool()
        result = await tool_fn(action="system", subaction="network")
        assert "accessUrls" in result
        assert result["httpPort"] == 6969
        assert result["httpsPort"] == 31337
        assert any(u["type"] == "LAN" and u["ipv4"] == "10.1.0.2" for u in result["accessUrls"])

    async def test_network_interfaces_includes_address_details(
        self, _mock_graphql: AsyncMock
    ) -> None:
        _mock_graphql.return_value = {
            "networkInterfaces": [
                {
                    "id": "net:eth0",
                    "name": "eth0",
                    "speed": 2500,
                    "duplex": "full",
                    "mtu": 1500,
                    "operstate": "up",
                    "type": "ether",
                    "virtual": False,
                    "vlanId": None,
                    "internal": False,
                    "ipv4Addresses": [{"address": "10.1.0.2", "netmask": "255.255.255.0"}],
                    "ipv6Addresses": [{"address": "fd7a:115c:a1e0::1", "prefixLength": 64}],
                }
            ]
        }
        tool_fn = _make_tool()
        result = await tool_fn(action="system", subaction="network_interfaces")

        query = _mock_graphql.call_args.args[0]
        assert "ipv4Addresses" in query
        assert "ipv6Addresses" in query
        assert result["network_interfaces"][0]["ipv4Addresses"] == [
            {"address": "10.1.0.2", "netmask": "255.255.255.0"}
        ]
        assert result["network_interfaces"][0]["ipv6Addresses"] == [
            {"address": "fd7a:115c:a1e0::1", "prefixLength": 64}
        ]
        assert result["page"]["truncated"] is False

    async def test_network_interfaces_are_capped(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {
            "networkInterfaces": [{"id": f"net:{idx}", "name": f"eth{idx}"} for idx in range(3)]
        }
        tool_fn = _make_tool()
        result = await tool_fn(action="system", subaction="network_interfaces", limit=2)

        assert [interface["name"] for interface in result["network_interfaces"]] == [
            "eth0",
            "eth1",
        ]
        assert result["page"]["returned"] == 2
        assert result["page"]["total"] == 3
        assert result["page"]["truncated"] is True

    async def test_network_metrics_returns_current_network_metrics(
        self, _mock_graphql: AsyncMock
    ) -> None:
        _mock_graphql.return_value = {
            "metrics": {
                "network": [
                    {
                        "id": "metrics:eth0",
                        "name": "eth0",
                        "operstate": "up",
                        "bytesReceived": 1024,
                        "bytesSent": 2048,
                        "rxSec": 100.0,
                        "txSec": 200.0,
                    },
                ],
            }
        }
        tool_fn = _make_tool()
        result = await tool_fn(action="system", subaction="network_metrics")

        query = _mock_graphql.call_args.args[0]
        assert "network" in query
        assert "bytesReceived" in query
        assert "rxSec" in query
        assert result["network"] == [
            {
                "id": "metrics:eth0",
                "name": "eth0",
                "operstate": "up",
                "bytesReceived": 1024,
                "bytesSent": 2048,
                "rxSec": 100.0,
                "txSec": 200.0,
            }
        ]

    async def test_network_metrics_are_capped(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {
            "metrics": {
                "network": [{"id": f"metrics:eth{idx}", "name": f"eth{idx}"} for idx in range(3)]
            }
        }
        tool_fn = _make_tool()
        result = await tool_fn(action="system", subaction="network_metrics", limit=2)

        assert [interface["name"] for interface in result["network"]] == ["eth0", "eth1"]
        assert result["page"]["returned"] == 2
        assert result["page"]["total"] == 3
        assert result["page"]["truncated"] is True

    async def test_network_metrics_accepts_empty_interface_list(
        self, _mock_graphql: AsyncMock
    ) -> None:
        _mock_graphql.return_value = {"metrics": {"network": []}}
        tool_fn = _make_tool()
        result = await tool_fn(action="system", subaction="network_metrics")

        assert result == {
            "network": [],
            "page": {"returned": 0, "total": 0, "truncated": False},
        }

    @pytest.mark.parametrize("payload", [{}, {"metrics": None}, {"metrics": {"network": {}}}])
    async def test_network_metrics_requires_network_payload(
        self, _mock_graphql: AsyncMock, payload: dict
    ) -> None:
        _mock_graphql.return_value = payload
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="metrics\\.network payload"):
            await tool_fn(action="system", subaction="network_metrics")

    async def test_connect_action_raises_tool_error(self, _mock_graphql: AsyncMock) -> None:
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="Invalid subaction 'connect'"):
            await tool_fn(action="system", subaction="connect")

    async def test_generic_exception_wraps(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.side_effect = RuntimeError("unexpected")
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="Internal error executing system/online"):
            await tool_fn(action="system", subaction="online")

    async def test_metrics(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {
            "metrics": {"cpu": {"used": 25.5}, "memory": {"used": 8192, "total": 32768}}
        }
        tool_fn = _make_tool()
        result = await tool_fn(action="system", subaction="metrics")
        assert result["cpu"]["used"] == 25.5

    async def test_services(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {"services": [{"name": "docker", "state": "running"}]}
        tool_fn = _make_tool()
        result = await tool_fn(action="system", subaction="services")
        assert "services" in result
        assert len(result["services"]) == 1
        assert result["services"][0]["name"] == "docker"

    async def test_settings(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {
            "settings": {"unified": {"values": {"timezone": "US/Eastern"}}}
        }
        tool_fn = _make_tool()
        result = await tool_fn(action="system", subaction="settings")
        assert result["timezone"] == "US/Eastern"

    async def test_settings_non_dict_values(self, _mock_graphql: AsyncMock) -> None:
        """Settings values that are not a dict should be wrapped in {'raw': ...}."""
        _mock_graphql.return_value = {"settings": {"unified": {"values": "raw_string"}}}
        tool_fn = _make_tool()
        result = await tool_fn(action="system", subaction="settings")
        assert result == {"raw": "raw_string"}

    async def test_servers(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {
            "servers": [{"id": "s:1", "name": "tower", "status": "online"}]
        }
        tool_fn = _make_tool()
        result = await tool_fn(action="system", subaction="servers")
        assert "servers" in result
        assert len(result["servers"]) == 1
        assert result["servers"][0]["name"] == "tower"

    async def test_flash(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {
            "flash": {
                "id": "f:1",
                "guid": "abc",
                "product": "SanDisk",
                "vendor": "SanDisk",
                "size": 32000000000,
            }
        }
        tool_fn = _make_tool()
        result = await tool_fn(action="system", subaction="flash")
        assert result["product"] == "SanDisk"

    async def test_ups_devices(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {
            "upsDevices": [{"id": "ups:1", "model": "APC", "status": "online", "charge": 100}]
        }
        tool_fn = _make_tool()
        result = await tool_fn(action="system", subaction="ups_devices")
        assert "ups_devices" in result
        assert len(result["ups_devices"]) == 1
        assert result["ups_devices"][0]["model"] == "APC"

    async def test_array_empty_response_raises_tool_error(self, _mock_graphql: AsyncMock) -> None:
        """Empty/null array response should raise ToolError."""
        _mock_graphql.return_value = {"array": None}
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="No array information returned"):
            await tool_fn(action="system", subaction="array")

    async def test_array_missing_key_raises_tool_error(self, _mock_graphql: AsyncMock) -> None:
        """Response with no 'array' key at all should raise ToolError."""
        _mock_graphql.return_value = {}
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="No array information returned"):
            await tool_fn(action="system", subaction="array")


class TestInfoNetworkErrors:
    """Tests for network-level failures in info operations."""

    async def test_overview_http_401_unauthorized(self, _mock_graphql: AsyncMock) -> None:
        """HTTP 401 Unauthorized should propagate as ToolError."""
        _mock_graphql.side_effect = ToolError("HTTP error 401: Unauthorized")
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="401"):
            await tool_fn(action="system", subaction="overview")

    async def test_overview_connection_refused(self, _mock_graphql: AsyncMock) -> None:
        """Connection refused should propagate as ToolError."""
        _mock_graphql.side_effect = ToolError(
            "Network connection error: [Errno 111] Connection refused"
        )
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="Connection refused"):
            await tool_fn(action="system", subaction="overview")

    async def test_network_json_decode_error(self, _mock_graphql: AsyncMock) -> None:
        """Invalid JSON from API should propagate as ToolError."""
        _mock_graphql.side_effect = ToolError(
            "Invalid JSON response from Unraid API: Expecting value"
        )
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="Invalid JSON"):
            await tool_fn(action="system", subaction="network")


# ---------------------------------------------------------------------------
# Null-response handling for simple_dict subactions
# ---------------------------------------------------------------------------


class TestSimpleDictNullHandling:
    """Null API responses must raise ToolError (registration, ups_device) or
    silently return {} with a warning (all others)."""

    async def test_ups_device_null_raises_tool_error(self, _mock_graphql: AsyncMock) -> None:
        """ups_device returning null should raise ToolError with device_id in message."""
        _mock_graphql.return_value = {"upsDeviceById": None}
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="UPS device 'ups-99' not found"):
            await tool_fn(action="system", subaction="ups_device", device_id="ups-99")

    async def test_ups_device_found_returns_dict(self, _mock_graphql: AsyncMock) -> None:
        """ups_device with a real response returns its fields."""
        _mock_graphql.return_value = {
            "upsDeviceById": {"id": "ups:1", "name": "APC Smart", "status": "online"}
        }
        tool_fn = _make_tool()
        result = await tool_fn(action="system", subaction="ups_device", device_id="ups:1")
        assert result["name"] == "APC Smart"

    async def test_registration_null_raises_tool_error(self, _mock_graphql: AsyncMock) -> None:
        """Null registration response should raise ToolError with informative message."""
        _mock_graphql.return_value = {"registration": None}
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="No registration data returned"):
            await tool_fn(action="system", subaction="registration")

    @pytest.mark.parametrize(
        "subaction,response_key",
        [
            ("variables", "vars"),
            ("metrics", "metrics"),
            ("config", "config"),
            ("owner", "owner"),
            ("ups_config", "upsConfiguration"),
        ],
    )
    async def test_null_simple_dict_returns_empty_dict(
        self,
        _mock_graphql: AsyncMock,
        subaction: str,
        response_key: str,
    ) -> None:
        """Non-critical simple_dict subactions return {} on null without raising."""
        _mock_graphql.return_value = {response_key: None}
        tool_fn = _make_tool()
        result = await tool_fn(action="system", subaction=subaction)
        assert result == {}


# ---------------------------------------------------------------------------
# Regression: removed actions must not be valid subactions
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
@pytest.mark.parametrize("subaction", ["update_server", "update_ssh"])
async def test_removed_info_subactions_are_invalid(subaction: str) -> None:
    tool_fn = _make_tool()
    with pytest.raises(ToolError, match="Invalid subaction"):
        await tool_fn(action="system", subaction=subaction)
