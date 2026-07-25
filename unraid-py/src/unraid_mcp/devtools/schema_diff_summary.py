"""Summarize GraphQL SDL changes for schema-drift issue bodies."""

from __future__ import annotations

import argparse
from dataclasses import dataclass, field
from pathlib import Path
from typing import TYPE_CHECKING

from graphql import (
    GraphQLEnumType,
    GraphQLField,
    GraphQLInputField,
    GraphQLInputObjectType,
    GraphQLInterfaceType,
    GraphQLObjectType,
    GraphQLSchema,
    build_schema,
)


if TYPE_CHECKING:
    from collections.abc import Mapping


_BUILTIN_TYPES = {
    "Boolean",
    "Float",
    "ID",
    "Int",
    "String",
}


@dataclass(frozen=True)
class SchemaChangeSummary:
    """Structured differences between two GraphQL schemas."""

    added_root_fields: dict[str, list[str]] = field(default_factory=dict)
    removed_root_fields: dict[str, list[str]] = field(default_factory=dict)
    added_types: list[str] = field(default_factory=list)
    removed_types: list[str] = field(default_factory=list)
    added_fields: list[str] = field(default_factory=list)
    removed_fields: list[str] = field(default_factory=list)
    changed_fields: list[str] = field(default_factory=list)
    added_enum_values: list[str] = field(default_factory=list)
    removed_enum_values: list[str] = field(default_factory=list)

    def has_changes(self) -> bool:
        """Return true when any structured change was detected."""
        return any(
            (
                self.added_root_fields,
                self.removed_root_fields,
                self.added_types,
                self.removed_types,
                self.added_fields,
                self.removed_fields,
                self.changed_fields,
                self.added_enum_values,
                self.removed_enum_values,
            )
        )


def compare_schema_sdl(old_sdl: str, new_sdl: str) -> SchemaChangeSummary:
    """Compare two SDL documents and return a structured change summary."""
    old_schema = build_schema(old_sdl)
    new_schema = build_schema(new_sdl)
    return compare_schemas(old_schema, new_schema)


def compare_schemas(old_schema: GraphQLSchema, new_schema: GraphQLSchema) -> SchemaChangeSummary:
    """Compare two parsed GraphQL schemas."""
    old_types = _public_types(old_schema)
    new_types = _public_types(new_schema)
    shared_types = sorted(set(old_types) & set(new_types))
    non_root_shared_types = [
        name for name in shared_types if name not in _root_type_names(old_schema, new_schema)
    ]

    return SchemaChangeSummary(
        added_root_fields=_root_field_delta(old_schema, new_schema, added=True),
        removed_root_fields=_root_field_delta(old_schema, new_schema, added=False),
        added_types=sorted(set(new_types) - set(old_types)),
        removed_types=sorted(set(old_types) - set(new_types)),
        added_fields=_field_delta(old_types, new_types, non_root_shared_types, added=True),
        removed_fields=_field_delta(old_types, new_types, non_root_shared_types, added=False),
        changed_fields=_changed_fields(old_types, new_types, shared_types),
        added_enum_values=_enum_value_delta(old_types, new_types, shared_types, added=True),
        removed_enum_values=_enum_value_delta(old_types, new_types, shared_types, added=False),
    )


def render_markdown(summary: SchemaChangeSummary, *, max_items: int = 120) -> str:
    """Render a schema change summary as compact GitHub Markdown."""
    lines = ["## Structured schema changes", ""]
    if not summary.has_changes():
        lines.append("No structured schema changes detected; inspect the raw SDL diff below.")
        return "\n".join(lines) + "\n"

    _append_root_section(lines, "Added root fields", summary.added_root_fields, max_items)
    _append_root_section(lines, "Removed root fields", summary.removed_root_fields, max_items)
    _append_list_section(lines, "Added types", summary.added_types, max_items)
    _append_list_section(lines, "Removed types", summary.removed_types, max_items)
    _append_list_section(lines, "Added fields", summary.added_fields, max_items)
    _append_list_section(lines, "Removed fields", summary.removed_fields, max_items)
    _append_list_section(lines, "Changed field signatures", summary.changed_fields, max_items)
    _append_list_section(lines, "Added enum values", summary.added_enum_values, max_items)
    _append_list_section(lines, "Removed enum values", summary.removed_enum_values, max_items)
    return "\n".join(lines).rstrip() + "\n"


def _public_types(schema: GraphQLSchema) -> dict[str, object]:
    return {
        name: graphql_type
        for name, graphql_type in schema.type_map.items()
        if not name.startswith("__") and name not in _BUILTIN_TYPES
    }


def _root_field_delta(
    old_schema: GraphQLSchema, new_schema: GraphQLSchema, *, added: bool
) -> dict[str, list[str]]:
    delta: dict[str, list[str]] = {}
    for kind in ("query", "mutation", "subscription"):
        old_fields = _root_fields(old_schema, kind)
        new_fields = _root_fields(new_schema, kind)
        names = sorted((new_fields - old_fields) if added else (old_fields - new_fields))
        if names:
            delta[kind] = [f"{_root_type_name(kind)}.{name}" for name in names]
    return delta


def _root_type_name(kind: str) -> str:
    return {
        "query": "Query",
        "mutation": "Mutation",
        "subscription": "Subscription",
    }[kind]


def _root_type_names(old_schema: GraphQLSchema, new_schema: GraphQLSchema) -> set[str]:
    names = set()
    for schema in (old_schema, new_schema):
        for root_type in (schema.query_type, schema.mutation_type, schema.subscription_type):
            if isinstance(root_type, GraphQLObjectType):
                names.add(root_type.name)
    return names


def _root_fields(schema: GraphQLSchema, kind: str) -> set[str]:
    root_type = {
        "query": schema.query_type,
        "mutation": schema.mutation_type,
        "subscription": schema.subscription_type,
    }[kind]
    if isinstance(root_type, GraphQLObjectType):
        return set(root_type.fields)
    return set()


def _field_delta(
    old_types: Mapping[str, object],
    new_types: Mapping[str, object],
    shared_types: list[str],
    *,
    added: bool,
) -> list[str]:
    changes: list[str] = []
    for type_name in shared_types:
        old_fields = _fields(old_types[type_name])
        new_fields = _fields(new_types[type_name])
        names = sorted(
            (set(new_fields) - set(old_fields)) if added else (set(old_fields) - set(new_fields))
        )
        changes.extend(f"{type_name}.{name}" for name in names)
    return changes


def _changed_fields(
    old_types: Mapping[str, object],
    new_types: Mapping[str, object],
    shared_types: list[str],
) -> list[str]:
    changes: list[str] = []
    for type_name in shared_types:
        old_fields = _fields(old_types[type_name])
        new_fields = _fields(new_types[type_name])
        for field_name in sorted(set(old_fields) & set(new_fields)):
            old_signature = _field_signature(old_fields[field_name])
            new_signature = _field_signature(new_fields[field_name])
            if old_signature != new_signature:
                changes.append(f"{type_name}.{field_name}: `{old_signature}` -> `{new_signature}`")
    return changes


def _fields(graphql_type: object) -> Mapping[str, GraphQLField | GraphQLInputField]:
    if isinstance(graphql_type, GraphQLObjectType | GraphQLInterfaceType):
        return graphql_type.fields
    if isinstance(graphql_type, GraphQLInputObjectType):
        return graphql_type.fields
    return {}


def _field_signature(field_obj: GraphQLField | GraphQLInputField) -> str:
    if isinstance(field_obj, GraphQLInputField):
        return str(field_obj.type)
    args = ", ".join(f"{name}: {arg.type}" for name, arg in sorted(field_obj.args.items()))
    if args:
        return f"({args}): {field_obj.type}"
    return str(field_obj.type)


def _enum_value_delta(
    old_types: Mapping[str, object],
    new_types: Mapping[str, object],
    shared_types: list[str],
    *,
    added: bool,
) -> list[str]:
    changes: list[str] = []
    for type_name in shared_types:
        old_type = old_types[type_name]
        new_type = new_types[type_name]
        if not isinstance(old_type, GraphQLEnumType) or not isinstance(new_type, GraphQLEnumType):
            continue
        old_values = set(old_type.values)
        new_values = set(new_type.values)
        names = sorted((new_values - old_values) if added else (old_values - new_values))
        changes.extend(f"{type_name}.{name}" for name in names)
    return changes


def _append_root_section(
    lines: list[str], title: str, sections: dict[str, list[str]], max_items: int
) -> None:
    items = [
        item for kind in ("query", "mutation", "subscription") for item in sections.get(kind, [])
    ]
    _append_list_section(lines, title, items, max_items)


def _append_list_section(lines: list[str], title: str, items: list[str], max_items: int) -> None:
    if not items:
        return
    lines.extend([f"### {title}", ""])
    visible = items[:max_items]
    lines.extend(f"- `{item}`" if "`" not in item else f"- {item}" for item in visible)
    hidden_count = len(items) - len(visible)
    if hidden_count > 0:
        lines.append(f"- ... and {hidden_count} more")
    lines.append("")


def main() -> None:
    """Run the schema summary CLI."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("old_schema", type=Path)
    parser.add_argument("new_schema", type=Path)
    parser.add_argument("--max-items", type=int, default=120)
    args = parser.parse_args()

    summary = compare_schema_sdl(
        args.old_schema.read_text(encoding="utf-8"),
        args.new_schema.read_text(encoding="utf-8"),
    )
    print(render_markdown(summary, max_items=args.max_items), end="")


if __name__ == "__main__":
    main()
