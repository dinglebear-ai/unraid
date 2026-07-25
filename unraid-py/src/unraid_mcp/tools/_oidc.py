"""OIDC domain handler for the Unraid MCP tool.

Covers: providers, provider, configuration, public_providers, validate_session (5 subactions).
"""

from typing import Any

from ..config.logging import logger
from ..core import client as _client
from ..core.exceptions import ToolError, tool_error_handler
from ..core.pagination import cap_list
from ..core.utils import validate_subaction


# ===========================================================================
# OIDC
# ===========================================================================

_OIDC_QUERIES: dict[str, str] = {
    # LIST stays lean: endpoint URLs (authorizationEndpoint/tokenEndpoint/jwksUri)
    # and the pure-presentation button fields are dropped here — they live on the
    # `provider` (singular) detail query below.
    "providers": "query GetOidcProviders { oidcProviders { id name clientId issuer scopes authorizationRules { claim operator value } authorizationRuleMode } }",
    "provider": "query GetOidcProvider($id: PrefixedID!) { oidcProvider(id: $id) { id name clientId issuer authorizationEndpoint tokenEndpoint jwksUri scopes authorizationRules { claim operator value } authorizationRuleMode buttonText buttonIcon buttonVariant buttonStyle } }",
    "configuration": "query GetOidcConfiguration { oidcConfiguration { providers { id name clientId scopes } defaultAllowedOrigins } }",
    "public_providers": "query GetPublicOidcProviders { publicOidcProviders { id name buttonText buttonIcon buttonVariant buttonStyle } }",
    "validate_session": "query ValidateOidcSession($token: String!) { validateOidcSession(token: $token) { valid username } }",
}

_OIDC_SUBACTIONS: set[str] = set(_OIDC_QUERIES)


async def _handle_oidc(
    subaction: str, provider_id: str | None, token: str | None, limit: int = 20
) -> dict[str, Any]:
    validate_subaction(subaction, _OIDC_SUBACTIONS, "oidc")

    if subaction == "provider" and not provider_id:
        raise ToolError("provider_id is required for oidc/provider")
    if subaction == "validate_session" and not token:
        raise ToolError("token is required for oidc/validate_session")

    variables: dict[str, Any] | None = None
    if subaction == "provider":
        variables = {"id": provider_id}
    elif subaction == "validate_session":
        variables = {"token": token}

    with tool_error_handler("oidc", subaction, logger):
        logger.info(f"Executing unraid action=oidc subaction={subaction}")
        # Guard the lookup so an unhandled subaction raises the clean guard below
        # instead of a KeyError masked as "likely a bug" (#5).
        query = _OIDC_QUERIES.get(subaction)
        if query is None:
            raise ToolError(f"Unhandled oidc subaction '{subaction}' — this is a bug")
        data = await _client.make_graphql_request(query, variables)

        if subaction == "providers":
            providers = data.get("oidcProviders") or []
            capped, page = cap_list(providers, limit)
            return {"providers": capped, "page": page}
        if subaction == "provider":
            result = data.get("oidcProvider")
            if result is None:
                raise ToolError(f"OIDC provider '{provider_id}' not found")
            return dict(result)
        if subaction == "configuration":
            return dict(data.get("oidcConfiguration") or {})
        if subaction == "public_providers":
            capped, page = cap_list(data.get("publicOidcProviders", []), limit)
            return {"providers": capped, "page": page}
        if subaction == "validate_session":
            result = data.get("validateOidcSession")
            if result is None:
                raise ToolError(
                    "Session validation returned no data — the OIDC endpoint may be unavailable"
                )
            return dict(result)

        raise ToolError(f"Unhandled oidc subaction '{subaction}' — this is a bug")
