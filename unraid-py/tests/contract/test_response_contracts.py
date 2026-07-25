"""Contract tests: validate GraphQL response shapes with Pydantic models.

These tests document and enforce the response structure that callers of each
tool action can rely on. A Pydantic ValidationError here means the tool's
response shape changed — a breaking change for any downstream consumer.

Coverage:
  - Docker: list, details, networks, start/stop mutations
  - Info: overview, array, metrics, services, online, registration, network
  - Storage: shares, disks, disk_details, log_files
  - Notifications: overview, list, create
"""

from collections.abc import Generator
from typing import Any
from unittest.mock import AsyncMock, patch

import pytest
from pydantic import BaseModel, ValidationError

from tests.conftest import make_tool_fn


# ---------------------------------------------------------------------------
# Pydantic contract models
# ---------------------------------------------------------------------------


# --- Docker ---


class DockerContainer(BaseModel):
    """Minimal shape of a container as returned by docker/list."""

    id: str
    names: list[str]
    state: str
    image: str | None = None
    status: str | None = None
    autoStart: bool | None = None


class DockerContainerDetails(BaseModel):
    """Extended shape returned by docker/details."""

    id: str
    names: list[str]
    state: str
    image: str | None = None
    imageId: str | None = None
    command: str | None = None
    created: Any = None
    ports: list[Any] | None = None
    sizeRootFs: Any = None
    labels: Any = None
    status: str | None = None
    autoStart: bool | None = None


class DockerNetwork(BaseModel):
    """Shape of a docker network entry."""

    id: str
    name: str
    driver: str | None = None
    scope: str | None = None


class DockerMutationResult(BaseModel):
    """Shape returned by docker start/stop/pause/unpause mutations."""

    success: bool
    subaction: str
    container: Any = None


class ProjectedMutationResult(BaseModel):
    """Shape returned by array/notification mutations after the raw-`data` fix.

    `data` carries the projected result subtree (the mutation's GraphQL result
    field), never the whole top-level response dict, so the operation-name
    wrapper (e.g. ``archiveNotification``/``setState``) is gone.
    """

    success: bool
    subaction: str
    data: Any = None


class DockerListResult(BaseModel):
    """Top-level shape of docker/list response."""

    containers: list[Any]


class DockerNetworkListResult(BaseModel):
    """Top-level shape of docker/networks response."""

    networks: list[Any]


# --- Info ---


class InfoOverviewSummary(BaseModel):
    """Summary block inside info/overview response."""

    hostname: str | None = None
    uptime: Any = None
    cpu: str | None = None
    os: str | None = None
    memory_summary: str | None = None


class InfoOverviewResult(BaseModel):
    """Top-level shape of info/overview."""

    model_config = {"extra": "forbid"}

    summary: dict[str, Any]


class ArraySummary(BaseModel):
    """Summary block inside info/array response."""

    state: str | None = None
    num_data_disks: int
    num_parity_disks: int
    num_cache_pools: int
    overall_health: str


class InfoArrayResult(BaseModel):
    """Top-level shape of info/array."""

    model_config = {"extra": "forbid"}

    summary: dict[str, Any]


class CpuMetrics(BaseModel):
    percentTotal: float | None = None


class MemoryMetrics(BaseModel):
    total: Any = None
    used: Any = None
    free: Any = None
    available: Any = None
    buffcache: Any = None
    percentTotal: float | None = None


class InfoMetricsResult(BaseModel):
    """Top-level shape of info/metrics."""

    cpu: dict[str, Any] | None = None
    memory: dict[str, Any] | None = None


class ServiceEntry(BaseModel):
    """Shape of a single service in info/services response."""

    name: str
    online: bool | None = None
    version: str | None = None


class InfoServicesResult(BaseModel):
    services: list[Any]


class InfoOnlineResult(BaseModel):
    online: bool | None = None


class RegistrationResult(BaseModel):
    """Shape of info/registration response."""

    id: str | None = None
    type: str | None = None
    state: str | None = None
    expiration: Any = None


class InfoNetworkResult(BaseModel):
    """Shape of info/network response."""

    accessUrls: list[Any]
    httpPort: Any = None
    httpsPort: Any = None
    localTld: str | None = None
    useSsl: Any = None


# --- Storage ---


class ShareEntry(BaseModel):
    """Shape of a single share in storage/shares response."""

    id: str
    name: str
    free: Any = None
    used: Any = None
    size: Any = None


class StorageSharesResult(BaseModel):
    shares: list[Any]


class DiskEntry(BaseModel):
    """Minimal shape of a disk in storage/disks response."""

    id: str
    device: str | None = None
    name: str | None = None


class StorageDisksResult(BaseModel):
    disks: list[Any]


class DiskDetailsSummary(BaseModel):
    """Summary block in storage/disk_details response."""

    disk_id: str | None = None
    device: str | None = None
    name: str | None = None
    serial_number: str | None = None
    size_formatted: str
    temperature: str


class StorageDiskDetailsResult(BaseModel):
    """Top-level shape of storage/disk_details."""

    summary: dict[str, Any]
    details: dict[str, Any]


class LogFileEntry(BaseModel):
    """Shape of a log file entry in storage/log_files response."""

    name: str
    path: str
    size: Any = None
    modifiedAt: Any = None


class StorageLogFilesResult(BaseModel):
    log_files: list[Any]


# --- Notifications ---


class NotificationCountBucket(BaseModel):
    """Counts within a single severity bucket."""

    info: int | None = None
    warning: int | None = None
    alert: int | None = None
    total: int | None = None


class NotificationOverviewResult(BaseModel):
    """Top-level shape of notifications/overview."""

    unread: dict[str, Any] | None = None
    archive: dict[str, Any] | None = None


class NotificationEntry(BaseModel):
    """Shape of a single notification in notifications/list response."""

    id: str
    title: str | None = None
    subject: str | None = None
    description: str | None = None
    importance: str | None = None
    type: str | None = None
    timestamp: Any = None
    formattedTimestamp: Any = None
    link: Any = None


class NotificationListResult(BaseModel):
    notifications: list[Any]


class NotificationCreateResult(BaseModel):
    success: bool
    notification: dict[str, Any]


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def _docker_mock() -> Generator[AsyncMock, None, None]:
    with patch("unraid_mcp.core.client.make_graphql_request", new_callable=AsyncMock) as mock:
        yield mock


@pytest.fixture
def _info_mock() -> Generator[AsyncMock, None, None]:
    with patch("unraid_mcp.core.client.make_graphql_request", new_callable=AsyncMock) as mock:
        yield mock


@pytest.fixture
def _storage_mock() -> Generator[AsyncMock, None, None]:
    with patch("unraid_mcp.core.client.make_graphql_request", new_callable=AsyncMock) as mock:
        yield mock


@pytest.fixture
def _notifications_mock() -> Generator[AsyncMock, None, None]:
    with patch("unraid_mcp.core.client.make_graphql_request", new_callable=AsyncMock) as mock:
        yield mock


@pytest.fixture
def _array_mock() -> Generator[AsyncMock, None, None]:
    with patch("unraid_mcp.core.client.make_graphql_request", new_callable=AsyncMock) as mock:
        yield mock


def _array_tool():
    return make_tool_fn("unraid_mcp.tools.unraid", "register_unraid_tool", "unraid")


def _docker_tool():
    return make_tool_fn("unraid_mcp.tools.unraid", "register_unraid_tool", "unraid")


def _info_tool():
    return make_tool_fn("unraid_mcp.tools.unraid", "register_unraid_tool", "unraid")


def _storage_tool():
    return make_tool_fn("unraid_mcp.tools.unraid", "register_unraid_tool", "unraid")


def _notifications_tool():
    return make_tool_fn("unraid_mcp.tools.unraid", "register_unraid_tool", "unraid")


# ---------------------------------------------------------------------------
# Docker contract tests
# ---------------------------------------------------------------------------


class TestDockerListContract:
    """docker/list always returns {"containers": [...]}."""

    async def test_list_result_has_containers_key(self, _docker_mock: AsyncMock) -> None:
        _docker_mock.return_value = {"docker": {"containers": []}}
        result = await _docker_tool()(action="docker", subaction="list")
        DockerListResult(**result)

    async def test_list_containers_conform_to_shape(self, _docker_mock: AsyncMock) -> None:
        _docker_mock.return_value = {
            "docker": {
                "containers": [
                    {"id": "c1", "names": ["nginx"], "state": "running", "image": "nginx:latest"},
                    {"id": "c2", "names": ["redis"], "state": "exited", "autoStart": False},
                ]
            }
        }
        result = await _docker_tool()(action="docker", subaction="list")
        validated = DockerListResult(**result)
        for container in validated.containers:
            DockerContainer(**container)

    async def test_list_empty_containers_is_valid(self, _docker_mock: AsyncMock) -> None:
        _docker_mock.return_value = {"docker": {"containers": []}}
        result = await _docker_tool()(action="docker", subaction="list")
        validated = DockerListResult(**result)
        assert validated.containers == []

    async def test_list_container_minimal_fields_valid(self, _docker_mock: AsyncMock) -> None:
        """A container with only id, names, and state should validate."""
        _docker_mock.return_value = {
            "docker": {"containers": [{"id": "abc123", "names": ["plex"], "state": "running"}]}
        }
        result = await _docker_tool()(action="docker", subaction="list")
        container_raw = result["containers"][0]
        DockerContainer(**container_raw)

    async def test_list_missing_names_fails_contract(self, _docker_mock: AsyncMock) -> None:
        """A container missing required 'names' field must fail validation."""
        _docker_mock.return_value = {
            "docker": {"containers": [{"id": "abc123", "state": "running"}]}
        }
        result = await _docker_tool()(action="docker", subaction="list")
        with pytest.raises(ValidationError):
            DockerContainer(**result["containers"][0])


class TestDockerDetailsContract:
    """docker/details returns the raw container dict (not wrapped)."""

    async def test_details_conforms_to_shape(self, _docker_mock: AsyncMock) -> None:
        cid = "a" * 64 + ":local"
        _docker_mock.return_value = {
            "docker": {
                "container": {
                    "id": cid,
                    "names": ["plex"],
                    "state": "running",
                    "image": "plexinc/pms:latest",
                    "status": "Up 3 hours",
                    "ports": [],
                    "autoStart": True,
                }
            }
        }
        result = await _docker_tool()(action="docker", subaction="details", container_id=cid)
        DockerContainerDetails(**result)

    async def test_details_has_required_fields(self, _docker_mock: AsyncMock) -> None:
        cid = "b" * 64 + ":local"
        _docker_mock.return_value = {
            "docker": {"container": {"id": cid, "names": ["sonarr"], "state": "exited"}}
        }
        result = await _docker_tool()(action="docker", subaction="details", container_id=cid)
        assert "id" in result
        assert "names" in result
        assert "state" in result


class TestDockerNetworksContract:
    """docker/networks returns {"networks": [...]}."""

    async def test_networks_result_has_networks_key(self, _docker_mock: AsyncMock) -> None:
        _docker_mock.return_value = {
            "docker": {"networks": [{"id": "net:1", "name": "bridge", "driver": "bridge"}]}
        }
        result = await _docker_tool()(action="docker", subaction="networks")
        DockerNetworkListResult(**result)

    async def test_network_entries_conform_to_shape(self, _docker_mock: AsyncMock) -> None:
        _docker_mock.return_value = {
            "docker": {
                "networks": [
                    {"id": "net:1", "name": "bridge", "driver": "bridge", "scope": "local"},
                    {"id": "net:2", "name": "host", "driver": "host", "scope": "local"},
                ]
            }
        }
        result = await _docker_tool()(action="docker", subaction="networks")
        for net in result["networks"]:
            DockerNetwork(**net)

    async def test_empty_networks_is_valid(self, _docker_mock: AsyncMock) -> None:
        _docker_mock.return_value = {"docker": {"networks": []}}
        result = await _docker_tool()(action="docker", subaction="networks")
        validated = DockerNetworkListResult(**result)
        assert validated.networks == []


class TestDockerMutationContract:
    """docker start/stop return {"success": bool, "action": str, "container": ...}."""

    async def test_start_mutation_result_shape(self, _docker_mock: AsyncMock) -> None:
        # Full 64-hex id skips name resolution, so a single mutation response is made.
        cid = "c" * 64 + ":local"
        _docker_mock.return_value = {
            "docker": {"start": {"id": cid, "names": ["plex"], "state": "running"}}
        }
        result = await _docker_tool()(action="docker", subaction="start", container_id=cid)
        validated = DockerMutationResult(**result)
        assert validated.success is True
        assert validated.subaction == "start"

    async def test_stop_mutation_result_shape(self, _docker_mock: AsyncMock) -> None:
        cid = "d" * 64 + ":local"
        _docker_mock.return_value = {
            "docker": {"stop": {"id": cid, "names": ["nginx"], "state": "exited"}}
        }
        result = await _docker_tool()(action="docker", subaction="stop", container_id=cid)
        validated = DockerMutationResult(**result)
        assert validated.success is True
        assert validated.subaction == "stop"


# ---------------------------------------------------------------------------
# Array mutation projection contract tests (raw-`data` projection fix)
# ---------------------------------------------------------------------------


class TestArrayMutationProjectionContract:
    """array mutations project `data` to the result subtree, dropping the wrapper."""

    async def test_parity_start_projects_to_start_subtree(self, _array_mock: AsyncMock) -> None:
        _array_mock.return_value = {"parityCheck": {"start": True}}
        result = await _array_tool()(action="array", subaction="parity_start", correct=False)
        validated = ProjectedMutationResult(**result)
        assert validated.subaction == "parity_start"
        # Projected to parityCheck.start; the operation wrapper is gone.
        assert validated.data is True
        assert "parityCheck" not in result

    async def test_start_array_projects_to_set_state_subtree(self, _array_mock: AsyncMock) -> None:
        _array_mock.return_value = {"array": {"setState": {"state": "STARTED"}}}
        result = await _array_tool()(action="array", subaction="start_array")
        validated = ProjectedMutationResult(**result)
        assert validated.data == {"state": "STARTED"}
        assert "array" not in result

    async def test_add_disk_projects_to_add_disk_subtree(self, _array_mock: AsyncMock) -> None:
        _array_mock.return_value = {"array": {"addDiskToArray": {"state": "STARTED", "disks": []}}}
        result = await _array_tool()(action="array", subaction="add_disk", disk_id="abc123:local")
        validated = ProjectedMutationResult(**result)
        assert validated.data == {"state": "STARTED", "disks": []}
        assert "array" not in result

    async def test_parity_status_query_projects_to_status_subtree(
        self, _array_mock: AsyncMock
    ) -> None:
        _array_mock.return_value = {"array": {"parityCheckStatus": {"progress": 50}}}
        result = await _array_tool()(action="array", subaction="parity_status")
        validated = ProjectedMutationResult(**result)
        assert validated.data == {"progress": 50}
        assert "array" not in result


# ---------------------------------------------------------------------------
# Notification mutation projection contract tests (raw-`data` projection fix)
# ---------------------------------------------------------------------------


class TestNotificationMutationProjectionContract:
    """notification mutations project `data` to the result subtree, no wrapper."""

    async def test_archive_projects_to_archive_notification_subtree(
        self, _notifications_mock: AsyncMock
    ) -> None:
        _notifications_mock.return_value = {"archiveNotification": {"id": "n:1"}}
        result = await _notifications_tool()(
            action="notification", subaction="archive", notification_id="n:1"
        )
        validated = ProjectedMutationResult(**result)
        assert validated.subaction == "archive"
        assert validated.data == {"id": "n:1"}
        assert "archiveNotification" not in result

    async def test_recalculate_projects_to_overview_subtree(
        self, _notifications_mock: AsyncMock
    ) -> None:
        overview = {
            "unread": {"info": 1, "warning": 0, "alert": 0, "total": 1},
            "archive": {"info": 0, "warning": 0, "alert": 0, "total": 0},
        }
        _notifications_mock.return_value = {"recalculateOverview": overview}
        result = await _notifications_tool()(action="notification", subaction="recalculate")
        validated = ProjectedMutationResult(**result)
        assert validated.data == overview
        assert "recalculateOverview" not in result

    async def test_archive_many_projects_to_overview_subtree(
        self, _notifications_mock: AsyncMock
    ) -> None:
        overview = {
            "unread": {"info": 0, "warning": 0, "alert": 0, "total": 0},
            "archive": {"info": 2, "warning": 0, "alert": 0, "total": 2},
        }
        _notifications_mock.return_value = {"archiveNotifications": overview}
        result = await _notifications_tool()(
            action="notification", subaction="archive_many", notification_ids=["n:1", "n:2"]
        )
        validated = ProjectedMutationResult(**result)
        assert validated.data == overview
        assert "archiveNotifications" not in result


# ---------------------------------------------------------------------------
# Info contract tests
# ---------------------------------------------------------------------------


class TestInfoOverviewContract:
    """info/overview returns {"summary": {...}} with no raw details echo."""

    async def test_overview_has_summary_and_details(self, _info_mock: AsyncMock) -> None:
        _info_mock.return_value = {
            "info": {
                "os": {
                    "platform": "linux",
                    "distro": "Unraid",
                    "release": "6.12.0",
                    "hostname": "tootie",
                    "uptime": 86400,
                    "arch": "x64",
                },
                "cpu": {
                    "manufacturer": "Intel",
                    "brand": "Core i7-9700K",
                    "cores": 8,
                    "threads": 8,
                },
                "memory": {"layout": []},
            }
        }
        result = await _info_tool()(action="system", subaction="overview")
        validated = InfoOverviewResult(**result)
        assert isinstance(validated.summary, dict)
        assert "details" not in result

    async def test_overview_summary_contains_hostname(self, _info_mock: AsyncMock) -> None:
        _info_mock.return_value = {
            "info": {
                "os": {
                    "hostname": "myserver",
                    "distro": "Unraid",
                    "release": "6.12",
                    "platform": "linux",
                    "arch": "x64",
                    "uptime": 100,
                },
                "cpu": {"manufacturer": "AMD", "brand": "Ryzen", "cores": 4, "threads": 8},
                "memory": {"layout": []},
            }
        }
        result = await _info_tool()(action="system", subaction="overview")
        InfoOverviewSummary(**result["summary"])
        assert result["summary"]["hostname"] == "myserver"

    async def test_overview_omits_raw_details_echo(self, _info_mock: AsyncMock) -> None:
        """The full raw info object must not be echoed back as `details`."""
        raw_info = {
            "os": {
                "hostname": "srv",
                "distro": "Unraid",
                "release": "6",
                "platform": "linux",
                "arch": "x64",
            },
            "cpu": {"manufacturer": "Intel", "brand": "Xeon", "cores": 16, "threads": 32},
            "memory": {"layout": []},
            "versions": {"core": {"unraid": "6.12.0", "api": "4.0", "kernel": "6.1"}},
            "machineId": "mid-123",
            "time": "2026-01-01T00:00:00Z",
        }
        _info_mock.return_value = {"info": raw_info}
        result = await _info_tool()(action="system", subaction="overview")
        assert "details" not in result
        # Genuinely-useful scalar fields are folded into the curated summary.
        assert result["summary"]["machine_id"] == "mid-123"
        assert result["summary"]["versions"] == raw_info["versions"]["core"]


class TestInfoArrayContract:
    """info/array returns {"summary": {...}} with health analysis, no raw echo."""

    async def test_array_result_shape(self, _info_mock: AsyncMock) -> None:
        _info_mock.return_value = {
            "array": {
                "id": "array:1",
                "state": "STARTED",
                "capacity": {"kilobytes": {"free": 1000000, "used": 500000, "total": 1500000}},
                "parities": [{"id": "p1", "status": "DISK_OK"}],
                "disks": [{"id": "d1", "status": "DISK_OK"}, {"id": "d2", "status": "DISK_OK"}],
                "caches": [],
                "boot": None,
            }
        }
        result = await _info_tool()(action="system", subaction="array")
        validated = InfoArrayResult(**result)
        assert isinstance(validated.summary, dict)
        assert "details" not in result

    async def test_array_summary_contains_required_fields(self, _info_mock: AsyncMock) -> None:
        _info_mock.return_value = {
            "array": {
                "state": "STARTED",
                "capacity": {"kilobytes": {"free": 500000, "used": 250000, "total": 750000}},
                "parities": [],
                "disks": [{"id": "d1", "status": "DISK_OK"}],
                "caches": [],
            }
        }
        result = await _info_tool()(action="system", subaction="array")
        ArraySummary(**result["summary"])

    async def test_array_health_overall_healthy(self, _info_mock: AsyncMock) -> None:
        _info_mock.return_value = {
            "array": {
                "state": "STARTED",
                "capacity": {"kilobytes": {"free": 1000000, "used": 0, "total": 1000000}},
                "parities": [{"id": "p1", "status": "DISK_OK", "warning": None, "critical": None}],
                "disks": [{"id": "d1", "status": "DISK_OK", "warning": None, "critical": None}],
                "caches": [],
            }
        }
        result = await _info_tool()(action="system", subaction="array")
        assert result["summary"]["overall_health"] == "HEALTHY"

    async def test_array_health_critical_with_failed_disk(self, _info_mock: AsyncMock) -> None:
        _info_mock.return_value = {
            "array": {
                "state": "DEGRADED",
                "capacity": {"kilobytes": {"free": 0, "used": 0, "total": 0}},
                "parities": [{"id": "p1", "status": "DISK_DSBL"}],
                "disks": [],
                "caches": [],
            }
        }
        result = await _info_tool()(action="system", subaction="array")
        assert result["summary"]["overall_health"] == "CRITICAL"


class TestInfoMetricsContract:
    """info/metrics returns {"cpu": {...}, "memory": {...}}."""

    async def test_metrics_result_shape(self, _info_mock: AsyncMock) -> None:
        _info_mock.return_value = {
            "metrics": {
                "cpu": {"percentTotal": 12.5},
                "memory": {
                    "total": 16384,
                    "used": 8192,
                    "free": 4096,
                    "available": 6144,
                    "buffcache": 2048,
                    "percentTotal": 50.0,
                },
            }
        }
        result = await _info_tool()(action="system", subaction="metrics")
        validated = InfoMetricsResult(**result)
        assert validated.cpu is not None
        assert validated.memory is not None

    async def test_metrics_cpu_percent_in_range(self, _info_mock: AsyncMock) -> None:
        _info_mock.return_value = {
            "metrics": {"cpu": {"percentTotal": 75.3}, "memory": {"percentTotal": 60.0}}
        }
        result = await _info_tool()(action="system", subaction="metrics")
        cpu_pct = result["cpu"]["percentTotal"]
        assert 0.0 <= cpu_pct <= 100.0


class TestInfoServicesContract:
    """info/services returns {"services": [...]}."""

    async def test_services_result_shape(self, _info_mock: AsyncMock) -> None:
        _info_mock.return_value = {
            "services": [
                {"name": "nginx", "online": True, "version": "1.25"},
                {"name": "docker", "online": True, "version": "24.0"},
            ]
        }
        result = await _info_tool()(action="system", subaction="services")
        validated = InfoServicesResult(**result)
        for svc in validated.services:
            ServiceEntry(**svc)

    async def test_services_empty_list_is_valid(self, _info_mock: AsyncMock) -> None:
        _info_mock.return_value = {"services": []}
        result = await _info_tool()(action="system", subaction="services")
        InfoServicesResult(**result)
        assert result["services"] == []


class TestInfoOnlineContract:
    """info/online returns {"online": bool|None}."""

    async def test_online_true_shape(self, _info_mock: AsyncMock) -> None:
        _info_mock.return_value = {"online": True}
        result = await _info_tool()(action="system", subaction="online")
        validated = InfoOnlineResult(**result)
        assert validated.online is True

    async def test_online_false_shape(self, _info_mock: AsyncMock) -> None:
        _info_mock.return_value = {"online": False}
        result = await _info_tool()(action="system", subaction="online")
        validated = InfoOnlineResult(**result)
        assert validated.online is False


class TestInfoNetworkContract:
    """info/network returns access URLs and port configuration."""

    async def test_network_result_shape(self, _info_mock: AsyncMock) -> None:
        _info_mock.return_value = {
            "servers": [
                {
                    "id": "s1",
                    "lanip": "192.168.1.10",
                    "wanip": "1.2.3.4",
                    "localurl": "http://tower.local",
                    "remoteurl": "https://myunraid.net/s1",
                }
            ],
            "vars": {"port": 80, "portssl": 443, "localTld": "local", "useSsl": "no"},
        }
        result = await _info_tool()(action="system", subaction="network")
        validated = InfoNetworkResult(**result)
        assert isinstance(validated.accessUrls, list)

    async def test_network_empty_servers_still_valid(self, _info_mock: AsyncMock) -> None:
        _info_mock.return_value = {
            "servers": [],
            "vars": {"port": 80, "portssl": 443, "localTld": "local", "useSsl": "no"},
        }
        result = await _info_tool()(action="system", subaction="network")
        validated = InfoNetworkResult(**result)
        assert validated.accessUrls == []


# ---------------------------------------------------------------------------
# Storage contract tests
# ---------------------------------------------------------------------------


class TestStorageSharesContract:
    """storage/shares returns {"shares": [...]}."""

    async def test_shares_result_shape(self, _storage_mock: AsyncMock) -> None:
        _storage_mock.return_value = {
            "shares": [
                {"id": "share:1", "name": "media", "free": 500000, "used": 100000, "size": 600000},
                {"id": "share:2", "name": "appdata", "free": 200000, "used": 50000, "size": 250000},
            ]
        }
        result = await _storage_tool()(action="disk", subaction="shares")
        validated = StorageSharesResult(**result)
        for share in validated.shares:
            ShareEntry(**share)

    async def test_shares_empty_list_is_valid(self, _storage_mock: AsyncMock) -> None:
        _storage_mock.return_value = {"shares": []}
        result = await _storage_tool()(action="disk", subaction="shares")
        StorageSharesResult(**result)
        assert result["shares"] == []

    async def test_shares_synthesizes_id_from_name(self, _storage_mock: AsyncMock) -> None:
        """The shares query no longer selects `id`; the handler must synthesize
        a stable `id` from `name` (issue #29)."""
        _storage_mock.return_value = {
            "shares": [
                {"name": "media", "free": 500000, "used": 100000, "size": 600000},
                {"name": "appdata", "free": 200000, "used": 50000, "size": 250000},
            ]
        }
        result = await _storage_tool()(action="disk", subaction="shares")
        validated = StorageSharesResult(**result)
        for share in validated.shares:
            # ShareEntry requires a non-null `id` — synthesis must satisfy it.
            entry = ShareEntry(**share)
            assert entry.id == entry.name

    async def test_shares_tolerates_null_id_auto_share(self, _storage_mock: AsyncMock) -> None:
        """Auto-created shares may carry an explicit null `id`; the handler must
        backfill it from `name` rather than propagate the null (issue #29)."""
        _storage_mock.return_value = {
            "shares": [{"id": None, "name": "autoshare", "free": 1, "used": 2, "size": 3}]
        }
        result = await _storage_tool()(action="disk", subaction="shares")
        assert result["shares"][0]["id"] == "autoshare"
        ShareEntry(**result["shares"][0])

    async def test_shares_missing_name_fails_contract(self, _storage_mock: AsyncMock) -> None:
        """A share without required 'name' must fail contract validation."""
        _storage_mock.return_value = {"shares": [{"id": "share:1", "free": 100}]}
        result = await _storage_tool()(action="disk", subaction="shares")
        with pytest.raises(ValidationError):
            ShareEntry(**result["shares"][0])


class TestStorageDisksContract:
    """storage/disks returns {"disks": [...]}."""

    async def test_disks_result_shape(self, _storage_mock: AsyncMock) -> None:
        _storage_mock.return_value = {
            "disks": [
                {"id": "disk:1", "device": "sda", "name": "WD_RED_4TB"},
                {"id": "disk:2", "device": "sdb", "name": "Seagate_8TB"},
            ]
        }
        result = await _storage_tool()(action="disk", subaction="disks")
        validated = StorageDisksResult(**result)
        for disk in validated.disks:
            DiskEntry(**disk)

    async def test_disks_empty_list_is_valid(self, _storage_mock: AsyncMock) -> None:
        _storage_mock.return_value = {"disks": []}
        result = await _storage_tool()(action="disk", subaction="disks")
        StorageDisksResult(**result)
        assert result["disks"] == []


class TestStorageDiskDetailsContract:
    """storage/disk_details returns {"summary": {...}, "details": {...}}."""

    async def test_disk_details_result_shape(self, _storage_mock: AsyncMock) -> None:
        _storage_mock.return_value = {
            "disk": {
                "id": "disk:1",
                "device": "sda",
                "name": "WD_RED_4TB",
                "serialNum": "WD-12345678",
                "size": 4000000000,
                "temperature": 35,
            }
        }
        result = await _storage_tool()(action="disk", subaction="disk_details", disk_id="disk:1")
        validated = StorageDiskDetailsResult(**result)
        assert isinstance(validated.summary, dict)
        assert isinstance(validated.details, dict)

    async def test_disk_details_summary_has_required_fields(self, _storage_mock: AsyncMock) -> None:
        _storage_mock.return_value = {
            "disk": {
                "id": "disk:2",
                "device": "sdb",
                "name": "Seagate",
                "serialNum": "ST-ABC",
                "size": 8000000000,
                "temperature": 40,
            }
        }
        result = await _storage_tool()(action="disk", subaction="disk_details", disk_id="disk:2")
        DiskDetailsSummary(**result["summary"])

    async def test_disk_details_temperature_formatted(self, _storage_mock: AsyncMock) -> None:
        _storage_mock.return_value = {
            "disk": {
                "id": "disk:3",
                "device": "sdc",
                "name": "MyDisk",
                "serialNum": "XYZ",
                "size": 2000000000,
                "temperature": 38,
            }
        }
        result = await _storage_tool()(action="disk", subaction="disk_details", disk_id="disk:3")
        assert "°C" in result["summary"]["temperature"]

    async def test_disk_details_no_temperature_shows_na(self, _storage_mock: AsyncMock) -> None:
        _storage_mock.return_value = {
            "disk": {
                "id": "disk:4",
                "device": "sdd",
                "name": "NoDisk",
                "serialNum": "000",
                "size": 1000000000,
                "temperature": None,
            }
        }
        result = await _storage_tool()(action="disk", subaction="disk_details", disk_id="disk:4")
        assert result["summary"]["temperature"] == "N/A"


class TestStorageLogFilesContract:
    """storage/log_files returns {"log_files": [...]}."""

    async def test_log_files_result_shape(self, _storage_mock: AsyncMock) -> None:
        _storage_mock.return_value = {
            "logFiles": [
                {
                    "name": "syslog",
                    "path": "/var/log/syslog",
                    "size": 1024,
                    "modifiedAt": "2026-03-15",
                },
                {
                    "name": "messages",
                    "path": "/var/log/messages",
                    "size": 512,
                    "modifiedAt": "2026-03-14",
                },
            ]
        }
        result = await _storage_tool()(action="disk", subaction="log_files")
        validated = StorageLogFilesResult(**result)
        for log_file in validated.log_files:
            LogFileEntry(**log_file)

    async def test_log_files_empty_list_is_valid(self, _storage_mock: AsyncMock) -> None:
        _storage_mock.return_value = {"logFiles": []}
        result = await _storage_tool()(action="disk", subaction="log_files")
        StorageLogFilesResult(**result)
        assert result["log_files"] == []


# ---------------------------------------------------------------------------
# Notifications contract tests
# ---------------------------------------------------------------------------


class TestNotificationsOverviewContract:
    """notifications/overview returns {"unread": {...}, "archive": {...}}."""

    async def test_overview_result_shape(self, _notifications_mock: AsyncMock) -> None:
        _notifications_mock.return_value = {
            "notifications": {
                "overview": {
                    "unread": {"info": 2, "warning": 1, "alert": 0, "total": 3},
                    "archive": {"info": 10, "warning": 5, "alert": 2, "total": 17},
                }
            }
        }
        result = await _notifications_tool()(action="notification", subaction="overview")
        validated = NotificationOverviewResult(**result)
        assert validated.unread is not None
        assert validated.archive is not None

    async def test_overview_unread_bucket_conforms(self, _notifications_mock: AsyncMock) -> None:
        _notifications_mock.return_value = {
            "notifications": {
                "overview": {
                    "unread": {"info": 0, "warning": 0, "alert": 1, "total": 1},
                    "archive": {"info": 0, "warning": 0, "alert": 0, "total": 0},
                }
            }
        }
        result = await _notifications_tool()(action="notification", subaction="overview")
        NotificationCountBucket(**result["unread"])
        NotificationCountBucket(**result["archive"])

    async def test_overview_empty_counts_valid(self, _notifications_mock: AsyncMock) -> None:
        _notifications_mock.return_value = {
            "notifications": {
                "overview": {
                    "unread": {"info": 0, "warning": 0, "alert": 0, "total": 0},
                    "archive": {"info": 0, "warning": 0, "alert": 0, "total": 0},
                }
            }
        }
        result = await _notifications_tool()(action="notification", subaction="overview")
        NotificationOverviewResult(**result)


class TestNotificationsListContract:
    """notifications/list returns {"notifications": [...]}."""

    async def test_list_result_shape(self, _notifications_mock: AsyncMock) -> None:
        _notifications_mock.return_value = {
            "notifications": {
                "list": [
                    {
                        "id": "notif:1",
                        "title": "Array degraded",
                        "subject": "Storage alert",
                        "description": "Disk 3 failed",
                        "importance": "ALERT",
                        "type": "UNREAD",
                        "timestamp": 1741000000,
                        "formattedTimestamp": "Mar 15 2026",
                        "link": None,
                    }
                ]
            }
        }
        result = await _notifications_tool()(action="notification", subaction="list")
        validated = NotificationListResult(**result)
        for notif in validated.notifications:
            NotificationEntry(**notif)

    async def test_list_empty_notifications_valid(self, _notifications_mock: AsyncMock) -> None:
        _notifications_mock.return_value = {"notifications": {"list": []}}
        result = await _notifications_tool()(action="notification", subaction="list")
        NotificationListResult(**result)
        assert result["notifications"] == []

    async def test_list_notification_missing_id_fails_contract(
        self, _notifications_mock: AsyncMock
    ) -> None:
        """A notification missing required 'id' field must fail contract validation."""
        _notifications_mock.return_value = {
            "notifications": {"list": [{"title": "No ID here", "importance": "INFO"}]}
        }
        result = await _notifications_tool()(action="notification", subaction="list")
        with pytest.raises(ValidationError):
            NotificationEntry(**result["notifications"][0])


class TestNotificationsCreateContract:
    """notifications/create returns {"success": bool, "notification": {...}}."""

    async def test_create_result_shape(self, _notifications_mock: AsyncMock) -> None:
        _notifications_mock.return_value = {
            "createNotification": {
                "id": "notif:new",
                "title": "Test notification",
                "importance": "INFO",
            }
        }
        result = await _notifications_tool()(
            action="notification",
            subaction="create",
            title="Test notification",
            subject="Test subject",
            description="This is a test",
            importance="INFO",
        )
        validated = NotificationCreateResult(**result)
        assert validated.success is True
        assert "id" in validated.notification

    async def test_create_notification_has_id(self, _notifications_mock: AsyncMock) -> None:
        _notifications_mock.return_value = {
            "createNotification": {"id": "notif:42", "title": "Alert!", "importance": "ALERT"}
        }
        result = await _notifications_tool()(
            action="notification",
            subaction="create",
            title="Alert!",
            subject="Critical issue",
            description="Something went wrong",
            importance="ALERT",
        )
        assert result["notification"]["id"] == "notif:42"
        assert result["notification"]["importance"] == "ALERT"
