"""Shared input validation constants and helpers for tool domain handlers.

Centralises validation rules used across multiple domain handlers (e.g.
_rclone.py, _setting.py) so they share a single source of truth.
"""

import re
from typing import Any

from .exceptions import ToolError


# Maximum string length for individual config/settings values
MAX_VALUE_LENGTH: int = 4096

# Pattern matching key characters that are disallowed in remote config and
# settings keys. Rejects path traversal (..), path separators, shell
# metacharacters, space (0x20), DEL (0x7F), and control characters (0x00-0x1F).
#
# INTENTIONAL BEHAVIOR CHANGE vs. original _rclone.py pattern:
# This shared pattern adds &, <, >, ', ", #, space (0x20), and DEL (0x7F)
# to the original set. Any rclone remote config key containing those characters
# will now be rejected. This is intentional — those characters are unsafe in
# shell contexts and were never expected in rclone remote names or settings keys.
DANGEROUS_KEY_PATTERN: re.Pattern[str] = re.compile(
    r"\.\.|[/\\;|`$(){}&<>\"'#\x20\x7f]|[\x00-\x1f]"
)


def validate_input_mapping(
    data: dict[str, Any],
    label: str,
    *,
    max_keys: int = 100,
    max_depth: int = 6,
) -> dict[str, Any]:
    """Validate a possibly-nested GraphQL input-object mapping.

    Unlike ``validate_scalar_mapping`` (flat, scalar-only), this allows nested
    dicts and lists so it can carry structured GraphQL input objects (e.g.
    ``TemperatureConfigInput`` with nested ``sensors``/``thresholds``). It still
    enforces a key cap, rejects dangerous key names, bounds nesting depth, and
    caps scalar string length — so unvalidated bulk input can't reach a mutation.

    Args:
        data: The mapping to validate.
        label: Human-readable label for error messages (e.g. "connect_input").
        max_keys: Maximum number of keys allowed at any single level.
        max_depth: Maximum nesting depth allowed.

    Returns:
        The validated mapping (values preserved, including nested structures).
    """
    if not isinstance(data, dict):
        raise ToolError(f"{label} must be an object, got: {type(data).__name__}")

    def _check(value: Any, path: str, depth: int) -> Any:
        if depth > max_depth:
            raise ToolError(f"{path} nesting exceeds max depth ({max_depth})")
        if isinstance(value, dict):
            if len(value) > max_keys:
                raise ToolError(f"{path} has {len(value)} keys (max {max_keys})")
            out: dict[str, Any] = {}
            for key, item in value.items():
                if not isinstance(key, str) or not key.strip():
                    raise ToolError(
                        f"{path} keys must be non-empty strings, got: {type(key).__name__}"
                    )
                if DANGEROUS_KEY_PATTERN.search(key):
                    raise ToolError(f"{path} key '{key}' contains disallowed characters")
                out[key] = _check(item, f"{path}['{key}']", depth + 1)
            return out
        if isinstance(value, list):
            return [_check(item, f"{path}[]", depth + 1) for item in value]
        if value is None or isinstance(value, (str, int, float, bool)):
            if isinstance(value, str) and len(value) > MAX_VALUE_LENGTH:
                raise ToolError(
                    f"{path} value exceeds max length ({len(value)} > {MAX_VALUE_LENGTH})"
                )
            return value
        raise ToolError(f"{path} must be a scalar, list, or object, got: {type(value).__name__}")

    return _check(data, label, 0)


def validate_input_mapping_list(
    items: list[Any], label: str, **kwargs: Any
) -> list[dict[str, Any]]:
    """Validate a list of GraphQL input-object mappings (per-item ``label[i]``).

    Convenience wrapper around :func:`validate_input_mapping` for mutation inputs
    that take a list of objects (e.g. ``permissions``, autostart ``entries``).
    Each item must itself be an object (dict); a non-dict item is rejected with a
    clear per-index message rather than a confusing scalar-type error.
    """
    return [validate_input_mapping(item, f"{label}[{i}]", **kwargs) for i, item in enumerate(items)]


def validate_str_param(value: str, label: str) -> str:
    """Bound a single string parameter to MAX_VALUE_LENGTH.

    For bare scalar tool params (e.g. ``name``, ``comment``, ``locale``) that go
    straight into GraphQL variables without passing through one of the mapping
    validators — keeps the length cap consistent with the dict-input paths.
    """
    if len(value) > MAX_VALUE_LENGTH:
        raise ToolError(f"{label} exceeds max length ({len(value)} > {MAX_VALUE_LENGTH})")
    return value


def validate_scalar_mapping(
    data: dict[str, Any],
    label: str,
    *,
    max_keys: int = 100,
    stringify: bool = False,
) -> dict[str, Any]:
    """Validate a flat scalar key-value mapping.

    Enforces key count cap, rejects dangerous key names, accepts only scalar
    values (str, int, float, bool), and enforces MAX_VALUE_LENGTH.

    Args:
        data: The mapping to validate.
        label: Human-readable label for error messages (e.g. "config_data").
        max_keys: Maximum number of keys allowed.
        stringify: If True, convert all values to str (rclone style).
                   If False, preserve original types (settings style).

    Returns:
        Validated mapping with the same or stringified values.
    """
    if len(data) > max_keys:
        raise ToolError(f"{label} has {len(data)} keys (max {max_keys})")
    validated: dict[str, Any] = {}
    for key, value in data.items():
        if not isinstance(key, str) or not key.strip():
            raise ToolError(f"{label} keys must be non-empty strings, got: {type(key).__name__}")
        if DANGEROUS_KEY_PATTERN.search(key):
            raise ToolError(f"{label} key '{key}' contains disallowed characters")
        if not isinstance(value, (str, int, float, bool)):
            raise ToolError(
                f"{label}['{key}'] must be a string, number, or boolean"
                + (f", got: {type(value).__name__}" if not stringify else "")
            )
        str_value = str(value)
        if len(str_value) > MAX_VALUE_LENGTH:
            raise ToolError(
                f"{label}['{key}'] value exceeds max length ({len(str_value)} > {MAX_VALUE_LENGTH})"
            )
        validated[key] = str_value if stringify else value
    return validated
