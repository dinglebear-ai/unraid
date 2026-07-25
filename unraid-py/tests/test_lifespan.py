"""Tests for the FastMCP lifespan shutdown wiring in unraid_mcp.server.

The server's ``lifespan`` async context manager runs shutdown cleanup
(``subscription_manager.stop_all()`` + ``close_http_client()``) IN the server's
own event loop on every transport and exit path (normal return, SIGTERM,
KeyboardInterrupt). These tests enter and exit that context manager with both
cleanup callables mocked and assert each is awaited exactly once on shutdown.

Patch target: the cleanup names are imported into the ``unraid_mcp.server``
module namespace and resolved there at call time, so patch on
``unraid_mcp.server.*`` (not the core modules).
"""

from unittest.mock import AsyncMock, patch

import pytest

import unraid_mcp.server as server


def test_lifespan_is_wired_into_the_mcp_instance() -> None:
    """The lifespan we defined is actually the one FastMCP will run."""
    # FastMCP stores the configured lifespan on the private _lifespan attr.
    assert server.mcp._lifespan is server.lifespan


@pytest.mark.asyncio
async def test_create_app_returns_independently_registered_server() -> None:
    """Embedders can construct an app explicitly instead of reusing the discovery global."""
    app = server.create_app()
    assert app is not server.mcp
    assert app._lifespan is server.lifespan
    assert (await app.get_tool("unraid")).name == "unraid"


@pytest.mark.asyncio
async def test_lifespan_runs_cleanup_once_on_shutdown() -> None:
    """Entering then exiting the lifespan awaits BOTH cleanups exactly once."""
    stop_all = AsyncMock()
    close_client = AsyncMock()

    with (
        patch.object(server.subscription_manager, "stop_all", stop_all),
        patch.object(server, "close_http_client", close_client),
    ):
        cm = server.lifespan(server.mcp)

        # Startup: no cleanup yet.
        await cm.__aenter__()
        stop_all.assert_not_awaited()
        close_client.assert_not_awaited()

        # Shutdown: both cleanups run, each exactly once.
        await cm.__aexit__(None, None, None)

    stop_all.assert_awaited_once()
    close_client.assert_awaited_once()


@pytest.mark.asyncio
async def test_lifespan_yields_control_during_startup() -> None:
    """The body between startup and shutdown runs while inside the context."""
    stop_all = AsyncMock()
    close_client = AsyncMock()

    ran_inside = False
    with (
        patch.object(server.subscription_manager, "stop_all", stop_all),
        patch.object(server, "close_http_client", close_client),
    ):
        async with server.lifespan(server.mcp):
            ran_inside = True
            # Still inside the context — shutdown has not happened yet.
            stop_all.assert_not_awaited()
            close_client.assert_not_awaited()

    assert ran_inside
    stop_all.assert_awaited_once()
    close_client.assert_awaited_once()


@pytest.mark.asyncio
async def test_lifespan_cleanup_runs_even_if_stop_all_raises() -> None:
    """A failing stop_all must not prevent close_http_client from running."""
    stop_all = AsyncMock(side_effect=RuntimeError("boom"))
    close_client = AsyncMock()

    with (
        patch.object(server.subscription_manager, "stop_all", stop_all),
        patch.object(server, "close_http_client", close_client),
    ):
        async with server.lifespan(server.mcp):
            pass

    stop_all.assert_awaited_once()
    # Even though stop_all raised, the HTTP client is still closed.
    close_client.assert_awaited_once()
