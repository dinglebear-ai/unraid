import { describe, expect, it } from "vitest";
import { isSafeBindMountsSyntax, isSafeWorkspaceRootSyntax } from "./config.entity.js";

describe("containment config validation", () => {
  it.each(["/srv/agent-jails", "/mnt/cache/appdata/agent-jails"])("accepts safe workspace root %s", async (root) => {
    expect(isSafeWorkspaceRootSyntax(root)).toBe(true);
  });

  it.each(["/etc", "/root/agents", "/srv/../etc", "/mnt/cache/../../boot"])("rejects unsafe workspace root %s", async (root) => {
    expect(isSafeWorkspaceRootSyntax(root)).toBe(false);
  });

  it.each([
    "",
    "/srv/agent-jails/config:/home/agent/config",
    "/mnt/cache/agent-config:/home/agent/config:rw",
    "/boot/config/plugins/incus/bind-mounts/codex:/home/agent/.codex",
    "/boot/config/plugins/incus/bind-mounts/codex:/home/agent/.codex:ro",
  ])("accepts safe bind policy %s", async (binds) => {
    expect(isSafeBindMountsSyntax(binds)).toBe(true);
  });

  it.each([
    "/etc:/host:rw",
    "/srv/../etc:/host:rw",
    "/boot/config/plugins/incus/bind-mounts/codex:/home/agent/.codex:rw",
    "/srv/config:relative:ro",
    "/srv/config:/home/agent/config:invalid",
  ])("rejects unsafe bind policy %s", async (binds) => {
    expect(isSafeBindMountsSyntax(binds)).toBe(false);
  });
});
