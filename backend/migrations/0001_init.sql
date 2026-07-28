-- Key Cabinet WebAuthn D1 Schema
-- Run: npx wrangler d1 execute key-cabinet-db --file=./migrations/0001_init.sql

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS credentials (
  credential_id TEXT PRIMARY KEY,        -- base64url, from authenticator
  user_id TEXT NOT NULL REFERENCES users(id),
  public_key BLOB NOT NULL,              -- raw public key bytes (CBOR/COSE)
  counter INTEGER NOT NULL DEFAULT 0,    -- replay protection
  device_type TEXT NOT NULL DEFAULT 'platform',  -- 'platform' vs 'cross-platform'
  transports TEXT NOT NULL DEFAULT '["internal"]', -- JSON array of transport hints
  backup_eligible INTEGER NOT NULL DEFAULT 0,
  backup_state INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,           -- SHA-256 of the JWT (for fast revocation lookup)
  user_id TEXT NOT NULL REFERENCES users(id),
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,                  -- 'cabinet_open', 'cabinet_close', 'login', 'register', etc.
  slot_label TEXT,                       -- which cabinet/key slot
  peg_state_before TEXT,                 -- json: previous state snapshot
  peg_state_after TEXT,                  -- json: new state snapshot
  device_info TEXT,                      -- user-agent or device fingerprint
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_credentials_user_id ON credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
