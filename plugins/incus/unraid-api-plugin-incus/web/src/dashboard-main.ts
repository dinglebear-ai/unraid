import { defineCustomElement } from "vue";
import DashboardWidget from "./DashboardWidget.vue";

// Light-DOM (shadowRoot: false), same reasoning as main.ts: this is a classic
// Unraid webGUI page fragment, not an isolated SPA.
const IncusDashboardWidget = defineCustomElement(DashboardWidget, { shadowRoot: false });

if (!customElements.get("incus-dashboard-widget")) {
  customElements.define("incus-dashboard-widget", IncusDashboardWidget);
}
