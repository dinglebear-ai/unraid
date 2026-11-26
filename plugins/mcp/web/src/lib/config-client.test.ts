import { afterEach, describe, expect, it, vi } from "vitest";
import { loadConfig, postBody, saveConfig } from "./config-client";

afterEach(() => {
  vi.unstubAllGlobals();
  delete window.csrf_token;
});

describe("config endpoint transport", () => {
  it("sends the CSRF token as the csrf_token form field Unraid checks", async () => {
    window.csrf_token = "tok123";
    const body = await postBody({ action: "save", changes: { RUST_LOG: "debug" } });
    expect(body.get("csrf_token")).toBe("tok123");
    expect(JSON.parse(body.get("payload") ?? "")).toEqual({
      action: "save",
      changes: { RUST_LOG: "debug" },
    });
  });

  it("posts form-encoded, not JSON with a header token", async () => {
    window.csrf_token = "tok123";
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ config: {} }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await saveConfig({ RUST_LOG: "info" });
    const init = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect(init.body).toBeInstanceOf(URLSearchParams);
    expect(new Headers(init.headers).has("X-Csrf-Token")).toBe(false);
    expect(new Headers(init.headers).has("Content-Type")).toBe(false);
  });

  it("reports an empty CSRF rejection instead of reading .config from null", async () => {
    window.csrf_token = "tok123";
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 200 })));
    await expect(saveConfig({})).rejects.toThrow(/returned no JSON/);
    await expect(loadConfig()).rejects.toThrow(/returned no JSON/);
  });

  it("surfaces the endpoint's error message on HTTP failures", async () => {
    window.csrf_token = "tok123";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ error: "bad port" }), { status: 400 })),
    );
    await expect(saveConfig({ UNRAID_RMCP_PORT: "0" })).rejects.toThrow("bad port");
  });
});
