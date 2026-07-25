"""Subprocess tests for the skill's load-env.sh credential loader.

load-env.sh is security-relevant: it must PARSE ~/.unraid-mcp/.env as data and
export only UNRAID_* assignments, never `source`/execute it. These tests pin that
behavior so a future refactor back to `source` (which would reintroduce arbitrary
code execution from a hand-edited .env) fails loudly.
"""

from __future__ import annotations

import shutil
import subprocess
from pathlib import Path

import pytest


# load-env.sh ships with the Python agent plugin, which lives at the monorepo
# root under agents/unraid-py/ (two levels above this test file in unraid-py/tests/).
_LOAD_ENV = (
    Path(__file__).resolve().parents[2]
    / "agents"
    / "unraid-py"
    / "skills"
    / "unraid"
    / "load-env.sh"
)

pytestmark = pytest.mark.skipif(
    shutil.which("bash") is None or not _LOAD_ENV.exists(),
    reason="bash and agents/unraid-py/skills/unraid/load-env.sh are required",
)


def _run(script: str, creds_dir: Path) -> subprocess.CompletedProcess[str]:
    """Run a bash snippet with load-env.sh sourced and UNRAID_CREDENTIALS_DIR set."""
    full = f'set -uo pipefail\nsource "{_LOAD_ENV}"\n{script}'
    return subprocess.run(
        ["bash", "-c", full],
        capture_output=True,
        text=True,
        env={
            "HOME": str(creds_dir),
            "UNRAID_CREDENTIALS_DIR": str(creds_dir),
            "PATH": "/usr/bin:/bin",
        },
    )


def test_does_not_execute_command_substitution(tmp_path: Path) -> None:
    """A $(...) in a value must be stored literally, never executed."""
    sentinel = tmp_path / "PWNED"
    (tmp_path / ".env").write_text(
        f"UNRAID_API_URL=https://ok.test/graphql\nUNRAID_API_KEY=secret$(touch {sentinel})\n"
    )
    result = _run('load_env_file; echo "KEY=[$UNRAID_API_KEY]"', tmp_path)

    assert result.returncode == 0, result.stderr
    assert not sentinel.exists(), "command substitution was executed — injection!"
    assert f"KEY=[secret$(touch {sentinel})]" in result.stdout


def test_exports_only_unraid_vars(tmp_path: Path) -> None:
    """Only UNRAID_* assignments are exported; other vars are ignored."""
    (tmp_path / ".env").write_text(
        "UNRAID_API_URL=https://ok.test/graphql\n"
        "UNRAID_API_KEY=k\n"
        "OTHER_SECRET=nope\n"
        "# a comment\n"
        "\n"
    )
    result = _run(
        'load_env_file; echo "URL=[$UNRAID_API_URL]"; echo "OTHER=[${OTHER_SECRET:-<unset>}]"',
        tmp_path,
    )

    assert result.returncode == 0, result.stderr
    assert "URL=[https://ok.test/graphql]" in result.stdout
    assert "OTHER=[<unset>]" in result.stdout


def test_strips_matching_quotes_and_trailing_space(tmp_path: Path) -> None:
    (tmp_path / ".env").write_text(
        'UNRAID_API_URL="https://quoted.test/graphql"\n'
        "UNRAID_API_KEY=trailing   \n"
        "export UNRAID_TOWER2_URL='https://tower2.test'\n"
    )
    result = _run(
        'load_env_file; printf "URL=[%s] KEY=[%s] T2=[%s]\\n" '
        '"$UNRAID_API_URL" "$UNRAID_API_KEY" "$UNRAID_TOWER2_URL"',
        tmp_path,
    )

    assert result.returncode == 0, result.stderr
    # quotes stripped, trailing whitespace trimmed, `export ` prefix handled
    assert (
        "URL=[https://quoted.test/graphql] KEY=[trailing] T2=[https://tower2.test]" in result.stdout
    )


def test_missing_file_returns_nonzero_with_guidance(tmp_path: Path) -> None:
    """No .env (and no fallback) → return 1 with actionable stderr."""
    result = _run('load_env_file && echo "should-not-print"', tmp_path)

    assert result.returncode != 0
    assert "should-not-print" not in result.stdout
    assert "not found" in result.stderr.lower()
    assert ".unraid-mcp/.env" in result.stderr or "config form" in result.stderr.lower()


def test_rejects_symlinked_env(tmp_path: Path) -> None:
    """A symlinked credentials file must be refused (planted-symlink defense)."""
    target = tmp_path / "real.env"
    target.write_text("UNRAID_API_URL=https://x\nUNRAID_API_KEY=k\n")
    (tmp_path / ".env").symlink_to(target)

    result = _run('load_env_file && echo "loaded"', tmp_path)

    assert result.returncode != 0
    assert "loaded" not in result.stdout
    assert "symlink" in result.stderr.lower()


def test_load_unraid_credentials_validates(tmp_path: Path) -> None:
    """load_unraid_credentials fails when required keys are absent from the file."""
    (tmp_path / ".env").write_text("UNRAID_OTHER=x\n")  # no API_URL/API_KEY
    result = _run("load_unraid_credentials && echo OK || echo FAIL", tmp_path)

    assert "FAIL" in result.stdout
    assert "Missing required variables" in result.stderr


def test_direct_execution_is_blocked(tmp_path: Path) -> None:
    """Running load-env.sh directly (not sourced) must exit non-zero."""
    result = subprocess.run(
        ["bash", str(_LOAD_ENV)],
        capture_output=True,
        text=True,
        env={"HOME": str(tmp_path), "PATH": "/usr/bin:/bin"},
    )
    assert result.returncode != 0
    assert "must be sourced" in result.stderr
