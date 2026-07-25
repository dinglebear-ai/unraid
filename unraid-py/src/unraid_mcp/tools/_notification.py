"""Notification domain handler for the Unraid MCP tool.

Covers: overview, list, create, notify_if_unique, archive, mark_unread, recalculate,
archive_all, archive_many, unarchive_many, unarchive_all, delete*, delete_archived* (13 subactions).
"""

from typing import Any

from fastmcp import Context

from ..config.logging import logger
from ..core import client as _client
from ..core.exceptions import ToolError, tool_error_handler
from ..core.guards import gate_destructive_action
from ..core.pagination import cap_list
from ..core.utils import coerce_list, safe_get, validate_subaction


# ===========================================================================
# NOTIFICATION
# ===========================================================================

_NOTIFICATION_QUERIES: dict[str, str] = {
    "overview": "query GetNotificationsOverview { notifications { overview { unread { info warning alert total } archive { info warning alert total } } } }",
    "list": "query ListNotifications($filter: NotificationFilter!) { notifications { list(filter: $filter) { id title subject description importance link type timestamp formattedTimestamp } } }",
}

_NOTIFICATION_MUTATIONS: dict[str, str] = {
    "create": "mutation CreateNotification($input: NotificationData!) { createNotification(input: $input) { id title importance } }",
    "archive": "mutation ArchiveNotification($id: PrefixedID!) { archiveNotification(id: $id) { id title importance } }",
    "mark_unread": "mutation UnreadNotification($id: PrefixedID!) { unreadNotification(id: $id) { id title importance } }",
    "delete": "mutation DeleteNotification($id: PrefixedID!, $type: NotificationType!) { deleteNotification(id: $id, type: $type) { unread { info warning alert total } archive { info warning alert total } } }",
    "delete_archived": "mutation DeleteArchivedNotifications { deleteArchivedNotifications { unread { info warning alert total } archive { info warning alert total } } }",
    "archive_all": "mutation ArchiveAllNotifications($importance: NotificationImportance) { archiveAll(importance: $importance) { unread { info warning alert total } archive { info warning alert total } } }",
    "archive_many": "mutation ArchiveNotifications($ids: [PrefixedID!]!) { archiveNotifications(ids: $ids) { unread { info warning alert total } archive { info warning alert total } } }",
    "unarchive_many": "mutation UnarchiveNotifications($ids: [PrefixedID!]!) { unarchiveNotifications(ids: $ids) { unread { info warning alert total } archive { info warning alert total } } }",
    "unarchive_all": "mutation UnarchiveAll($importance: NotificationImportance) { unarchiveAll(importance: $importance) { unread { info warning alert total } archive { info warning alert total } } }",
    "recalculate": "mutation RecalculateOverview { recalculateOverview { unread { info warning alert total } archive { info warning alert total } } }",
    "notify_if_unique": "mutation NotifyIfUnique($input: NotificationData!) { notifyIfUnique(input: $input) { id title importance } }",
}

_NOTIFICATION_SUBACTIONS: set[str] = set(_NOTIFICATION_QUERIES) | set(_NOTIFICATION_MUTATIONS)
_NOTIFICATION_DESTRUCTIVE: set[str] = {"delete", "delete_archived"}

# Maps each mutation subaction to the top-level GraphQL result field it returns,
# so the handler can project to that subtree instead of echoing the whole `data`
# blob (which would leak the operation name and inflate the response). The
# create/notify_if_unique branches are handled separately because they have
# bespoke success/duplicate shapes.
_NOTIFICATION_RESULT_FIELD: dict[str, str] = {
    "archive": "archiveNotification",
    "mark_unread": "unreadNotification",
    "delete": "deleteNotification",
    "delete_archived": "deleteArchivedNotifications",
    "archive_all": "archiveAll",
    "archive_many": "archiveNotifications",
    "unarchive_many": "unarchiveNotifications",
    "unarchive_all": "unarchiveAll",
    "recalculate": "recalculateOverview",
}
_VALID_IMPORTANCE = frozenset({"ALERT", "WARNING", "INFO"})
_VALID_LIST_TYPES = frozenset({"UNREAD", "ARCHIVE"})
# Upper clamp on the server-side `limit` so e.g. limit=5000 can't dump thousands
# of rows into the agent's context. The good default (20) is set by the caller.
_MAX_NOTIFICATION_LIMIT = 200


async def _handle_notification(
    subaction: str,
    ctx: Context | None,
    confirm: bool,
    notification_id: str | None,
    notification_ids: list[str] | None,
    notification_type: str | None,
    importance: str | None,
    offset: int,
    limit: int,
    list_type: str,
    title: str | None,
    subject: str | None,
    description: str | None,
) -> dict[str, Any]:
    validate_subaction(subaction, _NOTIFICATION_SUBACTIONS, "notification")

    await gate_destructive_action(
        ctx,
        subaction,
        _NOTIFICATION_DESTRUCTIVE,
        confirm,
        {
            "delete": f"Delete notification **{notification_id}** permanently. This cannot be undone.",
            "delete_archived": "Delete ALL archived notifications permanently. This cannot be undone.",
        },
    )

    if list_type.upper() not in _VALID_LIST_TYPES:
        raise ToolError(
            f"Invalid list_type '{list_type}'. Must be one of: {sorted(_VALID_LIST_TYPES)}"
        )
    if importance is not None and importance.upper() not in _VALID_IMPORTANCE:
        raise ToolError(
            f"Invalid importance '{importance}'. Must be one of: {sorted(_VALID_IMPORTANCE)}"
        )
    if notification_type is not None and notification_type.upper() not in _VALID_LIST_TYPES:
        raise ToolError(
            f"Invalid notification_type '{notification_type}'. Must be one of: {sorted(_VALID_LIST_TYPES)}"
        )

    with tool_error_handler("notification", subaction, logger):
        logger.info(f"Executing unraid action=notification subaction={subaction}")

        if subaction == "overview":
            data = await _client.make_graphql_request(_NOTIFICATION_QUERIES["overview"])
            return dict(safe_get(data, "notifications", "overview", default={}))

        if subaction == "list":
            # Server-side fetch ceiling: limit<=0 means "as many as the clamp
            # allows", otherwise clamp the caller value down to the max so the
            # upstream API is never asked for thousands of rows.
            effective_limit = (
                _MAX_NOTIFICATION_LIMIT if limit <= 0 else min(limit, _MAX_NOTIFICATION_LIMIT)
            )
            filter_vars: dict[str, Any] = {
                "type": list_type.upper(),
                "offset": offset,
                "limit": effective_limit,
            }
            if importance:
                filter_vars["importance"] = importance.upper()
            data = await _client.make_graphql_request(
                _NOTIFICATION_QUERIES["list"], {"filter": filter_vars}
            )
            # Bound the *returned* list to the tool `limit` (default 20) via
            # cap_list so the response can't blow past the 40 KB response cap —
            # a 200-row payload is ~114 KB and would be silently truncated.
            rows = coerce_list(safe_get(data, "notifications", "list", default=[]))
            capped, page = cap_list(rows, limit)
            return {"notifications": capped, "page": page}

        if subaction == "create":
            if title is None or subject is None or description is None or importance is None:
                raise ToolError("create requires title, subject, description, and importance")
            if len(title) > 200:
                raise ToolError(f"title must be at most 200 characters (got {len(title)})")
            if len(subject) > 500:
                raise ToolError(f"subject must be at most 500 characters (got {len(subject)})")
            if len(description) > 2000:
                raise ToolError(
                    f"description must be at most 2000 characters (got {len(description)})"
                )
            data = await _client.make_graphql_request(
                _NOTIFICATION_MUTATIONS["create"],
                {
                    "input": {
                        "title": title,
                        "subject": subject,
                        "description": description,
                        "importance": importance.upper(),
                    }
                },
            )
            notif = data.get("createNotification")
            if notif is None:
                raise ToolError("Notification creation failed: server returned no data")
            return {"success": True, "notification": notif}

        if subaction == "notify_if_unique":
            if title is None or subject is None or description is None or importance is None:
                raise ToolError(
                    "notify_if_unique requires title, subject, description, and importance"
                )
            if len(title) > 200:
                raise ToolError(f"title must be at most 200 characters (got {len(title)})")
            if len(subject) > 500:
                raise ToolError(f"subject must be at most 500 characters (got {len(subject)})")
            if len(description) > 2000:
                raise ToolError(
                    f"description must be at most 2000 characters (got {len(description)})"
                )
            data = await _client.make_graphql_request(
                _NOTIFICATION_MUTATIONS["notify_if_unique"],
                {
                    "input": {
                        "title": title,
                        "subject": subject,
                        "description": description,
                        "importance": importance.upper(),
                    }
                },
            )
            notif = data.get("notifyIfUnique")
            if notif is None:
                return {
                    "success": True,
                    "duplicate": True,
                    "message": "Equivalent unread notification already exists",
                }
            return {"success": True, "duplicate": False, "notification": notif}

        if subaction in ("archive", "mark_unread"):
            if not notification_id:
                raise ToolError(f"notification_id is required for notification/{subaction}")
            data = await _client.make_graphql_request(
                _NOTIFICATION_MUTATIONS[subaction], {"id": notification_id}
            )
            result = safe_get(data, _NOTIFICATION_RESULT_FIELD[subaction])
            return {"success": True, "subaction": subaction, "data": result}

        if subaction == "delete":
            if not notification_id or not notification_type:
                raise ToolError("delete requires notification_id and notification_type")
            data = await _client.make_graphql_request(
                _NOTIFICATION_MUTATIONS["delete"],
                {"id": notification_id, "type": notification_type.upper()},
            )
            result = safe_get(data, _NOTIFICATION_RESULT_FIELD["delete"])
            return {"success": True, "subaction": "delete", "data": result}

        if subaction == "delete_archived":
            data = await _client.make_graphql_request(_NOTIFICATION_MUTATIONS["delete_archived"])
            result = safe_get(data, _NOTIFICATION_RESULT_FIELD["delete_archived"])
            return {"success": True, "subaction": "delete_archived", "data": result}

        if subaction == "archive_all":
            variables: dict[str, Any] | None = (
                {"importance": importance.upper()} if importance else None
            )
            data = await _client.make_graphql_request(
                _NOTIFICATION_MUTATIONS["archive_all"], variables
            )
            result = safe_get(data, _NOTIFICATION_RESULT_FIELD["archive_all"])
            return {"success": True, "subaction": "archive_all", "data": result}

        if subaction == "archive_many":
            if not notification_ids:
                raise ToolError("notification_ids is required for notification/archive_many")
            data = await _client.make_graphql_request(
                _NOTIFICATION_MUTATIONS["archive_many"], {"ids": notification_ids}
            )
            result = safe_get(data, _NOTIFICATION_RESULT_FIELD["archive_many"])
            return {"success": True, "subaction": "archive_many", "data": result}

        if subaction == "unarchive_many":
            if not notification_ids:
                raise ToolError("notification_ids is required for notification/unarchive_many")
            data = await _client.make_graphql_request(
                _NOTIFICATION_MUTATIONS["unarchive_many"], {"ids": notification_ids}
            )
            result = safe_get(data, _NOTIFICATION_RESULT_FIELD["unarchive_many"])
            return {"success": True, "subaction": "unarchive_many", "data": result}

        if subaction == "unarchive_all":
            variables: dict[str, Any] | None = (
                {"importance": importance.upper()} if importance else None
            )
            data = await _client.make_graphql_request(
                _NOTIFICATION_MUTATIONS["unarchive_all"], variables
            )
            result = safe_get(data, _NOTIFICATION_RESULT_FIELD["unarchive_all"])
            return {"success": True, "subaction": "unarchive_all", "data": result}

        if subaction == "recalculate":
            data = await _client.make_graphql_request(_NOTIFICATION_MUTATIONS["recalculate"])
            result = safe_get(data, _NOTIFICATION_RESULT_FIELD["recalculate"])
            return {"success": True, "subaction": "recalculate", "data": result}

        raise ToolError(f"Unhandled notification subaction '{subaction}' — this is a bug")
