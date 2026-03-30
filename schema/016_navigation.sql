-- Phase 27: Advanced Navigation & Menu Control
-- Full menu/navigation management from admin

-- Menu locations
CREATE TABLE IF NOT EXISTS menu_locations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  max_depth INTEGER DEFAULT 3,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Menu items (tree via parent_id)
CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY,
  menu_id TEXT NOT NULL REFERENCES menu_locations(id) ON DELETE CASCADE,
  parent_id TEXT REFERENCES menu_items(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT,
  type TEXT DEFAULT 'link' CHECK(type IN ('link', 'page', 'post', 'category', 'custom', 'separator', 'heading')),
  reference_id TEXT,
  target TEXT DEFAULT 'self' CHECK(target IN ('self', '_blank')),
  icon TEXT,
  css_class TEXT,
  rel TEXT,
  is_visible INTEGER DEFAULT 1,
  roles TEXT DEFAULT '[]',
  sort_order INTEGER DEFAULT 0,
  depth INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_menu_items_menu ON menu_items(menu_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_parent ON menu_items(parent_id);
