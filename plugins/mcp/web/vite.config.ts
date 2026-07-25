import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
  },
  plugins: [
    vue({
      customElement: true,
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    // Built bundles are staged into the txz payload by scripts/build-txz.sh.
    outDir: "../source/usr/local/emhttp/plugins/unraid-mcp/web",
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: {
      entry: fileURLToPath(new URL("./src/main.ts", import.meta.url)),
      name: "UnraidMcpSettingsWeb",
      formats: ["es"],
      fileName: () => "unraid-mcp-settings.js",
    },
    rollupOptions: {
      output: {
        assetFileNames: "unraid-mcp-settings.[ext]",
        chunkFileNames: "unraid-mcp-settings-[name]-[hash].js",
      },
    },
  },
});
