#!/usr/bin/env python3
"""Generate canonical Unraid GraphQL docs from introspection.

The full reference (``UNRAID-API-COMPLETE-REFERENCE.md``) is rendered with
`graphql-markdown <https://github.com/exogen/graphql-markdown>`_ and the schema
change report (``UNRAID-API-CHANGES.md``) with `GraphQL Inspector
<https://the-guild.dev/graphql/inspector>`_.  Both are official, well-maintained
tools invoked via ``npx`` on demand, so no JavaScript dependencies are committed
to this Python project.  The condensed summary remains a curated,
project-specific table because no off-the-shelf tool produces that exact shape.

Introspection is fetched from a live API by default, or read from a previously
saved introspection payload with ``--from-introspection`` (handy for offline
regeneration and tests).
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import shutil
import subprocess
import tempfile
from collections import Counter
from pathlib import Path
from typing import Any

import httpx
from graphql import build_client_schema, print_schema


DOCS_DIR = Path("docs/unraid")
DEFAULT_COMPLETE_OUTPUT = DOCS_DIR / "UNRAID-API-COMPLETE-REFERENCE.md"
DEFAULT_SUMMARY_OUTPUT = DOCS_DIR / "UNRAID-API-SUMMARY.md"
DEFAULT_INTROSPECTION_OUTPUT = DOCS_DIR / "UNRAID-API-INTROSPECTION.json"
DEFAULT_SCHEMA_OUTPUT = DOCS_DIR / "UNRAID-SCHEMA.graphql"
DEFAULT_CHANGES_OUTPUT = DOCS_DIR / "UNRAID-API-CHANGES.md"
LEGACY_INTROSPECTION_OUTPUT = Path("docs/unraid-api-introspection.json")

# Pinned npm packages invoked via `npx --yes`. Pin majors so output stays stable.
GRAPHQL_MARKDOWN_PKG = "graphql-markdown@7"
GRAPHQL_INSPECTOR_PKG = "@graphql-inspector/cli@4"

# Matches ANSI SGR colour codes so tool output is clean inside Markdown.
_ANSI_RE = re.compile(r"\x1b\[[0-9;]*m")

INTROSPECTION_QUERY = """
query FullIntrospection {
  __schema {
    queryType { name }
    mutationType { name }
    subscriptionType { name }
    directives {
      name
      description
      locations
      args {
        name
        description
        defaultValue
        type { ...TypeRef }
      }
    }
    types {
      kind
      name
      description
      fields(includeDeprecated: true) {
        name
        description
        isDeprecated
        deprecationReason
        args {
          name
          description
          defaultValue
          type { ...TypeRef }
        }
        type { ...TypeRef }
      }
      inputFields {
        name
        description
        defaultValue
        type { ...TypeRef }
      }
      interfaces { kind name }
      enumValues(includeDeprecated: true) {
        name
        description
        isDeprecated
        deprecationReason
      }
      possibleTypes { kind name }
    }
  }
}

fragment TypeRef on __Type {
  kind
  name
  ofType {
    kind
    name
    ofType {
      kind
      name
      ofType {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
              }
            }
          }
        }
      }
    }
  }
}
"""


# ---------------------------------------------------------------------------
# Introspection helpers
# ---------------------------------------------------------------------------


def _extract_schema(payload: dict[str, Any]) -> dict[str, Any]:
    """Return the ``__schema`` payload or raise."""
    schema = (payload.get("data") or {}).get("__schema")
    if not schema:
        raise SystemExit("GraphQL introspection returned no __schema payload.")
    return schema


def _load_payload(path: Path) -> dict[str, Any]:
    """Load a saved introspection payload (``{"data": {"__schema": ...}}``)."""
    return json.loads(path.read_text(encoding="utf-8"))


def _load_previous_schema(path: Path) -> dict[str, Any] | None:
    """Load a prior introspection snapshot's ``__schema`` if available."""
    if not path.exists():
        return None
    return _extract_schema(_load_payload(path))


def _introspection_to_sdl(introspection: dict[str, Any]) -> str:
    """Convert an introspection result (``{"__schema": ...}``) to SDL."""
    return print_schema(build_client_schema(introspection))


def _write_schema_graphql(path: Path, payload: dict[str, Any]) -> None:
    """Write the SDL schema export with a do-not-edit banner."""
    banner = (
        "# ------------------------------------------------------\n"
        "# THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)\n"
        "# ------------------------------------------------------\n\n"
    )
    sdl = _introspection_to_sdl(payload["data"]).rstrip()
    path.write_text(banner + sdl + "\n", encoding="utf-8")


# ---------------------------------------------------------------------------
# Node tooling (graphql-markdown + GraphQL Inspector via npx)
# ---------------------------------------------------------------------------


def _require_npx() -> str:
    """Return the path to ``npx`` or fail with an actionable message."""
    npx = shutil.which("npx")
    if not npx:
        raise SystemExit(
            "npx (Node.js) is required to render the reference and change report. "
            "Install Node.js 18+ (which provides npx) and retry."
        )
    return npx


def _run_node_tool(args: list[str], *, allowed_returncodes: tuple[int, ...] = (0,)) -> str:
    """Run a Node CLI via npx and return cleaned stdout.

    ``allowed_returncodes`` lists exit codes that still yield usable stdout —
    GraphQL Inspector, for example, exits non-zero when breaking changes exist.
    """
    npx = _require_npx()
    result = subprocess.run(  # noqa: S603 - args are constructed from constants
        [npx, "--yes", *args],
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode not in allowed_returncodes:
        raise SystemExit(
            f"Node tool failed ({' '.join(args)}), exit {result.returncode}:\n{result.stderr}"
        )
    return _ANSI_RE.sub("", result.stdout)


def _doc_header(title: str, *, source: str, generated_at: str) -> str:
    """Return a standard generated-doc banner."""
    return (
        f"# {title}\n\n"
        f"> Generated on {generated_at}\n"
        f"> Source: {source}\n"
        "> Rendered by graphql-markdown / GraphQL Inspector — do not edit by hand.\n\n"
    )


def _render_complete_reference(sdl_path: Path, *, source: str, generated_at: str) -> str:
    """Render the full Markdown reference from an SDL file via graphql-markdown."""
    body = _run_node_tool([GRAPHQL_MARKDOWN_PKG, str(sdl_path)]).strip()
    header = _doc_header("Unraid API Complete Reference", source=source, generated_at=generated_at)
    return header + body + "\n"


def _render_changes(
    previous_sdl_path: Path | None,
    current_sdl_path: Path,
    *,
    source: str,
    generated_at: str,
) -> str:
    """Render the schema change report via GraphQL Inspector ``diff``."""
    header = _doc_header("Unraid API Schema Changes", source=source, generated_at=generated_at)
    if previous_sdl_path is None:
        return (
            header + "No previous introspection snapshot was available, so no diff could be "
            "computed.\n\nThe current canonical artifacts were regenerated successfully.\n"
        )

    # Inspector exits 0 (no/non-breaking changes) or 1 (breaking changes); both
    # produce a usable report. Anything else is a real failure.
    report = _run_node_tool(
        [GRAPHQL_INSPECTOR_PKG, "diff", str(previous_sdl_path), str(current_sdl_path)],
        allowed_returncodes=(0, 1),
    ).strip()
    if not report:
        report = "No changes detected."
    return header + "```text\n" + report + "\n```\n"


# ---------------------------------------------------------------------------
# Condensed summary (curated, project-specific)
# ---------------------------------------------------------------------------


def _type_to_str(type_ref: dict[str, Any] | None) -> str:
    """Render GraphQL nested type refs to SDL-like notation."""
    if not type_ref:
        return "Unknown"
    kind = type_ref.get("kind")
    if kind == "NON_NULL":
        return f"{_type_to_str(type_ref.get('ofType'))}!"
    if kind == "LIST":
        return f"[{_type_to_str(type_ref.get('ofType'))}]"
    return str(type_ref.get("name") or kind or "Unknown")


def _visible_types(
    schema: dict[str, Any], *, include_introspection: bool = False
) -> list[dict[str, Any]]:
    """Return visible types from the schema."""
    types = schema.get("types") or []
    return [
        item
        for item in types
        if item.get("name") and (include_introspection or not str(item["name"]).startswith("__"))
    ]


def _types_by_name(
    schema: dict[str, Any], *, include_introspection: bool = False
) -> dict[str, dict[str, Any]]:
    """Map visible types by name."""
    return {
        str(item["name"]): item
        for item in _visible_types(schema, include_introspection=include_introspection)
    }


def _build_summary_markdown(
    schema: dict[str, Any], *, source: str, generated_at: str, include_introspection: bool
) -> str:
    """Build condensed root-level summary markdown."""
    types = _types_by_name(schema, include_introspection=include_introspection)
    visible_types = _visible_types(schema, include_introspection=include_introspection)
    directives = sorted(schema.get("directives") or [], key=lambda item: str(item["name"]))
    kind_counts = Counter(str(item.get("kind", "UNKNOWN")) for item in visible_types)
    query_root = (schema.get("queryType") or {}).get("name")
    mutation_root = (schema.get("mutationType") or {}).get("name")
    subscription_root = (schema.get("subscriptionType") or {}).get("name")

    lines = [
        "# Unraid API Introspection Summary",
        "",
        f"> Auto-generated from API introspection on {generated_at}",
        f"> Source: {source}",
        "",
        "## Table of Contents",
        "",
        "- [Schema Summary](#schema-summary)",
        "- [Query Fields](#query-fields)",
        "- [Mutation Fields](#mutation-fields)",
        "- [Subscription Fields](#subscription-fields)",
        "- [Type Kinds](#type-kinds)",
        "",
        "## Schema Summary",
        f"- Query root: `{query_root}`",
        f"- Mutation root: `{mutation_root}`",
        f"- Subscription root: `{subscription_root}`",
        f"- Total types: **{len(visible_types)}**",
        f"- Total directives: **{len(directives)}**",
        "",
    ]

    def render_table(section_title: str, root_name: str | None) -> None:
        lines.append(f"## {section_title}")
        lines.append("")
        lines.append("| Field | Return Type | Arguments |")
        lines.append("|-------|-------------|-----------|")
        root = types.get(str(root_name)) if root_name else None
        for field in (
            sorted(root.get("fields") or [], key=lambda item: str(item["name"])) if root else []
        ):
            args = sorted(field.get("args") or [], key=lambda item: str(item["name"]))
            arg_text = (
                " — "
                if not args
                else ", ".join(
                    (
                        f"{arg['name']}: {_type_to_str(arg.get('type'))}"
                        + (
                            f" (default: {arg['defaultValue']})"
                            if arg.get("defaultValue") is not None
                            else ""
                        )
                    )
                    for arg in args
                )
            )
            lines.append(
                f"| `{field['name']}` | `{_type_to_str(field.get('type'))}` | {arg_text} |"
            )
        lines.append("")

    render_table("Query Fields", query_root)
    render_table("Mutation Fields", mutation_root)
    render_table("Subscription Fields", subscription_root)

    lines.append("## Type Kinds")
    lines.append("")
    for kind in sorted(kind_counts):
        lines.append(f"- `{kind}`: {kind_counts[kind]}")  # noqa: PERF401
    lines.extend(
        [
            "",
            "## Notes",
            "",
            "- This summary is intentionally condensed; the full schema reference lives in `UNRAID-API-COMPLETE-REFERENCE.md`.",
            "- Raw schema exports live in `UNRAID-API-INTROSPECTION.json` and `UNRAID-SCHEMA.graphql`.",
            "",
        ]
    )
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def _parse_args() -> argparse.Namespace:
    """Parse CLI args."""
    parser = argparse.ArgumentParser(
        description="Generate canonical Unraid GraphQL docs from introspection."
    )
    parser.add_argument(
        "--api-url",
        default=os.getenv("UNRAID_API_URL", ""),
        help="GraphQL endpoint URL (default: UNRAID_API_URL env var).",
    )
    parser.add_argument(
        "--api-key",
        default=os.getenv("UNRAID_API_KEY", ""),
        help="API key (default: UNRAID_API_KEY env var).",
    )
    parser.add_argument(
        "--from-introspection",
        type=Path,
        default=None,
        help=(
            "Read the introspection payload from this JSON file instead of querying "
            "a live API. Useful for offline regeneration and tests."
        ),
    )
    parser.add_argument(
        "--complete-output",
        type=Path,
        default=DEFAULT_COMPLETE_OUTPUT,
        help=f"Full reference output path (default: {DEFAULT_COMPLETE_OUTPUT}).",
    )
    parser.add_argument(
        "--summary-output",
        type=Path,
        default=DEFAULT_SUMMARY_OUTPUT,
        help=f"Summary output path (default: {DEFAULT_SUMMARY_OUTPUT}).",
    )
    parser.add_argument(
        "--introspection-output",
        type=Path,
        default=DEFAULT_INTROSPECTION_OUTPUT,
        help=f"Introspection JSON output path (default: {DEFAULT_INTROSPECTION_OUTPUT}).",
    )
    parser.add_argument(
        "--schema-output",
        type=Path,
        default=DEFAULT_SCHEMA_OUTPUT,
        help=f"SDL schema output path (default: {DEFAULT_SCHEMA_OUTPUT}).",
    )
    parser.add_argument(
        "--changes-output",
        type=Path,
        default=DEFAULT_CHANGES_OUTPUT,
        help=f"Schema changes report path (default: {DEFAULT_CHANGES_OUTPUT}).",
    )
    parser.add_argument(
        "--previous-introspection",
        type=Path,
        default=None,
        help=(
            "Previous introspection JSON used for diffing. Defaults to the current "
            "introspection output path, falling back to the legacy docs path if present."
        ),
    )
    parser.add_argument(
        "--timeout-seconds",
        type=float,
        default=90.0,
        help="HTTP timeout in seconds (default: 90).",
    )
    parser.add_argument(
        "--verify-ssl",
        action="store_true",
        help="Enable SSL cert verification. Default is disabled for local/self-signed setups.",
    )
    parser.add_argument(
        "--include-introspection-types",
        action="store_true",
        help="Include __Schema/__Type/etc in the generated summary type list.",
    )
    return parser.parse_args()


def _fetch_payload(args: argparse.Namespace) -> dict[str, Any]:
    """Return the introspection payload from a file or a live API query."""
    if args.from_introspection is not None:
        payload = _load_payload(args.from_introspection)
        if payload.get("errors"):
            errors = json.dumps(payload["errors"], indent=2)
            raise SystemExit(f"Saved introspection payload contains errors:\n{errors}")
        return payload

    if not args.api_url:
        raise SystemExit("Missing API URL. Provide --api-url or set UNRAID_API_URL.")
    if not args.api_key:
        raise SystemExit("Missing API key. Provide --api-key or set UNRAID_API_KEY.")

    headers = {"x-api-key": args.api_key, "Content-Type": "application/json"}
    with httpx.Client(timeout=args.timeout_seconds, verify=args.verify_ssl) as client:
        response = client.post(args.api_url, json={"query": INTROSPECTION_QUERY}, headers=headers)
    response.raise_for_status()
    payload = response.json()
    if payload.get("errors"):
        errors = json.dumps(payload["errors"], indent=2)
        raise SystemExit(f"GraphQL introspection returned errors:\n{errors}")
    return payload


def main() -> int:
    """Run generator CLI."""
    args = _parse_args()

    payload = _fetch_payload(args)
    source = str(args.from_introspection) if args.from_introspection is not None else args.api_url

    schema = _extract_schema(payload)
    generated_at = dt.datetime.now(dt.UTC).replace(microsecond=0).isoformat()

    previous_path = args.previous_introspection or (
        args.introspection_output
        if args.introspection_output.exists()
        else LEGACY_INTROSPECTION_OUTPUT
    )
    previous_schema = _load_previous_schema(previous_path)

    for path in {
        args.complete_output,
        args.summary_output,
        args.introspection_output,
        args.schema_output,
        args.changes_output,
    }:
        path.parent.mkdir(parents=True, exist_ok=True)

    summary = _build_summary_markdown(
        schema,
        source=source,
        generated_at=generated_at,
        include_introspection=bool(args.include_introspection_types),
    )

    # Render the SDL-based docs with the Node tools. The previous schema (if any)
    # is written to a temp SDL file so Inspector can diff old vs new.
    with tempfile.TemporaryDirectory() as tmp:
        current_sdl = Path(tmp) / "current.graphql"
        current_sdl.write_text(_introspection_to_sdl(payload["data"]), encoding="utf-8")

        previous_sdl: Path | None = None
        if previous_schema is not None:
            previous_sdl = Path(tmp) / "previous.graphql"
            previous_sdl.write_text(
                _introspection_to_sdl({"__schema": previous_schema}), encoding="utf-8"
            )

        full_reference = _render_complete_reference(
            current_sdl, source=source, generated_at=generated_at
        )
        changes = _render_changes(
            previous_sdl, current_sdl, source=source, generated_at=generated_at
        )

    args.complete_output.write_text(full_reference, encoding="utf-8")
    args.summary_output.write_text(summary, encoding="utf-8")
    args.introspection_output.write_text(
        json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )
    _write_schema_graphql(args.schema_output, payload)
    args.changes_output.write_text(changes, encoding="utf-8")

    print(f"Wrote {args.complete_output}")
    print(f"Wrote {args.summary_output}")
    print(f"Wrote {args.introspection_output}")
    print(f"Wrote {args.schema_output}")
    print(f"Wrote {args.changes_output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
