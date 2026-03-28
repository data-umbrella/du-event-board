import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const isNetlify = process.env.NETLIFY === "true";

export default defineConfig({
  plugins: [react()],
  base: isNetlify ? "/" : "/du-event-board/",
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.js",
  },
});
