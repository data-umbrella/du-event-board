import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const isNetlify = process.env.NETLIFY === "true";
const isCustomDomain =
  process.env.GITHUB_PAGES_CUSTOM_DOMAIN === "true" ||
  process.env.CUSTOM_DOMAIN === "true";

export default defineConfig({
  plugins: [react()],
  base: isNetlify || isCustomDomain ? "/" : "/du-event-board/",
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.js",
  },
});
