"""Onboarding domain handler for the Unraid MCP tool.

Covers first-boot / onboarding state and the internal-boot context:
internal_boot_context, complete, open, close, resume, bypass, reset*,
set_override, clear_override, refresh_internal_boot_context,
create_internal_boot_pool* (11 subactions).

These operate on the server's first-boot / setup state. The state-changing ones
are rarely needed on a configured production server; the genuinely dangerous ones
(reset, create_internal_boot_pool) require confirm=True.
"""

from typing import Any

from fastmcp import Context

from ..config.logging import logger
from ..core import client as _client
from ..core.exceptions import ToolError, tool_error_handler
from ..core.guards import gate_destructive_action
from ..core.utils import mutation_success, validate_subaction
from ..core.validation import validate_input_mapping


# ===========================================================================
# ONBOARDING
# ===========================================================================

_ONBOARDING_FIELDS = "status isPartnerBuild completed completedAtVersion activationCode shouldOpen"

_ONBOARDING_QUERIES: dict[str, str] = {
    "internal_boot_context": "query InternalBootContext { internalBootContext { arrayStopped bootEligible bootedFromFlashWithInternalBootSetup enableBootTransfer reservedNames shareNames poolNames driveWarnings { diskId device warnings } } }",
}

_ONBOARDING_LEGACY_QUERIES: dict[str, str] = {
    "internal_boot_context": "query InternalBootContext { internalBootContext { arrayStopped bootEligible bootedFromFlashWithInternalBootSetup enableBootTransfer reservedNames shareNames poolNames } }",
}

# Simple no-argument onboarding mutations that all return an Onboarding object.
_ONBOARDING_SIMPLE_MUTATIONS: dict[str, str] = {
    "complete": f"mutation CompleteOnboarding {{ onboarding {{ completeOnboarding {{ {_ONBOARDING_FIELDS} }} }} }}",
    "reset": f"mutation ResetOnboarding {{ onboarding {{ resetOnboarding {{ {_ONBOARDING_FIELDS} }} }} }}",
    "open": f"mutation OpenOnboarding {{ onboarding {{ openOnboarding {{ {_ONBOARDING_FIELDS} }} }} }}",
    "close": f"mutation CloseOnboarding {{ onboarding {{ closeOnboarding {{ {_ONBOARDING_FIELDS} }} }} }}",
    "bypass": f"mutation BypassOnboarding {{ onboarding {{ bypassOnboarding {{ {_ONBOARDING_FIELDS} }} }} }}",
    "resume": f"mutation ResumeOnboarding {{ onboarding {{ resumeOnboarding {{ {_ONBOARDING_FIELDS} }} }} }}",
    "clear_override": f"mutation ClearOnboardingOverride {{ onboarding {{ clearOnboardingOverride {{ {_ONBOARDING_FIELDS} }} }} }}",
    "refresh_internal_boot_context": "mutation RefreshInternalBootContext { onboarding { refreshInternalBootContext { arrayStopped bootEligible poolNames driveWarnings { diskId device warnings } } } }",
}

_ONBOARDING_LEGACY_SIMPLE_MUTATIONS: dict[str, str] = {
    "refresh_internal_boot_context": "mutation RefreshInternalBootContext { onboarding { refreshInternalBootContext { arrayStopped bootEligible poolNames } } }",
}

_ONBOARDING_INPUT_MUTATIONS: dict[str, str] = {
    "set_override": f"mutation SetOnboardingOverride($input: OnboardingOverrideInput!) {{ onboarding {{ setOnboardingOverride(input: $input) {{ {_ONBOARDING_FIELDS} }} }} }}",
    "create_internal_boot_pool": "mutation CreateInternalBootPool($input: CreateInternalBootPoolInput!) { onboarding { createInternalBootPool(input: $input) { ok code output } } }",
}

_ONBOARDING_RESULT_FIELD: dict[str, str] = {
    "complete": "completeOnboarding",
    "reset": "resetOnboarding",
    "open": "openOnboarding",
    "close": "closeOnboarding",
    "bypass": "bypassOnboarding",
    "resume": "resumeOnboarding",
    "clear_override": "clearOnboardingOverride",
    "refresh_internal_boot_context": "refreshInternalBootContext",
    "set_override": "setOnboardingOverride",
    "create_internal_boot_pool": "createInternalBootPool",
}

_ONBOARDING_SUBACTIONS: set[str] = (
    set(_ONBOARDING_QUERIES) | set(_ONBOARDING_SIMPLE_MUTATIONS) | set(_ONBOARDING_INPUT_MUTATIONS)
)
# reset wipes onboarding/setup state; create_internal_boot_pool formats devices and
# can reboot the server.
_ONBOARDING_DESTRUCTIVE: set[str] = {"reset", "create_internal_boot_pool"}


def _is_unknown_drive_warnings_field_error(exc: ToolError) -> bool:
    msg = str(exc).lower()
    return "cannot query field" in msg and "drivewarnings" in msg


async def _handle_onboarding(
    subaction: str,
    ctx: Context | None,
    confirm: bool,
    onboarding_input: dict[str, Any] | None = None,
) -> dict[str, Any]:
    validate_subaction(subaction, _ONBOARDING_SUBACTIONS, "onboarding")

    await gate_destructive_action(
        ctx,
        subaction,
        _ONBOARDING_DESTRUCTIVE,
        confirm,
        {
            "reset": "Reset the server's onboarding/setup state. The first-boot setup "
            "flow will be re-triggered.",
            "create_internal_boot_pool": "Create an internal boot pool. This FORMATS the "
            "specified devices and may REBOOT the server.",
        },
    )

    with tool_error_handler("onboarding", subaction, logger):
        logger.info(f"Executing unraid action=onboarding subaction={subaction}")

        if subaction == "internal_boot_context":
            try:
                data = await _client.make_graphql_request(
                    _ONBOARDING_QUERIES["internal_boot_context"]
                )
            except ToolError as exc:
                if not _is_unknown_drive_warnings_field_error(exc):
                    raise
                data = await _client.make_graphql_request(
                    _ONBOARDING_LEGACY_QUERIES["internal_boot_context"]
                )
            return {
                "success": True,
                "subaction": subaction,
                "context": data.get("internalBootContext"),
            }

        if subaction in _ONBOARDING_SIMPLE_MUTATIONS:
            try:
                data = await _client.make_graphql_request(_ONBOARDING_SIMPLE_MUTATIONS[subaction])
            except ToolError as exc:
                legacy_mutation = _ONBOARDING_LEGACY_SIMPLE_MUTATIONS.get(subaction)
                if legacy_mutation is None or not _is_unknown_drive_warnings_field_error(exc):
                    raise
                data = await _client.make_graphql_request(legacy_mutation)
            field = _ONBOARDING_RESULT_FIELD[subaction]
            result = (data.get("onboarding") or {}).get(field)
            return {
                "success": mutation_success(result, boolean=False),
                "subaction": subaction,
                "onboarding": result,
            }

        if subaction in _ONBOARDING_INPUT_MUTATIONS:
            if onboarding_input is None:
                raise ToolError(f"onboarding_input is required for onboarding/{subaction}")
            validated = validate_input_mapping(onboarding_input, "onboarding_input")
            data = await _client.make_graphql_request(
                _ONBOARDING_INPUT_MUTATIONS[subaction], {"input": validated}
            )
            field = _ONBOARDING_RESULT_FIELD[subaction]
            result = (data.get("onboarding") or {}).get(field)
            if subaction == "create_internal_boot_pool":
                # Returns {ok, code, output}; `ok=false` means the pool was NOT
                # created — surface that (and the diagnostic output) instead of
                # reporting a clean success.
                return {
                    "success": bool((result or {}).get("ok")),
                    "subaction": subaction,
                    "result": result,
                    "output": (result or {}).get("output"),
                }
            return {
                "success": mutation_success(result, boolean=False),
                "subaction": subaction,
                "result": result,
            }

        raise ToolError(f"Unhandled onboarding subaction '{subaction}' — this is a bug")
