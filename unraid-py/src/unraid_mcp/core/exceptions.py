"""Custom exceptions for Unraid MCP Server.

This module defines custom exception classes for consistent error handling
throughout the application, with proper integration to FastMCP's error system.
"""

import contextlib
import logging
from collections.abc import Iterator

import httpx
from fastmcp.exceptions import ToolError as FastMCPToolError


class ToolError(FastMCPToolError):
    """User-facing error that MCP clients can handle.

    This is the main exception type used throughout the application for
    errors that should be presented to the user/LLM in a friendly way.

    Inherits from FastMCP's ToolError to ensure proper MCP protocol handling.
    """

    pass


class CredentialsNotConfiguredError(Exception):
    """Raised when UNRAID_API_URL or UNRAID_API_KEY are not set.

    Used as a sentinel so callers can surface setup instructions rather than crashing.
    """

    def __str__(self) -> str:
        return "Unraid credentials are not configured."


# Exception types that almost always indicate a server-side programming bug
# rather than a transient upstream/IO failure. When one of these escapes a tool
# handler, the agent should stop retrying — re-running the same call will hit the
# same code path and fail identically.
_LIKELY_BUG_EXCEPTIONS: tuple[type[Exception], ...] = (
    KeyError,
    AttributeError,
    TypeError,
    IndexError,
    NameError,
)
_KNOWN_TRANSIENT_EXCEPTIONS: tuple[type[Exception], ...] = (
    httpx.RequestError,
    ConnectionError,
)


@contextlib.contextmanager
def tool_error_handler(
    tool_name: str,
    action: str,
    logger: logging.Logger,
) -> Iterator[None]:
    """Context manager that standardizes tool error handling.

    Re-raises ToolError as-is. Converts CredentialsNotConfiguredError to a ToolError
    with setup instructions including CREDENTIALS_ENV_PATH; does not log.
    Gives TimeoutError a descriptive message. Catches all other exceptions,
    logs them with full traceback, and wraps them in ToolError.

    Remaining exceptions are split into two user-facing classes — without leaking
    any internal specifics — so the agent can decide whether retrying is worthwhile:

    * *likely-server-bug* types (``KeyError``, ``AttributeError``, ``TypeError``,
      ``IndexError``, ``NameError``) surface as an "internal error (likely a bug)"
      message, signalling that retrying the same call will not help.
    * everything else (network/IO/upstream errors) surfaces as an
      "upstream/network error" message, which is worth a retry.

    Both classes are logged in full via ``logger.exception``.

    Args:
        tool_name: The tool name for error messages (e.g., "docker", "vm").
        action: The current action being executed.
        logger: The logger instance to use for error logging.
    """
    try:
        yield
    except ToolError:
        raise
    except CredentialsNotConfiguredError as e:
        from ..config.settings import CREDENTIALS_ENV_PATH

        raise ToolError(
            'Credentials not configured. Run unraid(action="health", subaction="setup"), '
            f"or create {CREDENTIALS_ENV_PATH} with UNRAID_API_URL and UNRAID_API_KEY "
            f"(cp .env.example {CREDENTIALS_ENV_PATH} to get started)."
        ) from e
    except TimeoutError as e:
        logger.exception(
            "Timeout in unraid_%s action=%s: request exceeded time limit", tool_name, action
        )
        raise ToolError(
            f"Request timed out executing {tool_name}/{action}. The Unraid API did not respond in time."
        ) from e
    except _LIKELY_BUG_EXCEPTIONS as e:
        logger.exception("Likely server bug in unraid_%s action=%s", tool_name, action)
        raise ToolError(
            f"Internal error executing {tool_name}/{action} (likely a server bug). "
            f"Retrying is unlikely to help. Check server logs for details."
        ) from e
    except _KNOWN_TRANSIENT_EXCEPTIONS as e:
        logger.exception("Transient upstream error in unraid_%s action=%s", tool_name, action)
        raise ToolError(
            f"Failed to execute {tool_name}/{action} (upstream/network error). "
            f"This may be transient — retrying may help. Check server logs for details."
        ) from e
    except Exception as e:
        logger.exception("Internal error in unraid_%s action=%s", tool_name, action)
        raise ToolError(
            f"Internal error executing {tool_name}/{action}. Retrying is unlikely to help. "
            "Check server logs for details."
        ) from e
