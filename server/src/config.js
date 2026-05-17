import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../..");

function getNumber(value, fallback) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const appEnv = process.env.APP_ENV ?? process.env.NODE_ENV ?? "development";

export const config = {
  appEnv,
  isDev: appEnv !== "production",
  host: process.env.HOST ?? "127.0.0.1",
  port: getNumber(process.env.PORT, 45678),
  sessionSecret: process.env.SESSION_SECRET ?? "dev-session-secret-change-me",
  devApiToken: process.env.DEV_API_TOKEN ?? "dev-local-token",
  otpTtlSeconds: getNumber(process.env.OTP_TTL_SECONDS, 600),
  sessionTtlSeconds: getNumber(process.env.SESSION_TTL_SECONDS, 86400),
  otpResendCooldownSeconds: getNumber(process.env.OTP_RESEND_COOLDOWN_SECONDS, 60),
  brevoApiKey: process.env.BREVO_API_KEY ?? "",
  brevoSenderEmail: process.env.BREVO_SENDER_EMAIL ?? "",
  brevoSenderName: process.env.BREVO_SENDER_NAME ?? "",
  rootDir,
  distDir: path.join(rootDir, "dist"),
  dataDir: path.join(rootDir, "data"),
  dbFile: path.join(rootDir, "data", "app.db")
};

export function missingBrevoConfig() {
  return [
    ["BREVO_API_KEY", config.brevoApiKey],
    ["BREVO_SENDER_EMAIL", config.brevoSenderEmail],
    ["BREVO_SENDER_NAME", config.brevoSenderName]
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);
}
