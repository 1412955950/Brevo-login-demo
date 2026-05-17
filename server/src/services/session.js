import crypto from "node:crypto";
import { config } from "../config.js";
import { db } from "../db.js";

function cleanupExpiredSessions() {
  db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(Date.now());
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: config.appEnv === "production",
    path: "/",
    maxAge: config.sessionTtlSeconds * 1000
  };
}

export function getSessionCookieClearOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: config.appEnv === "production",
    path: "/"
  };
}

export function createSession(email) {
  cleanupExpiredSessions();

  const sessionId = crypto.randomBytes(24).toString("hex");
  const createdAt = Date.now();
  const expiresAt = createdAt + config.sessionTtlSeconds * 1000;

  db.prepare(
    `
      INSERT INTO sessions (
        session_id,
        email,
        expires_at,
        created_at
      ) VALUES (?, ?, ?, ?)
    `
  ).run(sessionId, email, expiresAt, createdAt);

  return {
    sessionId,
    email,
    expiresAt
  };
}

export function getSession(sessionId) {
  if (!sessionId) {
    return null;
  }

  cleanupExpiredSessions();

  const session = db
    .prepare(
      `
        SELECT session_id, email, expires_at, created_at
        FROM sessions
        WHERE session_id = ?
        LIMIT 1
      `
    )
    .get(sessionId);

  return session ?? null;
}

export function deleteSession(sessionId) {
  if (!sessionId) {
    return;
  }

  db.prepare("DELETE FROM sessions WHERE session_id = ?").run(sessionId);
}
