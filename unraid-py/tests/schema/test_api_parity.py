"""API root-field parity checks for exposed GraphQL operations."""

from unraid_mcp.devtools.api_parity import (
    INTENTIONAL_SUBSCRIPTION_GAPS,
    api_parity_report,
)


def test_unraid_api_root_field_gaps_are_explicit() -> None:
    report = api_parity_report()

    for section in ("query", "mutation", "subscription"):
        assert report[section]["unclassified_missing"] == []
        assert report[section]["stale_intentional_gaps"] == []
        assert report[section]["unknown_used_fields"] == []


def test_current_query_gaps_are_intentional() -> None:
    report = api_parity_report()

    assert report["query"]["missing"] == []
    assert report["query"]["intentional"] == {}


def test_mutation_root_field_parity_is_complete() -> None:
    report = api_parity_report()

    assert report["mutation"]["missing"] == []
    assert report["mutation"]["intentional"] == {}


def test_subscription_root_field_parity_is_complete() -> None:
    report = api_parity_report()

    assert report["subscription"]["missing"] == []
    assert report["subscription"]["intentional"] == INTENTIONAL_SUBSCRIPTION_GAPS
