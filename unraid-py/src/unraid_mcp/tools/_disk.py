"""Disk domain handler for the Unraid MCP tool.

Covers: shares, disks, disk_details, log_files, logs, flash_backup* (6 subactions).
"""

import posixpath
from typing import Any

from fastmcp import Context

from ..config.logging import logger
from ..core import client as _client
from ..core.client import DISK_TIMEOUT
from ..core.exceptions import ToolError, tool_error_handler
from ..core.guards import gate_destructive_action
from ..core.pagination import cap_list
from ..core.utils import (
    count_log_matches,
    filter_log_lines,
    format_bytes,
    validate_subaction,
)
from ..core.validation import validate_str_param


# ===========================================================================
# DISK (shares, physical disks, logs, flash backup)
# ===========================================================================

_DISK_QUERIES: dict[str, str] = {
    # NOTE: `id` is intentionally omitted. Auto-created user shares (top-level
    # folders with no /boot/config/shares/<name>.cfg) resolve Share.id to null,
    # and the non-nullable Share.id field rejects the entire response — so no
    # shares could be listed while any auto-share existed (issue #29). `name` is
    # the stable identifier; the handler synthesizes `id` from `name`.
    "shares": "query GetSharesInfo { shares { name free used size include exclude cache nameOrig comment allocator splitLevel floor cow color luksStatus } }",
    "disks": "query ListPhysicalDisks { disks { id device name } }",
    "disk_details": "query GetDiskDetails($id: PrefixedID!) { disk(id: $id) { id device name serialNum size temperature } }",
    "log_files": "query ListLogFiles { logFiles { name path size modifiedAt } }",
    "logs": "query GetLogContent($path: String!, $lines: Int) { logFile(path: $path, lines: $lines) { path content totalLines startLine } }",
}

_DISK_MUTATIONS: dict[str, str] = {
    "flash_backup": "mutation InitiateFlashBackup($input: InitiateFlashBackupInput!) { initiateFlashBackup(input: $input) { status jobId } }",
}

_DISK_SUBACTIONS: set[str] = set(_DISK_QUERIES) | set(_DISK_MUTATIONS)
_DISK_DESTRUCTIVE: set[str] = {"flash_backup"}
_ALLOWED_LOG_PREFIXES = ("/var/log/", "/boot/logs/")
_MAX_TAIL_LINES = 10_000


def _path_within_base(normalized: str, base: str) -> bool:
    """Boundary-correct containment check: ``normalized`` is ``base`` or under it.

    A naive ``startswith(base)`` would wrongly accept siblings that merely share a
    prefix (e.g. ``/bootleg`` for base ``/boot``). The correct rule is an exact
    match OR a match on ``base`` followed by a path separator.
    """
    base = base.rstrip("/")
    return normalized == base or normalized.startswith(base + "/")


def _validate_path(
    path: str,
    allowed_prefixes: tuple[str, ...],
    label: str,
    *,
    exact_or_prefix: bool = False,
) -> str:
    """Validate a remote path string for traversal and allowed prefix.

    Uses pure string normalization — no filesystem access. The path is validated
    locally but consumed on the remote Unraid server, so realpath would resolve
    against the wrong filesystem.

    Prefix handling depends on ``allowed_prefixes`` and ``exact_or_prefix``:

    - ``exact_or_prefix=True`` — ``allowed_prefixes`` are base directories matched
      with a boundary-correct check (the dir itself or anything under it) so
      ``/boot`` does not also admit ``/bootleg``.
    - ``exact_or_prefix=False`` (default) — legacy ``startswith`` prefix match; keep
      those prefixes trailing-slash terminated (e.g. ``/var/log/``) to avoid the
      sibling-prefix bug.
    - empty ``allowed_prefixes`` — skip the prefix check entirely (only null-byte
      and traversal hardening apply), e.g. for remote rclone destination paths.

    Returns the normalized path. Raises ToolError on any violation.
    """
    # Bound the length (SEC-M2). Applies to every path, including remote rclone
    # destinations that intentionally skip the prefix check below.
    validate_str_param(path, label)
    # Reject null bytes — they can truncate strings at the OS layer.
    if "\x00" in path:
        raise ToolError(f"{label} must not contain null bytes")
    # Normalize BEFORE checking for '..' so encoded traversal sequences
    # (e.g. 'foo/bar/../..') are resolved first. Checking the raw string
    # before normpath is bypassable via encoded or indirect sequences.
    normalized = posixpath.normpath(path)
    # Always split on '/' — paths are remote Linux paths, not local OS paths.
    # os.sep would be '\\' on Windows, silently breaking the traversal check.
    if ".." in normalized.split("/"):
        raise ToolError(f"{label} must not contain path traversal sequences (../)")
    if not allowed_prefixes:
        return normalized
    if exact_or_prefix:
        allowed = any(_path_within_base(normalized, p) for p in allowed_prefixes)
    else:
        allowed = any(normalized.startswith(p) for p in allowed_prefixes)
    if not allowed:
        raise ToolError(f"{label} must start with one of: {', '.join(allowed_prefixes)}")
    return normalized


async def _handle_disk(
    subaction: str,
    disk_id: str | None,
    log_path: str | None,
    tail_lines: int,
    remote_name: str | None,
    source_path: str | None,
    destination_path: str | None,
    backup_options: dict[str, Any] | None,
    ctx: Context | None,
    confirm: bool,
    level: str | None = None,
    context: int = 2,
    limit: int | None = None,
) -> dict[str, Any]:
    validate_subaction(subaction, _DISK_SUBACTIONS, "disk")

    await gate_destructive_action(
        ctx,
        subaction,
        _DISK_DESTRUCTIVE,
        confirm,
        {
            "flash_backup": f"Back up flash drive to **{remote_name}:{destination_path}**. Existing backups will be overwritten.",
        },
    )

    with tool_error_handler("disk", subaction, logger):
        logger.info(f"Executing unraid action=disk subaction={subaction}")
        if subaction == "disk_details" and not disk_id:
            raise ToolError("disk_id is required for disk/disk_details")

        if subaction == "logs":
            if tail_lines < 1 or tail_lines > _MAX_TAIL_LINES:
                raise ToolError(
                    f"tail_lines must be between 1 and {_MAX_TAIL_LINES}, got {tail_lines}"
                )
            if not log_path:
                raise ToolError("log_path is required for disk/logs")
            log_path = _validate_path(log_path, _ALLOWED_LOG_PREFIXES, "log_path")

        if subaction == "flash_backup":
            if not remote_name:
                raise ToolError("remote_name is required for disk/flash_backup")
            if not source_path:
                raise ToolError("source_path is required for disk/flash_backup")
            if not destination_path:
                raise ToolError("destination_path is required for disk/flash_backup")
            # Validate paths — flash backup source must come from /boot only.
            # The boundary-correct "/boot vs /bootleg" rule lives in a single
            # place: _validate_path's exact_or_prefix mode (a naive
            # startswith("/boot") would wrongly admit "/bootleg/...").
            source_path = _validate_path(
                source_path, ("/boot",), "source_path", exact_or_prefix=True
            )
            # The destination is a remote (rclone) target, so it carries no local
            # prefix restriction — only null-byte + traversal hardening applies.
            # An empty allowed_prefixes tuple skips the prefix check entirely.
            destination_path = _validate_path(destination_path, (), "destination_path")
            input_data: dict[str, Any] = {
                "remoteName": remote_name,
                "sourcePath": source_path,
                "destinationPath": destination_path,
            }
            if backup_options is not None:
                input_data["options"] = backup_options
            data = await _client.make_graphql_request(
                _DISK_MUTATIONS["flash_backup"], {"input": input_data}
            )
            backup = data.get("initiateFlashBackup")
            if not backup:
                raise ToolError("Failed to start flash backup: no confirmation from server")
            return {"success": True, "subaction": "flash_backup", "data": backup}

        custom_timeout = DISK_TIMEOUT if subaction in ("disks", "disk_details") else None
        variables: dict[str, Any] | None = None
        if subaction == "disk_details":
            variables = {"id": disk_id}
        elif subaction == "logs":
            variables = {"path": log_path, "lines": tail_lines}

        # Guard the lookup so an unhandled subaction raises the clean guard below
        # instead of a raw KeyError (#5).
        query = _DISK_QUERIES.get(subaction)
        if query is None:
            raise ToolError(f"Unhandled disk subaction '{subaction}' — this is a bug")
        data = await _client.make_graphql_request(query, variables, custom_timeout=custom_timeout)

        if subaction == "shares":
            shares = data.get("shares", []) or []
            # `id` is no longer selected (see _DISK_QUERIES["shares"]); synthesize
            # a stable id from `name` so downstream consumers expecting an `id`
            # key still get one. `name` is the stable share identifier.
            for share in shares:
                if isinstance(share, dict) and not share.get("id"):
                    share["id"] = share.get("name")
            # Cap AFTER id synthesis so synthesized ids are stable for the
            # rows that are actually returned.
            capped, meta = cap_list(shares, limit)
            return {"shares": capped, "page": meta}
        if subaction == "disks":
            capped, meta = cap_list(data.get("disks", []), limit)
            return {"disks": capped, "page": meta}
        if subaction == "disk_details":
            raw = data.get("disk", {})
            if not raw:
                raise ToolError(f"Disk '{disk_id}' not found")
            return {
                "summary": {
                    "disk_id": raw.get("id"),
                    "device": raw.get("device"),
                    "name": raw.get("name"),
                    "serial_number": raw.get("serialNum"),
                    "size_formatted": format_bytes(raw.get("size")),
                    "temperature": f"{raw['temperature']}\u00b0C"
                    if raw.get("temperature") is not None
                    else "N/A",
                },
                "details": raw,
            }
        if subaction == "log_files":
            capped, page = cap_list(data.get("logFiles", []), limit)
            return {"log_files": capped, "page": page}
        if subaction == "logs":
            result = data.get("logFile")
            if not result:
                raise ToolError(f"Log file not found or inaccessible: {log_path}")
            out = dict(result)
            if level is not None and isinstance(out.get("content"), str):
                lines = out["content"].split("\n")
                filtered = filter_log_lines(lines, level=level, context=context)
                out["content"] = "\n".join(filtered)
                out["matchedLines"] = count_log_matches(lines, level=level)
                out["returnedLines"] = sum(1 for line in filtered if line != "---")
                out["filter"] = {"level": level, "context": context}
            return out

        # Distinct from the guard above the query lookup: this catches a subaction
        # that IS in _DISK_QUERIES but has no render branch here (a future query
        # added without a handler) — the request ran but nothing shaped the result.
        raise ToolError(f"Unhandled disk subaction '{subaction}' — this is a bug")
