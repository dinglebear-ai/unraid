import { fileURLToPath, URL } from "node:url";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

// Separate, minimal build for the Main → Dashboard widget. Deliberately NOT
// vite.config.ts's settings bundle (Tailwind + reka-ui + the whole form UI,
// ~240 KB) — this loads on every dashboard view, so it stays a tiny,
// dependency-light IIFE. Writes alongside the settings bundle (emptyOutDir
// false so it doesn't wipe it — this build runs second).
export default defineConfig({
  plugins: [vue({ customElement: true })],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  build: {
    outDir: "../source/usr/local/emhttp/plugins/unraid-mcp/web",
    emptyOutDir: false,
    cssCodeSplit: false,
    lib: {
      entry: fileURLToPath(new URL("./src/widget.ts", import.meta.url)),
      name: "UnraidMcpWidget",
      formats: ["iife"],
      fileName: () => "unraid-mcp-widget.js",
    },
    rollupOptions: {
      output: { assetFileNames: "unraid-mcp-widget.[ext]" },
    },
  },
});
