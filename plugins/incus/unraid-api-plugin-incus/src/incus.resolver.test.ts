import { describe, expect, it } from "vitest";
import {
  appliedPermissions,
  AuthAction,
  Resource,
} from "../test-stubs/@unraid/shared/use-permissions.directive.js";
import { IncusResolver } from "./incus.resolver.js";

const EXPECTED_ACTIONS = {
  incusHealthy: AuthAction.READ_ANY,
  incusConfig: AuthAction.READ_ANY,
  updateIncusConfig: AuthAction.UPDATE_ANY,
  jails: AuthAction.READ_ANY,
  launchJail: AuthAction.UPDATE_ANY,
  setJailState: AuthAction.UPDATE_ANY,
  setJailWorkspace: AuthAction.UPDATE_ANY,
  clearJailWorkspace: AuthAction.UPDATE_ANY,
  migrateJailWorkspace: AuthAction.UPDATE_ANY,
  jailDetail: AuthAction.READ_ANY,
  grantJailSudo: AuthAction.UPDATE_ANY,
  startPrivilegedCommand: AuthAction.UPDATE_ANY,
  privilegedCommandStatus: AuthAction.READ_ANY,
  setJailLimits: AuthAction.UPDATE_ANY,
  deleteJail: AuthAction.DELETE_ANY,
  startJailExec: AuthAction.UPDATE_ANY,
  sendJailExecInput: AuthAction.UPDATE_ANY,
  resizeJailExec: AuthAction.UPDATE_ANY,
  stopJailExec: AuthAction.UPDATE_ANY,
  jailExecOutput: AuthAction.READ_ANY,
  buildJailImage: AuthAction.UPDATE_ANY,
  jailImageBuildStatus: AuthAction.UPDATE_ANY,
  jailImages: AuthAction.READ_ANY,
  setMasterImage: AuthAction.UPDATE_ANY,
  builderPresets: AuthAction.READ_ANY,
  saveBuilderPreset: AuthAction.UPDATE_ANY,
  deleteBuilderPreset: AuthAction.DELETE_ANY,
  deleteJailImage: AuthAction.DELETE_ANY,
  pruneStaleImageRecords: AuthAction.DELETE_ANY,
  deleteStoppedJails: AuthAction.DELETE_ANY,
  installHomebrewFormula: AuthAction.UPDATE_ANY,
  homebrewInstallStatus: AuthAction.READ_ANY,
  searchPackages: AuthAction.READ_ANY,
  searchAllPackages: AuthAction.READ_ANY,
};

describe("IncusResolver authorization policy", () => {
  it("attaches the expected VMS action to every resolver operation", () => {
    const methods = Object.getOwnPropertyNames(IncusResolver.prototype).filter((name) => name !== "constructor");
    const expectedMethods = Object.keys(EXPECTED_ACTIONS);
    const permissionsByMethod = new Map(appliedPermissions.map((entry) => [entry.key, entry]));

    expect(appliedPermissions).toHaveLength(expectedMethods.length);
    expect(permissionsByMethod.size).toBe(expectedMethods.length);
    expect(methods.sort()).toEqual(expectedMethods.sort());

    for (const [key, action] of Object.entries(EXPECTED_ACTIONS)) {
      expect(permissionsByMethod.get(key)).toEqual({
        key,
        action,
        resource: Resource.VMS,
      });
    }
  });
});

describe("IncusResolver secret handling", () => {
  it("joins Tailscale through a private file without placing the auth key in argv", async () => {
    const calls: string[][] = [];
    const written: Array<{ path: string; content: string }> = [];
    const incus = { launchJail: async () => undefined };
    const exec = {
      writePrivateFile: async (_name: string, path: string, content: string) => {
        written.push({ path, content });
      },
      runOnce: async (_name: string, command: string[]) => {
        calls.push(command);
        return { exitCode: 0 };
      },
    };
    const config = {
      get: () => ({ tsAuthKey: "tskey-auth-live-secret" }),
    };
    const resolver = new IncusResolver(
      incus as never,
      exec as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      config as never,
    );

    await resolver.launchJail("agent-one");

    expect(written).toEqual([{
      path: "/run/incus-web-tailscale-auth.key",
      content: "tskey-auth-live-secret",
    }]);
    expect(calls[0]).toEqual([
      "tailscale",
      "up",
      "--auth-key=file:/run/incus-web-tailscale-auth.key",
      "--hostname=agent-one",
    ]);
    expect(calls.flat().join(" ")).not.toContain("tskey-auth-live-secret");
    expect(calls.at(-1)).toEqual(["rm", "-f", "/run/incus-web-tailscale-auth.key"]);
  });
});
