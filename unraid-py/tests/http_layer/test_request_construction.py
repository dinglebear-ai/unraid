"""HTTP layer tests that mock at the httpx level using respx.

These tests verify that tools construct correct GraphQL requests,
pass proper variables, use correct timeouts, and handle HTTP-level
errors appropriately. Unlike the tool-level tests (which mock
make_graphql_request), these tests intercept the actual HTTP call
to verify the full request pipeline.
"""

import json
from collections.abc import Callable
from typing import Any
from unittest.mock import patch

import httpx
import pytest
import respx

from tests.conftest import make_tool_fn
from unraid_mcp.core.client import DEFAULT_TIMEOUT, DISK_TIMEOUT, make_graphql_request
from unraid_mcp.core.exceptions import CredentialsNotConfiguredError, ToolError


# ---------------------------------------------------------------------------
# Shared fixtures
# ---------------------------------------------------------------------------

API_URL = "https://unraid.local/graphql"
API_KEY = "test-api-key-12345"


@pytest.fixture(autouse=True)
def _patch_config():
    """Patch API URL and key for all tests in this module."""
    with (
        patch("unraid_mcp.config.settings.UNRAID_API_URL", API_URL),
        patch("unraid_mcp.config.settings.UNRAID_API_KEY", API_KEY),
    ):
        yield


@pytest.fixture(autouse=True)
def _reset_http_client():
    """Reset the global HTTP client between tests so respx can intercept."""
    from unraid_mcp.core import client as client_mod

    original = client_mod._http_client
    client_mod._http_client = None
    yield
    client_mod._http_client = original


def _graphql_response(data: dict[str, Any] | None = None, errors: list[dict] | None = None):
    """Build a standard GraphQL JSON response."""
    body: dict[str, Any] = {}
    if data is not None:
        body["data"] = data
    if errors is not None:
        body["errors"] = errors
    return httpx.Response(200, json=body)


def _extract_request_body(request: httpx.Request) -> dict[str, Any]:
    """Extract and parse the JSON body from a captured request."""
    return json.loads(request.content.decode())


# ===========================================================================
# Section 1: Core client request construction
# ===========================================================================


class TestCoreRequestConstruction:
    """Verify make_graphql_request builds correct HTTP requests."""

    @respx.mock
    async def test_sends_post_to_api_url(self) -> None:
        route = respx.post(API_URL).mock(return_value=_graphql_response({"online": True}))
        await make_graphql_request("query { online }")
        assert route.called

    @respx.mock
    async def test_request_contains_query_in_body(self) -> None:
        route = respx.post(API_URL).mock(return_value=_graphql_response({"online": True}))
        await make_graphql_request("query { online }")
        body = _extract_request_body(route.calls.last.request)
        assert body["query"] == "query { online }"

    @respx.mock
    async def test_request_contains_variables_when_provided(self) -> None:
        route = respx.post(API_URL).mock(return_value=_graphql_response({"disk": {}}))
        await make_graphql_request("query ($id: String!) { disk(id: $id) }", variables={"id": "d1"})
        body = _extract_request_body(route.calls.last.request)
        assert body["variables"] == {"id": "d1"}

    @respx.mock
    async def test_request_omits_variables_when_none(self) -> None:
        route = respx.post(API_URL).mock(return_value=_graphql_response({"online": True}))
        await make_graphql_request("query { online }")
        body = _extract_request_body(route.calls.last.request)
        assert "variables" not in body

    @respx.mock
    async def test_request_includes_api_key_header(self) -> None:
        route = respx.post(API_URL).mock(return_value=_graphql_response({"online": True}))
        await make_graphql_request("query { online }")
        req = route.calls.last.request
        assert req.headers["X-API-Key"] == API_KEY

    @respx.mock
    async def test_request_includes_content_type_header(self) -> None:
        route = respx.post(API_URL).mock(return_value=_graphql_response({"online": True}))
        await make_graphql_request("query { online }")
        req = route.calls.last.request
        assert req.headers["Content-Type"] == "application/json"

    @respx.mock
    async def test_request_includes_user_agent_header(self) -> None:
        route = respx.post(API_URL).mock(return_value=_graphql_response({"online": True}))
        await make_graphql_request("query { online }")
        req = route.calls.last.request
        assert "UnraidMCPServer/" in req.headers["User-Agent"]


# ===========================================================================
# Section 2: Timeout handling
# ===========================================================================


class TestTimeoutHandling:
    """Verify timeout configuration is passed correctly."""

    @respx.mock
    async def test_default_timeout_values(self) -> None:
        assert DEFAULT_TIMEOUT.read == 30.0
        assert DEFAULT_TIMEOUT.connect == 5.0

    @respx.mock
    async def test_disk_timeout_values(self) -> None:
        assert DISK_TIMEOUT.read == 90.0
        assert DISK_TIMEOUT.connect == 5.0

    @respx.mock
    async def test_custom_timeout_is_used(self) -> None:
        """When custom_timeout is passed, the request uses it."""
        route = respx.post(API_URL).mock(return_value=_graphql_response({"data": {}}))
        custom = httpx.Timeout(10.0, read=120.0)
        await make_graphql_request("query { info }", custom_timeout=custom)
        assert route.called


# ===========================================================================
# Section 3: HTTP error handling
# ===========================================================================


class TestHttpErrorHandling:
    """Verify HTTP-level errors are properly converted to ToolError."""

    @respx.mock
    async def test_http_401_raises_tool_error(self) -> None:
        respx.post(API_URL).mock(return_value=httpx.Response(401, text="Unauthorized"))
        with pytest.raises(ToolError, match="Unraid API returned HTTP 401"):
            await make_graphql_request("query { online }")

    @respx.mock
    async def test_http_403_raises_tool_error(self) -> None:
        respx.post(API_URL).mock(return_value=httpx.Response(403, text="Forbidden"))
        with pytest.raises(ToolError, match="Unraid API returned HTTP 403"):
            await make_graphql_request("query { online }")

    @respx.mock
    async def test_http_500_raises_tool_error(self) -> None:
        respx.post(API_URL).mock(return_value=httpx.Response(500, text="Internal Server Error"))
        with pytest.raises(ToolError, match="Unraid API returned HTTP 500"):
            await make_graphql_request("query { online }")

    @respx.mock
    async def test_http_503_raises_tool_error(self) -> None:
        respx.post(API_URL).mock(return_value=httpx.Response(503, text="Service Unavailable"))
        with pytest.raises(ToolError, match="Unraid API returned HTTP 503"):
            await make_graphql_request("query { online }")

    @respx.mock
    async def test_network_connection_error(self) -> None:
        respx.post(API_URL).mock(side_effect=httpx.ConnectError("Connection refused"))
        with pytest.raises(ToolError, match="Network error connecting to Unraid API"):
            await make_graphql_request("query { online }")

    @respx.mock
    async def test_network_timeout_error(self) -> None:
        respx.post(API_URL).mock(side_effect=httpx.ReadTimeout("Read timed out"))
        with pytest.raises(ToolError, match="Network error connecting to Unraid API"):
            await make_graphql_request("query { online }")

    @respx.mock
    async def test_invalid_json_response(self) -> None:
        respx.post(API_URL).mock(return_value=httpx.Response(200, text="not json"))
        with pytest.raises(ToolError, match=r"invalid response.*not valid JSON"):
            await make_graphql_request("query { online }")


# ===========================================================================
# Section 4: GraphQL error handling at HTTP layer
# ===========================================================================


class TestGraphQLErrorHandling:
    """Verify GraphQL-level errors in the HTTP response body."""

    @respx.mock
    async def test_graphql_error_raises_tool_error(self) -> None:
        respx.post(API_URL).mock(
            return_value=_graphql_response(errors=[{"message": "Field 'bogus' not found"}])
        )
        with pytest.raises(ToolError, match="Field 'bogus' not found"):
            await make_graphql_request("{ bogus }")

    @respx.mock
    async def test_multiple_graphql_errors_joined(self) -> None:
        respx.post(API_URL).mock(
            return_value=_graphql_response(
                errors=[{"message": "Error one"}, {"message": "Error two"}]
            )
        )
        with pytest.raises(ToolError, match="Error one; Error two"):
            await make_graphql_request("{ info }")

    @respx.mock
    async def test_idempotent_start_error_returns_success(self) -> None:
        respx.post(API_URL).mock(
            return_value=_graphql_response(errors=[{"message": "Container already running"}])
        )
        result = await make_graphql_request(
            'mutation { docker { start(id: "x") } }',
            operation_context={"operation": "start"},
        )
        assert result["idempotent_success"] is True
        assert result["operation"] == "start"

    @respx.mock
    async def test_idempotent_stop_error_returns_success(self) -> None:
        respx.post(API_URL).mock(
            return_value=_graphql_response(errors=[{"message": "Container not running"}])
        )
        result = await make_graphql_request(
            'mutation { docker { stop(id: "x") } }',
            operation_context={"operation": "stop"},
        )
        assert result["idempotent_success"] is True

    @respx.mock
    async def test_empty_data_returns_empty_dict(self) -> None:
        respx.post(API_URL).mock(return_value=_graphql_response(data=None))
        result = await make_graphql_request("query { info }")
        assert result == {}


# ===========================================================================
# Section 5: Info tool request construction
# ===========================================================================


class TestInfoToolRequests:
    """Verify unraid system tool constructs correct GraphQL queries."""

    @staticmethod
    def _get_tool() -> Callable[..., Any]:
        return make_tool_fn("unraid_mcp.tools.unraid", "register_unraid_tool", "unraid")

    @respx.mock
    async def test_overview_sends_correct_query(self) -> None:
        route = respx.post(API_URL).mock(
            return_value=_graphql_response(
                {
                    "info": {
                        "os": {"platform": "linux", "hostname": "tower"},
                        "cpu": {},
                        "memory": {},
                    }
                }
            )
        )
        tool = self._get_tool()
        await tool(action="system", subaction="overview")
        body = _extract_request_body(route.calls.last.request)
        assert "GetSystemInfo" in body["query"]
        assert "info" in body["query"]

    @respx.mock
    async def test_array_sends_correct_query(self) -> None:
        route = respx.post(API_URL).mock(
            return_value=_graphql_response({"array": {"state": "STARTED", "capacity": {}}})
        )
        tool = self._get_tool()
        await tool(action="system", subaction="array")
        body = _extract_request_body(route.calls.last.request)
        assert "GetArrayStatus" in body["query"]

    @respx.mock
    async def test_network_sends_correct_query(self) -> None:
        route = respx.post(API_URL).mock(
            return_value=_graphql_response({"network": {"id": "n1", "accessUrls": []}})
        )
        tool = self._get_tool()
        await tool(action="system", subaction="network")
        body = _extract_request_body(route.calls.last.request)
        assert "GetNetworkInfo" in body["query"]

    @respx.mock
    async def test_metrics_sends_correct_query(self) -> None:
        route = respx.post(API_URL).mock(
            return_value=_graphql_response(
                {"metrics": {"cpu": {"used": 50}, "memory": {"used": 4096, "total": 16384}}}
            )
        )
        tool = self._get_tool()
        await tool(action="system", subaction="metrics")
        body = _extract_request_body(route.calls.last.request)
        assert "GetMetrics" in body["query"]

    @respx.mock
    async def test_network_metrics_sends_correct_query(self) -> None:
        route = respx.post(API_URL).mock(
            return_value=_graphql_response(
                {
                    "metrics": {
                        "network": [
                            {
                                "id": "metrics:eth0",
                                "name": "eth0",
                                "bytesReceived": 1,
                                "bytesSent": 2,
                            }
                        ]
                    }
                }
            )
        )
        tool = self._get_tool()
        await tool(action="system", subaction="network_metrics")
        body = _extract_request_body(route.calls.last.request)
        assert body.get("variables") is None
        assert "GetNetworkMetrics" in body["query"]
        assert "metrics" in body["query"]
        assert "network" in body["query"]
        assert "bytesReceived" in body["query"]
        assert "rxSec" in body["query"]

    @respx.mock
    async def test_network_interfaces_sends_correct_query(self) -> None:
        route = respx.post(API_URL).mock(
            return_value=_graphql_response(
                {
                    "networkInterfaces": [
                        {
                            "id": "net:eth0",
                            "name": "eth0",
                            "ipv4Addresses": [{"address": "10.1.0.2", "netmask": "255.255.255.0"}],
                            "ipv6Addresses": [],
                        }
                    ]
                }
            )
        )
        tool = self._get_tool()
        await tool(action="system", subaction="network_interfaces")
        body = _extract_request_body(route.calls.last.request)
        assert body.get("variables") is None
        assert "GetNetworkInterfaces" in body["query"]
        assert "networkInterfaces" in body["query"]
        assert "ipv4Addresses" in body["query"]
        assert "ipv6Addresses" in body["query"]
        assert "rxBytesPerSec" not in body["query"]

    @respx.mock
    async def test_ups_device_sends_variables(self) -> None:
        route = respx.post(API_URL).mock(
            return_value=_graphql_response({"upsDeviceById": {"id": "ups1", "model": "APC"}})
        )
        tool = self._get_tool()
        await tool(action="system", subaction="ups_device", device_id="ups1")
        body = _extract_request_body(route.calls.last.request)
        assert body["variables"] == {"id": "ups1"}
        assert "GetUpsDevice" in body["query"]

    @respx.mock
    async def test_online_sends_correct_query(self) -> None:
        route = respx.post(API_URL).mock(return_value=_graphql_response({"online": True}))
        tool = self._get_tool()
        await tool(action="system", subaction="online")
        body = _extract_request_body(route.calls.last.request)
        assert "GetOnline" in body["query"]

    @respx.mock
    async def test_servers_sends_correct_query(self) -> None:
        route = respx.post(API_URL).mock(
            return_value=_graphql_response({"servers": [{"id": "s1", "name": "tower"}]})
        )
        tool = self._get_tool()
        await tool(action="system", subaction="servers")
        body = _extract_request_body(route.calls.last.request)
        assert "GetServers" in body["query"]

    @respx.mock
    async def test_flash_sends_correct_query(self) -> None:
        route = respx.post(API_URL).mock(
            return_value=_graphql_response({"flash": {"id": "f1", "guid": "abc"}})
        )
        tool = self._get_tool()
        await tool(action="system", subaction="flash")
        body = _extract_request_body(route.calls.last.request)
        assert "GetFlash" in body["query"]


# ===========================================================================
# Section 6: Docker tool request construction
# ===========================================================================


class TestDockerToolRequests:
    """Verify unraid docker tool constructs correct requests."""

    @staticmethod
    def _get_tool() -> Callable[..., Any]:
        return make_tool_fn("unraid_mcp.tools.unraid", "register_unraid_tool", "unraid")

    @respx.mock
    async def test_list_sends_correct_query(self) -> None:
        route = respx.post(API_URL).mock(
            return_value=_graphql_response(
                {"docker": {"containers": [{"id": "c1", "names": ["plex"], "state": "running"}]}}
            )
        )
        tool = self._get_tool()
        await tool(action="docker", subaction="list")
        body = _extract_request_body(route.calls.last.request)
        assert "ListDockerContainers" in body["query"]

    @respx.mock
    async def test_start_sends_mutation_with_id(self) -> None:
        container_id = "a" * 64
        route = respx.post(API_URL).mock(
            return_value=_graphql_response(
                {
                    "docker": {
                        "start": {
                            "id": container_id,
                            "names": ["plex"],
                            "state": "running",
                            "status": "Up",
                        }
                    }
                }
            )
        )
        tool = self._get_tool()
        await tool(action="docker", subaction="start", container_id=container_id)
        body = _extract_request_body(route.calls.last.request)
        assert "StartContainer" in body["query"]
        assert body["variables"] == {"id": container_id}

    @respx.mock
    async def test_stop_sends_mutation_with_id(self) -> None:
        container_id = "b" * 64
        route = respx.post(API_URL).mock(
            return_value=_graphql_response(
                {
                    "docker": {
                        "stop": {
                            "id": container_id,
                            "names": ["sonarr"],
                            "state": "exited",
                            "status": "Exited",
                        }
                    }
                }
            )
        )
        tool = self._get_tool()
        await tool(action="docker", subaction="stop", container_id=container_id)
        body = _extract_request_body(route.calls.last.request)
        assert "StopContainer" in body["query"]
        assert body["variables"] == {"id": container_id}

    @respx.mock
    async def test_networks_sends_correct_query(self) -> None:
        route = respx.post(API_URL).mock(
            return_value=_graphql_response(
                {
                    "dockerNetworks": [
                        {"id": "n1", "name": "bridge", "driver": "bridge", "scope": "local"}
                    ]
                }
            )
        )
        tool = self._get_tool()
        await tool(action="docker", subaction="networks")
        body = _extract_request_body(route.calls.last.request)
        assert "GetDockerNetworks" in body["query"]

    @respx.mock
    async def test_restart_sends_native_mutation(self) -> None:
        """Restart uses the native DockerMutations.restart mutation (single call)."""
        container_id = "e" * 64
        route = respx.post(API_URL).mock(
            return_value=_graphql_response(
                {
                    "docker": {
                        "restart": {
                            "id": container_id,
                            "names": ["app"],
                            "state": "running",
                            "status": "Up",
                        }
                    }
                }
            )
        )
        tool = self._get_tool()
        result = await tool(action="docker", subaction="restart", container_id=container_id)
        assert result["success"] is True
        assert result["subaction"] == "restart"
        body = _extract_request_body(route.calls.last.request)
        assert "RestartContainer" in body["query"]
        assert body["variables"] == {"id": container_id}

    @respx.mock
    async def test_container_name_resolution(self) -> None:
        """When a name is provided instead of a PrefixedID, the tool resolves it."""
        resolved_id = "f" * 64
        call_count = 0

        def side_effect(request: httpx.Request) -> httpx.Response:
            nonlocal call_count
            body = json.loads(request.content.decode())
            call_count += 1
            if "ResolveContainerID" in body["query"]:
                # Resolution query: docker { containers { id names } }
                return _graphql_response(
                    {"docker": {"containers": [{"id": resolved_id, "names": ["plex"]}]}}
                )
            if "StartContainer" in body["query"]:
                return _graphql_response(
                    {
                        "docker": {
                            "start": {
                                "id": resolved_id,
                                "names": ["plex"],
                                "state": "running",
                                "status": "Up",
                            }
                        }
                    }
                )
            return _graphql_response({})

        respx.post(API_URL).mock(side_effect=side_effect)
        tool = self._get_tool()
        result = await tool(action="docker", subaction="start", container_id="plex")
        assert call_count == 2  # resolve + start
        assert result["success"] is True


# ===========================================================================
# Section 7: VM tool request construction
# ===========================================================================


class TestVMToolRequests:
    """Verify unraid vm tool constructs correct requests."""

    @staticmethod
    def _get_tool() -> Callable[..., Any]:
        return make_tool_fn("unraid_mcp.tools.unraid", "register_unraid_tool", "unraid")

    @respx.mock
    async def test_list_sends_correct_query(self) -> None:
        route = respx.post(API_URL).mock(
            return_value=_graphql_response(
                {
                    "vms": {
                        "domains": [{"id": "v1", "name": "win10", "state": "running", "uuid": "u1"}]
                    }
                }
            )
        )
        tool = self._get_tool()
        result = await tool(action="vm", subaction="list")
        body = _extract_request_body(route.calls.last.request)
        assert "ListVMs" in body["query"]
        assert "vms" in result

    @respx.mock
    async def test_start_sends_mutation_with_id(self) -> None:
        route = respx.post(API_URL).mock(return_value=_graphql_response({"vm": {"start": True}}))
        tool = self._get_tool()
        result = await tool(action="vm", subaction="start", vm_id="vm-123")
        body = _extract_request_body(route.calls.last.request)
        assert "StartVM" in body["query"]
        assert body["variables"] == {"id": "vm-123"}
        assert result["success"] is True

    @respx.mock
    async def test_stop_sends_mutation_with_id(self) -> None:
        route = respx.post(API_URL).mock(return_value=_graphql_response({"vm": {"stop": True}}))
        tool = self._get_tool()
        await tool(action="vm", subaction="stop", vm_id="vm-456")
        body = _extract_request_body(route.calls.last.request)
        assert "StopVM" in body["query"]
        assert body["variables"] == {"id": "vm-456"}

    @respx.mock
    async def test_force_stop_requires_confirm(self) -> None:
        tool = self._get_tool()
        with pytest.raises(ToolError, match="not confirmed"):
            await tool(action="vm", subaction="force_stop", vm_id="vm-789")

    @respx.mock
    async def test_force_stop_sends_mutation_when_confirmed(self) -> None:
        route = respx.post(API_URL).mock(
            return_value=_graphql_response({"vm": {"forceStop": True}})
        )
        tool = self._get_tool()
        result = await tool(action="vm", subaction="force_stop", vm_id="vm-789", confirm=True)
        body = _extract_request_body(route.calls.last.request)
        assert "ForceStopVM" in body["query"]
        assert result["success"] is True

    @respx.mock
    async def test_reset_requires_confirm(self) -> None:
        tool = self._get_tool()
        with pytest.raises(ToolError, match="not confirmed"):
            await tool(action="vm", subaction="reset", vm_id="vm-abc")

    @respx.mock
    async def test_details_finds_vm_by_name(self) -> None:
        respx.post(API_URL).mock(
            return_value=_graphql_response(
                {
                    "vms": {
                        "domains": [
                            {"id": "v1", "name": "win10", "state": "running", "uuid": "uuid-1"},
                            {"id": "v2", "name": "ubuntu", "state": "stopped", "uuid": "uuid-2"},
                        ]
                    }
                }
            )
        )
        tool = self._get_tool()
        result = await tool(action="vm", subaction="details", vm_id="ubuntu")
        assert result["name"] == "ubuntu"


# ===========================================================================
# Section 8: Array tool request construction
# ===========================================================================


class TestArrayToolRequests:
    """Verify unraid array tool constructs correct requests."""

    @staticmethod
    def _get_tool() -> Callable[..., Any]:
        return make_tool_fn("unraid_mcp.tools.unraid", "register_unraid_tool", "unraid")

    @respx.mock
    async def test_parity_status_sends_correct_query(self) -> None:
        route = respx.post(API_URL).mock(
            return_value=_graphql_response(
                {
                    "array": {
                        "parityCheckStatus": {
                            "progress": 50,
                            "speed": "100 MB/s",
                            "errors": 0,
                        }
                    }
                }
            )
        )
        tool = self._get_tool()
        result = await tool(action="array", subaction="parity_status")
        body = _extract_request_body(route.calls.last.request)
        assert "GetParityStatus" in body["query"]
        assert result["success"] is True

    @respx.mock
    async def test_parity_start_sends_mutation(self) -> None:
        route = respx.post(API_URL).mock(
            return_value=_graphql_response({"parityCheck": {"start": True}})
        )
        tool = self._get_tool()
        result = await tool(action="array", subaction="parity_start", correct=False)
        body = _extract_request_body(route.calls.last.request)
        assert "StartParityCheck" in body["query"]
        assert body["variables"] == {"correct": False}
        assert result["success"] is True

    @respx.mock
    async def test_parity_start_with_correct_sends_variable(self) -> None:
        route = respx.post(API_URL).mock(
            return_value=_graphql_response({"parityCheck": {"start": True}})
        )
        tool = self._get_tool()
        await tool(action="array", subaction="parity_start", correct=True)
        body = _extract_request_body(route.calls.last.request)
        assert body["variables"] == {"correct": True}

    @respx.mock
    async def test_parity_pause_sends_mutation(self) -> None:
        route = respx.post(API_URL).mock(
            return_value=_graphql_response({"parityCheck": {"pause": True}})
        )
        tool = self._get_tool()
        await tool(action="array", subaction="parity_pause")
        body = _extract_request_body(route.calls.last.request)
        assert "PauseParityCheck" in body["query"]

    @respx.mock
    async def test_parity_cancel_sends_mutation(self) -> None:
        route = respx.post(API_URL).mock(
            return_value=_graphql_response({"parityCheck": {"cancel": True}})
        )
        tool = self._get_tool()
        await tool(action="array", subaction="parity_cancel")
        body = _extract_request_body(route.calls.last.request)
        assert "CancelParityCheck" in body["query"]


# ===========================================================================
# Section 9: Storage tool request construction
# ===========================================================================


class TestStorageToolRequests:
    """Verify unraid disk tool constructs correct requests."""

    @staticmethod
    def _get_tool() -> Callable[..., Any]:
        return make_tool_fn("unraid_mcp.tools.unraid", "register_unraid_tool", "unraid")

    @respx.mock
    async def test_shares_sends_correct_query(self) -> None:
        route = respx.post(API_URL).mock(
            return_value=_graphql_response({"shares": [{"id": "s1", "name": "appdata"}]})
        )
        tool = self._get_tool()
        result = await tool(action="disk", subaction="shares")
        body = _extract_request_body(route.calls.last.request)
        assert "GetSharesInfo" in body["query"]
        assert "shares" in result

    @respx.mock
    async def test_disks_sends_correct_query(self) -> None:
        route = respx.post(API_URL).mock(
            return_value=_graphql_response(
                {"disks": [{"id": "d1", "device": "sda", "name": "Disk 1"}]}
            )
        )
        tool = self._get_tool()
        await tool(action="disk", subaction="disks")
        body = _extract_request_body(route.calls.last.request)
        assert "ListPhysicalDisks" in body["query"]

    @respx.mock
    async def test_disk_details_sends_variable(self) -> None:
        route = respx.post(API_URL).mock(
            return_value=_graphql_response(
                {
                    "disk": {
                        "id": "d1",
                        "device": "sda",
                        "name": "Disk 1",
                        "serialNum": "SN123",
                        "size": 1000000,
                        "temperature": 35,
                    }
                }
            )
        )
        tool = self._get_tool()
        await tool(action="disk", subaction="disk_details", disk_id="d1")
        body = _extract_request_body(route.calls.last.request)
        assert "GetDiskDetails" in body["query"]
        assert body["variables"] == {"id": "d1"}

    @respx.mock
    async def test_log_files_sends_correct_query(self) -> None:
        route = respx.post(API_URL).mock(
            return_value=_graphql_response(
                {"logFiles": [{"name": "syslog", "path": "/var/log/syslog"}]}
            )
        )
        tool = self._get_tool()
        result = await tool(action="disk", subaction="log_files")
        body = _extract_request_body(route.calls.last.request)
        assert "ListLogFiles" in body["query"]
        assert "log_files" in result

    @respx.mock
    async def test_logs_sends_path_and_lines_variables(self) -> None:
        route = respx.post(API_URL).mock(
            return_value=_graphql_response(
                {
                    "logFile": {
                        "path": "/var/log/syslog",
                        "content": "log line",
                        "totalLines": 100,
                        "startLine": 1,
                    }
                }
            )
        )
        tool = self._get_tool()
        await tool(action="disk", subaction="logs", log_path="/var/log/syslog", tail_lines=50)
        body = _extract_request_body(route.calls.last.request)
        assert "GetLogContent" in body["query"]
        assert body["variables"]["path"] == "/var/log/syslog"
        assert body["variables"]["lines"] == 50

    @respx.mock
    async def test_logs_rejects_path_traversal(self) -> None:
        tool = self._get_tool()
        with pytest.raises(ToolError, match="log_path must start with"):
            await tool(action="disk", subaction="logs", log_path="/etc/shadow")


# ===========================================================================
# Section 10: Notifications tool request construction
# ===========================================================================


class TestNotificationsToolRequests:
    """Verify unraid notification tool constructs correct requests."""

    @staticmethod
    def _get_tool() -> Callable[..., Any]:
        return make_tool_fn("unraid_mcp.tools.unraid", "register_unraid_tool", "unraid")

    @respx.mock
    async def test_overview_sends_correct_query(self) -> None:
        route = respx.post(API_URL).mock(
            return_value=_graphql_response(
                {
                    "notifications": {
                        "overview": {
                            "unread": {"info": 1, "warning": 0, "alert": 0, "total": 1},
                        }
                    }
                }
            )
        )
        tool = self._get_tool()
        await tool(action="notification", subaction="overview")
        body = _extract_request_body(route.calls.last.request)
        assert "GetNotificationsOverview" in body["query"]

    @respx.mock
    async def test_list_sends_filter_variables(self) -> None:
        route = respx.post(API_URL).mock(
            return_value=_graphql_response({"notifications": {"list": []}})
        )
        tool = self._get_tool()
        await tool(
            action="notification",
            subaction="list",
            list_type="ARCHIVE",
            importance="WARNING",
            offset=5,
            limit=10,
        )
        body = _extract_request_body(route.calls.last.request)
        assert "ListNotifications" in body["query"]
        filt = body["variables"]["filter"]
        assert filt["type"] == "ARCHIVE"
        assert filt["importance"] == "WARNING"
        assert filt["offset"] == 5
        assert filt["limit"] == 10

    @respx.mock
    async def test_create_sends_input_variables(self) -> None:
        route = respx.post(API_URL).mock(
            return_value=_graphql_response(
                {
                    "createNotification": {
                        "id": "n1",
                        "title": "Test",
                        "importance": "INFO",
                    }
                }
            )
        )
        tool = self._get_tool()
        await tool(
            action="notification",
            subaction="create",
            title="Test",
            subject="Sub",
            description="Desc",
            importance="info",
        )
        body = _extract_request_body(route.calls.last.request)
        assert "CreateNotification" in body["query"]
        inp = body["variables"]["input"]
        assert inp["title"] == "Test"
        assert inp["subject"] == "Sub"
        assert inp["importance"] == "INFO"  # uppercased from "info"

    @respx.mock
    async def test_archive_sends_id_variable(self) -> None:
        route = respx.post(API_URL).mock(
            return_value=_graphql_response({"archiveNotification": {"id": "notif-1"}})
        )
        tool = self._get_tool()
        await tool(action="notification", subaction="archive", notification_id="notif-1")
        body = _extract_request_body(route.calls.last.request)
        assert "ArchiveNotification" in body["query"]
        assert body["variables"] == {"id": "notif-1"}

    @respx.mock
    async def test_delete_requires_confirm(self) -> None:
        tool = self._get_tool()
        with pytest.raises(ToolError, match="not confirmed"):
            await tool(
                action="notification",
                subaction="delete",
                notification_id="n1",
                notification_type="UNREAD",
            )

    @respx.mock
    async def test_delete_sends_id_and_type(self) -> None:
        route = respx.post(API_URL).mock(
            return_value=_graphql_response({"deleteNotification": {"unread": {"total": 0}}})
        )
        tool = self._get_tool()
        await tool(
            action="notification",
            subaction="delete",
            notification_id="n1",
            notification_type="unread",
            confirm=True,
        )
        body = _extract_request_body(route.calls.last.request)
        assert "DeleteNotification" in body["query"]
        assert body["variables"]["id"] == "n1"
        assert body["variables"]["type"] == "UNREAD"  # uppercased

    @respx.mock
    async def test_archive_all_sends_importance_when_provided(self) -> None:
        route = respx.post(API_URL).mock(
            return_value=_graphql_response({"archiveAll": {"archive": {"total": 1}}})
        )
        tool = self._get_tool()
        await tool(action="notification", subaction="archive_all", importance="warning")
        body = _extract_request_body(route.calls.last.request)
        assert "ArchiveAllNotifications" in body["query"]
        assert body["variables"]["importance"] == "WARNING"


# ===========================================================================
# Section 11: RClone tool request construction
# ===========================================================================


class TestRCloneToolRequests:
    """Verify unraid rclone tool constructs correct requests."""

    @staticmethod
    def _get_tool() -> Callable[..., Any]:
        return make_tool_fn("unraid_mcp.tools.unraid", "register_unraid_tool", "unraid")

    @respx.mock
    async def test_list_remotes_sends_correct_query(self) -> None:
        route = respx.post(API_URL).mock(
            return_value=_graphql_response(
                {"rclone": {"remotes": [{"name": "gdrive", "type": "drive"}]}}
            )
        )
        tool = self._get_tool()
        result = await tool(action="rclone", subaction="list_remotes")
        body = _extract_request_body(route.calls.last.request)
        assert "ListRCloneRemotes" in body["query"]
        assert "remotes" in result

    @respx.mock
    async def test_config_form_sends_provider_type(self) -> None:
        route = respx.post(API_URL).mock(
            return_value=_graphql_response(
                {
                    "rclone": {
                        "configForm": {
                            "id": "form1",
                            "dataSchema": {},
                            "uiSchema": {},
                        }
                    }
                }
            )
        )
        tool = self._get_tool()
        await tool(action="rclone", subaction="config_form", provider_type="s3")
        body = _extract_request_body(route.calls.last.request)
        assert "GetRCloneConfigForm" in body["query"]
        assert body["variables"]["formOptions"]["providerType"] == "s3"

    @respx.mock
    async def test_create_remote_sends_input_variables(self) -> None:
        route = respx.post(API_URL).mock(
            return_value=_graphql_response(
                {
                    "rclone": {
                        "createRCloneRemote": {
                            "name": "my-s3",
                            "type": "s3",
                            "parameters": {},
                        }
                    }
                }
            )
        )
        tool = self._get_tool()
        await tool(
            action="rclone",
            subaction="create_remote",
            name="my-s3",
            provider_type="s3",
            config_data={"bucket": "my-bucket"},
        )
        body = _extract_request_body(route.calls.last.request)
        assert "CreateRCloneRemote" in body["query"]
        inp = body["variables"]["input"]
        assert inp["name"] == "my-s3"
        assert inp["type"] == "s3"
        assert inp["parameters"] == {"bucket": "my-bucket"}

    @respx.mock
    async def test_delete_remote_requires_confirm(self) -> None:
        tool = self._get_tool()
        with pytest.raises(ToolError, match="not confirmed"):
            await tool(action="rclone", subaction="delete_remote", name="old-remote")

    @respx.mock
    async def test_delete_remote_sends_name_when_confirmed(self) -> None:
        route = respx.post(API_URL).mock(
            return_value=_graphql_response({"rclone": {"deleteRCloneRemote": True}})
        )
        tool = self._get_tool()
        result = await tool(
            action="rclone", subaction="delete_remote", name="old-remote", confirm=True
        )
        body = _extract_request_body(route.calls.last.request)
        assert "DeleteRCloneRemote" in body["query"]
        assert body["variables"]["input"]["name"] == "old-remote"
        assert result["success"] is True


# ===========================================================================
# Section 12: Users tool request construction
# ===========================================================================


class TestUsersToolRequests:
    """Verify unraid user tool constructs correct requests."""

    @staticmethod
    def _get_tool() -> Callable[..., Any]:
        return make_tool_fn("unraid_mcp.tools.unraid", "register_unraid_tool", "unraid")

    @respx.mock
    async def test_me_sends_correct_query(self) -> None:
        route = respx.post(API_URL).mock(
            return_value=_graphql_response(
                {
                    "me": {
                        "id": "u1",
                        "name": "admin",
                        "description": "Admin",
                        "roles": ["admin"],
                    }
                }
            )
        )
        tool = self._get_tool()
        result = await tool(action="user", subaction="me")
        body = _extract_request_body(route.calls.last.request)
        assert "GetMe" in body["query"]
        assert result["name"] == "admin"


# ===========================================================================
# Section 13: Keys tool request construction
# ===========================================================================


class TestKeysToolRequests:
    """Verify unraid key tool constructs correct requests."""

    @staticmethod
    def _get_tool() -> Callable[..., Any]:
        return make_tool_fn("unraid_mcp.tools.unraid", "register_unraid_tool", "unraid")

    @respx.mock
    async def test_list_sends_correct_query(self) -> None:
        route = respx.post(API_URL).mock(
            return_value=_graphql_response({"apiKeys": [{"id": "k1", "name": "my-key"}]})
        )
        tool = self._get_tool()
        result = await tool(action="key", subaction="list")
        body = _extract_request_body(route.calls.last.request)
        assert "ListApiKeys" in body["query"]
        assert "keys" in result

    @respx.mock
    async def test_get_sends_id_variable(self) -> None:
        route = respx.post(API_URL).mock(
            return_value=_graphql_response(
                {"apiKey": {"id": "k1", "name": "my-key", "roles": ["admin"]}}
            )
        )
        tool = self._get_tool()
        await tool(action="key", subaction="get", key_id="k1")
        body = _extract_request_body(route.calls.last.request)
        assert "GetApiKey" in body["query"]
        assert body["variables"] == {"id": "k1"}

    @respx.mock
    async def test_create_sends_input_variables(self) -> None:
        route = respx.post(API_URL).mock(
            return_value=_graphql_response(
                {
                    "apiKey": {
                        "create": {
                            "id": "k2",
                            "name": "new-key",
                            "key": "secret",
                            "roles": ["read"],
                        }
                    }
                }
            )
        )
        tool = self._get_tool()
        result = await tool(action="key", subaction="create", name="new-key", roles=["read"])
        body = _extract_request_body(route.calls.last.request)
        assert "CreateApiKey" in body["query"]
        inp = body["variables"]["input"]
        assert inp["name"] == "new-key"
        assert inp["roles"] == ["read"]
        assert result["success"] is True

    @respx.mock
    async def test_update_sends_input_variables(self) -> None:
        route = respx.post(API_URL).mock(
            return_value=_graphql_response(
                {"apiKey": {"update": {"id": "k1", "name": "renamed", "roles": ["admin"]}}}
            )
        )
        tool = self._get_tool()
        await tool(action="key", subaction="update", key_id="k1", name="renamed")
        body = _extract_request_body(route.calls.last.request)
        assert "UpdateApiKey" in body["query"]
        inp = body["variables"]["input"]
        assert inp["id"] == "k1"
        assert inp["name"] == "renamed"

    @respx.mock
    async def test_delete_requires_confirm(self) -> None:
        tool = self._get_tool()
        with pytest.raises(ToolError, match="not confirmed"):
            await tool(action="key", subaction="delete", key_id="k1")

    @respx.mock
    async def test_delete_sends_ids_when_confirmed(self) -> None:
        route = respx.post(API_URL).mock(
            return_value=_graphql_response({"apiKey": {"delete": True}})
        )
        tool = self._get_tool()
        result = await tool(action="key", subaction="delete", key_id="k1", confirm=True)
        body = _extract_request_body(route.calls.last.request)
        assert "DeleteApiKey" in body["query"]
        assert body["variables"]["input"]["ids"] == ["k1"]
        assert result["success"] is True


# ===========================================================================
# Section 14: Health tool request construction
# ===========================================================================


class TestHealthToolRequests:
    """Verify unraid health tool constructs correct requests."""

    @staticmethod
    def _get_tool() -> Callable[..., Any]:
        return make_tool_fn("unraid_mcp.tools.unraid", "register_unraid_tool", "unraid")

    @respx.mock
    async def test_test_connection_sends_online_query(self) -> None:
        route = respx.post(API_URL).mock(return_value=_graphql_response({"online": True}))
        tool = self._get_tool()
        result = await tool(action="health", subaction="test_connection")
        body = _extract_request_body(route.calls.last.request)
        assert "online" in body["query"]
        assert result["status"] == "connected"
        assert result["online"] is True

    @respx.mock
    async def test_check_sends_comprehensive_query(self) -> None:
        route = respx.post(API_URL).mock(
            return_value=_graphql_response(
                {
                    "info": {
                        "machineId": "m1",
                        "time": 1234567890,
                        "versions": {"unraid": "7.0"},
                        "os": {"uptime": 86400},
                    },
                    "array": {"state": "STARTED"},
                    "notifications": {
                        "overview": {"unread": {"alert": 0, "warning": 1, "total": 3}},
                    },
                    "docker": {
                        "containers": [{"id": "c1", "state": "running", "status": "Up"}],
                    },
                }
            )
        )
        tool = self._get_tool()
        result = await tool(action="health", subaction="check")
        body = _extract_request_body(route.calls.last.request)
        assert "ComprehensiveHealthCheck" in body["query"]
        assert result["status"] == "healthy"
        assert "api_latency_ms" in result

    @respx.mock
    async def test_test_connection_measures_latency(self) -> None:
        respx.post(API_URL).mock(return_value=_graphql_response({"online": True}))
        tool = self._get_tool()
        result = await tool(action="health", subaction="test_connection")
        assert "latency_ms" in result
        assert isinstance(result["latency_ms"], float)

    @respx.mock
    async def test_check_reports_warning_on_alerts(self) -> None:
        respx.post(API_URL).mock(
            return_value=_graphql_response(
                {
                    "info": {
                        "machineId": "m1",
                        "time": 0,
                        "versions": {"unraid": "7.0"},
                        "os": {"uptime": 0},
                    },
                    "array": {"state": "STARTED"},
                    "notifications": {
                        "overview": {"unread": {"alert": 3, "warning": 0, "total": 5}},
                    },
                    "docker": {"containers": []},
                }
            )
        )
        tool = self._get_tool()
        result = await tool(action="health", subaction="check")
        assert result["status"] == "warning"
        assert any("alert" in issue for issue in result.get("issues", []))


# ===========================================================================
# Section 15: Cross-cutting concerns
# ===========================================================================


class TestCrossCuttingConcerns:
    """Verify behaviors that apply across multiple tools."""

    @respx.mock
    async def test_missing_api_url_raises_before_http_call(self) -> None:
        route = respx.post(API_URL).mock(return_value=_graphql_response({}))
        with (
            patch("unraid_mcp.config.settings.UNRAID_API_URL", ""),
            pytest.raises(CredentialsNotConfiguredError),
        ):
            await make_graphql_request("query { online }")
        assert not route.called

    @respx.mock
    async def test_missing_api_key_raises_before_http_call(self) -> None:
        route = respx.post(API_URL).mock(return_value=_graphql_response({}))
        with (
            patch("unraid_mcp.config.settings.UNRAID_API_KEY", ""),
            pytest.raises(CredentialsNotConfiguredError),
        ):
            await make_graphql_request("query { online }")
        assert not route.called

    @respx.mock
    async def test_tool_error_from_http_layer_propagates(self) -> None:
        """When an HTTP error occurs, the ToolError bubbles up through the tool."""
        respx.post(API_URL).mock(return_value=httpx.Response(500, text="Server Error"))
        tool = make_tool_fn("unraid_mcp.tools.unraid", "register_unraid_tool", "unraid")
        with pytest.raises(ToolError, match="Unraid API returned HTTP 500"):
            await tool(action="system", subaction="online")

    @respx.mock
    async def test_network_error_propagates_through_tool(self) -> None:
        """When a network error occurs, the ToolError bubbles up through the tool."""
        respx.post(API_URL).mock(side_effect=httpx.ConnectError("Connection refused"))
        tool = make_tool_fn("unraid_mcp.tools.unraid", "register_unraid_tool", "unraid")
        with pytest.raises(ToolError, match="Network error connecting to Unraid API"):
            await tool(action="system", subaction="online")

    @respx.mock
    async def test_graphql_error_propagates_through_tool(self) -> None:
        """When a GraphQL error occurs, the ToolError bubbles up through the tool."""
        respx.post(API_URL).mock(
            return_value=_graphql_response(errors=[{"message": "Permission denied"}])
        )
        tool = make_tool_fn("unraid_mcp.tools.unraid", "register_unraid_tool", "unraid")
        with pytest.raises(ToolError, match="Permission denied"):
            await tool(action="system", subaction="online")
