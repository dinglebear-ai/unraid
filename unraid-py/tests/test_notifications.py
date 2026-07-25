"""Tests for notification subactions of the consolidated unraid tool."""

import json
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


class TestNotificationsValidation:
    async def test_delete_requires_confirm(self, _mock_graphql: AsyncMock) -> None:
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="not confirmed"):
            await tool_fn(
                action="notification",
                subaction="delete",
                notification_id="n:1",
                notification_type="UNREAD",
            )

    async def test_delete_archived_requires_confirm(self, _mock_graphql: AsyncMock) -> None:
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="not confirmed"):
            await tool_fn(action="notification", subaction="delete_archived")

    async def test_create_requires_fields(self, _mock_graphql: AsyncMock) -> None:
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="requires title"):
            await tool_fn(action="notification", subaction="create")

    async def test_archive_requires_id(self, _mock_graphql: AsyncMock) -> None:
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="notification_id"):
            await tool_fn(action="notification", subaction="archive")

    async def test_delete_requires_id_and_type(self, _mock_graphql: AsyncMock) -> None:
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="requires notification_id"):
            await tool_fn(action="notification", subaction="delete", confirm=True)


class TestNotificationsActions:
    async def test_overview(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {
            "notifications": {
                "overview": {
                    "unread": {"info": 5, "warning": 2, "alert": 0, "total": 7},
                    "archive": {"info": 10, "warning": 1, "alert": 0, "total": 11},
                }
            }
        }
        tool_fn = _make_tool()
        result = await tool_fn(action="notification", subaction="overview")
        assert result["unread"]["total"] == 7

    async def test_list(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {
            "notifications": {"list": [{"id": "n:1", "title": "Test", "importance": "INFO"}]}
        }
        tool_fn = _make_tool()
        result = await tool_fn(action="notification", subaction="list")
        assert len(result["notifications"]) == 1

    async def test_create(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {
            "createNotification": {"id": "n:new", "title": "Test", "importance": "INFO"}
        }
        tool_fn = _make_tool()
        result = await tool_fn(
            action="notification",
            subaction="create",
            title="Test",
            subject="Test Subject",
            description="Test Desc",
            importance="info",
        )
        assert result["success"] is True

    async def test_archive_notification(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {"archiveNotification": {"id": "n:1"}}
        tool_fn = _make_tool()
        result = await tool_fn(action="notification", subaction="archive", notification_id="n:1")
        assert result["success"] is True
        # data is projected to the archiveNotification subtree, not the raw blob.
        assert result["data"] == {"id": "n:1"}
        assert "archiveNotification" not in result

    async def test_delete_with_confirm(self, _mock_graphql: AsyncMock) -> None:
        overview = {
            "unread": {"info": 0, "warning": 0, "alert": 0, "total": 0},
            "archive": {"info": 0, "warning": 0, "alert": 0, "total": 0},
        }
        _mock_graphql.return_value = {"deleteNotification": overview}
        tool_fn = _make_tool()
        result = await tool_fn(
            action="notification",
            subaction="delete",
            notification_id="n:1",
            notification_type="unread",
            confirm=True,
        )
        assert result["success"] is True
        # data is projected to the deleteNotification subtree, not the raw blob.
        assert result["data"] == overview
        assert "deleteNotification" not in result

    async def test_archive_all(self, _mock_graphql: AsyncMock) -> None:
        overview = {
            "unread": {"info": 0, "warning": 0, "alert": 0, "total": 0},
            "archive": {"info": 0, "warning": 0, "alert": 0, "total": 1},
        }
        _mock_graphql.return_value = {"archiveAll": overview}
        tool_fn = _make_tool()
        result = await tool_fn(action="notification", subaction="archive_all")
        assert result["success"] is True
        # data is projected to the archiveAll subtree, not the raw blob.
        assert result["data"] == overview
        assert "archiveAll" not in result

    async def test_mark_unread_notification(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {"unreadNotification": {"id": "n:1"}}
        tool_fn = _make_tool()
        result = await tool_fn(
            action="notification", subaction="mark_unread", notification_id="n:1"
        )
        assert result["success"] is True
        assert result["subaction"] == "mark_unread"
        # data is projected to the unreadNotification subtree, not the raw blob.
        assert result["data"] == {"id": "n:1"}
        assert "unreadNotification" not in result

    async def test_list_with_importance_filter(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {
            "notifications": {"list": [{"id": "n:1", "title": "Alert", "importance": "WARNING"}]}
        }
        tool_fn = _make_tool()
        result = await tool_fn(
            action="notification", subaction="list", importance="warning", limit=10, offset=5
        )
        assert len(result["notifications"]) == 1
        call_args = _mock_graphql.call_args
        filter_var = call_args[0][1]["filter"]
        assert filter_var["importance"] == "WARNING"
        assert filter_var["limit"] == 10
        assert filter_var["offset"] == 5

    async def test_list_limit_clamped_to_max(self, _mock_graphql: AsyncMock) -> None:
        """A huge caller limit must be clamped so it can't dump thousands of rows."""
        from unraid_mcp.tools._notification import _MAX_NOTIFICATION_LIMIT

        _mock_graphql.return_value = {"notifications": {"list": []}}
        tool_fn = _make_tool()
        await tool_fn(action="notification", subaction="list", limit=5000)
        filter_var = _mock_graphql.call_args[0][1]["filter"]
        assert filter_var["limit"] == _MAX_NOTIFICATION_LIMIT

    async def test_list_limit_zero_uses_max(self, _mock_graphql: AsyncMock) -> None:
        from unraid_mcp.tools._notification import _MAX_NOTIFICATION_LIMIT

        _mock_graphql.return_value = {"notifications": {"list": []}}
        tool_fn = _make_tool()
        await tool_fn(action="notification", subaction="list", limit=0)
        filter_var = _mock_graphql.call_args[0][1]["filter"]
        assert filter_var["limit"] == _MAX_NOTIFICATION_LIMIT

    async def test_delete_archived(self, _mock_graphql: AsyncMock) -> None:
        overview = {
            "unread": {"info": 0, "warning": 0, "alert": 0, "total": 0},
            "archive": {"info": 0, "warning": 0, "alert": 0, "total": 0},
        }
        _mock_graphql.return_value = {"deleteArchivedNotifications": overview}
        tool_fn = _make_tool()
        result = await tool_fn(action="notification", subaction="delete_archived", confirm=True)
        assert result["success"] is True
        assert result["subaction"] == "delete_archived"
        # data is projected to the deleteArchivedNotifications subtree, not the blob.
        assert result["data"] == overview
        assert "deleteArchivedNotifications" not in result

    async def test_generic_exception_wraps(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.side_effect = RuntimeError("boom")
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="Internal error executing notification/overview"):
            await tool_fn(action="notification", subaction="overview")


class TestNotificationsCreateValidation:
    """Tests for importance enum and field length validation added in this PR."""

    async def test_invalid_importance_rejected(self, _mock_graphql: AsyncMock) -> None:
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="Invalid importance"):
            await tool_fn(
                action="notification",
                subaction="create",
                title="T",
                subject="S",
                description="D",
                importance="invalid",
            )

    async def test_normal_importance_rejected(self, _mock_graphql: AsyncMock) -> None:
        """NORMAL is not a valid GraphQL NotificationImportance value (INFO/WARNING/ALERT are)."""
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="Invalid importance"):
            await tool_fn(
                action="notification",
                subaction="create",
                title="T",
                subject="S",
                description="D",
                importance="normal",
            )

    async def test_alert_importance_accepted(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {"createNotification": {"id": "n:1", "importance": "ALERT"}}
        tool_fn = _make_tool()
        result = await tool_fn(
            action="notification",
            subaction="create",
            title="T",
            subject="S",
            description="D",
            importance="alert",
        )
        assert result["success"] is True

    async def test_title_too_long_rejected(self, _mock_graphql: AsyncMock) -> None:
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="title must be at most 200"):
            await tool_fn(
                action="notification",
                subaction="create",
                title="x" * 201,
                subject="S",
                description="D",
                importance="info",
            )

    async def test_subject_too_long_rejected(self, _mock_graphql: AsyncMock) -> None:
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="subject must be at most 500"):
            await tool_fn(
                action="notification",
                subaction="create",
                title="T",
                subject="x" * 501,
                description="D",
                importance="info",
            )

    async def test_description_too_long_rejected(self, _mock_graphql: AsyncMock) -> None:
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="description must be at most 2000"):
            await tool_fn(
                action="notification",
                subaction="create",
                title="T",
                subject="S",
                description="x" * 2001,
                importance="info",
            )

    async def test_title_at_max_accepted(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {"createNotification": {"id": "n:1", "importance": "INFO"}}
        tool_fn = _make_tool()
        result = await tool_fn(
            action="notification",
            subaction="create",
            title="x" * 200,
            subject="S",
            description="D",
            importance="info",
        )
        assert result["success"] is True


class TestNewNotificationMutations:
    async def test_archive_many_success(self, _mock_graphql: AsyncMock) -> None:
        overview = {
            "unread": {"info": 0, "warning": 0, "alert": 0, "total": 0},
            "archive": {"info": 2, "warning": 0, "alert": 0, "total": 2},
        }
        _mock_graphql.return_value = {"archiveNotifications": overview}
        tool_fn = _make_tool()
        result = await tool_fn(
            action="notification", subaction="archive_many", notification_ids=["n:1", "n:2"]
        )
        assert result["success"] is True
        # data is projected to the archiveNotifications subtree, not the raw blob.
        assert result["data"] == overview
        assert "archiveNotifications" not in result
        call_args = _mock_graphql.call_args
        assert call_args[0][1] == {"ids": ["n:1", "n:2"]}

    async def test_archive_many_requires_ids(self, _mock_graphql: AsyncMock) -> None:
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="notification_ids"):
            await tool_fn(action="notification", subaction="archive_many")

    async def test_unarchive_many_success(self, _mock_graphql: AsyncMock) -> None:
        overview = {
            "unread": {"info": 2, "warning": 0, "alert": 0, "total": 2},
            "archive": {"info": 0, "warning": 0, "alert": 0, "total": 0},
        }
        _mock_graphql.return_value = {"unarchiveNotifications": overview}
        tool_fn = _make_tool()
        result = await tool_fn(
            action="notification", subaction="unarchive_many", notification_ids=["n:1", "n:2"]
        )
        assert result["success"] is True
        # data is projected to the unarchiveNotifications subtree, not the raw blob.
        assert result["data"] == overview
        assert "unarchiveNotifications" not in result

    async def test_unarchive_many_requires_ids(self, _mock_graphql: AsyncMock) -> None:
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="notification_ids"):
            await tool_fn(action="notification", subaction="unarchive_many")

    async def test_unarchive_all_success(self, _mock_graphql: AsyncMock) -> None:
        overview = {
            "unread": {"info": 5, "warning": 1, "alert": 0, "total": 6},
            "archive": {"info": 0, "warning": 0, "alert": 0, "total": 0},
        }
        _mock_graphql.return_value = {"unarchiveAll": overview}
        tool_fn = _make_tool()
        result = await tool_fn(action="notification", subaction="unarchive_all")
        assert result["success"] is True
        # data is projected to the unarchiveAll subtree, not the raw blob.
        assert result["data"] == overview
        assert "unarchiveAll" not in result

    async def test_unarchive_all_with_importance(self, _mock_graphql: AsyncMock) -> None:
        """Lowercase importance input must be uppercased before being sent to GraphQL."""
        _mock_graphql.return_value = {
            "unarchiveAll": {"unread": {"total": 1}, "archive": {"total": 0}}
        }
        tool_fn = _make_tool()
        await tool_fn(action="notification", subaction="unarchive_all", importance="warning")
        call_args = _mock_graphql.call_args
        assert call_args[0][1] == {"importance": "WARNING"}

    async def test_recalculate_success(self, _mock_graphql: AsyncMock) -> None:
        overview = {
            "unread": {"info": 3, "warning": 1, "alert": 0, "total": 4},
            "archive": {"info": 10, "warning": 0, "alert": 0, "total": 10},
        }
        _mock_graphql.return_value = {"recalculateOverview": overview}
        tool_fn = _make_tool()
        result = await tool_fn(action="notification", subaction="recalculate")
        assert result["success"] is True
        # data is projected to the recalculateOverview subtree, not the raw blob.
        assert result["data"] == overview
        assert "recalculateOverview" not in result


class TestNotificationsListResponseSize:
    """Response-size safety for notification/list (findings T-H3 / P-M1).

    A 200-row payload measures ~114 KB — over the 40 KB response cap — so the
    list must be bounded by cap_list (tool default) rather than the fixed 200
    clamp. This test fails on the old 200-clamp behavior and passes once
    notification/list routes through cap_list.
    """

    async def test_list_default_response_under_cap(self, _mock_graphql: AsyncMock) -> None:
        from unraid_mcp.config.settings import UNRAID_MCP_MAX_RESPONSE_BYTES
        from unraid_mcp.tools._notification import _MAX_NOTIFICATION_LIMIT

        # Build ~200 realistic rows with long title/subject/description so the
        # raw payload exceeds the response cap if returned in full.
        rows = [
            {
                "id": f"notification:{i:04d}",
                "title": f"Container health degraded on appdata share #{i} " + ("x" * 60),
                "subject": f"Docker container restarted unexpectedly ({i}) " + ("y" * 80),
                "description": (
                    "The monitoring subsystem detected repeated restarts and "
                    "elevated error rates for this service. " + ("z" * 200)
                ),
                "importance": "WARNING",
                "link": f"/dashboard/notifications/{i}",
                "type": "UNREAD",
                "timestamp": "2026-06-20T12:00:00.000Z",
                "formattedTimestamp": "Jun 20, 2026 12:00 PM",
            }
            for i in range(_MAX_NOTIFICATION_LIMIT)
        ]
        _mock_graphql.return_value = {"notifications": {"list": rows}}

        tool_fn = _make_tool()
        result = await tool_fn(action="notification", subaction="list")

        size = len(json.dumps(result).encode())
        assert size <= UNRAID_MCP_MAX_RESPONSE_BYTES, (
            f"notification/list response is {size} bytes, over the "
            f"{UNRAID_MCP_MAX_RESPONSE_BYTES} byte cap"
        )
        # Bounded by the tool default, with truncation surfaced via page meta.
        assert len(result["notifications"]) < _MAX_NOTIFICATION_LIMIT
        assert result["page"]["truncated"] is True
        assert result["page"]["total"] == _MAX_NOTIFICATION_LIMIT
