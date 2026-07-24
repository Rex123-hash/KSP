import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Catalyst Web Client Hosting serves the app under /app/, so the production
// build uses that base (assets + router + API paths all derive from it). Dev
// stays at root and proxies /api to the local Node server.
export default defineConfig(({ mode }) => ({
  base: mode === "production" ? "/app/" : "/",
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
}));
