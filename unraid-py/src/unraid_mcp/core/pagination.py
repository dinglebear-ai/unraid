"""Client-side list capping for tool responses.

The Unraid GraphQL API exposes no server-side pagination for most collections
(only ``notifications.list`` accepts ``offset``/``limit``). To keep large lists
from flooding an agent's context window, list subactions slice the result in the
handler and surface a small metadata dict describing the truncation.

This is the shared primitive every list subaction should use so the truncation
signal is consistent across the whole tool surface.
"""

import json
from typing import Any


# Default number of items returned when the caller does not specify a limit.
# Matches the tool-level ``limit`` default (20) documented in CLAUDE.md; the tool
# always threads its own default through, so this is the fallback for direct callers.
DEFAULT_LIST_LIMIT: int = 20


def _item_bytes(item: Any) -> int:
    """Approximate serialized byte size of a single item for byte-budget accounting.

    A separate, cheap JSON serialization used only to *measure* — the response
    itself is serialized again by the response encoder, so this is a deliberate
    extra pass whose cost is bounded by the byte budget. Falls back to ``str`` for
    anything non-JSON-serializable so a quirky item can never raise. The estimate
    need not match the encoder's exact wire size; callers leave headroom (see
    ``_LIVE_EVENT_BYTE_BUDGET`` = half the response cap) to absorb the difference.
    """
    try:
        return len(json.dumps(item, default=str).encode())
    except (TypeError, ValueError):
        return len(str(item).encode())


def cap_list(
    items: list[Any],
    limit: int | None,
    *,
    default: int = DEFAULT_LIST_LIMIT,
    byte_budget: int | None = None,
) -> tuple[list[Any], dict[str, Any]]:
    """Cap a list client-side and describe the result.

    Args:
        items: The full list returned by the upstream query.
        limit: Caller-requested maximum. ``None`` applies ``default``. A value
            ``<= 0`` disables capping (returns everything) — use it as an
            explicit "give me all" escape hatch.
        default: Limit applied when ``limit`` is ``None``.
        byte_budget: Optional running serialized-size ceiling (bytes). ``None``
            (the default) preserves the count-only behavior — fully backward
            compatible. When set, items are added until the running serialized
            size would exceed the budget, then truncation stops early; this keeps
            a handful of multi-KB items (e.g. log events) from collectively
            tripping the response-size backstop and discarding the entire
            response. At least one item is always returned, so a *single* item
            larger than the whole budget is still returned in full (and may then
            hit the backstop) — the budget bounds aggregate size, not max item
            size. A value ``<= 0`` disables the byte ceiling. The byte cap is
            applied *after* the count cap, so it only ever returns fewer items.

    Returns:
        A ``(capped_items, meta)`` tuple. ``meta`` always carries ``returned``,
        ``total`` and ``truncated``; when truncated it also carries a ``hint``
        telling the agent how to widen the window. Surface ``meta`` in the
        subaction response (e.g. under a ``page`` key) so the agent knows whether
        more rows exist.
    """
    total = len(items)
    effective = default if limit is None else limit

    if effective is not None and effective > 0 and total > effective:
        capped = items[:effective]
        meta = {
            "returned": effective,
            "total": total,
            "truncated": True,
            "hint": (
                f"showing {effective} of {total} items; pass a larger limit= "
                "to see more (limit=0 for all)"
            ),
        }
    else:
        capped = items
        meta = {"returned": total, "total": total, "truncated": False}

    # Optional secondary byte ceiling: trim the already count-capped slice so its
    # running serialized size stays under the budget. Bounds total bytes, not just
    # item count — large items can't nuke the whole response.
    if byte_budget is not None and byte_budget > 0 and capped:
        running = 0
        kept = 0
        for item in capped:
            running += _item_bytes(item)
            if kept > 0 and running > byte_budget:
                break
            kept += 1
        if kept < len(capped):
            byte_capped = capped[:kept]
            return byte_capped, {
                "returned": kept,
                "total": total,
                "truncated": True,
                "hint": (
                    f"showing {kept} of {total} items (stopped at ~{byte_budget} "
                    "bytes to fit the response budget); narrow the query or fetch "
                    "fewer/smaller items"
                ),
            }

    return capped, meta
