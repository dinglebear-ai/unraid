import { defineCustomElement } from "vue";
import App from "./App.vue";
// Light-DOM custom element (shadowRoot: false) — this page isn't an isolated
// SPA, it's a classic Unraid webGUI page, so there's no benefit to shadow-DOM
// encapsulation and it lets the compiled CSS ship as an ordinary stylesheet
// the .page file links directly, rather than an inlined style string.
import "./styles/index.css";

const IncusSettingsApp = defineCustomElement(App, { shadowRoot: false });

if (!customElements.get("incus-settings-app")) {
  customElements.define("incus-settings-app", IncusSettingsApp);
}
