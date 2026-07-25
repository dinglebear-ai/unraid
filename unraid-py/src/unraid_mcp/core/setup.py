"""Non-interactive credential setup for the Unraid MCP server.

Configuration is delivered by the plugin's ``userConfig`` form (Claude Code
injects it as ``CLAUDE_PLUGIN_OPTION_*`` environment variables) or by a
hand-edited ``~/.unraid-mcp/.env``. This module maps those plugin options to
the canonical ``.env`` file with restricted permissions, mirroring the
``setup plugin-hook`` pattern used across the rmcp-template Rust servers.

There is no interactive elicitation: the plugin config form is the UI, and
``run_plugin_hook()`` persists it to disk so the server, the CLI, and Docker
all read the same source of truth at startup.
"""

from __future__ import annotations

import json
import os

from ..config.logging import logger
from ..config.settings import (
    _BOOL_TRUE_TOKENS,
    CREDENTIALS_DIR,
    CREDENTIALS_ENV_PATH,
    PROJECT_ROOT,
)


# Maps Claude Code plugin-option env vars -> canonical server env vars.
# Mirrors rmcp-template's env_registry plugin_option_mappings().
PLUGIN_OPTION_MAP: dict[str, str] = {
    "CLAUDE_PLUGIN_OPTION_UNRAID_API_URL": "UNRAID_API_URL",
    "CLAUDE_PLUGIN_OPTION_UNRAID_API_KEY": "UNRAID_API_KEY",
    "CLAUDE_PLUGIN_OPTION_UNRAID_VERIFY_SSL": "UNRAID_VERIFY_SSL",
    "CLAUDE_PLUGIN_OPTION_UNRAID_ALLOW_INSECURE_TLS": "UNRAID_ALLOW_INSECURE_TLS",
}

# Credentials are a required pair: the server can't authenticate with only half,
# so the hook refuses to write a partial .env and reports the missing half. These
# are also the ONLY options wired through ``.mcp.json``'s ``env`` block — they have
# no package default, so an empty substitution can't shadow a user's
# ``~/.unraid-mcp/.env`` (unlike a var with a default; see issue #137).
CREDENTIAL_OPTIONS: frozenset[str] = frozenset({"UNRAID_API_URL", "UNRAID_API_KEY"})

# Optional config delivered ONLY through this hook (never ``.mcp.json`` env, to
# avoid the #137 shadowing trap): the TLS knobs a plugin user needs against a
# stock Unraid self-signed cert (see issue #172). Written to ``~/.unraid-mcp/.env``
# when supplied; their absence is normal and never raises an advisory.
CONFIG_OPTIONS: frozenset[str] = frozenset(PLUGIN_OPTION_MAP.values()) - CREDENTIAL_OPTIONS

# Value tokens (lowercased) for the TLS opt-out guard. These MUST match how
# ``config/settings.py`` parses the same vars, or the hook and the server would
# disagree about whether the opt-out is complete. The disabling set mirrors the
# ``raw_verify_ssl in ["false", "0", "no"]`` check there; the truthy set reuses
# settings' own ``_BOOL_TRUE_TOKENS`` (note: NOT pydantic's broader set — "on" is
# deliberately excluded, since settings would parse UNRAID_ALLOW_INSECURE_TLS=on
# as false and hit the fatal TLS guard).
_VERIFY_DISABLING_VALUES: frozenset[str] = frozenset({"false", "0", "no"})


def _safe_env_value(value: str) -> str | None:
    """Return the value if safe to write to a .env file, else None.

    Rejects empty values and values containing newlines, carriage returns, or
    NUL bytes (which could inject extra .env lines). Mirrors apply_plugin_options
    in the Rust template.
    """
    if not value:
        return None
    if any(ch in value for ch in ("\n", "\r", "\0")):
        return None
    return value


def apply_plugin_options() -> dict[str, str]:
    """Resolve canonical credentials from CLAUDE_PLUGIN_OPTION_* env vars.

    Returns a dict of ``{canonical_env_name: value}`` for every plugin option
    that is present and safe. Missing, empty, or unsafe options are skipped.
    The URL has any trailing slash stripped; all values are whitespace-trimmed.
    """
    resolved: dict[str, str] = {}
    for option, canonical in PLUGIN_OPTION_MAP.items():
        raw = os.environ.get(option)
        if raw is None:
            continue
        safe = _safe_env_value(raw.strip())
        if safe is None:
            continue
        resolved[canonical] = safe.rstrip("/") if canonical == "UNRAID_API_URL" else safe
    return resolved


def run_plugin_hook() -> int:
    """Persist plugin userConfig credentials to CREDENTIALS_ENV_PATH.

    Designed to run from the plugin's SessionStart / ConfigChange hooks. When
    both URL and key are supplied via CLAUDE_PLUGIN_OPTION_*, writes them to
    ``~/.unraid-mcp/.env`` (mode 600). Always returns 0 (advisory) so a missing
    config never blocks the session — the server reports the unconfigured state
    at request time instead. Emits a JSON report to stdout.
    """
    resolved = apply_plugin_options()
    report: dict[str, object] = {
        "ran_repair": False,
        "env_path": str(CREDENTIALS_ENV_PATH),
        "advisory_failures": [],
    }

    api_url = resolved.get("UNRAID_API_URL")
    api_key = resolved.get("UNRAID_API_KEY")
    # Optional non-credential config (e.g. TLS settings) persisted alongside the
    # credential pair. Absent keys are simply not written.
    extra = {k: v for k, v in resolved.items() if k in CONFIG_OPTIONS}

    # Reconcile optional config the plugin form manages but that is now blank: if
    # the CLAUDE_PLUGIN_OPTION_* var is present in the environment (Claude exports
    # every configured option, including cleared ones set back to their default)
    # yet resolved to empty/unsafe, remove any stale managed line so the package
    # default is restored. Without this, clearing UNRAID_VERIFY_SSL after once
    # setting it to "false" would leave verification disabled — the opposite of
    # the advertised "blank = verify" default. Options whose var is *absent*
    # entirely (non-plugin runtime, or a var the form doesn't manage) are left
    # untouched so a hand-edited ~/.unraid-mcp/.env is preserved.
    resets = {
        canonical
        for option, canonical in PLUGIN_OPTION_MAP.items()
        if canonical in CONFIG_OPTIONS and canonical not in resolved and option in os.environ
    }

    # Refuse to persist a verification-disabling UNRAID_VERIFY_SSL without the
    # second opt-in (UNRAID_ALLOW_INSECURE_TLS=true). settings.py runs its fatal
    # TLS guard at import — and this hook imports settings — so writing the
    # invalid pair would make the very next hook run exit before it could repair
    # the file, stranding the user at a FATAL that needs a manual .env edit. Drop
    # the disabling half (and clear any stale line) so the safe default holds, and
    # surface an advisory telling the user to enable both options together.
    advisories: list[str] = []
    verify_val = extra.get("UNRAID_VERIFY_SSL", "").strip().lower()
    insecure_val = extra.get("UNRAID_ALLOW_INSECURE_TLS", "").strip().lower()
    if verify_val in _VERIFY_DISABLING_VALUES and insecure_val not in _BOOL_TRUE_TOKENS:
        extra.pop("UNRAID_VERIFY_SSL", None)
        resets.add("UNRAID_VERIFY_SSL")
        advisories.append(
            "Refused to disable TLS verification: UNRAID_VERIFY_SSL=false also requires "
            "enabling 'Allow insecure TLS' (UNRAID_ALLOW_INSECURE_TLS=true). Left "
            "verification at its safe default — set both options together to disable it."
        )

    if api_url and api_key:
        try:
            _write_env(api_url, api_key, extra, resets)
            report["ran_repair"] = True
            report["advisory_failures"] = advisories
            logger.info("Plugin setup hook wrote credentials to %s", CREDENTIALS_ENV_PATH)
        except OSError as e:
            # Record the write failure in the advisory channel rather than letting it
            # escape — the documented contract is "always returns 0" so the hook never
            # blocks a session. The server still reports unconfigured at request time.
            report["advisory_failures"] = [
                *advisories,
                f"Failed to write {CREDENTIALS_ENV_PATH}: {type(e).__name__}: {e}",
            ]
            logger.error(
                "Plugin setup hook failed to write %s: %s",
                CREDENTIALS_ENV_PATH,
                e,
                exc_info=True,
            )
    else:
        # Distinguish "not supplied" from "supplied but rejected as unsafe": a present
        # env var that failed _safe_env_value is absent from `resolved` but should still
        # be surfaced so the operator knows why it was dropped.
        failures: list[str] = []
        for option, canonical in PLUGIN_OPTION_MAP.items():
            # Only credentials are required; optional config (TLS knobs) is silent
            # when omitted, so it never contributes an advisory.
            if canonical not in CREDENTIAL_OPTIONS:
                continue
            if canonical in resolved:
                continue
            if option in os.environ:
                # Present (key set) but absent from `resolved` → empty or unsafe value.
                # Use key presence, not truthiness, so an explicit empty value is
                # classified as "rejected", not "not supplied".
                failures.append(
                    f"{canonical} was supplied but rejected (empty or unsafe characters) — "
                    "check the value in the plugin config form."
                )
            else:
                failures.append(
                    f"{canonical} not supplied via plugin userConfig — set it in the plugin "
                    f"config form or edit {CREDENTIALS_ENV_PATH} directly."
                )
        report["advisory_failures"] = advisories + failures
        logger.info(
            "Plugin setup hook: credentials not fully supplied; no .env written. %s",
            " ".join(advisories + failures),
        )

    print(json.dumps(report, indent=2))
    return 0


def _dotenv_value(value: str) -> str:
    """Render a value for a .env assignment, quoting only when necessary.

    Plain values (the common case — alphanumeric keys, scheme://host URLs) are
    written unquoted. Values containing whitespace or characters that would break
    unquoted parsing (`#`, quotes, backslash) are double-quoted with backslash and
    double-quote escaped, so they round-trip through python-dotenv and the skill's
    load-env.sh parser. Mirrors rmcp-template's dotenv_value.
    """
    if value and not any(ch in value for ch in (" ", "\t", "#", '"', "'", "\\")):
        return value
    escaped = value.replace("\\", "\\\\").replace('"', '\\"')
    return f'"{escaped}"'


def _write_env(
    api_url: str,
    api_key: str,
    extra: dict[str, str] | None = None,
    remove: set[str] | None = None,
) -> None:
    """Write or update credentials (and optional config) in CREDENTIALS_ENV_PATH.

    Creates CREDENTIALS_DIR (mode 700) if needed. On first run, seeds from
    .env.example to preserve comments and structure. Sets file mode to 600.

    ``extra`` carries optional non-credential vars (e.g. TLS settings from the
    plugin config form) written the same way — replaced in place when the key
    already exists in the template, appended otherwise. The credential pair is
    always written first so its ordering is stable across runs.

    ``remove`` names optional-config vars whose active assignment should be
    dropped (an active ``KEY=...`` line is deleted; commented ``# KEY=`` lines in
    the seeded example are left intact) so the package default is restored when a
    plugin option is cleared. A key appearing in both ``extra`` and ``remove`` is
    written, not removed.
    """
    # Ensure directory exists with restricted permissions (chmod after to bypass umask)
    CREDENTIALS_DIR.mkdir(parents=True, exist_ok=True)
    CREDENTIALS_DIR.chmod(0o700)

    if CREDENTIALS_ENV_PATH.exists():
        template_lines = CREDENTIALS_ENV_PATH.read_text().splitlines()
    else:
        example_path = PROJECT_ROOT / ".env.example"
        template_lines = example_path.read_text().splitlines() if example_path.exists() else []

    # Ordered so credentials come first when appended; extra keys follow.
    values: dict[str, str] = {
        "UNRAID_API_URL": api_url,
        "UNRAID_API_KEY": api_key,
        **(extra or {}),
    }
    # A written key always wins over a removal request.
    to_remove = (remove or set()) - values.keys()

    # Replace each managed var in-place; track which were found in the template.
    written: set[str] = set()
    new_lines: list[str] = []
    for line in template_lines:
        stripped = line.strip()
        # Drop active assignments for reset keys (skip commented "# KEY=" lines).
        if any(stripped.startswith(f"{key}=") for key in to_remove):
            continue
        for key, value in values.items():
            if stripped.startswith(f"{key}="):
                new_lines.append(f"{key}={_dotenv_value(value)}")
                written.add(key)
                break
        else:
            new_lines.append(line)

    # Append any managed var not present in the template (preserving values order).
    for key, value in values.items():
        if key not in written:
            new_lines.append(f"{key}={_dotenv_value(value)}")

    # Atomic write: write to tmp file, set permissions, then rename into place.
    # os.replace is atomic on POSIX — prevents a crash from leaving a partial .env.
    tmp_path = CREDENTIALS_ENV_PATH.with_suffix(".tmp")
    try:
        # Create the secret file with 0600 FROM THE START via os.open — umask only
        # removes permission bits, so the API key is never briefly world-readable.
        # (A write_text()-then-chmod leaves a race window where the file exists with
        # the default umask mode, e.g. 0644, while already containing the key — a
        # local user could read it in that window.) Unlink any stale tmp first so
        # O_CREAT applies the mode to a freshly created file.
        tmp_path.unlink(missing_ok=True)
        fd = os.open(tmp_path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
        with os.fdopen(fd, "w") as fh:
            fh.write("\n".join(new_lines) + "\n")
        os.replace(tmp_path, CREDENTIALS_ENV_PATH)  # noqa: PTH105
    finally:
        # Clean up tmp on failure (may not exist if os.replace succeeded). Swallow any
        # cleanup error so it can't mask the real write exception propagating from try.
        try:
            tmp_path.unlink(missing_ok=True)
        except OSError as cleanup_err:
            logger.warning("Could not remove temp env file %s: %s", tmp_path, cleanup_err)
    logger.info("Credentials written to %s (mode 600)", CREDENTIALS_ENV_PATH)
