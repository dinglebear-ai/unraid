#!/usr/bin/env python3
"""Minimal deterministic GraphQL upstream for container readiness smoke tests."""

from __future__ import annotations

import json
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


class Handler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        if self.path == "/health":
            self._json(200, {"status": "ok"})
        else:
            self._json(404, {"error": "not_found"})

    def do_POST(self) -> None:
        length = int(self.headers.get("content-length", "0"))
        self.rfile.read(length)
        if self.path == "/graphql":
            self._json(200, {"data": {"online": True}})
        else:
            self._json(404, {"error": "not_found"})

    def log_message(self, format: str, *args: object) -> None:
        del format, args
        return

    def _json(self, status: int, payload: dict[str, object]) -> None:
        body = json.dumps(payload, separators=(",", ":")).encode()
        self.send_response(status)
        self.send_header("content-type", "application/json")
        self.send_header("content-length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 9002
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
