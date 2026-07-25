import re
from pathlib import Path


# Workflows live at the monorepo root (two levels above this test file, which
# sits in unraid-py/tests/).
WORKFLOWS = Path(__file__).resolve().parents[2] / ".github" / "workflows"


def assert_uses_pinned_action(workflow: str, action: str) -> None:
    assert re.search(rf"uses: {re.escape(action)}@[0-9a-f]{{40}}\b", workflow)


def test_schema_drift_files_issue_with_context() -> None:
    schema_drift = (WORKFLOWS / "schema-drift.yml").read_text(encoding="utf-8")

    assert "actions: write" not in schema_drift
    assert "id: issue" in schema_drift
    assert_uses_pinned_action(schema_drift, "astral-sh/setup-uv")
    assert_uses_pinned_action(schema_drift, "actions/upload-artifact")
    assert "sha256sum upstream-schema.graphql" in schema_drift
    assert "upstream-schema-sha256:" in schema_drift
    assert "schema-drift" in schema_drift
    assert "max_body_bytes=60000" in schema_drift
    assert "append_with_budget schema-summary.md" in schema_drift
    assert "append_with_budget schema.diff" in schema_drift
    assert "unraid-schema-drift-${GITHUB_RUN_ID}" in schema_drift
    assert 'contains(\\"<!-- upstream-schema-sha256:\\")' in schema_drift
    assert "Close resolved drift issue" in schema_drift
    assert (
        "gh issue list \\\n              --state open \\\n              --json number,title,body"
        in schema_drift
    )
    assert 'gh issue edit "$existing" --add-label "$label"' in schema_drift
    assert "dispatch_claude" not in schema_drift
    assert "gh workflow run" not in schema_drift


def test_sensitive_workflows_pin_privileged_actions() -> None:
    sensitive_workflows = [
        "release-please.yml",
        "schema-drift.yml",
    ]
    combined = "\n".join(
        (WORKFLOWS / workflow).read_text(encoding="utf-8") for workflow in sensitive_workflows
    )

    assert "actions/checkout@v4" not in combined
    assert "googleapis/release-please-action@v5" not in combined
    for action in (
        "actions/checkout",
        "googleapis/release-please-action",
        "astral-sh/setup-uv",
        "actions/upload-artifact",
    ):
        assert_uses_pinned_action(combined, action)
