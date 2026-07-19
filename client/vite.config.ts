import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The dev server proxies /api to the Node backend (port 4000), so the frontend
// fetches same-origin. In production behind Catalyst the API Gateway serves the
// same /api prefix, so no code changes are needed between local and deployed.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});
