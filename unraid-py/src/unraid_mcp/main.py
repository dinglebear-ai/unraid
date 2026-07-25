#!/usr/bin/env python3
"""Unraid MCP Server - Entry Point.

This is the main entry point for the Unraid MCP Server. It imports and starts
the modular server implementation from unraid_mcp.server.
"""

import sys


def main() -> None:
    """Main entry point for the Unraid MCP Server."""
    argv = sys.argv[1:]
    if argv and argv[0] == "setup":
        # `setup` (bare) and `setup plugin-hook` run the non-interactive plugin hook,
        # which maps CLAUDE_PLUGIN_OPTION_* -> ~/.unraid-mcp/.env. Used by the plugin's
        # SessionStart / ConfigChange hooks. Reject unknown subcommands so a typo
        # (e.g. `setup plugin-hookk`) fails loudly instead of silently succeeding.
        subcommand = argv[1] if len(argv) > 1 else "plugin-hook"
        if subcommand != "plugin-hook":
            print(
                f"Unknown setup subcommand: {subcommand!r}. Valid: 'plugin-hook'.",
                file=sys.stderr,
            )
            sys.exit(2)

        from .core.setup import run_plugin_hook

        sys.exit(run_plugin_hook())

    # Shutdown cleanup (subscription_manager.stop_all() + close_http_client())
    # now runs IN the server's own event loop via the FastMCP lifespan defined in
    # server.py — on every transport and exit path, including a normal mcp.run()
    # return and SIGTERM. So there is no longer a separate cleanup call here.
    try:
        from .server import run_server

        run_server()
    except KeyboardInterrupt:
        print("\nServer stopped by user")
    except Exception as e:
        print(f"Server failed to start: {e}")
        raise


if __name__ == "__main__":
    main()
