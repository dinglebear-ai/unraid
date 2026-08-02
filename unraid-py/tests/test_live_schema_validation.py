"""Tests for the live GraphQL operation compatibility gate."""

import pytest
from graphql import build_schema

from unraid_mcp.devtools.live_schema_validation import (
    require_live_credentials,
    resolve_tls_verification,
    validate_operation_inventory,
)


def test_validate_operation_inventory_reports_incompatible_operations() -> None:
    schema = build_schema("type Query { server: String! }")
    cases = [
        ("system", "server", "query Server { server }"),
        ("docker", "containers", "query Containers { docker { containers { id } } }"),
    ]

    failures = validate_operation_inventory(schema, cases)

    assert [(failure.source, failure.name) for failure in failures] == [("docker", "containers")]
    assert "Cannot query field 'docker' on type 'Query'" in failures[0].errors[0]


def test_require_live_credentials_fails_closed(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("UNRAID_API_URL", raising=False)
    monkeypatch.delenv("UNRAID_API_KEY", raising=False)

    with pytest.raises(RuntimeError, match="UNRAID_API_URL, UNRAID_API_KEY"):
        require_live_credentials()


def test_tls_verification_requires_explicit_second_opt_in(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("UNRAID_VERIFY_SSL", "false")
    monkeypatch.delenv("UNRAID_ALLOW_INSECURE_TLS", raising=False)

    with pytest.raises(RuntimeError, match="UNRAID_ALLOW_INSECURE_TLS=true"):
        resolve_tls_verification()

    monkeypatch.setenv("UNRAID_ALLOW_INSECURE_TLS", "true")
    assert resolve_tls_verification() is False
