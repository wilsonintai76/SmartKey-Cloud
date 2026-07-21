-- Key Cabinet WebAuthn D1 Schema
-- Run: npx wrangler d1 execute key-cabinet-db --file=./migrations/0001_init.sql

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS webauthn_credentials (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  public_key TEXT NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0,
  device_name TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
