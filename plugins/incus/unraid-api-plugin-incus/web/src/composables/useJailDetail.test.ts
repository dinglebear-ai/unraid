import { beforeEach, describe, expect, it, vi } from "vitest";
import { useJailDetail } from "./useJailDetail";
import type { JailDetail } from "../types";

const { gqlMock } = vi.hoisted(() => ({ gqlMock: vi.fn() }));
vi.mock("../graphql-client", () => ({ gql: gqlMock }));

const detail = (name: string): JailDetail => ({
  name, profiles: [], cpuLimit: name, cpuLimitIsOverride: false,
  memoryLimitIsOverride: false, workspaceIsOverride: false, sudoEnabled: false,
});

describe("useJailDetail", () => {
  beforeEach(() => gqlMock.mockReset());

  it("ignores a stale response after the user selects another container", async () => {
    const resolvers = new Map<string, (value: unknown) => void>();
    gqlMock.mockImplementation((_query: string, variables?: { name: string }) => {
      if (!variables) return Promise.resolve({});
      return new Promise((resolve) => resolvers.set(variables.name, resolve));
    });
    const state = useJailDetail(() => {});
    const first = state.toggleJailDetails("alpha");
    const second = state.toggleJailDetails("beta");
    resolvers.get("beta")?.({ jailDetail: detail("beta") });
    await second;
    resolvers.get("alpha")?.({ jailDetail: detail("alpha") });
    await first;

    expect(state.detailsJailName.value).toBe("beta");
    expect(state.jailDetail.value?.name).toBe("beta");
    expect(state.editCpuLimit.value).toBe("beta");
  });
});
