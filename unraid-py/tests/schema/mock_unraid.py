"""Schema-shaped offline Unraid GraphQL mock used by contract tests."""

from functools import lru_cache
from pathlib import Path
from typing import Any

from graphql import (
    FieldNode,
    GraphQLEnumType,
    GraphQLList,
    GraphQLNonNull,
    GraphQLObjectType,
    GraphQLScalarType,
    GraphQLSchema,
    OperationDefinitionNode,
    build_schema,
    parse,
)


SCHEMA_PATH = Path(__file__).resolve().parents[2] / "docs" / "unraid" / "UNRAID-SCHEMA.graphql"
CONTAINER_ID = "a" * 64
SCENARIOS = ("healthy", "degraded", "parity-running", "disk-failing")


def mock_graphql_response(query: str, scenario: str = "healthy") -> dict[str, Any]:
    """Return a schema-shaped data payload for ``query`` under ``scenario``."""
    if scenario not in SCENARIOS:
        raise ValueError(f"unknown mock Unraid scenario: {scenario}")

    response = _schema_shaped_response(query)
    _apply_scenario(response, scenario)
    return response


@lru_cache(maxsize=1)
def schema() -> GraphQLSchema:
    return build_schema(SCHEMA_PATH.read_text())


def _schema_shaped_response(query: str) -> dict[str, Any]:
    graphql_schema = schema()
    doc = parse(query)
    op = next(
        definition
        for definition in doc.definitions
        if isinstance(definition, OperationDefinitionNode)
    )
    root_type = {
        "query": graphql_schema.query_type,
        "mutation": graphql_schema.mutation_type,
        "subscription": graphql_schema.subscription_type,
    }[op.operation.value]
    assert root_type is not None
    return _selection_object(root_type, op.selection_set.selections, ())


def _selection_object(
    parent_type: GraphQLObjectType,
    selections: Any,
    path: tuple[str, ...],
) -> dict[str, Any]:
    out: dict[str, Any] = {}
    for selection in selections:
        if not isinstance(selection, FieldNode):
            continue
        field_name = selection.name.value
        response_key = selection.alias.value if selection.alias else field_name
        field = parent_type.fields[field_name]
        out[response_key] = _sample_value(
            field.type,
            selection.selection_set.selections if selection.selection_set else (),
            (*path, response_key),
        )
    return out


def _sample_value(graphql_type: Any, selections: Any, path: tuple[str, ...]) -> Any:
    if isinstance(graphql_type, GraphQLNonNull):
        return _sample_value(graphql_type.of_type, selections, path)
    if isinstance(graphql_type, GraphQLList):
        return [_sample_value(graphql_type.of_type, selections, (*path, "0"))]
    if isinstance(graphql_type, GraphQLObjectType):
        return _selection_object(graphql_type, selections, path)
    if isinstance(graphql_type, GraphQLEnumType):
        return next(iter(graphql_type.values))
    if isinstance(graphql_type, GraphQLScalarType):
        return _sample_scalar(graphql_type.name, path)
    return None


def _sample_scalar(name: str, path: tuple[str, ...]) -> Any:
    field = path[-1]
    joined = ".".join(path)
    if field == "id" and "network" in joined.lower():
        return "network-1"
    if field == "id" and "docker" in path:
        return CONTAINER_ID
    if field == "id" and "upsDeviceById" in path:
        return "server-1"
    if field == "id" and "disk" in joined.lower():
        return "disk-1"
    if field == "path" and "logFile" in path:
        return "/var/log/syslog"
    if field == "hostname":
        return "tower"
    if field == "name":
        return "name"
    if name in {"String", "ID", "PrefixedID"}:
        return "value"
    if name == "URL":
        return "https://example.com"
    if name == "DateTime":
        return "2026-06-23T00:00:00Z"
    if name == "BigInt":
        return "1"
    if name == "Boolean":
        return True
    if name in {"Int", "Port"}:
        return 1
    if name == "Float":
        return 1.0
    if name == "JSON":
        return {}
    return "value"


def _apply_scenario(response: dict[str, Any], scenario: str) -> None:
    if scenario == "healthy":
        return

    array = response.get("array")
    if isinstance(array, dict):
        parity = array.get("parityCheckStatus")
        if scenario == "parity-running" and isinstance(parity, dict):
            parity.update({"running": True, "paused": False, "progress": 50, "speed": "152 MB/s"})
        if scenario == "degraded":
            for disk in _list_values(array.get("disks")):
                if isinstance(disk, dict):
                    disk.update({"status": "DISK_DSBL", "numErrors": "1"})

    disks = response.get("disks")
    if scenario == "disk-failing":
        for disk in _list_values(disks):
            if isinstance(disk, dict):
                disk["smartStatus"] = "UNKNOWN"


def _list_values(value: Any) -> list[Any]:
    return value if isinstance(value, list) else []
