import { describe, expect, it } from "vitest";
import {
  buildEndpoint,
  buildMcpClientConfig,
  compareRustVersions,
  isLoopbackHost,
  isValidBindHost,
  isValidHttpUrl,
  updateIsNewer,
} from "./client-config";

describe("client configuration helpers", () => {
  it("compares semantic versions numerically", () => {
    expect(compareRustVersions("0.3.9", "unraid-rs-v0.3.10")).toBe(-1);
    expect(updateIsNewer("0.4.0", "unraid-rs-v0.3.10")).toBe(false);
    expect(updateIsNewer("unknown", "unraid-rs-v0.3.10")).toBe(false);
  });

  it("uses the OAuth public URL and avoids a bearer header", () => {
    const url = buildEndpoint({
      host: "0.0.0.0",
      port: "40010",
      pageHostname: "tower.local",
      tailscaleEnabled: false,
      tailscaleDnsName: "",
      authMode: "oauth",
      publicUrl: "https://mcp.example.com/",
    });
    expect(url).toBe("https://mcp.example.com/mcp");
    expect(buildMcpClientConfig({ url, authMode: "oauth", authDisabled: false, token: "secret" }))
      .toEqual({ mcpServers: { unraid: { url } } });
  });

  it("brackets IPv6 and emits bearer auth only in bearer mode", () => {
    const url = buildEndpoint({
      host: "::1",
      port: "40010",
      pageHostname: "tower.local",
      tailscaleEnabled: false,
      tailscaleDnsName: "",
      authMode: "bearer",
      publicUrl: "",
    });
    expect(url).toBe("http://[::1]:40010/mcp");
    expect(buildMcpClientConfig({ url, authMode: "bearer", authDisabled: false, token: "abc" }))
      .toEqual({ mcpServers: { unraid: { url, headers: { Authorization: "Bearer abc" } } } });
  });

  it("omits auth headers for explicitly unauthenticated endpoints", () => {
    const url = "http://tower.local:40010/mcp";
    expect(buildMcpClientConfig({ url, authMode: "bearer", authDisabled: true, token: "abc" }))
      .toEqual({ mcpServers: { unraid: { url } } });
  });

  it("validates bind and loopback hosts without accepting malformed addresses", () => {
    expect(isValidBindHost("0.0.0.0")).toBe(true);
    expect(isValidBindHost("tower.local")).toBe(true);
    expect(isValidBindHost("::1")).toBe(true);
    expect(isValidBindHost("127.999.1.1")).toBe(false);
    expect(isValidBindHost("bad_host.example")).toBe(false);
    expect(isLoopbackHost("127.42.1.9")).toBe(true);
    expect(isLoopbackHost("127.999.1.1")).toBe(false);
    expect(isLoopbackHost("[::1]")).toBe(true);
    expect(isLoopbackHost("127.evil.example")).toBe(false);
  });

  it("validates HTTP URLs and strict OAuth public URLs", () => {
    expect(isValidHttpUrl("http://127.0.0.1/graphql")).toBe(true);
    expect(isValidHttpUrl("https://mcp.example.com", true)).toBe(true);
    expect(isValidHttpUrl("https://user:pass@mcp.example.com")).toBe(false);
    expect(isValidHttpUrl("https://mcp.example.com?redirect=evil", true)).toBe(false);
    expect(isValidHttpUrl("http://mcp.example.com", true)).toBe(false);
  });
});
