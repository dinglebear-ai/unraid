"""Regression coverage for packaging and manifests."""

from __future__ import annotations

import json
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
# Agent plugin + CI workflows live at the monorepo root, one level above the
# unraid-py/ Python package.
MONOREPO_ROOT = Path(__file__).resolve().parents[2]


def test_plugin_manifest_restores_stdio_server_definition() -> None:
    plugin = json.loads(
        (MONOREPO_ROOT / "agents" / "unraid-py" / ".claude-plugin" / "plugin.json").read_text()
    )
    assert plugin["userConfig"]["unraid_api_key"]["sensitive"] is True
    assert "mcpServers" in plugin
    assert plugin["mcpServers"] == "./.mcp.json"


def test_plugin_manifests_do_not_hardcode_env_configurable_defaults() -> None:
    """Regression coverage for GitHub issue #137.

    ``.mcp.json`` (Claude Code) and ``.codex-plugin/plugin.json`` (Codex) used to
    hardcode ``UNRAID_VERIFY_SSL=true`` in their ``env`` block. Because
    ``_load_env_files()`` uses ``load_dotenv(override=False)``, a value already
    present in the process env from these manifests permanently shadows the same
    var configured in ``~/.unraid-mcp/.env`` — so a user pointing
    ``UNRAID_VERIFY_SSL`` at a CA-bundle path for a self-signed cert had that
    silently ignored. The same shadowing risk applies to any other var these
    manifests hardcode to a value that merely duplicates the package's own
    default (``UNRAID_MCP_LOG_LEVEL``, ``UNRAID_MCP_LOG_FILE`` — both from
    ``Settings()`` in ``src/unraid_mcp/config/settings.py``;
    ``UNRAID_AUTO_START_SUBSCRIPTIONS``, ``UNRAID_MAX_RECONNECT_ATTEMPTS`` —
    both from ``os.getenv(...)`` fallbacks in
    ``src/unraid_mcp/subscriptions/manager.py``) — none of them serve a purpose
    beyond matching a default that already applies when unset, so none of
    them belong in the manifest. ``UNRAID_MCP_TRANSPORT=stdio`` is the one
    legitimate exception: it differs from the package default
    (``streamable-http``) and is mandatory for a plugin-launched subprocess,
    which talks to its host over stdio.
    """
    shadowing_prone_vars = {
        "UNRAID_VERIFY_SSL",
        "UNRAID_MCP_LOG_LEVEL",
        "UNRAID_MCP_LOG_FILE",
        "UNRAID_AUTO_START_SUBSCRIPTIONS",
        "UNRAID_MAX_RECONNECT_ATTEMPTS",
    }

    mcp_json = json.loads((MONOREPO_ROOT / "agents" / "unraid-py" / ".mcp.json").read_text())
    mcp_env = mcp_json["mcpServers"]["unraid-mcp"]["env"]

    codex_manifest = json.loads(
        (MONOREPO_ROOT / "agents" / "unraid-py" / ".codex-plugin" / "plugin.json").read_text()
    )
    codex_env = codex_manifest["mcpServers"]["unraid-mcp"]["env"]

    for env_block, label in ((mcp_env, ".mcp.json"), (codex_env, ".codex-plugin/plugin.json")):
        leaked = shadowing_prone_vars & env_block.keys()
        assert not leaked, (
            f"{label} hardcodes {leaked}, which duplicates a package default and would "
            "silently shadow the same var configured in ~/.unraid-mcp/.env "
            "(load_dotenv(override=False)) — see issue #137"
        )
        # The mandatory transport override must still be present.
        assert env_block.get("UNRAID_MCP_TRANSPORT") == "stdio"


def test_ci_runs_blocking_live_integration_on_tailnet_runner() -> None:
    workflow = (MONOREPO_ROOT / ".github" / "workflows" / "ci.yml").read_text()
    assert "secrets.UNRAID_API_URL" in workflow
    assert "secrets.UNRAID_API_KEY" in workflow
    assert "runs-on: [self-hosted, linux, tailscale]" in workflow
    assert "github.event_name == 'schedule'" in workflow
    integration_job = workflow.split("  mcp-integration:", 1)[1].split("\n  audit:", 1)[0]
    assert "continue-on-error: true" not in integration_job
    assert 'test -n "$UNRAID_API_URL"' in integration_job
    assert 'test -n "$UNRAID_API_KEY"' in integration_job


def test_container_configs_use_runtime_port_variable() -> None:
    compose = (PROJECT_ROOT / "docker-compose.yaml").read_text()
    dockerfile = (PROJECT_ROOT / "Dockerfile").read_text()
    assert "${UNRAID_MCP_PORT:-6970}:${UNRAID_MCP_PORT:-6970}" in compose
    assert "${UNRAID_MCP_PORT:-6970}" in compose
    assert "${UNRAID_MCP_PORT:-6970}" in dockerfile


def test_dockerfile_does_not_hardcode_env_configurable_defaults() -> None:
    """Regression coverage for GitHub issue #137 (Dockerfile half of the fix).

    The image used to bake ``ENV UNRAID_MCP_TRANSPORT=streamable-http`` and
    ``UNRAID_MCP_LOG_LEVEL=INFO`` — both byte-identical to ``Settings()``'s own
    defaults. Because ``_load_env_files()`` uses ``load_dotenv(override=False)``,
    a value already present in the process env from an image ``ENV`` permanently
    shadows the same var configured in the container-local
    ``~/.unraid-mcp/.env`` (populated via the ``health/setup`` elicitation flow,
    distinct from the host-side ``.env`` docker-compose's ``env_file:`` passes
    through — that path already works correctly since compose-supplied runtime
    env beats image ``ENV``). Neither var needs a container-specific value, so
    neither belongs in the image. ``UNRAID_MCP_HOST=0.0.0.0`` is the one
    legitimate exception: it differs from the package default (``127.0.0.1``)
    and is required for the server to be reachable from outside the container's
    network namespace. ``UNRAID_MCP_PORT`` was dropped too — every place that
    reads it (the healthcheck here and in docker-compose.yaml) already has its
    own ``${UNRAID_MCP_PORT:-6970}`` shell-level fallback, so baking it into the
    image added nothing but the same shadowing risk.
    """
    dockerfile = (PROJECT_ROOT / "Dockerfile").read_text()
    # Strip comment lines so a future rewording of the explanatory comment above
    # ENV UNRAID_MCP_HOST=0.0.0.0 (which today only abbreviates these var names,
    # not spelling out VAR=value) can't accidentally false-positive this check.
    code_lines = "\n".join(
        line for line in dockerfile.splitlines() if not line.strip().startswith("#")
    )
    for shadowing_prone_var in (
        "UNRAID_MCP_TRANSPORT=",
        "UNRAID_MCP_PORT=",
        "UNRAID_MCP_LOG_LEVEL=",
    ):
        assert shadowing_prone_var not in code_lines, (
            f"Dockerfile bakes {shadowing_prone_var!r}, which duplicates a Settings() "
            "default and would silently shadow the same var configured in the "
            "container-local ~/.unraid-mcp/.env (load_dotenv(override=False)) — see "
            "issue #137"
        )
    assert "UNRAID_MCP_HOST=0.0.0.0" in dockerfile


def test_docker_runtime_python_matches_builder_minor_version() -> None:
    dockerfile = (PROJECT_ROOT / "Dockerfile").read_text()
    assert "uv:python3.12-bookworm-slim" in dockerfile
    assert "FROM python:3.12.11-slim-bookworm@sha256:" in dockerfile
    assert "rm -rf" in dockerfile
    for package_manager in ("pip*", "setuptools*", "wheel*"):
        assert package_manager in dockerfile


def test_test_live_script_uses_safe_counters_and_resource_failures() -> None:
    script = (PROJECT_ROOT / "tests" / "test_live.sh").read_text()
    assert "(( PASS++ ))" in script
    assert "(( FAIL++ ))" in script
    assert "(( SKIP++ ))" in script
