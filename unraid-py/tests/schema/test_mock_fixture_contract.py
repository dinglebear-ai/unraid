"""Schema contract for the offline GraphQL mock responses."""

from pathlib import Path
from typing import Any, get_args

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
    validate,
)

from tests.schema.mock_unraid import SCENARIOS, mock_graphql_response
from unraid_mcp.devtools.graphql_inventory import all_operation_cases


SCHEMA_PATH = Path(__file__).resolve().parents[2] / "docs" / "unraid" / "UNRAID-SCHEMA.graphql"


def _schema() -> GraphQLSchema:
    return build_schema(SCHEMA_PATH.read_text())


def test_mock_scenarios_conform_to_selected_graphql_shapes() -> None:
    schema = _schema()
    errors: list[str] = []

    for action, subaction, query in all_operation_cases():
        doc = parse(query)
        validation_errors = validate(schema, doc)
        assert not validation_errors, f"{action}/{subaction} query is invalid: {validation_errors}"

        op = next(
            definition
            for definition in doc.definitions
            if isinstance(definition, OperationDefinitionNode)
        )
        root_type = {
            "query": schema.query_type,
            "mutation": schema.mutation_type,
            "subscription": schema.subscription_type,
        }[op.operation.value]
        assert root_type is not None
        for scenario in SCENARIOS:
            response = mock_graphql_response(query, scenario=scenario)
            _check_selection_set(
                schema,
                root_type,
                op.selection_set.selections,
                response,
                f"{scenario}/{action}/{subaction}",
                errors,
            )

    assert not errors, "mock GraphQL responses violate selected shapes:\n  - " + "\n  - ".join(
        errors
    )


def _check_selection_set(
    schema: GraphQLSchema,
    parent_type: GraphQLObjectType,
    selections: Any,
    value: Any,
    path: str,
    errors: list[str],
) -> None:
    if value is None:
        return
    if not isinstance(value, dict):
        errors.append(f"{path}: expected object, got {type(value).__name__}")
        return

    for selection in selections:
        if not isinstance(selection, FieldNode):
            continue
        field_name = selection.name.value
        response_key = selection.alias.value if selection.alias else field_name
        if response_key not in value:
            errors.append(f"{path}.{response_key}: missing selected field")
            continue
        field = parent_type.fields.get(field_name)
        if field is None:
            errors.append(f"{path}.{response_key}: field not found on {parent_type.name}")
            continue
        _check_value(
            schema, field.type, selection, value[response_key], f"{path}.{response_key}", errors
        )


def _check_value(
    schema: GraphQLSchema,
    graphql_type: Any,
    selection: FieldNode,
    value: Any,
    path: str,
    errors: list[str],
) -> None:
    if isinstance(graphql_type, GraphQLNonNull):
        graphql_type = graphql_type.of_type
    if value is None:
        return
    if isinstance(graphql_type, GraphQLList):
        if not isinstance(value, list):
            errors.append(f"{path}: expected list, got {type(value).__name__}")
            return
        for index, item in enumerate(value):
            _check_value(schema, graphql_type.of_type, selection, item, f"{path}[{index}]", errors)
        return
    if isinstance(graphql_type, GraphQLObjectType):
        _check_selection_set(
            schema,
            graphql_type,
            selection.selection_set.selections if selection.selection_set else (),
            value,
            path,
            errors,
        )
        return
    if isinstance(graphql_type, GraphQLEnumType):
        if value not in graphql_type.values:
            errors.append(f"{path}: {value!r} is not a valid {graphql_type.name}")
        return
    if isinstance(graphql_type, GraphQLScalarType):
        _check_scalar(graphql_type.name, value, path, errors)


def _check_scalar(name: str, value: Any, path: str, errors: list[str]) -> None:
    expected = {
        "String": str,
        "ID": str,
        "PrefixedID": str,
        "URL": str,
        "DateTime": str,
        "BigInt": str,
        "Boolean": bool,
        "Int": int,
        "Port": int,
        "Float": (int, float),
    }.get(name)
    if expected is not None and not isinstance(value, expected):
        type_names = (
            expected.__name__
            if isinstance(expected, type)
            else " or ".join(t.__name__ for t in get_args(expected) or expected)
        )
        errors.append(f"{path}: scalar {name} expected {type_names}, got {type(value).__name__}")
