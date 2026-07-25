import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DashboardWidget from "./DashboardWidget.vue";

const { gqlMock } = vi.hoisted(() => ({ gqlMock: vi.fn() }));
vi.mock("./graphql-client.js", () => ({ gql: gqlMock }));

describe("DashboardWidget", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("renders canonical counts and stops polling when removed", async () => {
    gqlMock.mockResolvedValue({
      incusHealthy: true,
      jails: [{ name: "a", status: "Running" }, { name: "b", status: "Frozen" }],
    });
    const wrapper = mount(DashboardWidget);
    await flushPromises();
    expect(wrapper.text()).toContain("1 running");
    expect(wrapper.text()).toContain("1 other");
    wrapper.unmount();
    const calls = gqlMock.mock.calls.length;
    await vi.advanceTimersByTimeAsync(60_000);
    expect(gqlMock).toHaveBeenCalledTimes(calls);
  });
});
