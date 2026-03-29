-- OpenPress Schema Migration 007
-- Comments table for blog posts

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  content_id TEXT NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_email TEXT,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'spam', 'trash')),
  parent_id TEXT REFERENCES comments(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_comments_content ON comments(content_id);
CREATE INDEX idx_comments_status ON comments(status);
CREATE INDEX idx_comments_parent ON comments(parent_id);
