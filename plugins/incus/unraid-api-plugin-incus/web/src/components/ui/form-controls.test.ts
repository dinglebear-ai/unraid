import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import Input from "./Input.vue";
import Select from "./Select.vue";
import Switch from "./Switch.vue";

describe("form controls", () => {
  it("forwards an accessible id to the native input", () => {
    expect(mount(Input, { props: { id: "state-dir" } }).get("input").attributes("id")).toBe("state-dir");
  });

  it("places id and disabled on the native select rather than its wrapper", () => {
    const wrapper = mount(Select, { props: { id: "driver", disabled: true } });
    expect(wrapper.get("select").attributes("id")).toBe("driver");
    expect(wrapper.get("select").attributes()).toHaveProperty("disabled");
    expect(wrapper.get("div").attributes("id")).toBeUndefined();
  });

  it("renders a label-compatible button for switch controls", () => {
    const wrapper = mount(Switch, { props: { id: "allow-sudo" } });
    const control = wrapper.get("button");
    expect(control.attributes("id")).toBe("allow-sudo");
    expect(control.attributes("role")).toBe("switch");
    expect(control.attributes("type")).toBe("button");
  });
});
