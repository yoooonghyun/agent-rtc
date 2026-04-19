import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: "app",
  build: {
    outDir: "../dist/client",
    emptyDirOnBuild: true,
  },
  server: {
    proxy: {
      "/api": "http://127.0.0.1:8800",
      "/mcp": "http://127.0.0.1:8800",
    },
  },
});
