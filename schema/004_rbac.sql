-- OpenPress RBAC Schema Migration
-- Expands role system with granular capabilities

-- Step 1: Create new table with expanded role constraint
CREATE TABLE IF NOT EXISTS users_new (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'subscriber' CHECK(role IN ('admin', 'editor', 'author', 'contributor', 'subscriber', 'viewer')),
  avatar_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Step 2: Copy existing data
INSERT OR IGNORE INTO users_new (id, email, name, password_hash, role, avatar_url, created_at, updated_at)
  SELECT id, email, name, password_hash, role, avatar_url, created_at, updated_at FROM users;

-- Step 3: Drop old table and rename
DROP TABLE IF EXISTS users;
ALTER TABLE users_new RENAME TO users;

-- Step 4: Recreate indexes
CREATE INDEX idx_users_email ON users(email);

-- Update default role setting
UPDATE OR IGNORE settings SET value = 'subscriber' WHERE key = 'default_role';
