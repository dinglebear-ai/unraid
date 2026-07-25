import json
import os
import stat
import sys
from pathlib import Path
from unittest.mock import patch

import pytest


_REPO_ROOT = Path(__file__).resolve().parent.parent


def test_plugin_option_map_matches_manifest_userconfig():
    """PLUGIN_OPTION_MAP, plugin.json userConfig, and .mcp.json must stay in sync.

    Guards against a rename drifting the three apart and silently breaking
    credential delivery (the plugin would collect a value the server never reads).
    """
    from unraid_mcp.core.setup import CREDENTIAL_OPTIONS, PLUGIN_OPTION_MAP

    plugin_dir = _REPO_ROOT.parent / "agents" / "unraid-py"
    manifest = json.loads((plugin_dir / ".claude-plugin" / "plugin.json").read_text())
    user_keys = set(manifest["userConfig"])  # e.g. {"unraid_api_url", "unraid_api_key", ...}

    expected = {f"CLAUDE_PLUGIN_OPTION_{k.upper()}": k.upper() for k in user_keys}
    assert expected == PLUGIN_OPTION_MAP, (
        "PLUGIN_OPTION_MAP is out of sync with plugin.json userConfig. "
        f"expected {expected}, got {PLUGIN_OPTION_MAP}"
    )

    # Delivery split: credential options (no package default) are passed straight
    # through .mcp.json's env; optional config options (which DO have package
    # defaults) must NOT appear there — an empty substitution would shadow
    # ~/.unraid-mcp/.env via load_dotenv(override=False) (issue #137). They reach
    # the server through the setup hook (~/.unraid-mcp/.env) instead.
    mcp = json.loads((plugin_dir / ".mcp.json").read_text())
    env = mcp["mcpServers"]["unraid-mcp"]["env"]
    for option, canonical in PLUGIN_OPTION_MAP.items():
        if canonical in CREDENTIAL_OPTIONS:
            assert env.get(canonical) == f"${{{option}}}", (
                f".mcp.json env[{canonical}] should be ${{{option}}}, got {env.get(canonical)!r}"
            )
        else:
            assert canonical not in env, (
                f".mcp.json must not pass {canonical} through env (issue #137 shadowing); "
                "it is delivered via the setup hook to ~/.unraid-mcp/.env instead."
            )


# Both plugin-option env vars, so tests can clear them in one place. patch.dict
# snapshots os.environ on entry and restores it on exit, so popping these inside a
# `patch.dict(os.environ, ..., clear=False)` block never leaks to other tests.
_OPTION_VARS = (
    "CLAUDE_PLUGIN_OPTION_UNRAID_API_URL",
    "CLAUDE_PLUGIN_OPTION_UNRAID_API_KEY",
)


def _clear_option_vars() -> None:
    for var in _OPTION_VARS:
        os.environ.pop(var, None)


@pytest.mark.parametrize(
    ("value", "expected"),
    [
        ("https://tower.local/graphql", "https://tower.local/graphql"),  # plain → unquoted
        ("plainkey123", "plainkey123"),
        ("has space", '"has space"'),  # whitespace → quoted
        ("with#hash", '"with#hash"'),  # # would start a dotenv comment unquoted
        ('a"b', '"a\\"b"'),  # embedded quote escaped
    ],
)
def test_dotenv_value_quotes_only_when_needed(value, expected):
    from unraid_mcp.core.setup import _dotenv_value

    assert _dotenv_value(value) == expected


def test_apply_plugin_options_maps_present_vars():
    from unraid_mcp.core.setup import apply_plugin_options

    with patch.dict(
        os.environ,
        {
            "CLAUDE_PLUGIN_OPTION_UNRAID_API_URL": "https://tower.local/graphql/",
            "CLAUDE_PLUGIN_OPTION_UNRAID_API_KEY": "  secret123/  ",
        },
        clear=False,
    ):
        resolved = apply_plugin_options()

    assert resolved["UNRAID_API_URL"] == "https://tower.local/graphql"  # trailing slash stripped
    assert resolved["UNRAID_API_KEY"] == "secret123/"  # trimmed, slash NOT stripped on key


def test_apply_plugin_options_skips_missing_and_empty():
    from unraid_mcp.core.setup import apply_plugin_options

    with patch.dict(os.environ, {"CLAUDE_PLUGIN_OPTION_UNRAID_API_URL": ""}, clear=False):
        os.environ.pop("CLAUDE_PLUGIN_OPTION_UNRAID_API_KEY", None)
        resolved = apply_plugin_options()

    assert "UNRAID_API_URL" not in resolved
    assert "UNRAID_API_KEY" not in resolved


# NUL (\0) cannot be placed in os.environ (the OS rejects it), so it can't reach
# apply_plugin_options via a plugin option — it's covered by the direct _safe_env_value
# unit test below. Newline/CR are the reachable injection vectors.
@pytest.mark.parametrize("bad_char", ["\n", "\r"])
def test_apply_plugin_options_rejects_control_char_injection(bad_char):
    from unraid_mcp.core.setup import apply_plugin_options

    with patch.dict(
        os.environ,
        {
            "CLAUDE_PLUGIN_OPTION_UNRAID_API_URL": f"https://x{bad_char}UNRAID_API_KEY=evil",
            "CLAUDE_PLUGIN_OPTION_UNRAID_API_KEY": "ok",
        },
        clear=False,
    ):
        resolved = apply_plugin_options()

    assert "UNRAID_API_URL" not in resolved  # rejected for control char
    assert resolved["UNRAID_API_KEY"] == "ok"


@pytest.mark.parametrize("value", ["", "x\ny", "x\ry", "x\0y"])
def test_safe_env_value_rejects_empty_and_control_chars(value):
    from unraid_mcp.core.setup import _safe_env_value

    assert _safe_env_value(value) is None


def test_safe_env_value_accepts_normal():
    from unraid_mcp.core.setup import _safe_env_value

    assert _safe_env_value("https://tower.local/graphql") == "https://tower.local/graphql"


def test_run_plugin_hook_writes_env_when_both_present(tmp_path, capsys):
    from unraid_mcp.core import setup as setup_mod

    creds_dir = tmp_path / "creds"
    creds_file = creds_dir / ".env"

    with (
        patch.dict(
            os.environ,
            {
                "CLAUDE_PLUGIN_OPTION_UNRAID_API_URL": "https://tower.local/graphql",
                "CLAUDE_PLUGIN_OPTION_UNRAID_API_KEY": "secret123",
            },
            clear=False,
        ),
        patch.object(setup_mod, "CREDENTIALS_DIR", creds_dir),
        patch.object(setup_mod, "CREDENTIALS_ENV_PATH", creds_file),
        patch.object(setup_mod, "PROJECT_ROOT", tmp_path),
    ):
        rc = setup_mod.run_plugin_hook()

    assert rc == 0
    assert creds_file.exists()
    content = creds_file.read_text()
    assert "UNRAID_API_URL=https://tower.local/graphql" in content
    assert "UNRAID_API_KEY=secret123" in content
    assert stat.S_IMODE(creds_file.stat().st_mode) == 0o600
    report = json.loads(capsys.readouterr().out)
    assert report["ran_repair"] is True


def test_run_plugin_hook_writes_tls_config_alongside_credentials(tmp_path, capsys):
    """Optional TLS config (issue #172) is persisted to .env with the credential pair."""
    from unraid_mcp.core import setup as setup_mod

    creds_dir = tmp_path / "creds"
    creds_file = creds_dir / ".env"

    with (
        patch.dict(
            os.environ,
            {
                "CLAUDE_PLUGIN_OPTION_UNRAID_API_URL": "https://192.168.1.10/graphql",
                "CLAUDE_PLUGIN_OPTION_UNRAID_API_KEY": "secret123",
                "CLAUDE_PLUGIN_OPTION_UNRAID_VERIFY_SSL": "false",
                "CLAUDE_PLUGIN_OPTION_UNRAID_ALLOW_INSECURE_TLS": "true",
            },
            clear=False,
        ),
        patch.object(setup_mod, "CREDENTIALS_DIR", creds_dir),
        patch.object(setup_mod, "CREDENTIALS_ENV_PATH", creds_file),
        patch.object(setup_mod, "PROJECT_ROOT", tmp_path),
    ):
        rc = setup_mod.run_plugin_hook()

    assert rc == 0
    content = creds_file.read_text()
    assert "UNRAID_API_URL=https://192.168.1.10/graphql" in content
    assert "UNRAID_VERIFY_SSL=false" in content
    assert "UNRAID_ALLOW_INSECURE_TLS=true" in content
    report = json.loads(capsys.readouterr().out)
    assert report["ran_repair"] is True


def test_run_plugin_hook_omits_absent_tls_config(tmp_path, capsys):
    """Unset TLS options are simply not written and never raise an advisory."""
    from unraid_mcp.core import setup as setup_mod

    creds_dir = tmp_path / "creds"
    creds_file = creds_dir / ".env"

    with (
        patch.dict(
            os.environ,
            {
                "CLAUDE_PLUGIN_OPTION_UNRAID_API_URL": "https://tower.local/graphql",
                "CLAUDE_PLUGIN_OPTION_UNRAID_API_KEY": "secret123",
            },
            clear=False,
        ),
        patch.object(setup_mod, "CREDENTIALS_DIR", creds_dir),
        patch.object(setup_mod, "CREDENTIALS_ENV_PATH", creds_file),
        patch.object(setup_mod, "PROJECT_ROOT", tmp_path),
    ):
        os.environ.pop("CLAUDE_PLUGIN_OPTION_UNRAID_VERIFY_SSL", None)
        os.environ.pop("CLAUDE_PLUGIN_OPTION_UNRAID_ALLOW_INSECURE_TLS", None)
        rc = setup_mod.run_plugin_hook()

    assert rc == 0
    content = creds_file.read_text()
    # The example template carries a commented default; the hook must not inject
    # an active UNRAID_VERIFY_SSL/UNRAID_ALLOW_INSECURE_TLS line of its own.
    assert "UNRAID_VERIFY_SSL=false" not in content
    report = json.loads(capsys.readouterr().out)
    assert report["ran_repair"] is True
    assert report["advisory_failures"] == []


def test_run_plugin_hook_clears_stale_tls_when_option_blanked(tmp_path, capsys):
    """Clearing a TLS option (present but empty) removes its stale .env line so the
    package default is restored — not left disabled. Regression for the codex P2
    on #172."""
    from unraid_mcp.core import setup as setup_mod

    creds_dir = tmp_path / "creds"
    creds_file = creds_dir / ".env"
    creds_dir.mkdir(parents=True)
    # A prior run wrote an insecure config; the user is now clearing it.
    creds_file.write_text(
        "UNRAID_API_URL=https://old.local/graphql\n"
        "UNRAID_API_KEY=old\n"
        "UNRAID_VERIFY_SSL=false\n"
        "UNRAID_ALLOW_INSECURE_TLS=true\n"
    )

    with (
        patch.dict(
            os.environ,
            {
                "CLAUDE_PLUGIN_OPTION_UNRAID_API_URL": "https://tower.local/graphql",
                "CLAUDE_PLUGIN_OPTION_UNRAID_API_KEY": "secret123",
                # Present but blanked — the plugin form was cleared back to default.
                "CLAUDE_PLUGIN_OPTION_UNRAID_VERIFY_SSL": "",
                "CLAUDE_PLUGIN_OPTION_UNRAID_ALLOW_INSECURE_TLS": "",
            },
            clear=False,
        ),
        patch.object(setup_mod, "CREDENTIALS_DIR", creds_dir),
        patch.object(setup_mod, "CREDENTIALS_ENV_PATH", creds_file),
        patch.object(setup_mod, "PROJECT_ROOT", tmp_path),
    ):
        rc = setup_mod.run_plugin_hook()

    assert rc == 0
    content = creds_file.read_text()
    # Stale insecure assignments are gone -> package defaults (verify on) apply.
    assert "UNRAID_VERIFY_SSL=false" not in content
    assert "UNRAID_ALLOW_INSECURE_TLS=true" not in content
    # Credentials were still updated.
    assert "UNRAID_API_URL=https://tower.local/graphql" in content


def test_run_plugin_hook_refuses_incomplete_insecure_optout(tmp_path, capsys):
    """verify_ssl=false without allow_insecure_tls=true must NOT be persisted — it
    would trip settings.py's fatal guard on the next run (which the hook imports),
    deadlocking repair. Codex P2 on #172."""
    from unraid_mcp.core import setup as setup_mod

    creds_dir = tmp_path / "creds"
    creds_file = creds_dir / ".env"

    with (
        patch.dict(
            os.environ,
            {
                "CLAUDE_PLUGIN_OPTION_UNRAID_API_URL": "https://tower.local/graphql",
                "CLAUDE_PLUGIN_OPTION_UNRAID_API_KEY": "secret123",
                "CLAUDE_PLUGIN_OPTION_UNRAID_VERIFY_SSL": "false",
                # insecure left at default (blank) — the incomplete opt-out.
                "CLAUDE_PLUGIN_OPTION_UNRAID_ALLOW_INSECURE_TLS": "",
            },
            clear=False,
        ),
        patch.object(setup_mod, "CREDENTIALS_DIR", creds_dir),
        patch.object(setup_mod, "CREDENTIALS_ENV_PATH", creds_file),
        patch.object(setup_mod, "PROJECT_ROOT", tmp_path),
    ):
        rc = setup_mod.run_plugin_hook()

    assert rc == 0
    content = creds_file.read_text()
    # The invalid disabling value must not be written -> safe default holds.
    assert "UNRAID_VERIFY_SSL=false" not in content
    assert "UNRAID_API_URL=https://tower.local/graphql" in content
    report = json.loads(capsys.readouterr().out)
    assert report["ran_repair"] is True
    assert any("Allow insecure TLS" in a for a in report["advisory_failures"])


def test_incomplete_optout_guard_rejects_on_token(tmp_path, capsys):
    """`on` is truthy to pydantic but NOT to settings' _coerce_bool, so the hook
    must treat verify=false + insecure=on as an incomplete opt-out — otherwise it
    would persist a value the server parses as false and FATALs on. Codex P2."""
    from unraid_mcp.core import setup as setup_mod

    creds_dir = tmp_path / "creds"
    creds_file = creds_dir / ".env"

    with (
        patch.dict(
            os.environ,
            {
                "CLAUDE_PLUGIN_OPTION_UNRAID_API_URL": "https://tower.local/graphql",
                "CLAUDE_PLUGIN_OPTION_UNRAID_API_KEY": "secret123",
                "CLAUDE_PLUGIN_OPTION_UNRAID_VERIFY_SSL": "false",
                "CLAUDE_PLUGIN_OPTION_UNRAID_ALLOW_INSECURE_TLS": "on",
            },
            clear=False,
        ),
        patch.object(setup_mod, "CREDENTIALS_DIR", creds_dir),
        patch.object(setup_mod, "CREDENTIALS_ENV_PATH", creds_file),
        patch.object(setup_mod, "PROJECT_ROOT", tmp_path),
    ):
        rc = setup_mod.run_plugin_hook()

    assert rc == 0
    content = creds_file.read_text()
    assert "UNRAID_VERIFY_SSL=false" not in content
    report = json.loads(capsys.readouterr().out)
    assert any("Allow insecure TLS" in a for a in report["advisory_failures"])


def test_hook_truthy_tokens_match_settings():
    """The hook's opt-in token set must stay identical to settings' bool parsing."""
    from unraid_mcp.config import settings as settings_mod
    from unraid_mcp.core import setup as setup_mod

    assert setup_mod._BOOL_TRUE_TOKENS is settings_mod._BOOL_TRUE_TOKENS


def test_run_plugin_hook_persists_complete_insecure_optout(tmp_path, capsys):
    """The full opt-out (verify_ssl=false AND allow_insecure_tls=true) is valid and
    written as-is, with no advisory."""
    from unraid_mcp.core import setup as setup_mod

    creds_dir = tmp_path / "creds"
    creds_file = creds_dir / ".env"

    with (
        patch.dict(
            os.environ,
            {
                "CLAUDE_PLUGIN_OPTION_UNRAID_API_URL": "https://tower.local/graphql",
                "CLAUDE_PLUGIN_OPTION_UNRAID_API_KEY": "secret123",
                "CLAUDE_PLUGIN_OPTION_UNRAID_VERIFY_SSL": "false",
                "CLAUDE_PLUGIN_OPTION_UNRAID_ALLOW_INSECURE_TLS": "true",
            },
            clear=False,
        ),
        patch.object(setup_mod, "CREDENTIALS_DIR", creds_dir),
        patch.object(setup_mod, "CREDENTIALS_ENV_PATH", creds_file),
        patch.object(setup_mod, "PROJECT_ROOT", tmp_path),
    ):
        rc = setup_mod.run_plugin_hook()

    assert rc == 0
    content = creds_file.read_text()
    assert "UNRAID_VERIFY_SSL=false" in content
    assert "UNRAID_ALLOW_INSECURE_TLS=true" in content
    report = json.loads(capsys.readouterr().out)
    assert report["advisory_failures"] == []


def test_run_plugin_hook_leaves_unmanaged_tls_line_untouched(tmp_path, capsys):
    """When the plugin does NOT export a TLS option at all (e.g. a hand-edited
    .env on a non-plugin runtime path), the hook must not delete the user's line."""
    from unraid_mcp.core import setup as setup_mod

    creds_dir = tmp_path / "creds"
    creds_file = creds_dir / ".env"
    creds_dir.mkdir(parents=True)
    creds_file.write_text(
        "UNRAID_API_URL=https://old.local/graphql\n"
        "UNRAID_API_KEY=old\n"
        "UNRAID_VERIFY_SSL=/etc/ssl/certs/unraid-ca.pem\n"
    )

    with (
        patch.dict(
            os.environ,
            {
                "CLAUDE_PLUGIN_OPTION_UNRAID_API_URL": "https://tower.local/graphql",
                "CLAUDE_PLUGIN_OPTION_UNRAID_API_KEY": "secret123",
            },
            clear=False,
        ),
        patch.object(setup_mod, "CREDENTIALS_DIR", creds_dir),
        patch.object(setup_mod, "CREDENTIALS_ENV_PATH", creds_file),
        patch.object(setup_mod, "PROJECT_ROOT", tmp_path),
    ):
        # The TLS option var is entirely absent -> unmanaged, must be preserved.
        os.environ.pop("CLAUDE_PLUGIN_OPTION_UNRAID_VERIFY_SSL", None)
        os.environ.pop("CLAUDE_PLUGIN_OPTION_UNRAID_ALLOW_INSECURE_TLS", None)
        rc = setup_mod.run_plugin_hook()

    assert rc == 0
    content = creds_file.read_text()
    assert "UNRAID_VERIFY_SSL=/etc/ssl/certs/unraid-ca.pem" in content


def test_run_plugin_hook_idempotent_rewrite(tmp_path, capsys):
    """Running the hook twice with identical input yields one entry per key, byte-identical."""
    from unraid_mcp.core import setup as setup_mod

    creds_dir = tmp_path / "creds"
    creds_file = creds_dir / ".env"

    with (
        patch.dict(
            os.environ,
            {
                "CLAUDE_PLUGIN_OPTION_UNRAID_API_URL": "https://tower.local/graphql",
                "CLAUDE_PLUGIN_OPTION_UNRAID_API_KEY": "secret123",
            },
            clear=False,
        ),
        patch.object(setup_mod, "CREDENTIALS_DIR", creds_dir),
        patch.object(setup_mod, "CREDENTIALS_ENV_PATH", creds_file),
        patch.object(setup_mod, "PROJECT_ROOT", tmp_path),
    ):
        setup_mod.run_plugin_hook()
        first = creds_file.read_text()
        capsys.readouterr()  # drain
        setup_mod.run_plugin_hook()
        second = creds_file.read_text()

    assert first == second  # idempotent
    assert second.count("UNRAID_API_URL=") == 1
    assert second.count("UNRAID_API_KEY=") == 1
    assert stat.S_IMODE(creds_file.stat().st_mode) == 0o600


@pytest.mark.parametrize(
    ("present_var", "present_canonical", "missing_canonical"),
    [
        ("CLAUDE_PLUGIN_OPTION_UNRAID_API_URL", "UNRAID_API_URL", "UNRAID_API_KEY"),
        ("CLAUDE_PLUGIN_OPTION_UNRAID_API_KEY", "UNRAID_API_KEY", "UNRAID_API_URL"),
    ],
)
def test_run_plugin_hook_advisory_when_only_one_present(
    tmp_path, capsys, present_var, present_canonical, missing_canonical
):
    """One credential present must NOT write a partial .env; advisory names the missing one."""
    from unraid_mcp.core import setup as setup_mod

    creds_dir = tmp_path / "creds"
    creds_file = creds_dir / ".env"

    with (
        patch.dict(os.environ, {present_var: "value"}, clear=False),
        patch.object(setup_mod, "CREDENTIALS_DIR", creds_dir),
        patch.object(setup_mod, "CREDENTIALS_ENV_PATH", creds_file),
        patch.object(setup_mod, "PROJECT_ROOT", tmp_path),
    ):
        _clear_option_vars()
        os.environ[present_var] = "value"
        rc = setup_mod.run_plugin_hook()

    assert rc == 0
    assert not creds_file.exists()
    report = json.loads(capsys.readouterr().out)
    assert report["ran_repair"] is False
    assert len(report["advisory_failures"]) == 1
    assert missing_canonical in report["advisory_failures"][0]


def test_run_plugin_hook_advisory_when_missing(tmp_path, capsys):
    from unraid_mcp.core import setup as setup_mod

    creds_dir = tmp_path / "creds"
    creds_file = creds_dir / ".env"

    with (
        patch.dict(os.environ, {}, clear=False),
        patch.object(setup_mod, "CREDENTIALS_DIR", creds_dir),
        patch.object(setup_mod, "CREDENTIALS_ENV_PATH", creds_file),
        patch.object(setup_mod, "PROJECT_ROOT", tmp_path),
    ):
        _clear_option_vars()
        rc = setup_mod.run_plugin_hook()

    assert rc == 0
    assert not creds_file.exists()
    report = json.loads(capsys.readouterr().out)
    assert report["ran_repair"] is False
    assert len(report["advisory_failures"]) == 2
    # Advisory text is the operator's only guidance — it must name the vars + path.
    joined = " ".join(report["advisory_failures"])
    assert "UNRAID_API_URL" in joined
    assert "UNRAID_API_KEY" in joined
    assert str(creds_file) in joined


def test_run_plugin_hook_reports_rejected_value_distinctly(tmp_path, capsys):
    """A present-but-unsafe value is surfaced as 'rejected', not silently dropped."""
    from unraid_mcp.core import setup as setup_mod

    creds_dir = tmp_path / "creds"
    creds_file = creds_dir / ".env"

    with (
        patch.dict(
            os.environ,
            {
                "CLAUDE_PLUGIN_OPTION_UNRAID_API_URL": "https://ok.local",
                "CLAUDE_PLUGIN_OPTION_UNRAID_API_KEY": "bad\nkey",
            },
            clear=False,
        ),
        patch.object(setup_mod, "CREDENTIALS_DIR", creds_dir),
        patch.object(setup_mod, "CREDENTIALS_ENV_PATH", creds_file),
        patch.object(setup_mod, "PROJECT_ROOT", tmp_path),
    ):
        rc = setup_mod.run_plugin_hook()

    assert rc == 0
    assert not creds_file.exists()
    report = json.loads(capsys.readouterr().out)
    assert report["ran_repair"] is False
    assert len(report["advisory_failures"]) == 1
    advisory = report["advisory_failures"][0]
    assert "UNRAID_API_KEY" in advisory
    assert "rejected" in advisory.lower()


def test_run_plugin_hook_reports_empty_value_as_rejected(tmp_path, capsys):
    """An explicitly-empty option is 'rejected', not 'not supplied' (key-presence check)."""
    from unraid_mcp.core import setup as setup_mod

    creds_dir = tmp_path / "creds"
    creds_file = creds_dir / ".env"

    with (
        patch.dict(
            os.environ,
            {
                "CLAUDE_PLUGIN_OPTION_UNRAID_API_URL": "",  # present but empty
                "CLAUDE_PLUGIN_OPTION_UNRAID_API_KEY": "secret123",
            },
            clear=False,
        ),
        patch.object(setup_mod, "CREDENTIALS_DIR", creds_dir),
        patch.object(setup_mod, "CREDENTIALS_ENV_PATH", creds_file),
        patch.object(setup_mod, "PROJECT_ROOT", tmp_path),
    ):
        rc = setup_mod.run_plugin_hook()

    assert rc == 0
    assert not creds_file.exists()
    report = json.loads(capsys.readouterr().out)
    assert len(report["advisory_failures"]) == 1
    advisory = report["advisory_failures"][0]
    assert "UNRAID_API_URL" in advisory
    assert "rejected" in advisory.lower()


def test_run_plugin_hook_returns_zero_on_write_failure(tmp_path, capsys):
    """A .env write error must be surfaced in advisory_failures, not escape (always exit 0)."""
    from unraid_mcp.core import setup as setup_mod

    creds_dir = tmp_path / "creds"
    creds_file = creds_dir / ".env"

    with (
        patch.dict(
            os.environ,
            {
                "CLAUDE_PLUGIN_OPTION_UNRAID_API_URL": "https://tower.local/graphql",
                "CLAUDE_PLUGIN_OPTION_UNRAID_API_KEY": "secret123",
            },
            clear=False,
        ),
        patch.object(setup_mod, "CREDENTIALS_DIR", creds_dir),
        patch.object(setup_mod, "CREDENTIALS_ENV_PATH", creds_file),
        patch.object(setup_mod, "PROJECT_ROOT", tmp_path),
        patch.object(setup_mod, "_write_env", side_effect=PermissionError("denied")),
    ):
        rc = setup_mod.run_plugin_hook()

    assert rc == 0  # never blocks the session
    report = json.loads(capsys.readouterr().out)
    assert report["ran_repair"] is False
    assert len(report["advisory_failures"]) == 1
    assert "Failed to write" in report["advisory_failures"][0]
    assert "PermissionError" in report["advisory_failures"][0]


@pytest.mark.parametrize("argv", [["unraid-mcp", "setup", "plugin-hook"], ["unraid-mcp", "setup"]])
def test_main_setup_dispatch_invokes_plugin_hook(argv):
    import unraid_mcp.main as main_mod

    with (
        patch.object(sys, "argv", argv),
        patch("unraid_mcp.core.setup.run_plugin_hook", return_value=0) as mock_hook,
        pytest.raises(SystemExit) as exc,
    ):
        main_mod.main()

    assert exc.value.code == 0
    mock_hook.assert_called_once()


def test_main_setup_rejects_unknown_subcommand():
    import unraid_mcp.main as main_mod

    with (
        patch.object(sys, "argv", ["unraid-mcp", "setup", "bogus"]),
        patch("unraid_mcp.core.setup.run_plugin_hook") as mock_hook,
        pytest.raises(SystemExit) as exc,
    ):
        main_mod.main()

    assert exc.value.code == 2
    mock_hook.assert_not_called()


def test_main_without_setup_does_not_dispatch_hook():
    """Normal startup must not be hijacked by the setup guard."""
    import unraid_mcp.main as main_mod

    with (
        patch.object(sys, "argv", ["unraid-mcp"]),
        patch("unraid_mcp.core.setup.run_plugin_hook") as mock_hook,
        patch("unraid_mcp.server.run_server") as mock_run_server,
    ):
        main_mod.main()

    mock_hook.assert_not_called()
    mock_run_server.assert_called_once()
