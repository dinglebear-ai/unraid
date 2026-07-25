"""Tests for env-file loading in unraid_mcp.config.settings.

Regression coverage for GitHub issue #28: empty-string credential env vars
(e.g. an unset `${CLAUDE_PLUGIN_OPTION_UNRAID_API_URL}` from the bundled
.mcp.json) must NOT shadow values from the canonical ~/.unraid-mcp/.env file.
"""

from pathlib import Path

import pytest

from unraid_mcp.config import settings as settings_module


def _write_env(tmp_path: Path, **values: str) -> Path:
    """Write a .env file under tmp_path and return its path."""
    env_path = tmp_path / ".env"
    env_path.write_text("\n".join(f"{k}={v}" for k, v in values.items()) + "\n")
    return env_path


def _point_search_path_at(monkeypatch: pytest.MonkeyPatch, env_path: Path) -> None:
    """Make _load_env_files() pick up env_path as the first existing dotenv."""
    monkeypatch.setattr(settings_module, "CREDENTIALS_ENV_PATH", env_path)


def test_empty_string_credentials_do_not_shadow_env_file(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    """Empty-string UNRAID_API_URL/KEY in os.environ must not block the .env file."""
    env_path = _write_env(
        tmp_path,
        UNRAID_API_URL="http://from-dotenv:6970/graphql",
        UNRAID_API_KEY="dotenv-key",
    )
    _point_search_path_at(monkeypatch, env_path)

    # Simulate the unset-plugin-option case: present but empty.
    monkeypatch.setenv("UNRAID_API_URL", "")
    monkeypatch.setenv("UNRAID_API_KEY", "")

    settings_module._load_env_files()

    import os

    assert os.environ["UNRAID_API_URL"] == "http://from-dotenv:6970/graphql"
    assert os.environ["UNRAID_API_KEY"] == "dotenv-key"


def test_whitespace_only_credentials_treated_as_unset(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    """Whitespace-only credential env vars must also be treated as unset."""
    env_path = _write_env(
        tmp_path,
        UNRAID_API_URL="http://from-dotenv:6970/graphql",
        UNRAID_API_KEY="dotenv-key",
    )
    _point_search_path_at(monkeypatch, env_path)

    monkeypatch.setenv("UNRAID_API_URL", "   ")
    monkeypatch.setenv("UNRAID_API_KEY", "\t")

    settings_module._load_env_files()

    import os

    assert os.environ["UNRAID_API_URL"] == "http://from-dotenv:6970/graphql"
    assert os.environ["UNRAID_API_KEY"] == "dotenv-key"


def test_nonempty_env_var_is_respected(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    """A genuinely-set (non-empty) env var must NOT be clobbered by the .env file."""
    env_path = _write_env(
        tmp_path,
        UNRAID_API_URL="http://from-dotenv:6970/graphql",
        UNRAID_API_KEY="dotenv-key",
    )
    _point_search_path_at(monkeypatch, env_path)

    monkeypatch.setenv("UNRAID_API_URL", "http://from-shell:9999/graphql")
    monkeypatch.setenv("UNRAID_API_KEY", "shell-key")

    settings_module._load_env_files()

    import os

    # load_dotenv(override=False) must leave the real shell exports intact.
    assert os.environ["UNRAID_API_URL"] == "http://from-shell:9999/graphql"
    assert os.environ["UNRAID_API_KEY"] == "shell-key"
