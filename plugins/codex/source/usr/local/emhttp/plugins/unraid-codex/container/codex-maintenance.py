#!/usr/bin/env python3
from __future__ import annotations

import os
import sqlite3
import time
from pathlib import Path

STATE = Path(os.environ.get("CODEX_HOME", "/home/agent/.codex"))
LOG_DB = STATE / "logs_2.sqlite"
LOG_RETENTION_DAYS = int(os.environ.get("CODEX_LOG_RETENTION_DAYS", "30"))
LOG_TARGET_BYTES = int(os.environ.get("CODEX_LOG_TARGET_BYTES", str(96 * 1024 * 1024)))
LOG_MAX_BYTES = int(os.environ.get("CODEX_LOG_MAX_BYTES", str(128 * 1024 * 1024)))


def prune_sqlite_logs() -> tuple[int, int]:
    if not LOG_DB.exists():
        return 0, 0
    cutoff = int(time.time()) - LOG_RETENTION_DAYS * 86400
    deleted = 0
    with sqlite3.connect(LOG_DB, timeout=30) as db:
        db.execute("PRAGMA busy_timeout=30000")
        before = db.total_changes
        db.execute("DELETE FROM logs WHERE ts < ?", (cutoff,))
        deleted += db.total_changes - before
        estimated = db.execute(
            "SELECT COALESCE(SUM(MAX(estimated_bytes, 1)), 0) FROM logs"
        ).fetchone()[0]
        while estimated > LOG_TARGET_BYTES:
            ids = [row[0] for row in db.execute("SELECT id FROM logs ORDER BY id LIMIT 5000")]
            if not ids:
                break
            before = db.total_changes
            db.executemany("DELETE FROM logs WHERE id = ?", ((item,) for item in ids))
            deleted += db.total_changes - before
            estimated = db.execute(
                "SELECT COALESCE(SUM(MAX(estimated_bytes, 1)), 0) FROM logs"
            ).fetchone()[0]
        db.commit()
        db.execute("PRAGMA wal_checkpoint(TRUNCATE)")
        if LOG_DB.stat().st_size > LOG_MAX_BYTES:
            db.execute("VACUUM")
    return deleted, LOG_DB.stat().st_size


def prune_files(root: Path, max_age_days: int) -> int:
    if not root.exists():
        return 0
    cutoff = time.time() - max_age_days * 86400
    removed = 0
    for path in root.rglob("*"):
        try:
            if path.is_file() and path.stat().st_mtime < cutoff:
                path.unlink()
                removed += 1
        except FileNotFoundError:
            pass
    return removed


def main() -> None:
    STATE.mkdir(mode=0o700, parents=True, exist_ok=True)
    deleted, db_size = prune_sqlite_logs()
    removed_logs = prune_files(STATE / "logs", LOG_RETENTION_DAYS)
    removed_tmp = prune_files(STATE / ".tmp", 7)
    removed_snapshots = prune_files(STATE / "shell_snapshots", 0)
    print(
        "deleted_log_rows=%d log_db_bytes=%d removed_log_files=%d "
        "removed_tmp_files=%d removed_shell_snapshots=%d"
        % (deleted, db_size, removed_logs, removed_tmp, removed_snapshots)
    )


if __name__ == "__main__":
    main()
