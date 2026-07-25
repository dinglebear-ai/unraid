import { defineCustomElement } from "vue";
import Widget from "./Widget.vue";

// Light DOM so it inherits the Unraid dashboard tile's fonts/theme.
const UnraidMcpWidget = defineCustomElement(Widget, { shadowRoot: false });

if (!customElements.get("unraid-mcp-widget")) {
  customElements.define("unraid-mcp-widget", UnraidMcpWidget);
}
