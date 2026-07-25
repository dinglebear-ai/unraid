"""User domain handler for the Unraid MCP tool.

Covers: me (1 subaction).
"""

from typing import Any

from ..config.logging import logger
from ..core import client as _client
from ..core.exceptions import ToolError, tool_error_handler
from ..core.utils import validate_subaction


# ===========================================================================
# USER
# ===========================================================================

_USER_QUERIES: dict[str, str] = {
    "me": "query GetMe { me { id name description roles } }",
}

_USER_SUBACTIONS: set[str] = set(_USER_QUERIES)


async def _handle_user(subaction: str) -> dict[str, Any]:
    validate_subaction(subaction, _USER_SUBACTIONS, "user")

    with tool_error_handler("user", subaction, logger):
        logger.info("Executing unraid action=user subaction=me")
        data = await _client.make_graphql_request(_USER_QUERIES["me"])
        result = data.get("me")
        if not result:
            raise ToolError(
                "No user data returned — the API key may lack user context or the session is invalid"
            )
        return result
