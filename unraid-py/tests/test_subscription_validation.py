"""Tests for _validate_subscription_query in diagnostics.py.

Security-critical: this function is the only guard against arbitrary GraphQL
operations (mutations, queries) or non-allowlisted subscription fields being sent
over the authenticated WebSocket subscription channel. Validation runs on the
parsed GraphQL AST (graphql-core), which closes the multi-field / alias /
argument smuggling bypasses a first-field-only regex allowlist permits (SEC-H1).
"""

import pytest
from graphql import FieldNode, OperationDefinitionNode, OperationType, parse

from unraid_mcp.core.exceptions import ToolError
from unraid_mcp.subscriptions.diagnostics import (
    _ALLOWED_SUBSCRIPTION_FIELDS,
    _validate_subscription_query,
)
from unraid_mcp.subscriptions.queries import SNAPSHOT_ACTIONS


class TestValidateSubscriptionQueryAllowed:
    """All whitelisted subscription field names must be accepted."""

    @pytest.mark.parametrize("sub_name", sorted(_ALLOWED_SUBSCRIPTION_FIELDS))
    def test_all_allowed_names_accepted(self, sub_name: str) -> None:
        query = f"subscription {{ {sub_name} {{ data }} }}"
        assert _validate_subscription_query(query) == sub_name

    def test_returns_extracted_subscription_name(self) -> None:
        assert _validate_subscription_query("subscription { cpu { usage } }") == "cpu"

    def test_system_metrics_network_accepted(self) -> None:
        assert (
            _validate_subscription_query(
                "subscription { systemMetricsNetwork { id name bytesReceived bytesSent } }"
            )
            == "systemMetricsNetwork"
        )

    def test_snapshot_subscription_fields_are_diagnostic_allowlisted(self) -> None:
        intentionally_blocked = {"log_tail", "notification_feed", "plugin_install_updates"}
        missing: dict[str, str] = {}
        for action, query in SNAPSHOT_ACTIONS.items():
            document = parse(query)
            operations = [d for d in document.definitions if isinstance(d, OperationDefinitionNode)]
            assert len(operations) == 1
            operation = operations[0]
            assert operation.operation is OperationType.SUBSCRIPTION
            assert len(operation.selection_set.selections) == 1
            selection = operation.selection_set.selections[0]
            assert isinstance(selection, FieldNode)
            field_name = selection.name.value
            if (
                field_name not in _ALLOWED_SUBSCRIPTION_FIELDS
                and action not in intentionally_blocked
            ):
                missing[action] = field_name

        assert not missing

    def test_leading_whitespace_accepted(self) -> None:
        assert _validate_subscription_query("  subscription { memory { free } }") == "memory"

    def test_multiline_query_accepted(self) -> None:
        query = "subscription {\n  cpu {\n    used\n  }\n}"
        assert _validate_subscription_query(query) == "cpu"

    def test_subfield_named_like_keyword_accepted(self) -> None:
        """A *subfield* literally named like 'mutation'/'query' is fine — only the
        operation type matters. (The old bare-word regex false-rejected these.)"""
        assert _validate_subscription_query("subscription { cpu { mutationField } }") == "cpu"
        assert _validate_subscription_query("subscription { cpu { queryResult } }") == "cpu"


class TestValidateSubscriptionQueryWrongOperation:
    """Non-subscription operations must be rejected."""

    def test_mutation_operation_rejected(self) -> None:
        with pytest.raises(ToolError, match="not a mutation or query"):
            _validate_subscription_query('mutation { docker { start(id: "abc") } }')

    def test_query_operation_rejected(self) -> None:
        with pytest.raises(ToolError, match="not a mutation or query"):
            _validate_subscription_query("query { info { os { platform } } }")

    def test_uppercase_operation_keyword_rejected(self) -> None:
        """GraphQL is case-sensitive: 'SUBSCRIPTION' is not a valid operation
        keyword, so the document fails to parse (the old IGNORECASE regex wrongly
        accepted it and would have forwarded an invalid query upstream)."""
        with pytest.raises(ToolError, match="not a valid GraphQL document"):
            _validate_subscription_query("SUBSCRIPTION { cpu { usage } }")


class TestValidateSubscriptionQueryInvalidFormat:
    """Syntactically invalid documents must be rejected as such."""

    @pytest.mark.parametrize(
        "bad",
        [
            "",
            "cpuSubscription { usage }",
            "subscription",
            "subscription {  }",
        ],
    )
    def test_invalid_graphql_rejected(self, bad: str) -> None:
        with pytest.raises(ToolError, match="not a valid GraphQL document"):
            _validate_subscription_query(bad)


class TestValidateSubscriptionQueryUnknownName:
    """Valid subscriptions selecting a non-allowlisted field must be rejected."""

    def test_unknown_subscription_name_rejected(self) -> None:
        with pytest.raises(ToolError, match="not allowed"):
            _validate_subscription_query("subscription { unknownSubscription { data } }")

    def test_error_message_includes_allowed_list(self) -> None:
        with pytest.raises(ToolError, match="Allowed fields"):
            _validate_subscription_query("subscription { badSub { data } }")

    def test_arbitrary_field_name_rejected(self) -> None:
        with pytest.raises(ToolError, match="not allowed"):
            _validate_subscription_query("subscription { users { id email } }")

    def test_logfile_rejected_security(self) -> None:
        """logFile allows arbitrary file reads via path argument — must be blocked."""
        with pytest.raises(ToolError, match="not allowed"):
            _validate_subscription_query(
                'subscription { logFile(path: "/etc/shadow") { content } }'
            )

    def test_close_but_not_whitelisted_rejected(self) -> None:
        """'cpuSubscription' (old operation-style name) is not in the field allow-list."""
        with pytest.raises(ToolError, match="not allowed"):
            _validate_subscription_query("subscription { cpuSubscription { usage } }")


class TestValidateSubscriptionQueryBypassRegression:
    """SEC-H1: a regex allowlist that checks only the first selected field is
    bypassable. The AST validator must reject every smuggling vector below.

    These tests would PASS validation (i.e. fail to reject) under the old
    first-field-only regex — they pin the fix.
    """

    def test_second_disallowed_field_rejected(self) -> None:
        """The PoC: an allowed first field plus a disallowed second field. The old
        regex returned 'cpu' and forwarded the whole query to the authed WS."""
        with pytest.raises(ToolError, match="exactly one top-level field"):
            _validate_subscription_query("subscription { cpu { used } secretAdminField { token } }")

    def test_two_allowlisted_fields_still_rejected(self) -> None:
        """Even two *allowed* fields are rejected — the probe tests exactly one."""
        with pytest.raises(ToolError, match="exactly one top-level field"):
            _validate_subscription_query("subscription { cpu { used } memory { free } }")

    def test_alias_smuggling_rejected(self) -> None:
        """An allowed-looking alias over a disallowed *real* field must be rejected —
        the real field name is what is validated."""
        with pytest.raises(ToolError, match="not allowed"):
            _validate_subscription_query("subscription { cpu: secretAdminField { token } }")

    def test_alias_over_allowed_field_accepted(self) -> None:
        """An alias over an allowed real field is fine (real name is allowlisted)."""
        assert _validate_subscription_query("subscription { myCpu: cpu { used } }") == "cpu"

    def test_top_level_fragment_spread_rejected(self) -> None:
        """A top-level fragment spread could smuggle a disallowed field — reject it."""
        query = (
            "subscription { ...evil } fragment evil on Subscription { secretAdminField { token } }"
        )
        with pytest.raises(ToolError):
            _validate_subscription_query(query)


class TestValidateSubscriptionQuerySizeAndFragments:
    """PR-review hardening: input size cap (DoS) and orphan-fragment rejection."""

    def test_oversized_query_rejected_before_parse(self) -> None:
        # Over the char cap → rejected WITHOUT invoking the linear-time GraphQL
        # parser, preventing an event-loop stall on a multi-MB input (CWE-400).
        huge = "subscription { cpu { " + "x " * 5000 + "} }"
        with pytest.raises(ToolError, match="exceeds the maximum length"):
            _validate_subscription_query(huge)

    def test_orphan_fragment_definition_rejected(self) -> None:
        # An extra (orphan) fragment definition rides along to the upstream WS
        # unused — the document must contain exactly one (subscription) definition.
        query = (
            "subscription { cpu { used } } "
            "fragment Evil on Subscription { notificationsWarningsAndAlerts { message } }"
        )
        with pytest.raises(ToolError, match="exactly one subscription operation"):
            _validate_subscription_query(query)
