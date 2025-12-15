// vite.config.js
import { defineConfig } from "vite"
import { copyFileSync } from "fs"

export default defineConfig({
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        content: "src/content.mjs",
        background: "src/background.js",
      },
      output: {
        entryFileNames: "[name].js",
        format: "es",
      },
    },
  },
  plugins: [
    {
      name: "copy-files",
      closeBundle() {
        copyFileSync("src/manifest.json", "dist/manifest.json")
        copyFileSync("src/picker.css", "dist/picker.css")
      },
    },
  ],
})
