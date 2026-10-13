import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// `npm run build` writes the app into ../server/public, which the Node server serves.
// `npm run dev` runs Vite on :5173 and forwards /api to the Node server on :3000.
export default defineConfig({
  plugins: [react()],
  // build: {
  //   outDir: "../server/public",
  //   emptyOutDir: true,
  //   chunkSizeWarningLimit: 1500,
  // },
  server: { port: 5173, proxy: { "/api": "http://localhost:3000" } },
});
