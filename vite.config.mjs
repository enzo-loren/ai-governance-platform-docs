import { defineConfig } from "vite";
import { resolve } from "node:path";
export default defineConfig({
  build: {
    emptyOutDir: true,
    outDir: "assets/console-build",
    cssCodeSplit: false,
    sourcemap: false,
    lib: {
      entry: resolve(import.meta.dirname, "src/console/main.jsx"),
      name: "GovernanceConsole",
      formats: ["iife"],
      fileName: () => "app.js",
      cssFileName: "app"
    }
  }
});
