import { fileURLToPath, URL } from "node:url";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

// Deliberately separate from vite.config.ts's main incus-settings.js build:
// that bundle pulls in Tailwind, Terminal.vue, ghostty-web, reka-ui (~850KB).
// The Dashboard widget is a small status box shown on Main/Dashboard for
// every user on every page load — it gets its own minimal bundle instead of
// riding along on the full settings-app payload.
export default defineConfig({
  plugins: [vue({ customElement: true })],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    outDir: "../dist-web-dashboard",
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: {
      entry: fileURLToPath(new URL("./src/dashboard-main.ts", import.meta.url)),
      name: "IncusDashboardWidget",
      formats: ["iife"],
      fileName: () => "incus-dashboard.js",
    },
    rollupOptions: {
      output: {
        assetFileNames: "incus-dashboard.[ext]",
      },
    },
  },
});
