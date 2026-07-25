"""Tests for docker subactions of the consolidated unraid tool."""

from collections.abc import Generator
from unittest.mock import AsyncMock, patch

import pytest
from conftest import make_tool_fn

from unraid_mcp.core.exceptions import ToolError


# --- Integration tests ---


@pytest.fixture
def _mock_graphql() -> Generator[AsyncMock, None, None]:
    with patch("unraid_mcp.core.client.make_graphql_request", new_callable=AsyncMock) as mock:
        yield mock


def _make_tool():
    return make_tool_fn("unraid_mcp.tools.unraid", "register_unraid_tool", "unraid")


class TestDockerValidation:
    @pytest.mark.parametrize("subaction", ["start", "stop", "details"])
    async def test_container_actions_require_id(
        self, _mock_graphql: AsyncMock, subaction: str
    ) -> None:
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="container_id"):
            await tool_fn(action="docker", subaction=subaction)

    async def test_network_details_requires_id(self, _mock_graphql: AsyncMock) -> None:
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="network_id"):
            await tool_fn(action="docker", subaction="network_details")

    async def test_non_logs_action_ignores_tail_lines_validation(
        self, _mock_graphql: AsyncMock
    ) -> None:
        _mock_graphql.return_value = {"docker": {"containers": []}}
        tool_fn = _make_tool()
        result = await tool_fn(action="docker", subaction="list")
        assert result["containers"] == []


class TestDockerActions:
    async def test_list(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {
            "docker": {"containers": [{"id": "c1", "names": ["plex"], "state": "running"}]}
        }
        tool_fn = _make_tool()
        result = await tool_fn(action="docker", subaction="list")
        assert len(result["containers"]) == 1

    async def test_list_caps_default(self, _mock_graphql: AsyncMock) -> None:
        # Tool param default is 20.
        _mock_graphql.return_value = {
            "docker": {"containers": [{"id": f"c{i}", "names": [f"ct{i}"]} for i in range(80)]}
        }
        tool_fn = _make_tool()
        result = await tool_fn(action="docker", subaction="list")
        assert len(result["containers"]) == 20
        assert result["page"]["truncated"] is True
        assert result["page"]["total"] == 80
        assert "hint" in result["page"]

    async def test_list_limit_widens(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {
            "docker": {"containers": [{"id": f"c{i}", "names": [f"ct{i}"]} for i in range(80)]}
        }
        tool_fn = _make_tool()
        result = await tool_fn(action="docker", subaction="list", limit=50)
        assert len(result["containers"]) == 50

    async def test_list_limit_zero_returns_all(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {
            "docker": {"containers": [{"id": f"c{i}", "names": [f"ct{i}"]} for i in range(80)]}
        }
        tool_fn = _make_tool()
        result = await tool_fn(action="docker", subaction="list", limit=0)
        assert len(result["containers"]) == 80
        assert result["page"]["truncated"] is False

    async def test_start_container(self, _mock_graphql: AsyncMock) -> None:
        # First call resolves ID, second performs start
        cid = "a" * 64 + ":local"
        _mock_graphql.side_effect = [
            {"docker": {"containers": [{"id": cid, "names": ["plex"]}]}},
            {
                "docker": {
                    "start": {
                        "id": cid,
                        "state": "running",
                    }
                }
            },
        ]
        tool_fn = _make_tool()
        result = await tool_fn(action="docker", subaction="start", container_id="plex")
        assert result["success"] is True

    async def test_networks(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {"docker": {"networks": [{"id": "net:1", "name": "bridge"}]}}
        tool_fn = _make_tool()
        result = await tool_fn(action="docker", subaction="networks")
        assert len(result["networks"]) == 1

    async def test_idempotent_start(self, _mock_graphql: AsyncMock) -> None:
        # Resolve + idempotent success
        _mock_graphql.side_effect = [
            {"docker": {"containers": [{"id": "a" * 64 + ":local", "names": ["plex"]}]}},
            {"idempotent_success": True, "docker": {}},
        ]
        tool_fn = _make_tool()
        result = await tool_fn(action="docker", subaction="start", container_id="plex")
        assert result["idempotent"] is True

    async def test_restart(self, _mock_graphql: AsyncMock) -> None:
        cid = "a" * 64 + ":local"
        _mock_graphql.side_effect = [
            {"docker": {"containers": [{"id": cid, "names": ["plex"]}]}},
            {"docker": {"restart": {"id": cid, "state": "running"}}},
        ]
        tool_fn = _make_tool()
        result = await tool_fn(action="docker", subaction="restart", container_id="plex")
        assert result["success"] is True
        assert result["subaction"] == "restart"

    async def test_restart_stopped_container_error_is_not_masked(
        self, _mock_graphql: AsyncMock
    ) -> None:
        cid = "a" * 64 + ":local"
        _mock_graphql.side_effect = [
            {"docker": {"containers": [{"id": cid, "names": ["plex"]}]}},
            ToolError("GraphQL API error: Container not running"),
        ]
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="Container not running"):
            await tool_fn(action="docker", subaction="restart", container_id="plex")
        assert _mock_graphql.call_args_list[1].kwargs["operation_context"] == {
            "operation": "restart"
        }
        assert _mock_graphql.call_count == 2

    async def test_details_found(self, _mock_graphql: AsyncMock) -> None:
        # details now fetches a single container by id: the first call resolves
        # the name → id, the second returns docker.container for that id.
        _mock_graphql.side_effect = [
            {"docker": {"containers": [{"id": "c1", "names": ["plex"]}]}},
            {
                "docker": {
                    "container": {
                        "id": "c1",
                        "names": ["plex"],
                        "state": "running",
                        "image": "plexinc/pms",
                    }
                }
            },
        ]
        tool_fn = _make_tool()
        result = await tool_fn(action="docker", subaction="details", container_id="plex")
        assert result["names"] == ["plex"]
        # The details query must request a single container by id, not the full list.
        details_call = _mock_graphql.call_args_list[1]
        assert "container(id:" in details_call.args[0]
        assert details_call.args[1] == {"id": "c1"}

    async def test_generic_exception_wraps_in_tool_error(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.side_effect = RuntimeError("unexpected failure")
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="Internal error executing docker/list"):
            await tool_fn(action="docker", subaction="list")

    async def test_short_id_prefix_ambiguous_rejected(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {
            "docker": {
                "containers": [
                    {
                        "id": "abcdef1234560000000000000000000000000000000000000000000000000000:local",
                        "names": ["plex"],
                    },
                    {
                        "id": "abcdef1234561111111111111111111111111111111111111111111111111111:local",
                        "names": ["sonarr"],
                    },
                ]
            }
        }
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="ambiguous"):
            await tool_fn(action="docker", subaction="details", container_id="abcdef123456")


class TestDockerNullNameSafety:
    """Container name matching must survive malformed GraphQL `names` fields.

    `names` is nominally `[String!]`, but partial/malformed responses can return
    `null` for the whole list or `[null]` for an element. Matching must skip the
    bad entries instead of raising AttributeError/TypeError on `.lower()`/`join`.
    """

    def test_find_container_skips_null_name_entry(self) -> None:
        from unraid_mcp.tools._docker import _find_container

        containers = [
            {"id": "c1:local", "names": [None]},  # malformed element
            {"id": "c2:local", "names": ["plex"]},  # valid neighbor
        ]
        # Prefix match must skip the [None] entry and still find plex.
        assert _find_container("plex", containers) == containers[1]

    def test_find_container_handles_null_names_list(self) -> None:
        from unraid_mcp.tools._docker import _find_container

        containers = [
            {"id": "c1:local", "names": None},  # whole list is null
            {"id": "c2:local", "names": ["sonarr"]},
        ]
        assert _find_container("sonarr", containers) == containers[1]
        # No match against the broken record returns None rather than crashing.
        assert _find_container("nope", containers) is None

    async def test_resolve_container_id_skips_bad_names(self, _mock_graphql: AsyncMock) -> None:
        # Resolve a friendly name → id while one record carries names: [null].
        cid = "a" * 64 + ":local"
        _mock_graphql.side_effect = [
            {
                "docker": {
                    "containers": [
                        {"id": "bad:local", "names": [None]},
                        {"id": cid, "names": ["plex"]},
                    ]
                }
            },
            {"docker": {"start": {"id": cid, "state": "running"}}},
        ]
        tool_fn = _make_tool()
        result = await tool_fn(action="docker", subaction="start", container_id="plex")
        assert result["success"] is True

    async def test_not_found_message_skips_null_names(self, _mock_graphql: AsyncMock) -> None:
        # The "Available: ..." hint joins names — a null entry must not crash join.
        _mock_graphql.return_value = {
            "docker": {"containers": [{"id": "c1:local", "names": [None]}]}
        }
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="not found"):
            await tool_fn(action="docker", subaction="start", container_id="ghost")


class TestDockerMutationFailures:
    """Tests for mutation responses that indicate failure or unexpected shapes."""

    async def test_start_mutation_empty_docker_response(self, _mock_graphql: AsyncMock) -> None:
        """docker field returning empty object (missing the action sub-field).

        An empty/unexpected mutation response must NOT be reported as success — the
        container state was never confirmed changed.
        """
        cid = "a" * 64 + ":local"
        _mock_graphql.side_effect = [
            {"docker": {"containers": [{"id": cid, "names": ["plex"]}]}},
            {"docker": {}},
        ]
        tool_fn = _make_tool()
        result = await tool_fn(action="docker", subaction="start", container_id="plex")
        assert result["success"] is False
        assert result["container"] is None

    async def test_stop_mutation_returns_false_state(self, _mock_graphql: AsyncMock) -> None:
        """Stop mutation returning a container with unexpected state."""
        cid = "a" * 64 + ":local"
        _mock_graphql.side_effect = [
            {"docker": {"containers": [{"id": cid, "names": ["plex"]}]}},
            {"docker": {"stop": {"id": cid, "state": "running"}}},
        ]
        tool_fn = _make_tool()
        result = await tool_fn(action="docker", subaction="stop", container_id="plex")
        assert result["success"] is True
        assert result["container"]["state"] == "running"

    async def test_mutation_timeout(self, _mock_graphql: AsyncMock) -> None:
        """Mid-operation timeout during a docker mutation."""

        cid = "a" * 64 + ":local"
        _mock_graphql.side_effect = [
            {"docker": {"containers": [{"id": cid, "names": ["plex"]}]}},
            TimeoutError("operation timed out"),
        ]
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="timed out"):
            await tool_fn(action="docker", subaction="start", container_id="plex")


class TestDockerNetworkErrors:
    """Tests for network-level failures in docker operations."""

    async def test_list_connection_refused(self, _mock_graphql: AsyncMock) -> None:
        """Connection refused when listing containers should be wrapped in ToolError."""
        _mock_graphql.side_effect = ToolError(
            "Network connection error: [Errno 111] Connection refused"
        )
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="Connection refused"):
            await tool_fn(action="docker", subaction="list")

    async def test_list_http_401_unauthorized(self, _mock_graphql: AsyncMock) -> None:
        """HTTP 401 should propagate as ToolError."""
        _mock_graphql.side_effect = ToolError("HTTP error 401: Unauthorized")
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="401"):
            await tool_fn(action="docker", subaction="list")

    async def test_json_decode_error_on_list(self, _mock_graphql: AsyncMock) -> None:
        """Invalid JSON response should be wrapped in ToolError."""
        _mock_graphql.side_effect = ToolError(
            "Invalid JSON response from Unraid API: Expecting value: line 1 column 1"
        )
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="Invalid JSON"):
            await tool_fn(action="docker", subaction="list")


class TestDockerPortsAggregator:
    """Tests for the docker/ports aggregator subaction."""

    async def test_ports_aggregates_running_containers(self, _mock_graphql: AsyncMock) -> None:
        """Two RUNNING containers with single-port mappings each yield two
        bindings sorted by host port, with leading-slash names stripped."""
        _mock_graphql.return_value = {
            "docker": {
                "containers": [
                    {
                        "id": "c1",
                        "names": ["/postgres"],
                        "state": "RUNNING",
                        "ports": [
                            {
                                "ip": "0.0.0.0",
                                "privatePort": 5432,
                                "publicPort": 5432,
                                "type": "TCP",
                            }
                        ],
                    },
                    {
                        "id": "c2",
                        "names": ["/redis"],
                        "state": "RUNNING",
                        "ports": [
                            {
                                "ip": "0.0.0.0",
                                "privatePort": 6379,
                                "publicPort": 6379,
                                "type": "TCP",
                            }
                        ],
                    },
                ]
            }
        }
        tool_fn = _make_tool()
        result = await tool_fn(action="docker", subaction="ports")
        assert result["count"] == 2
        # Sorted by host_port ascending
        assert [b["host_port"] for b in result["bindings"]] == [5432, 6379]
        first = result["bindings"][0]
        assert first["container"] == "postgres"  # leading slash stripped
        assert first["container_port"] == 5432
        assert first["protocol"] == "TCP"
        assert first["host_ip"] == "0.0.0.0"

    async def test_ports_skips_exited_containers(self, _mock_graphql: AsyncMock) -> None:
        """Exited containers don't hold host ports — skip them even if ports[] is populated."""
        _mock_graphql.return_value = {
            "docker": {
                "containers": [
                    {
                        "id": "c1",
                        "names": ["/postgres"],
                        "state": "RUNNING",
                        "ports": [
                            {
                                "ip": "0.0.0.0",
                                "privatePort": 5432,
                                "publicPort": 5432,
                                "type": "TCP",
                            }
                        ],
                    },
                    {
                        "id": "c2",
                        "names": ["/old-app"],
                        "state": "EXITED",
                        "ports": [
                            {
                                "ip": "0.0.0.0",
                                "privatePort": 80,
                                "publicPort": 8080,
                                "type": "TCP",
                            }
                        ],
                    },
                ]
            }
        }
        tool_fn = _make_tool()
        result = await tool_fn(action="docker", subaction="ports")
        assert result["count"] == 1
        assert result["bindings"][0]["container"] == "postgres"

    async def test_ports_skips_internal_only_ports(self, _mock_graphql: AsyncMock) -> None:
        """Ports with publicPort=null are container-internal — skip them."""
        _mock_graphql.return_value = {
            "docker": {
                "containers": [
                    {
                        "id": "c1",
                        "names": ["/glances"],
                        "state": "RUNNING",
                        "ports": [
                            {
                                "ip": "0.0.0.0",
                                "privatePort": 61208,
                                "publicPort": 61208,
                                "type": "TCP",
                            },
                            {
                                "ip": "",
                                "privatePort": 61209,
                                "publicPort": None,
                                "type": "TCP",
                            },
                        ],
                    }
                ]
            }
        }
        tool_fn = _make_tool()
        result = await tool_fn(action="docker", subaction="ports")
        assert result["count"] == 1
        assert result["bindings"][0]["host_port"] == 61208

    async def test_ports_handles_host_network_containers(self, _mock_graphql: AsyncMock) -> None:
        """Host-network containers have empty ports[] — they shouldn't crash or appear."""
        _mock_graphql.return_value = {
            "docker": {
                "containers": [
                    {
                        "id": "c1",
                        "names": ["/plex"],
                        "state": "RUNNING",
                        "ports": [],
                    }
                ]
            }
        }
        tool_fn = _make_tool()
        result = await tool_fn(action="docker", subaction="ports")
        assert result["count"] == 0
        assert result["bindings"] == []

    async def test_ports_emits_one_binding_per_port(self, _mock_graphql: AsyncMock) -> None:
        """A container exposing multiple ports should emit a binding per public port."""
        _mock_graphql.return_value = {
            "docker": {
                "containers": [
                    {
                        "id": "c1",
                        "names": ["/filezilla"],
                        "state": "RUNNING",
                        "ports": [
                            {
                                "ip": "0.0.0.0",
                                "privatePort": 3000,
                                "publicPort": 3014,
                                "type": "TCP",
                            },
                            {
                                "ip": "0.0.0.0",
                                "privatePort": 3001,
                                "publicPort": 3042,
                                "type": "TCP",
                            },
                        ],
                    }
                ]
            }
        }
        tool_fn = _make_tool()
        result = await tool_fn(action="docker", subaction="ports")
        assert result["count"] == 2
        assert sorted(b["host_port"] for b in result["bindings"]) == [3014, 3042]

    async def test_ports_empty_when_no_containers(self, _mock_graphql: AsyncMock) -> None:
        """An empty container list returns an empty bindings list with count=0."""
        _mock_graphql.return_value = {"docker": {"containers": []}}
        tool_fn = _make_tool()
        result = await tool_fn(action="docker", subaction="ports")
        assert result == {
            "bindings": [],
            "count": 0,
            "page": {"returned": 0, "total": 0, "truncated": False},
        }

    async def test_ports_handles_unnamed_container(self, _mock_graphql: AsyncMock) -> None:
        """Container with empty names list falls back to '<unnamed>'."""
        _mock_graphql.return_value = {
            "docker": {
                "containers": [
                    {
                        "id": "c1",
                        "names": [],
                        "state": "RUNNING",
                        "ports": [
                            {
                                "ip": "0.0.0.0",
                                "privatePort": 80,
                                "publicPort": 8080,
                                "type": "TCP",
                            }
                        ],
                    }
                ]
            }
        }
        tool_fn = _make_tool()
        result = await tool_fn(action="docker", subaction="ports")
        assert result["count"] == 1
        assert result["bindings"][0]["container"] == "<unnamed>"

    async def test_ports_uses_details_query_not_list(self, _mock_graphql: AsyncMock) -> None:
        """ports must call the details query (which carries port info), not list."""
        _mock_graphql.return_value = {"docker": {"containers": []}}
        tool_fn = _make_tool()
        await tool_fn(action="docker", subaction="ports")
        assert _mock_graphql.call_count == 1
        called_query = _mock_graphql.call_args.args[0]
        assert "ports" in called_query
        assert "publicPort" in called_query

    async def test_ports_protocol_tiebreak_orders_tcp_before_udp(
        self, _mock_graphql: AsyncMock
    ) -> None:
        """When two bindings share the same host port (e.g. a service exposing
        the same port on both TCP and UDP), the secondary sort key is
        ``protocol`` — alphabetical, so TCP precedes UDP."""
        _mock_graphql.return_value = {
            "docker": {
                "containers": [
                    {
                        "id": "c1",
                        "names": ["/dnsmasq"],
                        "state": "RUNNING",
                        "ports": [
                            {
                                "ip": "0.0.0.0",
                                "privatePort": 53,
                                "publicPort": 53,
                                "type": "UDP",
                            },
                            {
                                "ip": "0.0.0.0",
                                "privatePort": 53,
                                "publicPort": 53,
                                "type": "TCP",
                            },
                        ],
                    }
                ]
            }
        }
        tool_fn = _make_tool()
        result = await tool_fn(action="docker", subaction="ports")
        assert result["count"] == 2
        # Same host port — ordered by protocol alphabetically (TCP < UDP)
        assert [b["protocol"] for b in result["bindings"]] == ["TCP", "UDP"]
        assert all(b["host_port"] == 53 for b in result["bindings"])

    @pytest.mark.parametrize("state_value", ["running", "Running", "RUNNING", "rUnNiNg"])
    async def test_ports_state_check_is_case_insensitive(
        self, _mock_graphql: AsyncMock, state_value: str
    ) -> None:
        """Container state values appear in mixed case across the codebase
        (compare _health.py which uses ``.upper()``); the aggregator must include
        a container regardless of case so a stylistic API change can't silently
        zero out the result."""
        _mock_graphql.return_value = {
            "docker": {
                "containers": [
                    {
                        "id": "c1",
                        "names": ["/postgres"],
                        "state": state_value,
                        "ports": [
                            {
                                "ip": "0.0.0.0",
                                "privatePort": 5432,
                                "publicPort": 5432,
                                "type": "TCP",
                            }
                        ],
                    }
                ]
            }
        }
        tool_fn = _make_tool()
        result = await tool_fn(action="docker", subaction="ports")
        assert result["count"] == 1, f"Expected 1 binding for state={state_value!r}"
        assert result["bindings"][0]["host_port"] == 5432


# ---------------------------------------------------------------------------
# New lifecycle / update / template / organizer subactions
# ---------------------------------------------------------------------------

_FULL_ID = "a" * 64  # matches _DOCKER_ID_PATTERN so no resolve round-trip


class TestDockerLifecycleAdditions:
    async def test_unpause(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {"docker": {"unpause": {"id": _FULL_ID, "state": "RUNNING"}}}
        result = await _make_tool()(action="docker", subaction="unpause", container_id=_FULL_ID)
        assert result["success"] is True
        assert result["container"]["state"] == "RUNNING"

    async def test_update_container(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {
            "docker": {"updateContainer": {"id": _FULL_ID, "image": "img:2"}}
        }
        result = await _make_tool()(
            action="docker", subaction="update_container", container_id=_FULL_ID
        )
        assert result["container"]["image"] == "img:2"

    async def test_update_all_containers(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {"docker": {"updateAllContainers": [{"id": _FULL_ID}]}}
        result = await _make_tool()(action="docker", subaction="update_all_containers")
        assert result["success"] is True
        assert len(result["containers"]) == 1

    async def test_update_containers_requires_ids(self, _mock_graphql: AsyncMock) -> None:
        with pytest.raises(ToolError, match="container_ids is required"):
            await _make_tool()(action="docker", subaction="update_containers")

    async def test_remove_container_is_destructive(self, _mock_graphql: AsyncMock) -> None:
        with pytest.raises(ToolError, match="confirm=True"):
            await _make_tool()(action="docker", subaction="remove_container", container_id=_FULL_ID)

    async def test_remove_container_with_confirm(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {"docker": {"removeContainer": True}}
        result = await _make_tool()(
            action="docker",
            subaction="remove_container",
            container_id=_FULL_ID,
            with_image=True,
            confirm=True,
        )
        assert result["success"] is True
        assert result["with_image"] is True

    async def test_update_autostart_requires_entries(self, _mock_graphql: AsyncMock) -> None:
        with pytest.raises(ToolError, match="autostart_entries is required"):
            await _make_tool()(action="docker", subaction="update_autostart")


class TestDockerTemplateMutations:
    async def test_refresh_digests(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {"refreshDockerDigests": True}
        result = await _make_tool()(action="docker", subaction="refresh_digests")
        assert result["result"] is True

    async def test_sync_template_paths(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {
            "syncDockerTemplatePaths": {"scanned": 3, "matched": 2, "skipped": 1, "errors": []}
        }
        result = await _make_tool()(action="docker", subaction="sync_template_paths")
        assert result["result"]["matched"] == 2

    async def test_reset_template_mappings_is_destructive(self, _mock_graphql: AsyncMock) -> None:
        with pytest.raises(ToolError, match="confirm=True"):
            await _make_tool()(action="docker", subaction="reset_template_mappings")


class TestDockerOrganizerMutations:
    async def test_create_folder_requires_name(self, _mock_graphql: AsyncMock) -> None:
        with pytest.raises(ToolError, match="missing required field"):
            await _make_tool()(action="docker", subaction="create_folder", organizer_input={})

    async def test_create_folder(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {"createDockerFolder": {"version": 2}}
        result = await _make_tool()(
            action="docker",
            subaction="create_folder",
            organizer_input={"name": "Media", "childrenIds": ["x"]},
        )
        assert result["organizer"]["version"] == 2

    async def test_delete_entries_is_destructive(self, _mock_graphql: AsyncMock) -> None:
        with pytest.raises(ToolError, match="confirm=True"):
            await _make_tool()(
                action="docker",
                subaction="delete_entries",
                organizer_input={"entryIds": ["e1"]},
            )

    async def test_delete_entries_with_confirm(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {"deleteDockerEntries": {"version": 3}}
        result = await _make_tool()(
            action="docker",
            subaction="delete_entries",
            organizer_input={"entryIds": ["e1"]},
            confirm=True,
        )
        assert result["organizer"]["version"] == 3


class TestDockerSuccessDerivationAndCoverage:
    """Success must be derived from the GraphQL result, not hardcoded."""

    async def test_update_autostart_success(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {"docker": {"updateAutostartConfiguration": True}}
        result = await _make_tool()(
            action="docker",
            subaction="update_autostart",
            autostart_entries=[{"id": _FULL_ID, "autoStart": True, "wait": 5}],
        )
        assert result["success"] is True
        assert result["entry_count"] == 1
        # entries forwarded, persist hardcoded True
        sent = _mock_graphql.call_args.args[1]
        assert sent["persist"] is True
        assert sent["entries"][0]["autoStart"] is True

    async def test_update_containers_success(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {"docker": {"updateContainers": [{"id": _FULL_ID}]}}
        result = await _make_tool()(
            action="docker", subaction="update_containers", container_ids=[_FULL_ID]
        )
        assert result["success"] is True
        assert _mock_graphql.call_args.args[1] == {"ids": [_FULL_ID]}

    async def test_refresh_digests_false_is_not_success(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {"refreshDockerDigests": False}
        result = await _make_tool()(action="docker", subaction="refresh_digests")
        assert result["success"] is False

    async def test_sync_template_paths_surfaces_errors(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {
            "syncDockerTemplatePaths": {
                "scanned": 2,
                "matched": 0,
                "skipped": 0,
                "errors": ["boom"],
            }
        }
        result = await _make_tool()(action="docker", subaction="sync_template_paths")
        assert result["success"] is False
        assert result["errors"] == ["boom"]

    async def test_organizer_rejects_unknown_keys(self, _mock_graphql: AsyncMock) -> None:
        with pytest.raises(ToolError, match="unknown field"):
            await _make_tool()(
                action="docker",
                subaction="create_folder",
                organizer_input={"name": "Media", "bogusField": 1},
            )

    async def test_move_items_to_position_forwards_required(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {"moveDockerItemsToPosition": {"version": 4}}
        result = await _make_tool()(
            action="docker",
            subaction="move_items_to_position",
            organizer_input={
                "sourceEntryIds": ["e1"],
                "destinationFolderId": "f1",
                "position": 2,
            },
        )
        assert result["success"] is True
        sent = _mock_graphql.call_args.args[1]
        assert sent == {"sourceEntryIds": ["e1"], "destinationFolderId": "f1", "position": 2}

    async def test_organizer_empty_result_is_not_success(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {"createDockerFolder": None}
        result = await _make_tool()(
            action="docker", subaction="create_folder", organizer_input={"name": "X"}
        )
        assert result["success"] is False


class TestDockerUnhandledSubaction:
    async def test_in_subactions_but_unhandled_raises_clear_error(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        # Regression: a subaction present in _DOCKER_SUBACTIONS (so validate_subaction
        # passes) but lacking an explicit handler must raise a clear ToolError instead
        # of falling through to a bare KeyError on _DOCKER_MUTATIONS[subaction].
        from unraid_mcp.tools import _docker

        fake = "__fake_unhandled__"
        monkeypatch.setattr(_docker, "_DOCKER_SUBACTIONS", _docker._DOCKER_SUBACTIONS | {fake})
        with pytest.raises(ToolError, match=r"Unhandled docker subaction"):
            await _docker._handle_docker(subaction=fake, container_id=None, network_id=None)
