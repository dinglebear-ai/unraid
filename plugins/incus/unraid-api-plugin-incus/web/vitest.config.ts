import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [vue({ customElement: true })],
  test: {
    environment: "happy-dom",
    include: ["src/**/*.test.ts"],
    restoreMocks: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: [
        "src/App.vue",
        "src/DashboardWidget.vue",
        "src/components/Terminal.vue",
        "src/components/TabNavigation.vue",
        "src/components/ui/{Input,Select,Switch}.vue",
        "src/composables/*.ts",
        "src/lib/*.ts",
        "src/graphql-client.ts",
      ],
      exclude: ["src/**/*.test.ts"],
      thresholds: {
        // These floors cover the real application components above, including
        // the 2,700-line settings shell, rather than only already-tested helpers.
        statements: 43,
        branches: 37,
        functions: 41,
        lines: 45,
      },
    },
  },
});
