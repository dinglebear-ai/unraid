"""Root-field parity report between Unraid GraphQL schema and emitted operations."""

from __future__ import annotations

from collections import defaultdict
from pathlib import Path
from typing import Any

from graphql import (
    FieldNode,
    FragmentDefinitionNode,
    FragmentSpreadNode,
    GraphQLObjectType,
    InlineFragmentNode,
    OperationDefinitionNode,
    SelectionNode,
    SelectionSetNode,
    build_schema,
    parse,
)

from unraid_mcp.devtools.graphql_inventory import all_operation_cases


SCHEMA_PATH = Path(__file__).resolve().parents[3] / "docs" / "unraid" / "UNRAID-SCHEMA.graphql"

INTENTIONAL_QUERY_GAPS: dict[str, str] = {}
INTENTIONAL_MUTATION_GAPS: dict[str, str] = {}
INTENTIONAL_SUBSCRIPTION_GAPS: dict[str, str] = {}


def api_parity_report() -> dict[str, Any]:
    """Return schema root-field coverage for the current operation inventory."""
    used_by_kind = _used_root_fields_by_kind()
    sections = {
        "query": _section(
            schema_fields=_root_fields("query"),
            used_fields=used_by_kind["query"],
            intentional_gaps=INTENTIONAL_QUERY_GAPS,
        ),
        "mutation": _section(
            schema_fields=_root_fields("mutation"),
            used_fields=used_by_kind["mutation"],
            intentional_gaps=INTENTIONAL_MUTATION_GAPS,
        ),
        "subscription": _section(
            schema_fields=_root_fields("subscription"),
            used_fields=used_by_kind["subscription"],
            intentional_gaps=INTENTIONAL_SUBSCRIPTION_GAPS,
        ),
    }
    return {
        "operation_count": len(all_operation_cases()),
        **sections,
    }


def _section(
    *,
    schema_fields: set[str],
    used_fields: set[str],
    intentional_gaps: dict[str, str],
) -> dict[str, Any]:
    missing = schema_fields - used_fields
    intentional_missing = missing & set(intentional_gaps)
    return {
        "total": len(schema_fields),
        "used": len(used_fields & schema_fields),
        "missing": sorted(missing),
        "intentional": {name: intentional_gaps[name] for name in sorted(intentional_missing)},
        "unclassified_missing": sorted(missing - set(intentional_gaps)),
        "stale_intentional_gaps": sorted(set(intentional_gaps) - missing),
        "unknown_used_fields": sorted(used_fields - schema_fields),
    }


def _root_fields(kind: str) -> set[str]:
    graphql_schema = build_schema(SCHEMA_PATH.read_text())
    root_type = {
        "query": graphql_schema.query_type,
        "mutation": graphql_schema.mutation_type,
        "subscription": graphql_schema.subscription_type,
    }[kind]
    if not isinstance(root_type, GraphQLObjectType):
        return set()
    return set(root_type.fields)


def _used_root_fields_by_kind() -> dict[str, set[str]]:
    used: dict[str, set[str]] = defaultdict(set)
    for _source, _name, operation in all_operation_cases():
        doc = parse(operation)
        fragments = {
            definition.name.value: definition
            for definition in doc.definitions
            if isinstance(definition, FragmentDefinitionNode)
        }
        for definition in doc.definitions:
            if not isinstance(definition, OperationDefinitionNode):
                continue
            kind = definition.operation.value
            used[kind].update(_root_field_names(definition.selection_set, fragments))
    return used


def _root_field_names(
    selection_set: SelectionSetNode,
    fragments: dict[str, FragmentDefinitionNode],
) -> set[str]:
    names: set[str] = set()
    for selection in selection_set.selections:
        names.update(_selection_root_field_names(selection, fragments))
    return names


def _selection_root_field_names(
    selection: SelectionNode,
    fragments: dict[str, FragmentDefinitionNode],
) -> set[str]:
    if isinstance(selection, FieldNode):
        return {selection.name.value}
    if isinstance(selection, InlineFragmentNode):
        return _root_field_names(selection.selection_set, fragments)
    if isinstance(selection, FragmentSpreadNode):
        fragment = fragments.get(selection.name.value)
        if fragment is None:
            return set()
        return _root_field_names(fragment.selection_set, fragments)
    return set()
