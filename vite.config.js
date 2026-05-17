import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "");
  const backendHost = env.HOST || "127.0.0.1";
  const backendPort = env.PORT || "45678";

  return {
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
        "/api": `http://${backendHost}:${backendPort}`
      }
    },
    build: {
      outDir: path.resolve(__dirname, "dist"),
      emptyOutDir: true,
      rollupOptions: {
        input: path.resolve(__dirname, "public/index.html")
      }
    }
  };
});
