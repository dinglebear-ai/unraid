import { mkdtemp, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { JsonArrayStore } from "./json-store.js";

const isRecord = (value: unknown): value is { id: string } => typeof (value as { id?: unknown })?.id === "string";

describe("JsonArrayStore", () => {
  it("serializes concurrent mutations without losing updates", async () => {
    const dir = await mkdtemp(join(tmpdir(), "incus-store-"));
    const path = join(dir, "items.json");
    const store = new JsonArrayStore(() => path, isRecord);
    await Promise.all(Array.from({ length: 20 }, (_, i) => store.update(async (items) => {
      await new Promise((resolve) => setTimeout(resolve, i % 3));
      items.push({ id: String(i) });
    })));
    expect(await store.read()).toHaveLength(20);
    expect(JSON.parse(await readFile(path, "utf-8"))).toHaveLength(20);
  });

  it("returns empty only for ENOENT and rejects corrupt data", async () => {
    const dir = await mkdtemp(join(tmpdir(), "incus-store-"));
    const path = join(dir, "items.json");
    const store = new JsonArrayStore(() => path, isRecord);
    await expect(store.read()).resolves.toEqual([]);
    await writeFile(path, "not json");
    await expect(store.read()).rejects.toThrow();
    await writeFile(path, JSON.stringify({ id: "not-an-array" }));
    await expect(store.read()).rejects.toThrow("Invalid registry data");
    await writeFile(path, JSON.stringify([{ id: "valid" }, { nope: true }]));
    await expect(store.read()).rejects.toThrow("Invalid registry data");
  });

  it("atomically writes private files and removes temporary files", async () => {
    const dir = await mkdtemp(join(tmpdir(), "incus-store-"));
    const path = join(dir, "items.json");
    const store = new JsonArrayStore(() => path, isRecord);
    await store.update((items) => items.push({ id: "one" }));
    expect((await stat(path)).mode & 0o777).toBe(0o600);
    expect((await readdir(dir)).filter((name) => name.includes(".tmp-"))).toEqual([]);
  });
});
