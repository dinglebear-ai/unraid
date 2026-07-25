import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Terminal from "./Terminal.vue";

const mocks = vi.hoisted(() => ({
  init: vi.fn(), gql: vi.fn(), subscribe: vi.fn(() => vi.fn()),
}));

vi.mock("ghostty-web", () => ({
  init: mocks.init,
  FitAddon: class { fit() {} observeResize() {} dispose() {} },
  Terminal: class {
    cols = 80; rows = 24;
    loadAddon() {} open() {} dispose() {} write() {}
    onData() { return { dispose() {} }; }
    onResize() { return { dispose() {} }; }
  },
}));
vi.mock("../graphql-client", () => ({ gql: mocks.gql }));
vi.mock("../graphql-ws-client", () => ({ subscribe: mocks.subscribe }));

describe("Terminal", () => {
  beforeEach(() => {
    mocks.init.mockReset().mockResolvedValue(undefined);
    mocks.gql.mockReset();
    mocks.subscribe.mockClear();
  });

  it("exposes modal semantics and closes an exec created after unmount", async () => {
    let resolveStart!: (value: { startJailExec: string }) => void;
    mocks.gql.mockImplementation((query: string) => {
      if (query.includes("startJailExec")) return new Promise((resolve) => { resolveStart = resolve; });
      return Promise.resolve({});
    });
    const wrapper = mount(Terminal, { props: { jailName: "alpha" }, attachTo: document.body });
    await flushPromises();
    expect(wrapper.get('[role="dialog"]').attributes("aria-modal")).toBe("true");
    wrapper.unmount();
    resolveStart({ startJailExec: "late-session" });
    await flushPromises();

    expect(mocks.gql.mock.calls.some(([query, variables]) =>
      String(query).includes("stopJailExec") && variables.sessionId === "late-session"
    )).toBe(true);
    expect(mocks.subscribe).not.toHaveBeenCalled();
  });
});
