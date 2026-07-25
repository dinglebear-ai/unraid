"""Unit tests for the shared client-side list-capping helper."""

from unraid_mcp.core.pagination import DEFAULT_LIST_LIMIT, _item_bytes, cap_list


def test_default_list_limit_matches_documented_tool_default():
    """DEFAULT_LIST_LIMIT must equal the tool-level default (20) documented in CLAUDE.md."""
    assert DEFAULT_LIST_LIMIT == 20


def test_under_limit_returns_all_not_truncated():
    items = [1, 2, 3]
    capped, meta = cap_list(items, limit=10)
    assert capped == items
    assert meta == {"returned": 3, "total": 3, "truncated": False}


def test_over_limit_truncates_with_hint():
    items = list(range(100))
    capped, meta = cap_list(items, limit=10)
    assert capped == list(range(10))
    assert meta["returned"] == 10
    assert meta["total"] == 100
    assert meta["truncated"] is True
    assert "limit=" in meta["hint"]


def test_none_limit_applies_default():
    items = list(range(DEFAULT_LIST_LIMIT + 5))
    capped, meta = cap_list(items, limit=None)
    assert len(capped) == DEFAULT_LIST_LIMIT
    assert meta["truncated"] is True
    assert meta["total"] == DEFAULT_LIST_LIMIT + 5


def test_zero_limit_returns_everything():
    items = list(range(200))
    capped, meta = cap_list(items, limit=0)
    assert capped == items
    assert meta["truncated"] is False
    assert meta["returned"] == 200


def test_negative_limit_returns_everything():
    items = list(range(30))
    capped, meta = cap_list(items, limit=-1)
    assert capped == items
    assert meta["truncated"] is False


def test_exactly_at_limit_not_truncated():
    items = list(range(10))
    capped, meta = cap_list(items, limit=10)
    assert capped == items
    assert meta["truncated"] is False


def test_empty_list():
    capped, meta = cap_list([], limit=10)
    assert capped == []
    assert meta == {"returned": 0, "total": 0, "truncated": False}


def test_custom_default():
    items = list(range(20))
    capped, meta = cap_list(items, limit=None, default=5)
    assert len(capped) == 5
    assert meta["truncated"] is True


def test_byte_budget_truncates_below_numeric_limit():
    """Large items trip the byte ceiling before the count cap is reached."""
    # Each item serializes to ~100 bytes; a 250-byte budget keeps ~2-3 items.
    items = [{"data": "x" * 90} for _ in range(50)]
    per_item = _item_bytes(items[0])
    capped, meta = cap_list(items, limit=50, byte_budget=250)
    # Trimmed below the numeric limit of 50.
    assert len(capped) < 50
    assert len(capped) >= 1
    assert meta["returned"] == len(capped)
    assert meta["total"] == 50
    assert meta["truncated"] is True
    # Byte-cap hint differs from the count-cap wording.
    assert "bytes to fit the response budget" in meta["hint"]
    assert "narrow the query" in meta["hint"]
    assert f"~{250} bytes" in meta["hint"]
    # Sanity: the kept items roughly track the budget given per-item size.
    assert len(capped) <= 250 // per_item + 1


def test_byte_budget_single_oversized_item_still_returned():
    """A lone item larger than the entire budget is kept (kept > 0 guard)."""
    items = [{"data": "y" * 5000}]
    capped, meta = cap_list(items, limit=20, byte_budget=10)
    assert len(capped) == 1
    assert capped != []
    assert meta["returned"] == 1
    assert meta["total"] == 1
    # Single oversized item alone does not exceed the count cap, and the byte
    # guard never trims below one item, so it is not flagged truncated here.
    assert meta["truncated"] is False


def test_byte_budget_oversized_first_then_more_keeps_at_least_one():
    """When more items follow a huge first item, at least the first is kept."""
    items = [{"data": "z" * 5000}, {"data": "z" * 5000}, {"data": "z" * 5000}]
    capped, meta = cap_list(items, limit=20, byte_budget=10)
    assert len(capped) == 1
    assert capped != []
    assert meta["returned"] == 1
    assert meta["total"] == 3
    assert meta["truncated"] is True
    assert "bytes to fit the response budget" in meta["hint"]


def test_count_cap_takes_precedence_when_budget_generous():
    """A generous byte_budget yields exactly the count-capped slice + count hint."""
    items = list(range(100))
    capped, meta = cap_list(items, limit=5, byte_budget=10_000_000)
    assert capped == list(range(5))
    assert meta["returned"] == 5
    assert meta["total"] == 100
    assert meta["truncated"] is True
    # Count-cap hint wording, not the byte-cap wording.
    assert "pass a larger limit=" in meta["hint"]
    assert "bytes to fit the response budget" not in meta["hint"]


def test_byte_budget_zero_disables_ceiling():
    """byte_budget=0 leaves the count-capped slice unchanged."""
    items = [{"data": "x" * 200} for _ in range(10)]
    capped, meta = cap_list(items, limit=5, byte_budget=0)
    assert len(capped) == 5
    assert meta == {
        "returned": 5,
        "total": 10,
        "truncated": True,
        "hint": ("showing 5 of 10 items; pass a larger limit= to see more (limit=0 for all)"),
    }


def test_byte_budget_none_disables_ceiling():
    """byte_budget=None (the default) preserves count-only behavior."""
    items = [{"data": "x" * 200} for _ in range(3)]
    capped, meta = cap_list(items, limit=10, byte_budget=None)
    assert capped == items
    assert meta == {"returned": 3, "total": 3, "truncated": False}


def test_item_bytes_non_serializable_falls_back_to_str():
    """_item_bytes never raises on an item json.dumps cannot encode.

    A circular reference makes ``json.dumps`` raise ``ValueError`` even with
    ``default=str``, exercising the ``str()`` fallback branch.
    """
    circular: list = []
    circular.append(circular)
    size = _item_bytes(circular)
    assert size == len(str(circular).encode())
    assert size > 0
