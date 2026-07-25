"""Tests for disk subactions of the consolidated unraid tool."""

import posixpath
from collections.abc import Generator
from unittest.mock import AsyncMock, patch

import pytest
from conftest import make_tool_fn

from unraid_mcp.core.exceptions import ToolError
from unraid_mcp.core.utils import (
    coerce_list,
    format_bytes,
    format_kb,
    mutation_success,
    safe_get,
)


# --- Unit tests for helpers ---


class TestCoerceList:
    def test_passthrough_list(self) -> None:
        assert coerce_list([1, 2]) == [1, 2]

    @pytest.mark.parametrize("value", [None, {}, "x", 5, {"a": 1}])
    def test_non_list_becomes_empty(self, value: object) -> None:
        assert coerce_list(value) == []


class TestMutationSuccess:
    @pytest.mark.parametrize(
        ("result", "boolean", "expected"),
        [
            (True, True, True),
            (False, True, False),  # bare-Boolean false => not success
            (None, True, False),
            ({"version": 1}, False, True),  # object present => success
            (None, False, False),  # object null => failure
            ("", False, True),  # an empty string is still a non-null object result
        ],
    )
    def test_derivation(self, result: object, boolean: bool, expected: bool) -> None:
        assert mutation_success(result, boolean=boolean) is expected


class TestFormatBytes:
    def test_none(self) -> None:
        assert format_bytes(None) == "N/A"

    def test_non_finite_floats_return_na(self) -> None:
        # int(inf) raises OverflowError, int(nan) raises ValueError — _coerce_int
        # maps both to None → "N/A" rather than letting them escape.
        assert format_bytes(float("inf")) == "N/A"
        assert format_bytes(float("nan")) == "N/A"

    def test_bytes(self) -> None:
        assert format_bytes(512) == "512.00 B"

    def test_kilobytes(self) -> None:
        assert format_bytes(2048) == "2.00 KB"

    def test_megabytes(self) -> None:
        assert format_bytes(1048576) == "1.00 MB"

    def test_gigabytes(self) -> None:
        assert format_bytes(1073741824) == "1.00 GB"

    def test_terabytes(self) -> None:
        assert format_bytes(1099511627776) == "1.00 TB"


class TestValidatePathBoundary:
    """Pin the boundary-correct prefix check in disk._validate_path.

    The shared helper (exact_or_prefix mode) and disk/flash_backup both rely on
    this: `/boot` and `/boot/...` are allowed, but sibling prefixes like
    `/bootleg` MUST be rejected. This test is the guard that stops a future
    "simplification" from reintroducing the naive startswith("/boot") bug.
    """

    @pytest.mark.parametrize(
        ("path", "allowed"),
        [
            ("/boot", True),  # exact base dir
            ("/boot/", True),  # normalizes to /boot
            ("/boot/config", True),  # under the base
            ("/boot/config/network.cfg", True),  # deeply nested
            ("/bootleg", False),  # sibling sharing the prefix — the bug
            ("/bootleg/x", False),  # sibling subtree
            ("/boot../etc", False),  # prefix-adjacent, not under /boot
            ("/var/log", False),  # unrelated base
        ],
    )
    def test_boot_base_exact_or_prefix(self, path: str, allowed: bool) -> None:
        from unraid_mcp.tools._disk import _validate_path

        if allowed:
            # Returns the normalized path without raising.
            assert _validate_path(
                path, ("/boot",), "source_path", exact_or_prefix=True
            ) == posixpath.normpath(path)
        else:
            with pytest.raises(ToolError, match="source_path must start with one of"):
                _validate_path(path, ("/boot",), "source_path", exact_or_prefix=True)

    @pytest.mark.parametrize(
        ("path", "allowed"),
        [
            ("/var/log", True),  # exact log root allowed in exact_or_prefix mode
            ("/var/log/syslog", True),
            ("/var/logsecret", False),  # sibling sharing the prefix
            ("/boot/logs", True),  # second allowed base
            ("/etc/passwd", False),  # outside every base
        ],
    )
    def test_log_bases_exact_or_prefix(self, path: str, allowed: bool) -> None:
        from unraid_mcp.tools._disk import _validate_path

        bases = ("/var/log", "/boot/logs")
        if allowed:
            assert _validate_path(
                path, bases, "log_path", exact_or_prefix=True
            ) == posixpath.normpath(path)
        else:
            with pytest.raises(ToolError, match="log_path must start with one of"):
                _validate_path(path, bases, "log_path", exact_or_prefix=True)

    def test_empty_prefixes_skips_prefix_check(self) -> None:
        from unraid_mcp.tools._disk import _validate_path

        # Remote rclone destinations have no local prefix restriction, but null
        # bytes and traversal must still be rejected.
        assert (
            _validate_path("remote:backups/flash", (), "destination_path") == "remote:backups/flash"
        )
        # A relative path that normalizes to a leading `..` still trips traversal.
        with pytest.raises(ToolError, match="path traversal"):
            _validate_path("a/../../etc", (), "destination_path")
        with pytest.raises(ToolError, match="null bytes"):
            _validate_path("ok\x00bad", (), "destination_path")


# --- Integration tests ---


@pytest.fixture
def _mock_graphql() -> Generator[AsyncMock, None, None]:
    with patch("unraid_mcp.core.client.make_graphql_request", new_callable=AsyncMock) as mock:
        yield mock


def _make_tool():
    return make_tool_fn("unraid_mcp.tools.unraid", "register_unraid_tool", "unraid")


class TestStorageValidation:
    async def test_disk_details_requires_disk_id(self, _mock_graphql: AsyncMock) -> None:
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="disk_id"):
            await tool_fn(action="disk", subaction="disk_details")

    async def test_logs_requires_log_path(self, _mock_graphql: AsyncMock) -> None:
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="log_path"):
            await tool_fn(action="disk", subaction="logs")
        _mock_graphql.assert_not_awaited()

    async def test_logs_rejects_invalid_path(self, _mock_graphql: AsyncMock) -> None:
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="log_path must start with"):
            await tool_fn(action="disk", subaction="logs", log_path="/etc/shadow")
        _mock_graphql.assert_not_awaited()

    async def test_logs_rejects_path_traversal(self, _mock_graphql: AsyncMock) -> None:
        tool_fn = _make_tool()
        # Traversal that escapes /var/log/ — detected by early .. check
        with pytest.raises(ToolError, match="log_path"):
            await tool_fn(action="disk", subaction="logs", log_path="/var/log/../../etc/shadow")
        # Traversal via .. — detected by early .. check
        with pytest.raises(ToolError, match="log_path"):
            await tool_fn(action="disk", subaction="logs", log_path="/var/log/../etc/passwd")
        _mock_graphql.assert_not_awaited()

    async def test_logs_allows_valid_paths(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {"logFile": {"path": "/var/log/syslog", "content": "ok"}}
        tool_fn = _make_tool()
        result = await tool_fn(action="disk", subaction="logs", log_path="/var/log/syslog")
        assert result["content"] == "ok"

    async def test_logs_tail_lines_too_large(self, _mock_graphql: AsyncMock) -> None:
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="tail_lines must be between"):
            await tool_fn(
                action="disk", subaction="logs", log_path="/var/log/syslog", tail_lines=10_001
            )
        _mock_graphql.assert_not_awaited()

    async def test_logs_tail_lines_zero_rejected(self, _mock_graphql: AsyncMock) -> None:
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="tail_lines must be between"):
            await tool_fn(action="disk", subaction="logs", log_path="/var/log/syslog", tail_lines=0)
        _mock_graphql.assert_not_awaited()

    async def test_logs_tail_lines_at_max_accepted(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {"logFile": {"path": "/var/log/syslog", "content": "ok"}}
        tool_fn = _make_tool()
        result = await tool_fn(
            action="disk", subaction="logs", log_path="/var/log/syslog", tail_lines=10_000
        )
        assert result["content"] == "ok"

    async def test_non_logs_action_ignores_tail_lines_validation(
        self, _mock_graphql: AsyncMock
    ) -> None:
        _mock_graphql.return_value = {"shares": []}
        tool_fn = _make_tool()
        result = await tool_fn(action="disk", subaction="shares", tail_lines=0)
        assert result["shares"] == []


class TestFormatKb:
    def test_none_returns_na(self) -> None:
        assert format_kb(None) == "N/A"

    def test_invalid_string_returns_na(self) -> None:
        assert format_kb("not-a-number") == "N/A"

    def test_kilobytes_range(self) -> None:
        assert format_kb(512) == "512.00 KB"

    def test_megabytes_range(self) -> None:
        assert format_kb(2048) == "2.00 MB"

    def test_gigabytes_range(self) -> None:
        assert format_kb(1_048_576) == "1.00 GB"

    def test_terabytes_range(self) -> None:
        assert format_kb(1_073_741_824) == "1.00 TB"

    def test_boundary_exactly_1024_kb(self) -> None:
        # 1024 KB = 1 MB
        assert format_kb(1024) == "1.00 MB"


class TestSafeGet:
    def test_simple_key_access(self) -> None:
        assert safe_get({"a": 1}, "a") == 1

    def test_nested_key_access(self) -> None:
        assert safe_get({"a": {"b": "val"}}, "a", "b") == "val"

    def test_missing_key_returns_none(self) -> None:
        assert safe_get({"a": 1}, "missing") is None

    def test_none_intermediate_returns_default(self) -> None:
        assert safe_get({"a": None}, "a", "b") is None

    def test_custom_default_returned(self) -> None:
        assert safe_get({}, "x", default="fallback") == "fallback"

    def test_non_dict_intermediate_returns_default(self) -> None:
        assert safe_get({"a": "string"}, "a", "b") is None

    def test_empty_list_default(self) -> None:
        result = safe_get({}, "missing", default=[])
        assert result == []

    def test_zero_value_not_replaced_by_default(self) -> None:
        assert safe_get({"temp": 0}, "temp", default="N/A") == 0

    def test_false_value_not_replaced_by_default(self) -> None:
        assert safe_get({"active": False}, "active", default=True) is False

    def test_empty_string_not_replaced_by_default(self) -> None:
        assert safe_get({"name": ""}, "name", default="unknown") == ""


class TestStorageActions:
    async def test_shares(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {
            "shares": [{"id": "s:1", "name": "media"}, {"id": "s:2", "name": "backups"}]
        }
        tool_fn = _make_tool()
        result = await tool_fn(action="disk", subaction="shares")
        assert len(result["shares"]) == 2

    async def test_disks(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {"disks": [{"id": "d:1", "device": "sda"}]}
        tool_fn = _make_tool()
        result = await tool_fn(action="disk", subaction="disks")
        assert len(result["disks"]) == 1


class TestStorageListCaps:
    """disk/shares and disk/disks cap large lists via cap_list and surface page meta."""

    @staticmethod
    def _shares(n: int) -> dict:
        return {"shares": [{"name": f"share{i}"} for i in range(n)]}

    @staticmethod
    def _disks(n: int) -> dict:
        return {"disks": [{"id": f"d:{i}", "device": f"sd{i}"} for i in range(n)]}

    async def test_shares_default_cap(self, _mock_graphql: AsyncMock) -> None:
        # Tool param default is 20.
        _mock_graphql.return_value = self._shares(75)
        result = await _make_tool()(action="disk", subaction="shares")
        assert len(result["shares"]) == 20
        assert result["page"]["truncated"] is True
        assert result["page"]["total"] == 75
        assert result["page"]["returned"] == 20

    async def test_shares_caps_after_id_synthesis(self, _mock_graphql: AsyncMock) -> None:
        # The synthesized id must be present on the returned (capped) rows.
        _mock_graphql.return_value = self._shares(75)
        result = await _make_tool()(action="disk", subaction="shares", limit=3)
        assert len(result["shares"]) == 3
        assert [s["id"] for s in result["shares"]] == ["share0", "share1", "share2"]

    async def test_shares_limit_widens(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = self._shares(75)
        result = await _make_tool()(action="disk", subaction="shares", limit=60)
        assert len(result["shares"]) == 60
        assert result["page"]["truncated"] is True

    async def test_shares_limit_zero_returns_all(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = self._shares(75)
        result = await _make_tool()(action="disk", subaction="shares", limit=0)
        assert len(result["shares"]) == 75
        assert result["page"]["truncated"] is False

    async def test_disks_default_cap(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = self._disks(40)
        result = await _make_tool()(action="disk", subaction="disks")
        assert len(result["disks"]) == 20
        assert result["page"]["truncated"] is True
        assert result["page"]["total"] == 40

    async def test_disks_limit_narrows(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = self._disks(40)
        result = await _make_tool()(action="disk", subaction="disks", limit=5)
        assert len(result["disks"]) == 5

    async def test_disks_limit_zero_returns_all(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = self._disks(40)
        result = await _make_tool()(action="disk", subaction="disks", limit=0)
        assert len(result["disks"]) == 40
        assert result["page"]["truncated"] is False

    async def test_disks_small_list_not_truncated(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = self._disks(3)
        result = await _make_tool()(action="disk", subaction="disks")
        assert len(result["disks"]) == 3
        assert result["page"]["truncated"] is False
        assert "hint" not in result["page"]

    async def test_disk_details(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {
            "disk": {
                "id": "d:1",
                "device": "sda",
                "name": "WD",
                "serialNum": "SN1",
                "size": 1073741824,
                "temperature": 35,
            }
        }
        tool_fn = _make_tool()
        result = await tool_fn(action="disk", subaction="disk_details", disk_id="d:1")
        assert result["summary"]["temperature"] == "35\u00b0C"
        assert "1.00 GB" in result["summary"]["size_formatted"]

    async def test_disk_details_temperature_zero(self, _mock_graphql: AsyncMock) -> None:
        """Temperature of 0 should display as '0\u00b0C', not 'N/A'."""
        _mock_graphql.return_value = {
            "disk": {
                "id": "d:1",
                "device": "sda",
                "name": "WD",
                "serialNum": "SN1",
                "size": 1073741824,
                "temperature": 0,
            }
        }
        tool_fn = _make_tool()
        result = await tool_fn(action="disk", subaction="disk_details", disk_id="d:1")
        assert result["summary"]["temperature"] == "0\u00b0C"

    async def test_disk_details_temperature_null(self, _mock_graphql: AsyncMock) -> None:
        """Null temperature should display as 'N/A'."""
        _mock_graphql.return_value = {
            "disk": {
                "id": "d:1",
                "device": "sda",
                "name": "WD",
                "serialNum": "SN1",
                "size": 1073741824,
                "temperature": None,
            }
        }
        tool_fn = _make_tool()
        result = await tool_fn(action="disk", subaction="disk_details", disk_id="d:1")
        assert result["summary"]["temperature"] == "N/A"

    async def test_logs_null_log_file(self, _mock_graphql: AsyncMock) -> None:
        """logFile being null should raise ToolError, not return an empty dict."""
        _mock_graphql.return_value = {"logFile": None}
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="Log file not found or inaccessible"):
            await tool_fn(action="disk", subaction="logs", log_path="/var/log/syslog")

    async def test_logs_empty_log_file_payload_raises(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {"logFile": {}}
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="Log file not found or inaccessible"):
            await tool_fn(action="disk", subaction="logs", log_path="/var/log/syslog")

    async def test_disk_details_not_found(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {"disk": None}
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="not found"):
            await tool_fn(action="disk", subaction="disk_details", disk_id="d:missing")

    async def test_log_files(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {"logFiles": [{"name": "syslog", "path": "/var/log/syslog"}]}
        tool_fn = _make_tool()
        result = await tool_fn(action="disk", subaction="log_files")
        assert len(result["log_files"]) == 1

    async def test_logs(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {
            "logFile": {"path": "/var/log/syslog", "content": "log line", "totalLines": 1}
        }
        tool_fn = _make_tool()
        result = await tool_fn(action="disk", subaction="logs", log_path="/var/log/syslog")
        assert result["content"] == "log line"

    async def test_logs_level_filter_counts(self, _mock_graphql: AsyncMock) -> None:
        """matchedLines counts only severity matches; returnedLines adds context (#48)."""
        content = "\n".join(
            [
                "line0 info",
                "line1 info",
                "line2 [ERROR] boom",
                "line3 info",
                "line4 info",
            ]
        )
        _mock_graphql.return_value = {
            "logFile": {"path": "/var/log/syslog", "content": content, "totalLines": 5}
        }
        tool_fn = _make_tool()
        result = await tool_fn(
            action="disk",
            subaction="logs",
            log_path="/var/log/syslog",
            level="error",
            context=2,
        )
        # only the single [ERROR] line matched the severity filter
        assert result["matchedLines"] == 1
        # match + 2 lines context on each side → 5 real lines returned
        assert result["returnedLines"] == 5
        assert result["matchedLines"] < result["returnedLines"]
        assert result["filter"] == {"level": "error", "context": 2}

    async def test_logs_level_filter_excludes_separators(self, _mock_graphql: AsyncMock) -> None:
        """returnedLines excludes the '---' markers between non-contiguous groups (#48)."""
        content = "\n".join(
            [
                "[ERROR] a",
                "b",
                "c",
                "d",
                "e",
                "f",
                "[ERROR] g",
            ]
        )
        _mock_graphql.return_value = {
            "logFile": {"path": "/var/log/syslog", "content": content, "totalLines": 7}
        }
        tool_fn = _make_tool()
        result = await tool_fn(
            action="disk",
            subaction="logs",
            log_path="/var/log/syslog",
            level="error",
            context=1,
        )
        # two matching lines; groups [0..1] and [5..6] → 4 real lines + one "---"
        assert result["matchedLines"] == 2
        assert "---" in result["content"]
        assert result["returnedLines"] == 4


class TestStorageNetworkErrors:
    """Tests for network-level failures in storage operations."""

    async def test_logs_json_decode_error(self, _mock_graphql: AsyncMock) -> None:
        """Invalid JSON response when reading logs should propagate as ToolError."""
        _mock_graphql.side_effect = ToolError(
            "Invalid JSON response from Unraid API: Expecting value: line 1 column 1"
        )
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="Invalid JSON"):
            await tool_fn(action="disk", subaction="logs", log_path="/var/log/syslog")

    async def test_shares_connection_refused(self, _mock_graphql: AsyncMock) -> None:
        """Connection refused when listing shares should propagate as ToolError."""
        _mock_graphql.side_effect = ToolError(
            "Network connection error: [Errno 111] Connection refused"
        )
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="Connection refused"):
            await tool_fn(action="disk", subaction="shares")

    async def test_disks_http_500(self, _mock_graphql: AsyncMock) -> None:
        """HTTP 500 when listing disks should propagate as ToolError."""
        _mock_graphql.side_effect = ToolError("HTTP error 500: Internal Server Error")
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="HTTP error 500"):
            await tool_fn(action="disk", subaction="disks")


class TestStorageFlashBackup:
    async def test_flash_backup_requires_confirm(self, _mock_graphql: AsyncMock) -> None:
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="not confirmed"):
            await tool_fn(
                action="disk",
                subaction="flash_backup",
                remote_name="r",
                source_path="/boot",
                destination_path="r:b",
            )

    async def test_flash_backup_requires_remote_name(self, _mock_graphql: AsyncMock) -> None:
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="remote_name"):
            await tool_fn(action="disk", subaction="flash_backup", confirm=True)

    async def test_flash_backup_requires_source_path(self, _mock_graphql: AsyncMock) -> None:
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="source_path"):
            await tool_fn(action="disk", subaction="flash_backup", confirm=True, remote_name="r")

    async def test_flash_backup_requires_destination_path(self, _mock_graphql: AsyncMock) -> None:
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="destination_path"):
            await tool_fn(
                action="disk",
                subaction="flash_backup",
                confirm=True,
                remote_name="r",
                source_path="/boot",
            )

    async def test_flash_backup_success(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {"initiateFlashBackup": {"status": "started", "jobId": "j:1"}}
        tool_fn = _make_tool()
        result = await tool_fn(
            action="disk",
            subaction="flash_backup",
            confirm=True,
            remote_name="r",
            source_path="/boot",
            destination_path="r:b",
        )
        assert result["success"] is True
        assert result["data"]["status"] == "started"

    async def test_flash_backup_passes_options(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {"initiateFlashBackup": {"status": "started", "jobId": "j:2"}}
        tool_fn = _make_tool()
        await tool_fn(
            action="disk",
            subaction="flash_backup",
            confirm=True,
            remote_name="r",
            source_path="/boot",
            destination_path="r:b",
            backup_options={"dryRun": True},
        )
        assert _mock_graphql.call_args[0][1]["input"]["options"] == {"dryRun": True}


class TestLogsFiltering:
    """Severity/context filtering on disk/logs (issue #26)."""

    _CONTENT = "line0 info\nline1 info\nline2 [ERROR] boom\nline3 info\nline4 info"

    async def test_logs_no_level_returns_full_content(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {
            "logFile": {"path": "/var/log/syslog", "content": self._CONTENT}
        }
        tool_fn = _make_tool()
        result = await tool_fn(action="disk", subaction="logs", log_path="/var/log/syslog")
        assert result["content"] == self._CONTENT
        assert "matchedLines" not in result

    async def test_logs_level_filters_content(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {
            "logFile": {"path": "/var/log/syslog", "content": self._CONTENT}
        }
        tool_fn = _make_tool()
        result = await tool_fn(
            action="disk",
            subaction="logs",
            log_path="/var/log/syslog",
            level="error",
            context=1,
        )
        # match at line2, context 1 → lines 1..3
        assert result["content"] == "line1 info\nline2 [ERROR] boom\nline3 info"
        # only the single [ERROR] line matched the severity filter (#48)
        assert result["matchedLines"] == 1
        assert result["returnedLines"] == 3
        assert result["filter"] == {"level": "error", "context": 1}

    async def test_logs_level_no_match(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {
            "logFile": {"path": "/var/log/syslog", "content": "info: a\ninfo: b"}
        }
        tool_fn = _make_tool()
        result = await tool_fn(
            action="disk", subaction="logs", log_path="/var/log/syslog", level="error"
        )
        assert result["content"] == ""
        assert result["matchedLines"] == 0
