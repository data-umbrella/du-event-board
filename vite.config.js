import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePluginRadar } from "vite-plugin-radar";

export default defineConfig({
  plugins: [
    react(),
    VitePluginRadar({
      analytics: {
        provider: "ga",
        id: "G-E5SMJ9E985",
      },
    }),
  ],
  base: "/",
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.js",
    coverage: {
      reporter: ["text", "json-summary", "json"],
      reportOnFailure: true,
    },
  },
});
