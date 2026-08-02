"""Validate every runtime GraphQL operation against an introspected live schema."""

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import TYPE_CHECKING, Any

import httpx
from graphql import (
    GraphQLSchema,
    build_client_schema,
    get_introspection_query,
    parse,
    validate,
)

from unraid_mcp.devtools.graphql_inventory import all_operation_cases


if TYPE_CHECKING:
    from collections.abc import Iterable


@dataclass(frozen=True)
class OperationValidationFailure:
    """One runtime operation that is incompatible with the live schema."""

    source: str
    name: str
    errors: tuple[str, ...]


def fetch_live_schema(
    api_url: str,
    api_key: str,
    *,
    verify_ssl: bool | str = True,
    timeout_seconds: float = 30.0,
) -> GraphQLSchema:
    """Fetch an authenticated GraphQL introspection result and build its schema."""
    with httpx.Client(timeout=timeout_seconds, verify=verify_ssl) as client:
        response = client.post(
            api_url,
            headers={"X-API-Key": api_key},
            json={"query": get_introspection_query(descriptions=False)},
        )
        response.raise_for_status()

    payload: dict[str, Any] = response.json()
    errors = payload.get("errors")
    if errors:
        messages = "; ".join(str(error.get("message", error)) for error in errors)
        raise RuntimeError(f"GraphQL introspection failed: {messages}")
    data = payload.get("data")
    if not isinstance(data, dict) or "__schema" not in data:
        raise RuntimeError("GraphQL introspection returned no data.__schema payload")
    return build_client_schema(data)


def validate_operation_inventory(
    schema: GraphQLSchema,
    cases: Iterable[tuple[str, str, str]] | None = None,
) -> list[OperationValidationFailure]:
    """Return every runtime operation that fails validation against ``schema``."""
    failures: list[OperationValidationFailure] = []
    operation_cases = all_operation_cases() if cases is None else cases
    for source, name, operation in operation_cases:
        errors = validate(schema, parse(operation))
        if errors:
            failures.append(
                OperationValidationFailure(
                    source=source,
                    name=name,
                    errors=tuple(str(error) for error in errors),
                )
            )
    return failures


def require_live_credentials() -> tuple[str, str]:
    """Read the live API credentials or fail instead of silently skipping the gate."""
    api_url = os.environ.get("UNRAID_API_URL", "").strip()
    api_key = os.environ.get("UNRAID_API_KEY", "").strip()
    missing = [
        name
        for name, value in (("UNRAID_API_URL", api_url), ("UNRAID_API_KEY", api_key))
        if not value
    ]
    if missing:
        raise RuntimeError(f"Missing required live credential(s): {', '.join(missing)}")
    return api_url, api_key


def resolve_tls_verification() -> bool | str:
    """Apply the server's guarded TLS verification environment contract."""
    raw_verify = os.environ.get("UNRAID_VERIFY_SSL", "true").strip()
    normalized = raw_verify.lower()
    if normalized in {"", "true", "1", "yes"}:
        return True
    if normalized in {"false", "0", "no"}:
        allow_insecure = os.environ.get("UNRAID_ALLOW_INSECURE_TLS", "").strip().lower()
        if allow_insecure not in {"true", "1", "yes"}:
            raise RuntimeError(
                "UNRAID_VERIFY_SSL is disabled without UNRAID_ALLOW_INSECURE_TLS=true"
            )
        return False
    return raw_verify


def main() -> int:
    """Run the blocking live-schema compatibility gate."""
    api_url, api_key = require_live_credentials()
    schema = fetch_live_schema(api_url, api_key, verify_ssl=resolve_tls_verification())
    cases = all_operation_cases()
    failures = validate_operation_inventory(schema, cases)
    if failures:
        details = "\n".join(
            f"- {failure.source}/{failure.name}: {failure.errors[0]}" for failure in failures
        )
        raise SystemExit(
            f"{len(failures)} of {len(cases)} runtime GraphQL operations are incompatible "
            f"with the live schema:\n{details}"
        )
    print(f"Validated {len(cases)} runtime GraphQL operations against the live schema.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
