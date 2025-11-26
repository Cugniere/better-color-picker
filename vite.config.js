// vite.config.js
import { defineConfig } from "vite";
import { copyFileSync } from "fs";

export default defineConfig({
  build: {
    outDir: "dist",
    rollupOptions: {
      input: "src/content.mjs",
      output: {
        entryFileNames: "content.js",
        format: "iife",
      },
    },
  },
  plugins: [
    {
      name: "copy-files",
      closeBundle() {
        copyFileSync("src/manifest.json", "dist/manifest.json");
        copyFileSync("src/picker.css", "dist/picker.css");
      },
    },
  ],
});
