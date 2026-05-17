import fs from "node:fs";
import path from "node:path";
import express from "express";
import cookieParser from "cookie-parser";
import { config } from "./config.js";
import "./db.js";
import { authSession } from "./middleware/authSession.js";
import authRouter from "./routes/auth.js";

const app = express();

app.disable("x-powered-by");
app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - startedAt;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`
    );
  });
  next();
});

app.use(authSession);

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    appEnv: config.appEnv
  });
});

app.use("/api", authRouter);

const distIndexFile = path.join(config.distDir, "index.html");
if (fs.existsSync(distIndexFile)) {
  app.use(express.static(config.distDir));
  app.get(/^\/(?!api).*/, (_req, res) => {
    res.sendFile(distIndexFile);
  });
} else {
  app.get("/", (_req, res) => {
    res.json({
      ok: true,
      message: "Backend is running. Use `npm run dev` for the Vite frontend."
    });
  });
}

app.use((error, _req, res, _next) => {
  const statusCode = error.statusCode ?? 500;

  if (statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json({
    ok: false,
    error: error.message ?? "服务器错误",
    code: error.code ?? "INTERNAL_ERROR",
    ...(error.remainingSeconds != null
      ? { remainingSeconds: error.remainingSeconds }
      : {})
  });
});

app.listen(config.port, config.host, () => {
  console.log(
    `Brevo OTP demo backend listening on http://${config.host}:${config.port}`
  );
});
