"""Fixtures that boot a schema-faithful mock GraphQL server for offline tests.

A session-scoped Node process serves `docs/unraid/UNRAID-SCHEMA.graphql` via
graphql-yoga + @graphql-tools/mock (`addMocksToSchema`). The Python Unraid client
is then pointed at it, so the real httpx → GraphQL round trip (and the middleware
stack) runs end-to-end without a live Unraid server.

One-time setup (then fully offline):

    npm --prefix tests/mock install

When Node or `tests/mock/node_modules` is absent, the fixtures **skip** cleanly,
so a normal `uv run pytest` never boots anything.
"""

from __future__ import annotations

import json
import os
import shutil
import socket
import subprocess
import tempfile
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import TYPE_CHECKING

import pytest


if TYPE_CHECKING:
    from collections.abc import Generator


_MOCK_DIR = Path(__file__).parent
_SERVER = _MOCK_DIR / "mock-server.mjs"


def _free_port() -> int:
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


def _wait_ready(url: str, timeout: float = 25.0) -> bool:
    """Poll the endpoint with a trivial query until it answers."""
    body = json.dumps({"query": "{ __typename }"}).encode()
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        try:
            req = urllib.request.Request(  # noqa: S310 — fixed localhost URL
                url, data=body, headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=2) as resp:  # noqa: S310
                if resp.status == 200:
                    payload = json.loads(resp.read())
                    if (payload.get("data") or {}).get("__typename"):
                        return True
        except (urllib.error.URLError, OSError, ValueError):
            time.sleep(0.3)
    return False


@pytest.fixture(scope="session")
def mock_graphql_url() -> Generator[str, None, None]:
    """Boot the mock GraphQL server once per session and yield its /graphql URL.

    Skips when Node or the mock's node_modules are unavailable.
    """
    node = shutil.which("node")
    if node is None:
        pytest.skip("node not found — mock GraphQL server unavailable")
    if not (_MOCK_DIR / "node_modules").is_dir():
        pytest.skip("tests/mock/node_modules missing — run `npm --prefix tests/mock install` once")

    port = int(os.environ.get("MOCK_PORT") or _free_port())
    url = f"http://127.0.0.1:{port}/graphql"
    # Capture server output to a temp file (not a PIPE) so nothing is left
    # unclosed — the repo runs under filterwarnings=error.
    log = tempfile.TemporaryFile(mode="w+")  # noqa: SIM115 — outlives the server, closed in finally
    proc = subprocess.Popen(
        [node, str(_SERVER)],
        cwd=str(_MOCK_DIR),
        env={**os.environ, "MOCK_PORT": str(port)},
        stdout=log,
        stderr=subprocess.STDOUT,
        text=True,
    )
    try:
        if not _wait_ready(url):
            log.seek(0)
            tail = log.read()[-500:]
            pytest.skip(f"mock GraphQL server did not become ready. Output:\n{tail}")
        yield url
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()
        log.close()


@pytest.fixture(autouse=True)
async def _isolated_http_client() -> object:
    """Give each test its own httpx client on its own event loop.

    The Unraid client caches a shared `AsyncClient` bound to the loop it was
    created on; pytest-asyncio runs each test on a fresh function-scoped loop, so
    reusing the cached client across tests raises "Event loop is closed". Drop the
    cache at setup (forcing creation on this test's loop) and close it at teardown
    (same live loop) for a clean lifecycle.
    """
    from unraid_mcp.core import client as _client_mod

    _client_mod._http_client = None
    yield
    await _client_mod.close_http_client()


@pytest.fixture
def mock_graphql_env(mock_graphql_url: str, monkeypatch: pytest.MonkeyPatch) -> str:
    """Point the Unraid client at the mock server for the duration of one test.

    `make_graphql_request` reads `settings.UNRAID_API_URL` / `UNRAID_API_KEY` at
    call time, so patching the module attributes is sufficient (no reload needed).
    """
    from unraid_mcp.config import settings

    monkeypatch.setattr(settings, "UNRAID_API_URL", mock_graphql_url)
    monkeypatch.setattr(settings, "UNRAID_API_KEY", "mock-key")
    return mock_graphql_url
