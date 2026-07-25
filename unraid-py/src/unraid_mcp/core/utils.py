"""Shared utility functions for Unraid MCP tools."""

import re
from typing import Any
from urllib.parse import urlparse

from .exceptions import ToolError


_MISSING: object = object()

# Syslog/Unraid severity levels, ordered low → high. A request for ``warning``
# matches ``warning`` and everything more severe (error, critical, …).
_SEVERITY_ORDER: tuple[str, ...] = (
    "debug",
    "info",
    "notice",
    "warning",
    "error",
    "critical",
)
_SEVERITY_RANK: dict[str, int] = {name: i for i, name in enumerate(_SEVERITY_ORDER)}

# Common aliases seen in syslog / Unraid / kernel log output, mapped to the
# canonical level name above.
_SEVERITY_ALIASES: dict[str, str] = {
    "dbg": "debug",
    "informational": "info",
    "warn": "warning",
    "err": "error",
    "error": "error",
    "crit": "critical",
    "critical": "critical",
    "alert": "critical",
    "emerg": "critical",
    "emergency": "critical",
    "fatal": "critical",
    "panic": "critical",
}

# Matches a structured level token inside a log line. Tolerant of several common
# shapes: bracketed ([ERROR]), key=value (level=warn), and bare priority words
# surrounded by separators (... err: ...). Case-insensitive.
_LEVEL_TOKENS: list[str] = sorted(
    set(_SEVERITY_ORDER) | set(_SEVERITY_ALIASES), key=lambda t: len(t), reverse=True
)
_LEVEL_TOKEN = "|".join(_LEVEL_TOKENS)
_LEVEL_RE = re.compile(
    r"(?:^|[\[\(<\s:=|/])(" + _LEVEL_TOKEN + r")(?:[\]\)>\s:=|/.,]|$)",
    re.IGNORECASE,
)


def _line_severity_rank(line: str) -> int | None:
    """Return the highest severity rank detected in a log line, or None.

    Scans for a structured level token (bracketed, key=value, or a bare
    priority word delimited by separators). If several appear, the most severe
    wins. Returns None when no recognizable level token is present.
    """
    best: int | None = None
    for match in _LEVEL_RE.finditer(line):
        token = match.group(1).lower()
        canonical = _SEVERITY_ALIASES.get(token, token)
        rank = _SEVERITY_RANK.get(canonical)
        if rank is not None and (best is None or rank > best):
            best = rank
    return best


def _make_matcher(level: str):
    """Build a predicate that decides whether a log line matches ``level``.

    Shared by :func:`filter_log_lines` and :func:`count_log_matches` so the two
    always agree on what "matches the severity filter" means. A line matches when
    its detected structured level is at-or-above ``level``; lines with no
    detectable level fall back to a case-insensitive keyword match against the
    requested level name and its aliases.
    """
    canonical = _SEVERITY_ALIASES.get(level.lower(), level.lower())
    threshold = _SEVERITY_RANK.get(canonical)

    keywords = {level.lower(), canonical}
    keywords.update(a for a, c in _SEVERITY_ALIASES.items() if c == canonical)

    def _matches(line: str) -> bool:
        rank = _line_severity_rank(line)
        if rank is not None and threshold is not None:
            return rank >= threshold
        lowered = line.lower()
        return any(kw in lowered for kw in keywords)

    return _matches


def count_log_matches(lines: list[str], level: str | None = None) -> int:
    """Count log lines that actually match the severity filter.

    Unlike :func:`filter_log_lines`, this counts ONLY the lines that match
    ``level`` — it excludes the surrounding context lines and the ``"---"``
    separators that ``filter_log_lines`` adds to its output.

    Args:
        lines: The raw log lines (without trailing newlines).
        level: Minimum severity to match (see :func:`filter_log_lines`). When
            None, every line is considered a match.

    Returns:
        The number of severity-matching lines.
    """
    if level is None:
        return len(lines)
    matcher = _make_matcher(level)
    return sum(1 for line in lines if matcher(line))


def filter_log_lines(
    lines: list[str],
    level: str | None = None,
    context: int = 2,
) -> list[str]:
    """Filter log lines by severity, keeping N lines of surrounding context.

    Args:
        lines: The raw log lines (without trailing newlines).
        level: Minimum severity to keep, one of
            ``debug|info|notice|warning|error|critical``. A line matches when
            its detected level is at-or-above ``level``. When a line has no
            detectable structured level, the requested level name (and its
            aliases, e.g. ``warn`` for ``warning``) is matched case-insensitively
            as a substring keyword fallback. If ``level`` is None, every line
            matches (no filtering).
        context: Number of lines of context to include before and after each
            matching line. Non-contiguous groups are separated by a ``"---"``
            marker. Defaults to 2.

    Returns:
        The matching lines plus context, de-duplicated and in original order,
        with ``"---"`` separators between non-contiguous groups. Returns an
        empty list when nothing matches.

    Backward compatible: ``filter_log_lines(lines)`` (no level) returns ``lines``
    unchanged.
    """
    if level is None:
        return list(lines)
    if context < 0:
        context = 0

    matches = _make_matcher(level)
    match_indices = [i for i, line in enumerate(lines) if matches(line)]
    if not match_indices:
        return []

    # Expand each match to its context window, then merge into ordered ranges.
    keep: set[int] = set()
    for i in match_indices:
        start = max(0, i - context)
        end = min(len(lines) - 1, i + context)
        keep.update(range(start, end + 1))

    ordered = sorted(keep)
    result: list[str] = []
    prev: int | None = None
    for idx in ordered:
        if prev is not None and idx != prev + 1:
            result.append("---")
        result.append(lines[idx])
        prev = idx
    return result


def safe_get(data: dict[str, Any], *keys: str, default: Any = None) -> Any:
    """Safely traverse nested dict keys, handling missing keys and None intermediates.

    Args:
        data: The root dictionary to traverse.
        *keys: Sequence of keys to follow.
        default: Value to return if any key is absent or any intermediate value
            is not a dict.

    Returns:
        The value at the end of the key chain (including explicit ``None``),
        or ``default`` if a key is missing or an intermediate is not a dict.
        This preserves the distinction between ``{"k": None}`` (returns ``None``)
        and ``{}`` (returns ``default``).
    """
    current: Any = data
    for key in keys:
        if not isinstance(current, dict):
            return default
        current = current.get(key, _MISSING)
        if current is _MISSING:
            return default
    return current


def coerce_list(value: Any) -> list[Any]:
    """Return ``value`` if it is a list, otherwise an empty list.

    Defensive coercion for GraphQL fields that should be lists but may come back
    ``None`` or malformed — keeps downstream code (``cap_list``, iteration) from
    having to repeat the ``list(x) if isinstance(x, list) else []`` idiom.
    """
    return value if isinstance(value, list) else []


def mutation_success(result: Any, *, boolean: bool) -> bool:
    """Derive a mutation's success flag from its GraphQL result.

    GraphQL mutations signal failure in the data payload, not by raising:
    a bare-``Boolean`` resolver returns ``false`` when the op did not take effect,
    while an object-returning resolver returns ``null`` on failure. Pass
    ``boolean=True`` for the former (``success = bool(result)``) and ``boolean=False``
    for the latter (``success = result is not None``).
    """
    return bool(result) if boolean else result is not None


def _coerce_int(value: Any) -> int | None:
    """Coerce ``value`` to ``int`` for the size formatters, or None on failure.

    Returns None for ``None`` input and for anything ``int()`` rejects, so callers
    can map None → ``"N/A"`` uniformly. Shared by :func:`format_bytes` and
    :func:`format_kb` to keep their coercion behavior identical.
    """
    if value is None:
        return None
    try:
        return int(value)
    except (ValueError, TypeError, OverflowError):
        # OverflowError: int(inf) / int(very-large-float) — map to None like the rest.
        return None


def format_bytes(bytes_value: int | None) -> str:
    """Format byte values into human-readable sizes.

    Args:
        bytes_value: Number of bytes, or None.

    Returns:
        Human-readable string like "1.00 GB" or "N/A" if input is None/invalid.
    """
    coerced = _coerce_int(bytes_value)
    if coerced is None:
        return "N/A"
    value = float(coerced)
    for unit in ["B", "KB", "MB", "GB", "TB", "PB"]:
        if value < 1024.0:
            return f"{value:.2f} {unit}"
        value /= 1024.0
    return f"{value:.2f} EB"


def safe_display_url(url: str | None) -> str | None:
    """Return a redacted URL showing only scheme + host + port.

    Strips path, query parameters, credentials, and fragments to avoid
    leaking internal network topology or embedded secrets (CWE-200).
    """
    if not url:
        return None
    try:
        parsed = urlparse(url)
        host = parsed.hostname or "unknown"
        if parsed.port:
            return f"{parsed.scheme}://{host}:{parsed.port}"
        return f"{parsed.scheme}://{host}"
    except ValueError:
        # urlparse raises ValueError for invalid URLs (e.g. contains control chars)
        return "<unparseable>"


def format_kb(k: Any) -> str:
    """Format kilobyte values into human-readable sizes.

    Delegates to :func:`format_bytes` after converting kilobytes to bytes,
    ensuring consistent formatting and full scale coverage (B through EB).

    Args:
        k: Number of kilobytes, or None.

    Returns:
        Human-readable string like "1.00 GB" or "N/A" if input is None/invalid.
    """
    kb = _coerce_int(k)
    if kb is None:
        return "N/A"
    return format_bytes(kb * 1024)


def validate_subaction(subaction: str, valid_set: set[str], domain: str) -> None:
    """Raise ToolError if subaction is not in the valid set.

    Args:
        subaction: The subaction string to validate.
        valid_set: Set of valid subaction names.
        domain: The domain name for error messages (e.g. "docker").
    """
    if subaction not in valid_set:
        raise ToolError(
            f"Invalid subaction '{subaction}' for {domain}. Must be one of: {sorted(valid_set)}"
        )
