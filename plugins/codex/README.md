# Unraid Codex chathead

This is a separate classic Unraid plugin that adds a persistent Codex
chathead to authenticated stock webGUI pages. It does not replace or patch
Unraid core UI files.

The browser speaks Codex app-server JSON-RPC over WebSocket through Unraid's
existing authenticated `/webterminal/` Unix-socket proxy. Codex itself runs as
the non-root `agent` user in the unprivileged `unraid-codex` Incus container.
The app-server socket is mounted into `/run/unraid-codex` and is never exposed
on a standalone TCP port.

The prototype includes:

- Aurora Light chathead and side drawer in an isolated shadow root
- ChatGPT device-code login
- new-thread creation and saved-thread resume across page navigation
- streamed assistant message deltas
- one-shot command and file-change approval prompts
- array mount/unmount lifecycle hooks
- uninstall that removes only the webGUI integration and leaves container data

Build and verify:

```bash
./tests/contract.sh
./scripts/build-package.sh
```

The build script requires Slackware's `makepkg`, which is available on Unraid.
