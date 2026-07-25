import os
import stat
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest

from unraid_mcp.core.exceptions import CredentialsNotConfiguredError, ToolError


def test_credentials_not_configured_error_exists():
    err = CredentialsNotConfiguredError()
    assert str(err) == "Unraid credentials are not configured."


def test_credentials_not_configured_error_is_exception():
    """CredentialsNotConfiguredError must be catchable as a plain Exception."""
    with pytest.raises(Exception):  # noqa: B017
        raise CredentialsNotConfiguredError()


def test_credentials_not_configured_error_is_not_tool_error():
    """CredentialsNotConfiguredError must NOT be a ToolError — it bypasses MCP protocol error handling."""
    assert not issubclass(CredentialsNotConfiguredError, ToolError)


def test_settings_is_configured_true():
    from unraid_mcp.config import settings

    with (
        patch.object(settings, "UNRAID_API_URL", "https://example.com"),
        patch.object(settings, "UNRAID_API_KEY", "key123"),
    ):
        assert settings.is_configured() is True


def test_settings_is_configured_false_when_missing():
    from unraid_mcp.config import settings

    with (
        patch.object(settings, "UNRAID_API_URL", None),
        patch.object(settings, "UNRAID_API_KEY", None),
    ):
        assert settings.is_configured() is False


def test_run_server_does_not_exit_when_creds_missing(monkeypatch):
    """Server should not sys.exit(1) when credentials are absent."""
    import unraid_mcp.config.settings as settings_mod

    monkeypatch.setattr(settings_mod, "UNRAID_API_URL", None)
    monkeypatch.setattr(settings_mod, "UNRAID_API_KEY", None)

    from unraid_mcp import server as server_mod

    with (
        patch.object(server_mod, "mcp") as mock_mcp,
        patch("unraid_mcp.server.logger") as mock_logger,
    ):
        mock_mcp.run.side_effect = SystemExit(0)
        try:
            server_mod.run_server()
        except SystemExit as e:
            assert e.code == 0, f"Unexpected sys.exit({e.code}) — server crashed on missing creds"
        mock_logger.warning.assert_called()
        warning_msgs = [call[0][0] for call in mock_logger.warning.call_args_list]
        assert any("restart" in msg.lower() for msg in warning_msgs), (
            f"Expected a missing-config warning mentioning restart, got: {warning_msgs}"
        )
        assert not any("elicitation" in msg.lower() for msg in warning_msgs)


@pytest.mark.asyncio
async def test_make_graphql_request_raises_sentinel_when_unconfigured():
    """make_graphql_request raises CredentialsNotConfiguredError (not ToolError) when
    credentials are absent, so callers can surface setup instructions."""
    from unraid_mcp.config import settings as settings_mod
    from unraid_mcp.core.client import make_graphql_request
    from unraid_mcp.core.exceptions import CredentialsNotConfiguredError

    original_url = settings_mod.UNRAID_API_URL
    original_key = settings_mod.UNRAID_API_KEY
    try:
        settings_mod.UNRAID_API_URL = None
        settings_mod.UNRAID_API_KEY = None
        with pytest.raises(CredentialsNotConfiguredError):
            await make_graphql_request("{ __typename }")
    finally:
        settings_mod.UNRAID_API_URL = original_url
        settings_mod.UNRAID_API_KEY = original_key


def test_credentials_dir_defaults_to_home_unraid_mcp():
    """CREDENTIALS_DIR defaults to ~/.unraid-mcp when env var is not set."""
    import importlib

    import unraid_mcp.config.settings as s

    os.environ.pop("UNRAID_CREDENTIALS_DIR", None)
    try:
        with patch.dict(os.environ, {}, clear=False):
            os.environ.pop("UNRAID_CREDENTIALS_DIR", None)
            importlib.reload(s)
            assert Path.home() / ".unraid-mcp" == s.CREDENTIALS_DIR
    finally:
        importlib.reload(s)  # Restore module state


def test_credentials_dir_env_var_override():
    """UNRAID_CREDENTIALS_DIR env var overrides the default."""
    import importlib

    import unraid_mcp.config.settings as s

    custom = "/tmp/custom-creds"  # noqa: S108
    try:
        with patch.dict(os.environ, {"UNRAID_CREDENTIALS_DIR": custom}):
            importlib.reload(s)
            assert Path(custom) == s.CREDENTIALS_DIR
    finally:
        # Reload without the custom env var to restore original state
        os.environ.pop("UNRAID_CREDENTIALS_DIR", None)
        importlib.reload(s)


def test_credentials_env_path_is_dot_env_inside_credentials_dir():
    import unraid_mcp.config.settings as s

    assert s.CREDENTIALS_ENV_PATH == s.CREDENTIALS_DIR / ".env"


def test_load_env_files_skips_symlinked_env(tmp_path):
    """A symlinked credentials .env must not be loaded (planted-symlink defense)."""
    import importlib

    import unraid_mcp.config.settings as s

    target = tmp_path / "real.env"
    target.write_text("UNRAID_API_URL=https://symlinked-sentinel\nUNRAID_API_KEY=sentinelkey\n")
    creds = tmp_path / "creds"
    creds.mkdir()
    (creds / ".env").symlink_to(target)

    os.environ.pop("UNRAID_API_URL", None)
    os.environ.pop("UNRAID_API_KEY", None)
    try:
        with patch.dict(os.environ, {"UNRAID_CREDENTIALS_DIR": str(creds)}):
            importlib.reload(s)
            # The symlinked primary file is skipped, so the sentinel is never loaded.
            assert s.UNRAID_API_URL != "https://symlinked-sentinel"
            assert s.UNRAID_API_KEY != "sentinelkey"
    finally:
        os.environ.pop("UNRAID_CREDENTIALS_DIR", None)
        importlib.reload(s)  # restore module state


def test_write_env_creates_credentials_dir_with_700_permissions(tmp_path):
    """_write_env creates CREDENTIALS_DIR with mode 700 (owner-only)."""
    from unraid_mcp.core.setup import _write_env

    creds_dir = tmp_path / "creds"
    creds_file = creds_dir / ".env"

    with (
        patch("unraid_mcp.core.setup.CREDENTIALS_DIR", creds_dir),
        patch("unraid_mcp.core.setup.CREDENTIALS_ENV_PATH", creds_file),
    ):
        _write_env("https://example.com", "mykey")

    assert creds_dir.exists()
    dir_mode = stat.S_IMODE(creds_dir.stat().st_mode)
    assert dir_mode == 0o700, f"Expected 0o700, got {oct(dir_mode)}"


def test_write_env_sets_file_permissions_600(tmp_path):
    """_write_env sets .env file permissions to 600 (owner read/write only)."""
    from unraid_mcp.core.setup import _write_env

    creds_dir = tmp_path / "creds"
    creds_file = creds_dir / ".env"

    with (
        patch("unraid_mcp.core.setup.CREDENTIALS_DIR", creds_dir),
        patch("unraid_mcp.core.setup.CREDENTIALS_ENV_PATH", creds_file),
    ):
        _write_env("https://example.com", "mykey")

    file_mode = stat.S_IMODE(creds_file.stat().st_mode)
    assert file_mode == 0o600, f"Expected 0o600, got {oct(file_mode)}"


def test_write_env_seeds_from_env_example_on_first_run(tmp_path):
    """_write_env copies .env.example structure and replaces credentials in-place."""
    from unraid_mcp.core.setup import _write_env

    creds_dir = tmp_path / "creds"
    creds_file = creds_dir / ".env"
    # Create a fake .env.example
    example = tmp_path / ".env.example"
    example.write_text(
        "# Example config\nFOO=bar\nUNRAID_API_URL=placeholder\nUNRAID_API_KEY=placeholder\n"
    )

    with (
        patch("unraid_mcp.core.setup.CREDENTIALS_DIR", creds_dir),
        patch("unraid_mcp.core.setup.CREDENTIALS_ENV_PATH", creds_file),
        patch("unraid_mcp.core.setup.PROJECT_ROOT", tmp_path),
    ):
        _write_env("https://real.url", "realkey")

    content = creds_file.read_text()
    assert "UNRAID_API_URL=https://real.url" in content
    assert "UNRAID_API_KEY=realkey" in content
    assert "# Example config" in content  # comment preserved
    assert "FOO=bar" in content  # other vars preserved
    assert "placeholder" not in content  # old credential values replaced
    # Credentials should be at their original position (after comments), not prepended before them
    lines = content.splitlines()
    url_idx = next(i for i, line in enumerate(lines) if line.startswith("UNRAID_API_URL="))
    comment_idx = next(i for i, line in enumerate(lines) if line.startswith("# Example config"))
    assert comment_idx < url_idx  # Comment comes before credentials


def test_write_env_first_run_no_example_file(tmp_path):
    """_write_env works on first run when .env.example does not exist."""
    from unraid_mcp.core.setup import _write_env

    creds_dir = tmp_path / "creds"
    creds_file = creds_dir / ".env"
    # tmp_path has no .env.example

    with (
        patch("unraid_mcp.core.setup.CREDENTIALS_DIR", creds_dir),
        patch("unraid_mcp.core.setup.CREDENTIALS_ENV_PATH", creds_file),
        patch("unraid_mcp.core.setup.PROJECT_ROOT", tmp_path),
    ):
        _write_env("https://myserver.com", "mykey123")

    assert creds_file.exists()
    content = creds_file.read_text()
    assert "UNRAID_API_URL=https://myserver.com" in content
    assert "UNRAID_API_KEY=mykey123" in content


def test_write_env_updates_existing_credentials_in_place(tmp_path):
    """_write_env updates credentials without destroying other vars."""
    from unraid_mcp.core.setup import _write_env

    creds_dir = tmp_path / "creds"
    creds_dir.mkdir(mode=0o700)
    creds_file = creds_dir / ".env"
    creds_file.write_text(
        "UNRAID_API_URL=https://old.url\nUNRAID_API_KEY=oldkey\nUNRAID_VERIFY_SSL=false\n"
    )

    with (
        patch("unraid_mcp.core.setup.CREDENTIALS_DIR", creds_dir),
        patch("unraid_mcp.core.setup.CREDENTIALS_ENV_PATH", creds_file),
        patch("unraid_mcp.core.setup.PROJECT_ROOT", tmp_path),
    ):
        _write_env("https://new.url", "newkey")

    content = creds_file.read_text()
    assert "UNRAID_API_URL=https://new.url" in content
    assert "UNRAID_API_KEY=newkey" in content
    assert "UNRAID_VERIFY_SSL=false" in content  # preserved
    assert "old" not in content


def test_tool_error_handler_converts_credentials_not_configured_to_tool_error():
    """tool_error_handler wraps CredentialsNotConfiguredError in a ToolError."""
    import logging

    from unraid_mcp.core.exceptions import (
        CredentialsNotConfiguredError,
        ToolError,
        tool_error_handler,
    )

    _log = logging.getLogger("test")
    with pytest.raises(ToolError), tool_error_handler("docker", "list", _log):
        raise CredentialsNotConfiguredError()


def test_tool_error_handler_credentials_error_message_includes_path():
    """ToolError from CredentialsNotConfiguredError includes the credentials path."""
    import logging

    from unraid_mcp.config.settings import CREDENTIALS_ENV_PATH
    from unraid_mcp.core.exceptions import (
        CredentialsNotConfiguredError,
        ToolError,
        tool_error_handler,
    )

    _log = logging.getLogger("test")
    with pytest.raises(ToolError) as exc_info, tool_error_handler("docker", "list", _log):
        raise CredentialsNotConfiguredError()

    assert str(CREDENTIALS_ENV_PATH) in str(exc_info.value)
    assert "setup" in str(exc_info.value).lower()


@pytest.mark.asyncio
async def test_credentials_not_configured_surfaces_as_tool_error_with_path():
    """CredentialsNotConfiguredError from a tool becomes ToolError with the credentials path."""
    from tests.conftest import make_tool_fn
    from unraid_mcp.config.settings import CREDENTIALS_ENV_PATH
    from unraid_mcp.core.exceptions import CredentialsNotConfiguredError, ToolError

    tool_fn = make_tool_fn("unraid_mcp.tools.unraid", "register_unraid_tool", "unraid")

    with (
        patch(
            "unraid_mcp.core.client.make_graphql_request",
            new=AsyncMock(side_effect=CredentialsNotConfiguredError()),
        ),
        pytest.raises(ToolError) as exc_info,
    ):
        await tool_fn(action="user", subaction="me")

    assert str(CREDENTIALS_ENV_PATH) in str(exc_info.value)
