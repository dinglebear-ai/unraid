import { createServer, type RequestListener } from "node:http";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { ConfigService } from "@nestjs/config";
import { IncusUnixClient } from "./incus-unix-client.service.js";

const cleanup: Array<() => Promise<void>> = [];
afterEach(async () => { while (cleanup.length) await cleanup.pop()!(); });

async function fixture(handler: RequestListener) {
  const dir = await mkdtemp(join(tmpdir(), "incus-socket-"));
  const socket = join(dir, "unix.socket");
  const server = createServer(handler);
  await new Promise<void>((resolve) => server.listen(socket, resolve));
  cleanup.push(async () => { await new Promise<void>((resolve) => server.close(() => resolve())); await rm(dir, { recursive: true, force: true }); });
  const config = { get: () => dir } as unknown as ConfigService;
  return new IncusUnixClient(config);
}

describe("IncusUnixClient", () => {
  it("parses success and surfaces Incus error envelopes", async () => {
    const client = await fixture((req, res) => {
      res.setHeader("content-type", "application/json");
      if (req.url === "/bad") res.statusCode = 403;
      res.end(req.url === "/bad"
        ? JSON.stringify({ type: "error", error: "denied", error_code: 403 })
        : JSON.stringify({ type: "sync", status_code: 200, metadata: { ok: true } }));
    });
    await expect(client.request<{ ok: boolean }>("GET", "/ok")).resolves.toMatchObject({ metadata: { ok: true } });
    await expect(client.request("GET", "/bad")).rejects.toThrow("denied");
  });

  it("falls back to the HTTP status when an error response is not an Incus envelope", async () => {
    const client = await fixture((_req, res) => {
      res.statusCode = 502;
      res.end("upstream failure");
    });
    await expect(client.request("GET", "/bad")).rejects.toThrow("Incus HTTP 502");
    await expect(client.requestText("GET", "/bad")).rejects.toThrow("Incus HTTP 502");
  });

  it("rejects response bodies above the configured limit", async () => {
    const client = await fixture((_req, res) => res.end("x".repeat(1024)));
    await expect(client.requestText("GET", "/large", undefined, 1_000, 32)).rejects.toThrow("exceeded");
  });

  it("can drain oversized log responses while returning a bounded prefix", async () => {
    const client = await fixture((_req, res) => res.end("x".repeat(1024)));
    await expect(client.requestTextTruncated("GET", "/large", undefined, 1_000, 32)).resolves.toEqual({
      text: "x".repeat(32),
      truncated: true,
    });
  });
});
