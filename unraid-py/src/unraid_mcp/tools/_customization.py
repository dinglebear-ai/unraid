"""Customization domain handler for the Unraid MCP tool.

Covers: public_theme, is_initial_setup, sso_enabled, details, set_theme,
set_locale (6 subactions).

Schema notes (Unraid 7.3 / unraid-api 4.35):
- The old ``customization { theme partnerInfo }`` shape was removed upstream, so the
  former ``theme`` subaction is gone. Theme info now lives on ``publicTheme`` (see
  ``public_theme``) and ``system/display`` (``info { display { theme } }``).
- ``isInitialSetup`` was renamed to ``isFreshInstall``; ``is_initial_setup`` keeps its
  name but queries the new field and surfaces it as ``isFreshInstall``.
- ``publicPartnerInfo`` was removed from the ``Query`` type; ``public_theme`` now
  returns ``publicTheme`` only.
"""

from typing import Any

from ..config.logging import logger
from ..core import client as _client
from ..core.exceptions import ToolError, tool_error_handler
from ..core.utils import safe_get, validate_subaction
from ..core.validation import validate_str_param


# ===========================================================================
# CUSTOMIZATION
# ===========================================================================

_CUSTOMIZATION_QUERIES: dict[str, str] = {
    "public_theme": "query GetPublicTheme { publicTheme { name showBannerImage showBannerGradient showHeaderDescription headerBackgroundColor headerPrimaryTextColor headerSecondaryTextColor } }",
    "is_initial_setup": "query IsFreshInstall { isFreshInstall }",
    "sso_enabled": "query IsSSOEnabled { isSSOEnabled }",
    "details": """
        query GetCustomizationDetails {
          customization {
            onboarding {
              status
              isPartnerBuild
              completed
              completedAtVersion
              shouldOpen
              onboardingState {
                registrationState
                isRegistered
                isFreshInstall
                hasActivationCode
                activationRequired
              }
            }
            availableLanguages { code name url }
          }
        }
    """,
}

_CUSTOMIZATION_MUTATIONS: dict[str, str] = {
    "set_theme": "mutation SetTheme($theme: ThemeName!) { customization { setTheme(theme: $theme) { name showBannerImage showBannerGradient showHeaderDescription } } }",
    "set_locale": "mutation SetLocale($locale: String!) { customization { setLocale(locale: $locale) } }",
}

_CUSTOMIZATION_SUBACTIONS: set[str] = set(_CUSTOMIZATION_QUERIES) | set(_CUSTOMIZATION_MUTATIONS)


def _required_customization_root(data: dict[str, Any]) -> dict[str, Any]:
    root = data.get("customization")
    if root is None:
        raise ToolError(
            "Unraid API returned no 'customization' root for customization/details. "
            "Check API version, permissions, and server logs."
        )
    if not isinstance(root, dict):
        raise ToolError(
            "Unraid API returned unexpected 'customization' payload for customization/details"
        )
    return root


async def _handle_customization(
    subaction: str, theme_name: str | None, locale: str | None = None
) -> dict[str, Any]:
    validate_subaction(subaction, _CUSTOMIZATION_SUBACTIONS, "customization")

    with tool_error_handler("customization", subaction, logger):
        logger.info(f"Executing unraid action=customization subaction={subaction}")

        if subaction == "details":
            data = await _client.make_graphql_request(_CUSTOMIZATION_QUERIES["details"])
            return {"customization": _required_customization_root(data)}

        if subaction in _CUSTOMIZATION_QUERIES:
            data = await _client.make_graphql_request(_CUSTOMIZATION_QUERIES[subaction])
            if subaction == "is_initial_setup":
                return {"isFreshInstall": data.get("isFreshInstall")}
            if subaction == "sso_enabled":
                return {"isSSOEnabled": data.get("isSSOEnabled")}
            return dict(data)

        if subaction == "set_theme":
            if not theme_name:
                raise ToolError("theme_name is required for customization/set_theme")
            data = await _client.make_graphql_request(
                _CUSTOMIZATION_MUTATIONS["set_theme"], {"theme": theme_name}
            )
            return {
                "success": True,
                "subaction": "set_theme",
                "data": safe_get(data, "customization", "setTheme"),
            }

        if subaction == "set_locale":
            if not locale:
                raise ToolError("locale is required for customization/set_locale")
            data = await _client.make_graphql_request(
                _CUSTOMIZATION_MUTATIONS["set_locale"],
                {"locale": validate_str_param(locale, "locale")},
            )
            # setLocale returns the applied locale string; a null means it was not set.
            locale_result = safe_get(data, "customization", "setLocale")
            return {
                "success": locale_result is not None,
                "subaction": "set_locale",
                "locale": locale_result,
            }

        raise ToolError(f"Unhandled customization subaction '{subaction}' — this is a bug")
