"""Tests for ASGI-level bearer token authentication middleware.

Covers:
  - Pass-through: non-HTTP scopes, disabled=True
  - 401 missing: no Authorization header
  - 401 invalid: wrong token, non-bearer scheme
  - 200 valid: correct token accepted
  - RFC 6750 headers: WWW-Authenticate values differentiate missing vs invalid
  - Per-IP rate limiting: 60 failures → 429
  - os.environ.pop after ensure_token_exists (token not leaked to subprocesses)
  - Startup guard: sys.exit(1) when HTTP + no token + auth not disabled
  - WellKnownMiddleware: RFC 9728 OAuth Protected Resource Metadata
"""

import asyncio
import os
import time
from collections import OrderedDict
from unittest.mock import patch

import pytest

from unraid_mcp.core.auth import (
    _MAX_IP_TRACKING,
    _RATE_MAX_FAILURES,
    _RATE_WINDOW_SECS,
    BearerAuthMiddleware,
    HealthMiddleware,
    ReadinessMiddleware,
    WellKnownMiddleware,
)


def test_auth_failure_tracker_uses_ordered_bounded_eviction() -> None:
    middleware = BearerAuthMiddleware(lambda *_: None, token="secret")  # type: ignore[arg-type]
    assert isinstance(middleware._ip_failures, OrderedDict)
    for index in range(_MAX_IP_TRACKING + 5):
        middleware._record_failure(f"10.0.{index // 255}.{index % 255}")
    assert len(middleware._ip_failures) == _MAX_IP_TRACKING
    assert "10.0.0.0" not in middleware._ip_failures


# ---------------------------------------------------------------------------
# ASGI test helpers
# ---------------------------------------------------------------------------


def _make_http_scope(
    headers: list[tuple[bytes, bytes]] | None = None, client_ip: str = "127.0.0.1"
) -> dict:
    return {
        "type": "http",
        "method": "POST",
        "path": "/mcp",
        "headers": headers or [],
        "client": (client_ip, 9999),
    }


def _make_ws_scope() -> dict:
    return {"type": "websocket", "path": "/mcp", "headers": [], "client": ("127.0.0.1", 9999)}


def _make_lifespan_scope() -> dict:
    return {"type": "lifespan"}


async def _collect_response(
    middleware: BearerAuthMiddleware, scope: dict
) -> tuple[int, dict[str, str], bytes]:
    """Run middleware and return (status, headers_dict, body)."""
    received: list[dict] = []

    async def receive():
        return {"type": "http.request", "body": b"", "more_body": False}

    async def send(message: dict):
        received.append(message)

    await middleware(scope, receive, send)

    start = next(m for m in received if m["type"] == "http.response.start")
    body_msg = next(m for m in received if m["type"] == "http.response.body")

    headers = {k.decode(): v.decode() for k, v in start["headers"]}
    return start["status"], headers, body_msg["body"]


async def _noop_send(message):
    pass


async def _noop_receive():
    return {"type": "http.request", "body": b"", "more_body": False}


def _app_called_flag():
    """Return an app callable that sets a flag when called."""
    called = {"value": False}

    async def app(scope, receive, send):
        called["value"] = True
        # Send a minimal 200 so the test can detect it was reached
        await send({"type": "http.response.start", "status": 200, "headers": []})
        await send({"type": "http.response.body", "body": b"ok", "more_body": False})

    return app, called


# ---------------------------------------------------------------------------
# Pass-through cases
# ---------------------------------------------------------------------------


class TestPassThrough:
    def test_websocket_scope_passes_through(self):
        app, called = _app_called_flag()
        mw = BearerAuthMiddleware(app, token="secret", disabled=False)
        asyncio.run(mw(_make_ws_scope(), _noop_receive, _noop_send))
        assert called["value"]

    def test_lifespan_scope_passes_through(self):
        app, called = _app_called_flag()
        mw = BearerAuthMiddleware(app, token="secret", disabled=False)
        asyncio.run(mw(_make_lifespan_scope(), _noop_receive, _noop_send))
        assert called["value"]

    def test_disabled_passes_all_http_requests(self):
        app, called = _app_called_flag()
        mw = BearerAuthMiddleware(app, token="secret", disabled=True)
        scope = _make_http_scope()  # no auth header
        asyncio.run(mw(scope, _noop_receive, _noop_send))
        assert called["value"]


# ---------------------------------------------------------------------------
# 401 cases
# ---------------------------------------------------------------------------


class TestUnauthorized:
    def setup_method(self):
        app, self.called = _app_called_flag()
        self.mw = BearerAuthMiddleware(app, token="correct-token")

    def _run(self, headers=None, ip="10.0.0.1"):
        scope = _make_http_scope(headers=headers, client_ip=ip)
        return asyncio.run(_collect_response(self.mw, scope))

    def test_missing_header_returns_401(self):
        status, _, _ = self._run()
        assert status == 401
        assert not self.called["value"]

    def test_missing_header_includes_www_authenticate_realm(self):
        _, headers, _ = self._run()
        assert headers["www-authenticate"] == 'Bearer realm="unraid-mcp"'

    def test_missing_header_body_is_json_unauthorized(self):
        _, _, body = self._run()
        assert b'"error":"unauthorized"' in body

    def test_missing_header_counts_toward_rate_limit(self):
        self._run(ip="10.10.10.10")
        assert len(self.mw._ip_failures["10.10.10.10"]) == 1

    def test_wrong_token_returns_401(self):
        status, _, _ = self._run(headers=[(b"authorization", b"Bearer wrong-token")])
        assert status == 401

    def test_wrong_token_www_authenticate_includes_error_param(self):
        _, headers, _ = self._run(headers=[(b"authorization", b"Bearer wrong-token")])
        assert 'error="invalid_token"' in headers["www-authenticate"]

    def test_wrong_token_body_is_json_invalid_token(self):
        _, _, body = self._run(headers=[(b"authorization", b"Bearer wrong-token")])
        assert b'"error":"invalid_token"' in body

    def test_non_bearer_scheme_treated_as_missing(self):
        status, headers, _ = self._run(headers=[(b"authorization", b"Basic dXNlcjpwYXNz")])
        assert status == 401
        # Should show missing-style header (no error="invalid_token")
        assert "invalid_token" not in headers["www-authenticate"]

    def test_case_insensitive_bearer_scheme(self):
        """BEARER and Bearer and bearer are all valid per RFC 6750."""
        for scheme in [b"BEARER correct-token", b"Bearer correct-token", b"bearer correct-token"]:
            app, called = _app_called_flag()
            mw = BearerAuthMiddleware(app, token="correct-token")
            scope = _make_http_scope(headers=[(b"authorization", scheme)])
            asyncio.run(_collect_response(mw, scope))
            assert called["value"], f"scheme {scheme!r} was rejected but should pass"


# ---------------------------------------------------------------------------
# 200 valid token
# ---------------------------------------------------------------------------


class TestValidToken:
    def test_correct_token_forwards_to_app(self):
        app, called = _app_called_flag()
        mw = BearerAuthMiddleware(app, token="my-secret-token")
        scope = _make_http_scope(headers=[(b"authorization", b"Bearer my-secret-token")])
        status, _, _ = asyncio.run(_collect_response(mw, scope))
        assert status == 200
        assert called["value"]

    def test_token_with_leading_trailing_spaces_accepted(self):
        """Starlette strips surrounding whitespace from header values; we strip too."""
        app, called = _app_called_flag()
        mw = BearerAuthMiddleware(app, token="tok")
        scope = _make_http_scope(headers=[(b"authorization", b"Bearer  tok ")])
        asyncio.run(_collect_response(mw, scope))
        assert called["value"]


# ---------------------------------------------------------------------------
# Per-IP rate limiting → 429
# ---------------------------------------------------------------------------


class TestRateLimiting:
    def _hammer(self, mw: BearerAuthMiddleware, ip: str, count: int) -> list[int]:
        statuses = []
        for _ in range(count):
            scope = _make_http_scope(headers=[(b"authorization", b"Bearer wrong")], client_ip=ip)
            status, _, _ = asyncio.run(_collect_response(mw, scope))
            statuses.append(status)
        return statuses

    def test_below_limit_returns_401_not_429(self):
        app, _ = _app_called_flag()
        mw = BearerAuthMiddleware(app, token="secret")
        statuses = self._hammer(mw, "192.168.1.1", _RATE_MAX_FAILURES - 1)
        assert all(s == 401 for s in statuses)

    def test_at_limit_returns_429(self):
        app, _ = _app_called_flag()
        mw = BearerAuthMiddleware(app, token="secret")
        # Hit the limit
        self._hammer(mw, "192.168.2.2", _RATE_MAX_FAILURES)
        # Next request should be 429
        scope = _make_http_scope(
            headers=[(b"authorization", b"Bearer wrong")], client_ip="192.168.2.2"
        )
        status, headers, _ = asyncio.run(_collect_response(mw, scope))
        assert status == 429
        assert headers.get("retry-after") == "60"

    def test_different_ips_have_independent_counters(self):
        app, _ = _app_called_flag()
        mw = BearerAuthMiddleware(app, token="secret")
        # Max out ip A
        self._hammer(mw, "10.0.0.1", _RATE_MAX_FAILURES)
        # ip B should still get 401 (not 429)
        scope = _make_http_scope(
            headers=[(b"authorization", b"Bearer wrong")], client_ip="10.0.0.2"
        )
        status, _, _ = asyncio.run(_collect_response(mw, scope))
        assert status == 401

    def test_window_expiry_resets_counter(self):
        """After the window expires, the counter resets and 401 is returned again."""
        app, _ = _app_called_flag()
        mw = BearerAuthMiddleware(app, token="secret")
        ip = "172.16.0.1"
        # Inject old failures beyond the window to simulate expiry
        mw._ip_failures[ip] = __import__("collections").deque(
            [time.monotonic() - _RATE_WINDOW_SECS - 1] * _RATE_MAX_FAILURES
        )
        # These are all stale — next request should be 401, not 429
        scope = _make_http_scope(headers=[(b"authorization", b"Bearer wrong")], client_ip=ip)
        status, _, _ = asyncio.run(_collect_response(mw, scope))
        assert status == 401
        assert len(mw._ip_failures[ip]) == 1

    def test_stale_warning_timestamps_are_evicted(self):
        app, _ = _app_called_flag()
        mw = BearerAuthMiddleware(app, token="secret")
        ip = "172.16.0.2"
        mw._ip_last_warn[ip] = time.monotonic() - (_RATE_WINDOW_SECS + 1)
        scope = _make_http_scope(headers=[(b"authorization", b"Bearer wrong")], client_ip=ip)
        asyncio.run(_collect_response(mw, scope))
        assert ip in mw._ip_last_warn


# ---------------------------------------------------------------------------
# ensure_token_exists + startup guard
# ---------------------------------------------------------------------------


class TestEnsureTokenExists:
    def test_no_op_when_token_already_set(self, tmp_path):
        """ensure_token_exists does nothing when a token is already configured."""
        import unraid_mcp.config.settings as s

        original = s.UNRAID_MCP_BEARER_TOKEN
        try:
            s.UNRAID_MCP_BEARER_TOKEN = "existing-token"
            with patch("unraid_mcp.server.CREDENTIALS_DIR", tmp_path):
                from unraid_mcp.server import ensure_token_exists

                ensure_token_exists()
            # No new file written
            assert not (tmp_path / ".env").exists()
        finally:
            s.UNRAID_MCP_BEARER_TOKEN = original

    def test_no_op_when_auth_disabled(self, tmp_path):
        import unraid_mcp.config.settings as s

        orig_token = s.UNRAID_MCP_BEARER_TOKEN
        orig_disabled = s.UNRAID_MCP_DISABLE_HTTP_AUTH
        try:
            s.UNRAID_MCP_BEARER_TOKEN = None
            s.UNRAID_MCP_DISABLE_HTTP_AUTH = True
            with patch("unraid_mcp.server.CREDENTIALS_DIR", tmp_path):
                from unraid_mcp.server import ensure_token_exists

                ensure_token_exists()
            assert not (tmp_path / ".env").exists()
        finally:
            s.UNRAID_MCP_BEARER_TOKEN = orig_token
            s.UNRAID_MCP_DISABLE_HTTP_AUTH = orig_disabled

    def test_generates_token_when_none_set(self, tmp_path):
        import unraid_mcp.config.settings as s

        orig_token = s.UNRAID_MCP_BEARER_TOKEN
        orig_disabled = s.UNRAID_MCP_DISABLE_HTTP_AUTH
        try:
            s.UNRAID_MCP_BEARER_TOKEN = None
            s.UNRAID_MCP_DISABLE_HTTP_AUTH = False

            env_path = tmp_path / ".env"
            with (
                patch("unraid_mcp.server.CREDENTIALS_DIR", tmp_path),
                patch("unraid_mcp.server.CREDENTIALS_ENV_PATH", env_path),
            ):
                from unraid_mcp.server import ensure_token_exists

                ensure_token_exists()

            # Token written to the module global
            assert s.UNRAID_MCP_BEARER_TOKEN is not None
            assert len(s.UNRAID_MCP_BEARER_TOKEN) > 0

        finally:
            s.UNRAID_MCP_BEARER_TOKEN = orig_token
            s.UNRAID_MCP_DISABLE_HTTP_AUTH = orig_disabled

    def test_token_popped_from_environ_after_generation(self, tmp_path):
        import unraid_mcp.config.settings as s

        orig_token = s.UNRAID_MCP_BEARER_TOKEN
        orig_disabled = s.UNRAID_MCP_DISABLE_HTTP_AUTH
        try:
            s.UNRAID_MCP_BEARER_TOKEN = None
            s.UNRAID_MCP_DISABLE_HTTP_AUTH = False
            # Simulate token being in environ (e.g. set before startup)
            os.environ["UNRAID_MCP_BEARER_TOKEN"] = "should-be-removed"

            env_path = tmp_path / ".env"
            with (
                patch("unraid_mcp.server.CREDENTIALS_DIR", tmp_path),
                patch("unraid_mcp.server.CREDENTIALS_ENV_PATH", env_path),
            ):
                from unraid_mcp.server import ensure_token_exists

                ensure_token_exists()

            assert "UNRAID_MCP_BEARER_TOKEN" not in os.environ
        finally:
            s.UNRAID_MCP_BEARER_TOKEN = orig_token
            s.UNRAID_MCP_DISABLE_HTTP_AUTH = orig_disabled
            os.environ.pop("UNRAID_MCP_BEARER_TOKEN", None)

    def test_generated_token_is_not_printed_to_stderr(self, tmp_path, capsys):
        import unraid_mcp.config.settings as s

        orig_token = s.UNRAID_MCP_BEARER_TOKEN
        orig_disabled = s.UNRAID_MCP_DISABLE_HTTP_AUTH
        try:
            s.UNRAID_MCP_BEARER_TOKEN = None
            s.UNRAID_MCP_DISABLE_HTTP_AUTH = False

            env_path = tmp_path / ".env"
            with (
                patch("unraid_mcp.server.CREDENTIALS_DIR", tmp_path),
                patch("unraid_mcp.server.CREDENTIALS_ENV_PATH", env_path),
            ):
                from unraid_mcp.server import ensure_token_exists

                ensure_token_exists()

            captured = capsys.readouterr()
            assert "UNRAID_MCP_BEARER_TOKEN=" not in captured.err
            assert s.UNRAID_MCP_BEARER_TOKEN not in captured.err
        finally:
            s.UNRAID_MCP_BEARER_TOKEN = orig_token
            s.UNRAID_MCP_DISABLE_HTTP_AUTH = orig_disabled


class TestStartupGuard:
    def test_startup_guard_exits_when_http_no_token_no_disable(self):
        """run_server must sys.exit(1) if HTTP + no token + auth not disabled."""
        import unraid_mcp.config.settings as s

        orig_transport = s.UNRAID_MCP_TRANSPORT
        orig_token = s.UNRAID_MCP_BEARER_TOKEN
        orig_disabled = s.UNRAID_MCP_DISABLE_HTTP_AUTH
        try:
            s.UNRAID_MCP_TRANSPORT = "streamable-http"
            s.UNRAID_MCP_BEARER_TOKEN = None
            s.UNRAID_MCP_DISABLE_HTTP_AUTH = False

            # ensure_token_exists is a no-op when token is None but also we patch it
            with (
                patch("unraid_mcp.server.ensure_token_exists"),
                pytest.raises(SystemExit) as exc_info,
            ):
                from unraid_mcp.server import run_server

                run_server()

            assert exc_info.value.code == 1
        finally:
            s.UNRAID_MCP_TRANSPORT = orig_transport
            s.UNRAID_MCP_BEARER_TOKEN = orig_token
            s.UNRAID_MCP_DISABLE_HTTP_AUTH = orig_disabled

    def test_startup_guard_refuses_disabled_auth_on_public_interface(self):
        """run_server must sys.exit(1) when auth is disabled on a non-loopback
        bind host without an explicitly trusted proxy (finding S-H3)."""
        import unraid_mcp.config.settings as s

        orig_transport = s.UNRAID_MCP_TRANSPORT
        orig_token = s.UNRAID_MCP_BEARER_TOKEN
        orig_disabled = s.UNRAID_MCP_DISABLE_HTTP_AUTH
        orig_host = s.UNRAID_MCP_HOST
        orig_trust = s.UNRAID_MCP_TRUST_PROXY
        try:
            s.UNRAID_MCP_TRANSPORT = "streamable-http"
            s.UNRAID_MCP_BEARER_TOKEN = None
            s.UNRAID_MCP_DISABLE_HTTP_AUTH = True
            s.UNRAID_MCP_HOST = "0.0.0.0"  # noqa: S104 — non-loopback bind under test
            s.UNRAID_MCP_TRUST_PROXY = False

            with (
                patch("unraid_mcp.server.ensure_token_exists"),
                pytest.raises(SystemExit) as exc_info,
            ):
                from unraid_mcp.server import run_server

                run_server()

            assert exc_info.value.code == 1
        finally:
            s.UNRAID_MCP_TRANSPORT = orig_transport
            s.UNRAID_MCP_BEARER_TOKEN = orig_token
            s.UNRAID_MCP_DISABLE_HTTP_AUTH = orig_disabled
            s.UNRAID_MCP_HOST = orig_host
            s.UNRAID_MCP_TRUST_PROXY = orig_trust

    def test_startup_guard_allows_disabled_auth_when_trust_proxy(self):
        """run_server should NOT exit when auth is disabled on a public bind
        host but an upstream proxy is trusted (the SWAG-fronted topology)."""
        import unraid_mcp.config.settings as s

        orig_transport = s.UNRAID_MCP_TRANSPORT
        orig_token = s.UNRAID_MCP_BEARER_TOKEN
        orig_disabled = s.UNRAID_MCP_DISABLE_HTTP_AUTH
        orig_host = s.UNRAID_MCP_HOST
        orig_trust = s.UNRAID_MCP_TRUST_PROXY
        try:
            s.UNRAID_MCP_TRANSPORT = "streamable-http"
            s.UNRAID_MCP_BEARER_TOKEN = None
            s.UNRAID_MCP_DISABLE_HTTP_AUTH = True
            s.UNRAID_MCP_HOST = "0.0.0.0"  # noqa: S104 — non-loopback bind under test
            s.UNRAID_MCP_TRUST_PROXY = True

            from unraid_mcp.server import mcp as _mcp

            with (
                patch("unraid_mcp.server.ensure_token_exists"),
                patch("unraid_mcp.server.log_configuration_status"),
                patch.object(_mcp, "run"),
            ):
                from unraid_mcp.server import run_server

                # Should NOT raise SystemExit
                run_server()
        finally:
            s.UNRAID_MCP_TRANSPORT = orig_transport
            s.UNRAID_MCP_BEARER_TOKEN = orig_token
            s.UNRAID_MCP_DISABLE_HTTP_AUTH = orig_disabled
            s.UNRAID_MCP_HOST = orig_host
            s.UNRAID_MCP_TRUST_PROXY = orig_trust

    def test_startup_guard_allows_disabled_auth_on_loopback(self):
        """run_server should NOT exit when auth is disabled but the bind host is
        loopback — the endpoint is not reachable from the network."""
        import unraid_mcp.config.settings as s

        orig_transport = s.UNRAID_MCP_TRANSPORT
        orig_token = s.UNRAID_MCP_BEARER_TOKEN
        orig_disabled = s.UNRAID_MCP_DISABLE_HTTP_AUTH
        orig_host = s.UNRAID_MCP_HOST
        orig_trust = s.UNRAID_MCP_TRUST_PROXY
        try:
            s.UNRAID_MCP_TRANSPORT = "streamable-http"
            s.UNRAID_MCP_BEARER_TOKEN = None
            s.UNRAID_MCP_DISABLE_HTTP_AUTH = True
            s.UNRAID_MCP_HOST = "127.0.0.1"
            s.UNRAID_MCP_TRUST_PROXY = False

            from unraid_mcp.server import mcp as _mcp

            with (
                patch("unraid_mcp.server.ensure_token_exists"),
                patch("unraid_mcp.server.log_configuration_status"),
                patch.object(_mcp, "run"),
            ):
                from unraid_mcp.server import run_server

                # Should NOT raise SystemExit
                run_server()
        finally:
            s.UNRAID_MCP_TRANSPORT = orig_transport
            s.UNRAID_MCP_BEARER_TOKEN = orig_token
            s.UNRAID_MCP_DISABLE_HTTP_AUTH = orig_disabled
            s.UNRAID_MCP_HOST = orig_host
            s.UNRAID_MCP_TRUST_PROXY = orig_trust


# ---------------------------------------------------------------------------
# HealthMiddleware — unauthenticated GET/HEAD /health (regression for #31)
#
# Docker's image healthcheck uses `wget --spider`, which sends HEAD /health.
# The middleware previously only handled GET, so HEAD fell through to bearer
# auth and returned 401, marking the container unhealthy.
# ---------------------------------------------------------------------------


async def _run_health(method: str, path: str = "/health"):
    """Run HealthMiddleware over BearerAuth and return (status, headers, body, app_called)."""
    inner, called = _app_called_flag()
    authed = BearerAuthMiddleware(inner, token="secret", disabled=False)
    mw = HealthMiddleware(authed)
    scope = {
        "type": "http",
        "method": method,
        "path": path,
        "headers": [],  # no Authorization header
        "client": ("127.0.0.1", 9999),
    }
    received: list[dict] = []

    async def receive():
        return {"type": "http.request", "body": b"", "more_body": False}

    async def send(msg: dict):
        received.append(msg)

    await mw(scope, receive, send)
    start = next(m for m in received if m["type"] == "http.response.start")
    body_msg = next(m for m in received if m["type"] == "http.response.body")
    headers = {k.decode(): v.decode() for k, v in start["headers"]}
    return start["status"], headers, body_msg["body"], called["value"]


class TestHealthMiddleware:
    def _run(self, method, path="/health"):
        return asyncio.run(_run_health(method, path))

    def test_get_health_returns_200_without_auth(self):
        status, _, body, called = self._run("GET")
        assert status == 200
        assert body == b'{"status":"ok"}'
        assert not called  # never reached the auth layer

    def test_head_health_returns_200_without_auth(self):
        """Regression for #31: `wget --spider` sends HEAD and must not 401."""
        status, headers, body, called = self._run("HEAD")
        assert status == 200
        # HEAD carries no body but keeps GET's content-length header.
        assert body == b""
        assert headers["content-length"] == str(len(b'{"status":"ok"}'))
        assert not called

    def test_normalized_path_still_matches(self):
        status, _, _, _ = self._run("HEAD", path="/health/")
        assert status == 200

    def test_post_health_falls_through_to_auth(self):
        """Other methods are not health probes — they hit the auth layer (401)."""
        status, _, _, called = self._run("POST")
        assert status == 401
        assert not called


async def _run_readiness(ready: bool, reason: str = "ready"):
    inner, called = _app_called_flag()

    async def probe() -> tuple[bool, str]:
        return ready, reason

    mw = ReadinessMiddleware(inner, probe=probe)
    scope = {
        "type": "http",
        "method": "GET",
        "path": "/ready",
        "headers": [],
        "client": ("127.0.0.1", 9999),
    }
    received: list[dict] = []

    async def receive():
        return {"type": "http.request", "body": b"", "more_body": False}

    async def send(msg: dict):
        received.append(msg)

    await mw(scope, receive, send)
    start = next(m for m in received if m["type"] == "http.response.start")
    body = next(m for m in received if m["type"] == "http.response.body")["body"]
    return start["status"], body, called["value"]


class TestReadinessMiddleware:
    def test_ready_response_is_200_json(self):
        status, body, called = asyncio.run(_run_readiness(True))
        assert status == 200
        assert body == b'{"status":"ready"}'
        assert not called

    def test_not_ready_response_is_503_without_internal_details(self):
        status, body, called = asyncio.run(_run_readiness(False, "upstream unavailable"))
        assert status == 503
        assert body == b'{"status":"not_ready"}'
        assert b"upstream" not in body
        assert not called

    async def test_non_loopback_request_falls_through_without_probe(self):
        inner, called = _app_called_flag()
        probe_calls = 0

        async def probe() -> tuple[bool, str]:
            nonlocal probe_calls
            probe_calls += 1
            return True, "ready"

        mw = ReadinessMiddleware(inner, probe=probe)
        scope = {
            "type": "http",
            "method": "GET",
            "path": "/ready",
            "headers": [],
            "client": ("198.51.100.10", 9999),
        }
        received: list[dict] = []

        async def receive():
            return {"type": "http.request", "body": b"", "more_body": False}

        async def send(message: dict):
            received.append(message)

        await mw(scope, receive, send)

        assert called["value"]
        assert probe_calls == 0
        assert received[0]["status"] == 200
        assert received[1]["body"] == b"ok"

    async def test_loopback_probe_result_is_cached(self):
        inner, _called = _app_called_flag()
        probe_calls = 0

        async def probe() -> tuple[bool, str]:
            nonlocal probe_calls
            probe_calls += 1
            return True, "ready"

        mw = ReadinessMiddleware(inner, probe=probe, cache_ttl_seconds=60)
        scope = {
            "type": "http",
            "method": "GET",
            "path": "/ready",
            "headers": [],
            "client": ("127.0.0.1", 9999),
        }

        async def receive():
            return {"type": "http.request", "body": b"", "more_body": False}

        async def send(_message: dict):
            return None

        await mw(scope, receive, send)
        await mw(scope, receive, send)

        assert probe_calls == 1


# ---------------------------------------------------------------------------
# WellKnownMiddleware — RFC 9728 OAuth Protected Resource Metadata
# ---------------------------------------------------------------------------


def _make_get_scope(path: str, host: str = "localhost:6970") -> dict:
    return {
        "type": "http",
        "method": "GET",
        "path": path,
        "scheme": "http",
        "headers": [(b"host", host.encode())],
        "client": ("127.0.0.1", 9999),
    }


async def _run_well_known(
    path: str,
    method: str = "GET",
    host: str = "localhost:6970",
    public_host: str | None = None,
):
    """Run WellKnownMiddleware and return (status, headers_dict, parsed_body)."""
    app, called = _app_called_flag()  # noqa: RUF059
    mw = WellKnownMiddleware(app, public_host=public_host)
    scope = {
        "type": "http",
        "method": method,
        "path": path,
        "scheme": "http",
        "headers": [(b"host", host.encode())],
        "client": ("127.0.0.1", 9999),
    }
    received: list[dict] = []

    async def receive():
        return {"type": "http.request", "body": b"", "more_body": False}

    async def send(msg: dict):
        received.append(msg)

    await mw(scope, receive, send)

    if not received:
        # App was called (fell through) — return sentinel
        return None, {}, None

    start = next((m for m in received if m["type"] == "http.response.start"), None)
    body_msg = next((m for m in received if m["type"] == "http.response.body"), None)
    if start is None:
        return None, {}, None

    import json as _json

    headers = {k.decode(): v.decode() for k, v in start["headers"]}
    body = _json.loads(body_msg["body"]) if body_msg else {}
    return start["status"], headers, body


class TestWellKnownMiddleware:
    def _run(self, path, method="GET", host="localhost:6970", public_host=None):
        return asyncio.run(_run_well_known(path, method=method, host=host, public_host=public_host))

    # ------------------------------------------------------------------
    # Handled paths → 200
    # ------------------------------------------------------------------

    def test_well_known_root_returns_200(self):
        status, _, _ = self._run("/.well-known/oauth-protected-resource")
        assert status == 200

    def test_well_known_mcp_subpath_returns_200(self):
        status, _, _ = self._run("/.well-known/oauth-protected-resource/mcp")
        assert status == 200

    def test_response_content_type_is_json(self):
        _, headers, _ = self._run("/.well-known/oauth-protected-resource")
        assert headers.get("content-type") == "application/json"

    def test_response_has_bearer_methods_supported(self):
        _, _, body = self._run("/.well-known/oauth-protected-resource")
        assert body.get("bearer_methods_supported") == ["header"]

    def test_response_has_resource_field(self):
        _, _, body = self._run("/.well-known/oauth-protected-resource")
        assert "resource" in body
        assert len(body["resource"]) > 0

    def test_resource_derived_from_host_header(self):
        _, _, body = self._run(
            "/.well-known/oauth-protected-resource", host="myserver.example.com:6970"
        )
        assert body["resource"] == "http://myserver.example.com:6970"

    def test_configured_public_host_overrides_request_host(self):
        """When a public_host is configured it is used verbatim, ignoring Host."""
        _, _, body = self._run(
            "/.well-known/oauth-protected-resource",
            host="attacker.evil.example:6970",
            public_host="trusted.example.com:6970",
        )
        assert body["resource"] == "http://trusted.example.com:6970"
        assert "attacker" not in body["resource"]

    def test_request_host_is_sanitized_when_no_public_host(self):
        """Unsafe chars in the Host header are stripped from the resource URI."""
        # CRLF + a path-injection attempt are dropped; valid host[:port] chars survive.
        _, _, body = self._run(
            "/.well-known/oauth-protected-resource",
            host="evil.example.com:6970/\r\nX-Injected: 1",
        )
        # Only [A-Za-z0-9.:-] survive: '/', CR, LF, and the space are stripped.
        assert body["resource"] == "http://evil.example.com:6970X-Injected:1"
        assert "\r" not in body["resource"]
        assert "\n" not in body["resource"]
        assert "/" not in body["resource"].split("://", 1)[1]

    def test_no_authorization_servers_field(self):
        """Absence of authorization_servers tells clients: use a pre-configured token."""
        _, _, body = self._run("/.well-known/oauth-protected-resource")
        assert "authorization_servers" not in body

    # ------------------------------------------------------------------
    # Fall-through cases → app is called
    # ------------------------------------------------------------------

    def test_non_get_method_falls_through(self):
        """POST /.well-known/... must not be intercepted — fall through to auth."""
        app, called = _app_called_flag()
        mw = WellKnownMiddleware(app)
        scope = {
            "type": "http",
            "method": "POST",
            "path": "/.well-known/oauth-protected-resource",
            "scheme": "http",
            "headers": [],
            "client": ("127.0.0.1", 9999),
        }
        received: list[dict] = []

        async def receive():
            return {"type": "http.request", "body": b"", "more_body": False}

        async def send(msg: dict):
            received.append(msg)

        asyncio.run(mw(scope, receive, send))
        assert called["value"]

    def test_unrelated_path_falls_through(self):
        app, called = _app_called_flag()
        mw = WellKnownMiddleware(app)
        scope = {
            "type": "http",
            "method": "GET",
            "path": "/mcp",
            "scheme": "http",
            "headers": [],
            "client": ("127.0.0.1", 9999),
        }

        async def receive():
            return {"type": "http.request", "body": b"", "more_body": False}

        async def send(msg: dict):
            received.append(msg)

        received: list[dict] = []
        asyncio.run(mw(scope, receive, send))
        assert called["value"]

    def test_websocket_scope_falls_through(self):
        app, called = _app_called_flag()
        mw = WellKnownMiddleware(app)
        scope = {"type": "websocket", "path": "/mcp", "headers": [], "client": ("127.0.0.1", 9)}

        async def receive():
            return {}

        async def send(msg: dict):
            pass

        asyncio.run(mw(scope, receive, send))
        assert called["value"]


# ---------------------------------------------------------------------------
# Stacked middleware integration — ordering invariant (regression for #17)
#
# WellKnownMiddleware MUST sit outside (before) BearerAuthMiddleware so that
# OAuth discovery endpoints are reachable without a token even when auth is
# enabled.  If the order is swapped the well-known endpoint returns 401 and
# MCP clients (e.g. Claude Code) surface an "unknown error".
# ---------------------------------------------------------------------------


async def _run_stack(path: str, method: str = "GET", auth_header: bytes | None = None) -> int:
    """Run the production middleware stack and return the HTTP status code.

    Stack (outermost to innermost): WellKnownMiddleware → BearerAuthMiddleware → app
    """
    app, _ = _app_called_flag()
    authed_app = BearerAuthMiddleware(app, token="test-token", disabled=False)
    stacked = WellKnownMiddleware(authed_app)

    headers: list[tuple[bytes, bytes]] = [(b"host", b"localhost:6970")]
    if auth_header is not None:
        headers.append((b"authorization", auth_header))

    scope = {
        "type": "http",
        "method": method,
        "path": path,
        "scheme": "http",
        "headers": headers,
        "client": ("127.0.0.1", 9999),
    }
    received: list[dict] = []

    async def receive():
        return {"type": "http.request", "body": b"", "more_body": False}

    async def send(msg: dict):
        received.append(msg)

    await stacked(scope, receive, send)
    start = next((m for m in received if m["type"] == "http.response.start"), None)
    return start["status"] if start else 200


class TestMiddlewareOrdering:
    """Regression tests for the WellKnown→BearerAuth ordering invariant."""

    def _run(self, path, method="GET", auth_header=None):
        return asyncio.run(_run_stack(path, method=method, auth_header=auth_header))

    def test_well_known_accessible_without_token(self):
        """Core regression: discovery must be reachable even with auth enabled."""
        assert self._run("/.well-known/oauth-protected-resource") == 200

    def test_well_known_mcp_subpath_accessible_without_token(self):
        assert self._run("/.well-known/oauth-protected-resource/mcp") == 200

    def test_mcp_endpoint_blocked_without_token(self):
        """Auth layer must still protect /mcp when no token is provided."""
        assert self._run("/mcp") == 401

    def test_mcp_endpoint_blocked_with_wrong_token(self):
        assert self._run("/mcp", auth_header=b"Bearer wrong-token") == 401

    def test_mcp_endpoint_passes_with_correct_token(self):
        assert self._run("/mcp", auth_header=b"Bearer test-token") == 200

    def test_swapped_order_would_block_well_known(self):
        """Negative test: wrong middleware order produces 401 on well-known (issue #17)."""
        app, _ = _app_called_flag()
        # Wrong: BearerAuth wraps WellKnown — auth fires before discovery can respond
        wrong_stack = BearerAuthMiddleware(
            WellKnownMiddleware(app), token="test-token", disabled=False
        )
        scope = {
            "type": "http",
            "method": "GET",
            "path": "/.well-known/oauth-protected-resource",
            "scheme": "http",
            "headers": [(b"host", b"localhost:6970")],
            "client": ("127.0.0.1", 9999),
        }
        received: list[dict] = []

        async def receive():
            return {"type": "http.request", "body": b"", "more_body": False}

        async def send(msg: dict):
            received.append(msg)

        asyncio.run(wrong_stack(scope, receive, send))
        start = next(m for m in received if m["type"] == "http.response.start")
        assert start["status"] == 401, "Wrong order should produce 401 (the issue #17 regression)"
