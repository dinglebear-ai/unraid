"""Configuration management for Unraid MCP Server.

This module handles loading environment variables from multiple .env locations
and provides all configuration constants used throughout the application.

The simple, type-coercible environment variables are modelled declaratively with
a :class:`pydantic_settings.BaseSettings` subclass (``Settings``). The subtle,
security-relevant behaviours that pydantic-settings does not cover natively are
retained as hand-written code that runs at import time:

* multi-location ``.env`` discovery with the canonical ``~/.unraid-mcp/.env``
  taking priority (``_load_env_files``);
* refusal to load a *symlinked* env file (CWE-22 / symlink-attack guard);
* the issue-#28 fix where an empty-string credential env var must NOT shadow the
  value coming from a ``.env`` file;
* the fatal ``sys.exit(1)`` guard for the ``UNRAID_VERIFY_SSL`` /
  ``UNRAID_ALLOW_INSECURE_TLS`` (S-H1) interaction, which runs at module level
  *after* ``Settings()`` because it depends on cross-field state.

Transport and numeric bounds are expressed declaratively on the model. Rendering
validation failures and choosing a process exit code belongs to the composition
root, not field validators.

Every name this module historically exported is re-exported, unchanged, at the
end of the file so existing imports (``from ..config.settings import X`` and
``_settings.X``) keep working with identical types and values.
"""

import os
import re
import sys
from pathlib import Path
from typing import Annotated, Any, Literal

from dotenv import load_dotenv
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

from ..version import VERSION as APP_VERSION


# Get the script directory (config module location)
SCRIPT_DIR = Path(__file__).parent  # /home/user/code/unraid-mcp/src/unraid_mcp/config/
UNRAID_MCP_DIR = SCRIPT_DIR.parent  # /home/user/code/unraid-mcp/src/unraid_mcp/
# src-layout: package lives at src/unraid_mcp/, so the repo root is two levels up.
PROJECT_ROOT = UNRAID_MCP_DIR.parent.parent  # /home/user/code/unraid-mcp/

# Canonical credentials directory — version-agnostic, survives plugin version bumps.
# Override with UNRAID_CREDENTIALS_DIR env var (useful for containers).
CREDENTIALS_DIR = Path(os.getenv("UNRAID_CREDENTIALS_DIR", str(Path.home() / ".unraid-mcp")))
CREDENTIALS_ENV_PATH = CREDENTIALS_DIR / ".env"

# Credential env vars that an empty string must NOT shadow. The bundled
# `.mcp.json` passes `${CLAUDE_PLUGIN_OPTION_UNRAID_API_URL}` (and key), which
# resolves to "" when the plugin option is unset. With load_dotenv's default
# override=False, those empty values would otherwise take precedence over every
# .env on the search path — including the canonical ~/.unraid-mcp/.env — so the
# credentials silently never load. See GitHub issue #28.
_EMPTY_AS_UNSET_KEYS = ("UNRAID_API_URL", "UNRAID_API_KEY")

# Truthy tokens used for boolean env coercion. This intentionally matches the
# historical hand-rolled ``raw in ("true", "1", "yes")`` behaviour rather than
# pydantic's broader default bool parsing (which also accepts "on"/"off"/"f"…).
_BOOL_TRUE_TOKENS = ("true", "1", "yes")


def _load_env_files() -> None:
    """Load environment variables from the first existing .env on the search path.

    Priority: canonical ~/.unraid-mcp/.env first, then dev/container fallbacks.

    Before loading, empty-string entries for the credential keys are removed from
    os.environ so that ``load_dotenv(override=False)`` can populate them from the
    .env file. A genuinely-set (non-empty) shell export is still respected.
    """
    # Treat empty-string credential env vars as unset (issue #28).
    for key in _EMPTY_AS_UNSET_KEYS:
        if os.environ.get(key, "").strip() == "":
            os.environ.pop(key, None)

    dotenv_paths = [
        CREDENTIALS_ENV_PATH,  # primary — ~/.unraid-mcp/.env (all runtimes)
        CREDENTIALS_DIR / ".env.local",  # only used if ~/.unraid-mcp/.env absent
        Path("/app/.env.local"),  # Docker compat mount
        PROJECT_ROOT / ".env.local",  # dev overrides
        PROJECT_ROOT / ".env",  # dev fallback
        UNRAID_MCP_DIR / ".env",  # last resort
    ]

    for dotenv_path in dotenv_paths:
        if not dotenv_path.exists():
            continue
        # Refuse a symlinked credentials/env file — it holds secrets and a planted
        # symlink could redirect the read to attacker-controlled content (CWE-22).
        # Mirrors the rmcp-template / axon convention.
        if dotenv_path.is_symlink():
            print(
                f"WARNING: refusing to load symlinked env file {dotenv_path} "
                "(potential symlink attack); skipping.",
                file=sys.stderr,
            )
            continue
        load_dotenv(dotenv_path=dotenv_path)
        break


class Settings(BaseSettings):
    """Declarative model for the simple, type-coercible Unraid MCP env vars.

    Only the straightforward variables live here. The ``UNRAID_VERIFY_SSL`` union
    (bool-or-CA-path) plus its S-H1 fatal guard are resolved separately at module
    level because the guard's ``sys.exit(1)`` depends on cross-field state and is
    clearer kept inline.

    Field aliases are the exact env-var names; ``populate_by_name`` lets tests and
    callers construct the model with either the field name or the env-var alias.
    """

    model_config = SettingsConfigDict(
        populate_by_name=True,
        extra="ignore",
        case_sensitive=True,
    )

    # Core API Configuration. None when absent (mirrors os.getenv()).
    unraid_api_url: str | None = Field(default=None, alias="UNRAID_API_URL")
    unraid_api_key: str | None = Field(default=None, alias="UNRAID_API_KEY")

    # Server Configuration
    unraid_mcp_port: int = Field(default=6970, ge=1, le=65535, alias="UNRAID_MCP_PORT")
    # Default to loopback so a bare-metal HTTP run is not LAN-exposed unless the
    # operator explicitly opts in (S-H3 / SEC-M3). The Docker image sets
    # UNRAID_MCP_HOST=0.0.0.0 itself, since the container must bind all interfaces
    # for the (loopback-published) port to be reachable from the host.
    unraid_mcp_host: str = Field(default="127.0.0.1", alias="UNRAID_MCP_HOST")
    unraid_mcp_transport: Literal["streamable-http", "stdio", "sse"] = Field(
        default="streamable-http", alias="UNRAID_MCP_TRANSPORT"
    )

    # Maximum serialized tool-response size in bytes. Responses larger than this are
    # replaced with a structured, still-parseable truncation marker (see
    # core/response_limit.py) rather than hard-cut mid-JSON. Default 40 KB (~10K
    # tokens) keeps a single response a small fraction of the client context window;
    # the per-list cap_list defaults do the primary bounding, this is the backstop.
    unraid_mcp_max_response_bytes: int = Field(
        default=40000, gt=0, alias="UNRAID_MCP_MAX_RESPONSE_BYTES"
    )

    # Subscription runtime. These settings were historically parsed ad hoc in
    # manager/resources/diagnostics, which allowed invalid values to fail only
    # after server startup and made tests depend on process-global os.environ.
    unraid_auto_start_subscriptions: bool = Field(
        default=True, alias="UNRAID_AUTO_START_SUBSCRIPTIONS"
    )
    unraid_max_reconnect_attempts: int = Field(
        default=10, ge=0, le=100, alias="UNRAID_MAX_RECONNECT_ATTEMPTS"
    )
    unraid_autostart_log_path: str | None = Field(default=None, alias="UNRAID_AUTOSTART_LOG_PATH")
    unraid_mcp_enable_raw_subscription_probe: bool = Field(
        default=False, alias="UNRAID_MCP_ENABLE_RAW_SUBSCRIPTION_PROBE"
    )
    unraid_subscription_auto_start_actions: Annotated[frozenset[str] | None, NoDecode] = Field(
        default=None, alias="UNRAID_SUBSCRIPTION_AUTO_START_ACTIONS"
    )
    unraid_subscription_max_connections: int = Field(
        default=3, ge=1, le=32, alias="UNRAID_SUBSCRIPTION_MAX_CONNECTIONS"
    )
    unraid_subscription_startup_stagger_seconds: float = Field(
        default=0.05,
        ge=0,
        le=10,
        alias="UNRAID_SUBSCRIPTION_STARTUP_STAGGER_SECONDS",
    )
    unraid_subscription_collect_max_events: int = Field(
        default=100, ge=1, le=10_000, alias="UNRAID_SUBSCRIPTION_COLLECT_MAX_EVENTS"
    )
    unraid_subscription_collect_max_bytes: int = Field(
        default=1_048_576, gt=0, alias="UNRAID_SUBSCRIPTION_COLLECT_MAX_BYTES"
    )
    unraid_subscription_collect_max_seconds: float = Field(
        default=30.0, gt=0, le=300, alias="UNRAID_SUBSCRIPTION_COLLECT_MAX_SECONDS"
    )
    unraid_subscription_cache_max_age_seconds: float = Field(
        default=300.0,
        gt=0,
        le=86_400,
        alias="UNRAID_SUBSCRIPTION_CACHE_MAX_AGE_SECONDS",
    )
    unraid_subscription_timeout_max_seconds: float = Field(
        default=60.0,
        gt=0,
        le=300,
        alias="UNRAID_SUBSCRIPTION_TIMEOUT_MAX_SECONDS",
    )

    # HTTP Authentication
    # Bearer token for HTTP transport (streamable-http / sse).
    # Auto-generated on first HTTP startup if absent; written to CREDENTIALS_ENV_PATH.
    # Set UNRAID_MCP_DISABLE_HTTP_AUTH=true only when an upstream gateway handles auth.
    unraid_mcp_bearer_token: str | None = Field(default=None, alias="UNRAID_MCP_BEARER_TOKEN")
    unraid_mcp_disable_http_auth: bool = Field(default=False, alias="UNRAID_MCP_DISABLE_HTTP_AUTH")

    # Affirms that a trusted reverse proxy (e.g. SWAG) fronts this server and enforces
    # authentication. Required when UNRAID_MCP_DISABLE_HTTP_AUTH=true AND the bind host is
    # not loopback — otherwise the server would expose an unauthenticated MCP endpoint on a
    # public/LAN interface (finding S-H3). The documented topology runs behind SWAG, so the
    # operator must explicitly opt in to that arrangement; leaving it false fails closed.
    unraid_mcp_trust_proxy: bool = Field(default=False, alias="UNRAID_MCP_TRUST_PROXY")

    # Google OAuth (HTTP transport) — OPTIONAL alternative to the pre-shared bearer token.
    # When both client id and secret are set, the server delegates HTTP authentication to
    # FastMCP's GoogleProvider (OAuth proxy) instead of the bearer-token middleware. See
    # core/google_auth.py for the wiring and .env.example for the full variable reference.
    # All values default to None so the bearer-token path is entirely unaffected when unset.
    unraid_mcp_google_client_id: str | None = Field(
        default=None, alias="UNRAID_MCP_GOOGLE_CLIENT_ID"
    )
    unraid_mcp_google_client_secret: str | None = Field(
        default=None, alias="UNRAID_MCP_GOOGLE_CLIENT_SECRET"
    )
    # Public base URL of this server (e.g. https://unraid-mcp.example.com); must match the
    # Authorized redirect URI registered in Google Cloud. Required when OAuth is enabled.
    unraid_mcp_google_base_url: str | None = Field(default=None, alias="UNRAID_MCP_GOOGLE_BASE_URL")
    # Comma/space-separated OAuth scopes. Defaults to "openid <userinfo.email>" when unset.
    unraid_mcp_google_required_scopes: str | None = Field(
        default=None, alias="UNRAID_MCP_GOOGLE_REQUIRED_SCOPES"
    )
    # Authorization allowlist. OAuth proves Google identity; these settings decide
    # which identities may control this MCP server. At least one allowlist entry is
    # required unless UNRAID_MCP_GOOGLE_ALLOW_ANY_USER=true is explicitly set.
    unraid_mcp_google_allowed_emails: str | None = Field(
        default=None, alias="UNRAID_MCP_GOOGLE_ALLOWED_EMAILS"
    )
    unraid_mcp_google_allowed_domains: str | None = Field(
        default=None, alias="UNRAID_MCP_GOOGLE_ALLOWED_DOMAINS"
    )
    unraid_mcp_google_allow_any_user: bool = Field(
        default=False, alias="UNRAID_MCP_GOOGLE_ALLOW_ANY_USER"
    )
    # OAuth callback path. Defaults to GoogleProvider's "/auth/callback" when unset.
    unraid_mcp_google_redirect_path: str | None = Field(
        default=None, alias="UNRAID_MCP_GOOGLE_REDIRECT_PATH"
    )
    # Persistence (both required together): a JWT signing key and a Fernet encryption key
    # enable encrypted, restart-surviving token storage on disk (FileTreeStore). Set neither
    # to keep tokens in memory (cleared on restart); setting only one is a config error.
    unraid_mcp_google_jwt_signing_key: str | None = Field(
        default=None, alias="UNRAID_MCP_GOOGLE_JWT_SIGNING_KEY"
    )
    unraid_mcp_google_encryption_key: str | None = Field(
        default=None, alias="UNRAID_MCP_GOOGLE_ENCRYPTION_KEY"
    )
    # Directory for persisted encrypted tokens. Defaults to ~/.unraid-mcp/oauth-tokens.
    unraid_mcp_google_storage_dir: str | None = Field(
        default=None, alias="UNRAID_MCP_GOOGLE_STORAGE_DIR"
    )

    # SSL Configuration — second explicit opt-in gating disabled TLS verification (S-H1).
    unraid_allow_insecure_tls: bool = Field(default=False, alias="UNRAID_ALLOW_INSECURE_TLS")

    # Raw UNRAID_VERIFY_SSL string; resolved to bool|str (CA-bundle path) below.
    raw_verify_ssl: str = Field(default="true", alias="UNRAID_VERIFY_SSL")

    # Logging Configuration
    log_level_str: str = Field(default="INFO", alias="UNRAID_MCP_LOG_LEVEL")
    log_file_name: str = Field(default="unraid-mcp.log", alias="UNRAID_MCP_LOG_FILE")

    # -- validators -----------------------------------------------------------

    @field_validator(
        "unraid_api_url",
        "unraid_api_key",
        "unraid_mcp_bearer_token",
        "unraid_mcp_google_client_id",
        "unraid_mcp_google_client_secret",
        "unraid_mcp_google_base_url",
        "unraid_mcp_google_required_scopes",
        "unraid_mcp_google_allowed_emails",
        "unraid_mcp_google_allowed_domains",
        "unraid_mcp_google_redirect_path",
        "unraid_mcp_google_jwt_signing_key",
        "unraid_mcp_google_encryption_key",
        "unraid_mcp_google_storage_dir",
        "unraid_autostart_log_path",
        mode="before",
    )
    @classmethod
    def _empty_to_none(cls, value: object) -> object:
        """Mirror ``os.getenv(...) or None`` — empty string becomes None.

        Critical for the Google OAuth fields: the bundled ``.mcp.json`` expands
        unset plugin options to ``""``. Treating those as ``None`` keeps an
        unconfigured deployment on the default bearer-token path instead of
        falsely tripping the ``client_id``/``client_secret`` enable gate.
        """
        if value == "":
            return None
        return value

    @field_validator(
        "unraid_mcp_disable_http_auth",
        "unraid_mcp_trust_proxy",
        "unraid_mcp_google_allow_any_user",
        "unraid_allow_insecure_tls",
        mode="before",
    )
    @classmethod
    def _coerce_bool(cls, value: object) -> bool:
        """Coerce to bool using the historical truthy token set.

        Matches ``raw.lower() in ("true", "1", "yes")`` exactly so behaviour is
        identical to the pre-migration code (and narrower than pydantic's default
        bool parsing).
        """
        if isinstance(value, bool):
            return value
        return str(value).lower() in _BOOL_TRUE_TOKENS

    @field_validator(
        "unraid_auto_start_subscriptions",
        "unraid_mcp_enable_raw_subscription_probe",
        mode="before",
    )
    @classmethod
    def _coerce_strict_subscription_bool(cls, value: object) -> bool:
        if isinstance(value, bool):
            return value
        normalized = str(value).strip().lower()
        if normalized in _BOOL_TRUE_TOKENS:
            return True
        if normalized in ("false", "0", "no"):
            return False
        raise ValueError("must be one of true/false, 1/0, or yes/no")

    @field_validator("unraid_mcp_transport", mode="before")
    @classmethod
    def _lower_transport(cls, value: object) -> str:
        return str(value).lower()

    @field_validator("unraid_subscription_auto_start_actions", mode="before")
    @classmethod
    def _parse_auto_start_actions(cls, value: object) -> frozenset[str] | None:
        if value is None or value == "":
            return None
        if isinstance(value, str):
            return frozenset(part for part in re.split(r"[\s,]+", value.strip()) if part)
        if isinstance(value, (list, tuple, set, frozenset)):
            return frozenset(str(item) for item in value)
        raise ValueError("must be a comma/space-separated string or collection of names")

    @field_validator("unraid_allow_insecure_tls", mode="before")
    @classmethod
    def _blank_insecure_tls_is_false(cls, value: object) -> object:
        # Plugin manifests substitute an unset userConfig option as an empty
        # string (e.g. UNRAID_ALLOW_INSECURE_TLS=""); pydantic would reject "" as
        # a bool. Treat blank as the default (disabled) so an omitted option is a
        # no-op rather than a startup crash.
        if isinstance(value, str) and value.strip() == "":
            return False
        return value

    @field_validator("raw_verify_ssl", mode="before")
    @classmethod
    def _lower_verify_ssl(cls, value: object) -> str:
        # A blank value (unset plugin option substituted as "") must fall back to
        # the "true" default; otherwise it would be treated as a (bogus, empty)
        # CA-bundle path downstream and silently break TLS verification.
        text = str(value).strip()
        if text == "":
            return "true"
        return text.lower()

    @field_validator("log_level_str", mode="before")
    @classmethod
    def _upper_log_level(cls, value: object) -> str:
        return str(value).upper()


def load_settings() -> Settings:
    """Load the configured env source and return one validated settings snapshot."""
    _load_env_files()
    return Settings()


_settings = load_settings()
SETTINGS = _settings

# Core API Configuration
# Loaded once at startup from the .env hierarchy / process env. Consumers should
# read the current value via a local import (from ..config import settings as
# _settings; _settings.UNRAID_API_URL), so a future reload picks up the latest
# binding rather than a stale module-import snapshot.
UNRAID_API_URL = _settings.unraid_api_url
UNRAID_API_KEY = _settings.unraid_api_key

# Server Configuration
UNRAID_MCP_PORT = _settings.unraid_mcp_port
UNRAID_MCP_HOST = _settings.unraid_mcp_host
UNRAID_MCP_TRANSPORT = _settings.unraid_mcp_transport

UNRAID_MCP_MAX_RESPONSE_BYTES = _settings.unraid_mcp_max_response_bytes

# Subscription runtime
UNRAID_AUTO_START_SUBSCRIPTIONS = _settings.unraid_auto_start_subscriptions
UNRAID_MAX_RECONNECT_ATTEMPTS = _settings.unraid_max_reconnect_attempts
UNRAID_AUTOSTART_LOG_PATH = _settings.unraid_autostart_log_path
UNRAID_MCP_ENABLE_RAW_SUBSCRIPTION_PROBE = _settings.unraid_mcp_enable_raw_subscription_probe
UNRAID_SUBSCRIPTION_AUTO_START_ACTIONS = _settings.unraid_subscription_auto_start_actions
UNRAID_SUBSCRIPTION_MAX_CONNECTIONS = _settings.unraid_subscription_max_connections
UNRAID_SUBSCRIPTION_STARTUP_STAGGER_SECONDS = _settings.unraid_subscription_startup_stagger_seconds
UNRAID_SUBSCRIPTION_COLLECT_MAX_EVENTS = _settings.unraid_subscription_collect_max_events
UNRAID_SUBSCRIPTION_COLLECT_MAX_BYTES = _settings.unraid_subscription_collect_max_bytes
UNRAID_SUBSCRIPTION_COLLECT_MAX_SECONDS = _settings.unraid_subscription_collect_max_seconds
UNRAID_SUBSCRIPTION_CACHE_MAX_AGE_SECONDS = _settings.unraid_subscription_cache_max_age_seconds
UNRAID_SUBSCRIPTION_TIMEOUT_MAX_SECONDS = _settings.unraid_subscription_timeout_max_seconds

# HTTP Authentication
UNRAID_MCP_BEARER_TOKEN: str | None = _settings.unraid_mcp_bearer_token
UNRAID_MCP_DISABLE_HTTP_AUTH: bool = _settings.unraid_mcp_disable_http_auth
UNRAID_MCP_TRUST_PROXY: bool = _settings.unraid_mcp_trust_proxy

# Google OAuth (optional; see core/google_auth.py)
UNRAID_MCP_GOOGLE_CLIENT_ID: str | None = _settings.unraid_mcp_google_client_id
UNRAID_MCP_GOOGLE_CLIENT_SECRET: str | None = _settings.unraid_mcp_google_client_secret
UNRAID_MCP_GOOGLE_BASE_URL: str | None = _settings.unraid_mcp_google_base_url
UNRAID_MCP_GOOGLE_REQUIRED_SCOPES: str | None = _settings.unraid_mcp_google_required_scopes
UNRAID_MCP_GOOGLE_ALLOWED_EMAILS: str | None = _settings.unraid_mcp_google_allowed_emails
UNRAID_MCP_GOOGLE_ALLOWED_DOMAINS: str | None = _settings.unraid_mcp_google_allowed_domains
UNRAID_MCP_GOOGLE_ALLOW_ANY_USER: bool = _settings.unraid_mcp_google_allow_any_user
UNRAID_MCP_GOOGLE_REDIRECT_PATH: str | None = _settings.unraid_mcp_google_redirect_path
UNRAID_MCP_GOOGLE_JWT_SIGNING_KEY: str | None = _settings.unraid_mcp_google_jwt_signing_key
UNRAID_MCP_GOOGLE_ENCRYPTION_KEY: str | None = _settings.unraid_mcp_google_encryption_key
UNRAID_MCP_GOOGLE_STORAGE_DIR: str | None = _settings.unraid_mcp_google_storage_dir

# SSL Configuration
# UNRAID_VERIFY_SSL accepts: true/1/yes (verify, default), false/0/no (disable —
# DANGEROUS), or a filesystem path to a CA bundle (the recommended way to trust a
# self-signed cert without disabling verification entirely).
#
# Disabling verification is gated behind a SECOND explicit opt-in
# (UNRAID_ALLOW_INSECURE_TLS=true). With verification off, the API key is sent to an
# unverified peer over BOTH the httpx GraphQL client AND the WebSocket subscription
# connection, so a man-in-the-middle can capture it. The CA-bundle path is the safe
# alternative for self-signed certs.
UNRAID_ALLOW_INSECURE_TLS: bool = _settings.unraid_allow_insecure_tls

raw_verify_ssl = _settings.raw_verify_ssl
if raw_verify_ssl in ["false", "0", "no"]:
    if not UNRAID_ALLOW_INSECURE_TLS:
        print(
            "FATAL: UNRAID_VERIFY_SSL is disabled but UNRAID_ALLOW_INSECURE_TLS is not set. "
            "Disabling TLS verification sends the API key to an unverified peer over both the "
            "HTTP and WebSocket connections, exposing it to man-in-the-middle interception. "
            "Prefer pointing UNRAID_VERIFY_SSL at a CA-bundle path to trust a self-signed cert "
            "without disabling verification. To proceed anyway, set "
            "UNRAID_ALLOW_INSECURE_TLS=true.",
            file=sys.stderr,
        )
        sys.exit(1)
    UNRAID_VERIFY_SSL: bool | str = False
elif raw_verify_ssl in ["true", "1", "yes"]:
    UNRAID_VERIFY_SSL = True
else:  # Path to CA bundle
    UNRAID_VERIFY_SSL = raw_verify_ssl

# Logging Configuration
LOG_LEVEL_STR = _settings.log_level_str
LOG_FILE_NAME = _settings.log_file_name
# Use /.dockerenv as the container indicator for robust Docker detection.
IS_DOCKER = Path("/.dockerenv").exists()
LOGS_DIR = Path("/app/logs") if IS_DOCKER else PROJECT_ROOT / "logs"
LOG_FILE_PATH = LOGS_DIR / LOG_FILE_NAME

# Ensure logs directory exists; if creation fails, fall back to PROJECT_ROOT / ".cache" / "logs".
try:
    LOGS_DIR.mkdir(parents=True, exist_ok=True)
except OSError:
    LOGS_DIR = PROJECT_ROOT / ".cache" / "logs"
    LOGS_DIR.mkdir(parents=True, exist_ok=True)
    LOG_FILE_PATH = LOGS_DIR / LOG_FILE_NAME

# HTTP Client Configuration
TIMEOUT_CONFIG = {
    "default": 30,
    "disk_operations": 90,  # Longer timeout for SMART data queries
}


def validate_required_config() -> tuple[bool, list[str]]:
    """Validate that required configuration is present.

    Returns:
        bool: True if all required config is present, False otherwise.
    """
    required_vars = [("UNRAID_API_URL", UNRAID_API_URL), ("UNRAID_API_KEY", UNRAID_API_KEY)]

    missing = []
    for name, value in required_vars:
        if not value:
            missing.append(name)

    return len(missing) == 0, missing


def is_configured() -> bool:
    """Return True if both required credentials are present."""
    return bool(UNRAID_API_URL and UNRAID_API_KEY)


def apply_bearer_token(token: str) -> None:
    """Store the generated bearer token in the authoritative config surface.

    Called by ``ensure_token_exists()`` in server.py after writing the token
    to disk.  We do NOT set os.environ here — the caller is responsible for
    calling ``os.environ.pop("UNRAID_MCP_BEARER_TOKEN", None)`` immediately
    after, so the token is no longer accessible via os.environ.

    The single authoritative read surface for the bearer token is the
    ``UNRAID_MCP_BEARER_TOKEN`` module global: every reader (the auth
    middleware via ``server.py``, the startup gate, ``get_config_summary``)
    goes through it. The ``Settings`` instance field is only read once at
    import to seed this global, so this one-shot startup-time write updates the
    global only.
    """
    global UNRAID_MCP_BEARER_TOKEN
    UNRAID_MCP_BEARER_TOKEN = token


def get_config_summary() -> dict[str, Any]:
    """Get a summary of current configuration (safe for logging).

    Returns:
        dict: Configuration summary with sensitive data redacted.
    """
    is_valid, missing = validate_required_config()

    from ..core.utils import safe_display_url

    is_http = UNRAID_MCP_TRANSPORT in ("streamable-http", "sse")
    google_oauth_enabled = is_http and bool(
        UNRAID_MCP_GOOGLE_CLIENT_ID and UNRAID_MCP_GOOGLE_CLIENT_SECRET
    )
    http_auth_mode = (
        "google_oauth"
        if google_oauth_enabled
        else "disabled"
        if is_http and UNRAID_MCP_DISABLE_HTTP_AUTH
        else "bearer"
        if is_http
        else "not_applicable"
    )
    return {
        "api_url_configured": bool(UNRAID_API_URL),
        "api_url_preview": safe_display_url(UNRAID_API_URL) if UNRAID_API_URL else None,
        "api_key_configured": bool(UNRAID_API_KEY),
        "server_host": UNRAID_MCP_HOST,
        "server_port": UNRAID_MCP_PORT,
        "transport": UNRAID_MCP_TRANSPORT,
        "ssl_verify": UNRAID_VERIFY_SSL,
        "log_level": LOG_LEVEL_STR,
        "log_file": str(LOG_FILE_PATH),
        "config_valid": is_valid,
        "missing_config": missing if not is_valid else None,
        # Auth fields only meaningful in HTTP mode
        "http_auth_enabled": is_http and http_auth_mode != "disabled",
        "http_auth_mode": http_auth_mode,
        "http_auth_token_set": bool(UNRAID_MCP_BEARER_TOKEN)
        if http_auth_mode == "bearer"
        else None,
        # Google OAuth delegation (when both client id + secret are set, OAuth
        # replaces the bearer token as the HTTP auth mechanism).
        "google_oauth_enabled": google_oauth_enabled,
    }


# Re-export application version from a single source of truth.
VERSION = APP_VERSION
