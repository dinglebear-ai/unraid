"""Tests for the optional Google OAuth authentication path.

Covers:
  - google_oauth_enabled() gating on client id + secret
  - build_google_provider() returns None when disabled (default deployment)
  - scope parsing (default + custom comma/space separated)
  - fail-closed config errors: missing base_url, partial persistence config,
    invalid Fernet key
  - in-memory vs encrypted-on-disk (FileTreeStore) provider construction
  - run_server() omits the bearer/well-known ASGI middleware when OAuth is active
"""

from __future__ import annotations

import contextlib
import importlib
import time
from typing import ClassVar
from unittest.mock import AsyncMock, patch

import pytest
from mcp.server.auth.provider import AccessToken, AuthorizationParams
from mcp.shared.auth import OAuthClientInformationFull

import unraid_mcp.config.settings as s
from unraid_mcp.core.google_auth import (
    GoogleOAuthConfigError,
    _AuthorizedGoogleTokenVerifier,
    _parse_scopes,
    _StaticBearerFallbackVerifier,
    build_google_provider,
    google_oauth_enabled,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_GOOGLE_ATTRS = (
    "UNRAID_MCP_GOOGLE_CLIENT_ID",
    "UNRAID_MCP_GOOGLE_CLIENT_SECRET",
    "UNRAID_MCP_GOOGLE_BASE_URL",
    "UNRAID_MCP_GOOGLE_REQUIRED_SCOPES",
    "UNRAID_MCP_GOOGLE_ALLOWED_EMAILS",
    "UNRAID_MCP_GOOGLE_ALLOWED_DOMAINS",
    "UNRAID_MCP_GOOGLE_ALLOW_ANY_USER",
    "UNRAID_MCP_GOOGLE_REDIRECT_PATH",
    "UNRAID_MCP_GOOGLE_JWT_SIGNING_KEY",
    "UNRAID_MCP_GOOGLE_ENCRYPTION_KEY",
    "UNRAID_MCP_GOOGLE_STORAGE_DIR",
)


@contextlib.contextmanager
def _google_settings(**overrides):
    """Temporarily set UNRAID_MCP_GOOGLE_* settings globals, restoring after."""
    originals = {name: getattr(s, name) for name in _GOOGLE_ATTRS}
    try:
        # Clear all first so each test starts from a known (disabled) baseline.
        for name in _GOOGLE_ATTRS:
            setattr(s, name, None)
        for name, value in overrides.items():
            setattr(s, name, value)
        yield
    finally:
        for name, value in originals.items():
            setattr(s, name, value)


def _fernet_key() -> str:
    from cryptography.fernet import Fernet

    return Fernet.generate_key().decode()


# ---------------------------------------------------------------------------
# Enable gate
# ---------------------------------------------------------------------------


class TestEnableGate:
    def test_disabled_by_default(self):
        with _google_settings():
            assert google_oauth_enabled() is False
            assert build_google_provider() is None

    def test_disabled_with_only_client_id(self):
        with (
            _google_settings(UNRAID_MCP_GOOGLE_CLIENT_ID="x.apps.googleusercontent.com"),
            pytest.raises(GoogleOAuthConfigError, match="partially configured"),
        ):
            assert google_oauth_enabled() is False
            build_google_provider()

    def test_disabled_with_only_secret(self):
        with (
            _google_settings(UNRAID_MCP_GOOGLE_CLIENT_SECRET="GOCSPX-secret"),
            pytest.raises(GoogleOAuthConfigError, match="partially configured"),
        ):
            assert google_oauth_enabled() is False
            build_google_provider()

    def test_empty_strings_do_not_enable(self):
        with _google_settings(
            UNRAID_MCP_GOOGLE_CLIENT_ID="   ",
            UNRAID_MCP_GOOGLE_CLIENT_SECRET="",
        ):
            assert google_oauth_enabled() is False

    def test_enabled_with_both(self):
        with _google_settings(
            UNRAID_MCP_GOOGLE_CLIENT_ID="x.apps.googleusercontent.com",
            UNRAID_MCP_GOOGLE_CLIENT_SECRET="GOCSPX-secret",
        ):
            assert google_oauth_enabled() is True


# ---------------------------------------------------------------------------
# Scope parsing
# ---------------------------------------------------------------------------


class TestScopeParsing:
    def test_default_scopes_when_unset(self):
        assert _parse_scopes(None) == [
            "openid",
            "https://www.googleapis.com/auth/userinfo.email",
        ]

    def test_default_scopes_when_blank(self):
        assert _parse_scopes("   ") == [
            "openid",
            "https://www.googleapis.com/auth/userinfo.email",
        ]

    def test_comma_separated(self):
        assert _parse_scopes("openid, email, profile") == ["openid", "email", "profile"]

    def test_space_separated(self):
        assert _parse_scopes("openid email profile") == ["openid", "email", "profile"]

    def test_mixed_separators_and_extra_whitespace(self):
        assert _parse_scopes(" openid ,email  profile ") == ["openid", "email", "profile"]


# ---------------------------------------------------------------------------
# Config errors (fail closed)
# ---------------------------------------------------------------------------


class TestConfigErrors:
    def test_missing_base_url_raises(self):
        with (
            _google_settings(
                UNRAID_MCP_GOOGLE_CLIENT_ID="x.apps.googleusercontent.com",
                UNRAID_MCP_GOOGLE_CLIENT_SECRET="GOCSPX-secret",
            ),
            pytest.raises(GoogleOAuthConfigError, match="UNRAID_MCP_GOOGLE_BASE_URL"),
        ):
            build_google_provider()

    def test_oauth_requires_identity_allowlist(self):
        with (
            _google_settings(
                UNRAID_MCP_GOOGLE_CLIENT_ID="x.apps.googleusercontent.com",
                UNRAID_MCP_GOOGLE_CLIENT_SECRET="GOCSPX-secret",
                UNRAID_MCP_GOOGLE_BASE_URL="https://mcp.example.com",
            ),
            pytest.raises(GoogleOAuthConfigError, match="identity allowlist"),
        ):
            build_google_provider()

    def test_allow_any_user_must_be_explicit(self):
        with _google_settings(
            UNRAID_MCP_GOOGLE_CLIENT_ID="x.apps.googleusercontent.com",
            UNRAID_MCP_GOOGLE_CLIENT_SECRET="GOCSPX-secret",
            UNRAID_MCP_GOOGLE_BASE_URL="https://mcp.example.com",
            UNRAID_MCP_GOOGLE_ALLOW_ANY_USER=True,
        ):
            assert build_google_provider() is not None

    def test_disable_http_auth_conflicts_with_oauth(self):
        original = s.UNRAID_MCP_DISABLE_HTTP_AUTH
        try:
            s.UNRAID_MCP_DISABLE_HTTP_AUTH = True
            with (
                _google_settings(
                    UNRAID_MCP_GOOGLE_CLIENT_ID="x.apps.googleusercontent.com",
                    UNRAID_MCP_GOOGLE_CLIENT_SECRET="GOCSPX-secret",
                    UNRAID_MCP_GOOGLE_BASE_URL="https://mcp.example.com",
                    UNRAID_MCP_GOOGLE_ALLOWED_EMAILS="owner@example.com",
                ),
                pytest.raises(GoogleOAuthConfigError, match="DISABLE_HTTP_AUTH"),
            ):
                build_google_provider()
        finally:
            s.UNRAID_MCP_DISABLE_HTTP_AUTH = original

    @pytest.mark.parametrize("base_url", ["http://mcp.example.com", "not-a-url"])
    def test_non_https_base_url_rejected(self, base_url: str):
        with (
            _google_settings(
                UNRAID_MCP_GOOGLE_CLIENT_ID="x.apps.googleusercontent.com",
                UNRAID_MCP_GOOGLE_CLIENT_SECRET="GOCSPX-secret",
                UNRAID_MCP_GOOGLE_BASE_URL=base_url,
                UNRAID_MCP_GOOGLE_ALLOWED_EMAILS="owner@example.com",
            ),
            pytest.raises(GoogleOAuthConfigError, match="https://"),
        ):
            build_google_provider()

    def test_loopback_http_base_url_allowed_for_dev(self):
        with _google_settings(
            UNRAID_MCP_GOOGLE_CLIENT_ID="x.apps.googleusercontent.com",
            UNRAID_MCP_GOOGLE_CLIENT_SECRET="GOCSPX-secret",
            UNRAID_MCP_GOOGLE_BASE_URL="http://127.0.0.1:6970",
            UNRAID_MCP_GOOGLE_ALLOWED_EMAILS="owner@example.com",
        ):
            assert build_google_provider() is not None

    @pytest.mark.parametrize(
        "redirect_path", ["https://evil.example/cb", "auth/callback", "/cb?x=1"]
    )
    def test_invalid_redirect_path_rejected(self, redirect_path: str):
        with (
            _google_settings(
                UNRAID_MCP_GOOGLE_CLIENT_ID="x.apps.googleusercontent.com",
                UNRAID_MCP_GOOGLE_CLIENT_SECRET="GOCSPX-secret",
                UNRAID_MCP_GOOGLE_BASE_URL="https://mcp.example.com",
                UNRAID_MCP_GOOGLE_ALLOWED_EMAILS="owner@example.com",
                UNRAID_MCP_GOOGLE_REDIRECT_PATH=redirect_path,
            ),
            pytest.raises(GoogleOAuthConfigError, match="REDIRECT_PATH"),
        ):
            build_google_provider()

    def test_only_jwt_key_raises(self):
        with (
            _google_settings(
                UNRAID_MCP_GOOGLE_CLIENT_ID="x.apps.googleusercontent.com",
                UNRAID_MCP_GOOGLE_CLIENT_SECRET="GOCSPX-secret",
                UNRAID_MCP_GOOGLE_BASE_URL="https://mcp.example.com",
                UNRAID_MCP_GOOGLE_ALLOWED_EMAILS="owner@example.com",
                UNRAID_MCP_GOOGLE_JWT_SIGNING_KEY="jwt-key",
            ),
            pytest.raises(GoogleOAuthConfigError, match="requires BOTH"),
        ):
            build_google_provider()

    def test_only_encryption_key_raises(self):
        with (
            _google_settings(
                UNRAID_MCP_GOOGLE_CLIENT_ID="x.apps.googleusercontent.com",
                UNRAID_MCP_GOOGLE_CLIENT_SECRET="GOCSPX-secret",
                UNRAID_MCP_GOOGLE_BASE_URL="https://mcp.example.com",
                UNRAID_MCP_GOOGLE_ALLOWED_EMAILS="owner@example.com",
                UNRAID_MCP_GOOGLE_ENCRYPTION_KEY=_fernet_key(),
            ),
            pytest.raises(GoogleOAuthConfigError, match="requires BOTH"),
        ):
            build_google_provider()

    def test_invalid_fernet_key_raises(self, tmp_path):
        with (
            _google_settings(
                UNRAID_MCP_GOOGLE_CLIENT_ID="x.apps.googleusercontent.com",
                UNRAID_MCP_GOOGLE_CLIENT_SECRET="GOCSPX-secret",
                UNRAID_MCP_GOOGLE_BASE_URL="https://mcp.example.com",
                UNRAID_MCP_GOOGLE_ALLOWED_EMAILS="owner@example.com",
                UNRAID_MCP_GOOGLE_JWT_SIGNING_KEY="jwt-key",
                UNRAID_MCP_GOOGLE_ENCRYPTION_KEY="not-a-valid-fernet-key",
                UNRAID_MCP_GOOGLE_STORAGE_DIR=str(tmp_path / "tokens"),
            ),
            pytest.raises(GoogleOAuthConfigError, match="not a valid Fernet key"),
        ):
            build_google_provider()


# ---------------------------------------------------------------------------
# Provider construction
# ---------------------------------------------------------------------------


class TestProviderConstruction:
    def test_in_memory_provider(self):
        with _google_settings(
            UNRAID_MCP_GOOGLE_CLIENT_ID="x.apps.googleusercontent.com",
            UNRAID_MCP_GOOGLE_CLIENT_SECRET="GOCSPX-secret",
            UNRAID_MCP_GOOGLE_BASE_URL="https://mcp.example.com",
            UNRAID_MCP_GOOGLE_ALLOWED_EMAILS="owner@example.com",
        ):
            provider = build_google_provider()
        assert provider is not None
        assert type(provider).__name__ == "GoogleProvider"
        from key_value.aio.stores.memory import MemoryStore

        assert isinstance(provider._client_storage, MemoryStore)

    def test_custom_scopes_and_redirect_path(self):
        with _google_settings(
            UNRAID_MCP_GOOGLE_CLIENT_ID="x.apps.googleusercontent.com",
            UNRAID_MCP_GOOGLE_CLIENT_SECRET="GOCSPX-secret",
            UNRAID_MCP_GOOGLE_BASE_URL="https://mcp.example.com",
            UNRAID_MCP_GOOGLE_ALLOWED_DOMAINS="example.com",
            UNRAID_MCP_GOOGLE_REQUIRED_SCOPES="openid profile",
            UNRAID_MCP_GOOGLE_REDIRECT_PATH="/auth/google/callback",
        ):
            provider = build_google_provider()
        assert provider is not None

    def test_encrypted_persistence_creates_storage_dir(self, tmp_path):
        storage = tmp_path / "oauth-tokens"
        with _google_settings(
            UNRAID_MCP_GOOGLE_CLIENT_ID="x.apps.googleusercontent.com",
            UNRAID_MCP_GOOGLE_CLIENT_SECRET="GOCSPX-secret",
            UNRAID_MCP_GOOGLE_BASE_URL="https://mcp.example.com",
            UNRAID_MCP_GOOGLE_ALLOWED_EMAILS="owner@example.com",
            UNRAID_MCP_GOOGLE_JWT_SIGNING_KEY="jwt-signing-key",
            UNRAID_MCP_GOOGLE_ENCRYPTION_KEY=_fernet_key(),
            UNRAID_MCP_GOOGLE_STORAGE_DIR=str(storage),
        ):
            provider = build_google_provider()
        assert provider is not None
        assert storage.is_dir()
        from key_value.aio.wrappers.encryption import FernetEncryptionWrapper

        assert isinstance(provider._client_storage, FernetEncryptionWrapper)

    async def test_authorization_delegates_consent_to_google(self):
        with _google_settings(
            UNRAID_MCP_GOOGLE_CLIENT_ID="x.apps.googleusercontent.com",
            UNRAID_MCP_GOOGLE_CLIENT_SECRET="GOCSPX-secret",
            UNRAID_MCP_GOOGLE_BASE_URL="https://mcp.example.com",
            UNRAID_MCP_GOOGLE_ALLOWED_EMAILS="owner@example.com",
        ):
            provider = build_google_provider()

        assert provider is not None
        client = OAuthClientInformationFull(
            client_id="debug-client",
            redirect_uris=["http://127.0.0.1:12345/callback"],
            token_endpoint_auth_method="none",
        )
        authorize_url = await provider.authorize(
            client,
            AuthorizationParams(
                state="state",
                scopes=["openid", "https://www.googleapis.com/auth/userinfo.email"],
                code_challenge="A" * 43,
                redirect_uri="http://127.0.0.1:12345/callback",
                redirect_uri_provided_explicitly=True,
            ),
        )

        assert authorize_url.startswith("https://accounts.google.com/")
        assert "mcp.example.com/consent" not in authorize_url
        assert "prompt=consent" in authorize_url


class TestAuthorizedGoogleTokenVerifier:
    async def _verify_with_user(self, user: dict, *, emails=None, domains=None, allow_any=False):
        wrapped = AsyncMock()
        wrapped.verify_token.return_value = AccessToken(token="tok", client_id="sub", scopes=[])
        verifier = _AuthorizedGoogleTokenVerifier(
            wrapped,
            allowed_emails=set(emails or []),
            allowed_domains=set(domains or []),
            allow_any_user=allow_any,
        )
        verifier._fetch_google_identity = AsyncMock(return_value=user)
        return await verifier.verify_token("tok")

    async def test_allows_verified_email(self):
        result = await self._verify_with_user(
            {"email": "Owner@Example.com", "email_verified": "true"},
            emails={"owner@example.com"},
        )
        assert result is not None

    async def test_allows_verified_domain(self):
        result = await self._verify_with_user(
            {"email": "admin@example.com", "email_verified": True},
            domains={"example.com"},
        )
        assert result is not None

    async def test_rejects_unverified_email(self):
        result = await self._verify_with_user(
            {"email": "owner@example.com", "email_verified": "false"},
            emails={"owner@example.com"},
        )
        assert result is None

    async def test_rejects_unauthorized_email(self):
        result = await self._verify_with_user(
            {"email": "stranger@example.net", "email_verified": True},
            emails={"owner@example.com"},
        )
        assert result is None

    async def test_identity_lookup_is_cached_until_token_expiry(self):
        wrapped = AsyncMock()
        wrapped.verify_token.return_value = AccessToken(
            token="tok", client_id="sub", scopes=[], expires_at=int(time.time()) + 300
        )
        verifier = _AuthorizedGoogleTokenVerifier(
            wrapped,
            allowed_emails={"owner@example.com"},
            allowed_domains=set(),
            allow_any_user=False,
        )
        verifier._fetch_google_identity = AsyncMock(
            return_value={"email": "owner@example.com", "email_verified": True}
        )
        assert await verifier.verify_token("tok") is not None
        assert await verifier.verify_token("tok") is not None
        verifier._fetch_google_identity.assert_awaited_once()

    async def test_failed_identity_lookup_is_not_cached(self):
        wrapped = AsyncMock()
        wrapped.verify_token.return_value = AccessToken(
            token="tok", client_id="sub", scopes=[], expires_at=int(time.time()) + 300
        )
        verifier = _AuthorizedGoogleTokenVerifier(
            wrapped,
            allowed_emails={"owner@example.com"},
            allowed_domains=set(),
            allow_any_user=False,
        )
        verifier._fetch_google_identity = AsyncMock(
            side_effect=[{}, {"email": "owner@example.com", "email_verified": True}]
        )

        assert await verifier.verify_token("tok") is None
        assert await verifier.verify_token("tok") is not None
        assert verifier._fetch_google_identity.await_count == 2

    async def test_concurrent_identity_lookups_are_coalesced(self):
        import asyncio

        wrapped = AsyncMock()
        wrapped.verify_token.return_value = AccessToken(
            token="tok", client_id="sub", scopes=[], expires_at=int(time.time()) + 300
        )
        verifier = _AuthorizedGoogleTokenVerifier(
            wrapped,
            allowed_emails={"owner@example.com"},
            allowed_domains=set(),
            allow_any_user=False,
        )
        verifier._fetch_google_identity = AsyncMock(
            return_value={"email": "owner@example.com", "email_verified": True}
        )
        results = await asyncio.gather(*(verifier.verify_token("tok") for _ in range(20)))
        assert all(result is not None for result in results)
        verifier._fetch_google_identity.assert_awaited_once()


# ---------------------------------------------------------------------------
# run_server() middleware selection
# ---------------------------------------------------------------------------


class TestRunServerMiddlewareSelection:
    def _capture_middleware(self, google_provider):
        """Run run_server() in HTTP mode and return the middleware list passed to mcp.run."""
        import unraid_mcp.server as server

        captured: dict = {}

        def fake_run(*args, **kwargs):
            captured["middleware"] = kwargs.get("middleware")

        orig_transport = s.UNRAID_MCP_TRANSPORT
        try:
            s.UNRAID_MCP_TRANSPORT = "streamable-http"
            with (
                patch.object(server, "_google_auth_provider", google_provider),
                patch.object(server.mcp, "run", side_effect=fake_run),
                patch.object(server, "ensure_token_exists") as ensure_token,
                patch.object(server, "log_configuration_status"),
                patch.object(s, "UNRAID_MCP_BEARER_TOKEN", "tok"),
            ):
                server.run_server()
                captured["ensure_token_called"] = ensure_token.called
        finally:
            s.UNRAID_MCP_TRANSPORT = orig_transport
        return captured.get("middleware")

    def test_bearer_path_installs_three_middleware(self):
        middleware = self._capture_middleware(google_provider=None)
        assert middleware is not None
        # Health + readiness + WellKnown + Bearer
        assert len(middleware) == 4
        import unraid_mcp.server as server

        assert middleware[0].cls is server.HealthMiddleware
        assert middleware[1].cls is server.ReadinessMiddleware
        assert middleware[2].cls is server.WellKnownMiddleware
        assert middleware[3].cls is server.BearerAuthMiddleware
        assert middleware[3].kwargs["token"] == "tok"
        assert middleware[3].kwargs["disabled"] is False

    def test_oauth_path_installs_only_health(self):
        sentinel = object()  # stand-in for a built GoogleProvider
        middleware = self._capture_middleware(google_provider=sentinel)
        assert middleware is not None
        # Health/readiness only — bearer + well-known are omitted under OAuth.
        assert len(middleware) == 2
        import unraid_mcp.server as server

        assert middleware[0].cls is server.HealthMiddleware
        assert middleware[1].cls is server.ReadinessMiddleware

    def test_oauth_skips_bearer_bootstrap_and_public_bind_guard(self):
        import unraid_mcp.server as server

        captured: dict = {}

        def fake_run(*args, **kwargs):
            captured["middleware"] = kwargs.get("middleware")

        originals = {
            "transport": s.UNRAID_MCP_TRANSPORT,
            "token": s.UNRAID_MCP_BEARER_TOKEN,
            "disable": s.UNRAID_MCP_DISABLE_HTTP_AUTH,
            "host": s.UNRAID_MCP_HOST,
            "trust": s.UNRAID_MCP_TRUST_PROXY,
        }
        try:
            s.UNRAID_MCP_TRANSPORT = "streamable-http"
            s.UNRAID_MCP_BEARER_TOKEN = None
            s.UNRAID_MCP_DISABLE_HTTP_AUTH = True
            s.UNRAID_MCP_HOST = "0.0.0.0"  # noqa: S104 - deliberate public-bind guard test
            s.UNRAID_MCP_TRUST_PROXY = False
            with (
                patch.object(server, "_google_auth_provider", object()),
                patch.object(server.mcp, "run", side_effect=fake_run),
                patch.object(server, "ensure_token_exists") as ensure_token,
                patch.object(server, "log_configuration_status"),
            ):
                server.run_server()
            ensure_token.assert_not_called()
            assert len(captured["middleware"]) == 2
            assert captured["middleware"][0].cls is server.HealthMiddleware
        finally:
            s.UNRAID_MCP_TRANSPORT = originals["transport"]
            s.UNRAID_MCP_BEARER_TOKEN = originals["token"]
            s.UNRAID_MCP_DISABLE_HTTP_AUTH = originals["disable"]
            s.UNRAID_MCP_HOST = originals["host"]
            s.UNRAID_MCP_TRUST_PROXY = originals["trust"]


class TestServerImportWiring:
    def _reload_server(self):
        import unraid_mcp.server as server

        return importlib.reload(server)

    def _restore_server(self, transport: str):
        s.UNRAID_MCP_TRANSPORT = transport
        return self._reload_server()

    def test_fastmcp_auth_wired_at_import_for_http(self):
        original_transport = s.UNRAID_MCP_TRANSPORT
        sentinel = object()
        try:
            s.UNRAID_MCP_TRANSPORT = "streamable-http"
            with patch("unraid_mcp.core.google_auth.build_google_provider", return_value=sentinel):
                server = self._reload_server()
            assert server.mcp.auth is sentinel
        finally:
            self._restore_server(original_transport)

    def test_oauth_misconfig_exits_at_http_import(self, capsys):
        original_transport = s.UNRAID_MCP_TRANSPORT
        try:
            s.UNRAID_MCP_TRANSPORT = "streamable-http"
            with (
                patch(
                    "unraid_mcp.core.google_auth.build_google_provider",
                    side_effect=GoogleOAuthConfigError("bad oauth"),
                ),
                pytest.raises(SystemExit) as excinfo,
            ):
                self._reload_server()
            assert excinfo.value.code == 1
            assert "bad oauth" in capsys.readouterr().err
        finally:
            self._restore_server(original_transport)

    def test_stdio_import_does_not_build_google_provider(self):
        original_transport = s.UNRAID_MCP_TRANSPORT
        try:
            s.UNRAID_MCP_TRANSPORT = "stdio"
            with patch("unraid_mcp.core.google_auth.build_google_provider") as build:
                server = self._reload_server()
            build.assert_not_called()
            assert server.mcp.auth is None
        finally:
            self._restore_server(original_transport)


# ---------------------------------------------------------------------------
# Static bearer coexistence
# ---------------------------------------------------------------------------


class TestStaticBearerCoexistence:
    """A configured UNRAID_MCP_BEARER_TOKEN stays valid alongside Google OAuth."""

    _VALID: ClassVar[dict[str, str]] = {
        "UNRAID_MCP_GOOGLE_CLIENT_ID": "x.apps.googleusercontent.com",
        "UNRAID_MCP_GOOGLE_CLIENT_SECRET": "GOCSPX-secret",
        "UNRAID_MCP_GOOGLE_BASE_URL": "https://mcp.example.com",
        "UNRAID_MCP_GOOGLE_ALLOWED_EMAILS": "me@example.com",
    }

    def test_fallback_installed_when_bearer_token_configured(self):
        with _google_settings(**self._VALID), patch.object(s, "UNRAID_MCP_BEARER_TOKEN", "tok"):
            provider = build_google_provider()
        assert isinstance(
            getattr(provider.load_access_token, "__self__", None), _StaticBearerFallbackVerifier
        )

    def test_no_fallback_without_bearer_token(self):
        with _google_settings(**self._VALID), patch.object(s, "UNRAID_MCP_BEARER_TOKEN", None):
            provider = build_google_provider()
        assert not isinstance(
            getattr(provider.load_access_token, "__self__", None), _StaticBearerFallbackVerifier
        )

    def test_blank_bearer_token_does_not_opt_in(self):
        with _google_settings(**self._VALID), patch.object(s, "UNRAID_MCP_BEARER_TOKEN", "  "):
            provider = build_google_provider()
        assert not isinstance(
            getattr(provider.load_access_token, "__self__", None), _StaticBearerFallbackVerifier
        )

    @pytest.mark.asyncio
    async def test_provider_verify_token_accepts_static_token(self):
        """End-to-end through the provider: verify_token -> load_access_token -> fallback."""
        with _google_settings(**self._VALID), patch.object(s, "UNRAID_MCP_BEARER_TOKEN", "tok"):
            provider = build_google_provider()
        access = await provider.verify_token("tok")
        assert access is not None
        assert access.client_id == "static-bearer-token"

    @pytest.mark.asyncio
    async def test_static_token_accepted_without_google_roundtrip(self):
        wrapped_verify = AsyncMock(return_value=None)
        verifier = _StaticBearerFallbackVerifier(
            wrapped_verify, static_token="static-tok", scopes=["openid"]
        )
        access = await verifier.verify_token("static-tok")
        assert access is not None
        assert access.client_id == "static-bearer-token"
        assert access.scopes == ["openid"]
        assert access.expires_at is None
        wrapped_verify.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_other_tokens_delegate_to_google_verifier(self):
        google_token = AccessToken(
            token="google-tok", client_id="google-client", scopes=["openid"], expires_at=None
        )
        wrapped_verify = AsyncMock(return_value=google_token)
        verifier = _StaticBearerFallbackVerifier(
            wrapped_verify, static_token="static-tok", scopes=["openid"]
        )
        access = await verifier.verify_token("google-tok")
        assert access is google_token
        wrapped_verify.assert_awaited_once_with("google-tok")

    @pytest.mark.asyncio
    async def test_wrong_token_rejected_when_google_rejects(self):
        wrapped_verify = AsyncMock(return_value=None)
        verifier = _StaticBearerFallbackVerifier(
            wrapped_verify, static_token="static-tok", scopes=["openid"]
        )
        assert await verifier.verify_token("wrong") is None
