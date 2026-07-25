"""Tests for the canonical Unraid GraphQL docs generator.

The full reference and change report are rendered by external Node tools
(graphql-markdown / GraphQL Inspector) invoked via ``npx``; those are exercised
manually / in maintenance runs, not in the unit suite. These tests cover the
pure-Python pieces: introspection→SDL conversion, the curated summary, and the
no-op branches that need no network.
"""

from __future__ import annotations

import json
from pathlib import Path

from scripts.generate_unraid_api_reference import (
    _build_summary_markdown,
    _doc_header,
    _introspection_to_sdl,
    _render_changes,
)


REPO_ROOT = Path(__file__).resolve().parents[1]
INTROSPECTION_PATH = REPO_ROOT / "docs" / "unraid" / "UNRAID-API-INTROSPECTION.json"


def _load_schema() -> dict:
    payload = json.loads(INTROSPECTION_PATH.read_text(encoding="utf-8"))
    return payload["data"]["__schema"]


def test_introspection_to_sdl_produces_schema_text() -> None:
    payload = json.loads(INTROSPECTION_PATH.read_text(encoding="utf-8"))
    sdl = _introspection_to_sdl(payload["data"])
    assert "type Query" in sdl
    # SDL should round-trip the root types declared in the introspection payload.
    assert "type Mutation" in sdl


def test_doc_header_includes_source_and_timestamp() -> None:
    header = _doc_header(
        "My Doc", source="http://tower/graphql", generated_at="2026-01-01T00:00:00"
    )
    assert header.startswith("# My Doc")
    assert "http://tower/graphql" in header
    assert "2026-01-01T00:00:00" in header


def test_render_changes_without_previous_snapshot_needs_no_tool() -> None:
    """With no previous schema there is nothing to diff — no npx call is made."""
    out = _render_changes(
        None,
        Path("/nonexistent/current.graphql"),
        source="test",
        generated_at="2026-01-01T00:00:00",
    )
    assert "# Unraid API Schema Changes" in out
    assert "No previous introspection snapshot" in out


def test_build_summary_markdown_renders_root_tables() -> None:
    schema = _load_schema()
    summary = _build_summary_markdown(
        schema, source="test", generated_at="2026-01-01T00:00:00", include_introspection=False
    )
    assert "# Unraid API Introspection Summary" in summary
    assert "## Schema Summary" in summary
    assert "## Query Fields" in summary
    assert "| Field | Return Type | Arguments |" in summary
