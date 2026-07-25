"""Logging configuration for Unraid MCP Server.

This module sets up structured logging with Rich console and overwrite file handlers
that cap at 10MB and start over (no rotation) for consistent use across all modules.
"""

import logging
import sys
import tempfile
from pathlib import Path
from typing import Any, cast

from fastmcp.utilities.logging import get_logger as get_fastmcp_logger
from rich.console import Console
from rich.logging import RichHandler

from .settings import LOG_FILE_PATH, LOG_LEVEL_STR


# Global Rich console for consistent formatting
console = Console(stderr=True)


class OverwriteFileHandler(logging.FileHandler):
    """Custom file handler that overwrites the log file when it reaches max size."""

    def __init__(
        self,
        filename: str | Path,
        max_bytes: int = 10 * 1024 * 1024,
        mode: str = "a",
        encoding: str | None = None,
        delay: bool = False,
    ) -> None:
        """Initialize the handler.

        Args:
            filename: Path to the log file
            max_bytes: Maximum file size in bytes before overwriting (default: 10MB)
            mode: File open mode
            encoding: File encoding
            delay: Whether to delay file opening
        """
        self.max_bytes = max_bytes
        self._emit_count = 0
        self._check_interval = 100
        # In-process byte counter — accumulates the size of each formatted record so
        # the periodic size check no longer needs a stat()/exists() syscall on the
        # event-loop thread. Seeded below from the existing file size (append mode).
        self._bytes_written = 0
        super().__init__(filename, mode, encoding, delay)
        try:
            base_path = Path(self.baseFilename)
            if base_path.exists():
                self._bytes_written = base_path.stat().st_size
        except OSError:
            self._bytes_written = 0

    def _rotate_if_needed(self, projected_bytes: int = 0) -> bool:
        """Overwrite the log file if the accumulated byte count crossed the cap.

        Opens a fresh stream (deleting the old file first), atomically swaps it in,
        resets the in-process byte counter, and writes a reset marker. On repeated
        open failure, logging silently continues on the existing stream.

        Returns ``True`` if the file was actually overwritten (the byte counter was
        reset), so the caller can re-account the in-flight record against the fresh
        file — the record is written to the *new* file but was counted against the
        old one before the reset.
        """
        if self._bytes_written + projected_bytes < self.max_bytes:
            return False
        if not (self.stream and hasattr(self.stream, "name")):
            return False

        base_path = Path(self.baseFilename)
        replacement = None
        replacement_path: Path | None = None
        try:
            replacement = tempfile.NamedTemporaryFile(  # noqa: SIM115 - stream remains active
                mode="w",
                encoding=self.encoding or "utf-8",
                dir=base_path.parent,
                prefix=f".{base_path.name}.",
                delete=False,
            )
            replacement_path = Path(replacement.name)
            # Atomic replacement keeps the old pathname valid until the fresh
            # stream has been opened successfully.
            replacement_path.replace(base_path)
            old_stream = self.stream
            self.stream = cast("Any", replacement)
            if old_stream is not None:
                old_stream.close()
            self._bytes_written = 0
            marker = "=== LOG FILE RESET (10MB limit reached) ===" + self.terminator
            self.stream.write(marker)
            self.flush()
            self._bytes_written = len(marker.encode(self.encoding or "utf-8"))
            return True
        except OSError:
            if replacement is not None:
                replacement.close()
            if replacement_path is not None:
                replacement_path.unlink(missing_ok=True)
            print(
                "WARNING: Failed to safely replace log file during rotation. "
                "File logging continues on old stream.",
                file=sys.stderr,
            )
            return False

    def emit(self, record: logging.LogRecord) -> None:
        """Emit a record, checking accumulated size periodically and overwriting if needed."""
        try:
            self._emit_count += 1
            message = self.format(record)
            encoded_size = len((message + self.terminator).encode(self.encoding or "utf-8"))
            self._rotate_if_needed(encoded_size)
            if self.stream is None:
                self.stream = self._open()
            self.stream.write(message + self.terminator)
            self.flush()
            self._bytes_written += encoded_size
        except Exception:
            self.handleError(record)


def _create_shared_file_handler() -> OverwriteFileHandler:
    """Create the single shared file handler for all loggers.

    Returns:
        Configured OverwriteFileHandler instance
    """
    numeric_log_level = getattr(logging, LOG_LEVEL_STR, logging.INFO)
    handler = OverwriteFileHandler(LOG_FILE_PATH, max_bytes=10 * 1024 * 1024, encoding="utf-8")
    handler.setLevel(numeric_log_level)
    handler.setFormatter(
        logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(module)s - %(funcName)s - %(lineno)d - %(message)s"
        )
    )
    return handler


# Single shared file handler — all loggers reuse this instance to avoid
# race conditions from multiple OverwriteFileHandler instances on the same file.
_shared_file_handler = _create_shared_file_handler()


def setup_logger(name: str = "UnraidMCPServer") -> logging.Logger:
    """Set up and configure the logger with console and file handlers.

    Args:
        name: Logger name (defaults to UnraidMCPServer)

    Returns:
        Configured logger instance
    """
    # Get numeric log level
    numeric_log_level = getattr(logging, LOG_LEVEL_STR, logging.INFO)

    # Define the logger
    logger = logging.getLogger(name)
    logger.setLevel(numeric_log_level)
    logger.propagate = False  # Prevent root logger from duplicating handlers

    # Clear any existing handlers
    logger.handlers.clear()

    # Rich Console Handler for beautiful output
    console_handler = RichHandler(
        console=console,
        show_time=True,
        show_level=True,
        show_path=False,
        rich_tracebacks=True,
        tracebacks_show_locals=False,
    )
    console_handler.setLevel(numeric_log_level)
    logger.addHandler(console_handler)

    # Reuse the shared file handler
    logger.addHandler(_shared_file_handler)

    return logger


def configure_fastmcp_logger_with_rich() -> logging.Logger:
    """Configure FastMCP logger to use Rich formatting with Nordic colors."""
    # Get numeric log level
    numeric_log_level = getattr(logging, LOG_LEVEL_STR, logging.INFO)

    # Get the FastMCP logger
    fastmcp_logger = get_fastmcp_logger("UnraidMCPServer")

    # Clear existing handlers
    fastmcp_logger.handlers.clear()
    fastmcp_logger.propagate = False

    # Rich Console Handler
    console_handler = RichHandler(
        console=console,
        show_time=True,
        show_level=True,
        show_path=False,
        rich_tracebacks=True,
        tracebacks_show_locals=False,
        markup=True,
    )
    console_handler.setLevel(numeric_log_level)
    fastmcp_logger.addHandler(console_handler)

    # Reuse the shared file handler
    fastmcp_logger.addHandler(_shared_file_handler)

    fastmcp_logger.setLevel(numeric_log_level)

    # Attach shared file handler to the root logger so that library/third-party
    # loggers (httpx, websockets, etc.) whose propagate=True flows up to root
    # will also be written to the log file, not just the console.
    root_logger = logging.getLogger()
    root_logger.setLevel(numeric_log_level)
    if _shared_file_handler not in root_logger.handlers:
        root_logger.addHandler(_shared_file_handler)

    return fastmcp_logger


def log_configuration_status(logger: logging.Logger) -> None:
    """Log configuration status at startup.

    Args:
        logger: Logger instance to use for logging
    """
    from .settings import get_config_summary

    logger.info("Logging initialized (console and file: %s).", LOG_FILE_PATH)

    config = get_config_summary()

    # Log configuration status
    if config["api_url_configured"]:
        logger.info("UNRAID_API_URL loaded: %s", config["api_url_preview"])
    else:
        logger.warning("UNRAID_API_URL not found in environment or .env file.")

    if config["api_key_configured"]:
        logger.info("UNRAID_API_KEY loaded: ****")  # Don't log the key itself
    else:
        logger.warning("UNRAID_API_KEY not found in environment or .env file.")

    logger.info("UNRAID_MCP_PORT set to: %s", config["server_port"])
    logger.info("UNRAID_MCP_HOST set to: %s", config["server_host"])
    logger.info("UNRAID_MCP_TRANSPORT set to: %s", config["transport"])
    logger.info("UNRAID_MCP_LOG_LEVEL set to: %s", config["log_level"])

    if not config["config_valid"]:
        logger.error("Missing required configuration: %s", config["missing_config"])


# Global logger instance - modules can import this directly
logger = configure_fastmcp_logger_with_rich()
