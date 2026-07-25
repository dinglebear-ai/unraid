import { describe, expect, it } from "vitest";
import { IncusExecService } from "./incus-exec.service.js";

class FakeSocket {
  readyState = 1;
  closed = 0;
  terminated = 0;
  on() { return this; }
  send() { return undefined; }
  close() { this.closed++; this.readyState = 3; }
  terminate() { this.terminated++; this.readyState = 3; }
}

type ExecInternals = {
  pendingSessions: number;
  requestExec: (name: string, cols: number, rows: number) => Promise<{
    operationUrl: string;
    fds: Record<string, string>;
  }>;
  connectOperationSocket: (operationUrl: string, secret: string) => FakeSocket;
};

describe("IncusExecService session cleanup", () => {
  it("closes both websocket peers and removes the session", () => {
    const service = new IncusExecService({ get: () => undefined } as never, { socketPath: "/tmp/incus.sock" } as never);
    const ioSocket = new FakeSocket();
    const controlSocket = new FakeSocket();
    const sessions = (service as unknown as { sessions: Map<string, unknown> }).sessions;
    sessions.set("session", {
      jailName: "agent",
      ioSocket,
      controlSocket,
      idleTimer: setTimeout(() => undefined, 60_000),
      lifetimeTimer: setTimeout(() => undefined, 60_000),
    });

    expect(service.stop("session")).toBe(true);
    expect(ioSocket.closed).toBe(1);
    expect(controlSocket.closed).toBe(1);
    expect(sessions.has("session")).toBe(false);
    expect(service.stop("session")).toBe(false);
  });
});

describe("IncusExecService session admission", () => {
  it("reserves all eight slots before awaiting Incus and rejects a ninth concurrent start", async () => {
    const service = new IncusExecService({ get: () => undefined } as never, { socketPath: "/tmp/incus.sock" } as never);
    const internals = service as unknown as ExecInternals;
    const releases: Array<() => void> = [];
    internals.requestExec = () => new Promise((resolve) => {
      releases.push(() => resolve({ operationUrl: "/1.0/operations/test", fds: { "0": "io", control: "control" } }));
    });
    internals.connectOperationSocket = () => new FakeSocket();

    const admitted = Array.from({ length: 8 }, (_, index) => service.start(`agent-${index}`));
    await Promise.resolve();
    expect(internals.pendingSessions).toBe(8);
    await expect(service.start("agent-9")).rejects.toThrow("Too many active terminal sessions");

    releases.forEach((release) => release());
    await expect(Promise.all(admitted)).resolves.toHaveLength(8);
    expect(internals.pendingSessions).toBe(0);
    service.onModuleDestroy();
  });

  it("releases a reserved slot when Incus rejects the exec request", async () => {
    const service = new IncusExecService({ get: () => undefined } as never, { socketPath: "/tmp/incus.sock" } as never);
    const internals = service as unknown as ExecInternals;
    internals.requestExec = async () => { throw new Error("Incus unavailable"); };

    await expect(service.start("agent")).rejects.toThrow("Incus unavailable");
    expect(internals.pendingSessions).toBe(0);
  });
});

describe("IncusExecService recorded output", () => {
  it("records output only when the caller will fetch and delete it", async () => {
    const payloads: Array<Record<string, unknown>> = [];
    const client = {
      socketPath: "/tmp/incus.sock",
      request: async (_method: string, _path: string, body: Record<string, unknown>) => {
        payloads.push(body);
        return { operation: "/1.0/operations/test" };
      },
      wait: async () => ({ metadata: { metadata: { return: 0 } } }),
    };
    const service = new IncusExecService({ get: () => undefined } as never, client as never);

    await service.runOnce("agent", ["true"], 60, false);
    await service.runOnce("agent", ["true"], 60, true);

    expect(payloads.map((payload) => payload["record-output"])).toEqual([false, true]);
  });
});
