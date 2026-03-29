-- OpenPress Database Schema
-- Phase 3: Content Revisions

-- Content Revisions (version history)
CREATE TABLE IF NOT EXISTS content_revisions (
  id TEXT PRIMARY KEY,
  content_id TEXT NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  title TEXT,
  blocks_snapshot TEXT NOT NULL DEFAULT '[]',
  meta_snapshot TEXT DEFAULT '{}',
  author_id TEXT REFERENCES users(id),
  revision_number INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_revisions_content ON content_revisions(content_id);
CREATE INDEX idx_revisions_number ON content_revisions(content_id, revision_number);
CREATE INDEX idx_revisions_author ON content_revisions(author_id);
