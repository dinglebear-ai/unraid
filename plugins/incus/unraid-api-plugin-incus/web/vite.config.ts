import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

export default defineConfig({
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
    outDir: "../dist-web",
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: {
      entry: fileURLToPath(new URL("./src/main.ts", import.meta.url)),
      name: "IncusSettingsWeb",
      // ES output permits Terminal.vue/ghostty-web to remain a true lazy
      // chunk. The classic Unraid page already loads this entry as a module.
      formats: ["es"],
      fileName: () => "incus-settings.js",
    },
    rollupOptions: {
      output: {
        assetFileNames: "incus-settings.[ext]",
        chunkFileNames: "incus-settings-[name]-[hash].js",
      },
    },
  },
});
