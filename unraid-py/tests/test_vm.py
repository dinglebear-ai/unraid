"""Tests for vm subactions of the consolidated unraid tool."""

from collections.abc import Generator
from unittest.mock import AsyncMock, patch

import pytest
from conftest import make_tool_fn

from unraid_mcp.core.exceptions import ToolError


@pytest.fixture
def _mock_graphql() -> Generator[AsyncMock, None, None]:
    with patch("unraid_mcp.core.client.make_graphql_request", new_callable=AsyncMock) as mock:
        yield mock


def _make_tool():
    return make_tool_fn("unraid_mcp.tools.unraid", "register_unraid_tool", "unraid")


class TestVmValidation:
    async def test_actions_except_list_require_vm_id(self, _mock_graphql: AsyncMock) -> None:
        tool_fn = _make_tool()
        for subaction in ("details", "start", "stop", "pause", "resume", "reboot"):
            with pytest.raises(ToolError, match="vm_id"):
                await tool_fn(action="vm", subaction=subaction)

    async def test_destructive_actions_require_confirm(self, _mock_graphql: AsyncMock) -> None:
        tool_fn = _make_tool()
        for subaction in ("force_stop", "reset"):
            with pytest.raises(ToolError, match="not confirmed"):
                await tool_fn(action="vm", subaction=subaction, vm_id="uuid-1")

    async def test_destructive_vm_id_check_before_confirm(self, _mock_graphql: AsyncMock) -> None:
        """Destructive subactions without vm_id should fail on vm_id first (validated before confirm)."""
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="vm_id"):
            await tool_fn(action="vm", subaction="force_stop")


class TestVmActions:
    async def test_list(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {
            "vms": {
                "domains": [
                    {"id": "vm:1", "name": "Windows 11", "state": "RUNNING", "uuid": "uuid-1"},
                ]
            }
        }
        tool_fn = _make_tool()
        result = await tool_fn(action="vm", subaction="list")
        assert len(result["vms"]) == 1
        assert result["vms"][0]["name"] == "Windows 11"

    async def test_list_empty(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {"vms": {"domains": []}}
        tool_fn = _make_tool()
        result = await tool_fn(action="vm", subaction="list")
        assert result["vms"] == []

    async def test_list_no_vms_key(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {}
        tool_fn = _make_tool()
        result = await tool_fn(action="vm", subaction="list")
        assert result["vms"] == []

    async def test_details_by_uuid(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {
            "vms": {
                "domains": [{"id": "vm:1", "name": "Win11", "state": "RUNNING", "uuid": "uuid-1"}]
            }
        }
        tool_fn = _make_tool()
        result = await tool_fn(action="vm", subaction="details", vm_id="uuid-1")
        assert result["name"] == "Win11"

    async def test_details_by_name(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {
            "vms": {
                "domains": [{"id": "vm:1", "name": "Win11", "state": "RUNNING", "uuid": "uuid-1"}]
            }
        }
        tool_fn = _make_tool()
        result = await tool_fn(action="vm", subaction="details", vm_id="Win11")
        assert result["uuid"] == "uuid-1"

    async def test_details_not_found(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {
            "vms": {
                "domains": [{"id": "vm:1", "name": "Win11", "state": "RUNNING", "uuid": "uuid-1"}]
            }
        }
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="not found"):
            await tool_fn(action="vm", subaction="details", vm_id="nonexistent")

    async def test_start_vm(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {"vm": {"start": True}}
        tool_fn = _make_tool()
        result = await tool_fn(action="vm", subaction="start", vm_id="uuid-1")
        assert result["success"] is True
        assert result["subaction"] == "start"

    async def test_force_stop(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {"vm": {"forceStop": True}}
        tool_fn = _make_tool()
        result = await tool_fn(action="vm", subaction="force_stop", vm_id="uuid-1", confirm=True)
        assert result["success"] is True
        assert result["subaction"] == "force_stop"

    async def test_stop_vm(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {"vm": {"stop": True}}
        tool_fn = _make_tool()
        result = await tool_fn(action="vm", subaction="stop", vm_id="uuid-1")
        assert result["success"] is True
        assert result["subaction"] == "stop"

    async def test_pause_vm(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {"vm": {"pause": True}}
        tool_fn = _make_tool()
        result = await tool_fn(action="vm", subaction="pause", vm_id="uuid-1")
        assert result["success"] is True
        assert result["subaction"] == "pause"

    async def test_resume_vm(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {"vm": {"resume": True}}
        tool_fn = _make_tool()
        result = await tool_fn(action="vm", subaction="resume", vm_id="uuid-1")
        assert result["success"] is True
        assert result["subaction"] == "resume"

    async def test_reboot_vm(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {"vm": {"reboot": True}}
        tool_fn = _make_tool()
        result = await tool_fn(action="vm", subaction="reboot", vm_id="uuid-1")
        assert result["success"] is True
        assert result["subaction"] == "reboot"
        assert result["vm_id"] == "uuid-1"

    async def test_mutation_unexpected_response(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {"vm": {}}
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="Failed to start"):
            await tool_fn(action="vm", subaction="start", vm_id="uuid-1")


class TestVmMutationFailures:
    """Tests for VM mutation responses indicating failure or unexpected shapes."""

    async def test_start_mutation_empty_response(self, _mock_graphql: AsyncMock) -> None:
        """Empty top-level response (no 'vm' key) should raise ToolError."""
        _mock_graphql.return_value = {}
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="Failed to start"):
            await tool_fn(action="vm", subaction="start", vm_id="uuid-1")

    async def test_start_mutation_returns_false(self, _mock_graphql: AsyncMock) -> None:
        """VM start returning False should still succeed (the tool reports the raw value)."""
        _mock_graphql.return_value = {"vm": {"start": False}}
        tool_fn = _make_tool()
        result = await tool_fn(action="vm", subaction="start", vm_id="uuid-1")
        assert result["success"] is False
        assert result["subaction"] == "start"

    async def test_stop_mutation_returns_null(self, _mock_graphql: AsyncMock) -> None:
        """VM stop returning None in the field should succeed (key exists, value is None)."""
        _mock_graphql.return_value = {"vm": {"stop": None}}
        tool_fn = _make_tool()
        # The check is `field in data["vm"]` — `in` checks key existence, not truthiness
        result = await tool_fn(action="vm", subaction="stop", vm_id="uuid-1")
        assert result["success"] is None
        assert result["subaction"] == "stop"

    async def test_force_stop_mutation_empty_vm_object(self, _mock_graphql: AsyncMock) -> None:
        """Empty vm object with no matching field should raise ToolError."""
        _mock_graphql.return_value = {"vm": {}}
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="Failed to force_stop"):
            await tool_fn(action="vm", subaction="force_stop", vm_id="uuid-1", confirm=True)

    async def test_reboot_mutation_vm_key_none(self, _mock_graphql: AsyncMock) -> None:
        """vm key being None should raise ToolError."""
        _mock_graphql.return_value = {"vm": None}
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="Failed to reboot"):
            await tool_fn(action="vm", subaction="reboot", vm_id="uuid-1")

    async def test_mutation_timeout(self, _mock_graphql: AsyncMock) -> None:
        """Mid-operation timeout should be wrapped in ToolError."""

        _mock_graphql.side_effect = TimeoutError("VM operation timed out")
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="timed out"):
            await tool_fn(action="vm", subaction="start", vm_id="uuid-1")
