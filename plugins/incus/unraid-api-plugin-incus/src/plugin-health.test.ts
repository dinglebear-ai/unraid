import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { parsePluginHealth, readPluginHealth } from "./plugin-health.js";

describe("plugin-health", () => {
  const dirs: string[] = [];
  afterEach(async () => {
    await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });
  async function stateDir(): Promise<string> {
    const dir = await mkdtemp(join(tmpdir(), "incus-health-"));
    dirs.push(dir);
    return dir;
  }

  it("parses the four key=value lines the shell writer produces", () => {
    expect(
      parsePluginHealth(
        "status=degraded\ntime=2026-11-18T03:00:00+00:00\nbuild=57\nmessage=incus.cfg rejected: a=b; c\n",
      ),
    ).toEqual({
      status: "degraded",
      time: "2026-11-18T03:00:00+00:00",
      build: "57",
      message: "incus.cfg rejected: a=b; c",
    });
  });

  it("rejects content without a status", () => {
    expect(parsePluginHealth("message=orphan\n")).toBeNull();
    expect(parsePluginHealth("")).toBeNull();
  });

  it("defaults a missing message and omits empty optional fields", () => {
    expect(parsePluginHealth("status=ready\ntime=\n")).toEqual({
      status: "ready",
      message: "",
      time: undefined,
      build: undefined,
    });
  });

  it("reads the file from the configured state directory", async () => {
    const dir = await stateDir();
    await writeFile(join(dir, "plugin-health"), "status=ready\nmessage=environment reconciled\n");
    await expect(readPluginHealth(dir)).resolves.toMatchObject({ status: "ready", message: "environment reconciled" });
  });

  it("returns null before the daemon ever wrote the file", async () => {
    await expect(readPluginHealth(join(await stateDir(), "missing"))).resolves.toBeNull();
  });

  it("surfaces read errors other than a missing file", async () => {
    const dir = await stateDir();
    await mkdir(join(dir, "plugin-health"));
    await expect(readPluginHealth(dir)).rejects.toThrow();
  });
});
