-- OpenPress Database Schema
-- Phase 1: Core CMS Tables
-- Compatible with Cloudflare D1 (SQLite)

-- Users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK(role IN ('admin', 'editor', 'viewer')),
  avatar_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_users_email ON users(email);

-- Content Items (posts, pages, custom types)
CREATE TABLE IF NOT EXISTS content_items (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'post' CHECK(type IN ('post', 'page', 'product', 'custom')),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT,
  excerpt TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'scheduled', 'archived', 'trash')),
  author_id TEXT REFERENCES users(id),
  featured_image_url TEXT,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_content_slug ON content_items(slug);
CREATE INDEX idx_content_type ON content_items(type);
CREATE INDEX idx_content_status ON content_items(status);
CREATE INDEX idx_content_author ON content_items(author_id);
CREATE INDEX idx_content_published ON content_items(published_at);

-- Content Blocks (block editor)
CREATE TABLE IF NOT EXISTS content_blocks (
  id TEXT PRIMARY KEY,
  content_id TEXT NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  block_type TEXT NOT NULL CHECK(block_type IN ('text', 'heading', 'image', 'code', 'quote', 'list', 'divider', 'embed', 'component', 'gallery', 'video', 'audio', 'custom')),
  data TEXT NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  parent_block_id TEXT REFERENCES content_blocks(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_blocks_content ON content_blocks(content_id);
CREATE INDEX idx_blocks_order ON content_blocks(content_id, sort_order);

-- Taxonomies
CREATE TABLE IF NOT EXISTS taxonomies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'flat' CHECK(type IN ('flat', 'hierarchical')),
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Terms (categories, tags, etc.)
CREATE TABLE IF NOT EXISTS terms (
  id TEXT PRIMARY KEY,
  taxonomy_id TEXT NOT NULL REFERENCES taxonomies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  parent_id TEXT REFERENCES terms(id),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_terms_taxonomy ON terms(taxonomy_id);
CREATE INDEX idx_terms_slug ON terms(slug);
CREATE UNIQUE INDEX idx_terms_taxonomy_slug ON terms(taxonomy_id, slug);

-- Term Relationships
CREATE TABLE IF NOT EXISTS term_relationships (
  content_id TEXT NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  term_id TEXT NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
  PRIMARY KEY (content_id, term_id)
);

-- Media
CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  r2_key TEXT NOT NULL,
  alt_text TEXT,
  caption TEXT,
  width INTEGER,
  height INTEGER,
  uploaded_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_media_uploaded_by ON media(uploaded_by);

-- Settings (key-value store)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Plugin Registry
CREATE TABLE IF NOT EXISTS plugins (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  version TEXT NOT NULL DEFAULT '1.0.0',
  description TEXT,
  author TEXT,
  enabled INTEGER NOT NULL DEFAULT 0,
  settings TEXT DEFAULT '{}',
  installed_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Theme Registry
CREATE TABLE IF NOT EXISTS themes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  version TEXT NOT NULL DEFAULT '1.0.0',
  description TEXT,
  author TEXT,
  is_active INTEGER NOT NULL DEFAULT 0,
  config TEXT DEFAULT '{}',
  installed_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Sessions (for JWT refresh tokens)
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(refresh_token);

-- Content Meta (ACF equivalent)
CREATE TABLE IF NOT EXISTS content_meta (
  content_id TEXT NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  meta_key TEXT NOT NULL,
  meta_value TEXT,
  PRIMARY KEY (content_id, meta_key)
);

CREATE INDEX idx_content_meta_key ON content_meta(meta_key);

-- Insert default taxonomies
INSERT OR IGNORE INTO taxonomies (id, name, slug, type, description) VALUES
  ('cat', 'Categories', 'categories', 'hierarchical', 'Post categories'),
  ('tag', 'Tags', 'tags', 'flat', 'Post tags');

-- Insert default settings
INSERT OR IGNORE INTO settings (key, value) VALUES
  ('site_name', 'OpenPress'),
  ('site_description', 'A modern, edge-native CMS'),
  ('permalink_structure', '/post/:slug'),
  ('default_role', 'viewer'),
  ('posts_per_page', '20'),
  ('allow_registration', 'false');

-- Insert default theme
INSERT OR IGNORE INTO themes (id, name, slug, is_active, config) VALUES
  ('default', 'Default Theme', 'default', 1, '{"layouts":["default","full-width","sidebar"],"colors":{"primary":"#4F46E5","secondary":"#7C3AED"}}');
