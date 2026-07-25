"""Optional Google OAuth authentication for the HTTP transport.

The server's default authentication is a pre-shared bearer token enforced by the
ASGI middleware in :mod:`unraid_mcp.core.auth`. As an alternative, operators can
delegate HTTP authentication to **Google OAuth**: when both
``UNRAID_MCP_GOOGLE_CLIENT_ID`` and ``UNRAID_MCP_GOOGLE_CLIENT_SECRET`` are set,
the server attaches FastMCP's :class:`GoogleProvider` (an OAuth-proxy auth
backend) to the ``FastMCP`` instance, and MCP clients authenticate via the
standard OAuth browser flow instead of sending a static token.

When Google OAuth is active, ``server.py`` does NOT install
``BearerAuthMiddleware`` / ``WellKnownMiddleware`` (the provider serves its own
``.well-known`` discovery metadata and gates requests itself). If
``UNRAID_MCP_BEARER_TOKEN`` is also configured, the two modes coexist: the
static token is accepted by a constant-time fallback in the provider's token
verifier chain (see :class:`_StaticBearerFallbackVerifier`), so OAuth clients
(e.g. claude.ai) and pre-shared-token clients can use the same endpoint.
Everything here is gated entirely on environment variables, so a deployment
that sets none of them is byte-for-byte unchanged.

Token persistence
-----------------
By default the provider keeps issued tokens in memory, so every restart
invalidates existing client sessions (clients transparently re-authenticate). To
persist tokens across restarts WITHOUT standing up Redis, set BOTH
``UNRAID_MCP_GOOGLE_JWT_SIGNING_KEY`` and ``UNRAID_MCP_GOOGLE_ENCRYPTION_KEY``:
tokens are then written under ``UNRAID_MCP_GOOGLE_STORAGE_DIR`` (default
``~/.unraid-mcp/oauth-tokens``) through a ``FileTreeStore`` wrapped in a
``FernetEncryptionWrapper`` so they are encrypted at rest. Setting only one of the
two keys is a configuration error — encrypted persistence needs both.
"""

from __future__ import annotations

import asyncio
import contextlib
import hmac
import ipaddress
import time
import weakref
from collections import OrderedDict
from pathlib import Path
from typing import TYPE_CHECKING
from urllib.parse import urlparse

import httpx

from ..config import settings as _settings
from ..config.logging import logger
from ..config.settings import CREDENTIALS_DIR


if TYPE_CHECKING:
    from collections.abc import Awaitable, Callable

    from fastmcp.server.auth.providers.google import GoogleProvider
    from key_value.aio.protocols.key_value import AsyncKeyValue
    from mcp.server.auth.provider import AccessToken, TokenVerifier


# Default scopes match the FastMCP Google integration guide: an OpenID Connect
# login plus the user's email address.
_DEFAULT_SCOPES: tuple[str, ...] = (
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
)
_IDENTITY_CACHE_MAX = 1024
_IDENTITY_CACHE_TTL_SECONDS = 300.0
_IDENTITY_EXPIRY_SKEW_SECONDS = 5.0
_identity_verifiers: weakref.WeakSet[_AuthorizedGoogleTokenVerifier]


class GoogleOAuthConfigError(RuntimeError):
    """Raised when Google OAuth env vars are present but invalid or incomplete.

    ``server.py`` catches this at import time and converts it to a fatal startup
    error (``sys.exit(1)``), mirroring the other fail-closed config guards.
    """


def _split_list(raw: str | None) -> list[str]:
    """Split comma/space-separated env values, dropping blanks."""
    if not raw or not raw.strip():
        return []
    return [item.strip() for chunk in raw.split(",") for item in chunk.split() if item.strip()]


def _normalize_email_list(raw: str | None) -> set[str]:
    """Return a lower-cased email allowlist from an env string."""
    return {item.lower() for item in _split_list(raw)}


def _normalize_domain_list(raw: str | None) -> set[str]:
    """Return lower-cased allowed domains without leading '@'."""
    return {item.lower().lstrip("@") for item in _split_list(raw)}


def google_oauth_enabled() -> bool:
    """Return True when Google OAuth should replace the bearer-token auth.

    The gate is the presence of BOTH the client id and secret. Empty strings are
    normalised to ``None`` upstream (see ``Settings._empty_to_none``), so an
    unset plugin option cannot accidentally enable OAuth.
    """
    return bool(
        (_settings.UNRAID_MCP_GOOGLE_CLIENT_ID or "").strip()
        and (_settings.UNRAID_MCP_GOOGLE_CLIENT_SECRET or "").strip()
    )


def _google_oauth_partially_configured() -> bool:
    """Return True when one OAuth enablement var is present without the other."""
    client_id = (_settings.UNRAID_MCP_GOOGLE_CLIENT_ID or "").strip()
    client_secret = (_settings.UNRAID_MCP_GOOGLE_CLIENT_SECRET or "").strip()
    return bool(client_id or client_secret) and not bool(client_id and client_secret)


def _parse_scopes(raw: str | None) -> list[str]:
    """Split a comma/space-separated scope string, falling back to the defaults."""
    if not raw or not raw.strip():
        return list(_DEFAULT_SCOPES)
    parts = [scope.strip() for chunk in raw.split(",") for scope in chunk.split() if scope.strip()]
    return parts or list(_DEFAULT_SCOPES)


def _is_loopback_hostname(hostname: str | None) -> bool:
    if hostname is None:
        return False
    host = hostname.strip("[]").lower()
    if host == "localhost":
        return True
    with contextlib.suppress(ValueError):
        return ipaddress.ip_address(host).is_loopback
    return False


def _validate_base_url(base_url: str) -> None:
    """Require HTTPS for OAuth except loopback HTTP development URLs."""
    parsed = urlparse(base_url)
    if parsed.scheme == "https" and parsed.netloc:
        return
    if parsed.scheme == "http" and parsed.netloc and _is_loopback_hostname(parsed.hostname):
        return
    raise GoogleOAuthConfigError(
        "UNRAID_MCP_GOOGLE_BASE_URL must be an https:// URL. "
        "http:// is allowed only for localhost/loopback development."
    )


def _validate_redirect_path(path: str | None) -> None:
    """Validate Google redirect path when configured."""
    if path is None:
        return
    parsed = urlparse(path)
    if (
        parsed.scheme
        or parsed.netloc
        or parsed.query
        or parsed.fragment
        or not path.startswith("/")
    ):
        raise GoogleOAuthConfigError(
            "UNRAID_MCP_GOOGLE_REDIRECT_PATH must be an absolute path such as "
            "/auth/callback (no scheme, host, query, or fragment)."
        )


def _google_bool(value: object) -> bool:
    """Google tokeninfo may return bools or string booleans."""
    if isinstance(value, bool):
        return value
    return str(value).lower() in {"true", "1", "yes"}


def _email_authorized(email: str, allowed_emails: set[str], allowed_domains: set[str]) -> bool:
    """Return True when a verified Google email is locally authorized."""
    email_l = email.lower()
    domain = email_l.rsplit("@", 1)[-1] if "@" in email_l else ""
    return email_l in allowed_emails or domain in allowed_domains


class _AuthorizedGoogleTokenVerifier:
    """Wrap Google token verification with local email/domain authorization."""

    def __init__(
        self,
        wrapped: TokenVerifier,
        *,
        allowed_emails: set[str],
        allowed_domains: set[str],
        allow_any_user: bool,
        timeout_seconds: int = 10,
        cache_max_entries: int = _IDENTITY_CACHE_MAX,
    ) -> None:
        self._wrapped = wrapped
        self._allowed_emails = allowed_emails
        self._allowed_domains = allowed_domains
        self._allow_any_user = allow_any_user
        self._timeout_seconds = timeout_seconds
        self._cache_max_entries = cache_max_entries
        self._identity_cache: OrderedDict[str, tuple[float, dict[str, object]]] = OrderedDict()
        self._identity_inflight: dict[str, asyncio.Task[dict[str, object]]] = {}
        self._cache_lock = asyncio.Lock()
        self._client = httpx.AsyncClient(timeout=timeout_seconds)

    async def verify_token(self, token: str) -> AccessToken | None:
        access_token = await self._wrapped.verify_token(token)
        if access_token is None:
            return None
        if self._allow_any_user:
            return access_token

        user = await self._get_google_identity(token, access_token.expires_at)
        email = str(user.get("email") or "").strip().lower()
        if not email or not _google_bool(user.get("email_verified")):
            logger.warning("Google OAuth rejected token without a verified email")
            return None
        if not _email_authorized(email, self._allowed_emails, self._allowed_domains):
            logger.warning("Google OAuth rejected unauthorized email %s", email)
            return None
        return access_token

    async def _get_google_identity(
        self, token: str, access_token_expires_at: int | None
    ) -> dict[str, object]:
        """Return a coalesced, bounded identity lookup cached no longer than the token."""
        now = time.time()
        async with self._cache_lock:
            cached = self._identity_cache.get(token)
            if cached is not None and cached[0] > now:
                self._identity_cache.move_to_end(token)
                return dict(cached[1])
            self._identity_cache.pop(token, None)
            task = self._identity_inflight.get(token)
            if task is None:
                task = asyncio.create_task(self._fetch_google_identity(token))
                self._identity_inflight[token] = task

        try:
            identity = await task
        finally:
            async with self._cache_lock:
                if self._identity_inflight.get(token) is task:
                    self._identity_inflight.pop(token, None)

        expiry = now + _IDENTITY_CACHE_TTL_SECONDS
        if access_token_expires_at is not None:
            expiry = min(expiry, float(access_token_expires_at) - _IDENTITY_EXPIRY_SKEW_SECONDS)
        cacheable = bool(str(identity.get("email") or "").strip()) and _google_bool(
            identity.get("email_verified")
        )
        if cacheable and expiry > time.time():
            async with self._cache_lock:
                self._identity_cache[token] = (expiry, dict(identity))
                self._identity_cache.move_to_end(token)
                while len(self._identity_cache) > self._cache_max_entries:
                    self._identity_cache.popitem(last=False)
        return identity

    async def _fetch_google_identity(self, token: str) -> dict[str, object]:
        """Fetch token identity data used for local authorization."""
        response = await self._client.get(
            "https://oauth2.googleapis.com/tokeninfo",
            params={"access_token": token},
            headers={"User-Agent": "UnraidMCP-Google-OAuth"},
        )
        if response.status_code == 200:
            return dict(response.json())

        logger.debug("Google tokeninfo authorization lookup failed: %s", response.status_code)
        userinfo = await self._client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={
                "Authorization": f"Bearer {token}",
                "User-Agent": "UnraidMCP-Google-OAuth",
            },
        )
        if userinfo.status_code == 200:
            data = dict(userinfo.json())
            if "verified_email" in data and "email_verified" not in data:
                data["email_verified"] = data["verified_email"]
            return data
        return {}

    async def aclose(self) -> None:
        await self._client.aclose()


class _StaticBearerFallbackVerifier:
    """Accept the pre-shared bearer token alongside Google OAuth tokens.

    Installed over ``OAuthProxy.load_access_token`` — the single request-time
    verification entry point (``verify_token`` delegates to it). That layer
    first checks the FastMCP-issued JWT signature, which a static token can
    never pass, so the fallback must sit ABOVE it: the static token is compared
    in constant time and, on match, mapped to a synthetic principal without any
    network round-trip. Everything else delegates to the captured original
    (JWT check → upstream Google validation → email/domain allowlist). This
    only exists when UNRAID_MCP_BEARER_TOKEN is explicitly configured next to
    Google OAuth — the operator's opt-in to running both auth modes at once.
    """

    def __init__(
        self,
        wrapped_verify: Callable[[str], Awaitable[AccessToken | None]],
        *,
        static_token: str,
        scopes: list[str],
    ) -> None:
        self._wrapped_verify = wrapped_verify
        self._static_token = static_token.encode()
        self._scopes = list(scopes)

    async def verify_token(self, token: str) -> AccessToken | None:
        if hmac.compare_digest(token.encode(), self._static_token):
            from mcp.server.auth.provider import AccessToken

            return AccessToken(
                token=token,
                client_id="static-bearer-token",
                scopes=self._scopes,
                expires_at=None,
            )
        return await self._wrapped_verify(token)


_identity_verifiers = weakref.WeakSet()


async def close_google_auth_clients() -> None:
    """Close pooled Google identity clients during application shutdown."""
    await asyncio.gather(*(verifier.aclose() for verifier in list(_identity_verifiers)))


def _install_authorized_token_verifier(
    provider: GoogleProvider, verifier: _AuthorizedGoogleTokenVerifier
) -> None:
    """Isolate FastMCP's verified private hook and fail closed on incompatibility."""
    current = getattr(provider, "_token_validator", None)
    if current is None or not callable(getattr(current, "verify_token", None)):
        raise GoogleOAuthConfigError(
            "Installed FastMCP is incompatible with Google identity authorization: "
            "GoogleProvider._token_validator is unavailable. Refusing to start without "
            "the configured email/domain allowlist."
        )
    try:
        setattr(provider, "_token_validator", verifier)  # noqa: B010 - compatibility adapter
    except (AttributeError, TypeError) as exc:
        raise GoogleOAuthConfigError(
            "Installed FastMCP rejected the Google identity authorization adapter. "
            "Refusing to start without the configured email/domain allowlist."
        ) from exc
    _identity_verifiers.add(verifier)


def _storage_dir() -> Path:
    """Resolve the directory used for persisted encrypted OAuth tokens."""
    configured = (_settings.UNRAID_MCP_GOOGLE_STORAGE_DIR or "").strip()
    if configured:
        return Path(configured).expanduser()
    return CREDENTIALS_DIR / "oauth-tokens"


def _build_encrypted_storage(encryption_key: str) -> AsyncKeyValue:
    """Build a disk-backed, Fernet-encrypted key-value store for OAuth tokens.

    Uses ``FileTreeStore`` (no external services — plain files on disk) wrapped in
    ``FernetEncryptionWrapper`` so token values are encrypted at rest. The storage
    directory is created with ``0o700`` permissions since it holds sensitive
    material even after encryption.
    """
    # Imported lazily so the module (and the whole server) loads fine when the
    # optional persistence path is unused.
    from cryptography.fernet import Fernet
    from key_value.aio.stores.filetree import (
        FileTreeStore,
        FileTreeV1CollectionSanitizationStrategy,
        FileTreeV1KeySanitizationStrategy,
    )
    from key_value.aio.wrappers.encryption import FernetEncryptionWrapper

    try:
        fernet = Fernet(encryption_key.encode())
    except (ValueError, TypeError) as exc:
        raise GoogleOAuthConfigError(
            "UNRAID_MCP_GOOGLE_ENCRYPTION_KEY is not a valid Fernet key. Generate one with:\n"
            '  python -c "from cryptography.fernet import Fernet; '
            'print(Fernet.generate_key().decode())"'
        ) from exc

    storage_dir = _storage_dir()
    storage_dir.mkdir(parents=True, exist_ok=True)
    try:
        storage_dir.chmod(0o700)
    except OSError:
        logger.debug("Could not chmod %s (volume mount?) — skipping", storage_dir)

    store = FileTreeStore(
        data_directory=storage_dir,
        key_sanitization_strategy=FileTreeV1KeySanitizationStrategy(storage_dir),
        collection_sanitization_strategy=FileTreeV1CollectionSanitizationStrategy(storage_dir),
    )
    return FernetEncryptionWrapper(
        key_value=store,
        fernet=fernet,
        raise_on_decryption_error=False,
    )


def build_google_provider() -> GoogleProvider | None:
    """Construct the Google OAuth provider from the environment, or ``None``.

    Returns ``None`` when Google OAuth is not enabled (the default), leaving the
    bearer-token path untouched. When enabled, raises :class:`GoogleOAuthConfigError`
    on any misconfiguration (missing base URL, partial persistence config, or an
    invalid Fernet key) so startup fails closed with an actionable message.
    """
    if not google_oauth_enabled():
        if _google_oauth_partially_configured():
            missing = []
            if not (_settings.UNRAID_MCP_GOOGLE_CLIENT_ID or "").strip():
                missing.append("UNRAID_MCP_GOOGLE_CLIENT_ID")
            if not (_settings.UNRAID_MCP_GOOGLE_CLIENT_SECRET or "").strip():
                missing.append("UNRAID_MCP_GOOGLE_CLIENT_SECRET")
            raise GoogleOAuthConfigError(
                "Google OAuth is partially configured. Set both "
                "UNRAID_MCP_GOOGLE_CLIENT_ID and UNRAID_MCP_GOOGLE_CLIENT_SECRET, "
                f"or unset all Google OAuth variables. Missing: {', '.join(missing)}."
            )
        return None
    if _settings.UNRAID_MCP_DISABLE_HTTP_AUTH:
        raise GoogleOAuthConfigError(
            "UNRAID_MCP_DISABLE_HTTP_AUTH=true conflicts with Google OAuth. "
            "Unset the Google OAuth variables for gateway-owned auth, or leave "
            "UNRAID_MCP_DISABLE_HTTP_AUTH=false and let OAuth protect the endpoint."
        )

    from fastmcp.server.auth.providers.google import GoogleProvider

    client_id = (_settings.UNRAID_MCP_GOOGLE_CLIENT_ID or "").strip()
    client_secret = (_settings.UNRAID_MCP_GOOGLE_CLIENT_SECRET or "").strip()

    base_url = (_settings.UNRAID_MCP_GOOGLE_BASE_URL or "").strip()
    if not base_url:
        raise GoogleOAuthConfigError(
            "Google OAuth is enabled (UNRAID_MCP_GOOGLE_CLIENT_ID/SECRET are set) but "
            "UNRAID_MCP_GOOGLE_BASE_URL is not. Set it to this server's public base URL "
            "(e.g. https://unraid-mcp.example.com) — it must match the Authorized redirect "
            "URI configured for the OAuth client in Google Cloud."
        )
    _validate_base_url(base_url)

    scopes = _parse_scopes(_settings.UNRAID_MCP_GOOGLE_REQUIRED_SCOPES)
    redirect_path = (_settings.UNRAID_MCP_GOOGLE_REDIRECT_PATH or "").strip() or None
    _validate_redirect_path(redirect_path)

    allowed_emails = _normalize_email_list(_settings.UNRAID_MCP_GOOGLE_ALLOWED_EMAILS)
    allowed_domains = _normalize_domain_list(_settings.UNRAID_MCP_GOOGLE_ALLOWED_DOMAINS)
    allow_any_user = bool(_settings.UNRAID_MCP_GOOGLE_ALLOW_ANY_USER)
    if not allow_any_user and not (allowed_emails or allowed_domains):
        raise GoogleOAuthConfigError(
            "Google OAuth is enabled but no local identity allowlist is configured. "
            "Set UNRAID_MCP_GOOGLE_ALLOWED_EMAILS and/or "
            "UNRAID_MCP_GOOGLE_ALLOWED_DOMAINS, or explicitly set "
            "UNRAID_MCP_GOOGLE_ALLOW_ANY_USER=true for a trusted/private deployment."
        )

    jwt_signing_key = _settings.UNRAID_MCP_GOOGLE_JWT_SIGNING_KEY
    encryption_key = _settings.UNRAID_MCP_GOOGLE_ENCRYPTION_KEY
    from key_value.aio.stores.memory import MemoryStore

    client_storage: AsyncKeyValue = MemoryStore()
    persistence_label = "in-memory"
    if jwt_signing_key or encryption_key:
        if not (jwt_signing_key and encryption_key):
            raise GoogleOAuthConfigError(
                "Encrypted token persistence requires BOTH "
                "UNRAID_MCP_GOOGLE_JWT_SIGNING_KEY and UNRAID_MCP_GOOGLE_ENCRYPTION_KEY. "
                "Set both to persist tokens across restarts, or neither to keep them in "
                "memory (cleared on restart)."
            )
        client_storage = _build_encrypted_storage(encryption_key)
        persistence_label = "encrypted-filetree"

    # Pass every optional argument explicitly. ``redirect_path=None`` selects the
    # provider's default ("/auth/callback"); ``client_storage``/``jwt_signing_key``
    # are both None unless encrypted persistence was configured above (enforced
    # both-or-neither), so passing them directly is safe.
    provider = GoogleProvider(
        client_id=client_id,
        client_secret=client_secret,
        base_url=base_url,
        required_scopes=scopes,
        redirect_path=redirect_path,
        client_storage=client_storage,
        jwt_signing_key=jwt_signing_key,
        # GoogleProvider already forces Google's own consent screen
        # (prompt=consent). Avoid FastMCP's local consent interstitial because
        # repeated browser GETs can rotate its CSRF token before form submit.
        require_authorization_consent="external",
    )
    verifier = _AuthorizedGoogleTokenVerifier(
        provider._token_validator,
        allowed_emails=allowed_emails,
        allowed_domains=allowed_domains,
        allow_any_user=allow_any_user,
    )
    _install_authorized_token_verifier(provider, verifier)

    # Coexistence opt-in: a configured static bearer token stays valid next to
    # OAuth. Request auth flows through OAuthProxy.load_access_token (which
    # verifies the FastMCP-issued JWT first — a static token can never pass
    # it), so the fallback shadows that bound method on the instance and
    # delegates non-matching tokens to the captured original. It is
    # intentionally NOT added to _identity_verifiers — it owns no HTTP client.
    static_token = (_settings.UNRAID_MCP_BEARER_TOKEN or "").strip()
    if static_token:
        original_load = provider.load_access_token
        if not callable(original_load):  # pragma: no cover - fail closed
            raise GoogleOAuthConfigError(
                "Installed FastMCP is incompatible with static-bearer coexistence: "
                "OAuthProxy.load_access_token is unavailable."
            )
        fallback = _StaticBearerFallbackVerifier(
            original_load,
            static_token=static_token,
            scopes=scopes,
        )
        setattr(provider, "load_access_token", fallback.verify_token)  # noqa: B010 - compatibility adapter

    logger.info(
        "Google OAuth enabled (base_url=%s, scopes=%s, redirect_path=%s, persistence=%s, authz=%s, static_bearer=%s)",
        base_url,
        ",".join(scopes),
        redirect_path or "/auth/callback",
        persistence_label,
        "allow-any-user" if allow_any_user else "email/domain allowlist",
        "also-accepted" if static_token else "disabled",
    )
    return provider
