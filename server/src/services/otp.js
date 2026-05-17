import crypto from "node:crypto";
import { config } from "../config.js";
import { db } from "../db.js";

const latestDevOtps = new Map();

function createError(statusCode, message, extras = {}) {
  const error = new Error(message);
  error.statusCode = statusCode;
  Object.assign(error, extras);
  return error;
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function hashOtp(email, otp) {
  return crypto
    .createHash("sha256")
    .update(`${config.sessionSecret}:${normalizeEmail(email)}:${otp}`)
    .digest("hex");
}

export function issueOtp(email) {
  const normalizedEmail = normalizeEmail(email);
  const now = Date.now();
  const latest = db
    .prepare(
      `
        SELECT id, created_at
        FROM otp_requests
        WHERE email = ?
        ORDER BY created_at DESC
        LIMIT 1
      `
    )
    .get(normalizedEmail);

  if (latest) {
    const nextAllowedAt = latest.created_at + config.otpResendCooldownSeconds * 1000;
    if (nextAllowedAt > now) {
      throw createError(429, "验证码发送过于频繁", {
        code: "OTP_COOLDOWN",
        remainingSeconds: Math.ceil((nextAllowedAt - now) / 1000)
      });
    }
  }

  db.prepare(
    `
      UPDATE otp_requests
      SET invalidated_at = ?
      WHERE email = ?
        AND used_at IS NULL
        AND invalidated_at IS NULL
    `
  ).run(now, normalizedEmail);

  const otp = crypto.randomInt(0, 1000000).toString().padStart(6, "0");
  const expiresAt = now + config.otpTtlSeconds * 1000;

  const result = db
    .prepare(
      `
        INSERT INTO otp_requests (
          email,
          otp_hash,
          expires_at,
          created_at
        ) VALUES (?, ?, ?, ?)
      `
    )
    .run(normalizedEmail, hashOtp(normalizedEmail, otp), expiresAt, now);

  if (config.isDev) {
    latestDevOtps.set(normalizedEmail, {
      otp,
      expiresAt,
      requestId: result.lastInsertRowid
    });
  }

  return {
    id: Number(result.lastInsertRowid),
    email: normalizedEmail,
    otp,
    expiresAt,
    cooldownSeconds: config.otpResendCooldownSeconds
  };
}

export function discardOtp(issueId, email) {
  db.prepare("DELETE FROM otp_requests WHERE id = ?").run(issueId);

  const normalizedEmail = normalizeEmail(email);
  const current = latestDevOtps.get(normalizedEmail);
  if (current && current.requestId === issueId) {
    latestDevOtps.delete(normalizedEmail);
  }
}

export function consumeOtp(email, otp) {
  const normalizedEmail = normalizeEmail(email);
  const latest = db
    .prepare(
      `
        SELECT *
        FROM otp_requests
        WHERE email = ?
        ORDER BY created_at DESC
        LIMIT 1
      `
    )
    .get(normalizedEmail);

  if (!latest || latest.invalidated_at) {
    throw createError(401, "验证码不存在或已失效", { code: "OTP_NOT_FOUND" });
  }

  if (latest.used_at) {
    throw createError(401, "验证码已被使用", { code: "OTP_USED" });
  }

  if (Date.now() > latest.expires_at) {
    throw createError(401, "验证码已过期", { code: "OTP_EXPIRED" });
  }

  if (latest.otp_hash !== hashOtp(normalizedEmail, otp.trim())) {
    throw createError(401, "验证码错误", { code: "OTP_INVALID" });
  }

  db.prepare(
    `
      UPDATE otp_requests
      SET used_at = ?
      WHERE id = ?
    `
  ).run(Date.now(), latest.id);

  latestDevOtps.delete(normalizedEmail);

  return {
    email: normalizedEmail
  };
}

export function getLatestDevOtp(email) {
  const normalizedEmail = normalizeEmail(email);
  const current = latestDevOtps.get(normalizedEmail);

  if (!current) {
    throw createError(404, "当前邮箱没有可用验证码", { code: "OTP_NOT_FOUND" });
  }

  if (Date.now() > current.expiresAt) {
    latestDevOtps.delete(normalizedEmail);
    throw createError(410, "验证码已过期", { code: "OTP_EXPIRED" });
  }

  return {
    email: normalizedEmail,
    otp: current.otp
  };
}
