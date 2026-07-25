import { describe, expect, it } from "vitest";

import {
  distrobuilderEnvironment,
  redactBuildLogText,
} from "./incus-image-builder.service.js";

describe("image builder security boundaries", () => {
  it("does not pass plugin API secrets into distrobuilder", () => {
    const env = distrobuilderEnvironment(
      {
        PATH: "/custom/bin",
        LD_LIBRARY_PATH: "/custom/lib",
        HTTPS_PROXY: "http://proxy.example",
        HTTP_PROXY: "http://proxy-user:proxy-password@proxy.example",
        UNRAID_API_KEY: "must-not-pass",
        TS_AUTHKEY: "must-not-pass",
        ANTHROPIC_AUTH_TOKEN: "must-not-pass",
      },
      "/mnt/user/appdata/incus/unix.socket",
    );

    expect(env).toMatchObject({
      HOME: "/root",
      INCUS_SOCKET: "/mnt/user/appdata/incus/unix.socket",
      HTTPS_PROXY: "http://proxy.example",
    });
    expect(env.PATH).toContain("/usr/local/incus/bin");
    expect(env.UNRAID_API_KEY).toBeUndefined();
    expect(env.TS_AUTHKEY).toBeUndefined();
    expect(env.ANTHROPIC_AUTH_TOKEN).toBeUndefined();
    expect(env.HTTP_PROXY).toBeUndefined();
  });

  it("redacts secret-shaped build output while preserving ordinary logs", () => {
    const output = redactBuildLogText(
      "downloading packages\nAuthorization: Bearer abc.def.ghi\nTS_AUTHKEY=tskey-auth-1234567890\n",
    );

    expect(output).toContain("downloading packages");
    expect(output).not.toContain("abc.def.ghi");
    expect(output).not.toContain("tskey-auth-1234567890");
    expect(output).toContain("[REDACTED]");
  });
});
