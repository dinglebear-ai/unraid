import { describe, expect, it } from "vitest";
import { buildConfigUpdate } from "./configPayload";
import type { IncusConfig } from "../types";

const config = { enabled: true, jailIpv6: "none", tsAuthKeyConfigured: true } as IncusConfig;

describe("buildConfigUpdate", () => {
  it("omits secret fields when no replacement is requested", () => {
    expect(buildConfigUpdate(config, { replacement: "", clear: false })).toEqual({ enabled: true, jailIpv6: "none" });
  });

  it("sends only an explicit replacement or clear value", () => {
    expect(buildConfigUpdate(config, { replacement: "new-secret", clear: false })).toEqual({ enabled: true, jailIpv6: "none", tsAuthKey: "new-secret" });
    expect(buildConfigUpdate(config, { replacement: "ignored", clear: true })).toEqual({ enabled: true, jailIpv6: "none", tsAuthKey: "" });
  });

  it("normalizes a legacy IPv6 address in the submitted mutation payload", () => {
    const legacy = { ...config, jailIpv6: "fd42::1/64" };
    expect(buildConfigUpdate(legacy, { replacement: "", clear: false })).toMatchObject({ jailIpv6: "none" });
  });
});
