import { defineCustomElement } from "vue";
import App from "./App.vue";
import "./styles/index.css";

// Light DOM (no shadow root) on purpose: this is a classic webGUI page, so we
// inherit Unraid's fonts/theme classes and our stylesheet loads via <link>.
const UnraidMcpSettingsApp = defineCustomElement(App, { shadowRoot: false });

if (!customElements.get("unraid-mcp-settings-app")) {
  customElements.define("unraid-mcp-settings-app", UnraidMcpSettingsApp);
}
