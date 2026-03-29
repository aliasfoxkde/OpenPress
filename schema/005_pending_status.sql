-- OpenPress Schema Migration 005
-- Add 'pending' status to content items for review workflow

-- Recreate content_items with expanded status constraint
CREATE TABLE IF NOT EXISTS content_items_new (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'post' CHECK(type IN ('post', 'page', 'product', 'custom')),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT,
  excerpt TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'scheduled', 'archived', 'trash', 'pending')),
  author_id TEXT REFERENCES users(id),
  featured_image_url TEXT,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO content_items_new (id, type, slug, title, content, excerpt, status, author_id, featured_image_url, published_at, created_at, updated_at)
  SELECT id, type, slug, title, content, excerpt, status, author_id, featured_image_url, published_at, created_at, updated_at FROM content_items;

DROP TABLE IF EXISTS content_items;
ALTER TABLE content_items_new RENAME TO content_items;

-- Recreate indexes
CREATE INDEX idx_content_slug ON content_items(slug);
CREATE INDEX idx_content_type ON content_items(type);
CREATE INDEX idx_content_status ON content_items(status);
CREATE INDEX idx_content_author ON content_items(author_id);
CREATE INDEX idx_content_published ON content_items(published_at);
