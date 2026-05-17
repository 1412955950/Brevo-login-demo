import fs from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { config } from "./config.js";

fs.mkdirSync(config.dataDir, { recursive: true });

export const db = new DatabaseSync(config.dbFile);

db.exec(`
  CREATE TABLE IF NOT EXISTS otp_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    otp_hash TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    used_at INTEGER,
    invalidated_at INTEGER,
    created_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_otp_requests_email_created_at
  ON otp_requests (email, created_at DESC);

  CREATE TABLE IF NOT EXISTS sessions (
    session_id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_expires_at
  ON sessions (expires_at);
`);
