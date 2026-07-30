"""Executable policy for privileged workflows and shipped artifacts."""

from __future__ import annotations

import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
# The Python package lives in unraid-py/ within the monorepo; CI workflows live
# at the monorepo root (one level above the package).
MONOREPO_ROOT = Path(__file__).resolve().parents[2]
WORKFLOWS = MONOREPO_ROOT / ".github" / "workflows"


def _workflows() -> dict[str, str]:
    return {path.name: path.read_text() for path in sorted(WORKFLOWS.glob("*.yml"))}


def test_every_external_action_is_immutable() -> None:
    violations: list[str] = []
    for name, workflow in _workflows().items():
        for line in workflow.splitlines():
            match = re.search(r"\buses:\s*([^\s#]+)", line)
            if match and not re.fullmatch(r"[^@]+@[0-9a-f]{40}", match.group(1)):
                violations.append(f"{name}: {match.group(1)}")
    assert not violations, f"mutable action references: {violations}"


def test_audit_targets_locked_application_graph() -> None:
    workflow = _workflows()["ci.yml"]
    assert "uv export --frozen --no-dev --no-emit-project" in workflow
    assert "pip-audit==2.10.1" in workflow
    assert "pip-audit --requirement audit-requirements.txt" in workflow
    for sentinel in ("fastmcp", "httpx", "cryptography"):
        assert sentinel in workflow
    assert "uvx pip-audit" not in workflow


def test_release_executables_and_tools_are_pinned_and_verified() -> None:
    combined = "\n".join(_workflows().values())
    assert "/releases/latest/download/" not in combined
    assert not re.search(r"curl[^\n|]*\|\s*(?:sh|bash|tar)\b", combined)
    release = _workflows()["publish-pypi.yml"]
    assert "/releases/download/v1.8.0/" in release
    assert "1370446bbe74d562608e8005a6ccce02d146a661fbd78674e11cc70b9618d6cf" in release
    assert "sha256sum --check --strict" in release
    assert "./mcp-publisher --version 2>&1" in release


def test_release_sensitive_uv_is_pinned_and_cacheless() -> None:
    for name in (
        "publish-pypi.yml",
        "release-please.yml",
        "schema-drift.yml",
    ):
        workflow = _workflows()[name]
        setup_steps = workflow.split("uses: astral-sh/setup-uv@")[1:]
        assert setup_steps, name
        for step in setup_steps:
            step = step.split("\n      - ", 1)[0]
            assert 'version: "0.9.25"' in step, name
            assert "enable-cache: false" in step, name


def test_artifact_channels_are_independent_and_reconciled() -> None:
    workflow = _workflows()["publish-pypi.yml"]
    for job in ("build", "pypi", "github-release", "mcp-registry", "reconcile"):
        assert re.search(rf"^  {re.escape(job)}:\s*$", workflow, re.MULTILINE)
    assert "SHA256SUMS" in workflow
    assert "actions/attest-build-provenance@" in workflow
    assert "skip-existing: true" in workflow
    assert "Release Reconciliation" in workflow


def test_manual_release_reconciliation_targets_requested_release_tag() -> None:
    workflow = _workflows()["publish-pypi.yml"]
    assert "workflow_dispatch:\n    inputs:\n      release_tag:" in workflow
    assert "required: true" in workflow
    assert 'default: ""' in workflow
    assert "RELEASE_TAG: ${{ github.event.release.tag_name || inputs.release_tag }}" in workflow
    assert "group: release-${{ github.event.release.tag_name || inputs.release_tag }}" in workflow
    assert workflow.count("ref: refs/tags/${{ env.RELEASE_TAG }}") == 2
    assert "GITHUB_REF_NAME" not in workflow


def test_pypi_partial_release_can_resume_without_masking_checksum_mismatch() -> None:
    workflow = _workflows()["publish-pypi.yml"]
    pypi_job = workflow.split("  pypi:", 1)[1].split("  github-release:", 1)[0]
    assert 'if [ -z "$remote_checksum" ]' in pypi_job
    assert "published=false" in pypi_job
    assert 'elif [ "$remote_checksum" != "$checksum" ]' in pypi_job
    assert "PyPI already contains $filename with a different checksum" in pypi_job
    assert "skip-existing: true" in pypi_job


def test_container_release_and_runtime_policies() -> None:
    workflow = _workflows()["docker-publish.yml"]
    dockerfile = (ROOT / "Dockerfile").read_text()
    compose = (ROOT / "docker-compose.yaml").read_text()
    assert "release:\n    types: [published]" in workflow
    assert "workflow_dispatch:" not in workflow
    assert "pull_request:" not in workflow
    assert "push:" not in workflow
    assert "runs-on: ubuntu-24.04" in workflow
    assert (
        "dinglebear-ai/workflows/.github/workflows/"
        "hosted-container-release.yml@d7bbe71ddc1157e32ed0bebf928fc07438ba58b0"
        in workflow
    )
    assert "needs: mcp-smoke" in workflow
    assert "latest" in workflow
    assert "tests/test_live.sh --mode http" in workflow
    assert "/ready" in workflow
    assert "python:3.12.11-slim-bookworm@sha256:" in dockerfile
    assert "/ready" in dockerfile
    assert "replicas: 1" in compose
    assert 'max-size: "10m"' in compose
    assert 'max-file: "3"' in compose
