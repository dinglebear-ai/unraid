import { describe, expect, it } from "vitest";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ConfigService } from "@nestjs/config";
import { IncusService } from "./incus.service.js";
import type { IncusResponse } from "./incus-unix-client.service.js";
import type { IncusUnixClient } from "./incus-unix-client.service.js";

function syncResponse<T>(metadata: T): IncusResponse<T> {
  return { type: "sync", status: "Success", status_code: 200, metadata };
}

describe("IncusService jail snapshots", () => {
  it("creates per-instance workspaces writable by the configured agent identity", async () => {
    const root = await mkdtemp(join(tmpdir(), "incus-workspace-test-"));
    try {
      const uid = process.getuid?.() ?? 1000;
      const gid = process.getgid?.() ?? 1000;
      const values: Record<string, string> = {
        "incus.jailWorkspaceRoot": root,
        "incus.jailAgentUid": String(uid),
        "incus.jailAgentGid": String(gid),
      };
      const config = {
        get: (key: string, fallback: string) => values[key] ?? fallback,
      } as unknown as ConfigService;
      const client = {} as IncusUnixClient;
      const service = new IncusService(config, client);

      const path = await (service as unknown as {
        ensureInstanceWorkspaceDir(name: string): Promise<string>;
      }).ensureInstanceWorkspaceDir("agent-one");
      const info = await stat(path);
      expect(info.uid).toBe(uid);
      expect(info.gid).toBe(gid);
      expect(info.mode & 0o777).toBe(0o750);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("deduplicates reads but invalidates the snapshot after a successful instance mutation", async () => {
    let reads = 0;
    const request = async (method: string, path: string) => {
      if (method === "GET" && path === "/1.0/instances?recursion=2") {
        reads++;
        return syncResponse([{
          name: "agent",
          status: reads === 1 ? "Running" : "Stopped",
          state: { network: { eth0: { addresses: [{ family: "inet", address: "198.18.0.2" }] } } },
        }]);
      }
      return syncResponse({});
    };
    const client = { request, wait: async () => syncResponse({}) } as unknown as IncusUnixClient;
    const config = { get: (_key: string, fallback: unknown) => fallback } as unknown as ConfigService;
    const service = new IncusService(config, client);

    await expect(service.listJails()).resolves.toMatchObject([{ status: "Running" }]);
    await expect(service.listJails()).resolves.toMatchObject([{ status: "Running" }]);
    expect(reads).toBe(1);

    await service.setState("agent", "stop");
    await expect(service.listJails()).resolves.toMatchObject([{ status: "Stopped" }]);
    expect(reads).toBe(2);
  });

  it("retains a valid snapshot when an instance mutation fails", async () => {
    let reads = 0;
    const client = {
      request: async (method: string, path: string) => {
        if (method === "GET") {
          reads++;
          return syncResponse([{ name: "agent", status: "Running" }]);
        }
        if (path.includes("/state")) throw new Error("mutation failed");
        return syncResponse({});
      },
      wait: async () => syncResponse({}),
    } as unknown as IncusUnixClient;
    const config = { get: (_key: string, fallback: unknown) => fallback } as unknown as ConfigService;
    const service = new IncusService(config, client);

    await service.listJails();
    await expect(service.setState("agent", "stop")).rejects.toThrow("mutation failed");
    await service.listJails();
    expect(reads).toBe(1);
  });
});
