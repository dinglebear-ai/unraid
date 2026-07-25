import { mount, flushPromises } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App.vue";

const { gqlMock } = vi.hoisted(() => ({ gqlMock: vi.fn() }));
vi.mock("./graphql-client", () => ({ gql: gqlMock }));

describe("App", () => {
  afterEach(() => vi.useRealTimers());
  beforeEach(() => {
    gqlMock.mockReset();
    gqlMock.mockImplementation((query: string) => {
      if (query.includes("incusConfig")) return Promise.resolve({ incusConfig: { enabled: true, jailCpu: "", jailMemory: "", tsAuthKeyConfigured: false } });
      if (query.includes("incusHealthy")) return Promise.resolve({ incusHealthy: true, jails: [] });
      if (query.includes("builderPresets")) return Promise.resolve({ builderPresets: [] });
      if (query.includes("jailImages")) return Promise.resolve({ jailImages: [] });
      return Promise.resolve({});
    });
  });

  it("wires accessible tabs and keyboard navigation through the real app shell", async () => {
    const wrapper = mount(App, { attachTo: document.body });
    await flushPromises();
    const tabs = wrapper.findAll('[role="tab"]');
    expect(tabs.map((tab) => tab.text())).toEqual(["Builder", "Containers", "Config"]);
    expect(tabs[1].attributes("aria-selected")).toBe("true");

    await tabs[1].trigger("keydown", { key: "ArrowRight" });
    await flushPromises();
    expect(wrapper.get("#incus-tab-config").attributes("aria-selected")).toBe("true");
    expect(wrapper.get("#incus-panel-config").attributes("role")).toBe("tabpanel");
    expect(wrapper.get('label[for="config-enabled"]').text()).toContain("Enable Incus");
    const ipv6 = wrapper.get<HTMLInputElement>("#config-ipv6");
    expect(ipv6.element.value).toBe("none");
    expect(ipv6.attributes()).toHaveProperty("disabled");
    expect(ipv6.attributes()).toHaveProperty("readonly");
    expect(wrapper.get("#config-ipv6-policy").text()).toContain("deliberately fail-closed");
    wrapper.unmount();
  });

  it("invalidates an in-flight package search as soon as the query is cleared", async () => {
    vi.useFakeTimers();
    let resolveSearch!: (value: unknown) => void;
    gqlMock.mockImplementation((query: string) => {
      if (query.includes("incusConfig")) return Promise.resolve({ incusConfig: { enabled: true, jailCpu: "", jailMemory: "", tsAuthKeyConfigured: false } });
      if (query.includes("incusHealthy")) return Promise.resolve({ incusHealthy: true, jails: [] });
      if (query.includes("builderPresets")) return Promise.resolve({ builderPresets: [] });
      if (query.includes("jailImages")) return Promise.resolve({ jailImages: [] });
      if (query.includes("searchAllPackages")) return new Promise((resolve) => { resolveSearch = resolve; });
      return Promise.resolve({});
    });
    const wrapper = mount(App);
    await flushPromises();
    await wrapper.get("#incus-tab-builder").trigger("click");
    await wrapper.get("#package-search").setValue("curl");
    await vi.advanceTimersByTimeAsync(400);
    await wrapper.get("#package-search").setValue("");
    resolveSearch({ searchAllPackages: { results: [{ ecosystem: "apt", name: "stale-package" }], errors: [] } });
    await flushPromises();
    expect(wrapper.text()).not.toContain("stale-package");
    wrapper.unmount();
    vi.useRealTimers();
  });

  it("does not create status polling when initialization resolves after unmount", async () => {
    let resolveConfig!: (value: unknown) => void;
    gqlMock.mockImplementation((query: string) => {
      if (query.includes("incusConfig")) return new Promise((resolve) => { resolveConfig = resolve; });
      return Promise.resolve({});
    });
    const addEventListener = vi.spyOn(document, "addEventListener");
    const wrapper = mount(App);
    await Promise.resolve();
    wrapper.unmount();
    resolveConfig({ incusConfig: { enabled: true } });
    await flushPromises();

    expect(gqlMock).toHaveBeenCalledTimes(1);
    expect(addEventListener.mock.calls.some(([event]) => event === "visibilitychange")).toBe(false);
  });

  it("keeps the current master non-actionable and compensates a failed replacement", async () => {
    const canonicalImages = [
      { alias: "stable", distro: "debian", release: "trixie", packages: [], isMaster: true, createdAt: "now" },
      { alias: "candidate", distro: "debian", release: "trixie", packages: [], isMaster: false, createdAt: "now" },
    ];
    gqlMock.mockImplementation((query: string, variables?: Record<string, unknown>) => {
      if (query.includes("updateIncusConfig") && (variables?.input as { jailImage?: string })?.jailImage === "candidate") {
        return Promise.reject(new Error("config write failed"));
      }
      if (query.includes("setMasterImage")) return Promise.resolve({ setMasterImage: {} });
      if (query.includes("incusConfig")) return Promise.resolve({ incusConfig: { enabled: true, jailCpu: "", jailMemory: "", jailImage: "stable", tsAuthKeyConfigured: false } });
      if (query.includes("incusHealthy")) return Promise.resolve({ incusHealthy: true, jails: [] });
      if (query.includes("builderPresets")) return Promise.resolve({ builderPresets: [] });
      if (query.includes("jailImages")) return Promise.resolve({ jailImages: canonicalImages.map((image) => ({ ...image })) });
      return Promise.resolve({});
    });
    const wrapper = mount(App);
    await flushPromises();
    await wrapper.get("#incus-tab-builder").trigger("click");
    const buttons = wrapper.findAll("button");
    const current = buttons.find((button) => button.text() === "Default")!;
    expect(current.attributes()).toHaveProperty("disabled");
    const mutationsBefore = gqlMock.mock.calls.filter(([query]) => String(query).includes("setMasterImage")).length;
    await current.trigger("click");
    expect(gqlMock.mock.calls.filter(([query]) => String(query).includes("setMasterImage"))).toHaveLength(mutationsBefore);

    await buttons.find((button) => button.text() === "Set as default")!.trigger("click");
    await flushPromises();
    const masterCalls = gqlMock.mock.calls
      .filter(([query]) => String(query).includes("setMasterImage"))
      .map(([, variables]) => variables);
    expect(masterCalls).toEqual([
      { alias: "candidate", isMaster: true },
      { alias: "stable", isMaster: true },
    ]);
    expect(wrapper.text()).toContain("config write failed");
    expect(wrapper.findAll("button").find((button) => button.text() === "Default")?.element).toBeTruthy();
    wrapper.unmount();
  });

  it("submits none when the server loads a legacy IPv6 address", async () => {
    gqlMock.mockImplementation((query: string) => {
      if (query.includes("incusConfig")) return Promise.resolve({ incusConfig: {
        enabled: true, jailCpu: "", jailMemory: "", jailIpv6: "fd42::1/64", tsAuthKeyConfigured: false,
      } });
      if (query.includes("incusHealthy")) return Promise.resolve({ incusHealthy: true, jails: [] });
      if (query.includes("builderPresets")) return Promise.resolve({ builderPresets: [] });
      if (query.includes("jailImages")) return Promise.resolve({ jailImages: [] });
      if (query.includes("updateIncusConfig")) return Promise.resolve({ updateIncusConfig: { enabled: true } });
      return Promise.resolve({});
    });
    const wrapper = mount(App);
    await flushPromises();
    await wrapper.get("#incus-tab-config").trigger("click");
    await wrapper.findAll("button").find((button) => button.text() === "Apply")!.trigger("click");
    await flushPromises();

    const update = gqlMock.mock.calls.find(([query]) => String(query).includes("updateIncusConfig"));
    expect((update?.[1].input as { jailIpv6: string }).jailIpv6).toBe("none");
    wrapper.unmount();
  });
});
