import path from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    emptyOutDir: false,
    lib: {
      entry: path.resolve(__dirname, "src/main.tsx"),
      name: "UnraidCodex",
      formats: ["iife"],
      fileName: () => "unraid-codex.js",
    },
    cssCodeSplit: false,
    outDir: path.resolve(
      __dirname,
      "../source/usr/local/emhttp/plugins/unraid-codex/web",
    ),
    rollupOptions: {
      output: {
        assetFileNames: (asset) =>
          asset.name?.endsWith(".css") ? "unraid-codex.css" : "[name][extname]",
      },
    },
  },
})
