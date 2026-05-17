import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: path.resolve(__dirname, "public"),
  publicDir: false,
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src")
    }
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    fs: {
      allow: [__dirname]
    },
    proxy: {
      "/api": "http://127.0.0.1:45678"
    }
  },
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, "public/index.html")
    }
  }
});
