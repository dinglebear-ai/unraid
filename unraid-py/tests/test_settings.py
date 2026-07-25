"""Tests for the setting subactions of the consolidated unraid tool."""

import importlib
import os
from collections.abc import Generator
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest
from conftest import make_tool_fn
from pydantic import ValidationError

from unraid_mcp.config import settings as settings_module
from unraid_mcp.config.settings import Settings
from unraid_mcp.core.exceptions import ToolError


@pytest.fixture
def _mock_graphql() -> Generator[AsyncMock, None, None]:
    with patch("unraid_mcp.core.client.make_graphql_request", new_callable=AsyncMock) as mock:
        yield mock


def _make_tool():
    return make_tool_fn("unraid_mcp.tools.unraid", "register_unraid_tool", "unraid")


# ---------------------------------------------------------------------------
# Regression: wrong-domain / mis-named subactions must raise Invalid subaction.
# update_ssh / update_temperature / update_system_time ARE valid setting
# subactions; the Connect-related ones live under the `connect` action, and the
# names below are deliberate near-misses that must NOT resolve under `setting`.
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "subaction",
    [
        "update_time",  # real name is update_system_time
        "update_api",  # lives under connect as update_api_settings
        "connect_sign_in",  # lives under connect as sign_in
        "connect_sign_out",  # lives under connect as sign_out
        "setup_remote_access",  # lives under connect
        "enable_dynamic_remote_access",  # lives under connect
    ],
)
async def test_removed_settings_subactions_are_invalid(subaction: str) -> None:
    tool_fn = _make_tool()
    with pytest.raises(ToolError, match="Invalid subaction"):
        await tool_fn(action="setting", subaction=subaction)


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------


class TestSettingsValidation:
    """Tests for subaction validation and destructive guard."""

    async def test_invalid_subaction(self, _mock_graphql: AsyncMock) -> None:
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="Invalid subaction"):
            await tool_fn(action="setting", subaction="nonexistent_action")

    async def test_destructive_configure_ups_requires_confirm(
        self, _mock_graphql: AsyncMock
    ) -> None:
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="confirm=True"):
            await tool_fn(action="setting", subaction="configure_ups", ups_config={"mode": "slave"})


# ---------------------------------------------------------------------------
# update
# ---------------------------------------------------------------------------


class TestSettingsUpdate:
    """Tests for update subaction."""

    async def test_update_requires_settings_input(self, _mock_graphql: AsyncMock) -> None:
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="settings_input is required"):
            await tool_fn(action="setting", subaction="update")

    async def test_update_success(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {
            "updateSettings": {"restartRequired": False, "values": {}, "warnings": []}
        }
        tool_fn = _make_tool()
        result = await tool_fn(
            action="setting", subaction="update", settings_input={"shareCount": 5}
        )
        assert result["success"] is True
        assert result["subaction"] == "update"

    async def test_update_allows_nested_json_values(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {
            "updateSettings": {"restartRequired": False, "values": {}, "warnings": []}
        }
        tool_fn = _make_tool()
        payload = {
            "themeOverrides": {"sidebar": None, "panels": ["cpu", "memory"]},
            "advanced": [1, True, {"nested": "ok"}],
        }
        result = await tool_fn(action="setting", subaction="update", settings_input=payload)
        assert result["success"] is True
        _mock_graphql.assert_awaited_once()
        sent_payload = _mock_graphql.await_args.args[1]["input"]
        assert sent_payload == payload


# ---------------------------------------------------------------------------
# configure_ups
# ---------------------------------------------------------------------------


class TestUpsConfig:
    """Tests for configure_ups subaction."""

    async def test_configure_ups_requires_ups_config(self, _mock_graphql: AsyncMock) -> None:
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="ups_config is required"):
            await tool_fn(action="setting", subaction="configure_ups", confirm=True)

    async def test_configure_ups_success(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {"configureUps": True}
        tool_fn = _make_tool()
        result = await tool_fn(
            action="setting",
            subaction="configure_ups",
            confirm=True,
            ups_config={"mode": "master", "cable": "usb"},
        )
        assert result["success"] is True
        assert result["subaction"] == "configure_ups"

    async def test_configure_ups_rejects_nested_values(self, _mock_graphql: AsyncMock) -> None:
        tool_fn = _make_tool()
        with pytest.raises(ToolError, match="must be a string, number, or boolean"):
            await tool_fn(
                action="setting",
                subaction="configure_ups",
                confirm=True,
                ups_config={"mode": {"nested": "invalid"}},
            )


# ---------------------------------------------------------------------------
# System-config mutations (ssh / temperature / system time / identity)
# ---------------------------------------------------------------------------


class TestSettingsSystemConfig:
    async def test_update_ssh_requires_confirm(self, _mock_graphql: AsyncMock) -> None:
        with pytest.raises(ToolError, match="confirm=True"):
            await _make_tool()(
                action="setting",
                subaction="update_ssh",
                config_input={"enabled": True, "port": 22},
            )

    async def test_update_ssh_with_confirm(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {"updateSshSettings": {"id": "vars", "version": "7.3"}}
        result = await _make_tool()(
            action="setting",
            subaction="update_ssh",
            config_input={"enabled": True, "port": 22},
            confirm=True,
        )
        assert result["success"] is True
        assert _mock_graphql.call_args.args[1] == {"input": {"enabled": True, "port": 22}}

    async def test_update_temperature_requires_input(self, _mock_graphql: AsyncMock) -> None:
        with pytest.raises(ToolError, match="config_input is required"):
            await _make_tool()(action="setting", subaction="update_temperature")

    async def test_update_temperature(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {"updateTemperatureConfig": True}
        result = await _make_tool()(
            action="setting",
            subaction="update_temperature",
            config_input={"enabled": True, "default_unit": "CELSIUS"},
        )
        assert result["result"] is True

    async def test_update_system_time_requires_confirm(self, _mock_graphql: AsyncMock) -> None:
        # update_system_time is destructive (clock changes break TLS/services).
        with pytest.raises(ToolError, match="confirm=True"):
            await _make_tool()(
                action="setting",
                subaction="update_system_time",
                config_input={"timeZone": "UTC"},
            )

    async def test_update_system_time(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {
            "updateSystemTime": {"currentTime": "x", "timeZone": "UTC", "useNtp": True}
        }
        result = await _make_tool()(
            action="setting",
            subaction="update_system_time",
            config_input={"timeZone": "UTC", "useNtp": True},
            confirm=True,
        )
        assert result["result"]["timeZone"] == "UTC"

    async def test_update_server_identity_requires_name(self, _mock_graphql: AsyncMock) -> None:
        with pytest.raises(ToolError, match="name is required"):
            await _make_tool()(action="setting", subaction="update_server_identity")

    async def test_update_server_identity(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {
            "updateServerIdentity": {"id": "s", "name": "Tower", "comment": "hi"}
        }
        result = await _make_tool()(
            action="setting",
            subaction="update_server_identity",
            name="Tower",
            comment="hi",
            sys_model="Custom",
        )
        assert result["server"]["name"] == "Tower"
        assert _mock_graphql.call_args.args[1] == {
            "name": "Tower",
            "comment": "hi",
            "sysModel": "Custom",
        }


class TestSettingsSuccessDerivation:
    async def test_update_temperature_false_is_not_success(self, _mock_graphql: AsyncMock) -> None:
        _mock_graphql.return_value = {"updateTemperatureConfig": False}
        result = await _make_tool()(
            action="setting",
            subaction="update_temperature",
            config_input={"enabled": False},
        )
        assert result["success"] is False


class TestSettingsServerIdentitySuccess:
    async def test_update_server_identity_null_is_not_success(
        self, _mock_graphql: AsyncMock
    ) -> None:
        _mock_graphql.return_value = {"updateServerIdentity": None}
        result = await _make_tool()(
            action="setting", subaction="update_server_identity", name="Tower"
        )
        assert result["success"] is False


# ---------------------------------------------------------------------------
# Module-level startup guards (S-H1 SSL fail-closed + port range)
#
# These are security-relevant guards in src/unraid_mcp/config/settings.py that lost
# direct coverage in the pydantic migration:
#   * the port guard is now the pydantic field validator Settings._parse_port —
#     testable by instantiating Settings(...) directly;
#   * the S-H1 verify-ssl guard is genuinely module-level (it depends on the
#     cross-field UNRAID_VERIFY_SSL / UNRAID_ALLOW_INSECURE_TLS interaction and
#     calls sys.exit(1) after Settings()) — only reachable by re-executing the
#     module, so these tests reload it under a patched os.environ.
# ---------------------------------------------------------------------------


class TestPortGuard:
    """Direct coverage for the Settings._parse_port pydantic field validator."""

    @pytest.mark.parametrize("bad_port", ["abc", "0", "65536"])
    def test_bad_port_is_declarative_validation_error(self, bad_port: str) -> None:
        with pytest.raises(ValidationError):
            Settings(UNRAID_MCP_PORT=bad_port)

    def test_valid_port_parsed_to_int(self) -> None:
        settings = Settings(UNRAID_MCP_PORT="8080")
        assert settings.unraid_mcp_port == 8080
        assert isinstance(settings.unraid_mcp_port, int)


class TestDeclarativeRuntimeSettings:
    @pytest.mark.parametrize("transport", ["bogus", "http", "STREAM"])
    def test_unsupported_transport_rejected(self, transport: str) -> None:
        with pytest.raises(ValidationError):
            Settings(UNRAID_MCP_TRANSPORT=transport)

    @pytest.mark.parametrize(
        ("name", "value"),
        [
            ("UNRAID_MCP_MAX_RESPONSE_BYTES", 0),
            ("UNRAID_MAX_RECONNECT_ATTEMPTS", -1),
            ("UNRAID_SUBSCRIPTION_MAX_CONNECTIONS", 0),
            ("UNRAID_SUBSCRIPTION_STARTUP_STAGGER_SECONDS", -0.01),
            ("UNRAID_SUBSCRIPTION_COLLECT_MAX_EVENTS", 0),
            ("UNRAID_SUBSCRIPTION_COLLECT_MAX_BYTES", 0),
            ("UNRAID_SUBSCRIPTION_COLLECT_MAX_SECONDS", 0),
            ("UNRAID_SUBSCRIPTION_CACHE_MAX_AGE_SECONDS", 0),
            ("UNRAID_SUBSCRIPTION_TIMEOUT_MAX_SECONDS", 0),
        ],
    )
    def test_invalid_numeric_runtime_setting_rejected(self, name: str, value: int) -> None:
        with pytest.raises(ValidationError):
            Settings(**{name: value})

    def test_subscription_settings_are_typed_and_parsed(self) -> None:
        settings = Settings(
            UNRAID_AUTO_START_SUBSCRIPTIONS="false",
            UNRAID_MAX_RECONNECT_ATTEMPTS="7",
            UNRAID_MCP_ENABLE_RAW_SUBSCRIPTION_PROBE="true",
            UNRAID_SUBSCRIPTION_AUTO_START_ACTIONS="cpu, memory display",
            UNRAID_SUBSCRIPTION_MAX_CONNECTIONS="2",
            UNRAID_SUBSCRIPTION_STARTUP_STAGGER_SECONDS="0.25",
            UNRAID_SUBSCRIPTION_COLLECT_MAX_EVENTS="12",
            UNRAID_SUBSCRIPTION_COLLECT_MAX_BYTES="2048",
            UNRAID_SUBSCRIPTION_COLLECT_MAX_SECONDS="15",
            UNRAID_SUBSCRIPTION_CACHE_MAX_AGE_SECONDS="120",
            UNRAID_SUBSCRIPTION_TIMEOUT_MAX_SECONDS="45",
        )

        assert settings.unraid_auto_start_subscriptions is False
        assert settings.unraid_max_reconnect_attempts == 7
        assert settings.unraid_mcp_enable_raw_subscription_probe is True
        assert settings.unraid_subscription_auto_start_actions == frozenset(
            {"cpu", "memory", "display"}
        )
        assert settings.unraid_subscription_max_connections == 2
        assert settings.unraid_subscription_startup_stagger_seconds == 0.25
        assert settings.unraid_subscription_collect_max_events == 12
        assert settings.unraid_subscription_collect_max_bytes == 2048
        assert settings.unraid_subscription_collect_max_seconds == 15
        assert settings.unraid_subscription_cache_max_age_seconds == 120
        assert settings.unraid_subscription_timeout_max_seconds == 45

    @pytest.mark.parametrize(
        "name",
        ["UNRAID_AUTO_START_SUBSCRIPTIONS", "UNRAID_MCP_ENABLE_RAW_SUBSCRIPTION_PROBE"],
    )
    def test_invalid_subscription_boolean_rejected(self, name: str) -> None:
        with pytest.raises(ValidationError):
            Settings(**{name: "sometimes"})


class TestGoogleOAuthSettings:
    def test_google_oauth_empty_plugin_values_become_none(self) -> None:
        settings = Settings(
            UNRAID_MCP_GOOGLE_CLIENT_ID="",
            UNRAID_MCP_GOOGLE_CLIENT_SECRET="",
            UNRAID_MCP_GOOGLE_BASE_URL="",
            UNRAID_MCP_GOOGLE_ALLOWED_EMAILS="",
            UNRAID_MCP_GOOGLE_ALLOWED_DOMAINS="",
            UNRAID_MCP_GOOGLE_STORAGE_DIR="",
        )
        assert settings.unraid_mcp_google_client_id is None
        assert settings.unraid_mcp_google_client_secret is None
        assert settings.unraid_mcp_google_base_url is None
        assert settings.unraid_mcp_google_allowed_emails is None
        assert settings.unraid_mcp_google_allowed_domains is None
        assert settings.unraid_mcp_google_storage_dir is None

    def test_google_oauth_aliases_populate_model(self) -> None:
        settings = Settings(
            UNRAID_MCP_GOOGLE_CLIENT_ID="client",
            UNRAID_MCP_GOOGLE_CLIENT_SECRET="secret",
            UNRAID_MCP_GOOGLE_BASE_URL="https://mcp.example.com",
            UNRAID_MCP_GOOGLE_ALLOWED_EMAILS="owner@example.com",
            UNRAID_MCP_GOOGLE_ALLOWED_DOMAINS="example.com",
            UNRAID_MCP_GOOGLE_ALLOW_ANY_USER=True,
        )
        assert settings.unraid_mcp_google_client_id == "client"
        assert settings.unraid_mcp_google_client_secret == "secret"
        assert settings.unraid_mcp_google_base_url == "https://mcp.example.com"
        assert settings.unraid_mcp_google_allowed_emails == "owner@example.com"
        assert settings.unraid_mcp_google_allowed_domains == "example.com"
        assert settings.unraid_mcp_google_allow_any_user is True


@pytest.fixture
def _reload_settings(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> Generator[Path, None, None]:
    """Reload the settings module under a hermetic env, restoring it afterwards.

    The S-H1 guard fires while the module body executes, so it can only be
    exercised by re-importing the module.

    Full env-file isolation: an empty ``.env`` is written as the FIRST entry on
    ``_load_env_files()``'s search path (``UNRAID_CREDENTIALS_DIR/.env``), so the
    loader's first-existing-file ``break`` short-circuits there and never consults
    the developer's real ``~/.unraid-mcp/.env`` *or* the project-root/last-resort
    fallbacks. Without this, a real ``~/.unraid-mcp/.env`` leaks in:
    ``load_dotenv(override=False)`` only refuses to overwrite vars *already
    present* in ``os.environ``, so a TLS var this fixture deliberately cleared
    (e.g. ``UNRAID_ALLOW_INSECURE_TLS``) gets silently repopulated from that file
    — defeating the isolation and making the S-H1 guard assertions pass or fail on
    the host's credentials rather than the values the test set. (CI has no such
    file, so it only bit locally.) Pointing *only* ``UNRAID_CREDENTIALS_DIR`` at an
    empty dir would still miss the project-root/last-resort ``.env`` fallbacks —
    they are ``__file__``-derived and not env-overridable — hence the empty
    first-entry file, which neutralises the entire search path in one stroke.

    Yields ``tmp_path`` so a test can drop a decoy ``.env`` (overwriting the empty
    one) to exercise file-driven guard behaviour; teardown blanks it again before
    the restore reload, so the shared module state is always left at pure verify-on
    defaults independent of the host — and teardown can never ``sys.exit(1)``.
    """
    env_file = tmp_path / ".env"
    env_file.write_text("")  # first search-path entry -> loader breaks here
    monkeypatch.setenv("UNRAID_CREDENTIALS_DIR", str(tmp_path))
    # Clear the TLS-related vars so each test starts from a known baseline and
    # only the values it sets (or a decoy .env it writes) are in effect.
    monkeypatch.delenv("UNRAID_VERIFY_SSL", raising=False)
    monkeypatch.delenv("UNRAID_ALLOW_INSECURE_TLS", raising=False)
    try:
        yield tmp_path
    finally:
        # Blank any decoy .env a test wrote so the restore reload loads nothing
        # and lands on pure defaults (verify-on) regardless of the host.
        env_file.write_text("")
        # Raw pop before monkeypatch's ledger is consulted: load_dotenv writes
        # straight into os.environ, bypassing monkeypatch tracking, so a plain
        # delenv could let monkeypatch restore a leaked value into a later test.
        # (See _reload_settings_from_dotenv for the full rationale.)
        os.environ.pop("UNRAID_VERIFY_SSL", None)
        os.environ.pop("UNRAID_ALLOW_INSECURE_TLS", None)
        monkeypatch.delenv("UNRAID_VERIFY_SSL", raising=False)
        monkeypatch.delenv("UNRAID_ALLOW_INSECURE_TLS", raising=False)
        # Reload with the empty creds .env still active, then drop the override.
        importlib.reload(settings_module)
        monkeypatch.delenv("UNRAID_CREDENTIALS_DIR", raising=False)


class TestVerifySslGuard:
    """Coverage for the S-H1 SSL fail-closed guard (module-level, cross-field)."""

    @pytest.mark.parametrize("falsey", ["false", "0", "no"])
    def test_disabled_without_opt_in_exits(
        self, _reload_settings: Path, monkeypatch: pytest.MonkeyPatch, falsey: str
    ) -> None:
        # Disabling verification without the explicit UNRAID_ALLOW_INSECURE_TLS
        # opt-in must fail closed with sys.exit(1).
        monkeypatch.setenv("UNRAID_VERIFY_SSL", falsey)
        with pytest.raises(SystemExit) as excinfo:
            importlib.reload(settings_module)
        assert excinfo.value.code == 1

    def test_guard_reads_isolated_credentials_dir_not_host(
        self, _reload_settings: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        # Hermetic regression for the fixture's credentials-dir isolation.
        #
        # A decoy .env with verification-off and NO opt-in, dropped into the
        # isolated creds dir, must trip the S-H1 guard from that file's content —
        # proving _load_env_files() reads the pointed-at dir and nothing else. This
        # fails deterministically in CI and on any host if the isolation regresses
        # (the reload would then read the real ~/.unraid-mcp/.env, or none, and NOT
        # exit). test_disabled_without_opt_in_exits alone can't catch that: it only
        # exposes the leak on a machine that happens to have a real credentials .env
        # with verification disabled — exactly the blind spot that let the bug ship.
        (_reload_settings / ".env").write_text("UNRAID_VERIFY_SSL=false\n")
        with pytest.raises(SystemExit) as excinfo:
            importlib.reload(settings_module)
        assert excinfo.value.code == 1

    @pytest.mark.parametrize("falsey", ["false", "0", "no"])
    def test_disabled_with_opt_in_allowed(
        self, _reload_settings: Path, monkeypatch: pytest.MonkeyPatch, falsey: str
    ) -> None:
        # With the second opt-in present, verification may be disabled: no exit,
        # and UNRAID_VERIFY_SSL resolves to the bool False.
        monkeypatch.setenv("UNRAID_VERIFY_SSL", falsey)
        monkeypatch.setenv("UNRAID_ALLOW_INSECURE_TLS", "true")
        importlib.reload(settings_module)
        assert settings_module.UNRAID_VERIFY_SSL is False

    def test_ca_bundle_path_preserved_as_str(
        self, _reload_settings: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        # A value that is neither truthy nor falsey is treated as a CA-bundle
        # path and preserved verbatim as a str (the safe self-signed-cert route).
        ca_path = "/etc/ssl/certs/myca.pem"
        monkeypatch.setenv("UNRAID_VERIFY_SSL", ca_path)
        importlib.reload(settings_module)
        assert ca_path == settings_module.UNRAID_VERIFY_SSL


@pytest.fixture
def _reload_settings_from_dotenv(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> Generator[Path, None, None]:
    """Point the canonical credentials dir at an isolated tmp_path .env file.

    ``CREDENTIALS_DIR``/``CREDENTIALS_ENV_PATH`` are computed once at module
    import time from ``UNRAID_CREDENTIALS_DIR``, so re-deriving them for a test
    requires both setting that env var *and* reloading the module (a bare
    ``monkeypatch.setattr(settings_module, "CREDENTIALS_ENV_PATH", ...)`` would
    just get clobbered the moment anything reloads the module).

    Teardown clears the TLS vars *and* ``UNRAID_CREDENTIALS_DIR`` before the
    final reload — otherwise that "restore a clean module" reload would still
    see ``UNRAID_CREDENTIALS_DIR`` pointing at this test's tmp ``.env`` file and
    re-load whatever TLS value it contains, leaking into the next test.

    The TLS vars are popped from ``os.environ`` directly (not just via
    ``monkeypatch.delenv``) because ``load_dotenv()`` writes them straight into
    ``os.environ`` during the test, bypassing monkeypatch's own tracking. If
    the *only* monkeypatch touch of a key beforehand was a no-op
    ``delenv(raising=False)`` on an already-absent var, monkeypatch's undo
    stack has no earlier "restore to unset" entry to fall back on — so its
    automatic teardown would faithfully restore the leaked ``load_dotenv``
    value into ``os.environ`` for every later test, undoing our own cleanup.
    The raw pop empties them before monkeypatch's ledger is ever consulted.
    """
    monkeypatch.delenv("UNRAID_VERIFY_SSL", raising=False)
    monkeypatch.delenv("UNRAID_ALLOW_INSECURE_TLS", raising=False)
    monkeypatch.setenv("UNRAID_CREDENTIALS_DIR", str(tmp_path))
    try:
        yield tmp_path
    finally:
        os.environ.pop("UNRAID_VERIFY_SSL", None)
        os.environ.pop("UNRAID_ALLOW_INSECURE_TLS", None)
        monkeypatch.delenv("UNRAID_VERIFY_SSL", raising=False)
        monkeypatch.delenv("UNRAID_ALLOW_INSECURE_TLS", raising=False)
        monkeypatch.delenv("UNRAID_CREDENTIALS_DIR", raising=False)
        importlib.reload(settings_module)


class TestVerifySslDotenvPrecedence:
    """Regression coverage for GitHub issue #137.

    The bundled Claude Code (``.mcp.json``) and Codex (``.codex-plugin/plugin.json``)
    manifests used to hardcode ``UNRAID_VERIFY_SSL=true`` in the launched
    process's env. Because ``_load_env_files()`` uses
    ``load_dotenv(override=False)``, that pre-set value permanently shadowed
    whatever ``UNRAID_VERIFY_SSL`` a user configured in the canonical
    ``~/.unraid-mcp/.env`` (most notably a CA-bundle path for a self-signed
    cert). The manifests no longer hardcode this var; these tests pin the
    underlying ``_load_env_files()`` + ``Settings()`` precedence rule — both
    that a ``.env``-configured value is honored once nothing shadows it, and
    (explicitly) that a manifest-style pre-set value still wins if one is ever
    reintroduced — so a future manifest edit can't silently bring the bug back.
    """

    @staticmethod
    def _write_env(env_dir: Path, **values: str) -> None:
        (env_dir / ".env").write_text("\n".join(f"{k}={v}" for k, v in values.items()) + "\n")

    def test_ca_bundle_path_from_dotenv_is_picked_up_when_unset(
        self, _reload_settings_from_dotenv: Path
    ) -> None:
        """Nothing pre-sets UNRAID_VERIFY_SSL (the fixed manifest state) ->
        the .env-configured CA-bundle path is used."""
        ca_path = "/etc/ssl/certs/unraid-ca.pem"
        self._write_env(_reload_settings_from_dotenv, UNRAID_VERIFY_SSL=ca_path)
        importlib.reload(settings_module)
        assert ca_path == settings_module.UNRAID_VERIFY_SSL

    def test_true_from_dotenv_is_picked_up_when_unset(
        self, _reload_settings_from_dotenv: Path
    ) -> None:
        self._write_env(_reload_settings_from_dotenv, UNRAID_VERIFY_SSL="true")
        importlib.reload(settings_module)
        assert settings_module.UNRAID_VERIFY_SSL is True

    def test_false_from_dotenv_requires_opt_in(self, _reload_settings_from_dotenv: Path) -> None:
        self._write_env(_reload_settings_from_dotenv, UNRAID_VERIFY_SSL="false")
        with pytest.raises(SystemExit) as excinfo:
            importlib.reload(settings_module)
        assert excinfo.value.code == 1

    def test_false_from_dotenv_with_opt_in_disables_verification(
        self, _reload_settings_from_dotenv: Path
    ) -> None:
        self._write_env(
            _reload_settings_from_dotenv,
            UNRAID_VERIFY_SSL="false",
            UNRAID_ALLOW_INSECURE_TLS="true",
        )
        importlib.reload(settings_module)
        assert settings_module.UNRAID_VERIFY_SSL is False

    def test_blank_verify_ssl_falls_back_to_verify_default(
        self, _reload_settings_from_dotenv: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """A blank UNRAID_VERIFY_SSL (an unset plugin option substitutes as "")
        must default to verifying — never be treated as an empty CA-bundle path
        that would silently break TLS. See issue #172.
        """
        monkeypatch.setenv("UNRAID_VERIFY_SSL", "")
        importlib.reload(settings_module)
        assert settings_module.UNRAID_VERIFY_SSL is True

    def test_blank_allow_insecure_tls_is_disabled_not_error(
        self, _reload_settings_from_dotenv: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """A blank UNRAID_ALLOW_INSECURE_TLS must parse as False, not raise a
        bool validation error at import (issue #172 plugin passthrough)."""
        monkeypatch.setenv("UNRAID_ALLOW_INSECURE_TLS", "")
        importlib.reload(settings_module)
        assert settings_module.UNRAID_ALLOW_INSECURE_TLS is False

    def test_manifest_style_preset_env_shadows_dotenv_ca_path(
        self, _reload_settings_from_dotenv: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """Documents the actual bug mechanism from issue #137: if something
        pre-sets UNRAID_VERIFY_SSL in the process env before the server reads
        .env (exactly what the old hardcoded manifest 'true' did), the .env
        file's CA-bundle path is silently ignored. This is why plugin
        manifests must never hardcode this var.
        """
        ca_path = "/etc/ssl/certs/unraid-ca.pem"
        self._write_env(_reload_settings_from_dotenv, UNRAID_VERIFY_SSL=ca_path)
        monkeypatch.setenv("UNRAID_VERIFY_SSL", "true")  # simulates the old manifest hardcode
        importlib.reload(settings_module)
        assert settings_module.UNRAID_VERIFY_SSL is True  # .env's CA path was shadowed
