# tests/test_log_filter.py
"""Unit tests for the filter_log_lines helper (issue #26)."""

from __future__ import annotations

import pytest

from unraid_mcp.core.utils import count_log_matches, filter_log_lines


def test_no_level_returns_unchanged():
    lines = ["a", "b", "c"]
    assert filter_log_lines(lines) == lines
    assert filter_log_lines(lines, level=None) == lines


def test_no_match_returns_empty():
    lines = ["info: all good", "debug: tracing"]
    assert filter_log_lines(lines, level="error") == []


def test_structured_level_match_with_context():
    lines = [
        "line0 info",
        "line1 info",
        "line2 [ERROR] boom",
        "line3 info",
        "line4 info",
        "line5 info",
    ]
    result = filter_log_lines(lines, level="error", context=2)
    # match at idx 2, context 2 → idx 0..4
    assert result == lines[0:5]


def test_context_clamped_at_boundaries():
    lines = ["[error] first", "next", "last [error]"]
    result = filter_log_lines(lines, level="error", context=5)
    # both matches expand to cover the whole list, merged into one group
    assert result == lines


def test_contiguous_groups_merge_no_separator():
    lines = [
        "ctx",
        "[warning] one",
        "between",
        "[warning] two",
        "ctx",
    ]
    result = filter_log_lines(lines, level="warning", context=1)
    # windows [0..2] and [2..4] overlap → single group, no "---"
    assert "---" not in result
    assert result == lines


def test_non_contiguous_groups_get_separator():
    lines = [
        "[error] a",  # 0
        "b",  # 1
        "c",  # 2
        "d",  # 3
        "e",  # 4
        "f",  # 5
        "[error] g",  # 6
    ]
    result = filter_log_lines(lines, level="error", context=1)
    # groups: [0..1] and [5..6], separated by "---"
    assert result == ["[error] a", "b", "---", "f", "[error] g"]


def test_level_threshold_at_or_above():
    lines = [
        "debug: d",
        "info: i",
        "notice: n",
        "warning: w",
        "error: e",
        "critical: c",
    ]
    result = filter_log_lines(lines, level="warning", context=0)
    # warning and above only
    assert result == ["warning: w", "error: e", "critical: c"]


def test_below_threshold_excluded():
    lines = ["debug: d", "info: i", "notice: n"]
    assert filter_log_lines(lines, level="warning", context=0) == []


def test_alias_levels_recognized():
    lines = ["kernel: warn something", "kernel: err other", "kernel: crit bad"]
    result = filter_log_lines(lines, level="warning", context=0)
    assert result == lines  # warn, err, crit all >= warning


def test_keyword_fallback_when_no_structured_level():
    # No bracketed/structured token detectable as a severity rank in a way the
    # threshold path keys on — falls back to substring keyword match.
    lines = [
        "the operation completed",
        "something went wrong",
        "an Error occurred while syncing",
    ]
    result = filter_log_lines(lines, level="error", context=0)
    assert result == ["an Error occurred while syncing"]


def test_keyword_fallback_uses_alias():
    lines = ["disk is degraded", "WARN: cache filling up"]
    # "warning" should also keyword-match the alias "warn"
    result = filter_log_lines(lines, level="warning", context=0)
    assert "WARN: cache filling up" in result


def test_negative_context_treated_as_zero():
    lines = ["a", "[error] b", "c"]
    assert filter_log_lines(lines, level="error", context=-3) == ["[error] b"]


def test_dedup_overlapping_windows():
    lines = ["[error] " + str(i) if i % 2 == 0 else str(i) for i in range(5)]
    result = filter_log_lines(lines, level="error", context=2)
    # every other line matches with context 2 → whole list, each line once
    assert result == lines
    assert len(result) == len(set(map(id, result))) or len(result) == 5


@pytest.mark.parametrize(
    "fmt",
    [
        "[ERROR] boom",
        "level=error boom",
        "app: error: boom",
        "2024-01-01 ERROR boom",
        "<error> boom",
    ],
)
def test_tolerant_level_shapes(fmt):
    lines = ["ok info", fmt]
    result = filter_log_lines(lines, level="error", context=0)
    assert result == [fmt]


# --- count_log_matches (issue #48) ---


def test_count_no_level_counts_all_lines():
    lines = ["a", "b", "c"]
    assert count_log_matches(lines) == 3
    assert count_log_matches(lines, level=None) == 3


def test_count_only_matches_excludes_context_and_separators():
    # Two non-contiguous error lines among info lines. With context, filter_log_lines
    # returns extra context lines plus a "---" separator, but the match count is 2.
    lines = [
        "line0 info",
        "line1 info",
        "line2 [ERROR] boom",
        "line3 info",
        "line4 info",
        "line5 info",
        "line6 info",
        "line7 [ERROR] kaboom",
        "line8 info",
    ]
    assert count_log_matches(lines, level="error") == 2

    filtered = filter_log_lines(lines, level="error", context=1)
    # filtered pulls in surrounding context + a "---" separator between the
    # two non-contiguous groups; returned-line count excludes "---".
    returned = sum(1 for line in filtered if line != "---")
    assert "---" in filtered
    assert returned > count_log_matches(lines, level="error")


def test_count_respects_severity_threshold():
    lines = ["info x", "warning y", "error z", "critical w"]
    # warning threshold matches warning, error, critical
    assert count_log_matches(lines, level="warning") == 3
    assert count_log_matches(lines, level="error") == 2


def test_count_no_match_is_zero():
    assert count_log_matches(["info a", "debug b"], level="error") == 0
